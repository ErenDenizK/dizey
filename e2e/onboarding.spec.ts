import { expect, type Page, test } from '@playwright/test'

/**
 * The first-run scene (src/shell/Onboarding.tsx): wake, hello, taste (right and wrong), name and exam day, and the
 * hand-off to Yol; the skip path; and the update guard (a learner who already has progress never sees it).
 * The config marks every other spec as onboarded; these start from nothing.
 */
test.use({ storageState: { cookies: [], origins: [] } })

const channel = process.env.E2E_CHANNEL ?? 'production'
const prefix = channel === 'production' ? '' : `${channel}:`
const key = (name: string) => `${prefix}${name}`

const scene = (page: Page) => page.locator('.sh-onb')
const stored = (page: Page, name: string) => page.evaluate((k) => localStorage.getItem(k), key(name))

async function open(page: Page) {
  await page.goto('./')
  await expect(scene(page)).toBeVisible()
}

/** Wake, then wait for the hello beat's own button (it arrives by itself once she has stretched). */
async function toHello(page: Page) {
  await page.locator('.onb-wake').click()
  await expect(page.getByRole('button', { name: 'Tanışalım' })).toBeVisible({ timeout: 8000 })
}

async function toTaste(page: Page) {
  await toHello(page)
  await page.getByRole('button', { name: 'Tanışalım' }).click()
  await expect(page.getByTestId('onb-choice-2')).toBeVisible()
}

async function toYou(page: Page, pick: 2 | 3) {
  await toTaste(page)
  await page.getByTestId(`onb-choice-${pick}`).click()
  await page.getByRole('button', { name: 'Devam' }).click()
  await expect(page.getByTestId('onb-name')).toBeVisible()
}

test('the whole story: wake, hello, a right answer, a name and a day, then Yol with the cat on the dock', async ({
  page,
}) => {
  await open(page)
  // Beat 1: asleep, a mark, no "Geç" yet.
  await expect(page.locator('.onb-mark')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Geç' })).toHaveAttribute('inert', '')
  await toHello(page)
  await expect(page.getByRole('heading', { name: 'Lineer cebir, adım adım' })).toBeVisible()
  await expect(page.getByText('Merhaba! Ben Mırtis.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Geç' })).not.toHaveAttribute('inert', '')

  await page.getByRole('button', { name: 'Tanışalım' }).click()
  await expect(page.getByText('Bir matris, sayılardan bir ızgara.')).toBeVisible()
  await page.getByTestId('onb-choice-2').click()
  await expect(page.getByTestId('onb-choice-2')).toHaveAttribute('data-state', 'right')
  await expect(page.getByText('İşte böyle! Önce soru, sonra anlam.')).toBeVisible()

  await page.getByRole('button', { name: 'Devam' }).click()
  await page.getByTestId('onb-name').fill('Eren')
  await page.getByTestId('onb-date').fill('2026-11-15')
  await page.getByRole('button', { name: 'Yola çık' }).click()

  // The scene dissolves; the one cat that remains is the dock's, and she says her line once.
  await expect(scene(page)).toHaveCount(0, { timeout: 8000 })
  await expect(page.locator('.mt-flyer')).toHaveCount(0)
  await expect(page.getByRole('navigation', { name: 'Bölümler' })).toBeVisible()
  await expect(page.locator('[data-testid=path-dock] svg.mirtis')).toBeVisible()
  await expect(page.getByTestId('mirtis-bubble')).toHaveText('İlk durak burası.')
  await expect(page.getByTestId('mirtis-bubble')).toHaveCount(0, { timeout: 9000 })

  expect(await stored(page, 'dizey.onboarding')).toBe('1')
  expect(JSON.parse((await stored(page, 'dizey.settings')) ?? '{}').examDate).toBe('2026-11-15')
  await page.getByRole('navigation', { name: 'Bölümler' }).getByRole('button', { name: 'Sen' }).click()
  await expect(page.getByTestId('me-name')).toHaveText('Eren')

  // It does not come back.
  await page.reload()
  await expect(page.getByRole('navigation', { name: 'Bölümler' })).toBeVisible()
  await expect(scene(page)).toHaveCount(0)
})

test('reduced motion: the same story, ending in a crossfade to the dock cat, never a flight', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page)
  await toYou(page, 2)
  await page.getByRole('button', { name: 'Yola çık' }).click()
  await expect(page.locator('.mt-flyer')).toHaveCount(0, { timeout: 5000 })
  await expect(scene(page)).toHaveCount(0, { timeout: 8000 })
  await expect(page.locator('[data-testid=path-dock] svg.mirtis')).toBeVisible()
  await expect(page.getByTestId('mirtis-bubble')).toHaveText('İlk durak burası.')
})

test('a wrong answer is never a dead end: the rows are explained and the right choice marked', async ({
  page,
}) => {
  await open(page)
  await toTaste(page)
  await page.getByTestId('onb-choice-3').click()
  await expect(page.getByTestId('onb-choice-3')).toHaveAttribute('data-state', 'wrong')
  await expect(page.getByTestId('onb-choice-2')).toHaveAttribute('data-state', 'right')
  await expect(page.getByText('Yatay sıralar satır: 2 tane.')).toBeVisible()
  await expect(page.locator('.onb-band').first()).toHaveCSS('opacity', '1')
  await page.getByRole('button', { name: 'Devam' }).click()
  await expect(page.getByTestId('onb-name')).toBeVisible()
})

test('"Geç" ends the story at any beat after the first and keeps what was typed', async ({ page }) => {
  await open(page)
  await toYou(page, 2)
  await page.getByTestId('onb-name').fill('Mırmır')
  await page.getByRole('button', { name: 'Geç' }).click()
  await expect(scene(page)).toHaveCount(0, { timeout: 5000 })
  await expect(page.locator('.mt-flyer')).toHaveCount(0)
  expect(await stored(page, 'dizey.onboarding')).toBe('1')
  expect(JSON.parse((await stored(page, 'dizey.profile')) ?? '{}').name).toBe('Mırmır')
  await expect(page.getByRole('navigation', { name: 'Bölümler' })).toBeVisible()
})

test('Escape also leaves the story, from the hello beat on', async ({ page }) => {
  await open(page)
  await page.keyboard.press('Escape')
  await expect(scene(page)).toBeVisible()
  await toHello(page)
  await page.keyboard.press('Escape')
  await expect(scene(page)).toHaveCount(0, { timeout: 5000 })
})

test('on a wide window the scene is a phone-width column on the paper, and a tap beside it leaves', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await open(page)
  await toHello(page)
  const column = await page.locator('.onb-beat[data-beat="hello"]').boundingBox()
  expect(column?.width).toBeLessThanOrEqual(440)
  expect(Math.abs((column?.x ?? 0) + (column?.width ?? 0) / 2 - 640)).toBeLessThanOrEqual(1)
  await page.mouse.click(60, 400)
  await expect(scene(page)).toHaveCount(0, { timeout: 5000 })
  expect(await stored(page, 'dizey.onboarding')).toBe('1')
})

test('every beat fits a 375 x 667 phone: nothing past the edges, targets of 44 px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await open(page)
  const check = async (what: string) => {
    const bad = await page.evaluate(() => {
      const out: string[] = []
      for (const el of document.querySelectorAll<HTMLElement>(
        '.onb-beat button, .onb-beat input, .onb-say, .onb-mat, .onb-intro, .onb-skip',
      )) {
        if (el.closest('[inert]')) continue
        const r = el.getBoundingClientRect()
        if (r.width < 1) continue
        const name = el.className || el.tagName
        if (r.left < -0.5 || r.right > innerWidth + 0.5 || r.bottom > innerHeight + 0.5 || r.top < 0)
          out.push(
            `${name} off screen (${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.right)},${Math.round(r.bottom)})`,
          )
        if (el.matches('button, input') && r.height < 44)
          out.push(`${name} only ${Math.round(r.height)} px high`)
      }
      return out
    })
    expect(bad, what).toEqual([])
  }
  await check('wake')
  await toHello(page)
  await check('hello')
  await page.getByRole('button', { name: 'Tanışalım' }).click()
  await expect(page.getByTestId('onb-choice-2')).toBeVisible()
  await check('taste')
  await page.getByTestId('onb-choice-3').click()
  await expect(page.getByRole('button', { name: 'Devam' })).toBeVisible()
  await page.waitForTimeout(700)
  await check('taste answered')
  await page.getByRole('button', { name: 'Devam' }).click()
  await expect(page.getByTestId('onb-name')).toBeVisible()
  await page.waitForTimeout(700)
  await check('you')
})

test.describe('an update never greets a learner who already has progress', () => {
  const cases: [string, Record<string, string>][] = [
    [
      'lesson progress',
      { 'dizey.lessons': JSON.stringify({ 'm1-reading-a-matrix': { at: null, doneAt: 1, answers: {} } }) },
    ],
    ['a profile name', { 'dizey.profile': JSON.stringify({ v: 1, name: 'Eren' }) }],
    ['the old Safari skip', { 'dizey.onboarding.safari': '1' }],
  ]
  for (const [name, data] of cases) {
    test(name, async ({ page }) => {
      await page.addInitScript(
        ([p, entries]) => {
          for (const [k, v] of Object.entries(entries)) localStorage.setItem(`${p}${k}`, v)
        },
        [prefix, data] as const,
      )
      await page.goto('./')
      await expect(page.getByRole('navigation', { name: 'Bölümler' })).toBeVisible()
      await expect(scene(page)).toHaveCount(0)
      await expect.poll(() => stored(page, 'dizey.onboarding')).toBe('1')
    })
  }
})
