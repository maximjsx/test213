import { getSession } from '@/lib/auth'
import { updateCard, deleteCard } from '@/lib/decks'

export const dynamic = 'force-dynamic'

// PATCH { bg?, en?, note?, suspended?, deckId? }
export async function PATCH(req, { params }) {
  try {
    const session = getSession()
    if (!session) return Response.json({ error: 'unauthorized' }, { status: 401 })
    const result = await updateCard(session.discordId, params.id, await req.json())
    if (result.error) return Response.json(result, { status: result.error === 'not_found' ? 404 : 400 })
    return Response.json(result)
  } catch (e) {
    console.error('card PATCH error:', e)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = getSession()
    if (!session) return Response.json({ error: 'unauthorized' }, { status: 401 })
    const ok = await deleteCard(session.discordId, params.id)
    return Response.json({ ok }, { status: ok ? 200 : 404 })
  } catch (e) {
    console.error('card DELETE error:', e)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
