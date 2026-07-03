// ─── FUZZY ANSWER CHECKING ────────────────────────────────────────────────────

import { SYNONYM_GROUPS, BARE_CONTRACTIONS } from './synonyms'

function levenshtein(a, b) {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
  return dp[m][n]
}

// English contractions — expand both sides so "I'm" and "I am" always match
const CONTRACTIONS = {
  "i'm": 'i am', "you're": 'you are', "he's": 'he is', "she's": 'she is',
  "it's": 'it is', "we're": 'we are', "they're": 'they are',
  "that's": 'that is', "there's": 'there is', "what's": 'what is',
  "who's": 'who is', "here's": 'here is', "this's": 'this is',
  "isn't": 'is not', "aren't": 'are not', "wasn't": 'was not',
  "weren't": 'were not', "don't": 'do not', "doesn't": 'does not',
  "didn't": 'did not', "won't": 'will not', "can't": 'cannot',
  "couldn't": 'could not', "wouldn't": 'would not', "shouldn't": 'should not',
  "i've": 'i have', "you've": 'you have', "we've": 'we have', "they've": 'they have',
  "i'd": 'i would', "you'd": 'you would', "he'd": 'he would', "she'd": 'she would',
  "i'll": 'i will', "you'll": 'you will', "he'll": 'he will', "she'll": 'she will',
  "we'll": 'we will', "they'll": 'they will',
}

function normalize(str) {
  let s = str.trim().toLowerCase()
  // Expand contractions before stripping apostrophes
  s = s.replace(/\b\w+'\w+\b/g, m => CONTRACTIONS[m] || m)
  // Strip all punctuation (including dashes, quotes, brackets)
  s = s.replace(/[.,!?;:'"«»„""\-–—()\[\]]/g, '')
  return s.replace(/\s+/g, ' ').trim()
}

// ─── GLOBAL SYNONYMS ──────────────────────────────────────────────────────────
// Build lookup indexes from the shared dictionary once, at module load.
const PHRASE_INDEX = new Map()  // normalized phrase -> [all normalized members of its group]
const WORD_CANON = new Map()    // normalized single word -> the group's canonical word

for (const group of SYNONYM_GROUPS) {
  const members = [...new Set(group.map(normalize).filter(Boolean))]
  for (const m of members) {
    const existing = PHRASE_INDEX.get(m) || []
    PHRASE_INDEX.set(m, [...new Set([...existing, ...members])])
  }
  // Single-word members also apply inside longer sentences (multi-word members
  // like "all right" stay phrase-level only, via PHRASE_INDEX above).
  const singleWords = members.filter(m => !m.includes(' '))
  if (singleWords.length > 1) {
    for (const m of singleWords) WORD_CANON.set(m, singleWords[0])
  }
}

// Add every global phrase-synonym of the given normalized answers.
function withPhraseSynonyms(normalizedAnswers) {
  const out = new Set(normalizedAnswers)
  for (const ans of normalizedAnswers) {
    const group = PHRASE_INDEX.get(ans)
    if (group) for (const m of group) out.add(m)
  }
  return [...out]
}

// Swap each word for its group's canonical form so single-word synonyms match.
function canonicalizeWords(normalized) {
  if (!WORD_CANON.size) return normalized
  return normalized.split(' ').map(w => WORD_CANON.get(w) || w).join(' ')
}

// Expand bare / missing-apostrophe forms ("youre" -> "you are").
// Returns the expanded string, or null if nothing was expanded.
function expandBareContractions(normalized) {
  let changed = false
  const out = normalized.split(' ').map(w => {
    if (BARE_CONTRACTIONS[w]) { changed = true; return BARE_CONTRACTIONS[w] }
    return w
  }).join(' ')
  return changed ? out : null
}

// Words with ъ can't be derived character-by-character — list them here
const BUILTIN_MAP = {
  sam: 'съм', sym: 'съм', sum: 'съм',
  mazh: 'мъж', muzh: 'мъж',
}

export function transliterateWord(word, extraMap = {}) {
  const combined = { ...BUILTIN_MAP, ...extraMap }
  // Strip trailing punctuation for lookup, then reattach
  const clean = word.replace(/[^a-zA-Z]/g, '')
  const suffix = word.slice(clean.length)
  if (combined[clean.toLowerCase()]) return combined[clean.toLowerCase()] + suffix
  // Multi-char sequences first (order matters — longer/specific before shorter)
  const multi = [
    ['sht', 'щ'],
    ['ya', 'я'], ['yu', 'ю'], ['yo', 'йо'],
    ['ja', 'я'], ['ju', 'ю'],
    ['zh', 'ж'], ['sh', 'ш'], ['ch', 'ч'],
    ['ts', 'ц'], ['tz', 'ц'],
  ]
  let result = clean.toLowerCase()
  for (const [rom, cyr] of multi) result = result.split(rom).join(cyr)
  const single = {
    a:'а',b:'б',v:'в',g:'г',d:'д',e:'е',z:'з',i:'и',y:'й',
    k:'к',l:'л',m:'м',n:'н',o:'о',p:'п',r:'р',s:'с',t:'т',
    u:'у',f:'ф',h:'х',c:'ц',x:'кс',w:'в',j:'ж',q:'я',
  }
  return result.split('').map(c => single[c] || c).join('') + suffix
}

export function transliterateInput(input, extraMap = {}) {
  return input.split(/\s+/)
    .map(w => transliterateWord(w, extraMap))
    .join(' ')
}

// Returns { correct, close, message }
// correctAnswer can be a string or an array of accepted strings
export function checkAnswer(userInput, correctAnswer, options = {}) {
  const { allowTranslit = false, translitMap = {} } = options
  const user = normalize(userInput)

  // Support both single answer and array of accepted answers, then fold in any
  // global phrase synonyms so we don't have to list them per exercise.
  const answers = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer]
  const corrects = withPhraseSynonyms(answers.map(normalize).filter(Boolean))
  const primary = normalize(answers[0])
  const primaryRaw = answers[0]

  if (!user) return { correct: false, close: false, message: '' }

  // Exact / phrase-synonym match
  if (corrects.some(c => user === c)) return { correct: true, close: false }

  // Single-word synonym swaps inside the sentence (e.g. good ⇄ fine, педал ⇄ педераст)
  const userCanon = canonicalizeWords(user)
  if (WORD_CANON.size && corrects.some(c => canonicalizeWords(c) === userCanon)) {
    return { correct: true, close: false }
  }

  // Try transliterated (Roman letters typed for a Bulgarian answer)
  if (allowTranslit) {
    const tlit = normalize(transliterateInput(userInput, translitMap))
    if (corrects.some(c => tlit === c)) return { correct: true, close: false }
    const tlitCanon = canonicalizeWords(tlit)
    if (WORD_CANON.size && corrects.some(c => canonicalizeWords(c) === tlitCanon)) {
      return { correct: true, close: false }
    }
  }

  // Missing / bare apostrophe ("youre" -> "you are"): accept, but nudge
  const bare = expandBareContractions(user)
  if (bare) {
    const bareCanon = canonicalizeWords(bare)
    if (corrects.some(c => c === bare || canonicalizeWords(c) === bareCanon)) {
      return { correct: true, close: false, message: `Correct! Watch the apostrophe: "${primaryRaw}"` }
    }
  }

  // Typo tolerance: 1 edit per 5 chars, min 1 — measured against each accepted answer
  const isClose = corrects.some(c => levenshtein(user, c) <= Math.max(1, Math.floor(c.length / 5)))
  if (isClose) {
    return { correct: false, close: true, message: `Almost! Correct: "${primaryRaw}"` }
  }

  // Most words match for longer sentences (tile mode uses this — kept intentionally narrow)
  const userWords = new Set(user.split(' '))
  const primaryWords = primary.split(' ')
  if (primaryWords.length > 2 && user.split(' ').length === primaryWords.length) {
    const matched = primaryWords.filter(w => userWords.has(w)).length
    if (matched / primaryWords.length >= 0.75) {
      return { correct: false, close: true, message: `Close! Correct: "${primaryRaw}"` }
    }
  }

  return { correct: false, close: false, message: '' }
}

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
