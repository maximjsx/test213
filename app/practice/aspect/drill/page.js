'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProgress } from '../../../../hooks/useProgress'
import { buildAspectDrill } from '../../../../lib/aspect'
import ExerciseRunner from '../../../../components/ExerciseRunner'
import LessonComplete from '../../../../components/LessonComplete'

const LEVEL = { id: 'aspect', title: 'Verb aspect', color: '#1cb0f6' }
const LESSON = { id: 'aspect', title: 'Verb aspect', coins: 0 }
const BACK = '/practice/aspect'

export default function AspectDrillPage() {
  const router = useRouter()
  const { completeDrill, beginActivity } = useProgress()
  const [round, setRound] = useState(0)
  // Shuffled in the browser only, so server and client render agree
  const [exercises, setExercises] = useState(null)
  const [result, setResult] = useState(null)
  const tokenRef = useRef(null)

  useEffect(() => {
    setExercises(buildAspectDrill())
    tokenRef.current = beginActivity('drill', 'drill')
  }, [round, beginActivity])

  async function finish(s) {
    const { coins = 0 } = completeDrill(s.correct, s.total, s.maxCombo, await tokenRef.current)
    setResult({ score: s, coins })
  }

  if (result) {
    return (
      <LessonComplete
        lesson={LESSON}
        level={LEVEL}
        score={result.score}
        coinsEarned={result.coins}
        mistakes={result.score.mistakes}
        onContinue={() => router.push(BACK)}
        onRetry={() => { setResult(null); setRound(r => r + 1) }}
      />
    )
  }
  if (!exercises) return null
  return <ExerciseRunner key={round} lesson={LESSON} level={LEVEL} exercises={exercises} onComplete={finish} onQuit={() => router.push(BACK)} />
}
