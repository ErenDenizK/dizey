import { expect, type Page, test } from '@playwright/test'

/**
 * Wide-screen guards: the phone never changes under 600 px; from 600 px the path walks four columns and the dock
 * stays the bottom card (max 560, centred); from 1000 px "what to do" lives in a card bottom right and a picked
 * lesson swaps into it. Measured on a resting app (reduced motion).
 */

const channel = process.env.E2E_CHANNEL ?? 'production'
const prefix = channel === 'production' ? '' : `${channel}:`
const GUTTER = 16

const done = (id: string, n: number) => [id, { at: null, doneAt: 1700000000000 + n, answers: {} }]
const LESSONS = JSON.stringify(
  Object.fromEntries(
    ['m1-reading-a-matrix', 'm2-matrix-types', 'm4-matrix-arithmetic', 'm5-matrix-product'].map(done),
  ),
)

async function open(page: Page, width: number, height: number) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width, height })
  await page.addInitScript(
    ([p, lessons]) => {
      localStorage.setItem(`${p}dizey.onboarding.safari`, '1')
      localStorage.setItem(`${p}dizey.profile`, JSON.stringify({ v: 1, name: 'Eren' }))
      localStorage.setItem(
        `${p}dizey.exam.outcomes`,
        JSON.stringify({ 'v1-2024s-01': { correct: false, given: 'a', at: 1 } }),
      )
      localStorage.setItem(`${p}dizey.lessons`, lessons as string)
    },
    [prefix, LESSONS],
  )
  await page.goto('./')
  await expect(page.getByRole('navigation', { name: 'Bölümler' })).toBeVisible()
  await page.waitForTimeout(600)
}

const pane = (page: Page) => page.locator('.sh-pane:not([inert])')
const box = async (page: Page, selector: string) => {
  const b = await page.locator(selector).first().boundingBox()
  if (!b) throw new Error(`no box for ${selector}`)
  return b
}
/** The distinct x centres of the path's nodes. */
const columnsOf = (page: Page) =>
  page.evaluate(() => {
    const xs = [...document.querySelectorAll('.sh-pane:not([inert]) .ph-slot')].map((el) => {
      const r = el.getBoundingClientRect()
      return Math.round(r.left)
    })
    return [...new Set(xs)].length
  })
const noHorizontalScroll = (page: Page) =>
  page.evaluate(
    () =>
      document.documentElement.scrollWidth <= window.innerWidth &&
      [...document.querySelectorAll('.dz-screen')].every((el) => el.scrollWidth <= el.clientWidth),
  )

test.describe('wide layout', () => {
  test('390 px is the phone: two columns, the dock at the bottom, full width minus the gutters', async ({
    page,
  }) => {
    await open(page, 390, 844)
    expect(await columnsOf(page)).toBe(2)
    const dock = await box(page, '.sh-pane:not([inert]) .dz-card.ph-next')
    expect(dock.x).toBeCloseTo(GUTTER, 0)
    expect(dock.width).toBeCloseTo(390 - 2 * GUTTER, 0)
    expect(await noHorizontalScroll(page)).toBe(true)
  })

  test('820 x 1180: four columns, a bottom dock at most 560 wide and centred, the tab bar centred', async ({
    page,
  }) => {
    await open(page, 820, 1180)
    expect(await columnsOf(page)).toBe(4)
    const dock = await box(page, '.sh-pane:not([inert]) .dz-card.ph-next')
    expect(dock.width).toBeLessThanOrEqual(560.5)
    expect(dock.x + dock.width / 2).toBeCloseTo(410, 0)
    const bar = await box(page, '.dz-tabbar')
    expect(bar.x + bar.width / 2).toBeCloseTo(410, 0)
    expect(dock.y + dock.height).toBeLessThanOrEqual(bar.y + 1)
    expect(await noHorizontalScroll(page)).toBe(true)
  })

  test('1180 x 820: four columns, the dock card bottom right level with the tab bar, clear of the path', async ({
    page,
  }) => {
    await open(page, 1180, 820)
    expect(await columnsOf(page)).toBe(4)
    const card = await box(page, '.sh-pane:not([inert]) .dz-card.ph-next')
    const bar = await box(page, '.dz-tabbar')
    expect(card.x + card.width).toBeCloseTo(1180 - GUTTER, 0)
    expect(card.width).toBeCloseTo(360, 0)
    expect(card.y + card.height).toBeCloseTo(bar.y + bar.height, 0)
    // The bar is phone width, centred under the left area.
    expect(bar.width).toBeCloseTo(360, 0)
    expect(bar.x + bar.width / 2).toBeCloseTo((1180 - (360 + 2 * GUTTER)) / 2, 0)
    // No node touches the card.
    const overlaps = await page.evaluate(
      ([x, y]) =>
        [
          ...document.querySelectorAll('.sh-pane:not([inert]) .pa-tile, .sh-pane:not([inert]) .pa-test'),
        ].filter((el) => {
          const r = el.getBoundingClientRect()
          return r.right > (x as number) && r.bottom > (y as number) && r.top < 820 && r.left < 1180
        }).length,
      [card.x, card.y],
    )
    expect(overlaps).toBe(0)
    expect(await noHorizontalScroll(page)).toBe(true)
  })

  test('1180 x 820: tapping a lesson swaps the card, opens no sheet, and "Sıradakine dön" restores it', async ({
    page,
  }) => {
    await open(page, 1180, 820)
    const before = await box(page, '.sh-pane:not([inert]) .dz-card.ph-next')
    await pane(page).locator('.pa-tile:not([data-next])').nth(1).click()
    const preview = page.getByTestId('dock-preview')
    await expect(preview).toBeVisible()
    await expect(page.getByTestId('lesson-peek')).toHaveCount(0)
    const after = await box(page, '[data-testid="dock-preview"]')
    expect(after.x + after.width).toBeCloseTo(before.x + before.width, 0)
    expect(after.y + after.height).toBeCloseTo(before.y + before.height, 0)
    await expect(pane(page).locator('.ph-next-lane')).toHaveAttribute('inert', '')
    await page.getByTestId('dock-back').click()
    await expect(preview).toHaveCount(0)
    await expect(pane(page).locator('.ph-next-lane')).not.toHaveAttribute('inert', '')
    await expect(pane(page).getByTestId('today-next')).toBeVisible()
  })

  test('1180 x 820, Sen: Hata defteri and Sıradaki sit in the bottom-right card, the rest on the left', async ({
    page,
  }) => {
    await open(page, 1180, 820)
    await page.getByRole('navigation', { name: 'Bölümler' }).getByText('Sen').click()
    await page.waitForTimeout(600)
    const aside = await box(page, '.sh-pane:not([inert]) .me-aside')
    const bar = await box(page, '.dz-tabbar')
    expect(aside.x + aside.width).toBeCloseTo(1180 - GUTTER, 0)
    expect(aside.y + aside.height).toBeCloseTo(bar.y + bar.height, 0)
    await expect(pane(page).locator('.me-aside').getByText('Hata defteri')).toBeVisible()
    await expect(pane(page).locator('.me-aside').getByText('Sıradaki')).toBeVisible()
    const matrix = await box(page, '.sh-pane:not([inert]) [data-testid="me-matrix"]')
    expect(matrix.x + matrix.width).toBeLessThanOrEqual(GUTTER + 560 + 1)
    expect(await noHorizontalScroll(page)).toBe(true)
  })

  test('resizing 1180 to 390 returns to the phone layout without a reload', async ({ page }) => {
    await open(page, 1180, 820)
    await pane(page).locator('.pa-tile:not([data-next])').nth(1).click()
    await expect(page.getByTestId('dock-preview')).toBeVisible()
    await page.setViewportSize({ width: 390, height: 844 })
    await page.waitForTimeout(600)
    expect(await columnsOf(page)).toBe(2)
    await expect(page.getByTestId('dock-preview')).toHaveCount(0)
    const dock = await box(page, '.sh-pane:not([inert]) .dz-card.ph-next')
    expect(dock.x).toBeCloseTo(GUTTER, 0)
    expect(dock.width).toBeCloseTo(390 - 2 * GUTTER, 0)
    // A tap now opens the phone's sheet again.
    await pane(page).locator('.pa-tile:not([data-next])').nth(1).click()
    await expect(page.getByTestId('lesson-peek')).toBeVisible()
    expect(await noHorizontalScroll(page)).toBe(true)
  })

  test('nothing scrolls sideways at any width', async ({ page }) => {
    for (const width of [320, 599, 600, 768, 999, 1000, 1180, 1440]) {
      await open(page, width, 820)
      expect(await noHorizontalScroll(page), `width ${width}`).toBe(true)
    }
  })
})
