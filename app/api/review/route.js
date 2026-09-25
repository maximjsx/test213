import { getSession } from '@/lib/auth'
import { reviewQueue, recordReview, DAY_PATTERN } from '@/lib/decks'
import { runAction, resolveToday } from '@/lib/progressStore'

export const dynamic = 'force-dynamic'

// GET ?day=YYYY-MM-DD&deck=<id>: today's queue; no deck means every deck
export async function GET(req) {
  try {
    const session = getSession()
    if (!session) return Response.json({ error: 'unauthorized' }, { status: 401 })
    const params = new URL(req.url).searchParams
    const day = params.get('day')
    if (!DAY_PATTERN.test(day || '')) return Response.json({ error: 'bad_day' }, { status: 400 })
    return Response.json({ cards: await reviewQueue(session.discordId, params.get('deck'), day) })
  } catch (e) {
    console.error('review GET error:', e)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}

// POST { cardId, grade: 1-4, day }. The server schedules with its own clock.
export async function POST(req) {
  try {
    const session = getSession()
    if (!session) return Response.json({ error: 'unauthorized' }, { status: 401 })
    const { cardId, grade, day } = await req.json()
    if (![1, 2, 3, 4].includes(grade) || !DAY_PATTERN.test(day || '') || typeof cardId !== 'string') {
      return Response.json({ error: 'bad_request' }, { status: 400 })
    }
    const result = await recordReview(session.discordId, cardId, grade, day)
    if (result.error) return Response.json(result, { status: 404 })
    // The reward is decided here, from the review just stored, never by the client
    const reward = await runAction(session.discordId, { type: 'reviewsDone', count: 1 }, resolveToday(day))
    return Response.json({ ...result, progress: reward.state })
  } catch (e) {
    console.error('review POST error:', e)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
