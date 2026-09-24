// Real Bulgarian videos and songs with dual subtitles. Hand-editable files:
//   data/media/index.json   [{ id, kind: 'video'|'song', youtubeId, title, channel?, artist?, level?, tags?, captionSource }]
//   data/media/<id>.json     { lines: [{ start, end, bg, en, enReviewed? }], words: { bg: en } }
// Server only (reads files at build time).
import { readFileSync } from 'fs'
import { join } from 'path'
import MEDIA from '../data/media/index.json'
import GLOSSARY from '../data/glossary.json'

export { MEDIA }

export const findMedia = id => MEDIA.find(m => m.id === id) || null

const clean = word => word.toLowerCase().replace(/[.,!?;:"«»„“()\-–]/g, '')
const GLOSSARY_EN = new Map(GLOSSARY.map(g => [clean(g.bg), g.en]))

// The track plus meanings for every word in it: the file's own `words`
// first, then the glossary, so the player needs no lookups at runtime.
export function loadTrack(id) {
  const track = JSON.parse(readFileSync(join(process.cwd(), 'data', 'media', `${id}.json`), 'utf8'))
  const words = {}
  for (const line of track.lines) {
    for (const token of line.bg.split(/\s+/)) {
      const key = clean(token)
      if (key && GLOSSARY_EN.has(key)) words[key] = GLOSSARY_EN.get(key)
    }
  }
  return { lines: track.lines, words: { ...words, ...(track.words || {}) } }
}
