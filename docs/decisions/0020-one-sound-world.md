# 0020: One sound world: the music and the cues on the same instruments, in the same room

- Status: accepted (Eren's feedback on 0.73.0, 2026-11-03)
- Date: 2026-11-03
- Builds on: [0018](0018-adaptive-music.md) (adaptive music), [0019](0019-recorded-musical-cues.md) (recorded cues)
- Supersedes in part: 0018 "Rewards and the lesson end" (the music no longer fades for them) and the cue budgets,
  levels and instruments of 0019

## Context: what Eren heard in 0.73.0

"The music comes in and cuts off too suddenly, it is too showy and bright, and the background music does not fit
the cues." A critical look at the build found the three complaints were one fault, and it was ours:

1. **The music was cut for the cues.** `playSound` called `conductor.fade(plan.end - 1.5)` for every lesson and reward
   cue. The music dropped out under the most important moments and restarted cold afterwards. It was heard as cut and
   re-entered, exactly as ADR 0018 had listed in its own problem statement (point 3) and then re-implemented.
2. **The cues ended on a budget, not on their room.** A cue stopped at its length budget with its reverb cut short, so
   the end was abrupt even though the start was soft. The glockenspiel, the high flute and a melody above MIDI 80
   made them glassy. "Colourful" (şaşalı) had been read as "bright".
3. **Two timbre worlds.** The cues were recorded piano, harp and strings; the music under them was still the synth
   (a Rhodes-like pad, glass pulse). Each was judged alone and never heard over the other.

## Decision

### A. One soft palette

| Instrument | Source (VSCO 2 CE, CC0) | Treatment |
| --- | --- | --- |
| Soft piano | Upright, `dyn1` layer only | low-pass 3.5 kHz baked in, felt-like |
| Harp | KSHarp | as recorded |
| String pad | viola + violin section sustain | slow attack (0.3 to 0.5 s in the music) |
| Cello section | | the bass |

No flute anywhere. No glockenspiel, except one very soft, low-passed note in `milestone`.

### B. The background music plays on those instruments

`src/sound/sampler.ts`: a sampler voice in the Web Audio engine. `tools/sound/render_music_sets.py` renders four small
mono sprite files into `src/assets/sound/music/` (one file per instrument, all its notes in a row with silence between)
and `src/sound/sampleSets.ts` (where each note sits, and its loop region):

| Set | Notes | Length per note | Size |
| --- | --- | --- | --- |
| piano | every 3 semitones, MIDI 37 to 85 | 3.4 s | 319 KB |
| harp | every 3 semitones, MIDI 37 to 85 | 2.6 s | 249 KB |
| strings | every 4 semitones, MIDI 49 to 77 | 1 s attack + 3 s loop | 172 KB |
| cello | every 4 semitones, MIDI 36 to 56 | 0.8 s attack + 2.5 s loop | 110 KB |

Sprites rather than one file per note: four fetches and four decodes instead of 49 (iOS decodes every file separately),
and AAC compresses better across a longer signal. Pitch is `playbackRate` from the nearest recorded note (at most two
semitones). Sustained sets loop a region whose first 0.6 s are crossfaded with the material after it, so the loop
point has no seam. Samples are dry and level-normalised; the app's music bus adds the room.

The conductor's voices map onto them (`MusicVoice` on each music `Note`, set in `music.ts`):

| Voice | Instrument |
| --- | --- |
| Pad | strings (attack clamped to 0.3 to 0.5 s, voices spread left and right as before) |
| Melody | soft piano; harp for themes R and S |
| Bass | cello; the low piano when the bass lies above the cello's range |
| Flourishes (rise, peak, cascade) | harp |
| Off-beat pulse | harp, quieter |
| Halo (the high glass shimmer) | removed |

At most `MAX_VOICES` (28) sampler voices sound at once; a new note over the cap steals the oldest, which fades in
60 ms. The count is by schedule (a voice is alive from its start to its stop), so the cap works the same live and in an
offline render. Until the four sets are decoded the synth voices play the music as before; the beat grid, the form and
the adaptive energy are untouched.

### C. The six cues, softer and in the same room

Same scores and timeline, with: no flute; no glockenspiel (but one note in `milestone`); melody at or under MIDI 80
(an octave lower in halfway, milestone, seal and secret; the flute line of `secret` is harp and soft piano); the
lessonEnd glissando tops out at MIDI 85 and takes 0.5 s; piano velocities 0.35 to 0.55 with a phrase shape (a gentle
crescendo into home, then decay); the string pad a little more present.

**The room is shared.** The cues bake RT60 2.4 s, 32 % wet, and a high shelf of -4 dB above 5 kHz on their master.
The music bus has the same shelf, and its sampled notes get a reverb send matched to 32 % wet in the app's own room
(RT60 2.3 s). Dry samples plus one room is what makes them sound like one place.

**Envelope.** A 20 ms fade-in; the notes end where they used to; the room then rings out naturally for at least 1.3 s;
the last 0.8 s fall exponentially (to -90 dB) to true silence. A cue never ends on a cut. Budgets grow by the tail:
lessonEnd 4.6 s with home still at 1.5 s, lessonOpen 2.6, seal 3.1, halfway 4.1, milestone 4.7, secret 3.9
(`CUE_BUDGET` in `cues.ts`, asserted in `cues.test.ts`). The light timings in `cueTimeline.ts` are unchanged
musically; only `end` grows.

**Loudness.** Every cue target is 2 LU lower than in 0019 (`EVENTS[...].loudness` in `score.ts`); `CUE_TRIM` is
recalibrated.

### D. The music never stops for a cue

`conductor.fade` is now only the fallback for a synthesized cue (before the recordings decode), because that cue walks
its own chords. For a recorded cue:

- **A duck on the music bus**, for all six recorded cues (the opening cue is a question-tier sound, but ducks the same). -8 dB (`MUSIC_DUCK` lesson and reward tiers, `CUE_DUCK` in `cues.ts`) gliding in over
  0.4 s from the cue's start, held until the cue's `home` + 0.6 s, returning to normal over 2.0 s. The music keeps
  playing on its grid underneath. It is the one mechanism: the tier ducking of taps, answers and frequent sounds is
  the same `duckMusic` with different times, and a quieter duck never lifts a deeper one that is holding. The
  fallback synth cue keeps its old -24 dB duck beside the fade.
- **The melody rests** (`conductor.rest`) until the duck has returned, so the cue's melody has the line to itself.
  Pad and bass play on. A reward only rests the melody; the opening cue only ducks.
- **The lesson end settles on I** (`conductor.settle`): from the next beat the music holds chord I at the home loop's
  energy until the next step request or the learner leaving, so the cue's I-IV-V7-I resolves over a music that is
  already home. Nothing is stopped; the written-ahead bars are rewritten from the next beat.

## Consequences and guards

- `e2e/sound-levels.spec.ts` still holds: every sound at least 3 LU over the ducked music, per-sound targets within
  1.5 LU, peaks.
- `e2e/sound-flow.spec.ts` is stricter: the dropout scan has no exempt windows any more (the music alone is rendered
  with the cue duck applied), so a cut at a reward or at the lesson end would fail it.
- Unit tests: sample-set layout, voice placement for every theme, a bounded stretch, the voice cap, the duck schedule
  (down at the cue start, back at home + 0.6 s), `rest` and `settle` on the grid.
- Total audio: the four sets 850 KB plus the six cues 207 KB, about 1.06 MB, precached (`m4a` is in the workbox glob).
- Risks: see the handoff note of the release (iOS decode of the larger buffers, loop seams, sampler CPU on an iPhone).
  Decoded, the sets take about 33 MB of memory (mono float32).
- Regeneration: `python3 tools/sound/render_cues.py` and `python3 tools/sound/render_music_sets.py`, then recalibrate
  (`__dzMeasure.calibrateCues()` for `CUE_TRIM`, `measureLessonMusic()` for `SAMPLED_TRIM_DB` in `synth.ts`).
