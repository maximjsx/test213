'use client'
import { useProgress } from '../../hooks/useProgress'
import { LETTERS, MAX_STRENGTH, MIN_SPEED_ITEMS, withStrength } from '../../lib/words'
import { speakBulgarian, unlockAudio } from '../../lib/audio'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import { ListSkeleton } from '../../components/PageSkeletons'
import styles from '../../components/Practice.module.css'

function LetterTile({ item }) {
  return (
    <button
      className={`${styles.letterTile} ${item.strength ? '' : styles.letterTileNew}`}
      onClick={() => { unlockAudio(); speakBulgarian(item.tts) }}
      aria-label={`${item.letter}, sounds like ${item.hint}`}
      title={item.hint}
    >
      <span className={styles.letterGlyph} lang="bg">{item.letter}{item.letter.toLowerCase()}</span>
      <span className={styles.letterSound}>{item.sound}</span>
      <span className={styles.letterBar} aria-hidden="true">
        <span className={styles.letterBarFill} style={{ width: `${(item.strength / MAX_STRENGTH) * 100}%` }} />
      </span>
    </button>
  )
}

export default function LettersPage() {
  const { state, hydrated } = useProgress()
  if (!hydrated) return <ListSkeleton />

  const letters = withStrength(LETTERS, state.lessons)
  const learned = letters.filter(l => l.strength > 0).length
  const canPlay = learned >= MIN_SPEED_ITEMS

  return (
    <div className={styles.page}>
      <PageHeader backHref="/practice" backLabel="Practice" title="Letters" />
      <main className={styles.main}>
        <div className={styles.summary}>
          <div className={styles.summaryText}>
            <span className={styles.summaryTitle}>The Bulgarian alphabet</span>
            <span className={styles.summarySub}>
              {learned
                ? `You know ${learned} of ${letters.length} letters. Tap any letter to hear it.`
                : 'Tap any letter to hear it, or start the alphabet topic to learn them.'}
            </span>
          </div>
          {canPlay
            ? <Button href="/speed?mode=letters">Speed round</Button>
            : <Button href="/topic/alphabet">Learn letters</Button>}
        </div>
        <div className={styles.letterGrid}>
          {letters.map(item => <LetterTile key={item.letter} item={item} />)}
        </div>
        <p className={styles.hint}>The bar under each letter fades when you have not practised it in a while.</p>
      </main>
    </div>
  )
}
