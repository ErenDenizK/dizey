# Type and space audit (2026-10-31)

Question: how far is the app from its own type and space scale, and what scale should it hold to?

## Method

1. `scripts/type-audit.mjs` opens Dersler, Profil, Sınav and lesson D1 at 390 × 844 (dark and light) and records
   the computed size, weight, line height and tracking of every visible text element.
2. A source scan of every component stylesheet for raw sizes, weights, tracking, line heights and gaps (now the
   test `src/styles/type-space.test.ts`).
3. `scripts/lesson-walk.mjs` steps through lesson D1 (each landed beat, options, a wrong pick, keypad, verdict,
   end) on the old and the new build for side-by-side sheets.

## Findings (before)

- Sizes: 17 distinct computed sizes on four screens; off-scale ones were 13.6 (eyebrow), 13.94 (lesson count),
  17.34 (exam text), 18.0 (lesson options, text-only body), 20.4 (verdict title), 22.1 (typed answer),
  27.2 (text-only title, exam score), 32.3 (unused shell title), 12 (tab labels, below the 13 px floor).
- Line heights: footnote 14/17 and caption 13/15.9 were tighter than body text in ratio (1.21, 1.22), so small
  labels looked cramped; titles used 1.15-1.25 ad hoc.
- Weights: 32 raw numbers; 500 and 600 used interchangeably for the same kind of label.
- Tracking: 4 different raw values (0.02, 0.04, −0.01, −0.015 em) outside the tokens.
- Space: 137 raw px gaps, of them 40+ off the 4 px grid (5, 6, 7, 10, 14, 18, 22); card padding 14, 16 or 18
  depending on the card; lesson verdict 14/14/16; group gap 24 against a 12 item gap and 16 card padding, so
  sections did not read as clearly separate.

## Sources

- WWDC20 "The details of UI typography", notes: https://wwdcnotes.com/documentation/wwdc20-10175-the-details-of-ui-typography/
  Took: tracking must be size-specific; text styles bundle size, weight and leading; tight/loose leading is ±2 pt
  around the standard; bold emphasis is a weight step, not a new size.
- Apple HIG, Typography: https://developer-mdn.apple.com/design/human-interface-guidelines/foundations/typography
  Took: Dynamic Type as the root of the scale (already in place); minimum sizes.
- stylelint-scales: https://awesome.ecosyste.ms/projects/github.com%2Fjeddy3%2Fstylelint-scales
  Considered for enforcement; rejected (see decision 0009): a new dependency, and it cannot express role pairing
  (a size must travel with its line height) or our math exception.

## What we took

The ten roles, line heights and proximity steps in `docs/design/type-and-space.md`, and the test that holds them.

## What we did not change

- Sizes inside the lesson stage (math scales with the stage; owned by the lesson threads).
- Radii and colours (design director thread), layout of the path tiles (Dersler thread).
