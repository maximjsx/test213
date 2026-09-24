// Parses the literary words list (a Discord paste) into data/glossary.json.
// Re-running keeps every English gloss already in the file, so edits and
// reviews survive a fresh import.
//
//   bun scripts/import-glossary.js "path/to/knizhovni dumi.txt"
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { transliterate, slugify, fixHomoglyphs } from './lib/textTools.js'

const OUT = join(import.meta.dir, '..', 'data', 'glossary.json')
const DISCORD_HEADER = / — \d{1,2}\/\d{1,2}\/\d{2}, \d{1,2}:\d{2} [AP]M$/
const FLAG = /\s*\u{1F1E7}\u{1F1EC}\s*$/u

const path = process.argv[2]
if (!path) {
  console.error('Usage: bun scripts/import-glossary.js path/to/words.txt')
  process.exit(1)
}

const lines = fixHomoglyphs(readFileSync(path, 'utf8')).split(/\r?\n/).map(l => l.trim())

// "(sense ;; sense) /tag/ /tag/" -> senses and tags
function parseDefinition(line) {
  const tags = [...line.matchAll(/\/([^/]+)\//g)].map(m => m[1].trim())
  const inner = line.replace(/\/[^/]+\//g, '').trim().replace(/^\(/, '').replace(/\)$/, '')
  const senses = inner.split(/\s*;;\s*/).map(s => s.trim()).filter(Boolean)
  return { senses, tags }
}

const entries = []
for (let i = 0; i < lines.length; i++) {
  const line = lines[i]
  if (!FLAG.test(line)) continue
  const bg = line.replace(FLAG, '').trim()
  const entry = { bg, senses: [], tags: [] }
  // The definition, then possibly a second parenthesised usage note
  for (let j = i + 1; j < lines.length && lines[j].startsWith('('); j++) {
    if (!entry.senses.length) Object.assign(entry, parseDefinition(lines[j]))
    else entry.usage = lines[j].replace(/^\(|\)$/g, '').trim()
  }
  entries.push(entry)
}

const previous = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : []
const byId = new Map(previous.map(e => [e.id, e]))
const used = new Set()

const glossary = entries.map(e => {
  let id = slugify(transliterate(e.bg))
  while (used.has(id)) id += '-2'
  used.add(id)
  const old = byId.get(id)
  return {
    id,
    bg: e.bg,
    senses: e.senses,
    ...(e.tags.length ? { tags: e.tags } : {}),
    ...(e.usage ? { usage: e.usage } : {}),
    en: old?.en || '',
    enReviewed: old?.enReviewed || false,
  }
}).sort((a, b) => a.bg.localeCompare(b.bg, 'bg'))

writeFileSync(OUT, JSON.stringify(glossary, null, 2) + '\n')
const missing = glossary.filter(e => !e.en).length
console.log(`Glossary: ${glossary.length} words${missing ? `, ${missing} without English yet` : ''}.`)
