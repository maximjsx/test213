'use client'
import { useEffect, useRef, useState } from 'react'
import { useRecorder } from '../../hooks/useRecorder'
import { trimSilence } from '../../lib/wav'
import { playUrl } from '../../lib/voiceStudio'
import { speakBulgarian, unlockAudio } from '../../lib/audio'
import { TYPE_LABELS } from '../../lib/voicePhrases'
import styles from './Voice.module.css'

const HOLD_MS = 350
const KIND_LABELS = { letter: 'Letter sound', word: 'Word', sentence: 'Sentence' }

function isTyping(e) {
  const tag = e.target?.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable
}

function UsesList({ uses }) {
  const groups = new Map()
  for (const u of uses) {
    const name = `${u.level} · ${u.lesson}`
    if (!groups.has(name)) groups.set(name, new Set())
    groups.get(name).add(TYPE_LABELS[u.type] || u.type)
  }
  const rows = [...groups.entries()]
  return (
    <div className={styles.uses}>
      <div className={styles.usesTitle}>Used {uses.length} {uses.length === 1 ? 'time' : 'times'}</div>
      {rows.slice(0, 4).map(([name, types]) => (
        <div key={name} className={styles.useRow}>
          <span className={styles.useLesson}>{name}</span>
          <span className={styles.useTypes}>{[...types].join(', ')}</span>
        </div>
      ))}
      {rows.length > 4 && <div className={styles.useMore}>and {rows.length - 4} more lessons</div>}
    </div>
  )
}

function CurrentClip({ phrase, approved, mine, canReview, onRemove }) {
  if (approved) {
    return (
      <div className={styles.current}>
        <span className={styles.currentText}>Recorded by <b>{approved.byName}</b></span>
        <button className={styles.smallBtn} onClick={() => playUrl(approved.url)}>Play</button>
        {canReview && <button className={`${styles.smallBtn} ${styles.dangerBtn}`} onClick={() => onRemove(approved)}>Delete</button>}
      </div>
    )
  }
  if (mine) {
    return (
      <div className={styles.current}>
        <span className={styles.currentText}>Your take is waiting for review</span>
        <button className={styles.smallBtn} onClick={() => playUrl(mine.url)}>Play</button>
        <button className={`${styles.smallBtn} ${styles.dangerBtn}`} onClick={() => onRemove(mine)}>Withdraw</button>
      </div>
    )
  }
  return (
    <div className={styles.current}>
      <span className={styles.currentText}>No recording yet</span>
      <button className={styles.smallBtn} onClick={() => { unlockAudio(); speakBulgarian(phrase.text) }}>Hear TTS</button>
    </div>
  )
}

export default function RecordCard({ phrase, approved, mine, saveError, canReview, onSave, onMove, onRemove }) {
  const meterRef = useRef(null)
  const { recording, start, stop } = useRecorder(meterRef)
  const [take, setTake] = useState(null)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const activeRef = useRef(false)
  const pressedAtRef = useRef(0)
  const fileRef = useRef(null)
  const actionsRef = useRef(null)

  useEffect(() => {
    if (activeRef.current) cancelTake()
    setTake(null)
    setError('')
  }, [phrase.key]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { if (take) URL.revokeObjectURL(take.url) }, [take])

  async function acceptTake(blob) {
    let result = { blob, duration: null }
    try { result = await trimSilence(blob) } catch {}
    if (result.duration !== null && result.duration < 0.2) {
      setError("Didn't catch that, try again")
      return
    }
    const url = URL.createObjectURL(result.blob)
    setTake({ ...result, url })
    setError('')
    playUrl(url)
  }

  async function beginTake() {
    activeRef.current = true
    setError('')
    setTake(null)
    playUrl(null)
    try {
      await start()
    } catch {
      activeRef.current = false
      setError('Microphone blocked. Allow it in the browser and try again.')
    }
  }

  async function finishTake() {
    activeRef.current = false
    const blob = await stop()
    if (blob) acceptTake(blob)
  }

  async function cancelTake() {
    activeRef.current = false
    await stop()
    setTake(null)
  }

  function toggle() {
    if (activeRef.current) finishTake()
    else beginTake()
  }

  function save() {
    if (take && !activeRef.current) onSave(take.blob)
  }

  function playBest() {
    playUrl(take?.url || approved?.url || mine?.url)
  }

  function onFile(file) {
    if (!file || !file.type.startsWith('audio/')) {
      setError('That is not an audio file')
      return
    }
    acceptTake(file)
  }

  actionsRef.current = { toggle, beginTake, finishTake, cancelTake, save, playBest, onMove }

  useEffect(() => {
    function onKeyDown(e) {
      if (isTyping(e) || e.metaKey || e.ctrlKey || e.altKey) return
      const a = actionsRef.current
      const handlers = {
        Space: () => {
          if (e.repeat) return
          pressedAtRef.current = Date.now()
          a.toggle()
        },
        Enter: a.save,
        KeyR: a.beginTake,
        Backspace: a.beginTake,
        KeyP: a.playBest,
        Escape: a.cancelTake,
        ArrowRight: () => a.onMove(1),
        ArrowLeft: () => a.onMove(-1),
      }
      const handler = handlers[e.code]
      if (!handler) return
      e.preventDefault()
      handler()
    }
    // Holding Space records while held; a quick tap toggles instead.
    function onKeyUp(e) {
      if (e.code !== 'Space' || isTyping(e)) return
      e.preventDefault()
      if (activeRef.current && Date.now() - pressedAtRef.current > HOLD_MS) actionsRef.current.finishTake()
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  const isLetter = phrase.kind === 'letter'
  const sound = phrase.key !== phrase.text.toLowerCase() ? ` "${phrase.key}"` : ''
  const statusText = recording
    ? 'Recording. Release Space or tap to stop.'
    : take ? `Take ready, ${take.duration ? take.duration.toFixed(1) + 's' : 'uploaded file'}` : 'Hold Space and speak'

  return (
    <div
      className={`${styles.card} ${dragging ? styles.cardDrop : ''}`}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); onFile(e.dataTransfer.files?.[0]) }}
    >
      <div className={styles.cardTop}>
        <span className={styles.kindPill}>{KIND_LABELS[phrase.kind]}</span>
      </div>

      <div className={styles.phraseText} lang="bg">{phrase.text}</div>
      {isLetter && <p className={styles.letterHint}>Say the sound{sound}, not the letter name.</p>}

      <CurrentClip phrase={phrase} approved={approved} mine={mine} canReview={canReview} onRemove={onRemove} />

      <div className={styles.recorder}>
        <button
          ref={meterRef}
          className={`${styles.micBtn} ${recording ? styles.micBtnOn : ''}`}
          onClick={toggle}
          aria-label={recording ? 'Stop recording' : 'Start recording'}
        >
          <img src="/icons/microphone.png" alt="" width={40} height={40} />
        </button>
        <div className={styles.recStatus}>{statusText}</div>
        {take && !recording && (
          <div className={styles.takeActions}>
            <button className={styles.smallBtn} onClick={() => playUrl(take.url)}>Play</button>
            <button className={styles.smallBtn} onClick={beginTake}>Redo</button>
            <button className={styles.saveBtn} onClick={save}>Save and next</button>
          </div>
        )}
        {(error || saveError) && <div className={styles.error}>{error || `Last upload failed (${saveError}). Record it again.`}</div>}
      </div>

      <div className={styles.cardNav}>
        <button className={styles.navBtn} onClick={() => onMove(-1)}>Previous</button>
        <button className={styles.navBtn} onClick={() => fileRef.current?.click()}>Upload file</button>
        <button className={styles.navBtn} onClick={() => onMove(1)}>Skip</button>
        <input ref={fileRef} type="file" accept="audio/*" hidden onChange={e => { onFile(e.target.files?.[0]); e.target.value = '' }} />
      </div>

      <UsesList uses={phrase.uses} />

      <div className={styles.keys}>
        <span><kbd>Space</kbd> hold to record</span>
        <span><kbd>Enter</kbd> save and next</span>
        <span><kbd>R</kbd> redo</span>
        <span><kbd>P</kbd> play</span>
        <span><kbd>Left</kbd> <kbd>Right</kbd> move</span>
      </div>
    </div>
  )
}
