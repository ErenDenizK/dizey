// Settled-frame screenshots of Birim where it lives: on Yol's current tile, on Sen, Yol under a lesson's card, a
// lesson question, Birim in the verdict after a right answer, and Birim on the lesson end. Dark, 375x667 and 390x844; REDUCED=1 for reduced motion.
// Usage: pnpm vite --port 5299 &   node scripts/birim-shots.mjs <outDir>
// Env: REVIEW_URL (default http://localhost:5299/dizey/), PLAYWRIGHT_CHROMIUM_PATH.
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { chromium } from '@playwright/test'

const base = process.env.REVIEW_URL ?? 'http://localhost:5299/dizey/'
const out = process.argv[2] ?? 'birim-shots'
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
  await shot('1-birim-yol-tile')
  await page.locator('.dz-tab').nth(1).click()
  await shot('2-birim-sen-profile')
  await page.locator('.dz-tab').nth(0).click()
  await page.waitForTimeout(800)
  // A lesson's card open over Yol: Birim stays on its tile under the card's scrim.
  await page.locator('.pa-tile:not([data-next])').first().click()
  await shot('3-birim-yol-under-card')
  await page.goto(`${base}lesson/d1-determinant`)
  await page.waitForSelector('[data-testid="lesson-player"]')
  for (let i = 0; i < 12 && !(await page.locator('.ex-opt').count()); i++) {
    await page.locator('.ls-dock .sh-btn--primary').click()
    await page.waitForTimeout(500)
  }
  await shot('4-lesson-question-no-birim')
  // Right on the first try: Birim is happy in the verdict.
  await page.locator('.ex-opt', { hasText: /^b/ }).first().click()
  await shot('5-birim-verdict-happy')
  // The answer revealed instead: Birim is caught out (oops) and eases back to rest.
  await page.goto(`${base}lesson/d1-determinant`)
  await page.waitForSelector('[data-testid="lesson-player"]')
  for (let i = 0; i < 12 && !(await page.locator('.ex-opt').count()); i++) {
    await page.locator('.ls-dock .sh-btn--primary').click()
    await page.waitForTimeout(500)
  }
  await page.getByRole('button', { name: 'Cevabı göster' }).click()
  await page.waitForTimeout(250)
  await page.screenshot({ path: join(out, `5b-birim-verdict-oops-${w}x${h}.png`) })
  // The end screen: straight to the summary step (the e2e walks the whole lesson).
  await page.goto(`${base}lesson/r2-echelon-forms?step=summary`)
  await page.waitForSelector('[data-testid="lesson-player"]')
  const finish = page.getByRole('button', { name: 'Dersi bitir' })
  await finish.click()
  await page.waitForSelector('[data-testid="lesson-end"]')
  await page.waitForTimeout(2500)
  await shot('6-birim-lesson-end-hero')
  await context.close()
}
await browser.close()
