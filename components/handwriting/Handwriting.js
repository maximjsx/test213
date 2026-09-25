'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Marck_Script } from 'next/font/google'
import { LETTERS } from '../../lib/words'
import { PEN, drawGlyph, drawStrokes, scoreLetter } from '../../lib/handwriting'
import { speakBulgarian, unlockAudio } from '../../lib/audio'
import Button from '../ui/Button'
import Segmented from '../typing/Segmented'
import styles from './Handwriting.module.css'

// Upright cursive in the style taught in Bulgarian schools
const cursive = Marck_Script({ weight: '400', subsets: ['cyrillic'], display: 'swap' })

const ALPHABET = [...'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЬЮЯ']
const STYLES = [{ id: 'print', label: 'Print' }, { id: 'cursive', label: 'Handwritten' }]
const CASES = [{ id: 'lower', label: 'аб' }, { id: 'upper', label: 'АБ' }]
const MODES = [{ id: 'trace', label: 'Trace' }, { id: 'memory', label: 'From memory' }]
const PASS = 65
const BEST_KEY = 'handwritingBest'

// Canvas cannot use CSS variables, so the theme tokens are read when painting
const token = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

function readBest() {
  try { return JSON.parse(localStorage.getItem(BEST_KEY)) || {} } catch { return {} }
}
function saveBest(best) {
  try { localStorage.setItem(BEST_KEY, JSON.stringify(best)) } catch {}
}

function verdict(score) {
  if (score >= 80) return 'Great, that looks right.'
  if (score >= PASS) return 'Good. Try to follow the shape a little closer.'
  return 'Not quite. Look at the letter and try again.'
}

export default function Handwriting() {
  const [letterIndex, setLetterIndex] = useState(0)
  const [style, setStyle] = useState('print')
  const [letterCase, setLetterCase] = useState('lower')
  const [mode, setMode] = useState('trace')
  const [strokes, setStrokes] = useState([])
  const [score, setScore] = useState(null)
  const [best, setBest] = useState({})
  const [family, setFamily] = useState(null)
  const canvasRef = useRef(null)
  const drawing = useRef(null)

  const upper = ALPHABET[letterIndex]
  const letter = letterCase === 'upper' ? upper : upper.toLowerCase()
  const info = LETTERS.find(l => l.letter === upper)
  const bestKey = `${style}:${letter}`

  useEffect(() => { setBest(readBest()) }, [])

  // The canvas needs the font's real family name and has to wait for it to load
  useEffect(() => {
    const name = style === 'cursive' ? cursive.style.fontFamily : getComputedStyle(document.body).fontFamily
    let alive = true
    document.fonts.load(`700 40px ${name}`, letter).then(() => alive && setFamily(name))
    return () => { alive = false }
  }, [style, letter])

  const reset = () => { setStrokes([]); setScore(null) }
  useEffect(reset, [letter, style, mode]) // eslint-disable-line react-hooks/exhaustive-deps

  const paint = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !family) return
    const size = canvas.clientWidth
    const dpr = window.devicePixelRatio || 1
    if (canvas.width !== Math.round(size * dpr)) {
      canvas.width = canvas.height = Math.round(size * dpr)
    }
    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, size, size)
    const muted = token('--text-muted')

    ctx.globalAlpha = 0.35
    ctx.strokeStyle = muted
    ctx.lineWidth = 1
    ctx.setLineDash([6, 6])
    for (const y of [0.74, 0.46, 0.2]) {
      ctx.beginPath(); ctx.moveTo(0, size * y); ctx.lineTo(size, size * y); ctx.stroke()
    }
    ctx.setLineDash([])

    if (mode === 'trace' || score !== null) {
      ctx.globalAlpha = score !== null ? 0.55 : 0.28
      drawGlyph(ctx, size, letter, family, { fill: score !== null ? token('--teal') : muted })
    }
    ctx.globalAlpha = 1
    drawStrokes(ctx, size, strokes, token('--text'), PEN * size)
  }, [family, letter, mode, score, strokes])

  useEffect(() => {
    paint()
    window.addEventListener('resize', paint)
    return () => window.removeEventListener('resize', paint)
  }, [paint])

  function point(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    return { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height }
  }

  function onDown(e) {
    if (score !== null) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drawing.current = [point(e)]
    setStrokes(s => [...s, drawing.current])
  }

  function onMove(e) {
    if (!drawing.current) return
    drawing.current.push(point(e))
    setStrokes(s => [...s.slice(0, -1), [...drawing.current]])
  }

  function onUp() { drawing.current = null }

  function check() {
    const result = scoreLetter(strokes, letter, family)
    setScore(result)
    if (result > (best[bestKey] || 0)) {
      const next = { ...best, [bestKey]: result }
      setBest(next)
      saveBest(next)
    }
  }

  const next = () => setLetterIndex(i => (i + 1) % ALPHABET.length)

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <Segmented label="Letter style" options={STYLES} value={style} onChange={setStyle} />
        <Segmented label="Letter case" options={CASES} value={letterCase} onChange={setLetterCase} />
        <Segmented label="Mode" options={MODES} value={mode} onChange={setMode} />
      </div>

      <div className={styles.layout}>
        <section className={styles.board}>
          <div className={styles.head}>
            <button className={styles.speak} onClick={() => { unlockAudio(); speakBulgarian(info?.tts || upper) }} aria-label={`Listen to ${upper}`}>
              <img src="/icons/speaker.png" alt="" width={20} height={20} />
            </button>
            <div className={styles.headText}>
              <span className={`${styles.target} ${style === 'cursive' ? cursive.className : ''}`} lang="bg">{upper}{upper.toLowerCase()}</span>
              {info?.hint && <span className={styles.sound}>{info.hint}</span>}
            </div>
          </div>

          <canvas
            ref={canvasRef}
            className={styles.canvas}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            aria-label={`Drawing area: write the letter ${letter}`}
          />

          {score !== null ? (
            <div className={styles.result} aria-live="polite">
              <span className={`${styles.score} ${score >= PASS ? styles.pass : styles.fail}`}>{score}%</span>
              <span className={styles.verdict}>{verdict(score)}</span>
            </div>
          ) : (
            <p className={styles.hint}>
              {mode === 'trace' ? 'Trace the grey letter with your finger or mouse.' : 'Write the letter from memory, then check it.'}
            </p>
          )}

          <div className={styles.actions}>
            <Button variant="secondary" onClick={reset} disabled={!strokes.length}>Clear</Button>
            {score === null
              ? <Button onClick={check} disabled={!strokes.length || !family}>Check</Button>
              : <Button onClick={next}>Next letter</Button>}
          </div>
        </section>

        <section className={styles.picker} aria-label="Letters">
          {ALPHABET.map((l, i) => {
            const shown = letterCase === 'upper' ? l : l.toLowerCase()
            const done = (best[`${style}:${shown}`] || 0) >= PASS
            return (
              <button
                key={l}
                className={`${styles.chip} ${i === letterIndex ? styles.chipOn : ''} ${done ? styles.chipDone : ''} ${style === 'cursive' ? cursive.className : ''}`}
                onClick={() => setLetterIndex(i)}
                aria-pressed={i === letterIndex}
                aria-label={`${l}${done ? ', done' : ''}`}
                lang="bg"
              >
                {shown}
              </button>
            )
          })}
        </section>
      </div>

      <section className={styles.note}>
        <h2 className={styles.noteTitle}>Handwritten letters look different</h2>
        <p className={styles.noteText}>
          Bulgarians write in cursive, and some letters change shape: <span className={cursive.className} lang="bg">д</span> looks
          like a g, <span className={cursive.className} lang="bg">т</span> like an m, <span className={cursive.className} lang="bg">и</span> like
          a u and <span className={cursive.className} lang="bg">п</span> like an n. Switch to Handwritten to practise them.
        </p>
      </section>
    </div>
  )
}
