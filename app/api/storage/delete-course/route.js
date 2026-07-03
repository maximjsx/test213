import { listAllFiles, deleteFile, storageConfigured } from '@/lib/storage'
import { currentBuilderStatus } from '@/lib/builderAccess'

export const dynamic = 'force-dynamic'

const courseOf = (filename) => {
  const m = /^crs-(.+?)--/.exec(filename || '')
  return m ? m[1] : null
}

// POST /api/storage/delete-course  { courseId }  — admin only.
// Deletes every stored file tagged with the given course id.
export async function POST(req) {
  const status = await currentBuilderStatus()
  if (!status.isAdmin) return Response.json({ error: 'forbidden' }, { status: 403 })
  if (!storageConfigured()) return Response.json({ error: 'storage_not_configured' }, { status: 503 })

  const { courseId } = await req.json().catch(() => ({}))
  if (!courseId) return Response.json({ error: 'no_course' }, { status: 400 })

  try {
    const files = await listAllFiles({})
    const targets = files.filter(f => courseOf(f.filename) === courseId)
    let deleted = 0
    for (const f of targets) {
      try { await deleteFile(f.id); deleted++ } catch {}
    }
    return Response.json({ ok: true, deleted, matched: targets.length })
  } catch (e) {
    console.error('delete-course error:', e)
    return Response.json({ error: 'delete_failed', detail: e.message }, { status: 502 })
  }
}
