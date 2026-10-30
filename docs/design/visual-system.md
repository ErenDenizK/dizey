# Visual system

How every Dizey screen outside the lesson stage looks: layout, density, colour, type, depth. Motion is in
[`motion-system.md`](motion-system.md). Research and sources: [`docs/research/motion-and-visual-system.md`](../research/motion-and-visual-system.md).
Values live in `src/styles/tokens.css` (the only place raw values exist); component styles in `src/ui/ui.css`;
the living reference is the `/lab` page (`src/lab/`).

Status: provisional until Eren reviews the lab on his iPhone. Changes to values are logged in
[`docs/research/motion-tuning.md`](../research/motion-tuning.md).

## What "premium" means here

Eren asked for an interface that feels expensive, not flat, without copying any app. Expensive comes from craft,
not decoration. Five rules carry it:

1. **Depth has a reason.** Three planes only: the canvas, content on solid surfaces, and the functional layer
   (tab bar, title bar) floating on glass. Every shadow, blur and highlight says which plane a thing is on.
2. **Colour means something.** The chrome is monochrome ink on soft neutrals. Colour is reserved for meaning
   that the lessons own: row, column, correct, wrong. A colour seen in the shell always means the same as in a lesson.
3. **One family, many weights of attention.** One typeface, a strict scale, hierarchy by size and weight, never by
   a second font or by colour.
4. **Concentric geometry.** Every rounded thing inside another rounded thing has radius = outer radius − inset.
   Corners nest; nothing looks pasted on.
5. **Nothing waits, nothing jumps.** (motion-system.md) Craft in motion is what people feel first.

## Layout

| Token | Value | Use |
| --- | --- | --- |
| `--page-gutter` | 20 px | Screen edge to content, all screens |
| `--card-pad` | 16 px | Inside cards and list rows |
| `--stack-gap` | 12 px | Between items of one group |
| `--group-gap` | 32 px | Between unrelated groups (section label sits in this gap) |
| `--row-height` | 52 px | List row minimum (44 px target + breathing room) |
| `--target` | 44 px | Minimum touch target, everywhere |
| `--bar-height` / `--bar-inset` | 62 / 14 px | Floating tab bar |
| `--bar-clearance` | bar + bottom + 24 px | Bottom padding of every scrolling screen |

Spacing scale: 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 px (`--space-*`). Inside a group, spacing is at most half
the spacing between groups, so grouping is visible without lines.

**Screen anatomy (390 pt wide):** safe area top, 12 px, large title (34/41, 24 px above, 20 px below), content
groups, bottom clearance for the tab bar. Content width 350 px. When the large title scrolls under the top edge,
an inline title appears on glass (motion-system.md).

**Indentation:** one left edge per screen (the gutter). Text inside cards starts 16 px further in. List
separators start at the text edge, not the card edge, so the eye follows text, not boxes. No other indents.

## Density per screen

A screen has one job and shows it above the fold at the default text size:

| Screen | Above the fold (844 pt tall iPhone) | Rule |
| --- | --- | --- |
| Bugün | Title, one "continue" card, two to three next items | One recommended action; never more than one primary button |
| Harita | Title, the first group and part of the second | Rows, not tiles, until text size makes tiles impossible anyway |
| Sınav | Title, rehearsal card with its start button, past exams list | Start button inside the card, thumb zone |
| Ben | Title, settings group | Switches in rows; destructive actions last and separated |
| Sheet (medium) | Title, two to three lines, one action | If it needs more, it goes to the large detent, not a second sheet |

Text lines stay under about 34 em (`.dz-read`) so lesson paragraphs never run edge to edge on larger screens.

## Colour

Defined in OKLCH (perceptually even steps; light and dark tuned separately). Contrast of every text/ground pair is
tested automatically (`src/styles/tokens.test.ts`, 73 checks).

| Role | Light | Dark | Use |
| --- | --- | --- | --- |
| `--bg` | cool off-white | blue-black | Canvas |
| `--surface` | white | one step lighter | Cards, lists |
| `--surface-raised` | white | two steps lighter | Sheets, the lens, knobs |
| `--surface-sunk` | slightly darker than canvas | darker than surface | Wells, secondary buttons, switch track off |
| `--ink-1` / `--ink-2` / `--ink-3` | 4.5:1+ / 4.5:1+ / 3:1+ | same targets | Primary text / secondary text / non-essential UI |
| `--action` / `--on-action` | ink on white text | near-white on dark text | Primary button, switch on (7:1+) |
| `--hairline(-strong)` | ink at 10 % / 18 % | white at 9 % / 16 % | Separators, edges |
| `--ok-*`, `--bad-*` | bluish green, crimson | lighter versions | Correct, wrong (always with a mark and words) |
| `--row-*`, `--col-*` | blue, orange (Okabe-Ito pair) | lighter versions | Row and column in matrices (proposal; lesson thread decides) |

Each meaning colour has `-ink` (text, 4.5:1 on every ground and on its own tint), `-fill` (marks, 3:1 as a UI
part) and `-tint` (backgrounds). Row and column are blue and orange because that pair stays apart for every common
colour-vision deficiency; the earlier blue/purple pair did not. Meaning is never colour alone.

Light/dark: follows the system; the in-app switch sets `data-theme` (Eren allowed it). More themes later only by
adding a value block; component code never changes. Increase Contrast turns glass solid and secondary ink primary.

## Type

One family: **Inter** variable (self-hosted, `src/styles/fonts/`, SIL OFL), with `cv05` (l with a tail) and `cv08`
(I with serifs) on, so l, 1 and I never mix next to matrix indices, and optical sizing on. Numbers that line up
use `.num` (tabular figures).

| Role | Size / line | Weight | Tracking | Class |
| --- | --- | --- | --- | --- |
| Large title | 34 / 41 | 700 | −0.024 em | `.dz-large-title` |
| Title 1 | 28 / 34 | 700 | −0.019 em | |
| Title 2 | 22 / 28 | 700 | −0.019 em | `.dz-title2` |
| Title 3 | 20 / 25 | 600 | −0.019 em | `.dz-title3` |
| Headline | 17 / 22 | 600 | −0.011 em | `.dz-headline` |
| Body | 17 / 22 (reading: 1.5) | 400 | −0.011 em | `.dz` / `.dz-read` |
| Callout | 16 / 21 | 400 | −0.004 em | `.dz-callout` |
| Subhead | 15 / 20 | 400, ink-2 | −0.004 em | `.dz-subhead` |
| Footnote | 13 / 18 | 400, ink-2 | 0 | `.dz-footnote` |
| Caption | 12 / 16 | 500 | +0.01 em | tab labels use 11 / 13 |

Sizes are rem off the root, and the root is the user's iOS Dynamic Type size (`font: -apple-system-body`, 17 px by
default), so the whole scale follows the text-size setting. Rows and buttons grow with text; nothing truncates
before 200 %. Weights in use: 400, 500, 600, 700 only.

## Depth and materials

| Plane | Material | Tokens |
| --- | --- | --- |
| Canvas | Solid `--bg` | |
| Content | Solid surface, 22 px corners, layered soft shadow (light) or a lighter surface with a hairline top highlight (dark: shadows do not read on black) | `--shadow-1`, `--edge-light` |
| Functional layer | Glass: `--glass-fill` + blur 22 px + saturate 1.7, a bright rim on the top edge, a hairline outline, a deep soft shadow | `--glass-*`, `--shadow-2` |
| Overlay | Sheet on `--surface-raised`, 38 px top corners, upward shadow; scrim `--scrim` up to 36 %; the screen behind recedes over black (`--backdrop`) | `--shadow-3` |

Corners (concentric): device 55, sheet 38, card 22, inner controls 12, chips 10, capsules for buttons, tab bar and
switches. Under `prefers-reduced-transparency` and Increase Contrast, glass becomes solid.

## Components

- **Tab bar.** A capsule floating 14 px from the sides and bottom (above the home indicator), four destinations
  (Bugün, Harita, Sınav, Ben) with icon and label always visible. The active tab sits in a **lens**: a raised
  white (dark: translucent white) capsule inside the glass, with a soft shadow, so selection reads by shape, weight
  and depth, not colour. Icons are drawn for Dizey (`src/ui/icons.tsx`): Bugün is a 2 × 2 matrix with its next cell
  filled, Harita three connected topics, Sınav a paper with options, Ben a person; active icons gain a soft fill.
  Content scrolls under the glass and fades out above the bar (`.dz-edge-bottom`), answering the "what happens
  behind the bar" question: blur through the glass plus a soft fade, never a hard collision.
- **Inline title bar.** Invisible until the large title scrolls away, then glass with a hairline bottom edge.
- **Card.** Surface, 22 px corners, 16 px padding. Pressable cards use the press physics; no chevron on cards.
- **Grouped list.** One card around a group, 52 px rows, separators from the text edge, chevron in `--ink-3` for
  rows that navigate.
- **Buttons.** Primary: capsule, 52 px tall, `--action` fill, semibold label, a faint top highlight. Secondary:
  capsule on `--surface-sunk` with a hairline. One primary button per screen.
- **Switch.** 52 × 32 capsule; off track `--surface-sunk` with a 1.5 px `--ink-3` outline (3:1), on track
  `--action`; the knob is a raised disc. A native switch input on top carries semantics and the iOS haptic.
- **Sheet.** Grabber 36 × 5 (its 44 px hit area cycles detents), title, short text, one action.
- **Focus.** 2 px `--ink-1` outline, 3 px offset, never removed.

## Where this breaks (known)

- Glass over very busy content (a lesson matrix scrolled under the bar) could hurt label legibility; the regular
  glass plus the bottom fade should hold, check on device.
- Inter adds 344 kB once (precached). Subsetting to Latin + Turkish would cut it to about 100 kB; needs a font tool
  (install needs Eren's OK).
- At 200 % text, four tab labels may not fit 11 px; plan: labels wrap to icon-only with accessible names, decided
  when the shell is built.
- Row/column colours are a proposal; the kept lesson layer still uses its own blue/purple until the lesson rebuild.
