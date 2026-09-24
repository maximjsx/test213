'use client'
import { useState, useEffect, useCallback } from 'react'

// Module-level store so remounting (switching tabs) starts from the last known
// auth result instead of `undefined`, which would flash the signed-out UI, and
// so a refresh in one component (say, after joining a Discord server) reaches
// every other component using the hook.
let cachedUser = undefined
let inFlight = null
const listeners = new Set()

function publish(user) {
  cachedUser = user
  listeners.forEach(fn => fn(user))
}

async function load(sync) {
  try {
    const res = await fetch(sync ? '/api/auth/me?sync=1' : '/api/auth/me')
    const data = await res.json()
    publish(data.user || null)
  } catch {
    publish(null)
  }
  return cachedUser
}

// Mounts share one request; sync asks the server to re-read Discord now
// (after joining a server) and always goes out.
function fetchUser({ sync = false } = {}) {
  if (sync) return load(true)
  inFlight ??= load(false).finally(() => { inFlight = null })
  return inFlight
}

// user: undefined = loading, null = signed out, object = signed in
export function useAuth() {
  const [user, setUser] = useState(cachedUser)

  useEffect(() => {
    listeners.add(setUser)
    fetchUser()
    return () => { listeners.delete(setUser) }
  }, [])

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    publish(null)
  }, [])

  return { user, loading: user === undefined, refresh: fetchUser, logout }
}
