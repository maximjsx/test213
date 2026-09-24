// Spaced repetition with FSRS (the scheduler Anki uses since 23.10), through
// ts-fsrs. Shared by the review screen (interval previews on the buttons) and
// the server, which recomputes every review so due dates can't be forged.
import { fsrs, generatorParameters, createEmptyCard } from 'ts-fsrs'

export const DEFAULT_RETENTION = 0.9
export const DEFAULT_NEW_PER_DAY = 20
export const DEFAULT_REVIEWS_PER_DAY = 200

export const GRADES = [
  { grade: 1, label: 'Again', key: '1' },
  { grade: 2, label: 'Hard', key: '2' },
  { grade: 3, label: 'Good', key: '3' },
  { grade: 4, label: 'Easy', key: '4' },
]

// ts-fsrs State values
export const STATE_NEW = 0

const schedulers = new Map()
function scheduler(retention = DEFAULT_RETENTION) {
  if (!schedulers.has(retention)) {
    schedulers.set(retention, fsrs(generatorParameters({ request_retention: retention, enable_fuzz: true })))
  }
  return schedulers.get(retention)
}

// Stored shape: plain numbers plus Dates, so Mongo can index `due`
function toStored(card) {
  return {
    due: new Date(card.due),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review ? new Date(card.last_review) : null,
  }
}

export function newCardState(now = new Date()) {
  return toStored(createEmptyCard(now))
}

export function schedule(state, grade, now = new Date(), retention) {
  const { card, log } = scheduler(retention).next(state, now, grade)
  return { state: toStored(card), log }
}

// Next interval per grade, for the button labels: { 1: '1m', 3: '10m', ... }
export function previewIntervals(state, now = new Date(), retention) {
  const preview = scheduler(retention).repeat(state, now)
  return Object.fromEntries(GRADES.map(({ grade }) => [grade, formatInterval(new Date(preview[grade].card.due) - now)]))
}

export function formatInterval(ms) {
  const min = Math.max(1, Math.round(ms / 60000))
  if (min < 60) return `${min}m`
  const hours = Math.round(min / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d`
  const months = Math.round(days / 30)
  if (months < 12) return `${months}mo`
  return `${(days / 365).toFixed(1).replace(/\.0$/, '')}y`
}

export const cardKey = bg => bg.trim().toLowerCase().replace(/[.,!?;:"«»„“]/g, '').replace(/\s+/g, ' ')
