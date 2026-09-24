// Imports the old Outline wiki export into data/wiki (Markdown pages plus
// index.json) and public/wiki (uploads). Running it again replaces the
// import. Private/ and the editor guidelines page are never imported.
//
//   bun scripts/import-wiki.js "path/to/Wiki-export.markdown.zip"
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs'
import { join, dirname, posix } from 'path'
import { unzipSync, strFromU8 } from 'fflate'
import { transliterate, slugify, fixHomoglyphs } from './lib/textTools.js'

const ROOT = join(import.meta.dir, '..')
const OUT = join(ROOT, 'data', 'wiki')
const PUBLIC = join(ROOT, 'public', 'wiki')

const SKIP = [/^Private\//, /^Getting started\//]
const HOME = 'Public/Home.md'
const PAGES_ROOT = 'Public/Home/'
// Pages that are all vulgar vocabulary: shown behind a warning, not indexed
const WARNING = /^Bad stuff/
// Top-level order; anything else follows alphabetically
const ORDER = [
  'The alphabet', 'Vocabulary', 'Interesting rules', 'History', 'Important Bulgarian Holidays',
  'Music', 'Movies', 'Books', 'Bulgarian content creators', 'Tech', 'Other online resources', 'Bad stuff',
]
const MIN_BODY = 40

const EMOJI = /[#*0-9]\u{FE0F}?\u{20E3}|[\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{1F3FB}-\u{1F3FF}]/gu
const GERMAN = /^(german|deutsch|немски)/i
const HEADER_NAMES = [[/^bulgarisch/i, 'Bulgarian'], [/^englisch/i, 'English']]

const zipPath = process.argv[2]
if (!zipPath) {
  console.error('Usage: bun scripts/import-wiki.js path/to/export.zip')
  process.exit(1)
}
const files = unzipSync(new Uint8Array(readFileSync(zipPath)))
// "%2F" inside a file name is a slash in the page title, not a folder
const decode = name => name.split('/').map(p => decodeURIComponent(p.replace(/%2F/gi, '-'))).join('/')

function titleOf(markdown) {
  const h1 = markdown.match(/^#\s+(.+)$/m)
  return h1 ? h1[1].replace(EMOJI, '').replace(/\*\*/g, '').trim() : ''
}

function slugPart(title) {
  const latin = title.match(/[A-Za-z]/g)?.length || 0
  const source = latin >= 4 ? title.replace(/\([^)]*[Ѐ-ӿ][^)]*\)/g, '').replace(/[Ѐ-ӿ]+/g, '') : transliterate(title)
  return slugify(source)
}

// Drops the German column; renames German-language headers to English
function cleanTable(rows) {
  const cells = row => row.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim())
  const header = cells(rows[0]).map(c => c.replace(/\*\*/g, '').trim())
  const keep = header.map(h => !GERMAN.test(h))
  const rename = h => HEADER_NAMES.reduce((out, [re, name]) => out.replace(re, name), h)
  return rows.map((row, i) => {
    const kept = cells(row).filter((_, j) => keep[j])
    if (i === 0) return `| ${kept.map(c => rename(c.replace(/\*\*/g, '').trim())).join(' | ')} |`
    if (i === 1) return `|${kept.map(() => '----').join('|')}|`
    return `| ${kept.join(' | ')} |`
  })
}

function convert(markdown, uploadFor) {
  const body = markdown.replace(/^#\s+.+\n?/, '')
  const lines = []
  let callout = false
  let table = []
  const flushTable = () => { if (table.length) lines.push(...cleanTable(table)); table = [] }

  for (let line of body.split('\n')) {
    if (line.trim().startsWith('|')) { table.push(line); continue }
    flushTable()
    if (/^:::\w+/.test(line.trim())) { callout = true; continue }
    if (line.trim() === ':::') { callout = false; continue }
    if (line.trim() === '\\') { lines.push(''); continue }

    line = line
      .replace(/^# /, '## ')
      .replace(/^#### /, '### ')
      .replace(/\\([[\]()*_#|])/g, '$1')
      // Attachments: "[file.mp3 12345](uploads/...)" -> audio/image embed
      .replace(/!?\[([^\]]*)\]\((uploads\/(?:[^()\s]|\([^()\s]*\))+)(?:\s+"[^"]*")?\)/g, (_, alt, src) => {
        const url = uploadFor(src)
        const label = alt.replace(/\s+\d+$/, '').trim()
        return `![${label}](${url})`
      })
      .replace(EMOJI, '')
      .replace(/[ \t]+$/, '')

    if (callout) line = line.trim() ? `> ${line.trim()}` : ''
    lines.push(line)
  }
  flushTable()
  return fixHomoglyphs(lines.join('\n').replace(/\*\*\s*\*\*/g, '').replace(/\n{3,}/g, '\n\n').trim()) + '\n'
}

// Pages keyed by their path inside Public/Home, without ".md"
const pages = new Map()
for (const [name, data] of Object.entries(files)) {
  const path = decode(name)
  if (SKIP.some(re => re.test(path)) || !path.endsWith('.md')) continue
  if (path !== HOME && !path.startsWith(PAGES_ROOT)) continue
  pages.set(path === HOME ? '' : path.slice(PAGES_ROOT.length, -3), { path, raw: strFromU8(data) })
}

const bodyOf = key => pages.get(key).raw.replace(/^#\s+.+\n?/, '').replace(/\\/g, '').trim()
const childrenOf = key => [...pages.keys()].filter(k => k !== key && posix.dirname(k) === (key || '.'))
// A page is imported when it has real text or an imported child page
const keeps = new Map()
function kept(key) {
  if (!keeps.has(key)) keeps.set(key, key === '' || bodyOf(key).length >= MIN_BODY || childrenOf(key).some(kept))
  return keeps.get(key)
}
const slugOf = new Map()
function slugFor(key) {
  if (key === '') return ''
  if (!slugOf.has(key)) {
    const parent = posix.dirname(key)
    const own = slugPart(titleOf(pages.get(key)?.raw || '') || posix.basename(key))
    slugOf.set(key, parent === '.' ? own : `${slugFor(parent)}/${own}`)
  }
  return slugOf.get(key)
}

rmSync(OUT, { recursive: true, force: true })
rmSync(PUBLIC, { recursive: true, force: true })
mkdirSync(PUBLIC, { recursive: true })

const index = []
const orderOf = title => {
  const i = ORDER.findIndex(o => title.startsWith(o))
  return i === -1 ? ORDER.length : i
}

for (const [key, { path, raw }] of pages) {
  const title = titleOf(raw)
  const slug = slugFor(key)
  let uploads = 0
  const uploadFor = src => {
    const file = posix.join(posix.dirname(path), decodeURIComponent(src))
    const data = files[Object.keys(files).find(n => decode(n) === file)]
    if (!data) return src
    const name = `${(slug || 'home').replace(/\//g, '-')}-${++uploads}${posix.extname(file).toLowerCase()}`
    writeFileSync(join(PUBLIC, name), data)
    return `/wiki/${name}`
  }
  const body = convert(raw, uploadFor)
  if (!kept(key)) continue

  const file = join(OUT, `${slug || 'index'}.md`)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, body)
  const parentKey = key.includes('/') ? posix.dirname(key) : key === '' ? null : ''
  index.push({
    slug,
    title: key === '' ? 'Wiki' : title,
    parent: parentKey === null ? null : slugFor(parentKey),
    warning: WARNING.test(key.split('/')[0]) || undefined,
  })
}

index.sort((a, b) => orderOf(a.title) - orderOf(b.title) || a.title.localeCompare(b.title))
writeFileSync(join(OUT, 'index.json'), JSON.stringify(index, null, 2) + '\n')
console.log(`Imported ${index.length} wiki pages.`)
