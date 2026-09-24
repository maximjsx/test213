import { WORDS } from './words'
import { VOCAB } from './vocab'
import { cardKey } from './srs'

// English for a Bulgarian word or phrase from what the site already knows:
// course words first, then the tooltip vocabulary. Empty when unknown.
const COURSE = new Map(WORDS.map(w => [cardKey(w.bg), w.en]))
const TOOLTIPS = new Map(Object.entries(VOCAB).map(([bg, en]) => [cardKey(bg), en]))

export function lookupEnglish(bg) {
  const key = cardKey(bg || '')
  return COURSE.get(key) || TOOLTIPS.get(key) || ''
}
