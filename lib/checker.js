// ─── FUZZY ANSWER CHECKING ────────────────────────────────────────────────────

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
  // Multi-char sequences first
  const multi = [
    ['sht', 'щ'], ['ya', 'я'], ['yu', 'ю'], ['yo', 'йо'],
    ['zh', 'ж'], ['sh', 'ш'], ['ch', 'ч'], ['ts', 'ц'], ['tz', 'ц'],
  ]
  let result = clean.toLowerCase()
  for (const [rom, cyr] of multi) result = result.split(rom).join(cyr)
  const single = {
    a:'а',b:'б',v:'в',g:'г',d:'д',e:'е',z:'з',i:'и',y:'й',
    k:'к',l:'л',m:'м',n:'н',o:'о',p:'п',r:'р',s:'с',t:'т',
    u:'у',f:'ф',h:'х',c:'к',x:'кс',w:'в',j:'й',q:'к',
  }
  return result.split('').map(c => single[c] || c).join('') + suffix
}

export function transliterateInput(input, extraMap = {}) {
  return input.split(/\s+/)
    .map(w => transliterateWord(w, extraMap))
    .join(' ')
}

// Returns { correct, close, message }
export function checkAnswer(userInput, correctAnswer, options = {}) {
  const { allowTranslit = false, translitMap = {} } = options
  const user = normalize(userInput)
  const correct = normalize(correctAnswer)
  if (!user) return { correct: false, close: false, message: '' }
  if (user === correct) return { correct: true, close: false }

  // Try transliterated
  if (allowTranslit) {
    const tlit = normalize(transliterateInput(userInput, translitMap))
    if (tlit === correct) return { correct: true, close: false }
  }

  // Typo tolerance: 1 per 5 chars, min 1
  const maxDist = Math.max(1, Math.floor(correct.length / 5))
  const dist = levenshtein(user, correct)
  if (dist <= maxDist) {
    return { correct: false, close: true, message: `Almost! Correct: "${correctAnswer}"` }
  }

  // Most words match for longer sentences (tile mode uses this — kept intentionally narrow)
  const userWords = new Set(user.split(' '))
  const correctWords = correct.split(' ')
  if (correctWords.length > 2 && user.split(' ').length === correctWords.length) {
    const matched = correctWords.filter(w => userWords.has(w)).length
    if (matched / correctWords.length >= 0.75) {
      return { correct: false, close: true, message: `Close! Correct: "${correctAnswer}"` }
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
