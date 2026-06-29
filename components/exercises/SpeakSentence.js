'use client'
import { useState, useEffect, useRef } from 'react'
import { speakBulgarian, startSpeechRecognition } from '../../lib/audio'
import { transliterateInput } from '../../lib/checker'
import styles from './Exercise.module.css'

function normalizeSpeech(str) {
  return str.toLowerCase()
    .replace(/[.,!?;:'"«»„""()\[\]-]/g, '')
    // щ and шт are the same sound in Bulgarian — Whisper often spells one as the other
    .replace(/шт/g, 'щ')
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

function wordSim(a, b) {
  if (a === b) return 1
  return 1 - editDistance(a, b) / Math.max(a.length, b.length)
}

// threshold: 0.80 for native/speechmatics (accurate), 0.65 for whisper (lenient)
function speechMatches(spoken, target, { threshold = 0.80 } = {}) {
  const a = normalizeSpeech(transliterateInput(spoken))
  const b = normalizeSpeech(target)
  if (a === b) return true

  // Collapse spaces — "ебаси мамата" == "еба си мамата"
  const ca = a.replace(/\s/g, '')
  const cb = b.replace(/\s/g, '')
  if (ca === cb) return true

  // Bag-of-words: every target word must appear at least once in what was spoken.
  // Order and repetitions don't matter — only that each word was pronounced.
  const spokenWords = a.split(' ')
  const targetWords = b.split(' ')
  if (targetWords.every(tw => spokenWords.some(sw => wordSim(sw, tw) >= threshold))) return true

  // Fallback: overall char-level similarity
  return 1 - editDistance(ca, cb) / Math.max(ca.length, cb.length) >= threshold
}

// sttMode: 'native' = browser Web Speech bg-BG
//          'speechmatics' = Speechmatics API (accurate, show words)
//          'whisper' = Groq Whisper (fallback, don't show words)
export default function SpeakSentence({ exercise, onAnswer, disabled }) {
  const [phase, setPhase] = useState('idle') // idle | waiting | speaking | processing
  const [lastSpoken, setLastSpoken] = useState(null)
  const [failed, setFailed] = useState(false)
  const [succeeded, setSucceeded] = useState(false)
  const [isSpeechSupported, setIsSpeechSupported] = useState(false)
  const [sttMode, setSttMode] = useState('native') // native | speechmatics | whisper
  const chunksRef = useRef([])
  const recorderRef = useRef(null)
  const audioCtxRef = useRef(null)
  const vadTimerRef = useRef(null)

  const target = exercise.tts || exercise.answer

  useEffect(() => {
    if (target) speakBulgarian(target)

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

    if (!SR || isMobile) {
      setSttMode('speechmatics')
      setIsSpeechSupported(!!navigator.mediaDevices?.getUserMedia)
      return
    }

    // Probe whether bg-BG is actually supported — language-not-supported fires
    // before any mic prompt so this is invisible to the user.
    let done = false
    let timer = null

    const finish = (mode) => {
      if (done) return
      done = true
      clearTimeout(timer)
      setSttMode(mode)
      setIsSpeechSupported(mode === 'native' || !!navigator.mediaDevices?.getUserMedia)
    }

    const probe = new SR()
    probe.lang = 'bg-BG'
    probe.onstart = () => { try { probe.abort() } catch {} finish('native') }
    probe.onend = () => finish('native')
    probe.onerror = (e) => {
      if (e.error === 'language-not-supported' || e.error === 'service-not-allowed') {
        finish('speechmatics')
      } else {
        finish('native') // not-allowed / audio-capture — language works, just no mic yet
      }
    }
    try { probe.start() } catch { finish('speechmatics') }
    timer = setTimeout(() => finish('native'), 1500)
    return () => { done = true; clearTimeout(timer); try { probe.abort() } catch {} }
  }, []) // eslint-disable-line

  function stopVad() {
    if (vadTimerRef.current) { clearInterval(vadTimerRef.current); vadTimerRef.current = null }
    if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null }
  }

  async function handleRecordAndTranscribe(endpoint, threshold) {
    const isActive = phase === 'waiting' || phase === 'speaking'
    if (phase === 'processing' || disabled || succeeded) return
    if (isActive) {
      stopVad()
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
      return
    }
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
        stopVad()
        stream.getTracks().forEach(t => t.stop())
        setPhase('processing')
        const actualMime = recorder.mimeType || mimeType
        const ext = actualMime.includes('webm') ? 'webm' : 'mp4'
        const blob = new Blob(chunksRef.current, { type: actualMime })

        async function callApi(ep) {
          const form = new FormData()
          form.append('audio', blob, `recording.${ext}`)
          form.append('target', target)
          const res = await fetch(ep, { method: 'POST', body: form })
          if (!res.ok) throw new Error(`${ep} returned ${res.status}`)
          return res.json()
        }

        try {
          let transcript = null
          let usedThreshold = threshold

          try {
            const data = await callApi(endpoint)
            transcript = data.transcript ?? null
          } catch {
            // Reuse the same blob — no re-recording needed
            if (endpoint !== '/api/stt') {
              setSttMode('whisper')
              usedThreshold = 0.65
              const data = await callApi('/api/stt')
              transcript = data.transcript ?? null
            }
          }

          if (transcript) {
            setLastSpoken(transcript)
            if (speechMatches(transcript, target, { threshold: usedThreshold })) {
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
          setPhase('idle')
        }
      }

      recorderRef.current = recorder
      recorder.start()
      setPhase('waiting')

      // VAD: detect speech start/end via amplitude
      const audioCtx = new AudioContext()
      audioCtxRef.current = audioCtx
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 512
      source.connect(analyser)
      const buf = new Uint8Array(analyser.frequencyBinCount)

      let speechStarted = false
      let silenceStart = null
      const SPEECH_THRESHOLD = 0.02
      const SILENCE_MS = 1500
      const MAX_MS = 8000
      const startTime = Date.now()

      vadTimerRef.current = setInterval(() => {
        if (recorder.state !== 'recording') { stopVad(); return }
        if (Date.now() - startTime > MAX_MS) { recorder.stop(); return }

        analyser.getByteTimeDomainData(buf)
        let sum = 0
        for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v }
        const rms = Math.sqrt(sum / buf.length)

        if (rms > SPEECH_THRESHOLD) {
          if (!speechStarted) { speechStarted = true; setPhase('speaking') }
          silenceStart = null
        } else if (speechStarted) {
          if (!silenceStart) silenceStart = Date.now()
          else if (Date.now() - silenceStart > SILENCE_MS) recorder.stop()
        }
      }, 100)

    } catch {
      setFailed(true)
      setPhase('idle')
    }
  }

  function handleWebSpeech() {
    if (phase !== 'idle' || disabled || succeeded) return
    setPhase('speaking')
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
      () => setPhase('idle'),
      () => { setPhase('idle'); setFailed(true) }
    )
    if (!rec) setPhase('idle')
  }

  function handleSpeak() {
    if (sttMode === 'native') handleWebSpeech()
    else if (sttMode === 'speechmatics') handleRecordAndTranscribe('/api/stt-speechmatics', 0.80)
    else handleRecordAndTranscribe('/api/stt', 0.65)
  }

  const btnLabel = phase === 'processing' ? 'PROCESSING…'
    : phase === 'speaking' ? 'LISTENING…'
    : phase === 'waiting' ? 'SPEAK NOW…'
    : failed ? 'TRY AGAIN'
    : 'CLICK TO SPEAK'

  const sttLabel = sttMode === 'native' ? 'Browser (bg-BG)' : sttMode === 'speechmatics' ? 'Speechmatics' : 'Whisper'

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

      {lastSpoken && !succeeded && (
        <p className={styles.speakRetryMsg}>
          [{sttLabel}] &ldquo;{lastSpoken}&rdquo;{failed ? ', try again!' : ''}
        </p>
      )}
      {failed && !lastSpoken && (
        <p className={styles.speakRetryMsg}>[{sttLabel}] Didn&apos;t catch that, try again!</p>
      )}

      {isSpeechSupported ? (
        <button
          className={`${styles.speakMicBtn} ${phase !== 'idle' ? styles.speakMicListening : ''} ${succeeded ? styles.speakMicOk : ''}`}
          onClick={handleSpeak}
          disabled={disabled || phase === 'processing' || succeeded}
        >
          <img src="/icons/microphone.png" alt="🎤" width={24} height={24} />
          <span>{btnLabel}</span>
        </button>
      ) : (
        <p className={styles.speakUnsupported}>
          Speech recognition is not supported in this browser. Use &ldquo;Can&apos;t speak now&rdquo; to skip.
        </p>
      )}

      <p style={{ fontSize: '0.7rem', opacity: 0.4, marginTop: '0.5rem' }}>STT: {sttLabel}</p>
    </div>
  )
}
