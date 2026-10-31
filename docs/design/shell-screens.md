# Shell screens

What each shell screen is for, what it shows, its states, and what is still missing in the build. Visual tokens, components and motion come from `visual-system.md` and `motion-system.md` (PR #23) and `src/ui/`. This file only covers structure, flows, states and copy.

Reference prototype (throwaway HTML, structure only): https://claude.ai/artifact/CUdGmJnBVggMksFt7pYF7t

## Navigation

- Four tabs, in this order: Bugün, Harita, Sınav, Ben. Labels are always visible.
- Eren is fine with these names. A setting to reorder them can come later; it is not needed for v1.
- Every lesson and every rehearsal opens full screen and hides the tab bar. Closing returns to the tab it came from, with the same scroll position.
- There are no locks. Every topic can be opened at any time. Missing prerequisites are a note, never a gate.
- Copy addresses the student as "sen".
- There are no reminders or notifications in v1, because there is no review schedule yet.

## Bugün

Purpose: one obvious next action.

- Header: a line about the exam. The date is not fixed: exam week starts around 15 Kasım, and Linear Algebra is probably 18 to 20 Kasım.
  - Gap: `examWeek` in `src/content/exam.ts` is hard-coded to 15 Kasım, and the line reads as a firm countdown.
  - Until Eren enters a date, show "Vize 1 haftası 15 Kasım civarı".
  - Let him set the exact day from Ben. After that, show the countdown.
- Main card: continue or start the next lesson. It grows into the lesson stage (`src/ui` card-to-stage).
- Below the card: the next one or two lessons, plus a row for the mistake log when it has open items.
- Empty state: once every lesson is done, point to Sınav.

## Harita

Purpose: see every topic and enter any of them.

- Group by unit: matrices, row operations, determinants, systems, mixed.
- Each unit header shows its weight in past exams as "geçmiş sınavlarda 12 / 34 soru". Determinant is the heaviest.
- A row shows the lesson title, its state as text plus a glyph (never colour alone), and its length.
- Tapping a row opens a sheet with: status, length, and a prerequisite note when a prerequisite is not started. The primary button is enter, continue or review, depending on the state.
- States:
  - Today the build has 3 (başlanmadı, kaldığın yer, tamamlandı).
  - The mastery model in decision 0003 has 4 (başlanmadı, öğrenildi, kalıcı, sınava hazır).
  - Keep 3 until there is a review system that can earn the later states. Do not show states the app cannot yet earn.

## Sınav

Purpose: rehearse under real conditions. This is its own section, separate from the lesson flow.

- Hub:
  - A resumable attempt, if there is one, comes first.
  - Then the available sets, each with question count and minutes.
  - Then history.
- Run (full screen):
  - Five options. Tapping the selected option again clears it.
  - Flag, plus a question strip of 18 buttons at least 44 px, in 6 columns:
    - answered: filled;
    - blank: outlined;
    - flagged: a corner mark that does not rely on colour.
  - The timer can be hidden with a tap, for students who get anxious watching it.
  - "Bitir" asks for confirmation and states the blank count.
  - No correctness feedback is shown until the rehearsal is finished.
- Result: score, wrong and blank counts, time, then each question with the student's answer, the correct answer and the solution. Wrong answers feed the mistake log.
- Gaps to check in the build: tap-again-to-clear, hide-timer, and wrong answers flowing into the mistake log.

## Ben

Purpose: progress, mistakes and settings. Rehearsals live in Sınav, not here.

- Stats row: counts per state.
- Mistake log ("Hata defteri"): open mistakes, each with the topic code and one sentence naming the mistake.
  - Gap: it does not exist in the build yet.
- Settings:
  - Ses: off by default.
  - Hareketi azalt: follows the iOS setting, with an override.
  - Görünüm: Sistem, Açık or Koyu. Eren approved a manual switch; more themes later.
  - Vize 1 tarihi: new; see Bugün.
  - Yedek al, and Yedekten geri yükle with confirmation.
- Footer: version and update date.

## First launch

In Safari, before anything else, explain Add to Home Screen. Safari and the Home Screen app keep separate storage. "Şimdilik Safari'de dene" is allowed, with the warning that progress will not carry over.

## Decided with Eren

- Lessons have no "Anlamadım" button. "Bilmiyorum" is the only way to say "I don't know" (Eren, 2026-10-31). The lesson player on main does not have it; the legacy v21 files are reference only and must not bring it back.

## Open with Eren

- Blue and orange for row and column. This is provisional in PR #23.
- Eren finds the current build too white, plain and cheap (2026-10-31). The visual system owns the fix; any shell change must be checked against it on the device.
