'use client'
import { useState, useEffect, useCallback } from 'react'
import { ensureQuests, applySessionToQuests } from '../lib/quests'

const KEY = 'bulgarolearn'
const AUTH_FLAG = 'bulgario_authed'
const SYNC_FLAG = 'bulgario_synced'
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
    activeDays: {},
    quests: null,
    startedAt: null,
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
    quests: applySessionToQuests(withQuests.quests, { ...meta, xpEarned: xp }),
  }
}

export function useProgress() {
  const [state, setState] = useState(defaultState)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const raw = load()
    if (raw) {
      let s = calcStreakBreak({ ...defaultState(), ...raw })
      s = ensureQuests(s)
      if (s !== raw) save(s)
      setState(s)
    }
    setHydrated(true)
  }, [])

  // Background sync to account (only when signed in AND the user has
  // explicitly converted/linked progress on the profile page, debounced)
  useEffect(() => {
    if (!hydrated) return
    if (typeof window === 'undefined') return
    if (localStorage.getItem(AUTH_FLAG) !== '1') return
    if (localStorage.getItem(SYNC_FLAG) !== '1') return
    const t = setTimeout(() => {
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: state }),
      }).catch(() => {})
    }, 3000)
    return () => clearTimeout(t)
  }, [state, hydrated])

  const completeLessonWithXP = useCallback((lessonId, xp, meta = {}) => {
    setState(prev => {
      const next = {
        ...applySession(prev, xp, { ...meta, isLesson: true }),
        lessons: { ...prev.lessons, [lessonId]: { completed: true, completedAt: Date.now() } },
      }
      save(next)
      return next
    })
  }, [])

  // Mistake practice session: clears fixed mistakes, keeps repeated ones
  const completePractice = useCallback((xp, meta = {}, correctIds = [], wrongIds = []) => {
    setState(prev => {
      const wrongExercises = { ...prev.wrongExercises }
      correctIds.forEach(id => { delete wrongExercises[id] })
      wrongIds.forEach(id => { wrongExercises[id] = (wrongExercises[id] || 0) + 1 })
      const next = { ...applySession(prev, xp, { ...meta, isLesson: false }), wrongExercises }
      save(next)
      return next
    })
  }, [])

  const claimQuest = useCallback((questId) => {
    setState(prev => {
      const items = prev.quests?.items
      if (!items) return prev
      const q = items.find(x => x.id === questId)
      if (!q || q.claimed || q.progress < q.goal) return prev
      const next = {
        ...prev,
        xp: q.reward.type === 'xp' ? prev.xp + q.reward.amount : prev.xp,
        streakFreezes: q.reward.type === 'freeze' ? (prev.streakFreezes || 0) + q.reward.amount : (prev.streakFreezes || 0),
        quests: { ...prev.quests, items: items.map(x => x.id === questId ? { ...x, claimed: true } : x) },
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

  // Replace local state with a server copy (after "load account progress")
  const replaceState = useCallback((serverState) => {
    const merged = ensureQuests(calcStreakBreak({ ...defaultState(), ...serverState }))
    save(merged)
    setState(merged)
  }, [])

  return {
    state, hydrated,
    buyStreakFreeze, STREAK_FREEZE_COST_XP,
    unlockPack,
    recordMistakes, completeLessonWithXP, completePractice,
    claimQuest,
    isLessonComplete, isLessonUnlocked, levelProgress,
    skipLevel, unskipLevel, resetProgress, replaceState,
  }
}
