'use client'
import { useState, useEffect, useCallback } from 'react'

// The browser fires `beforeinstallprompt` once, early, and only Chrome/Android
// (and desktop Chromium) ever fire it. We capture it at module scope so both
// the site-wide banner and the profile button can trigger the same saved event,
// even if they mount after the event already fired.
let deferredPrompt = null
const listeners = new Set()
let initialized = false

function notify() { listeners.forEach(fn => fn()) }

function initOnce() {
  if (initialized || typeof window === 'undefined') return
  initialized = true
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    notify()
  })
}

function detectStandalone() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true
}

function detectIOS() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  // iPadOS 13+ masquerades as desktop Safari, so also treat a touch-capable Mac as iOS
  return /iphone|ipad|ipod/i.test(ua)
    || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
}

export function useInstallPrompt() {
  const [ready, setReady] = useState(false)
  const [, force] = useState(0)
  const [env, setEnv] = useState({ ios: false, standalone: false })

  useEffect(() => {
    initOnce()
    setEnv({ ios: detectIOS(), standalone: detectStandalone() })
    setReady(true)
    const fn = () => force(n => n + 1)
    listeners.add(fn)
    return () => { listeners.delete(fn) }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return 'unavailable'
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    deferredPrompt = null
    notify()
    return outcome // 'accepted' | 'dismissed'
  }, [])

  return {
    ready,
    canPromptNative: !!deferredPrompt,
    ios: env.ios,
    standalone: env.standalone,
    promptInstall,
  }
}
