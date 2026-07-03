'use client'
import { useState, useRef, useEffect } from 'react'
import { checkAnswer } from '../../lib/checker'
import { playClip } from '../../lib/audio'
import styles from './Exercise.module.css'

// Show a picture, learner types the Bulgarian word for it.
export default function ImageName({ exercise, onAnswer, onPendingChange, checkTrigger, disabled }) {
  const [value, setValue] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const valueRef = useRef('')
  const submittedRef = useRef(false)

  const answerField = exercise.answers ?? exercise.answer
  const primary = Array.isArray(answerField) ? answerField[0] : answerField

  function handleChange(e) {
    setValue(e.target.value)
    valueRef.current = e.target.value
    onPendingChange(e.target.value.trim().length > 0)
  }

  function submit() {
    if (!valueRef.current.trim() || submittedRef.current) return
    submittedRef.current = true
    setSubmitted(true)
    const result = checkAnswer(valueRef.current, answerField, {
      allowTranslit: true,
      translitMap: exercise.translitMap || {},
    })
    // Reinforce with audio on the correct word
    playClip({ audio: exercise.audio, text: exercise.tts || primary })
    if (result.correct) onAnswer(true, result.message)
    else if (result.close) onAnswer(false, result.message)
    else onAnswer(false, `Correct answer: "${primary}"`)
  }

  useEffect(() => {
    if (checkTrigger === 0 || submittedRef.current) return
    submit()
  }, [checkTrigger]) // eslint-disable-line

  const state = submitted
    ? (checkAnswer(value, answerField, { allowTranslit: true, translitMap: exercise.translitMap || {} }).correct ? 'ok' : 'bad')
    : ''

  return (
    <div className={styles.wrap}>
      <p className={styles.label}>NAME THE PICTURE</p>
      {exercise.image?.url && (
        <img src={exercise.image.url} alt="" className={styles.imageBig} />
      )}
      <div className={styles.inputRow}>
        <input
          className={`${styles.input} ${state === 'ok' ? styles.inputOk : state === 'bad' ? styles.inputBad : ''}`}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={e => e.key === 'Enter' && !submittedRef.current && submit()}
          placeholder="Type in Bulgarian…"
          disabled={disabled || submitted}
          autoFocus
          autoComplete="off"
          spellCheck="false"
        />
      </div>
      {exercise.hint && !submitted && <p className={styles.hint}>💡 {exercise.hint}</p>}
    </div>
  )
}
