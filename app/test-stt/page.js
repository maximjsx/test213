'use client'
import { useState, useEffect, useRef } from 'react'
import { transliterateInput } from '../../lib/checker'
import { speakBulgarian, startSpeechRecognition } from '../../lib/audio'

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
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
  return dp[m][n]
}

function wordSim(a, b) {
  if (a === b) return 1
  return 1 - editDistance(a, b) / Math.max(a.length, b.length)
}

function matchDetails(spoken, target, threshold = 0.80) {
  const a = normalizeSpeech(transliterateInput(spoken))
  const b = normalizeSpeech(target)
  const ca = a.replace(/\s/g, ''), cb = b.replace(/\s/g, '')
  const charSim = 1 - editDistance(ca, cb) / Math.max(ca.length, cb.length)
  const targetWords = b.split(' ')
  const spokenWords = a.split(' ')
  const wordResults = targetWords.map(tw => {
    const best = spokenWords.reduce((acc, sw) => Math.max(acc, wordSim(sw, tw)), 0)
    return { word: tw, sim: best, pass: best >= threshold }
  })
  const exact = a === b
  const collapsed = ca === cb
  const allWords = wordResults.every(w => w.pass)
  const pass = exact || collapsed || allWords || charSim >= threshold
  return { normalized: { spoken: a, target: b }, exact, collapsed, charSim, wordResults, allWords, pass }
}

const ts = () => new Date().toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })

export default function TestSttPage() {
  const [log, setLog] = useState([])
  const [sttMode, setSttMode] = useState(null)
  const [probeResult, setProbeResult] = useState(null)
  const [target, setTarget] = useState('баща ми е добър')
  const [threshold, setThreshold] = useState(0.80)
  const [attempts, setAttempts] = useState([])
  const [phase, setPhase] = useState('idle')
  const chunksRef = useRef([])
  const recorderRef = useRef(null)
  const audioCtxRef = useRef(null)
  const vadTimerRef = useRef(null)

  const addLog = (msg, type = 'info') => setLog(prev => [...prev, { time: ts(), msg, type }])

  useEffect(() => {
    addLog('Page loaded — starting STT engine probe...', 'step')
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const ua = navigator.userAgent
    const isMobile = /iPhone|iPad|iPod|Android/i.test(ua)
    addLog(`User agent: ${ua}`)
    addLog(`Web Speech API: ${SR ? 'available' : 'NOT available'} | Mobile: ${isMobile}`)

    if (!SR || isMobile) {
      const reason = !SR ? 'no Web Speech API' : 'mobile device'
      addLog(`→ Skipping probe (${reason}), using Speechmatics`, 'decision')
      setSttMode('speechmatics')
      setProbeResult({ mode: 'speechmatics', reason })
      return
    }

    addLog('Probing bg-BG support (fires before mic prompt)...', 'step')
    let done = false, timer = null

    const finish = (mode, reason) => {
      if (done) return
      done = true
      clearTimeout(timer)
      addLog(`Probe result: ${mode} — ${reason}`, 'decision')
      setSttMode(mode)
      setProbeResult({ mode, reason })
    }

    const probe = new SR()
    probe.lang = 'bg-BG'
    probe.onstart = () => { try { probe.abort() } catch {} finish('native', 'bg-BG onstart fired — supported') }
    probe.onend = () => finish('native', 'bg-BG onend fired — supported')
    probe.onerror = (e) => {
      if (e.error === 'language-not-supported' || e.error === 'service-not-allowed') {
        finish('speechmatics', `bg-BG probe error: ${e.error}`)
      } else {
        finish('native', `bg-BG probe error: ${e.error} (non-language error = language IS supported)`)
      }
    }
    try { probe.start() } catch (err) { finish('speechmatics', `probe.start() threw: ${err}`) }
    timer = setTimeout(() => finish('native', 'probe timed out after 1.5s — assuming supported'), 1500)
    return () => { done = true; clearTimeout(timer); try { probe.abort() } catch {} }
  }, []) // eslint-disable-line

  function stopVad() {
    if (vadTimerRef.current) { clearInterval(vadTimerRef.current); vadTimerRef.current = null }
    if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null }
  }

  async function recordAndSend(endpoint, engineName, thresh) {
    addLog(`Recording for ${engineName}...`, 'step')
    setPhase('waiting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      addLog(`MediaRecorder mimeType: ${mimeType}`)
      const recorder = new MediaRecorder(stream, { mimeType })
      chunksRef.current = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }

      recorder.onstop = async () => {
        stopVad()
        stream.getTracks().forEach(t => t.stop())
        const actualMime = recorder.mimeType || mimeType
        const ext = actualMime.includes('webm') ? 'webm' : 'mp4'
        const blob = new Blob(chunksRef.current, { type: actualMime })
        addLog(`Recording stopped — blob size: ${blob.size} bytes, type: ${actualMime}`)
        setPhase('processing')

        addLog(`Sending to ${engineName} (${endpoint})...`, 'step')
        try {
          const form = new FormData()
          form.append('audio', blob, `recording.${ext}`)
          form.append('target', target)
          const t0 = Date.now()
          const res = await fetch(endpoint, { method: 'POST', body: form })
          const elapsed = Date.now() - t0
          addLog(`${engineName} responded in ${elapsed}ms — HTTP ${res.status}`)

          if (!res.ok) {
            const data = await res.json().catch(() => ({}))
            const detail = data.speechmatics_error ? JSON.stringify(data.speechmatics_error) : data.error || '?'
            addLog(`${engineName} HTTP ${res.status} — our error: ${data.error}`, 'error')
            addLog(`  Speechmatics said: ${detail}`, 'error')
            if (data.debug) addLog(`  Audio: ${data.debug.fileName}, ${data.debug.audioSize} bytes, type: ${data.debug.audioType}`)
            setAttempts(prev => [...prev, { engine: engineName, error: `${data.error}: ${detail}`, transcript: null }])

            // Auto-fallback to Whisper if not already on it
            if (endpoint !== '/api/stt') {
              addLog(`Falling back to Whisper with same audio blob...`, 'decision')
              setSttMode('whisper')
              await sendToWhisper(blob, ext, thresh)
            }
          } else {
            const data = await res.json()
            const transcript = data.transcript ?? ''
            addLog(`${engineName} transcript: "${transcript}"`, transcript ? 'success' : 'warn')
            if (data.debug) addLog(`  Audio sent: ${data.debug.fileName}, ${data.debug.audioSize} bytes, type: ${data.debug.audioType}, jobId: ${data.debug.jobId}`)
            if (data.confidence != null) addLog(`${engineName} confidence: ${(data.confidence * 100).toFixed(1)}%`)
            const details = matchDetails(transcript || '', target, thresh)
            addLog(`Match check (threshold ${thresh}):`)
            addLog(`  normalized spoken: "${details.normalized.spoken}"`)
            addLog(`  normalized target: "${details.normalized.target}"`)
            addLog(`  exact match: ${details.exact} | collapsed: ${details.collapsed} | char sim: ${(details.charSim * 100).toFixed(1)}%`)
            details.wordResults.forEach(w => addLog(`  word "${w.word}": sim ${(w.sim * 100).toFixed(1)}% → ${w.pass ? 'PASS' : 'FAIL'}`))
            addLog(`  OVERALL: ${details.pass ? '✓ PASS' : '✗ FAIL'}`, details.pass ? 'success' : 'error')
            setAttempts(prev => [...prev, { engine: engineName, transcript, details, elapsed }])

            if (!transcript && endpoint !== '/api/stt') {
              addLog(`Empty transcript — falling back to Whisper with same blob...`, 'decision')
              setSttMode('whisper')
              await sendToWhisper(blob, ext, thresh)
            }
          }
        } catch (err) {
          addLog(`${engineName} threw: ${err.message}`, 'error')
          setAttempts(prev => [...prev, { engine: engineName, error: err.message, transcript: null }])
          if (endpoint !== '/api/stt') {
            addLog(`Exception — falling back to Whisper with same blob...`, 'decision')
            setSttMode('whisper')
            await sendToWhisper(blob, ext, thresh)
          }
        }
        setPhase('idle')
      }

      recorderRef.current = recorder
      recorder.start()

      const audioCtx = new AudioContext()
      audioCtxRef.current = audioCtx
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 512
      source.connect(analyser)
      const buf = new Uint8Array(analyser.frequencyBinCount)
      let speechStarted = false, silenceStart = null
      const startTime = Date.now()

      vadTimerRef.current = setInterval(() => {
        if (recorder.state !== 'recording') { stopVad(); return }
        if (Date.now() - startTime > 8000) { addLog('VAD: 8s max reached → stopping', 'warn'); recorder.stop(); return }
        analyser.getByteTimeDomainData(buf)
        let sum = 0
        for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v }
        const rms = Math.sqrt(sum / buf.length)
        if (rms > 0.02) {
          if (!speechStarted) { speechStarted = true; setPhase('speaking'); addLog(`VAD: speech detected (RMS ${rms.toFixed(4)})`) }
          silenceStart = null
        } else if (speechStarted) {
          if (!silenceStart) silenceStart = Date.now()
          else if (Date.now() - silenceStart > 1500) { addLog('VAD: 1.5s silence → stopping'); recorder.stop() }
        }
      }, 100)
    } catch (err) {
      addLog(`getUserMedia failed: ${err.message}`, 'error')
      setPhase('idle')
    }
  }

  async function sendToWhisper(blob, ext, thresh) {
    addLog('Sending to Whisper (/api/stt)...', 'step')
    try {
      const form = new FormData()
      form.append('audio', blob, `recording.${ext}`)
      form.append('target', target)
      const t0 = Date.now()
      const res = await fetch('/api/stt', { method: 'POST', body: form })
      const elapsed = Date.now() - t0
      addLog(`Whisper responded in ${elapsed}ms — HTTP ${res.status}`)
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        addLog(`Whisper error: ${body}`, 'error')
        setAttempts(prev => [...prev, { engine: 'Whisper (fallback)', error: `HTTP ${res.status}`, transcript: null }])
      } else {
        const data = await res.json()
        const transcript = data.transcript ?? ''
        addLog(`Whisper transcript: "${transcript}"`, transcript ? 'success' : 'warn')
        if (data.confidence != null) addLog(`Whisper confidence: ${(data.confidence * 100).toFixed(1)}%`)
        const details = matchDetails(transcript || '', target, 0.65)
        addLog(`Match check (threshold 0.65): ${details.pass ? '✓ PASS' : '✗ FAIL'}`, details.pass ? 'success' : 'error')
        setAttempts(prev => [...prev, { engine: 'Whisper (fallback)', transcript, details, elapsed }])
      }
    } catch (err) {
      addLog(`Whisper threw: ${err.message}`, 'error')
    }
  }

  function useNativeSpeech() {
    addLog('Starting native Web Speech API (bg-BG)...', 'step')
    setPhase('speaking')
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = 'bg-BG'
    rec.maxAlternatives = 3
    rec.interimResults = false
    rec.onresult = (e) => {
      const results = Array.from(e.results[0]).map(r => r.transcript)
      addLog(`Web Speech alternatives: ${results.map(r => `"${r}"`).join(', ')}`, 'success')
      results.forEach((t, i) => {
        const details = matchDetails(t, target, threshold)
        addLog(`Alt ${i+1} match: ${details.pass ? '✓ PASS' : '✗ FAIL'} (charSim ${(details.charSim*100).toFixed(1)}%)`, details.pass ? 'success' : 'warn')
      })
      setAttempts(prev => [...prev, { engine: 'Browser bg-BG', transcript: results[0], alternatives: results, details: matchDetails(results[0], target, threshold) }])
    }
    rec.onend = () => { addLog('Web Speech ended'); setPhase('idle') }
    rec.onerror = (e) => {
      addLog(`Web Speech error: ${e.error} — ${e.message || '(no message)'}`, 'error')
      setPhase('idle')
    }
    try { rec.start() } catch (err) { addLog(`rec.start() threw: ${err}`, 'error'); setPhase('idle') }
  }

  function handleRecord() {
    if (sttMode === 'native') useNativeSpeech()
    else if (sttMode === 'speechmatics') recordAndSend('/api/stt-speechmatics', 'Speechmatics', threshold)
    else recordAndSend('/api/stt', 'Whisper', 0.65)
  }

  const logColors = { info: '#aaa', step: '#7bc', decision: '#fb0', success: '#4c4', error: '#f55', warn: '#fa0' }
  const modeLabel = sttMode === 'native' ? 'Browser (bg-BG)' : sttMode === 'speechmatics' ? 'Speechmatics' : sttMode === 'whisper' ? 'Whisper (fallback)' : 'detecting...'

  return (
    <div style={{ fontFamily: 'monospace', padding: '1rem', maxWidth: 700, margin: '0 auto', fontSize: 13 }}>
      <h2 style={{ fontFamily: 'sans-serif' }}>STT Debug Page</h2>

      <div style={{ marginBottom: '1rem', padding: '0.5rem', background: '#111', borderRadius: 6 }}>
        <strong>Active engine:</strong> <span style={{ color: '#7bc' }}>{modeLabel}</span>
        {probeResult && <span style={{ color: '#888', marginLeft: 12 }}>({probeResult.reason})</span>}
      </div>

      <div style={{ marginBottom: '0.5rem' }}>
        <label>Target sentence: </label>
        <input
          value={target}
          onChange={e => setTarget(e.target.value)}
          style={{ width: '60%', padding: '0.25rem', marginLeft: 8, background: '#222', color: '#fff', border: '1px solid #444', borderRadius: 4 }}
        />
        <button onClick={() => speakBulgarian(target)} style={{ marginLeft: 8, padding: '0.25rem 0.5rem' }}>🔊 TTS</button>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>Match threshold: </label>
        <input type="number" min="0" max="1" step="0.05" value={threshold} onChange={e => setThreshold(parseFloat(e.target.value))}
          style={{ width: 60, marginLeft: 8, background: '#222', color: '#fff', border: '1px solid #444', padding: '0.25rem', borderRadius: 4 }} />
        <button
          onClick={handleRecord}
          disabled={phase !== 'idle'}
          style={{ marginLeft: 16, padding: '0.4rem 1rem', background: phase !== 'idle' ? '#444' : '#2a6', color: '#fff', border: 'none', borderRadius: 4, cursor: phase !== 'idle' ? 'default' : 'pointer' }}
        >
          {phase === 'waiting' ? '⏳ Waiting for speech...' : phase === 'speaking' ? '🔴 Recording...' : phase === 'processing' ? '⚙️ Processing...' : '🎤 Record'}
        </button>
        <button onClick={() => { addLog('--- manual: force Whisper ---', 'decision'); setSttMode('whisper') }} style={{ marginLeft: 8, padding: '0.4rem 0.5rem', fontSize: 11 }}>Force Whisper</button>
        <button onClick={() => { addLog('--- manual: force Speechmatics ---', 'decision'); setSttMode('speechmatics') }} style={{ marginLeft: 4, padding: '0.4rem 0.5rem', fontSize: 11 }}>Force Speechmatics</button>
        <button onClick={() => { addLog('--- manual: force Native ---', 'decision'); setSttMode('native') }} style={{ marginLeft: 4, padding: '0.4rem 0.5rem', fontSize: 11 }}>Force Native</button>
      </div>

      {attempts.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <strong>Attempts this session:</strong>
          {attempts.map((a, i) => (
            <div key={i} style={{ background: '#111', borderRadius: 4, padding: '0.5rem', marginTop: 4, borderLeft: `3px solid ${a.details?.pass ? '#4c4' : '#f55'}` }}>
              <span style={{ color: '#7bc' }}>{a.engine}</span>
              {a.elapsed && <span style={{ color: '#888', marginLeft: 8 }}>{a.elapsed}ms</span>}
              {a.error && <span style={{ color: '#f55', marginLeft: 8 }}>ERROR: {a.error}</span>}
              {a.transcript != null && <div style={{ color: '#fff', marginTop: 2 }}>Transcript: &ldquo;{a.transcript}&rdquo;</div>}
              {a.alternatives?.length > 1 && <div style={{ color: '#888', fontSize: 11 }}>Alternatives: {a.alternatives.slice(1).map(t => `"${t}"`).join(', ')}</div>}
              {a.details && <div style={{ color: a.details.pass ? '#4c4' : '#f55', fontSize: 11 }}>
                {a.details.pass ? '✓ PASS' : '✗ FAIL'} — charSim {(a.details.charSim * 100).toFixed(1)}% | words: {a.details.wordResults.map(w => `${w.word}:${(w.sim*100).toFixed(0)}%`).join(', ')}
              </div>}
            </div>
          ))}
          <button onClick={() => setAttempts([])} style={{ marginTop: 4, fontSize: 11, padding: '0.2rem 0.5rem' }}>Clear attempts</button>
        </div>
      )}

      <div style={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: 6, padding: '0.5rem', height: 320, overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <strong style={{ color: '#888' }}>Log</strong>
          <button onClick={() => setLog([])} style={{ fontSize: 10, padding: '0.1rem 0.4rem' }}>Clear</button>
        </div>
        {log.map((entry, i) => (
          <div key={i} style={{ color: logColors[entry.type] || '#aaa', lineHeight: 1.5 }}>
            <span style={{ color: '#555', marginRight: 8 }}>{entry.time}</span>{entry.msg}
          </div>
        ))}
        {log.length === 0 && <div style={{ color: '#444' }}>No log entries yet.</div>}
      </div>
    </div>
  )
}
