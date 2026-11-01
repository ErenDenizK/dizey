# Stageshow skill: audit and first trial on Dizey's motion

Date: 2026-11-01. Asked by Eren (prompt of 2026-11-01 12:47Z): evaluate the "Stage Show" skill, integrate it,
use it to improve our animations, and show before/after.

## Source

- Official repo: `benjitaylor/skills`, folder `stageshow`, single commit `8020574` "Add Stageshow"
  (2026-10-30), MIT, by Benji Taylor (also author of `benjitaylor/agentation`, about 5k stars). Install line
  in its README: `npx skills add benjitaylor/skills --skill stageshow`. We did not use that installer.
- Found via GitHub search; copies exist in other repos (sickn33/agentic-awesome-skills, justrach/nanoui and
  others). Only the original was read.

## What it is

A skill for **faux product UI**: marketing stills, feature cards, bento grids and cursor-driven demo
animations, built in React with its own kit (`Stage`, `Act`, `Window`, `Phone`, `Roll`, `Count`, `Fly` ...),
about 60 example scenes, and Playwright scripts that film a scene into contact sheets and flag motion
faults (one-frame snaps, drift between neighbours, hard edges slicing text, near-empty frames, pops).

It is not a library for in-app animation. Its kit and framing rules (crop, bleed, plates, cursors, loops,
posters) are for illustrations of a product, not the product itself.

## Security audit

Read: `SKILL.md`, `README.md`, `LICENSE`, `NOTICE.md`, every file in `references/`, `package.json`, and the
scripts (`film.mjs`, `jumps.mjs`, `jumps-core.mjs`, `motion-watch.mjs`, `verification.mjs`, `browser.mjs`,
`dev.mjs`, plus a pattern scan of all scripts, kit and playground code).

- No network calls besides npm dependencies; no `curl`/`wget`/`eval`; no reading of env secrets, SSH keys
  or cookies; no file deletion outside its own output.
- `child_process` is used twice: `film.mjs` re-runs itself when the dev server reloads mid-film, and
  `dev.mjs` starts Vite (optionally through the `portless` package, an optional dependency we would not use).
- No install hooks (`preinstall`/`postinstall`) in `package.json`.
- No hidden instructions: no HTML comments, encoded blocks or "ignore previous instructions" text in the
  markdown.
- Third-party app icons in `assets/app-icons.ts` are not MIT (see its `NOTICE.md`); not vendored.

Verdict: clean. Running its scripts is still running external code, so it waits for Eren's explicit OK
(asked 2026-11-01).

## What we took, what we rejected

| Part | Decision | Why |
| --- | --- | --- |
| `references/motion.md`, `references/choreography.md` | Vendored unchanged into `.claude/skills/stageshow-motion/references/` with the MIT licence | Precise, testable motion rules that apply to any interface ("change only what changed", "nothing pops", "no blank frames", "content arrives after its container") |
| Dizey skill `stageshow-motion` | New | Says which of its rules apply in Dizey and which do not, and how to film before/after |
| Kit, examples, playground, framing/craft/bento rules | Rejected | For marketing illustrations; our components and tokens are the source of truth |
| Its easing curves | Rejected | Our spring tokens (`src/engine/tokens.ts`) and the old app's kept motion win (decision 0006) |
| `film.mjs` / `jumps.mjs` / `motion-watch.mjs` detectors | Pending Eren's OK | Could run on our real screens by marking `#root` as their stage; would add whole-screen snap, drift and hard-edge detection on top of `scripts/lesson-review.mjs` |

## First trial: the lesson step counter

Rule broken (motion.md, Changing text and values): "Change only what changed"; "numbers roll, last digit
first, unchanged digits still".

- Before: on every step change the whole counter "3.1 · 2/14" restarted from opacity 0 and slid 6 px, so the
  lesson code and the total, which never change, blinked with it. Going back showed one frame with no
  counter at all.
- After: `src/ui/RollNumber.tsx`. Each place (ones, tens) is its own slot; the old digit leaves through a
  soft top or bottom edge as the new one arrives, in the direction of travel; ones first, tens one stagger
  later; "3.1 ·" and "/14" never move. Driven by the engine on the `chrome` channel, so it follows the
  virtual clock, tempo and reduced motion like the rest of the lesson chrome.
- Evidence: `scripts/motion-strip.mjs count` (every 60 Hz frame at 4x). Strips and a 4x-slow video:
  project files `screenshots/stageshow-trial/`. Guard: `src/ui/roll-number.test.ts`.

## Next candidates (same rules, not yet done)

- The verdict replacing the answer options in the dock: check the handoff frame for a hole (motion.md,
  "What replaces something arrives as it leaves").
- Text that changes inside one control (button labels between states): one slot, footprint decided first.
- Run Stageshow's whole-screen detectors over tabs, sheets and pushes once approved.

## Second pass: feedback UI (Eren, 2026-11-01 13:20Z)

Scope: buttons, keys, page transitions, progress bars. Filming and frame reading ran on smaller models
(script + Sonnet for capture, Haiku for before/after reading); Opus judged only the flagged frames.

| Surface | Before (frames) | Rule | Fix |
| --- | --- | --- | --- |
| Button press | Scale starts on the first frame after pointer down | clean | none |
| Tab switch | New page faded in over the fully opaque old one: two titles and two card sets overprinted for about 10 frames | Solid things do not fade through; page swap recipe | Old pane leaves on `leave` while the new one rises 12 px and fades in, same frame (`Shell.tsx`) |
| Lesson opening from the sheet | Lesson page faded in over Dersler, the sheet and the tab bar for about 12 frames | Same | Shell panes, sheet host and tab bar fade out on `leave` under the rising route, and back on close |
| Keypad answer | Placeholder replaced by the digit in one frame; every digit swapped in one frame | Every change moves; nothing pops | Typed digit rises in on `ui`; placeholder fades (`Keypad.tsx`) |
| Check key, back button | Disabled to enabled look in one frame | Nothing pops | `useEase` drives `--on` 0..1 on `fade` (`src/lesson/ease.ts`) |
| Progress bar | Fill glides | clean | none |

After: tab switch and lesson opening keep a short crossfade of 2 to 3 frames (inherent to a crossfade,
which is the recipe) instead of 10 to 12 double-exposed frames. Still open: tapping "Derse gir" updates the
sheet's status line and button label in the same frame the lesson starts opening (state written at tap).
