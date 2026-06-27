'use client'
import { useState, useEffect, useCallback } from 'react'

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
  }
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
      const s = calcStreakBreak(raw)
      if (s !== raw) save(s)
      setState(s)
    }
    setHydrated(true)
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

  const unlockPack = useCallback((packId, costXP) => {
    setState(prev => {
      if (prev.xp < costXP) return prev
      const next = {
        ...prev,
        xp: prev.xp - costXP,
        specialUnlocks: { ...(prev.specialUnlocks || {}), [packId]: true },
      }
      save(next)
      return next
    })
  }, [])

  const isLessonComplete = useCallback((id) => !!state.lessons[id]?.completed, [state])

  const skipLevel = useCallback((levelId) => {
    setState(prev => {
      const next = { ...prev, skippedLevels: { ...(prev.skippedLevels || {}), [levelId]: true } }
      save(next)
      return next
    })
  }, [])

  const unskipLevel = useCallback((levelId) => {
    setState(prev => {
      const skippedLevels = { ...(prev.skippedLevels || {}) }
      delete skippedLevels[levelId]
      const next = { ...prev, skippedLevels }
      save(next)
      return next
    })
  }, [])

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
    save(fresh)
    setState(fresh)
  }, [])

  return {
    state, hydrated,
    buyStreakFreeze, STREAK_FREEZE_COST_XP,
    unlockPack,
    recordMistakes, completeLessonWithXP,
    isLessonComplete, isLessonUnlocked, levelProgress,
    skipLevel, unskipLevel, resetProgress,
  }
}
