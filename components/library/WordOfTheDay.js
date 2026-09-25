'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { dayKey } from '../../lib/days'
import { speakBulgarian, unlockAudio } from '../../lib/audio'
import AddToDeckButton from '../decks/AddToDeckButton'
import styles from './Library.module.css'

function hash(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

// Same word for everyone on the same local day. Picked after mount, since the
// static page cannot know the visitor's date.
export default function WordOfTheDay({ words }) {
  const [word, setWord] = useState(null)
  useEffect(() => setWord(words[hash(dayKey()) % words.length]), [words])

  return (
    <section className={styles.panel} aria-labelledby="wotd">
      <h2 id="wotd" className={styles.panelTitle}>Word of the day</h2>
      {word ? (
        <>
          <div className={styles.wotdHead}>
            <p className={styles.wotdWord} lang="bg">{word.bg}</p>
            <button className={styles.speak} onClick={() => { unlockAudio(); speakBulgarian(word.bg) }} aria-label={`Listen to ${word.bg}`}>
              <img src="/icons/speaker.png" alt="" width={18} height={18} />
            </button>
            <AddToDeckButton size="sm" word={{ bg: word.bg, en: word.en, note: word.sense, source: { kind: 'glossary', ref: word.id } }} />
          </div>
          <p className={styles.wotdEn}>{word.en}</p>
          <p className={styles.wotdSense} lang="bg">{word.sense}</p>
          <Link href={`/glossary#${word.id}`} className={styles.panelLink}>More literary words</Link>
        </>
      ) : (
        <p className={styles.wotdSense}>&nbsp;</p>
      )}
    </section>
  )
}
