import { expect, type Page, test } from '@playwright/test'

/**
 * Design-rule guards, run on every top-level and second-level screen with seeded progress so none is empty:
 *   1. one filled action-colour element at most (one amber primary per screen),
 *   2. no card inside a card,
 *   3. a type budget: few distinct font sizes and few distinct non-accent text colours.
 * (No explanatory captions is a static check: src/content/captions.test.ts.)
 */

const channel = process.env.E2E_CHANNEL ?? 'production'
const prefix = channel === 'production' ? '' : `${channel}:`

/** Seeds some progress, a daily question answered today, activity today and an exam date five days out. */
async function seedAndOpen(page: Page, path: string) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const done = (n: number, ok: boolean) => ({
    at: null,
    doneAt: 1700000000000 + n,
    answers: { 'try-size': { given: 'x', correct: ok } },
  })
  await page.addInitScript(
    ([p, lessons]) => {
      const pad = (n: number) => String(n).padStart(2, '0')
      const key = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
      const today = new Date()
      const exam = new Date(today.getTime() + 5 * 86_400_000)
      localStorage.setItem(`${p}dizey.onboarding.safari`, '1')
      localStorage.setItem(`${p}dizey.lessons`, lessons as string)
      localStorage.setItem(`${p}dizey.settings`, JSON.stringify({ examDate: key(exam) }))
      localStorage.setItem(`${p}dizey.activity`, JSON.stringify([key(today)]))
      localStorage.setItem(
        `${p}dizey.daily`,
        JSON.stringify({ v: 1, day: key(today), questionId: 'v1-pb-04', given: 'a', correct: true }),
      )
    },
    [
      prefix,
      JSON.stringify({
        'm1-reading-a-matrix': done(1, true),
        'm2-matrix-types': done(2, false),
        'd1-determinant': { at: null, doneAt: null, answers: { x: { given: 'x', correct: false } } },
      }),
    ],
  )
  await page.goto(path)
  await expect(page.getByRole('navigation', { name: 'Bölümler' })).toBeVisible()
}

/** Each screen: how to reach it from a seeded app, resting. */
const screens: readonly (readonly [string, (page: Page) => Promise<void>])[] = [
  [
    'Bugün',
    async (page) => {
      await seedAndOpen(page, './')
      await expect(page.locator('.sh-pane:not([inert])').getByTestId('today-exam')).toBeVisible()
    },
  ],
  [
    'Harita',
    async (page) => {
      await seedAndOpen(page, './map')
      await expect(page.locator('.sh-pane:not([inert])').getByTestId('continue-card')).toBeVisible()
    },
  ],
  [
    'Sen',
    async (page) => {
      await seedAndOpen(page, './me')
      await expect(page.locator('.sh-pane:not([inert])').getByTestId('me-scene')).toBeVisible()
    },
  ],
  [
    'Ayarlar',
    async (page) => {
      await seedAndOpen(page, './settings')
      await expect(page.getByTestId('app-version')).toBeVisible()
    },
  ],
  [
    'Sınav',
    async (page) => {
      await seedAndOpen(page, './exam')
      await expect(page.getByTestId('exam-set-summer-2024')).toBeVisible()
    },
  ],
  [
    'Ders, ilk adım',
    async (page) => {
      await seedAndOpen(page, './lesson/r2-echelon-forms')
      await expect(page.getByTestId('lesson-player')).toBeVisible()
    },
  ],
  [
    'Ders sonu',
    async (page) => {
      await seedAndOpen(page, './lesson/r2-echelon-forms?step=summary')
      await page.getByTestId('lesson-player').getByRole('button', { name: 'Dersi bitir' }).click()
      await expect(page.getByTestId('lesson-exam-asked')).toBeVisible()
      await page.waitForTimeout(1500)
    },
  ],
  [
    'Bölüm testi',
    async (page) => {
      await seedAndOpen(page, './map')
      await page.getByTestId('chapter-test-matrices').click()
      await expect(page.getByTestId('exam-run').getByText('Soru 1 / 6')).toBeVisible()
    },
  ],
  [
    'Test sonucu',
    async (page) => {
      await seedAndOpen(page, './map')
      await page.getByTestId('chapter-test-matrices').click()
      const run = page.getByTestId('exam-run')
      await expect(run.getByText('Soru 1 / 6')).toBeVisible()
      await run.getByRole('button', { name: /^Soru haritası/ }).click()
      await page.getByTestId('exam-finish').click()
      await expect(page.getByTestId('exam-score')).toBeVisible()
    },
  ],
]

/**
 * Type budget per screen: [distinct font sizes, distinct non-accent text colours].
 * Rule: 4 and 3. A screen over the rule is pinned at its measured value so it cannot get worse.
 */
const RULE: readonly [number, number] = [4, 3]
const budgets: Record<string, readonly [number, number]> = {
  // TODO(design): tighten to 4 (measured 6: 14, 15, 17, 18, 22 and 32 px)
  Harita: [6, 3],
  // TODO(design): tighten to 4 (measured 6: 15, 17, 18, 22, 26 and 60 px)
  'Test sonucu': [6, 3],
}

/** Settles, then lets a screen's DOM be measured. Runs in the page. */
const MEASURE = () => {
  const probe = (css: string) => {
    const el = document.createElement('div')
    el.style.cssText = `position:fixed;visibility:hidden;${css}`
    document.body.append(el)
    const style = getComputedStyle(el)
    const out = {
      bg: style.backgroundColor,
      color: style.color,
      radius: Number.parseFloat(style.borderTopLeftRadius),
    }
    el.remove()
    return out
  }
  const token = (name: string) => probe(`background:var(${name});color:var(${name})`).bg
  const action = token('--action')
  const surface = token('--surface')
  const cardRadius = probe('border-radius:var(--corner-card)').radius
  const accentText = new Set(
    ['--action', '--on-action', '--ok-ink', '--ok-fill', '--bad-ink', '--bad-fill'].map(token),
  )

  const live = (el: Element) =>
    !el.closest('[inert]') &&
    el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) &&
    el.getBoundingClientRect().width > 0 &&
    el.getBoundingClientRect().height > 0
  const label = (el: Element) => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`

  const all = [...document.body.querySelectorAll('*')].filter(live)
  // A progress bar's fill shows progress; it is not an action.
  const filled = all
    .filter(
      (el) =>
        getComputedStyle(el).backgroundColor === action && !el.closest('[role="progressbar"], .ls-progress'),
    )
    .map(label)

  const isCard = (el: Element) => {
    // A screen or sheet container may share the card surface and corner; it is not a card.
    if (el.matches('.dz-screen, [data-present]')) return false
    const style = getComputedStyle(el)
    return (
      el.classList.contains('dz-card') ||
      (style.backgroundColor === surface && Number.parseFloat(style.borderTopLeftRadius) >= cardRadius)
    )
  }
  const cards = all.filter(isCard)
  const nested = cards
    .filter((card) => cards.some((other) => other !== card && card.contains(other)))
    .map(label)

  // Math (matrix cells, fractions, lesson matrices) and the tab bar follow their own rules.
  const skipText =
    '.dz-tabbar, svg, .dz-m, .ex-tex, .ex-mat, .ex-cell, .ex-frac, .ex-signed, .ex-system, .ls-mat, .ls-seal__cell'
  const sizes = new Set<string>()
  const colors = new Set<string>()
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const el = node.parentElement
    if (!el || !node.textContent?.trim() || !live(el) || el.closest(skipText)) continue
    const style = getComputedStyle(el)
    sizes.add(style.fontSize)
    if (!accentText.has(style.color)) colors.add(style.color)
  }
  return { filled, nested, sizes: [...sizes].sort(), colors: [...colors].sort() }
}

for (const [name, open] of screens) {
  test.describe(name, () => {
    test('has at most one filled action element, no card in a card, and stays in its type budget', async ({
      page,
    }) => {
      await open(page)
      await page.waitForTimeout(600)
      const m = await page.evaluate(MEASURE)
      test.info().annotations.push({
        type: 'measured',
        description: `${m.sizes.length} sizes, ${m.colors.length} colours`,
      })
      expect(m.filled.length, `filled action-colour elements: ${m.filled.join(' | ')}`).toBeLessThanOrEqual(1)
      expect(m.nested, 'cards that contain a card').toEqual([])
      const [sizeBudget, colorBudget] = budgets[name] ?? RULE
      expect(m.sizes.length, `font sizes: ${m.sizes.join(', ')}`).toBeLessThanOrEqual(sizeBudget)
      expect(m.colors.length, `text colours: ${m.colors.join(' | ')}`).toBeLessThanOrEqual(colorBudget)
    })
  })
}
