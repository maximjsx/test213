'use client'
import Link from 'next/link'
import { useProgress } from '../../hooks/useProgress'
import { WORDS, LETTERS, withStrength } from '../../lib/words'
import PageHeader from '../../components/ui/PageHeader'
import { ListSkeleton } from '../../components/PageSkeletons'
import { PracticeMistakesLink, ArrowRight } from '../../components/home/ResumeCard'
import ReviewCta from '../../components/decks/ReviewCta'
import { useDecks } from '../../hooks/useDecks'
import styles from '../../components/Hub.module.css'

function HubLink({ href, icon, title, sub }) {
  return (
    <Link href={href} className={styles.link}>
      <span className={styles.icon}>{icon}</span>
      <span className={styles.text}>
        <span className={styles.title}>{title}</span>
        <span className={styles.sub}>{sub}</span>
      </span>
      <span className={styles.arrow}><ArrowRight size={20} /></span>
    </Link>
  )
}

const img = src => <img src={src} alt="" width={30} height={30} />

export default function PracticePage() {
  const { state, hydrated } = useProgress()
  const { status: deckStatus, decks, dueCount } = useDecks()
  if (!hydrated) return <ListSkeleton />

  const learnedWords = withStrength(WORDS, state.lessons).filter(w => w.strength > 0).length
  const learnedLetters = withStrength(LETTERS, state.lessons).filter(l => l.strength > 0).length
  const mistakes = Object.keys(state.wrongExercises || {}).length

  return (
    <div className={styles.page}>
      <PageHeader backHref={null} title="Practice" />
      <main className={styles.main}>
        <ReviewCta count={dueCount} />
        <PracticeMistakesLink count={mistakes} />

        <section className={styles.group} aria-labelledby="decks">
          <h2 id="decks" className={styles.groupTitle}>Spaced repetition</h2>
          <HubLink
            href="/decks"
            icon={img('/icons/gift_box.png')}
            title="Decks"
            sub={deckStatus === 'ready'
              ? `${decks.length} ${decks.length === 1 ? 'deck' : 'decks'}, reviewed on a smart schedule`
              : 'Save words and review them before you forget'}
          />
          <HubLink href="/study?list=course" icon={img('/icons/heart_with_flame.png')} title="Practise your words" sub="Flashcards, multiple choice, typing and listening" />
        </section>

        <section className={styles.group} aria-labelledby="browse">
          <h2 id="browse" className={styles.groupTitle}>Review what you know</h2>
          <HubLink href="/words" icon={img('/icons/open_book.png')} title="Words" sub={`${learnedWords} of ${WORDS.length} learned, with audio`} />
          <HubLink href="/letters" icon={<span className={styles.glyph} lang="bg">Аа</span>} title="Letters" sub={`${learnedLetters} of ${LETTERS.length} letters, tap to hear them`} />
          <HubLink href="/practice/handwriting" icon={img('/icons/another_star.png')} title="Handwriting" sub="Write letters, words and sentences in cursive" />
        </section>

        <section className={styles.group} aria-labelledby="grammar">
          <h2 id="grammar" className={styles.groupTitle}>Grammar</h2>
          <HubLink href="/practice/aspect" icon={<span className={styles.glyph} lang="bg">я/а</span>} title="Verb aspect pairs" sub="купувам or купя? When to use which" />
        </section>

        <section className={styles.group} aria-labelledby="games">
          <h2 id="games" className={styles.groupTitle}>Games</h2>
          <HubLink href="/speed?mode=words" icon={img('/icons/lightning.png')} title="Word speed round" sub="Match as many words as you can in 60 seconds" />
          <HubLink href="/speed?mode=letters" icon={img('/icons/star.png')} title="Letter speed round" sub="Match letters to their sounds against the clock" />
          <HubLink href="/practice/typing" icon={img('/icons/keyboard.png')} title="Typing test" sub="How fast can you type Cyrillic? 30 or 60 seconds" />
        </section>
      </main>
    </div>
  )
}
