'use client'
import Link from 'next/link'
import { PUBLIC_LEVELS } from '../../lib/course'
import { useProgress } from '../../hooks/useProgress'
import { WORDS, MIN_SPEED_ITEMS, withStrength } from '../../lib/words'
import { speakBulgarian, unlockAudio } from '../../lib/audio'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import { ListSkeleton } from '../../components/PageSkeletons'
import StrengthBars from '../../components/StrengthBars'
import AddToDeckButton from '../../components/decks/AddToDeckButton'
import styles from '../../components/Practice.module.css'

function play(text) {
  unlockAudio()
  speakBulgarian(text)
}

function TopicWords({ level, words }) {
  const learned = words.filter(w => w.strength > 0)
  const remaining = words.length - learned.length
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>{level.title}</h2>
        <span className={styles.sectionCount}>{learned.length} / {words.length}</span>
      </div>
      {learned.map(w => (
        <div key={w.bg} className={styles.wordRow}>
          <button className={styles.speak} onClick={() => play(w.tts)} aria-label={`Listen to ${w.bg}`}>
            <img src="/icons/speaker.png" alt="" width={20} height={20} />
          </button>
          <div className={styles.wordText}>
            <span className={styles.wordBg} lang="bg">{w.bg}</span>
            <span className={styles.wordEn}>{w.en}</span>
          </div>
          <StrengthBars strength={w.strength} />
          <AddToDeckButton size="sm" word={{ bg: w.bg, en: w.en, source: { kind: 'course', ref: w.lessonId } }} />
        </div>
      ))}
      {remaining > 0 && (
        <p className={styles.lockedNote}>
          {remaining} more {remaining === 1 ? 'word' : 'words'} to learn in <Link href={`/topic/${level.id}`}>{level.title}</Link>
        </p>
      )}
    </section>
  )
}

export default function WordsPage() {
  const { state, hydrated } = useProgress()
  if (!hydrated) return <ListSkeleton />

  const words = withStrength(WORDS, state.lessons)
  const learned = words.filter(w => w.strength > 0)
  const weak = learned.filter(w => w.strength <= 2).length
  const canPlay = learned.length >= MIN_SPEED_ITEMS

  return (
    <div className={styles.page}>
      <PageHeader backHref="/practice" backLabel="Practice" title="Words" />
      <main className={`${styles.main} ${styles.wide}`}>
        <div className={styles.summary}>
          <div className={styles.summaryText}>
            <span className={styles.summaryTitle}>{learned.length} of {words.length} words learned</span>
            <span className={styles.summarySub}>
              {!learned.length ? 'Finish a lesson to start your word list.'
                : weak ? `${weak} ${weak === 1 ? 'word needs' : 'words need'} practice. Redo their lesson or play a speed round.`
                : 'All your words are strong. Nice work.'}
            </span>
          </div>
          <Button href="/speed?mode=words" aria-disabled={!canPlay}>Speed round</Button>
        </div>
        {PUBLIC_LEVELS.filter(l => l.id !== 'alphabet').map(level => (
          <TopicWords key={level.id} level={level} words={words.filter(w => w.levelId === level.id)} />
        ))}
      </main>
    </div>
  )
}
