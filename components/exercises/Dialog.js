'use client'
import { useState, useRef, useMemo, useEffect } from 'react'
import { checkAnswer, shuffle } from '../../lib/checker'
import { speakBulgarian, speakText, hapticTap } from '../../lib/audio'
import styles from './Exercise.module.css'

// Estimate how long a line will take to read aloud before auto-advancing.
// ~120ms/char for Bulgarian TTS at 0.85x rate, 600ms base pause between lines.
// First line gets extra time (1200ms) since TTS fetch hasn't been cached yet.
function lineDelay(line, isFirst) {
  const len = (line?.tts || line?.text || '').length
  const base = isFirst ? 1200 : 600
  return Math.max(isFirst ? 2200 : 1600, len * 120 + base)
}

export default function Dialog({ exercise, onAnswer, onPendingChange, checkTrigger, disabled }) {
  const [revealed, setRevealed] = useState(1)
  const [selected, setSelected] = useState(null)
  const [checked, setChecked] = useState(false)
  const [textValue, setTextValue] = useState('')
  const checkedRef = useRef(false)
  const selectedRef = useRef(null)
  const textRef = useRef('')
  const ttsStartedRef = useRef(false)

  const lines = exercise.lines || []
  const names = exercise.speakerNames || {}
  const hasChoices = Array.isArray(exercise.choices) && exercise.choices.length > 0
  const shuffledChoices = useMemo(() => hasChoices ? shuffle(exercise.choices) : [], [exercise.id])
  const done = revealed >= lines.length

  // Play first line on mount — ref guard prevents Strict Mode double-invoke
  useEffect(() => {
    if (!ttsStartedRef.current) {
      ttsStartedRef.current = true
      if (lines[0]?.tts) speakBulgarian(lines[0].tts)
    }
    onPendingChange(false)
  }, []) // eslint-disable-line

  // Auto-advance each time a new line is revealed (until all lines shown)
  useEffect(() => {
    if (done) return
    const next = revealed + 1
    const timer = setTimeout(() => {
      if (next <= lines.length) {
        const nextLine = lines[next - 1]
        if (nextLine?.tts) speakBulgarian(nextLine.tts)
      }
      setRevealed(next)
    }, lineDelay(lines[revealed - 1], revealed === 1))
    return () => clearTimeout(timer)
  }, [revealed]) // eslint-disable-line

  // Once all lines revealed, let text-mode users start typing
  useEffect(() => {
    if (done && !hasChoices) onPendingChange(textRef.current.trim().length > 0)
  }, [done]) // eslint-disable-line

  function selectChoice(choice) {
    if (disabled || checkedRef.current) return
    hapticTap()
    if (/[Ѐ-ӿ]/.test(choice)) speakText(choice)
    setSelected(choice)
    selectedRef.current = choice
    onPendingChange(true)
  }

  useEffect(() => {
    if (checkTrigger === 0 || checkedRef.current || !done) return
    checkedRef.current = true
    setChecked(true)
    const input = hasChoices ? selectedRef.current : textRef.current
    if (!input) return
    const result = checkAnswer(input, exercise.answers ?? exercise.answer, {})
    if (result.correct) onAnswer(true)
    else if (result.close && !hasChoices) onAnswer(false, result.message)
    else {
      const shown = Array.isArray(exercise.answer) ? exercise.answer[0] : exercise.answer
      onAnswer(false, `Correct: "${shown}"`)
    }
  }, [checkTrigger]) // eslint-disable-line

  const choiceClass = (c) => {
    if (!selected) return styles.choice
    if (!checked) return `${styles.choice} ${selected === c ? styles.selected : ''}`
    if (c === exercise.answer) return `${styles.choice} ${styles.correct}`
    if (c === selected) return `${styles.choice} ${styles.wrong}`
    return styles.choice
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.label}>COMPLETE THE CONVERSATION</p>

      <div className={styles.dialogLines}>
        {lines.slice(0, revealed).map((line, i) => (
          <div
            key={i}
            className={`${styles.dialogLine} ${line.speaker === 'A' ? styles.dialogLineA : styles.dialogLineB}`}
          >
            <div className={styles.dialogAvatar}>{names[line.speaker] || line.speaker}</div>
            <div className={styles.dialogBubble}>{line.text}</div>
          </div>
        ))}
        {!done && (() => {
          const nextSpeaker = lines[revealed]?.speaker
          const isRight = nextSpeaker === 'B'
          return (
            <div className={`${styles.dialogTyping} ${isRight ? styles.dialogTypingRight : ''}`}>
              <span /><span /><span />
            </div>
          )
        })()}
      </div>

      {done && (
        <div className={styles.dialogAnswerArea}>
          {exercise.prompt && (
            <p className={styles.dialogPrompt}>{exercise.prompt}</p>
          )}
          {hasChoices ? (
            <div className={styles.choiceList}>
              {shuffledChoices.map(c => (
                <button
                  key={c}
                  className={choiceClass(c)}
                  onClick={() => selectChoice(c)}
                  disabled={disabled || !!selected}
                >
                  {c}
                </button>
              ))}
            </div>
          ) : (
            <div className={styles.inputRow}>
              <input
                className={styles.input}
                type="text"
                value={textValue}
                onChange={e => {
                  setTextValue(e.target.value)
                  textRef.current = e.target.value
                  onPendingChange(e.target.value.trim().length > 0)
                }}
                placeholder="Type your answer…"
                disabled={disabled}
                autoFocus
                autoComplete="off"
                spellCheck="false"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
