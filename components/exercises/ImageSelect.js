'use client'
import { useState, useRef, useMemo, useEffect } from 'react'
import { shuffle } from '../../lib/checker'
import { playClip, hapticTap } from '../../lib/audio'
import styles from './Exercise.module.css'

// Hear a Bulgarian word, tap the matching picture.
export default function ImageSelect({ exercise, onAnswer, onPendingChange, checkTrigger, disabled }) {
  const [selected, setSelected] = useState(null) // key of chosen option
  const [checked, setChecked] = useState(false)
  const selectedRef = useRef(null)
  const checkedRef = useRef(false)

  const options = useMemo(
    () => shuffle((exercise.options || []).map((o, i) => ({ ...o, correct: i === exercise.answer }))),
    [exercise.id]
  )

  const play = () => playClip({ audio: exercise.audio, text: exercise.prompt || exercise.tts })
  useEffect(() => { play() }, []) // eslint-disable-line

  function select(opt) {
    if (disabled || checkedRef.current) return
    hapticTap()
    play()
    setSelected(opt.key)
    selectedRef.current = opt
    onPendingChange(true)
  }

  useEffect(() => {
    if (checkTrigger === 0 || !selectedRef.current || checkedRef.current) return
    checkedRef.current = true
    setChecked(true)
    onAnswer(!!selectedRef.current.correct, selectedRef.current.correct ? '' : 'Not quite')
  }, [checkTrigger]) // eslint-disable-line

  const cardState = (opt) => {
    if (!checked) return selected === opt.key ? styles.selected : ''
    if (opt.correct) return styles.correct
    if (opt.key === selected) return styles.wrong
    return ''
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.label}>WHICH PICTURE?</p>
      <div className={styles.imageListenRow}>
        <button className={styles.ttsBtn} onClick={play} title="Listen again">
          <img src="/icons/speaker.png" alt="🔊" width={20} height={20} />
          <span>{exercise.prompt || 'Listen'}</span>
        </button>
      </div>

      <div className={styles.imageGrid}>
        {options.map(opt => (
          <button
            key={opt.key}
            className={`${styles.imageCard} ${cardState(opt)}`}
            onClick={() => select(opt)}
            disabled={disabled || checked}
          >
            {opt.image?.url
              ? <img src={opt.image.url} alt="" />
              : <span className={styles.imagePlaceholder}>?</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
