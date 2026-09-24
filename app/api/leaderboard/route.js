import getClientPromise from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { lifetimeXp, xpSince, xpBetween, weekStartKey, dateKey, XP_HISTORY_PROJECTION } from '@/lib/xp'
import { LEAGUES, leagueIndexFor } from '@/lib/leagues'

export const dynamic = 'force-dynamic'

// First day of the current period as a YYYY-MM-DD key (weeks start Monday)
function periodStartKey(period) {
  if (period === 'week') return weekStartKey()
  const now = new Date()
  return dateKey(new Date(now.getFullYear(), now.getMonth(), 1)) // month
}

function periodXp(user, period) {
  if (period === 'week' || period === 'league') return xpSince(user.progress?.xpByDay, weekStartKey())
  if (period === 'month') return xpSince(user.progress?.xpByDay, periodStartKey(period))
  return lifetimeXp(user)
}

function lastWeekXp(user) {
  return xpBetween(user.progress?.xpByDay, weekStartKey(1), weekStartKey())
}

function toRow(u, i, session) {
  return {
    rank: i + 1,
    username: u.username,
    xp: u.periodXp,
    streak: u.streak || 0,
    isMe: session ? u.discordId === session.discordId : false,
    avatarUrl: u.avatar ? `https://cdn.discordapp.com/avatars/${u.discordId}/${u.avatar}.png?size=64` : null,
  }
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

    if (period === 'league') return Response.json(leagueBoard(all, session))

    const rows = all
      .map(u => ({ ...u, periodXp: periodXp(u, period) }))
      .filter(u => u.periodXp > 0)
      .sort((a, b) => b.periodXp - a.periodXp)

    let me = null
    if (session) {
      const idx = rows.findIndex(u => u.discordId === session.discordId)
      if (idx >= 0) me = { username: rows[idx].username, xp: rows[idx].periodXp, rank: idx + 1 }
    }

    return Response.json({ top: rows.slice(0, 50).map((u, i) => toRow(u, i, session)), me })
  } catch (e) {
    console.error('leaderboard error:', e)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}

// Everyone in your league, ranked by XP this week. You are always listed,
// even before earning anything, so the board never looks empty to you.
function leagueBoard(all, session) {
  const meUser = session && all.find(u => u.discordId === session.discordId)
  if (!meUser) return { league: null, top: [], me: null }

  const tier = leagueIndexFor(lastWeekXp(meUser))
  const rows = all
    .filter(u => leagueIndexFor(lastWeekXp(u)) === tier)
    .map(u => ({ ...u, periodXp: periodXp(u, 'league') }))
    .filter(u => u.periodXp > 0 || u.discordId === session.discordId)
    .sort((a, b) => b.periodXp - a.periodXp)

  const idx = rows.findIndex(u => u.discordId === session.discordId)
  return {
    league: {
      index: tier,
      ...LEAGUES[tier],
      next: LEAGUES[tier + 1] || null,
      stayXp: LEAGUES[tier].minXp,
    },
    top: rows.slice(0, 50).map((u, i) => toRow(u, i, session)),
    me: { username: meUser.username, xp: rows[idx].periodXp, rank: idx + 1 },
  }
}
