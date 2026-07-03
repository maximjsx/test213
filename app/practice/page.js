'use client'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { COURSE } from '../../data/course'
import { useProgress } from '../../hooks/useProgress'
import { shuffle } from '../../lib/checker'
import ExerciseRunner from '../../components/ExerciseRunner'
import LessonComplete from '../../components/LessonComplete'
import Bear from '../../components/Bear'
import LoadingBear from '../../components/LoadingBear'
import styles from './page.module.css'

const PRACTICE_LEVEL = { id: 'practice', title: 'Practice', color: '#1cb0f6' }
const PRACTICE_LESSON = { id: 'practice', title: 'Mistake Practice', xp: 0 }
const MAX_EXERCISES = 10
const XP_PER_CORRECT = 2

function collectWrongExercises(wrongExercises) {
  const out = []
  for (const level of COURSE.levels)
    for (const lesson of level.lessons)
      for (const ex of lesson.exercises)
        if (ex.id && (wrongExercises[ex.id] || 0) > 0 && ex.type !== 'introduce')
          out.push(ex)
  return out
}

function PracticePageInner() {
  const router = useRouter()
  const { state, hydrated, completePractice } = useProgress()

  const [phase, setPhase] = useState('exercise')
  const [score, setScore] = useState({ correct: 0, total: 0, mistakes: [] })
  const [xpEarned, setXpEarned] = useState(0)
  const [round, setRound] = useState(0)

  const exercises = useMemo(() => {
    if (!hydrated) return []
    return shuffle(collectWrongExercises(state.wrongExercises || {})).slice(0, MAX_EXERCISES)
    // Rebuild only per round so mid-session state updates don't reshuffle the queue
  }, [hydrated, round]) // eslint-disable-line react-hooks/exhaustive-deps

  // Same fake-loading beat as the lesson page so entry doesn't feel abrupt
  const [booting, setBooting] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 900)
    return () => clearTimeout(t)
  }, [])

  if (!hydrated || booting) return <LoadingBear label={PRACTICE_LESSON.title} />

  if (exercises.length === 0 && phase === 'exercise') {
    return (
      <div className={styles.empty}>
        <Bear mood="cheer" size={110} />
        <h1 className={styles.emptyTitle}>Nothing to fix!</h1>
        <p className={styles.emptyText}>You have no open mistakes right now. Do a few lessons and anything you get wrong lands here.</p>
        <Link href="/" className={styles.emptyBtn}>BACK TO COURSE</Link>
      </div>
    )
  }

  function handleComplete(finalScore) {
    const wrongIds = [...new Set((finalScore.mistakes || []).map(m => m.id).filter(Boolean))]
    const correctIds = exercises.map(ex => ex.id).filter(id => !wrongIds.includes(id))
    const perfect = finalScore.total > 0 && finalScore.correct === finalScore.total
    const earned = correctIds.length * XP_PER_CORRECT + (perfect ? 5 : 0)
    const pct = finalScore.total > 0 ? finalScore.correct / finalScore.total : 0

    setScore(finalScore)
    setXpEarned(earned)
    completePractice(earned, {
      accuracyPct: Math.round(pct * 100),
      maxCombo: finalScore.maxCombo || 0,
      perfect,
    }, correctIds, wrongIds)
    setPhase('complete')
  }

  if (phase === 'complete') {
    return (
      <LessonComplete
        lesson={PRACTICE_LESSON}
        level={PRACTICE_LEVEL}
        score={score}
        xpEarned={xpEarned}
        mistakes={score.mistakes || []}
        onContinue={() => router.push('/')}
        onRetry={() => { setPhase('exercise'); setScore({ correct: 0, total: 0, mistakes: [] }); setRound(r => r + 1) }}
      />
    )
  }

  return (
    <ExerciseRunner
      lesson={PRACTICE_LESSON}
      level={PRACTICE_LEVEL}
      exercises={exercises}
      onComplete={handleComplete}
      onQuit={() => router.push('/')}
    />
  )
}

export default function PracticePage() {
  return (
    <Suspense fallback={<LoadingBear />}>
      <PracticePageInner />
    </Suspense>
  )
}
