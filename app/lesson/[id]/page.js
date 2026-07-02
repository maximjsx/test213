'use client'
import { useParams, useRouter } from 'next/navigation'
import { useMemo, useState, useRef, Suspense } from 'react'
import { COURSE } from '../../../data/course'
import { useProgress } from '../../../hooks/useProgress'
import { shuffle } from '../../../lib/checker'
import ExerciseRunner from '../../../components/ExerciseRunner'
import LessonComplete from '../../../components/LessonComplete'
import Chevron from '../../../components/Chevron'
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

  const found = useMemo(() => findLesson(id), [id])
  const { state, completeLessonWithXP, recordMistakes } = useProgress()

  const [phase, setPhase] = useState('exercise')
  const [score, setScore] = useState({ correct: 0, total: 0, mistakes: [] })
  const [xpEarned, setXpEarned] = useState(0)
  const prevWrongIdsRef = useRef({})

  const exercises = useMemo(() => {
    if (!found) return []
    const all = found.lesson.exercises

    const TIER = { multiple_choice: 1, match_pairs: 1, listen_and_type: 2, speak_sentence: 2, word_bank: 3, fill_blank: 3, translate_to_en: 4, translate_to_bg: 4, listen_translate: 4 }

    let lastIntroIdx = -1
    for (let i = all.length - 1; i >= 0; i--) {
      if (all[i].type === 'introduce') { lastIntroIdx = i; break }
    }

    let splitAt = lastIntroIdx + 1
    while (splitAt < all.length && all[splitAt].type === 'multiple_choice') splitAt++

    const introSection = all.slice(0, splitAt)
    const hardSection = all.slice(splitAt)

    const tiers = {}
    for (const ex of hardSection) {
      const t = TIER[ex.type] ?? 5
      if (!tiers[t]) tiers[t] = []
      tiers[t].push(ex)
    }
    const shuffledHard = Object.keys(tiers).sort((a, b) => a - b).flatMap(t => shuffle(tiers[t]))

    return [...introSection, ...shuffledHard]
  }, [id])

  if (!found) return (
    <div className={styles.err}>
      <p>Lesson not found.</p>
      <button onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Chevron /> Back to course
      </button>
    </div>
  )

  const { lesson, level } = found
  const isPractice = !!state.lessons[lesson.id]?.completed

  function handleComplete(finalScore) {
    prevWrongIdsRef.current = { ...state.wrongExercises }
    setScore(finalScore)

    const pct = finalScore.total > 0 ? finalScore.correct / finalScore.total : 0
    const perfect = finalScore.total > 0 && finalScore.correct === finalScore.total

    let baseXP = isPractice ? Math.ceil(lesson.xp / 2) : lesson.xp
    let earned = perfect ? Math.round(baseXP * 1.5) : pct >= 0.8 ? Math.round(baseXP * 1.2) : baseXP

    setXpEarned(earned)
    completeLessonWithXP(lesson.id, earned, {
      accuracyPct: Math.round(pct * 100),
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
