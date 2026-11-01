import AxeBuilder from '@axe-core/playwright'
import { expect, type Page, test } from '@playwright/test'

const channel = process.env.E2E_CHANNEL ?? 'production'
const prefix = channel === 'production' ? '' : `${channel}:`

/** Opens the app past the first-launch install guide (covered by its own test). */
async function openApp(page: Page, path = './') {
  await page.addInitScript((key) => localStorage.setItem(key, '1'), `${prefix}dizey.onboarding.safari`)
  await page.goto(path)
  await expect(page.getByRole('navigation', { name: 'Bölümler' })).toBeVisible()
}

/** The tab screen on show (the other tab panes stay mounted but inert). */
const screen = (page: Page) => page.locator('.sh-pane:not([inert])')
const tab = (page: Page, name: string) => page.getByRole('navigation').getByRole('button', { name })

test('Dersler offers the first lesson on the path', async ({ page }) => {
  await openApp(page)
  await expect(screen(page).getByRole('heading', { name: 'Dersler', level: 1 })).toBeVisible()
  await expect(screen(page).getByTestId('continue-card')).toHaveAttribute('aria-label', /^Başla: 1\.1 /)
  await expect(screen(page).getByText('Vize 1 · 15 Kasım civarı')).toBeVisible()
})

test('the path groups lessons into chapters and Profil shows version and commit', async ({ page }) => {
  await openApp(page)
  await expect(screen(page).getByRole('heading', { name: 'Determinant', exact: true })).toBeVisible()
  await expect(screen(page).getByText(/sınavda 13 \/ 34 soru/)).toBeVisible()
  await tab(page, 'Profil').click()
  await expect(page.getByTestId('app-version')).toContainText(/Sürüm \d+\.\d+\.\d+ · ([0-9a-f]{7}|unknown)/)
  if (channel !== 'production') await expect(page.getByTestId('app-version')).toContainText(channel)
})

test('the old map address lands on the path', async ({ page }) => {
  await openApp(page, './map')
  await expect(screen(page).getByRole('heading', { name: 'Dersler', level: 1 })).toBeVisible()
})

test('a tile opens its card, a tap outside folds it back, and the lesson grows out of the card and returns', async ({
  page,
}) => {
  await openApp(page)
  // By data attribute: a tile hidden while its card is open leaves the accessibility tree, and it becomes the continue card once its lesson is opened.
  const tile = screen(page).locator('.pa-tile[data-lesson="m3-trace"]')
  const card = page.getByTestId('lesson-peek')
  await tile.click()
  await expect(card).toBeVisible()
  await expect(card.getByRole('link', { name: /^Derse gir/ })).toBeVisible()
  await expect(tile).toHaveCSS('visibility', 'hidden')
  // Tap outside (the scrim above the card): the card folds into its tile.
  await page.mouse.click(195, 60)
  await expect(card).toHaveCount(0)
  await expect(tile).toBeVisible()
  await tile.click()
  await card.getByRole('link', { name: /^Derse gir/ }).click()
  await expect(page).toHaveURL(/\/lesson\//)
  await expect(page.getByTestId('lesson-player')).toBeVisible()
  await page.getByTestId('lesson-player').getByRole('link', { name: 'Dersten çık' }).click()
  await expect(page.getByTestId('lesson-player')).toHaveCount(0)
  await expect(page).not.toHaveURL(/\/lesson\//)
  await expect(tile).toBeVisible()
  await expect(card).toHaveCount(0)
})

test('a lesson opens from its tile card and hides the tab bar', async ({ page }) => {
  await openApp(page)
  await screen(page)
    .getByRole('button', { name: /^3\.1 / })
    .click()
  const sheet = page.getByRole('dialog')
  await expect(sheet).toContainText('14 adım')
  await sheet.getByRole('link', { name: /^Derse gir/ }).click()
  await expect(page.getByTestId('lesson-player')).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Bölümler' })).not.toBeInViewport()
})

test('a lesson plays, checks answers and resumes where it was left', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openApp(page, './lesson/d1-determinant')
  const player = page.getByTestId('lesson-player')
  await expect(player).toBeVisible()
  const next = player.getByRole('button', { name: 'İleri' })
  while (!(await player.getByRole('group').count())) await next.click()
  // A wrong option names the mistake and stays disabled; the right one unlocks İleri.
  const options = player.getByRole('group').getByRole('button')
  await options.filter({ hasText: '26' }).click()
  await expect(player.getByRole('status')).toContainText('Tekrar dene.')
  await options.filter({ hasText: /^b/ }).click()
  await expect(player.getByRole('status')).toContainText('Doğru')
  await next.click()
  const step = await player.getByRole('progressbar').getAttribute('aria-valuenow')
  await page.reload()
  await expect(page.getByTestId('lesson-player').getByRole('progressbar')).toHaveAttribute(
    'aria-valuenow',
    step ?? '',
  )
  await page.getByRole('link', { name: 'Dersten çık' }).click()
  await expect(screen(page).getByTestId('continue-card')).toHaveAttribute('aria-label', /^Devam et: 3\.1 /)
})

test('finishing a lesson shows its answers seal and offers the next lesson', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openApp(page, './lesson/r2-echelon-forms?step=summary')
  await page.getByTestId('lesson-player').getByRole('button', { name: 'Dersi bitir' }).click()
  const end = page.getByTestId('lesson-end')
  await expect(end).toContainText('Ders tamam')
  await expect(end.getByRole('img', { name: /3 sorunun cevapları/ })).toBeVisible()
  await end.getByRole('button', { name: /Sıradaki · 2\.3/ }).click()
  await expect(page).toHaveURL(/lesson\/r3-rank/)
  await expect(page.getByTestId('lesson-player').getByRole('progressbar')).toHaveAttribute(
    'aria-valuenow',
    '1',
  )
})

test('the gizli an follows Bitir: a wrong pick is neutral, the right one earns the sezgi mührü', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openApp(page, './lesson/d1-determinant?step=summary')
  const player = page.getByTestId('lesson-player')
  await player.getByRole('button', { name: 'Dersi bitir' }).click()
  await expect(page.getByTestId('lesson-end')).toHaveCount(0)
  await expect(player).toContainText('Gizli an · not tutulmaz')
  await expect(player.getByRole('button', { name: 'Gizli soruyu geç' })).toBeVisible()
  // A wrong pick is struck out and disabled, says why, and does not end anything.
  const options = player.getByRole('group').getByRole('button')
  await options.filter({ hasText: '28' }).click()
  await expect(options.filter({ hasText: '28' })).toBeDisabled()
  await expect(options.filter({ hasText: '28' })).toHaveAttribute('data-state', 'miss')
  await expect(player).toContainText('Yalnız sağa inenleri topladın')
  await expect(page.getByTestId('lesson-end')).toHaveCount(0)
  await options.filter({ hasText: /^b/ }).click()
  await expect(player.getByRole('status')).toContainText('Doğru')
  await player.getByRole('button', { name: 'İleri' }).click()
  const end = page.getByTestId('lesson-end')
  await expect(end).toContainText('Gizli anı çözdün: sezgi mührü senin.')
  // The solved moment is stored and the badge follows.
  expect(await page.evaluate((k) => localStorage.getItem(k), `${prefix}dizey.moments`)).toBe(
    '{"d1-determinant":"solved"}',
  )
})

test('a wrong first try lands in the mistake log and leaves it when fixed', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openApp(page, './lesson/d1-determinant')
  const player = page.getByTestId('lesson-player')
  const next = player.getByRole('button', { name: 'İleri' })
  while (!(await player.getByRole('group').count())) await next.click()
  await player.getByRole('group').getByRole('button').filter({ hasText: '26' }).click()
  await page.getByRole('link', { name: 'Dersten çık' }).click()
  await tab(page, 'Profil').click()
  const log = screen(page).getByRole('region', { name: /Hata defteri/ })
  await expect(log).toContainText('İki çarpımı topladın')
  // Back to that step: a right first try on this visit clears it.
  await log.getByRole('link').first().click()
  await page
    .getByTestId('lesson-player')
    .getByRole('group')
    .getByRole('button')
    .filter({ hasText: /^b/ })
    .click()
  await page.getByRole('link', { name: 'Dersten çık' }).click()
  await expect(screen(page).getByRole('region', { name: /Hata defteri/ })).toContainText('Açık hata yok')
})

test('the exam line counts down once a date is set', async ({ page }) => {
  await openApp(page, './me')
  await screen(page).getByLabel('Vize 1 tarihi').fill('2026-11-19')
  await tab(page, 'Dersler').click()
  await expect(screen(page).getByText(/19 Kasım/)).toBeVisible()
})

test('every path tile shows its whole title at phone width', async ({ page }) => {
  await openApp(page)
  const clipped = await screen(page)
    .locator('.pa-tile__title')
    .evaluateAll((titles) =>
      titles.filter((t) => t.scrollHeight > t.clientHeight + 1).map((t) => t.textContent),
    )
  expect(clipped).toEqual([])
})

test('the Dersler path recedes as one surface: tiles, path and headings move together', async ({ page }) => {
  await openApp(page)
  const scroller = screen(page).locator('.dz-screen')
  await page.waitForTimeout(1500)
  await scroller.evaluate((s) => {
    s.scrollTop = 520
    s.dispatchEvent(new Event('scroll'))
  })
  await page.waitForTimeout(200)
  const report = await scroller.evaluate((s) => {
    const centre = (r: DOMRect) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
    // Every path segment on screen ends on the drawn centres of its two tiles.
    let worst = 0
    for (const matrix of s.querySelectorAll<HTMLElement>('.pa-matrix')) {
      const rect = matrix.getBoundingClientRect()
      if (rect.bottom < 0 || rect.top > s.clientHeight) continue
      const svg = matrix.querySelector('svg')
      const tiles = [...matrix.querySelectorAll<HTMLElement>('.pa-tile')].map((t) =>
        centre(t.getBoundingClientRect()),
      )
      if (!svg) continue
      const box = svg.getBoundingClientRect()
      matrix.querySelectorAll<SVGLineElement>('.pa-link').forEach((line, i) => {
        const a = tiles[i]
        const b = tiles[i + 1]
        if (!a || !b) return
        const ends = [
          [line.x1.baseVal.value + box.left - a.x, line.y1.baseVal.value + box.top - a.y],
          [line.x2.baseVal.value + box.left - b.x, line.y2.baseVal.value + box.top - b.y],
        ]
        for (const [dx, dy] of ends) worst = Math.max(worst, Math.hypot(dx ?? 0, dy ?? 0))
      })
    }
    // Scale depends on screen height only: a heading and a tile at the same height recede alike.
    const scaled = [...s.querySelectorAll<HTMLElement>('[data-focus]')].map((el) => ({
      y: centre(el.getBoundingClientRect()).y,
      scale: new DOMMatrix(getComputedStyle(el).transform).a,
    }))
    let mismatch = 0
    for (const a of scaled)
      for (const b of scaled)
        if (Math.abs(a.y - b.y) < 8) mismatch = Math.max(mismatch, Math.abs(a.scale - b.scale))
    const smallest = Math.min(...scaled.filter((e) => e.y > 0 && e.y < s.clientHeight).map((e) => e.scale))
    // Gaps recede with the tiles: two tiles side by side get closer exactly as much as they shrink.
    let gap = 0
    const cells = [...s.querySelectorAll<HTMLElement>('.pa-grid > li')]
    for (const a of cells)
      for (const b of cells) {
        if (a === b || a.offsetTop !== b.offsetTop || a.parentElement !== b.parentElement) continue
        const ra = a.getBoundingClientRect()
        if (ra.bottom < 0 || ra.top > s.clientHeight) continue
        const drawn = centre(b.getBoundingClientRect()).x - centre(ra).x
        const laid = b.offsetLeft - a.offsetLeft
        const scale = new DOMMatrix(getComputedStyle(a).transform).a
        gap = Math.max(gap, Math.abs(drawn / laid - scale))
      }
    return { worst, mismatch, smallest, gap }
  })
  expect(report.worst).toBeLessThan(2.5)
  expect(report.mismatch).toBeLessThan(0.01)
  expect(report.gap).toBeLessThan(0.01)
  // Something on screen visibly recedes.
  expect(report.smallest).toBeLessThan(0.97)
})

test('the app is dark even when the phone is in light mode', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await openApp(page, './me')
  await expect(screen(page).getByRole('button', { name: 'Koyu' })).toHaveCount(0)
  const ground = await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)
  expect(ground).toBe('dark')
})

test('an exam rehearsal runs, survives a reload and shows its result', async ({ page }) => {
  await openApp(page, './exam')
  await screen(page).getByTestId('exam-set-summer-2024').click()
  await page.getByTestId('exam-start').click()
  const run = page.getByTestId('exam-run')
  await expect(run.getByText(/^Soru 1 \/ \d+$/)).toBeVisible()
  const first = run.locator('.ex-opt').first()
  await first.click()
  await expect(first).toHaveAttribute('aria-pressed', 'true')
  await first.click()
  await expect(first).toHaveAttribute('aria-pressed', 'false')
  await first.click()
  await run.getByRole('button', { name: 'Sonraki' }).click()
  await expect(run.getByText(/^Soru 2 \/ \d+$/)).toBeVisible()
  await page.reload()
  await expect(page.getByTestId('exam-run').getByText(/^Soru 2 \/ \d+$/)).toBeVisible()
  // Leaving keeps the attempt: the hub offers it back.
  await page.getByRole('link', { name: 'Provadan çık, sonra devam et' }).click()
  await expect(screen(page).getByText('1 / 15 cevaplı', { exact: false })).toBeVisible()
  await screen(page).getByRole('link', { name: 'Devam et' }).click()
  await expect(page.getByTestId('exam-run').getByText(/^Soru 2 \/ \d+$/)).toBeVisible()
  // Ending goes through the question map, which shows the blanks first.
  await page.getByRole('button', { name: /^Soru haritası/ }).click()
  await expect(page.getByText('14 soru boş.', { exact: false })).toBeVisible()
  await page.getByTestId('exam-finish').click()
  await expect(page.getByTestId('exam-score')).toContainText(/\d+ \/ \d+ doğru/)
  await expect(page.getByTestId('exam-score')).toContainText(/1 yanlış|0 yanlış/)
  await page.getByRole('button', { name: 'Bitti' }).click()
  await expect(screen(page).getByRole('heading', { name: 'Geçmiş' })).toBeVisible()
  await screen(page).getByRole('link', { name: 'Son prova sonucu' }).click()
  await expect(page.getByTestId('exam-score')).toBeVisible()
})

test('first launch in iPhone Safari asks to install first', async ({ page, isMobile }, testInfo) => {
  test.skip(channel !== 'production' || testInfo.project.name !== 'iphone-webkit', 'production iPhone only')
  expect(isMobile).toBe(true)
  await page.goto('./')
  const guide = page.getByRole('dialog', { name: "Dizey'i ana ekrana ekle" })
  await expect(guide).toBeVisible()
  await guide.getByRole('button', { name: /Safari'de dene/ }).click()
  await expect(guide).toBeHidden()
  await page.reload()
  await expect(screen(page).getByTestId('continue-card')).toBeVisible()
  await expect(guide).toBeHidden()
})

test('backup round-trips progress', async ({ page }) => {
  await openApp(page, './me')
  const key = `${prefix}dizey.lessons`
  await page.evaluate((k) => localStorage.setItem(k, '{}'), key)
  const backup = {
    app: 'dizey',
    format: 1,
    exportedAt: '2026-10-30T12:00:00.000Z',
    channel,
    entries: { 'dizey.lessons': '{"d1-determinant":{"at":null,"doneAt":1,"answers":{}}}' },
  }
  await page.getByTestId('restore-file').setInputFiles({
    name: 'dizey-yedek.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  })
  // Restoring reloads the page; wait for that load, not for the old page still on screen.
  const reloaded = page.waitForEvent('load')
  await page.getByRole('button', { name: 'Geri yükle', exact: true }).click()
  await reloaded
  await expect(page.getByTestId('app-version')).toBeVisible()
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe(
    '{"d1-determinant":{"at":null,"doneAt":1,"answers":{}}}',
  )
})

test('a file that is not a backup is refused', async ({ page }) => {
  await openApp(page, './me')
  await page.getByTestId('restore-file').setInputFiles({
    name: 'notes.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"hello":1}'),
  })
  await expect(page.getByRole('alert')).toHaveText('Bu dosya bir Dizey yedeği değil.')
})

for (const path of ['./', './exam', './me']) {
  test(`no critical accessibility violations on ${path}`, async ({ page }) => {
    await openApp(page, path)
    const results = await new AxeBuilder({ page }).analyze()
    const critical = results.violations.filter((v) => v.impact === 'critical')
    expect(critical.map((v) => v.id)).toEqual([])
  })
}

for (const colorScheme of ['dark'] as const) {
  test(`phone screenshots, ${colorScheme}`, async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme })
    for (const [name, path] of [
      ['path', './'],
      ['exam', './exam'],
      ['me', './me'],
    ] as const) {
      await openApp(page, path)
      await page.waitForTimeout(400)
      await testInfo.attach(`${name}-${colorScheme}`, {
        body: await page.screenshot(),
        contentType: 'image/png',
      })
    }
  })
}

test('only production registers a service worker', async ({ page }) => {
  await openApp(page)
  if (channel === 'production') {
    await page.waitForFunction(() => navigator.serviceWorker.ready.then(() => true), undefined, {
      timeout: 15_000,
    })
  } else {
    await page.waitForTimeout(1500)
  }
  const registrations = await page.evaluate(
    async () => (await navigator.serviceWorker.getRegistrations()).length,
  )
  expect(registrations > 0).toBe(channel === 'production')
})

test('preview progress is kept apart from production', async ({ page }) => {
  await openApp(page)
  const keys = await page.evaluate(() => Object.keys(localStorage))
  const appKeys = keys.filter((k) => k.includes('dizey'))
  expect(appKeys.length).toBeGreaterThan(0)
  if (channel === 'production') expect(appKeys.every((k) => !/^pr-\d+:/.test(k))).toBe(true)
  else expect(appKeys.every((k) => k.startsWith(`${channel}:`))).toBe(true)
})

test('unknown paths show the not-found view', async ({ page }) => {
  await openApp(page)
  await page.goto('./no-such-page')
  await expect(page.getByText('Bu sayfa yok.')).toBeVisible()
})

test.describe('motion and visual system lab', () => {
  test('tabs, sheet and switch respond', async ({ page }) => {
    await page.goto('./lab')
    await expect(page.getByRole('heading', { name: 'Bugün' })).toBeVisible()
    await page.getByRole('navigation').getByRole('button', { name: 'Harita' }).click()
    await expect(page.getByRole('heading', { name: 'Harita' })).toBeVisible()
    await page.getByRole('button', { name: /Laplace açılımı/ }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()
    await page.getByRole('navigation').getByRole('button', { name: 'Ben' }).click()
    const sound = page.getByRole('switch', { name: 'Ses' })
    await sound.click()
    await expect(sound).toBeChecked()
  })

  test('has no serious accessibility violations', async ({ page }) => {
    await page.goto('./lab')
    await expect(page.getByRole('heading', { name: 'Bugün' })).toBeVisible()
    const results = await new AxeBuilder({ page })
      .include('.lab-pane:first-child')
      .include('.dz-tabbar')
      .analyze()
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
    expect(serious, JSON.stringify(serious.map((v) => [v.id, v.nodes.length]))).toEqual([])
  })
})
