import getClientPromise from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { coinsSince, weekStartKey } from '@/lib/coins'
import { FRIEND_QUEST_GOAL, FRIEND_QUEST_REWARD } from '@/lib/goals'

export const dynamic = 'force-dynamic'

const USER_PROJECTION = { _id: 0, discordId: 1, username: 1, avatar: 1, friendQuest: 1, 'progress.coinsByDay': 1 }

function avatarUrl(u) {
  return u.avatar ? `https://cdn.discordapp.com/avatars/${u.discordId}/${u.avatar}.png?size=64` : null
}

async function friendIds(db, me) {
  const rels = await db.collection('friends')
    .find({ status: 'accepted', $or: [{ from: me }, { to: me }] })
    .toArray()
  return rels.map(r => (r.from === me ? r.to : r.from))
}

// This week's shared goal with one friend. If you have not picked a partner
// but a friend picked you, you are teamed up with them automatically.
export async function GET() {
  try {
    const session = getSession()
    if (!session) return Response.json({ error: 'unauthorized' }, { status: 401 })
    const me = session.discordId
    const week = weekStartKey()

    const client = await getClientPromise()
    const db = client.db('bulgario')
    const users = db.collection('users')

    const ids = await friendIds(db, me)
    const [meUser, friends] = await Promise.all([
      users.findOne({ discordId: me }, { projection: USER_PROJECTION }),
      users.find({ discordId: { $in: ids } }, { projection: USER_PROJECTION }).toArray(),
    ])

    const chosenId = meUser?.friendQuest?.week === week ? meUser.friendQuest.partnerId : null
    const partner = friends.find(f => f.discordId === chosenId)
      || friends.find(f => f.friendQuest?.week === week && f.friendQuest.partnerId === me)
      || null

    const myCoins = meUser ? coinsSince(meUser.progress?.coinsByDay, week) : 0
    return Response.json({
      week,
      goal: FRIEND_QUEST_GOAL,
      reward: FRIEND_QUEST_REWARD,
      myCoins,
      partner: partner && {
        username: partner.username,
        avatarUrl: avatarUrl(partner),
        coins: coinsSince(partner.progress?.coinsByDay, week),
      },
      friends: friends.map(f => ({ username: f.username, avatarUrl: avatarUrl(f) })),
    })
  } catch (e) {
    console.error('friend-quest GET error:', e)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}

// Pick this week's partner: { username }
export async function POST(req) {
  try {
    const session = getSession()
    if (!session) return Response.json({ error: 'unauthorized' }, { status: 401 })
    const me = session.discordId
    const { username } = await req.json()

    const client = await getClientPromise()
    const db = client.db('bulgario')
    const users = db.collection('users')

    const target = await users.findOne(
      { usernameLower: String(username || '').toLowerCase() },
      { projection: { discordId: 1 } }
    )
    if (!target) return Response.json({ error: 'not_found' }, { status: 404 })
    if (!(await friendIds(db, me)).includes(target.discordId)) {
      return Response.json({ error: 'not_friends' }, { status: 403 })
    }

    await users.updateOne(
      { discordId: me },
      { $set: { friendQuest: { week: weekStartKey(), partnerId: target.discordId } } }
    )
    return Response.json({ ok: true })
  } catch (e) {
    console.error('friend-quest POST error:', e)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
