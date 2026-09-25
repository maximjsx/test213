'use client'
import { useParams, useRouter } from 'next/navigation'
import { useMemo, useState, useRef, useEffect } from 'react'
import { findLesson, orderExercises } from '../../../lib/course'
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

// Special topics ship without exercises; the server hands them out only to
// learners who unlocked the topic
function useLessonContent(found) {
  const special = !!found?.level.special
  const [content, setContent] = useState(special ? null : found?.lesson)
  const [error, setError] = useState(null)
  useEffect(() => {
    if (!special) return setContent(found?.lesson)
    fetch(`/api/special/lesson/${encodeURIComponent(found.lesson.id)}`)
      .then(r => r.json().then(d => (r.ok ? setContent(d.lesson) : setError(d.error || 'locked'))))
      .catch(() => setError('network'))
  }, [found, special])
  return { content, error }
}

export default function LessonPage() {
  const { id } = useParams()
  const router = useRouter()
  const found = useMemo(() => findLesson(id), [id])
  const { state, hydrated, completeLesson, isTopicUnlocked, beginActivity } = useProgress()
  const { content, error } = useLessonContent(found)

  const [phase, setPhase] = useState('exercise')
  const [round, setRound] = useState(0)
  const [score, setScore] = useState({ correct: 0, total: 0, mistakes: [] })
  const [coinsEarned, setCoinsEarned] = useState(0)
  const [booting, setBooting] = useState(true)
  const prevWrongIdsRef = useRef({})
  const tokenRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => setBooting(false), INTRO_MS)
    return () => clearTimeout(t)
  }, [])

  const locked = hydrated && found && !isTopicUnlocked(found.level)
  useEffect(() => {
    if (locked || error) router.replace(`/?unlock=${found.level.id}`)
  }, [locked, error, found, router])

  // Each attempt gets its own token, so the server can tell a real lesson
  // from a result posted without playing it
  useEffect(() => {
    if (!found || !hydrated) return
    tokenRef.current = beginActivity('lesson', found.lesson.id)
  }, [found, hydrated, round, beginActivity])

  const exercises = useMemo(() => (content ? orderExercises(content.exercises) : []), [content, round])

  if (!found) {
    return (
      <div className={styles.err}>
        <p>Lesson not found.</p>
        <Button variant="secondary" href="/"><Chevron /> Back to course</Button>
      </div>
    )
  }

  const { lesson, level } = found
  if (booting || locked || error || !content) return <LoadingBear label={lesson.title} />

  async function handleComplete(finalScore) {
    prevWrongIdsRef.current = { ...state.wrongExercises }
    setScore(finalScore)
    const result = completeLesson(lesson.id, {
      correct: finalScore.correct,
      total: finalScore.total,
      maxCombo: finalScore.maxCombo || 0,
      mistakeIds: (finalScore.mistakes || []).map(m => m.id).filter(Boolean),
    }, await tokenRef.current)
    setCoinsEarned(result.coins || 0)
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
        onRetry={() => { setPhase('exercise'); setScore({ correct: 0, total: 0, mistakes: [] }); setRound(r => r + 1) }}
      />
    )
  }

  return (
    <ExerciseRunner
      key={round}
      lesson={lesson}
      level={level}
      exercises={exercises}
      onComplete={handleComplete}
      onQuit={() => router.push(`/topic/${level.id}`)}
    />
  )
}
