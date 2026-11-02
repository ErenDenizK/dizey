// Draws the app icons from the Mırtis rig (src/character/mirtis.ts): her head bust at rest on a tile in the app's
// background colour. Colours come from the tokens (--bg and --mirtis-*) and the classes from mirtis.css, so the icon
// can never drift from the cat in the app. Writes public/icons/: icon.svg, apple-touch-icon-180x180.png,
// pwa-192x192.png, pwa-512x512.png, maskable-icon-512x512.png and favicon.ico.
// Usage: node scripts/make-icons.mjs        (Playwright's Chromium; PLAYWRIGHT_CHROMIUM_PATH overrides the binary)
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { drawCat, pose } from '../src/character/mirtis.ts'

const root = new URL('../', import.meta.url)
const read = (path) => readFileSync(new URL(path, root), 'utf8')
const tokens = read('src/styles/tokens.css')
const classes = read('src/character/mirtis.css')

/** The base theme's value of a token: the first definition in tokens.css. */
const token = (name) => {
  const m = tokens.match(new RegExp(`${name}:\\s*([^;]+);`))
  if (!m) throw new Error(`token ${name} not found`)
  return m[1].trim()
}

/** oklch(L C H) to #rrggbb (sRGB, clipped). */
function oklchToHex(value) {
  const [L, C, H] = value
    .match(/oklch\(([^)]+)\)/)[1]
    .split(/\s+/)
    .map(Number)
  const a = C * Math.cos((H * Math.PI) / 180)
  const b = C * Math.sin((H * Math.PI) / 180)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
  const enc = (v) => {
    const c = Math.min(1, Math.max(0, v))
    return Math.round(255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055))
  }
  return `#${lin.map((v) => enc(v).toString(16).padStart(2, '0')).join('')}`
}

const bg = oklchToHex(token('--bg'))
// mirtis.css with its tokens resolved: the classes are all the standalone SVG needs.
const style = `<style>${classes
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .match(/\.mt-[fs]-[\w-]+\s*\{[^}]*\}/g)
  .join('')
  .replace(/var\((--mirtis-[\w-]+)\)/g, (_, name) => token(name))
  .replace(/\s+/g, ' ')}</style>`

const BUST = { w: 86, h: 84, x: 17, y: -1 }

/** The tile: `size` square, the bust centred and `fill` of the width wide. `round` rounds the tile's corners. */
function icon({ size = 512, fill, round = 0, lod = 'full', transparent = false }) {
  const bust = drawCat(pose('rest'), { lod, head: true })
  const inner = bust.slice(bust.indexOf('>') + 1, bust.lastIndexOf('</svg>'))
  const k = (size * fill) / BUST.w
  const tx = (size - BUST.w * k) / 2 - BUST.x * k
  // The bust box is centred on the tile.
  const ty = (size - BUST.h * k) / 2 - BUST.y * k
  const tile =
    transparent && !round ? '' : `<rect width="${size}" height="${size}" rx="${round}" fill="${bg}"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${style}${tile}<g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${k.toFixed(4)})">${inner}</g></svg>`
}

const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
    : { executablePath: '/opt/pw-browsers/chromium' },
)
const page = await browser.newPage()

async function png(svg, size) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
  )
  return page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } })
}

const out = (name, data) => writeFileSync(new URL(`public/icons/${name}`, root), data)

// The mark: rounded tile, bust ~78% of the width.
const mark = icon({ fill: 0.78, round: 112 })
out('icon.svg', mark)
out('pwa-512x512.png', await png(mark, 512))
out('pwa-192x192.png', await png(icon({ size: 192, fill: 0.78, round: Math.round((112 * 192) / 512) }), 192))
// iOS rounds the corners itself, so the tile is full-bleed.
out('apple-touch-icon-180x180.png', await png(icon({ size: 180, fill: 0.78 }), 180))
// Maskable: full-bleed; the whole bust stays inside the central 80 % circle (half-diagonal 60 units of the 86 x 84 box).
out('maskable-icon-512x512.png', await png(icon({ fill: (0.8 * BUST.w) / Math.hypot(BUST.w, BUST.h) }), 512))

// favicon.ico: 16, 32 and 48 px PNG entries, drawn with the small bust (readable at a glance).
const sizes = [16, 32, 48]
const pngs = []
for (const size of sizes)
  pngs.push(await png(icon({ size, fill: 0.92, round: Math.round(size * 0.22), lod: 'small' }), size))
const head = Buffer.alloc(6 + 16 * sizes.length)
head.writeUInt16LE(1, 2)
head.writeUInt16LE(sizes.length, 4)
let offset = head.length
sizes.forEach((size, at) => {
  const e = 6 + 16 * at
  head[e] = size
  head[e + 1] = size
  head.writeUInt16LE(1, e + 4)
  head.writeUInt16LE(32, e + 6)
  head.writeUInt32LE(pngs[at].length, e + 8)
  head.writeUInt32LE(offset, e + 12)
  offset += pngs[at].length
})
out('favicon.ico', Buffer.concat([head, ...pngs]))

await browser.close()
console.log(`icons written (tile ${bg})`)
