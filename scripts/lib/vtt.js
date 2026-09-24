import { fixHomoglyphs } from './textTools.js'

const toSeconds = t => {
  const [h, m, s] = t.replace(',', '.').split(':')
  return Number(h) * 3600 + Number(m) * 60 + Number(s)
}

// YouTube VTT, including auto captions, which repeat the previous line in
// every cue and mark new words with <c> tags. Keeps each new line once.
export function parseVtt(vtt) {
  const lines = []
  for (const block of vtt.replace(/\r/g, '').split(/\n\n+/)) {
    const timing = block.match(/(\d{2}:\d{2}:\d{2}[.,]\d{3}) --> (\d{2}:\d{2}:\d{2}[.,]\d{3})/)
    if (!timing) continue
    const start = toSeconds(timing[1])
    const end = toSeconds(timing[2])
    if (end - start < 0.05) continue
    const rows = block.split('\n')
    const textLines = rows.slice(rows.findIndex(l => l.includes('-->')) + 1).filter(l => l.trim())
    const fresh = textLines.find(l => l.includes('<c>')) ?? textLines[textLines.length - 1]
    const text = fixHomoglyphs((fresh || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim())
    if (!text || text === lines[lines.length - 1]?.bg) continue
    lines.push({ start: Math.round(start * 100) / 100, end: Math.round(end * 100) / 100, bg: text })
  }
  for (let i = 0; i < lines.length - 1; i++) lines[i].end = Math.max(lines[i].end, lines[i + 1].start)
  return lines
}
