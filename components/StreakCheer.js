'use client'
import { useEffect } from 'react'
import Bear from './Bear'
import { playStreak, hapticCorrect } from '../lib/audio'
import styles from './StreakCheer.module.css'

// Each milestone gets the next scene, so a long streak keeps surprising
const SCENES = [
  { name: 'jump', mood: 'cheer', line: 'You are on fire. Keep it going!' },
  { name: 'run', mood: 'cheer', line: 'Nothing can stop you now.' },
  { name: 'hang', mood: 'cheer', line: 'Hanging in there like a pro.' },
  { name: 'berries', mood: 'munch', line: 'A berry break, well earned.' },
]
const SPARKS = 10
const BERRIES = 4

// 5, 10, 20, 30 and on: early enough to feel it, rare enough to stay special
export function isCheerStreak(count) {
  return count === 5 || (count >= 10 && count % 10 === 0)
}

function sceneFor(count) {
  const index = count < 10 ? 0 : count / 10
  return SCENES[index % SCENES.length]
}

export default function StreakCheer({ count }) {
  const scene = sceneFor(count)

  useEffect(() => {
    playStreak()
    hapticCorrect()
  }, [])

  return (
    <div className={styles.wrap}>
      <div className={`${styles.stage} ${styles[scene.name]}`}>
        <span className={styles.ring} />
        <span className={`${styles.ring} ${styles.ringLate}`} />
        {Array.from({ length: SPARKS }, (_, i) => (
          <span key={i} className={styles.spark} style={{ '--angle': `${(360 / SPARKS) * i}deg`, '--delay': `${(i % 3) * 60}ms` }} />
        ))}
        <div className={styles.actor}>
          {scene.name === 'hang' && <span className={styles.vine} />}
          {scene.name === 'run' && [0, 1, 2].map(i => <span key={i} className={styles.dust} style={{ '--i': i }} />)}
          <Bear mood={scene.mood} size={150} />
        </div>
        {scene.name === 'berries' && Array.from({ length: BERRIES }, (_, i) => (
          <span key={i} className={styles.berry} style={{ '--i': i }} />
        ))}
      </div>
      <div className={styles.count}>
        <img src="/icons/fire.png" alt="" width={34} height={34} />
        <span>{count}</span>
      </div>
      <h2 className={styles.title}>{count} in a row!</h2>
      <p className={styles.line}>{scene.line}</p>
    </div>
  )
}
