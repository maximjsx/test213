import { getSession } from '@/lib/auth'
import { loadProgress, refreshProgress, resolveToday } from '@/lib/progressStore'

export const dynamic = 'force-dynamic'

// GET ?day=YYYY-MM-DD: the account's progress with streaks and quests
// brought up to date, or null for an account that has none yet
export async function GET(req) {
  try {
    const session = getSession()
    if (!session) return Response.json({ error: 'unauthorized' }, { status: 401 })
    const today = resolveToday(new URL(req.url).searchParams.get('day'))
    const { progress } = await loadProgress(session.discordId)
    if (!progress) return Response.json({ progress: null })
    const result = await refreshProgress(session.discordId, today)
    return Response.json({ progress: result.state ?? progress })
  } catch (e) {
    console.error('progress GET error:', e)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
