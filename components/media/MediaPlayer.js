'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useYouTubePlayer } from '../../hooks/useYouTubePlayer'
import { lookupEnglish } from '../../lib/lookup'
import { speakBulgarian, unlockAudio } from '../../lib/audio'
import AddToDeckButton from '../decks/AddToDeckButton'
import Modal from '../ui/Modal'
import Dictation from './Dictation'
import styles from './MediaPlayer.module.css'

const SPEEDS = [0.5, 0.75, 1]
const clean = word => word.toLowerCase().replace(/[.,!?;:"«»„“()\-–]/g, '')

function lineAt(lines, time) {
  let found = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].start <= time) found = i
    else break
  }
  return found
}

function WordSheet({ word, meaning, source, onClose }) {
  return (
    <Modal title={word} onClose={onClose} size="sm">
      <div className={styles.sheet}>
        <button className={styles.sheetSpeak} onClick={() => { unlockAudio(); speakBulgarian(word) }} aria-label={`Listen to ${word}`}>
          <img src="/icons/speaker.png" alt="" width={22} height={22} />
        </button>
        <p className={styles.sheetMeaning}>{meaning || 'No meaning saved for this word yet. You can type one when adding it.'}</p>
        <AddToDeckButton word={{ bg: word, en: meaning, source }} />
      </div>
    </Modal>
  )
}

function Words({ text, onWord }) {
  return (
    <span lang="bg">
      {text.split(/(\s+)/).map((token, i) => /^\s+$/.test(token) || !clean(token)
        ? token
        : <button key={i} className={styles.word} onClick={() => onWord(token.replace(/[.,!?;:"«»„“()]/g, ''))}>{token}</button>)}
    </span>
  )
}

function ToggleButton({ on, onClick, children, label }) {
  return (
    <button className={`${styles.control} ${on ? styles.controlOn : ''}`} onClick={onClick} aria-pressed={on} aria-label={label}>
      {children}
    </button>
  )
}

export default function MediaPlayer({ media, track }) {
  const { mountRef, ready, playing, time, seek, play, pause, setRate } = useYouTubePlayer(media.youtubeId)
  const [speed, setSpeed] = useState(1)
  const [looping, setLooping] = useState(false)
  const [showBg, setShowBg] = useState(true)
  const [showEn, setShowEn] = useState(true)
  const [word, setWord] = useState(null)
  const [dictating, setDictating] = useState(false)
  const [dictIndex, setDictIndex] = useState(0)
  const listRef = useRef(null)
  const { lines, words } = track

  const current = lineAt(lines, time)
  const line = lines[current]

  // Loop the current line: jump back to its start once it ends
  const loopLine = useRef(null)
  useEffect(() => { loopLine.current = looping ? line : null }, [looping]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const l = loopLine.current
    if (l && time >= l.end) seek(l.start)
  }, [time, seek])

  // Dictation plays one line and stops at its end
  const stopAt = useRef(null)
  useEffect(() => {
    if (stopAt.current !== null && time >= stopAt.current) {
      stopAt.current = null
      pause()
    }
  }, [time, pause])
  const playLine = i => {
    stopAt.current = lines[i].end
    seek(lines[i].start)
  }

  function toggleDictation() {
    if (dictating) {
      stopAt.current = null
      setDictating(false)
      return
    }
    pause()
    setLooping(false)
    setDictIndex(Math.max(0, current))
    setDictating(true)
  }

  // Jumping to a line while looping moves the loop to that line
  const goTo = i => {
    if (i < 0 || i >= lines.length) return
    if (looping) loopLine.current = lines[i]
    seek(lines[i].start)
  }

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-line="${current}"]`)
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [current])

  useEffect(() => {
    function onKey(e) {
      if (e.target.closest?.('input, textarea, [aria-modal]')) return
      if (e.key === 'ArrowLeft') goTo(current - 1)
      if (e.key === 'ArrowRight') goTo(current + 1)
      if (e.key === ' ') { e.preventDefault(); playing ? pause() : play() }
      if (e.key.toLowerCase() === 'l') setLooping(v => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }) // re-bound every render so goTo sees the current loop state

  const meaning = useMemo(() => word && (words[clean(word)] || lookupEnglish(word)), [word, words])
  const openWord = w => { pause(); setWord(w) }

  return (
    <div className={styles.player}>
      {word && <WordSheet word={word} meaning={meaning} source={{ kind: 'media', ref: media.id }} onClose={() => setWord(null)} />}

      <div className={styles.stage}>
        <div className={styles.video}>
          <div ref={mountRef} />
        </div>

        <div className={styles.now} aria-live="polite">
          {dictating ? (
            <Dictation lines={lines} index={dictIndex} onIndex={setDictIndex} onPlayLine={playLine} />
          ) : line ? (
            <>
              {showBg && <p className={styles.nowBg}><Words text={line.bg} onWord={openWord} /></p>}
              {showEn && line.en && <p className={styles.nowEn}>{line.en}</p>}
            </>
          ) : (
            <p className={styles.nowHint}>{ready ? 'Press play. Tap any Bulgarian word for its meaning.' : 'Loading the video...'}</p>
          )}
        </div>

        <div className={styles.controls}>
          <button className={styles.control} onClick={() => goTo(current - 1)} aria-label="Previous line" disabled={current <= 0}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h2v14H6zM20 5v14L9 12z" /></svg>
          </button>
          <button className={`${styles.control} ${styles.playBtn}`} onClick={() => (playing ? pause() : play())} aria-label={playing ? 'Pause' : 'Play'} disabled={!ready}>
            {playing
              ? <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
              : <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4v16l13-8z" /></svg>}
          </button>
          <button className={styles.control} onClick={() => goTo(current + 1)} aria-label="Next line" disabled={current >= lines.length - 1}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16 5h2v14h-2zM4 5v14l11-7z" /></svg>
          </button>
          <ToggleButton on={looping} onClick={() => setLooping(v => !v)} label="Loop this line">Loop</ToggleButton>
          <ToggleButton on={dictating} onClick={toggleDictation} label="Dictation: type each line you hear">Dictation</ToggleButton>
          <div className={styles.speeds} role="group" aria-label="Playback speed">
            {SPEEDS.map(s => (
              <ToggleButton key={s} on={speed === s} onClick={() => { setSpeed(s); setRate(s) }} label={`Speed ${s}x`}>{s}x</ToggleButton>
            ))}
          </div>
          <div className={styles.speeds} role="group" aria-label="Subtitles">
            <ToggleButton on={showBg} onClick={() => setShowBg(v => !v)} label="Bulgarian subtitles">BG</ToggleButton>
            <ToggleButton on={showEn} onClick={() => setShowEn(v => !v)} label="English subtitles">EN</ToggleButton>
          </div>
        </div>
      </div>

      {!dictating && (
        <ol className={styles.transcript} ref={listRef} aria-label="Transcript">
          {lines.map((l, i) => (
            <li key={i} data-line={i} className={`${styles.line} ${i === current ? styles.lineOn : ''}`}>
              <button className={styles.lineTime} onClick={() => goTo(i)} aria-label={`Play from line ${i + 1}`}>
                {Math.floor(l.start / 60)}:{String(Math.floor(l.start % 60)).padStart(2, '0')}
              </button>
              <div className={styles.lineText}>
                {showBg && <p className={styles.lineBg}><Words text={l.bg} onWord={openWord} /></p>}
                {showEn && l.en && <p className={styles.lineEn}>{l.en}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
      <p className={styles.keys}>Space play or pause, arrows previous or next line, L loop</p>
    </div>
  )
}
