// Calendar days as "YYYY-MM-DD" keys in the learner's local time. Progress
// logic works only with these keys, so the same code runs in the browser and
// on the server (which receives the learner's key with each action).

const pad = n => String(n).padStart(2, '0')

export function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const toUtc = key => {
  const [y, m, d] = key.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

export function daysBetween(fromKey, toKey) {
  return Math.round((toUtc(toKey) - toUtc(fromKey)) / 86400000)
}

export function addDays(key, days) {
  const d = new Date(toUtc(key) + days * 86400000)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

export const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/
