// The lesson last opened in each topic, kept in this browser so the topic path
// can mark a lesson that was left halfway, which progress never records.
const KEY = 'last_opened_lessons'

function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}

export function noteLessonOpened(levelId, lessonId) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...read(), [levelId]: { id: lessonId, at: Date.now() } })) } catch {}
}

export function lastOpenedIn(levelId) {
  return read()[levelId] || null
}
