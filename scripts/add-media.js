// Adds a YouTube video or song to /watch: fetches Bulgarian captions with
// yt-dlp, translates lines and words to English with Google Cloud
// Translation, and writes data/media/<id>.json plus an index.json entry.
// Everything it writes is plain JSON to review and edit by hand.
//
//   bun run add-media <youtube url> [--song] [--id my-id] [--level A2] [--lyrics lyrics.txt]
//
// Needs yt-dlp on PATH (winget install yt-dlp) and GOOGLE_TRANSLATE_KEY (or
// GOOGLE_TTS_KEY with the Cloud Translation API enabled) in .env.local.
// --lyrics: for songs without captions. Lines come from the file (one per
// line) and get placeholder timings to fix in /builder/media/<id>.
import { readFileSync, writeFileSync, mkdtempSync, readdirSync, rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { transliterate, slugify, fixHomoglyphs } from './lib/textTools.js'
import { parseVtt } from './lib/vtt.js'

const MEDIA = join(import.meta.dir, '..', 'data', 'media')
const INDEX = join(MEDIA, 'index.json')
const TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2'
const BATCH = 100
const TIMEOUT_MS = 20000

function fail(message) {
  console.error(message)
  process.exit(1)
}

function parseArgs(argv) {
  const args = { url: null, song: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--song') args.song = true
    else if (a.startsWith('--')) args[a.slice(2)] = argv[++i]
    else args.url = a
  }
  return args
}

async function run(cmd) {
  const proc = Bun.spawn(cmd, { stdout: 'pipe', stderr: 'pipe' })
  const [out, err, code] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited])
  if (code !== 0) fail(`${cmd[0]} failed:\n${err.trim()}`)
  return out
}

async function translate(texts) {
  const key = process.env.GOOGLE_TRANSLATE_KEY || process.env.GOOGLE_TTS_KEY
  if (!key) {
    console.warn('No GOOGLE_TRANSLATE_KEY: English is left empty.')
    return texts.map(() => '')
  }
  const out = []
  for (let i = 0; i < texts.length; i += BATCH) {
    const res = await fetch(`${TRANSLATE_URL}?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: texts.slice(i, i + BATCH), source: 'bg', target: 'en', format: 'text' }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    const data = await res.json()
    if (!res.ok) fail(`Translation failed: ${data.error?.message || res.status}`)
    out.push(...data.data.translations.map(t => t.translatedText))
  }
  return out
}

const clean = word => word.toLowerCase().replace(/[.,!?;:"«»„“()\-–]/g, '')

async function captions(url, dir) {
  await run(['yt-dlp', '--skip-download', '--write-subs', '--write-auto-subs', '--sub-langs', 'bg', '--sub-format', 'vtt', '-o', join(dir, 'subs'), url])
  const files = readdirSync(dir).filter(f => f.endsWith('.vtt'))
  if (!files.length) return null
  // Manual captions come out as subs.bg.vtt; auto ones share the name, so
  // yt-dlp's own preference (manual first) decides which is saved.
  return readFileSync(join(dir, files[0]), 'utf8')
}

const args = parseArgs(process.argv.slice(2))
if (!args.url) fail('Usage: bun run add-media <youtube url> [--song] [--id my-id] [--level A2] [--lyrics lyrics.txt]')

const info = JSON.parse(await run(['yt-dlp', '--dump-single-json', '--skip-download', '--no-warnings', args.url]))
const dir = mkdtempSync(join(tmpdir(), 'bulgario-media-'))

let lines
let captionSource
try {
  if (args.lyrics) {
    const text = readFileSync(args.lyrics, 'utf8').split(/\r?\n/).map(l => fixHomoglyphs(l.trim())).filter(Boolean)
    const step = (info.duration || text.length * 4) / text.length
    lines = text.map((bg, i) => ({ start: Math.round(i * step * 100) / 100, end: Math.round((i + 1) * step * 100) / 100, bg }))
    captionSource = 'lyrics'
  } else {
    const vtt = await captions(args.url, dir)
    if (!vtt) fail('This video has no Bulgarian captions. For a song, pass --lyrics with the lyrics in a text file.')
    lines = parseVtt(vtt)
    captionSource = info.subtitles?.bg ? 'manual' : 'auto'
  }
} finally {
  rmSync(dir, { recursive: true, force: true })
}

const english = await translate(lines.map(l => l.bg))
lines.forEach((l, i) => { l.en = english[i]; l.enReviewed = false })

const vocab = [...new Set(lines.flatMap(l => l.bg.split(/\s+/).map(clean)).filter(w => /[Ѐ-ӿ]/.test(w)))]
const meanings = await translate(vocab)
const words = Object.fromEntries(vocab.map((w, i) => [w, meanings[i]]).filter(([, en]) => en))

const id = args.id || slugify(transliterate(info.title)).slice(0, 60) || info.id
writeFileSync(join(MEDIA, `${id}.json`), JSON.stringify({ lines, words }, null, 2) + '\n')

const index = JSON.parse(readFileSync(INDEX, 'utf8'))
const entry = {
  id,
  kind: args.song ? 'song' : 'video',
  youtubeId: info.id,
  title: info.title,
  ...(args.song ? { artist: info.artist || info.uploader } : { channel: info.channel || info.uploader }),
  ...(args.level ? { level: args.level } : {}),
  durationSec: info.duration,
  captionSource,
}
const at = index.findIndex(m => m.id === id)
if (at === -1) index.push(entry)
else index[at] = { ...index[at], ...entry }
writeFileSync(INDEX, JSON.stringify(index, null, 2) + '\n')

console.log(`${at === -1 ? 'Added' : 'Updated'} ${entry.kind} "${entry.title}" as ${id}: ${lines.length} lines (${captionSource}), ${Object.keys(words).length} word meanings.`)
if (captionSource === 'lyrics') console.log(`Timings are placeholders. Sync them at /builder/media/${id}.`)
