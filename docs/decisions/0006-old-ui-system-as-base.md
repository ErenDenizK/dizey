# 0006: The old app's UI system is the base, rebuilt on the current stack

- Status: accepted (Eren, 2026-10-31 10:54Z)
- Supersedes: the "nothing from the old project" rule for the UI layer (`CLAUDE.md` non-negotiable 1 and principle PR-01, rewritten by the system thread), the shell's
  visual system (`docs/design/visual-system.md`) and decision 0004's visual half.
- Evidence: `docs/research/old-vs-new-app.md`

## Context

After seeing 0.10.0 and 0.11.0 next to the old v21 app, Eren said the new UI has no coherence ("nizam"): its elements
do not agree with each other in sizes, type, spacing or controls, and the design rules we researched may have
misled us. The old UI had that coherence despite its bugs. Its one real weakness was that it was hand-written
HTML/CSS/JS in a single file, so it could not be developed further. The old app's problems were its background and
instruction systems, its development process, and the shell's structure and motion; its lesson screen, presentation
and sounds were close to perfect.

## Decision

Rebuild the old app's UI language (its token system, typefaces, components, lesson screen, mascot, logo, seals and
badges) on the current React + TypeScript + engine stack, as the app's design system. Keep the current content
(lessons, questions, exams), the current infrastructure (storage, migrations, PWA, tests, CI, previews, sound) and the
features the old app lacked (exam rehearsal, error log, backup). Then improve the shell (main menu, lesson access,
profile, transitions) on top of this system.

What comes over as is: the brand mark and logo, the two-face mascot, seals and badges, the palette, the type scale,
spacing, radii, elevation, the Onest typeface and the two small math faces (operators and a serifed `I`).
What is rebuilt: everything as typed tokens, React components and engine motion, with tests. No old JavaScript runs
in the app, and the old file structure, tools, rules and process stay out.

## Ordered plan

Each step is one PR that leaves the app working; independent steps can run in parallel.

1. **Tokens and assets.** Port the old token layer to `src/styles/tokens.css`: the twelve-step palettes (neutral,
   brand, accent, success, warning, danger, row, column) in light and dark, semantic colour roles, type scale and
   leading, weights, spacing, radii, shadows, strokes and component sizes. Self-host Onest and the two math faces.
   Add the logo, the brand mark and the mascot as SVG components. Map today's token names onto the new values so every
   screen changes at once, with no layout work yet.
2. **Components.** Rebuild the old components in `src/ui` on the tokens: primary and secondary buttons (56 px),
   icon buttons, segmented tabs with a sliding pill, lesson tiles, list rows, the lesson top bar with a segmented
   progress bar, the dock, options (letter chip, 2×2 grid for short answers), the keypad, the feedback sheet with the
   mascot, the seal, and stat blocks. Each one appears in `/lab` in light and dark.
3. **Lesson screen.** Put the lesson player on those components so it matches the old screen frame for frame: stage,
   narration, dock, feedback sheet ("Doğru" / "Tam değil", "Cevabın: …", the mascot's reaction), and the finished
   motion (number flights, Sarrus copy, replay and pause, the result landing). The scene-fit sizing from 0.11.0 stays.
4. **Question types, one by one.** For each type (explain, multiple choice, keypad, summary, exam-style), write down
   how it looks and behaves in the old language, then build it. The content of each lesson is checked as it moves.
5. **Lesson end and seals.** Short exam summary, the "Cevapların" answer matrix, the next-lesson action and seals.
   "Gizli an" comes after the UI has settled.
6. **Shell.** Main menu, lesson access and profile in the old language, rebuilt with better structure and motion:
   unit tabs and lesson tiles, a sticky continue action, the "Ders matrisi" overview, the exam section and the error
   log.
7. **Colour.** Following Eren's rule (two harmonious colours plus one striking accent), offer alternative palettes
   that can be switched in the app. These are built on the semantic roles from step 1, so each palette is only a list
   of values.

## Consequences

- The research-based shell rules in `docs/design/visual-system.md` stop being binding; the old system's own rules
  (one primary action per screen, chrome stays ink-neutral, colour energy comes from the math roles and verdicts,
  44-48 px targets) are carried over as part of step 1's documentation.
- Work in flight on the motion engine is kept: the engine replaces the old one, and its springs are tuned to the old
  presets where they differ.
- Watch: Onest and the math faces must be self-hosted (no Google Fonts at runtime); dark mode contrast must be checked
  again after the palette swap.
