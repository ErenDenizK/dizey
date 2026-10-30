# Motion, feedback and sound

## Motion

- One motion system for lessons and shell (today `src/engine/`: virtual clock, springs; being rebuilt from
  scratch from the old system's logic, with every value re-derived and checked frame by frame). No CSS
  transitions or keyframes for movement, no second animation library. Values live only in `src/engine/constants.ts`; changes
  are logged in `docs/research/motion-tuning.md`.
- Shell springs: `press` (tap feedback), `ui` (small state changes, tab indicator), `move` (reordering,
  cards moving), `page` (screen change, a card growing into the lesson stage), `land` (only a real settling
  moment such as a mastery seal). Teaching springs (`teach`, `carry`, ...) stay in lessons.
- Approximate 2% settle times at mass 1: press ~95 ms, ui ~125 ms, move ~180 ms, page ~270 ms. Generic CSS
  guides put page transitions at 400-600 ms; our page spring is deliberately quicker. Tune on device.
- Purpose: every shell animation answers "where did Eren go from, and to where?" Do not animate frequent
  interactions beyond press feedback (HIG). Never make anyone wait for motion; a tap finishes it.
- Continuity: the lesson card grows into the stage and shrinks back; no empty frame between screens.
- Crowds: when many map nodes update, at most a third move at once; total stagger under 500 ms.
- Reduced motion: opacity instead of travel; lesson steps still step.

## Feedback (decision 0003)

Evidence: feedback aimed at the self can lower performance (Kluger and DeNisi 1996); task comments beat grades
(Butler 1988); task and process level feedback works best (Hattie and Timperley 2007); confident errors that
get corrected are remembered better (hypercorrection).

| Moment | Visual | Text | Sound | Haptic |
| --- | --- | --- | --- | --- |
| Tap | `press` spring | none | none or quietest | none |
| Correct | value settles, mark + colour | short, about the task | `correct` | one tick on tap, if supported |
| Wrong | wrong step marked, never red alone | error type + how to fix, no blame | `wrong` (unresolved chord) | none |
| "Anlamadım" | step replays slowly | same idea, other wording | none | none |
| Lesson end | settled skills, items sent to error log | what was learned, what is open | `lessonEnd` | none |
| Mastery / milestone | seal; node changes on the map | which skill, on what evidence | `seal` / `milestone` | none (not a tap) |
| Data-loss risk | confirmation sheet that stops the flow | what will be lost | none | none |

Rules: no running wrong counter or lives in lessons; real score only in the mock exam; no shake on wrong
answers; praise the work, not the person. Optional confidence tap: "Ne kadar eminsin? (az / çok)".

## Sound

- Kept system (`src/legacy/v21.js` sound part, to move to TypeScript later): Web Audio synthesis, no files;
  three timbres; every event derives from the lesson's current chord. Loudness by frequency tier: frequent
  events quietest (select, land, merge), question moments louder (wrong, correct), rewards loudest (seal,
  halfway, milestone). Wrong is a suspended chord, correct resolves it: tension and release, not punishment.
- Sound plays on the frame a value settles and never on its own. Default off; the user turns it on.
- The shell is almost silent: no sound for tabs, scrolling or lists. Only `seal` and `milestone` when they
  appear on the map. Add no new events; reuse existing ones.
- Settings in Ben: sound on/off and timbre. Offer "Sesi dene" once in the first lesson while sound is off.
