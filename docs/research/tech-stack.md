# Research: technical foundation

## 1. Question

Which stack gives Dizey (installed iPhone PWA, offline, manipulable math, exam-grade correctness, every build a product, all code written by Claude) the best long-term quality? Constraints: GitHub Pages from a private repo, a preview per PR. Result: [decision 0001](../decisions/0001-tech-stack.md).

## 2. Sources opened (2026-10-30)

- GitHub Docs, "What is GitHub Pages?": https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- GitHub Docs, "Creating a GitHub Pages site": https://docs.github.com/en/github/working-with-github-pages/creating-a-github-pages-site
- `rossjrw/pr-preview-action` README: https://github.com/rossjrw/pr-preview-action
- TypeScript blog (6.0, 7.0 beta/RC/stable, 7.1 beta): https://devblogs.microsoft.com/typescript/
- Vite 8 announcement and migration guide: https://vite.dev/blog/announcing-vite8 , https://vite.dev/guide/migration
- npm registry metadata (`npm view`): current versions and peer dependencies of every package named in the decision.
- Node.js release index: https://nodejs.org/dist/index.json
- Design-direction thread finding: KaTeX discussion 3788, where Temml's author lists Safari MathML problems (relayed, not re-opened here).

## 3. Findings

**Hosting**
- Pages in a private repo needs GitHub Pro, Team or Enterprise; Free supports public repos only. Pro is included in the GitHub Student Developer Pack.
- Quote: "GitHub Pages sites are publicly available on the internet, even if the repository for the site is private." Only Enterprise Cloud offers access control.
- One Pages site per repository.
- `actions/deploy-pages` v4: needs `pages: write` and `id-token: write`; its `preview` input is "only in alpha currently and is not available to the public"; with the Actions source the `github-pages` environment is protected (default branch) by default. Source: https://github.com/actions/deploy-pages . Consequence: previews are folders inside the single production deployment, built and deployed from `main` context.
- `pr-preview-action` (v1, considered, not used after Eren chose the Actions source): deploys each PR to `gh-pages/pr-preview/pr-<n>/`, posts a sticky comment (optionally with a QR code, useful for opening on the phone), removes the preview on close. Requires "Deploy from branch" (not the "GitHub Actions" source), read/write workflow permissions, and no fork PRs (irrelevant for us).

**Edge cases found by reasoning, to be covered by tests**
- Preview URLs sit inside the production service worker's scope (`/dizey/`). Without care, the production SW would answer preview navigations with the production shell. Fix: `navigateFallbackDenylist: [/\/pr-preview\//]`, no runtime caching under that path, previews register no SW.
- Previews share the origin `erendenizk.github.io` with production, so on a desktop browser they share IndexedDB. A preview with a new schema could migrate real progress. Fix: database name includes the deployment channel. (On iPhone, the installed app's storage is already separate from Safari.)
- Deep links on Pages need a `404.html` copy of `index.html`; inside the installed app the SW serves navigations, so this only matters for first visits.
- Every deploy replaces the whole site, so it must rebuild production and all open PRs together; a closed PR's preview disappears on the next deploy (the close event triggers one).

**Tooling versions (npm, 2026-10-30)**
react 19.3.1, vite 8.3.5, typescript 7.0.2, @vitejs/plugin-react 6.1.2 (peer vite ^8, optional React Compiler), @tanstack/react-router 1.170.x, motion 14.9.0, katex 0.19.1, temml 0.14.0, tailwindcss 4.3.3, vite-plugin-pwa 2.0.0 (peer vite up to ^8), vitest 5.0.5 (peer vite ^8 ok), @playwright/test 1.64.1, fast-check 4.10.2, @biomejs/biome 2.6.4, zod 4.6.7, dexie 4.4.7, react-aria-components 1.22.1, pnpm 12.16.1, Node 26 LTS. All peer ranges are compatible with Vite 8.

- TypeScript 7.0 (stable since 2026-07-08) is the Go-native port, about 10x faster than 6.0; 6.0 was the last JavaScript-based release. Tools that call the in-process compiler API are affected; Biome, Vite and Vitest do not depend on it.
- `mafs` (React interactive math): last release 2025-03-30, imposes its own visual style. Not chosen.

**Platform (iOS Safari)**
- Installed web apps: separate storage, no install prompt, no Vibration API (the iOS 18 `<input type="checkbox" switch>` gives a system haptic, only usable as optional garnish).
- View Transitions and `@starting-style` are available in Safari 18+. Not used: the kept lesson engine forbids motion outside its clock (see decision 0001, Motion).

**Animation engine (2026-10-30, after Eren chose to keep the earlier in-lesson engine)**
- Read the earlier engine's design notes (motion section) and its `Clock` and `Motion` classes in the live v21 build: a timer queue on a virtual clock, a semi-implicit spring integrator at 240 substeps/s, channels with tempo, snap/flush to finish a channel.
- Checked `motion-dom` 14.9.0 (`npm pack`): clock control exists only as global flags `MotionGlobalConfig.useManualTiming`, `instantAnimations`, `skipAnimations`.

## 4. Taken, rejected, why

Taken: everything in the decision table. Main reasons: React for ecosystem fit and AI-authoring reliability; own math core and matrix components because they are the product; KaTeX for consistent formulas on WebKit; the earlier engine's virtual clock, ported, because Eren kept that system and no library meets its per-channel rules; WebKit-first E2E because the target device is WebKit.

Rejected: Svelte 5, SolidJS, Vue (no advantage that outweighs ecosystem and AI reliability), Flutter web and React Native web (weak iOS PWA and text/math accessibility), Temml (Safari MathML issues), MathJax (weight), Motion and GSAP (no per-channel clock control), View Transitions (blocks input, outside the clock), Mafs (stale, foreign look), floating-point math libraries for answers (exactness), Python/SymPy checks (second language in CI for no gain once the TS core is property-tested).

## 5. Open questions

- Is GitHub Pro (Student Pack) active on Eren's account? Without it, Pages cannot publish from the private repo.
- Eren could not enable the repo-wide "Read and write" workflow permission (2026-10-30); not needed with per-job permissions.
- Is a public URL acceptable? (Assumed yes: nothing private is in a build.)
- 3D lessons (planes in R³): decide when the curriculum needs them.
- Re-check Safari MathML before ever switching KaTeX output modes.
