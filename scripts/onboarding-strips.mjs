// Settled shots of every first-run beat and frame strips of the wake and the hand-off flight, on the engine's virtual
// clock (so every frame is the frame a phone would show).
//
// Usage: pnpm build && pnpm preview --port 4173 &
//        node scripts/onboarding-strips.mjs <outDir>
// Writes <W>x<H>-<beat>.png for 390x844 and 375x667 (hello also at 1280x800), strip-wake.png and strip-handoff.png.
// Needs ImageMagick's `montage` for the strips. Env: REVIEW_URL, PLAYWRIGHT_CHROMIUM_PATH.
import { execFileSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { chromium } from '@playwright/test'
import { film, hooks } from './jump-audit.mjs'

const home = process.env.REVIEW_URL ?? 'http://localhost:4173/dizey/'
const out = process.argv[2] ?? 'onboarding-shots'
await mkdir(out, { recursive: true })
const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {},
)

async function session(width, height) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    isMobile: width < 600,
    hasTouch: true,
    colorScheme: 'dark',
  })
  await context.addInitScript(() => {
    // `film` samples the DOM each frame; the strips only need the clock stepped.
    window.__dzSample = () => []
    let hook
    Object.defineProperty(window, '__dzReview', {
      configurable: true,
      get: () => hook,
      set: (value) => {
        hook = value
        value.review.pause()
      },
    })
  })
  const page = await context.newPage()
  await page.goto(home)
  await page.waitForFunction(() => window.__dzReview)
  return page
}

const frames = []
const settle = (page) => film(page, frames)
const save = async (page, name) => writeFile(join(out, name), await page.screenshot())

async function walk(width, height, { strips = false, only = null } = {}) {
  const page = await session(width, height)
  const tag = `${width}x${height}`
  const tap = async (selector) => {
    await page.locator(selector).first().click({ timeout: 3000 })
    await settle(page)
  }
  await settle(page)
  if (!only || only === 'wake') await save(page, `${tag}-1-wake.png`)
  // Frame strip of the wake: a shot every 10 frames from the tap.
  const shots = []
  if (strips) {
    let n = 0
    hooks.onFrame = async (p) => {
      if (n % 10 === 0 && shots.length < 12) shots.push(await p.screenshot())
      n++
    }
  }
  await page.locator('.onb-wake').click()
  await settle(page)
  hooks.onFrame = null
  if (strips) tile('wake', shots)
  await save(page, `${tag}-2-hello.png`)
  if (only === 'hello') return page.context().close()
  await tap('button:has-text("Tanışalım")')
  await save(page, `${tag}-3-taste.png`)
  await tap('[data-testid="onb-choice-2"]')
  await save(page, `${tag}-4-taste-right.png`)
  await page.close()
  // The wrong path, on a fresh page.
  const again = await session(width, height)
  const redo = async (selector) => {
    await again.locator(selector).first().click({ timeout: 3000 })
    await settle(again)
  }
  await settle(again)
  await redo('.onb-wake')
  await redo('button:has-text("Tanışalım")')
  await redo('[data-testid="onb-choice-3"]')
  await save(again, `${tag}-4-taste-wrong.png`)
  await redo('button:has-text("Devam")')
  await again.fill('[data-testid="onb-name"]', 'Eren')
  await settle(again)
  await save(again, `${tag}-5-you.png`)
  const flight = []
  if (strips) {
    let n = 0
    hooks.onFrame = async (p) => {
      if (n % 3 === 0 && flight.length < 12) flight.push(await p.screenshot())
      n++
    }
  }
  await again.locator('button:has-text("Yola çık")').click()
  await settle(again)
  hooks.onFrame = null
  if (strips) tile('handoff', flight)
  await save(again, `${tag}-6-yol.png`)
  await again.context().close()
}

function tile(name, shots) {
  const files = shots.map((buffer, i) => {
    const file = join(out, `${name}-${String(i).padStart(2, '0')}.png`)
    execFileSync('convert', ['png:-', file], { input: buffer })
    return file
  })
  execFileSync('montage', [
    ...files,
    '-tile',
    '6x',
    '-geometry',
    '195x422+4+4',
    '-background',
    '#222222',
    join(out, `strip-${name}.png`),
  ])
  console.log(`${name}: ${files.length} frames`)
}

await walk(390, 844, { strips: true })
await walk(375, 667)
await walk(1280, 800, { only: 'hello' })
await browser.close()
