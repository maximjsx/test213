import getClientPromise from '@/lib/mongodb'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function pad(n) { return String(n).padStart(2, '0') }
function keyOf(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }

// First day of the current period as a YYYY-MM-DD key (weeks start Monday)
function periodStartKey(period) {
  const now = new Date()
  if (period === 'week') {
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    return keyOf(monday)
  }
  return keyOf(new Date(now.getFullYear(), now.getMonth(), 1)) // month
}

function xpSince(xpByDay, startKey) {
  if (!xpByDay) return 0
  let sum = 0
  for (const [day, xp] of Object.entries(xpByDay)) {
    if (day >= startKey) sum += Number(xp) || 0
  }
  return sum
}

export async function GET(req) {
  try {
    const period = new URL(req.url).searchParams.get('period') || 'all'
    const client = await getClientPromise()
    const users = client.db('bulgario').collection('users')
    const session = getSession()

    let rows
    if (period === 'week' || period === 'month') {
      const startKey = periodStartKey(period)
      const all = await users
        .find({ xp: { $gt: 0 } }, { projection: { _id: 0, username: 1, streak: 1, discordId: 1, avatar: 1, 'progress.xpByDay': 1 } })
        .toArray()
      rows = all
        .map(u => ({ ...u, periodXp: xpSince(u.progress?.xpByDay, startKey) }))
        .filter(u => u.periodXp > 0)
        .sort((a, b) => b.periodXp - a.periodXp)
    } else {
      rows = (await users
        .find({ xp: { $gt: 0 } }, { projection: { _id: 0, username: 1, xp: 1, streak: 1, discordId: 1, avatar: 1 } })
        .sort({ xp: -1 })
        .toArray())
        .map(u => ({ ...u, periodXp: u.xp }))
    }

    let me = null
    if (session) {
      const idx = rows.findIndex(u => u.discordId === session.discordId)
      if (idx >= 0) me = { username: rows[idx].username, xp: rows[idx].periodXp, rank: idx + 1 }
    }

    return Response.json({
      top: rows.slice(0, 50).map((u, i) => ({
        rank: i + 1,
        username: u.username,
        xp: u.periodXp,
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
