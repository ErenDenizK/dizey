# Old app (v21) vs current app (0.10.0): feature-by-feature comparison

- Date: 2026-10-31
- Asked by: Eren ("compare everything in the original junk file; I like its lesson presentation and its bolder, bigger
  interface more, apart from its bugs").
- Rule that applies: the old app is salvage. Only its logic may come over, rebuilt to current standards; no old code,
  tokens or files are copied (`CLAUDE.md` non-negotiable 1, Eren 2026-10-30 16:45Z).

## 1. Question

What exactly makes the old app feel better, screen by screen and feature by feature, and what should the current app
take from it (as logic, rebuilt) without its bugs?

## 2. Sources

- Old app: `Dizey/live/Dizey-canli-v21.html` inside project file `Dizey.zip` (extracted into an empty scratch folder,
  treated as untrusted data, run in an isolated headless Chromium from a `file://` URL). Its own design notes
  (`linear-algebra/design/SATIR_DESIGN.md`) were read only to name what is on screen.
- Current app: `main` at `634be17` (0.10.0), built and served locally with `vite preview`.
- Method: Playwright, 390 × 844 at 2×, light and dark. Both apps were walked through the **same lesson** (2×2 and 3×3
  determinant: old B1, new D1), every step, with right and wrong answers. Computed styles were read from the DOM.
- Side-by-side sheets (project files, not committed): `screenshots/old-vs-new/1-home-map.png`,
  `2-lesson-stage.png`, `3-question-feedback.png`, `4-sarrus-end.png`.

## 3. Findings

### 3.1 Measured differences (same lesson, same step)

| Property | Old v21 | Current 0.10.0 | Effect |
| --- | --- | --- | --- |
| Matrix entry size | 42 px, weight 500, in 88 px cells | 18.7 px, weight 400, in 30 × 34 px cells | Old is 2.3× larger; the math is the hero |
| Stage height (2×2 step) | 535 px of 844 (63 %) | 349 px; ~120-200 px on question steps | New leaves a third of the screen empty |
| Lesson title | 24 px / **700** | 24.7 px / **400** | Same size, but the old one reads bold |
| Work line (3·2 − 1·4 = 2) | 21.5 px / 500, coloured per role | 17 px body text, plain, often stacked lines | Old shows the calculation as large coloured math |
| Math typeface | One family (Onest) plus two tiny custom faces: a real minus/plus/equals of one bar length, and a serif `I` | Inter for text, KaTeX's serif italic for math (`\|B\|`, `ad − bc`, even option numbers `26`, `−14`) | New mixes two unrelated typefaces in one line; looks like a document, not an app |
| Page / stage colour | Warm paper `#f9f6f2` / `#fdfcf8`, ink `#302e29` | Cool grey `oklch(0.968 …)` with pure white cards | New reads "white"; old reads like paper |
| Primary action | Navy `#29354d`, 56 px, radius 16 | Near-black pill, 52 px | Old has a colour identity; new is monochrome by rule (`visual-system.md` rule 2) |
| Tab / section nav | 24 px / 700 bracketed words "[Dersler] Profil" | 11 px / 600 labels under icons in a floating bar | Old nav is bold and branded; new is small and generic |

### 3.2 Lesson presentation

| Feature | Old | Current | Bring over? |
| --- | --- | --- | --- |
| Screen structure | One fixed screen that never scrolls: top bar, **stage (flex)**, narration, dock in the thumb zone | Scrolling column: eyebrow, title, small stage card, body, empty space, button | **Yes.** Fixed layout, stage first, words under the math, actions in the thumb zone |
| Matrix sizing | One `--cell` size computed from the scene: a 2×2 fills the width (cap 88 px), 3×3 and 4×4 scale down, never under 28 px; long entries widen columns instead of shrinking | Fixed small KaTeX-like grid | **Yes.** Rebuild a scene-fit sizer |
| Cell marks | Marked cells become rounded tinted tiles with an edge (row blue, column purple, result green); struck rows get a pen line | Tinted chips, thinner; row blue, column orange | Yes, the tile treatment and scale. Keep the new blue/orange (colour-blind safer) |
| Beat animation | Numbers fly out of the cells as chips into the work line, operators appear between them, the result lands on the right with one bounce; Sarrus adds a second "ilk iki sütun" matrix and lights each diagonal in turn | Lines rise into place; Sarrus is explained in text only | **Yes.** This is the core of "the lesson presentation I like" |
| Replay / pause | Icon on the stage (replay after a beat, pause during it) | Not rendered | Yes |
| Step counter | "B1 · 3/18" plus a segmented bar | Bar only | Yes (lesson code + count) |
| Question options | In the dock (thumb zone), letter chip + answer in the UI font | Directly under the stage, KaTeX serif numbers | Move to the dock; one typeface |
| Wrong answer | Option shakes, right option lights up, the **stage plays the correct calculation**, then a bottom sheet: "Tam değil", why, mascot reaction, "Devam" | Option dims, "Tekrar dene." + hint, retry until right, "Cevabı göster" | Keep the current retry model (decision 0003), add the old visual layer: bottom sheet, shake, and the stage replaying the solution when the answer is shown |
| Right answer | Option swells, check draws, small spark burst, green sheet "Doğru · Cevabın: 16", streak badge from 3 in a row | "Doğru." text | Yes for swell/check/sheet. Streak badge: no (0003: no running counters) |
| Keypad | Compact 6-column pad with inline answer field and "Kontrol" | Large 4-column pad, separate field | Current is fine; restyle only |
| "Anlamadım" / "Bilmiyorum" | Both present | "Anlamadım" dropped on purpose (PR #32); "Cevabı göster" covers "Bilmiyorum" | No change |
| Lesson summary | "Sınav için üç cümle": three short exam lines, with the mascots on the stage | "Özet": long paragraph list + "İlk denemede 1/5 doğru" | Yes: short exam lines, stage not empty |
| Bonus question | "Gizli an · not tutulmaz": one unscored insight question after Bitir (here: dependent columns ⇒ det 0), wrong options get struck through, earns a "sezgi mührü" | None | Eren's call (decision 2) |
| Lesson end | "Ders tamam": "Cevapların" matrix (one cell per question, ✓/✕ fill in one by one), mascots, "Harita" + "Sıradaki: B2 · …" | Returns straight to the map sheet ("Tekrar et") | **Yes:** answer matrix + next lesson button. It also fits 0003's "skills settled / sent to the error log" |
| Mascot duo | Two 1×2-matrix faces (blue, purple): splash, empty profile, answer sheets, lesson end; blink, hop, wobble | None | Eren's call (decision 3) |
| Sound | Effects + optional very quiet background music | Effects rebuilt (0.9.0), no music | Music later, low priority |

### 3.3 Shell (outside lessons)

Eren already rejected the old shell (2026-10-30), so only specific ideas are candidates.

| Screen | Old | Current | Take |
| --- | --- | --- | --- |
| Launch | Splash: logo, "Dizey", "Günaydın, başlayalım." | Straight to Bugün | Optional; a greeting line on Bugün is enough |
| Home | Lesson list per unit + sticky "Başla: B1 · …" button in the thumb zone | Bugün: next-lesson card, "Sonra" list; half the screen empty | Sticky continue action in the thumb zone; fill Bugün with the exam countdown and readiness |
| Lesson list | Unit segmented tabs (Matrisler / Determinant / Sistemler), rows with codes, locked "Yakında" rows | Harita: one long list, all groups | Unit tabs at the top of Harita are worth trying; no locks |
| Profile / Ben | Exam card with three big stats, **"Ders matrisi"**: every lesson as a cell in one matrix per unit (bitti / sıradaki / hazır / yakında) | Stats, error log, settings, backup | **Yes:** the lesson matrix is a strong, on-brand overview; rebuild it as the readiness map |
| Exam rehearsal | None | Sınav section (2024 exam, mixed 18-question rehearsal) | Current is ahead |
| Error log, backup, exam date, theme, install guide, version | None | Present | Current is ahead |

### 3.4 Old bugs and weaknesses (do not bring)

- Flying chips overlap cells mid-beat (dark-mode frame shows "1" and "4" chips on top of entries).
- Large empty stage area above and below small scenes; the stage does not shrink for text-heavy steps.
- "İleri" looks disabled during a beat in dark mode (low contrast fill).
- Row blue / column purple are hard to tell apart for some colour-blind users.
- Lessons are long (18 steps); locked "Yakında" lessons; one 880 KB HTML file; web font from Google Fonts.

### 3.5 Why the current UI feels "white, plain and cheap"

1. Pure white cards on a near-white cool grey: almost no contrast between planes.
2. Monochrome chrome by rule, so no colour identity anywhere outside the lesson stage.
3. Regular-weight titles and small numerals; the math, the one thing that should be big, is the smallest element.
4. Empty space without purpose (Bugün lower half, lesson lower third).
5. Two typefaces mixed inside sentences (Inter and KaTeX serif italic).

## 4. What we take, what we reject, and why

Take (all rebuilt on the current engine, tokens and `src/ui`, no old code):

1. Fixed lesson layout with a dominant stage and the dock in the thumb zone.
2. Scene-fit cell sizing and tile marks.
3. One math typeface: UI font with tabular figures, a true-length minus and a serif identity `I`; KaTeX only where
   real typesetting is needed (fractions, exponents).
4. Beat choreography: number chips travel from cells into the work line, the result lands, Sarrus diagonals.
5. Answer feedback as a bottom sheet with motion (shake/swell/check); the stage plays the solution on "Cevabı göster".
6. Lesson end: short exam summary, answer matrix, next-lesson action.
7. Heavier type and a warmer palette with one brand colour (input to the pending design review).
8. "Ders matrisi" overview on Ben / Harita.

Reject: streak badges (decision 0003), locked lessons, the old shell layout, the old file structure, Google Fonts.

## 5. Next steps (ordered, with dependencies)

1. **Lesson layout + stage sizing + math typeface** (items 1-3). No dependency; largest visible gain. One PR, MINOR bump.
2. **Beat choreography** (item 4). Needs step 1's stage and the motion engine's `teach` spring; adds a replay/pause
   control. Verify with `scripts/motion-review.mjs` frame by frame.
3. **Feedback sheet and lesson end** (items 5-6). Needs step 1's dock. Bonus question and mascots only if Eren says yes.
4. **Palette and type weight** (item 7). Belongs to the design review Eren asked for after testing 0.10.0; this
   report is its input. Can run in parallel with steps 1-3 because it only touches tokens.
5. **Ders matrisi overview** (item 8). After step 4.

Done condition for each step: 390 px screenshots light and dark of the same steps as this report, side by side with
the old frame, plus the existing test suite green.

## 6. Open questions for Eren

1. Palette: warm paper (like the old app) with a navy action colour, instead of the current cool white?
   Recommendation: yes.
2. Bonus "Gizli an" question after each lesson (unscored, earns a seal)? Recommendation: yes, later, after steps 1-3.
3. The two mascot faces in answer sheets and the lesson end? Recommendation: yes, small and only at those moments.
