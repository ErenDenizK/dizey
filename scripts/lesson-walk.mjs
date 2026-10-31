// Lesson walk: steps through a lesson at 390x844 and saves one settled screenshot per state (each step's
// landed beat, the options, a wrong pick's verdict, the keypad, the end screen), for side-by-side reviews
// of static layout. Usage: node scripts/lesson-walk.mjs <baseUrl> <lessonId> <theme> <outDir>
import { mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const [base, lessonId = 'd1-determinant', theme = 'dark', out = 'lesson-walk'] = process.argv.slice(2)
await mkdir(out, { recursive: true })
const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {},
)
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  colorScheme: theme,
})
await context.addInitScript(() => localStorage.setItem('dizey.onboarding.safari', '1'))
const page = await context.newPage()
await page.goto(`${base}lesson/${lessonId}`)
await page.waitForTimeout(1500)
const shot = async (name) => page.screenshot({ path: `${out}/${name}.png` })
const primary = page.locator('.ls-dock .sh-btn--primary')
for (let n = 0; n < 40; n++) {
  // Land any running beat.
  for (let k = 0; k < 12 && (await primary.getAttribute('data-soft').catch(() => null)); k++) {
    await primary.click()
    await page.waitForTimeout(250)
  }
  await page.waitForTimeout(600)
  const tag = String(n).padStart(2, '0')
  if (await page.locator('.ls-end').count()) {
    await shot(`${tag}-end`)
    break
  }
  await shot(`${tag}-step`)
  const options = page.locator('.ls-opts .ex-opt')
  if (await options.count()) {
    await options.last().click()
    await page.waitForTimeout(900)
    await shot(`${tag}-picked`)
    if (!(await page.locator('.ls-verdict').count())) {
      const soft = page.locator('.ls-dock .sh-btn--soft')
      if (await soft.count()) await soft.click()
      else await options.first().click()
      await page.waitForTimeout(900)
    }
    await shot(`${tag}-verdict`)
  } else if (await page.locator('.ls-keypad').count()) {
    await page.locator('.ls-key').first().click()
    await page.waitForTimeout(300)
    await shot(`${tag}-keypad`)
    await page.locator('.ls-key--go').click()
    await page.waitForTimeout(900)
    if (!(await page.locator('.ls-verdict').count())) {
      const soft = page.locator('.ls-dock .sh-btn--soft')
      if (await soft.count()) await soft.click()
      await page.waitForTimeout(900)
    }
    await shot(`${tag}-verdict`)
  }
  if (!(await primary.count())) break
  await primary.click()
  await page.waitForTimeout(700)
}
await browser.close()
