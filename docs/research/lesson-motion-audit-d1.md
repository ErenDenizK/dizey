# Lesson motion audit: D1 (determinant), frame by frame

2026-10-31. Scope: one full play-through of D1 (14 steps) on a 390 × 844 phone viewport, every frame on the
engine's virtual clock at 60 Hz, light theme. Asked by Eren: inspect every animation, slide, scale and
interaction of a real lesson like a video, judge durations and pacing for the topic, sound and visual effects
as a whole, and fix what is wrong.

## Method

`scripts/lesson-review.mjs` (new) stops the real-time driver before the app starts, then plays a scripted
session: every step, a wrong and a right choice, a wrong and a right keypad answer, "Cevabı göster", pause,
play, replay, finishing a beat early with the primary button, and the back chevron. Between captures the clock
moves exactly one 60 Hz frame. For every frame it saves a screenshot and measures 17 parts of the screen
(rect and opacity), the stage's `--cell`, flying chips, the primary label, stage overflow and whether the
transport button overlaps the scene. Detectors then flag:

- **jump**: a part changes x, y, width or height by 3 px or more in one frame, with no motion on the frame
  before or after (layout teleporting rather than moving);
- **pop**: opacity changes by 0.4 or more in one frame;
- **cell**: the stage's cell size changes inside a step;
- **cut**: stage content extends past the stage and is clipped.

Output: frames, a 60 fps video, per-segment contact sheets, `samples.json`, `findings.json`.

## Findings (before, 0.14.1)

8 238 frames, 137 s of lesson time, 385 raw findings. Grouped by root cause, worst first:

| # | What the frames show | Measured | Root cause |
| --- | --- | --- | --- |
| 1 | On every step change the whole screen re-lays out in one frame: stage height, matrix size, narration and dock all teleport. | Stage height jumps on 18 step changes, 23 to 308 px; matrix cell jumps 56 → 78 px and similar. | The stage is `flex: 1` beside a narration of variable length; nothing animated the change. |
| 2 | Answering re-lays out the screen in one frame: a wrong answer inserts the feedback and shrinks the stage by 151 px; the reveal removes the keypad and grows it by 308 px. | 6 occurrences. | Same as 1, inside a step. |
| 3 | The matrix shrinks in the last frame of a reveal (70 → 65 px) and when the Sarrus copy, the area diagram or the result lands. | 11 cell changes inside a step. | The scene was refitted whenever a beat added something; only work lines reserved their room up front. |
| 4 | The area beat: the diagram appears in one frame and the matrix jumps up 116 px at the same moment. Nothing shows the matrix acting on the square. | 1 frame. | `area` was a state flag, rendered on arrival, with no motion. |
| 5 | The 2×2 rule step shows "ad − bc" in the result slot before the beat derives it. | From frame 1 of step 3. | The placeholder fell back to `scene.result`, which is the answer. |
| 6 | Narration, dock, counter and progress fill change in one frame on every step; the old app's entries (narration from 0.35 opacity and 14 px, 35 ms apart; dock rows from 16 px; counter roll; progress glide) were missing. | 14 steps. | Not ported yet (inventory 7.2, 7.3, 7.5). |
| 7 | A wrong option only dims; a right one only gets a ring. No shake, no swell. | Every answer. | Not ported (inventory 7.6). |
| 8 | The primary button's label flips between "Hareketi bitir" and "İleri" on every beat (16 flips). | 16. | Interim label; the old app keeps "İleri" and makes it soft while a beat plays (UC-2). |
| 9 | Pacing: "Sarrus: why" plays the whole Sarrus computation (25.4 s) although the step only says "copy the first two columns, every diagonal becomes straight"; the next step plays the same computation again (20.1 s). | 45.5 s of near-identical motion in a row. | The step reused the full `sarrus` beat. |
| 10 | Exam-type question (step 13) after the answer: the stage collapses to a strip, cells hit the 30 px floor and the scene and work lines are clipped by up to 13 px for the whole reveal. | 404 frames clipped. | Five options + inline feedback leave the stage no room. Owned by the design review thread, which moves feedback into the dock (verdict panel). |

## What changed

| # | Fix | Where |
| --- | --- | --- |
| 1, 2 | The stage's height glides on `move` from the height it shows to the one it rests at, picking up a glide that is still running. Persistent objects (same matrix, the result, operators, work block, area) glide and scale from where they were to where they now rest; new objects rise in from 10 px below, 35 ms apart, after a 90 ms head when something glides (old swapScene, flipScene). The cell is fitted to the target height, never to a height mid-glide. | `Stage.tsx` `useStageLayout` |
| 3 | The beat's final state is passed to the stage: the result slot keeps the final value's room, and the area diagram, the Sarrus copy and a lifted minor are laid out from the first action, invisible until the beat reaches them. "Nothing moves later" now holds for the whole scene, not only work lines. | `Stage.tsx` (`final`, `Appear`, `.ls-result__room`) |
| 4 | The area diagram fades in as the unit square, holds 280 ms, then the square turns into its image on the `teach` spring: the learner sees the matrix act on the square and the area grow. | `Stage.tsx` `Area` |
| 5 | A beat that ends on a result shows "?" until it gets there. | `Stage.tsx` |
| 6 | Narration enters from the walking direction (0.35 → 1, 14 px, `move`, 35 ms apart); new narration parts (feedback) rise 12 px; new dock rows rise 16 px row by row, a control that stays (İleri to İleri) does not re-enter; the counter rolls 6 px; the progress fill's width glides on `move`. | `motion.ts` `useLessonMotion` |
| 7 | Wrong pick: x velocity 320 px/s on `shake` (wrong keypad answers shake the answer field). Right pick: scale velocity 0.9 on `land`. | `motion.ts` `useAnswerMotion` |
| 8 | The primary button keeps "İleri" (or "Dersi bitir"); while a beat plays it eases to the soft fill on `fade` and its label ink flips at the midpoint, so no frame shows grey on grey; its accessible name says "Hareketi bitir". | `LessonPlayer.tsx`, `motion.ts`, `shell.css` |
| 9 | New beat option `sarrus { diagonalsOnly }`: copy the columns, light each down-right diagonal, then all three, then the same for down-left. 25.4 s → 4.2 s. It counts as a layout beat, so the next step's real computation now plays at the teaching pace (it is the first time the arithmetic is shown). | `timeline.ts`, `tempo.ts`, `d1-determinant.ts` |
| 10 | Not changed here (design review thread). | |

## After

Same script, same session, light and dark (7 611 frames, 126 s of lesson time each).

| Measure | Before | After |
| --- | --- | --- |
| One-frame stage height jumps | 18 (23-308 px) | 0 (every change glides on `move`, settles in about 230 ms) |
| Cell size changes inside a step | 11 | 4, all at an answer (the reveal's layout starts then) and all glided by the FLIP |
| Primary label flips during beats | 12 | 0 |
| Frames with clipped stage content | 409 | 407: 404 in step 13 (design review thread's fix), 3 transient during a glide in step 11 |
| "Sarrus: why" | 25.4 s | 4.2 s |
| "Sarrus: rule" (first real computation) | 20.1 s (repeat pace) | 25.4 s (teaching pace) |
| Whole play-through | 136.8 s | 126.3 s |

Contact sheets and videos for Eren: project files `screenshots/0.17.0/lesson-motion/` (step change, wrong
answer, area beat, keypad reveal before/after; end states light and dark; full videos before, after and side
by side).

## Pacing, sound and effects as a whole

- **Step lengths.** Explain steps with a calculation run 2.7 s (worked 2×2, repeat pace) to 13 s (singular:
  det, column marks, area morph). The full Sarrus at the teaching pace is about 25 s with its dwell floors;
  a learner can land it with one tap at any time and replay it. That is in line with working it by hand
  once (a student needs 30-45 s for a 3×3 Sarrus), so it stays; the second family of diagonals already plays
  at half dwell.
- **Sound.** Every lesson sound is tied to the frame of its cause by construction: `select` on the highlight
  action, `land` on the frame a chip lands, `merge` on the collect action, `correct`/`wrong` on the tap. No
  mismatch was found. The interaction sound system itself is being rebuilt by the sound thread.
- **Effects.** Chips fly on curved paths and slow under the eye's pursuit limit (900 px/s); no frame showed a
  chip outside the stage. Marks are colour only (no motion); that matches the old app.

## Where this still breaks

- Leaving objects vanish in one frame rather than fading out (the old app ghosted them out over 123 ms); a
  replaced scene enters from the 0.35 entrance floor, so the stage is never empty, but the swap is a cut.
- The stage glide was verified in Chromium at 60 Hz with the virtual clock; a real iPhone check is still due.
- Step 13's clipped reveal waits for the verdict panel (design review thread).
- While the stage shrinks for a wrong answer's feedback, the narration is short of room for about four frames
  and its last line is clipped; the verdict panel in the dock removes the cause.
- `useStageLayout` measures the stage on every commit (one forced layout per runner action); cheap on this
  DOM, but watch it if scenes grow.
