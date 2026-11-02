# 0018: Adaptive music on a beat grid, with composed themes

- Status: accepted (Eren asked for a revolution of the music system, 2026-11-02 23:40)
- Date: 2026-11-02
- Builds on: [0005](0005-lesson-sound.md) (lesson sound), PR #91 (lesson form, `form.ts`)

## Context: what is wrong with the music today

A ruthless review of `src/sound/music.ts`, `form.ts` and the scheduler in `player.ts`:

1. **It stutters, by construction.** Every step change calls `stopMusic(0.5)`: everything ringing fades, the scheduler
   restarts at `now + 0.05`, off any beat. A learner taps İleri every 5 to 15 s, so the music is re-attacked from its
   first beat a few times a minute. The pulse never survives a step.
2. **Only the start of a section is ever heard.** Sections are 7.2 s blocks. Steps are often shorter, so the answer
   phrase, the walking bass and the second half of every section are cut away; the same downbeat gesture repeats.
3. **Rewards and the lesson end cut the music** (`stopMusic(0.25)`), then it restarts cold. The most important
   moments are the ones where the music disappears.
4. **No beat grid.** A late tick (main-thread jank on an iPhone) resets `nextAt` to `now + 0.05`, so a busy frame is
   heard as a hiccup.
5. **Melody is chord-tone noodling.** 16 possible motifs, chord tones only, no passing tones, no antecedent and
   consequent, no cadence on a long note. It does not sing.
6. **Harmony is eight diatonic chords in one key, forever.** No secondary dominants, no colour at the moments that
   deserve it.
7. **Adaptive in name only.** Energy follows the step number, not the learner: a first-try streak and a wrong answer
   sound the same.
8. **Mix.** One mono-ish bus under a 1500 Hz low-pass: dull and narrow next to the sounds.

Alternatives weighed: **no music** (cleanest, and the audio session already lets a learner's own music play) loses
what Eren calls one of the app's best sides. **Recorded tracks** sound produced but are heavy, cannot follow the
lesson's chords, and so would clash with every sound. **Pure generative** (today) is light and harmonically locked,
but aimless. Chosen: what adaptive game scores do. **Composed material, played by an adaptive engine on a beat
grid**: hand-written themes and rules for how they move, re-sequenced live, still synthesised, so they stay locked to
the harmony the sounds use.

## Decision

### A. Engine (round 1)

- **Transport.** One continuous beat grid: `BEAT = 60 / 72` s, bars of 4 beats. The grid never restarts while music
  plays. If the scheduler is late, it skips to the next grid point; it never re-anchors at `now`.
- **Bars, not sections.** The scheduler writes one bar at a time with about 2.4 s lookahead. Notes of one bar go to
  per-beat buses, and its pad to a pad bus, so a change can drop what has not started yet.
- **Quantised changes.** A step change asks for a new cue. It takes effect at the next beat on the grid (at most one
  beat, 0.83 s, later). Buses that start at or after that beat are dropped unheard. Buses that are ringing are
  released from that beat with tau 0.3, so the old chord crossfades into the new pad (rise 0.3). A new phrase starts
  on that beat. Music state (motif position, last note, voicing) carries over: the piece continues, it does not
  restart.
- **Key moments, the music answers.** The step after a correct answer opens with a flourish on its first beat:
  - first-try correct: `rise`, an ascending arpeggio of the new chord, 6 sixteenths over an octave, landing on a held
    chord tone;
  - streak (3 or more): `peak`, 9 sixteenths over two octaves, plus a halo swell;
  - arrival of a new act: `cascade`, 5 notes falling onto the root.
  Flourishes play on the music bus (`shine` kind). They come after the answer sound, not under it, so they are never
  ducked away and never clash with its suspended 4th.
- **Adaptive energy.** Energy = plan energy + learner state: +0.08 per first-try answer in the current streak
  (capped at +0.2), -0.15 on the step after a wrong answer, plus the existing breathing on long waits.
- **Rewards and the lesson end.** The music no longer cuts. It fades with tau 0.8 under the cadence and pauses
  scheduling until the cadence has nearly rung out. It then comes back on I with a soft pad, on the same grid phase,
  with its state kept.
- Ducking stays as tuned in `synth.ts` (the sound-levels guard depends on it).

### B. Composition (round 2)

- **Melody rules.** Strong beats (1 and 3) take chord tones. Weak beats may take a diatonic passing or neighbour tone
  (D♭ major) that resolves by step to a chord tone on the next note; such a tone lasts at most half a beat.
  Phrases are two bars: an antecedent ends open (on the 3rd or 5th), the consequent ends on the root with a long note.
- **Themes, one per unit** (contours are in scale steps of D♭ major from the anchor; rhythms in beats inside a
  two-bar phrase; `~` is a held note):

  | Unit | Character | Rhythm (beats) | Contour (scale steps) |
  | --- | --- | --- | --- |
  | Home (outside lessons) | wide, slow | 0~, 2, 3, 4~, 6~ | 0, +2, +1, -1, 0 |
  | M Matrisler | calm, even, curious | 0, 1, 2, 3, 4.5, 5, 6~ | 0, +1, +2, +1, +3, +2, 0 |
  | R Satır işlemleri | rows sliding, syncopated | 0.5, 1, 1.5, 2.5~, 4, 5.5, 6~ | 0, -1, 0, +2, +4, +3, +2 |
  | D Determinant | the number that decides, a rising 5th | 0~, 1.5, 2, 4, 4.5, 5, 6~ | 0, +4, +3, +2, +1, +2, -1 |
  | S Sistemler | two lines meet, call and answer | 0, 0.5, 1, 3~, 4, 4.5, 5, 7 | 0, +1, +2, -1, +2, +3, +4, +1 |

  Variations by phrase number: statement; sequence (same contour from the next chord's anchor); inversion;
  augmentation at tension (every other note, doubled lengths); diminution near the peak (passing eighths filled in);
  fragment (first three notes, then a held chord tone). An arrival's consequent always ends on the root.
- **Harmony.** Add `III` (V/vi: root 4, major, with 7th) and `VI` (V/ii: root 9, major, with 7th). `form.ts` uses
  `III` instead of `V` to close an act that opens on vi (a deceptive approach heard as colour), and sometimes puts
  `VI` before `ii` on travel steps. The sounds take the planned chord as before, so they follow.
- **Home piece.** Outside lessons the home loop becomes I–vi–IV–V / I–iii–IV–ii–V, two bars a chord, with the home
  theme. No new key.

### C. Mix (round 2)

- The pad spreads its voices left and right (±0.35); flourishes alternate (±0.25); bass stays in the centre.
- Music low-pass goes from 1500 to 2200 Hz. Idle and lesson-peak loudness are re-calibrated so that the
  sound-levels guard (`e2e/sound-levels.spec.ts`) holds: every sound at least 3 LU over the ducked music at its
  loudest, flourishes included in `measureLessonMusic`.

## Consequences and guards

- Unit test with a fake clock and a fake synth: 3 minutes of step changes at random 2 to 12 s intervals, answers and
  a lesson end. Every music bus starts on the grid (within 1 ms). The pad never leaves a gap over 0.3 s outside a
  cadence. A change lands within one beat of its request. No two consecutive bars repeat the same melody. Melody
  rules hold: strong beats are chord tones, and every non-chord tone is diatonic, short, and resolved by step.
- `e2e/sound-levels.spec.ts` still passes, with the flourishes in the measured lesson music.
- Risks: a weak-beat passing tone can meet a tap's chord tone a semitone away. It is short, about 15 dB under the
  tap and ducked further by it, and the agreement test keeps sounds on chord tones. Phone timing is checked by ear on
  the iPhone.
