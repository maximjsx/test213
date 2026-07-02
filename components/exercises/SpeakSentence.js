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
  const [livePreview, setLivePreview] = useState('')
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
  const wsRef = useRef(null)

  const target = exercise.tts || exercise.answer

  useEffect(() => {
    if (target) speakBulgarian(target)

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

    if (!SR || isMobile) {
      setSttMode('whisper')
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
      if (e.error === 'language-not-supported' || e.error === 'service-not-allowed') finish('whisper')
      else finish('native')
    }
    try { probe.start() } catch { finish('whisper') }
    timer = setTimeout(() => finish('native'), 1500)
    return () => { done = true; clearTimeout(timer); try { probe.abort() } catch {} }
  }, []) // eslint-disable-line

  function stopVad() {
    if (vadTimerRef.current) { clearInterval(vadTimerRef.current); vadTimerRef.current = null }
  }

  // Speechmatics Realtime: browser connects directly using a short-lived token.
  // Audio flows: AudioWorklet → browser WebSocket → Speechmatics RT API
  // Partials stream back live; final transcript used for matching.
  async function handleSpeechmaticsRT(threshold) {
    const isActive = phase === 'waiting' || phase === 'speaking'
    if (phase === 'processing' || disabled || succeeded) return
    if (isActive) {
      stopVad()
      if (stopCaptureRef.current) { stopCaptureRef.current(); stopCaptureRef.current = null }
      return
    }
    setFailed(false)
    setLastSpoken(null)
    setLivePreview('')

    try {
      // 1. Get a 60-second temp token (keeps API key server-side)
      const tokenRes = await fetch('/api/stt-token')
      if (!tokenRes.ok) throw new Error('token_failed')
      const { key: tempKey } = await tokenRes.json()
      if (!tempKey) throw new Error('no_token')

      // 2. Open mic + AudioWorklet
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      const audioCtx = new AudioCtx()
      audioCtxRef.current = audioCtx
      const sampleRate = audioCtx.sampleRate

      let workletLoaded = false
      try { await audioCtx.audioWorklet.addModule('/pcm-worklet.js'); workletLoaded = true } catch {}

      // 3. Open WebSocket directly to Speechmatics
      const ws = new WebSocket(`wss://eu.rt.speechmatics.com/v2?jwt=${tempKey}`)
      wsRef.current = ws
      ws.binaryType = 'arraybuffer'

      let stopped = false, seqNo = 0, finalTranscript = ''

      function cleanup() {
        if (stopped) return
        stopped = true
        stopVad()
        try { ws.close() } catch {}
        wsRef.current = null
        stream.getTracks().forEach(t => t.stop())
        audioCtx.close().catch(() => {}); audioCtxRef.current = null
      }

      stopCaptureRef.current = () => {
        if (stopped) return
        // Signal end of audio to Speechmatics, let EndOfTranscript close everything
        try { ws.send(JSON.stringify({ message: 'EndOfStream', last_seq_no: seqNo })) } catch {}
        stopVad()
        stream.getTracks().forEach(t => t.stop())
        audioCtx.close().catch(() => {}); audioCtxRef.current = null
        stopped = true
      }

      ws.onopen = () => {
        ws.send(JSON.stringify({
          message: 'StartRecognition',
          audio_format: { type: 'raw', encoding: 'pcm_s16le', sample_rate: sampleRate },
          transcription_config: {
            language: 'bg',
            max_delay: 1.0,
            max_delay_mode: 'flexible',
            enable_partials: true,
          },
        }))
      }

      ws.onmessage = (e) => {
        let msg; try { msg = JSON.parse(e.data) } catch { return }

        if (msg.message === 'RecognitionStarted') {
          // Start streaming PCM from AudioWorklet once Speechmatics is ready
          if (workletLoaded) {
            const source = audioCtx.createMediaStreamSource(stream)
            const workletNode = new AudioWorkletNode(audioCtx, 'pcm-processor')
            const silencer = audioCtx.createGain(); silencer.gain.value = 0
            source.connect(workletNode); workletNode.connect(silencer); silencer.connect(audioCtx.destination)

            // VAD analyser
            const analyser = audioCtx.createAnalyser(); analyser.fftSize = 512
            source.connect(analyser)
            const buf = new Uint8Array(analyser.frequencyBinCount)
            let speechStarted = false, silenceStart = null
            const startTime = Date.now()

            workletNode.port.onmessage = (ev) => {
              if (stopped || ws.readyState !== WebSocket.OPEN) return
              ws.send(ev.data)
              seqNo++
            }

            setPhase('waiting')
            vadTimerRef.current = setInterval(() => {
              if (stopped) return
              if (Date.now() - startTime > 15000) { stopCaptureRef.current?.(); stopCaptureRef.current = null; return }
              analyser.getByteTimeDomainData(buf)
              let sum = 0
              for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v }
              const rms = Math.sqrt(sum / buf.length)
              if (rms > 0.02) {
                if (!speechStarted) { speechStarted = true; setPhase('speaking') }
                silenceStart = null
              } else if (speechStarted) {
                if (!silenceStart) silenceStart = Date.now()
                else if (Date.now() - silenceStart > 1500) { stopCaptureRef.current?.(); stopCaptureRef.current = null }
              }
            }, 100)
          }
        }

        if (msg.message === 'AddPartial' && msg.metadata?.transcript) {
          setLivePreview(msg.metadata.transcript.trim())
        }

        if (msg.message === 'AddTranscript' && msg.metadata?.transcript) {
          finalTranscript += (finalTranscript ? ' ' : '') + msg.metadata.transcript.trim()
          setLivePreview('')
        }

        if (msg.message === 'EndOfTranscript') {
          cleanup()
          setPhase('processing')
          const transcript = finalTranscript.trim()
          setLivePreview('')
          if (transcript) {
            setLastSpoken(transcript)
            if (speechMatches(transcript, target, { threshold })) { setSucceeded(true); onAnswer(true) }
            else setFailed(true)
          } else { setFailed(true) }
          setPhase('idle')
        }

        if (msg.message === 'Error') {
          cleanup()
          setFailed(true); setPhase('idle')
        }
      }

      ws.onerror = () => { cleanup(); setFailed(true); setPhase('idle') }
      ws.onclose = () => {
        if (!stopped) { cleanup(); if (!finalTranscript) { setFailed(true); setPhase('idle') } }
      }

      // If AudioWorklet not available, fallback to MediaRecorder batch send
      if (!workletLoaded) {
        ws.close()
        await handleMediaRecorderFallback('/api/stt', 0.65)
      }

    } catch { setFailed(true); setPhase('idle') }
  }

  async function handleMediaRecorderFallback(endpoint, threshold) {
    setFailed(false); setLastSpoken(null); setLivePreview('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      const audioCtx = new AudioCtx()
      audioCtxRef.current = audioCtx
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
          const form = new FormData()
          form.append('audio', blob, `recording.${ext}`)
          form.append('target', target)
          const res = await fetch(endpoint, { method: 'POST', body: form })
          if (!res.ok) throw new Error(`${endpoint} ${res.status}`)
          const data = await res.json()
          const transcript = data.transcript ?? null
          if (transcript) {
            setLastSpoken(transcript)
            if (speechMatches(transcript, target, { threshold })) { setSucceeded(true); onAnswer(true) }
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
      const analyser = audioCtx.createAnalyser(); analyser.fftSize = 512
      source.connect(analyser)
      const buf = new Uint8Array(analyser.frequencyBinCount)
      let speechStarted = false, silenceStart = null
      const startTime = Date.now()

      vadTimerRef.current = setInterval(() => {
        if (recorder.state !== 'recording') { stopVad(); return }
        if (Date.now() - startTime > 15000) { recorder.stop(); return }
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
    } catch { setFailed(true); setPhase('idle') }
  }

  function handleWebSpeech() {
    const isActive = phase === 'waiting' || phase === 'speaking'
    if (phase === 'processing' || disabled || succeeded) return
    if (isActive) { stopCaptureRef.current?.(); stopCaptureRef.current = null; return }

    setPhase('waiting')
    setLastSpoken(null)
    setFailed(false)
    setLivePreview('')

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = 'bg-BG'
    rec.continuous = true
    rec.interimResults = true
    rec.maxAlternatives = 1

    let finalTranscript = ''
    let lastInterim = ''
    let silenceTimer = null
    let speechStarted = false
    let done = false

    function finish() {
      if (done) return
      done = true
      clearTimeout(silenceTimer)
      clearTimeout(maxTimer)
      try { rec.abort() } catch {}
    }

    function process() {
      finish()
      setLivePreview('')
      // Recognition may never flag a result as final before the silence
      // timeout fires, so fall back to the last interim transcript
      const transcript = (finalTranscript.trim() || lastInterim.trim())
      if (transcript) {
        setLastSpoken(transcript)
        if (speechMatches(transcript, target)) { setFailed(false); setSucceeded(true); onAnswer(true) }
        else setFailed(true)
      } else if (speechStarted) {
        setFailed(true)
      }
      setPhase('idle')
    }

    const maxTimer = setTimeout(process, 15000)

    rec.onresult = (e) => {
      if (!speechStarted) { speechStarted = true; setPhase('speaking') }
      clearTimeout(silenceTimer)
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript + ' '
        else interim += e.results[i][0].transcript
      }
      if (interim) lastInterim = interim
      setLivePreview((finalTranscript + interim).trim())
      silenceTimer = setTimeout(process, 1500)
    }

    rec.onend = () => { if (!done) process() }
    // abort() after grading also fires onerror; done means we already graded
    rec.onerror = () => { if (done) return; finish(); if (speechStarted) setFailed(true); setPhase('idle') }

    stopCaptureRef.current = process
    try { rec.start() } catch { finish(); setPhase('idle') }
  }

  function handleSpeak() {
    if (sttMode === 'native') handleWebSpeech()
    else if (sttMode === 'whisper') handleMediaRecorderFallback('/api/stt', 0.65)
    else handleSpeechmaticsRT(0.80)
  }

  const btnLabel = phase === 'processing' ? 'PROCESSING…'
    : phase === 'speaking' ? 'LISTENING…'
    : phase === 'waiting' ? 'SPEAK NOW…'
    : succeeded ? 'CORRECT!'
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

      {livePreview && !lastSpoken && (
        <p className={styles.speakRetryMsg} style={{ opacity: 0.5 }}>{livePreview}</p>
      )}
      {failed && (
        <p className={styles.speakRetryMsg}>Try again!</p>
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
