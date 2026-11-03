// Onboarding jump audit: the DOM step-function detector of jump-audit.mjs, run over the first-run scene's flows
// (the story to the hand-off, the wrong-answer path, the skip) on a fresh install, frame by frame on the virtual clock.
//
// Usage: pnpm build && pnpm preview --port 4173 &
//        node scripts/onboarding-audit.mjs [flow ...]
// Env as jump-audit.mjs. Exit code 1 when anything is flagged.
import { chromium } from '@playwright/test'
import { film, hooks, onboardingFlows, openAuditPage, shellJumps, shellTap } from './jump-audit.mjs'

const home = process.env.REVIEW_URL ?? 'http://localhost:4173/dizey/'
const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(onboardingFlows)
const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {},
)
let total = 0
for (const name of names) {
  const page = await openAuditPage(browser, undefined, { fresh: true })
  await page.goto(home)
  await page.waitForFunction(() => '__dzReview' in window && '__dzSample' in window)
  const frames = []
  hooks.onFrame = null
  await film(page, frames)
  const { tap, scrolled } = shellTap(page, frames)
  await onboardingFlows[name]({ tap, page })
  const jumps = shellJumps(frames, scrolled)
  total += jumps.length
  console.log(`${name}: ${frames.length} frames, ${jumps.length} jumps`)
  for (const j of jumps) console.log(`  f${j.frame} ${j.kind} ${j.delta} .${j.cls} "${j.text}"`)
  await page.context().close()
}
await browser.close()
process.exit(total ? 1 : 0)
