'use client'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState, useRef, Suspense } from 'react'
import { COURSE } from '../../../data/course'
import { useProgress } from '../../../hooks/useProgress'
import { shuffle } from '../../../lib/checker'
import ExerciseRunner from '../../../components/ExerciseRunner'
import LessonComplete from '../../../components/LessonComplete'
import styles from './page.module.css'

function findLesson(id) {
  for (const level of COURSE.levels)
    for (const lesson of level.lessons)
      if (lesson.id === id) return { lesson, level }
  return null
}

function LessonPageInner() {
  const { id } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()

  const found = useMemo(() => findLesson(id), [id])
  const { state, loseHeart, buyHearts, HEART_COST_XP, completeLessonWithXP, recordMistakes, MAX_HEARTS } = useProgress()

  const [phase, setPhase] = useState('exercise')
  const [score, setScore] = useState({ correct: 0, total: 0, mistakes: [] })
  const [xpEarned, setXpEarned] = useState(0)
  const prevWrongIdsRef = useRef({})
  const exercises = useMemo(() => {
    if (!found) return []
    const all = found.lesson.exercises

    // Exercise difficulty tiers — lower tier always comes before higher tier
    const TIER = { introduce: 0, multiple_choice: 1, match_pairs: 1, listen_and_type: 2, speak_sentence: 2, word_bank: 3, fill_blank: 3, translate_to_en: 4, translate_to_bg: 4 }

    // Group by tier, shuffle within each tier, then concatenate in order
    const tiers = {}
    for (const ex of all) {
      const t = TIER[ex.type] ?? 5
      if (!tiers[t]) tiers[t] = []
      tiers[t].push(ex)
    }
    return Object.keys(tiers).sort((a, b) => a - b).flatMap(t => shuffle(tiers[t]))
  }, [id])

  if (!found) return (
    <div className={styles.err}>
      <p>Lesson not found.</p>
      <button onClick={() => router.push('/')}>← Back to course</button>
    </div>
  )

  const { lesson, level } = found
  const isPractice = !!state.lessons[lesson.id]?.completed

  function handleComplete(finalScore) {
    prevWrongIdsRef.current = { ...state.wrongExercises }
    setScore(finalScore)
    const earned = isPractice ? Math.ceil(lesson.xp / 2) : lesson.xp
    setXpEarned(earned)
    completeLessonWithXP(lesson.id, earned)
    recordMistakes((finalScore.mistakes || []).map(m => m.id).filter(Boolean))
    setPhase('complete')
  }

  if (phase === 'complete') {
    return (
      <LessonComplete
        lesson={lesson}
        level={level}
        score={score}
        xpEarned={xpEarned}
        mistakes={score.mistakes || []}
        prevWrongIds={prevWrongIdsRef.current}
        onContinue={() => router.push('/')}
        onRetry={() => { setPhase('exercise'); setScore({ correct: 0, total: 0, mistakes: [] }) }}
      />
    )
  }

  return (
    <ExerciseRunner
      lesson={lesson}
      level={level}
      exercises={exercises}
      hearts={state.hearts}
      maxHearts={MAX_HEARTS}
      xp={state.xp}
      heartCostXp={HEART_COST_XP}
      onLoseHeart={loseHeart}
      onBuyHeart={() => buyHearts(1)}
      onComplete={handleComplete}
      onQuit={() => router.push('/')}
    />
  )
}

export default function LessonPage() {
  return (
    <Suspense fallback={<div className={styles.loading}>Loading…</div>}>
      <LessonPageInner />
    </Suspense>
  )
}
