# Learning and motivation in the shell

Teaching model: decision 0002. Feedback and motivation: decision 0003. Evidence: `docs/research/learning-science.md`.

## Information architecture (provisional, pending Eren)

- **Bugün:** continue where you left off, the recommended next step, reviews that are due, open items from the
  error log. One primary button: "Devam et: <lesson name>".
- **Harita:** the Vize 1 topic map (`docs/curriculum/vize1-topic-map.md`), each node showing real readiness:
  learned, retained, exam-ready. Every node opens; a node with missing prerequisites shows a short "önce şunu
  görmen iyi olur" note, never a lock.
- **Ben:** progress, mock exam results, error log, settings (sound, motion), data export and restore, version
  and short commit hash at the bottom.
- Mock exam opens from Bugün and Ben; no separate tab.

## Lessons from other products

- Duolingo's single path removed decision load but users hated losing choice ("there is now exactly 1 thing to
  do"). Hence: one recommendation, free map.
- Streaks reward opening the app and invite minimum-effort sessions; a broken streak becomes a reason to quit.
  Eren rejected streaks.
- 3Blue1Brown-style visuals unlock understanding, but exams test computation: derive the formula from the
  picture, then train fluency in the same step.
- Interactive math texts fail when it is unclear what is tappable, when figures reflow on mobile, and when a
  sandbox replaces guided explanation. Mark tappable things consistently; the stage never reflows; guide.
- Link representations: change one (a row operation) and its twin (the matrix, the area of the determinant)
  changes with it.

## Mechanics

| Mechanic | Status |
| --- | --- |
| Readiness map (24 nodes) | main progress indicator; moves only on delayed correct retrieval |
| Mastery badge (e.g. 5 delayed correct in a row on one skill) | yes, few |
| Error log with "fixed" count | yes |
| Mock exam score | only in mock exams |
| Daily streak, lives, running wrong counter, XP, leagues, random rewards | no |
| Reminder notification for due reviews | not in v1 (provisional) |

Avoid guilt copy ("Seni özledik"), countdowns that exaggerate loss, hidden progress, exit friction. Exit from a
lesson is always one tap and loses nothing.

## Screens still to design

- Mock exam: timer visibility and the anxiety it causes, pause and exit rules, feedback held until the end,
  result page items flowing into the error log.
- First run: no forms, no slides; the first screen is the first step of a short first lesson (in standalone
  mode; Safari shows the home-screen guide first).
- Empty states name the next step ("Henüz hata defterin boş; ilk alıştırmadan sonra burada göreceksin").
