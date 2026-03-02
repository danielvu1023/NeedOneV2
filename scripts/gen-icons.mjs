// Regenerate PWA icons with the ball filling more of the canvas.
// Run: node scripts/gen-icons.mjs
import sharp from 'sharp'
import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '../public/icons')

// Original SVG paths, viewBox tightened from "0 0 82 72" to "10 5 62 62"
// so the ball fills ~90% of the canvas instead of ~65%.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="10 5 62 62">
  <g fill="#0f1e0c">
    <path d="M66.8 36.2 C 66.8 50.3 55.4 61.7 41.3 61.7 27.3 61.7 15.9 50.3 15.9 36.2 15.9 22.2 27.3 10.8 41.3 10.8 55.4 10.8 66.8 22.2 66.8 36.2 Z M32.2 60.5  M59.2 36.1 C 59.2 26 51.1 17.9 41 17.9 31 17.9 22.8 26 22.8 36.1 22.8 46.1 31 54.3 41 54.3 51.1 54.3 59.2 46.1 59.2 36.1 Z M49.7 51.9 "/>
  </g>
  <g fill="#98c52c">
    <path d="M63.1 36 C 63.1 48.2 53.2 58.1 41 58.1 28.8 58.1 18.9 48.2 18.9 36 18.9 23.8 28.8 14 41 14 53.2 14 63.1 23.8 63.1 36 Z M33.2 56.9  m 9.4 -20 c 1 -1.7 -1.3 -3.6 -2.7 -2.2 -1.2 1.2 -0.4 3.3 1.1 3.3 0.5 0 1.2 -0.5 1.6 -1.1 z "/>
  </g>
  <g fill="#ccfe48">
    <path d="M62.1 36 C 62.1 47.7 52.7 57.2 41 57.2 29.3 57.2 19.9 47.7 19.9 36 19.9 24.4 29.3 14.9 41 14.9 52.7 14.9 62.1 24.4 62.1 36 Z M32.4 55.6  M56.9 36.1 C 56.9 27.3 49.8 20.2 41 20.2 32.2 20.2 25.1 27.3 25.1 36.1 25.1 44.9 32.2 52 41 52 49.8 52 56.9 44.9 56.9 36.1 Z M47.9 50.5 "/>
    <path d="M54.7 36 C 54.7 43.6 48.5 49.7 40.9 49.7 33.3 49.7 27.2 43.6 27.2 36 27.2 28.4 33.3 22.2 40.9 22.2 48.5 22.2 54.7 28.4 54.7 36 Z M34.2 48  M48.9 36 C 48.9 31.7 45.4 28.1 41 28.1 36.7 28.1 33.1 31.7 33.1 36 33.1 40.4 36.7 43.9 41 43.9 45.4 43.9 48.9 40.4 48.9 36 Z M46.5 41.5 "/>
    <path d="M 37 40 c -1.1 -1.1 -2 -2.9 -2 -4 0 -2.6 3.4 -6 6 -6 2.6 0 6 3.4 6 6 0 1.1 -0.9 2.9 -2 4 -1.1 1.1 -2.9 2 -4 2 -1.1 0 -2.9 -0.9 -4 -2 z "/>
  </g>
</svg>`

const svgBuffer = Buffer.from(svg)

async function generate(size, filename, { background } = {}) {
  let pipeline = sharp(svgBuffer, { density: Math.ceil(size * 72 / 62) })
    .resize(size, size)
  if (background) {
    pipeline = pipeline.flatten({ background })
  }
  await pipeline.png().toFile(path.join(outDir, filename))
  console.log(`✓ ${filename} (${size}×${size})`)
}

await generate(192, 'icon-192.png')
await generate(512, 'icon-512.png')
await generate(32,  'favicon-32.png')
await generate(180, 'apple-touch-icon.png', { background: '#ffffff' })

console.log('Done.')
