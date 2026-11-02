import { expect, type Page, test } from '@playwright/test'

const channel = process.env.E2E_CHANNEL ?? 'production'
const prefix = channel === 'production' ? '' : `${channel}:`

/** Birim svgs that are on screen (a pane that is inert or hidden does not count). */
const visibleBirims = (page: Page) =>
  page.locator('svg.birim').evaluateAll(
    (nodes) =>
      nodes.filter((node) => {
        const r = node.getBoundingClientRect()
        const style = getComputedStyle(node)
        return r.width > 0 && style.visibility !== 'hidden' && !node.closest('[inert], [hidden]')
      }).length,
  )

async function start(page: Page) {
  await page.addInitScript((key) => localStorage.setItem(key, '1'), `${prefix}dizey.onboarding.safari`)
  await page.goto('./')
  await expect(page.getByRole('navigation', { name: 'Bölümler' })).toBeVisible()
}

test('Yol: one Birim, and it moves exactly with its tile when the page scrolls', async ({ page }) => {
  await start(page)
  const tile = page.locator('.sh-pane:not([inert]) .pa-tile[data-next]')
  const birim = page.locator('.sh-pane:not([inert]) .ph-slot[data-current] svg.birim')
  await expect(birim).toHaveCount(1)
  expect(await visibleBirims(page)).toBe(1)
  const box = async () => {
    const [t, b] = await Promise.all([tile.boundingBox(), birim.boundingBox()])
    return { t, b }
  }
  await expect.poll(async () => (await box()).b?.width ?? 0).toBeGreaterThan(30)
  const before = await box()
  // Scroll Yol's pane; go up when it already rests low, so the tile really moves.
  await page
    .locator('.sh-pane:not([inert]) .dz-screen')
    .first()
    .evaluate((el) => {
      el.scrollTop += el.scrollTop > 80 ? -60 : 60
    })
  await page.waitForTimeout(300)
  const after = await box()
  if (!before.t || !before.b || !after.t || !after.b) throw new Error('no boxes')
  const dTile = after.t.y - before.t.y
  const dBirim = after.b.y - before.b.y
  expect(Math.abs(dTile)).toBeGreaterThan(1)
  expect(Math.abs(dBirim - dTile)).toBeLessThan(1)
  expect(Math.abs(after.b.x - before.b.x - (after.t.x - before.t.x))).toBeLessThan(1)
})

test('Sen: one Birim', async ({ page }) => {
  await start(page)
  await page.getByRole('navigation', { name: 'Bölümler' }).getByRole('button', { name: 'Sen' }).click()
  await expect(page.locator('.sh-pane:not([inert]) svg.birim')).toHaveCount(1)
  await expect.poll(() => visibleBirims(page)).toBe(1)
})

test('lesson: a right answer shows one Birim in the verdict, and the end shows a big one', async ({
  page,
}) => {
  test.setTimeout(90_000)
  await start(page)
  await page.locator('.sh-pane:not([inert])').getByTestId('today-next').click()
  const player = page.getByTestId('lesson-player')
  await expect(player).toBeVisible()
  expect(await visibleBirims(page)).toBe(0)

  const next = player.getByRole('button', { name: 'İleri' })
  while (!(await player.getByRole('group').count())) await next.click()
  await player.getByRole('group').getByRole('button').filter({ hasText: /^b/ }).click()
  const verdict = player.getByRole('status')
  await expect(verdict).toContainText('Doğru')
  await expect(verdict.locator('svg.birim')).toHaveCount(1)
  expect(await visibleBirims(page)).toBe(1)

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
  await expect(end.locator('svg.birim')).toHaveCount(1)
  expect(await visibleBirims(page)).toBe(1)
  const hero = await end.locator('svg.birim').boundingBox()
  expect(hero?.width ?? 0).toBeGreaterThanOrEqual(100)
})
