# Type and space

How every text and every gap in Dizey is sized. Values live in `src/styles/tokens.css`; the role classes in
`src/ui/ui.css`; `src/styles/type-space.test.ts` fails the build when component CSS leaves the scale. This page
replaces the Type and Layout sections of [`visual-system.md`](visual-system.md), which described an earlier
Inter scale. Decision: [0009](../decisions/0009-type-and-space-scale.md). Audit and sources:
[`docs/research/type-and-space-audit.md`](../research/type-and-space-audit.md).

## Type: ten roles

One family (Onest, with Dizey Math for `+ − ± = ·` and Dizey Ident for the identity I). Every text in the app is
one of these roles; there is no eleventh size.

| Role | Size / line (px) | Weight | Tracking | Use |
| --- | --- | --- | --- | --- |
| display | 32 / 38 | 740 | −0.022 em | Screen titles, hero numerals (lesson count, exam score) |
| title1 | 26 / 32 | 740 | −0.017 em | Lesson step titles, the typed answer |
| title2 | 22 / 28 | 740 | −0.012 em | Chapter titles, verdict titles, stat values, keypad digits |
| title3 (headline) | 18 / 24 | 650 | −0.004 em | Card titles, every button label |
| body | 18 / 26 | 460 | 0 | Rows, UI text, lesson options (medium: they carry math) |
| read | 18 / 28 | 460 | 0 | Paragraphs: lesson narration, exam stems, solutions |
| callout | 17 / 24 | 460 | 0 | Dense reading: exam feedback and solutions |
| subhead | 16 / 22 | 460 | 0 | The secondary line under a title, segmented controls |
| footnote | 15 / 22 | regular or semibold | +0.004 em | Metadata, section labels (semibold), counters |
| caption | 14 / 20 | medium or semibold | +0.01 em | Tab labels, badges, tile names; eyebrows are caption semibold uppercase at +0.06 em |

**Larger and fuller (Eren 2026-10-31 23:28Z).** "Everything a bit bigger, fuller, comfortably readable; some
things feel small and thin." So the scale sits one step above the iOS defaults (body 18, floor 14), and every weight
sits above its nominal value: the app is dark only (0.24.0), and light text on a dark ground looks thinner than the
same weight dark on light (irradiation). Onest is variable, so 460 and 650 are real weights, not synthesised.
Weight names: regular 460, medium 560, semibold 650, bold 740.

Sizes are rem off the root, and the root is iOS Dynamic Type (`font: -apple-system-body`, 17 px by default), so
every role follows the user's text size. Line heights are rem too, so a role's line grows with it.

**Why these line heights.** Each is a whole even pixel at the default size, so text boxes stack on a 2 px grid
and two cards side by side line up. The ratio falls as size grows: 1.2 at display, 1.25 at title1, 1.3 at
title2, 1.33 at title3, 1.44 for UI body, 1.56 for reading and 1.47 at footnote. Large type needs less line space,
small type more; reading text gets the most because the eye has to find the next line.

**Why tracking changes with size.** Fonts are spaced for text sizes. Large sizes look loose and small sizes look
tight unless tracking is adjusted per size, which is what Apple's system fonts do through a tracking table
(WWDC20 "The details of UI typography"). Onest has no such table, so the roles carry it.

**Weights.** 400 reads, 600 names (card titles, buttons, labels), 700 heads (titles and big numerals). 500 is
for math glyphs and for small text on a tinted fill, where 400 looks thin. Hierarchy comes from size and
weight together, never from a second family, and ink colour (`--ink-1/2/3`) is the third lever.

**Inheritance.** `.dz` sets a unitless body leading (`--leading-base`), so an element that only changes its size
keeps a proportional line. A rule that sets a role size must also set that role's line height (tested).

**Math** is typeset relative to the stage that fits it (em, `cqw`, `--cell`), so inside math selectors relative
sizes, unitless line heights and their own spacing are allowed. Everything around the math is on the scale.

## Space: a 4 px grid and five proximity steps

Steps: 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 px (`--space-*`). 2 px only for hairline gaps inside a control
(segmented control, focus room). Between elements use the proximity names, so a gap says what the two things are
to each other:

| Name | px | Between |
| --- | --- | --- |
| `--gap-bound` | 4 | A value and its unit, a label and the value it names, lines of one exam card |
| `--gap-related` | 8 | A title and the line under it, lines of one block, list items in a lesson summary |
| `--gap-item` | 12 | Siblings: cards in a stack, the stage, narration and dock of a lesson |
| `--gap-block` | 16 | Blocks inside a card, card padding, the screen gutter |
| `--gap-group` | 32 | Unrelated groups; a section label sits in it, 8 above its card |

Each step is larger than the one inside it and a group is at least twice a block, so what belongs together
reads as one thing before a word is read (proximity). Tested.

**Fixed anatomy.**

- Screen: 16 px gutter, large title 24 above and 20 below, groups 32 apart, bottom clearance for the tab bar.
- Card: 16 px padding on every side (lists, exam cards, verdicts, lesson points). A button inside a card sits a
  block (16) below the text above it.
- Section label: footnote 600 in `--ink-2`, 32 above, 8 below, indented 16 so it starts on the text edge of the
  card under it, not on the card edge.
- Lesson: 12 between top bar, stage, narration and dock; 8 between eyebrow, title and body; 8 between dock
  actions; keypad keys 8 apart.
- Tab bar: 4 px inner padding, so the lens sits 4 px inside the glass on every side.

## Where this breaks

- At 200 % text the 14 px tab labels grow to 28 px and may not fit three tabs; plan: icon only with accessible
  names at the largest sizes (unchanged from the earlier plan).
- Lesson tile names on the path are caption (14 px) to fit three tiles in 390 px; at larger text they clamp at
  three lines. A lesson with a longer name must be checked on the path.
- `lab/sound-lab.css` is exempt until the sound lab rebuild lands (PR #57); the test fails once that file is clean
  so the exemption cannot be forgotten.
