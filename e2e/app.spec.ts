import AxeBuilder from '@axe-core/playwright'
import { expect, type Page, test } from '@playwright/test'

const channel = process.env.E2E_CHANNEL ?? 'production'
const prefix = channel === 'production' ? '' : `${channel}:`

/** Opens the app past the first-launch install guide (covered by its own test). */
async function openApp(page: Page, path = './') {
  await page.addInitScript((key) => localStorage.setItem(key, '1'), `${prefix}dizey.onboarding.safari`)
  await page.goto(path)
  await expect(page.getByRole('navigation', { name: 'Bölümler' })).toBeVisible()
  // The lesson layer has published its catalog.
  await expect(page.getByText('Dersler yükleniyor…')).toHaveCount(0)
}

test('Today offers the next lesson', async ({ page }) => {
  await openApp(page)
  await expect(page.getByRole('heading', { name: 'Bugün' })).toBeVisible()
  await expect(page.getByTestId('continue-card')).toContainText('B1')
})

test('Map lists the lessons and Me shows version and commit', async ({ page }) => {
  await openApp(page)
  await page.getByRole('link', { name: 'Harita' }).click()
  await expect(page.getByRole('heading', { name: 'Determinant' })).toBeVisible()
  await page.getByRole('link', { name: 'Ben' }).click()
  await expect(page.getByTestId('app-version')).toContainText(/Sürüm \d+\.\d+\.\d+ · ([0-9a-f]{7}|unknown)/)
  if (channel !== 'production') await expect(page.getByTestId('app-version')).toContainText(channel)
})

test('a lesson opens from the shell, steps forward and hands back', async ({ page }) => {
  await openApp(page)
  await page.getByTestId('continue-card').click()
  const count = page.locator('#count')
  await expect(count).toHaveText(/^1\//)
  await page.locator('#dock').getByRole('button', { name: 'İleri' }).click()
  await page.locator('#dock').getByRole('button', { name: 'İleri' }).click()
  await expect(count).toHaveText(/^2\//)
  await page.locator('#lesson-close').click()
  await expect(page.getByTestId('continue-card')).toBeVisible()
  await expect(page.getByTestId('continue-card')).toContainText('2 / ')
})

test('a lesson opens from the map sheet', async ({ page }) => {
  await openApp(page, './map')
  await page.getByRole('button', { name: /B2/ }).click()
  await page.getByRole('button', { name: /^Derse gir/ }).click()
  await expect(page.locator('#count-lesson')).toContainText('B2')
})

test('an exam rehearsal runs, survives a reload and shows its result', async ({ page }) => {
  await openApp(page, './exam')
  await page.getByRole('button', { name: 'Başlat' }).first().click()
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
  await expect(page.getByRole('heading', { name: 'Geçmiş provalar' })).toBeVisible()
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
  await expect(page.getByTestId('continue-card')).toBeVisible()
  await expect(guide).toBeHidden()
})

test('backup round-trips progress', async ({ page }) => {
  await openApp(page, './me')
  const key = `${prefix}satir.v3.done`
  await page.evaluate((k) => localStorage.setItem(k, '{"B1":1}'), key)
  const backup = {
    app: 'dizey',
    format: 1,
    exportedAt: '2026-10-30T12:00:00.000Z',
    channel,
    entries: { 'satir.v3.done': '{"B1":1,"B2":2}' },
  }
  await page.getByTestId('restore-file').setInputFiles({
    name: 'dizey-yedek.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  })
  await page.getByRole('button', { name: 'Geri yükle', exact: true }).click()
  await expect(page.getByTestId('app-version')).toBeVisible()
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe('{"B1":1,"B2":2}')
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

for (const path of ['./', './map', './exam', './me']) {
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
      ['today', './'],
      ['map', './map'],
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
  const appKeys = keys.filter((k) => k.includes('satir') || k.includes('dizey'))
  expect(appKeys.length).toBeGreaterThan(0)
  if (channel === 'production') expect(appKeys.every((k) => !/^pr-\d+:/.test(k))).toBe(true)
  else expect(appKeys.every((k) => k.startsWith(`${channel}:`))).toBe(true)
})

test('unknown paths show the not-found view', async ({ page }) => {
  await openApp(page)
  await page.goto('./no-such-page')
  await expect(page.getByText('Bu sayfa yok.')).toBeVisible()
})
