'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ExerciseRunner from '../../../../components/ExerciseRunner'
import styles from './page.module.css'

export default function PlayLesson({ level, lesson }) {
  const router = useRouter()
  const [phase, setPhase] = useState('playing')

  if (phase === 'done') return (
    <div className={styles.done}>
      <div className={styles.doneInner}>
        <div className={styles.doneEmoji}>🎉</div>
        <h2 className={styles.doneTitle}>Lesson complete!</h2>
        <p className={styles.doneSub}>{lesson.title}</p>
        <div className={styles.xpBadge} style={{ borderColor: level.color, color: level.color }}>
          +{lesson.xp} XP
        </div>
        <div className={styles.doneActions}>
          <button className={styles.doneAgain} style={{ borderColor: level.color, color: level.color }} onClick={() => setPhase('playing')}>
            Play Again
          </button>
          <button className={styles.doneBack} onClick={() => router.push('/')}>
            ← Home
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <ExerciseRunner
      lesson={lesson}
      level={level}
      exercises={lesson.exercises}
      onComplete={() => setPhase('done')}
      onQuit={() => router.push('/')}
    />
  )
}
