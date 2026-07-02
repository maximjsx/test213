import getClientPromise from '@/lib/mongodb'
import { getSession } from '@/lib/auth'

export async function POST(req) {
  try {
    const session = getSession()
    if (!session) return Response.json({ error: 'unauthorized' }, { status: 401 })

    const { username } = await req.json()
    if (typeof username !== 'string' || !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return Response.json({ error: 'Username must be 3 to 20 characters, letters, numbers and _ only' }, { status: 400 })
    }

    const client = await getClientPromise()
    const users = client.db('bulgario').collection('users')

    const taken = await users.findOne({
      usernameLower: username.toLowerCase(),
      discordId: { $ne: session.discordId },
    })
    if (taken) return Response.json({ error: 'That username is already taken' }, { status: 409 })

    await users.updateOne(
      { discordId: session.discordId },
      { $set: { username, usernameLower: username.toLowerCase() } }
    )
    return Response.json({ ok: true, username })
  } catch (e) {
    console.error('username POST error:', e)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
