// Text helpers shared by the content import scripts.

// Bulgarian Streamlined System, the official romanisation
const LATIN = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh',
  щ: 'sht', ъ: 'a', ь: 'y', ю: 'yu', я: 'ya',
}

export function transliterate(text) {
  return [...text].map(ch => {
    const lower = ch.toLowerCase()
    return LATIN[lower] ?? ch
  }).join('')
}

export function slugify(text) {
  return text.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, ' ').trim().replace(/[\s_-]+/g, '-').replace(/^-|-$/g, '')
}

// Latin letters that look identical to Cyrillic ones, as they slip into
// Cyrillic words typed on a mixed keyboard ("ягодa" with a Latin a)
const LOOKALIKES = { a: 'а', e: 'е', o: 'о', p: 'р', c: 'с', x: 'х', y: 'у', A: 'А', B: 'В', E: 'Е', K: 'К', M: 'М', H: 'Н', O: 'О', P: 'Р', C: 'С', T: 'Т', X: 'Х' }

export function fixHomoglyphs(text) {
  return text.replace(/[\p{L}]+/gu, word => {
    if (!/[Ѐ-ӿ]/.test(word) || !/[A-Za-z]/.test(word)) return word
    return [...word].map(ch => LOOKALIKES[ch] ?? ch).join('')
  })
}
