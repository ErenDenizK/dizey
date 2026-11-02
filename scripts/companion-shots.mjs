// Settled-frame screenshots of the companion on its anchors: Yol, Sen, Yol under a lesson's card, a lesson
// question, after a right answer, and the lesson end. Dark, 375x667 and 390x844; REDUCED=1 for reduced motion.
// Usage: pnpm vite --port 5299 &   node scripts/companion-shots.mjs <outDir>
// Env: REVIEW_URL (default http://localhost:5299/dizey/), PLAYWRIGHT_CHROMIUM_PATH.
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { chromium } from '@playwright/test'

const base = process.env.REVIEW_URL ?? 'http://localhost:5299/dizey/'
const out = process.argv[2] ?? 'companion-shots'
await mkdir(out, { recursive: true })
const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {},
)
for (const [w, h] of [
  [375, 667],
  [390, 844],
]) {
  const context = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    colorScheme: 'dark',
    reducedMotion: process.env.REDUCED === '1' ? 'reduce' : 'no-preference',
  })
  await context.addInitScript(() => {
    for (const prefix of ['', 'dev:']) localStorage.setItem(`${prefix}dizey.onboarding.safari`, '1')
  })
  const page = await context.newPage()
  page.on('pageerror', (error) => console.log('pageerror', error.message))
  page.on('console', (m) => m.type() === 'error' && console.log('console', m.text()))
  const shot = async (name) => {
    await page.waitForTimeout(1600)
    await page.screenshot({ path: join(out, `${name}-${w}x${h}.png`) })
  }
  await page.goto(base)
  await page.waitForSelector('.dz-tab')
  await shot('1-yol')
  await page.locator('.dz-tab').nth(1).click()
  await shot('2-sen')
  await page.locator('.dz-tab').nth(0).click()
  await page.waitForTimeout(800)
  // A lesson's card open over Yol: the duo stays on its anchor under the card's scrim.
  await page.locator('.pa-tile:not([data-next])').first().click()
  await shot('3-yol-card')
  await page.goto(`${base}lesson/d1-determinant`)
  await page.waitForSelector('[data-testid="lesson-player"]')
  for (let i = 0; i < 12 && !(await page.locator('.ex-opt').count()); i++) {
    await page.locator('.ls-dock .sh-btn--primary').click()
    await page.waitForTimeout(500)
  }
  await shot('4-lesson-question')
  const options = page.locator('.ex-opt')
  for (let i = 0; i < (await options.count()); i++) {
    await options.nth(i).click()
    await page.waitForTimeout(300)
    if (await page.getByRole('status').filter({ hasText: 'Doğru' }).count()) break
  }
  await shot('5-lesson-right')
  // The end screen: straight to the summary step (the e2e walks the whole lesson).
  await page.goto(`${base}lesson/r2-echelon-forms?step=summary`)
  await page.waitForSelector('[data-testid="lesson-player"]')
  const finish = page.getByRole('button', { name: 'Dersi bitir' })
  await finish.click()
  await page.waitForSelector('[data-testid="lesson-end"]')
  await page.waitForTimeout(2500)
  await shot('6-lesson-end')
  await context.close()
}
await browser.close()
