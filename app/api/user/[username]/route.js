import getClientPromise from '@/lib/mongodb'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Public profile data + relationship to the signed-in viewer
export async function GET(req, { params }) {
  try {
    const client = await getClientPromise()
    const db = client.db('bulgario')

    const target = await db.collection('users').findOne(
      { usernameLower: String(params.username || '').toLowerCase() },
      { projection: { _id: 0, discordId: 1, username: 1, avatar: 1, createdAt: 1, xp: 1, streak: 1, lessonsCount: 1 } }
    )
    if (!target) return Response.json({ error: 'not_found' }, { status: 404 })

    let relationship = 'none' // none | self | friends | incoming | outgoing | signed_out
    const session = getSession()
    if (!session) {
      relationship = 'signed_out'
    } else if (session.discordId === target.discordId) {
      relationship = 'self'
    } else {
      const rel = await db.collection('friends').findOne({
        $or: [
          { from: session.discordId, to: target.discordId },
          { from: target.discordId, to: session.discordId },
        ],
      })
      if (rel?.status === 'accepted') relationship = 'friends'
      else if (rel?.status === 'pending') relationship = rel.from === session.discordId ? 'outgoing' : 'incoming'
    }

    return Response.json({
      user: {
        username: target.username,
        avatarUrl: target.avatar ? `https://cdn.discordapp.com/avatars/${target.discordId}/${target.avatar}.png?size=128` : null,
        createdAt: target.createdAt,
        xp: target.xp || 0,
        streak: target.streak || 0,
        lessonsCount: target.lessonsCount || 0,
      },
      relationship,
    })
  } catch (e) {
    console.error('user route error:', e)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
