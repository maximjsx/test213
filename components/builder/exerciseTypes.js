import { DEFAULT_VOICE } from '../../lib/voices'

// Every exercise type the builder can create. The player side lives in
// components/ExerciseRunner.js (EXERCISE_MAP); a new type needs an entry in both.
export const uid = () => Math.random().toString(36).slice(2, 9)

export const EXERCISE_TYPES = [
  { type: 'introduce',        label: 'Introduce',          icon: '📖', desc: 'Show a new word or phrase with translation' },
  { type: 'multiple_choice',  label: 'Multiple Choice',    icon: '🔘', desc: 'Pick the correct answer from options' },
  { type: 'word_bank',        label: 'Word Bank',          icon: '🧩', desc: 'Tap words to arrange a sentence' },
  { type: 'translate_to_en',  label: 'Translate to English', icon: '🇬🇧', desc: 'Type the English meaning' },
  { type: 'translate_to_bg',  label: 'Translate to Bulgarian', icon: '🇧🇬', desc: 'Type the Bulgarian translation' },
  { type: 'fill_blank',       label: 'Fill in the Blank',  icon: '✏️', desc: 'Complete the missing word in a sentence' },
  { type: 'listen_and_type',  label: 'Listen & Type',      icon: '🎧', desc: 'Hear the audio and type what you hear' },
  { type: 'speak_sentence',   label: 'Speak Sentence',     icon: '🎤', desc: 'Say the sentence aloud (speech recognition)' },
  { type: 'match_pairs',      label: 'Match Pairs',        icon: '🔗', desc: 'Connect each word to its translation' },
  { type: 'listen_translate', label: 'Listen & Translate', icon: '👂', desc: 'Hear audio and type the English meaning' },
  { type: 'select_word',     label: 'Select the Word',   icon: '🎯', desc: 'Tap the correct word to fill the blank in a sentence' },
  { type: 'dialog',          label: 'Dialog',             icon: '💬', desc: 'Watch a conversation play out, then answer a question about it' },
  { type: 'image_select',    label: 'Pick the Image',     icon: '🖼️', desc: 'Hear a Bulgarian word, tap the matching picture' },
  { type: 'image_match',     label: 'Match Images',       icon: '🧩', desc: 'Connect each picture to its Bulgarian word' },
  { type: 'image_name',      label: 'Name the Picture',   icon: '📷', desc: 'Show a picture, learner types the Bulgarian word' },
  { type: 'image_mc',        label: 'Image Multiple Choice', icon: '🏞️', desc: 'Show a picture, pick the correct Bulgarian word' },
]

export function defaultExercise(type) {
  const id = 'ex_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)
  switch (type) {
    case 'introduce':        return { type, id, label: 'NEW WORD', display: '', sublabel: '', translation: '', tts: '' }
    case 'multiple_choice':  return { type, id, question: '', choices: ['', '', ''], answer: '', tts: '' }
    case 'word_bank':        return { type, id, direction: 'to_bg', prompt: '', tts: '', words: ['', '', '', ''], answer: '' }
    case 'translate_to_en':  return { type, id, prompt: '', answers: [''], hint: '', tts: '' }
    case 'translate_to_bg':  return { type, id, prompt: '', answers: [''] }
    case 'fill_blank':       return { type, id, sentence: '', answer: '', hint: '' }
    case 'listen_and_type':  return { type, id, tts: '', answer: '' }
    case 'speak_sentence':   return { type, id, tts: '' }
    case 'match_pairs':      return { type, id, instruction: 'Match each pair:', pairs: [{ left: '', right: '' }, { left: '', right: '' }] }
    case 'listen_translate': return { type, id, tts: '', answers: [''] }
    case 'select_word':     return { type, id, sentence: '', choices: ['', '', ''], answer: '' }
    case 'dialog':          return { type, id, speakers: [{ id: 'A', name: '', voice: DEFAULT_VOICE }, { id: 'B', name: '', voice: DEFAULT_VOICE }], lines: [{ speaker: 'A', text: '', tts: '', audio: null }, { speaker: 'B', text: '', tts: '', audio: null }], prompt: '', answer: '', choices: [] }
    case 'image_select':    return { type, id, prompt: '', tts: '', audio: null, options: [{ key: uid(), image: null }, { key: uid(), image: null }], answer: 0 }
    case 'image_match':     return { type, id, instruction: 'Match each picture to its word:', pairs: [{ key: uid(), word: '', image: null }, { key: uid(), word: '', image: null }] }
    case 'image_name':      return { type, id, image: null, answers: [''], tts: '', audio: null, hint: '' }
    case 'image_mc':        return { type, id, image: null, question: '', choices: ['', '', ''], answer: '', tts: '', audio: null }
    default: return { type, id }
  }
}

export function defaultLesson(levelId) {
  return { id: levelId + '_l' + Date.now(), title: 'New Lesson', coins: 10, exercises: [] }
}

export function exerciseSummary(ex) {
  switch (ex.type) {
    case 'introduce':        return ex.display || ''
    case 'multiple_choice':  return ex.question || ''
    case 'word_bank':        return ex.prompt ? `"${ex.prompt}" : ${ex.answer || '?'}` : ''
    case 'translate_to_en':  return ex.prompt || ''
    case 'translate_to_bg':  return ex.prompt || ''
    case 'fill_blank':       return ex.sentence || ''
    case 'listen_and_type':  return ex.tts || ''
    case 'speak_sentence':   return ex.tts || ''
    case 'match_pairs':      return ex.pairs?.map(p => p.left).filter(Boolean).join(', ') || ''
    case 'listen_translate': return ex.tts || ''
    case 'select_word':     return ex.sentence || ''
    case 'dialog':          return ex.lines?.map(l => l.text).filter(Boolean).join(' / ') || ''
    case 'image_select':    return ex.prompt || ex.tts || ''
    case 'image_match':     return ex.pairs?.map(p => p.word).filter(Boolean).join(', ') || ''
    case 'image_name':      return (ex.answers && ex.answers[0]) || ''
    case 'image_mc':        return ex.question || ex.answer || ''
    default: return ''
  }
}
