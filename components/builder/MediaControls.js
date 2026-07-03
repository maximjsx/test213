'use client'
import { useRef, useState } from 'react'
import { uploadMedia, deleteMedia } from '../../lib/media'
import styles from './MediaControls.module.css'

// ── Audio: record or upload a custom clip. Falls back to TTS when empty. ──
// `audio` is { id, url } | null. onChange receives the new value (or null).
export function AudioField({ audio, onChange, hint = 'Record or upload a clip to override TTS. Leave empty to use text-to-speech.' }) {
  const [recording, setRecording] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const fileRef = useRef(null)

  async function storeBlob(blob, filename) {
    setBusy(true); setError('')
    const oldId = audio?.id
    try {
      const uploaded = await uploadMedia(blob, 'audio', filename)
      onChange(uploaded)
      if (oldId && oldId !== uploaded.id) deleteMedia(oldId)
    } catch (e) {
      setError(e.message || 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  async function startRec() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const rec = new MediaRecorder(stream, { mimeType: mime })
      chunksRef.current = []
      rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      rec.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || mime })
        const ext = (rec.mimeType || mime).includes('webm') ? 'webm' : 'mp4'
        storeBlob(blob, `clip.${ext}`)
      }
      recorderRef.current = rec
      rec.start()
      setRecording(true)
    } catch (e) {
      setError('Microphone unavailable')
    }
  }

  function stopRec() {
    try { recorderRef.current?.stop() } catch {}
    setRecording(false)
  }

  function onPickFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) storeBlob(file, file.name)
  }

  async function remove() {
    const id = audio?.id
    onChange(null)
    if (id) deleteMedia(id)
  }

  function preview() {
    if (audio?.url) { try { new Audio(audio.url).play().catch(() => {}) } catch {} }
  }

  return (
    <div className={styles.audioField}>
      <div className={styles.row}>
        <span className={`${styles.status} ${audio?.url ? styles.statusCustom : ''}`}>
          {busy ? 'Uploading…' : audio?.url ? 'Custom audio' : 'Using TTS'}
        </span>

        {audio?.url && !busy && (
          <button type="button" className={styles.btn} onClick={preview} title="Preview">
            <img src="/icons/speaker.png" alt="" className={styles.icon} /> Play
          </button>
        )}

        {!recording ? (
          <button type="button" className={`${styles.btn} ${styles.btnRec}`} onClick={startRec} disabled={busy}>
            <img src="/icons/microphone.png" alt="" className={styles.icon} />
            {audio?.url ? 'Re-record' : 'Record'}
          </button>
        ) : (
          <button type="button" className={`${styles.btn} ${styles.btnRecActive}`} onClick={stopRec}>
            Stop recording
          </button>
        )}

        <button type="button" className={styles.btn} onClick={() => fileRef.current?.click()} disabled={busy || recording}>
          Upload file
        </button>
        <input ref={fileRef} type="file" accept="audio/*" className={styles.hiddenInput} onChange={onPickFile} />

        {audio?.url && !busy && (
          <button type="button" className={`${styles.btn} ${styles.btnDanger}`} onClick={remove}>
            Remove
          </button>
        )}
      </div>
      {error && <div className={styles.error}>{error}</div>}
      {hint && <div className={styles.hint}>{hint}</div>}
    </div>
  )
}

// ── Image: upload a picture for image-based exercises. `image` is { id, url } | null ──
export function ImageField({ image, onChange, label = 'Image' }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  async function onPickFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true); setError('')
    const oldId = image?.id
    try {
      const uploaded = await uploadMedia(file, 'image', file.name)
      onChange(uploaded)
      if (oldId && oldId !== uploaded.id) deleteMedia(oldId)
    } catch (err) {
      setError(err.message || 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  function remove() {
    const id = image?.id
    onChange(null)
    if (id) deleteMedia(id)
  }

  return (
    <div className={styles.imageField}>
      <div className={styles.thumbRow}>
        {image?.url
          ? <img src={image.url} alt={label} className={styles.thumb} />
          : <div className={styles.thumbEmpty}>🖼️</div>}
        <div className={styles.row}>
          <button type="button" className={styles.btn} onClick={() => fileRef.current?.click()} disabled={busy}>
            {busy ? 'Uploading…' : image?.url ? 'Replace' : 'Upload image'}
          </button>
          {image?.url && !busy && (
            <button type="button" className={`${styles.btn} ${styles.btnDanger}`} onClick={remove}>
              Remove
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className={styles.hiddenInput} onChange={onPickFile} />
        </div>
      </div>
      {error && <div className={styles.error}>{error}</div>}
    </div>
  )
}
