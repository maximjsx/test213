// Typing results for accounts: one document per player, board and day holding
// that day's best run, so the week and all-time boards are one aggregation.
// Server only.
import getClientPromise from '@/lib/mongodb'
import { weekStartKey } from '@/lib/coins'
import { typingBoard } from '@/lib/typingBoards'

const TOP = 50

let ready = null
function results() {
  ready ??= getClientPromise().then(async client => {
    const c = client.db('bulgario').collection('typing_results')
    await Promise.all([
      c.createIndex({ discordId: 1, board: 1, day: 1 }, { unique: true }),
      c.createIndex({ board: 1, day: 1 }),
    ])
    return c
  })
  return ready
}

// Called after the engine accepted the run, so the numbers are already checked
export async function recordTypingResult(discordId, { duration, source, wpm, accuracy, words }, day) {
  const c = await results()
  const better = { $gt: [{ $literal: wpm }, { $ifNull: ['$wpm', -1] }] }
  const pick = (field, value) => ({ $cond: [better, { $literal: value }, `$${field}`] })
  await c.updateOne(
    { discordId, board: typingBoard(duration, source), day },
    [{ $set: { wpm: pick('wpm', wpm), accuracy: pick('accuracy', accuracy), words: pick('words', words), at: pick('at', new Date()) } }],
    { upsert: true },
  )
}

export async function typingLeaderboard(board, period, meId) {
  const c = await results()
  const client = await getClientPromise()
  const ranked = await c.aggregate([
    { $match: { board, ...(period === 'week' ? { day: { $gte: weekStartKey() } } : {}) } },
    { $sort: { wpm: -1, accuracy: -1, at: 1 } },
    { $group: { _id: '$discordId', wpm: { $first: '$wpm' }, accuracy: { $first: '$accuracy' } } },
    { $sort: { wpm: -1, accuracy: -1 } },
  ]).toArray()

  const top = ranked.slice(0, TOP)
  const users = await client.db('bulgario').collection('users')
    .find({ discordId: { $in: top.map(r => r._id) } }, { projection: { _id: 0, discordId: 1, username: 1, avatar: 1 } })
    .toArray()
  const byId = new Map(users.map(u => [u.discordId, u]))

  const rows = top.filter(r => byId.has(r._id)).map((r, i) => {
    const u = byId.get(r._id)
    return {
      rank: i + 1,
      username: u.username,
      avatarUrl: u.avatar ? `https://cdn.discordapp.com/avatars/${u.discordId}/${u.avatar}.png?size=64` : null,
      wpm: r.wpm,
      accuracy: r.accuracy,
      isMe: r._id === meId,
    }
  })
  const myIndex = meId ? ranked.findIndex(r => r._id === meId) : -1
  const me = myIndex < 0 ? null : { rank: myIndex + 1, wpm: ranked[myIndex].wpm }
  return { top: rows, me }
}
