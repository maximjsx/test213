// Voiceovers are keyed by the spoken text, so one recording covers every
// exercise that says the same word or sentence.

const CYRILLIC = /[Ѐ-ӿ]/
const VOWELS = 'аеиоуъюя'
const LETTER_SOUND = /^[^аеиоуъюя\s]ъ$/

// A bare consonant is voiced as its syllable (Б as "бъ"), so both spellings share a key.
export function voiceKey(text) {
  const key = String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (key.length === 1 && CYRILLIC.test(key) && !VOWELS.includes(key)) return key + 'ъ'
  return key
}

const cyrillicOnly = list => (list || []).filter(t => typeof t === 'string' && CYRILLIC.test(t))
const firstAnswer = e => (Array.isArray(e.answers) ? e.answers[0] : Array.isArray(e.answer) ? e.answer[0] : e.answer)

// What each exercise type actually plays aloud (mirrors components/exercises).
const SPOKEN = {
  introduce: e => [e.tts],
  multiple_choice: e => [e.tts, ...cyrillicOnly(e.choices)],
  image_mc: e => [e.tts, ...cyrillicOnly(e.choices)],
  match_pairs: e => cyrillicOnly((e.pairs || []).flatMap(p => [p.left, p.right])),
  image_match: e => (e.pairs || []).map(p => p.word),
  listen_and_type: e => [e.tts || e.answer],
  speak_sentence: e => [e.tts || e.answer],
  word_bank: e => [e.tts, ...cyrillicOnly(e.words)],
  translate_to_en: e => [e.tts],
  translate_to_bg: e => [e.tts],
  listen_translate: e => [e.tts],
  select_word: e => cyrillicOnly(e.choices),
  dialog: e => [...(e.lines || []).map(l => l.tts || l.text), ...cyrillicOnly(e.choices)],
  image_name: e => [e.tts || firstAnswer(e)],
  image_select: e => [e.prompt || e.tts],
}

export const TYPE_LABELS = {
  introduce: 'Introduction',
  multiple_choice: 'Multiple choice',
  image_mc: 'Picture choice',
  match_pairs: 'Match pairs',
  image_match: 'Picture pairs',
  listen_and_type: 'Listen and type',
  speak_sentence: 'Speak',
  word_bank: 'Word bank',
  translate_to_en: 'Translate',
  translate_to_bg: 'Translate',
  listen_translate: 'Listen and translate',
  select_word: 'Select word',
  dialog: 'Dialog',
  image_name: 'Name the picture',
  image_select: 'Pick the picture',
}

export function phraseKind(key) {
  if (key.length === 1 || LETTER_SOUND.test(key)) return 'letter'
  return key.includes(' ') ? 'sentence' : 'word'
}

function displayText(raw, key) {
  return phraseKind(key) === 'letter' ? key[0].toUpperCase() : raw.trim()
}

// Every distinct spoken text in course order: [{ key, text, kind, uses: [{ level, lesson, lessonId, type }] }]
export function collectPhrases(levels) {
  const byKey = new Map()
  for (const level of levels) {
    for (const lesson of level.lessons || []) {
      for (const ex of lesson.exercises || []) {
        const texts = SPOKEN[ex.type]?.(ex) || []
        for (const raw of texts) {
          if (typeof raw !== 'string' || !CYRILLIC.test(raw)) continue
          const key = voiceKey(raw)
          if (!key) continue
          if (!byKey.has(key)) byKey.set(key, { key, text: displayText(raw, key), kind: phraseKind(key), uses: [] })
          byKey.get(key).uses.push({ level: level.title, lesson: lesson.title, lessonId: lesson.id, type: ex.type })
        }
      }
    }
  }
  return [...byKey.values()]
}
