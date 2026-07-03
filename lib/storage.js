// Server-only client for the self-hosted storage-api service.
// Never import this from a 'use client' component — it reads STORAGE_API_KEY.
//
// Env expected (.env.local):
//   STORAGE_API_URL=https://cdn.yourdomain.com   (no trailing slash)
//   STORAGE_API_KEY=...                           (one of the service's API_KEYS)

const BASE = (process.env.STORAGE_API_URL || '').replace(/\/+$/, '')
const KEY = process.env.STORAGE_API_KEY || ''

export function storageConfigured() {
  return Boolean(BASE && KEY)
}

// The public URL a browser should use for a file id, built from STORAGE_API_URL.
// We trust this over the service's own `url` field so a misconfigured PUBLIC_URL
// on the storage box can't leak localhost/IP origins into saved lesson data.
export function publicFileUrl(id) {
  return `${BASE}/v1/files/${id}`
}

// Upload raw bytes. `mime` is the content type; `opts` maps to the service's
// upload query params (compress, bitrate, format, quality, maxWidth, filename…).
export async function uploadFile(data, mime, opts = {}) {
  if (!storageConfigured()) throw new Error('storage_not_configured')
  const q = new URLSearchParams({ mime })
  if (opts.filename) q.set('filename', opts.filename)
  if (opts.compress) q.set('compress', '1')
  if (opts.quality) q.set('quality', String(opts.quality))
  if (opts.format) q.set('format', opts.format)
  if (opts.maxWidth) q.set('maxWidth', String(opts.maxWidth))
  if (opts.maxHeight) q.set('maxHeight', String(opts.maxHeight))
  if (opts.bitrate) q.set('bitrate', opts.bitrate)
  if (opts.crf) q.set('crf', String(opts.crf))

  const res = await fetch(`${BASE}/v1/files?${q}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${KEY}`, 'content-type': mime },
    body: data,
  })
  if (!res.ok) throw new Error(`upload failed ${res.status}: ${await res.text()}`)
  return res.json()
}

// List stored files (one page). Returns { total, limit, offset, files }.
export async function listFilesPage({ kind = '', limit = 500, offset = 0 } = {}) {
  if (!storageConfigured()) throw new Error('storage_not_configured')
  const q = new URLSearchParams()
  if (kind) q.set('kind', kind)
  q.set('limit', String(limit))
  q.set('offset', String(offset))
  const res = await fetch(`${BASE}/v1/files?${q}`, {
    headers: { authorization: `Bearer ${KEY}` },
  })
  if (!res.ok) throw new Error(`list failed ${res.status}`)
  return res.json()
}

// Fetch every stored file (walks pagination), capped for safety.
export async function listAllFiles({ kind = '', cap = 5000 } = {}) {
  const out = []
  let offset = 0
  const limit = 500
  for (;;) {
    const page = await listFilesPage({ kind, limit, offset })
    const files = page.files || []
    out.push(...files)
    offset += files.length
    if (files.length < limit || offset >= (page.total ?? out.length) || out.length >= cap) break
  }
  // Ensure browser-facing URLs use the app's configured public origin
  return out.map(f => ({ ...f, url: publicFileUrl(f.id) }))
}

// Delete bytes + index row. Treats 404 as success (already gone).
export async function deleteFile(id) {
  if (!storageConfigured()) throw new Error('storage_not_configured')
  const res = await fetch(`${BASE}/v1/files/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { authorization: `Bearer ${KEY}` },
  })
  if (!res.ok && res.status !== 404) throw new Error(`delete failed ${res.status}`)
}
