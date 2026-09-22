'use client'

export async function fetchStudio() {
  const res = await fetch('/api/voiceovers/studio', { cache: 'no-store' })
  if (!res.ok) throw new Error('load_failed')
  return res.json()
}

export async function uploadVoice(key, blob) {
  const res = await fetch(`/api/voiceovers/upload?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': blob.type || 'application/octet-stream' },
    body: blob,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `upload failed (${res.status})`)
  return data.voiceover
}

export async function reviewVoice(id, action) {
  const res = await fetch('/api/voiceovers/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, action }),
  })
  if (!res.ok) throw new Error('review_failed')
}

// Replaces whatever the new doc supersedes: the old approved take for its key,
// or the author's own earlier pending take.
export function mergeVoiceover(list, doc) {
  const superseded = v => v.key === doc.key && (
    (doc.status === 'approved' && v.status === 'approved') ||
    (v.status === 'pending' && v.by === doc.by)
  )
  return [...list.filter(v => !superseded(v)), doc]
}

let currentPlayback = null
export function playUrl(url) {
  currentPlayback?.pause()
  if (!url) return
  currentPlayback = new Audio(url)
  currentPlayback.play().catch(() => {})
}
