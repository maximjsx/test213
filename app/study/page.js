'use client'
import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useProgress } from '../../hooks/useProgress'
import { useDecks, deckRequest } from '../../hooks/useDecks'
import { WORDS, withStrength } from '../../lib/words'
import { findLevel } from '../../lib/course'
import { DRILL_MODES, MIN_DRILL_WORDS, buildDrill, usableWords } from '../../lib/wordDrills'
import { shuffle } from '../../lib/checker'
import { speakBulgarian, unlockAudio } from '../../lib/audio'
import ExerciseRunner from '../../components/ExerciseRunner'
import LessonComplete from '../../components/LessonComplete'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Bear from '../../components/Bear'
import { ListSkeleton } from '../../components/PageSkeletons'
import { ArrowRight } from '../../components/home/ResumeCard'
import styles from './page.module.css'
import deckStyles from '../../components/decks/Decks.module.css'

const STUDY_LEVEL = { id: 'study', title: 'Word practice', color: '#00bfa0' }
const COINS_PER_CORRECT = 1

// list=course | topic:<id> | deck:<id>  ->  { title, back, words } or null while loading
function useWordList(list) {
  const { state, hydrated } = useProgress()
  const { status, decks } = useDecks()
  const [deckCards, setDeckCards] = useState(null)
  const [kind, id] = (list || 'course').split(':')

  useEffect(() => {
    if (kind !== 'deck' || status !== 'ready') return
    deckRequest(`/api/decks/${id}/cards`, 'GET')
      .then(d => setDeckCards(d.cards.filter(c => !c.suspended)))
      .catch(() => setDeckCards([]))
  }, [kind, id, status])

  if (kind === 'deck') {
    if (status === 'guest') return { title: 'Deck', back: '/decks', words: [] }
    const deck = decks.find(d => d.id === id)
    if (!deckCards) return null
    return { title: deck?.name || 'Deck', back: `/decks/${id}`, words: deckCards }
  }
  if (!hydrated) return null
  if (kind === 'topic') {
    const level = findLevel(id)
    return { title: level?.title || 'Topic', back: `/topic/${id}`, words: WORDS.filter(w => w.levelId === id) }
  }
  return { title: 'Your words', back: '/practice', words: withStrength(WORDS, state.lessons).filter(w => w.strength > 0) }
}

function ModePicker({ list, source }) {
  const count = usableWords(source.words).length
  return (
    <div className={deckStyles.page}>
      <PageHeader backHref={source.back} backLabel="Back" title={source.title} />
      <main className={deckStyles.main}>
        {count < MIN_DRILL_WORDS ? (
          <div className={deckStyles.empty}>
            <Bear mood="happy" size={90} />
            <p className={deckStyles.emptyTitle}>A few more words first</p>
            <p className={deckStyles.muted}>Practice needs at least {MIN_DRILL_WORDS} words with a translation. This list has {count}.</p>
            <Button href={source.back} variant="secondary">Go back</Button>
          </div>
        ) : (
          <>
            <p className={deckStyles.muted}>{count} words. Pick how you want to practise them.</p>
            <div className={deckStyles.list}>
              {Object.entries(DRILL_MODES).map(([mode, m]) => (
                <Link key={mode} href={`/study?list=${encodeURIComponent(list)}&mode=${mode}`} className={styles.mode}>
                  <span className={styles.modeIcon}><img src={m.icon} alt="" width={28} height={28} /></span>
                  <span className={styles.modeText}>
                    <span className={styles.modeTitle}>{m.title}</span>
                    <span className={deckStyles.muted}>{m.blurb}</span>
                  </span>
                  <ArrowRight size={20} />
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

// A free run: no scheduling, just "knew it" or "again", and missed cards
// come back at the end of the round.
function Flashcards({ words, back, onDone }) {
  const [queue, setQueue] = useState(() => shuffle(usableWords(words)).slice(0, 20))
  const [revealed, setRevealed] = useState(false)
  const [known, setKnown] = useState(0)
  const [seen] = useState(queue.length)
  const card = queue[0]

  useEffect(() => {
    if (!card) return
    unlockAudio()
    speakBulgarian(card.tts || card.bg)
  }, [card])

  function answer(knewIt) {
    setRevealed(false)
    if (knewIt) setKnown(n => n + 1)
    setQueue(q => knewIt ? q.slice(1) : [...q.slice(1), q[0]])
  }

  useEffect(() => { if (!card) onDone(known, seen) }, [card]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!card) return null

  return (
    <div className={deckStyles.page}>
      <PageHeader backHref={back} backLabel="Stop" title="Flashcards">
        <span className={styles.left}>{queue.length} left</span>
      </PageHeader>
      <main className={deckStyles.main}>
        <button className={styles.flashcard} onClick={() => setRevealed(true)} aria-label={revealed ? undefined : 'Show the answer'}>
          <span className={styles.front} lang="bg">{card.bg}</span>
          {revealed
            ? <span className={styles.answer}>{card.en}</span>
            : <span className={deckStyles.muted}>Tap to reveal</span>}
        </button>
        {revealed && (
          <div className={styles.choices}>
            <Button variant="secondary" size="lg" onClick={() => answer(false)}>Again</Button>
            <Button size="lg" onClick={() => answer(true)}>Knew it</Button>
          </div>
        )}
      </main>
    </div>
  )
}

function Study() {
  const params = useSearchParams()
  const router = useRouter()
  const list = params.get('list') || 'course'
  const mode = params.get('mode')
  const source = useWordList(list)
  const { completePractice } = useProgress()
  const [round, setRound] = useState(0)
  const [result, setResult] = useState(null)

  const exercises = useMemo(
    () => (source && DRILL_MODES[mode] && mode !== 'flashcards' ? buildDrill(source.words, mode) : []),
    [source?.words, mode, round] // eslint-disable-line react-hooks/exhaustive-deps
  )

  if (!source) return <ListSkeleton rows={4} />
  const pickerHref = `/study?list=${encodeURIComponent(list)}`
  if (!DRILL_MODES[mode] || usableWords(source.words).length < MIN_DRILL_WORDS) return <ModePicker list={list} source={source} />

  function finish(correct, total, maxCombo = 0, mistakes = []) {
    const coins = correct * COINS_PER_CORRECT
    completePractice(coins, { accuracyPct: total ? Math.round((correct / total) * 100) : 0, maxCombo, perfect: correct === total })
    setResult({ score: { correct, total, maxCombo, mistakes }, coins })
  }

  if (result) {
    return (
      <LessonComplete
        lesson={{ id: 'study', title: DRILL_MODES[mode].title, coins: 0 }}
        level={STUDY_LEVEL}
        score={result.score}
        coinsEarned={result.coins}
        mistakes={result.score.mistakes}
        onContinue={() => router.push(pickerHref)}
        onRetry={() => { setResult(null); setRound(r => r + 1) }}
      />
    )
  }

  if (mode === 'flashcards') {
    return <Flashcards key={round} words={source.words} back={pickerHref} onDone={(known, total) => finish(known, total)} />
  }

  return (
    <ExerciseRunner
      key={round}
      lesson={{ id: 'study', title: DRILL_MODES[mode].title, coins: 0 }}
      level={STUDY_LEVEL}
      exercises={exercises}
      onComplete={s => finish(s.correct, s.total, s.maxCombo, s.mistakes)}
      onQuit={() => router.push(pickerHref)}
    />
  )
}

export default function StudyPage() {
  return <Suspense fallback={<ListSkeleton rows={4} />}><Study /></Suspense>
}
