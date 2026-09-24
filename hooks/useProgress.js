'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { ensureQuests, applySessionToQuests } from '../lib/quests'
import { useAuth } from './useAuth'
import { topicLock } from '../lib/specialTopics'

const KEY = 'bulgario_progress'
const STREAK_FREEZE_COST = 20
// Card reviews pay 1 coin each, up to this many coins a day
export const REVIEW_COIN_CAP = 20

function load() {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(localStorage.getItem(KEY)) } catch { return null }
}

function save(data) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch (e) {
    console.warn('Could not save progress (storage full?):', e)
  }
}

// Read-only peek at this browser's local progress, independent of whether
// an account is signed in. Used purely for the informational note on the
// profile page — never merged or written back automatically.
export function peekLocalProgress() {
  return load()
}

// Called once the "convert to account" flow has uploaded local progress —
// it now lives on the account, so the local copy is cleared to avoid a
// stale duplicate sitting in this browser's storage.
export function clearLocalProgress() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(KEY)
}

function defaultState() {
  return {
    lessons: {},
    coins: 0,
    streak: 0,
    lastActiveDay: null,
    streakFreezes: 0,
    unlockedTopics: {},
    wrongExercises: {},
    skippedLevels: {},
    activeDays: {},
    coinsByDay: {},
    quests: null,
    startedAt: null,
  }
}

function normalize(raw) {
  return ensureQuests(calcStreakBreak({ ...defaultState(), ...raw }))
}

// A break or used freeze found on load must be saved, or the server keeps
// showing the old streak on the leaderboard and friend lists.
function needsSave(raw, next) {
  return (raw.streak || 0) !== next.streak || (raw.streakFreezes || 0) !== next.streakFreezes
}

function calcStreakBreak(state) {
  if (!state.lastActiveDay || state.streak === 0) return state
  const last = new Date(state.lastActiveDay)
  const today = new Date()
  const lastMidnight = new Date(last.getFullYear(), last.getMonth(), last.getDate())
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const missedDays = Math.round((todayMidnight - lastMidnight) / 86400000) - 1
  if (missedDays <= 0) return state
  // Each freeze covers exactly one missed day
  if ((state.streakFreezes || 0) < missedDays) return { ...state, streak: 0 }
  const activeDays = { ...(state.activeDays || {}) }
  for (let i = 1; i <= missedDays; i++) {
    activeDays[dayKey(new Date(lastMidnight.getFullYear(), lastMidnight.getMonth(), lastMidnight.getDate() + i))] = 'frozen'
  }
  const yesterday = new Date(todayMidnight.getFullYear(), todayMidnight.getMonth(), todayMidnight.getDate() - 1)
  return {
    ...state,
    streakFreezes: state.streakFreezes - missedDays,
    lastActiveDay: yesterday.toDateString(),
    activeDays,
  }
}

// "2026-07-03" style key, local time
export function dayKey(d = new Date()) {
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// Earned history drives rankings, so only earning adds to it, never spending
function earnedToday(state, coins) {
  const byDay = state.coinsByDay || {}
  return { ...byDay, [dayKey()]: (byDay[dayKey()] || 0) + coins }
}

// Marks today active, bumps streak once per day, applies session results to quests
function applySession(current, coins, meta = {}) {
  // Re-check the break here too: a tab left open across missed days was only
  // normalized when it loaded.
  const prev = calcStreakBreak(current)
  const today = new Date().toDateString()
  const wasToday = prev.lastActiveDay === today
  const withQuests = ensureQuests(prev)
  return {
    ...withQuests,
    coins: prev.coins + coins,
    streak: wasToday ? prev.streak : prev.streak + 1,
    lastActiveDay: today,
    startedAt: prev.startedAt || Date.now(),
    activeDays: { ...(prev.activeDays || {}), [dayKey()]: true },
    coinsByDay: earnedToday(prev, coins),
    quests: applySessionToQuests(withQuests.quests, { ...meta, coinsEarned: coins }),
  }
}

// Module-level cache of the last hydrated progress. Switching tabs remounts
// this hook; without the cache, `hydrated` would drop back to false (and for
// signed-in users wait on a fresh /api/progress fetch) every time, flashing the
// mascot loader. Instead we start from the last known state and refresh in the
// background, so only a genuine first load shows the loader.
let cachedState = null
let cachedHydrated = false

export function useProgress() {
  const { user, loading: authLoading } = useAuth()
  const [state, setState] = useState(() => cachedState ?? defaultState())
  const [hydrated, setHydrated] = useState(cachedHydrated)
  // 'local'   -> plain localStorage, exactly like a signed-out guest
  // 'account' -> this account already has its own server progress; that
  //              progress is authoritative and local storage is left alone
  const modeRef = useRef('local')

  const persist = useCallback((next) => {
    if (modeRef.current === 'account') {
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: next }),
      }).catch(() => {})
    } else {
      save(next)
    }
  }, [])

  // Decide the source of truth once auth is known. Local storage and the
  // account are never auto-merged: an account only ever starts using local
  // data through the explicit "convert" flow on the profile page (which
  // only offers itself while the account has no progress of its own yet).
  useEffect(() => {
    if (authLoading) return
    let cancelled = false
    async function hydrate() {
      if (user) {
        try {
          const res = await fetch('/api/progress')
          const d = await res.json()
          if (cancelled) return
          if (d.progress) {
            modeRef.current = 'account'
            const next = normalize(d.progress)
            if (needsSave(d.progress, next)) persist(next)
            setState(next)
            setHydrated(true)
            return
          }
        } catch {
          // fall through to local below
        }
      }
      if (cancelled) return
      modeRef.current = 'local'
      const raw = load()
      if (raw) {
        const next = normalize(raw)
        if (needsSave(raw, next)) persist(next)
        setState(next)
      }
      setHydrated(true)
    }
    hydrate()
    return () => { cancelled = true }
  }, [user, authLoading, persist])

  // Mirror the latest values into the module cache so the next mount (a tab
  // switch) can start from them instead of the loading state.
  useEffect(() => { cachedState = state }, [state])
  useEffect(() => { if (hydrated) cachedHydrated = true }, [hydrated])

  const completeLesson = useCallback((lessonId, coins, meta = {}) => {
    setState(prev => {
      const next = {
        ...applySession(prev, coins, { ...meta, isLesson: true }),
        lessons: { ...prev.lessons, [lessonId]: { completed: true, completedAt: Date.now() } },
      }
      persist(next)
      return next
    })
  }, [persist])

  // Mistake practice session: clears fixed mistakes, keeps repeated ones
  const completePractice = useCallback((coins, meta = {}, correctIds = [], wrongIds = []) => {
    setState(prev => {
      const wrongExercises = { ...prev.wrongExercises }
      correctIds.forEach(id => { delete wrongExercises[id] })
      wrongIds.forEach(id => { wrongExercises[id] = (wrongExercises[id] || 0) + 1 })
      const next = { ...applySession(prev, coins, { ...meta, isLesson: false }), wrongExercises }
      persist(next)
      return next
    })
  }, [persist])

  const claimQuest = useCallback((questId) => {
    setState(prev => {
      const items = prev.quests?.items
      if (!items) return prev
      const q = items.find(x => x.id === questId)
      if (!q || q.claimed || q.progress < q.goal) return prev
      const isCoins = q.reward.type === 'coins'
      const next = {
        ...prev,
        coins: isCoins ? prev.coins + q.reward.amount : prev.coins,
        coinsByDay: isCoins ? earnedToday(prev, q.reward.amount) : (prev.coinsByDay || {}),
        streakFreezes: q.reward.type === 'freeze' ? (prev.streakFreezes || 0) + q.reward.amount : (prev.streakFreezes || 0),
        quests: { ...prev.quests, items: items.map(x => x.id === questId ? { ...x, claimed: true } : x) },
      }
      persist(next)
      return next
    })
  }, [persist])

  const recordMistakes = useCallback((exerciseIds) => {
    if (!exerciseIds?.length) return
    setState(prev => {
      const wrongExercises = { ...prev.wrongExercises }
      exerciseIds.forEach(id => { wrongExercises[id] = (wrongExercises[id] || 0) + 1 })
      const next = { ...prev, wrongExercises }
      persist(next)
      return next
    })
  }, [persist])

  const buyStreakFreeze = useCallback(() => {
    setState(prev => {
      if (prev.coins < STREAK_FREEZE_COST) return prev
      const next = {
        ...prev,
        coins: prev.coins - STREAK_FREEZE_COST,
        streakFreezes: (prev.streakFreezes || 0) + 1,
      }
      persist(next)
      return next
    })
  }, [persist])

  const guildIds = user?.guildIds
  const lockOf = useCallback(
    (level) => topicLock(level, { unlockedTopics: state.unlockedTopics, guildIds }),
    [state.unlockedTopics, guildIds]
  )
  const isTopicUnlocked = useCallback((level) => !lockOf(level), [lockOf])

  // Spending only lowers the balance; coinsByDay is earned history, so a
  // purchase never costs rank.
  const unlockTopic = useCallback((level) => {
    setState(prev => {
      const lock = topicLock(level, { unlockedTopics: prev.unlockedTopics, guildIds })
      const price = level.special?.price || 0
      if (!lock?.needsCoins || lock.needsGuild || prev.coins < price) return prev
      const next = {
        ...prev,
        coins: prev.coins - price,
        unlockedTopics: { ...(prev.unlockedTopics || {}), [level.id]: new Date().toISOString() },
      }
      persist(next)
      return next
    })
  }, [persist, guildIds])

  // Reviews are reported in batches (every few cards and when the session
  // ends) so a long review session is not one progress write per card.
  const completeReviews = useCallback((count) => {
    if (count <= 0) return
    setState(prev => {
      const today = dayKey()
      const done = prev.reviewCoins?.day === today ? prev.reviewCoins.count : 0
      const coins = Math.max(0, Math.min(count, REVIEW_COIN_CAP - done))
      const next = {
        ...applySession(prev, coins, { isLesson: false }),
        reviewCoins: { day: today, count: done + count },
      }
      persist(next)
      return next
    })
  }, [persist])

  const setDailyGoal = useCallback((coins) => {
    setState(prev => {
      const next = { ...prev, dailyGoal: coins }
      persist(next)
      return next
    })
  }, [persist])

  const markStreakMilestone = useCallback((days) => {
    setState(prev => {
      const next = { ...prev, streakMilestone: days }
      persist(next)
      return next
    })
  }, [persist])

  const completeSpeedRound = useCallback((mode, matches, coins) => {
    setState(prev => {
      const best = prev.speedBest || {}
      const next = {
        ...applySession(prev, coins, { isLesson: false }),
        speedBest: { ...best, [mode]: Math.max(best[mode] || 0, matches) },
      }
      persist(next)
      return next
    })
  }, [persist])

  const claimFriendQuest = useCallback((week, coins) => {
    setState(prev => {
      if (prev.friendQuestClaimed === week) return prev
      const next = {
        ...prev,
        coins: prev.coins + coins,
        coinsByDay: earnedToday(prev, coins),
        friendQuestClaimed: week,
      }
      persist(next)
      return next
    })
  }, [persist])

  const isLessonComplete = useCallback((id) => !!state.lessons[id]?.completed, [state])

  const skipLevel = useCallback((levelId) => {
    setState(prev => {
      const next = { ...prev, skippedLevels: { ...(prev.skippedLevels || {}), [levelId]: true } }
      persist(next)
      return next
    })
  }, [persist])

  const unskipLevel = useCallback((levelId) => {
    setState(prev => {
      const skippedLevels = { ...(prev.skippedLevels || {}) }
      delete skippedLevels[levelId]
      const next = { ...prev, skippedLevels }
      persist(next)
      return next
    })
  }, [persist])

  const isLessonUnlocked = useCallback((levelLessons, idx) => {
    // The first lesson of every level is always startable, so learners can jump
    // straight into any section. Within a level, lessons still unlock in order.
    if (idx === 0) return true
    return !!state.lessons[levelLessons[idx - 1].id]?.completed
  }, [state])

  const levelProgress = useCallback((levelLessons) => {
    const done = levelLessons.filter(l => state.lessons[l.id]?.completed).length
    return { done, total: levelLessons.length }
  }, [state])

  const resetProgress = useCallback(() => {
    const fresh = defaultState()
    persist(fresh)
    setState(fresh)
  }, [persist])

  // Used by the one-time "convert local progress to account" flow: uploads
  // the given (local) state to become the account's progress and switches
  // this session to account mode from then on.
  const adoptAsAccount = useCallback((nextState) => {
    modeRef.current = 'account'
    setState(nextState)
  }, [])

  return {
    state, hydrated,
    buyStreakFreeze, STREAK_FREEZE_COST,
    unlockTopic, isTopicUnlocked, lockOf,
    recordMistakes, completeLesson, completePractice, completeReviews,
    claimQuest, claimFriendQuest,
    setDailyGoal, markStreakMilestone, completeSpeedRound,
    isLessonComplete, isLessonUnlocked, levelProgress,
    skipLevel, unskipLevel, resetProgress, adoptAsAccount,
  }
}
