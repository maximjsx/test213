'use client'
import { useState, useRef, useMemo, useEffect } from 'react'
import { shuffle } from '../../lib/checker'
import { playClip, speakText, hapticTap } from '../../lib/audio'
import styles from './Exercise.module.css'

// Show a picture, pick the correct Bulgarian word/phrase from text choices.
export default function ImageMultipleChoice({ exercise, onAnswer, onPendingChange, checkTrigger, disabled }) {
  const [selected, setSelected] = useState(null)
  const [checked, setChecked] = useState(false)
  const selectedRef = useRef(null)
  const checkedRef = useRef(false)
  const choices = useMemo(() => shuffle(exercise.choices || []), [exercise.id])

  useEffect(() => {
    if (exercise.audio?.url || exercise.tts) playClip({ audio: exercise.audio, text: exercise.tts })
  }, []) // eslint-disable-line

  function select(choice) {
    if (disabled || checked) return
    hapticTap()
    if (/[Ѐ-ӿ]/.test(choice)) speakText(choice)
    setSelected(choice)
    selectedRef.current = choice
    onPendingChange(true)
  }

  useEffect(() => {
    if (checkTrigger === 0 || !selectedRef.current || checkedRef.current) return
    checkedRef.current = true
    setChecked(true)
    const ok = selectedRef.current === exercise.answer
    onAnswer(ok, ok ? '' : `The answer is: "${exercise.answer}"`)
  }, [checkTrigger]) // eslint-disable-line

  return (
    <div className={styles.wrap}>
      <p className={styles.label}>SELECT THE CORRECT ANSWER</p>
      {exercise.image?.url && (
        <img src={exercise.image.url} alt="" className={styles.imageBig} />
      )}
      {exercise.question && <h2 className={styles.question} style={{ marginBottom: 16 }}>{exercise.question}</h2>}

      <div className={styles.choiceList}>
        {choices.map(choice => {
          let state = 'idle'
          if (selected === choice && !checked) state = 'selected'
          else if (checked && selected === choice) state = choice === exercise.answer ? 'correct' : 'wrong'
          else if (checked && choice === exercise.answer) state = 'reveal'
          return (
            <button
              key={choice}
              className={`${styles.choice} ${styles[state]}`}
              onClick={() => select(choice)}
              disabled={disabled || checked}
            >
              {choice}
            </button>
          )
        })}
      </div>
    </div>
  )
}
