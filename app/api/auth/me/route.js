import getClientPromise from '@/lib/mongodb'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = getSession()
    if (!session) return Response.json({ user: null })

    const client = await getClientPromise()
    const user = await client.db('bulgario').collection('users').findOne(
      { discordId: session.discordId },
      { projection: { _id: 0, discordId: 1, discordName: 1, avatar: 1, username: 1, createdAt: 1, xp: 1, streak: 1, lessonsCount: 1 } }
    )
    if (!user) return Response.json({ user: null })

    return Response.json({
      user: {
        ...user,
        avatarUrl: user.avatar
          ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png?size=128`
          : null,
      },
    })
  } catch (e) {
    console.error('me route error:', e)
    return Response.json({ user: null }, { status: 500 })
  }
}
