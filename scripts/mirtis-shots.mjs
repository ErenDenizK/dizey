// Settled-frame screenshots of Mırtis where she perches (decision 0017, Presence): on Yol's dock card, on Sen, the
// verdict after a right and after a really wrong answer, the lesson end, Yol at 1180x820; plus a frame strip of the
// verdict rise and of the lesson end's hero size glide (engine stepped 50 ms a frame, widths logged).
// Dark, 375x667 and 390x844; REDUCED=1 for reduced motion.
// Usage: pnpm vite --port 5299 &   node scripts/mirtis-shots.mjs <outDir>
// Env: REVIEW_URL (default http://localhost:5299/dizey/), PLAYWRIGHT_CHROMIUM_PATH.
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { chromium } from '@playwright/test'

const base = process.env.REVIEW_URL ?? 'http://localhost:5299/dizey/'
const out = process.argv[2] ?? 'mirtis-shots'
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
  const openQuestion = async () => {
    await page.goto(`${base}lesson/d1-determinant`)
    await page.waitForSelector('[data-testid="lesson-player"]')
    for (let i = 0; i < 12 && !(await page.locator('.ex-opt').count()); i++) {
      await page.locator('.ls-dock .sh-btn--primary').click()
      await page.waitForTimeout(500)
    }
  }
  await page.goto(base)
  await page.waitForSelector('.dz-tab')
  await shot('1-yol-dock-perch')
  await page.locator('.dz-tab').nth(1).click()
  await shot('2-sen-profile')
  await page.locator('.dz-tab').nth(0).click()
  await openQuestion()
  await shot('3-lesson-question-no-cat')
  // Right on the first try.
  await page.locator('.ex-opt', { hasText: /^b/ }).first().click()
  await shot('4-verdict-right')
  // Really wrong: two options that are not the answer, then the answer revealed.
  await openQuestion()
  for (const letter of ['a', 'c']) {
    const option = page.locator('.ex-opt', { hasText: new RegExp(`^${letter}`) }).first()
    if (await option.count()) await option.click().catch(() => {})
    await page.waitForTimeout(600)
  }
  await page.getByRole('button', { name: 'Cevabı göster' }).click()
  await shot('5-verdict-wrong')
  // The verdict rise, frame by frame: the engine is paused and stepped 50 ms at a time; the cat's box is logged.
  await openQuestion()
  await page.evaluate(() => window.__dzReview.review.pause())
  await page.locator('.ex-opt', { hasText: /^b/ }).first().click()
  const rise = []
  for (let f = 0; f < 6; f++) {
    await page.evaluate(() => window.__dzReview.review.step(50))
    const box = await page.locator('.ls-verdict svg.mirtis').boundingBox()
    const sheet = await page.locator('.ls-verdict').boundingBox()
    rise.push(
      `${f * 50 + 50}ms top=${box ? Math.round(box.y - sheet.y) : 'none'} (paws line at ${box ? Math.round(box.y + box.height - sheet.y) : '-'})`,
    )
    await page.screenshot({ path: join(out, `strip-verdict-rise-${f}-${w}x${h}.png`) })
  }
  console.log(`${w}x${h} verdict rise (cat top relative to the sheet's top edge):\n  ${rise.join('\n  ')}`)
  await page.evaluate(() => window.__dzReview.review.resume())
  // The end screen: straight to the summary step (the e2e walks the whole lesson).
  await page.goto(`${base}lesson/r2-echelon-forms?step=summary`)
  await page.waitForSelector('[data-testid="lesson-player"]')
  await page.getByRole('button', { name: 'Dersi bitir' }).click()
  await page.waitForSelector('[data-testid="lesson-end"]')
  await page.waitForTimeout(2500)
  await shot('6-lesson-end-hero')
  // Hero size glide when a rozet shows: seed one finished lesson (a first-lesson rozet to show), step the engine
  // until the stage turns to a badge, then 50 ms a frame.
  await page.evaluate(() => {
    for (const prefix of ['', 'dev:']) {
      localStorage.setItem(
        `${prefix}dizey.lessons`,
        JSON.stringify({ 'm1-reading-a-matrix': { at: null, doneAt: 1700000000000, answers: {} } }),
      )
      localStorage.removeItem(`${prefix}dizey.badges`)
    }
  })
  await page.goto(`${base}lesson/r2-echelon-forms?step=summary`)
  await page.waitForSelector('[data-testid="lesson-player"]')
  await page.getByRole('button', { name: 'Dersi bitir' }).click()
  await page.waitForSelector('[data-testid="lesson-end"]')
  await page.evaluate(() => window.__dzReview.review.pause())
  const widthOf = () =>
    page.locator('.ls-end svg.ls-duo').evaluate((n) => Math.round(n.getBoundingClientRect().width * 10) / 10)
  const hasBadge = () => page.locator('.ls-end__stage[data-badge]').count()
  let at = 0
  while (!(await hasBadge()) && at < 12000) {
    await page.evaluate(() => window.__dzReview.review.step(100))
    at += 100
  }
  if (await hasBadge()) {
    const glide = []
    for (let f = 0; f < 8; f++) {
      await page.evaluate(() => window.__dzReview.review.step(50))
      glide.push(await widthOf())
      await page.screenshot({ path: join(out, `strip-hero-glide-${f}-${w}x${h}.png`) })
    }
    console.log(`${w}x${h} hero width per 50 ms with a rozet: ${glide.join(' ')}`)
    await page.evaluate(() => window.__dzReview.review.step(3000))
    await page.screenshot({ path: join(out, `7-lesson-end-badge-${w}x${h}.png`) })
  } else console.log(`${w}x${h}: no rozet on this lesson end`)
  await page.evaluate(() => window.__dzReview.review.resume())
  // Tapping the avatar purrs (Sen).
  await page.goto(base)
  await page.waitForSelector('.dz-tab')
  await page.locator('.dz-tab').nth(1).click()
  await page.waitForTimeout(800)
  await page.getByRole('button', { name: 'Mırtis’i sev' }).click()
  await page.waitForTimeout(700)
  await page.screenshot({ path: join(out, `7-8-sen-purr-${w}x${h}.png`) })
  await context.close()
}
// Wide: Yol at 1180x820 (the dock card in the stage grid's side column, the cat on its top edge).
{
  const context = await browser.newContext({
    viewport: { width: 1180, height: 820 },
    deviceScaleFactor: 1,
    colorScheme: 'dark',
  })
  await context.addInitScript(() => {
    for (const prefix of ['', 'dev:']) localStorage.setItem(`${prefix}dizey.onboarding.safari`, '1')
  })
  const page = await context.newPage()
  await page.goto(base)
  await page.waitForSelector('.dz-tab')
  await page.waitForTimeout(2500)
  await page.screenshot({ path: join(out, '9-yol-wide-1180x820.png') })
  await context.close()
}
await browser.close()
