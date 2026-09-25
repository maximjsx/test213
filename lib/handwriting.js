// Scores handwriting against the font's glyphs. The glyphs are thinned to
// their centre line and the learner's ink to a hairline; each is scored by how
// close it runs to the other, so the letter traced with a steady hand scores
// high while scribbles, which cross the gaps inside letters, do not.
//
// Strokes are arrays of { x, y } measured in canvas widths, so they keep their
// place when the canvas is resized.
export const PEN = 0.073 // pen width as a share of the font size
const MASK_FONT = 80 // font size in the scoring masks, in pixels
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
  out.w = w
  return out
}

// Bounding box of the set pixels, in canvas widths
function bounds(m, layout) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (let i = 0; i < m.length; i++) {
    if (!m[i]) continue
    const x = i % m.w, y = (i - x) / m.w
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }
  if (minX === Infinity) return null
  const unit = layout.width * (MASK_FONT / layout.fontSize)
  return { minX: minX / unit, minY: minY / unit, maxX: (maxX + 1) / unit, maxY: (maxY + 1) / unit }
}

function strokeBounds(strokes) {
  const points = strokes.flat()
  const xs = points.map(p => p.x), ys = points.map(p => p.y)
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) }
}

// Moves and scales the writing onto the text, keeping its shape
function fitStrokes(strokes, from, to, scale) {
  const fx = (from.minX + from.maxX) / 2, fy = (from.minY + from.maxY) / 2
  const tx = (to.minX + to.maxX) / 2, ty = (to.minY + to.maxY) / 2
  return strokes.map(stroke => stroke.map(p => ({ x: (p.x - fx) * scale + tx, y: (p.y - fy) * scale + ty })))
}

// Ways to lay the writing over the text: where it was drawn, and moved onto
// the letters' centre line as drawn and at its height, so a well formed letter
// written off the guide still counts
function placements(strokes, layout, spine) {
  const target = bounds(spine, layout)
  if (!target) return [strokes]
  const ink = strokeBounds(strokes)
  const pen = PEN * layout.fontSize / layout.width
  const ih = Math.max(ink.maxY - ink.minY, pen)
  const th = target.maxY - target.minY
  // Scaled by height only: stretching to the width too would let any shape fill any letter
  const scale = Math.min(3, Math.max(0.33, th / ih))
  return [strokes, fitStrokes(strokes, ink, target, 1), fitStrokes(strokes, ink, target, scale)]
}

// Zhang-Suen thinning: the one pixel wide centre line of the glyphs
function thin(m) {
  const w = m.w, h = m.length / w
  const img = Uint8Array.from(m)
  let removed = true
  while (removed) {
    removed = false
    for (const pass of [0, 1]) {
      const doomed = []
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const i = y * w + x
          if (img[i] && isRemovable(img, i, w, pass)) doomed.push(i)
        }
      }
      for (const i of doomed) img[i] = 0
      if (doomed.length) removed = true
    }
  }
  img.w = w
  return img
}

function isRemovable(img, i, w, pass) {
  // Neighbours clockwise from the top
  const n = [img[i - w], img[i - w + 1], img[i + 1], img[i + w + 1], img[i + w], img[i + w - 1], img[i - 1], img[i - w - 1]]
  const count = n.reduce((a, b) => a + b, 0)
  if (count < 2 || count > 6) return false
  let rises = 0
  for (let k = 0; k < 8; k++) if (!n[k] && n[(k + 1) % 8]) rises++
  if (rises !== 1) return false
  const [top, , right, , bottom, , left] = n
  return pass === 0
    ? !(top && right && bottom) && !(right && bottom && left)
    : !(top && right && left) && !(top && bottom && left)
}

// Distance in pixels from every pixel to the nearest set pixel of `m`
function distanceTo(m) {
  const w = m.w, h = m.length / w
  const d = new Float32Array(m.length)
  for (let i = 0; i < d.length; i++) d[i] = m[i] ? 0 : Infinity
  const relax = (i, j, cost) => { if (d[j] + cost < d[i]) d[i] = d[j] + cost }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      if (x > 0) relax(i, i - 1, 1)
      if (y === 0) continue
      relax(i, i - w, 1)
      if (x > 0) relax(i, i - w - 1, Math.SQRT2)
      if (x < w - 1) relax(i, i - w + 1, Math.SQRT2)
    }
  }
  for (let y = h - 1; y >= 0; y--) {
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x
      if (x < w - 1) relax(i, i + 1, 1)
      if (y === h - 1) continue
      relax(i, i + w, 1)
      if (x < w - 1) relax(i, i + w + 1, Math.SQRT2)
      if (x > 0) relax(i, i + w - 1, Math.SQRT2)
    }
  }
  return d
}

// Share of the set pixels of `from` that lie close to the other line: full
// credit within NEAR pen widths, none beyond FAR
const NEAR = 0.35
const FAR = 1.1
function closeness(from, distance, pen) {
  let sum = 0, total = 0
  for (let i = 0; i < from.length; i++) {
    if (!from[i]) continue
    total++
    sum += Math.min(1, Math.max(0, (FAR * pen - distance[i]) / ((FAR - NEAR) * pen)))
  }
  return total ? sum / total : 0
}

const count = m => m.reduce((a, b) => a + b, 0)

// Length of the strokes in mask pixels
function inkLength(strokes, layout) {
  const k = layout.width * MASK_FONT / layout.fontSize
  let length = 0
  for (const stroke of strokes)
    for (let i = 1; i < stroke.length; i++)
      length += Math.hypot(stroke[i].x - stroke[i - 1].x, stroke[i].y - stroke[i - 1].y) * k
  return length
}

// Writing a letter takes about as much ink as its centre line; a scribble
// squeezed onto the letter takes far more
const EXTRA_INK = 1.8

function f1(layout, strokes, spine, spineDistance, pen) {
  // A hairline, so the pen's width can't paint over a small letter
  const line = mask(layout, ctx => drawStrokes(ctx, layout, strokes, '#000', 1.5 * layout.fontSize / MASK_FONT))
  const coverage = closeness(spine, distanceTo(line), pen)
  const excess = Math.min(1, (EXTRA_INK * count(spine)) / inkLength(strokes, layout))
  const precision = closeness(line, spineDistance, pen) * excess
  if (!coverage || !precision) return 0
  return coverage * precision
}

// Below FLOOR is a scribble and maps to 0. Above CEIL is as close as a mouse
// or a finger gets, so it maps to 100
const FLOOR = 0.35
const CEIL = 0.88

// 0 to 100: how much of the letters' centre line was drawn (coverage)
// balanced against how much of the ink follows it (precision), for the best
// placement
export function scoreWriting(strokes, layout) {
  if (!strokes.length) return 0
  const pen = PEN * MASK_FONT
  const shape = mask(layout, ctx => drawText(ctx, layout, { fill: '#000' }))
  const spine = thin(shape)
  const spineDistance = distanceTo(spine)
  const best = Math.max(...placements(strokes, layout, spine).map(s => f1(layout, s, spine, spineDistance, pen)))
  return Math.round(100 * Math.min(1, Math.max(0, (best - FLOOR) / (CEIL - FLOOR))))
}
