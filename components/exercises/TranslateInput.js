'use client'
import { useState, useRef, useEffect } from 'react'
import { checkAnswer } from '../../lib/checker'
import { speakBulgarian, startSpeechRecognition } from '../../lib/audio'
import BulgarianSentence, { parseWordHints } from './BulgarianSentence'
import styles from './Exercise.module.css'

export default function TranslateInput({ exercise, onAnswer, onPendingChange, checkTrigger, disabled }) {
  const [value, setValue] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [listening, setListening] = useState(false)
  const valueRef = useRef('')
  const submittedRef = useRef(false)

  const isToBg = exercise.type === 'translate_to_bg'

  useEffect(() => { if (exercise.tts && /[Ѐ-ӿ]/.test(exercise.tts)) speakBulgarian(exercise.tts) }, []) // eslint-disable-line

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
      allowTranslit: isToBg,
      translitMap: exercise.translitMap || {},
    })
    if (result.correct) onAnswer(true)
    else if (result.close) onAnswer(false, result.message)
    else onAnswer(false, `Correct answer: "${exercise.answer}"`)
  }

  // Fire when ExerciseRunner clicks CHECK
  useEffect(() => {
    if (checkTrigger === 0 || submittedRef.current) return
    submit()
  }, [checkTrigger]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSpeech() {
    if (listening) return
    setListening(true)
    const rec = startSpeechRecognition(
      (transcript) => {
        setValue(transcript)
        valueRef.current = transcript
        onPendingChange(transcript.trim().length > 0)
      },
      () => setListening(false)
    )
    if (!rec) { setListening(false); alert('Speech recognition not supported in this browser.') }
  }

  const resultState = submitted
    ? (checkAnswer(value, exercise.answer, { allowTranslit: isToBg, translitMap: exercise.translitMap }).correct ? 'ok' : 'bad')
    : ''

  return (
    <div className={styles.wrap}>
      <p className={styles.label}>{isToBg ? 'TRANSLATE TO BULGARIAN' : 'TRANSLATE TO ENGLISH'}</p>
      <div className={styles.promptRow}>
        <h2 className={styles.question}>
          {/[Ѐ-ӿ]/.test(exercise.prompt)
            ? <BulgarianSentence text={exercise.prompt} wordMap={parseWordHints(exercise.hint)} />
            : exercise.prompt}
        </h2>
        {exercise.tts && /[Ѐ-ӿ]/.test(exercise.tts) && (
          <button className={styles.ttsInline} onClick={() => speakBulgarian(exercise.tts)} title="Listen">
            <img src="/icons/speaker.png" alt="🔊" width={20} height={20} />
          </button>
        )}
      </div>

      {isToBg && (
        <p className={styles.translit}>You can type in Roman letters, e.g. "zhena" for жена</p>
      )}

      <div className={styles.inputRow}>
        <input
          className={`${styles.input} ${resultState === 'ok' ? styles.inputOk : resultState === 'bad' ? styles.inputBad : ''}`}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={e => e.key === 'Enter' && !submittedRef.current && submit()}
          placeholder={isToBg ? 'Type in Bulgarian…' : 'Type your translation…'}
          disabled={disabled || submitted}
          autoFocus
          autoComplete="off"
          spellCheck="false"
        />
        {!isToBg && (
          <button
            className={`${styles.micBtn} ${listening ? styles.micActive : ''}`}
            onClick={handleSpeech}
            disabled={disabled || listening || submitted}
            title="Speak your answer"
          >
            {listening ? '⏹' : <img src="/icons/microphone.png" alt="🎤" width={22} height={22} />}
          </button>
        )}
      </div>
    </div>
  )
}
