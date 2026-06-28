'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import ExerciseRunner from '../../../../../components/ExerciseRunner'
import styles from './page.module.css'

function loadLevel(id) {
  try {
    const levels = JSON.parse(localStorage.getItem('builder_levels') || '[]')
    const found = levels.find(l => l.id === id)
    if (found) return found
    const temp = JSON.parse(localStorage.getItem('builder_temp_level') || 'null')
    if (temp?.id === id) return temp
    return null
  } catch { return null }
}

export default function BuilderLessonPage() {
  const { levelId, idx } = useParams()
  const router = useRouter()
  const [level, setLevel] = useState(null)
  const [ready, setReady] = useState(false)
  const [phase, setPhase] = useState('playing') // 'playing' | 'done'

  useEffect(() => {
    setLevel(loadLevel(levelId))
    setReady(true)
  }, [levelId])

  const lessonIdx = parseInt(idx, 10)
  const lesson = level?.lessons?.[lessonIdx]
  const nextIdx = lessonIdx + 1
  const hasNext = level?.lessons?.[nextIdx] != null

  if (!ready) return <div className={styles.loading}>Loading…</div>

  if (!level || !lesson) return (
    <div className={styles.err}>
      <p>Lesson not found.</p>
      <button onClick={() => router.push('/builder')}>← Builder</button>
    </div>
  )

  if (lesson.exercises?.length === 0) return (
    <div className={styles.err}>
      <p>This lesson has no exercises yet.</p>
      <Link href={'/builder/' + levelId} className={styles.link}>Add exercises in editor →</Link>
    </div>
  )

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
          <button className={styles.doneBack} onClick={() => router.push('/builder/play/' + levelId)}>
            ← All Lessons
          </button>
          {hasNext && (
            <button
              className={styles.doneNext}
              style={{ background: level.color }}
              onClick={() => { setPhase('playing'); router.push(`/builder/lesson/${levelId}/${nextIdx}`) }}
            >
              Next Lesson →
            </button>
          )}
          <button
            className={styles.doneAgain}
            style={{ borderColor: level.color, color: level.color }}
            onClick={() => setPhase('playing')}
          >
            Play Again
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
      onQuit={() => router.push('/builder/play/' + levelId)}
    />
  )
}
