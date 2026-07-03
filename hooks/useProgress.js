'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { ensureQuests, applySessionToQuests } from '../lib/quests'
import { useAuth } from './useAuth'

const KEY = 'bulgarolearn'
const STREAK_FREEZE_COST_XP = 20

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
    xp: 0,
    streak: 0,
    lastActiveDay: null,
    streakFreezes: 0,
    specialUnlocks: {},
    wrongExercises: {},
    skippedLevels: {},
    activeDays: {},
    xpByDay: {},
    quests: null,
    startedAt: null,
  }
}

function normalize(raw) {
  return ensureQuests(calcStreakBreak({ ...defaultState(), ...raw }))
}

function calcStreakBreak(state) {
  if (!state.lastActiveDay || state.streak === 0) return state
  const last = new Date(state.lastActiveDay)
  const today = new Date()
  const lastMidnight = new Date(last.getFullYear(), last.getMonth(), last.getDate())
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const diffDays = Math.round((todayMidnight - lastMidnight) / 86400000)
  if (diffDays <= 1) return state
  if ((state.streakFreezes || 0) > 0) {
    const yesterday = new Date(todayMidnight - 86400000)
    const frozenDay = yesterday.toDateString()
    return {
      ...state,
      streakFreezes: state.streakFreezes - 1,
      lastActiveDay: frozenDay,
      activeDays: { ...(state.activeDays || {}), [dayKey(yesterday)]: 'frozen' },
    }
  }
  return { ...state, streak: 0 }
}

// "2026-07-03" style key, local time
export function dayKey(d = new Date()) {
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// Marks today active, bumps streak once per day, applies session results to quests
function applySession(prev, xp, meta = {}) {
  const today = new Date().toDateString()
  const wasToday = prev.lastActiveDay === today
  const withQuests = ensureQuests(prev)
  return {
    ...withQuests,
    xp: prev.xp + xp,
    streak: wasToday ? prev.streak : prev.streak + 1,
    lastActiveDay: today,
    startedAt: prev.startedAt || Date.now(),
    activeDays: { ...(prev.activeDays || {}), [dayKey()]: true },
    xpByDay: { ...(prev.xpByDay || {}), [dayKey()]: ((prev.xpByDay || {})[dayKey()] || 0) + xp },
    quests: applySessionToQuests(withQuests.quests, { ...meta, xpEarned: xp }),
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
            setState(normalize(d.progress))
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
      if (raw) setState(normalize(raw))
      setHydrated(true)
    }
    hydrate()
    return () => { cancelled = true }
  }, [user, authLoading])

  // Mirror the latest values into the module cache so the next mount (a tab
  // switch) can start from them instead of the loading state.
  useEffect(() => { cachedState = state }, [state])
  useEffect(() => { if (hydrated) cachedHydrated = true }, [hydrated])

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

  const completeLessonWithXP = useCallback((lessonId, xp, meta = {}) => {
    setState(prev => {
      const next = {
        ...applySession(prev, xp, { ...meta, isLesson: true }),
        lessons: { ...prev.lessons, [lessonId]: { completed: true, completedAt: Date.now() } },
      }
      persist(next)
      return next
    })
  }, [persist])

  // Mistake practice session: clears fixed mistakes, keeps repeated ones
  const completePractice = useCallback((xp, meta = {}, correctIds = [], wrongIds = []) => {
    setState(prev => {
      const wrongExercises = { ...prev.wrongExercises }
      correctIds.forEach(id => { delete wrongExercises[id] })
      wrongIds.forEach(id => { wrongExercises[id] = (wrongExercises[id] || 0) + 1 })
      const next = { ...applySession(prev, xp, { ...meta, isLesson: false }), wrongExercises }
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
      const isXp = q.reward.type === 'xp'
      const next = {
        ...prev,
        xp: isXp ? prev.xp + q.reward.amount : prev.xp,
        xpByDay: isXp
          ? { ...(prev.xpByDay || {}), [dayKey()]: ((prev.xpByDay || {})[dayKey()] || 0) + q.reward.amount }
          : (prev.xpByDay || {}),
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
      if (prev.xp < STREAK_FREEZE_COST_XP) return prev
      const next = {
        ...prev,
        xp: prev.xp - STREAK_FREEZE_COST_XP,
        streakFreezes: (prev.streakFreezes || 0) + 1,
      }
      persist(next)
      return next
    })
  }, [persist])

  const unlockPack = useCallback((packId, costXP) => {
    setState(prev => {
      if (prev.xp < costXP) return prev
      const next = {
        ...prev,
        xp: prev.xp - costXP,
        specialUnlocks: { ...(prev.specialUnlocks || {}), [packId]: true },
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

  const isLessonUnlocked = useCallback((levelLessons, idx, prevLevelLessons = null, prevLevelId = null) => {
    if (idx === 0) {
      if (!prevLevelLessons) return true
      if (prevLevelId && state.skippedLevels?.[prevLevelId]) return true
      return prevLevelLessons.every(l => !!state.lessons[l.id]?.completed)
    }
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
    buyStreakFreeze, STREAK_FREEZE_COST_XP,
    unlockPack,
    recordMistakes, completeLessonWithXP, completePractice,
    claimQuest,
    isLessonComplete, isLessonUnlocked, levelProgress,
    skipLevel, unskipLevel, resetProgress, adoptAsAccount,
  }
}
