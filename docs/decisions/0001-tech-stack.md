# 0001: Technical foundation (stack, hosting, PWA, math, motion, testing)

- Status: proposed
- Date: 2026-10-30
- Ledger items: plan step 2 (tech foundation); Eren's decisions of 2026-10-30 (PWA on iPhone, stack chosen from scratch, overkill allowed, GitHub Pages, every build is a product)
- Research: [`docs/research/tech-stack.md`](../research/tech-stack.md)

## Context

Dizey is a lesson app for linear algebra, used first and mostly on Eren's iPhone as an installed PWA, offline on the metro, from the first prototype onward. Every merged PR is a product: it must be stable and must migrate stored progress, never break it. The app's signature is manipulable math (matrices and vectors that move, highlight, swap rows, transform space), with exam-grade correctness. All code is written by Claude and reviewed by Eren, so the stack must be one Claude writes reliably and Eren can follow. Hosting is GitHub Pages from a private repository, with a preview build for every PR. Nothing from the earlier project is a default; it used a single hand-built HTML file and none of its choices were considered here.

Hard platform facts that shape the choice (sources in the research report):

- iPhone means WebKit, always. Installed home-screen web apps get their own storage, separate from Safari. No Vibration API; no install prompt (we must show an "Add to Home Screen" guide). View Transitions and `@starting-style` are available in Safari 18+.
- GitHub Pages from a private repository needs GitHub Pro (free with the GitHub Student Developer Pack). The published site is public on the internet even when the repo is private.
- Per-PR previews on Pages (`rossjrw/pr-preview-action`) need the "Deploy from branch" source and live under `/<repo>/pr-preview/pr-<n>/`, inside the production service worker's scope and on the same origin as production.

## Options

### UI framework

| Option | For | Against |
| --- | --- | --- |
| **React 19 + TypeScript** | Largest ecosystem for exactly our needs (Motion's layout/gesture API, React Aria, three.js via React Three Fiber if 3D is ever needed); the framework Claude writes most reliably, which matters when all code is AI-written; React Compiler removes manual memoisation; Capacitor wrap stays open if native is ever wanted. | Larger runtime (~60 kB gz), irrelevant for an installed, precached PWA; more ceremony than Svelte. |
| Svelte 5 | Built-in transitions, less code, small output. | Runes are recent, so less reliable AI output; Motion has no first-class Svelte binding; smaller accessible-primitives ecosystem. |
| SolidJS | Fastest fine-grained updates. | Small ecosystem; animation and a11y libraries thin. |
| Vue 3 | Mature, good transitions. | No advantage over React for our needs; smaller math/animation ecosystem. |
| Flutter web / React Native web | One codebase for later native. | Weak PWA story on iOS, non-DOM text (Flutter) hurts accessibility and math typography. |

### Hosting and previews

| Option | For | Against |
| --- | --- | --- |
| **GitHub Pages (Pro), branch deploy, PR previews in subfolders** | Eren's choice; everything stays in GitHub; free with Student Pack. | Site is public; previews share origin and SW scope with production (both handled below). |
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
| **Motion (motion.dev) for React + native CSS/View Transitions** | Interruptible springs, gestures (drag), layout and shared-element animation, hardware-accelerated where possible, reduced-motion support. | One more dependency. |
| GSAP (now free) | Powerful timelines. | Imperative, duplicates Motion, fights React's rendering model. |
| CSS only | Zero cost. | No interruptible springs or drag physics, which the matrix manipulation needs. |

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
| Motion | Motion for React for springs, drag and layout; View Transitions and `@starting-style` for screen changes; `prefers-reduced-motion` honoured everywhere | 3D (three.js) only if a lesson truly needs it, lazy-loaded. |
| Feedback | Web Audio for sound; no haptics promised (iOS has no Vibration API) | |
| Content | Lessons as typed TypeScript modules (English keys, Turkish text), validated by Zod 4 schemas at test time | Lets tests recompute every answer with the math core. |
| Persistence | IndexedDB through Dexie (versioned schema with migrations), `navigator.storage.persist()`, JSON export/import of progress | Database name is namespaced by deployment (production vs each preview) so previews never touch real progress. |
| PWA | `vite-plugin-pwa` (Workbox, `injectManifest`), precache app shell and fonts, "new version" prompt instead of silent reload, `@vite-pwa/assets-generator` for icons and iOS splash images, in-app "Add to Home Screen" guide | Production SW excludes `/pr-preview/` from navigation fallback and caching; preview builds register no SW. |
| Quality tooling | Biome 2 (lint + format), `tsc --noEmit` | |
| Tests | Vitest 5 (unit), fast-check (property tests for the math core), Playwright with WebKit on an iPhone profile (E2E and 390 px screenshots, light and dark), `@axe-core/playwright` (accessibility) | Content tests: every exercise's answer recomputed by the math core. |
| CI/CD | GitHub Actions: on PR run typecheck, lint, unit, build, E2E, then deploy the preview; on `main` deploy production to `gh-pages` root without touching `pr-preview/` | Version and short commit hash injected at build and shown in the app. |

## Consequences

- Easier: one language end to end (app, content, math checks, tests); math correctness is testable by construction; every PR gets a link Eren can open on his phone.
- Harder: we own the math core and the matrix components; that is deliberate, because they are the product.
- Eren must: have GitHub Pro (Student Pack) active, set Pages source to "Deploy from branch: gh-pages / root", and set Actions workflow permissions to read and write.
- Privacy: the production site and previews are public URLs. No raw course material, lecturer notes or personal data may ever be in a build. If that becomes a problem, move hosting to Cloudflare Pages with access control (new decision).
- Watch: TS 7 ecosystem gaps (fallback TS 6); Safari storage behaviour (export/import as a safety net); preview/production isolation (tested in E2E: a preview build must not register a service worker).
- Exact versions are pinned in `package.json` when the app is scaffolded, not here.
