// Draws the app icons from the Mırtis rig (src/character/mirtis.ts): her head bust at rest on a tile in the app's
// background colour. Colours come from the tokens (--bg and --mirtis-*) and the classes from mirtis.css, so the icon
// can never drift from the cat in the app. Writes public/icons/: icon.svg, apple-touch-icon-180x180.png,
// pwa-192x192.png, pwa-512x512.png, maskable-icon-512x512.png, favicon.ico and og-1200x630.png, and
// public/splash/: the iOS startup images (apple-touch-startup-image), one per current iPhone portrait size.
// Usage: node scripts/make-icons.mjs        (Playwright's Chromium; PLAYWRIGHT_CHROMIUM_PATH overrides the binary)
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
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

async function png(svg, width, height = width) {
  await page.setViewportSize({ width, height })
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}svg{display:block;width:${width}px;height:${height}px}</style>${svg}`,
  )
  return page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width, height } })
}

/** The bust alone (no tile) as a group at (cx, cy) with width `w`, for pages that draw their own background. */
function bustAt(cx, cy, w) {
  const bust = drawCat(pose('rest'), { lod: 'full', head: true })
  const inner = bust.slice(bust.indexOf('>') + 1, bust.lastIndexOf('</svg>'))
  const k = w / BUST.w
  const tx = cx - (BUST.w / 2 + BUST.x) * k
  const ty = cy - (BUST.h / 2 + BUST.y) * k
  return `<g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${k.toFixed(4)})">${inner}</g>`
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

// iOS startup images: --bg full bleed, the bust centred at 28% of the width. Keyed by device size in CSS px.
const SPLASH = [
  [1320, 2868, 3],
  [1290, 2796, 3],
  [1206, 2622, 3],
  [1179, 2556, 3],
  [1170, 2532, 3],
  [1284, 2778, 3],
  [1125, 2436, 3],
  [1242, 2688, 3],
  [828, 1792, 2],
  [750, 1334, 2],
  [640, 1136, 2],
]
mkdirSync(new URL('public/splash/', root), { recursive: true })
for (const [w, h] of SPLASH) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${style}<rect width="${w}" height="${h}" fill="${bg}"/>${bustAt(w / 2, h / 2, w * 0.28)}</svg>`
  writeFileSync(new URL(`public/splash/splash-${w}x${h}.png`, root), await png(svg, w, h))
}

// Social card: the bust on the left third, the name and the tagline in the app's font and ink tokens.
const font = (file, range) =>
  `@font-face{font-family:"Onest";src:url(data:font/woff2;base64,${readFileSync(new URL(`src/styles/fonts/${file}`, root)).toString('base64')}) format("woff2-variations");font-weight:100 900;unicode-range:${range}}`
const ink1 = oklchToHex(token('--ink-1'))
const ink2 = oklchToHex(token('--ink-2'))
const ogFonts = [
  font('onest-latin-wght-normal.woff2', 'U+0000-00FF,U+0131,U+0152-0153,U+2000-206F'),
  font('onest-latin-ext-wght-normal.woff2', 'U+0100-0130,U+0132-0151,U+0154-02BA'),
].join('')
const og = `<style>${ogFonts}html,body{margin:0}body{width:1200px;height:630px;background:${bg};position:relative;font-family:"Onest",sans-serif}
svg{position:absolute;left:0;top:0}.t{position:absolute;left:440px;top:210px}
h1{margin:0;font-size:132px;line-height:1.05;font-weight:700;letter-spacing:-0.02em;color:${ink1}}
p{margin:12px 0 0;font-size:44px;line-height:1.2;font-weight:450;color:${ink2}}</style>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">${style}${bustAt(220, 315, 360)}</svg>
<div class="t"><h1>Dizey</h1><p>Lineer cebir, adım adım.</p></div>`
await page.setViewportSize({ width: 1200, height: 630 })
await page.setContent(og)
await page.evaluate(() => document.fonts.ready)
out('og-1200x630.png', await page.screenshot({ clip: { x: 0, y: 0, width: 1200, height: 630 } }))

await browser.close()
console.log(`icons written (tile ${bg})`)
