import { getSession } from '@/lib/auth'
import { issueActivityToken } from '@/lib/activityTokens'
import { TIMED } from '@/lib/progressEngine'

export const dynamic = 'force-dynamic'

const KINDS = new Set(Object.values(TIMED).map(t => t.kind))

// POST { kind, ref }: a signed token proving when an activity started
export async function POST(req) {
  const session = getSession()
  if (!session) return Response.json({ error: 'unauthorized' }, { status: 401 })
  const { kind, ref } = await req.json().catch(() => ({}))
  if (!KINDS.has(kind) || typeof ref !== 'string' || ref.length > 80) return Response.json({ error: 'bad_request' }, { status: 400 })
  return Response.json({ token: issueActivityToken(session.discordId, kind, ref) })
}
