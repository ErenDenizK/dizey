# Motion and visual system: physics, interaction and the premium feel

## Question

Eren (2026-10-30 16:45Z) asked for deep research into physics-based animation, motion language, responsiveness,
gestures, transitions and the details that make the best iOS apps feel expensive, and for a complete visual system
(layout, density, colour, type, depth) built on it. The earlier design research
([`design-knowledge.md`](design-knowledge.md)) covered the field broadly; this report goes deep on motion and
materials. The resulting system is specified in [`docs/design/visual-system.md`](../design/visual-system.md) and
[`docs/design/motion-system.md`](../design/motion-system.md); decision record
[0004](../decisions/0004-motion-and-visual-system.md).

Rule from Eren: no named app is copied. Principles are taken; every value is re-derived for Dizey.

## Sources (opened 2026-10-30)

| Source | What it gave |
| --- | --- |
| Apple WWDC23 "Animate with springs" (developer.apple.com/videos/play/wwdc2023/10158) | Duration + bounce parameterisation, velocity preservation, bounce guidance |
| Apple docs, `Animation.smooth(duration:extraBounce:)` | Default 0.5 s, perceptual duration definition |
| Apple HIG: Materials (updated 2025-09) | Liquid Glass only in the functional layer, regular vs clear, vibrancy, thickness |
| Apple HIG: Tab bars (updated 2026-06) | Floating tab bar on glass, labels, no hidden tabs, minimise behaviour |
| Apple HIG: Sheets (updated 2026-03) | Detents, grabber, swipe to dismiss, one sheet at a time |
| Apple HIG: Typography | Dynamic Type sizes and leading per text style, 17 pt body, 11 pt minimum, optical sizes |
| Material Design 3 motion docs (`material-components-android/docs/theming/Motion.md`) | Spatial vs effects springs; stiffness and damping per speed |
| Rauno Freiberg, "Invisible Details of Interaction Design" (rauno.me) | Interruptibility, momentum, spatial consistency, frequency vs novelty, trigger timing |
| Emil Kowalski's public design-engineering skill (ui-skills.com) and `emilkowalski/vaul` `src/constants.ts` | Press scale range, frequency rules, drawer thresholds and curve |
| "Deceleration mechanics of UIScrollView" (medium.com/@esskeetit) | Deceleration rate 0.998 per ms; projection formula |
| `jtrivedi/Wave` docs (jtrivedi.github.io/Wave) | `rubberband(c = 0.55)`, `project(decelerationRate = 0.998)` as used in iOS-style animation libraries |
| WebKit bug 173434 (lists.webkit.org) | 120 Hz `requestAnimationFrame` status in Safari |
| `rsms/inter` v4.1 release (github.com) | Variable font with optical size axis and disambiguation features |

No prompt injection found. Reddit and X were not used (blocked for automated access, see earlier report).

## Findings

### Springs are the right primitive, and they should be described perceptually

- Apple's model: a spring is a **duration** (how long it takes to look finished) and a **bounce** (0 = no
  overshoot). Physics follows: mass 1, `stiffness = (2π / duration)²`, damping ratio `ζ = 1 − bounce`. This keeps
  a designer's intent stable: changing bounce does not change how long the motion feels.
- Bounce guidance: 0 is the versatile default; ~0.15 is "barely bouncy"; ~0.3 is noticeable; above ~0.4 is too much
  for UI. Our own computation: bounce 0.15 overshoots under 1 % (invisible on a 90 px move), 0.3 about 5 %.
- Velocity preservation: when a target changes mid-flight, the new spring starts from the current value **and the
  current velocity**. Ease curves cannot do this; linear motion has velocity jumps at both ends.
- Do not wait for the mathematical settle to trigger user-facing changes; the perceptual duration is the contract.
- Material 3 separates **spatial** springs (position, size: may overshoot slightly) from **effects** springs
  (opacity, colour: never overshoot), and picks speed by the distance travelled. Notable: M3's published values
  (fast spatial k 1400 / ζ 0.9, default spatial 700 / 0.9, slow spatial 300 / 0.9, fast effects 3800 / 1,
  default effects 1600 / 1) are exactly the values in the earlier Dizey engine's constants. The old values were
  M3's Android defaults, not values tuned for Dizey or for iOS. In duration terms they are 0.17 s, 0.24 s and
  0.36 s: snappier than iOS, where sheets and pushes read as about half a second.

### Interaction feels premium when it is continuous, interruptible and honest about cause

- **Interruptible everywhere.** Reversing a swipe must reverse the motion at once (Freiberg; Apple fluid
  interfaces). Waiting for an animation is the most common "cheap" tell.
- **1:1 tracking, then momentum.** While a finger holds something, it follows exactly. On release, the decision
  uses where the throw would coast to, not where the finger stopped: UIKit projects with a deceleration rate of
  0.998 per ms, `landing = value + v·d / (1 − d)` (v in px/ms), about 0.5 s of travel per 1000 px/s.
- **Resistance at edges.** Dragging past a limit uses a rubber band: `(1 − 1 / (x·c / d + 1))·d` with c = 0.55.
- **Trigger timing.** Light, reversible actions may fire mid-gesture; destructive ones only on release.
- **Spatial consistency.** Things come from where they were (a card grows into the screen it opens) and go back
  there; direction encodes hierarchy (deeper = from the right).
- **Frequency over novelty.** Actions used many times a day get little or no motion; rare moments may have more.
  Removing motion from frequent actions makes an app feel faster even when the motion was quick.
- **Press feedback** is immediate on touch-down, a scale in the 0.95-0.98 range, with the action firing on release.
  Never start an entrance from scale 0. Exits are shorter than entries.
- Drawer reference values (vaul): velocity threshold 0.4 px/ms, close threshold 25 % of height, curve
  `cubic-bezier(0.32, 0.72, 0, 1)` over 0.5 s; quick-swipe rule ~0.11 px/ms for small toasts.

### Materials and depth (iOS 26 era)

- Glass belongs to the **functional layer** that floats over content (tab bar, toolbars), never to the content
  itself. Use it sparingly; the regular variant (blurred, luminosity-adjusted) wherever text sits on it.
- Content-layer structure uses solid or standard materials; legibility on materials comes from vibrant label
  levels (primary, secondary, tertiary).
- The iOS tab bar now floats above content, labels stay, tabs are never hidden or disabled, five or fewer.
- Sheets: medium and large detents, a grabber (also tappable and VoiceOver-operable), swipe to dismiss, one sheet
  at a time; at the large detent the screen behind recedes (scaled down, rounded) over black.

### Type

- iOS text styles at the default size: Large Title 34/41 bold, Title 1 28/34, Title 2 22/28, Title 3 20/25,
  Headline 17/22 semibold, Body 17/22, Callout 16/21, Subhead 15/20, Footnote 13/18, Caption 1 12/16,
  Caption 2 11/13. Minimum 11 pt. System fonts use dynamic optical sizes.
- Inter 4 is a variable font with an optical-size axis (text to display) and character variants that
  disambiguate l, 1 and I (`cv05`, `cv08`). SIL OFL. It draws close to SF Pro, so a page renders nearly the same on
  iPhone, Mac, Windows and in CI screenshots.

### Platform facts for the web build

- Safari's `requestAnimationFrame` has historically been capped at 60 Hz on ProMotion iPhones behind an
  experimental setting ("Prefer Page Rendering Updates near 60fps"); WebKit bug 173434 tracks 120 Hz. Whatever the
  rate, motion must be frame-rate independent.
- `backdrop-filter` is supported in Safari; keep blurred layers few and small (one tab bar, one title bar).
- `font: -apple-system-body` exposes the user's Dynamic Type size to CSS on iOS (on macOS it resolves to 13 px).
- The only iOS web haptic is the `<input type="checkbox" switch>` control (earlier report).

## Taken

- Duration + bounce as the only way to describe a spring; a fixed vocabulary of eight springs (motion-system.md).
- A new engine solving springs **in closed form** instead of stepping them numerically: exact at 60 Hz, 120 Hz or
  with dropped frames, and cheaper per frame (`src/engine/spring.ts`).
- M3's spatial/effects split, as an engine rule: opacity and colour never overshoot, whatever spring is named.
- Velocity hand-off on every gesture end and retarget; 1:1 tracking; UIKit projection and rubber band constants.
- A "launch" for tap-started screen motion so the first frame after a tap already moves (found in our own
  frame-by-frame review: a spring from rest spends its first two frames almost still).
- Press depth defined in pixels (3 px per side) instead of one scale for everything.
- Glass only on the tab bar and the inline title bar; everything else solid with soft layered shadows.
- Floating capsule tab bar with a lens whose edges move on different springs (leading `snap`, trailing `glide`).
- Inter variable, self-hosted, with `cv05` and `cv08`; iOS text-style sizes in rem off a Dynamic Type root.

## Rejected

- **The old engine's constants** (they are M3 Android defaults; Eren asked for a rebuild).
- **Motion libraries** (motion.dev, react-spring, GSAP): no per-channel finish or virtual clock (decision 0001).
- **CSS transitions, keyframes, View Transitions** for movement: wall-clock time, not interruptible with velocity.
- **`linear()` CSS spring approximations**: cannot carry velocity across a retarget.
- **Glass on cards and lists**: HIG says no glass in the content layer; it also costs GPU on long lists.
- **A brand accent colour**: colour already carries meaning in lessons (row, column, correct, wrong); the chrome
  is monochrome so those meanings stay strong (visual-system.md, "Colour means something").
- **`corner-shape: squircle`**: not in Safari yet; revisit when it ships.

## Open

- Device checks on Eren's iPhone: 120 Hz rAF in standalone mode, backdrop-filter cost while scrolling, the switch
  haptic, Dynamic Type through `-apple-system-body`, edge-swipe back inside the standalone app.
- WebKit was not available in the cloud sandbox for the recordings in the PR (Chromium at 390 px instead); CI runs
  the E2E suite on WebKit.
