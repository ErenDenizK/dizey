---
name: stageshow-motion
description: Use when building, changing or reviewing any Dizey animation (lesson chrome, counters, dock, sheets, pushes, tabs), to hold it to Stageshow's motion rules and film it frame by frame before and after.
---

# Stageshow motion rules, for Dizey

Stageshow (github.com/benjitaylor/skills, folder `stageshow`, commit 8020574, MIT, Benji Taylor) is a skill
for faux product UI: marketing stills and cursor demos. Its kit, examples and framing rules are for that job
and are not vendored. Its motion rules are written for any interface, and those are the part Dizey uses:
`references/motion.md` and `references/choreography.md`, unchanged. Audit and trial:
`docs/research/stageshow-skill.md`.

## Which rules apply here

Apply these sections of `references/motion.md` to every in-app animation:

- Changing text and values: change only what changed; numbers roll last digit first with unchanged digits
  still (`src/ui/RollNumber.tsx` is our `Count`); a control's footprint is decided before its label moves.
- Things that appear, travel and leave: nothing pops; no blank frames in a handoff; a new row carries the
  rows below it; solid things move rather than fade through; content arrives after its container; a
  resizing surface moves size, position and content as one; landings are soft.
- Pace and easing: feedback starts on the input and stays product-quick; only teaching motion slows down;
  related responses overlap in reading order.
- `references/choreography.md`: keep the container steady while content changes inside it; mask only the
  moving slot.

Do not apply: cursor, loop, poster and camera rules (Dizey has no authored loops or cursors), and its
easing curves (our springs in `src/engine/tokens.ts` are the source of truth). Where a rule conflicts with
the old app's kept lesson motion (decision 0006), the old motion wins and the conflict is written down.

## Workflow

1. Name the rule the animation breaks, and the frame that shows it.
2. Film before: `node scripts/motion-strip.mjs <scenario> <out>` (one region, every 60 Hz frame at 4x,
   tiled strip and a 4x-slow video); `scripts/lesson-review.mjs` for a whole lesson.
3. Fix it in the component, add a guard test, film after with the same scenario, put both strips in the PR.
4. Stageshow's own detectors (`scripts/film.mjs`, `jumps.mjs`, `motion-watch.mjs`) are not vendored and
   are not run until Eren approves running external code.
