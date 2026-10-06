'use client'
import { useState, useRef, useMemo, useEffect } from 'react'
import { shuffle } from '../../lib/checker'
import { speakBulgarian, hapticTap } from '../../lib/audio'
import styles from './Exercise.module.css'

// Letter and sound in writing, the way the alphabet notes teach them.
// sound: one big letter, pick the sound it makes ("f").
// letter: a sound, pick the letter from a row of cards.
// The letter is only spoken after checking, so audio never hands over the answer.
export default function LetterSound({ exercise, onAnswer, onPendingChange, checkTrigger, disabled }) {
  const [selected, setSelected] = useState(null)
  const [checked, setChecked] = useState(false)
  const selectedRef = useRef(null)
  const checkedRef = useRef(false)
  const choices = useMemo(() => shuffle(exercise.choices), [exercise.id])
  const isSoundMode = exercise.mode === 'sound'
  const letter = isSoundMode ? exercise.display : exercise.answer

  function select(choice) {
    if (disabled || checkedRef.current) return
    hapticTap()
    setSelected(choice)
    selectedRef.current = choice
    onPendingChange(true)
  }

  useEffect(() => {
    function onKeyDown(e) {
      const idx = parseInt(e.key) - 1
      if (idx >= 0 && idx < choices.length) select(choices[idx])
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [choices, disabled]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (checkTrigger === 0 || !selectedRef.current || checkedRef.current) return
    checkedRef.current = true
    setChecked(true)
    speakBulgarian(letter)
    const sound = isSoundMode ? exercise.answer : exercise.display
    const ok = selectedRef.current === exercise.answer
    onAnswer(ok, ok ? '' : `${letter} sounds like "${sound}".`)
  }, [checkTrigger]) // eslint-disable-line react-hooks/exhaustive-deps

  function stateOf(choice) {
    if (!checked) return selected === choice ? 'selected' : 'idle'
    if (choice === exercise.answer) return selected === choice ? 'correct' : 'reveal'
    return selected === choice ? 'wrong' : 'idle'
  }

  const keyHint = i => <span className={styles.keyHint}>{i + 1}</span>

  if (isSoundMode) {
    return (
      <div className={styles.wrap}>
        <h2 className={styles.letterQuestion}>What sound does this make?</h2>
        <div className={styles.letterSoundRow}>
          <div className={styles.letterCardBig} lang="bg">
            <span>{letter}</span>
            {letter.toLowerCase() !== letter && <span className={styles.letterCardLower}>{letter.toLowerCase()}</span>}
          </div>
          <div className={styles.letterSoundChoices}>
            {choices.map((choice, i) => (
              <button
                key={choice}
                className={`${styles.choice} ${styles.letterSoundChoice} ${styles[stateOf(choice)]}`}
                onClick={() => select(choice)}
                disabled={disabled || checked}
              >
                {keyHint(i)}
                <span>{choice}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <h2 className={styles.letterQuestion}>Select the letter for &ldquo;{exercise.display}&rdquo;</h2>
      <div className={styles.letterCards} style={{ '--cards': choices.length }}>
        {choices.map((choice, i) => (
          <button
            key={choice}
            lang="bg"
            className={`${styles.cyrillicCard} ${styles.letterCard} ${styles[stateOf(choice)]}`}
            onClick={() => select(choice)}
            disabled={disabled || checked}
          >
            <span className={styles.bigChar}>{choice}</span>
            {keyHint(i)}
          </button>
        ))}
      </div>
    </div>
  )
}
