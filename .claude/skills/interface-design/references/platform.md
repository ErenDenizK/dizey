# Platform: iPhone, PWA, accessibility

Sources: Apple HIG (typography, layout, color, dark-mode, accessibility, tab-bars, onboarding, feedback,
playing-audio, playing-haptics, writing), WCAG 2.2, MDN. Details and links: `docs/research/design-knowledge.md`.

## Baselines

| Topic | Rule | Source |
| --- | --- | --- |
| Body text | 17 pt default, 11 pt minimum; avoid Ultralight, Thin, Light | HIG Typography |
| Typefaces | As few as possible: UI text, math (KaTeX), numbers | HIG Typography |
| Numbers | `font-variant-numeric: tabular-nums` in matrices and scores | |
| Text contrast | 4.5:1; large text (WCAG definition) 3:1; small text in custom colours aims for 7:1 | WCAG 1.4.3, HIG Dark Mode |
| UI contrast | 3:1 for brackets, selection rings, progress bars | WCAG 1.4.11 |
| Colour alone | Never the only carrier of meaning | WCAG 1.4.1, HIG Color |
| Targets | 44 x 44 pt default (HIG minimum 28 x 28; WCAG 2.5.8 floor 24 x 24 px); Dizey uses 44 | HIG Accessibility |
| Dragging | Every drag has a non-drag single-pointer alternative (select, then tap target) | WCAG 2.5.7 |
| Focus | A focused element is never fully hidden under a fixed bar | WCAG 2.4.11 |
| Text size | Layout holds at 200%; side-by-side items stack | HIG Dynamic Type, WCAG 1.4.4 |
| Appearance | Follow the system setting by default; an in-app light/dark/system choice is allowed (Eren); more themes later | HIG Dark Mode |
| Motion | Reduced-motion path; no fast blinking | HIG Motion, Accessibility |

## Layout

- `viewport-fit=cover`; content inside `env(safe-area-inset-*)`.
- Most important item at the top; group by spacing; progressive disclosure keeps first screens short.
- Tab bar: navigation only, never actions; always visible outside lessons; labelled; no overflow tab. It hides
  inside a lesson, where the stage is full screen and exit is always in the same place.
- Primary actions in the lower half; destructive actions far away and confirmed.

## iOS PWA constraints

- **Storage:** the home-screen app's storage is separate from Safari's. Progress made in Safari does not carry
  over, so Safari shows an "Ana ekrana ekle" guide first. Request `navigator.storage.persist()`; export and
  restore is a real flow in Ben.
- **Haptics:** no Vibration API on iOS. The only path is `<input type="checkbox" switch>` (control since
  Safari 17.4; which iOS version first plays the haptic is unverified, probably 18). One fixed tick, on the
  user's own tap only. Never required for meaning.
- **Audio:** Web Audio starts only after a user gesture. Use `navigator.audioSession.type = "ambient"` so other
  apps' music keeps playing; whether ambient goes silent with the silent switch must be verified on a device.
- **Back gesture:** edge swipe maps to browser history in standalone mode; guard lessons against accidental exit.
- **Input:** the iOS decimal keypad has no minus key; fractions need entry; the keyboard must not cover the
  matrix (`visualViewport`). Prefer Dizey's own small keypad (digits, minus, fraction bar, delete).
- **Updates:** never reload silently; show the update prompt (decision 0001).

## Math accessibility

- KaTeX outputs HTML plus MathML by default (`htmlAndMathml`); keep it.
- Own SVG matrices get Turkish accessible labels ("3'e 3 matris A. Birinci satır: 1, 2, 3"); each step change
  is announced in a live region ("R₂ yerine R₂ − 3R₁ yazıldı").

## Device checks still open

Haptic switch in standalone mode, silent switch with ambient Web Audio, edge-swipe back, Dynamic Type through
`-apple-system-body`, Turkish VoiceOver reading MathML, matrices at 200% text (scroll or shrink).
