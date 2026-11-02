// Shell jump audit: the same DOM step-function detector as jump-audit.mjs, run over the app's menu flows
// (tabs, settings, the lesson sheet, opening and closing a lesson, the chapter test, rozetler, the mistake
// book) with real progress on the device, so every section that only shows with data is on screen.
//
// Usage: pnpm build && pnpm preview --port 4173 &
//        node scripts/shell-audit.mjs [flow ...]
// The first run walks two lessons to build progress and keeps it in scripts/.shell-audit-state.json (git-ignored
// by name: delete it to rebuild). Env as jump-audit.mjs. Exit code 1 when anything is flagged.
import { existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'
import { film, shellFlows as flows, hooks, shellJumps, shellTap, walkLesson } from './jump-audit.mjs'

const base = process.env.REVIEW_URL ?? 'http://localhost:4173/dizey/'
const width = Number(process.env.W ?? 390)
const height = Number(process.env.H ?? 844)
const STATE = new URL('./.shell-audit-state.json', import.meta.url).pathname

const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {},
)

async function contextWith(storageState) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    colorScheme: 'dark',
    ...(storageState ? { storageState } : {}),
  })
  const { openAuditPage } = await import('./jump-audit.mjs')
  // Reuse the audit page's init scripts (virtual clock, sampler) on this context.
  const probe = await openAuditPage({ newContext: async () => context })
  return probe
}

if (!existsSync(STATE)) {
  const page = await contextWith()
  for (const id of ['m1-reading-a-matrix', 'm2-matrix-types']) await walkLesson(page, id, [])
  await writeFile(STATE, JSON.stringify(await page.context().storageState()))
  await page.context().close()
}

// SHOTS=172,214 saves those frames (and the ones either side) as PNGs in /tmp/claude-0/shell-shots.
const shots = new Set(
  (process.env.SHOTS ?? '')
    .split(',')
    .filter(Boolean)
    .flatMap((n) => [+n - 1, +n, +n + 2]),
)
if (shots.size) {
  const { mkdirSync } = await import('node:fs')
  mkdirSync('/tmp/claude-0/shell-shots', { recursive: true })
  hooks.onFrame = async (page, i) => {
    if (shots.has(i))
      await page.screenshot({ path: `/tmp/claude-0/shell-shots/f${String(i).padStart(4, '0')}.png` })
  }
}

const chosen = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(flows)
let total = 0
for (const name of chosen) {
  const page = await contextWith(STATE)
  const frames = []
  await page.goto(base)
  await page.waitForFunction(() => window.__dzReview && window.__dzSample)
  await film(page, frames)
  const start = frames.length
  const { tap, scrolled } = shellTap(page, frames)
  try {
    await flows[name]({ tap, page })
  } catch (error) {
    console.log(`${name}: flow stopped (${error.message.split('\n').slice(0, 8).join(' | ')})`)
    await page.screenshot({ path: `/tmp/claude-0/stopped-${name}.png` })
  }
  const jumps = shellJumps(frames, scrolled).filter((j) => j.frame > start)
  total += jumps.length
  console.log(`${name}: ${frames.length - start} frames, ${jumps.length} jumps`)
  for (const j of jumps) console.log(`  f${j.frame} ${j.kind} ${j.delta} .${j.cls} "${j.text}"`)
  await page.context().close()
}
await browser.close()
process.exit(total ? 1 : 0)
