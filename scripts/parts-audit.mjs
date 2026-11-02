// Shared UI parts audit: on every main screen, reads the computed box and type of each shared part (buttons,
// rows, cards, section labels, page heads) and lists the distinct values per part family, so a part that drifts
// on one screen (a 44 px button among 52 px ones, a different radius) shows up as a second value.
// Usage: pnpm build && pnpm preview --port 4173 & ; node scripts/parts-audit.mjs [stateFile]
import { chromium } from '@playwright/test'

const base = process.env.REVIEW_URL ?? 'http://localhost:4173/dizey/'
const state = process.argv[2]
const FAMILIES = {
  'primary button': '.dz-button[data-kind="primary"], .sh-btn--primary',
  'secondary button': '.dz-button:not([data-kind="primary"]), .sh-btn--soft',
  'icon button': '.dz-icon-button, .ls-top__btn, .me-gear',
  row: '.dz-row, .me-row',
  'section label': '.dz-section-label',
  'list row': '.dz-list > li > *',
  option: '.ex-opt',
}
const PROPS = [
  'height',
  'border-radius',
  'font-size',
  'font-weight',
  'padding-left',
  'padding-top',
  'background-color',
  'color',
  'letter-spacing',
]
const screens = [
  ['Yol', '', null],
  ['Sen', 'me', null],
  ['Ayarlar', 'settings', null],
  ['Ders', 'lesson/m1-reading-a-matrix', null],
  ['Sınav', 'exam', null],
]
const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {},
)
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  colorScheme: 'dark',
  ...(state ? { storageState: state } : {}),
})
await context.addInitScript(() => localStorage.setItem('dizey.onboarding.safari', '1'))
const page = await context.newPage()
const table = {}
for (const [name, path] of screens) {
  await page.goto(base + path)
  await page.waitForTimeout(2000)
  const found = await page.evaluate(
    ({ families, props }) => {
      const out = {}
      for (const [family, selector] of Object.entries(families)) {
        for (const el of document.querySelectorAll(selector)) {
          if (el.closest('.ls-leaving')) continue
          const r = el.getBoundingClientRect()
          if (!r.width || !r.height) continue
          const cs = getComputedStyle(el)
          const key = props
            .map((p) => (p === 'height' ? `${Math.round(r.height)}px` : cs.getPropertyValue(p)))
            .join(' | ')
          out[family] ??= {}
          out[family][key] = (out[family][key] ?? 0) + 1
        }
      }
      return out
    },
    { families: FAMILIES, props: PROPS },
  )
  for (const [family, keys] of Object.entries(found))
    for (const [key, n] of Object.entries(keys)) {
      table[family] ??= {}
      table[family][key] ??= []
      table[family][key].push(`${name}×${n}`)
    }
}
console.log(PROPS.join(' | '))
for (const [family, keys] of Object.entries(table)) {
  console.log(`\n${family}: ${Object.keys(keys).length} variant(s)`)
  for (const [key, where] of Object.entries(keys)) console.log(`  ${key}   ← ${where.join(', ')}`)
}
await browser.close()
