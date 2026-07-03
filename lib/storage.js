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

// Delete bytes + index row. Treats 404 as success (already gone).
export async function deleteFile(id) {
  if (!storageConfigured()) throw new Error('storage_not_configured')
  const res = await fetch(`${BASE}/v1/files/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { authorization: `Bearer ${KEY}` },
  })
  if (!res.ok && res.status !== 404) throw new Error(`delete failed ${res.status}`)
}
