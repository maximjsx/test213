// `coins` on a user is a spendable balance (streak freezes, special topics).
// Rankings use coins earned instead, from the per-day history, so spending
// never costs rank.

export const COIN_HISTORY_PROJECTION = { 'progress.coinsByDay': 1 }

export function coinsSince(coinsByDay, startKey = '') {
  if (!coinsByDay) return 0
  let sum = 0
  for (const [day, coins] of Object.entries(coinsByDay)) {
    if (day >= startKey) sum += Number(coins) || 0
  }
  return sum
}

export function coinsBetween(coinsByDay, startKey, endKey) {
  if (!coinsByDay) return 0
  let sum = 0
  for (const [day, coins] of Object.entries(coinsByDay)) {
    if (day >= startKey && day < endKey) sum += Number(coins) || 0
  }
  return sum
}

export function lifetimeCoins(user) {
  return coinsSince(user.progress?.coinsByDay)
}

function pad(n) { return String(n).padStart(2, '0') }
export function dateKey(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }

// Monday of the week `weeksAgo` weeks back, as a YYYY-MM-DD key
export function weekStartKey(weeksAgo = 0, now = new Date()) {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7) - weeksAgo * 7)
  return dateKey(monday)
}
