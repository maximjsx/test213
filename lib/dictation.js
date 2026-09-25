import { transliterateInput } from './checker'

const norm = w => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
const words = text => text.split(/\s+/).filter(w => norm(w))

// Marks each word of the line as heard or missed, using the longest common
// subsequence so one missed word does not shift every word after it.
// Latin typing is transliterated first.
export function markDictation(expected, typed) {
  const target = words(expected)
  const guess = words(transliterateInput(typed)).map(norm)
  const a = target.map(norm)
  const lcs = Array.from({ length: a.length + 1 }, () => new Array(guess.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = guess.length - 1; j >= 0; j--)
      lcs[i][j] = a[i] === guess[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1])

  const marks = target.map(word => ({ word, ok: false }))
  for (let i = 0, j = 0; i < a.length && j < guess.length;) {
    if (a[i] === guess[j]) { marks[i].ok = true; i++; j++ }
    else if (lcs[i + 1][j] >= lcs[i][j + 1]) i++
    else j++
  }
  return marks
}
