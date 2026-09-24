import { getSession } from '@/lib/auth'
import { listDecks, createDeck, DAY_PATTERN } from '@/lib/decks'

export const dynamic = 'force-dynamic'

// GET ?day=YYYY-MM-DD: decks with today's new and due counts
export async function GET(req) {
  try {
    const session = getSession()
    if (!session) return Response.json({ error: 'unauthorized' }, { status: 401 })
    const day = new URL(req.url).searchParams.get('day')
    if (!DAY_PATTERN.test(day || '')) return Response.json({ error: 'bad_day' }, { status: 400 })
    return Response.json(await listDecks(session.discordId, day))
  } catch (e) {
    console.error('decks GET error:', e)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}

// POST { name }
export async function POST(req) {
  try {
    const session = getSession()
    if (!session) return Response.json({ error: 'unauthorized' }, { status: 401 })
    const { name } = await req.json()
    const result = await createDeck(session.discordId, name)
    return Response.json(result, { status: result.error ? 409 : 201 })
  } catch (e) {
    console.error('decks POST error:', e)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
