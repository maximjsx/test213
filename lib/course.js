import { COURSE } from '../data/course'
import { shuffle } from './checker'

// Lookups and rules over the course content. Pages ask here instead of
// walking COURSE.levels themselves, so the rules live in one place.

export const LEVELS = COURSE.levels

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

// The first unlocked, incomplete lesson across the whole course
export function findResumeLesson(isLessonComplete, isLessonUnlocked) {
  for (const level of LEVELS) {
    const lesson = level.lessons.find((l, idx) => isLessonUnlocked(level.lessons, idx) && !isLessonComplete(l.id))
    if (lesson) return { lesson, level }
  }
  return null
}

export function* allExercises() {
  for (const level of LEVELS)
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
export function lessonXp(lesson, { correct, total }, isReplay) {
  const base = isReplay ? Math.ceil(lesson.xp / 2) : lesson.xp
  if (!total) return base
  if (correct === total) return Math.round(base * 1.5)
  if (correct / total >= 0.8) return Math.round(base * 1.2)
  return base
}
