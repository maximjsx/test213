'use client'
import { useEffect, useRef, useState } from 'react'
import { speakBulgarian, hapticTap } from '../../lib/audio'
import styles from './Exercise.module.css'

const SIZE = 300
const GLYPH = SIZE * 0.72
const INK = SIZE * 0.075
// Ink counts as covering the letter within this reach of the pen
const REACH = SIZE * 0.18
// How much of the letter must be inked, and how much ink may stray off it
const MIN_COVER = 0.8
const MAX_STRAY = 0.22
// Scoring runs on a smaller copy, plenty for coverage and cheap on phones
const SCORE = 100

function glyphFont(canvas) {
  return `800 ${GLYPH}px ${getComputedStyle(canvas).fontFamily}`
}

// outline widens the letter, used to forgive ink that runs just past its edge
function drawGlyph(ctx, canvas, letter, { scale = 1, outline = 0 } = {}) {
  ctx.save()
  ctx.scale(scale, scale)
  ctx.font = glyphFont(canvas)
  ctx.textAlign = 'center'
  const m = ctx.measureText(letter)
  const y = SIZE / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2
  ctx.fillText(letter, SIZE / 2, y)
  if (outline) {
    ctx.lineWidth = outline
    ctx.lineJoin = 'round'
    ctx.strokeText(letter, SIZE / 2, y)
  }
  ctx.restore()
}

function drawStrokes(ctx, strokes, width, scale = 1) {
  ctx.save()
  ctx.scale(scale, scale)
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const stroke of strokes) {
    ctx.beginPath()
    ctx.moveTo(stroke[0].x, stroke[0].y)
    for (const p of stroke) ctx.lineTo(p.x, p.y)
    if (stroke.length === 1) ctx.lineTo(stroke[0].x + 0.1, stroke[0].y)
    ctx.stroke()
  }
  ctx.restore()
}

function layer(paint) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = SCORE
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  paint(ctx)
  return ctx.getImageData(0, 0, SCORE, SCORE).data
}

// Share of the letter the pen has passed near, and share of ink that missed the letter
function score(canvas, letter, strokes) {
  const s = SCORE / SIZE
  const glyph = layer(ctx => drawGlyph(ctx, canvas, letter, { scale: s }))
  const nearGlyph = layer(ctx => drawGlyph(ctx, canvas, letter, { scale: s, outline: SIZE * 0.1 }))
  const reach = layer(ctx => drawStrokes(ctx, strokes, REACH, s))
  const ink = layer(ctx => drawStrokes(ctx, strokes, INK * 0.5, s))

  let letterPx = 0, covered = 0, inkPx = 0, stray = 0
  for (let i = 3; i < glyph.length; i += 4) {
    if (glyph[i] > 128) {
      letterPx++
      if (reach[i] > 128) covered++
    }
    if (ink[i] > 128) {
      inkPx++
      if (nearGlyph[i] < 128) stray++
    }
  }
  return { cover: letterPx ? covered / letterPx : 0, stray: inkPx ? stray / inkPx : 0 }
}

// Draw over a faded letter; it counts once most of the letter is inked and the ink stays on it.
export default function TraceLetter({ exercise, onAnswer, disabled }) {
  const canvasRef = useRef(null)
  const strokesRef = useRef([])
  const drawingRef = useRef(false)
  const [done, setDone] = useState(false)
  const [offTrack, setOffTrack] = useState(false)
  const [hasInk, setHasInk] = useState(false)
  const letter = exercise.display

  const say = () => speakBulgarian(exercise.tts || letter)

  function paint(finished = done) {
    const canvas = canvasRef.current
    if (!canvas) return
    const css = getComputedStyle(canvas)
    const ratio = window.devicePixelRatio || 1
    if (canvas.width !== SIZE * ratio || canvas.height !== SIZE * ratio) canvas.width = canvas.height = SIZE * ratio
    const ctx = canvas.getContext('2d')
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.clearRect(0, 0, SIZE, SIZE)

    ctx.strokeStyle = css.getPropertyValue('--border')
    ctx.lineWidth = 1.5
    ctx.setLineDash([6, 6])
    ctx.beginPath()
    ctx.moveTo(SIZE / 2, 8); ctx.lineTo(SIZE / 2, SIZE - 8)
    ctx.moveTo(8, SIZE / 2); ctx.lineTo(SIZE - 8, SIZE / 2)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = css.getPropertyValue('--border-hi')
    drawGlyph(ctx, canvas, letter)

    ctx.strokeStyle = css.getPropertyValue(finished ? '--green' : '--blue')
    drawStrokes(ctx, strokesRef.current, INK)
  }

  useEffect(() => {
    paint()
    document.fonts?.ready.then(() => paint())
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function pointAt(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    return { x: (e.clientX - rect.left) * SIZE / rect.width, y: (e.clientY - rect.top) * SIZE / rect.height }
  }

  function down(e) {
    if (disabled || done) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drawingRef.current = true
    strokesRef.current.push([pointAt(e)])
    setHasInk(true)
    paint()
  }

  function move(e) {
    if (!drawingRef.current) return
    strokesRef.current.at(-1).push(pointAt(e))
    paint()
  }

  function up() {
    if (!drawingRef.current) return
    drawingRef.current = false
    const { cover, stray } = score(canvasRef.current, letter, strokesRef.current)
    setOffTrack(stray > MAX_STRAY)
    if (cover < MIN_COVER || stray > MAX_STRAY) return
    setDone(true)
    paint(true)
    say()
    onAnswer(true, exercise.sound ? `${letter} sounds like "${exercise.sound}".` : '')
  }

  function clear() {
    hapticTap()
    strokesRef.current = []
    setHasInk(false)
    setOffTrack(false)
    paint()
  }

  return (
    <div className={styles.wrap}>
      <h2 className={styles.letterQuestion}>Trace the letter</h2>
      <div className={styles.traceHead}>
        <button className={styles.ttsInline} onClick={say} title="Listen">
          <img src="/icons/speaker.png" alt="Listen" width={20} height={20} />
        </button>
        <div className={styles.traceName}>
          {exercise.sound && <span className={styles.traceSound}>{exercise.sound}</span>}
          <span lang="bg">{letter}</span>
        </div>
      </div>
      <div className={styles.traceBoard}>
        <canvas
          ref={canvasRef}
          className={`${styles.traceCanvas} ${done ? styles.traceDone : ''}`}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          aria-label={`Trace the letter ${letter}`}
        />
        <p className={styles.traceHint}>
          {offTrack ? 'Stay on the letter. Clear and try again.' : done ? '' : 'Draw over the grey letter.'}
        </p>
        {hasInk && !done && <button className={styles.traceClear} onClick={clear}>Clear</button>}
      </div>
    </div>
  )
}
