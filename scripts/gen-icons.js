// Generates PWA icons from brand/logo.svg
// Usage: node scripts/gen-icons.js
// Requires: npm install -D sharp

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const svgSrc = fs.readFileSync(path.join(__dirname, '../brand/logo.svg'))
const outDir = path.join(__dirname, '../public/icons')
fs.mkdirSync(outDir, { recursive: true })

async function makeIcon(size) {
  const pad = Math.round(size * 0.12)
  const logoSize = size - pad * 2

  // Render SVG to PNG, fit inside logoSize square with transparent bg
  const logoBuf = await sharp(svgSrc)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()

  // Composite onto white square
  await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .composite([{ input: logoBuf, gravity: 'center' }])
    .png()
    .toFile(path.join(outDir, `icon-${size}.png`))

  console.log(`✓ public/icons/icon-${size}.png`)
}

Promise.all([makeIcon(192), makeIcon(512)])
  .then(() => console.log('Done.'))
  .catch((e) => { console.error(e.message); process.exit(1) })
