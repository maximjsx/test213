// Tiny coordinator so pages can react once the welcome splash has finished its
// exit. Module state persists for the life of the page load: `finished` starts
// false on a hard load (while the splash plays) and flips true when it's done,
// staying true across client-side navigations.
let finished = false
const waiters = new Set()

export function isSplashFinished() {
  return finished
}

export function markSplashFinished() {
  finished = true
  waiters.forEach(fn => fn())
  waiters.clear()
}

// Runs `fn` when the splash is done — immediately if it already is. Returns an
// unsubscribe so effects can clean up.
export function onSplashFinished(fn) {
  if (finished) { fn(); return () => {} }
  waiters.add(fn)
  return () => waiters.delete(fn)
}
