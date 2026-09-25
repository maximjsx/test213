// Material and keyboard for the typing test.
import { PUBLIC_LEVELS } from './course'
import { WORDS } from './words'
import { shuffle } from './checker'

const CYRILLIC_WORD = /^[Ѐ-ӿ-]+$/
const clean = text => text.replace(/[.,!?;:"«»„“()]/g, '').trim()

// Whole Bulgarian sentences from the course: prompts to translate, the
// Bulgarian side of word banks, dialog lines
function courseSentences() {
  const out = new Set()
  for (const level of PUBLIC_LEVELS) {
    for (const lesson of level.lessons) {
      for (const ex of lesson.exercises) {
        if (ex.type === 'translate_to_en' || (ex.type === 'word_bank' && ex.direction === 'to_en')) out.add(ex.prompt)
        if (ex.type === 'dialog') ex.lines?.forEach(l => l.text && out.add(l.text))
      }
    }
  }
  return [...out].filter(s => s.split(/\s+/).length >= 3)
}

export const SENTENCES = courseSentences()
export const COURSE_WORDS = [...new Set(WORDS.flatMap(w => clean(w.bg).toLowerCase().split(/\s+/)).filter(w => CYRILLIC_WORD.test(w)))]

// A long enough stream of words for one run
export function buildText(source, extraWords = []) {
  if (source === 'sentences') return shuffle(SENTENCES).join(' ').split(/\s+/)
  const pool = [...COURSE_WORDS, ...extraWords.map(w => w.toLowerCase())]
  return Array.from({ length: 12 }, () => shuffle(pool)).flat().slice(0, 300)
}

// Bulgarian Phonetic (traditional) layout by physical key, so learners can
// type Cyrillic on a Latin keyboard without installing anything
export const PHONETIC = {
  Backquote: 'ч', KeyQ: 'я', KeyW: 'в', KeyE: 'е', KeyR: 'р', KeyT: 'т', KeyY: 'ъ', KeyU: 'у', KeyI: 'и', KeyO: 'о', KeyP: 'п',
  BracketLeft: 'ш', BracketRight: 'щ', Backslash: 'ю',
  KeyA: 'а', KeyS: 'с', KeyD: 'д', KeyF: 'ф', KeyG: 'г', KeyH: 'х', KeyJ: 'й', KeyK: 'к', KeyL: 'л',
  KeyZ: 'з', KeyX: 'ь', KeyC: 'ц', KeyV: 'ж', KeyB: 'б', KeyN: 'н', KeyM: 'м',
}

export const KEY_ROWS = [
  ['Backquote', 'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight', 'Backslash'],
  ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL'],
  ['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM'],
]

export const LATIN_LABEL = code => ({ Backquote: '`', BracketLeft: '[', BracketRight: ']', Backslash: '\\' }[code] ?? code.replace('Key', ''))

export const keyFor = letter => Object.keys(PHONETIC).find(code => PHONETIC[code] === letter?.toLowerCase()) || null
