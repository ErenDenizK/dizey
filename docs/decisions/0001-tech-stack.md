# 0001: Technical foundation (stack, hosting, PWA, math, motion, testing)

- Status: accepted (Eren, 2026-10-30 14:22Z; Pages source changed to GitHub Actions at his request); inline math superseded by [0008](0008-own-math-typesetter.md)
- Date: 2026-10-30
- Ledger items: plan step 2 (tech foundation); Eren's decisions of 2026-10-30 (PWA on iPhone, stack chosen from scratch, overkill allowed, GitHub Pages, every build is a product)
- Research: [`docs/research/tech-stack.md`](../research/tech-stack.md)

## Context

Dizey is a lesson app for linear algebra, used first and mostly on Eren's iPhone as an installed PWA, offline on the metro, from the first prototype onward. Every merged PR is a product: it must be stable and must migrate stored progress, never break it. The app's signature is manipulable math (matrices and vectors that move, highlight, swap rows, transform space), with exam-grade correctness. All code is written by Claude and reviewed by Eren, so the stack must be one Claude writes reliably and Eren can follow. Hosting is GitHub Pages from a private repository, with a preview build for every PR. Nothing from the earlier project is a default; it used a single hand-built HTML file and none of its choices were considered here.

Hard platform facts that shape the choice (sources in the research report):

- iPhone means WebKit, always. Installed home-screen web apps get their own storage, separate from Safari. No Vibration API; no install prompt (we must show an "Add to Home Screen" guide). View Transitions and `@starting-style` are available in Safari 18+.
- GitHub Pages from a private repository needs GitHub Pro (free with the GitHub Student Developer Pack). The published site is public on the internet even when the repo is private.
- Pages source is "GitHub Actions" (Eren's choice): no `gh-pages` branch, one deployment per site. `actions/deploy-pages` has a `preview` input, but it is alpha and not public, and the `github-pages` environment only accepts deployments from the default branch by default. So per-PR previews must be folders inside the one production deployment, under `/<repo>/pr-preview/pr-<n>/`: inside the production service worker's scope and on the same origin as production.

## Options

### UI framework

| Option | For | Against |
| --- | --- | --- |
| **React 19 + TypeScript** | Largest ecosystem for exactly our needs (React Aria, three.js via React Three Fiber if 3D is ever needed); the framework Claude writes most reliably, which matters when all code is AI-written; React Compiler removes manual memoisation; Capacitor wrap stays open if native is ever wanted. | Larger runtime (~60 kB gz), irrelevant for an installed, precached PWA; more ceremony than Svelte. |
| Svelte 5 | Built-in transitions, less code, small output. | Runes are recent, so less reliable AI output; Motion has no first-class Svelte binding; smaller accessible-primitives ecosystem. |
| SolidJS | Fastest fine-grained updates. | Small ecosystem; animation and a11y libraries thin. |
| Vue 3 | Mature, good transitions. | No advantage over React for our needs; smaller math/animation ecosystem. |
| Flutter web / React Native web | One codebase for later native. | Weak PWA story on iOS, non-DOM text (Flutter) hurts accessibility and math typography. |

### Hosting and previews

| Option | For | Against |
| --- | --- | --- |
| **GitHub Pages (Pro), "GitHub Actions" source, one combined deployment: production at the root + each open PR in `pr-preview/pr-<n>/`** | Eren's choice; no `gh-pages` branch; deploys only from `main` context, so the default environment protection stays on; every job declares its own minimal permissions, so the repo-wide "Read and write" setting is not needed. | Each deploy rebuilds every open PR (few at a time, so cheap); site is public; previews share origin and SW scope with production (both handled below). |
| GitHub Pages, "Deploy from branch" + `rossjrw/pr-preview-action` | Ready-made previews with a sticky comment. | Needs a `gh-pages` branch and the repo-wide read/write workflow setting, which Eren could not enable; Eren prefers the Actions source. |
| Cloudflare Pages / Netlify | Native per-PR previews on separate origins, access control possible. | Another service and account; Eren chose Pages. Kept as fallback. |

### Math typography

| Option | For | Against |
| --- | --- | --- |
| **KaTeX (HTML + MathML output)** | Same look on every device, synchronous and fast, accessible MathML alongside. | Font files (~250 kB, precached once). |
| Temml (MathML only) | Tiny, native rendering. | Its author reports Safari MathML problems (accents, boxes, extensible arrows); look varies by system. |
| MathJax 4 | Most complete. | Heavier and slower; we need a small subset. |

### Motion

| Option | For | Against |
| --- | --- | --- |
Amended 2026-10-30 (before merge): Eren chose to keep the earlier app's in-lesson presentation, animation system and sound system. That system's rules: every animation (springs, cue timers, particles) runs on one virtual clock, so a tap can finish any running animation per channel, tests step time deterministically, teaching channels run at their own tempo, and reduced motion is one switch; no CSS transitions for movement, no Web Animations API, no `setTimeout`, no View Transitions (they block input and run outside the clock).

| Option | For | Against |
| --- | --- | --- |
| **Port the earlier engine's clock and spring integrator to TypeScript (`src/engine/`)** | Meets every rule above by construction; about 400 lines, no dependency; framework-agnostic, animates DOM nodes through refs, so React never re-renders per frame; its tuned constants (springs, choreography, tempo) carry over unchanged. | We own and test it. |
| Motion (motion.dev) | Springs, gestures, layout animation. | Clock control is only global (`MotionGlobalConfig.useManualTiming`, `instantAnimations`, `skipAnimations`); no per-channel finish or tempo; transform and opacity can run on WAAPI, outside any virtual clock. |
| GSAP (now free) | Timelines with a global ticker. | Same gaps per channel; imperative; second system next to the kept engine. |
| View Transitions / CSS transitions | Zero cost. | Explicitly rejected by the kept system: block input, wall-clock time. |

## Decision

| Layer | Choice | Notes |
| --- | --- | --- |
| Language | TypeScript 7 (native compiler), `strict` plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` | TS 7 has no in-process compiler API; we use no tool that needs it. Fallback: pin TS 6.0. |
| Runtime and packages | Node 26 LTS, pnpm 12 | pnpm runs no dependency install scripts unless allow-listed, which matches our "install nothing unreviewed" rule. |
| Build | Vite 8 (Rolldown) | `base: '/dizey/'` for production, `/dizey/pr-preview/pr-<n>/` for previews. |
| UI | React 19 with React Compiler, React Aria Components for accessible primitives | Headless: all visuals are ours. |
| Routing | TanStack Router (file-based, typed), browser history, `404.html` fallback for deep links | The service worker serves the app shell offline. |
| Styling | Tailwind CSS v4 with the default theme removed, so only Dizey's tokens exist; tokens are CSS custom properties from one source | Prevents stock palettes and raw values; lint rule against arbitrary values. |
| Math core | In-house exact arithmetic in TypeScript: `bigint` rationals, matrices, row operations, determinant, inverse, RREF, solution classification | Every number shown in a lesson or checked as an answer comes from here. No floating point in answers. |
| Math display | Own SVG/DOM components for matrices and vectors (the signature element); KaTeX only for inline formulas | Matrix cells are real elements, so they can move, highlight and be dragged. |
| Motion | Own engine (`src/engine/`): one virtual clock, interruptible springs, channels (`chrome`, `beat`, `reveal`) with per-channel tempo and finish, free-physics tickers, reduced motion as one switch; driven by `requestAnimationFrame` with frames capped at 64 ms. The whole app (lesson layer and new shell) uses it. | Its timing values (springs, choreography, shifts, tempo) are starting defaults in `src/engine/constants.ts`, each to be reviewed on iPhone screen recordings with changes logged with reasons (Eren, 2026-10-30); the principles are fixed. The full lesson player is ported in the lesson-layer step. 3D (three.js) only if a lesson truly needs it, lazy-loaded. |
| Feedback | Web Audio sound, ported from the earlier app's sound system as Eren asked; no haptics promised (iOS has no Vibration API) | |
| Content | Lessons as typed TypeScript modules (English keys, Turkish text), validated by Zod 4 schemas at test time | Lets tests recompute every answer with the math core. |
| Persistence | IndexedDB through Dexie (versioned schema with migrations), `navigator.storage.persist()`, JSON export/import of progress | Database name is namespaced by deployment (production vs each preview) so previews never touch real progress. |
| PWA | `vite-plugin-pwa` (Workbox `generateSW` for now; `injectManifest` once we need custom worker code), precache app shell and fonts, "new version" prompt instead of silent reload, `@vite-pwa/assets-generator` for icons and iOS splash images, in-app "Add to Home Screen" guide | Production SW excludes `/pr-preview/` from navigation fallback and caching; preview builds register no SW. |
| Quality tooling | Biome 2 (lint + format), `tsc --noEmit` | |
| Tests | Vitest 5 (unit), fast-check (property tests for the math core), Playwright with WebKit on an iPhone profile (E2E and 390 px screenshots, light and dark), `@axe-core/playwright` (accessibility) | Content tests: every exercise's answer recomputed by the math core. |
| CI/CD | GitHub Actions. `ci.yml` on every PR: typecheck, lint, unit, build, E2E. `pages.yml` on push to `main`, on `workflow_run` after CI of a PR, and on PR close: checks out `main` and every open same-repo PR by SHA, builds each with its own base path, assembles one artifact, deploys with `actions/deploy-pages`, then upserts one PR comment with the preview link (job permissions: `contents: read`, `pages: write`, `id-token: write`, `pull-requests: write`). | Runs in `main` context, so the environment's default-branch rule holds. Only same-repo PRs are built (private repo, no forks). Version and short commit hash shown in the app. |

## Consequences

- Easier: one language end to end (app, content, math checks, tests); math correctness is testable by construction; every PR gets a link Eren can open on his phone.
- Harder: we own the math core and the matrix components; that is deliberate, because they are the product.
- Eren: GitHub Pro (Student Pack) active; Pages source "GitHub Actions" (done). The repo-wide workflow permission can stay read-only.
- Privacy: the production site and previews are public URLs. No raw course material, lecturer notes or personal data may ever be in a build. If that becomes a problem, move hosting to Cloudflare Pages with access control (new decision).
- Watch: TS 7 ecosystem gaps (fallback TS 6); Safari storage behaviour (export/import as a safety net); preview/production isolation (tested in E2E: a preview build must not register a service worker).
- Exact versions are pinned in `package.json` when the app is scaffolded, not here.
