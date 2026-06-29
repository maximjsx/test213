'use client'
import { useState, useEffect, useRef } from 'react'
import { speakBulgarian, startSpeechRecognition } from '../../lib/audio'
import styles from './Exercise.module.css'

function normalizeSpeech(str) {
  return str.toLowerCase()
    .replace(/[.,!?;:'"«»„""()\[\]-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function editDistance(a, b) {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)])
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
  return dp[m][n]
}

function fuzzyWordMatch(a, b) {
  if (a === b) return true
  const maxLen = Math.max(a.length, b.length)
  const threshold = maxLen <= 3 ? 0 : maxLen <= 6 ? 1 : 2
  return editDistance(a, b) <= threshold
}

function speechMatches(spoken, target) {
  const a = normalizeSpeech(spoken)
  const b = normalizeSpeech(target)
  if (a === b) return true
  const aWords = a.split(' ')
  const bWords = b.split(' ')
  const matched = bWords.filter(bw => aWords.some(aw => fuzzyWordMatch(aw, bw))).length
  return matched / bWords.length >= 0.7
}

export default function SpeakSentence({ exercise, onAnswer, disabled }) {
  const [listening, setListening] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [lastSpoken, setLastSpoken] = useState(null)
  const [failed, setFailed] = useState(false)
  const [succeeded, setSucceeded] = useState(false)
  const [isSpeechSupported, setIsSpeechSupported] = useState(false)
  const [useApiStt, setUseApiStt] = useState(false)
  const chunksRef = useRef([])
  const recorderRef = useRef(null)

  const target = exercise.tts || exercise.answer

  useEffect(() => {
    if (target) speakBulgarian(target)

    // webkitSpeechRecognition doesn't support bg-BG on iOS or Android.
    // Use MediaRecorder + Groq Whisper API instead for all mobile devices.
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    if (isMobile) {
      setUseApiStt(true)
      setIsSpeechSupported(!!navigator.mediaDevices?.getUserMedia)
    } else {
      setIsSpeechSupported(!!(window.SpeechRecognition || window.webkitSpeechRecognition))
    }
  }, []) // eslint-disable-line

  async function handleApiRecord() {
    if (listening || processing || disabled || succeeded) return
    setFailed(false)
    setLastSpoken(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const recorder = new MediaRecorder(stream, { mimeType })
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setListening(false)
        setProcessing(true)
        const ext = mimeType.includes('webm') ? 'webm' : 'mp4'
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const form = new FormData()
        form.append('audio', blob, `recording.${ext}`)
        form.append('target', target)
        try {
          const res = await fetch('/api/stt', { method: 'POST', body: form })
          const { transcript } = await res.json()
          if (transcript) {
            setLastSpoken(transcript)
            if (speechMatches(transcript, target)) {
              setSucceeded(true)
              onAnswer(true)
            } else {
              setFailed(true)
            }
          } else {
            setFailed(true)
          }
        } catch {
          setFailed(true)
        } finally {
          setProcessing(false)
        }
      }

      recorderRef.current = recorder
      setListening(true)
      recorder.start()
      // Auto-stop after 5 seconds
      setTimeout(() => { if (recorder.state === 'recording') recorder.stop() }, 5000)
    } catch {
      setFailed(true)
      setListening(false)
    }
  }

  function handleWebSpeech() {
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
      () => setListening(false),
      () => { setListening(false); setFailed(true) }
    )
    if (!rec) setListening(false)
  }

  function handleSpeak() {
    if (useApiStt) handleApiRecord()
    else handleWebSpeech()
  }

  const btnLabel = listening || processing ? 'LISTENING…'
    : failed ? 'TRY AGAIN'
    : 'CLICK TO SPEAK'

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

      {isSpeechSupported ? (
        <button
          className={`${styles.speakMicBtn} ${listening || processing ? styles.speakMicListening : ''} ${succeeded ? styles.speakMicOk : ''}`}
          onClick={handleSpeak}
          disabled={disabled || listening || processing || succeeded}
        >
          <img src="/icons/microphone.png" alt="🎤" width={24} height={24} />
          <span>{btnLabel}</span>
        </button>
      ) : (
        <p className={styles.speakUnsupported}>
          Speech recognition is not supported in this browser. Use &ldquo;Can&apos;t speak now&rdquo; to skip.
        </p>
      )}
    </div>
  )
}
