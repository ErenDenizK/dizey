# Motion phases: how a big animation is designed, built and checked

Eren, 2026-11-01 14:12Z: a visible, long or large animation is not "it grows, it shrinks". Every stage of it is
designed: how it leaves its source cleanly, how it fills the screen, how it goes back, and how the things around
it react when it lands. Physics, not durations. Cheap to build and check.

This is the method for every such animation (opening a lesson, a card, a sheet, a lesson end, a rozet moment).
Small feedback (a press, a toggle, a digit) follows `.claude/skills/stageshow-motion` only.

## The five phases

Write one row per phase before any code. Opening and closing each get their own table: a close is never the
open played backwards.

| Phase | Question it answers | Rule |
| --- | --- | --- |
| 1. Anticipation | Did my touch land? | The source reacts on the first frame of the touch (press scale). Nothing waits for the release to show it was touched. |
| 2. Departure | What exactly is moving? | The source itself becomes the moving surface: same rectangle, radius and colour on the handoff frame. No swap, no flash. Content that will not survive the trip leaves first, fast (`leave`). |
| 3. Travel | Does it read as one object? | One spring per quantity (`page` for geometry, `fade` for ink). Text never stretches: geometry is a clip or a container, never a scale on words. Interruptible: a reversal retargets from the live value and velocity. Opaque all the way. |
| 4. Arrival | When is it readable? | The container lands, then its content arrives in reading order (top to bottom, `CHOREO.stagger`), starting when the surface is about 70% open, not after a fixed delay. Deceleration in the last third, no bounce on large surfaces. The resting look (radius, border, shadow) is reached during the last third, never swapped on the landing frame. |
| 5. Aftermath | What else felt it? | The context reacts: what is covered recedes (`CHOREO.sheetRecede`) and comes back on close; neighbours settle in a ripple ordered by distance (35 ms apart, `ui`, a few px or 0.02 scale at most); an outline or highlight draws itself in (`draw`) as an SVG stroke that becomes the tile's persistent ring (the ring waits for it, no swap); a marker such as the tag rises in on `ui` after the stroke starts; a changed state crossfades. Then nothing moves. |

Every row names: the element, the spring token, what the neighbours do, and the one frame to check (the
"poster" of that phase).

## Budget

- Readable within 30 frames (500 ms) of the touch; the whole close including the aftermath within 45 frames.
- No frame where two full screens are both above half strength.
- No frame with less than a fifth of the content visible (a hole).
- Reduced motion: geometry lands at once; only fades remain (the engine already does this; check it).
- Performance: transforms, opacity and clip-path only; at most one clone of the source; at most about 120
  animated cells for patterned reveals.

## How it is checked (cheap)

1. `scripts/motion-strip.mjs <scenario>` films every 60 Hz frame of the interaction (script, no model).
1b. `node scripts/pop-check.mjs <outDir>/frames` (script, no model, needs ffmpeg) enforces PR-16 (nothing changes
   in a single frame). It scales the frames to 1x, splits them into 16 px cells and flags a cell that is steady
   for 3 frames, jumps by more than 14 gray levels in one frame and is steady for 3 frames after (a step
   function). Fades and springs pass through in-between values and are never flagged; a moving edge (a clip
   folding, a stroke being drawn) is dropped when another cell within 10 cells steps in the 2 frames either side,
   and a lone cell that only just clears the step (under 1.25 times it) is a grazed edge corner, not a pop. It prints
   the flagged frames and cells and exits 1 if there are any. Tune with `--cell --step --hold --still`.
2. A Haiku (or Sonnet) reader gets the phase table and the frame numbers of each phase's poster, and answers
   the table's questions per frame with yes/no and the frame file.
3. Opus looks only at frames the reader flagged and makes the call. No Opus loops on its own work.
4. The scenario stays in `motion-strip.mjs` as the guard for that animation (PR-12).

A small or round source (an icon button under 64 px, or a radius of half its side) grows as a circle: a
`circle()` clip from the source's centre out to the farthest corner on `page`, content held until 70% open, and
folds back into the circle with the source's face fading in over the last third (`growCircle` in
`src/shell/Shell.tsx`). There is no outline aftermath for anything but a tile.

## Lesson open and close (first application)

Source chain (decision 0011): tile, then the lesson card (LessonPeek), then the lesson route. The lesson grows
out of the card and closes back into the tile.

### Open (card to lesson)

| Phase | Element | Spring | Neighbours | Poster |
| --- | --- | --- | --- | --- |
| 1 | "Derse gir" button | press | none | first frame after touch: button sunk |
| 2 | Card surface becomes the route's clip; card content leaves | `leave` for content | scrim holds | frame 3: card rectangle exact, content fading |
| 3 | Route clip inset from the card to the screen; radius to 0 in the last third | `page` with launch | Dersler recedes to `sheetRecede` and dims | mid-travel: one opaque surface, no text stretched |
| 4 | Lesson top bar, stage, narration, dock rise in, top to bottom, from about 70% open | `glide`, stagger | none | first frame all four are readable |
| 5 | Done: shell hidden under the lesson | none | none | still frame |

### Close (lesson to tile)

| Phase | Element | Spring | Neighbours | Poster |
| --- | --- | --- | --- | --- |
| 1 | Close button | press | none | button sunk |
| 2 | Lesson content leaves | `leave` | Dersler starts returning from `sheetRecede` | frame 4: lesson ink nearly gone, surface whole |
| 3 | Route clip folds into the tile rectangle; radius to the tile's in the last third | `page` | Dersler back to scale 1 | mid-fold: one opaque surface |
| 4 | Tile face fades in over the last third of the fold | `fade` | none | landing frame: tile face complete, no swap |
| 5 | The tile's outline draws itself in from the top-left around the tile; neighbours ripple by distance | `draw` for the outline, `ui` for the ripple | adjacent tiles settle, nearest first | last frame: outline closed, nothing moving |

### Option: matrix-cell reveal (setting, default off)

Instead of one block, the screen fills with opaque cells (about 48 px, the path's grid) spreading out from the
tile, nearest first; the lesson content then arrives as in phase 4. Closing reverses the spread toward the
tile, then phase 5 as above. Same budget; same checks.
