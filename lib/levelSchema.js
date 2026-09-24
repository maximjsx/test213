// Checks a level (a topic) for content that would break or confuse a learner:
// missing answers, choices that don't contain the answer, empty pairs. Shared
// by the builder (live warnings) and scripts/add-topic.js (refuses to publish).
//
// Returns { level: string[], lessons: { [lessonIdx]: string[] }, exercises: { [exerciseId]: string[] }, count }

const filled = v => typeof v === 'string' && v.trim() !== ''
const filledList = list => Array.isArray(list) && list.some(filled)
const acceptedAnswers = ex => (Array.isArray(ex.answers) ? ex.answers : [ex.answer]).filter(filled)

const words = text => text.toLowerCase().replace(/[.,!?;:"«»„“]/g, ' ').split(/\s+/).filter(Boolean)

function needs(problems, ok, message) {
  if (!ok) problems.push(message)
}

function checkChoices(problems, ex, label = 'choices') {
  const choices = (ex.choices || []).filter(filled)
  needs(problems, choices.length >= 2, `Needs at least 2 ${label}.`)
  needs(problems, filled(ex.answer), 'No correct answer marked.')
  if (filled(ex.answer)) needs(problems, choices.includes(ex.answer), 'The answer is not one of the choices.')
}

function checkBlank(problems, sentence) {
  needs(problems, filled(sentence), 'Sentence is empty.')
  if (filled(sentence)) needs(problems, sentence.includes('___'), 'Sentence needs a ___ blank.')
}

const RULES = {
  introduce(ex, p) {
    needs(p, filled(ex.display), 'Nothing to display.')
    needs(p, filled(ex.translation) || filled(ex.sublabel), 'Add a translation or a description.')
  },
  multiple_choice(ex, p) {
    needs(p, filled(ex.question), 'Question is empty.')
    checkChoices(p, ex)
  },
  word_bank(ex, p) {
    needs(p, filled(ex.prompt), 'Prompt is empty.')
    needs(p, filled(ex.answer), 'Answer is empty.')
    if (!filled(ex.answer)) return
    const bank = new Set(words((ex.words || []).join(' ')))
    const missing = words(ex.answer).filter(w => !bank.has(w))
    needs(p, !missing.length, `Word tiles are missing: ${missing.join(', ')}.`)
  },
  translate_to_en(ex, p) {
    needs(p, filled(ex.prompt), 'Prompt is empty.')
    needs(p, acceptedAnswers(ex).length > 0, 'No accepted answer.')
  },
  translate_to_bg(ex, p) {
    RULES.translate_to_en(ex, p)
  },
  fill_blank(ex, p) {
    checkBlank(p, ex.sentence)
    needs(p, filled(ex.answer), 'Answer is empty.')
  },
  listen_and_type(ex, p) {
    needs(p, filled(ex.tts) || ex.audio, 'No audio text or recording.')
    needs(p, filled(ex.answer) || filled(ex.tts), 'Answer is empty.')
  },
  speak_sentence(ex, p) {
    needs(p, filled(ex.tts), 'Sentence to speak is empty.')
  },
  listen_translate(ex, p) {
    needs(p, filled(ex.tts) || ex.audio, 'No audio text or recording.')
    needs(p, acceptedAnswers(ex).length > 0, 'No accepted answer.')
  },
  match_pairs(ex, p) {
    const pairs = (ex.pairs || []).filter(pair => filled(pair.left) && filled(pair.right))
    needs(p, pairs.length >= 2, 'Needs at least 2 complete pairs.')
    needs(p, pairs.length === (ex.pairs || []).length, 'Some pairs are half filled.')
  },
  select_word(ex, p) {
    checkBlank(p, ex.sentence)
    checkChoices(p, ex)
  },
  dialog(ex, p) {
    const lines = (ex.lines || []).filter(l => filled(l.text))
    needs(p, lines.length >= 2, 'Needs at least 2 lines.')
    if (filled(ex.prompt) && filledList(ex.choices)) checkChoices(p, ex)
  },
  image_select(ex, p) {
    const options = ex.options || []
    needs(p, options.length >= 2, 'Needs at least 2 pictures.')
    needs(p, options.every(o => o.image), 'Some options have no picture.')
    needs(p, Number.isInteger(ex.answer) && ex.answer < options.length, 'No correct picture marked.')
    needs(p, filled(ex.prompt) || filled(ex.tts) || ex.audio, 'No word to show or say.')
  },
  image_match(ex, p) {
    const pairs = ex.pairs || []
    needs(p, pairs.length >= 2, 'Needs at least 2 pairs.')
    needs(p, pairs.every(pair => pair.image && filled(pair.word)), 'Every pair needs a picture and a word.')
  },
  image_name(ex, p) {
    needs(p, ex.image, 'Picture is missing.')
    needs(p, acceptedAnswers(ex).length > 0, 'No accepted answer.')
  },
  image_mc(ex, p) {
    needs(p, ex.image, 'Picture is missing.')
    checkChoices(p, ex)
  },
}

export function validateExercise(ex) {
  const rule = RULES[ex.type]
  if (!rule) return [`Unknown exercise type "${ex.type}".`]
  const problems = []
  rule(ex, problems)
  return problems
}

export function validateLevel(level) {
  const result = { level: [], lessons: {}, exercises: {}, count: 0 }
  const add = (bucket, key, list) => {
    if (!list.length) return
    if (key === undefined) bucket.push(...list)
    else bucket[key] = list
    result.count += list.length
  }

  add(result.level, undefined, [
    ...(!filled(level.title) ? ['Level has no title.'] : []),
    ...(!level.lessons?.length ? ['Level has no lessons.'] : []),
  ])

  const seenIds = new Set()
  for (const [li, lesson] of (level.lessons || []).entries()) {
    const lessonProblems = []
    needs(lessonProblems, filled(lesson.title), 'Lesson has no title.')
    needs(lessonProblems, lesson.exercises?.length > 0, 'Lesson has no exercises.')
    add(result.lessons, li, lessonProblems)

    for (const ex of lesson.exercises || []) {
      const problems = validateExercise(ex)
      if (seenIds.has(ex.id)) problems.push('Duplicate exercise id.')
      seenIds.add(ex.id)
      add(result.exercises, ex.id, problems)
    }
  }
  return result
}
