'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Marck_Script } from 'next/font/google'
import localFont from 'next/font/local'
import { LETTERS, WORDS } from '../../lib/words'
import { PEN, layoutText, drawGuides, drawText, drawStrokes, scoreWriting } from '../../lib/handwriting'
import { speakBulgarian, unlockAudio } from '../../lib/audio'
import SENTENCES from '../../data/handwriting-sentences.json'
import Button from '../ui/Button'
import Segmented from '../typing/Segmented'
import styles from './Handwriting.module.css'

// Upright cursive in the style taught in Bulgarian schools
const cursive = Marck_Script({ weight: '400', subsets: ['cyrillic'], display: 'swap' })

// Typeset а has two storeys, but people write the single-storey one, so Print
// takes just that letter from Andika (SIL Open Font License, subset to U+0430)
const handA = localFont({
  src: './fonts/andika-a.woff2',
  weight: '700',
  variable: '--font-hand-a',
  adjustFontFallback: false,
  declarations: [{ prop: 'unicode-range', value: 'U+0430' }],
})

const ALPHABET = [...'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЬЮЯ']
const KINDS = [{ id: 'letters', label: 'Letters' }, { id: 'words', label: 'Words' }, { id: 'sentences', label: 'Sentences' }]
const STYLES = [{ id: 'cursive', label: 'Handwritten' }, { id: 'print', label: 'Print' }]
const CASES = [{ id: 'lower', label: 'аб' }, { id: 'upper', label: 'АБ' }]
const MODES = [{ id: 'trace', label: 'Trace' }, { id: 'memory', label: 'From memory' }]
const PASS = 65
const BEST_KEY = 'handwritingBest'

// Short enough to write on a phone without the letters getting tiny
const PHRASES = {
  words: WORDS.filter(w => w.bg.length <= 16 && /^[А-Яа-яЁё ,.!?-]+$/.test(w.bg)),
  sentences: SENTENCES,
}
const NEXT_LABEL = { letters: 'Next letter', words: 'Next word', sentences: 'Next sentence' }

// Canvas cannot use CSS variables, so the theme tokens are read when painting
const token = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

function readBest() {
  try { return JSON.parse(localStorage.getItem(BEST_KEY)) || {} } catch { return {} }
}
function saveBest(best) {
  try { localStorage.setItem(BEST_KEY, JSON.stringify(best)) } catch {}
}

const randomIndex = (length, not) => {
  if (length < 2) return 0
  const i = Math.floor(Math.random() * (length - 1))
  return i >= not ? i + 1 : i
}

function verdict(score) {
  if (score >= 80) return 'Great, that looks right.'
  if (score >= PASS) return 'Good. Try to follow the shape a little closer.'
  return 'Not quite. Look at the shape and try again.'
}

export default function Handwriting() {
  const [kind, setKind] = useState('letters')
  const [letterIndex, setLetterIndex] = useState(0)
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [style, setStyle] = useState('cursive')
  const [letterCase, setLetterCase] = useState('lower')
  const [mode, setMode] = useState('trace')
  const [strokes, setStrokes] = useState([])
  const [score, setScore] = useState(null)
  const [best, setBest] = useState({})
  const [family, setFamily] = useState(null)
  const canvasRef = useRef(null)
  const layoutRef = useRef(null)
  const drawing = useRef(null)

  const isLetter = kind === 'letters'
  const upper = ALPHABET[letterIndex]
  const phrase = isLetter ? null : PHRASES[kind][phraseIndex % PHRASES[kind].length]
  const text = isLetter ? (letterCase === 'upper' ? upper : upper.toLowerCase()) : phrase.bg
  const info = isLetter ? LETTERS.find(l => l.letter === upper) : null
  // Words and sentences are always traced, freehand text would never line up with the guide
  const tracing = !isLetter || mode === 'trace'
  const fontClass = style === 'cursive' ? cursive.className : styles.print

  useEffect(() => { setBest(readBest()) }, [])

  // The canvas needs the font's real family name and has to wait for it to load
  useEffect(() => {
    const name = style === 'cursive' ? cursive.style.fontFamily : `${handA.style.fontFamily}, ${getComputedStyle(document.body).fontFamily}`
    let alive = true
    document.fonts.load(`700 40px ${name}`, text).catch(() => {}).then(() => alive && setFamily(name))
    return () => { alive = false }
  }, [style, text])

  const reset = () => { setStrokes([]); setScore(null) }
  useEffect(reset, [text, style, mode]) // eslint-disable-line react-hooks/exhaustive-deps

  const paint = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !family) return
    const width = canvas.clientWidth
    const ctx = canvas.getContext('2d')
    const layout = layoutText(ctx, text, family, width)
    layoutRef.current = layout
    canvas.style.height = `${layout.height}px`
    const dpr = window.devicePixelRatio || 1
    const w = Math.round(width * dpr)
    const h = Math.round(layout.height * dpr)
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, layout.height)
    const muted = token('--text-muted')

    ctx.globalAlpha = 0.35
    drawGuides(ctx, layout, muted)
    if (tracing || score !== null) {
      ctx.globalAlpha = score !== null ? 0.55 : 0.28
      drawText(ctx, layout, { fill: score !== null ? token('--teal') : muted })
    }
    ctx.globalAlpha = 1
    drawStrokes(ctx, layout, strokes, token('--text'), PEN * layout.fontSize)
  }, [family, text, tracing, score, strokes])

  useEffect(() => {
    paint()
    window.addEventListener('resize', paint)
    return () => window.removeEventListener('resize', paint)
  }, [paint])

  function point(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    return { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.width }
  }

  // State updaters run later than the pointer events, so they get their own
  // copy of the stroke instead of reading drawing.current, which is cleared on pointer up
  function onDown(e) {
    if (score !== null) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const stroke = [point(e)]
    drawing.current = stroke
    setStrokes(s => [...s, stroke.slice()])
  }

  function onMove(e) {
    const stroke = drawing.current
    if (!stroke) return
    stroke.push(point(e))
    const copy = stroke.slice()
    setStrokes(s => [...s.slice(0, -1), copy])
  }

  function onUp() { drawing.current = null }

  function check() {
    if (!layoutRef.current) return
    const result = scoreWriting(strokes, layoutRef.current)
    setScore(result)
    if (!isLetter) return
    const key = `${style}:${text}`
    if (result > (best[key] || 0)) {
      const next = { ...best, [key]: result }
      setBest(next)
      saveBest(next)
    }
  }

  function next() {
    if (isLetter) setLetterIndex(i => (i + 1) % ALPHABET.length)
    else setPhraseIndex(i => randomIndex(PHRASES[kind].length, i % PHRASES[kind].length))
  }

  function changeKind(id) {
    setKind(id)
    if (id !== 'letters') setPhraseIndex(Math.floor(Math.random() * PHRASES[id].length))
  }

  function speak() {
    unlockAudio()
    speakBulgarian(isLetter ? info?.tts || upper : phrase.bg)
  }

  const noun = isLetter ? 'letter' : 'text'

  return (
    <div className={`${styles.wrap} ${handA.variable}`}>
      <div className={styles.toolbar}>
        <Segmented label="What to write" options={KINDS} value={kind} onChange={changeKind} />
        <Segmented label="Letter style" options={STYLES} value={style} onChange={setStyle} />
        {isLetter && <Segmented label="Letter case" options={CASES} value={letterCase} onChange={setLetterCase} />}
        {isLetter && <Segmented label="Mode" options={MODES} value={mode} onChange={setMode} />}
      </div>

      <div className={`${styles.layout} ${isLetter ? styles.withPicker : ''}`}>
        <section className={styles.board}>
          <div className={styles.head}>
            <button className={styles.speak} onClick={speak} aria-label={`Listen to ${isLetter ? upper : phrase.bg}`}>
              <img src="/icons/speaker.png" alt="" width={20} height={20} />
            </button>
            <div className={styles.headText}>
              {isLetter ? (
                <>
                  <span className={`${styles.target} ${fontClass}`} lang="bg">{upper}{upper.toLowerCase()}</span>
                  {info?.hint && <span className={styles.sound}>{info.hint}</span>}
                </>
              ) : (
                <>
                  <span className={`${styles.phrase} ${fontClass}`} lang="bg">{phrase.bg}</span>
                  <span className={styles.sound}>{phrase.en}</span>
                </>
              )}
            </div>
          </div>

          <canvas
            ref={canvasRef}
            className={`${styles.canvas} ${isLetter ? styles.canvasLetter : ''}`}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            aria-label={`Drawing area: write ${text}`}
          />

          {score !== null ? (
            <div className={styles.result} aria-live="polite">
              <span className={`${styles.score} ${score >= PASS ? styles.pass : styles.fail}`}>{score}%</span>
              <span className={styles.verdict}>{verdict(score)}</span>
            </div>
          ) : (
            <p className={styles.hint}>
              {tracing ? `Trace the grey ${noun} with your finger or mouse.` : 'Write the letter from memory, then check it.'}
            </p>
          )}

          <div className={styles.actions}>
            <Button variant="secondary" onClick={reset} disabled={!strokes.length}>Clear</Button>
            {score === null
              ? <Button onClick={check} disabled={!strokes.length || !family}>Check</Button>
              : <Button onClick={next}>{NEXT_LABEL[kind]}</Button>}
          </div>
        </section>

        {isLetter && (
          <section className={styles.picker} aria-label="Letters">
            {ALPHABET.map((l, i) => {
              const shown = letterCase === 'upper' ? l : l.toLowerCase()
              const done = (best[`${style}:${shown}`] || 0) >= PASS
              return (
                <button
                  key={l}
                  className={`${styles.chip} ${i === letterIndex ? styles.chipOn : ''} ${done ? styles.chipDone : ''} ${fontClass}`}
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
        )}
      </div>

      <section className={styles.note}>
        <h2 className={styles.noteTitle}>Handwritten letters look different</h2>
        <p className={styles.noteText}>
          Bulgarians write in cursive, and some letters change shape: <span className={cursive.className} lang="bg">д</span> looks
          like a g, <span className={cursive.className} lang="bg">т</span> like an m, <span className={cursive.className} lang="bg">и</span> like
          a u and <span className={cursive.className} lang="bg">п</span> like an n. Switch to Print to compare them with the letters you read.
        </p>
      </section>
    </div>
  )
}
