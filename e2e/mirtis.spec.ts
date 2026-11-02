import { expect, type Page, test } from '@playwright/test'

const channel = process.env.E2E_CHANNEL ?? 'production'
const prefix = channel === 'production' ? '' : `${channel}:`

/** Mırtis svgs that are on screen (a pane that is inert or hidden does not count). */
const visibleMırtiss = (page: Page) =>
  page.locator('svg.mirtis').evaluateAll(
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

test('Yol: one Mırtis, perched on the dock card at 72 px, moving with the dock', async ({ page }) => {
  await start(page)
  const card = page.locator('.sh-pane:not([inert]) .dz-card.ph-next')
  const mirtis = card.locator('svg.mirtis')
  await expect(mirtis).toHaveCount(1)
  await expect(page.locator('.pa-tile svg.mirtis, .ph-slot svg.mirtis')).toHaveCount(0)
  await expect.poll(async () => (await mirtis.boundingBox())?.width ?? 0).toBeGreaterThanOrEqual(70)
  // Let the rise settle, then her paws rest on the card's top border and she stays inside the card's column.
  await page.waitForTimeout(1200)
  const [c, m] = await Promise.all([card.boundingBox(), mirtis.boundingBox()])
  if (!c || !m) throw new Error('no boxes')
  expect(m.width).toBeGreaterThanOrEqual(70)
  // The drawing ends 8 % of the width above the svg's bottom edge; that is where the paws meet the card's border.
  const paws = m.y + m.height - m.width * 0.08
  expect(Math.abs(paws - c.y)).toBeLessThan(3)
  expect(m.x + m.width).toBeLessThanOrEqual(c.x + c.width)
  expect(m.x).toBeGreaterThanOrEqual(c.x)
  expect(await visibleMırtiss(page)).toBe(1)
})

test('Sen: one Mırtis', async ({ page }) => {
  await start(page)
  await page.getByRole('navigation', { name: 'Bölümler' }).getByRole('button', { name: 'Sen' }).click()
  await expect(page.locator('.sh-pane:not([inert]) svg.mirtis')).toHaveCount(1)
  await expect.poll(() => visibleMırtiss(page)).toBe(1)
})

test('lesson: a right answer shows one Mırtis in the verdict, and the end shows a big one', async ({
  page,
}) => {
  test.setTimeout(90_000)
  await start(page)
  await page.locator('.sh-pane:not([inert])').getByTestId('today-next').click()
  const player = page.getByTestId('lesson-player')
  await expect(player).toBeVisible()

  const next = player.getByRole('button', { name: 'İleri' })
  while (!(await player.getByRole('group').count())) await next.click()
  // An unanswered question never has her on it (the first step's greeting left with its step).
  await expect.poll(() => visibleMırtiss(page)).toBe(0)
  await player.getByRole('group').getByRole('button').filter({ hasText: /^b/ }).click()
  const verdict = player.getByRole('status')
  await expect(verdict).toContainText('Doğru')
  await expect(verdict.locator('svg.mirtis')).toHaveCount(1)
  expect(await visibleMırtiss(page)).toBe(1)
  // She perches on the verdict sheet's top edge, 56 px wide, not inside its title.
  await page.waitForTimeout(1200)
  const [sheet, cat] = await Promise.all([verdict.boundingBox(), verdict.locator('svg.mirtis').boundingBox()])
  expect(cat?.width ?? 0).toBeGreaterThanOrEqual(55)
  expect(
    Math.abs((cat?.y ?? 0) + (cat?.height ?? 0) - (cat?.width ?? 0) * 0.08 - (sheet?.y ?? 0)),
  ).toBeLessThan(3)

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
  await expect(end.locator('svg.mirtis')).toHaveCount(1)
  expect(await visibleMırtiss(page)).toBe(1)
  const hero = await end.locator('svg.mirtis').boundingBox()
  expect(hero?.width ?? 0).toBeGreaterThanOrEqual(100)
})

test('no Mırtis is ever under 48 px wide, on any screen', async ({ page }) => {
  await start(page)
  const widths = () =>
    page
      .locator('svg.mirtis')
      .evaluateAll((nodes) =>
        nodes.filter((n) => !n.closest('[inert], [hidden]')).map((n) => n.getBoundingClientRect().width),
      )
  await expect.poll(async () => (await widths()).length).toBe(1)
  for (const w of await widths()) expect(w).toBeGreaterThanOrEqual(48)
  await page.getByRole('navigation', { name: 'Bölümler' }).getByRole('button', { name: 'Sen' }).click()
  await expect.poll(async () => (await widths()).length).toBe(1)
  for (const w of await widths()) expect(w).toBeGreaterThanOrEqual(48)
})

test('lesson: Mırtis greets on the first step and cheers a streak of three first-try answers', async ({
  page,
}) => {
  test.setTimeout(90_000)
  await start(page)
  await page.goto('lesson/m1-reading-a-matrix')
  const player = page.getByTestId('lesson-player')
  const bubble = page.getByTestId('mirtis-bubble')
  const next = player.getByRole('button', { name: 'İleri' })
  await expect(player).toBeVisible()

  // The first explain step: one cat on the first card's top edge and her line.
  await expect(bubble).toHaveText('Hadi başlayalım.')
  await expect.poll(() => visibleMırtiss(page)).toBe(1)
  const cat = await player.locator('.ls-main svg.mirtis').boundingBox()
  expect(cat?.width ?? 0).toBeGreaterThanOrEqual(55)

  // The lesson's right answers: B, then 7 on the keypad, then B.
  const pickRight = async (letter: string) => {
    await player
      .locator('.ls-opts .ex-opt', { hasText: new RegExp(`^${letter}`, 'i') })
      .first()
      .click()
  }
  const reachQuestion = async (group: boolean) => {
    for (let i = 0; i < 20; i++) {
      const there = group
        ? await player.getByRole('group').count()
        : await player.locator('.ls-keypad').count()
      if (there) return
      await next.click()
      await page.waitForTimeout(250)
    }
  }
  await reachQuestion(true)
  await expect.poll(() => visibleMırtiss(page)).toBe(0)
  await pickRight('b')
  await expect(player.getByRole('status')).toContainText('Doğru')
  await expect(bubble).toHaveCount(0)
  await next.click()
  await reachQuestion(false)
  await expect.poll(() => visibleMırtiss(page)).toBe(0)
  await player.locator('.ls-key', { hasText: /^7$/ }).click()
  await player.locator('.ls-key--go').click()
  await expect(player.getByRole('status')).toContainText('Doğru')
  // Two in a row is no streak (the halfway line may speak here).
  await expect(bubble).not.toHaveText('3 üst üste!')
  await next.click()
  await reachQuestion(true)
  await pickRight('b')

  // Third first-try answer in a row: the streak, announced once (in the verdict's label, not by the bubble).
  const verdict = player.getByRole('status')
  await expect(bubble).toHaveText('3 üst üste!')
  await expect(verdict).toHaveAttribute('aria-label', 'Doğru. 3 üst üste!')
  await expect(bubble).toHaveAttribute('aria-hidden', 'true')
  await page.waitForTimeout(1200)
  expect(await visibleMırtiss(page)).toBe(1)
  const [b, c, sheet] = await Promise.all([
    bubble.boundingBox(),
    verdict.locator('svg.mirtis').boundingBox(),
    verdict.boundingBox(),
  ])
  if (!b || !c || !sheet) throw new Error('no boxes')
  // Beside her head, to her left, and no wider than 60 % of the card.
  expect(b.x + b.width).toBeLessThanOrEqual(c.x + 1)
  expect(b.width).toBeLessThanOrEqual(sheet.width * 0.6)
  expect(b.x).toBeGreaterThanOrEqual(0)
})
