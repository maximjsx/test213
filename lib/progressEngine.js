// The learner's progress as a pure state machine. Every change is an action,
// and this module alone decides what each action is worth. Guests run it in
// the browser; for accounts the server runs it and stores the result, so a
// client can never set its own coins, unlocks or rewards.
import { ensureQuests, applySessionToQuests } from './quests'
import { DAILY_GOALS, STREAK_MILESTONES } from './goals'
import { addDays, daysBetween } from './days'
import { lessonCoins } from './course'
import { topicLock } from './specialTopics'
import { TYPING_DURATIONS, TYPING_SOURCES, typingBoard } from './typingBoards'

export const ECONOMY = {
  streakFreezeCost: 20,
  reviewCoinCap: 20,
  practicePerCorrect: 2,
  practicePerfectBonus: 5,
  practiceMaxExercises: 10,
  speedMaxCoins: 25,
  speedMaxMatches: 200,
  drillMaxExercises: 20,
  typingMaxCoins: 15,
  typingMaxWords: 400,
  typingMaxWpm: 200,
  typingMaxWordChars: 25,
}

export function defaultProgress() {
  return {
    lessons: {},
    coins: 0,
    coinsByDay: {},
    streak: 0,
    lastActiveDay: null,
    streakFreezes: 0,
    activeDays: {},
    unlockedTopics: {},
    wrongExercises: {},
    skippedLevels: {},
    quests: null,
    startedAt: null,
  }
}

// Missed days eat one streak freeze each; without enough, the streak resets
function applyStreakBreak(state, today) {
  if (!state.lastActiveDay || state.streak === 0) return state
  const missed = daysBetween(state.lastActiveDay, today) - 1
  if (missed <= 0) return state
  if ((state.streakFreezes || 0) < missed) return { ...state, streak: 0 }
  const activeDays = { ...state.activeDays }
  for (let i = 1; i <= missed; i++) activeDays[addDays(state.lastActiveDay, i)] = 'frozen'
  return { ...state, streakFreezes: state.streakFreezes - missed, lastActiveDay: addDays(today, -1), activeDays }
}

export function normalizeProgress(raw, today) {
  return ensureQuests(applyStreakBreak({ ...defaultProgress(), ...raw }, today), today)
}

const addEarned = (state, coins, today) => ({
  ...state,
  coins: state.coins + coins,
  // Earned history drives rankings, so only earning adds to it, never spending
  coinsByDay: coins ? { ...state.coinsByDay, [today]: (state.coinsByDay[today] || 0) + coins } : state.coinsByDay,
})

// A finished session: marks the day active, bumps the streak once a day,
// pays coins and advances daily quests
function session(state, coins, today, meta) {
  const active = state.lastActiveDay === today
  return {
    ...addEarned(state, coins, today),
    streak: active ? state.streak : state.streak + 1,
    lastActiveDay: today,
    startedAt: state.startedAt || Date.now(),
    activeDays: { ...state.activeDays, [today]: true },
    quests: applySessionToQuests(state.quests, { ...meta, coinsEarned: coins }),
  }
}

const isInt = (v, min, max) => Number.isInteger(v) && v >= min && v <= max
const accuracy = (correct, total) => (total ? Math.round((correct / total) * 100) : 0)
const lessonSize = lesson => lesson.exercises?.length ?? lesson.exerciseCount ?? 0

function countIds(map, ids) {
  const out = { ...map }
  for (const id of ids) out[id] = (out[id] || 0) + 1
  return out
}

// ctx: { today, findLesson(id) -> { lesson, level } | null, guildIds, friendQuestReady(week) -> bool }
const ACTIONS = {
  lessonDone(s, a, ctx) {
    const found = ctx.findLesson(a.lessonId)
    if (!found) return { error: 'unknown_lesson' }
    if (topicLock(found.level, { unlockedTopics: s.unlockedTopics, guildIds: ctx.guildIds })) return { error: 'locked' }
    const size = lessonSize(found.lesson)
    if (!isInt(a.total, 1, size) || !isInt(a.correct, 0, a.total) || !isInt(a.maxCombo ?? 0, 0, a.total)) return { error: 'bad_score' }
    const ids = new Set((found.lesson.exercises || []).map(e => e.id))
    const mistakes = (a.mistakeIds || []).filter(id => ids.has(id))
    const replay = !!s.lessons[a.lessonId]?.completed
    const coins = lessonCoins(found.lesson, a, replay)
    const next = session(s, coins, ctx.today, {
      isLesson: true, accuracyPct: accuracy(a.correct, a.total), maxCombo: a.maxCombo || 0, perfect: a.correct === a.total,
    })
    return {
      state: {
        ...next,
        lessons: { ...s.lessons, [a.lessonId]: { completed: true, completedAt: Date.now() } },
        wrongExercises: countIds(s.wrongExercises, mistakes),
      },
      coins,
    }
  },

  // Mistake practice: only exercises that really are open mistakes count
  practiceDone(s, a, ctx) {
    const open = new Set(Object.keys(s.wrongExercises))
    const correct = [...new Set(a.correctIds || [])].filter(id => open.has(id))
    const wrong = [...new Set(a.wrongIds || [])].filter(id => open.has(id))
    if (correct.length + wrong.length > ECONOMY.practiceMaxExercises || correct.length + wrong.length === 0) return { error: 'bad_score' }
    const perfect = wrong.length === 0
    const coins = correct.length * ECONOMY.practicePerCorrect + (perfect ? ECONOMY.practicePerfectBonus : 0)
    const wrongExercises = countIds(s.wrongExercises, wrong)
    for (const id of correct) delete wrongExercises[id]
    const total = correct.length + wrong.length
    const next = session(s, coins, ctx.today, { isLesson: false, accuracyPct: accuracy(correct.length, total), maxCombo: a.maxCombo || 0, perfect })
    return { state: { ...next, wrongExercises }, coins }
  },

  speedDone(s, a, ctx) {
    if (!['words', 'letters'].includes(a.mode) || !isInt(a.matches, 0, ECONOMY.speedMaxMatches)) return { error: 'bad_score' }
    const coins = Math.min(ECONOMY.speedMaxCoins, Math.ceil(a.matches / 2))
    const best = s.speedBest || {}
    const next = session(s, coins, ctx.today, { isLesson: false })
    return { state: { ...next, speedBest: { ...best, [a.mode]: Math.max(best[a.mode] || 0, a.matches) } }, coins }
  },

  drillDone(s, a, ctx) {
    if (!isInt(a.total, 1, ECONOMY.drillMaxExercises) || !isInt(a.correct, 0, a.total)) return { error: 'bad_score' }
    const coins = a.correct
    return { state: session(s, coins, ctx.today, { isLesson: false, accuracyPct: accuracy(a.correct, a.total), maxCombo: a.maxCombo || 0, perfect: a.correct === a.total }), coins }
  },

  typingDone(s, a, ctx) {
    if (!TYPING_DURATIONS.includes(a.duration) || !TYPING_SOURCES.some(t => t.id === a.source)) return { error: 'bad_score' }
    if (!isInt(a.words, 0, ECONOMY.typingMaxWords) || !isInt(a.wpm, 0, ECONOMY.typingMaxWpm) || !isInt(a.accuracy, 0, 100)) return { error: 'bad_score' }
    // wpm counts five characters as a word, so it has to fit the words actually typed
    if (a.wpm * 5 * (a.duration / 60) > a.words * ECONOMY.typingMaxWordChars) return { error: 'bad_score' }
    const coins = Math.min(ECONOMY.typingMaxCoins, Math.floor(a.words / 5))
    const board = typingBoard(a.duration, a.source)
    const best = s.typingBest || {}
    const next = session(s, coins, ctx.today, { isLesson: false, accuracyPct: a.accuracy })
    return { state: { ...next, typingBest: { ...best, [board]: Math.max(best[board] || 0, a.wpm) } }, coins }
  },

  // Sent by the server itself after it stores card reviews, never by a client
  reviewsDone(s, a, ctx) {
    if (!isInt(a.count, 1, 1000)) return { error: 'bad_score' }
    const done = s.reviewCoins?.day === ctx.today ? s.reviewCoins.count : 0
    const coins = Math.max(0, Math.min(a.count, ECONOMY.reviewCoinCap - done))
    return { state: { ...session(s, coins, ctx.today, { isLesson: false }), reviewCoins: { day: ctx.today, count: done + a.count } }, coins }
  },

  claimQuest(s, a, ctx) {
    const q = s.quests?.items?.find(x => x.id === a.questId)
    if (!q || q.claimed || q.progress < q.goal) return { error: 'not_claimable' }
    const quests = { ...s.quests, items: s.quests.items.map(x => (x.id === q.id ? { ...x, claimed: true } : x)) }
    if (q.reward.type === 'freeze') return { state: { ...s, quests, streakFreezes: (s.streakFreezes || 0) + q.reward.amount } }
    return { state: { ...addEarned(s, q.reward.amount, ctx.today), quests }, coins: q.reward.amount }
  },

  claimFriendQuest(s, a, ctx) {
    if (s.friendQuestClaimed === a.week || !ctx.friendQuestReady?.(a.week)) return { error: 'not_claimable' }
    return { state: { ...addEarned(s, ctx.friendQuestReward, ctx.today), friendQuestClaimed: a.week }, coins: ctx.friendQuestReward }
  },

  buyFreeze(s) {
    if (s.coins < ECONOMY.streakFreezeCost) return { error: 'not_enough_coins' }
    return { state: { ...s, coins: s.coins - ECONOMY.streakFreezeCost, streakFreezes: (s.streakFreezes || 0) + 1 } }
  },

  unlockTopic(s, a, ctx) {
    const level = ctx.findLevel(a.levelId)
    const lock = level && topicLock(level, { unlockedTopics: s.unlockedTopics, guildIds: ctx.guildIds })
    if (!lock?.needsCoins) return { error: 'not_unlockable' }
    if (lock.needsGuild) return { error: 'needs_guild' }
    if (s.coins < level.special.price) return { error: 'not_enough_coins' }
    return {
      state: {
        ...s,
        coins: s.coins - level.special.price,
        unlockedTopics: { ...s.unlockedTopics, [level.id]: new Date().toISOString() },
      },
    }
  },

  setDailyGoal(s, a) {
    if (!DAILY_GOALS.some(g => g.coins === a.goal)) return { error: 'bad_goal' }
    return { state: { ...s, dailyGoal: a.goal } }
  },

  markMilestone(s, a) {
    if (!STREAK_MILESTONES.includes(a.days)) return { error: 'bad_milestone' }
    return { state: { ...s, streakMilestone: a.days } }
  },

  skipLevel(s, a, ctx) {
    if (!ctx.findLevel(a.levelId)) return { error: 'unknown_level' }
    return { state: { ...s, skippedLevels: { ...s.skippedLevels, [a.levelId]: true } } }
  },

  unskipLevel(s, a) {
    const skippedLevels = { ...s.skippedLevels }
    delete skippedLevels[a.levelId]
    return { state: { ...s, skippedLevels } }
  },
}

// Actions only the server may apply to itself
export const SERVER_ONLY = new Set(['reviewsDone'])

// Actions that pay for finishing an activity. Accounts must show the session
// token they got when the activity started (same kind and ref), and it must
// be at least minMs old, so rewards cannot be claimed faster than played.
export const TIMED = {
  lessonDone: { kind: 'lesson', ref: a => a.lessonId, minMs: a => a.total * 2000 },
  practiceDone: { kind: 'practice', ref: () => 'mistakes', minMs: a => ((a.correctIds?.length || 0) + (a.wrongIds?.length || 0)) * 2000 },
  speedDone: { kind: 'speed', ref: a => a.mode, minMs: () => 55000 },
  drillDone: { kind: 'drill', ref: () => 'drill', minMs: a => a.total * 1500 },
  typingDone: { kind: 'typing', ref: () => 'typing', minMs: a => a.duration * 1000 - 5000 },
}

export function applyAction(state, action, ctx) {
  const handler = ACTIONS[action?.type]
  if (!handler) return { error: 'unknown_action' }
  const current = normalizeProgress(state, ctx.today)
  const result = handler(current, action, ctx)
  return result.error ? result : { state: result.state, coins: result.coins || 0 }
}
