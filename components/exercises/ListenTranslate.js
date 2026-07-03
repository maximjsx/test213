'use client'
import { useState, useRef, useEffect } from 'react'
import { checkAnswer } from '../../lib/checker'
import { playClip } from '../../lib/audio'
import styles from './Exercise.module.css'

export default function ListenTranslate({ exercise, onAnswer, onPendingChange, checkTrigger, disabled }) {
  const [value, setValue] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const valueRef = useRef('')
  const submittedRef = useRef(false)
  const play = () => playClip({ audio: exercise.audio, text: exercise.tts })

  useEffect(() => {
    if (exercise.tts || exercise.audio?.url) play()
  }, []) // eslint-disable-line

  function handleChange(e) {
    setValue(e.target.value)
    valueRef.current = e.target.value
    onPendingChange(e.target.value.trim().length > 0)
  }

  function submit() {
    if (!valueRef.current.trim() || submittedRef.current) return
    submittedRef.current = true
    setSubmitted(true)
    const answerField = exercise.answers ?? exercise.answer
    const result = checkAnswer(valueRef.current, answerField, { allowTranslit: false })
    if (result.correct) onAnswer(true, result.message)
    else if (result.close) onAnswer(false, result.message)
    else {
      const shown = Array.isArray(answerField) ? answerField[0] : answerField
      onAnswer(false, `Correct answer: "${shown}"`)
    }
  }

  useEffect(() => {
    if (checkTrigger === 0 || submittedRef.current) return
    submit()
  }, [checkTrigger]) // eslint-disable-line react-hooks/exhaustive-deps

  const resultState = submitted
    ? (checkAnswer(value, exercise.answers ?? exercise.answer, { allowTranslit: false }).correct ? 'ok' : 'bad')
    : ''

  return (
    <div className={styles.wrap}>
      <p className={styles.label}>TRANSLATE WHAT YOU HEAR</p>
      <div className={styles.listenCenter}>
        <button
          className={styles.listenBigBtn}
          onClick={play}
          title="Listen again"
          disabled={disabled}
        >
          <img src="/icons/speaker.png" alt="🔊" width={36} height={36} />
        </button>
        <p className={styles.listenHint}>Tap to listen again</p>
      </div>
      <div className={styles.inputRow}>
        <input
          className={`${styles.input} ${resultState === 'ok' ? styles.inputOk : resultState === 'bad' ? styles.inputBad : ''}`}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={e => e.key === 'Enter' && !submittedRef.current && submit()}
          placeholder="Type in English..."
          disabled={disabled || submitted}
          autoFocus
          autoComplete="off"
          spellCheck="false"
        />
      </div>
    </div>
  )
}
