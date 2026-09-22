import fs from 'fs'
import path from 'path'
import { PDFDocument, rgb, setCharacterSpacing } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import QRCode from 'qrcode'
import { formatCertificateDate } from './certificates'

const W = 841.89
const H = 595.28

const INK = rgb(0.07, 0.1, 0.15)
const MUTED = rgb(0.4, 0.46, 0.55)
const TEAL = rgb(0, 0.6, 0.5)
const TEAL_DARK = rgb(0.02, 0.3, 0.27)
const PAPER = rgb(0.985, 0.98, 0.965)
const LINE = rgb(0.84, 0.86, 0.87)
const FLAG_GREEN = rgb(0, 0.59, 0.43)
const FLAG_RED = rgb(0.84, 0.15, 0.07)

const FONT_DIR = path.join(process.cwd(), 'lib', 'fonts')
let fontBytes

function loadFonts() {
  fontBytes ??= {
    regular: fs.readFileSync(path.join(FONT_DIR, 'Nunito-SemiBold.ttf')),
    black: fs.readFileSync(path.join(FONT_DIR, 'Nunito-Black.ttf')),
  }
  return fontBytes
}

let glyphFont

// Names are printed with Nunito, so reject scripts it has no glyphs for
// instead of shipping a certificate full of empty boxes.
export function canRender(text) {
  glyphFont ??= fontkit.create(loadFonts().black)
  return [...text].every(ch => ch === ' ' || glyphFont.hasGlyphForCodePoint(ch.codePointAt(0)))
}

function textWidth(font, text, size, spacing) {
  return font.widthOfTextAtSize(text, size) + spacing * Math.max(0, text.length - 1)
}

function drawCentered(page, text, { y, font, size, color, spacing = 0, x = W / 2 }) {
  const width = textWidth(font, text, size, spacing)
  if (spacing) page.pushOperators(setCharacterSpacing(spacing))
  page.drawText(text, { x: x - width / 2, y, font, size, color })
  if (spacing) page.pushOperators(setCharacterSpacing(0))
}

// Shrinks long names until they fit the line instead of overflowing the border
function fittedSize(font, text, maxSize, maxWidth) {
  let size = maxSize
  while (size > 18 && font.widthOfTextAtSize(text, size) > maxWidth) size -= 1
  return size
}

function drawFrame(page) {
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: PAPER })
  page.drawRectangle({ x: 22, y: 22, width: W - 44, height: H - 44, borderColor: TEAL, borderWidth: 3 })
  page.drawRectangle({ x: 32, y: 32, width: W - 64, height: H - 64, borderColor: LINE, borderWidth: 0.8 })
  const band = { x: 32, width: W - 64, height: 3.5 }
  page.drawRectangle({ ...band, y: H - 32 - 3.5, color: rgb(1, 1, 1) })
  page.drawRectangle({ ...band, y: H - 32 - 7, color: FLAG_GREEN })
  page.drawRectangle({ ...band, y: H - 32 - 10.5, color: FLAG_RED })
}

function drawSeal(page, { x, y, label, fonts }) {
  page.drawCircle({ x, y, size: 44, color: TEAL })
  page.drawCircle({ x, y, size: 38, borderColor: rgb(1, 1, 1), borderWidth: 1.2 })
  const size = fittedSize(fonts.black, label, 22, 58)
  drawCentered(page, label, { x, y: y - size * 0.35 + 5, font: fonts.black, size, color: rgb(1, 1, 1) })
  drawCentered(page, 'VERIFIED', { x, y: y - 20, font: fonts.black, size: 6.5, color: rgb(1, 1, 1), spacing: 1.2 })
}

function drawQr(page, text, { x, y, size }) {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: 'M' })
  const cell = size / modules.size
  for (let r = 0; r < modules.size; r++) {
    for (let c = 0; c < modules.size; c++) {
      if (!modules.get(r, c)) continue
      page.drawRectangle({ x: x + c * cell, y: y + size - (r + 1) * cell, width: cell + 0.05, height: cell + 0.05, color: INK })
    }
  }
}

function drawBody(page, cert, fonts) {
  drawCentered(page, 'LEARN BULGARIAN', { y: H - 88, font: fonts.black, size: 13, color: TEAL, spacing: 3 })
  drawCentered(page, 'CERTIFICATE OF ACHIEVEMENT', { y: H - 142, font: fonts.black, size: 26, color: INK, spacing: 2.5 })
  drawCentered(page, 'This certifies that', { y: H - 190, font: fonts.regular, size: 14, color: MUTED })

  const nameSize = fittedSize(fonts.black, cert.name, 44, W - 220)
  drawCentered(page, cert.name, { y: H - 252, font: fonts.black, size: nameSize, color: TEAL_DARK })
  page.drawLine({ start: { x: W / 2 - 200, y: H - 270 }, end: { x: W / 2 + 200, y: H - 270 }, thickness: 1, color: LINE })

  drawCentered(page, 'has successfully completed', { y: H - 300, font: fonts.regular, size: 14, color: MUTED })
  drawCentered(page, `${cert.title} · ${cert.level}`, { y: H - 336, font: fonts.black, size: 24, color: INK })
  const scope = `${cert.topics} ${cert.topics === 1 ? 'topic' : 'topics'} · ${cert.lessons} lessons · ${cert.blurb}`
  drawCentered(page, scope, { y: H - 362, font: fonts.regular, size: 11.5, color: MUTED })
}

function drawFooter(page, cert, { verifyUrl, fingerprint }, fonts) {
  const left = 78
  const label = (text, y) => page.drawText(text, { x: left, y, font: fonts.black, size: 8, color: MUTED })
  const value = (text, y) => page.drawText(text, { x: left, y, font: fonts.regular, size: 12, color: INK })
  label('ISSUED', 168)
  value(formatCertificateDate(cert.issuedAt), 152)
  label('CERTIFICATE ID', 124)
  value(cert.id, 108)
  label('SIGNATURE (ED25519)', 80)
  value(fingerprint, 64)

  drawSeal(page, { x: W / 2, y: 118, label: cert.seal, fonts })

  const qrSize = 78
  const qrX = W - 78 - qrSize
  drawQr(page, verifyUrl, { x: qrX, y: 88, size: qrSize })
  drawCentered(page, 'SCAN TO VERIFY', { x: qrX + qrSize / 2, y: 72, font: fonts.black, size: 7, color: MUTED, spacing: 1 })
  const shortUrl = verifyUrl.replace(/^https?:\/\//, '')
  const urlSize = fittedSize(fonts.regular, shortUrl, 8, 190)
  const urlWidth = fonts.regular.widthOfTextAtSize(shortUrl, urlSize)
  page.drawText(shortUrl, { x: qrX + qrSize - urlWidth, y: 58, font: fonts.regular, size: urlSize, color: MUTED })
}

// cert: { id, name, title, level, seal, blurb, topics, lessons, issuedAt }
// The signed token rides in the PDF keywords so a file can be checked
// offline against the public key, even without the registry.
export async function renderCertificatePdf(cert, { token, verifyUrl, fingerprint }) {
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  const bytes = loadFonts()
  const fonts = {
    regular: await doc.embedFont(bytes.regular, { subset: true }),
    black: await doc.embedFont(bytes.black, { subset: true }),
  }

  const issued = new Date(cert.issuedAt)
  doc.setTitle(`${cert.title} certificate: ${cert.name}`)
  doc.setAuthor('Learn Bulgarian')
  doc.setCreator('learn.bulgarian.dev')
  doc.setSubject(`Verify at ${verifyUrl}`)
  doc.setKeywords([token])
  doc.setCreationDate(issued)
  doc.setModificationDate(issued)

  const page = doc.addPage([W, H])
  drawFrame(page)
  drawBody(page, cert, fonts)
  drawFooter(page, cert, { verifyUrl, fingerprint }, fonts)

  return Buffer.from(await doc.save({ updateFieldAppearances: false }))
}

export async function readEmbeddedToken(bytes) {
  const doc = await PDFDocument.load(bytes, { updateMetadata: false, ignoreEncryption: true })
  const keywords = doc.getKeywords() || ''
  return keywords.split(/\s+/).find(k => k.includes('.')) || null
}
