import { defineConfig, devices } from '@playwright/test'

// E2E runs against a real production-like build served at the Pages base path.
// E2E_CHANNEL picks the deployment channel under test ("production" or a preview such as "pr-0").
const channel = process.env.E2E_CHANNEL ?? 'production'
const base = channel === 'production' ? '/dizey/' : `/dizey/pr-preview/${channel}/`
const port = 4173
// Cloud sandboxes without a WebKit download can point Chromium at a preinstalled binary.
const chromiumPath = process.env.PLAYWRIGHT_CHROMIUM_PATH

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${port}${base}`,
    trace: 'retain-on-failure',
  },
  projects: [
    // The target device: iPhone means WebKit.
    { name: 'iphone-webkit', use: { ...devices['iPhone 15'], viewport: { width: 390, height: 844 } } },
    {
      name: 'chromium',
      use: {
        ...devices['Pixel 7'],
        viewport: { width: 390, height: 844 },
        ...(chromiumPath ? { launchOptions: { executablePath: chromiumPath } } : {}),
      },
    },
  ],
  webServer: {
    command: `pnpm build && pnpm preview --port ${port} --strictPort`,
    url: `http://localhost:${port}${base}`,
    env: { DIZEY_CHANNEL: channel, DIZEY_BASE: base },
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
