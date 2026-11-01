# Motion system

> Superseded in part by decision 0006 (2026-10-31): spring values now come from the old app's table
> (`src/engine/tokens.ts`, inventory `docs/research/old-ui-inventory.md` section 1). The engine architecture below
> still holds; preset values and the press depth rule do not.

How everything in Dizey moves, opens, closes and answers a touch. Visuals are in
[`visual-system.md`](visual-system.md); research and sources in
[`docs/research/motion-and-visual-system.md`](../research/motion-and-visual-system.md); decision
[0004](../decisions/0004-motion-and-visual-system.md). Code: `src/engine/` (engine, springs, gestures, press),
`src/ui/` (components). Living reference: `/lab`. Value changes are logged in
[`motion-tuning.md`](../research/motion-tuning.md).

## Laws

1. **Nothing waits.** Every motion is interruptible; a new target starts from the live value and the live
   velocity. A tap never queues behind an animation; the action happens on release and the motion catches up.
2. **Cause first, then effect.** A touch shows on the next frame (press-down), a tap-started screen motion moves
   on the next frame (launch), and nothing moves that the user did not cause, except a lesson step being taught.
3. **Things come from where they were.** A card grows into the screen it opens and shrinks back into it; deeper
   screens arrive from the right; sheets rise from the bottom; tabs, which are peers, do not travel at all.
4. **One value, many readers.** In a compound motion only one value springs (the sheet's y, the pushed screen's
   x); scrims, parallax, receding and rounding are computed from it in the same frame, so they never disagree.
5. **Effects never bounce.** Opacity, colour and blur use the same timing as their spring but with bounce 0
   (enforced in the engine). Only things with mass overshoot, and only a little.
6. **Frequency sets the budget.** Many-times-a-day actions (tab switch, toggles, row taps) get the least motion;
   rare earned moments (mastery) get the most.
7. **The finger is the clock while it touches.** 1:1 tracking during a drag, rubber band past edges, momentum on
   release.
8. **Reduced motion is one switch.** Travel lands at once; fades stay (they carry the change without movement).

## Springs

Described as perceptual duration (seconds until it looks finished) and bounce (0 = none). Physics: mass 1,
`k = (2π / duration)²`, `ζ = 1 − bounce`. Solved in closed form (`src/engine/spring.ts`), so curves are identical
at 60 Hz, 120 Hz or with dropped frames.

| Token | Duration | Bounce | k | Settles (1 %) | Overshoot | For |
| --- | --- | --- | --- | --- | --- | --- |
| `tap` | 0.14 s | 0 | 2014 | 147 ms | 0 | Press-down |
| `release` | 0.34 s | 0.22 | 342 | 351 ms | 2.0 % | Press-up, knob un-stretch |
| `fade` | 0.22 s | 0 | 816 | 232 ms | 0 | Opacity, colour, title-bar glass, tab pane fade |
| `snap` | 0.32 s | 0.16 | 386 | 221 ms | 0.8 % | Small state changes: tab lens leading edge, switch knob |
| `glide` | 0.42 s | 0 | 224 | 443 ms | 0 | Medium travel: lens trailing edge, sheet detent change, stage content rising |
| `page` | 0.50 s | 0 | 158 | 528 ms | 0 | Screens: push, pop, sheet open/close, card to stage |
| `settle` | 0.55 s | 0.32 | 131 | ~600 ms | ~6 % | End of a throw, mastery seal: physical, with momentum |
| `teach` | 0.72 s | 0.08 | 76 | 621 ms | 0.1 % | Lesson motion the eye must follow (lesson tempo scales it) |

Why these values: iOS sheets and pushes read as about half a second with no bounce, so `page` is 0.5 / 0. Small
controls must feel quicker than screens and slightly alive, so `snap` is about two thirds of `page` with a barely
visible bounce. The earlier engine's values were Material's Android defaults (0.17-0.36 s), which feel abrupt on
iOS (research report). All are starting values to tune on Eren's iPhone.

**Launch.** A spring from rest starts slowly (its first two frames barely move). Tap-started screen motion adds a
launch velocity (`CHOREO.launch` = 0.6 of `ω₀ × distance`), so the first frame after the tap already moves, still
without overshoot. Gesture-ended motion uses the finger's real velocity instead.

## Choreography

| Token | Value | Meaning |
| --- | --- | --- |
| `stagger` | 30 ms, at most 6 items | First appearance of a list only; never on tab return |
| `parallax` | 0.3 of the width | How far the covered screen drifts during a push |
| `pushDim` | 12 % | Scrim over the covered screen at full push |
| `sheetScrim` | 36 % | Scrim at the medium detent and above |
| `sheetRecede` | 0.94 | Scale of the screen behind at the large detent (plus 10 px down, rounded 22 px, over black) |
| `rise` | 8 px | Entrance travel; entrances never scale from zero |

## Press physics

- Press-down on pointerdown, same frame, `tap` spring; release on pointerup with `release` (a trace of give).
- Depth is physical: every element sinks 3 px per side, so `scale = 1 − 6 / width`, clamped to 0.92-0.985 (a card
  0.983, a tab slot 0.93). A highlight overlay rises to 6 % ink (14 % on primary buttons).
- A finger that moves more than 10 px is scrolling: the press cancels and nothing fires.
- The action fires on release, never after an animation. Keyboard activation does not animate.

## Gestures

| Gesture | Tracking | Release decision | Hand-off |
| --- | --- | --- | --- |
| Sheet drag | 1:1 on y, rubber band above the large detent (c = 0.55) | Detent nearest to the projected landing (deceleration 0.998 / ms) | `glide` to a detent or `page` to close, with the finger's velocity |
| Back swipe | Starts within 24 px of the left edge, horizontal only; 1:1 on x | Pop if the projected landing passes half the width | `page` with the finger's velocity |
| Tab bar scrub | Slide along the bar: the lens follows 1:1, rubber band at the ends | Slot under the finger plus 80 ms of glide | `snap` with the finger's velocity |
| Dersler scroll | Plain native scroll: nothing on the path scales, fades or moves on its own while scrolling (Eren 2026-11-01 rejected both the per-tile focus lens and the drum: separate pieces turning on their own never read as one surface) | Native scroll momentum | n/a |

Velocity is a least-squares slope over the last 100 ms of samples; a finger that stopped for 50 ms before lifting
has no momentum.

## Every open, close, transition and tap

| Element | In | Out | Tap / state |
| --- | --- | --- | --- |
| Tab switch | Incoming pane fades in over the outgoing one (`fade`), no travel; the outgoing pane hides when the fade lands, so no frame is empty | n/a | Lens: leading edge `snap`, trailing edge `glide`, so it stretches toward the target and gathers itself |
| Tab bar hide (lesson, rehearsal) | `page` up | `page` down by its height + 48 px | |
| Push (deeper screen) | From the right, `page` + launch; covered screen drifts 30 % left and dims 12 % | To the right, same spring; or back swipe | Chevron 44 × 44 top-left |
| Sheet | Rises to medium, `page` + launch; scrim follows | Down with `page`; flick, tap on scrim, Escape | Grabber tap cycles medium/large with `glide`; at large the screen behind recedes |
| Card to lesson stage | Card surface clip grows to full screen (`page`, launch 0.4); card face fades out (`fade`); stage content rises 12 px and fades in from 90 ms (`glide`); tab bar slides away | Content fades (`fade`), clip shrinks back into the card's current rect (`page`), card face returns | Close (×) top-left |
| Inline title bar | Glass and title fade in (`fade`) once the large title passes under the top | Fade out when it returns | |
| Switch | | | Knob widens 1.2× on press (`tap`), travels with `snap`, un-stretches with `release`; track colour as an effect (`fade`) |
| Buttons, rows, cards | | | Press physics above |
| Lesson step (lesson layer) | `teach`, at the lesson tempo | | A tap finishes the running step at once (channel finish) |
| Lesson stage re-layout (step change, answer) | Stage height glides on `move`; persistent scene objects glide and scale from their old box; new ones rise 10 px from 0.35, 35 ms apart, after a 90 ms head | Leaving objects are removed | The beat's final layout (result room, area, Sarrus copy, minor) is reserved from its first action, so a beat never refits the scene |
| Lesson narration and dock | Narration from 0.35 and 14 px toward the walking direction, 35 ms apart; new feedback rises 12 px; new dock rows rise 16 px per row; counter rolls 6 px; progress width glides on `move` | | Wrong option shakes (x velocity 320 on `shake`), right one swells (scale velocity 0.9 on `land`); İleri eases to soft on `fade` while a beat plays |

## Measured timings (frame-by-frame review, 390 px)

From `scripts/motion-review.mjs` (virtual clock stepped one 60 Hz frame at a time): tab lens settles in 483 ms
with no overshoot; push lands at 600 ms (within 1 px), largest single-frame step 47 px (the launch frame); pop
returns the covered screen in 483 ms; sheet open settles in 567 ms; switch knob in 200 ms; the card-to-stage clip is
63 % open after 133 ms and the stage content is readable at 250 ms; under reduced motion a push lands in one frame.
All 13 checks pass in light and dark.

## Engine contract (for code)

- `engine.to(el, { x, y, scale, opacity, '--var': n, custom }, 'page', { velocity, launch, onArrive, effect })`;
  `engine.set(el, values)` for 1:1 tracking; `engine.bind(el, render)` for derived values.
- Channels: `chrome` for UI; lessons use their own channels with a tempo (`setTempo`) and can be finished at once
  (`finishChannel`). Cues (`after`) run on the same virtual clock.
- The engine writes only properties it was asked to drive; CSS keeps the rest. No CSS transitions or keyframes for
  movement anywhere.
- `review.pause()` / `review.step(ms)` freeze and step the real-time driver for frame-by-frame recordings.

## Where this breaks (known)

- iPhone Safari may run `requestAnimationFrame` at 60 Hz even on ProMotion screens; the curves are right either
  way, smoothness at 120 Hz needs a device check.
- Back swipe inside the standalone app may compete with a system gesture; verify on device before relying on it.
- The tab bar scrub and the sheet drag were verified by unit tests and by eye in Chromium, not yet with a real
  finger.

## Light (earned moments)

`src/ui/shine.ts` adds light on top of motion, only where a learner earned it (law 6). Everything runs on the
engine, so a tap lands it and reduced motion keeps only the glows (they fade; sparks, rings and sheens travel, so
they are skipped). Tokens: `--glow-spark`, `--glow-ok`, `--sheen` (tokens.css); springs `bloom` (glow swells,
~0.35 s), `ember` (glow dies away, ~1.3 s), `sheen` (a ring or sheen crossing, ~0.8 s).

The light follows the music: `lightScore(event)` reads the same score the synth plays, so the card warms on each
chord before the home chord, a spark leaves on each arpeggio note, and the climax lands on the home chord. With
sound off the light keeps the same rhythm.

| Moment | Light |
| --- | --- |
| Lesson end (every lesson) | Card warms on ii and V; on I the card glows, each right seal cell glows green and a sheen crosses it, left to right 70 ms apart |
| Lesson end, every answer right on the first try | Plus a 10-spark burst from the seal; the card keeps a faint afterglow |
| Half of all lessons done | Plus sparks climbing an arc over the duo on the arpeggio, a 12-spark burst, the duo glows |
| Chapter finished | Plus a 16-spark burst and two side bursts from the seal brackets, the duo glows, the card keeps a warm afterglow |
| Back on the path after a lesson | The new tick pops and draws itself, a ring of light leaves it, the tile glows green once |
| The tick that finishes a chapter | Plus the chapter's brackets light up and 12 sparks leave the tile |

Never on a single right answer, a tab, a button or a screen open: those are frequent, and light there would
wear out the meaning of light.
