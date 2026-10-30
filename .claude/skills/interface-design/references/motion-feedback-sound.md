# Motion, feedback and sound

## Motion

- The full spec is `docs/design/motion-system.md` (laws, springs, gestures, every open/close/tap); read it before
  any motion work. One engine for lessons and shell: `src/engine/` (virtual clock, closed-form springs, gestures,
  press physics), rebuilt from scratch on 2026-10-30. No CSS transitions or keyframes for movement, no second
  animation library. Values live only in `src/engine/tokens.ts`; changes are logged in
  `docs/research/motion-tuning.md`.
- Springs (duration / bounce): `tap` 0.14/0 press-down, `release` 0.34/0.22 press-up, `fade` 0.22/0 effects,
  `snap` 0.32/0.16 small controls, `glide` 0.42/0 medium travel, `page` 0.5/0 screens, `settle` 0.55/0.32 throws
  and earned moments, `teach` 0.72/0.08 lessons. Components use `src/ui/` (Pressable, TabBar, Sheet, Push, Morph,
  Switch, Screen) instead of animating by hand.
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
| Tap | press physics (`tap` / `release`) | none | none or quietest | none |
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
