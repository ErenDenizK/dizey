# Lessons learned

Short entries from our own mistakes, Eren's feedback and other projects' experience. A second entry with the same root cause turns into a principle candidate (see `.claude/skills/principle-adoption`).

| Date | What happened | Root cause | What changed | Source |
| --- | --- | --- | --- | --- |
| 2026-10-30 | The abandoned first attempt accumulated rules such as "never use a bottom tab bar" after a single complaint about one ugly tab bar. | A reaction to one bad instance was written down as a ban on the whole pattern. | Principle adoption now requires root cause, counterexamples and scope (PR-03). | Eren, P4.12 |
| 2026-10-30 | The first planning pass presented items from the old project (rules, design notes) as if they were current defaults. | Archive material was read as guidance instead of as data. | Old material is excluded by default (PR-01). | Eren, P2.1 |
| 2026-10-30 | Three design directions were proposed and all rejected; Eren pointed out no field research preceded them. | Proposals were generated from taste instead of from researched patterns and existing products. | Exhaustive top-down design research now precedes design work; candidate C-03. | Eren, P10.1 |
| 2026-10-30 | The blanket "nothing old" rule would have discarded the old in-lesson layer, which Eren rates above every new direction. | An absolute exclusion was applied without asking which parts Eren valued. | PR-01 now names the kept exception; future blanket rules ask "what inside this is worth keeping?" | Eren, P9.2 |
| 2026-10-30 | PR #1 was auto-closed by GitHub during a rebase onto the new `main`. | The rebased head was force-pushed while the PR still targeted a base with no shared history. | Retarget the PR's base first, then push the rebased branch. | Stack thread |
| 2026-10-30 | After the design research, work stopped for about 1.5 hours waiting for Eren's answers to open questions; Eren asked why it stopped. | Open questions with recommendations were treated as blockers although every next step was reversible. | Proceed on the recommended option, mark it provisional, and keep the next step moving; only irreversible steps wait. | Eren, design research thread |
| 2026-10-30 | The first audit of the 2024 midterm passed items 13 and 16, and the bank A check passed items 1 and 7; building the question bank showed all four are defective (inconsistent data; a second correct option). | The audit derived the intended answer and checked the key, but did not test the premises or whether other options are also correct. | Bank tests recompute every option, require exactly the keyed one to pass, and check that given data is consistent. | Curriculum thread |
| 2026-10-30 | A first draft of the S2 lesson had |A| = 2 at k = 0 in a claim and in an option feedback line; the claim test caught the claim, but the same wrong value in the feedback text was found only by reading. | Numbers written in prose (body, feedback, solution) are not tied to claims, so the recompute test cannot see them. | When a claim value is fixed, grep the lesson for the same number in prose; candidate: a check that every "$|X| = n$" in a lesson text matches a claim. | Curriculum thread |
| 2026-10-30 | An independent review of the first 17 lessons found 3 math errors in prose (a reflection-then-rotation order, |A| as area without the absolute value, rank defined on an unreduced matrix) and lessons that referred to material taught later. | Prose statements have no claim behind them, and lessons were registered in writing order (exam weight) instead of prerequisite order. | Review fixes applied; `lessons` is now in study order with exam weight kept in the analysis. Independent review stays a step before each content block is called done. | Curriculum thread |
| 2026-10-30 | Frame-by-frame review of the new motion system found six defects that unit tests and still screenshots had missed: an empty frame on tab switch, a lens that teleported, a switch whose taps were blocked by its own knob, a lesson stage that never closed, card corners lost to a CSS variable cycle, and a screen behind a sheet that receded invisibly. | Motion and layering bugs only show over time or in combination; per-state screenshots cannot see them. | `scripts/motion-review.mjs` steps the virtual clock one frame at a time, measures the moving element and checks jumps, settle time and overshoot; run it for every motion change. | Motion thread |
| 2026-10-30 | Token names like `--radius-card` were also Tailwind theme keys; mapping `--radius-card: var(--radius-card)` made a cycle and every card lost its corners. | Two systems shared one custom-property namespace. | Dizey tokens avoid Tailwind's theme namespaces (`--corner-*`, `--type-*`, `--page-gutter`); the theme maps into them. | Motion thread |
| 2026-10-31 | After ten releases the from-scratch shell still felt incoherent; Eren asked to return to the old app's UI language as the base. | The old UI and the old process were discarded together, although only the process had failed; researched general rules replaced a working visual system without a token system tying elements together. | The old UI is the base, rewritten with an extracted token system (PR-01, decision 0006). When rejecting a past attempt, separate what failed from what worked. | Eren, 2026-10-31 10:54 |
| 2026-10-31 | An e2e test that checks the tab bar leaves the screen failed about half the time, and a rehearsal result taller than the screen could not be scrolled. | The app frame had `overflow: hidden`, which the browser still scrolls for focus; the frame drifted 405 px and carried the tab bar with it. The rehearsal result had no scroller of its own and only "worked" through that same drift. | The frame uses `overflow: clip`; full-screen routes scroll inside themselves. A flaky test gets diagnosed before it gets a retry. | Storage PR #40 |
| 2026-10-31 | A frame-by-frame recording of a whole D1 play-through found the stage re-laying out in one frame on every step change and every answer (23 to 308 px), the matrix resizing in the last frame of reveals, and one step replaying a 25 s computation the next step repeats. The lab's motion review had passed. | The motion review covered components in the lab, not a real lesson; layout changes caused by content (narration length, feedback, a result landing) were never animated or reserved. | `scripts/lesson-review.mjs` records a scripted lesson play-through with per-frame jump, pop, resize and clipping detectors; the stage reserves the beat's final layout and glides every re-layout. Run it for every lesson-player change. | Lesson motion audit |
| 2026-11-01 | PR #63 let the choice dock grow into the stage's free height; it passed unit, e2e and three sample screenshots, then a lesson walk found 3×3 matrix options overlapping (3.4) and a clipped question (5.3), and the frame-by-frame review found the dock jumping up to 180 px in one frame on every wrong try and reveal. | A shared lesson layout change was checked on a few steps at one width, and `scripts/lesson-review.mjs` was not run although the 2026-10-31 entry asks for it on every lesson-player change. | Reverted the shared-height layout (#67); the stage alone absorbs layout changes. Lesson-player layout changes now run `lesson-review.mjs` against the previous build and a full lesson walk at 375 and 390 px before merge. | Design review thread |
| 2026-11-01 | Overnight, six threads merged nine PRs within two hours; most of them had to be re-merged with main only to change `package.json`, several claimed the same version (three PRs said 0.24.2 or 0.25.2), and one CI run was cancelled while its branch fell five commits behind. | Every feature branch bumped the version itself, so each merge made every other open PR conflict on the same line, and the version number named a branch's guess instead of what actually shipped. | Candidate (needs weighing, not yet a rule): feature PRs never touch the version; the version is bumped only by the merger right before merge, or derived at build time from the last release tag plus the commit hash the app already shows. | Overnight QA thread |
| 2026-10-31 | At 23:28 Eren felt half his details from the last 6 to 7 prompts were skipped. A sentence-level audit found most items done but sitting in 5 unmerged PRs, and two real misses: the "font" ask was read as type consistency while Eren meant bigger and fuller, and the title fix (0.22.0) changed the mechanism but still showed two titles. | Work was reported per thread, not per sentence Eren said, so coverage was invisible; items were restated in a thread's own terms instead of as the visible change Eren described. | PR-06 sharpened: sentence-level tracker with Eren's words, visible change, owner and evidence; an item closes only when live and checked as Eren will check it. Briefs quote Eren's words. | Overnight QA thread, retro 11-01 |
| 2026-10-31 | Two rounds of numbered design questions (conflicts 1 to 10) cost Eren time and he could not judge them ("6'yı anlamadım"); he asked for results instead. | Options described in words have no observable target for a visual judge. | PR-13: decide reversible design choices and show them live. | Eren 10-31 11:58 |
| 2026-11-01 | Retro: day 1 produced 30 PRs, but its shell, tokens and lesson presentation were replaced within a day; the evening block produced 35 PRs that nearly all survived and earned "nearly everything fixed". | Day 1 worked toward abstract taste words and researched rules without a reference, a method to find gaps, a guard or a live check; the evening had all four. | PR-11 (reference first), PR-12 (walk live, guard every fixed defect class); see `docs/research/retro-2026-11-01.md`. | Retro thread |
| 2026-11-01 | The version-bump collision recurred after its lesson was written: two commits said 0.27.2 (#74, #76). | The lesson stayed a candidate, so no workflow changed. | PR-14 adopted as trial: feature branches never bump the version; bump in the last commit before merge, after rebasing. | Retro thread |
| 2026-11-01 | The prompt ledger stopped at P11 (10-31 10:54); 22 later prompts were never itemised there, so threads could not read them while working and Eren asked again that no prompt be lost. | Only the setup thread could edit the ledger, and when that thread finished nobody took over; the overnight tracker covered one burst only. | Ledger backfilled (P12 to P33); ownership passes to a named thread when the owner ends (`ledger-capture` skill). | Retro thread, Eren 11-01 12:14 |
| 2026-11-01 | Most of the night's token cost came from Opus reading screenshots and video frames one by one and looping on its own reviews. | One model for every kind of work; repeated checks were not turned into scripts or delegated. | PR-09 rewritten: model per work type, code detectors first, no Opus review loops. | Eren 11-01 12:14 |

## 2026-11-01: scroll-linked transforms on separate pieces never read as one surface

Two Dersler scroll effects shipped and were rejected: a focus lens (each tile and heading scaled around its own centre) and a drum projection (every point mapped through one curve, path redrawn each frame). Even with mathematically consistent mapping, the eye still sees separate blocks turning on their own, and Eren judged it tiring for long use. Lesson: an effect on a scrolling list must act on the whole page as one piece (or not at all); prototype it as a phone preview before merging, since math consistency did not predict the feel. Guard: e2e "scrolling Dersler moves the path as one flat page".
| 2026-11-01 | Settings (0.37.0) shipped with motion and coherence defects Eren found on the phone: an open animation unlike the rest of the app, a back button covering content, the top blur hiding the "Ayarlar" title, and a generic platform look instead of ours. | The done condition checked the new screen in stills, not each phase of its transitions or how it sits with the screens and controls around it; the defects only show in motion and in context. | Brief done conditions now include a phase-by-phase walk of every changed transition (open, settle, close, and what neighbours do) and a whole-app pass of the surfaces it touches, on settled frames at 375 and 390 px (P39, P43). A quality check, not a cap: it adds no limit on what may be built. | Eren 11-01 15:56 |


## 2026-11-01: a chrome fix checked on one scroll position hid the title at the other

A taller top fade for the floating back button (ed00d73) was checked only on a scrolled page; at scroll 0 it sat over the large "Ayarlar" title and hid it, and Eren found it. Lesson: chrome that overlays scrolling content has two states, and both need a look. Guard: pushed screens are checked at scroll 0 and scrolled; the e2e settings test asserts the top fade is transparent at scroll 0 and visible once scrolled.

## 2026-11-02: an overlay that tracks scrolled content through JavaScript always lags a frame on iOS

The companion (0014) lived in a fixed layer and followed anchors inside scrolling pages by reading their rects. On iOS the compositor scrolls the page on its own thread, so a JavaScript read is a frame behind and the character trembled against its anchor; sized from a measured rect it was also never crisp. Lesson: a thing that belongs to scrolling content lives in that content's layer (inline, in the card) so the compositor moves both together. Guard: `e2e/birim.spec.ts` scrolls Yol and asserts the Birim's rect moves exactly with its tile (difference under 1 px).

## 2026-11-02: a mascot shipped on a concept nobody looked at as a character

**What happened.** Eren rejected the following duo (0014) at 01:32Z. The character thread wrote a report with three
directions, picked one itself (Birim, a unit square whose moods are 2×2 matrices) and had it built and merged
(0.58.0 and 0.59.0) within hours. At 14:06Z Eren called it ugly, out of proportion, nearly without reactions,
soulless and without personality, and asked how it got approved. Satır, Sütun and Köşeli, which it replaced, had more
character.

**Root causes.**
- A taste and identity decision was run like a reversible engineering step. "Decide and show results" (PR-13) and
  "decide without waiting" were meant for workflow and layout. They were applied to the face of the product, where
  only Eren's reaction counts.
- The concept was judged by its cleverness (det = area), not by its appeal. Nobody asked "is it cute, would you bond
  with it?" A square limits expression, and affine shape changes do not read as emotion.
- What made the old cast likeable was thrown away: limbs (Köşeli's bracket arms), a relationship (Satır and Sütun),
  cheeks, brows, gaze, blinks. The body was also the same sand colour as the primary button, so it read as interface.
- No independent review. The "two voices" debate in the report was the same author arguing with itself. Most
  placements were 24 to 40 px, where the weakness did not show.

**What changed.**
- Five new candidates (Köşeli, Satır ve Sütun, Pivot, Öz, İnce) went to Eren as phone mockups, each with six moods,
  an in-app scene and a story. None is built until he picks one.
- A second reviewer who did not draw them rated appeal and flagged moods that do not read.
- Principle candidate (to weigh with `principle-adoption`; the 2026-10-30 rejected design directions are the first
  occurrence of the root cause): identity choices (mascot, logo, palette, app name) pass an Eren pick gate. Options
  arrive as visual mockups, Eren picks, and only then is code written. Character candidates are drawn large in at
  least six moods and reviewed for appeal by someone who did not draw them.

## 2026-11-02: a model reviewer's appeal score stopped being a usable gate

**What happened.** Mırtis (the orange cat Eren picked) went through nine design rounds against a written quality bar
(`docs/decisions/0017-mirtis.md`). Every technical line passed, and so did the blind mood read (8 of 8). The appeal
line ("8.5/10 from a reviewer who did not draw it") never moved. Four independent reviews of clearly different
drawings all scored 6 to 7, and each one's advice contradicted the previous one. One review asked for a white tail
tip after an earlier review had called the existing cream tip a detached capsule.

**Root cause.** A measurable bar works for what can be measured: continuity, cost, a blind mood read. "Appeal" scored
by a model against "the best mascot you know" is a taste ceiling, not a measurement. Past a point, more rounds spend
budget without moving the number.

**What changed.** Model reviewers still find concrete weaknesses, and each round fixed the ones that held up (a sweat
drop for oops, distinct closed eyes, a banded tail as the signature). The appeal verdict, though, went to Eren's eye,
and he approved. For future identity work: gate on what a reviewer can check (blind read, silhouettes, small-size
legibility), and use the appeal score only as a source of critique, never as a pass mark.

## 2026-11-03: get the owner's ear on a rendered prototype before building music

**What happened.** The lesson-end jingle was synthesized, calibrated and guarded (loudness, headroom, clicks, no
dropouts) and shipped twice. Eren rejected it both times: "three choppy chords, an artificial melody".

**Root cause.** Every check we had measured whether the sound was clean, and none asked whether it was good. The ear
that matters was the last step in the process, after the code. A sound can pass every test and still be wrong in
composition (chords stamped under a tune) and in timbre (synthetic voices).

**What changed.** For music, render a prototype offline first, from real instrument samples, and play two or three
versions to Eren before any app code exists. Build only the one he picks. Tests then guard what he chose (levels,
timing, no clicks), not whether it is good.

## 2026-11-03: every sound is judged inside the full mix, not alone

**What happened.** The recorded cues (0.73.0) were chosen by Eren from a prototype and then passed every guard. In the
app he said they "come in and cut off too abruptly", were "too showy and bright" and "do not fit the background music".

**Root cause.** Three things, one habit. The cues were designed and judged in isolation and never heard over the music
they play on. "Çok şaşalı" (colourful, showy) was taken as "bright" and answered with glock, flute and a high melody,
when what he meant was striking but soft. And the music was cut for the cues (`conductor.fade`), the exact fault ADR 0018
had already named, so the loudest moments were also the ones where the bed vanished. The cue files also ended on a
length budget with the reverb cut short, so a soft start did not make a soft end.

**What changed.** Music and cues share one palette (soft piano, harp, strings, cello), one room and one top end
(decision 0020). The music keeps playing under a cue and only ducks. Cues end on their own room tail and a long
exponential fade, never on a cut. Evaluate every sound inside the full mix: render a real lesson with the music and the
cues together and listen to that, and when a word like "colourful" has two readings (bright, or rich), ask or render
both before building.

## 2026-11-03: Widescreen 0.62.0 shipped broken

**What happened.** 0.62.0 made the app "wide-aware", and Eren called the result broken. Only Yol and Sen had been
designed, tested and screenshotted at wide sizes. The change also removed the app's frame column, which moved every
other surface onto its own axis: sheets, lessons, the rehearsal, Settings and onboarding were never opened at a wide
size, and they sat off-centre, on strips of different widths, with black bars. A second interaction model, the swap-in
card with no way to dismiss it, read as "pages do not open".

**Root cause.** Verification was scoped to the files changed, not to the blast radius of a global frame change. The done
condition named two screens instead of every screen at every target size. Mockups were reviewed more carefully than the
real app.

**Guard.** `e2e/wide-walk.spec.ts` walks a manifest of every screen and overlay, reached by real taps, at four wide sizes
(820, 1024, 1180, 1440): one axis, the declared measure, no sideways overflow, dialogs under a full-window scrim that close
on Escape and an outside tap, no bars at the window's edges, no line over 80 characters, the side column in flow. The same
manifest is compared with phone baselines (390, and 320 for Yol, Sen and the lesson). Any change to the shell frame, the
tokens or the overlays runs the full walk, and a new screen is added to the manifest (decision 0021).
| 2026-11-04 | On the Home Screen app, a ~62 pt dead band sat under the tab bar and the map was cut by a hard edge above it. A first fix (stretching the app frame to screen.height) would have put the tab bar under a region the OS draws itself. | iOS lays the standalone web app out against a viewport shorter than the screen (innerHeight 812 vs screen 874, WebKit bug 301994) and paints the rest in the page colour; the web layer cannot draw there. The band is the cached page colour, found by sampling pixels of Eren's screenshot before choosing a fix. | Kept layout inside the real viewport and made the scroll-edge fade fully opaque at the bottom, so the cut and the OS band read as one surface. Never size fixed boxes beyond innerHeight. | Eren, Home Screen screenshot |
