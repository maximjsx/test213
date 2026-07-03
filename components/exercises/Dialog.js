'use client'
import { useState, useRef, useMemo, useEffect } from 'react'
import { checkAnswer, shuffle } from '../../lib/checker'
import { playClip, speakText, hapticTap } from '../../lib/audio'
import styles from './Exercise.module.css'

const PAUSE_AFTER_LINE = 500 // ms of silence between lines

// Build a lookup map from speaker id → { name, voice }
// Supports new `speakers` array and legacy `speakerNames` / `speakerVoices` fields
function buildSpeakerMap(exercise) {
  const map = {}
  for (const s of (exercise.speakers || [])) {
    map[s.id] = { name: s.name || s.id, voice: s.voice || null }
  }
  // legacy fallback
  if (exercise.speakerNames) {
    for (const [id, name] of Object.entries(exercise.speakerNames)) {
      if (!map[id]) map[id] = { name: name || id, voice: null }
      else if (name) map[id].name = name
    }
  }
  return map
}

export default function Dialog({ exercise, onAnswer, onPendingChange, checkTrigger, disabled }) {
  const [revealed, setRevealed] = useState(1)
  const [selected, setSelected] = useState(null)
  const [checked, setChecked] = useState(false)
  const [textValue, setTextValue] = useState('')
  const checkedRef = useRef(false)
  const selectedRef = useRef(null)
  const textRef = useRef('')

  const lines = exercise.lines || []
  const speakerMap = useMemo(() => buildSpeakerMap(exercise), [exercise])
  const hasChoices = Array.isArray(exercise.choices) && exercise.choices.length > 0
  const shuffledChoices = useMemo(() => hasChoices ? shuffle(exercise.choices) : [], [exercise.id])
  const done = revealed >= lines.length

  // Play lines one by one, waiting for actual audio duration each time
  useEffect(() => {
    let cancelled = false
    onPendingChange(false)

    async function runDialog() {
      for (let i = 0; i < lines.length; i++) {
        if (cancelled) return
        if (i > 0) setRevealed(i + 1)

        const line = lines[i]
        const ttsText = line?.tts || line?.text
        const voice = speakerMap[line?.speaker]?.voice || undefined
        let waitMs = 1200 // fallback if nothing to speak
        if (ttsText || line?.audio?.url) {
          const duration = await playClip({ audio: line?.audio, text: ttsText, voice })
          waitMs = (duration || 2000) + PAUSE_AFTER_LINE
        }

        if (cancelled) return
        await new Promise(r => setTimeout(r, waitMs))
      }
      if (!cancelled) setRevealed(lines.length) // ensure done
    }

    runDialog()
    return () => { cancelled = true }
  }, []) // eslint-disable-line

  // Once all lines revealed, text mode needs pending state wired up
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
        {lines.slice(0, revealed).map((line, i) => {
          const speakerIds = [...new Set((exercise.speakers || []).map(s => s.id))]
          const idx = speakerIds.indexOf(line.speaker)
          const isRight = idx % 2 === 1
          return (
          <div
            key={i}
            className={`${styles.dialogLine} ${isRight ? styles.dialogLineB : styles.dialogLineA}`}
          >
            <div className={styles.dialogAvatar}>{speakerMap[line.speaker]?.name || line.speaker}</div>
            <div className={styles.dialogBubble}>{line.text}</div>
          </div>
          )
        })}
        {!done && (() => {
          const nextSpeaker = lines[revealed]?.speaker
          const speakerIds = [...new Set((exercise.speakers || []).map(s => s.id))]
          const isRight = speakerIds.indexOf(nextSpeaker) % 2 === 1
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
                  disabled={disabled || checked}
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
