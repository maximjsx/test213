import { currentBuilderStatus } from '@/lib/builderAccess'
import { listDrafts, saveDraft } from '@/lib/builderDrafts'

export const dynamic = 'force-dynamic'

async function builder() {
  const status = await currentBuilderStatus()
  return status.allowed ? status.discordId : null
}

// GET: every draft of the signed-in builder, including deletion tombstones
export async function GET() {
  try {
    const discordId = await builder()
    if (!discordId) return Response.json({ error: 'forbidden' }, { status: 403 })
    return Response.json({ drafts: await listDrafts(discordId) })
  } catch (e) {
    console.error('builder levels GET error:', e)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}

// PUT { level, updatedAt }
export async function PUT(req) {
  try {
    const discordId = await builder()
    if (!discordId) return Response.json({ error: 'forbidden' }, { status: 403 })
    const { level, updatedAt } = await req.json()
    if (!level?.id || typeof level.id !== 'string' || !Number.isFinite(updatedAt)) {
      return Response.json({ error: 'bad_request' }, { status: 400 })
    }
    const result = await saveDraft(discordId, level, updatedAt)
    if (result.error) return Response.json(result, { status: 413 })
    return Response.json(result)
  } catch (e) {
    console.error('builder levels PUT error:', e)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
