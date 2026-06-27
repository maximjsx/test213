const { Jimp } = require('jimp')
const path = require('path')
const fs = require('fs')

const iconsDir = path.join(__dirname, '..', 'public', 'icons')
const BORDER = 6   // px of breathing room to leave around the visible content
const OUT_SIZE = 128  // final square output size

const files = fs.readdirSync(iconsDir).filter(f => f.endsWith('.png'))

async function trimIcon(file) {
  const filePath = path.join(iconsDir, file)
  const img = await Jimp.read(filePath)
  const w = img.width
  const h = img.height

  // Find bounding box of non-transparent pixels
  let minX = w, minY = h, maxX = 0, maxY = 0
  img.scan((x, y, idx) => {
    const alpha = img.bitmap.data[idx + 3]
    if (alpha > 10) {        // pixel is meaningfully visible
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  })

  if (maxX <= minX || maxY <= minY) {
    console.log(`  skip ${file} (fully transparent?)`)
    return
  }

  // Add breathing room and clamp
  const x0 = Math.max(0, minX - BORDER)
  const y0 = Math.max(0, minY - BORDER)
  const x1 = Math.min(w - 1, maxX + BORDER)
  const y1 = Math.min(h - 1, maxY + BORDER)
  const cw = x1 - x0 + 1
  const ch = y1 - y0 + 1

  // Crop to bounding box
  img.crop({ x: x0, y: y0, w: cw, h: ch })

  // Fit into OUT_SIZE square, preserving aspect ratio, centering
  const side = Math.max(img.width, img.height)
  // Pad to square first
  const square = new Jimp({ width: side, height: side, color: 0x00000000 })
  const dx = Math.floor((side - img.width) / 2)
  const dy = Math.floor((side - img.height) / 2)
  square.composite(img, dx, dy)

  // Resize to OUT_SIZE
  square.resize({ w: OUT_SIZE, h: OUT_SIZE })

  await square.write(filePath)
  console.log(`✓ ${file}  (content ${cw}x${ch} → ${OUT_SIZE}x${OUT_SIZE})`)
}

;(async () => {
  for (const file of files) {
    try {
      await trimIcon(file)
    } catch (e) {
      console.error(`✗ ${file}: ${e.message}`)
    }
  }
  console.log('Done!')
})()
