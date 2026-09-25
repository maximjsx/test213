import { getSession } from '@/lib/auth'
import { importGuestProgress, resolveToday } from '@/lib/progressStore'

export const dynamic = 'force-dynamic'

// POST { progress, day }: moves guest progress to a new account, once
export async function POST(req) {
  try {
    const session = getSession()
    if (!session) return Response.json({ error: 'unauthorized' }, { status: 401 })
    const { progress, day } = await req.json().catch(() => ({}))
    const result = await importGuestProgress(session.discordId, progress, resolveToday(day))
    if (result.error) return Response.json({ error: result.error }, { status: 409 })
    return Response.json({ progress: result.state })
  } catch (e) {
    console.error('progress import error:', e)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
