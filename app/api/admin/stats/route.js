import getClientPromise from '@/lib/mongodb'
import { currentBuilderStatus } from '@/lib/builderAccess'
import { COURSE_PHRASES, voiceoversCollection } from '@/lib/voiceovers'

export const dynamic = 'force-dynamic'

const DAY = 24 * 60 * 60 * 1000
const CHART_DAYS = 30

const avatarUrl = u => (u.avatar ? `https://cdn.discordapp.com/avatars/${u.discordId}/${u.avatar}.png?size=64` : null)

async function signupsByDay(users, since) {
  const rows = await users.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, n: { $sum: 1 } } },
  ]).toArray()
  const counts = Object.fromEntries(rows.map(r => [r._id, r.n]))
  return Array.from({ length: CHART_DAYS }, (_, i) => {
    const day = new Date(since.getTime() + (i + 1) * DAY).toISOString().slice(0, 10)
    return { day, count: counts[day] || 0 }
  })
}

async function voiceStats() {
  const col = await voiceoversCollection()
  const [approved, pending, voices] = await Promise.all([
    col.countDocuments({ status: 'approved' }),
    col.countDocuments({ status: 'pending' }),
    col.distinct('by'),
  ])
  return { approved, pending, phrases: COURSE_PHRASES.size, voices: voices.length }
}

// GET /api/admin/stats: the admin dashboard numbers, super-admin only
export async function GET() {
  try {
    const status = await currentBuilderStatus()
    if (!status.isAdmin) return Response.json({ error: 'forbidden' }, { status: 403 })

    const client = await getClientPromise()
    const users = client.db('bulgario').collection('users')
    const now = Date.now()
    const ago = days => new Date(now - days * DAY)

    const [total, day, week, month, activeDay, activeWeek, lessons, chart, recent, voice] = await Promise.all([
      users.estimatedDocumentCount(),
      users.countDocuments({ createdAt: { $gte: ago(1) } }),
      users.countDocuments({ createdAt: { $gte: ago(7) } }),
      users.countDocuments({ createdAt: { $gte: ago(30) } }),
      users.countDocuments({ updatedAt: { $gte: ago(1) } }),
      users.countDocuments({ updatedAt: { $gte: ago(7) } }),
      users.aggregate([{ $group: { _id: null, n: { $sum: '$lessonsCount' } } }]).toArray(),
      signupsByDay(users, ago(CHART_DAYS)),
      users.find({}, { projection: { _id: 0, discordId: 1, avatar: 1, username: 1, discordName: 1, createdAt: 1, lessonsCount: 1, streak: 1 } })
        .sort({ createdAt: -1 }).limit(8).toArray(),
      voiceStats(),
    ])

    return Response.json({
      users: { total, day, week, month },
      active: { day: activeDay, week: activeWeek },
      lessons: lessons[0]?.n || 0,
      chart,
      recent: recent.map(u => ({
        username: u.username, discordName: u.discordName, avatarUrl: avatarUrl(u),
        createdAt: u.createdAt, lessons: u.lessonsCount || 0, streak: u.streak || 0,
      })),
      voice,
    })
  } catch (e) {
    console.error('admin stats error:', e)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
