const CYRILLIC = /[Ѐ-ӿ]/

// For the lang attribute, so screen readers read Bulgarian with a Bulgarian voice
export function langOf(text) {
  return CYRILLIC.test(text || '') ? 'bg' : undefined
}
