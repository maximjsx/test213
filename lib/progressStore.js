// Account progress on the server. All writes go through applyAction from the
// progress engine, with a revision number so two quick actions from
// different tabs can't overwrite each other. Server only.
import getClientPromise from '@/lib/mongodb'
import { applyAction, normalizeProgress, defaultProgress } from '@/lib/progressEngine'
import { findLessonFull, findLevelFull } from '@/lib/serverCourse'
import { loadFriendQuest } from '@/lib/friendQuest'
import { FRIEND_QUEST_REWARD, DAILY_GOALS } from '@/lib/goals'
import { dayKey, daysBetween, DAY_PATTERN } from '@/lib/days'

const RETRIES = 4

async function users() {
  const client = await getClientPromise()
  return { db: client.db('bulgario'), users: client.db('bulgario').collection('users') }
}

// The learner's local date, trusted only within a day of the server's, which
// covers every time zone but stops anyone from replaying days
export function resolveToday(clientDay) {
  const server = dayKey(new Date())
  if (DAY_PATTERN.test(clientDay || '') && Math.abs(daysBetween(server, clientDay)) <= 1) return clientDay
  return server
}

export async function loadProgress(discordId) {
  const { users: col } = await users()
  const user = await col.findOne({ discordId }, { projection: { _id: 0, progress: 1, guildIds: 1 } })
  return { progress: user?.progress ?? null, guildIds: user?.guildIds || [] }
}

function summary(progress) {
  return {
    coins: progress.coins,
    streak: progress.streak,
    lessonsCount: Object.values(progress.lessons).filter(l => l.completed).length,
    updatedAt: new Date(),
  }
}

// Reads, transforms and writes progress, retrying when another write landed
// in between. `transform(progress, user)` returns { state } or { error }.
async function update(discordId, transform) {
  const { users: col } = await users()
  for (let attempt = 0; attempt < RETRIES; attempt++) {
    const user = await col.findOne({ discordId }, { projection: { _id: 0, progress: 1, progressRev: 1, guildIds: 1 } })
    if (!user) return { error: 'no_account' }
    const result = await transform(user.progress ?? defaultProgress(), user)
    if (result.error || result.unchanged) return result
    const rev = user.progressRev || 0
    const res = await col.updateOne(
      { discordId, $or: [{ progressRev: rev }, ...(rev === 0 ? [{ progressRev: { $exists: false } }] : [])] },
      { $set: { progress: result.state, progressRev: rev + 1, ...summary(result.state) } }
    )
    if (res.modifiedCount) return result
  }
  return { error: 'busy' }
}

async function context(discordId, today, guildIds) {
  const { db } = await users()
  let friendQuest = null
  return {
    today,
    guildIds,
    findLesson: findLessonFull,
    findLevel: findLevelFull,
    friendQuestReward: FRIEND_QUEST_REWARD,
    // Only looked up when a friend quest is actually being claimed
    friendQuestReady: week => friendQuest?.week === week && friendQuest.complete,
    async prepare(action) {
      if (action.type === 'claimFriendQuest') friendQuest = await loadFriendQuest(db, discordId)
    },
  }
}

export async function runAction(discordId, action, today) {
  return update(discordId, async (progress, user) => {
    const ctx = await context(discordId, today, user.guildIds || [])
    await ctx.prepare(action)
    return applyAction(progress, action, ctx)
  })
}

// Applies time-based changes (a broken streak, today's quests) and saves them
// if anything moved, so leaderboards and friends see the same streak
export async function refreshProgress(discordId, today) {
  return update(discordId, async progress => {
    const state = normalizeProgress(progress, today)
    return { state, unchanged: JSON.stringify(state) === JSON.stringify(progress) }
  })
}

// First sign-in with progress made as a guest. Guest data is unverified, so
// only lessons, mistakes and settings carry over; the balance is recomputed
// from the imported lessons and counted as earned today.
export async function importGuestProgress(discordId, guest, today) {
  const { users: col } = await users()
  const existing = await col.findOne({ discordId }, { projection: { _id: 0, progress: 1 } })
  if (existing?.progress) return { error: 'already_has_progress' }

  const lessons = {}
  let coins = 0
  for (const [id, value] of Object.entries(guest?.lessons || {})) {
    const found = findLessonFull(id)
    if (!found || found.level.special || !value?.completed) continue
    lessons[id] = { completed: true, completedAt: Number(value.completedAt) || Date.now() }
    coins += found.lesson.coins || 0
  }
  const wrongExercises = {}
  for (const [id, count] of Object.entries(guest?.wrongExercises || {})) {
    if (Number.isInteger(count) && count > 0 && typeof id === 'string' && id.length < 80) wrongExercises[id] = Math.min(count, 99)
  }
  const state = normalizeProgress({
    ...defaultProgress(),
    lessons,
    wrongExercises,
    coins,
    coinsByDay: coins ? { [today]: coins } : {},
    ...(DAILY_GOALS.some(g => g.coins === guest?.dailyGoal) ? { dailyGoal: guest.dailyGoal } : {}),
    startedAt: Date.now(),
  }, today)
  return update(discordId, async () => ({ state }))
}
