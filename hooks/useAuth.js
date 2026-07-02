'use client'
import { useState, useEffect, useCallback } from 'react'

const AUTH_FLAG = 'bulgario_authed'

// user: undefined = loading, null = signed out, object = signed in
export function useAuth() {
  const [user, setUser] = useState(undefined)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      setUser(data.user || null)
      localStorage.setItem(AUTH_FLAG, data.user ? '1' : '0')
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    localStorage.setItem(AUTH_FLAG, '0')
    localStorage.removeItem('bulgario_synced')
    setUser(null)
  }, [])

  return { user, loading: user === undefined, refresh, logout }
}
