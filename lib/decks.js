// Server-side decks and cards (Mongo). Account only; guests are asked to sign in.
//   decks:        { discordId, id, name, settings, createdAt, updatedAt }
//   cards:        { discordId, id, deckId, bg, en, note, key, source, fsrs, suspended, createdAt, updatedAt }
//   card_reviews: { discordId, cardId, deckId, grade, prevState, reviewedAt, day }
// `day` is the learner's local YYYY-MM-DD, sent by the client, so daily
// limits roll over at their midnight rather than the server's.
import { randomUUID } from 'crypto'
import getClientPromise from '@/lib/mongodb'
import { newCardState, schedule, cardKey, STATE_NEW, DEFAULT_RETENTION, DEFAULT_NEW_PER_DAY, DEFAULT_REVIEWS_PER_DAY } from '@/lib/srs'

export const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const MAX_DECKS = 50
const MAX_CARDS_PER_DECK = 5000
const LIMITS = { name: 60, bg: 200, en: 300, note: 500 }

let ready = null
function db() {
  ready ??= getClientPromise().then(async client => {
    const d = client.db('bulgario')
    await Promise.all([
      d.collection('decks').createIndex({ discordId: 1, id: 1 }, { unique: true }),
      d.collection('cards').createIndex({ discordId: 1, id: 1 }, { unique: true }),
      d.collection('cards').createIndex({ discordId: 1, deckId: 1, key: 1 }, { unique: true }),
      d.collection('cards').createIndex({ discordId: 1, 'fsrs.due': 1 }),
      d.collection('card_reviews').createIndex({ discordId: 1, day: 1 }),
    ])
    return d
  })
  return ready
}

const clip = (value, max) => String(value ?? '').trim().slice(0, max)

const DEFAULT_SETTINGS = { newPerDay: DEFAULT_NEW_PER_DAY, reviewsPerDay: DEFAULT_REVIEWS_PER_DAY, retention: DEFAULT_RETENTION }

function cleanSettings(raw = {}) {
  const int = (v, lo, hi, fallback) => (Number.isInteger(v) && v >= lo && v <= hi ? v : fallback)
  return {
    newPerDay: int(raw.newPerDay, 0, 500, DEFAULT_NEW_PER_DAY),
    reviewsPerDay: int(raw.reviewsPerDay, 0, 5000, DEFAULT_REVIEWS_PER_DAY),
    retention: [0.8, 0.85, 0.9, 0.95].includes(raw.retention) ? raw.retention : DEFAULT_RETENTION,
  }
}

const publicDeck = ({ _id, discordId, ...deck }) => deck
const publicCard = ({ _id, discordId, key, ...card }) => card

// Today's review counts per deck: new cards introduced and reviews done
async function todayCounts(d, discordId, day) {
  const rows = await d.collection('card_reviews').aggregate([
    { $match: { discordId, day } },
    { $group: { _id: { deckId: '$deckId', isNew: { $eq: ['$prevState', STATE_NEW] } }, n: { $sum: 1 } } },
  ]).toArray()
  const out = {}
  for (const { _id, n } of rows) {
    out[_id.deckId] ??= { newDone: 0, reviewsDone: 0 }
    out[_id.deckId][_id.isNew ? 'newDone' : 'reviewsDone'] += n
  }
  return out
}

export async function listDecks(discordId, day, now = new Date()) {
  const d = await db()
  const [decks, stats, done, keys] = await Promise.all([
    d.collection('decks').find({ discordId }).sort({ createdAt: 1 }).toArray(),
    d.collection('cards').aggregate([
      { $match: { discordId, suspended: { $ne: true } } },
      { $group: {
        _id: '$deckId',
        total: { $sum: 1 },
        fresh: { $sum: { $cond: [{ $eq: ['$fsrs.state', STATE_NEW] }, 1, 0] } },
        due: { $sum: { $cond: [{ $and: [{ $ne: ['$fsrs.state', STATE_NEW] }, { $lte: ['$fsrs.due', now] }] }, 1, 0] } },
      } },
    ]).toArray(),
    todayCounts(d, discordId, day),
    d.collection('cards').find({ discordId }, { projection: { _id: 0, key: 1, deckId: 1 } }).toArray(),
  ])
  const byDeck = Object.fromEntries(stats.map(s => [s._id, s]))
  return {
    decks: decks.map(deck => {
      const s = byDeck[deck.id] || { total: 0, fresh: 0, due: 0 }
      const t = done[deck.id] || { newDone: 0, reviewsDone: 0 }
      return {
        ...publicDeck(deck),
        total: s.total,
        newToday: Math.max(0, Math.min(s.fresh, deck.settings.newPerDay - t.newDone)),
        dueToday: Math.max(0, Math.min(s.due, deck.settings.reviewsPerDay - t.reviewsDone)),
      }
    }),
    // Which words are already in which deck, so "Add to deck" can show it
    cardKeys: keys,
  }
}

export async function createDeck(discordId, name) {
  const d = await db()
  if (await d.collection('decks').countDocuments({ discordId }) >= MAX_DECKS) return { error: 'too_many_decks' }
  const deck = {
    discordId, id: randomUUID(), name: clip(name, LIMITS.name) || 'My words',
    settings: { ...DEFAULT_SETTINGS }, createdAt: new Date(), updatedAt: new Date(),
  }
  await d.collection('decks').insertOne(deck)
  return { deck: publicDeck(deck) }
}

export async function updateDeck(discordId, id, { name, settings }) {
  const d = await db()
  const deck = await d.collection('decks').findOne({ discordId, id })
  if (!deck) return null
  const $set = { updatedAt: new Date() }
  if (name !== undefined) $set.name = clip(name, LIMITS.name) || deck.name
  if (settings !== undefined) $set.settings = cleanSettings({ ...deck.settings, ...settings })
  await d.collection('decks').updateOne({ discordId, id }, { $set })
  return publicDeck({ ...deck, ...$set })
}

export async function deleteDeck(discordId, id) {
  const d = await db()
  const res = await d.collection('decks').deleteOne({ discordId, id })
  if (!res.deletedCount) return false
  await Promise.all([
    d.collection('cards').deleteMany({ discordId, deckId: id }),
    d.collection('card_reviews').deleteMany({ discordId, deckId: id }),
  ])
  return true
}

export async function listCards(discordId, deckId) {
  const d = await db()
  const cards = await d.collection('cards').find({ discordId, deckId }).sort({ createdAt: -1 }).toArray()
  return cards.map(publicCard)
}

function cleanCardFields({ bg, en, note }) {
  return { bg: clip(bg, LIMITS.bg), en: clip(en, LIMITS.en), note: clip(note, LIMITS.note) }
}

const SOURCE_KINDS = ['course', 'glossary', 'media', 'wiki', 'custom']

export async function addCard(discordId, deckId, input) {
  const d = await db()
  const fields = cleanCardFields(input)
  if (!fields.bg) return { error: 'bg_required' }
  if (!await d.collection('decks').findOne({ discordId, id: deckId })) return { error: 'no_deck' }
  if (await d.collection('cards').countDocuments({ discordId, deckId }) >= MAX_CARDS_PER_DECK) return { error: 'deck_full' }

  const key = cardKey(fields.bg)
  const existing = await d.collection('cards').findOne({ discordId, deckId, key })
  if (existing) return { card: publicCard(existing), duplicate: true }

  const kind = SOURCE_KINDS.includes(input.source?.kind) ? input.source.kind : 'custom'
  const card = {
    discordId, id: randomUUID(), deckId, ...fields, key,
    source: { kind, ref: clip(input.source?.ref, 120) || undefined },
    fsrs: newCardState(), suspended: false, createdAt: new Date(), updatedAt: new Date(),
  }
  await d.collection('cards').insertOne(card)
  return { card: publicCard(card) }
}

export async function updateCard(discordId, id, patch) {
  const d = await db()
  const card = await d.collection('cards').findOne({ discordId, id })
  if (!card) return { error: 'not_found' }
  const $set = { updatedAt: new Date() }
  const fields = cleanCardFields({ ...card, ...patch })
  if (!fields.bg) return { error: 'bg_required' }
  Object.assign($set, fields, { key: cardKey(fields.bg) })
  if (typeof patch.suspended === 'boolean') $set.suspended = patch.suspended
  if (patch.deckId && patch.deckId !== card.deckId) {
    if (!await d.collection('decks').findOne({ discordId, id: patch.deckId })) return { error: 'no_deck' }
    $set.deckId = patch.deckId
  }
  try {
    await d.collection('cards').updateOne({ discordId, id }, { $set })
  } catch (e) {
    if (e.code === 11000) return { error: 'duplicate' }
    throw e
  }
  return { card: publicCard({ ...card, ...$set }) }
}

export async function deleteCard(discordId, id) {
  const d = await db()
  const res = await d.collection('cards').deleteOne({ discordId, id })
  return res.deletedCount > 0
}

// Due reviews first (oldest due first), then new cards, each within the
// deck's daily limits. `deckId` null means every deck.
export async function reviewQueue(discordId, deckId, day, now = new Date()) {
  const d = await db()
  const deckFilter = deckId ? { id: deckId } : {}
  const decks = await d.collection('decks').find({ discordId, ...deckFilter }).toArray()
  const done = await todayCounts(d, discordId, day)
  const queue = []
  for (const deck of decks) {
    const t = done[deck.id] || { newDone: 0, reviewsDone: 0 }
    const reviewRoom = Math.max(0, deck.settings.reviewsPerDay - t.reviewsDone)
    const newRoom = Math.max(0, deck.settings.newPerDay - t.newDone)
    const base = { discordId, deckId: deck.id, suspended: { $ne: true } }
    const [due, fresh] = await Promise.all([
      reviewRoom ? d.collection('cards').find({ ...base, 'fsrs.state': { $ne: STATE_NEW }, 'fsrs.due': { $lte: now } }).sort({ 'fsrs.due': 1 }).limit(reviewRoom).toArray() : [],
      newRoom ? d.collection('cards').find({ ...base, 'fsrs.state': STATE_NEW }).sort({ createdAt: 1 }).limit(newRoom).toArray() : [],
    ])
    queue.push(...due.map(c => ({ ...publicCard(c), retention: deck.settings.retention })))
    queue.push(...fresh.map(c => ({ ...publicCard(c), retention: deck.settings.retention })))
  }
  const dueFirst = (a, b) => (a.fsrs.state === STATE_NEW) - (b.fsrs.state === STATE_NEW) || new Date(a.fsrs.due) - new Date(b.fsrs.due)
  return queue.sort(dueFirst)
}

export async function recordReview(discordId, cardId, grade, day, now = new Date()) {
  const d = await db()
  const card = await d.collection('cards').findOne({ discordId, id: cardId })
  if (!card) return { error: 'not_found' }
  const deck = await d.collection('decks').findOne({ discordId, id: card.deckId })
  const next = schedule(card.fsrs, grade, now, deck?.settings.retention)
  await Promise.all([
    d.collection('cards').updateOne({ discordId, id: cardId }, { $set: { fsrs: next.state, updatedAt: now } }),
    d.collection('card_reviews').insertOne({
      discordId, cardId, deckId: card.deckId, grade, prevState: card.fsrs.state, reviewedAt: now, day,
    }),
  ])
  return { card: publicCard({ ...card, fsrs: next.state }) }
}

export async function deleteAllDeckData(discordId) {
  const d = await db()
  await Promise.all(['decks', 'cards', 'card_reviews'].map(c => d.collection(c).deleteMany({ discordId })))
}
