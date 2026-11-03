# 0019: Recorded musical cues, and the sound map

- Status: accepted (Eren picked the rendered prototype "Zirve", 2026-11-03)
- Date: 2026-11-03
- Builds on: [0005](0005-lesson-sound.md) (lesson sound), [0018](0018-adaptive-music.md) (adaptive music)
- Amended by: [0020](0020-one-sound-world.md) (instruments, room, tails and budgets; the music no longer fades for a cue)

## Context

Eren rejected the synthesized lesson-end jingle twice: "three choppy chords, an artificial melody". The reasons were
in how it was made, not in its tuning:

1. **Chord-stamp composition.** The jingle was a few chords with a tune laid on top, so it sounded stamped rather
   than sung; no inner voice moved, nothing was voiced like a player would.
2. **Synthetic timbre.** Sine and FM voices, however well levelled, read as a phone game, not as an instrument.
3. **The ear came last.** Both rounds were built and passed every level test before Eren heard anything. A test
   passing says the sound is quiet enough and click-free, not that it is good.

A prototype rendered offline from real CC0 piano, harp, strings, flute and glockenspiel samples was played to Eren
before any app code was written, and he picked it.

## Decision

1. **The six musical moments are recorded.** `lessonEnd`, `halfway`, `milestone`, `seal`, `secret` and `lessonOpen`
   are pre-composed scores rendered by `tools/sound/render_cues.py` from VSCO 2 CE samples (CC0) into
   `src/assets/sound/<cue>.m4a`, decoded once into `AudioBuffer`s (`src/sound/cues.ts`) and played through the
   synth's own output path.
2. **Frequent sounds and the background music stay synthesized.** Taps, tabs, switches, select/land/merge, correct,
   wrong, streak, step and the adaptive music follow the lesson's chord live; a recording cannot.
3. **Same path, same rules.** A recorded cue goes through the synth's master volume, limiter, mute, exam silence,
   the tier's music duck and the lesson-end music fade. Palettes do not apply to it.
4. **Fallback.** Until a cue is decoded (the first seconds, or a failed fetch or decode) the old synthesized cue
   plays, so nothing is ever silent.

### The sound map (Eren, 2026-11-03)

Every cue is short and locked to the animation it plays with.

1. **Impact on 0.** A cue played on an impact has its first downbeat at t = 0, with no pickup notes. `lessonEnd`,
   `halfway` and `milestone` play when the seal's brackets close; `seal` plays when a rozet's brackets close.
2. **Length budgets.**

   | Tier | Cues | Budget |
   | --- | --- | --- |
   | touch | | at most 0.15 s |
   | frequent | | at most 0.4 s |
   | question | correct, wrong, streak | at most 0.9 s |
   | lesson | lessonOpen | at most 1.3 s |
   | lesson | lessonEnd | home chord at about 1.5 s, at most 3.2 s |
   | reward | seal | at most 1.8 s |
   | reward | halfway | at most 2.8 s |
   | reward | milestone | at most 3.4 s |
   | reward | secret | at most 2.6 s |

   Touch, frequent and question cues are the synth sounds and are unchanged. `src/sound/cues.test.ts` asserts the
   budgets of the recorded cues.
3. **One timeline for sound and light.** The renderer exports `src/sound/cueTimeline.ts` (chord changes, melody notes
   before home, home, end). `lightScore` in `src/ui/shine.ts` reads it for recorded cues, so the seal's glow, sparks
   and burst land on the chords and notes that are heard; it falls back to the synth plan only without a timeline.
4. **No overlap with the next sound.** The first rozet's seal sound plays at least 1.0 s after the reward cue's home
   chord (`badgeAfter` in `LessonEnd.tsx`, never below the old 1100 ms), and rozets are spaced at least the seal
   cue's length plus 0.6 s apart.
5. **One key, one family.** D-flat major, the same instrument family (piano, harp, strings, flute, glockenspiel) in
   every recorded cue.

The lesson-end cue is I (0 s), IV (0.60 s), V7 (1.20 s), I (1.50 s, home) over the first prototype's motif and
colour, in 3.2 s.

## Consequences

- About 0.2 MB of audio in total (six AAC files, 16 to 40 KB each), precached by the service worker (`m4a` is in the
  workbox glob), so the cues work offline.
- The renderer is reproducible (`tools/sound/README.md`); a score change is a script change, then a re-render, a
  recalibration of `CUE_TRIM` and a new timeline file.
- Levels: each recorded cue meets the loudness target of its event in `score.ts` (within 1.5 LU) through `CUE_TRIM`;
  the sound level guard measures the decoded files in the offline render. A 4th-difference click scan cannot tell a
  piano hammer from a click, so for recordings only the first sample (a 2 ms fade-in makes it silent) and the last 50 ms are checked.
- The synthesized cue definitions stay: they are the fallback and the calibration of that fallback.
- Risk: a first play before the decode has finished is the old synth cue. Decoding starts while the app is idle and
  again on the first tap, so this should only be the first seconds of a session.
- Credits: instrument samples are VSCO 2 CE (Versilian Studios, Sam Gossner), CC0 1.0. No attribution is required;
  it is recorded here and in `tools/sound/README.md`.
