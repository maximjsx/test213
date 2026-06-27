'use client'
import { useState, useRef, useEffect } from 'react'
import { checkAnswer } from '../../lib/checker'
import { speakBulgarian } from '../../lib/audio'
import styles from './Exercise.module.css'

export default function ListenAndType({ exercise, onAnswer, onPendingChange, checkTrigger, disabled }) {
  const [value, setValue] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const valueRef = useRef('')
  const submittedRef = useRef(false)

  const ttsText = exercise.tts || exercise.answer

  useEffect(() => {
    if (ttsText) speakBulgarian(ttsText)
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
    const result = checkAnswer(valueRef.current, exercise.answer, {
      allowTranslit: true,
      translitMap: exercise.translitMap || {},
    })
    if (result.correct) onAnswer(true)
    else if (result.close) onAnswer(false, result.message)
    else onAnswer(false, `Correct answer: "${exercise.answer}"`)
  }

  useEffect(() => {
    if (checkTrigger === 0 || submittedRef.current) return
    submit()
  }, [checkTrigger]) // eslint-disable-line react-hooks/exhaustive-deps

  const resultState = submitted
    ? (checkAnswer(value, exercise.answer, { allowTranslit: true, translitMap: exercise.translitMap || {} }).correct ? 'ok' : 'bad')
    : ''

  return (
    <div className={styles.wrap}>
      <p className={styles.label}>TYPE WHAT YOU HEAR</p>

      <div className={styles.listenCenter}>
        <button
          className={styles.listenBigBtn}
          onClick={() => speakBulgarian(ttsText)}
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
          placeholder="Type in Bulgarian…"
          disabled={disabled || submitted}
          autoFocus
          autoComplete="off"
          spellCheck="false"
        />
      </div>
    </div>
  )
}
