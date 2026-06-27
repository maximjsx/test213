'use client'
import { useState, useRef, useMemo, useEffect } from 'react'
import { shuffle } from '../../lib/checker'
import { speakBulgarian, speakText, hapticTap } from '../../lib/audio'
import styles from './Exercise.module.css'

export default function MultipleChoice({ exercise, onAnswer, onPendingChange, checkTrigger, disabled, levelColor }) {
  const [selected, setSelected] = useState(null)
  const [checked, setChecked] = useState(false)
  const selectedRef = useRef(null)
  const checkedRef = useRef(false)
  const choices = useMemo(() => shuffle(exercise.choices), [exercise.id])

  const isCyrillicCards = choices.every(c => c.length <= 3 && /[Ѐ-ӿ]/.test(c))

  function select(choice) {
    if (disabled || checked) return
    hapticTap()
    if (/[Ѐ-ӿ]/.test(choice)) speakText(choice)
    setSelected(choice)
    selectedRef.current = choice
    onPendingChange(true)
  }

  // Number key shortcuts: 1/2/3/4 select corresponding choice
  useEffect(() => {
    function onKeyDown(e) {
      if (disabled || checkedRef.current) return
      const idx = parseInt(e.key) - 1
      if (isNaN(idx) || idx < 0 || idx >= choices.length) return
      const choice = choices[idx]
      if (/[Ѐ-ӿ]/.test(choice)) speakText(choice)
      setSelected(choice)
      selectedRef.current = choice
      onPendingChange(true)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [disabled, choices, onPendingChange]) // eslint-disable-line

  // Fire when ExerciseRunner clicks CHECK
  useEffect(() => {
    if (checkTrigger === 0 || !selectedRef.current || checkedRef.current) return
    checkedRef.current = true
    setChecked(true)
    const ok = selectedRef.current === exercise.answer
    onAnswer(ok, ok ? '' : `The answer is: "${exercise.answer}"`)
  }, [checkTrigger]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={styles.wrap}>
      <p className={styles.label}>SELECT THE CORRECT ANSWER</p>
      <div className={styles.promptRow}>
        {exercise.tts && /[Ѐ-ӿ]/.test(exercise.tts) && (
          <button className={styles.ttsInline} onClick={() => speakBulgarian(exercise.tts)} title="Listen">
            <img src="/icons/speaker.png" alt="🔊" width={20} height={20} />
          </button>
        )}
        <h2 className={styles.question}>{exercise.question}</h2>
      </div>

      <div className={isCyrillicCards ? styles.cyrillicGrid : styles.choiceList}>
        {choices.map(choice => {
          let state = 'idle'
          if (selected === choice && !checked) state = 'selected'
          else if (checked && selected === choice) state = choice === exercise.answer ? 'correct' : 'wrong'
          else if (checked && choice === exercise.answer) state = 'reveal'

          return (
            <button
              key={choice}
              className={`${isCyrillicCards ? styles.cyrillicCard : styles.choice} ${styles[state]}`}
              onClick={() => select(choice)}
              disabled={disabled || checked}
            >
              {isCyrillicCards
                ? <span className={styles.bigChar}>{choice}</span>
                : choice}
            </button>
          )
        })}
      </div>
    </div>
  )
}
