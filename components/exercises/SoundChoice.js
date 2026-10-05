'use client'
import { useState, useRef, useMemo, useEffect } from 'react'
import { shuffle } from '../../lib/checker'
import { playClip, speakBulgarian, hapticTap } from '../../lib/audio'
import styles from './Exercise.module.css'

// Two directions of the same letter-sound link, with no English in between.
// read: see Cyrillic, pick which recording says it.
// listen: hear a recording, pick which Cyrillic spelling it was.
export default function SoundChoice({ exercise, onAnswer, onPendingChange, checkTrigger, disabled }) {
  const [selected, setSelected] = useState(null)
  const [checked, setChecked] = useState(false)
  const selectedRef = useRef(null)
  const choices = useMemo(() => shuffle(exercise.choices), [exercise.id])
  const isRead = exercise.mode === 'read'
  const isLetters = choices.every(c => c.length <= 2)

  const playAnswer = () => playClip({ audio: exercise.audio, text: exercise.tts || exercise.answer })

  useEffect(() => {
    if (!isRead) playAnswer()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function select(choice) {
    if (isRead) speakBulgarian(choice)
    if (disabled || checked) return
    hapticTap()
    setSelected(choice)
    selectedRef.current = choice
    onPendingChange(true)
  }

  useEffect(() => {
    if (checkTrigger === 0 || !selectedRef.current || checked) return
    setChecked(true)
    if (selectedRef.current === exercise.answer) {
      onAnswer(true, exercise.romanized ? `It reads "${exercise.romanized}".` : '')
      return
    }
    if (isRead) playAnswer()
    onAnswer(false, isRead
      ? `It sounds like the highlighted one${exercise.romanized ? `: "${exercise.romanized}"` : ''}.`
      : `You heard "${exercise.answer}".`)
  }, [checkTrigger]) // eslint-disable-line react-hooks/exhaustive-deps

  function stateOf(choice) {
    if (!checked) return selected === choice ? 'selected' : 'idle'
    if (choice === exercise.answer) return selected === choice ? 'correct' : 'reveal'
    return selected === choice ? 'wrong' : 'idle'
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.label}>{isRead ? 'HOW DOES THIS SOUND?' : 'WHAT DID YOU HEAR?'}</p>

      {isRead ? (
        <div className={styles.soundPrompt} lang="bg">{exercise.display || exercise.answer}</div>
      ) : (
        <div className={styles.listenCenter}>
          <button className={styles.listenBigBtn} onClick={playAnswer} title="Listen again" disabled={disabled}>
            <img src="/icons/speaker.png" alt="Listen again" width={36} height={36} />
          </button>
          <p className={styles.listenHint}>Tap to listen again</p>
        </div>
      )}

      {isRead ? (
        <div className={styles.soundGrid}>
          {choices.map((choice, i) => (
            <button
              key={choice}
              className={`${styles.soundBtn} ${styles[stateOf(choice)]}`}
              onClick={() => select(choice)}
              aria-label={`Recording ${i + 1}`}
            >
              <img src="/icons/speaker.png" alt="" width={28} height={28} />
              <span className={styles.soundNum}>{i + 1}</span>
            </button>
          ))}
        </div>
      ) : (
        <div
          className={isLetters ? styles.cyrillicGrid : styles.choiceList}
          style={isLetters ? { gridTemplateColumns: `repeat(${choices.length}, 1fr)` } : undefined}
        >
          {choices.map(choice => (
            <button
              key={choice}
              lang="bg"
              className={`${isLetters ? styles.cyrillicCard : `${styles.choice} ${styles.soundWord}`} ${styles[stateOf(choice)]}`}
              onClick={() => select(choice)}
              disabled={disabled || checked}
            >
              {isLetters ? <span className={styles.bigChar}>{choice}</span> : choice}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
