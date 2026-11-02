# 0015: Birim, a unit square that lives inside its card

- Status: rejected by Eren 2026-11-02 14:06Z ("ruhsuz, kişiliksiz, oransız"); five replacement candidates in review, see docs/lessons.md
- Date: 2026-11-02
- Ledger items: Eren 2026-11-02 ("Bu karakterlerin tüm uygulama içindeki takip etmeleri pek bir manası yok ... yüksekliği yanlış sayfayı kaydırırken titriyor pek net de gözükmüyor. Sıfırdan zekice kendini ortalamaya kısıtlamadan yeni bir karakterizasyon değerlendir")
- Supersedes: 0014

## Context

0014 put one duo in a fixed layer above the app that flew between anchors. On the phone it jittered while a page
scrolled (the layer chased a scrolled anchor through JavaScript, so it lagged the content by a frame), it sat at the
wrong size, and it was not crisp (a scaled box over a measured rect). Following Eren around the app also carried no
meaning: the character was a sticker that travelled, not something that belonged to a moment.

## Options

| Option | For | Against |
| --- | --- | --- |
| Keep the overlay, fix the lag | Keeps the travel idea | The lag is structural on iOS (compositor scrolls, JS reads a frame late); size and crispness stay tied to measuring |
| Remove the character | Nothing to jitter | Loses the warmth Eren chose the old UI for |
| A new character drawn inline in each card | Scrolls natively with its content; size comes from the layout; can mean something | Several instances instead of one; no travel between screens |

## Decision

The third option, with a new character. **Birim** is the unit square [-1, 1]^2. Its moods are real 2x2 matrices
acting on it (`src/character/birim.ts`): rest is the identity, happy scales by 1.22, think shears, oops presses and
leans, wow reflects (det -1), sleep nearly collapses to a line. The body takes the whole matrix; the face takes only
the polar part (rotation, uniform scale from sqrt|det|, a mirror when det < 0), so a sheared body never shears the
face. Eyes close and the smile flattens smoothly as |det| goes to 0.

- **Where it lives.** Inline in the card it belongs to, in four sizes by place: 24 px in the lesson verdict, 40 px on
  Yol's current tile, 64 px on Sen, 120 px on the lesson end. No overlay, no anchors, no registry, no travel. At most
  one is on screen at a time, and only where it has a job.
- **How it moves.** The four matrix entries are engine values (`a, b, c, d`) bound to a render function that redraws
  the body path and the face transform. A mood is a spring between matrices (`ui`/`move`); oops and wow come back to
  the resting mood about 700 ms after they land (`fade`). Reduced motion shortens the spring and never cuts it
  (`effect: true`), and nothing changes in a single frame (PR-16). No CSS transitions or keyframes.
- **Look.** An amber body (a fill and a same-colour round-joined stroke, so corners are soft), a faint contact shadow,
  dark oval eyes with a highlight, a smile. No coloured edge stripes. Colours are tokens (`--birim-body`,
  `--birim-face`, `--birim-shadow`), the same in every palette.
- **Reactions.** The verdict shows Birim: happy on a right first try, quiet after a slip, oops when the answer was
  shown, wow when a gizli an opens. The lesson end shows it happy as the seal closes, and the end's glow is written to
  its element. Sen maps the progress mood to happy or rest.

`Duo.tsx`, `rig.ts` and the lab page stay: Satır and Sütun remain in badges and old drawings.

## Consequences

- Scrolling cannot make it jitter: it is in the content's layer, so the compositor moves it with its tile.
- Size and sharpness come from CSS width and a vector body; there is no measured rect to drift.
- Gone: `CompanionLayer`, `CompanionSlot`, `companion.ts` and the lesson top bar's duo column (`--duo`).
- Later steps from the design report: the opening animation (line to square), the name chooser on Sen, a
  determinant scene where a lesson's matrix carries Birim, and the app icon.
- Watch: a Birim inside a tile is cloned by the tile morph (`morph.ts`) if it copies children; check the lesson-open
  strip for pops.
