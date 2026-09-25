// Server-side course lookups that include special topics' full content.
// Never import this from a client component.
import { COURSE } from '../data/course'
import { SPECIAL_LEVELS } from '../data/special'

export const ALL_LEVELS = [...COURSE.levels, ...SPECIAL_LEVELS]

export function findLevelFull(id) {
  return ALL_LEVELS.find(l => l.id === id) || null
}

export function findLessonFull(id) {
  for (const level of ALL_LEVELS) {
    const lesson = level.lessons.find(l => l.id === id)
    if (lesson) return { lesson, level }
  }
  return null
}
