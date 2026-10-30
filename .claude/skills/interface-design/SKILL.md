---
name: interface-design
description: Use before designing, building or reviewing any Dizey screen, component, transition, sound or UI text outside the kept lesson layer (home, topic map, profile, settings, mock exam, dialogs), and when changing tokens.
---

# Interface design

Dizey's shell must feel premium and deliberate, share one language with the lessons, and get Eren to the
right lesson fast while showing honestly how ready he is for the exam. Research behind every rule here:
`docs/research/design-knowledge.md` (English) and the Claude Doc "Dizey Tasarım Dokümantasyonu" (Turkish).

Nothing from the old app is used directly (Eren, 2026-10-30 16:45Z). Its lesson presentation, animation and
sound systems may be studied for their logic, then rebuilt from scratch, tested and verified frame by frame
for speed, consistency, readability and continuity. `src/legacy/` and the current `src/engine/` values are
reference material until that rebuild replaces them. The motion and visual system itself is owned by the
"Build premium motion and visual system" thread; this skill sets the rules it and the screens follow.

## Status of these rules

The design principles below are **candidates**, applied provisionally (Eren, 2026-10-30) until he adopts them
through `.claude/skills/principle-adoption`. Platform baselines (Apple HIG, WCAG 2.2 AA) are not candidates.
Product choices Eren confirmed (2026-10-30): three areas Bugün / Harita / Ben, with the mock exam as its own
separate section; "sen" address; a light/dark switch is allowed and more themes may come later; no reminder
notifications for now (no review system exists yet). Still provisional: topics open, not locked (Eren asked
what this means; explained in the design-knowledge thread).

## Principle candidates

1. **Reason from Dizey's world.** Every visual and text choice needs a reason from linear algebra, the exam or
   the student. "Everyone does it" is not a reason. Not a ban list; a question asked of each choice.
2. **One language for lessons and shell.** Colour roles, matrix drawing, motion and sound events are one
   system shared by lessons and shell. The shell invents no parallel language; the system itself is rebuilt
   from scratch, taking only the logic of the old lesson layer.
3. **One recommended step, full freedom.** Bugün names the next step; Harita opens every topic.
4. **Measure learning, not opening the app.** Readiness map and mastery; no streaks, lives, XP or leagues.
5. **Feedback is about the task and never rides one channel.** Colour, text, sound and motion each carry it
   alone; haptics are a bonus.
6. **Shell fast, lesson calm.** Shell motion at tempo 1 with short springs; teaching pace stays in the engine.
7. **Measured celebration.** Small moments small, big moments rare.
8. **Respect silent mode and other apps' music.**
9. **iPhone native.** 44 pt targets, safe areas, Dynamic Type, system appearance, thumb zone.
10. **Correct Turkish.** Lecturer's terms, suffix harmony after variables, `lang="tr"`.
11. **Premium by craft.** Eren wants a UI that feels expensive, not flat. Every menu, button and transition is
    thought through for function, usability, look and motion: its open, close, press and hand-off states.
    Premium comes from precision (type, spacing, physics-based motion, depth that means something), never
    from copying a named app or adding decoration.

## Process

1. **Content and flow first.** Write the screen's job, its content and its flows as text; settle them before
   any visual.
2. **Token plan.** List the semantic tokens the screen uses (see `references/tokens.md`). A need no token
   covers is a token proposal, not a raw value.
3. **Two layouts.** Sketch two layout options at 390 pt (ASCII or grey boxes), pick one with a reason.
4. **Critique the plan** against the principles, `references/platform.md` and the AI-look list below. Change
   what is generic and say what changed.
5. **Build with real data:** real topic names, real matrices, real Turkish strings from `src/content/`.
6. **Critique the build** from 390 px screenshots, light and dark, and with reduced motion on. Remove one
   thing that is decoration.
7. **Hand over** with the checklist below filled in and "where does this break?" answered.

## AI-look check

Avoid: purple-blue gradients, gradient text, glow halos, icon tiles above headings, cards in cards, pill
eyebrows above titles, glassmorphism, grey text on coloured fill, uniform spacing everywhere, emoji as icons,
blinking or looping motion on things that do not change, missing component states. Ask for a reason before
using: a single generic sans everywhere, soft card shadows, numbered 01/02/03 markers (only for a real
sequence), default icon sets. In text: "X değil, Y", reflexive triplets, inflated words ("yolculuk",
"derinlemesine"), chatbot tone, synonyms for one math term.

## References (read the one you need)

| File | When |
| --- | --- |
| `references/platform.md` | Any screen: iOS and PWA constraints, accessibility, layout, input |
| `references/motion-feedback-sound.md` | Transitions, answer feedback, celebrations, sound, haptics |
| `references/learning-and-motivation.md` | Bugün, Harita, mock exam, error log, progress, rewards |
| `references/writing-tr.md` | Any Turkish UI text |
| `references/tokens.md` | Colours, type, spacing, radii, motion and sound tokens |

## Pre-delivery checklist

- [ ] Every value comes from a semantic token; no raw colours, sizes or durations in components.
- [ ] Contrast: text 4.5:1, large text and UI parts 3:1, both themes (automated).
- [ ] Targets 44 x 44 pt; nothing frequent in the top corners; primary action in the thumb zone.
- [ ] Safe areas respected; layout holds at 200% text; no horizontal scroll at 390 px.
- [ ] Meaning never by colour alone (greyscale screenshot check).
- [ ] All states designed: normal, pressed, focus, disabled, loading, empty, offline, error, update ready.
- [ ] Motion: the shared motion system only, interruptible by a tap, reduced-motion path checked; reviewed
      frame by frame (recorded at 60 fps) for speed, readability and continuity.
- [ ] Sound: only existing events, opt-in, silent in silent mode, nothing in the shell except mastery moments.
- [ ] Text: Turkish reviewed against `references/writing-tr.md`; strings live in `src/content/`.
- [ ] Stored data: any new field migrates (Dexie version bump) and survives export and import.
- [ ] Screenshots at 390 px, light and dark, attached to the PR.
