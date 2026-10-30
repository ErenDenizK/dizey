# 0004: Motion engine and visual system, rebuilt from scratch

- Status: accepted provisionally (Eren reviews the `/lab` page on his iPhone; values tune from there)
- Date: 2026-10-30
- Ledger items: Eren's message of 2026-10-30 16:45Z (deep motion research; premium, not flat; the tab bar looks
  cheap; nothing old used directly; verify frame by frame)
- Research: [`docs/research/motion-and-visual-system.md`](../research/motion-and-visual-system.md)
- Specs: [`docs/design/visual-system.md`](../design/visual-system.md), [`docs/design/motion-system.md`](../design/motion-system.md)

## Context

Decision 0001 ported the earlier app's clock and spring engine with its constants. Eren then asked that nothing
from the old app is used directly: take its logic, rebuild, and check every value. Research showed the old
constants were Material Design's Android defaults (0.17-0.36 s), not values chosen for Dizey or for iOS. The shell
also had placeholder tokens only.

## Options

| Option | For | Against |
| --- | --- | --- |
| Keep the ported engine, retune constants | Least work | Numerical stepping (substeps) and k/ζ values nobody can reason about; Eren asked for a rebuild |
| Motion library (motion.dev, react-spring) | Ready gestures | No per-channel finish or virtual clock (0001); WAAPI runs outside our clock |
| **New engine: same guarantees, springs solved in closed form, described by duration and bounce** | Exact at any frame rate; values readable as "0.5 s, no bounce"; one place for gestures and press physics | We own and test it (19 unit tests) |

## Decision

A new engine in `src/engine/` keeps the logic Eren liked (one virtual clock, channels that can be finished at
once, tempo, reduced motion as one switch) and replaces the rest: closed-form damped springs described by
perceptual duration and bounce, eight named springs, effects that never overshoot, velocity hand-off, launch for
tap-started motion, UIKit-style projection and rubber band, physical press depth. A new token system in
`src/styles/tokens.css` (OKLCH colour with tested contrast, Inter variable type on a Dynamic Type root, 4 px
spacing, concentric corners, a three-plane depth model with glass only on the functional layer), and components
in `src/ui/` built on both. The `/lab` route is the living reference. Old preset names (`press`, `land`, `ui`,
`move`) and `PRESS_SCALE` still resolve to the new springs so code written against the port keeps working while it
migrates.

## Consequences

- Easier: every motion and colour has one named source; frame-by-frame review is a script
  (`scripts/motion-review.mjs`); the shell and the lesson rebuild share one vocabulary.
- Harder: Inter adds 344 kB to the precache until it is subset.
- Watch: 120 Hz on device, glass cost while scrolling, back swipe in standalone mode, Dynamic Type through
  `-apple-system-body`. The v21 lesson layer still runs on its own engine and tokens until its rebuild.
