'use client'
import { useEffect, useRef, useState } from 'react'

// Keeps the microphone open between takes so recording starts instantly.
// `meterRef` gets a --level CSS variable (0..1) while recording.
export function useRecorder(meterRef) {
  const [recording, setRecording] = useState(false)
  const streamRef = useRef(null)
  const analyserRef = useRef(null)
  const ctxRef = useRef(null)
  const recRef = useRef(null)
  const chunksRef = useRef([])
  const startingRef = useRef(null)
  const frameRef = useRef(0)

  useEffect(() => () => {
    cancelAnimationFrame(frameRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    ctxRef.current?.close().catch(() => {})
  }, [])

  async function openStream() {
    if (streamRef.current?.active) return streamRef.current
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    })
    const Ctx = window.AudioContext || window.webkitAudioContext
    const ctx = new Ctx()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 512
    ctx.createMediaStreamSource(stream).connect(analyser)
    streamRef.current = stream
    ctxRef.current = ctx
    analyserRef.current = analyser
    return stream
  }

  function meter() {
    const analyser = analyserRef.current
    const el = meterRef?.current
    if (!analyser || !el) return
    const data = new Float32Array(analyser.fftSize)
    analyser.getFloatTimeDomainData(data)
    const rms = Math.sqrt(data.reduce((sum, v) => sum + v * v, 0) / data.length)
    el.style.setProperty('--level', Math.min(1, rms * 6).toFixed(3))
    frameRef.current = requestAnimationFrame(meter)
  }

  async function begin() {
    const stream = await openStream()
    ctxRef.current.resume?.()
    const mimeType = ['audio/webm', 'audio/mp4'].find(t => MediaRecorder.isTypeSupported(t))
    const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    chunksRef.current = []
    rec.ondataavailable = e => { if (e.data.size) chunksRef.current.push(e.data) }
    rec.start()
    recRef.current = rec
    setRecording(true)
    meter()
  }

  function start() {
    if (recRef.current || startingRef.current) return startingRef.current
    startingRef.current = begin().finally(() => { startingRef.current = null })
    return startingRef.current
  }

  // Resolves with the recorded Blob, or null when nothing was recording.
  async function stop() {
    await startingRef.current?.catch(() => {})
    const rec = recRef.current
    if (!rec) return null
    recRef.current = null
    cancelAnimationFrame(frameRef.current)
    meterRef?.current?.style.setProperty('--level', '0')
    setRecording(false)
    return new Promise(resolve => {
      rec.onstop = () => resolve(new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' }))
      rec.stop()
    })
  }

  return { recording, start, stop }
}
