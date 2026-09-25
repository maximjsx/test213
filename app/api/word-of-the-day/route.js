import GLOSSARY from '@/data/glossary.json'
import { DAY_PATTERN } from '@/lib/days'
import { dailyIndex } from '@/lib/dailyWord'

// The glossary entry for the learner's local day (?day=YYYY-MM-DD), so the
// home page does not have to ship the whole glossary
export function GET(req) {
  const day = new URL(req.url).searchParams.get('day')
  if (!DAY_PATTERN.test(day || '')) return Response.json({ error: 'bad_day' }, { status: 400 })
  const entry = GLOSSARY[dailyIndex(day, GLOSSARY.length)]
  return Response.json(
    { word: { id: entry.id, bg: entry.bg, en: entry.en, enReviewed: entry.enReviewed, sense: entry.senses[0] } },
    { headers: { 'cache-control': 'public, max-age=3600, s-maxage=86400' } },
  )
}
