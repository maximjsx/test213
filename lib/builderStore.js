// Builder levels live in this browser's localStorage and are backed up to the
// builder's account (api/builder/levels) so work survives a cleared browser or
// a second device. They become course topics only when published, either with
// `bun run add-topic` or the Publish button.
const LEVELS_KEY = 'builder_levels'
// A shared level opened with "Play" without being added to My Levels
const TEMP_KEY = 'builder_temp_level'

export function loadLevels() {
  try { return JSON.parse(localStorage.getItem(LEVELS_KEY) || '[]') } catch { return [] }
}

export function saveLevels(levels) {
  try { localStorage.setItem(LEVELS_KEY, JSON.stringify(levels)) } catch {}
}

export function loadLevel(id) {
  const found = loadLevels().find(l => l.id === id)
  if (found) return found
  try {
    const temp = JSON.parse(localStorage.getItem(TEMP_KEY) || 'null')
    return temp?.id === id ? temp : null
  } catch { return null }
}

export function saveLevel(level) {
  const levels = loadLevels()
  const idx = levels.findIndex(l => l.id === level.id)
  if (idx === -1) return
  levels[idx] = stamp(level)
  saveLevels(levels)
  queuePush(levels[idx])
}

export function addLevel(level) {
  const stamped = stamp(level)
  saveLevels([...loadLevels(), stamped])
  queuePush(stamped, 0)
}

export function deleteLevel(id) {
  const levels = loadLevels().filter(l => l.id !== id)
  saveLevels(levels)
  clearTimeout(pushTimers.get(id))
  track(fetch(`/api/builder/levels/${encodeURIComponent(id)}`, { method: 'DELETE' }))
  return levels
}

// Account backup. `updatedAt` (ms) on each level decides which copy wins.

const PUSH_DELAY_MS = 1500
const pushTimers = new Map()
const syncListeners = new Set()
let syncStatus = 'idle' // idle | saving | saved | offline
let pending = 0

function stamp(level) {
  return { ...level, updatedAt: Date.now() }
}

function setStatus(next) {
  syncStatus = next
  syncListeners.forEach(fn => fn(next))
}

export function onSyncStatus(fn) {
  syncListeners.add(fn)
  fn(syncStatus)
  return () => syncListeners.delete(fn)
}

function track(request) {
  pending++
  setStatus('saving')
  return request
    .then(res => { if (!res.ok) throw new Error(res.status) })
    .then(() => { if (--pending === 0) setStatus('saved') })
    .catch(() => { pending--; setStatus('offline') })
}

function pushNow(level) {
  return track(fetch('/api/builder/levels', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level, updatedAt: level.updatedAt }),
  }))
}

function queuePush(level, delay = PUSH_DELAY_MS) {
  clearTimeout(pushTimers.get(level.id))
  pushTimers.set(level.id, setTimeout(() => { pushTimers.delete(level.id); pushNow(level) }, delay))
}

// Merges the account copy with this browser: the newer copy of each level
// wins, deletions on another device remove it here, and levels only this
// browser has are uploaded. Returns the merged list.
export async function syncLevels() {
  let drafts
  try {
    const res = await fetch('/api/builder/levels')
    if (!res.ok) throw new Error(res.status)
    drafts = (await res.json()).drafts
  } catch {
    setStatus('offline')
    return loadLevels()
  }

  const local = new Map(loadLevels().map(l => [l.id, l]))
  const merged = new Map(local)
  for (const d of drafts) {
    const mine = local.get(d.id)
    if (mine && (mine.updatedAt || 0) >= d.updatedAt) continue
    if (d.deleted) merged.delete(d.id)
    else merged.set(d.id, { ...d.level, updatedAt: d.updatedAt })
  }
  const onServer = new Map(drafts.map(d => [d.id, d.updatedAt]))
  const toPush = [...merged.values()].filter(l => !onServer.has(l.id) || (l.updatedAt || 0) > onServer.get(l.id))

  const levels = [...merged.values()]
  saveLevels(levels)
  await Promise.all(toPush.map(l => pushNow(l.updatedAt ? l : stamp(l))))
  if (!toPush.length) setStatus('saved')
  return levels
}

export function saveTempLevel(level) {
  try { localStorage.setItem(TEMP_KEY, JSON.stringify(level)) } catch {}
}

export const newLevelId = () => 'custom_' + Date.now()

export function newLevel() {
  return {
    id: newLevelId(),
    title: 'New Level',
    subtitle: 'A custom course level',
    color: '#58cc02',
    icon: '★',
    notes: '## Notes\n\nWrite your level notes here.',
    lessons: [],
  }
}

export function countExercises(level) {
  return (level.lessons || []).reduce((n, l) => n + (l.exercises?.length || 0), 0)
}

// Unicode-safe, URL-safe base64, so a whole level fits in a share link
export function encodeLevel(level) {
  try {
    const json = JSON.stringify(level)
    const b64 = btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))))
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  } catch { return null }
}

export function decodeLevel(str) {
  try {
    const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice((str.length % 4) || 4)
    return JSON.parse(decodeURIComponent(
      Array.from(atob(b64)).map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    ))
  } catch { return null }
}

export function shareUrl(level) {
  const encoded = encodeLevel(level)
  return encoded ? `${window.location.origin}/builder/import?d=${encoded}` : null
}

export function copyText(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text)
  const ta = Object.assign(document.createElement('textarea'), { value: text, style: 'position:fixed;opacity:0' })
  document.body.appendChild(ta)
  ta.select()
  document.execCommand('copy')
  ta.remove()
  return Promise.resolve()
}

export function downloadJson({ updatedAt, ...level }) {
  const blob = new Blob([JSON.stringify(level, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = (level.id || 'level') + '.json'
  a.click()
  URL.revokeObjectURL(url)
}
