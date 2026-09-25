'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from './useAuth'
import { applyAction, normalizeProgress, defaultProgress, ECONOMY } from '../lib/progressEngine'
import { findLesson, findLevel } from '../lib/course'
import { topicLock } from '../lib/specialTopics'
import { FRIEND_QUEST_REWARD } from '../lib/goals'
import { dayKey } from '../lib/days'

// Guests keep progress in this browser and run the progress engine here.
// Accounts send every change to the server as an action; the server runs the
// same engine, decides the reward and returns the stored state. The browser
// applies the action at once for a snappy UI, then takes the server's answer.
const KEY = 'bulgario_progress'

function load() {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(localStorage.getItem(KEY)) } catch { return null }
}

function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch (e) {
    console.warn('Could not save progress (storage full?):', e)
  }
}

// Read-only peek at this browser's guest progress, for the profile page's
// "move it to your account" offer
export function peekLocalProgress() {
  return load()
}

export function clearLocalProgress() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(KEY)
}

async function post(url, body) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const data = await res.json().catch(() => ({}))
  return res.ok ? data : { error: data.error || 'network' }
}

// Module-level cache so a tab switch (remount) starts from the last known
// state instead of flashing the loading skeleton
let cachedState = null
let cachedHydrated = false

export function useProgress() {
  const { user, loading: authLoading } = useAuth()
  const [state, setState] = useState(() => cachedState ?? defaultProgress())
  const [hydrated, setHydrated] = useState(cachedHydrated)
  const modeRef = useRef('local') // 'local' (guest) | 'account'
  const stateRef = useRef(state)
  stateRef.current = state
  const guildIds = user?.guildIds

  useEffect(() => {
    if (authLoading) return
    let cancelled = false
    async function hydrate() {
      if (user) {
        modeRef.current = 'account'
        try {
          const res = await fetch(`/api/progress?day=${dayKey()}`)
          const d = await res.json()
          if (cancelled) return
          setState(normalizeProgress(d.progress || {}, dayKey()))
        } catch {
          // keep what we had; actions still go to the server
        }
      } else {
        modeRef.current = 'local'
        const next = normalizeProgress(load() || {}, dayKey())
        save(next)
        setState(next)
      }
      if (!cancelled) setHydrated(true)
    }
    hydrate()
    return () => { cancelled = true }
  }, [user, authLoading])

  useEffect(() => { cachedState = state }, [state])
  useEffect(() => { if (hydrated) cachedHydrated = true }, [hydrated])

  const context = useCallback(() => ({
    today: dayKey(),
    findLesson,
    findLevel,
    guildIds,
    friendQuestReady: () => true, // the server checks the real totals
    friendQuestReward: FRIEND_QUEST_REWARD,
  }), [guildIds])

  // Applies an action locally and, for accounts, on the server. Returns the
  // local result ({ coins } or { error }) right away.
  const dispatch = useCallback((action, token) => {
    const result = applyAction(stateRef.current, action, context())
    if (result.error) return result
    setState(result.state)
    if (modeRef.current === 'local') {
      save(result.state)
      return result
    }
    post('/api/progress/action', { action, token, day: dayKey() }).then(server => {
      if (server.progress) return setState(server.progress)
      // Rejected: fall back to what the server has
      fetch(`/api/progress?day=${dayKey()}`).then(r => r.json()).then(d => d.progress && setState(d.progress)).catch(() => {})
    })
    return result
  }, [context])

  // Start of a timed activity. Accounts get a server token that must come
  // back with the result; guests need none.
  const beginActivity = useCallback(async (kind, ref) => {
    if (modeRef.current !== 'account') return null
    const res = await post('/api/progress/start', { kind, ref })
    return res.token || null
  }, [])

  const lockOf = useCallback(
    level => topicLock(level, { unlockedTopics: state.unlockedTopics, guildIds }),
    [state.unlockedTopics, guildIds]
  )
  const isTopicUnlocked = useCallback(level => !lockOf(level), [lockOf])

  const isLessonComplete = useCallback(id => !!state.lessons[id]?.completed, [state])
  const isLessonUnlocked = useCallback((levelLessons, idx) => {
    // The first lesson of every topic is always open; within a topic, lessons
    // unlock in order
    if (idx === 0) return true
    return !!state.lessons[levelLessons[idx - 1].id]?.completed
  }, [state])
  const levelProgress = useCallback(levelLessons => {
    const done = levelLessons.filter(l => state.lessons[l.id]?.completed).length
    return { done, total: levelLessons.length }
  }, [state])

  return {
    state,
    hydrated,
    isAccount: modeRef.current === 'account',
    beginActivity,
    STREAK_FREEZE_COST: ECONOMY.streakFreezeCost,
    lockOf, isTopicUnlocked, isLessonComplete, isLessonUnlocked, levelProgress,

    completeLesson: (lessonId, score, token) => dispatch({ type: 'lessonDone', lessonId, ...score }, token),
    completePractice: (correctIds, wrongIds, maxCombo, token) => dispatch({ type: 'practiceDone', correctIds, wrongIds, maxCombo }, token),
    completeSpeedRound: (mode, matches, token) => dispatch({ type: 'speedDone', mode, matches }, token),
    completeDrill: (correct, total, maxCombo, token) => dispatch({ type: 'drillDone', correct, total, maxCombo }, token),
    completeTyping: (result, token) => dispatch({ type: 'typingDone', ...result }, token),
    claimQuest: questId => dispatch({ type: 'claimQuest', questId }),
    claimFriendQuest: week => dispatch({ type: 'claimFriendQuest', week }),
    buyStreakFreeze: () => dispatch({ type: 'buyFreeze' }),
    // Buying special topics needs an account: guest coins live in the browser
    unlockTopic: level => (modeRef.current === 'account' ? dispatch({ type: 'unlockTopic', levelId: level.id }) : { error: 'sign_in' }),
    setDailyGoal: goal => dispatch({ type: 'setDailyGoal', goal }),
    markStreakMilestone: days => dispatch({ type: 'markMilestone', days }),
    skipLevel: levelId => dispatch({ type: 'skipLevel', levelId }),
    unskipLevel: levelId => dispatch({ type: 'unskipLevel', levelId }),

    // The server's word after something it did itself (a card review)
    syncFromServer: progress => progress && setState(progress),
    // After guest progress was imported into a new account
    adoptAsAccount: progress => { modeRef.current = 'account'; setState(progress) },
  }
}
