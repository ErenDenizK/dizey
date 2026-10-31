import { expect, type Page, test } from '@playwright/test'

const channel = process.env.E2E_CHANNEL ?? 'production'
const prefix = channel === 'production' ? '' : `${channel}:`

/** Counts the oscillators the app starts, so a test can tell whether a sound was played. */
async function openApp(page: Page, path: string, settings?: object) {
  await page.addInitScript(
    ({ prefix, settings }) => {
      localStorage.setItem(`${prefix}dizey.onboarding.safari`, '1')
      if (settings) localStorage.setItem(`${prefix}dizey.settings`, JSON.stringify(settings))
      const counter = window as unknown as { oscillators: number }
      counter.oscillators = 0
      const create = BaseAudioContext.prototype.createOscillator
      BaseAudioContext.prototype.createOscillator = function (this: BaseAudioContext) {
        counter.oscillators++
        return create.call(this)
      }
    },
    { prefix, settings },
  )
  await page.goto(path)
}

const oscillators = (page: Page) =>
  page.evaluate(() => (window as unknown as { oscillators: number }).oscillators)

/** Walks a few steps of the first lesson; each beat frame and answer is a cue. */
async function walkLesson(page: Page) {
  await expect(page.getByTestId('lesson-player')).toBeVisible()
  for (let i = 0; i < 4; i++) {
    const next = page.locator('.ls-dock .sh-btn--primary')
    if (!(await next.isVisible())) break
    await next.click()
    await page.waitForTimeout(1500)
  }
}

test('sounds play by default and the Me switch turns them off', async ({ page }) => {
  await openApp(page, './lesson/d1-determinant')
  await walkLesson(page)
  await expect.poll(() => oscillators(page)).toBeGreaterThan(0)

  await page.goto('./me')
  const toggle = page.getByRole('switch', { name: 'Sesler' })
  await expect(toggle).toBeChecked()
  await toggle.click()
  await expect(toggle).not.toBeChecked()
  await page.reload()
  await expect(page.getByRole('switch', { name: 'Sesler' })).not.toBeChecked()
})

test('no sound is made while lesson sounds are off', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await openApp(page, './lesson/d1-determinant', { sound: false })
  await walkLesson(page)
  expect(await oscillators(page)).toBe(0)
  expect(errors).toEqual([])
})

test('turning lesson sounds on plays a preview', async ({ page }) => {
  await openApp(page, './me', { sound: false })
  const toggle = page.getByRole('switch', { name: 'Sesler' })
  await toggle.click()
  await expect(toggle).toBeChecked()
  await expect.poll(() => oscillators(page)).toBeGreaterThan(0)
})

test('the interface sounds: a tab switch and a switch both play', async ({ page }) => {
  await openApp(page, './')
  // The first tap unlocks audio; later taps sound.
  await page.locator('.dz-tab').nth(1).click()
  const before = await oscillators(page)
  await page.locator('.dz-tab').last().click()
  await expect.poll(() => oscillators(page)).toBeGreaterThan(before)
  const afterTab = await oscillators(page)
  await page.getByRole('switch', { name: 'Titreşim' }).click()
  await expect.poll(() => oscillators(page)).toBeGreaterThan(afterTab)
})

test('the sound lab plays every sound without an error', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await openApp(page, './lab/sounds')
  const rows = page.locator('[data-testid^="sound-"]')
  const count = await rows.count()
  expect(count).toBeGreaterThanOrEqual(17)
  for (let i = 0; i < count; i++) {
    const before = await oscillators(page)
    await rows.nth(i).click()
    await expect.poll(() => oscillators(page)).toBeGreaterThan(before)
  }
  expect(errors).toEqual([])
})

test('the exam rehearsal stays silent', async ({ page }) => {
  await openApp(page, './exam')
  await page.getByRole('button', { name: 'Başlat' }).first().click()
  await page.locator('.ex-run').waitFor()
  const options = page.locator('.ex-run .ex-opt')
  // The first tap unlocks audio; neither it nor the next answer may sound.
  await options.nth(0).click()
  const before = await oscillators(page)
  await options.nth(1).click()
  await page.waitForTimeout(300)
  expect(await oscillators(page)).toBe(before)
})
