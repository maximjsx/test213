// Latinized Bulgarian ("shliokavica") to Cyrillic. Letters are mapped by rule,
// then the spellings people mix up (у or ъ, и or й, ж or й) are tried
// against the words the course knows, so "sum" becomes "съм" and not "сум".
import { COMMON_WORDS, SENTENCES } from './typing'
import { WORDS } from './words'
import { VOCAB } from './vocab'

const VOWELS = new Set('aeiouyq')

// Longest first, so "sht" wins over "sh"
const DIGRAPHS = [
  ['sht', 'щ'], ['sch', 'щ'], ['6t', 'щ'],
  ['ch', 'ч'], ['sh', 'ш'], ['zh', 'ж'], ['ts', 'ц'], ['tz', 'ц'],
  ['yu', 'ю'], ['ju', 'ю'], ['iu', 'ию'], ['ya', 'я'], ['ia', 'ия'], ['yo', 'йо'],
]

const LETTERS = {
  a: 'а', b: 'б', c: 'ц', d: 'д', e: 'е', f: 'ф', g: 'г', h: 'х', i: 'и', j: 'ж',
  k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', q: 'я', r: 'р', s: 'с', t: 'т',
  u: 'у', v: 'в', w: 'в', x: 'кс', y: 'ъ', z: 'з', 4: 'ч', 6: 'ш',
}

// Other readings of a letter, tried in order when the rule's word is unknown
const ALTERNATIVES = { у: ['ъ', 'ю'], а: ['ъ'], ъ: ['и', 'й'], и: ['й'], й: ['и'], ж: ['й'], ия: ['я'], ию: ['ю'] }

// Words no rule or lookup gets right
const EXCEPTIONS = { ok: 'окей', okay: 'окей', okey: 'окей', okej: 'окей', pleyr: 'плейър', pleyur: 'плейър' }

const MAX_CHANGES = 2

// Everyday words with ъ or ю that the course may not teach yet
const EXTRA_WORDS = `
български българия българин българка бъда бъдеще бъди във със съм сме път пътя пътят пъти пътуване
къде къща къщата кът мъж мъжа мъже лъв тъп тъжен тъмно тъй сън сънувам сърце събота съсед съжалявам
съгласен също сълза сълзи дъжд дъщеря държава дълъг дълго дъно вълк вълна възраст въпрос въпроси
вътре върху връх гъба гърло гръб гърне зъб зъби кълна лъжа лъжица мълчи мъгла пълен пълно пъпеш
пържени пъстър ръка ръце ръст сладък слънце стъпка тъкмо тъга хълм цъфти чувствам ъгъл
любов любим любима люляк люлка ютия юли юни юнак ключ клюн бюро плюс дюля люти лют
`.split(/\s+/).filter(Boolean)

const KNOWN = new Set([
  ...COMMON_WORDS,
  ...SENTENCES.flatMap(s => s.split(/\s+/)),
  ...WORDS.flatMap(w => w.bg.split(/\s+/)),
  ...Object.keys(VOCAB),
  ...EXTRA_WORDS,
].map(w => w.toLowerCase().replace(/[^а-яѝ-]/g, '')).filter(Boolean))

const isVowel = ch => VOWELS.has(ch)

// One Cyrillic piece per source letter or digraph
function pieces(word) {
  const out = []
  let i = 0
  while (i < word.length) {
    const digraph = DIGRAPHS.find(([latin]) => word.startsWith(latin, i))
    if (digraph) {
      out.push(digraph[1])
      i += digraph[0].length
      continue
    }
    out.push(letter(word, i))
    i += 1
  }
  return out
}

// "y", "i" and "j" read as й next to a vowel: moy, toi, majka
function letter(word, i) {
  const ch = word[i]
  const prev = word[i - 1]
  const next = word[i + 1]
  const afterVowel = prev && isVowel(prev) && prev !== 'u' && prev !== 'y'
  if (ch === 'y' && (afterVowel || (next && isVowel(next)))) return 'й'
  if (ch === 'i' && afterVowel && !next) return 'й'
  if (ch === 'j' && afterVowel && (!next || !isVowel(next))) return 'й'
  return LETTERS[ch] ?? ch
}

// Readings of the word with how many letters differ from the rule's own
function* candidates(parts, from = 0, changes = 0) {
  if (from === parts.length) {
    yield { word: '', changes }
    return
  }
  const options = [parts[from], ...(changes < MAX_CHANGES ? ALTERNATIVES[parts[from]] || [] : [])]
  for (const [n, option] of options.entries()) {
    for (const rest of candidates(parts, from + 1, changes + (n > 0 ? 1 : 0))) yield { word: option + rest.word, changes: rest.changes }
  }
}

function convertWord(word) {
  const lower = word.toLowerCase()
  if (!/[a-z]/.test(lower)) return word
  const parts = pieces(lower)
  let result = EXCEPTIONS[lower]
  if (!result) {
    const known = [...candidates(parts)].filter(c => KNOWN.has(c.word)).sort((a, b) => a.changes - b.changes)
    result = known[0]?.word || parts.join('')
  }
  return matchCase(word, result)
}

function matchCase(source, word) {
  if (source.length > 1 && source === source.toUpperCase() && /[A-Z]/.test(source)) return word.toUpperCase()
  if (/[A-Z]/.test(source[0])) return word[0].toUpperCase() + word.slice(1)
  return word
}

// Words are runs of Latin letters, with 4 and 6 allowed inside them;
// numbers, Cyrillic and punctuation pass through untouched
export function latinToCyrillic(text) {
  return text.replace(/[A-Za-z][A-Za-z46]*|[46](?=[A-Za-z])[A-Za-z46]*/g, convertWord)
}
