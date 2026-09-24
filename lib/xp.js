// `xp` on a user is a spendable balance (freezes, packs). Rankings use XP
// earned instead, from the per-day history, so buying things never costs rank.

export const XP_HISTORY_PROJECTION = { xp: 1, 'progress.xpByDay': 1 }

export function xpSince(xpByDay, startKey = '') {
  if (!xpByDay) return 0
  let sum = 0
  for (const [day, xp] of Object.entries(xpByDay)) {
    if (day >= startKey) sum += Number(xp) || 0
  }
  return sum
}

// The balance can never exceed what was earned, so it covers XP from before
// the per-day history existed.
export function lifetimeXp(user) {
  return Math.max(xpSince(user.progress?.xpByDay), Number(user.xp) || 0)
}

export function xpBetween(xpByDay, startKey, endKey) {
  if (!xpByDay) return 0
  let sum = 0
  for (const [day, xp] of Object.entries(xpByDay)) {
    if (day >= startKey && day < endKey) sum += Number(xp) || 0
  }
  return sum
}

function pad(n) { return String(n).padStart(2, '0') }
export function dateKey(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }

// Monday of the week `weeksAgo` weeks back, as a YYYY-MM-DD key
export function weekStartKey(weeksAgo = 0, now = new Date()) {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7) - weeksAgo * 7)
  return dateKey(monday)
}
