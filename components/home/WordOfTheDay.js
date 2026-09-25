'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { dayKey } from '../../lib/days'
import { speakBulgarian, unlockAudio } from '../../lib/audio'
import AddToDeckButton from '../decks/AddToDeckButton'
import styles from './WordOfTheDay.module.css'

// Kept across tab switches so the card does not pop in again
let cached = null

export default function WordOfTheDay({ className = '' }) {
  const day = dayKey()
  const [word, setWord] = useState(cached?.day === day ? cached.word : null)

  useEffect(() => {
    if (cached?.day === day) return
    let alive = true
    fetch(`/api/word-of-the-day?day=${day}`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!alive || !data?.word) return
        cached = { day, word: data.word }
        setWord(data.word)
      })
      .catch(() => {})
    return () => { alive = false }
  }, [day])

  if (!word) return null

  return (
    <section className={`${styles.card} ${className}`} aria-labelledby="wotd-title">
      <div className={styles.top}>
        <h2 id="wotd-title" className={styles.label}>Word of the day</h2>
        <Link href={`/glossary#${word.id}`} className={styles.more}>Glossary</Link>
      </div>
      <div className={styles.head}>
        <button className={styles.speak} onClick={() => { unlockAudio(); speakBulgarian(word.bg) }} aria-label={`Listen to ${word.bg}`}>
          <img src="/icons/speaker.png" alt="" width={18} height={18} />
        </button>
        <div className={styles.words}>
          <p className={styles.bg} lang="bg">{word.bg}</p>
          {word.en && <p className={styles.en}>{word.en}</p>}
        </div>
        <AddToDeckButton size="sm" word={{ bg: word.bg, en: word.en, note: word.sense, source: { kind: 'glossary', ref: word.id } }} />
      </div>
      <p className={styles.sense} lang="bg">{word.sense}</p>
    </section>
  )
}
