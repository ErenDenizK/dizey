import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const channel = process.env.E2E_CHANNEL ?? 'production'

test('home renders with version and commit', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByRole('heading', { name: 'Dizey' })).toBeVisible()
  await expect(page.getByTestId('build-info')).toContainText(/Sürüm \d+\.\d+\.\d+ · [0-9a-f]{7}|unknown/)
})

test('has no serious accessibility violations', async ({ page }) => {
  await page.goto('./')
  const results = await new AxeBuilder({ page }).analyze()
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  expect(serious.map((v) => v.id)).toEqual([])
})

for (const colorScheme of ['light', 'dark'] as const) {
  test(`phone screenshot, ${colorScheme}`, async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme })
    await page.goto('./')
    await expect(page.getByRole('heading', { name: 'Dizey' })).toBeVisible()
    await testInfo.attach(`home-${colorScheme}`, { body: await page.screenshot(), contentType: 'image/png' })
  })
}

test('only production registers a service worker', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByRole('heading', { name: 'Dizey' })).toBeVisible()
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

test('unknown paths show the not-found view', async ({ page }) => {
  await page.goto('./no-such-page')
  await expect(page.getByText('Bu sayfa yok.')).toBeVisible()
})
