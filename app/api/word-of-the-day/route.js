import GLOSSARY from '@/data/glossary.json'
import { DAY_PATTERN, daysBetween } from '@/lib/days'

// Stepping by a prime coprime with the list length visits every word once
// before repeating, without alphabetical neighbours on consecutive days
const STEP = 101

// The glossary entry for the learner's local day (?day=YYYY-MM-DD), so the
// home page does not have to ship the whole glossary
export function GET(req) {
  const day = new URL(req.url).searchParams.get('day')
  if (!DAY_PATTERN.test(day || '')) return Response.json({ error: 'bad_day' }, { status: 400 })
  const n = daysBetween('2026-01-01', day)
  const entry = GLOSSARY[(((n * STEP) % GLOSSARY.length) + GLOSSARY.length) % GLOSSARY.length]
  return Response.json(
    { word: { id: entry.id, bg: entry.bg, en: entry.en, enReviewed: entry.enReviewed, sense: entry.senses[0] } },
    { headers: { 'cache-control': 'public, max-age=3600, s-maxage=86400' } },
  )
}
