import { uploadFile, storageConfigured, publicFileUrl } from '@/lib/storage'
import { currentBuilderStatus } from '@/lib/builderAccess'

// POST /api/storage/upload?kind=audio|image
// Body: raw file bytes, with the file's Content-Type header.
// Proxies to the storage-api service (keeping the key server-side), asks it to
// compress, and returns the stored file JSON ({ id, url, ... }).
export async function POST(req) {
  try {
    const status = await currentBuilderStatus()
    if (!status.allowed) return Response.json({ error: 'forbidden' }, { status: 403 })

    if (!storageConfigured()) {
      return Response.json({ error: 'storage_not_configured' }, { status: 503 })
    }

    const { searchParams } = new URL(req.url)
    const kind = searchParams.get('kind') || 'other'
    const mime = req.headers.get('content-type') || 'application/octet-stream'
    const rawName = searchParams.get('filename') || kind
    // Tag the stored filename with the owning course id so the admin file browser
    // can group / bulk-delete by course (the storage service has no course concept).
    // Format must survive the service's safeName() sanitizer, which keeps only
    // [A-Za-z0-9_.- ]. Course ids are `custom_<digits>` (no hyphens), so a `--`
    // delimiter parses unambiguously: crs-<courseId>--<originalName>.
    const course = (searchParams.get('course') || '').trim().replace(/[^\w]/g, '')
    const filename = course ? `crs-${course}--${rawName}` : rawName

    const buf = await req.arrayBuffer()
    if (!buf.byteLength) return Response.json({ error: 'empty_body' }, { status: 400 })

    // Compression defaults per kind.
    let opts = { compress: true, filename }
    if (kind === 'audio') {
      opts = { ...opts, bitrate: '64k' }
    } else if (kind === 'image') {
      opts = { ...opts, format: 'webp', quality: 80, maxWidth: 900 }
    }

    const file = await uploadFile(Buffer.from(buf), mime, opts)
    // Always hand the browser the app-configured public origin, not whatever the
    // service reports (guards against a stale PUBLIC_URL on the storage box).
    return Response.json({ ...file, url: publicFileUrl(file.id) })
  } catch (e) {
    console.error('storage upload error:', e)
    return Response.json({ error: 'upload_failed', detail: e.message }, { status: 502 })
  }
}

// Uploads can be large-ish audio/image blobs; allow a bigger body than the default.
export const maxDuration = 60
