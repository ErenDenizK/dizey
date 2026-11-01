// Type audit: measures every visible text element on the main screens at 390x844 (dark and light screenshots,
// computed size, weight, line height and tracking per element) and prints the distinct combinations per screen,
// so drift off the type scale shows as extra rows. Usage: pnpm build && pnpm preview --port 4173 &
//   node scripts/type-audit.mjs [outDir]   (env PLAYWRIGHT_CHROMIUM_PATH as in lesson-review.mjs)

import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const base = 'http://localhost:4173/dizey/'
const out = process.argv[2] ?? '/home/claude/audit/before'
await mkdir(out, { recursive: true })
const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {},
)
const result = {}
for (const theme of ['dark', 'light']) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    colorScheme: theme,
  })
  await ctx.addInitScript(() => localStorage.setItem('dizey.onboarding.safari', '1'))
  const page = await ctx.newPage()
  const screens = [
    ['path', ''],
    ['me', 'me'],
    ['exam', 'exam'],
    ['lesson', 'lesson/d1-determinant'],
  ]
  for (const [name, path] of screens) {
    await page.goto(base + path)
    await page.waitForTimeout(2500)
    await page.screenshot({ path: `${out}/${name}-${theme}.png`, fullPage: false })
    if (theme === 'dark')
      result[name] = await page.evaluate(() => {
        const rows = []
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
        const seen = new Set()
        while (walker.nextNode()) {
          const t = walker.currentNode
          if (!t.textContent.trim()) continue
          const el = t.parentElement
          if (seen.has(el)) continue
          seen.add(el)
          const r = el.getBoundingClientRect()
          if (r.width === 0 || r.bottom < 0) continue
          const s = getComputedStyle(el)
          if (s.visibility === 'hidden' || +s.opacity === 0) continue
          rows.push({
            sel:
              el.tagName.toLowerCase() +
              (el.className && typeof el.className === 'string'
                ? '.' + el.className.trim().split(/\s+/).join('.')
                : ''),
            text: t.textContent.trim().slice(0, 30),
            size: s.fontSize,
            weight: s.fontWeight,
            lh: s.lineHeight,
            ls: s.letterSpacing,
            fam: s.fontFamily.split(',')[0],
            y: Math.round(r.top),
          })
        }
        return rows
      })
  }
  await ctx.close()
}
await browser.close()
await writeFile(`${out}/type.json`, JSON.stringify(result, null, 1))
for (const [k, rows] of Object.entries(result)) {
  console.log(`\n## ${k}`)
  const combos = {}
  for (const r of rows) {
    const key = `${r.size} w${r.weight} lh${r.lh} ls${r.ls}`
    if (!combos[key]) combos[key] = []
    combos[key].push(`${r.sel} "${r.text}"`)
  }
  for (const [key, v] of Object.entries(combos).sort())
    console.log(key, ' x', v.length, ' e.g.', v.slice(0, 3).join(' | '))
}
