// Builds the PWA / home-screen icons from the flag icon: the flag centred on
// the app background, inside the maskable safe zone (inner 80%).
//
//   bun scripts/make-app-icons.js
const { Jimp } = require('jimp')
const path = require('path')

const PUBLIC = path.join(__dirname, '..', 'public')
const BACKGROUND = 0x121825ff
const SIZES = [192, 512]
const FLAG_SHARE = 0.74

async function main() {
  const flag = await Jimp.read(path.join(PUBLIC, 'icons', 'bulgarian_flag.png'))
  for (const size of SIZES) {
    const icon = new Jimp({ width: size, height: size, color: BACKGROUND })
    const inner = Math.round(size * FLAG_SHARE)
    const scaled = flag.clone().resize({ w: inner, h: inner })
    const offset = Math.round((size - inner) / 2)
    icon.composite(scaled, offset, offset)
    await icon.write(path.join(PUBLIC, `icon-${size}.png`))
    console.log(`wrote public/icon-${size}.png`)
  }
}

main()
