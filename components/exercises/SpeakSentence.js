'use client'
import { useState, useEffect } from 'react'
import { speakBulgarian, startSpeechRecognition } from '../../lib/audio'
import styles from './Exercise.module.css'

function normalizeSpeech(str) {
  return str.toLowerCase()
    .replace(/[.,!?;:'"«»„""()\[\]-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function speechMatches(spoken, target) {
  const a = normalizeSpeech(spoken)
  const b = normalizeSpeech(target)
  if (a === b) return true
  const aWords = a.split(' ')
  const bWords = b.split(' ')
  const bSet = new Set(bWords)
  const overlap = aWords.filter(w => bSet.has(w)).length
  return overlap / bWords.length >= 0.7
}

export default function SpeakSentence({ exercise, onAnswer, disabled }) {
  const [listening, setListening] = useState(false)
  const [lastSpoken, setLastSpoken] = useState(null)
  const [failed, setFailed] = useState(false)
  const [succeeded, setSucceeded] = useState(false)

  const target = exercise.tts || exercise.answer

  useEffect(() => {
    if (target) speakBulgarian(target)
  }, []) // eslint-disable-line

  function handleSpeak() {
    if (listening || disabled || succeeded) return
    setListening(true)
    setLastSpoken(null)
    setFailed(false)
    const rec = startSpeechRecognition(
      (transcript, all) => {
        setLastSpoken(transcript)
        const matched = (all || [transcript]).some(t => speechMatches(t, target))
        if (matched) {
          setSucceeded(true)
          onAnswer(true)
        } else {
          setFailed(true)
        }
      },
      () => setListening(false)
    )
    if (!rec) {
      setListening(false)
      alert('Speech recognition is not supported in this browser.')
    }
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.label}>SPEAK THIS SENTENCE</p>

      <div className={styles.speakBubbleRow}>
        <div className={styles.speakBubble}>
          <button
            className={styles.speakBubbleAudioBtn}
            onClick={() => speakBulgarian(target)}
            title="Listen again"
          >
            <img src="/icons/speaker.png" alt="🔊" width={20} height={20} />
          </button>
          <span className={styles.speakBubbleText}>{target}</span>
        </div>
      </div>

      {failed && lastSpoken && (
        <p className={styles.speakRetryMsg}>
          Heard: &ldquo;{lastSpoken}&rdquo;, didn&apos;t quite match. Try again!
        </p>
      )}

      <button
        className={`${styles.speakMicBtn} ${listening ? styles.speakMicListening : ''} ${succeeded ? styles.speakMicOk : ''}`}
        onClick={handleSpeak}
        disabled={disabled || listening || succeeded}
      >
        <img src="/icons/microphone.png" alt="🎤" width={24} height={24} />
        <span>{listening ? 'LISTENING…' : failed ? 'TRY AGAIN' : 'CLICK TO SPEAK'}</span>
      </button>
    </div>
  )
}
