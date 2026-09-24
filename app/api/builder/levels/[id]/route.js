import { currentBuilderStatus } from '@/lib/builderAccess'
import { deleteDraft } from '@/lib/builderDrafts'

export const dynamic = 'force-dynamic'

export async function DELETE(req, { params }) {
  try {
    const status = await currentBuilderStatus()
    if (!status.allowed) return Response.json({ error: 'forbidden' }, { status: 403 })
    await deleteDraft(status.discordId, params.id, Date.now())
    return Response.json({ ok: true })
  } catch (e) {
    console.error('builder levels DELETE error:', e)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
