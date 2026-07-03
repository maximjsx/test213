'use client'

// Browser-side helpers that talk to our own /api/storage proxy routes.
// The storage-api key lives on the server; the browser only ever sees the
// returned public { id, url }.

// Upload a Blob/File. `kind` is 'audio' | 'image'. Returns { id, url }.
export async function uploadMedia(blob, kind, filename) {
  const qs = new URLSearchParams({ kind })
  if (filename) qs.set('filename', filename)
  const res = await fetch(`/api/storage/upload?${qs}`, {
    method: 'POST',
    headers: { 'Content-Type': blob.type || 'application/octet-stream' },
    body: blob,
  })
  if (!res.ok) {
    let detail = ''
    try { detail = (await res.json()).error || '' } catch {}
    throw new Error(detail || `upload failed (${res.status})`)
  }
  const file = await res.json()
  return { id: file.id, url: file.url }
}

// Best-effort delete of a previously uploaded file. Never throws — a failed
// cleanup shouldn't block the editor. Returns true on success.
export async function deleteMedia(id) {
  if (!id) return true
  try {
    const res = await fetch('/api/storage/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    return res.ok
  } catch {
    return false
  }
}
