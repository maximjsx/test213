import { ObjectId } from 'mongodb'
import { currentBuilderStatus } from '@/lib/builderAccess'
import { voiceoversCollection, approveVoiceover, removeVoiceover } from '@/lib/voiceovers'

// POST { id, action: 'approve' | 'reject' }. Reviewers may act on any take;
// anyone may withdraw their own.
export async function POST(req) {
  try {
    const status = await currentBuilderStatus()
    if (!status.loggedIn) return Response.json({ error: 'unauthorized' }, { status: 401 })

    const { id, action } = await req.json()
    if (!ObjectId.isValid(id) || !['approve', 'reject'].includes(action)) {
      return Response.json({ error: 'bad_request' }, { status: 400 })
    }

    const col = await voiceoversCollection()
    const doc = await col.findOne({ _id: new ObjectId(id) })
    if (!doc) return Response.json({ error: 'not_found' }, { status: 404 })

    const ownPending = doc.by === status.discordId && doc.status === 'pending'
    if (!status.allowed && !(action === 'reject' && ownPending)) {
      return Response.json({ error: 'forbidden' }, { status: 403 })
    }

    if (action === 'approve') await approveVoiceover(col, doc)
    else await removeVoiceover(col, doc._id)
    return Response.json({ ok: true })
  } catch (e) {
    console.error('voiceover review error:', e)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
