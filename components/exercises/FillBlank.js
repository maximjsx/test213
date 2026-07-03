'use client'
import { useState, useRef, useEffect } from 'react'
import { checkAnswer } from '../../lib/checker'
import styles from './Exercise.module.css'

export default function FillBlank({ exercise, onAnswer, onPendingChange, checkTrigger, disabled }) {
  const [value, setValue] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const valueRef = useRef('')
  const submittedRef = useRef(false)
  const [before, after] = exercise.sentence.split('___')

  function handleChange(e) {
    setValue(e.target.value)
    valueRef.current = e.target.value
    onPendingChange(e.target.value.trim().length > 0)
  }

  const isBgAnswer = /[Ѐ-ӿ]/.test(exercise.answer)

  function submit() {
    if (!valueRef.current.trim() || submittedRef.current) return
    submittedRef.current = true
    setSubmitted(true)
    const result = checkAnswer(valueRef.current, exercise.answer, {
      allowTranslit: isBgAnswer,
      translitMap: exercise.translitMap || {},
    })
    if (result.correct) onAnswer(true, result.message)
    else if (result.close) onAnswer(false, result.message)
    else onAnswer(false, `Correct answer: "${exercise.answer}"`)
  }

  // Fire when ExerciseRunner clicks CHECK
  useEffect(() => {
    if (checkTrigger === 0 || submittedRef.current) return
    submit()
  }, [checkTrigger]) // eslint-disable-line react-hooks/exhaustive-deps

  const state = submitted
    ? (checkAnswer(value, exercise.answer, { allowTranslit: isBgAnswer, translitMap: exercise.translitMap || {} }).correct ? 'ok' : 'bad')
    : ''

  return (
    <div className={styles.wrap}>
      <p className={styles.label}>FILL IN THE BLANK</p>
      <div className={styles.sentenceWrap}>
        <span className={styles.sentPart}>{before}</span>
        <input
          className={`${styles.inlineInput} ${state === 'ok' ? styles.inputOk : state === 'bad' ? styles.inputBad : ''}`}
          value={value}
          onChange={handleChange}
          onKeyDown={e => e.key === 'Enter' && !submittedRef.current && submit()}
          disabled={disabled || submitted}
          autoFocus
          autoComplete="off"
          spellCheck="false"
          size={Math.max(5, exercise.answer.length + 2)}
        />
        <span className={styles.sentPart}>{after}</span>
      </div>

      {exercise.hint && /[Ѐ-ӿ]/.test(exercise.sentence) && !exercise.hint.includes(' = ') && <p className={styles.hint}>💡 {exercise.hint}</p>}
    </div>
  )
}
