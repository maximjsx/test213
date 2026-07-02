import getClientPromise from '@/lib/mongodb'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const client = await getClientPromise()
    const users = client.db('bulgario').collection('users')

    const top = await users
      .find({ xp: { $gt: 0 } }, { projection: { _id: 0, username: 1, xp: 1, streak: 1, discordId: 1, avatar: 1 } })
      .sort({ xp: -1 })
      .limit(50)
      .toArray()

    const session = getSession()
    let me = null
    if (session) {
      const self = await users.findOne(
        { discordId: session.discordId },
        { projection: { _id: 0, username: 1, xp: 1 } }
      )
      if (self) {
        const above = await users.countDocuments({ xp: { $gt: self.xp || 0 } })
        me = { username: self.username, xp: self.xp || 0, rank: above + 1 }
      }
    }

    return Response.json({
      top: top.map((u, i) => ({
        rank: i + 1,
        username: u.username,
        xp: u.xp,
        streak: u.streak || 0,
        isMe: session ? u.discordId === session.discordId : false,
        avatarUrl: u.avatar ? `https://cdn.discordapp.com/avatars/${u.discordId}/${u.avatar}.png?size=64` : null,
      })),
      me,
    })
  } catch (e) {
    console.error('leaderboard error:', e)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
