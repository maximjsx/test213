import crypto from 'crypto'
import getClientPromise from '@/lib/mongodb'
import { currentBuilderStatus } from '@/lib/builderAccess'
import { uploadFile, storageConfigured, publicFileUrl } from '@/lib/storage'
import { COURSE_PHRASES, voiceoversCollection, approveVoiceover, dropOwnPending, hasVoiceAgreement } from '@/lib/voiceovers'

const MAX_BYTES = 3 * 1024 * 1024
const MAX_PENDING = 500

// POST /api/voiceovers/upload?key=<voiceKey>, body is the audio bytes.
// Any signed-in user may submit; takes from reviewers go live straight away.
export async function POST(req) {
  try {
    const status = await currentBuilderStatus()
    if (!status.loggedIn) return Response.json({ error: 'unauthorized' }, { status: 401 })
    if (!storageConfigured()) return Response.json({ error: 'storage_not_configured' }, { status: 503 })

    const client = await getClientPromise()
    const user = await client.db('bulgario').collection('users')
      .findOne({ discordId: status.discordId }, { projection: { username: 1, discordName: 1, voiceAgreement: 1 } })
    if (!hasVoiceAgreement(user)) return Response.json({ error: 'agreement_required' }, { status: 403 })

    const key = new URL(req.url).searchParams.get('key') || ''
    const phrase = COURSE_PHRASES.get(key)
    if (!phrase) return Response.json({ error: 'unknown_phrase' }, { status: 400 })

    const buf = Buffer.from(await req.arrayBuffer())
    if (!buf.length) return Response.json({ error: 'empty_body' }, { status: 400 })
    if (buf.length > MAX_BYTES) return Response.json({ error: 'too_large' }, { status: 413 })

    const col = await voiceoversCollection()
    if (!status.allowed) {
      const pending = await col.countDocuments({ by: status.discordId, status: 'pending' })
      if (pending >= MAX_PENDING) return Response.json({ error: 'too_many_pending' }, { status: 429 })
    }

    const mime = req.headers.get('content-type') || 'application/octet-stream'
    const hash = crypto.createHash('sha1').update(key).digest('hex').slice(0, 12)
    const file = await uploadFile(buf, mime, { compress: true, bitrate: '64k', filename: `vo--${hash}` })

    await dropOwnPending(col, key, status.discordId)
    const doc = {
      key,
      text: phrase.text,
      fileId: file.id,
      url: publicFileUrl(file.id),
      by: status.discordId,
      byName: user?.username || user?.discordName || 'someone',
      status: 'pending',
      createdAt: new Date(),
    }
    const { insertedId } = await col.insertOne(doc)
    doc._id = insertedId
    if (status.allowed) {
      await approveVoiceover(col, doc)
      doc.status = 'approved'
    }

    const { _id, fileId, ...rest } = doc
    return Response.json({ voiceover: { id: String(_id), ...rest } })
  } catch (e) {
    console.error('voiceover upload error:', e)
    return Response.json({ error: 'upload_failed' }, { status: 502 })
  }
}

export const maxDuration = 60
