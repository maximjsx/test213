'use client'
import { useEffect, useRef } from 'react'
import { speakBulgarian } from '../../lib/audio'
import styles from './Exercise.module.css'

export default function Introduce({ exercise, onPendingChange, checkTrigger, onAnswer }) {
  const hasPlayed = useRef(false)
  useEffect(() => {
    if (exercise.tts && !hasPlayed.current) {
      hasPlayed.current = true
      speakBulgarian(exercise.tts)
    }
  }, []) // eslint-disable-line

  useEffect(() => {
    if (checkTrigger === 0) return
    onAnswer(true)
  }, [checkTrigger]) // eslint-disable-line react-hooks/exhaustive-deps

  const upper = exercise.display || ''
  const lower = upper.toLowerCase()
  const isCyrillic = /[Ѐ-ӿ]/i.test(upper)
  const showBothCases = isCyrillic && upper.length <= 2 && upper !== lower
  const isWord = upper.length > 2

  return (
    <div className={styles.wrap}>
      <p className={styles.label}>{exercise.label || 'NEW'}</p>

      <div className={styles.introduceCard}>
        <div className={styles.introduceLetterRow}>
          {showBothCases ? (
            <>
              <span className={styles.introduceLetter}>{upper}</span>
              <span className={styles.introduceLetterLower}>{lower}</span>
            </>
          ) : (
            <span className={isWord ? styles.introduceWord : styles.introduceLetter}>{upper}</span>
          )}
        </div>

        {exercise.sublabel && (
          <p className={styles.introduceSublabel}>{exercise.sublabel}</p>
        )}
        {exercise.translation && (
          <p className={styles.introduceTranslation}>{exercise.translation}</p>
        )}

        {exercise.tts && (
          <button
            className={styles.introduceAudioBtn}
            onClick={() => speakBulgarian(exercise.tts)}
            title="Listen again"
          >
            <img src="/icons/speaker.png" alt="🔊" width={22} height={22} />
            <span>Listen again</span>
          </button>
        )}
      </div>
    </div>
  )
}
