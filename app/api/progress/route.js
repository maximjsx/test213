import getClientPromise from '@/lib/mongodb'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const ALLOWED_KEYS = [
  'lessons', 'xp', 'streak', 'lastActiveDay', 'streakFreezes',
  'specialUnlocks', 'wrongExercises', 'skippedLevels', 'activeDays', 'xpByDay', 'quests', 'startedAt',
]
const MAX_BYTES = 300_000

function pickProgress(raw) {
  const out = {}
  for (const k of ALLOWED_KEYS) if (raw[k] !== undefined) out[k] = raw[k]
  return out
}

export async function GET() {
  const session = getSession()
  if (!session) return Response.json({ error: 'unauthorized' }, { status: 401 })

  const client = await getClientPromise()
  const user = await client.db('bulgario').collection('users').findOne(
    { discordId: session.discordId },
    { projection: { _id: 0, progress: 1, updatedAt: 1 } }
  )
  return Response.json({ progress: user?.progress ?? null, updatedAt: user?.updatedAt ?? null })
}

export async function POST(req) {
  try {
    const session = getSession()
    if (!session) return Response.json({ error: 'unauthorized' }, { status: 401 })

    const body = await req.json()
    if (!body?.progress || typeof body.progress !== 'object') {
      return Response.json({ error: 'no progress' }, { status: 400 })
    }
    const progress = pickProgress(body.progress)
    if (JSON.stringify(progress).length > MAX_BYTES) {
      return Response.json({ error: 'too large' }, { status: 413 })
    }

    const client = await getClientPromise()
    await client.db('bulgario').collection('users').updateOne(
      { discordId: session.discordId },
      {
        $set: {
          progress,
          xp: Number(progress.xp) || 0,
          streak: Number(progress.streak) || 0,
          lessonsCount: Object.keys(progress.lessons || {}).length,
          updatedAt: new Date(),
        },
      }
    )
    return Response.json({ ok: true })
  } catch (e) {
    console.error('progress POST error:', e)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
