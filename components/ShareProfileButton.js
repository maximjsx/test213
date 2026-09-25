'use client'
import { useState } from 'react'
import Button from './ui/Button'

// Shares the public profile link, which previews as a streak card on Discord
// and social media (app/u/[username]/opengraph-image.js)
export default function ShareProfileButton({ username }) {
  const [copied, setCopied] = useState(false)

  async function share() {
    const url = `${window.location.origin}/u/${encodeURIComponent(username)}`
    if (navigator.share) {
      try {
        await navigator.share({ title: `${username} on Learn Bulgarian`, url })
        return
      } catch (e) {
        if (e.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <Button variant="secondary" size="sm" onClick={share}>
      {copied ? 'Link copied' : 'Share profile'}
    </Button>
  )
}
