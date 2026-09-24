import getClientPromise from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { VOICE_AGREEMENT_VERSION } from '@/lib/voiceovers'

export const dynamic = 'force-dynamic'

// Records that the signed-in user accepted the current voice contribution terms
export async function POST() {
  try {
    const session = getSession()
    if (!session) return Response.json({ error: 'unauthorized' }, { status: 401 })

    const client = await getClientPromise()
    await client.db('bulgario').collection('users').updateOne(
      { discordId: session.discordId },
      { $set: { voiceAgreement: { version: VOICE_AGREEMENT_VERSION, acceptedAt: new Date() } } },
    )
    return Response.json({ ok: true })
  } catch (e) {
    console.error('voice agreement error:', e)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
