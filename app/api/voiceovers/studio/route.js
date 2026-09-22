import { currentBuilderStatus } from '@/lib/builderAccess'
import { voiceoversCollection } from '@/lib/voiceovers'

export const dynamic = 'force-dynamic'

const PUBLIC_FIELDS = { key: 1, text: 1, url: 1, by: 1, byName: 1, status: 1, createdAt: 1 }

// Recording state for the voice studio. Reviewers (builder allowlist) also get
// everyone's pending takes; others only see their own.
export async function GET() {
  try {
    const status = await currentBuilderStatus()
    if (!status.loggedIn) return Response.json({ loggedIn: false })

    const col = await voiceoversCollection()
    const filter = status.allowed
      ? {}
      : { $or: [{ status: 'approved' }, { by: status.discordId }] }
    const docs = await col.find(filter, { projection: PUBLIC_FIELDS }).sort({ createdAt: 1 }).toArray()

    return Response.json({
      loggedIn: true,
      canReview: status.allowed,
      myId: status.discordId,
      voiceovers: docs.map(({ _id, ...d }) => ({ id: String(_id), ...d })),
    })
  } catch (e) {
    console.error('voiceovers studio error:', e)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
