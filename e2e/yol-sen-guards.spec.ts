import { expect, type Page, test } from '@playwright/test'

/**
 * Round 3 guards: the Yol dock card and the long-name head of Sen must fit every phone width, and nothing on
 * the path may sit on a fractional pixel. Measured on a resting app (reduced motion).
 */

const channel = process.env.E2E_CHANNEL ?? 'production'
const prefix = channel === 'production' ? '' : `${channel}:`
const WIDTHS = [320, 375, 390] as const
const GUTTER = 16

const pad = (n: number) => String(n).padStart(2, '0')
const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** All three thin-row items: a daily question open, a wrong exam answer to review, the exam today. */
async function seed(page: Page, width: number, opts: { name?: string; lessons?: string } = {}) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width, height: 844 })
  await page.addInitScript(
    ([p, today, name, lessons]) => {
      localStorage.setItem(`${p}dizey.onboarding.safari`, '1')
      localStorage.setItem(`${p}dizey.settings`, JSON.stringify({ examDate: today }))
      localStorage.setItem(
        `${p}dizey.exam.outcomes`,
        JSON.stringify({ 'v1-2024s-01': { correct: false, given: 'a', at: 1 } }),
      )
      if (name) localStorage.setItem(`${p}dizey.profile`, JSON.stringify({ v: 1, name }))
      if (lessons) localStorage.setItem(`${p}dizey.lessons`, lessons)
    },
    [prefix, dayKey(new Date()), opts.name ?? '', opts.lessons ?? ''],
  )
  await page.goto('./')
  await expect(page.getByRole('navigation', { name: 'Bölümler' })).toBeVisible()
}

const pane = (page: Page) => page.locator('.sh-pane:not([inert])')

test.describe('Yol dock card', () => {
  for (const width of WIDTHS) {
    test(`with all three thin-row items it is viewport minus both gutters at ${width} px and nothing overflows`, async ({
      page,
    }) => {
      await seed(page, width)
      const host = pane(page)
      for (const id of ['today-daily', 'today-review', 'today-exam'])
        await expect(host.getByTestId(id)).toBeVisible()
      await page.waitForTimeout(500)
      // The longest values the row can show.
      await page.evaluate(() => {
        const set = (id: string, text: string) => {
          const value = document.querySelector(`.sh-pane:not([inert]) [data-testid="${id}"] .ph-more__value`)
          if (value) value.textContent = text
        }
        set('today-review', '88')
        set('today-exam', '12 gün')
      })
      const result = await page.evaluate(() => {
        const card = document.querySelector('.sh-pane:not([inert]) .ph-next') as HTMLElement
        const box = card.getBoundingClientRect()
        const overflowing: string[] = []
        const ellipsis: string[] = []
        for (const el of card.querySelectorAll<HTMLElement>('*')) {
          const r = el.getBoundingClientRect()
          if (r.width && (r.left < box.left - 0.5 || r.right > box.right + 0.5))
            overflowing.push(`${el.className} ${r.left.toFixed(1)}..${r.right.toFixed(1)}`)
        }
        for (const el of card.querySelectorAll<HTMLElement>('.ph-more *, .ph-next__title, .ph-next__where *'))
          if (el.scrollWidth > el.clientWidth + 0.5 && getComputedStyle(el).textOverflow === 'ellipsis')
            ellipsis.push(el.className)
        for (const el of card.querySelectorAll<HTMLElement>('.ph-more__label, .ph-more__chip'))
          if (el.scrollWidth > el.clientWidth + 0.5)
            ellipsis.push(`clipped ${el.className} ${el.textContent}`)
        const cells = [...card.querySelectorAll<HTMLElement>('.ph-more__item')].map(
          (el) => el.getBoundingClientRect().height,
        )
        return { left: box.left, right: box.right, vw: window.innerWidth, overflowing, ellipsis, cells }
      })
      expect(result.left).toBeCloseTo(GUTTER, 1)
      expect(result.right).toBeCloseTo(result.vw - GUTTER, 1)
      expect(result.overflowing).toEqual([])
      expect(result.ellipsis).toEqual([])
      expect(result.cells).toHaveLength(3)
      for (const h of result.cells) expect(h).toBeGreaterThanOrEqual(44)
    })
  }

  test('the row has as many equal columns as it has items, except on the narrowest card', async ({
    page,
  }) => {
    await seed(page, 390)
    const columns = () =>
      pane(page)
        .locator('.ph-more')
        .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length)
    expect(await columns()).toBe(3)
    await page.setViewportSize({ width: 320, height: 844 })
    await page.waitForTimeout(300)
    // On a card narrower than 300 px, three tiles no longer fit: the third takes its own line.
    expect(await columns()).toBe(2)
  })

  for (const width of WIDTHS) {
    test(`the row's items read as buttons at ${width} px: a surface, 44 px, an icon, ink text`, async ({
      page,
    }) => {
      await seed(page, width)
      const host = pane(page)
      await expect(host.getByTestId('today-daily')).toBeVisible()
      await page.waitForTimeout(500)
      const items = await host.locator('.ph-more__item').evaluateAll((els) => {
        const probe = document.createElement('i')
        probe.style.color = 'var(--ink-2)'
        document.body.append(probe)
        const ink2 = getComputedStyle(probe).color
        probe.remove()
        return els.map((el) => {
          const cs = getComputedStyle(el)
          const label = el.querySelector('.ph-more__label') as HTMLElement
          const icon = el.querySelector('.ph-more__icon') as HTMLElement
          return {
            testid: el.getAttribute('data-testid'),
            state: el.getAttribute('data-state'),
            bg: cs.backgroundColor,
            height: el.getBoundingClientRect().height,
            iconShown: getComputedStyle(icon).display !== 'none' && icon.querySelector('svg') !== null,
            labelColor: getComputedStyle(label).color,
            ink2,
          }
        })
      })
      expect(items.length).toBeGreaterThanOrEqual(2)
      for (const item of items) {
        expect(item.bg).not.toBe('rgba(0, 0, 0, 0)')
        expect(item.bg).not.toBe('transparent')
        expect(item.height).toBeGreaterThanOrEqual(44)
        if (width >= 360) expect(item.iconShown).toBe(true)
        if (item.state === 'open' || item.testid !== 'today-daily')
          expect(item.labelColor).not.toBe(item.ink2)
      }
    })
  }

  test('a long lesson title wraps to two lines instead of ellipsising', async ({ page }) => {
    // Chapter 1 done: the dock offers "Elemanter satır işlemleri" (r1).
    const done = Object.fromEntries(
      [
        'm1-reading-a-matrix',
        'm2-matrix-types',
        'm4-matrix-arithmetic',
        'm5-matrix-product',
        'm3-trace',
        'm6-transpose',
        'm7-symmetric-antisymmetric',
        'm8-power-classes',
        'm9-orthogonal',
        'm10-conjugate-hermitian',
      ].map((id, n) => [id, { at: null, doneAt: 1700000000000 + n, answers: {} }]),
    )
    for (const width of [320, 390]) {
      await seed(page, width, { lessons: JSON.stringify(done) })
      await page.reload()
      const title = pane(page).locator('.ph-next__title')
      await expect(title).toContainText('Elemanter satır işlemleri')
      const m = await title.evaluate((el) => ({
        clipped: el.scrollWidth > el.clientWidth + 0.5,
        overflow: getComputedStyle(el).textOverflow,
        lines: Math.round(
          el.getBoundingClientRect().height / Number.parseFloat(getComputedStyle(el).lineHeight),
        ),
      }))
      expect(m.clipped).toBe(false)
      expect(m.overflow).not.toBe('ellipsis')
      expect(m.lines).toBeLessThanOrEqual(2)
    }
  })
})

test.describe('Sen head', () => {
  for (const width of [320, 390]) {
    test(`a 24 character name wraps to at most two lines at ${width} px, centred on the avatar`, async ({
      page,
    }) => {
      await seed(page, width, { name: 'Abdurrahmangazi Yıldırım' })
      await page.getByRole('navigation', { name: 'Bölümler' }).getByRole('button', { name: 'Sen' }).click()
      const name = pane(page).getByTestId('me-name')
      await expect(name).toContainText('Abdurrahmangazi Yıldırım')
      await page.waitForTimeout(600)
      const m = await page.evaluate(() => {
        const root = document.querySelector('.sh-pane:not([inert])') as HTMLElement
        const text = root.querySelector('[data-testid="me-name"]') as HTMLElement
        const style = getComputedStyle(text)
        const lineHeight = Number.parseFloat(style.lineHeight)
        const inner = text.getBoundingClientRect().height - Number.parseFloat(style.paddingTop) * 2
        const avatar = (root.querySelector('.me-avatar') as HTMLElement).getBoundingClientRect()
        const nameBox = text.getBoundingClientRect()
        const title = (root.querySelector('[data-testid="me-title"]') as HTMLElement).getBoundingClientRect()
        const ink = { top: nameBox.top + Number.parseFloat(style.paddingTop), bottom: title.bottom }
        return {
          lines: Math.round(inner / lineHeight),
          ellipsis: style.textOverflow === 'ellipsis',
          clipped: text.scrollWidth > text.clientWidth + 0.5,
          height: nameBox.height,
          offset: (ink.top + ink.bottom) / 2 - (avatar.top + avatar.bottom) / 2,
        }
      })
      expect(m.lines).toBeLessThanOrEqual(2)
      expect(m.ellipsis).toBe(false)
      expect(m.clipped).toBe(false)
      expect(m.height).toBeGreaterThanOrEqual(48)
      expect(Math.abs(m.offset)).toBeLessThanOrEqual(6)
    })
  }
})

test.describe('Yol path pixels', () => {
  for (const width of [320, 375, 390, 430]) {
    test(`every node sits on whole CSS px at ${width} px`, async ({ page }) => {
      await seed(page, width)
      await page.waitForTimeout(500)
      const fractions = await page.evaluate(() => {
        const root = document.querySelector('.sh-pane:not([inert]) [data-testid="path"]') as HTMLElement
        const origin = root.getBoundingClientRect()
        const bad: string[] = []
        for (const slot of root.querySelectorAll<HTMLElement>('.ph-slot')) {
          const r = slot.getBoundingClientRect()
          const x = r.left - origin.left
          const y = r.top - origin.top
          if (Math.abs(x - Math.round(x)) > 0.01 || Math.abs(y - Math.round(y)) > 0.01)
            bad.push(`slot ${x.toFixed(2)},${y.toFixed(2)}`)
        }
        for (const line of root.querySelectorAll<SVGLineElement>('.ph-wire'))
          for (const k of ['x1', 'x2', 'y1', 'y2'] as const) {
            const v = line[k].baseVal.value
            if (v !== Math.round(v)) bad.push(`wire ${k}=${v}`)
          }
        return bad
      })
      expect(fractions).toEqual([])
    })
  }
})
