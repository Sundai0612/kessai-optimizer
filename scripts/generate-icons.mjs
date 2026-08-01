// アプリのアイコン画像（PNG）を作り直すためのスクリプトです。
// 追加のライブラリなしで動きます。実行方法： node scripts/generate-icons.mjs
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public')

const BG = [31, 41, 55] // #1f2937
const FG = [255, 255, 255]

/** 点が線分からどれだけ離れているか */
function distanceToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  const lengthSquared = dx * dx + dy * dy
  const t =
    lengthSquared === 0
      ? 0
      : Math.min(1, Math.max(0, ((px - x1) * dx + (py - y1) * dy) / lengthSquared))
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
}

/** 円記号（¥）の形を、0〜1に正規化した座標で定義する */
const STROKE = 0.078
const STROKES = [
  [0.255, 0.245, 0.5, 0.5], // 左上から中央へ
  [0.745, 0.245, 0.5, 0.5], // 右上から中央へ
  [0.5, 0.47, 0.5, 0.775], // 中央の縦棒
  [0.295, 0.6, 0.705, 0.6], // 上の横棒
  [0.295, 0.705, 0.705, 0.705], // 下の横棒
]

function isInsideGlyph(x, y) {
  return STROKES.some(([x1, y1, x2, y2]) => distanceToSegment(x, y, x1, y1, x2, y2) <= STROKE / 2)
}

/** 4倍の細かさで描いて縮小することで、輪郭を滑らかにする */
const SUPERSAMPLE = 4

function renderRgba(size) {
  const rgba = Buffer.alloc(size * size * 4)
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let hits = 0
      for (let sy = 0; sy < SUPERSAMPLE; sy++) {
        for (let sx = 0; sx < SUPERSAMPLE; sx++) {
          const x = (px + (sx + 0.5) / SUPERSAMPLE) / size
          const y = (py + (sy + 0.5) / SUPERSAMPLE) / size
          if (isInsideGlyph(x, y)) hits++
        }
      }
      const coverage = hits / (SUPERSAMPLE * SUPERSAMPLE)
      const offset = (py * size + px) * 4
      for (let channel = 0; channel < 3; channel++) {
        rgba[offset + channel] = Math.round(
          BG[channel] + (FG[channel] - BG[channel]) * coverage,
        )
      }
      rgba[offset + 3] = 255
    }
  }
  return rgba
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(typeAndData))
  return Buffer.concat([length, typeAndData, crc])
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function encodePng(size, rgba) {
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0 // フィルタなし
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // ビット深度
  ihdr[9] = 6 // カラータイプ: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync(OUT_DIR, { recursive: true })

for (const [name, size] of [
  ['pwa-192x192.png', 192],
  ['pwa-512x512.png', 512],
  ['apple-touch-icon.png', 180],
]) {
  const file = resolve(OUT_DIR, name)
  writeFileSync(file, encodePng(size, renderRgba(size)))
  console.log(`作成しました: public/${name} (${size}x${size})`)
}
