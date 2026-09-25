import { daysBetween } from './days'

// Stepping by a prime coprime with the list length visits every word once
// before repeating, without alphabetical neighbours on consecutive days.
// Home and the wiki both use this, so they show the same word.
const STEP = 101

export function dailyIndex(day, length) {
  const n = daysBetween('2026-01-01', day)
  return (((n * STEP) % length) + length) % length
}
