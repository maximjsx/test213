'use client'
import { useState, useEffect, useRef } from 'react'
import { speakBulgarian, startSpeechRecognition } from '../../lib/audio'
import { transliterateInput } from '../../lib/checker'
import styles from './Exercise.module.css'

function normalizeSpeech(str) {
  return str.toLowerCase()
    .replace(/[.,!?;:'"«»„""()\[\]-]/g, '')
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

function pcmToWav(pcm, sampleRate) {
  const dataSize = pcm.byteLength
  const buf = new ArrayBuffer(44 + dataSize)
  const v = new DataView(buf)
  const s = (o, str) => { for (let i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i)) }
  s(0, 'RIFF'); v.setUint32(4, 36 + dataSize, true); s(8, 'WAVE')
  s(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true)
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 2, true)
  v.setUint16(32, 2, true); v.setUint16(34, 16, true)
  s(36, 'data'); v.setUint32(40, dataSize, true)
  new Int16Array(buf, 44).set(pcm)
  return buf
}

function speechMatches(spoken, target, { threshold = 0.80 } = {}) {
  const a = normalizeSpeech(transliterateInput(spoken))
  const b = normalizeSpeech(target)
  if (a === b) return true
  const ca = a.replace(/\s/g, ''), cb = b.replace(/\s/g, '')
  if (ca === cb) return true
  const spokenWords = a.split(' '), targetWords = b.split(' ')
  if (targetWords.every(tw => spokenWords.some(sw => wordSim(sw, tw) >= threshold))) return true
  return 1 - editDistance(ca, cb) / Math.max(ca.length, cb.length) >= threshold
}

export default function SpeakSentence({ exercise, onAnswer, disabled }) {
  const [phase, setPhase] = useState('idle')
  const [lastSpoken, setLastSpoken] = useState(null)
  const [failed, setFailed] = useState(false)
  const [succeeded, setSucceeded] = useState(false)
  const [isSpeechSupported, setIsSpeechSupported] = useState(false)
  const [sttMode, setSttMode] = useState('native')
  const chunksRef = useRef([])
  const pcmChunksRef = useRef([])
  const recorderRef = useRef(null)
  const audioCtxRef = useRef(null)
  const vadTimerRef = useRef(null)
  const stopCaptureRef = useRef(null)

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

    let done = false, timer = null
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
      if (e.error === 'language-not-supported' || e.error === 'service-not-allowed') finish('speechmatics')
      else finish('native')
    }
    try { probe.start() } catch { finish('speechmatics') }
    timer = setTimeout(() => finish('native'), 1500)
    return () => { done = true; clearTimeout(timer); try { probe.abort() } catch {} }
  }, []) // eslint-disable-line

  function stopVad() {
    if (vadTimerRef.current) { clearInterval(vadTimerRef.current); vadTimerRef.current = null }
  }

  async function handleRecordAndTranscribe(endpoint, threshold) {
    const isActive = phase === 'waiting' || phase === 'speaking'
    if (phase === 'processing' || disabled || succeeded) return
    if (isActive) {
      stopVad()
      if (stopCaptureRef.current) { stopCaptureRef.current(); stopCaptureRef.current = null }
      return
    }
    setFailed(false)
    setLastSpoken(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      const audioCtx = new AudioCtx()
      audioCtxRef.current = audioCtx
      const sampleRate = audioCtx.sampleRate

      // Try AudioWorklet PCM path for Speechmatics
      let workletLoaded = false
      if (endpoint !== '/api/stt') {
        try { await audioCtx.audioWorklet.addModule('/pcm-worklet.js'); workletLoaded = true } catch {}
      }

      if (workletLoaded) {
        // --- AudioWorklet path: raw PCM S16LE ---
        const source = audioCtx.createMediaStreamSource(stream)
        const workletNode = new AudioWorkletNode(audioCtx, 'pcm-processor')
        pcmChunksRef.current = []
        workletNode.port.onmessage = (e) => { pcmChunksRef.current.push(new Int16Array(e.data)) }

        // Silent sink keeps the graph active without speaker output
        const silencer = audioCtx.createGain()
        silencer.gain.value = 0
        source.connect(workletNode)
        workletNode.connect(silencer)
        silencer.connect(audioCtx.destination)

        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 512
        source.connect(analyser)
        const buf = new Uint8Array(analyser.frequencyBinCount)
        let speechStarted = false, silenceStart = null
        const startTime = Date.now()
        let stopped = false

        async function processWorklet() {
          setPhase('processing')
          const chunks = pcmChunksRef.current
          const total = chunks.reduce((s, c) => s + c.length, 0)
          const pcm = new Int16Array(total)
          let off = 0
          for (const c of chunks) { pcm.set(c, off); off += c.length }

          try {
            let transcript = null, usedThreshold = threshold
            try {
              const form = new FormData()
              form.append('audio', new Blob([pcm.buffer], { type: 'application/octet-stream' }), 'audio.pcm')
              form.append('sample_rate', String(sampleRate))
              form.append('target', target)
              const res = await fetch(endpoint, { method: 'POST', body: form })
              if (!res.ok) throw new Error(`${endpoint} ${res.status}`)
              const data = await res.json()
              transcript = data.transcript ?? null
            } catch {
              setSttMode('whisper')
              usedThreshold = 0.65
              const wav = pcmToWav(pcm, sampleRate)
              const form = new FormData()
              form.append('audio', new Blob([wav], { type: 'audio/wav' }), 'recording.wav')
              form.append('target', target)
              const res = await fetch('/api/stt', { method: 'POST', body: form })
              if (!res.ok) throw new Error(`/api/stt ${res.status}`)
              const data = await res.json()
              transcript = data.transcript ?? null
            }
            if (transcript) {
              setLastSpoken(transcript)
              if (speechMatches(transcript, target, { threshold: usedThreshold })) { setSucceeded(true); onAnswer(true) }
              else setFailed(true)
            } else { setFailed(true) }
          } catch { setFailed(true) }
          finally { setPhase('idle') }
        }

        function stopCapture() {
          if (stopped) return
          stopped = true
          stopVad()
          try { workletNode.disconnect() } catch {}
          try { source.disconnect() } catch {}
          stream.getTracks().forEach(t => t.stop())
          audioCtx.close().catch(() => {})
          audioCtxRef.current = null
          processWorklet()
        }
        stopCaptureRef.current = stopCapture

        setPhase('waiting')
        vadTimerRef.current = setInterval(() => {
          if (stopped) return
          if (Date.now() - startTime > 8000) { stopCapture(); return }
          analyser.getByteTimeDomainData(buf)
          let sum = 0
          for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v }
          const rms = Math.sqrt(sum / buf.length)
          if (rms > 0.02) { if (!speechStarted) { speechStarted = true; setPhase('speaking') } silenceStart = null }
          else if (speechStarted) {
            if (!silenceStart) silenceStart = Date.now()
            else if (Date.now() - silenceStart > 1500) stopCapture()
          }
        }, 100)

      } else {
        // --- MediaRecorder fallback path ---
        const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
        const recorder = new MediaRecorder(stream, { mimeType })
        chunksRef.current = []
        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }

        recorder.onstop = async () => {
          stopVad()
          stream.getTracks().forEach(t => t.stop())
          audioCtx.close().catch(() => {}); audioCtxRef.current = null
          setPhase('processing')
          const actualMime = recorder.mimeType || mimeType
          const ext = actualMime.includes('webm') ? 'webm' : 'mp4'
          const blob = new Blob(chunksRef.current, { type: actualMime })
          try {
            let transcript = null, usedThreshold = threshold
            try {
              const form = new FormData()
              form.append('audio', blob, `recording.${ext}`)
              form.append('target', target)
              const res = await fetch(endpoint, { method: 'POST', body: form })
              if (!res.ok) throw new Error(`${endpoint} ${res.status}`)
              const data = await res.json()
              transcript = data.transcript ?? null
            } catch {
              if (endpoint !== '/api/stt') {
                setSttMode('whisper')
                usedThreshold = 0.65
                const form = new FormData()
                form.append('audio', blob, `recording.${ext}`)
                form.append('target', target)
                const res = await fetch('/api/stt', { method: 'POST', body: form })
                if (!res.ok) throw new Error(`/api/stt ${res.status}`)
                const data = await res.json()
                transcript = data.transcript ?? null
              }
            }
            if (transcript) {
              setLastSpoken(transcript)
              if (speechMatches(transcript, target, { threshold: usedThreshold })) { setSucceeded(true); onAnswer(true) }
              else setFailed(true)
            } else { setFailed(true) }
          } catch { setFailed(true) }
          finally { setPhase('idle') }
        }

        recorderRef.current = recorder
        stopCaptureRef.current = () => { if (recorder.state === 'recording') recorder.stop() }
        recorder.start()
        setPhase('waiting')

        const source = audioCtx.createMediaStreamSource(stream)
        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 512
        source.connect(analyser)
        const buf = new Uint8Array(analyser.frequencyBinCount)
        let speechStarted = false, silenceStart = null
        const startTime = Date.now()

        vadTimerRef.current = setInterval(() => {
          if (recorder.state !== 'recording') { stopVad(); return }
          if (Date.now() - startTime > 8000) { recorder.stop(); return }
          analyser.getByteTimeDomainData(buf)
          let sum = 0
          for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v }
          const rms = Math.sqrt(sum / buf.length)
          if (rms > 0.02) { if (!speechStarted) { speechStarted = true; setPhase('speaking') } silenceStart = null }
          else if (speechStarted) {
            if (!silenceStart) silenceStart = Date.now()
            else if (Date.now() - silenceStart > 1500) recorder.stop()
          }
        }, 100)
      }
    } catch { setFailed(true); setPhase('idle') }
  }

  function handleWebSpeech() {
    if (phase !== 'idle' || disabled || succeeded) return
    setPhase('speaking')
    setLastSpoken(null)
    setFailed(false)
    const rec = startSpeechRecognition(
      (transcript, all) => {
        setLastSpoken(transcript)
        if ((all || [transcript]).some(t => speechMatches(t, target))) { setSucceeded(true); onAnswer(true) }
        else setFailed(true)
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

  return (
    <div className={styles.wrap}>
      <p className={styles.label}>SPEAK THIS SENTENCE</p>

      <div className={styles.speakBubbleRow}>
        <div className={styles.speakBubble}>
          <button className={styles.speakBubbleAudioBtn} onClick={() => speakBulgarian(target)} title="Listen again">
            <img src="/icons/speaker.png" alt="🔊" width={20} height={20} />
          </button>
          <span className={styles.speakBubbleText}>{target}</span>
        </div>
      </div>

      {lastSpoken && (
        <p className={styles.speakRetryMsg}>
          Heard: &ldquo;{lastSpoken}&rdquo;{failed ? ', try again!' : ''}
        </p>
      )}
      {failed && !lastSpoken && (
        <p className={styles.speakRetryMsg}>Didn&apos;t catch that, try again!</p>
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
    </div>
  )
}
