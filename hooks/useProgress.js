'use client'
import { useState, useEffect, useCallback } from 'react'

const KEY = 'bulgarolearn'
const MAX_HEARTS = 10
const HEART_REFILL_MS = 20 * 60 * 1000
const HEART_COST_XP = 10
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

function defaultState() {
  return {
    lessons: {},
    hearts: MAX_HEARTS,
    heartsLastLost: null,
    xp: 0,
    streak: 0,
    lastActiveDay: null,
    streakFreezes: 0,
    wrongExercises: {},   // exerciseId → wrong count across all sessions
  }
}

function calcRefillHearts(state) {
  if (!state.heartsLastLost || state.hearts >= MAX_HEARTS) return state
  const elapsed = Date.now() - state.heartsLastLost
  if (elapsed >= HEART_REFILL_MS) {
    return { ...state, hearts: MAX_HEARTS, heartsLastLost: null }
  }
  return state
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
    // Advance lastActiveDay to yesterday so re-opening the app doesn't consume another freeze
    const yesterday = new Date(todayMidnight - 86400000)
    return { ...state, streakFreezes: state.streakFreezes - 1, lastActiveDay: yesterday.toDateString() }
  }
  return { ...state, streak: 0 }
}

export function useProgress() {
  const [state, setState] = useState(defaultState)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const raw = load()
    if (raw) {
      const s1 = calcRefillHearts(raw)
      const s2 = calcStreakBreak(s1)
      if (s2 !== raw) save(s2)
      setState(s2)
    }
    setHydrated(true)
  }, [])

  // Tick to recalc hearts every minute
  useEffect(() => {
    const t = setInterval(() => {
      setState(prev => {
        const next = calcRefillHearts(prev)
        if (next.hearts !== prev.hearts) { save(next); return next }
        return prev
      })
    }, 60_000)
    return () => clearInterval(t)
  }, [])

  const loseHeart = useCallback(() => {
    setState(prev => {
      if (prev.hearts <= 0) return prev
      const next = {
        ...prev,
        hearts: prev.hearts - 1,
        heartsLastLost: prev.heartsLastLost || Date.now(),
      }
      save(next)
      return next
    })
  }, [])

  const buyHearts = useCallback((count = 1) => {
    setState(prev => {
      if (prev.xp < count * HEART_COST_XP) return prev
      const newHearts = Math.min(MAX_HEARTS, prev.hearts + count)
      const next = {
        ...prev,
        xp: prev.xp - count * HEART_COST_XP,
        hearts: newHearts,
        heartsLastLost: newHearts >= MAX_HEARTS ? null : prev.heartsLastLost,
      }
      save(next)
      return next
    })
  }, [])

  const buyStreakFreeze = useCallback(() => {
    setState(prev => {
      if (prev.xp < STREAK_FREEZE_COST_XP) return prev
      const next = {
        ...prev,
        xp: prev.xp - STREAK_FREEZE_COST_XP,
        streakFreezes: (prev.streakFreezes || 0) + 1,
      }
      save(next)
      return next
    })
  }, [])

  const completeLessonWithXP = useCallback((lessonId, xp) => {
    setState(prev => {
      const today = new Date().toDateString()
      const wasToday = prev.lastActiveDay === today
      const newStreak = wasToday ? prev.streak : prev.streak + 1
      const next = {
        ...prev,
        lessons: { ...prev.lessons, [lessonId]: { completed: true, completedAt: Date.now() } },
        xp: prev.xp + xp,
        streak: newStreak,
        lastActiveDay: today,
      }
      save(next)
      return next
    })
  }, [])

  const recordMistakes = useCallback((exerciseIds) => {
    if (!exerciseIds?.length) return
    setState(prev => {
      const wrongExercises = { ...prev.wrongExercises }
      exerciseIds.forEach(id => { wrongExercises[id] = (wrongExercises[id] || 0) + 1 })
      const next = { ...prev, wrongExercises }
      save(next)
      return next
    })
  }, [])

  const isLessonComplete = useCallback((id) => !!state.lessons[id]?.completed, [state])

  const isLessonUnlocked = useCallback((levelLessons, idx, prevLevelLessons = null) => {
    if (idx === 0) {
      if (!prevLevelLessons) return true
      return prevLevelLessons.every(l => !!state.lessons[l.id]?.completed)
    }
    return !!state.lessons[levelLessons[idx - 1].id]?.completed
  }, [state])

  const levelProgress = useCallback((levelLessons) => {
    const done = levelLessons.filter(l => state.lessons[l.id]?.completed).length
    return { done, total: levelLessons.length }
  }, [state])

  const nextHeartInMs = useCallback(() => {
    if (state.hearts >= MAX_HEARTS || !state.heartsLastLost) return 0
    const elapsed = Date.now() - state.heartsLastLost
    return Math.max(0, HEART_REFILL_MS - elapsed)
  }, [state])

  const resetProgress = useCallback(() => {
    const fresh = defaultState()
    save(fresh)
    setState(fresh)
  }, [])

  return {
    state, hydrated,
    loseHeart, buyHearts, HEART_COST_XP,
    buyStreakFreeze, STREAK_FREEZE_COST_XP,
    recordMistakes,
    completeLessonWithXP,
    isLessonComplete, isLessonUnlocked, levelProgress,
    nextHeartInMs, resetProgress, MAX_HEARTS,
  }
}
