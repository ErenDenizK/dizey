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

## Addendum (0.16.0): every interaction sounds

Eren asked (2026-10-31) for a sound system that makes every interaction fun, fully integrated. Before this, only lesson beats and answers made a sound, so the shell was silent, and on an iPhone with the silent switch on nothing played at all, which reads as "sound is broken".

- **Touch tier**, quieter than every lesson sound, all drawn from the chord on screen (the home chord in the shell, the step's chord inside a lesson):
  - **tap** (−50): any button or link. **tab** (−47): each tab its own note of the home chord. **toggleOn / toggleOff** (−47 / −48): two notes rising or falling. **open / close** (−46 / −49): sheets and pushed screens, however they are opened or dismissed. **step** (−47): a new lesson step sounds its chord with the bass, so the chord walk is heard as you move.
  - Touch sounds never lift the pedal (`pedal: false`), so a tap cannot cut off the lesson end still ringing, and they take part in the half-pedal ducking with the frequent sounds.
- **lessonOpen** (−36, question tier): the home chord and a short rise when a lesson opens.
- **Wiring:** one capture `click` listener in `player.ts` plays `tap` for any control. The nearest `data-sound` overrides it with an event name or `none` (answers, keypad, next step and the exam rehearsal play their own sound or stay silent); `data-sound-index` picks a voice. New controls therefore sound without extra code.
- **Silent switch:** still obeyed by default. Ben has "Sessiz modda da çal", which sets `navigator.audioSession.type = 'playback'` (sounds through the switch, may pause other apps' music).
- **Haptics** (`haptics.ts`): one light tick on an answer and on a finished lesson. iOS 18+ via a hidden native switch toggled inside the tap; Android via `navigator.vibrate`. Off switch in Ben.
- **iOS unlock:** a one-sample silent buffer plays inside the first tap, for older iOS versions.
- **Sound lab** at `/lab/sounds` (Ben → Sesler → Sesleri dinle): every event, the place in the lesson that picks its chord, and a short lesson played as sound.
- Levels were recalibrated with `calibrate()`; the nine existing events came out at exactly their previous trims.

## Addendum (0.20.0): palettes, background music, the full sound lab

Eren, 2026-10-31: improve the sound system, add background music, and make the sound area like the old app's sound lab.

- **Palettes** (`PALETTES` in `synth.ts`): Rhodes (FM electric piano, default), Keçe piyano (stretched partials, soft hammer, a second string 1.6 cents sharp) and Cam (sine with a 5-cent twin and soft upper partials). They change timbre only; the notes and timing stay the same. `TRIM` is calibrated per palette and event, so switching palette does not change loudness.
- **Rewards from the old lab:** `seal` (V13 held open, an arpeggio, then home) and `secret` (♭VI maj7♯11 → I maj7♯11). Neither has a trigger in the app yet; they will play once seals and hidden insights exist.
- **Background music** (`music.ts`, scheduled in `player.ts`): generated live in sections of 8 beats at about 67 bpm. Each section is one chord of the same harmony: a pad swelling in, a soft bass on beats 1 and 5, and two to four melody notes that move by step through the chord's tones. Inside a lesson the chord is the step's chord; elsewhere it plays the old app's home loop I–vi–IV–V, two sections per chord, under a darker low-pass (1.5 kHz; the old bed used 900 Hz). It is on by default, can be turned off or softened (−7 dB), and is ducked by 8 dB under every non-touch event. It stops when the page is hidden and stays silent during the exam rehearsal. Because music and sounds always share the chord, they never clash.
- **Sound lab** (`/lab/sounds`): rebuilt after the old lab. A sticky console names the event and chord and lights each note on a keyboard as it sounds (chord tone, colour tone, suspension, bass, single tone). Below it are a lesson that plays itself (A·B = C over the six-chord walk, with a wrong answer and then the right one), the chord walk, the palette picker, music settings, every event, interface sound and reward, the theory, and the etiquette rules.
