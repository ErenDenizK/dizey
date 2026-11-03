import { expect, type Page, test } from '@playwright/test'

/**
 * Wide-screen guards (decision 0020): the phone never changes under 600 px; from 600 px the path walks four columns
 * in one centred column and the dock stays the bottom card at that column's width; from 1024 px Yol and Sen are a stage
 * grid with an in-flow 360 px side column, and a picked lesson opens the same peek as on a phone. The whole app,
 * screen by screen, is guarded by wide-walk.spec.ts; these are the Yol and Sen specifics. Measured on a resting app.
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

  test('820 x 1180: four columns in one 640 px column, the dock at its width above the centred tab bar', async ({
    page,
  }) => {
    await open(page, 820, 1180)
    expect(await columnsOf(page)).toBe(4)
    const dock = await box(page, '.sh-pane:not([inert]) .dz-card.ph-next')
    expect(dock.width).toBeCloseTo(640, 0)
    expect(dock.x + dock.width / 2).toBeCloseTo(410, 0)
    const bar = await box(page, '.dz-tabbar')
    expect(bar.x + bar.width / 2).toBeCloseTo(410, 0)
    expect(dock.y + dock.height).toBeLessThanOrEqual(bar.y + 1)
    expect(await noHorizontalScroll(page)).toBe(true)
  })

  test('1180 x 820: the stage grid, the path on the left and the dock card in flow on the right, one axis with the bar', async ({
    page,
  }) => {
    await open(page, 1180, 820)
    expect(await columnsOf(page)).toBe(4)
    const card = await box(page, '.sh-pane:not([inert]) .dz-card.ph-next')
    const bar = await box(page, '.dz-tabbar')
    // The stage is 1120 wide, centred: 30 px each side; the side column is 360 and ends on the stage's right edge.
    expect(card.x + card.width).toBeCloseTo(1180 - 30, 0)
    expect(card.width).toBeCloseTo(360, 0)
    expect(bar.x + bar.width / 2).toBeCloseTo(590, 0)
    const dock = await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>('.sh-pane:not([inert]) .ph-dock')
      if (!el) return null
      const style = getComputedStyle(el)
      return { position: style.position, overflowY: style.overflowY }
    })
    expect(dock?.position).toBe('sticky')
    expect(dock?.overflowY).toBe('visible')
    // No node touches the card.
    const overlaps = await page.evaluate(
      ([x, y, bottom]) =>
        [
          ...document.querySelectorAll('.sh-pane:not([inert]) .pa-tile, .sh-pane:not([inert]) .pa-test'),
        ].filter((el) => {
          const r = el.getBoundingClientRect()
          return (
            r.right > (x as number) && r.left < 1180 && r.top < (bottom as number) && r.bottom > (y as number)
          )
        }).length,
      [card.x, card.y, card.y + card.height],
    )
    expect(overlaps).toBe(0)
    expect(await noHorizontalScroll(page)).toBe(true)
  })

  test('1180 x 820: tapping a lesson opens the same peek as on a phone, and the dock card stays where it is', async ({
    page,
  }) => {
    await open(page, 1180, 820)
    const before = await box(page, '.sh-pane:not([inert]) .dz-card.ph-next')
    await pane(page).locator('.pa-tile:not([data-next])').nth(1).click()
    await expect(page.getByTestId('lesson-peek')).toBeVisible()
    await expect(page.getByTestId('dock-preview')).toHaveCount(0)
    const after = await box(page, '.sh-pane:not([inert]) .dz-card.ph-next')
    expect(after.x).toBeCloseTo(before.x, 0)
    expect(after.y).toBeCloseTo(before.y, 0)
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('lesson-peek')).toHaveCount(0)
  })

  test('1180 x 820, Sen: Hata defteri and Sıradaki are the side column in flow, the rest the main column', async ({
    page,
  }) => {
    await open(page, 1180, 820)
    await page.getByRole('navigation', { name: 'Bölümler' }).getByText('Sen').click()
    await page.waitForTimeout(600)
    const aside = await box(page, '.sh-pane:not([inert]) .me-aside')
    expect(aside.x + aside.width).toBeCloseTo(1180 - 30, 0)
    expect(aside.width).toBeCloseTo(360, 0)
    const position = await page.evaluate(
      () => getComputedStyle(document.querySelector('.sh-pane:not([inert]) .me-aside') as Element).position,
    )
    expect(position).toBe('sticky')
    await expect(pane(page).locator('.me-aside').getByText('Hata defteri')).toBeVisible()
    await expect(pane(page).locator('.me-aside').getByText('Sıradaki')).toBeVisible()
    const matrix = await box(page, '.sh-pane:not([inert]) [data-testid="me-status"]')
    expect(matrix.x + matrix.width).toBeLessThanOrEqual(aside.x)
    expect(await noHorizontalScroll(page)).toBe(true)
  })

  test('resizing 1180 to 390 returns to the phone layout without a reload', async ({ page }) => {
    await open(page, 1180, 820)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.waitForTimeout(600)
    expect(await columnsOf(page)).toBe(2)
    const dock = await box(page, '.sh-pane:not([inert]) .dz-card.ph-next')
    expect(dock.x).toBeCloseTo(GUTTER, 0)
    expect(dock.width).toBeCloseTo(390 - 2 * GUTTER, 0)
    // A tap opens the phone's sheet.
    await pane(page).locator('.pa-tile:not([data-next])').nth(1).click()
    await expect(page.getByTestId('lesson-peek')).toBeVisible()
    expect(await noHorizontalScroll(page)).toBe(true)
  })

  test('nothing scrolls sideways at any width', async ({ page }) => {
    for (const width of [320, 599, 600, 768, 1023, 1024, 1180, 1440]) {
      await open(page, width, 820)
      expect(await noHorizontalScroll(page), `width ${width}`).toBe(true)
    }
  })
})
