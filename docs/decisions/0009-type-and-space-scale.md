# 0009: One type and space scale, enforced by a test

- Status: accepted
- Date: 2026-10-31
- Ledger items: Eren 2026-10-31 22:54Z (spacing, density, fonts, weights and sizes across menus, buttons and lessons; highest bar)

## Context

The token system from decision 0006 had a 13-30 px type scale and a 4 px spacing rhythm, but component CSS did
not use it. A measured audit of the four main screens (`scripts/type-audit.mjs`) found 17 distinct font sizes
where the scale has 9, 23 raw rem sizes off the scale (13.6, 13.94, 17.85, 18.0, 20.4, 22.1, 27.2, 32.3 px),
32 raw weights, line heights that were too tight for small text (13/15.9, 14/17) and 40+ gaps off the grid
(5, 6, 7, 10, 14, 18, 22 px). Each was a reasonable local choice; together they are why screens did not feel
like one system. Details: `docs/research/type-and-space-audit.md`.

## Options

| Option | For | Against |
| --- | --- | --- |
| Fix the values once, by review | No new tooling | Drift returns with the next "just 14px here" |
| Stylelint with `stylelint-scales` | Mature rule set, autofix | New dev dependency and config (install needs Eren's OK), no role pairing, no proximity rule |
| Own Vitest guard over the CSS (chosen) | No dependency; checks exactly our rules (role size and line height travel together, math exemption, safe-area floors); runs in `pnpm check` | We maintain a small parser |

## Decision

Ten type roles with fixed size, line height, tracking and weight, line heights as whole even pixels in rem; a
4 px space grid with five named proximity steps (bound 4, related 8, item 12, block 16, group 32). Component CSS
may only use these tokens; `src/styles/type-space.test.ts` enforces it, with math (sized relative to its stage)
as the only exception. Spec: `docs/design/type-and-space.md`.

Follow-up the same night (Eren 23:28Z, "bigger, fuller, readable; nothing small or thin"): the whole scale moved
one step up (body 17 → 18, floor 13 → 14, display 30 → 32) and weights became theme tokens, lifted in dark.

## Consequences

- Every screen now uses the same nine sizes and the same gaps; a new screen gets them by default.
- Text-only lesson steps lost their one-off larger sizes (27 and 18 px): every step uses the same roles, which
  keeps step-to-step changes calm; the card carries the difference.
- Group gap grew from 24 to 32 px (screens breathe between sections); tab labels grew from 12 to 13 px (the
  scale's floor); the tab bar's inner padding went from 6 to 4 px (lens edges on the grid).
- A change to a value is now a token change, visible in one diff.
