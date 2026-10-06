'use client'
import { useEffect } from 'react'
import Bear from './Bear'
import { playStreak, hapticCorrect } from '../lib/audio'
import styles from './StreakCheer.module.css'

const LINES = [
  'You are on fire. Keep it going!',
  'Nothing can stop you now.',
  'Your brain is soaking it up.',
  'Bulgarian is starting to click.',
]
const SPARKS = 10

// Short break after every few correct answers in a row, so long lessons feel like progress
export default function StreakCheer({ count }) {
  useEffect(() => {
    playStreak()
    hapticCorrect()
  }, [])

  return (
    <div className={styles.wrap}>
      <div className={styles.stage}>
        <span className={styles.ring} />
        <span className={`${styles.ring} ${styles.ringLate}`} />
        {Array.from({ length: SPARKS }, (_, i) => (
          <span key={i} className={styles.spark} style={{ '--angle': `${(360 / SPARKS) * i}deg`, '--delay': `${(i % 3) * 60}ms` }} />
        ))}
        <Bear mood="cheer" size={150} />
      </div>
      <div className={styles.count}>
        <img src="/icons/fire.png" alt="" width={34} height={34} />
        <span>{count}</span>
      </div>
      <h2 className={styles.title}>{count} in a row!</h2>
      <p className={styles.line}>{LINES[(count / 5 - 1) % LINES.length]}</p>
    </div>
  )
}
