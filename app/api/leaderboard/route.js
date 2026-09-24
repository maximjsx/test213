import getClientPromise from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { lifetimeCoins, coinsSince, coinsBetween, weekStartKey, dateKey, COIN_HISTORY_PROJECTION } from '@/lib/coins'
import { LEAGUES, leagueIndexFor } from '@/lib/leagues'

export const dynamic = 'force-dynamic'

// First day of the current period as a YYYY-MM-DD key (weeks start Monday)
function periodStartKey(period) {
  if (period === 'week') return weekStartKey()
  const now = new Date()
  return dateKey(new Date(now.getFullYear(), now.getMonth(), 1)) // month
}

function periodCoins(user, period) {
  if (period === 'week' || period === 'league') return coinsSince(user.progress?.coinsByDay, weekStartKey())
  if (period === 'month') return coinsSince(user.progress?.coinsByDay, periodStartKey(period))
  return lifetimeCoins(user)
}

function lastWeekCoins(user) {
  return coinsBetween(user.progress?.coinsByDay, weekStartKey(1), weekStartKey())
}

function toRow(u, i, session) {
  return {
    rank: i + 1,
    username: u.username,
    coins: u.periodCoins,
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

    // Not filtered on `coins`: that is the spendable balance, and someone who
    // spent it all still earned their place.
    const all = await users
      .find({}, { projection: { _id: 0, username: 1, streak: 1, discordId: 1, avatar: 1, ...COIN_HISTORY_PROJECTION } })
      .toArray()

    if (period === 'league') return Response.json(leagueBoard(all, session))

    const rows = all
      .map(u => ({ ...u, periodCoins: periodCoins(u, period) }))
      .filter(u => u.periodCoins > 0)
      .sort((a, b) => b.periodCoins - a.periodCoins)

    let me = null
    if (session) {
      const idx = rows.findIndex(u => u.discordId === session.discordId)
      if (idx >= 0) me = { username: rows[idx].username, coins: rows[idx].periodCoins, rank: idx + 1 }
    }

    return Response.json({ top: rows.slice(0, 50).map((u, i) => toRow(u, i, session)), me })
  } catch (e) {
    console.error('leaderboard error:', e)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}

// Everyone in your league, ranked by coins earned this week. You are always listed,
// even before earning anything, so the board never looks empty to you.
function leagueBoard(all, session) {
  const meUser = session && all.find(u => u.discordId === session.discordId)
  if (!meUser) return { league: null, top: [], me: null }

  const tier = leagueIndexFor(lastWeekCoins(meUser))
  const rows = all
    .filter(u => leagueIndexFor(lastWeekCoins(u)) === tier)
    .map(u => ({ ...u, periodCoins: periodCoins(u, 'league') }))
    .filter(u => u.periodCoins > 0 || u.discordId === session.discordId)
    .sort((a, b) => b.periodCoins - a.periodCoins)

  const idx = rows.findIndex(u => u.discordId === session.discordId)
  return {
    league: {
      index: tier,
      ...LEAGUES[tier],
      next: LEAGUES[tier + 1] || null,
      stayCoins: LEAGUES[tier].minCoins,
    },
    top: rows.slice(0, 50).map((u, i) => toRow(u, i, session)),
    me: { username: meUser.username, coins: rows[idx].periodCoins, rank: idx + 1 },
  }
}
