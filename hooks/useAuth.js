'use client'
import { useState, useEffect, useCallback } from 'react'

// user: undefined = loading, null = signed out, object = signed in
export function useAuth() {
  const [user, setUser] = useState(undefined)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      setUser(data.user || null)
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    setUser(null)
  }, [])

  return { user, loading: user === undefined, refresh, logout }
}
