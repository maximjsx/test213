// Builder levels live only in this browser's localStorage until they are
// exported and added to the course with `bun run add-topic`.
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
  levels[idx] = level
  saveLevels(levels)
}

export function addLevel(level) {
  saveLevels([...loadLevels(), level])
}

export function deleteLevel(id) {
  const levels = loadLevels().filter(l => l.id !== id)
  saveLevels(levels)
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

export function downloadJson(level) {
  const blob = new Blob([JSON.stringify(level, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = (level.id || 'level') + '.json'
  a.click()
  URL.revokeObjectURL(url)
}
