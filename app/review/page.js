'use client'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useDecks, deckRequest } from '../../hooks/useDecks'
import { useProgress } from '../../hooks/useProgress'
import { dayKey } from '../../lib/days'
import { ECONOMY } from '../../lib/progressEngine'
import { speakBulgarian, unlockAudio, hapticTap } from '../../lib/audio'
import { GRADES, previewIntervals } from '../../lib/srs'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Bear from '../../components/Bear'
import { ListSkeleton } from '../../components/PageSkeletons'
import SignInCard from '../../components/decks/SignInCard'
import styles from './page.module.css'
import deckStyles from '../../components/decks/Decks.module.css'

// Cards due again within this window (learning steps like "10m") come back
// in the same session instead of waiting for the next visit.
const LEARN_AHEAD_MS = 20 * 60000

function Flashcard({ card, revealed, onReveal, onGrade }) {
  const intervals = previewIntervals(card.fsrs, new Date(), card.retention)

  useEffect(() => {
    unlockAudio()
    speakBulgarian(card.bg)
  }, [card.id, card.bg])

  useEffect(() => {
    function onKey(e) {
      if (e.target.closest?.('input, textarea')) return
      if (!revealed && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); onReveal() }
      if (revealed && ['1', '2', '3', '4'].includes(e.key)) onGrade(Number(e.key))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [revealed, onReveal, onGrade])

  return (
    <div className={styles.stage}>
      <div className={styles.flashcard}>
        <button className={styles.speak} onClick={() => speakBulgarian(card.bg)} aria-label="Listen again">
          <img src="/icons/speaker.png" alt="" width={26} height={26} />
        </button>
        <p className={styles.front} lang="bg">{card.bg}</p>
        {revealed && (
          <div className={styles.back}>
            <p className={styles.answer}>{card.en || 'No translation yet'}</p>
            {card.note && <p className={styles.note}>{card.note}</p>}
          </div>
        )}
      </div>
      <div className={styles.controls}>
        {revealed ? (
          <div className={styles.grades}>
            {GRADES.map(g => (
              <button key={g.grade} className={`${styles.grade} ${styles[`grade${g.grade}`]}`} onClick={() => { hapticTap(); onGrade(g.grade) }}>
                <span className={styles.gradeLabel}>{g.label}</span>
                <span className={styles.gradeTime}>{intervals[g.grade]}</span>
              </button>
            ))}
          </div>
        ) : (
          <Button size="lg" block onClick={onReveal}>Show answer</Button>
        )}
        <p className={styles.keys}>{revealed ? 'Keys 1 to 4' : 'Space to reveal'}</p>
      </div>
    </div>
  )
}

function Review() {
  const deckId = useSearchParams().get('deck')
  const { status, refresh } = useDecks()
  const { syncFromServer } = useProgress()
  const [queue, setQueue] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [reviewed, setReviewed] = useState(0)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(0)

  useEffect(() => {
    if (status !== 'ready') return
    const deckParam = deckId ? `&deck=${encodeURIComponent(deckId)}` : ''
    deckRequest(`/api/review?day=${dayKey()}${deckParam}`, 'GET')
      .then(d => setQueue(d.cards))
      .catch(() => setError('Your cards could not be loaded.'))
  }, [status, deckId])

  const grade = useCallback(async (g) => {
    const card = queue[0]
    setRevealed(false)
    setQueue(q => q.slice(1))
    setReviewed(n => n + 1)
    setSaving(n => n + 1)
    try {
      const { card: updated, progress } = await deckRequest('/api/review', 'POST', { cardId: card.id, grade: g, day: dayKey() })
      syncFromServer(progress)
      if (new Date(updated.fsrs.due) - Date.now() < LEARN_AHEAD_MS) {
        setQueue(q => [...q, { ...updated, retention: card.retention }])
      }
    } catch {
      setError('A review did not save. Check your connection.')
    } finally {
      setSaving(n => n - 1)
    }
  }, [queue, syncFromServer])

  // A learning card may still be on its way back into the queue
  const done = queue && queue.length === 0 && saving === 0
  useEffect(() => {
    if (!done) return
    refresh()
  }, [done, refresh])

  if (status === 'loading' || (status === 'ready' && !queue && !error)) return <ListSkeleton rows={1} />

  const back = deckId ? `/decks/${deckId}` : '/decks'
  return (
    <div className={deckStyles.page}>
      <PageHeader backHref={back} backLabel="Decks" title="Review">
        {queue?.length > 0 && <span className={styles.left}>{queue.length} left</span>}
      </PageHeader>
      <main className={deckStyles.main}>
        {status === 'guest' && <SignInCard />}
        {error && <p className={deckStyles.error}>{error}</p>}
        {queue?.length > 0 && <Flashcard card={queue[0]} revealed={revealed} onReveal={() => setRevealed(true)} onGrade={grade} />}
        {done && (
          <div className={deckStyles.empty}>
            <Bear mood={reviewed ? 'cheer' : 'happy'} size={96} />
            <p className={deckStyles.emptyTitle}>{reviewed ? 'All done for now' : 'Nothing due right now'}</p>
            <p className={deckStyles.muted}>
              {reviewed
                ? `You reviewed ${reviewed} ${reviewed === 1 ? 'card' : 'cards'}. Reviews earn a coin each, up to ${ECONOMY.reviewCoinCap} a day.`
                : 'Come back later, or add more words to your decks.'}
            </p>
            <Button href={back} variant="secondary">Back to decks</Button>
          </div>
        )}
      </main>
    </div>
  )
}

export default function ReviewPage() {
  return <Suspense fallback={<ListSkeleton rows={1} />}><Review /></Suspense>
}
