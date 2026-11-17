# iOS screen edges: iPhone and iPad, Safari and the installed app

Date: 2026-11-17. Trigger: Eren reported that on iPhone the tab bar sits too high in the Home Screen app, and on iPad
there are problems at the top and a line at the bottom.

## Pre-mortem: every plausible cause

| # | Suspect | Verdict |
| --- | --- | --- |
| 1 | iOS 26 standalone short viewport: with `viewport-fit=cover` + `black-translucent`, while the document is shorter than the screen, WebKit gives the page a viewport short by the status-bar height (402x874 pt iPhone: 812 pt). The fixed app frame (`.dz-app`, `inset: 0`) stops above the home indicator, the tab bar floats ~62 pt too high, iOS paints the rest in the page colour | **Root cause of the iPhone report.** Matches Eren's 2026-11-04 screenshot pixel for pixel (map cut ~62 pt above the bottom, bar 86 pt up instead of 24). On iPad the same band is the status-bar height (24 pt): the "line at the bottom" |
| 2 | Safe-area inset double counted (screen padding + bar offset) | No: `--bar-bottom` is `max(14px, inset - 10px)`, used once; measured 24 px gap on iPhone, 14 px on iPad with emulated insets |
| 3 | `100vh` vs `dvh/svh/lvh` | `dvh` used for min-heights and sheet caps; correct once the viewport is full |
| 4 | Status-bar style / `theme-color` / html background | Kept: `black-translucent` gives full bleed at the top; html background is `--bg`, so any band iOS paints matches the page |
| 5 | Backdrop-filter blur layers over the top | Top fade (`.dz-edge-top`) is invisible until the page scrolls; masthead is solid. No resting blur over content |
| 6 | iPadOS 26 windowed apps (Stage Manager / windowed mode) | Window controls sit over the top-left corner of an installed app and `env(safe-area-inset-top)` reports 0 there (dev.to report). Our top-left holds the chapter header and the back button. Mitigated with a 32 px floor on `--safe-top` for touch screens of 600 px and up in standalone |
| 7 | Orientation change, split view, keyboard | `100%`, `lvh` and `env()` recompute; in standalone iOS never resizes the layout viewport for the keyboard |
| 8 | Widescreen layout system (0.75.0) | Uses the same tokens; walked at 820x1180 with insets |

## Fix

- `src/styles/app.css`: `@media (display-mode: standalone) { html { min-height: min(100lvh, calc(100% + env(safe-area-inset-top, 0px))); } }`.
  A document at least screen tall gets the full viewport; `min()` keeps it at the visible height wherever the viewport is
  already full or the inset is 0, so the page never scrolls (WebKit 316008: `lvh` with an opaque bar).
- `--safe-top` / `--safe-bottom` tokens in `tokens.css`; every edge reads them, never `env()` directly (guard:
  `src/styles/safe-area.test.ts`). This is also what makes insets emulable in Playwright.

## Sources

- WebKit bug 301108 (iOS 26 viewport-fit regression), still open 2026-11-16: https://bugs.webkit.org/show_bug.cgi?id=301108
- frappe-ui PR #1284 (the html min-height rule, iOS 26.2 simulator): https://github.com/frappe/frappe-ui/pull/1284 and frappe/gameplan PR #608
- AltanS/collie PR #355 (`100lvh` in standalone, verified on an iOS 26 iPhone): https://github.com/AltanS/collie/pull/355
- tpdbf5509/busssss PR #23 (measurements: innerHeight 797 on an 844 screen, inset-top 47): https://github.com/tpdbf5509/busssss/pull/23
- "PWA in iPadOS 26 is a joke" (window controls, no inset): https://dev.to/reinhart1010/pwa-in-ipados-26-is-a-joke-38g1

## Taken / rejected

- Taken: the html min-height rule (no JS, no change to the frame); the token indirection.
- Rejected: sizing the frame to `screen.height` in JS (reported to move the bar into the clipped area); dropping
  `viewport-fit=cover` or `black-translucent` (only moves the band to the top); the opaque bottom fade of PR #154 (hides
  the band instead of removing it).

## Verification limits

The short viewport cannot be reproduced in Playwright (Chromium or WebKit); the rule rests on the sources above and is
checked on Eren's devices. Insets were emulated through the tokens at 402x874 (62/34) and 820x1180 (32/20).

## Follow-up 2026-11-17: the top-edge blur (0.82.0)

Eren, on device after 0.81.0: a system blur at the top covers the lesson progress bar and the top controls.

- Cause: iOS 26's Liquid Glass "scroll edge effect" on Home Screen apps, a blur over the status bar that runs some
  40 pt down. No meta tag or CSS property turns it off. WebKit skips it when the top edge hit-tests to a fixed,
  full-width box with one solid background (`LocalFrameView::fixedContainerEdges`). Our frame is a full-screen box and
  the top chrome is `pointer-events: none`, so WebKit found none and blurred.
- Fix: `.dz-status-band` in `index.html`, styled in `app.css`: fixed, full width, exactly `--safe-top` tall, page colour,
  above every layer, hit-testable. Zero tall where there is no inset (browser tabs, Android, desktop).
- Its one cost, a lighter strip under the status bar while a sheet dims the app, is removed by `src/ui/status-band.ts`:
  it reads what sits just under the band (scrims, the receding tab screen) and dims the band by the same amount.
- Sources: traxon99/jim PR #773, mbryantms/folio PR #994, PowerBeef/discpress PR #24 (all describe the same WebKit rule;
  none device-verified at the time). Not reproducible in Chromium or the simulator; checked on Eren's devices.
