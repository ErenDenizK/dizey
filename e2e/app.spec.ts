import AxeBuilder from '@axe-core/playwright'
import { expect, type Page, test } from '@playwright/test'

const channel = process.env.E2E_CHANNEL ?? 'production'

async function openMap(page: Page) {
  await page.goto('./')
  await expect(page.getByRole('tab', { name: 'Dersler' })).toBeVisible()
}

test('course map renders', async ({ page }) => {
  await openMap(page)
  await expect(page.locator('#tiles')).not.toBeEmpty()
})

test('Profil shows version and commit', async ({ page }) => {
  await openMap(page)
  await page.getByRole('tab', { name: 'Profil' }).click()
  await expect(page.getByTestId('build-info')).toContainText(/Sürüm \d+\.\d+\.\d+ · ([0-9a-f]{7}|unknown)/)
  if (channel !== 'production') await expect(page.getByTestId('build-info')).toContainText(channel)
})

test('a lesson opens and steps forward', async ({ page }) => {
  await openMap(page)
  await page.evaluate(() => {
    const satir = (
      window as unknown as { satir: { openLesson: (step: number, code: string) => void; lessons: string[] } }
    ).satir
    satir.openLesson(0, satir.lessons[0] ?? '')
  })
  const count = page.locator('#count')
  await expect(count).toHaveText(/^1\//)
  await page.locator('#dock').getByRole('button', { name: 'İleri' }).click()
  await page.locator('#dock').getByRole('button', { name: 'İleri' }).click()
  await expect(count).toHaveText(/^2\//)
})

test('has no serious accessibility violations on the map', async ({ page }) => {
  await openMap(page)
  const results = await new AxeBuilder({ page }).analyze()
  const serious = results.violations.filter((v) => v.impact === 'critical')
  expect(serious.map((v) => v.id)).toEqual([])
})

for (const colorScheme of ['light', 'dark'] as const) {
  test(`phone screenshot, ${colorScheme}`, async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme })
    await openMap(page)
    await page.waitForTimeout(1200)
    await testInfo.attach(`map-${colorScheme}`, { body: await page.screenshot(), contentType: 'image/png' })
  })
}

test('only production registers a service worker', async ({ page }) => {
  await openMap(page)
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
  await openMap(page)
  const keys = await page.evaluate(() => Object.keys(localStorage))
  const satirKeys = keys.filter((k) => k.includes('satir'))
  if (channel === 'production') expect(satirKeys.every((k) => !/^pr-\d+:/.test(k))).toBe(true)
  else expect(satirKeys.every((k) => k.startsWith(`${channel}:`))).toBe(true)
})

test('unknown paths show the not-found view', async ({ page }) => {
  await page.goto('./no-such-page')
  await expect(page.getByText('Bu sayfa yok.')).toBeVisible()
})
