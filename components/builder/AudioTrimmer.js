'use client'
import { useEffect, useRef, useState } from 'react'
import styles from './MediaControls.module.css'

// Encode an AudioBuffer (a trimmed region) to a 16-bit PCM WAV Blob.
// storage-api will transcode it to Opus on upload (if ffmpeg is present).
function audioBufferToWav(buffer) {
  const numCh = buffer.numberOfChannels
  const sr = buffer.sampleRate
  const chans = []
  for (let c = 0; c < numCh; c++) chans.push(buffer.getChannelData(c))
  const frames = buffer.length
  const dataSize = frames * numCh * 2
  const ab = new ArrayBuffer(44 + dataSize)
  const v = new DataView(ab)
  const wr = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)) }
  wr(0, 'RIFF'); v.setUint32(4, 36 + dataSize, true); wr(8, 'WAVE')
  wr(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, numCh, true)
  v.setUint32(24, sr, true); v.setUint32(28, sr * numCh * 2, true)
  v.setUint16(32, numCh * 2, true); v.setUint16(34, 16, true)
  wr(36, 'data'); v.setUint32(40, dataSize, true)
  let off = 44
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < numCh; c++) {
      let s = Math.max(-1, Math.min(1, chans[c][i]))
      v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true)
      off += 2
    }
  }
  return new Blob([ab], { type: 'audio/wav' })
}

// Find first/last samples above a silence threshold (mono mix), with small padding.
function detectSilenceBounds(buffer, threshold = 0.015, padSec = 0.08) {
  const data = buffer.getChannelData(0)
  const n = data.length
  let start = 0, end = n - 1
  while (start < n && Math.abs(data[start]) < threshold) start++
  while (end > start && Math.abs(data[end]) < threshold) end--
  if (start >= end) return { start: 0, end: 1 } // all silence → keep whole
  const pad = Math.floor(padSec * buffer.sampleRate)
  start = Math.max(0, start - pad)
  end = Math.min(n - 1, end + pad)
  return { start: start / n, end: end / n }
}

// Inline editor shown right after recording. Lets the user trim silence / tighten
// the clip before it's uploaded. `blob` is the raw recording; onConfirm receives a
// trimmed WAV blob; onCancel discards it.
export default function AudioTrimmer({ blob, onConfirm, onCancel }) {
  const [buffer, setBuffer] = useState(null)
  const [range, setRange] = useState({ start: 0, end: 1 })
  const [err, setErr] = useState('')
  const canvasRef = useRef(null)
  const ctxRef = useRef(null)
  const srcRef = useRef(null)
  const dragRef = useRef(null)
  const wrapRef = useRef(null)

  // Decode the recording once
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const arr = await blob.arrayBuffer()
        const Ctx = window.AudioContext || window.webkitAudioContext
        const ctx = new Ctx()
        ctxRef.current = ctx
        const buf = await ctx.decodeAudioData(arr)
        if (!alive) return
        setBuffer(buf)
        setRange(detectSilenceBounds(buf))
      } catch (e) {
        if (alive) setErr('Could not read the recording. You can still upload it untrimmed.')
      }
    })()
    return () => { alive = false; try { srcRef.current?.stop() } catch {} ; ctxRef.current?.close?.().catch(() => {}) }
  }, [blob])

  // Draw waveform whenever buffer is ready
  useEffect(() => {
    if (!buffer || !canvasRef.current) return
    const cv = canvasRef.current
    const dpr = window.devicePixelRatio || 1
    const w = cv.clientWidth, h = cv.clientHeight
    cv.width = w * dpr; cv.height = h * dpr
    const g = cv.getContext('2d')
    g.scale(dpr, dpr)
    g.clearRect(0, 0, w, h)
    const data = buffer.getChannelData(0)
    const step = Math.max(1, Math.floor(data.length / w))
    g.fillStyle = '#9ccdfa'
    for (let x = 0; x < w; x++) {
      let min = 1, max = -1
      for (let i = 0; i < step; i++) {
        const s = data[x * step + i] || 0
        if (s < min) min = s
        if (s > max) max = s
      }
      const y1 = (1 + min) * 0.5 * h
      const y2 = (1 + max) * 0.5 * h
      g.fillRect(x, y1, 1, Math.max(1, y2 - y1))
    }
  }, [buffer])

  function onPointerDown(which, e) {
    e.preventDefault()
    dragRef.current = which
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }
  function onPointerMove(e) {
    if (!dragRef.current || !wrapRef.current) return
    const rect = wrapRef.current.getBoundingClientRect()
    let f = (e.clientX - rect.left) / rect.width
    f = Math.max(0, Math.min(1, f))
    setRange(r => {
      if (dragRef.current === 'start') return { ...r, start: Math.min(f, r.end - 0.02) }
      return { ...r, end: Math.max(f, r.start + 0.02) }
    })
  }
  function onPointerUp() {
    dragRef.current = null
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
  }

  function stopPlay() { try { srcRef.current?.stop() } catch {} srcRef.current = null }

  function playRegion() {
    if (!buffer || !ctxRef.current) return
    stopPlay()
    const ctx = ctxRef.current
    if (ctx.state === 'suspended') ctx.resume()
    const src = ctx.createBufferSource()
    src.buffer = buffer
    src.connect(ctx.destination)
    const startSec = range.start * buffer.duration
    const dur = (range.end - range.start) * buffer.duration
    src.start(0, startSec, dur)
    srcRef.current = src
  }

  function sliceBuffer() {
    const startF = Math.floor(range.start * buffer.length)
    const endF = Math.floor(range.end * buffer.length)
    const len = Math.max(1, endF - startF)
    const Ctx = window.OfflineAudioContext || window.webkitOfflineAudioContext
    const oac = new Ctx(buffer.numberOfChannels, len, buffer.sampleRate)
    const nb = oac.createBuffer(buffer.numberOfChannels, len, buffer.sampleRate)
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      nb.copyToChannel(buffer.getChannelData(c).slice(startF, endF), c)
    }
    return nb
  }

  function confirm() {
    if (!buffer) { onConfirm(blob); return } // decode failed → upload raw
    try {
      const trimmed = sliceBuffer()
      onConfirm(audioBufferToWav(trimmed))
    } catch {
      onConfirm(blob)
    }
  }

  const startPct = range.start * 100
  const endPct = range.end * 100
  const dur = buffer?.duration || 0

  return (
    <div className={styles.trimmer}>
      <div className={styles.trimTitle}>Trim your recording</div>
      {err && <div className={styles.error}>{err}</div>}
      <div className={styles.wavewrap} ref={wrapRef}>
        <canvas className={styles.wavecanvas} ref={canvasRef} />
        <div className={styles.trimMask} style={{ left: 0, width: `${startPct}%` }} />
        <div className={styles.trimMask} style={{ right: 0, width: `${100 - endPct}%` }} />
        <div className={styles.trimRegion} style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }} />
        <div className={styles.trimHandle} style={{ left: `calc(${startPct}% - 6px)` }} onPointerDown={e => onPointerDown('start', e)} />
        <div className={styles.trimHandle} style={{ left: `calc(${endPct}% - 6px)` }} onPointerDown={e => onPointerDown('end', e)} />
      </div>
      <div className={styles.trimTimes}>
        <span>{(range.start * dur).toFixed(2)}s</span>
        <span>selection {((range.end - range.start) * dur).toFixed(2)}s</span>
        <span>{(range.end * dur).toFixed(2)}s</span>
      </div>
      <div className={styles.trimBtns}>
        <button type="button" className={styles.btn} onClick={playRegion} disabled={!buffer}>
          <img src="/icons/speaker.png" alt="" className={styles.icon} /> Preview
        </button>
        <button type="button" className={styles.btn} onClick={() => buffer && setRange(detectSilenceBounds(buffer))} disabled={!buffer}>
          Auto-trim silence
        </button>
        <button type="button" className={styles.btn} onClick={() => buffer && setRange({ start: 0, end: 1 })} disabled={!buffer}>
          Reset
        </button>
        <button type="button" className={`${styles.btn} ${styles.btnRec}`} onClick={confirm}>Use clip</button>
        <button type="button" className={`${styles.btn} ${styles.btnDanger}`} onClick={onCancel}>Discard</button>
      </div>
    </div>
  )
}
