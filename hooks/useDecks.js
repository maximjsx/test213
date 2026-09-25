'use client'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { dayKey } from '../lib/days'
import { cardKey } from '../lib/srs'

// Module-level store like useProgress/useAuth: every component sees the same
// decks, and a remount (tab switch) starts from the last known state.
// status: loading | guest | ready | error
let cache = { status: 'loading', decks: [], cardKeys: [] }
let loadedFor = null
const listeners = new Set()

function publish(next) {
  cache = { ...cache, ...next }
  listeners.forEach(fn => fn(cache))
}

async function fetchDecks() {
  try {
    const res = await fetch(`/api/decks?day=${dayKey()}`)
    if (!res.ok) throw new Error(res.status)
    const data = await res.json()
    publish({ status: 'ready', decks: data.decks, cardKeys: data.cardKeys })
  } catch {
    publish({ status: 'error' })
  }
}

const LAST_DECK_KEY = 'bulgario_last_deck'
export function lastDeckId() {
  try { return localStorage.getItem(LAST_DECK_KEY) } catch { return null }
}
function rememberDeck(id) {
  try { localStorage.setItem(LAST_DECK_KEY, id) } catch {}
}

async function send(url, method, body) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || String(res.status))
  return data
}

export function useDecks() {
  const { user, loading } = useAuth()
  const [snap, setSnap] = useState(cache)

  useEffect(() => {
    listeners.add(setSnap)
    return () => { listeners.delete(setSnap) }
  }, [])

  const userId = user?.discordId
  useEffect(() => {
    if (loading) return
    if (!userId) {
      loadedFor = null
      publish({ status: 'guest', decks: [], cardKeys: [] })
      return
    }
    // Refresh on every mount so due counts stay current, but keep showing the
    // cached decks meanwhile.
    if (loadedFor !== userId) publish({ status: 'loading' })
    loadedFor = userId
    fetchDecks()
  }, [userId, loading])

  const createDeck = useCallback(async (name) => {
    const { deck } = await send('/api/decks', 'POST', { name })
    publish({ decks: [...cache.decks, { ...deck, total: 0, newToday: 0, dueToday: 0 }] })
    rememberDeck(deck.id)
    return deck
  }, [])

  const addCard = useCallback(async (deckId, card) => {
    const result = await send(`/api/decks/${deckId}/cards`, 'POST', card)
    rememberDeck(deckId)
    if (!result.duplicate) {
      publish({
        cardKeys: [...cache.cardKeys, { key: cardKey(result.card.bg), deckId }],
        decks: cache.decks.map(d => d.id === deckId ? { ...d, total: d.total + 1 } : d),
      })
      fetchDecks()
    }
    return result
  }, [])

  const decksWith = useCallback(
    (bg) => {
      const key = cardKey(bg)
      return snap.cardKeys.filter(c => c.key === key).map(c => c.deckId)
    },
    [snap.cardKeys]
  )

  const dueCount = snap.decks.reduce((n, d) => n + d.dueToday + d.newToday, 0)

  return { ...snap, dueCount, refresh: fetchDecks, createDeck, addCard, decksWith }
}

export { send as deckRequest }
