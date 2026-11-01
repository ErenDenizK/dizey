import { expect, type Page, test } from '@playwright/test'

const channel = process.env.E2E_CHANNEL ?? 'production'
const prefix = channel === 'production' ? '' : `${channel}:`

type Box = { x: number; y: number; width: number; height: number }

/** The one duo's box on screen (the layer's box, scaled), or null while it is hidden. */
async function duoBox(page: Page): Promise<Box | null> {
  return page.locator('.cl__box').evaluate((el) => {
    const r = el.getBoundingClientRect()
    return Number(getComputedStyle(el).opacity) < 0.05
      ? null
      : { x: r.left, y: r.top, width: r.width, height: r.height }
  })
}

const meets = (a: Box, b: Box) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height

/** Waits until the duo sits on the visible anchor named `name` (the hello and travels have ended there). */
async function onAnchor(page: Page, name: string) {
  await expect
    .poll(
      async () => {
        const duo = await duoBox(page)
        const slot = await page.locator(`.sh-pane:not([inert]) [data-slot="${name}"]`).first().boundingBox()
        if (!duo || !slot) return Number.POSITIVE_INFINITY
        return Math.max(Math.abs(duo.x - slot.x), Math.abs(duo.y - slot.y), Math.abs(duo.width - slot.width))
      },
      { intervals: [150], timeout: 15_000 },
    )
    .toBeLessThan(4)
}

/** Waits until the duo has stood still for half a second (the crouch before a leap is a pause too). */
async function settled(page: Page) {
  let last = ''
  let still = 0
  await expect
    .poll(
      async () => {
        const now = JSON.stringify(await duoBox(page))
        still = now === last ? still + 1 : 0
        last = now
        return still
      },
      { intervals: [150], timeout: 15_000 },
    )
    .toBeGreaterThanOrEqual(4)
}

test('one duo walks Bugün, Sen, a lesson and its end, and never covers the lesson stage', async ({
  page,
}) => {
  test.setTimeout(90_000)
  await page.addInitScript((key) => localStorage.setItem(key, '1'), `${prefix}dizey.onboarding.safari`)
  await page.goto('./')
  const bar = page.getByRole('navigation', { name: 'Bölümler' })
  await expect(bar).toBeVisible()
  const only = async () => expect(page.locator('svg.duo')).toHaveCount(1)

  await only()
  await onAnchor(page, 'today')
  await settled(page)
  const home = await duoBox(page)
  expect(home).not.toBeNull()

  await bar.getByRole('button', { name: 'Sen' }).click()
  await onAnchor(page, 'me')
  await settled(page)
  const me = await duoBox(page)
  expect(me).not.toBeNull()
  expect(me?.width).toBeGreaterThan((home?.width ?? 0) * 1.2)
  await only()

  await bar.getByRole('button', { name: 'Bugün' }).click()
  await onAnchor(page, 'today')
  await settled(page)
  expect(Math.abs(((await duoBox(page))?.x ?? 0) - (home?.x ?? 0))).toBeLessThan(40)

  await page.locator('.sh-pane:not([inert])').getByTestId('today-next').click()
  const player = page.getByTestId('lesson-player')
  await expect(player).toBeVisible()
  const stage = page.getByTestId('lesson-stage')
  await settled(page)
  await only()

  const apart = async () => {
    const duo = await duoBox(page)
    if (!duo || !(await stage.count())) return true
    const box = await stage.boundingBox()
    return !box || !meets(duo, box)
  }
  expect(await apart()).toBe(true)
  // The duo sits in the top bar: small, above the stage.
  const top = await duoBox(page)
  expect(top?.width ?? 99).toBeLessThan(40)

  const next = player.getByRole('button', { name: 'İleri' })
  while (!(await player.getByRole('group').count())) {
    await next.click()
    expect(await apart()).toBe(true)
  }
  const options = player.getByRole('group').getByRole('button')
  await options.filter({ hasText: /^b/ }).click()
  await expect(player.getByRole('status')).toContainText('Doğru')
  expect(await apart()).toBe(true)
  await only()

  // On to the end screen: the duo travels into the hero and still is the only one.
  const finish = player.getByRole('button', { name: 'Dersi bitir' })
  const reveal = player.getByRole('button', { name: 'Cevabı göster' })
  for (let i = 0; i < 80 && !(await finish.count()); i++) {
    if (await reveal.count()) await reveal.click()
    if (await next.isEnabled().catch(() => false)) await next.click()
    else await page.waitForTimeout(150)
  }
  await finish.click()
  const end = page.getByTestId('lesson-end')
  await expect(end).toBeVisible()
  await settled(page)
  await only()
  const hero = await duoBox(page)
  expect(hero?.width ?? 0).toBeGreaterThan(80)
})
