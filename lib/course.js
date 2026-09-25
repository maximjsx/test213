import { COURSE } from '../data/course'
import SPECIAL_META from '../data/special-meta.json'
import { shuffle } from './checker'

// Lookups and rules over the course content. Pages ask here instead of
// walking COURSE.levels themselves, so the rules live in one place.

// Special topics come as metadata only (no exercises); lib/serverCourse.js
// has their full content, which is served only to learners who unlocked them.
export const PUBLIC_LEVELS = COURSE.levels
export const LEVELS = [...PUBLIC_LEVELS, ...SPECIAL_META]

export function findLevel(id) {
  return LEVELS.find(l => l.id === id) || null
}

export function findLevelIndex(id) {
  return LEVELS.findIndex(l => l.id === id)
}

export function findLesson(id) {
  for (const level of LEVELS) {
    const lesson = level.lessons.find(l => l.id === id)
    if (lesson) return { lesson, level }
  }
  return null
}

export function lessonHref(lesson, level) {
  return `/lesson/${lesson.id}?level=${level.id}`
}

// The first unlocked, incomplete lesson across the whole course. Special
// topics the learner has not bought are skipped.
export function findResumeLesson(isLessonComplete, isLessonUnlocked, isTopicUnlocked) {
  for (const level of LEVELS) {
    if (!isTopicUnlocked(level)) continue
    const lesson = level.lessons.find((l, idx) => isLessonUnlocked(level.lessons, idx) && !isLessonComplete(l.id))
    if (lesson) return { lesson, level }
  }
  return null
}

export function* allExercises() {
  for (const level of PUBLIC_LEVELS)
    for (const lesson of level.lessons)
      yield* lesson.exercises
}

// Harder exercise types come later in a lesson
const DIFFICULTY = {
  multiple_choice: 1, match_pairs: 1,
  listen_and_type: 2, speak_sentence: 2,
  word_bank: 3, fill_blank: 3,
  translate_to_en: 4, translate_to_bg: 4, listen_translate: 4,
}
const UNRANKED = 5

// Keeps the authored intro (new words plus the quick checks right after them)
// in order, then shuffles the rest within each difficulty tier so a replay
// feels fresh without jumping ahead of what was taught.
export function orderExercises(exercises) {
  const lastIntro = exercises.findLastIndex(ex => ex.type === 'introduce')
  let splitAt = lastIntro + 1
  while (splitAt < exercises.length && exercises[splitAt].type === 'multiple_choice') splitAt++

  const tiers = new Map()
  for (const ex of exercises.slice(splitAt)) {
    const tier = DIFFICULTY[ex.type] ?? UNRANKED
    tiers.set(tier, [...(tiers.get(tier) || []), ex])
  }
  const practice = [...tiers.keys()].sort((a, b) => a - b).flatMap(t => shuffle(tiers.get(t)))
  return [...exercises.slice(0, splitAt), ...practice]
}

// Replays pay half; accuracy adds a bonus
export function lessonCoins(lesson, { correct, total }, isReplay) {
  const base = isReplay ? Math.ceil(lesson.coins / 2) : lesson.coins
  if (!total) return base
  if (correct === total) return Math.round(base * 1.5)
  if (correct / total >= 0.8) return Math.round(base * 1.2)
  return base
}
