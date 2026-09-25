// Scores a drawn letter against the font's glyph. Both are rendered small, the
// learner's ink is compared with a thickened glyph and the other way round, so
// a letter traced in the right place with a steady hand scores high while
// scribbles and missing strokes do not.
export const PEN = 0.045 // pen width as a share of the canvas size
const GRID = 128
const SLACK = 1.8 // how far off a stroke may be, in pen widths

export function glyphLayout(size) {
  return { fontSize: size * 0.62, x: size / 2, baseline: size * 0.74 }
}

export function drawGlyph(ctx, size, letter, family, { fill, stroke = 0 }) {
  const { fontSize, x, baseline } = glyphLayout(size)
  ctx.font = `700 ${fontSize}px ${family}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = fill
  ctx.fillText(letter, x, baseline)
  if (stroke) {
    ctx.strokeStyle = fill
    ctx.lineWidth = stroke
    ctx.lineJoin = 'round'
    ctx.strokeText(letter, x, baseline)
  }
}

// strokes: arrays of { x, y } in 0..1
export function drawStrokes(ctx, size, strokes, color, width) {
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const stroke of strokes) {
    if (stroke.length === 1) {
      ctx.beginPath()
      ctx.arc(stroke[0].x * size, stroke[0].y * size, width / 2, 0, Math.PI * 2)
      ctx.fill()
      continue
    }
    ctx.beginPath()
    stroke.forEach((p, i) => (i ? ctx.lineTo(p.x * size, p.y * size) : ctx.moveTo(p.x * size, p.y * size)))
    ctx.stroke()
  }
}

function mask(paint) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = GRID
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  paint(ctx)
  const data = ctx.getImageData(0, 0, GRID, GRID).data
  const out = new Uint8Array(GRID * GRID)
  for (let i = 0; i < out.length; i++) out[i] = data[i * 4 + 3] > 100 ? 1 : 0
  return out
}

const overlap = (a, b) => {
  let inside = 0, total = 0
  for (let i = 0; i < a.length; i++) {
    if (!a[i]) continue
    total++
    if (b[i]) inside++
  }
  return total ? inside / total : 0
}

// 0 to 100: how much of the letter was drawn (coverage) balanced against how
// much of the ink belongs to the letter (precision)
export function scoreLetter(strokes, letter, family) {
  if (!strokes.length) return 0
  const pen = PEN * GRID
  const glyph = mask(ctx => drawGlyph(ctx, GRID, letter, family, { fill: '#000', stroke: pen }))
  const glyphNear = mask(ctx => drawGlyph(ctx, GRID, letter, family, { fill: '#000', stroke: pen * SLACK }))
  const ink = mask(ctx => drawStrokes(ctx, GRID, strokes, '#000', pen))
  const inkNear = mask(ctx => drawStrokes(ctx, GRID, strokes, '#000', pen * SLACK))
  const coverage = overlap(glyph, inkNear)
  const precision = overlap(ink, glyphNear)
  if (!coverage || !precision) return 0
  return Math.round((200 * coverage * precision) / (coverage + precision))
}
