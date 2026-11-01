// Settled-frame screenshots of the companion on its anchors: Bugün, Sen, a lesson question, after a right
// answer, and the lesson end. Dark, 375x667 and 390x844.
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
  await shot('1-bugun')
  await page.locator('.dz-tab').nth(2).click()
  await shot('2-sen')
  await page.locator('.dz-tab').nth(0).click()
  await page.waitForTimeout(800)
  await page.goto(`${base}lesson/d1-determinant`)
  await page.waitForSelector('[data-testid="lesson-player"]')
  for (let i = 0; i < 12 && !(await page.locator('.ex-opt').count()); i++) {
    await page.locator('.ls-dock .sh-btn--primary').click()
    await page.waitForTimeout(500)
  }
  await shot('3-lesson-question')
  const options = page.locator('.ex-opt')
  for (let i = 0; i < (await options.count()); i++) {
    await options.nth(i).click()
    await page.waitForTimeout(300)
    if (await page.getByRole('status').filter({ hasText: 'Doğru' }).count()) break
  }
  await shot('4-lesson-right')
  // The end screen: straight to the summary step (the e2e walks the whole lesson).
  await page.goto(`${base}lesson/r2-echelon-forms?step=summary`)
  await page.waitForSelector('[data-testid="lesson-player"]')
  const finish = page.getByRole('button', { name: 'Dersi bitir' })
  await finish.click()
  await page.waitForSelector('[data-testid="lesson-end"]')
  await page.waitForTimeout(2500)
  await shot('5-lesson-end')
  await context.close()
}
await browser.close()
