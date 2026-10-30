import { execSync } from 'node:child_process'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'
import pkg from './package.json' with { type: 'json' }

// Deployment channel: "production" for the site root, "pr-<n>" for a PR preview,
// "dev" locally. Only production gets a service worker (see docs/decisions/0001).
const channel = process.env.DIZEY_CHANNEL ?? 'dev'
const base = process.env.DIZEY_BASE ?? '/dizey/'
const isProduction = channel === 'production'

function shortCommit(): string {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7)
  try {
    return execSync('git rev-parse --short=7 HEAD', { encoding: 'utf8' }).trim()
  } catch {
    return 'unknown'
  }
}

export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_COMMIT__: JSON.stringify(shortCommit()),
    __APP_CHANNEL__: JSON.stringify(channel),
  },
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    VitePWA({
      disable: !isProduction,
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        name: 'Dizey',
        short_name: 'Dizey',
        lang: 'tr',
        description: 'Lineer cebir, adım adım.',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        background_color: '#ffffff',
        theme_color: '#ffffff',
        icons: [
          { src: 'icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // PR previews live under the production scope; never answer them with the production shell.
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/\/pr-preview\//],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts'],
  },
})
