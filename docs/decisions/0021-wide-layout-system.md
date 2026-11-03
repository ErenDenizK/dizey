# 0021: One layout system for wide screens

- Status: accepted (Eren, 2026-11-03: the 0.62.0 wide layout is broken; "design a system that works properly")
- Date: 2026-11-03
- Supersedes: the wide-screen rules of 0.62.0 (the 1000 px bottom-right card, the dock preview swap)
- Builds on: [0007](0007-one-path-screen.md), [0012](0012-today-map-you.md), [0011](0011-lesson-card-grows-from-tile.md)

## Context

0.62.0 made Yol and Sen wide-aware and nothing else. It also removed the app's frame column (the phone-width box
everything lived in) and gave `.dz-app` a transform, so every layer centred itself on its own axis: Yol and Sen on a
"left area", sheets (560) on the window centre, lessons (640 over a 408 strip), the rehearsal (a 560 sheet over a 440
strip with black bars), the tab bar on a third axis. A fixed bottom-right card (`.ph-dock`, `.me-aside`) sat outside
the flow, showed beside sheets, had no Escape or outside-tap dismissal and, on Sen, became a clipped nested scroller.
Tapping a node swapped the card's content instead of opening the peek: a second interaction model that read as "pages do
not open". Breakpoints differed per surface (600, 1000, `WIDE_FROM`, `WIDE_PATH`).

## Options

| Option | For | Against |
| --- | --- | --- |
| Patch each surface (more `max-width`s) | Small diff | It is how 0.62.0 happened: every surface has its own axis and width |
| Put the whole app back in one phone-width frame | Trivially consistent | A tablet or a computer window is a phone in a strip of black; Eren asked for a real adaptation |
| **One layout system: size classes, one axis, widths by purpose, an in-flow side column** | Every surface follows the same three rules; new screens inherit them | Touches every surface once, so it needs a guard over every screen (wide-walk) |
| A fixed side card or a swap-in preview (kept from 0.62.0) | Keeps "what to do" visible | See "Rejected" below |

## Decision

1. **Size classes, defined once.** Compact is under 600 px (today's phone, untouched), medium 600 to 1023, expanded from
   1024. The numbers live in `src/ui/size-class.ts` (`SIZE_FROM`), the `--size-*-from` tokens and the media queries
   (which cannot read variables); `size-class.test.ts` keeps all three equal and fails on any other wide breakpoint.
2. **One axis.** Every surface (tab screens, pushed routes, lessons, the rehearsal, dialogs, onboarding, labs, the tab
   bar) is centred on the window's centre. Nothing is left-anchored and nothing is fixed to a side. A screen's frame
   raises `--page-gutter` to `max(16px, (100vw - column) / 2)`, so everything inside that already measures from the
   gutter (negative margins, full-bleed paper) centres with it; fixed layers use `inset` and auto margins. `.dz-app`
   has no transform (a transform makes it the containing block of every fixed layer, which is how the axes split).
3. **Width by purpose** (tokens): `--measure-page` 640 (Sen, settings, onboarding, labs), `--measure-read` 640 on medium
   and 720 on expanded (a lesson, the rehearsal and its result, a question, a dialog), `--stage-wide` 1120 (Yol and Sen
   on expanded). Each surface's background spans the whole window; only the content takes the measure.
4. **Medium** is one centred column everywhere: Yol keeps its four-column path inside the page column with the dock as
   the phone's bottom card at the column's width; Sen is one column; the tab bar is centred.
5. **Expanded** Yol and Sen are one grid inside `--stage-wide`: the main column (Yol: the path; Sen: head, matrix, badges)
   and a 360 px side column **in the flow** (Yol: the dock card; Sen: the mistake log and the next badge). The side card
   is `position: sticky` under the safe area. It is not fixed and not a scroller, so a long mistake list makes the page
   longer, never the card.
6. **Sheets from 600 px are centred dialogs**: `min(--measure-read, window - 2 gutters)` wide, as tall as the content up to
   85 dvh (scrolling inside only past that), over a scrim that covers the whole window and everything behind it, closed
   by an outside tap, Escape or the existing drag. They fade and rise through the spring engine; reduced motion keeps the
   fade. The lesson peek is the same dialog. The rehearsal, a sheet on a phone, is a full-window route here.
7. **One interaction model at every size.** Tapping a node opens the peek, on a phone and on a computer.
8. **No type scale change** from 600 px up in this decision; only widths change.

## Rejected

- **A fixed side card.** It lives outside the flow, so it cannot share an axis with anything, shows beside dialogs
  (a scrim cannot cover a card that is above it in the stacking order, or stay below it without hiding what to do),
  needs its own dismissal and its own scrolling, and clipped on Sen. The in-flow sticky column has none of these: it
  scrolls with the page and the dialog's scrim covers it like any other content.
- **A swap-in preview in the dock slot.** It was a second way to open a lesson, with no dismissal and a "back" button
  to the first. One model (the peek) is learned once and works the same everywhere.

## Consequences

- Any new screen declares its measure (`Screen measure`, or a column on its own surface) and is added to the
  manifest of `e2e/wide-walk.spec.ts`, which measures every screen at 820, 1024, 1180 and 1440 and compares the phone's
  screenshots with baselines at 390 and 320.
- A change to the shell frame, the tokens in this decision or the overlays must run the whole walk.
- Weak spot: `100vw` stands for the window; where a browser reports a layout width that differs from `100vw` (a visible
  scrollbar, zoom) the column is a few pixels off centre. Scrollbars are hidden app-wide, so none is expected.
