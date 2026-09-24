'use client'
import { useParams, useRouter } from 'next/navigation'
import { useMemo, useState, useRef, useEffect } from 'react'
import { findLesson, orderExercises, lessonCoins } from '../../../lib/course'
import { useProgress } from '../../../hooks/useProgress'
import ExerciseRunner from '../../../components/ExerciseRunner'
import LessonComplete from '../../../components/LessonComplete'
import LoadingBear from '../../../components/LoadingBear'
import Button from '../../../components/ui/Button'
import Chevron from '../../../components/Chevron'
import styles from './page.module.css'

// Lessons load instantly, which feels abrupt; the mascot holds for a beat so
// entering a lesson has a moment of anticipation
const INTRO_MS = 900

export default function LessonPage() {
  const { id } = useParams()
  const router = useRouter()
  const found = useMemo(() => findLesson(id), [id])
  const { state, hydrated, completeLesson, recordMistakes, isTopicUnlocked } = useProgress()

  const [phase, setPhase] = useState('exercise')
  const [score, setScore] = useState({ correct: 0, total: 0, mistakes: [] })
  const [coinsEarned, setCoinsEarned] = useState(0)
  const [booting, setBooting] = useState(true)
  const prevWrongIdsRef = useRef({})

  useEffect(() => {
    const t = setTimeout(() => setBooting(false), INTRO_MS)
    return () => clearTimeout(t)
  }, [])

  const locked = hydrated && found && !isTopicUnlocked(found.level)
  useEffect(() => {
    if (locked) router.replace(`/?unlock=${found.level.id}`)
  }, [locked, found, router])

  const exercises = useMemo(() => (found ? orderExercises(found.lesson.exercises) : []), [found])

  if (!found) {
    return (
      <div className={styles.err}>
        <p>Lesson not found.</p>
        <Button variant="secondary" href="/"><Chevron /> Back to course</Button>
      </div>
    )
  }

  const { lesson, level } = found
  if (booting || locked) return <LoadingBear label={lesson.title} />

  function handleComplete(finalScore) {
    prevWrongIdsRef.current = { ...state.wrongExercises }
    setScore(finalScore)

    const isReplay = !!state.lessons[lesson.id]?.completed
    const earned = lessonCoins(lesson, finalScore, isReplay)
    const perfect = finalScore.total > 0 && finalScore.correct === finalScore.total
    setCoinsEarned(earned)
    completeLesson(lesson.id, earned, {
      accuracyPct: finalScore.total ? Math.round((finalScore.correct / finalScore.total) * 100) : 0,
      maxCombo: finalScore.maxCombo || 0,
      perfect,
    })
    recordMistakes((finalScore.mistakes || []).map(m => m.id).filter(Boolean))
    setPhase('complete')
  }

  if (phase === 'complete') {
    return (
      <LessonComplete
        lesson={lesson}
        level={level}
        score={score}
        coinsEarned={coinsEarned}
        mistakes={score.mistakes || []}
        prevWrongIds={prevWrongIdsRef.current}
        onContinue={() => router.push(`/topic/${level.id}`)}
        onRetry={() => { setPhase('exercise'); setScore({ correct: 0, total: 0, mistakes: [] }) }}
      />
    )
  }

  return (
    <ExerciseRunner
      lesson={lesson}
      level={level}
      exercises={exercises}
      onComplete={handleComplete}
      onQuit={() => router.push(`/topic/${level.id}`)}
    />
  )
}
