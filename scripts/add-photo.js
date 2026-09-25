// Adds a photo to the Bulgaria gallery (/gallery): uploads a compressed copy to
// the storage API and appends an entry to data/gallery.json, ready to edit.
//
//   bun run add-photo "File:Rila Monastery.jpg" --bg "Рилският манастир" --en "Rila Monastery" [--category places]
//   bun run add-photo "File:Rila Monastery.jpg" --bg "..." --en "..." --link
//   bun run add-photo photo.jpg --bg "..." --en "..." --credit "Your Name" --licence "CC BY 4.0" [--source https://...]
//
// Wikimedia Commons files (a "File:" title or a commons.wikimedia.org URL) bring
// their author, licence and source link along. Local photos need --credit and --licence.
// --link keeps a Commons photo on Wikimedia's servers (which allow hotlinking)
// instead of uploading a copy, for when the storage API is not set up.
import { readFileSync, writeFileSync } from 'fs'
import { join, extname, basename } from 'path'
import { uploadFile, publicFileUrl, storageConfigured } from '../lib/storage.js'
import { slugify, transliterate } from './lib/textTools.js'

const GALLERY = join(import.meta.dir, '..', 'data', 'gallery.json')
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php'
const CATEGORIES = ['places', 'food', 'life', 'signs', 'nature', 'traditions']
const MAX_WIDTH = 1600
const TIMEOUT_MS = 30000
// Wikimedia asks API clients to identify themselves
const USER_AGENT = 'LearnBulgarianGallery/1.0 (https://learn.bulgarian.dev)'

function fail(message) {
  console.error(message)
  process.exit(1)
}

function parseArgs(argv) {
  const args = { input: null }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--link') args.link = true
    else if (a.startsWith('--')) args[a.slice(2)] = argv[++i]
    else args.input = a
  }
  return args
}

const stripHtml = html => String(html || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

function commonsTitle(input) {
  if (/^file:/i.test(input)) return `File:${input.slice(5)}`
  const match = input.match(/commons\.wikimedia\.org\/wiki\/(File:[^?#]+)/i)
  return match ? decodeURIComponent(match[1]).replace(/_/g, ' ') : null
}

async function fetchChecked(url) {
  const res = await fetch(url, { headers: { 'user-agent': USER_AGENT }, signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (!res.ok) fail(`Request failed (${res.status}): ${url}`)
  return res
}

async function fromCommons(title, download) {
  const q = new URLSearchParams({
    action: 'query', titles: title, prop: 'imageinfo', format: 'json', formatversion: '2',
    iiprop: 'url|size|mime|extmetadata', iiurlwidth: String(MAX_WIDTH),
  })
  const data = await (await fetchChecked(`${COMMONS_API}?${q}`)).json()
  const info = data.query?.pages?.[0]?.imageinfo?.[0]
  if (!info) fail(`Not found on Wikimedia Commons: ${title}`)
  const meta = info.extmetadata || {}
  const licence = stripHtml(meta.LicenseShortName?.value)
  if (!licence) fail('The file has no licence information, pick another one.')
  const link = info.thumburl || info.url
  const image = download ? await fetchChecked(link) : null
  return {
    link,
    bytes: image && Buffer.from(await image.arrayBuffer()),
    mime: image?.headers.get('content-type') || info.mime,
    credit: stripHtml(meta.Artist?.value) || 'Unknown author',
    licence,
    licenceUrl: meta.LicenseUrl?.value || null,
    source: info.descriptionurl,
    name: title.replace(/^File:/, ''),
    width: info.thumbwidth || info.width,
    height: info.thumbheight || info.height,
  }
}

function fromDisk(path, args) {
  if (!args.credit || !args.licence) fail('Local photos need --credit and --licence.')
  const mime = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }[extname(path).toLowerCase()]
  if (!mime) fail('Use a .jpg, .png or .webp file.')
  return {
    bytes: readFileSync(path),
    mime,
    credit: args.credit,
    licence: args.licence,
    licenceUrl: args.licenceUrl || null,
    source: args.source || null,
    name: basename(path),
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.input || !args.bg || !args.en) {
    fail('Usage: bun run add-photo <"File:Name.jpg" | commons url | local file> --bg "Bulgarian caption" --en "English caption" [--category places]')
  }
  const category = args.category || 'places'
  if (!CATEGORIES.includes(category)) fail(`--category must be one of: ${CATEGORIES.join(', ')}`)
  const title = commonsTitle(args.input)
  if (args.link && !title) fail('--link only works for Wikimedia Commons files.')
  if (!args.link && !storageConfigured()) fail('STORAGE_API_URL and STORAGE_API_KEY must be set in .env.local, or pass --link for a Commons file.')
  const photo = title ? await fromCommons(title, !args.link) : fromDisk(args.input, args)

  const gallery = JSON.parse(readFileSync(GALLERY, 'utf8'))
  let id = args.id || slugify(transliterate(args.bg)) || slugify(args.en)
  for (let n = 2; gallery.some(p => p.id === id); n++) id = `${id.replace(/-\d+$/, '')}-${n}`

  const file = args.link ? null : await uploadFile(photo.bytes, photo.mime, {
    compress: true, format: 'webp', quality: 80, maxWidth: MAX_WIDTH, filename: `gallery--${id}`,
  })

  const entry = {
    id,
    category,
    src: file ? publicFileUrl(file.id) : photo.link,
    width: photo.width || file?.width || null,
    height: photo.height || file?.height || null,
    bg: args.bg,
    en: args.en,
    credit: photo.credit,
    licence: photo.licence,
    licenceUrl: photo.licenceUrl,
    source: photo.source,
  }
  gallery.push(entry)
  writeFileSync(GALLERY, JSON.stringify(gallery, null, 2) + '\n')
  console.log(`Added ${id} (${photo.name}), ${photo.credit}, ${photo.licence}`)
}

main()
