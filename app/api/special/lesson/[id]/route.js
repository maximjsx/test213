import { getSession } from '@/lib/auth'
import { findLessonFull } from '@/lib/serverCourse'
import { loadProgress } from '@/lib/progressStore'
import { topicLock } from '@/lib/specialTopics'

export const dynamic = 'force-dynamic'

// The exercises of a special topic's lesson, for learners who unlocked it:
// bought with coins (recorded server-side) and/or member of its Discord server
export async function GET(req, { params }) {
  try {
    const session = getSession()
    if (!session) return Response.json({ error: 'sign_in' }, { status: 401 })
    const found = findLessonFull(params.id)
    if (!found?.level.special) return Response.json({ error: 'not_found' }, { status: 404 })
    const { progress, guildIds } = await loadProgress(session.discordId)
    if (topicLock(found.level, { unlockedTopics: progress?.unlockedTopics, guildIds })) {
      return Response.json({ error: 'locked' }, { status: 403 })
    }
    return Response.json({ lesson: found.lesson }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (e) {
    console.error('special lesson error:', e)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
