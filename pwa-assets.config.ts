import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Placeholder mark until the brand direction is decided; regenerate with `pnpm icons`.
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: '#16181d' } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: '#16181d' } },
  },
  images: ['public/icons/icon.svg'],
})
