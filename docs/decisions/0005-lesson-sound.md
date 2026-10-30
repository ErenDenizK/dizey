# 0005: Lesson sound

- Status: accepted
- Date: 2026-10-30
- Ledger items: Eren's request (via coordinator, 2026-10-30) to bring back the old lesson sounds before the first usable version, rebuilt from scratch, obeying iPhone's silent mode, with a switch in Ben.

## Context

Eren liked the old app's lesson sounds. Nothing old may be used directly, so this rebuilds them. We kept only the old app's musical logic as a reference: one key, one chord walk per lesson, and suspension for a wrong answer and its resolution for a right one. The sounds must stay quiet in class: iPhone's silent switch has to silence them, and music from other apps has to keep playing.

## Options

| Option | For | Against |
| --- | --- | --- |
| Recorded audio files | Simple to play | Extra downloads for the offline PWA. An `<audio>` element ignores the silent switch. Sounds cannot follow the lesson's harmony. |
| Web Audio synthesis (chosen) | No files to download. Sounds follow the step's chord. The same code renders offline, so levels can be measured. | More code. Levels need a calibration pass. |
| No sound | Nothing to build | Eren asked for it. |

## Decision

Sound is synthesised with Web Audio in `src/sound/`, in four layers:

- `harmony.ts`: the pitch material. The key is D♭, voicings are rootless, and a lesson walks I–IV–iii–vi–ii–V.
- `score.ts`: a pure table of what each event plays.
- `synth.ts`: an electric-piano FM voice, a glass voice for arpeggios, pads, a room reverb and a limiter.
- `player.ts`: the app instance. It sets the audio session to `navigator.audioSession.type = 'ambient'`, which obeys the silent switch and mixes with other audio; Safari's default Web Audio session already behaves like `ambient`. Audio unlocks on the first tap, suspends after 30 s of idle, and goes silent when the page is hidden.

Each event has a loudness target (LUFS, momentary maximum), and frequent sounds are the quietest:

- **select** (−45): a keypad tap.
- **land** (−43): a beat frame.
- **merge** (−41): a frame that shows a result.
- **wrong** (−37): the step's chord, suspended and left open.
- **correct** (−32): the same chord, whose suspension resolves.
- **streak** (−31): three right first tries in a row.
- **lessonEnd** (−28): ii–V–I.
- **halfway** (−27): half of all lessons done.
- **milestone** (−26): a unit finished.

`measure.ts` calibrates these targets into `TRIM` by rendering offline in a browser. With the master boost, the measured peaks run from −34 to −10 dBFS, so there is no clipping. Sound is on by default and can be turned off in Ben under "Ders sesleri". The exam rehearsal makes no sound.

## Consequences

- If a voice, chord or event changes, rerun `calibrate()` in a browser and paste the new values into `TRIM`.
- Sounds start on the beat frame's cue. They do not wait for the motion to settle, so a long spring can sound slightly early.
- We have not yet tested on a real iPhone how this behaves alongside Bluetooth latency and other apps' audio. That is the first thing to check on Eren's phone.
