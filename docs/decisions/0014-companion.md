# 0014: Satır and Sütun are one companion that travels with Eren

- Status: accepted (Eren asked for a mascot that follows him through the app, 2026-11-01; built, his review pending)
- Date: 2026-11-01
- Ledger items: Eren 2026-11-01 ("maskotumuz ... uygulamanın akışı boyunca bize yanımızda olacak, bizi takip edecek ... sayfalar arasında bağlayıcı ve kesintisiz bir şey")

## Context

The duo was drawn separately on Bugün, Sen and the lesson end, each time as a new instance with a fresh face. The
screens felt like separate places and the character like a sticker on each. Eren wants one character who stays with
him: it opens the app, sits in the lesson's top bar, and reacts when he answers.

## Options

| Option | For | Against |
| --- | --- | --- |
| A duo per screen, plus a crossfade | No new layer | Two characters at once, state resets, no sense of travel |
| One duo in a fixed layer that travels between anchors | One instance, state never resets, travel is the continuity | A layer above routes; must be kept off the math stage and below real dialogs |
| A persistent mascot in a corner with speech bubbles | Always present | Covers content; noise; Eren asked for no bubbles |

## Decision

The second option.

- **Anchors.** A screen that wants the duo renders `CompanionSlot` (an empty box of the duo's aspect and a size from
  CSS) which registers `{name, element, size, mood}` in a registry (`src/shell/companion.ts`). Names in use: `today`,
  `me`, `lesson` (the lesson top bar, about 28 px), `end` (the lesson end hero).
- **Which anchor is active** is a pure function of the route: a tab shows its own anchor (`today`, `me`; Harita has
  none), a sheet keeps the tab behind it, a full-screen route prefers `end` over `lesson`. No anchor means the duo
  fades out where it is and comes back from there.
- **One layer** (`CompanionLayer`, mounted once in Shell) draws the only `Duo`. It is `position: absolute` in the app
  frame with an engine transform (x, y, scale of one 168 px box). At rest it follows the active anchor's rectangle
  through scroll, resize and ResizeObserver events; no per-frame work while idle. After a route change a short
  follow burst covers the screens that move under it (a tab rising in, a sheet receding). Near the top fade and the
  tab bar its opacity follows how much of it is clear of them. Its z-order sits under the tab bar and sheets, and
  over a full-screen route while one is open.
- **In lessons the duo only reacts at answer moments**: a right first try is `happy`, a wrong pick `console`, the
  gizli an opening `curious`; at most one reaction per 1.5 s; nothing on explain steps. No bubbles, no new sounds, no
  idle body motion (the duo's own idle blink stays).
- **Hello (cold start only).** The duo appears small at the centre with closed eyes, wakes with a blink, hops once and
  travels to the first anchor. About 0.85 s; a tap anywhere skips it; reduced motion has no hello.
- Rig additions the layer needs: `crouch`, `stretch`, `land` gestures, the `asleep` mood, and an instant `pose`.
  The drawing is untouched.

## Motion phases (docs/design/motion-phases.md)

### Open: the duo leaves an anchor for another

| Phase | Element | Spring | Neighbours | Poster |
| --- | --- | --- | --- | --- |
| 1 Anticipation | The duo squats (rig `crouch`, Sütun 40 ms later) for about 100 ms | rig body spring | none | first frame after the route change: both heads lower |
| 2 Departure | The duo's box lifts off its ground (the lift element rises by 12 to 18 % of the distance, capped) and the heads stretch | `ui` for the lift | the old screen fades or is covered as its own motion says | the lifted frame: shadow shrunk, heads tall |
| 3 Travel | The box's x, y and scale go from the live rectangle to the target; the lift makes the path an arc | `page` (retargets from live value and velocity; if the anchor moves, the goal follows) | none | mid-travel: one duo, no copy left behind |
| 4 Arrival | At about 6 % of the distance left the lift settles and the heads land with the rig's squash | `move` for the lift, rig for the squash | none | landing frame: squash at its lowest, box on the anchor |
| 5 Aftermath | The anchor's mood is posed, the eyes look toward the new content, then return to the centre | rig face springs | a command from the screen (a react, a look) wins over the default aftermath | settled frame: mood on the face, eyes centred |

### Close: no anchor for the next screen

| Phase | Element | Spring | Neighbours | Poster |
| --- | --- | --- | --- | --- |
| 1 Anticipation | none: the route change itself is the touch | none | none | n/a |
| 2 Departure | The duo stays where it is | none | the screen is leaving | n/a |
| 3 Travel | Opacity to 0 where it stands | `fade` | none | mid-fade: same place, same face |
| 4 Arrival | Hidden, pointer events never taken | none | none | n/a |
| 5 Aftermath | Coming back later, it travels from where it faded, as an open | as above | | |

Reduced motion: the box jumps to the anchor and the mood is posed instantly; fades remain.

## Consequences

- Easier: one character with one state; every screen that wants it adds a `CompanionSlot`.
- Harder: anchor rectangles move with their screens (tabs rising in, the lesson's top bar arriving), so the layer
  follows the target while it travels instead of reading it once.
- Watch: the duo must never cover the lesson's math stage (guarded by an e2e that compares boxes); the glow of the
  lesson end is written to the layer's box (`companion.glowTarget()`), not to the slot.
- Supersedes nothing; extends 0010 (character) and 0011 (the lesson grows from its card).
