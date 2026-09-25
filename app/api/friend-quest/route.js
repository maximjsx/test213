import getClientPromise from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { weekStartKey } from '@/lib/coins'
import { loadFriendQuest, friendIds } from '@/lib/friendQuest'
import { FRIEND_QUEST_GOAL, FRIEND_QUEST_REWARD } from '@/lib/goals'

export const dynamic = 'force-dynamic'

function avatarUrl(u) {
  return u.avatar ? `https://cdn.discordapp.com/avatars/${u.discordId}/${u.avatar}.png?size=64` : null
}

export async function GET() {
  try {
    const session = getSession()
    if (!session) return Response.json({ error: 'unauthorized' }, { status: 401 })
    const client = await getClientPromise()
    const { week, friends, partner, myCoins, partnerCoins } = await loadFriendQuest(client.db('bulgario'), session.discordId)
    return Response.json({
      week,
      goal: FRIEND_QUEST_GOAL,
      reward: FRIEND_QUEST_REWARD,
      myCoins,
      partner: partner && {
        username: partner.username,
        avatarUrl: avatarUrl(partner),
        coins: partnerCoins,
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
