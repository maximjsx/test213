'use client'
import { useState, useEffect, useCallback } from 'react'

// Module-level cache so remounting (switching tabs) starts from the last known
// auth result instead of `undefined`, which would flash the signed-out UI.
let cachedUser = undefined

// user: undefined = loading, null = signed out, object = signed in
export function useAuth() {
  const [user, setUser] = useState(cachedUser)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      cachedUser = data.user || null
      setUser(cachedUser)
    } catch {
      cachedUser = null
      setUser(null)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    cachedUser = null
    setUser(null)
  }, [])

  return { user, loading: user === undefined, refresh, logout }
}
