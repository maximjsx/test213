import { deleteFile, storageConfigured } from '@/lib/storage'
import { currentBuilderStatus } from '@/lib/builderAccess'

// POST /api/storage/delete  { id: string }
// Deletes a previously uploaded file from the storage-api service so re-recording
// or removing lesson audio/images doesn't leak storage.
export async function POST(req) {
  try {
    const status = await currentBuilderStatus()
    if (!status.allowed) return Response.json({ error: 'forbidden' }, { status: 403 })

    if (!storageConfigured()) {
      return Response.json({ error: 'storage_not_configured' }, { status: 503 })
    }
    const { id } = await req.json()
    if (!id) return Response.json({ error: 'no_id' }, { status: 400 })
    await deleteFile(id)
    return Response.json({ ok: true })
  } catch (e) {
    console.error('storage delete error:', e)
    return Response.json({ error: 'delete_failed', detail: e.message }, { status: 502 })
  }
}
