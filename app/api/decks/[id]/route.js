import { getSession } from '@/lib/auth'
import { updateDeck, deleteDeck } from '@/lib/decks'

export const dynamic = 'force-dynamic'

// PATCH { name?, settings? }
export async function PATCH(req, { params }) {
  try {
    const session = getSession()
    if (!session) return Response.json({ error: 'unauthorized' }, { status: 401 })
    const deck = await updateDeck(session.discordId, params.id, await req.json())
    if (!deck) return Response.json({ error: 'not_found' }, { status: 404 })
    return Response.json({ deck })
  } catch (e) {
    console.error('deck PATCH error:', e)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = getSession()
    if (!session) return Response.json({ error: 'unauthorized' }, { status: 401 })
    const ok = await deleteDeck(session.discordId, params.id)
    return Response.json({ ok }, { status: ok ? 200 : 404 })
  } catch (e) {
    console.error('deck DELETE error:', e)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
