import { listAllFiles, storageConfigured } from '@/lib/storage'
import { currentBuilderStatus } from '@/lib/builderAccess'

export const dynamic = 'force-dynamic'

// GET /api/storage/files?kind=  — admin only. Lists all stored files for the
// builder file browser. `kind` optionally filters to image|audio|video.
export async function GET(req) {
  const status = await currentBuilderStatus()
  if (!status.isAdmin) return Response.json({ error: 'forbidden' }, { status: 403 })
  if (!storageConfigured()) return Response.json({ error: 'storage_not_configured' }, { status: 503 })

  try {
    const kind = new URL(req.url).searchParams.get('kind') || ''
    const files = await listAllFiles({ kind })
    return Response.json({ files })
  } catch (e) {
    console.error('storage files list error:', e)
    return Response.json({ error: 'list_failed', detail: e.message }, { status: 502 })
  }
}
