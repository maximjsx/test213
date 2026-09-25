import { getSession } from '@/lib/auth'
import { runAction, resolveToday } from '@/lib/progressStore'
import { spendActivityToken } from '@/lib/activityTokens'
import { SERVER_ONLY, TIMED } from '@/lib/progressEngine'

export const dynamic = 'force-dynamic'

// POST { action, token?, day }: the only way an account's progress changes.
// The server computes every reward itself; timed activities also need the
// token issued when they started.
export async function POST(req) {
  try {
    const session = getSession()
    if (!session) return Response.json({ error: 'unauthorized' }, { status: 401 })
    const { action, token, day } = await req.json().catch(() => ({}))
    if (!action?.type || SERVER_ONLY.has(action.type)) return Response.json({ error: 'bad_action' }, { status: 400 })

    const timed = TIMED[action.type]
    if (timed) {
      const problem = await spendActivityToken(token, {
        discordId: session.discordId, kind: timed.kind, ref: timed.ref(action), minMs: timed.minMs(action),
      })
      if (problem) return Response.json({ error: problem }, { status: 403 })
    }

    const result = await runAction(session.discordId, action, resolveToday(day))
    if (result.error) return Response.json({ error: result.error }, { status: 409 })
    return Response.json({ progress: result.state, coins: result.coins })
  } catch (e) {
    console.error('progress action error:', e)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
