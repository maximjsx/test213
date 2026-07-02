import getClientPromise from '@/lib/mongodb'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function publicUser(u) {
  return {
    username: u.username,
    xp: u.xp || 0,
    streak: u.streak || 0,
    avatarUrl: u.avatar ? `https://cdn.discordapp.com/avatars/${u.discordId}/${u.avatar}.png?size=64` : null,
  }
}

// Friends list + pending requests for the signed-in user
export async function GET() {
  try {
    const session = getSession()
    if (!session) return Response.json({ error: 'unauthorized' }, { status: 401 })
    const me = session.discordId

    const client = await getClientPromise()
    const db = client.db('bulgario')

    const rels = await db.collection('friends')
      .find({ $or: [{ from: me }, { to: me }] })
      .toArray()

    const otherIds = [...new Set(rels.map(r => (r.from === me ? r.to : r.from)))]
    const others = await db.collection('users')
      .find({ discordId: { $in: otherIds } }, { projection: { _id: 0, discordId: 1, username: 1, avatar: 1, xp: 1, streak: 1 } })
      .toArray()
    const byId = Object.fromEntries(others.map(u => [u.discordId, u]))

    const friends = [], incoming = [], outgoing = []
    for (const r of rels) {
      const other = byId[r.from === me ? r.to : r.from]
      if (!other) continue
      if (r.status === 'accepted') friends.push(publicUser(other))
      else if (r.to === me) incoming.push(publicUser(other))
      else outgoing.push(publicUser(other))
    }
    friends.sort((a, b) => b.xp - a.xp)

    return Response.json({ friends, incoming, outgoing })
  } catch (e) {
    console.error('friends GET error:', e)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}

// Act on a friendship: { username, action: request | accept | decline | cancel | remove }
export async function POST(req) {
  try {
    const session = getSession()
    if (!session) return Response.json({ error: 'unauthorized' }, { status: 401 })
    const me = session.discordId

    const { username, action } = await req.json()
    if (!['request', 'accept', 'decline', 'cancel', 'remove'].includes(action)) {
      return Response.json({ error: 'bad_action' }, { status: 400 })
    }

    const client = await getClientPromise()
    const db = client.db('bulgario')

    const target = await db.collection('users').findOne(
      { usernameLower: String(username || '').toLowerCase() },
      { projection: { discordId: 1 } }
    )
    if (!target) return Response.json({ error: 'not_found' }, { status: 404 })
    const them = target.discordId
    if (them === me) return Response.json({ error: 'self' }, { status: 400 })

    const friends = db.collection('friends')
    const pairQuery = { $or: [{ from: me, to: them }, { from: them, to: me }] }
    const existing = await friends.findOne(pairQuery)

    if (action === 'request') {
      if (existing?.status === 'accepted') return Response.json({ relationship: 'friends' })
      if (existing?.status === 'pending') {
        // They already asked us: sending back counts as accepting
        if (existing.from === them) {
          await friends.updateOne({ _id: existing._id }, { $set: { status: 'accepted', acceptedAt: new Date() } })
          return Response.json({ relationship: 'friends' })
        }
        return Response.json({ relationship: 'outgoing' })
      }
      const sent = await friends.countDocuments({ from: me, status: 'pending' })
      if (sent >= 50) return Response.json({ error: 'too_many_pending' }, { status: 429 })
      await friends.insertOne({ from: me, to: them, status: 'pending', createdAt: new Date() })
      return Response.json({ relationship: 'outgoing' })
    }

    if (action === 'accept') {
      const res = await friends.updateOne(
        { from: them, to: me, status: 'pending' },
        { $set: { status: 'accepted', acceptedAt: new Date() } }
      )
      return Response.json({ relationship: res.modifiedCount ? 'friends' : 'none' })
    }

    if (action === 'decline') {
      await friends.deleteOne({ from: them, to: me, status: 'pending' })
      return Response.json({ relationship: 'none' })
    }

    if (action === 'cancel') {
      await friends.deleteOne({ from: me, to: them, status: 'pending' })
      return Response.json({ relationship: 'none' })
    }

    // remove
    await friends.deleteMany({ ...pairQuery, status: 'accepted' })
    return Response.json({ relationship: 'none' })
  } catch (e) {
    console.error('friends POST error:', e)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
