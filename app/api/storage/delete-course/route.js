import { listAllFiles, deleteFile, storageConfigured } from '@/lib/storage'
import { currentBuilderStatus } from '@/lib/builderAccess'
import { isVoiceFile, forgetVoiceFiles } from '@/lib/voiceovers'

export const dynamic = 'force-dynamic'

const VOICE_GROUP = '__voice__'
const UNTAGGED_GROUP = '__untagged__'

// Same grouping as the admin media panel: a course id, voice recordings, or untagged.
function groupOf(filename) {
  if (isVoiceFile(filename)) return VOICE_GROUP
  const m = /^crs-(.+?)--/.exec(filename || '')
  return m ? m[1] : UNTAGGED_GROUP
}

// POST /api/storage/delete-course  { group }, admin only. Deletes every stored file in the group.
export async function POST(req) {
  const status = await currentBuilderStatus()
  if (!status.isAdmin) return Response.json({ error: 'forbidden' }, { status: 403 })
  if (!storageConfigured()) return Response.json({ error: 'storage_not_configured' }, { status: 503 })

  const { group } = await req.json().catch(() => ({}))
  if (!group) return Response.json({ error: 'no_group' }, { status: 400 })

  try {
    const files = await listAllFiles({})
    const targets = files.filter(f => groupOf(f.filename) === group)
    const deleted = []
    for (const f of targets) {
      try { await deleteFile(f.id); deleted.push(f.id) } catch {}
    }
    await forgetVoiceFiles(deleted)
    return Response.json({ ok: true, deleted: deleted.length, matched: targets.length })
  } catch (e) {
    console.error('delete-course error:', e)
    return Response.json({ error: 'delete_failed', detail: e.message }, { status: 502 })
  }
}
