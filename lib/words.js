import { COURSE } from '../data/course'

const CYRILLIC = /[Ѐ-ӿ]/
const DAY = 86400000

// Strength fades the longer a lesson goes unpractised, like Duolingo's word
// strength bars. Returns 0 (not learned) to 4 (fresh).
export const MAX_STRENGTH = 4
const STRENGTH_AGES = [2 * DAY, 7 * DAY, 21 * DAY]

export function strengthOf(lessonProgress, now = Date.now()) {
  if (!lessonProgress?.completed) return 0
  const age = now - (lessonProgress.completedAt || 0)
  const idx = STRENGTH_AGES.findIndex(limit => age < limit)
  return idx === -1 ? 1 : MAX_STRENGTH - idx
}

// '"zh" like the "s" in "treasure"' -> 'zh'; 'soft sign - makes...' -> 'soft sign'
function shortHint(text) {
  return text?.match(/"([^"]+)"/)?.[1] || text?.split(' - ')[0] || ''
}

function buildLetters() {
  const alphabet = COURSE.levels.find(l => l.id === 'alphabet')
  if (!alphabet) return []
  const shortSound = {}
  for (const lesson of alphabet.lessons)
    for (const ex of lesson.exercises)
      if (ex.type === 'match_pairs') for (const p of ex.pairs) shortSound[p.left] = p.right

  const letters = []
  for (const lesson of alphabet.lessons)
    for (const ex of lesson.exercises)
      if (ex.type === 'introduce' && ex.label === 'NEW LETTER') {
        letters.push({
          letter: ex.display,
          sound: shortSound[ex.display] || shortHint(ex.sublabel),
          hint: ex.sublabel,
          tts: ex.tts || ex.display,
          lessonId: lesson.id,
        })
      }
  return letters
}

// Every word or phrase the course teaches, from its intro cards and match
// pairs, deduplicated and tagged with the lesson that teaches it
function buildWords() {
  const seen = new Set()
  const words = []
  function add(bg, en, level, lesson, tts) {
    if (!bg || !en || !CYRILLIC.test(bg) || bg.length < 2) return
    const key = bg.toLowerCase().replace(/[!?.,…]/g, '').trim()
    if (seen.has(key)) return
    seen.add(key)
    words.push({ bg, en, tts: tts || bg, levelId: level.id, lessonId: lesson.id })
  }
  for (const level of COURSE.levels) {
    if (level.id === 'alphabet') continue
    for (const lesson of level.lessons)
      for (const ex of lesson.exercises) {
        if (ex.type === 'introduce') add(ex.display, ex.translation, level, lesson, ex.tts)
        if (ex.type === 'match_pairs') for (const p of ex.pairs) add(p.left, p.right, level, lesson)
      }
  }
  return words
}

export const LETTERS = buildLetters()
export const WORDS = buildWords()

// A speed round needs a full board of distinct pairs
export const MIN_SPEED_ITEMS = 5

export function withStrength(items, lessons, now = Date.now()) {
  return items.map(item => ({ ...item, strength: strengthOf(lessons?.[item.lessonId], now) }))
}

export function learnedWordCount(lessons) {
  return WORDS.filter(w => lessons?.[w.lessonId]?.completed).length
}
