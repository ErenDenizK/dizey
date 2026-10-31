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

test('the appearance switch sets the theme', async ({ page }) => {
  await openApp(page, './me')
  await screen(page).getByRole('button', { name: 'Koyu' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await screen(page).getByRole('button', { name: 'Sistem' }).click()
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', /./)
})

test('an exam rehearsal runs, survives a reload and shows its result', async ({ page }) => {
  await openApp(page, './exam')
  await screen(page).getByRole('button', { name: 'Başlat' }).first().click()
  await expect(page.getByText(/^Soru 1 \/ \d+$/)).toBeVisible()
  const first = page.locator('.ex-opt').first()
  await first.click()
  await expect(first).toHaveAttribute('aria-pressed', 'true')
  await first.click()
  await expect(first).toHaveAttribute('aria-pressed', 'false')
  await first.click()
  await page.getByRole('button', { name: 'Sonraki soru' }).click()
  await expect(page.getByText(/^Soru 2 \/ \d+$/)).toBeVisible()
  await page.reload()
  await expect(page.getByText(/^Soru 2 \/ \d+$/)).toBeVisible()
  await page.getByRole('button', { name: 'Bitir', exact: true }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Bitir' }).click()
  await expect(page.getByTestId('exam-score')).toContainText(/\d+ \/ \d+ doğru/)
  await expect(page.getByTestId('exam-score')).toContainText(/1 yanlış|0 yanlış/)
  await page.getByRole('link', { name: 'Yeni prova' }).click()
  await expect(screen(page).getByRole('heading', { name: 'Geçmiş provalar' })).toBeVisible()
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

for (const colorScheme of ['light', 'dark'] as const) {
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
