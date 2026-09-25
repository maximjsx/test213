// This week's shared goal with one friend. If you have not picked a partner
// but a friend picked you, you are teamed up with them automatically.
// Server only; used by the friend quest route and to verify a claim.
import { coinsSince, weekStartKey } from './coins'
import { FRIEND_QUEST_GOAL } from './goals'

const USER_PROJECTION = { _id: 0, discordId: 1, username: 1, avatar: 1, friendQuest: 1, 'progress.coinsByDay': 1 }

export async function friendIds(db, me) {
  const rels = await db.collection('friends')
    .find({ status: 'accepted', $or: [{ from: me }, { to: me }] })
    .toArray()
  return rels.map(r => (r.from === me ? r.to : r.from))
}

export async function loadFriendQuest(db, me) {
  const week = weekStartKey()
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
  const partnerCoins = partner ? coinsSince(partner.progress?.coinsByDay, week) : 0
  return { week, friends, partner, myCoins, partnerCoins, complete: !!partner && myCoins + partnerCoins >= FRIEND_QUEST_GOAL }
}
