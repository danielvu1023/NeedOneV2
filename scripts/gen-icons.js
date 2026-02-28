// Generates solid green placeholder PWA icons
const zlib = require('zlib')
const fs = require('fs')

// CRC32 table
const crcTable = new Uint32Array(256)
for (let i = 0; i < 256; i++) {
  let c = i
  for (let j = 0; j < 8; j++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
  }
  crcTable[i] = c
}

function crc32(buf) {
  let crc = 0xFFFFFFFF
  for (const byte of buf) {
    crc = crcTable[(crc ^ byte) & 0xFF] ^ (crc >>> 8)
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeBytes = Buffer.from(type)
  const crcVal = Buffer.alloc(4)
  crcVal.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])))
  return Buffer.concat([len, typeBytes, data, crcVal])
}

function makePNG(size, r, g, b) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(size, 0)
  ihdrData.writeUInt32BE(size, 4)
  ihdrData[8] = 8  // bit depth
  ihdrData[9] = 2  // RGB color type
  ihdrData[10] = 0
  ihdrData[11] = 0
  ihdrData[12] = 0

  // Raw pixel data: 1 filter byte + width*3 RGB bytes per row
  const rowSize = 1 + size * 3
  const raw = Buffer.alloc(size * rowSize)
  for (let y = 0; y < size; y++) {
    raw[y * rowSize] = 0  // filter type: None
    for (let x = 0; x < size; x++) {
      raw[y * rowSize + 1 + x * 3] = r
      raw[y * rowSize + 2 + x * 3] = g
      raw[y * rowSize + 3 + x * 3] = b
    }
  }

  const compressed = zlib.deflateSync(raw)

  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdrData),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

// #22C55E = rgb(34, 197, 94) — NeedOne green (matches theme_color in manifest.json)
fs.mkdirSync('public/icons', { recursive: true })
fs.writeFileSync('public/icons/icon-192.png', makePNG(192, 34, 197, 94))
fs.writeFileSync('public/icons/icon-512.png', makePNG(512, 34, 197, 94))
console.log('Generated public/icons/icon-192.png and public/icons/icon-512.png')
