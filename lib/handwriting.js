// Scores handwriting against the font's glyphs. Both are rendered small, the
// learner's ink is compared with thickened text and the other way round, so
// text traced in the right place with a steady hand scores high while
// scribbles and missing strokes do not.
//
// Strokes are arrays of { x, y } measured in canvas widths, so they keep their
// place when the canvas is resized.
export const PEN = 0.073 // pen width as a share of the font size
const MASK_FONT = 80 // font size in the scoring masks, in pixels
const SLACK = 1.8 // how far off a stroke may be, in pen widths
const LINE_HEIGHT = 1.5

const fontOf = (size, family) => `700 ${size}px ${family}`

// Where the text sits on a canvas `width` wide. A single letter fills a square,
// words and sentences wrap onto ruled lines as tall as they need.
export function layoutText(ctx, text, family, width) {
  if ([...text].length === 1) {
    const fontSize = width * 0.62
    return { width, height: width, fontSize, family, lines: [{ text, baseline: width * 0.74 }] }
  }
  let fontSize = Math.min(80, Math.max(44, width / 5))
  const words = text.split(' ')
  ctx.font = fontOf(fontSize, family)
  const widest = Math.max(...words.map(w => ctx.measureText(w).width))
  if (widest > width * 0.92) fontSize *= (width * 0.92) / widest
  ctx.font = fontOf(fontSize, family)

  const rows = []
  for (const word of words) {
    const last = rows.length ? `${rows[rows.length - 1]} ${word}` : word
    if (rows.length && ctx.measureText(last).width <= width * 0.92) rows[rows.length - 1] = last
    else rows.push(word)
  }
  const top = fontSize * 1.05
  const lines = rows.map((row, i) => ({ text: row, baseline: top + i * fontSize * LINE_HEIGHT }))
  const height = lines[lines.length - 1].baseline + fontSize * 0.5
  return { width, height, fontSize, family, lines }
}

// Baseline, x-height and cap height for every line
export function drawGuides(ctx, layout, color) {
  ctx.strokeStyle = color
  ctx.lineWidth = 1
  ctx.setLineDash([6, 6])
  for (const { baseline } of layout.lines) {
    for (const y of [baseline, baseline - layout.fontSize * 0.45, baseline - layout.fontSize * 0.87]) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(layout.width, y); ctx.stroke()
    }
  }
  ctx.setLineDash([])
}

export function drawText(ctx, layout, { fill, stroke = 0 }) {
  ctx.font = fontOf(layout.fontSize, layout.family)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = fill
  ctx.strokeStyle = fill
  ctx.lineWidth = stroke
  ctx.lineJoin = 'round'
  for (const line of layout.lines) {
    ctx.fillText(line.text, layout.width / 2, line.baseline)
    if (stroke) ctx.strokeText(line.text, layout.width / 2, line.baseline)
  }
}

export function drawStrokes(ctx, layout, strokes, color, width) {
  const scale = layout.width
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const stroke of strokes) {
    if (stroke.length === 1) {
      ctx.beginPath()
      ctx.arc(stroke[0].x * scale, stroke[0].y * scale, width / 2, 0, Math.PI * 2)
      ctx.fill()
      continue
    }
    ctx.beginPath()
    stroke.forEach((p, i) => (i ? ctx.lineTo(p.x * scale, p.y * scale) : ctx.moveTo(p.x * scale, p.y * scale)))
    ctx.stroke()
  }
}

// Renders at a fixed font size so long sentences cost the same per letter as a single one
function mask(layout, paint) {
  const k = MASK_FONT / layout.fontSize
  const w = Math.ceil(layout.width * k)
  const h = Math.ceil(layout.height * k)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.scale(k, k)
  paint(ctx)
  const data = ctx.getImageData(0, 0, w, h).data
  const out = new Uint8Array(w * h)
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

// 0 to 100: how much of the text was drawn (coverage) balanced against how
// much of the ink belongs to the text (precision)
export function scoreWriting(strokes, layout) {
  if (!strokes.length) return 0
  const pen = PEN * layout.fontSize
  const text = mask(layout, ctx => drawText(ctx, layout, { fill: '#000', stroke: pen }))
  const textNear = mask(layout, ctx => drawText(ctx, layout, { fill: '#000', stroke: pen * SLACK }))
  const ink = mask(layout, ctx => drawStrokes(ctx, layout, strokes, '#000', pen))
  const inkNear = mask(layout, ctx => drawStrokes(ctx, layout, strokes, '#000', pen * SLACK))
  const coverage = overlap(text, inkNear)
  const precision = overlap(ink, textNear)
  if (!coverage || !precision) return 0
  return Math.round((200 * coverage * precision) / (coverage + precision))
}
