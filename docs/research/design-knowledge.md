# Design knowledge for Dizey's shell, feedback and sound

## Question

What does Dizey need to know before designing the shell (home, topic map, profile, settings) around the kept
in-lesson presentation, and which existing design skills are worth learning from? Feeds the design direction step
and a possible English design skill. Eren's Turkish synthesis lives in the Claude Doc "Dizey Tasarım
Dokümantasyonu" (https://claude.ai/artifact/V16mtof9MUVNPXdtckgdMA).

Fixed inputs, not re-researched: the old app's lesson presentation, motion engine and sound system (kept by Eren's
explicit exception), decision 0001 (stack), 0002 (teaching model), 0003 (feedback).

## Sources (opened 2026-10-30)

- Apple HIG pages via their JSON data: typography, layout, color, dark-mode, motion, feedback, playing-audio,
  playing-haptics, accessibility, tab-bars, onboarding, writing
  (https://developer.apple.com/design/human-interface-guidelines/)
- WCAG 2.2 new criteria: https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/
- Design Tokens format, first stable version:
  https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/
- MDN AudioSession.type: https://developer.mozilla.org/en-US/docs/Web/API/AudioSession/type
- KaTeX options (MathML output): https://katex.org/docs/options
- Duolingo home screen redesign (company's own account): https://blog.duolingo.com/new-duolingo-home-screen-design/
- Skills: anthropics/skills frontend-design, pbakaus/impeccable, nextlevelbuilder/ui-ux-pro-max-skill,
  szilu/ux-designer-skill, ceorkm/mobile-app-ui-design, LottieFiles/motion-design-skill, delphi-ai/animate-skill,
  GarethManning/education-agent-skills
- Other GitHub: tijnjh/ios-haptics, mnielsen/cognitive_tools, w3c/audio-session explainer
- Hacker News: 33673522 (Duolingo Path backlash), 31966919 (streaks), 13620871 (Essence of Linear Algebra),
  40329388 (Immersive Linear Algebra)

No prompt injection found in any source. Reddit and X block automated access (403), so they were not used.

## Findings

- No existing skill covers learning app + math notation + iPhone PWA. Good skills share one skeleton: a short
  SKILL.md, reference files loaded on demand, a plan-then-critique loop before building, and a pre-delivery checklist.
- Catalogue-based skills (palette and font databases) produce exactly the generic look we want to avoid.
- iOS baselines: body 17 pt, minimum 11 pt, targets 44x44 pt, contrast 4.5:1 text and 3:1 UI, follow the system
  appearance rather than an in-app theme switch, silence sound effects in silent mode, do not stop other apps' music.
- iOS Safari has no Vibration API; the only known haptic path is the `<input type="checkbox" switch>` control
  (Safari 17.4+), user-gesture only. Standalone PWA behaviour is unverified.
- Motion references agree: 80-180 ms for feedback, 200-350 ms for cards, 400-600 ms for page transitions, exits
  shorter than entries, total stagger under 500 ms, animate transform and opacity only, springs for interruptible
  motion. The kept engine's spring presets (press, ui, move, page, land, teach) already cover these.
- Duolingo's linear path removed decision load but users objected to losing choice ("there is now exactly 1 thing to
  do"). Streak discussions show streaks reward opening the app and invite minimum-effort lessons.
- Visual intuition (3Blue1Brown) unlocks understanding, but viewers want formulas derived from the picture and
  exams test computation. Interactive math texts fail when interactivity is not signposted, when figures reflow on
  mobile, and when sandboxes replace guided explanation (Nielsen).
- Turkish UI pitfalls: suffix harmony after variables (A'nın, B'nin), `lang="tr"` for case mapping, longer labels,
  `localeCompare(..., "tr")`.

## Taken

- Skill skeleton for a future Dizey design skill; frontend-design's plan, critique, "one signature element" loop.
- The shell reuses the lesson's colour meanings, matrix rendering, spring names and sound events; no new language.
- One recommended next step plus a fully open topic map; three areas proposed (Today, Map, Me), pending Eren.
- Design tokens in the W3C format, three layers (raw, semantic, component), with motion and sound included.
- `navigator.audioSession.type = "ambient"`; sound stays opt-in; the shell is almost silent.
- Accessibility table: WCAG 2.2 AA plus iOS values, the stricter one wins; Turkish accessible labels for matrices.

## Rejected

- Installing any of the reviewed skills as is (generic web focus, catalogue defaults, impeccable's hooks and
  downloads); ideas are adapted instead.
- Daily streaks (Eren), lives and running counters (0003), XP, leagues, random rewards.
- Relying on haptics for any information.

## Open

- Eren: three-area structure, locked versus open topics, "sen" versus "siz", system-only theme, reminders, whether
  to turn the doc into a skill, which of the ten principle candidates to adopt.
- Device tests: haptic switch trick in standalone mode, silent switch with Web Audio, edge-swipe back, Dynamic Type
  via `-apple-system-body`, Turkish VoiceOver reading of MathML.
