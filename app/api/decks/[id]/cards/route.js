import { getSession } from '@/lib/auth'
import { listCards, addCard } from '@/lib/decks'

export const dynamic = 'force-dynamic'

export async function GET(req, { params }) {
  try {
    const session = getSession()
    if (!session) return Response.json({ error: 'unauthorized' }, { status: 401 })
    return Response.json({ cards: await listCards(session.discordId, params.id) })
  } catch (e) {
    console.error('cards GET error:', e)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}

// POST { bg, en, note?, source?: { kind, ref } }. A word already in the deck
// comes back with duplicate: true instead of being added twice.
export async function POST(req, { params }) {
  try {
    const session = getSession()
    if (!session) return Response.json({ error: 'unauthorized' }, { status: 401 })
    const result = await addCard(session.discordId, params.id, await req.json())
    if (result.error) return Response.json(result, { status: result.error === 'no_deck' ? 404 : 400 })
    return Response.json(result, { status: result.duplicate ? 200 : 201 })
  } catch (e) {
    console.error('cards POST error:', e)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
