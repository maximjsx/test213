import { COURSE } from '../data/course'
import { xpSince } from './xp'
import { learnedWordCount, WORDS } from './words'

function longestStreak(activeDays, current) {
  const days = Object.keys(activeDays || {}).sort()
  let best = 0, run = 0, prev = null
  for (const key of days) {
    const d = new Date(`${key}T12:00:00`)
    run = prev && Math.round((d - prev) / 86400000) === 1 ? run + 1 : 1
    best = Math.max(best, run)
    prev = d
  }
  return Math.max(best, current || 0)
}

function topicsCompleted(lessons) {
  return COURSE.levels.filter(level => level.lessons.every(l => lessons?.[l.id]?.completed)).length
}

const lessonCount = COURSE.levels.reduce((n, l) => n + l.lessons.length, 0)

// Each achievement has tiers; reaching a goal lights up the next tier
const ACHIEVEMENTS = [
  { id: 'wildfire', title: 'Wildfire', icon: '/icons/fire.png', unit: 'day streak', goals: [3, 7, 30, 100, 365],
    value: s => longestStreak(s.activeDays, s.streak) },
  { id: 'sage', title: 'Sage', icon: '/icons/lightning.png', unit: 'XP', goals: [100, 500, 1500, 5000, 10000],
    value: s => Math.max(xpSince(s.xpByDay), s.xp || 0) },
  { id: 'scholar', title: 'Scholar', icon: '/icons/open_book.png', unit: 'words learned', goals: [10, 30, 60, WORDS.length],
    value: s => learnedWordCount(s.lessons) },
  { id: 'explorer', title: 'Explorer', icon: '/icons/trophy.png', unit: 'topics completed', goals: [1, 3, COURSE.levels.length],
    value: s => topicsCompleted(s.lessons) },
  { id: 'scribe', title: 'Scribe', icon: '/icons/green_checkmark.png', unit: 'lessons', goals: [5, 15, lessonCount],
    value: s => Object.values(s.lessons || {}).filter(l => l.completed).length },
  { id: 'speedster', title: 'Speedster', icon: '/icons/star.png', unit: 'matches in a speed round', goals: [10, 20, 30],
    value: s => Math.max(0, ...Object.values(s.speedBest || {})) },
]

export function achievementsFor(state) {
  return ACHIEVEMENTS.map(a => {
    const value = a.value(state)
    const tier = a.goals.filter(g => value >= g).length
    const next = a.goals[tier]
    return {
      id: a.id, title: a.title, icon: a.icon, unit: a.unit,
      value, tier, maxTier: a.goals.length,
      next,
      progress: next ? value / next : 1,
    }
  })
}
