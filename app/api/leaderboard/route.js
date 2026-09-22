import getClientPromise from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { lifetimeXp, xpSince, XP_HISTORY_PROJECTION } from '@/lib/xp'

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

function periodXp(user, period) {
  if (period === 'week' || period === 'month') return xpSince(user.progress?.xpByDay, periodStartKey(period))
  return lifetimeXp(user)
}

export async function GET(req) {
  try {
    const period = new URL(req.url).searchParams.get('period') || 'all'
    const client = await getClientPromise()
    const users = client.db('bulgario').collection('users')
    const session = getSession()

    // Not filtered on `xp`: that is the spendable balance, and someone who
    // spent it all still earned their place.
    const all = await users
      .find({}, { projection: { _id: 0, username: 1, streak: 1, discordId: 1, avatar: 1, ...XP_HISTORY_PROJECTION } })
      .toArray()
    const rows = all
      .map(u => ({ ...u, periodXp: periodXp(u, period) }))
      .filter(u => u.periodXp > 0)
      .sort((a, b) => b.periodXp - a.periodXp)

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
