// Turns any word list ({ bg, en, tts? }) into exercises the lesson player
// already knows, so decks, course words and the glossary get the same
// multiple choice, typing and listening practice as lessons.
import { shuffle } from './checker'

export const DRILL_MODES = {
  flashcards: { title: 'Flashcards', blurb: 'Flip through the cards and check yourself', icon: '/icons/open_book.png' },
  choice: { title: 'Multiple choice', blurb: 'Pick the right meaning, both ways', icon: '/icons/star.png' },
  type: { title: 'Type it', blurb: 'Write the translation yourself', icon: '/icons/keyboard.png' },
  listen: { title: 'Listen and spell', blurb: 'Hear the word, type what you hear', icon: '/icons/speaker.png' },
}

export const DRILL_LENGTH = 12
export const MIN_DRILL_WORDS = 4

// "teacher (male)" also accepts "teacher"; "in / on" accepts either
function englishAnswers(en) {
  const variants = new Set([en.trim()])
  const plain = en.replace(/\([^)]*\)/g, '').trim()
  if (plain) variants.add(plain)
  for (const part of plain.split(/\s*[/;,]\s*/)) if (part) variants.add(part)
  return [...variants]
}

function choices(answer, pool, field) {
  const others = shuffle(pool.filter(w => w[field] !== answer)).slice(0, 3).map(w => w[field])
  return shuffle([answer, ...new Set(others)])
}

const BUILDERS = {
  choice: (w, i, pool) => i % 2 === 0
    ? { type: 'multiple_choice', question: `What does "${w.bg}" mean?`, choices: choices(w.en, pool, 'en'), answer: w.en, tts: w.tts || w.bg }
    : { type: 'multiple_choice', question: `How do you say "${w.en}"?`, choices: choices(w.bg, pool, 'bg'), answer: w.bg },
  type: (w, i) => i % 2 === 0
    ? { type: 'translate_to_en', prompt: w.bg, answers: englishAnswers(w.en), tts: w.tts || w.bg }
    : { type: 'translate_to_bg', prompt: w.en, answers: [w.bg], tts: w.tts || w.bg },
  listen: w => ({ type: 'listen_and_type', tts: w.tts || w.bg, answer: w.bg }),
}

export function usableWords(words) {
  const seen = new Set()
  return words.filter(w => {
    if (!w.bg?.trim() || !w.en?.trim() || seen.has(w.bg)) return false
    seen.add(w.bg)
    return true
  })
}

export function buildDrill(words, mode) {
  const pool = usableWords(words)
  return shuffle(pool).slice(0, DRILL_LENGTH).map((w, i) => ({
    id: `drill-${mode}-${i}`,
    ...BUILDERS[mode](w, i, pool),
  }))
}
