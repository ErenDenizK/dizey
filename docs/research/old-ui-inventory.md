# Old app (v21) code inventory, region by region

- Started: 2026-10-31, for decision 0006 (the old UI system is the base).
- Asked by: Eren, 11:28Z: "compare completely, analyse all the code, make sure every design is flawless, understand
  the old code fully with everything and port it that way, without loss of meaning".
- Source: `Dizey/live/Dizey-canli-v21.html` from project file `Dizey.zip`, split into its script (14,516 lines) and
  its stylesheet (3,136 lines), read as data. Line numbers below are in the extracted script (`old.js`) and the
  pretty-printed stylesheet (`old.css`); neither file is committed.
- Rule: every row says what the old app does (values, states, timings, sounds, edge cases), what the current app
  does, and a status. A component counts as ported only when all its rows read **same** and a side-by-side frame
  comparison at 390 px, light and dark, matches.

Status words: **same** (ported, verified), **differs** (both exist, behaviour or values differ), **missing** (not in
the current app), **dropped** (deliberately not ported; reason given), **n/a** (old-only infrastructure replaced by
ours).

## Summary (2026-10-31)

About 1,000 rows over 10 regions: 106 same, 321 differs, 532 missing, the rest dropped or n/a. Read every line of
regions 2-10 (six parallel readers, one per region, briefed in the same format) and region 1 directly.

What the numbers mean for the port: the old app's look (tokens, type) is in; its *behaviour* is mostly not. The
largest gaps, in plan order:

1. **Motion values and pacing** (1, 6b): the old spring table under its own names, tempo classes (quick 1, repeat
   1.1, teach 1.6), reading floors (1000 ms + 200 ms per new word, 400 ms per landed value), cue gates, the entrance
   floor, and the reveal budget (14.9 s). The current player shows a new frame every 900 ms.
2. **The work line** (5, 6a, 6b): one laid-out line per calculation that numbers fly into from their cells (filled
   role-coloured chips on a curved `carry`/`carryY` path, capped at 900 px/s, value appears the same frame the chip
   lands), shared left edge, folding into labelled chips after 5 lines, equation chains with a shared "=" column.
   Nothing on a live stage snaps: every refit glides, and space is reserved before the first frame.
3. **Lesson chrome and the answer card** (7): top bar order close, back, bar, count; the answer card with the duo
   and `reserveDock` (the dock grows by binary search, small phones get `is-tight` cells).
4. **Sound timing** (2): the synth is already ported; *when* sounds fire is not (select on highlight, land on chip
   arrival, correct/wrong 140 ms later with the duo, streak in addition to correct at exactly 3). Ambient music bed
   and its "Müzik" switch are missing.
5. **Mascot, seals, lesson end** (3, 8): faces are computed from spring values, not a fixed image; must be
   rebuilt as code.
6. **Shell and storage** (9, 10): old home is one fixed screen with bracketed title switch, unit tabs with a
   sliding pill, segment strip, morph-open lessons. Old ledger had safeguards the current storage lacks (see below).

Old bugs that must not be copied are listed as their own rows in each section.

### Found while inventorying: current-app risk

Current storage (`src/lib/storage/app-storage.ts`) calls `localStorage.setItem` unguarded (throws when storage is
full or blocked, e.g. some private modes), lesson records carry no version, and two open tabs overwrite each other.
The old ledger had guards, a corrupt-data backup key, step migrations and merge-before-save. This is a gap against
`CLAUDE.md` rule 5 regardless of the UI port; fix it as its own PR.

### Decisions for Eren: items 7-10 in `docs/design/old-ui-conflicts.md`

## Map of the old script

| Lines | Region | Section here |
| --- | --- | --- |
| 1-5783 | Units and lesson data (`UNITS`, `LESSONS`) | content, not ported (ours is kept) |
| 5784-6560 | Sound: performer, voices, ambient, loudness | 2 |
| 6577-7103 | Mascot duo, seals, sheet mascot reactions | 3 |
| 7104-7409 | "Gizli an" bonus moment | 4 |
| 7410-7466 | Press feel | 1 |
| 7467-8060 | Launch, greeting, map list shape, nav, notices, profile | 9 |
| 8061-8351 | Flags, timing, ledger (storage) and migrations | 10 |
| 8352-8660 | Lesson end: narration, flyers, ceremony, answer matrix | 8 |
| 8740-9258 | Motion engine: springs, clock, tempo, channels | 1 |
| 9259-9516 | Helpers, storage, haptics, glyphs, particles, mascot svg | 1, 3 |
| 9517-10190 | Scene: matrices, cells, marks, labels, fit, swap | 5 |
| 10191-11060 | Work line, tokens, chips, flights, ink check, cue gates | 6 |
| 11061-12900 | Reading floors, runners, transport, beat compiler, recipes | 6 |
| 12896-13470 | Narration, dock, options, progress, feedback sheet | 7 |
| 13470-13865 | Answers, keypad, lesson end screen, step navigation | 7, 8 |
| 13866-14516 | Lesson open morph, map, tabs, tiles, press, rubber band | 9 |

## 1. Motion engine (old 8740-9258, 7410-7466)

The architecture is the same as ours: one virtual clock for cues, springs and tickers, channels (`chrome`, `beat`,
`reveal`), a tap that finishes a running channel, and a test hook that steps time. The current engine
(`src/engine`) was modelled on it, so most rows are about values.

### 1.1 Spring presets

The old engine is written as stiffness `k` (mass 1) and damping ratio `zeta`. Ours is written as perceptual duration
and bounce, with `w0 = 2π / duration` and `zeta = 1 - bounce` (`src/engine/spring.ts`). The two are exactly
equivalent: `duration = 2π / √k`, `bounce = 1 - zeta`. Ported in 0.13.0: `src/engine/tokens.ts` holds the table under the old names; the current names (`tap`, `release`, `snap`, `glide`, `settle`) are bound to the old preset doing the same job.

| Old preset | k | zeta | = duration (s) | = bounce | Current nearest | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `press` | 3800 | 1 | 0.102 | 0.00 | `tap` 0.14 / 0 | same |
| `ui` | 1400 | 0.9 | 0.168 | 0.10 | `snap` 0.32 / 0.16 | same |
| `move` | 700 | 0.9 | 0.237 | 0.10 | `glide` 0.42 / 0 | same |
| `page` | 300 | 0.9 | 0.363 | 0.10 | `page` 0.5 / 0 | same |
| `teach` | 170 | 0.8 | 0.482 | 0.20 | `teach` 0.72 / 0.08 | same |
| `teachY` | 260 | 0.86 | 0.390 | 0.14 | none | same |
| `land` | 400 | 0.6 | 0.314 | 0.40 | `settle` 0.55 / 0.32 | same |
| `fade` | 1600 | 1 | 0.157 | 0.00 | `fade` 0.22 / 0 | same |
| `shake` | 1300 | 0.2 | 0.174 | 0.80 | none | same |
| `draw` | 200 | 1 | 0.444 | 0.00 | none | same |
| `leave` | 2600 | 1 | 0.123 | 0.00 | none | same |
| `enter` | 500 | 1 | 0.281 | 0.00 | none | same |
| `carry` | 110 | 0.9 | 0.599 | 0.10 | none (chips use `teach`) | same |
| `carryY` | 160 | 0.95 | 0.497 | 0.05 | none | same |
| `carrySide` | 300 | 1 | 0.363 | 0.00 | none | same |

The old app's teaching motion is never played at the raw table time; see 1.2.

### 1.2 Tempo

| Old | Value and meaning | Current | Status |
| --- | --- | --- | --- |
| `TEACH_PACE` | 1.6: every teaching motion takes 1.6 × its spring-table time (Eren 2026-10-26: "slower teaching tempo"). Chrome motion never uses it | `TEACH_PACE` 1.6 on the lesson channel (0.13.0) | same |
| `CUE_TEMPO` | 1.5: cue-timed beats (entry beat, answer reveal) also scale their cue times, so each line is readable about 1.2 s | `FRAME_MS` = teach duration × 1.25 per frame | differs |
| Tempo classes (values in `TEMPO_CLASSES` since 0.13.0; inference comes with the runner) | `quick` {pace 1, cue 1}: marks, signs, labels, layout, nothing travels. `repeat` {pace 1.1, cue 1.65}: a move this lesson already showed. `teach` {pace 1.6, cue 2.4}: the new idea the first time. Class is inferred from the beat (`tempoClass`, old 12829), never set per lesson | one tempo for all beats | missing |
| Tempo maths | Tempo `t` scales stiffness by 1/t² and pushes (initial velocities) by 1/t; damping ratio stays | same (duration × tempo) | same |
| `chromeDelay` | A wait scheduled on a teaching channel that belongs to the chrome timeline undoes the channel tempo | none | missing |
| `whenIdle(name, fn)` | Runs `fn` once a channel has no cues, motion or runner left (polls every 50 ms) | none | missing |

### 1.3 Spring rules

| Rule (old) | Current | Status |
| --- | --- | --- |
| Reduced motion: only opacity animates; every other property lands at once | same (`effect` props still animate) | same |
| Effects (opacity and custom channels) never overshoot: an underdamped preset is replaced by `fade` for them | same (0.13.0) | same |
| Entrance floor: an opacity spring from ≤ 0.1 to ≥ 0.9 is never quicker than `enter` (0.281 s), "nothing pops in" | same (0.13.0, `ENTRANCE`) | same |
| A new target starts from the live value and velocity (interruptible) | same | same |
| `velocity` option: a push in units/s (shake, hop start at rest with a push), divided by tempo | `velocity` exists | check in step 2 |
| `kScale` option: a long carry softens its stiffness to stay under the eye's pursuit limit (~1000 px/s) | none | missing |
| Arrival: `onArrive` fires when every prop is within `epsilon` (x, y: default 1.5 px) or 0.02 (others) | `onArrive` with per-call epsilon | differs (default) |
| Settled: within 0.05 px and 2 px/s (pixel props) or 0.0005 and 0.005 (others) | closed form, epsilon-based | n/a |
| `isMoving(channel)`: motion visible means more than 1 px, 1 % scale or 8 % opacity from target ("text at 92 % reads as written") | `isMoving` exists | check thresholds |
| Integration: semi-implicit Euler at 240 Hz substeps | closed-form solution | n/a (ours is exact) |
| Transform output: `translate3d(x, y, 0) rotate() scale(sx, sy)`; opacity cleared at 1 | same pattern | same |
| Ink channel: an element under a passing chip dims with `filter: opacity()` so it never fights its own opacity | none | missing |
| `finishAll` keeps a press in progress (the İleri that lands the beat still visibly springs) | not kept | missing |
| `FINISH_GUARD` 5000 cues (a long Sarrus reveal is about 600 cues) | guard exists | check |
| Frame loop: `requestAnimationFrame`, step capped at 64 ms | same (`MAX_FRAME_MS` 64) | same |
| QA stepping at 120 Hz frames | review hook (`window.__dz.review`) | same idea |

### 1.4 Choreography constants

| Old `CHOREO` (ms) | Value | Used for | Current | Status |
| --- | --- | --- | --- | --- |
| `stagger` | 35 | list items entering | `CHOREO.stagger` 30 ms, max 6 items | differs |
| `beatDelay` | 420 | step entered → beat starts | none | missing |
| `openDelay` | 180 | lesson open | none | missing |
| `revealDelay` | 160 | answer → reveal | none | missing |
| `correctDelay` | 220 | correct → next action | none | missing |
| `sheetDelay` | 380 | answer → feedback sheet | none (no sheet) | missing |
| `mascotDelay` | 140 | sheet → mascot reaction | none | missing |
| `waveSpeed` / `waveMax` | 1.4 px/ms / 240 ms | ripple across tiles and progress segments | none | missing |
| `cellStagger` | 80 | matrix cells entering one after another | none | missing |
| `glideHead` | 90 | head start of a glide-clear | none | missing |
| `tilesHead` | 70 | map tiles entering | none | missing |
| `mapFadeDelay` | 120 | returning to the map | none | missing |
| `leaveHead` | 120 | leaving lines start before entering ones | none | missing |
| `markHold` | 360 | a mark stays before the next | none | missing |
| `endMarksDelay` | 600 | lesson end answer marks | none | missing |
| `noticeHold` | 1800 | notice toast | none | missing |
| `prepHold` | 1000 | lesson preparation hold | none | missing |
| `fontWait` | 500 | wait for webfonts before first fit | none | missing |
| `idlePoll` | 50 | `whenIdle` polling | none | missing |

| Old `SHIFT` (px, entrance travel) | Value | Current | Status |
| --- | --- | --- | --- |
| `enter` | 12 | `SHIFT.enter` / `CHOREO.rise` 12 | same |
| `narr` | 14 | none | missing |
| `scene` | 10 | none | missing |
| `dock` | 16 | none | missing |
| `tiles` | 36 | none | missing |
| `count` | 6 | none | missing |

| Other | Old | Current | Status |
| --- | --- | --- | --- |
| `ENTER_FLOOR` | Narration and dock enter from opacity 0.35, so a step change never shows an empty frame | none | missing |
| `PRESS_SCALE` | 0.96 for every pressable: buttons, tabs, tiles, stage card ("a softer press is missed"); half the depth drawn on touch, minimum depth on release, release on `ui` | same (0.13.0, `pressIn`/`pressOut`); stage-card press comes with step 3 | same |
| `LOCKED_SHAKE` | A locked tile shakes about 5 px (push 180 px/s on `shake`) | no locks | dropped (no locks, decision 0003) |
| `DRAW_READ` | A drawn word reads from half ink: `1678 / √k(draw)` ms ≈ 119 ms | none | missing |
| Particles | gravity 0.0022 px/ms², drag 0.9985 per ms, spin 0.7 | none | missing |

## 2. Sound (old 5732-6560, cue call sites, haptics 9371-9383)

The old sound system is a self-contained module, `SatirSound` (old.js:5732-6483), plus a thin adapter in the feel
layer (`feelSound`, old.js:6485-6556) that maps cue names to synth events. The current `src/sound` was rebuilt from
the same musical logic (decision 0005), so the synth core is close; the gaps are in the event set, the call sites
(when and why a sound fires), the ambient music bed and the second switch. Current paths below are relative to
`src/`. `LP` = `lesson/LessonPlayer.tsx`.

### 2.1 Pitch, spelling, chords (old 5765-5852)

| Old (what + values + lines) | Current (file:line or "none") | Status |
| --- | --- | --- |
| Key: every pitch is semitones above D♭4, MIDI 61 (`KEY`, old.js:5766) | `sound/harmony.ts:7` `TONIC_MIDI = 61` | same |
| Helpers `mod`, `mtof` (440·2^((m−69)/12)), `dbToGain`, `clamp` (old.js:5771-5774) | `sound/harmony.ts:9-12` | same |
| PRNG mulberry32 (old.js:5776-5781). Old first line `seed \|= 0` runs on every call | `sound/harmony.ts:96-104` (`\|0` once at creation) | same (same output sequence) |
| Spelling: `spell(degree, semis)` by scale degree from D♭; double accidental falls back to the common enharmonic (♭VI written A); `toneName` (old.js:5768-5792) | none | dropped (labels were only for the lab / visual twins; the app never read them) |
| `CHORDS` I, IV, iii, vi, ii, V, iv, bVII: root, bass, rootless 4-voice voicing `n`, arpeggio `arp` (old.js:5799-5810) | `sound/harmony.ts:27-36`, same eight with identical numbers | same |
| `CHORDS.bVI` (maj7♯11, root 8, bass −16, n [3,7,12,14], arp [0,4,7,11,18]) and `CHORDS.Is11` (I♯11 "lidyen tonik", n [4,7,11,18], arp [0,4,7,11,18]) (old.js:5808-5809): used only by the `secret` event | none | missing (with `secret`) |
| Chord metadata per chord: `q` quality ('maj9', 'm11', '13'...), `roman`, Turkish function `fn` ('tonik', 'subdominant', 'tonik rengi', 'dominant', 'minör subdominant', 'arka kapı dominantı', 'ödünç renk', 'lidyen tonik'), `chordName`, `susName` ('…sus4', '(add11)') (old.js:5799-5836) | none (plan `chords` are ids, `I:sus`) | dropped (lab/twin labels, never shown in the app UI) |
| `PROGRESSION` I–IV–iii–vi–ii–V; `chordAt(step, steps)` = PROGRESSION[clamp(floor(step·6/steps),0,5)], 'I' when step null or steps 0 (old.js:5813-5815) | `sound/harmony.ts:42-48` (`undefined` instead of `null`) | same |
| `susOf`: 3rd → 4th, maj7 (iv 11) → root, a voice already on the 4th → null when a 3rd exists (old.js:5821-5830) | `sound/harmony.ts:60-69` `suspend` | same |
| `nearest`: least-movement inversion; constraints lowest ≥ 2, top ≤ 19, top two > 1 apart, no minor 9th (13) between any pair (old.js:5838-5847) | `sound/harmony.ts:72-93` | same |
| Quirk: old cost uses `prev[i]` directly; after a `hold` part that dropped a voice, `prev` is shorter, cost is NaN for every option and the root voicing wins (old.js:5845). Only `seal` (V sus hold → I) hits it, and `seal` is never fired | `harmony.ts:89` uses `previous[i] ?? x` | differs (moot: no current event hits it) |

### 2.2 Event table (old 5849-5872)

Old `ITEM` defaults: part 'all', vel 0.44, roll 0.035, bass 0.45, dur 2, bloom 0, halo 0, resolve 0.38
(old.js:5857). Current `DEFAULT_PART` (`sound/score.ts:71-79`) has the same values; `resolve` is a constant
`RESOLVE = 0.38` (`score.ts:80`) instead of a per-part field (no old event overrides it).

| Old event (tier, LUFS target, cut Hz, wet, seq) | Current (`sound/score.ts`) | Status |
| --- | --- | --- |
| `select`: frequent, −45, 4200, 0.8, step chord, part one, pick wander, bass 0, dur 1.3, vel 0.5 (old.js:5859) | `score.ts:88-94` | same |
| `land`: frequent, −43, 3400, 0.8, step, one, pick cell, bass 0.35, felt 0.4, dur 1.7, vel 0.55 (old.js:5860) | `score.ts:95-101` (`thump`) | same |
| `merge`: frequent, −41, 3800, 0.9, step, guide tones, bass 0, roll 0.06, dur 2, vel 0.48 (old.js:5861) | `score.ts:102-108` | same |
| `wrong`: question, −37, 2100, 1, step, sus hold, roll 0.045, bass 0.4, dur 2.2, bloom 0.2, vel 0.42 (old.js:5862) | `score.ts:109-115` | same |
| `correct`: question, −32, 4600, 1, step, sus resolve, dur 3, bloom 0.5, vel 0.46 (old.js:5863) | `score.ts:116-122` | same |
| `streak`: question, −31, 5200, 1.1, step, sus resolve, dur 3.2, bloom 0.5, vel 0.46, arp {count 3, from 2, at 0.62} (old.js:5864) | `score.ts:123-138` | same |
| `lessonEnd`: lesson, −28, 5000, 1.1, gap 0.9, ii (1.6) → V (1.6) → I (4.2, bloom 0.8) (old.js:5865) | `score.ts:139-150` | same |
| `seal`: reward, −28, 5600, 1.2, V sus hold (1.8, bloom 0.3, arp 4) → I (4.4, bloom 0.8, halo 0.4) (old.js:5866). No cue maps to it (FEEL_CUE_EVENTS has no 'seal') | none | dropped by the old app itself (dead entry; also dead in old TRIM) |
| `halfway`: reward, −27, 5600, 1.2, iv (2, bloom 0.3, arp 5) → I (4.8, bloom 0.8, halo 0.5) (old.js:5867) | `score.ts:151-160` | same (sound); trigger differs, see 2.9 |
| `milestone`: reward, −26, 6000, 1.3, gap 1, iv (1.8) → bVII (2.2, bloom 0.3, arp 6) → I (5, bloom 1, halo 0.8) (old.js:5868) | `score.ts:161-172` | same |
| `secret`: reward, −27, 6400, 1.3, bVI (2.4, bloom 0.5, arp 5) → I♯11 (4.6, bloom 0.9, halo 0.8) (old.js:5869): the "Gizli an" solved seal | none | missing (needs the Gizli an feature, section 4) |
| `ARP_STEP` 0.14 s, `ARP_RIT` 1.07, `LAND_ORDER` [3,1,2,0] (old.js:5871-5873) | `score.ts:81-85` | same |

### 2.3 Performer: event + context → notes (old 5891-5975)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| Chord choice: `cx.chord` (a CHORDS id) overrides; else `chordAt(cx.step, cx.steps)` (old.js:5896) | `score.ts:241` only `chordAt`; no chord override in `SoundContext` | differs (override unused by old app call sites) |
| Ring scale: higher notes ring shorter, `dur *= clamp(1 − (61+midi−66)·0.012, 0.6, 1.25)` (old.js:5901-5904); felt thump is pushed without it | `score.ts:219, 233-237, 256` | same |
| Bass note when `bass > 0`: midi = chord bass, dur ×1.1, vel·bass, bright 0.05, role bass (old.js:5913) | `score.ts:247-255` | same |
| `pick: 'wander'`: with `cx.index` voice = index mod 3; else random 0/1, +1 if ≥ last, so never the same voice twice; then +1 (top three voices) (old.js:5918-5923) | `score.ts:262-270` | same |
| `pick: 'cell'`: LAND_ORDER[(cx.index ?? state.land++) mod 4] (old.js:5924); counter lives for the app's lifetime | `score.ts:272-273` (`nextCell`, lifetime of the synth) | same |
| Guide tones: voices whose interval is 3, 4, 10, 11, rolled by `roll`, bright 0.28 (old.js:5927-5929) | `score.ts:284-296` | same |
| Full chord, unsuspended voice: bright `hold ? 0.12 : 0.3` for every voice (old.js:5934) | `score.ts:244-245, 309-310`: 0.3 for chord tones (0,3,4,7,10,11), **0.26 for tensions** (9th, 11th, 13th) | differs (timbre; TRIM copied from old was calibrated on 0.3) |
| Resolve: leaning voice rings `resolve + 0.16`, bright 0.3; target enters at `t + 0.38 + i·0.012`, dur − 0.38, vel ×0.85, bright 0.26 (old.js:5935-5937) | `score.ts:312-329` | same |
| Hold: leaning voices bright 0.12, nulls silent; final = non-null suspended voices (old.js:5938, 5945) | `score.ts:330-336` | same |
| Bloom pads on final voicing at `bloomAt` (resolve time when resolving), dur ×1.1, vel·bloom, rise 0.6 (old.js:5946) | `score.ts:340-350` | same |
| Halo: top two final voices +12, at bloomAt + 0.15, dur ×1.1, vel·halo·0.5, rise 0.9 (old.js:5947) | `score.ts:351-361` | same |
| Next chord after `gap` (default 0.9); with an arpeggio, after the last arp note + step·1.4 (old.js:5948, 5958) | `score.ts:363, 388` | same |
| Arpeggio: base = mod(root+3,12)−3 (B♭3..A4); sus turns 3rds into 4ths; starts at `at ?? 0.06`; notes 'shine', vel 0.38, bright 0.5, ring 1.6, last 2.4 (old.js:5949-5957) | `score.ts:364-387` | same |
| `harm`: single-part event = chord id (+':sus' for hold); multi-part = '*' (old.js:5910) | `score.ts:246` | same |
| Return `{t0, end, chords (labels with t, name, roman, fn, tones), notes, harm, event}` (old.js:5962) | `{event, notes, end, harmony, chords: string[]}` (`score.ts:393`) | differs (no labels/times; unused by app) |
| `SatirSound.plan()`: separate performer so a visual twin never shifts what `play()` picks next (old.js:6459-6463) | none (no public plan) | dropped (no app caller in old either) |

### 2.4 Voices and envelopes (old 5967-6043)

| Old (what + values + lines) | Current (`sound/synth.ts`) | Status |
| --- | --- | --- |
| `strike`: linear attack, decay to `hold` over `knee`, then straight dB line to −80; 128-point curve, last 0; `len = max(0.06, dur − atk)`; curve starts at t+atk+0.5 ms (old.js:5968-5979) | `synth.ts:40-63` | same |
| `bloom`: exp approach (τ = rise/3), hold, fade −80·u^1.6; 160 points, both ends 0 (old.js:5981-5989) | `synth.ts:66-78` `swell` | same |
| epiano (Rhodes): strike atk 8 ms, hold 0.5, knee 0.3; 1:1 FM, index f·(0.3+1.1·bright) falling to ×0.08 over min(dur, 0.9); 14:1 tine for midi < 84 and bright > 0.1, depth f·0.2·bright → f·0.002 in 70 ms, tine stops at +0.1 s (old.js:5993-6008) | `synth.ts:299-318` | same |
| `felt` voice (stretched partials 1..6, 12 ms hammer, second string +1.6 c) (old.js:6011-6024) | none | dropped (palette never selected by the app; lab only) |
| glass voice: partials [1,0.7,1,0], [1,0.3,1,+5 c], [2,0.06,0.5,0], [4,0.05+0.06·bright,0.2,0]; skip > 12 kHz; atk 6 ms, hold 0.55, knee 0.25, min len 0.15 (old.js:6026-6035); used for every 'shine' (arpeggio) note | `synth.ts:282-298` | same |
| pad: two oscillators ±7 c (triangle; halo sine), `bloom` envelope (old.js:6037-6041); render gives vel·palette.pad·0.3 (old.js:6176-6177) | `synth.ts:276-281` (vel·0.3; Rhodes pad = 1) | same |
| Felt contact: 50 ms noise buffer, band-pass 900 Hz Q 0.9, 1.5 ms attack, exp to 1e-4 by 30 ms, 0 at 31 ms, stop at 45 ms (old.js:6158-6170) | `synth.ts:250-265` | same |
| Humanise: detune ±4 c, vel ±6 %, main non-bass notes up to 4 ms late, pan = clamp((61+midi−66)/34, ±0.3) (old.js:6172-6173) | `synth.ts:267-272` (bass detected as bright ≤ 0.05) | same |
| Stop time = t + dur + 0.05 (old.js:6174) | `synth.ts:273` | same |
| StereoPanner fallback: connect straight to fade when `createStereoPanner` is missing (old.js:6129-6131) | `synth.ts:241-247` always creates a panner | differs (all target Safari versions have it) |

### 2.5 Room, bus, limiter, overlap rules (old 6044-6214)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| Resources cached per context: noise 50 ms (seed 12345); IR 3.2 s stereo, 20 ms pre-delay, RT60 2.3 s, one-pole darkening 0.3→0.92 over 1.6 s, last 100 ms faded, five early reflections (9/17/26/37/51 ms, ±, ×0.6, right channel ×1.07 later and inverted), seeds 987+ch·7919 (old.js:6044-6068) | `synth.ts:81-123` | same |
| Signal chain: per-event bus fade → low-pass (cut·palette.cut, Q 0.5) → level (TRIM dB) → dry; level → send (palette.wet·event.wet) → high-pass 250 Hz → convolver (normalize) → sum → master (+6 dB) → compressor (−6 dB, knee 0, ratio 20, attack 2 ms, release 200 ms) → un-makeup gain ((TH−TH/R)·0.6 dB) → mute → destination (old.js:6084-6119) | `synth.ts:149-175, 209-219` (Rhodes wet 0.3, cut ×1) | same, except no `mute` node (see 2.7) |
| `MASTER_DB = 6`: Eren found effects too quiet (2026-10-30); before the limiter; `calibrate()` renders with master 0 (old.js:6078) | `synth.ts:26`, `measure.ts` calibrate uses masterDb 0 | same |
| `TRIM` per palette, generated by `calibrate()` (old.js:5884-5888); Rhodes row: select −30.4, land −30.7, merge −30.1, wrong −28.8, correct −24.2, streak −23.3, lessonEnd −21.7, seal −20.9, halfway −20, milestone −19.2, secret −20.8 | `synth.ts:13-23`: Rhodes values copied, no seal/secret | differs (copied, not re-calibrated after the bright change in 2.3; secret missing) |
| Fallback bus level −20 dB for an event missing from TRIM (old.js:6204) | none (TRIM is total over `SoundEvent`) | n/a |
| Palettes rhodes / felt ('Keçe piyano') / glass ('Cam'), `setPalette` persisted under `satir-sound.palette` (old.js:5876-5880, 6470) | Rhodes only | dropped (app never called setPalette) |
| Cleanup: the source with the latest stop gets `onended` → disconnect every node (try/catch), drop from `live` (old.js:6134, 6136-6141) | `synth.ts:179-185, 330` (no try/catch) | same |
| `release(bus, at, τ)`: cancel fades, setTarget 0 with τ, stop sources at min(stop, at + 8τ) (old.js:6142-6148) | `synth.ts:187-199` | same |
| Pedal: a new event whose harm differs, or any multi-chord event, releases all live buses with τ 0.25 s (old.js:6077, 6194) | `synth.ts:30, 340-341` | same |
| Half-pedal duck: a new frequent event multiplies each ringing, unreleased frequent bus by −9 dB (cumulative), τ 20 ms, 20 ms before contact (old.js:6082-6084, 6195-6202) | `synth.ts:35-37, 342-350` | same |
| `MAX_LIVE = 6`: oldest ringing buses released (τ 0.15) so at most 6 remain (old.js:6074, 6203-6204) | `synth.ts:28, 351-352` | same |
| Start time `max(want, now + 5 ms)`, default want = now + 10 ms (old.js:6189-6190) | `synth.ts:336-337` | same |
| `atMs`: page-clock → context time via `getOutputTimestamp`, else currentTime − `lead` (output + base latency) (old.js:6181-6188) | none | dropped (no old call site passed `atMs`; app cues used now + 10 ms) |
| Engine `stopAll`: release all, τ 30 ms (old.js:6209) | `synth.ts:357-360` | same |
| Engine `setMuted`: mute gain setTarget 0/1, τ 20 ms (old.js:6210) | none; player stops and suspends instead | differs |
| `ringing` count exposed as `live` array (old.js:6212) | `synth.ts:366-368` `ringing` getter | same |

### 2.6 Ambient music bed, "Müzik" (old 6216-6297)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| Optional quiet pad, default off, the app's second switch (old.js:6216-6220) | none | missing |
| `AMBIENT`: bus −48 dB (≈ −44 LUFS momentary, ~5 LU under `select` at −39 with master; peak ≈ −36 dBFS), chord every 8 s, each 13 s long, swell 3.2 s, low-pass 900 Hz Q 0.4, wet 0.5 (old.js:6221-6226) | none | missing |
| Loop chords (semitones from D♭4): [−12,−5,4,7,14], [−15,−3,0,4,7], [−19,−7,0,4,11], [−17,−5,−3,2,7], described as I, vi, IV, V-sus (old.js:6225) | none | missing |
| Note: three sines (−5 c, +5 c at weight 1; octave at weight 0.18), all ×0.5, ±2 c random detune; `bloom` envelope rise 3.2, len 13; stop at len + 50 ms; nodes disconnected on end (old.js:6239-6250) | none | missing |
| Chord roll: voices 0.25 s apart, voices below −10 at vel 0.8 (old.js:6252-6254) | none | missing |
| Own bus beside the effects: no limiter, no duck, no master boost; own high-pass 200 Hz → own convolver (old.js:6230-6237) | none | missing |
| Scheduler: `setInterval(pump, 1000)` keeps 6 s scheduled ahead; start fades bus in (τ 1.2 s) from 0; stop fades τ 0.4 s (0.15 s from `quiet`), drops the bus, disconnects after 8τ; a new start begins a fresh loop at chord 0 (old.js:6262-6285) | none | missing |
| Plays only when wanted AND not muted AND context running AND page visible (`syncAmbient`, old.js:6403-6407); resynced on statechange running, on visibilitychange, on setMuted, on setAmbient | none | missing |
| Idle park is skipped while the bed is on (old.js:6386) | n/a | missing |
| `measureAmbient()` offline (old.js:6333-6345) | none | missing |

### 2.7 App instance: unlock, idle, park, hold (old 6361-6483)

| Old (what + values + lines) | Current (`sound/player.ts`) | Status |
| --- | --- | --- |
| Context created inside the first tap (`init`, from a `pointerup` once listener, old.js:6519, 6523-6526); does nothing while muted | `unlock` on every touchend/pointerup/click/keydown, capture, passive (`player.ts:35-57, 67-71`) | same |
| `navigator.audioSession.type = 'ambient'` (mix with other audio, obey silent switch), try/catch (old.js:6431) | `player.ts:40-45` | same |
| `new AudioContext({latencyHint: 'interactive'})`, falls back to `webkitAudioContext` (old.js:6428, 6432) | `player.ts:38-50`, unprefixed only | differs (minor; iOS 14.5+ unprefixed) |
| Silent 1-sample buffer played inside the gesture: oldest iOS unlock (old.js:6434-6438) | none | missing (low risk on current iOS) |
| `wake()` from any tap: resume unless muted, running or hidden (old.js:6388-6391) | `unlock` resumes when not running and not hidden (`player.ts:36, 56`) | same |
| iOS 'interrupted' state (call, Siri): `statechange` tries `wake()` at once (old.js:6412-6414) | waits for the next tap | differs |
| `IDLE_MS = 30000`: park (suspend) when nothing rings and the bed is off; re-armed on every play and on statechange running (old.js:6371, 6384-6387, 6413, 6455) | `player.ts:13, 26-32, 52-54, 81` (no bed condition) | same |
| Hidden page / mute → `quiet`: clear held calls, stop bed (τ 0.15), stopAll, park after `PARK_MS = 300` **only if still hidden/muted** (old.js:6372, 6393-6399, 6418) | `player.ts:59-64, 72-74`: stopAll, clear idle, suspend after 300 ms unconditionally | differs (current suspends even if the page came back within 300 ms) |
| Play while parked: hold the call with its page time; keep the newest `HOLD_MAX = 4`; `flush` on statechange running plays each at its own time if ≤ `STALE_MS = 250` late, else drops it (old.js:6373-6374, 6408, 6413, 6447-6455) | `player.ts:85-92`: each call triggers its own `resume().then(play now)` if ≤ 250 ms since asked; no cap, no original timing | differs |
| Play before the first tap / while muted: returns null, nothing queued (old.js:6447) | `player.ts:79` | same |
| Mute persisted in `localStorage['satir-sound'] = {muted, palette}` with in-memory fallback for private mode; module default muted (opt-in) (old.js:6370-6381, 6421-6422) but overridden at boot by the ledger setting | single store `dizey.settings.sound` (`progress/settings.ts`) | n/a (one source of truth now; fine) |
| `setMuted(m)`: writes, ramps engine mute, `quiet` when muting; unmuting inits then syncs the bed (old.js:6471-6477) | `setSoundOn` (`player.ts:96-103`): save, then unlock + preview, or `quiet` | same (behaviour) |

### 2.8 Settings: Ses and Müzik switches (old 6528-6556, 7853-7905, old.css 2436-2460, 3018-3075, 3130-3134)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| Ses default **on** (ledger default `settings: {sound: true}`, migration coerces `sound !== false`) (old.js:8154, 8177) | `progress/settings.ts`: absent = on, `sound: false` stored when off | same |
| Settings carry per-key stamps (`settings.<name>` = Date.now()) and merge newest-wins across tabs (old.js:8245-8252, 8264-8267) | no stamps | differs (see section 10) |
| Ses switch: name "Ses", sub "Ders, cevap ve mühür sesleri" (old.js:7891-7892) | `content/strings.ts:57-58` "Ders sesleri", hint "Telefon sessizdeyken çalmaz." (`shell/MeView.tsx:173-183`) | differs (copy) |
| Turning Ses on plays a preview: `teach.land` cue, inside the tap gesture, after unlocking (old.js:6533-6541) | `player.ts:99-101` `playSound('land')` | same |
| Turning Ses off also stops the bed; Müzik's stored value is kept and returns with Ses (old.js:6544-6547, 7853-7854) | n/a (no Müzik) | missing |
| Müzik switch: name "Müzik", sub "Çok hafif fon müziği", default off (old.js:7894-7896) | none | missing |
| Müzik follows Ses: with Ses off it shows off, `disabled`, `.is-disabled` (opacity 0.45, cursor default) and ignores taps (old.js:7860-7865, 7905; old.css:2457-2460) | none | missing |
| Turning Müzik on unlocks audio inside the tap (old.js:6550-6555) | none | missing |
| Switch rows: `role="switch"` buttons, `aria-checked`, `.is-on`; one card for both rows (radius-lg 16, surface, shadow-raised), rows flat, hairline 1px `--color-soft-strong` between (old.css:2438-2456) | single row in `MeView.tsx:173-183`, native `<input switch>` (`ui/Switch.tsx`) | differs (visuals belong to section 9) |
| Row: flex, gap 12, min-height `--primary-h` 56, padding 0 16; name 17px semibold; sub 14px medium muted (old.css:3022-3050) | `.dz-row` / `.dz-footnote` | differs (section 9) |
| Track 52×28 (`--hit` 48 + 4 × `--switch-h` 28), full radius, `--color-soft-strong`, on `--color-action`; knob inset 4, square, surface, on `--color-on-action`; background fades `--fade-t` 160 ms (old.css:3051-3075) | `ui/Switch.tsx` (travel 20, `snap` + `fade`) | differs (section 9) |
| Knob motion: x = trackW − knobW − 2·knobLeft, `ui` spring when toggled, set without motion on paint (old.js:7866-7868, 8001, 8036) | `ui/Switch.tsx` `snap` spring | differs (section 1 springs) |
| Short phones (max-height 699px): row min-height `--hit` 48, sub-lines hidden (old.css:3130-3134) | none | missing (section 9) |
| Press tint on `.st-me-sound` like other buttons (old.css:2190-2205) | native switch | n/a |

### 2.9 Cue map and call sites: when each sound fires

Old adapter: `FEEL_CUE_EVENTS` (old.js:6494-6498) maps `answer.correct→correct`, `answer.wrong→wrong`,
`seal.mini→streak`, `seal.lesson→lessonEnd`, `seal.row→halfway`, `seal.unit→milestone`, `seal.insight→secret`,
`teach.select→select`, `teach.land→land`, `teach.merge→merge`. `feelSound.cue` passes
`{step: lesson.index, steps: STEPS.length}`; no call site passes `index` (old.js:6509). Every cue fires from the
`onArrive`/`onClosed` of the motion it belongs to, never from its own timer (old.js:6490).

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| `teach.select`: the teaching runner lights a term's source cells (each term's highlight) (old.js:11607-11608) | `select` fires on **every keypad key** (`LP:283-287`); no sound on highlights | differs (different meaning) |
| `teach.land`: every runner chip carry, on arrival (`carry` → onArrive, old.js:10855-10859) | `land` on every beat frame that does not bring a new result, fired at the frame cue, `index = frame number` (`LP:94-100`) | differs (timing: old on motion arrival, current at frame start, see decision 0005; voice: old global zigzag counter, current per-frame index) |
| `teach.merge`: a result written after "=" (`collectInto`, old.js:10966-10968) | `merge` on a frame whose `result` changes (`LP:97-99`) | same (meaning); timing differs as above |
| Keypad keys: no sound (old.js:13529-13546) | `select` per key (`LP:286`) | differs |
| `answer.correct` / `answer.wrong`: fired 140 ms (`CHOREO.mascotDelay`, old.js:8843) after the verdict sheet starts, together with the duo reaction, on the engine clock (old.js:7059-7067) | `cue('correct'/'wrong')` synchronously in `answer()` (`LP:115-127`) | differs (timing: no 140 ms delay, not tied to the mascot) |
| No cue for revisit sheets (`quiet`) or the neutral "Bilmiyorum" sheet (old.js:13248, 7043-7051, 13567-13571) | current has no Bilmiyorum; revisits of a solved step do not call `answer` | same (no sound) |
| One answer per step (`lesson.answered` lock), so at most one `wrong` per step (old.js:13514, 13550) | retries allowed: each wrong try plays `wrong` (`LP:123-126`) | differs |
| Streak: on the 3rd consecutive right answer **exactly** (`streak === FEEL_STREAK.pairAt` 3), `correct` AND `seal.mini`→`streak` fire on the same tick (old.js:7040, 7062-7073); streak counts consecutive right answers, reset by wrong, Bilmiyorum, a new run (old.js:13477, 13520, 13558, 13578) | `run ≥ 3` first-try rights → `streak` **instead of** `correct`, and on every further one (`LP:28, 119-121`) | differs |
| `seal.lesson`→`lessonEnd`: when the end screen's answers matrix closes its brackets (old.js:8573-8575); a lesson with no questions has no answers matrix and **no sound** (old.js:8576-8578) | `rewardFor` → one sound when the learner taps finish, then navigation away (`LP:130-135`, `lesson/reward.ts:10-22`) | differs (no end screen; section 8) |
| Ceremony: after `lessonEnd`, `ceremonyHold` 350 ms (old.js:8067, 8567), the answers fly into the course matrix, which closes → `seal.row`→`halfway` or `seal.unit`→`milestone` (old.js:8496-8499). Unit wins over row (old.js:8382). So a ceremony lesson plays two sounds in sequence | one event only: `milestone` when a unit is complete, else `halfway`, else `lessonEnd` (`reward.ts:15-22`) | differs |
| `seal.row` meaning: every 3rd completed lesson fills one row of the 3-column course matrix (`COURSE_COLS = 3`, `done.length % 3 === 0`, old.js:8093, 8189) | `halfway` = half of all lessons done (`reward.ts:20-21`), fires once | differs (same sound, different trigger) |
| Re-completing a lesson: no new seals are earned, so only `lessonEnd` (old.js:8378-8384) | `reward.ts:15` | same |
| `seal.insight`→`secret`: the Gizli an seal closes (old.js:7277-7280, reduced motion at once 7282-7285), preceded by `answer.correct` on the right pick (old.js:7304) | none | missing (section 4) |
| Sound off: cue returns before calling the synth (old.js:6507); a thrown error is caught and logged by `feelWarn` (old.js:6508-6512) | `playSound` checks `soundOn()` (`player.ts:79`); no try/catch around `synth.play` | differs (a Web Audio exception would reach the lesson code) |
| QA mode (`window.SATIR_QA`): cues logged with clock time into `feelState.cues`, never played (old.js:6502-6505, 6516, 6524) | e2e counts created oscillators (`e2e/sound.spec.ts`) | differs (no cue log for frame-exact checks) |
| Exam rehearsal: n/a in old | no sound (decision 0005) | n/a |

### 2.10 Haptics (old 9371-9383)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| `haptic(pattern)` → `navigator.vibrate`, try/catch; skipped under QA and under reduced motion; calls counted for design QA (old.js:9371-9383, 14496) | none (only the native switch tick on iOS 18+, `ui/Switch.tsx:9`) | missing (no effect on iPhone: Safari has no `vibrate`) |
| Keypad right: `haptic(12)` with the swell and sparks (old.js:13493-13499) | none | missing (Android only) |
| Keypad wrong: `haptic([24, 40, 24])` with the shake (old.js:13502-13505) | none | missing (Android only) |
| End screen shown: `haptic([10, 60, 18])` (old.js:13742) | none | missing (Android only) |
| Locked tile tap: `haptic(8)` with shake and notice "… · Bu ders yakında" (old.js:14358-14363) | none | missing (Android only) |
| Choice answers: no haptic (old.js:13512-13527) | none | same |

### 2.11 Measurement and calibration (old 6288-6368)

| Old (what + values + lines) | Current (`sound/measure.ts`) | Status |
| --- | --- | --- |
| Offline render 48 kHz, 10 s, seed 7, event at 0.05 s; peak; 4th-difference click detector `hfDb` (old.js:6314-6332) | `measure.ts` `measure` (`clickDb`) | same |
| BS.1770 K-weighting (shelf 1681.97 Hz +4 dB Q 0.7072, high-pass 38.13 Hz Q 0.5003), loudest 400 ms window, 10 ms hop; `phone` adds two 400 Hz high-passes (old.js:6300-6313) | `measure.ts` `biquad`, `momentary` | same |
| `len60`: audible length until 50 ms RMS stays 60 dB under the loudest block; `end` = plan length (old.js:6325-6331) | none | missing (diagnostic only) |
| Step-following events measured on every PROGRESSION chord with `index: 1`, power-averaged (old.js:6347-6353) | `measure.ts` `averageLoudness` (via step/steps, `index: 1`) | same |
| `calibrate`: start −20, two passes `g += target − loudness`, rounded 0.1, per palette × event (old.js:6354-6367) | `measure.ts` `calibrate` (Rhodes only) | same |

### Port notes

- **Semantics, not just sounds.** The synth core (harmony, events, voices, room, limiter, pedal, duck) is ported
  almost value for value. What changed is *when* each sound fires: `select` now means a keypad key (old: a teaching
  highlight), `land` fires at the frame cue (old: when the carried chip arrives), `correct`/`wrong` fire at once (old:
  140 ms later with the duo reaction), `streak` replaces `correct` from the 3rd on (old: adds to `correct`, only at
  exactly 3), and `halfway` is "half the course" (old: every 3 lessons, a course-matrix row). Each of these is a
  decision for Eren, not a value fix.
- **The lesson end is two sounds in the old app** when a ceremony follows: `lessonEnd` (ii–V–I, ~6 s) at the answers
  seal, then `halfway`/`milestone` after 350 ms hold + flight + seal close. The reward is multi-chord (harm '*'), so it
  pedal-releases the `lessonEnd` tail with τ 0.25 s; the ceremony probably starts before `lessonEnd` reaches its I
  chord (1.8 s). I could not determine the exact ceremony duration from this region (seal close timing is in section 8);
  verify whether Eren ever heard the full ii–V–I on a ceremony lesson.
- **Lessons without questions play no `lessonEnd`** in the old app (no answers matrix, old.js:8576). Likely an
  accident; decide before porting.
- **Ambient music ("Müzik") is entirely missing**: second switch, its disabled-follows-Ses state, the separate bus
  (no limiter, no master boost), the 6 s look-ahead scheduler, and the visibility/mute/park gating. Old-vs-new notes
  already list it as "later, low priority".
- `secret` (and chords bVI, I♯11) wait for the Gizli an feature. `seal` was dead in the old app; do not port it.
- TRIM was copied, but current full-chord tension voices use bright 0.26 instead of the old 0.3 (`score.ts:244`), so
  `correct`, `streak`, `lessonEnd`, `halfway`, `milestone` levels are slightly off target until `calibrate()` is re-run.
- `quiet()` in the current player suspends 300 ms after hiding even if the page is visible again; the old one checked
  `still()` first. Held calls: old kept the newest 4 and replayed them at their own times; current resumes once per
  call and plays "now".
- Current `playSound` has no try/catch; the old adapter caught and logged synth errors so a sound fault never broke a
  lesson.
- The old `atMs`/`lead` latency compensation existed but no app call site used it; Bluetooth latency (0.15-0.25 s)
  was uncompensated in both apps.
- Haptics only ever worked on Android (`navigator.vibrate`); on Eren's iPhone they were silent, and they were also
  off under reduced motion.
- Old copy to keep or replace deliberately: "Ses" / "Ders, cevap ve mühür sesleri", "Müzik" / "Çok hafif fon müziği".

## 3. Mascot and seals (old.js 6577-7088, 9386-9508; old.css 693-737, 885-898, 1573-1614, 1870-1873, 1916-1964, 2025-2165, 2178-2183, 2250-2260, 2416-2436)

The old app has two mascots. **The duo** (Satır and Sütun: two round role-coloured heads with faces drawn by a
spring rig) is the live one in every lesson surface: feedback sheet, summary step, lesson end, Profil. **The legacy
mascot** (`mascotSvg`, a 1x2 matrix face whose brackets are its arms, later the "Köşeli" brand mark) is still live as
the brand mark in the map header and the launch greeting; its sheet, scene and old-end-screen uses are fallbacks
that the feel flags replace. The current app has no mascot, no seal, no particles and no sheet: every row whose
Current column says "none" is **missing**.

Spring conversion used below: duration = 2π/√k, bounce = 1 − zeta (k 900 = 0.209 s, 520 = 0.276, 400 = 0.314,
380 = 0.322, 360 = 0.331, 300 = 0.363, 260 = 0.390, 240 = 0.406, 170 = 0.482, 110 = 0.599, 90 = 0.662).

### 3.1 Duo geometry (SVG, exact)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| Constants: `DUO_HEAD` 44 (head diameter), `DUO_OVERLAP` 10, `DUO_HEIGHT` 66 (pair), `DUO_CY` 26 (circle centre y in a head's own box), `DUO_ONE_HEIGHT` 48 (one head). old.js:6577-6581 | none | missing |
| Pair viewBox `0 0 78 66` (width 2·44 − 10). One head viewBox `0 0 44 48`. `<svg aria-hidden="true">`. old.js:6800-6806 | none | missing |
| Head placement in the pair `DUO_PAIR = {S: [0, 18], C: [34, -4]}`: Satır's circle centre (22, 44), spans x 0-44, y 22-66; Sütun's centre (56, 22), spans x 34-78, y 0-44. Overlap 10 units. Satır lower-left, Sütun upper-right. old.js:6583 | none | missing |
| Paint order: Sütun drawn first, Satır in front. One-head variant uses offset [0, 0]. old.js:6803-6806 | none | missing |
| Head markup: outer `<g transform="translate(dx dy)">` places it; inner `<g class="st-duo__head st-duo__head--row\|--col" data-who="S\|C">` is what the rig transforms (a CSS transform on the outer would replace the placement). Inside: `<circle class="st-duo__skull" cx="22" cy="26" r="22"/>`, `<g class="st-duo__face" transform="translate(22 26)">` with two `st-duo__eye` paths, one `st-duo__mouth`, two `st-duo__brow`. Role: S = row, C = col. old.js:6773-6783 | none | missing |
| Face anchors `DUO_FACE`: eye half-width `w` 2.6, eye half-height `h` 4, mouth half-width `mw` 4, mouth curve unit `mcu` 3.2, mouth open unit `mou` 4, eyes at (−7.5, −3) and (7.5, −3), mouth at (0, 8), happy cap `hmax` 0.65. old.js:6585 | none | missing |
| Eye path `duoEyePath(open, happy)`: `top = −h·1.33·clamp(open, 0.04, 1.2)`, `bottom = h·1.33·clamp(open,0.04,1.2)·(1 − 1.55·happy)`; `M−w 0 C−w top w top w 0 C w bottom −w bottom −w 0 Z`, coords rounded to 0.01. Neutral (open 1, happy 0): `M-2.6 0C-2.6 -5.32 2.6 -5.32 2.6 0C2.6 5.32 -2.6 5.32 -2.6 0Z` (oval). At happy 0.65 the bottom factor is −0.0075, so the eye becomes an upward arch (smiling eye). old.js:6619-6624 | none | missing |
| Mouth path `duoMouthPath(curve, open)`: `M−4 0 Q0 curve 4 0 Q0 (curve+open) −4 0 Z`; `curve = mc·3.2`, `open = max(0, mo)·4`. Neutral = `M-4 0Q0 1.92 4 0Q0 1.92 -4 0Z` (a closed zero-area curve that the 2.4 stroke turns into a smile line); happy = `Q0 3.04 … Q0 5.04` (open D mouth). old.js:6626-6629, 6640 | none | missing |
| Brow path `duoBrowPath(side)`: bracket corners. Left (index 0) `M2.6 0H-2.6V2.8`, right (index 1) `M-2.6 0H2.6V2.8`. Placed at `translate(eyeX, eyeY − 7.6)` = (∓7.5, −10.6), `rotate(∓tilt)` (left −tilt, right +tilt). Opacity = brow channel clamped 0-1 (only console shows them). old.js:6631-6635, 6641-6646 | none | missing |
| Head transform written as CSS on the inner g: `translate3d(0, y px, 0) rotate(rot deg) scale(sx, sy)`, scale rounded 0.001, others 0.01; cleared to `''` when at rest (|y| < 0.005, |rot| < 0.005, |s − 1| < 0.0005). `y` = channel y + face channel hy. Units are SVG user units (scale with the svg width). old.js:6647-6650 | none | missing |
| CSS `.st-duo__head {transform-box: fill-box; transform-origin: 50% 100%}`: heads squash and tilt about their bottom. old.css:2124-2127 | none | missing |

### 3.2 Duo colours and strokes

| Old | Current | Status |
| --- | --- | --- |
| Live skin (late override, old.css:2416-2427): `--duo-skin-row: #3b8be0`, `--duo-skin-col: #dac6ff`, `stroke: none` (no rim); same in light and dark. Raw hex, not palette tokens. | none (tokens.css:222-229 has `--row-fill`, `--col-fill` in oklch, different values) | missing |
| Earlier token tier (overridden by the above, old.css:700-703, 2137-2144): skull fill `--color-head-row` = `--row-9` #0961bb, `--color-head-col` = `--column-9` #c4a3ff; rim `--color-head-rim-row` = `--row-11` (#2b68b1 light / #91c1ff dark), `--color-head-rim-col` = `--column-11` (#72569f / #c9adfd), `--stroke-duo-rim` 1.4. Comment: rim keeps 3:1 against the stage. | none | dropped in old (override) |
| Face colour = `currentColor` from the head: row `--color-on-head-row` = `--on-row` #ffffff; col `--color-on-head-col` = `--on-column` #111318; both themes. old.css:2128-2133, 2145-2151 | none | missing |
| Eyes and mouth: `fill: currentColor; stroke: currentColor; stroke-linejoin/linecap: round`; eye stroke `--stroke-duo` 0.6, mouth stroke `--stroke-duo-mouth` 2.4. Brows `fill: none`, stroke `--stroke-duo-brow` 1.8, round caps and joins. old.css:2145-2165, 733-737 | none | missing |
| Measured contrast of the live skins: Sütun #dac6ff vs light stage #fdfcf8 = 1.51:1 (vs bg #f9f6f2 1.44:1) with no rim; Satır #3b8be0 vs light stage 3.43:1, vs dark 5.27:1; white face on #3b8be0 = 3.53:1; #111318 face on #dac6ff = 11.95:1. The override removed the rim the token tier added for exactly this case (comment old.css:729-731 says Sütun on light is 2.04:1 without a rim). | none | oddity (Sütun's outline under 3:1 on light) |

### 3.3 Duo sizes and placement CSS

| Old | Current | Status |
| --- | --- | --- |
| Width tokens: `--duo-one` 40px, `--duo-sm` 56px, `--duo-md` 72px, `--duo-lg` 96px, `--duo-xl` 128px; `.st-duo` default md, `line-height: 0`; classes `--one`, `--sm`, `--lg`, `--fit` (`var(--duo-fit, var(--duo-md))`). No `--xl` class exists; xl is only a clamp bound. old.css:711-715, 2087-2102 | none | missing |
| `.st-duo svg {display:block; width:100%; height:auto; overflow:visible}` (hops and squash may leave the box). old.css:2103-2109 | none | missing |
| Lesson end fit: pair width = clamp(`--duo-sm`, `--end-duo-share` 0.3 × stage height, `--duo-xl`), set as `--duo-fit` (old.js:8413, section 8). | none | missing |
| Sheet pair, live rule: `.st-sheet--pair .st-sheet__mascot.st-duo {width: 64px; margin-top: -8px; margin-right: -4px}` (raw px), so the pair (64 × 54) sits in the 40 px head row of the 211 px card. old.css:2429-2436. Earlier rules `--duo-sheet-pair` = `--mascot + --space-md − --space-xs` and `margin-top: calc(var(--duo-top-pair) * -100%)` are overridden. old.css:2110-2117, 720-723 | none | missing |
| Summary step pair `.st-duo--scene`: width `--mascot-big` (min(34cqw, 40cqh)) × `--duo-pair-ratio` 1.54; when the scene has two objects `--mascot-shared` (min(26cqw, 34cqh)) × 1.54. old.css:2118-2123, 585-586 | none | missing |
| Stale comments/tokens: CSS says the pair is "74 : 48, two 44-wide heads overlapping by 14" and `--duo-pair-ratio` 1.54; real viewBox is 78 × 66 (ratio 1.18), overlap 10. `--duo-top-pair` 0.07 describes a top strip the pair does not have (Sütun touches y 0). The `.st-sheet__mascot.st-duo` comment "one head, or the pair from the streak on" is stale: the sheet always shows the pair. old.css:717-723, 2110 | none | oddity |

### 3.4 Duo moods (face targets)

| Old | Current | Status |
| --- | --- | --- |
| Neutral channels `{happy 0, oL 1, oR 1, mc 0.6, mo 0, brow 0, tilt 0, hy 0}`. old.js:6588 | none | missing |
| `happy`: happy 1, mc 0.95, mo 0.5 (arched eyes, open mouth). old.js:6591 | none | missing |
| `console`: happy 0.45, mc 0.6, brow 1, tilt 12, hy 2 (brows on, tilted 12° inward-up, head sinks 2 units, soft eyes). old.js:6592 | none | missing |
| `proud`: oR 0.05 (right eye shut: a wink), happy 0.4, mc 1, mo 0.2. old.js:6593 | none | missing |
| `neutral`: {}. Missing keys keep neutral. `duoTargets(part, mood)` ignores `part` (same face on both heads). old.js:6590, 6829-6831 | none | missing |
| Face channel motion `DUO_FACE_MOTION` (all critically damped, z 1, so no frame overshoots a pose): happy k520 (0.276 s) at 0 ms; oL k900 (0.209 s) at 0; oR k900 at 30; hy k300 (0.363 s) at 0; brow k520 at 40; mc k380 (0.322 s) at 70; mo k380 at 90; tilt k300 at 110. Order: eyes, brows, mouth, tilt. old.js:6600-6603 | none | missing |
| `DUO_HEAD_LAG` 70 ms: Sütun's face starts 70 ms after Satır's. old.js:6604, 6838 | none | missing |
| `duoPose(wrap, mood, animate)`: stores the targets as `rig.base`; animate schedules each channel with `clock.after(lag + at)`; `animate=false` jumps every channel and draws once (initial mood in `duoEl`). Earlier scheduled calls are not cancelled; a later pose wins per channel because offsets are identical. old.js:6834-6852 | none | missing |

### 3.5 Duo rig (per-head spring integrator)

| Old | Current | Status |
| --- | --- | --- |
| Channels per head: y 0, rot 0, sx 1, sy 1 plus the 8 face channels; each `{x, v, t, k: 400, c: 40, on}`. old.js:6669-6671, 6815-6817 | engine has springs and tickers (src/engine/engine.ts:75-76, 243) but no rig | missing |
| `duoGo(part, name, target, {k=400, z=1, v})`: damping `c = 2·z·√k`; optional initial velocity; wakes the ticker. Reduced motion: jump to target, v 0, draw. old.js:6678-6694 | none | missing |
| `duoWake`: registers one engine ticker per head (`motion.addTicker`) with `step` and `finish`; none under reduced motion. old.js:6697-6705 | engine.ts:243 `addTicker` exists | missing |
| `duoStep`: dt capped at 64 ms, 240 Hz substeps (semi-implicit Euler), rest when |x − t| < 0.0008 and |v| < 0.01; returns false (ticker sleeps, `air` reset) when every channel and lid rests. old.js:6708-6743 | none | missing |
| Landing detection: while `rig.air`, y crossing from < 0 to ≥ 0 with v > 0 calls `duoLand(part, v)`. `duoLand`: hit = min(speed, 260); sy springs to 1 with k520 z0.45 and v −= hit·0.05/2.6; sx with v += hit·0.05/4 (harder hop lands flatter). old.js:6718-6719, 6762-6769 | none | missing |
| `duoFinish` (engine snapAll / tap-to-finish): every channel lands on its target, lids cleared, drawn once. old.js:6746-6760 | engine finish semantics exist (engine.ts) | missing |
| `duoReduced()` checks `typeof reducedMotion !== 'undefined'` because the file is inlined before the engine defines it. old.js:6673-6675 | engine.ts:112 `reducedMotion` flag | n/a |

### 3.6 Duo gestures

| Old | Current | Status |
| --- | --- | --- |
| Blink `DUO_BLINK = {dur 170, skew 45, sutun 110}`: lid factor `1 − 0.96·sin(π·age/170)` multiplies the eye's open channel (down to 0.04 mid-blink); left eye first, right eye +45 ms; Sütun +110 ms. A held-shut eye (base open < 0.5, e.g. proud's wink) does not blink. Skipped under reduced motion. old.js:6607, 6655-6660, 6855-6868 | none | missing |
| Hop `duoHop(part, strength=1, delay=0)`, `DUO_HOP = {squat 100, push −205, stretch 1.1, thin −0.6, sink 1, squash 0.05, lean 40, echo 0.28, echoAt 150, proudAt 120}`. Squat: y → +1·s, sy → 1 − 0.06·s, sx → 1 + 0.035·s, all k900 z1. After 100 ms: `air`, y → 0 k360 z0.5 v −205·s; sy → 1 k520 z0.5 v +1.1·s; sx → 1 k520 z0.5 v −0.6·s; rot → 0 k240 z0.55 v ±40·s (Satır +, Sütun −). old.js:6610, 6874-6890 | none | missing |
| Lean `duoLean(part)`, `DUO_LEAN = {tilt −4, sink 0.9, hold 650, blinkAt 240}`: y → 0.9, sy → 0.975, sx → 1.015 (k260 z1), rot → −4 (k170 z0.8); after 650 ms rot → 0 (k90 z0.85), y/sy/sx → rest (k110 z0.8). old.js:6612, 6893-6904 | none | missing |
| `duoReact(wrap, mood)`: always `duoPose(mood)` first. happy: Satır hop 1; Sütun hop 0.28 at +150 ms (hop 1 at 0 if alone); Satır blinks at 520 ms. proud: Satır hop 0.8; Sütun hop 0.8 at +120 ms; no blink (wink held). console: Sütun only leans, then blinks at 240 − 110 = 130 + 110 = 240 ms; Satır only changes face. neutral: face only. Reduced motion: expression lands, no movement. old.js:6890-6906 | none | missing |
| No idle loop anywhere (Profil comment: faces drawn still). old.js:7918 | none | same intent |

### 3.7 Duo element API and uses

| Old | Current | Status |
| --- | --- | --- |
| `duoEl({who: 'both'\|'S'\|'C', size: 'one'\|'sm'\|'md'\|'lg'\|'fit', mood})`: `div.st-obj.st-duo.st-duo--{size}`, `data-cast="duo"`, `data-obj="duo:{who}"`; `wrap.duo = {C, S}` parts (keys in DOM order: C first). Scene object, so it glides and rises with the stage engine. old.js:6790-6825 | none | missing |
| Feedback sheet (`feelSheetMascot`, slot `sheetMascot`): replaces the legacy `.st-sheet__mascot` with `duoEl({both, sm, mood: correct ? 'happy' : 'console'})`, adds `.st-sheet--pair`. Face already shows the mood at rest. Neutral sheet ("Bilmiyorum", class `is-neutral`/`is-unknown` or flag) has no duo. old.js:7041-7056; sheet head markup old.js:13178-13185 | src/lesson/LessonPlayer.tsx:257-273 inline `ls-feedback` block, no mascot | missing |
| Sheet reaction (`feelSheetReact`, slot `sheetReact`): after `CHOREO.mascotDelay` 140 ms: `duoReact(console \| proud if correct && streak === 3 \| happy)`, sound cue `answer.correct` / `answer.wrong`, and at streak 3 `feelStreakSeal()`. Not on a revisit (`quiet`). old.js:7058-7068, 13246-13252 | LessonPlayer.tsx:116-126 cues sound at once, no delay, no reaction | differs |
| Streak: `FEEL_STREAK.pairAt` 3; proud fires only when streak is exactly 3 (not 6, 9...). Sheet badge `"{n} üst üste"` from `STREAK_MIN` 3 (old.js:13114, 13179). | LessonPlayer.tsx:27 `STREAK = 3`, `>= 3` every time, no badge | differs |
| `feelStreakSeal`: a stub that only cues `seal.mini` (event `streak`); the three-cell mini seal was never drawn (`FEEL_TIMING.streakSealCap` 900 reserved). At streak 3 both `answer.correct` and `seal.mini` cue in the same frame. old.js:7070-7073, 8071, 6495 | LessonPlayer.tsx:121 plays `streak` instead of `correct` | differs |
| Summary step (`feelSceneMascot`, slot `sceneMascot`): scene item `mascot` becomes `duoEl({both, md})` + `.st-duo--scene`, `data-obj="mascot"`. old.js:7076-7081, 9561 | none | missing |
| Summary reaction (`feelSceneReact`): at delay + 260 ms `duoReact('happy')`; at delay + 1100 ms both blink. Oddity: `forEach(duoBlink)` passes the array index as `delay` (C 0 ms, S 1 ms). old.js:7084-7089 | none | missing |
| Other uses (owned by sections 8 and 9): lesson-end pair `duoEl({both, fit})` and `duoReact(proud\|happy)` (old.js:8543-8566); Profil pair `duoEl({both, md, mood})` with moods neutral/happy/proud by progress (old.js:7918-7926, 7976). | none | missing |

### 3.8 Seal component

| Old | Current | Status |
| --- | --- | --- |
| One look for every celebration: two brackets glide in around a matrix, then cells take ink in reading order. Tiers differ only in spring and ink: `SEAL_TIERS = {lesson: {move, ink false}, row: {move, ink true}, unit: {page, ink true}}`. old.js:6908-6926 | src/engine/tokens.ts:24 mentions a "mastery seal" spring only | missing |
| `tokenNum(name, el)` / `tokenPx`: reads a CSS custom property as a number, 0 if absent (JS never owns a design value). old.js:6929-6932 | none | missing |
| `buildSeal({tier, id, name, cols, cells, label, caption})`: `div.st-obj.st-mat.st-mat--seal.st-seal.st-seal--{tier}`, `data-obj`, `data-tier`; optional `span.st-mat__name`; `div.st-mat__grid` with `--cols`, `role="img"`, `aria-label = label \|\| name`; two `<i class="st-seal__br st-seal__br--l\|--r">`; cells `span.st-cell` (+ `.st-seal__tile` unless tier lesson, + cell.className), `data-k` index, text label; a cell with `ink`/`inked` gets `span.st-seal__ink` (same label) at opacity 0 or 1. Optional `span.st-seal__caption`. All strings via textContent (storage-safe). old.js:6938-6979 | none | missing |
| `sealOpen`: brackets at x ∓`--seal-gap` (14px), opacity 0. `sealCloseNow`: x 0, opacity 1 (reduced motion). old.js:6990-7002 | none | missing |
| `sealClose(seal, {delay, inkCells, onStart, onClosed, onDone})`: after delay both brackets `motion.to({x 0, opacity 1}, tier.spring)` (move = k700 z0.9 / page = k300 z0.9, see 1.1); right bracket's arrival fires `onClosed`, then each ink cell fades in on `fade` every `CHOREO.stagger` 35 ms; last arrival fires `onDone`. No ink tier or empty list: `onDone` at once. old.js:7009-7027 | none | missing |
| Bug: `inkOf(index)` reads `cells[index].querySelector` without a bounds check; an out-of-range ink index throws before `filter(Boolean)`. old.js:7012 | none | oddity |
| CSS: grid's drawn bracket pseudo-elements off (`content: none`); `.st-seal__br` absolute, top/bottom 0, width `--cell` × `--seal-bracket-arm` 0.16, border `--seal-bracket-stroke` (= `--stroke-bracket` 2px) solid `--color-ink`, outer corners `--radius-xs` 4px, `will-change: transform`; left has no right border, right no left border. old.css:2025-2047, 706-708 | none | missing |
| Tile `.st-seal__tile`: relative, background `--color-seal-wash` (`--neutral-3` #f1eee9 light / #22201c dark), font `--cell-font-long` (max(15px, cell × 0.4)), semibold, nowrap, `transition: none`. Ink `.st-seal__ink`: absolute inset 0, centred, radius inherit, background `--color-seal-ink` (`--brand-9` #29354d light / #cedffd dark), text `--color-on-seal` (`--on-brand` #ffffff / #111318); 12.3:1 and 13.8:1. `.st-seal__pad` hidden filler cell. old.css:2048-2069, 693-698 | none | missing |
| Caption `.st-seal__caption`: zero-width centred flex box so the line runs past the matrix without widening it; nowrap, `--text-ui` 15px, `--leading-caption` 1.35, `--color-muted`. old.css:2071-2081 | none | missing |
| Seal name size `.st-mat--seal > .st-mat__name`: `min(max(--text-caption, cell × 0.4), --text-title)` (a cell-scaled label once reached 35 px). old.css:2178-2183 | none | missing |
| Uses (owned elsewhere): lesson-end answers seal `lesson` tier and course ceremony `row`/`unit` (old.js:8483-8574, section 8); Profil course matrix `.st-me__matrix` closes once per visit on move after `CHOREO.openDelay` 180 ms (old.js:8026-8033, section 9); insight seal (4.6). | none | missing |

### 3.9 Glyphs and sparks

| Old | Current | Status |
| --- | --- | --- |
| `GLYPHS` (viewBox 0 0 24 24): check `M5 12.5l4.5 4.5L19 7.5`; cross `M7 7l10 10M17 7L7 17`; lock `M6.5 11h11v9h-11zM9 11V8a3 3 0 0 1 6 0v3`. `glyphSvg(name)` = `<svg class="st-glyph" aria-hidden="true"><path pathLength="1" d=…/></svg>`. old.js:9386-9394 | src/ui/icons.tsx:81-84 `Close` (16 viewBox, different path); src/shell/Glyph.tsx is a 2x2 mastery mark, unrelated | missing |
| `.st-glyph`: `--glyph` 18px square, no fill, stroke currentColor, `--stroke-glyph` 3, round caps/joins, overflow visible. old.css:889-898 | none | missing |
| `drawGlyphs(root, delay)`: each path draws on a custom `draw` channel 0 → 1 with spring `draw` (k200 z1, 0.444 s): dasharray 1, dashoffset 1 − draw; hidden while draw < 0.01 (a round cap would show a dot). old.js:9397-9407 | none | missing |
| `burst(layer, origin, {count, speed, spread 0.9π, life 900, seed 1, glyphs [], kinds [row, col, ok, accent]})`: seeded (mulberry32, old.js:9354) sparks `span.st-spark.st-spark--{kind}`; every 4th is a glyph if `glyphs` given; angle up ± spread/2, speed × (0.45-1.2), spin ± `PHYSICS.spin` 0.7/2, life × (0.7-1.2), scaleX 0.6-1.4; 4 ms substeps with gravity 2.2e-3 px/ms² and drag 0.9985/ms; fades in the last 220 ms; removed at life end or on finish. Skipped under reduced motion. old.js:9410-9459, 8867 | engine.ts:75 ticker type supports it; nothing uses it | missing |
| Spark CSS: absolute at 0,0, `--spark` 8px, `--radius-xs`, bold `--text-lead` 20px, `will-change: transform`; fills row `--row-9`, col `--column-9`, ok `--success-9`, accent `--color-spark` (`--accent-9` #f0e07f); glyph sparks transparent with ink colours (row-ink, col-ink, ok-ink). old.css:1573-1614 | tokens.css:230 `--spark` colour exists | missing |
| Dead in the live build: with `FEEL_FLAGS` all on, `answerFx` and `stampFx` slots are no-ops and `renderEndScene` (the only other caller) is replaced by the feel end scene, so `burst` never runs in v21. old.js:8061, 8725-8728, 13496, 13674, 14042 | none | dropped in old |

### 3.10 Legacy mascot (brand mark "Köşeli")

| Old | Current | Status |
| --- | --- | --- |
| `mascotSvg(mood, extraClass)` viewBox 0 0 40 40, `g.st-mascot__body` with arms `M10 6H6v28h4` (data-side −1) and `M30 6h4v28h-4` (data-side 1); happy eyes `M13.5 19.5q2.5-3 5 0M21.5 19.5q2.5-3 5 0`, mouth `M15.5 25.5q4.5 4 9 0`; oops eyes two circles (16,19) and (24,19) r 2.4, mouth `M16.5 27h7`. old.js:9464-9474 | none | missing |
| CSS: `--mascot` 40px; brackets no fill, stroke `--color-ink`, `--stroke-mascot` 3.2; smile stroke `--stroke-mascot-face` 2.4, round caps; eyes fill ink; body origin 50% 100%, arms/eyes 50% 50% (fill-box). Sizes: `--big` min(34cqw, 40cqh), shared min(26cqw, 34cqh), `--done` cell × 2.6, `--brand` `--icon` 22px, launch mark `--launch-mark` 96px. old.css:1916-1964, 2273-2276 | none | missing |
| `cheerMascot(svg, strength)`: body y → 0 on `land` (k400 z0.6) with v −150·s; scale on land with v (sy +2.2·s, sx −1.4·s); arms x → 0 with v ±70·s. `worryMascot`: body rotate → 0 on land with v −110, then blink. `blinkMascot`: eyes scaleY set 0.12 then → 1 on `move`. old.js:9486-9506 | none | missing |
| Live uses: brand mark in the map header (old.js:14449), cheer 0.8 at 12 × stagger and blink at 30 × stagger on map entry (old.js:14233-14234); launch greeting clones it, cheer 0.9 at 500 ms (old.js:7485, 7518). Fallback uses (sheet, summary, old end) replaced by the duo. | none | missing |

## 4. Gizli an (old.js 7091-7401; old.css 2167-2177, 2255-2260)

A secret question after Bitir, only in lessons with a `moments` entry; in v21 only `LESSONS.B1` has one
(old.js:355-371). It is not a step: progress bar, counter, score, run records and streak cannot change. It also
owns the F38 payoff eyebrow and the page-visibility pause. The current app has none of it.

### 4.1 Copy (Turkish, verbatim, `FEEL_MOMENT` old.js:7108-7117)

| Old | Current | Status |
| --- | --- | --- |
| Eyebrow first time (state `open`): `Gizli an · not tutulmaz` | none (src/content/strings.ts) | missing |
| Eyebrow after a skip: `Gizli an` | none | missing |
| Skip button text `Geç`, aria-label `Gizli soruyu geç`; restored aria-label `Ders haritasına dön` | none | missing |
| Primary after solving: `İleri` | none | missing |
| Payoff eyebrow: `Artık yapabildiğin` | none | missing |
| End-screen title when solved and no other ceremony: `Gizli anı çözdün: sezgi mührü senin.` (used old.js:8370) | none | missing |
| B1 content: title `Hesaplamadan söyle: \|A\| kaç?`, body `Çarpmana gerek yok, matrise bak.`, options 61 / 0 (correct) / 122 with feedback `Yalnız sağa inenleri topladın. Önce sütunlara bak.`, `Bağımlı sütunlar: determinant 0.`, `İki toplamı topladın; biri çıkarılır. Önce sütunlara bak.`; reveal frames `1. ve 2. sütun`, `3. sütun = 1. + 2. sütun ⇒ \|A\| = 0`; claims checked. old.js:355-371 | none (lesson content is ours; decision 0006) | n/a |

### 4.2 Data and storage

| Old | Current | Status |
| --- | --- | --- |
| Lesson field `moments: [{moment: 'secret', kind: 'choice', eyebrow, title, body, scene, options[{text, correct?, feedback, tag?, expr?}], reveal, check, claims}]`; `feelMomentFor` takes the first secret choice entry, else none. old.js:7123-7125 | src/content/lessons/types.ts:291 has `eyebrow` only | missing |
| Ledger `moments: {code: 'open'\|'skipped'\|'solved'}` (default open); merge across tabs only moves forward (solved > skipped > open). old.js:7131-7133, 8087-8089, 8239-8243 | none (src/lesson/store.ts) | missing |
| Solve writes a seal `{id: 'insight-{code}', kind: 'insight', lesson: code, at: Date.now()}` once (deduped by id). old.js:7135-7143 | none | missing |
| Shown when: lesson has a moment, the code is in `UNITS` (`feelKnown`), and state is not `solved`. A skipped moment comes back at the next completion (without the "not tutulmaz" note). old.js:7217-7228 | none | missing |
| Step payoff: a step with `paysOff: '<step id>'` whose target exists shows `Artık yapabildiğin` instead of its eyebrow (B1 step with `paysOff: 'hook'`, old.js:297). Slot `stepEyebrow`. old.js:7126-7128, 12922 | none | missing |

### 4.3 Entry and drawing

| Old | Current | Status |
| --- | --- | --- |
| Hook: slot `beforeEnd(resume)` runs after the completion is saved and before the end screen (old.js:13717). Sets `feelMoment = {code, step, solved: false, resume}` and `feelState.moment = {code, phase: 'open', picks: []}`. old.js:7217-7229 | none | missing |
| Header (`feelMomentHeader(true)`): the ✕ (`#lesson-close`, 48 px `.st-icon-btn`) keeps its place and becomes `Geç` (`.st-skip`: `--color-ink`, `--text-ui` 15px, semibold, line-height none); old inner HTML saved in `data-was`; enabled, opacity 1. No second exit. old.js:7146-7158, old.css:2167-2172 | none | missing |
| Draw (`feelMomentDraw`): view = step + eyebrow + `hideUnclear` (the "unclear" button is hidden); `lesson.answered = null`; progress bar full, counter unchanged, no new segment; narration, dock (choice options), work line planned and emptied, scene rendered, transport synced; the step's `beat` plays on channel `beat` after `chromeDelay(CHOREO.beatDelay 420)`. old.js:7198-7214 | none | missing |
| Reduced motion (`feelMomentReserve`): narration `min-height` = tallest of body and every option feedback (measured), so the stage never changes size. old.js:7183-7196 | none | missing |

### 4.4 Taps and keys

| Old | Current | Status |
| --- | --- | --- |
| Capture-phase click on the lesson view: only `.st-dock button` and `#lesson-close` are handled; `stopPropagation` + `preventDefault` so the engine records nothing; disabled buttons ignored. `Geç` → leave skipped; `moment-next` → leave solved; an option (before solving) appends its index to `picks`, then solve or miss. old.js:7334-7349, 7397-7401 | none | missing |
| Keys (capture): Escape before solving = `Geç`; ArrowLeft/ArrowRight (and Escape after solving) are swallowed so they cannot step the lesson. old.js:7352-7360 | none | missing |
| Wrong pick (`feelMomentMiss`): option gets `.is-miss` and is disabled; its feedback replaces the narration body; others stay tappable. No red, no cross, no sound, no haptic ("a try, not a mistake"). CSS `.st-option.is-miss`: `--color-muted` (5.49:1 on light surface), no shadow, line-through `--stroke-hair` 1px. old.js:7254-7259, old.css:2255-2260 | LessonPlayer.tsx:168-176 graded wrong (`data-state="wrong"`, `wrong` sound) | differs |
| `feelMomentSay(html)`: body swap inside `flipScene` (scene refits and glides); body enters from opacity `ENTER_FLOOR` 0.35, x `SHIFT.narr` 14 on `move`; empty html hides the body. old.js:7169-7180 | none | missing |

### 4.5 Solve sequence

| Old | Current | Status |
| --- | --- | --- |
| `feelMomentSolve(i)`: solved, phase `solved`, saved at once (before any animation); `feelState.end.insight = true` and `extra += 1` if the end has a ceremony; options marked (`markChoice`, animated); right feedback shown; cue `answer.correct` immediately; `Geç` disabled and faded (`fade`); reveal on channel `reveal` after `chromeDelay(CHOREO.revealDelay 160)`; when the reveal channel is idle, the insight seal, then the offer. old.js:7290-7310 | none | missing |
| Insight seal (`feelInsightSeal`): adds the two seal brackets to the scene's first `.st-mat__grid`, `st-mat--seal`, tier `lesson`; marks `insight:start` / `insight:closed`; `sealOpen` then `sealClose` (move spring); on close cue `seal.insight` (sound event `secret`). Reduced motion: closed at once, cue still fires. No matrix: skips straight on and **no sound**. Bound by `FEEL_TIMING.closeCap` 600 (comment only). old.js:7265-7287, 6496 | src/sound/score.ts:19-28 has no `secret` event | missing |
| Offer (`feelMomentOffer`): dock becomes `st-dock st-dock--nav st-dock--moment`, `data-kind="nav"`, one full-width primary `İleri` (`data-action="moment-next"`, `grid-column: 1 / -1`), inside `flipScene` with refit; `enterDock()`. Reduced motion pins dock `min-height` and `align-content: end` so the stage does not move. old.js:7313-7329, old.css:2173-2175 | none | missing |

### 4.6 Leaving and interruptions

| Old | Current | Status |
| --- | --- | --- |
| `feelMomentLeave(state)`: guarded by `leaving`; skip saves `skipped`; every visible scene object and work token fades to 0 on `fade`, the last arrival calls `go` (nothing visible to resize when the end screen arrives); `go` restores the header, clears reduced-motion pins and calls `resume()` (end screen). Nothing visible: `go` at once. old.js:7235-7251, 7159-7166 | none | missing |
| Header restore: `.st-skip` removed, `innerHTML` from `data-was`, aria-label `Ders haritasına dön`, opacity 1, enabled. old.js:7152-7158 | none | missing |
| `step:leave` (harness only) → `feelMomentAbandon`: scene and work set to opacity 0 at once (no ghost into the next layout), then reset. `step:enter` / `view` → `feelMomentReset`: moment ends, ledger keeps its state. old.js:7366-7378, 8613-8620 | none | missing |
| QA helper `bitir()` completes and skips the moment. old.js:8694-8698 | none | n/a |
| Page visibility (`feelOnVisibility`, general, lives here): hidden pauses the active teaching runner; visible resumes it after `FEEL_TIMING.resumeHold` 360 ms, never by tap; only if the runner is still registered. old.js:7381-7394 | src/sound/player.ts:72 handles sound only; lesson beats do not pause | missing |

### Port notes

- Draw the duo from the numbers in 3.1-3.4, not from a static SVG: the eye, mouth and brow paths are functions of
  channel values, and the "happy" eye only becomes an arch because `1 − 1.55 × 0.65` is slightly negative.
- The face springs are critically damped by design (no frame shows a shape the drawing lacks); only body motion
  (hop, lean, landing) bounces. Keep the per-channel delays and Sütun's 70 ms lag; they are the character.
- The head transform must be on an inner group with `transform-box: fill-box; transform-origin: 50% 100%`; the
  placement lives on the outer group.
- Live colours are the late raw-hex override (#3b8be0, #dac6ff, no rim), not the token tier above it. Both break
  "no raw values": the port needs tokens for the skins. Sütun is 1.5:1 against the light stage with no rim; the
  old token tier had a rim for exactly this reason. This is a design decision for Eren, not something to copy blindly.
- Sheet pair size is a raw 64 px override; `--duo-sm`, `--duo-sheet-pair`, `--duo-top-*` and `--duo-pair-ratio`
  are partly stale (comments say 74 × 48; the real box is 78 × 66).
- Sound timing differs from ours: old cues the verdict sound 140 ms after the sheet (with the mascot reaction);
  at streak exactly 3 it plays `correct` and `streak` together. Ours plays `streak` instead of `correct` on every
  streak ≥ 3, immediately.
- The streak mini seal and the insight seal look were stubs in v21 (cues only / brackets only). Their final look
  was never specified; ask before inventing one.
- `burst` and the legacy mascot's sheet/scene reactions are dead in the live build; only the brand mark uses the
  legacy mascot. Decide whether particles come back at all.
- Gizli an must never touch steps, progress, score, records or streak; taps are caught before the lesson handler.
  A wrong pick there is neutral (no red, no sound). Solved state is saved before the animation, so leaving mid-seal
  still counts.
- Could not determine: the exact contents of `CHOREO` beyond the values cited, `flipScene`/`enterDock`/`markChoice`
  internals (sections 5-7), and whether the insight seal was ever shown on Profil (the ledger stores it).

## 5. Scene (old.js 9517-10107, old.css 570-676, 1184-1406, 1949-1960, 2018-2025)

Current counterpart: `src/lesson/Stage.tsx` (scene, fit, flights, replay), `src/lesson/timeline.ts` (frames, marks),
`src/exam/Blocks.tsx` (`Matrix`, `RichText`), `src/shell/shell.css` (`.ls-*`, `.ex-mat`, `.ex-cell`).
Spring conversions (duration = 2π/√k, bounce = 1 − zeta) used below: `move` 0.237 s/0.10, `teach` 0.482/0.20,
`teachY` 0.390/0.14, `land` 0.314/0.40, `fade` 0.157/0, `leave` 0.123/0, `draw` 0.444/0, `press` 0.102/0,
`enter` 0.281/0 (entrance floor), `carry` 0.599/0.10, `carryY` 0.497/0.05, `carrySide` 0.363/0 (old.js:8755-8777).
CHOREO values used here (old.js:8836-8857): `stagger` 35, `glideHead` 90, `leaveHead` 120, `markHold` 360 ms;
`SHIFT.scene` 10 px.

### 5.1 Lesson binding and scene objects

| Old (what + values + lines) | Current (file:line or "none") | Status |
| --- | --- | --- |
| `lessonName(code)`: title from `UNITS[].lessons` tuple, else `LESSONS[code].title`, else the code (old.js:9517-9523) | lesson title from content module | n/a |
| `unitOf(code)`: unit id containing the lesson, fallback first unit (old.js:9525-9527) | none needed in Stage | n/a |
| `useLesson(code)`: sets `MATRICES`, `STEPS`, `LABELS` globals, clears `answered`, empties scene; throws on unknown code (old.js:9530-9539) | `LessonPlayer` props; `lookup()` throws `Unknown matrix` (timeline.ts:132-136) | n/a |
| Lesson state object `{index, mats, labels, answered, keypadValue, complete, streak}` (old.js:9541) | React state in LessonPlayer | n/a |
| Scene object kinds: operator (`op:*`), label (`LABELS[id]`), `mascot`, matrix (old.js:9545-9581) | items: matrix name, `'='`, `'result'` only (Stage.tsx:283-331) | differs |
| Operators table: `op:dot ·`, `op:eq =`, `op:plus +`, `op:minus −`, `op:times ×`, `op:arrow →`, `op:neq ≠`; unknown `op:x` shows `x`; `aria-hidden` (old.js:9543-9554) | only `=` (Stage.tsx:284-290), not aria-hidden | differs |
| Mascot as a scene object: `feelSlot('sceneMascot')` wraps `mascotSvg('happy','st-mascot--big')` (old.js:9562-9569) | none | missing |
| Matrix DOM: `.st-obj.st-mat[.st-mat--det]` > `.st-mat__name` (above) + `.st-mat__grid` (`role=img`, `--cols`) of `.st-cell[data-i][data-j]`, last column `.st-cell--aug` when `spec.augmented` (old.js:9570-9581) | `.ls-item > .ls-mat[data-matrix] > .ex-mat-wrap > .ex-mat-label + .ex-mat[role=img] > .ex-cell[data-cell]`, augment via `data-bar="before"` at `augmentedAt` (Blocks.tsx:56-99, Stage.tsx:306-309) | differs |
| Matrix name sits **above** the grid (`.st-mat` flex column, gap cell×0.12) (old.css:1239-1244) | label sits **left** of the grid (`.ex-mat-wrap` flex row, gap 0.3em) (shell.css:271-278, 674-677) | differs |
| `renderScene` reuses existing DOM nodes by object id within the same lesson (`scene.dataset.lesson`) (old.js:10073-10079) | React keys by item index (Stage.tsx:286, 305) | differs |
| After load, a kept `st-mascot--done` (lesson end) is reset to `st-mascot st-mascot--big` (old.js:10087) | none | n/a (section 8) |
| `sceneReact`: mascot in scene cheers at delay+260 ms (`cheerMascot(m,1.2)`), blinks at delay+1100 ms (old.js:10090-10095) | none | missing (section 3) |

### 5.2 Cells and values

| Old (what + values + lines) | Current (file:line or "none") | Status |
| --- | --- | --- |
| `formatNumber`: `null/undefined → "?"`, strings: every `-` → `−`, negatives `−n` (old.js:9259-9263) | `entryText` replaces every `-` (tex.ts:33-35); `show()` replaces only the first `-` (timeline.ts:100-102) | differs |
| `setCell` writes `lesson.mats` and cell text; toggles `is-unknown` (value null) and `is-long` (text length > 2) (old.js:9587-9598) | cells render `entry` string; no unknown/long classes (Blocks.tsx:82-94) | missing |
| Landing pop only when the cell was blank or `?`: `scale 0.55 → 1` on `land` (0.314 s, bounce 0.40) (old.js:9592-9593, 9604-9607) | none (rewritten rows re-render in place) | missing |
| A value that changes the column width (`--long` changes) on a live stage runs `flipScene(write)`; `glide:false` (scene load) writes directly (old.js:9599-9603) | `layoutKey` change refits `--cell` instantly, no glide (Stage.tsx:269-277) | missing |
| `fitLongEntries`: `--long` = longest formatted entry length per matrix (old.js:9611-9616) | none | missing |
| `.st-mat --cell-w: max(--cell, --long × --cell-font-long × 0.62 + 8px)`: symbolic entries widen the column, text keeps size (old.css:666-674) | `.ls-stage .ex-cell min-width 2.08em; padding-inline 0.2em` (shell.css:697-705): column grows with content, no long-font | differs |
| `.st-cell.is-long`: font `--cell-font-long` (max(15px, cell×0.4)), tracking −0.01em, nowrap (old.css:1366-1370) | none | missing |
| `.st-cell.is-unknown`: muted ink for `?` (old.css:1291-1293) | none | missing |
| `describeMatrix`: grid `aria-label` = `"<name>: 1 2; 3 4"` (old.js:9626-9630) | `aria-label="matris: 1, 2; 3, 4"` / `"determinant: …"`; no matrix name (Blocks.tsx:67, 79) | differs |
| `cellEl(mat,i,j)` lookup by `data-obj` + `data-i/j` (old.js:9583-9585) | `cellSelector` by `data-matrix` + `data-cell="r-c"`, copy suffix `+` (Stage.tsx:164-165) | same |
| `rowCells`/`colCells` helpers (old.js:9744-9750) | `'*'` refs in marks (timeline.ts:279) | same |
| `loadMatrices(step)`: values from `step.state[id]` or spec; labels from `step.labels[id]` or `LABELS[id]` with `fit:false`; `clearMarks(true)`; apply `step.marks` (old.js:9752-9764) | stage reads `lesson.matrices` + `state.working` (Stage.tsx:300-302); per-step pre-set state/labels/marks not supported | differs |

### 5.3 Marks

| Old (what + values + lines) | Current (file:line or "none") | Status |
| --- | --- | --- |
| `MARK_CLASSES = is-row, is-col, is-target, is-result, is-wrong, is-struck, is-pivot` (old.js:9632) | tones `row`, `col`, `ok` (types.ts:19) + `strike` from minor (Stage.tsx:34-35) | differs |
| Marks accumulate as classes on a cell; CSS source order decides when several apply (row < col < target < result < wrong < pivot < struck) (old.js:9719-9723, old.css:1294-1341) | one tone per cell; last matching mark wins, minor strike overrides (Stage.tsx:26-38) | differs |
| `is-row`: bg row-wash, ink row-ink, inset 1.5px row-edge (old.css:1294-1298) | `[data-tone=row]` same values; on stage edge `max(1.5px, 0.04em)` (shell.css:774-778, 1092-1094) | same |
| `is-col`: col-wash / col-ink / inset 1.5px col-edge (old.css:1299-1303) | same values (shell.css:779-783, 1095-1097) | same |
| `is-target`: ring only, inset 2px ok-edge, no fill (old.css:1304-1306) | none | missing |
| `is-result`: bg **ok-fill**, text on-ok, semibold (old.css:1307-1311) | `ok`: bg ok-**wash**, text ok-ink, normal weight (shell.css:784-787) | differs |
| `is-wrong`: bad-wash bg, bad-ink (old.css:1312-1315) | none | missing |
| `is-pivot` (cofactor chosen entry): bg ink, text surface, semibold (old.css:1317-1321) | none | missing |
| `is-struck`: transparent bg, muted ink (still passes contrast), no shadow, plus a pen line (old.css:1324-1329) | `strike`: muted, `text-decoration: line-through 2px`, **opacity 0.55** (shell.css:788-793) | differs |
| Pen line `.st-cell__strike`: muted bar, radius full, thickness `--stroke-ring` 2px; `--h` spans cell ±2px (joins neighbours across the 2px grid gap), `--v` same vertically, `--d` 18% insets rotated `--strike-angle −35deg` (old.css:1330-1365) | text-decoration only | missing |
| Strike axis: all cells same row → h, same column → v, else d (old.js:9677-9680) | none | missing |
| Strike draws on `move` spring (0.237 s) via `scaleX`/`scaleY` 0 → 1 from `transform-origin` left/top, staggered 35 ms per cell (old.js:9685-9693) | none | missing |
| Cell colour change: CSS transition 160 ms `cubic-bezier(0.2,0,0,1)` on bg, color, box-shadow, opacity (old.css:1281-1285) | no transition; tone swaps in one frame (shell.css:4 "no CSS transitions here") | differs |
| `clearMarks()` holds old marks until the next mark repaints or `markHold` 360 ms passes (as a gated `cue`), so cells go old colour → new colour, never blank; serial guards stale timers (old.js:9645-9656) | each frame replaces the whole mark list atomically (timeline.ts:153-156); no hold timer | differs |
| `clearMarks(true)`: immediate clear for a new step's scene (old.js:9646-9649) | new beat starts from `emptyStage` | same |
| `applyClear(repaint)`: remembers struck cells (`restruck`) so a repaint keeps the line drawn instead of redrawing (old.js:9659-9668, 9690) | none | missing |
| `applyMark([mat,i,j,cls])` with `'*'` wildcards; no-op for unknown matrix (old.js:9727-9735) | `'*'` handled in `toneFor` (Stage.tsx:32) | same |
| Oddity: `applyClear` removes every strike line, then `strike()` re-creates it for restruck cells without animation; a restruck cell whose axis changed gets the new axis instantly (old.js:9666-9690) | n/a | n/a |

### 5.4 Labels (scene text objects)

| Old (what + values + lines) | Current (file:line or "none") | Status |
| --- | --- | --- |
| `.st-label`: semibold, `max(17px, cell×0.5)`, leading 1.45, centred, nowrap, font-math, proportional nums; `.st-hl-*` inside are bold (old.css:1391-1404) | only `.ls-result`: `1.2em` (= cell×0.576), bold, tabular, muted → ok-ink when done (shell.css:721-733) | differs |
| `setLabel`: label that appears where nothing was fades in on `fade` (opacity; entrance floored to `enter` 0.281 s) (old.js:9711-9714) | result text `Rise`: opacity 0 + y 8 px → 0 on `teach` 0.72 s (Stage.tsx:11-24, 296) | differs |
| `setLabel {land}`: scale 0.85 → 1 on `land` (old.js:9715-9718) | none | missing |
| Label change on live stage runs inside `flipScene` (neighbours glide) then `refitScene` (old.js:9700-9709) | refit via `layoutKey` (instant) | differs |
| `fitScene` foresight: while measuring, each label holds the widest text the step will write (script frames + compiled runner label writes, cached per step in a WeakMap) (old.js:9864-9922) | none (no labels; result slot text changes refit afterwards) | missing |
| `reserveLabelHeights`: each label keeps the height of its tallest planned text (`data-own`, `data-reserve`), so a label growing mid-step never moves the work below (old.js:9928-9948) | none | missing |
| `capLabelReserve`: a reserve never exceeds stage height − work height − row gap; trims tallest first (old.js:9951-9963) | none | missing |
| `padLabel`: centres label text in its reserve with equal `padding-block` (old.js:9966-9971) | none | missing |

### 5.5 Scene size and fit

| Old (what + values + lines) | Current (file:line or "none") | Status |
| --- | --- | --- |
| `sizeScene`: `--scene-rows` = max rows (≥2), `--scene-cols` = sum of columns (≥2) (old.js:9619-9624) | none (measured fit) | differs |
| Cell modes: `--cell-base clamp(28px, min(fit-x‖9.4cqw, 15cqh, fit-h), 60px)`; `--cell-solo clamp(28, min(fit-x‖15cqw, 22cqh, fit-h, fit-w), 88px)`; `--cell-aug clamp(28, min(fit-x‖12cqw, 18cqh, fit-h-aug), 64px)`; `--cell-stack` for lesson end (old.css:619-655, 791-797) | one `--cell`: `CELL {probe 64, min 30, max 88}` for every scene (Stage.tsx:94) | differs |
| `--cell-fit-h = (100cqh − work-min-h − 12px − 24px) / (rows + 0.8)`; aug: `− 8px` and `/ (rows + 2.1)`; `--cell-fit-w = (100cqw − 48px) / (cols + 1.2)` (old.css:620-634) | height budget = stage − padding − notes reserve − area SVG (Stage.tsx:123-133) | differs |
| `--cell-min` 28 px; 20 px (`--cell-min-tight`) when `.st-lesson.is-tight` (feedback sheet needs room) (old.css:660-665, 586) | min 30 px always | differs |
| `--cell-font: max(15px, cell×0.48)`; `--cell-font-long: max(15px, cell×0.4)` (old.css:651-652) | `.ls-scene font-size: cell×0.48`, no 15 px floor, no long variant (shell.css:662) | differs |
| Cell box: `grid-auto-rows: --cell`, column `--cell-w`, radius cell×0.24 (old.css:1252-1279) | `min-width/height 2.08em` (= cell×0.998), radius `0.5em` (= cell×0.24) (shell.css:697-705) | same |
| Grid gap 2px both axes; padding `2px cell×0.2` (old.css:1257-1258) | gap `0.1em` (cell×0.048); padding `0.12em 0.3em` (cell×0.058 / ×0.144) (shell.css:682-686) | differs |
| Scene gap `cell×0.24`; two objects with no operator between get `--scene-gap-objects` 24px (P Q R never read as one block) (old.css:655, 591-596, 600) | `.ls-scene gap 0.35em 0.4em` (cell×0.17/0.19), `.ls-item gap 0.4em`; no object-gap rule (shell.css:654-673) | differs |
| `sceneRoom`: stage width − 2 × max(`--scene-inset` 24px, transport column if `is-transport-top`, fold column if `is-fold-side`) (old.js:9840-9852) | width = stage − padding 12px×2 (Stage.tsx:125, shell.css:647) | differs |
| `fitWidth`: up to 4 passes (labels have a min font so width is not linear), stop within 2 px; `--cell-fit-x` floored to 0.1 px; final shrink by overshoot (old.js:9973-9989) | single probe at 64 px, scale = min(w ratio, h ratio), rounded to 1 px, clamped (Stage.tsx:99-107) | differs |
| CSS caps the fitted cell by height and mode max even after `--cell-fit-x` (old.css:637-650) | clamp in `fitCell` | same |
| `refitScene`: fallback refit when a beat wrote a wider label than foreseen (old.js:9995-9998) | `layoutKey` refit + ResizeObserver (Stage.tsx:136-138) | differs |
| `fitWorkCap`: `--work-cap` = computed font size of the first cell (old.js:9862-9866) | notes clamp uses `cell×0.48` directly (shell.css:740) | same |
| `.st-stage` is a size container (`container-type: size`); all cqw/cqh above read it (old.css:1196) | no container queries | differs |
| `.st-obj { transform-origin: 0 0; will-change: transform }` (old.css:1227-1230) | none | differs |
| Row-op mode `.st-scene--aug`: `padding-bottom: cell×1.3 + 8px` for the scaled row written under the matrix; the work block moves **above** the scene (`order:-1`) (old.css:1219-1226) | row ops rewrite rows in place; op label is a note below (timeline.ts:317-351) | missing |
| `.st-scene--solo` uses `--cell-solo` (old.css:1207-1209) | none | missing |

### 5.6 Scene transitions and live re-layout

| Old (what + values + lines) | Current (file:line or "none") | Status |
| --- | --- | --- |
| `swapScene`: measures every object, swaps children, loads, fits, then FLIPs persistent objects (old.js:9794-9832) | Stage re-renders; no scene transition | missing |
| Persistent object, same aspect (`|sw−sh| < 0.08`): starts at old box with uniform `scale = sw`; changed aspect: glides centre to centre without scale; both on `move` 0.237 s (old.js:9813-9824) | none | missing |
| Leaving object `ghostOut`: pins `--cell`, `--cell-w`, `--cell-font`, `--cell-font-long` (registered `@property` lengths so a ghost keeps px size), moves to `#fx` at its rect, fades on `leave` 0.123 s, removed on arrive (old.js:9767-9782, old.css:602-622) | none | missing |
| `riseIn`: new objects from `opacity 0, y +10px` (always from below: from above would clip tall matrices at the stage top), stagger 35 ms, `move` spring (old.js:9784-9789) | none at scene level (`Rise` only for notes/result, 8 px, `teach`) | missing |
| Entrance head: newcomers wait `max(leaveHead 120 if anything leaves, glideHead 90 if anything glides)` + `options.delay` (old.js:9828-9831) | none | missing |
| `flipScene(mutate, own)`: every re-layout of a live stage glides scene objects, the work block and narration on `move` in the current channel's tempo (old.js:10021-10066) | none (instant `--cell` change) | missing |
| flipScene scales width and height separately (`scaleX`, `scaleY`) so a widening matrix keeps its height continuous; `own` (content changed) only moves (old.js:10035-10040) | none | missing |
| flipScene composes with a running spring (`state.x + dx`), skips moves under 0.5 px / 0.5% (old.js:10044-10046) | none | missing |
| flipScene then glides each cell inside its object by what the host's glide does not cover, dividing by host scale (old.js:10048-10065) | none | missing |
| `startInside`: a glide start box that would stick out below the stage is pulled half by moving up, half by starting smaller; never above the top (design-qa: max 8 px / 4% snap) (old.js:10006-10016) | none | missing |
| Horizontal clamp: a glide never starts past the stage's left/right edge (`"?" → "ad − bc"` at the edge) (old.js:10042) | none | missing |
| Reduced motion: handled by the engine (spatial springs land at once) | engine `reducedMotion` (engine.ts:210); LessonPlayer jumps to the last frame (LessonPlayer.tsx:30, 60) | same |

### 5.7 Stage, matrix and operator CSS

| Old (what + values + lines) | Current (file:line or "none") | Status |
| --- | --- | --- |
| `.st-stage`: flex column, centred, gap `--stage-gap` 12px, radius 24px, bg `--color-stage` (neutral-1), `--shadow-raised`, overflow hidden, relative (old.css:1184-1200) | `.ls-stage`: same flex/gap/overflow, radius `--corner-stage` 24px, bg `--sh-surface`, shadow `0 1px 2px`, **padding 16px 12px**, `min-height 38%` (shell.css:638-652) | differs |
| Brackets: `::before/::after` width cell×0.16, border 2px ink, outer corners radius 4px (old.css:1260-1278) | width `0.18em` (cell×0.086), border `max(1.75px, 0.05em)`, square corners (shell.css:292-308, 687-691) | differs |
| Determinant bars: width 0, 2px left/right border (old.css:1376-1388) | `max(1.75px, 0.05em)` bar (shell.css:692-696) | differs |
| `.st-mat__name`: font-math semibold `max(13px, cell×0.4)`, leading 1, muted (old.css:1245-1251) | `.ex-mat-label` 600, muted, size inherits scene font (cell×0.48) (shell.css:678-681) | differs |
| Augmented column: `.st-cell--aug` inset left line 2px at −0.5px spread, muted; right corners only rounded (old.css:1287-1290) | `data-bar="before"` margin 0.3em, `::before` at −0.25em (shell.css:330-340, 706-711) | differs |
| `.st-op`: medium, `max(13px, cell×0.55)`, leading 1, **muted** colour (old.css:1231-1236) | `.ls-op` 1.1em (cell×0.528), 500, ink colour (shell.css:717-720) | differs |
| `.st-cell .st-glyph` cell×0.46 (old.css:1286) | none | n/a (section 8) |
| Mascot sizes in scene: `--mascot-big min(34cqw, 40cqh)`; sharing scene `--mascot-shared min(26cqw, 34cqh)` (old.css:584-585, 1949-1958) | none | missing (section 3) |
| Font: cells, labels, work, chips use `--font-math` ("Satir Ident" serifed I + UI font) (old.css:474-476) | `--font-ui` mapped to `--font-math` (Dizey Ident) in shell (shell.css:20) | same |

## 6a. Work line and flying chips (old.js 10108-11060, old.css 1408-1570)

### 6a.1 TEACH timing table (old.js:10108-10172)

Current playback has one fixed interval per frame: `FRAME_MS = round(720 × 1.25) = 900 ms` (LessonPlayer.tsx:25), the same for teach and reveal beats.

| Old key: teach / reveal (ms unless noted) | Meaning | Current | Status |
| --- | --- | --- | --- |
| `line` 200 / 150 | empty new line before numbers land | none | missing |
| `highlight` 450 / 350 | sources lit before they move | frame 900 | differs |
| `lead` 250 / 100 | later term's sources light up this long before moving | none | missing |
| `carryStagger` 180 / 60 | between chips of one term | `FLIGHT_STAGGER_MS` 110 (Stage.tsx:246) | differs |
| `carry` 200 / 100 | after a product's last chip lands, before its value | none (tail fades on landing) | missing |
| `value` 580 / 300 | product value readable before next term | frame 900 | differs |
| `collect` 640 / 350 | line result read before next line | frame 900 | differs |
| `write` 600 / 350 | value written back into the scene | none | missing |
| `rewrite` 700 / 420 | one equation line becomes the next | none | missing |
| `flip` 0.2 | share of a crossing flight after which the chip shows its new sign | none | missing |
| `sideways` 200 | chip keeps its row this long while moving sideways (crossing group) | none | missing |
| `inkDim` 0.3 | ink a chip passes over dims to 30% | none | missing |
| `inkGap` 0.5 em | digits closer than this beside a chip dim too | none | missing |
| `inkLead` 220 | dim starts this far ahead of a chip | none | missing |
| `repeat` 0.5 / 0.5 | dwell factor for an already-shown shape | none | missing |
| `leadAfterFirst` false / true | reveal: later terms lead instead of highlight | none | missing |
| `valueOnLanding` false / true | reveal: value written as last number lands | current always writes on landing | differs |
| `contact` 2 px | arrival tolerance on both axes | `epsilon 0.5` + 720 ms fallback (Stage.tsx:230-232) | differs |
| `pursuit` 900 px/s | chip speed cap (smooth pursuit) | none | missing |
| `peakPerPx` 4.9 | measured peak speed per px of carry springs | none | missing |
| `poll` 16 | runner settle poll (used outside region, old.js:11219) | n/a | n/a |
| `maxLines` 5 | open work lines before folding | none (lines grow) | missing |
| `cellTarget` 32 px | fold sooner rather than cells < 32 px (planWork, old.js:12326) | none | missing |
| `indent` 1.5 em | second row of a wrapped line | none | missing |
| `floorLine` 1000 + `floorWord` 200/word; `floorValue` 400 | reading floors: dwell = max(floor, dwell) | none | missing |
| `revealBudget` 16000, `revealMargin` 1100, `motionGuess` 900 | reveal after a right answer aims to land within 16 s of the tap by trimming dwell above floors; wrong answer keeps full pace | none | missing |
| `teachTimes(family)`: reveal merges `TEACH.reveal` over TEACH (old.js:10175-10177) | none | missing |
| `teachAfter(ms, fn, screen)`: 0 when the channel's runner is rushed; `screen` dwells divided by tempo so they stay on-screen ms (old.js:10183-10186) | `engine.after` in lesson channel; tempo scales everything | differs |

### 6a.2 Tokens and lines

| Old (what + values + lines) | Current (file:line or "none") | Status |
| --- | --- | --- |
| `.st-work` grid, block centred, **lines share a left edge** (`justify-items: start`), `align-content: start` (a written line never moves when the next is added), row gap 4px, padding 7px 16px, medium, leading 1, font-math, proportional nums, nowrap (old.css:1408-1430) | `.ls-notes` grid, **each line centred** (`justify-items: center`, `text-align: center`), gap 4px, line-height 1.4, tabular nums (shell.css:734-748) | differs |
| Work font: `var(--work-fit, max(15px, min(clamp(17px, 6cqw, 24px), --work-cap)))` (old.css:1419-1426) | `clamp(17px, cell×0.48, 22px)` (shell.css:740) | differs |
| Reserved height `--work-min-h = 2×7 + 34×lines + 4×(lines−1) + fold×(22+4)` (old.css:611-618, 570-575) | `minHeight = reserve × 31px`; fit subtracts `reserve×31 + 12` (Stage.tsx:96-97, 128, 353) | differs |
| `.st-work__line`: flex, wrap, centred items, gap `--work-gap` 0.34em, min-height 34px, max-width 100% (old.css:1431-1438) | `.ls-note` block, tokens joined by literal spaces (Stage.tsx:146-162, shell.css:746-748) | differs |
| `tokenEl`: kinds `--a` row-ink, `--b` col-ink, `--sum` ok-ink bold; `.st-work__label` semibold; `.is-hidden` opacity 0 (keeps layout); `data-ref` (old.js:10191-10201, old.css:1500-1515) | `.ls-tok` plain, `data-num` index for digit tokens; colour only via TeX/`{row}` markup in RichText lines (Stage.tsx:146-162) | missing |
| Operator detection `OP_TEXT /^([+−·=×→(),±]|-)$/` → `.st-work__op`; `·` → `.st-work__dot` with negative inline margin (`3·2` reads tight) (old.js:10188, 10196-10197, old.css:1493-1496) | `·` written with spaces `a · b` (timeline.ts:163) | differs |
| `WORD /^\p{L}{2,}$/u` defined here, used by the beat compiler (old.js:10189, 11806) | n/a | n/a |
| `lineEl`, `openLines` (not folded), `visibleTokens` (not hidden, has text) (old.js:10203-10217) | `state.notes` strings | n/a |
| `ghostToken`: leaving token moves to `#fx` at its rect with its font size, fades on `leave` 0.123 s (old.js:10220-10227) | removed note unmounts instantly | missing |
| `setWork(tokens)`: replaces the work area with one line; a single open line is kept as the same element (one reading unit) (old.js:10234-10247) | notes keyed `index:text`: any change re-mounts the line (Stage.tsx:357) | differs |
| setWork: a word whose text was already on screen keeps its element and glides from its old place on `teach` 0.482 s; new words fade on `draw` 0.444 s (entrance floored) (old.js:10251-10274, 10281-10286) | whole line `Rise` (opacity + y 8px, `teach` 0.72 s) (Stage.tsx:11-24) | differs |
| New words wait `leaveHead` 120 if anything left, and until no gliding kept word crosses their box (`glideClear`, 2 px clearance, simulates the `teach` spring at 240 Hz scaled by tempo, max 4 s) (old.js:10276-10319) | none | missing |
| `line.drawIn`: when new words start drawing (frames write cells in sync) (old.js:10288) | none | missing |
| `pushWorkLines`: lines of one wrapped group are tagged and never fold themselves (old.js:10338-10353) | none | missing |
| New line enters by **opacity only** on `fade` (no rise); waits `leaveHead + glideHead` (210 ms) when older lines fold (old.js:10356-10360) | `Rise` y +8px → 0 with opacity on `teach` (Stage.tsx:16-17) | differs |
| `aria-live`: none on the work area in region | `.ls-notes aria-live="polite"` (Stage.tsx:351) | differs (current adds) |

### 6a.3 Fold row

| Old (what + values + lines) | Current (file:line or "none") | Status |
| --- | --- | --- |
| Past `workMax` open lines the oldest group folds; `folds` computed before mutate (old.js:10342-10352) | none | missing |
| `foldLine`: creates/uses `.st-work__line--folded` row prepended at the top (old.js:10368-10377) | none | missing |
| A line with `data-fold="none"` (equation chain) folds without a chip; `is-fold-silent` folds without chips and counts `teachStats.silentFolds` (design-qa flag: folded result with no visible source) (old.js:10378-10381) | none | missing |
| Ghost copy of each member line fades in place on `leave`; the moving result is hidden in the ghost so it is never doubled (old.js:10382-10389) | none | missing |
| Chip = `.st-work__chip` + `.st-work__chip-fill` (pill as its own layer) + optional `.st-work__chip-label` `"<label>:"` + the result token itself moved in (or a new token from `data-chip`/`data-chip-kind`) (old.js:10390-10412) | none | missing |
| Pill and label fade in on `draw` after `leaveHead` 120 ms; the result keeps gliding meanwhile (no empty frame) (old.js:10414-10420) | none | missing |
| Folded member keeps `chipEl` reference for later carries from it (old.js:10422-10425) | none | missing |
| CSS fold row: min-height 22px, font 15px (`--text-ui`, a folded result stays readable), gap 4px; `:empty` hidden (old.css:1454-1462) | none | missing |
| Chip CSS: padding 2px 4px, radius 8px, isolation; fill `--color-soft` (neutral-3) at `z-index -1`; label UI font medium, margin-end 4px (old.css:1475-1492) | none | missing |
| `.is-fold-side`: no room for a chip row → chips park in a column at stage top-left (4px, 4px), width `--fold-side-w` set inline by planWork (old.css:1463-1474, old.js:12333-12334) | none | missing |

### 6a.4 Fitting the work block

| Old (what + values + lines) | Current (file:line or "none") | Status |
| --- | --- | --- |
| `lineWidth`: sum of token widths + margins + gaps, at least `min-width`, plus `margin-left` (old.js:10432-10441) | none | missing |
| `workEm(px, el)`: px → em at 3 decimals, so reservations scale with the font (old.js:10443-10445) | none | missing |
| `workSpace`: room = work width − 2 × padding; `limit` = stage right − 4px − `--hit` 48px − 4px gap − work left, or full room when `is-transport-top` (old.js:10458-10469) | none | missing |
| `fitWork`: font shrinks (`--work-fit`, floor `--text-ui` 15px, whole px) when the widest line (current or planned `workPlanEm`) exceeds the room; planned once per beat so it never changes when a wide line folds away (old.js:10482-10500) | none (lines wrap at spaces; font fixed by clamp) | missing |
| fitWork routes the block left of the transport button: `padding-right = inset + min(2×shift, room − limit)` (old.js:10497-10500) | replay button may overlap the last note line at bottom-right | missing |
| `layoutPos`: element position without its own spring offset, so FLIP works mid-glide (old.js:10503-10507) | none | missing |
| `flipWork(mutate)`: each staying token glides centre to centre on `move`, and scales from its old font size (a result moving into a fold chip); skips < 0.5 px / 1% (old.js:10514-10530) | none | missing |

### 6a.5 Showing, combining and collecting tokens

| Old (what + values + lines) | Current (file:line or "none") | Status |
| --- | --- | --- |
| `showToken`: hidden token appears in place by opacity on `draw`; never scales up; false if not hidden/connected (old.js:10540-10546) | target tokens set `opacity 0` then `fade` on landing (Stage.tsx:188, 214) | differs |
| `revealToken(ref)`, `workToken(ref)` by `data-ref` (old.js:10532-10551) | `data-num` index (Stage.tsx:155) | differs |
| `showWithOperator`: the operator just before a token appears with it (old.js:10554-10558) | operators between targets are never hidden (only tokens after the last target are) (Stage.tsx:182-188) | differs |
| `combineSlot`: parts fade on `leave`; when all gone, slot HTML replaced inside `flipWork`, fitWork, slot fades in on `draw`; runner held (`holdTeach`) until done; no two numbers ever overlap (old.js:10912-10935) | none | missing |
| `openSlot`: shows a slot's parts as hidden tokens joined by `op` (old.js:10938-10951) | none | missing |
| `chipOf(el)`: `tok--b` → `col`, `tok--sum` or no element → `result`, else `row` (old.js:10953-10958) | chip tone = source cell's `data-tone` ('' when unmarked) (Stage.tsx:198) | differs |
| `collectInto`: plays `teach.merge`, shows `=` before the result, then the result, opacity only (no chip crosses the written line) (old.js:10964-10971) | tail after last target (`= result`) fades in on last landing; `merge` cue when a frame changes `result` (Stage.tsx:215-217, LessonPlayer.tsx:98-100) | differs |

### 6a.6 Ink check (chip over ink)

| Old (what + values + lines) | Current (file:line or "none") | Status |
| --- | --- | --- |
| Runs after every engine tick (`motion.afterTick`, also drives cue gates) (old.js:10650-10653) | none | missing |
| Ink set: work tokens, fold chip labels, scene cells, scene labels with text (old.js:10587-10590) | none | missing |
| Glyph box from a Range over contents, not the element box (old.js:10591-10595) | none | missing |
| Chips considered: `.st-chip` with opacity ≥ 0.3, plus results gliding into fold chips (they cross scene ink) (old.js:10596-10602) | none | missing |
| Look-ahead: chip box extended by its second-order travel over 220 ms, never past its target (old.js:10606-10619) | none | missing |
| "Beside" rule: same baseline (≥ 50% vertical overlap) and closer than 0.5 em → dims ("2" next to "8" reads "82"); only for text with a letter/digit (old.js:10624-10628) | none | missing |
| A chip in the work area only dims scene ink (old.js:10630) | none | missing |
| Landing slot exempt while blank or `?`; a slot with text dims like any ink (old.js:10631-10636) | none | missing |
| Landing line exempt as the chip lands (within 6 px of target) (old.js:10641) | none | missing |
| Dim is a CSS `filter: opacity()` on an `ink` property (not opacity, so reading gates still count it) (old.js:8871, 9162-9164) | none | missing |
| Dim on `press` 0.102 s in the chrome channel (tempo 1, beats the chip at any pace); instant set to 0.3 when already overlapping; undim on `fade` 0.157 s (old.js:10636-10648) | none | missing |

### 6a.7 Chips and flights

| Old (what + values + lines) | Current (file:line or "none") | Status |
| --- | --- | --- |
| `makeChip`: legacy cell-sized chip at source rect in `#fx`, source font size (old.js:10655-10665) | cell-sized chip at source rect appended to stage (Stage.tsx:196-206) | same |
| `textChip`: runner chip sized to its text, centred on the source ink box; optional second face (`swap`) stacked in the same grid cell, starts at opacity 0 (old.js:10671-10690) | none | missing |
| Chip visible at full opacity from lift-off; the source stays (a copy travels) (old.js:10655-10665) | chip starts at opacity 0 and fades in on `fade` while moving (Stage.tsx:208, 220) | differs |
| `.st-chip` CSS: **filled** role colour (row-fill/on-row, col-fill/on-col, ok-fill/on-ok), radius 8px, semibold, tabular, font-math, `--shadow-float 0 3px 10px`, origin centre (old.css:1517-1544) | `.ls-chip`: **wash** bg + role ink (unmarked: surface + 1px line ring), radius 0.5em, 600, shadow `0 6px 18px -6px`, `z-index 2` (shell.css:1102-1125) | differs |
| `.st-chip--text`: padding 2px 0, leading 1, nowrap; `.st-chip__face` grid-area 1/1 (old.css:1545-1554) | none | missing |
| `fly`: x on one spring, y (+ scale) on another → curved path; legacy pair `teach`/`teachY`, runner pair `carry`/`carryY` (old.js:10699-10746) | x, y, scale all on `teach` (0.72 s / 0.08) → straight path (Stage.tsx:221-231) | differs |
| Landing scale = target font / source font, applied on the y spring (old.js:10718, 10730) | `scale: ratio` on `teach` (Stage.tsx:209-226) | same |
| `aim()` re-measured every tick: lands centred on the target as it stands now; x clamped so the scaled chip never passes the stage edge (old.js:10719-10724, 10781-10786) | target measured once; aims at rest place minus the line's current rise offset (Stage.tsx:186, 224-225) | differs |
| `yDelay`: sideways leg first, drop later (old.js:10733-10738) | none | missing |
| Operator before the target (`·`) shown as the chip lifts off (old.js:10741-10743) | not handled | missing |
| `landChip`: arrived when both axes within 2 px **and** the y leg has started; one axis already in place at lift-off never counts (old.js:10780-10793) | `onArrive` with epsilon 0.5 px, or a fixed 720 ms timer (Stage.tsx:230-232) | differs |
| Holds at the slot while any ancestor's opacity < 0.9 (`hostShown`), so a value is never written invisible (old.js:10789-10802) | none (line may still be rising: aims below lift, writes regardless) | missing |
| Contact: value written, target entrance and ink dim end at once (`endEntrance`), chip removed in the same frame: chip and value are never both readable, never neither (old.js:10766-10768, 10810-10820) | chip removed, target fades in on `fade` 0.22 s: a short frame with neither fully readable (Stage.tsx:211-214) | differs |
| Contact glide: if writing the value moved the target's centre (`?` → `ad − bc`), the target starts at the chip's contact point and glides home on `move` (old.js:10770-10778) | none | missing |
| `finish()` (tap finishes the channel): contact with snap, no glide (old.js:10796-10798) | channel finish lands springs → `onArrive` (Stage.tsx:189, 230) | same |
| `teach.land` sound on every chip contact (old.js:10856-10859, 6497) | `land` cue once per frame, `merge` when the result changes (LessonPlayer.tsx:97-100) | differs |
| `inkRect(source)`: element, whole line (visible tokens' common box), token array, or snapshot `{rect,size}` (old.js:10827-10838) | cell `getBoundingClientRect` only | differs |
| `snapshot(el)`: carry from a token that has since left (old.js:10841-10844) | none | missing |
| `carry` pursuit limit: `slow = min(1, 900 / (4.9 × max(1, distance)))`, springs softened by `kScale = slow²` (old.js:10864-10866, 10880) | none: long flights (Sarrus copy → line) move faster than short ones | missing |
| Mid-flight sign swap at `round(0.2 × 650 / slow)` ms, faces cross-fade on `fade` (old.js:10867-10868, 10706-10712) | none | missing |
| Sideways mode: `carrySide` (x) then `carryY` (y), each held to the pursuit limit with its own measured peak (`springPeak`, 1 ms Euler, 4 s); drop after `200 / sx` ms (old.js:10869-10877, 10888-10901) | none | missing |
| `crossingPaths`: true when chips' left-to-right order changes between source and target (old.js:10904-10911) | none (Sarrus flights from a copy can cross) | missing |
| Cleanup: chips removed on handoff; `motion.states` entry deleted (old.js:10755-10760) | effect cleanup removes chips and restores token opacity (Stage.tsx:236-239) | same |

### 6a.8 Runner holds and cue gates (old.js:10981-11060)

| Old (what + values + lines) | Current (file:line or "none") | Status |
| --- | --- | --- |
| `holdTeach()`: counted hold the runner waits on; release is idempotent, never below 0 (old.js:10988-11002) | none | missing |
| `teachStats.trace`: per-action trace exposed for design-qa (`window.satir.teach`) (old.js:10992) | none | n/a |
| `CueGate`: a cue-timed beat's next cue never starts before what became readable since the previous cue has had its reading floor; a held cue moves later cues with it; staggers inside one cue are plain timers (old.js:11004-11036) | fixed `FRAME_MS` per frame | missing |
| `readyAt`: pending combine holds the gate frame by frame (`now + 1`); watches first (old.js:11028-11034) | none | missing |
| `cue(ms, fn)` = `clock.after` through the current gate; `watchCueGates` per frame drops gates with no timers (old.js:11039-11050) | `engine.after` | differs |
| `motionByKind` / `floorByKind`: measured motion time and floor per action kind for the reveal budget (old.js:11053-11055) | none | missing |
| `readables()`: open-line work tokens (not hidden, not in fold chips) incl. operators, scene cells/labels with a letter/digit, counted readable at ≥ 50% compound opacity; ink dim does not count (old.js:11059-11080) | none | missing |

### 6a.9 Replay button (CSS only; transport logic is in 6b, old.js:11284+)

| Old (what + values + lines) | Current (file:line or "none") | Status |
| --- | --- | --- |
| `.st-replay` absolute right 4px, bottom 4px, muted; 48px hit (`--hit`) (old.css:1560-1565, 555) | `.ls-replay` right/bottom 8px, 44×44, radius 14px, muted, icon 22px stroke 2 (shell.css:1137-1159) | differs |
| `.is-transport-top .st-replay`: top corner when a step's work line cannot clear the bottom corner even at 15px (old.css:1567-1570, old.js:12324) | always bottom-right | missing |
| States pause / play ("Devam ettir") / replay ("Hareketi tekrar oynat"), replay icon path `M5 12a7 7 0 1 0 2.1-5M5 4v4h4` (old.js:11284-11302) | replay only, same label and same path (Stage.tsx:335-345, strings.ts:132) | differs (6b) |
| Touch: neighbouring targets `--tap-gap` 8px apart (replay vs "anlaşılmadı") (old.css:2213-2216) | none | missing |

### 6a.10 Old-code oddities

| Old (what + lines) | Note | Status |
| --- | --- | --- |
| `setCell` landing pop scales 0.55 → 1 on the bouncy `land` spring (old.js:9605-9606) while `showToken` says "an entrance never scales up" (old.js:10537) | two rules disagree; decide one before porting | n/a |
| `carry` swap time uses a hard-coded 650 ms "settling time" instead of the spring constants (old.js:10868) | port as a derived value | n/a |
| Two pursuit models: plain carry uses the measured constant `peakPerPx 4.9`, sideways carry measures `springPeak()` at runtime (old.js:10866, 10872-10873) | unify on `springPeak` | n/a |
| `motion.afterTick` is a single assignment shared by ink check and cue gates (old.js:10650) | any other assignment silently disables both | n/a |
| `--fold-side-w` exists only inline (planWork); `sceneRoom` reads 0 when unset (old.js:9850, 12333) | not a token | n/a |
| Strike lines are per cell segments (h/v extend 2px to meet across the 2px gap); a diagonal strike is a separate −35° dash per cell, not one line (old.css:1344-1364) | looks dashed on non-aligned cells | n/a |
| `inkCheck` reads chip opacity from `style.opacity` (old.js:10601) | depends on the engine writing inline opacity | n/a |
| `fitWidth` early exit `fit && size < fit − 1 && width ≤ room` stops when CSS capped the cell below the fit (old.js:9979) | correct but implicit | n/a |

### Port notes

- The scene and work line are one continuous-layout system: every change on a live stage (wider column, longer label, refit, fold) glides via FLIP (`flipScene`, `flipWork`) and never snaps. The current `--cell` refit is instant on every `layoutKey` change; porting the look without FLIP loses the old "nothing jumps" guarantee.
- Reservation up front is the core idea: label heights and widths (`scriptedLabels`, `reserveLabelHeights`), work lines (`--work-lines`, `--work-fold`), and work font (`workPlanEm`) are planned per step/beat before the first frame, so nothing moves mid-beat. The current app reserves only a note count × 31 px.
- Work lines share one left edge (paper layout); current notes are centred line by line. This is a visible meaning change for multi-line calculations.
- Chips are **filled** role colours with light text in the old app (row-fill, col-fill, ok-fill); current chips are wash tiles. `is-result` is also a fill (ok-fill + on-ok), current `ok` is a wash. Tokens `--row-fill`, `--col-fill`, `--ok-fill` already exist in tokens.css (222-229, 214-217); `--on-row/--on-column/--on-success` equivalents do not.
- Chip-to-value handoff must be same-frame (`endEntrance`): current fades the value in after removing the chip, which shows a brief empty slot.
- Flight path curvature comes from different x/y springs (`carry` 0.599 s vs `carryY` 0.497 s); the pursuit limit (900 px/s via kScale = slow²) is what makes long Sarrus flights calm. Both are absent now.
- Ink check, crossing-path sideways mode, sign swap mid-flight, fold row, combine/collect slots, reading floors and cue gates have no current equivalent; they are behaviour, not styling, and need the runner (section 6b) to exist first.
- Strike in the old app is muted text at full opacity plus an animated pen line; current uses `opacity 0.55` + `line-through`, which lowers contrast below the old rule ("muted ink that still passes contrast").
- Sound granularity: old plays `teach.land` per chip contact and `teach.merge` per collect; current plays one cue per frame.
- Could not determine from this region: the `--shadow-raised` and `--color-stage` final values (palette steps), the `.st-replay` button base class (likely `.st-icon-btn`, outside region), and how `planWork`'s `workRowsOf`/`foldChipsWidth` compute line counts (old.js:11950-12340, section 6b).

## 6b. Beats and runners (old 11061-12895)

Scope: reading floors and readables, the teaching `Runner`, transport (pause / play / replay), the derivation
model (roles, operators, `evaluate`), line and equation actions, layout planning, `RECIPES`, paced actions,
`compileBeat`, `planWork`, the legacy cue-timed `BEATS` table (incl. `script` / `flyFrame`), `endMarks`,
`answerLabels`, tempo classes and `playBeat`. Helpers called from here but defined in 6a (`carry`, `fly`,
`landChip`, `showToken`, `collectInto`, `combineSlot`, `openSlot`, `pushWorkLines`, `setWork`, `crossingPaths`)
are cited, not re-inventoried. Current app: `src/lesson/timeline.ts` (pure frame compiler),
`src/lesson/LessonPlayer.tsx` (one cue per frame), `src/lesson/Stage.tsx` (notes, flights, replay button).

Architecture in one line each:
- **Old:** a beat compiles to *actions* `{kind, run, dwell}`; a `Runner` starts one action, waits until its motion
  has landed and every `holdTeach()` is released, then waits a *dwell* that is never shorter than a measured
  *reading floor* of what the action made readable; a reveal after a right answer has a time budget that trims
  only the part of dwells above their floors. Pace comes from a per-beat *tempo class*. Legacy beats are cue-timed
  but pass through a `CueGate` that enforces the same reading floors.
- **Current:** a beat compiles to a list of `StageState` frames; the player shows frame n+1 every fixed
  `FRAME_MS = 0.72 s × 1.25 = 900 ms` (LessonPlayer.tsx:25, 91-105). No floors, no budget, no tempo classes,
  no pause. Number flights exist only for `sources` of the newest note line (Stage.tsx:173-241).

### Timing constants this region runs on (defined elsewhere, needed to read the tables)

On-screen ms. "×pace" = scaled by the channel tempo (teach class 1.6, repeat 1.1, quick 1). Dwells are on-screen
(`teachAfter(ms, fn, true)` divides by tempo, old.js:10176-10179); leads and staggers are choreography and scale
with pace. Springs: duration = 2π/√k, multiplied by pace on a paced channel.

| Constant | Old value (lines) | Current | Status |
| --- | --- | --- | --- |
| `TEACH_PACE` | 1.6 (old.js:8788) | `TEMPO.teach = 1` (tokens.ts:107) | differs |
| `CUE_TEMPO` (legacy cue beats) | 1.5; legacy teach class = 1.5 × 1.6 = 2.4 (8795, 8815) | none | missing |
| `TEMPO_CLASSES` | quick {pace 1, cue 1}; repeat {pace 1.1, cue 1.65}; teach {pace 1.6, cue 2.4} (8806-8816) | none | missing |
| `TEMPO` const | {beat 2.4, reveal 2.4} (8796); not read anywhere in this region (superseded by `channelPace`) | n/a | n/a (dead in old) |
| `TEACH` teach family dwells | line 200, highlight 450, carry 200, value 580, collect 640, write 600, rewrite 700 (10112-10121) | one fixed 900 ms per frame | missing |
| `TEACH` choreography | lead 250 (×pace → 400), carryStagger 180 (→ 288) (10115-10116) | `FLIGHT_STAGGER_MS = 110`, no lead (Stage.tsx:246) | differs |
| `TEACH.reveal` family | line 150, highlight 350, lead 100, carryStagger 60, carry 100, value 300, collect 350, write 350, rewrite 420, repeat 0.5, leadAfterFirst true, valueOnLanding true (10140-10141) | reveal plays the same frames at the same 900 ms | missing |
| `TEACH.repeat` | 0.5: dwell factor for a line/term whose shape was already shown (10128) | none | missing |
| Reading floors | floorLine 1000 + floorWord 200 per new word; floorValue 400 (10151-10153) | none | missing |
| Reveal budget | revealBudget 16000, revealMargin 1100 → aim to land 14 900 ms after the answer tap (10160-10161) | none | missing |
| `motionGuess` | 900 ms × pace: projected motion of an unmeasured action kind (10162) | none | missing |
| `TEACH.poll` | 16 ms settle poll (10132) | none (engine onArrive) | n/a |
| `TEACH.maxLines` / `cellTarget` / `indent` | 5 open lines; cells ≥ 32 px; wrapped 2nd row indent 1.5 em (10133-10135) | `reserve` = max notes of any frame; no folding; no wrap (LessonPlayer.tsx:161, Stage.tsx:128) | missing |
| Carry springs | `carry` k110 z0.9 (0.599 s, ×1.6 = 0.958 s), `carryY` k160 z0.95 (0.497 s), `carrySide` k300 z1 (0.363 s) (8774-8776) | flights use `teach` 0.72 s / bounce 0.08 for x, y and scale together (Stage.tsx:221-231) | differs |
| `draw` spring / `DRAW_READ` | k200 z1 (0.444 s); a drawn word reads at half ink = 1678/√200 = 118.7 ms (8765, 8833) | tokens fade with `fade` 0.22 s (Stage.tsx:214) | differs |
| `CHOREO` used here | stagger 35, leaveHead 120, glideHead 90, endMarksDelay 600, idlePoll 50, beatDelay 420 (8836-8857) | `CHOREO.rise` 8 px only | missing |

### 6b.1 Readables and reading floors (old 11051-11148)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| `readables()`: map element → text of everything that reads now: unfolded work tokens (not nested, not hidden, not inside a fold chip, operators included) and leaf scene `.st-cell` / `.st-label` with a letter or digit (11059-11080) | none | missing |
| "Shown" test: product of computed `opacity` from the element up to its root ≥ 0.5; a fading-in token is not read yet; ink dimming is a `filter`, so a dimmed token still counts (11063-11068) | none | missing |
| `changedCount(before, after)`: readables that are new or have new text (11083-11089) | none | missing |
| `readingTerms(text)`: "·" with spaces joined (a product 3·1 is one term), split on whitespace `= + − - : , ;`, keep terms with a letter or digit (11097-11099) | none | missing |
| `readingUnits`: groups readables by unit (a work line, else the cell/label itself) (11102-11109) | none | missing |
| `readingFloor(before, after)`: per unit, new words = max(multiset-new terms, changed tokens/cells; a label counts its letter-digit runs); if every new word is in a line that still has hidden tokens, or exactly 1 word in one cell → `floorValue` 400; else `floorLine + floorWord × words` = 1000 + 200·n; 0 if nothing new (11116-11148) | none | missing |
| Edge: "3 → 5" counts as one new term; "?" counts as none (11111-11115) | none | missing |
| Perf oddity: `readables()` calls `getComputedStyle` on every ancestor of every token, on every action start, settle poll (16 ms) and every frame of an open `CueGate` (11066, 11226, 11015) | n/a | n/a (note) |

### 6b.2 Runner (old 11150-11282)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| `new Runner(actions, name, deadline)`: state index, held, waiting, fast, deadline, moved, done, share (11150-11154) | `useEffect` scheduling `frames.length` cues at `(n − shown) × 900 ms` on channel `lesson` (LessonPlayer.tsx:91-105) | differs |
| `start()`: adds to `runners` and the channel to `pacedChannels` (so springs/staggers on it use class `pace`, not `cue`), runs first action, syncs transport (11178-11183) | none | missing |
| `next()`: when out of actions, removes runner, drops channel from `pacedChannels` if no other runner of it, syncs transport (11185-11192) | none | missing |
| Pause point: `held && !fast` is checked only between actions; the running action finishes, then `waiting = true` (11193-11197) | none | missing |
| Each action: `share = dwellShare()` (assigned, never read: oddity), trace entry `{kind, start, channel, fast}` pushed to `teachStats.trace` (test hook), `entry.before = readables()` unless fast; `run()` inside `withChannel(name)`; `result !== false` = changed; a numeric result delays the first settle check by that many ms (×pace) (11198-11209) | none | missing |
| `settle()`: records `readAt` the first time the changed-readables count rises (floor starts when the last new word became readable, so it overlaps the motion tail); polls every 16 ms while `motion.isMoving(name)` or `teachHolds > 0` (11211-11226) | none | missing |
| Motion measured per kind: `motionByKind[kind] = max(prev, settled − start)` (only changed, not fast) (11228-11235) | none | missing |
| Floor rule: fast or unchanged → 0; `highlight` → its whole nominal dwell; else `readingFloor(before, now)`; `floorByKind[kind]` keeps the max seen (11238-11242) | none | missing |
| Dwell = `max(floor − sinceReadAt, highlight ? nominal : min(nominal, floor) + max(0, nominal − floor) × dwellShare(), 0)`; 0 if fast/unchanged; waited as on-screen ms (11245-11249) | fixed 900 ms per frame regardless of content (LessonPlayer.tsx:25) | missing |
| `dwellShare()`: no deadline → 1. Else projected motion left (per kind, unknown = max(900 × pace, longest measured)) + floors of remaining waits (the previous action's and every remaining except the last; the last action's dwell does not count) ; share = clamp((deadline − now − motion − floors) / aboveFloorTotal, 0, 1) (11160-11176) | none | missing |
| `pause()`: `held = true` (11247-11250) | none | missing |
| `resume(fast)`: unhold, `fast` sticky; if waiting, `next()` on the next tick in its channel (11252-11260) | none | missing |
| `activeRunner()` = the last added; `runnerBusy(name)` (11262-11268) | none | n/a |
| `rushRunners(name)`: resume every runner (of a channel) with fast = true; `teachAfter` waits become 0 for a rushed runner; caller flushes the clock (11270-11274, 10177) | `engine.finishChannel('lesson')` + `setShown(frames.length)` (LessonPlayer.tsx:140-142) | differs |
| `dropRunners()`: clears runners, cue gates, paced channels, `teachHolds = 0` (11276-11281) | effect cleanup `engine.cancelCues('lesson')` (LessonPlayer.tsx:104) | differs |
| `holdTeach()`: counter-based hold, release idempotent; the runner does not settle while any hold is open (10988-10996) | none | missing |

### 6b.3 Transport button (old 11283-11322, plus stage tap 14378-14408)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| One button, three states. `pause`: path `M9 6.5v11M15 6.5v11`, label "Duraklat"; `play`: `M8.5 6v12l9.5-6z`, "Devam ettir"; `replay`: `M5 12a7 7 0 1 0 2.1-5M5 4v4h4`, "Hareketi tekrar oynat" (11287-11291) | replay only, same path and label `strings.lesson.replay` (Stage.tsx:335-346, strings.ts:132) | differs (pause/play missing) |
| State: no runner → replay; runner held → play; else pause. `aria-label` and path swap on the tap itself (11293-11303) | none | missing |
| Visibility: hidden only when the step has no beat (none, lesson complete, or reveal not yet answered) and no runner is running (11295-11298) | shown only when `!playing && frames.length > 1` (LessonPlayer.tsx:229): hidden while playing, hidden for 1-frame beats | differs |
| Press while running: pause/resume, icon `scale 0.8 → 1` on `land` (k400 z0.6) (11305-11314) | none | missing |
| Press when done: `replay()`, icon `rotate 0 → −360` on `move` (k700 z0.9, 0.237 s), reset to 0 on arrive (11315-11318) | `setReplays(n+1)` re-keys the beat; no icon motion; `sh-press` press only (LessonPlayer.tsx:229) | differs |
| `replay()`: `stopMotion`, reload the step's matrices, clear work, play the entry beat; if answered and the step has a reveal, land the entry beat at once and play the reveal (13800-13809) | re-runs the same frames (entry or reveal, whichever `beatOf` gives); scene is stateless so no reload needed (LessonPlayer.tsx:42-46, 60) | differs |
| Stage tap (anywhere but the button): nothing to play → stage press `scale 0.96` (opacity 0.7 under reduced motion) back on `ui`; during a right-answer reveal → land the reveal, stay on the step, icon `scale 0.8 → 1`; runner active → same as transport press; else icon nudge `scale 1.25 → 1` on `land` (14381-14408) | stage has no click handler (Stage.tsx:280) | missing |
| CSS: `.st-replay` absolute, right/bottom `--space-xs` 4 px, `--color-muted`; `.is-transport-top .st-replay` top 4 px (old.css:1560-1570). Button box is presumably `.st-icon-btn` 48 × 48 (`--hit`), radius `--radius-md` 12, transparent (old.css:938-947; markup not in old.js, unverified) | `.ls-replay` right/bottom 8 px, 44 × 44, radius 14, `--sh-muted`, svg 22 px stroke 2 (shell.css:1137-1159) | differs |
| Oddity: a legacy (cue-timed `BEATS`) beat has no runner, so the button shows "replay" while it is still playing and cannot pause it (11297) | n/a | n/a (note) |

### 6b.4 Derivation model: roles, operators, evaluate (old 11324-11459)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| A derivation is `{lines}`; a line is `{expr, role, name, value, result, rhs, rhsFrom, into, given, label, chip}` or an equation chain `{eq: [...]}`; expressions: number, symbol string, `@name` ref, `[mat, i, j]` cell, `[op, ...]`, `{expr, role, value, show}` wrapper (11324-11335) | beats are fixed kinds (`det2`, `sarrus`, `expand`, `minor`, `rowOps`, `area`, `frames`, `equation`, `sequence`), notes are pre-formatted strings (timeline.ts:299-373, types.ts:43-73) | differs |
| `ROLES`: row → mark `is-row`, token `a`, chip `row`; col → `is-col`, `b`, `col`; result → `is-result`, `sum`, `result` (11336-11340) | mark tones `row` / `col` / `ok` (timeline.ts:169-345); notes untinted | differs |
| `OP_ALIASES`: `+`; `-`/`−` → `−`; `*`/`·`/`×` → `·` (11341) | strings written directly with `·`, `−` | differs |
| `deriveMats`: deep copy of the matrices during compile, so a line's write-back (`into` cell) is seen by later lines (11343, 11735, 11972-11980) | none | missing |
| `evaluate`: numbers, refs (`results[name].number`), numeric cells; `·` product, `+` sum, `−` unary negate or left fold; symbolic → undefined (11374-11389) | `lib/math/rational` exact arithmetic on numeric blocks only; symbolic det2 shows letters "ad − bc" (timeline.ts:198-200) | differs |
| `termText`: operators spaced ("k − 1" even if the cell shows "k−1"); parentheses for a negative after an operator, a sum/difference as a factor or after a minus (11391-11402) | `factor()`: parentheses only for negative numbers (timeline.ts:105-109) | differs |
| `shownValue`: declared value, else computed, else ref's declared, else cell text, else symbol, else "?" (11405-11413) | none | missing |
| `leavesOf` / `leafSource`: a term's leaves with inherited role; source element = cell or the earlier result as it is on screen now (11416-11426) | `sources` list per frame (timeline.ts:32) | differs |
| `resultNow`: earlier result's token, or its value tokens, or its fold chip once folded (11432-11441) | none (no folding) | missing |
| `shapeOf`: structural shape used by the faded-repetition rule (11444-11447) | none | missing |
| `pulseToken`: earlier result pulses `scale 1.15 → 1` on `land` (11449-11453) | none | missing |

### 6b.5 Calculation line choreography: `lineActions` (old 11461-11761)

Layout: every token of the line is built hidden at once ("nothing on it ever moves"); a line is
`[label] t1 op t2 ... [= v1 op v2 ...] [= result]`; wraps after the products on a second row indented 1.5 em.

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| A lone product ("1·1·2·1") is one term whose numbers travel as one group; other top ops split into terms (11466-11468) | det2/sarrus each product is its own note line (timeline.ts:163-164, 240) | differs |
| Faded repetition: a line whose shape was seen → all its dwells × 0.5; a term whose shape was seen → its dwells × 0.5 and it *leads* instead of getting its own highlight (11473-11485, 11604) | none | missing |
| Values row ("= 6 − 4") exists when the line has >1 term and at least one product; result shown when no `rhs`, `result !== false`, and >1 term or a product (11500-11501) | det2: third line "6 − 4 = 2" as a separate note (timeline.ts:195) | differs |
| Optional `label` token before the line (e.g. "köşegende yok:"), drawn with the line (11513-11516, 11590) | none | missing |
| `rhs`: line ends "= 0" (formatted) instead of its value; `data-fold="none"`; opens an equation chain (11538-11561) | none | missing |
| Fold metadata: `data-chip` = term texts joined when no result; `data-chip-label` = `line.chip` ("artılar" / "eksiler") (11558-11563) | none | missing |
| `into` label: reserved in `labelWrites` so the scene fit leaves room from the start, template `{v}` wrapped in `<span class="st-hl-result">` (11570-11574) | none | missing |
| `markTarget`: `into` cell gets `is-target` (ring `--stroke-ring` `--color-ok-edge`, old.css:1308) from line start (11575-11577) | none | missing |
| `markUsed`: at collect/write, clear marks, re-mark target, every own cell lit in its role colour (the diagonals stay lit) ; a line from earlier results only keeps current marks (11578-11586) | marks accumulate per frame via `withMarks` (timeline.ts:153-156) | differs |
| Action **line** (dwell T.line 200 / reveal 150): build (wrap per plan), `pushWorkLines` with planned layout, draw the label, register the result element, mark target (11587-11596) | `Rise`: whole note line rises 8 px + fades on `teach` 0.72 s (Stage.tsx:11-24, 357) | differs |
| Action **highlight** per term with sources (not leading): sound `teach.select` (→ `select`), clear marks + target if the term has cells, mark each cell in its role colour, pulse earlier-result tokens; dwell T.highlight 450 / 350, × repeat factors; the floor of a highlight is its whole dwell (11606-11623, 11240) | marks appear with the frame; no select sound for highlights (LessonPlayer.tsx:97-100) | differs |
| Lead (later/repeated terms; reveal: every term after the first or without cells): highlight runs inside the carry action, chips wait `T.lead` 250 (×1.6 = 400) / 100 (→ 160) before leaving (11604, 11643-11645) | none | missing |
| Action **carry**: show the term's operator; leaves with no source (literals) draw in place with their operator; each source chip `carry`s into its own slot (own part of a product), stagger `T.carryStagger` 180 (×1.6 = 288) / 60 (→ 96); chip kind = colour of the source work token, else role chip; on landing draw the slot with its operator; returns `lead + (n−1) × stagger` so settle starts after the last departure (11642-11669) | each source cell chip flies into the n-th digit token of the newest line, 110 ms apart, `teach` spring, chip lands via `onArrive` (epsilon 0.5) or fallback timer 720 ms; following tokens fade in after the last (Stage.tsx:173-241) | differs |
| Crossing group: when chips' left-to-right order would swap, all leave together `sideways` (x first on `carrySide`, y delayed 200 ms / sx) instead of staggered (11651-11663, 10873-10881) | none (chips can cross) | missing |
| Carry dwell: product in a valued line (teach) → T.carry 200, else T.value 580 / reveal 300 (11642) | 900 ms frame | missing |
| Action **value** (teach family only): only the last term writes the whole values row "= v1 − v2" in order (Eren 2026-10-29: "3·2 − = 6" was a false statement); earlier terms return `true` with nothing drawn, so their 580 ms dwell still runs (11625-11639, 11670) | values are part of each product's note line from the start ("3 · 2 = 6") | differs |
| Oddity: a non-last term's `value` action changes nothing but returns `true`, so it costs `T.value` 580 ms (×0.5 if faded) of empty wait (11631) | n/a | n/a (note) |
| Reveal `valueOnLanding`: no value action; the values row is written when the last chip of the last term lands (`holdTeach` keeps the runner) (11640, 11655-11667) | none | missing |
| Action **collect** (dwell T.collect 640 / 350, ×line repeat): `markUsed`, then `collectInto` = sound `teach.merge` (→ `merge`), draw "=" and result (opacity on `draw`, no chip crosses the line) (11672-11678, 10966-10972) | sound `merge` on the frame whose `result` changes; result slot `Rise`s (LessonPlayer.tsx:97-99, Stage.tsx:296) | differs |
| Collect with `rhs`: show "="; if `rhsFrom` names a scene label, the 0 is carried from it as a `result` chip, else drawn in place; dwell `T.collect` not multiplied by the repeat factor (oddity) (11679-11692) | none | missing |
| Action **write** (dwell T.write 600 / 350): into a cell: `result` chip from the result token to the cell, `setCell(..., {land: true})`, `describeMatrix`, drop `is-target`, mark `is-result` (green fill `--color-ok-fill`, old.css:1311-1315); into a label: label text set at once with the value slot at opacity 0, chip lands on the slot's own box (one readable copy) (11693-11702, 11727-11761) | `result` string shown in the scene's result slot when the frame arrives (timeline.ts:196, Stage.tsx:292-298) | differs |
| `given: true`: the whole line becomes one `given` action (dwell `TEACH.line` 200, teach table even in reveal: oddity): run all non-highlight actions, land them at once except what was already on screen (keeps gliding), then fade the new line in on `fade` after `leaveHead + glideHead` = 210 ms if something was still gliding; runner held until it is in (11705-11725) | none | missing |
| `writeInto` guards: no source element → no write (`false`); missing target cell/label → release hold, `false` (11727-11752) | n/a | missing |

### 6b.6 Equation chains: `equationActions` (old 11763-11883)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| `equationTokens`: split at spaces outside parentheses ("(k − 3)(k + 2) = 0" → 3 tokens) (11764-11778) | `equation` beat: each line is one TeX note `$…$` (timeline.ts:363-365) | differs |
| `sidesOf`: side of the last "=" and sign (the operator before it) per token (11781-11788) | none | missing |
| Token kinds: operators and 2+-letter words uncoloured; last equation's tokens `sum` (result colour); others the line role's colour (11802-11808) | untinted TeX | missing |
| First equation is a `line` action, the rest `rewrite`; dwell: last → T.collect 640 / 350, else T.rewrite 700 / 420 (11817) | one 900 ms frame per line | differs |
| Rewrite: tokens of the line above (visible, non-operator) form a pool, latest first; each new token matches by exact text, else by text without its leading minus; matched tokens keep the colour they came from (except on the result line) (11818-11840) | none | missing |
| A matched token whose centre is within 4 px horizontally and did not change side is written in place, no flight ("= 0" under "= 0") (11843-11845) | none | missing |
| Side change with sign change: chip leaves showing the old sign ("−16") and swaps to the new one ("+16") at `TEACH.flip` 0.2 of the flight (swapAt = 0.2 × 650 / slow) (11841-11846, 10868-10869) | none | missing |
| Kind: last equation's chips `result`, else the source token's colour (11846) | none | missing |
| Flights that would cross go one at a time (next leaves `carryStagger` after the previous lands); others leave `n × carryStagger` apart; unmatched tokens draw once all carried ones have landed (11847-11880) | none | missing |
| No flights → everything draws at once (11853-11856) | n/a | missing |

### 6b.7 Layout planning (old 11877-11996)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| `planLayouts`: before the first line, every line of the beat is built and measured invisibly in the work area (probe at the current or given font) (11886-11903) | `reserve` = most notes any frame shows; min-height `reserve × 31 px` (Stage.tsx:96, 353) | differs |
| Wrap decision: a breakable line wider than `workRoom()` (+0.5 px) wraps values/result to a second row, only when `workWrap` is on (11916-11920) | notes never wrap by plan (`display: block`, centred) (shell.css:734-748) | missing |
| `atFloor`: when wrapping is off, the line is re-measured at the floor font `--text-ui` 15 px (class `.st-work__probe--floor`, old.css:1444) to decide if the transport must move to the top corner (11905-11918) | none | missing |
| Chain "=" column: every line of a chain shares the column of its last "="; a one-row "= 0" line before a chain joins it; dropped if any chain line would then exceed the room (11928-11951) | none | missing |
| One block width for the whole beat (max width incl. margins, capped at room), stored in em of the work font so it scales with `fitWork`; `workPlanEm` = widest line (sets the work font once per beat) (11952-11958) | none | missing |
| `applyLayout`: margin-left (chain column) on row 0, min-width = block − margin − indent, inside the FLIP mutation (11960-11969) | none | missing |
| `deriveActions`: compile all lines with shared results/shapes/terms; `deriveMats` reset in `finally` (11972-11980) | n/a | n/a |
| `freshWork`: the beat's first action first ghosts every visible token out (`ghostToken`), empties the work area, resets `workPlanEm`, plans layouts, then runs (11983-11996) | new frame list replaces notes; old note lines unmount without exit motion | differs |

### 6b.8 Recipes (old 11998-12039)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| `det2({mat, i0, j0, into, values, result, rhs, rhsFrom, then})`: one line `(a·d)[row] − (b·c)[col]`, sub-block offset i0/j0, declared values for symbolic entries, then lines (equation chain) (12005-12012) | `det2(matrix)`: 3 frames: main diag marked row + note "a · d = v"; other diag marked col + note "b · c = v"; note "v1 − v2 = r" and result; symbolic: only result "ad − bc" (timeline.ts:158-202) | differs |
| det2 teach choreography: line 200 → highlight main (select, row marks) 450 → carry 2 chips 288 apart, dwell 200 → value (empty) 580 → highlight other (clear, col marks) 450 → carry "−" + 2 chips, 200 → value "= v1 − v2" 580 → collect (both diagonals lit, merge, "= r") 640 → [write 600]; each dwell raised to its reading floor | frame 1 (land) 900 → frame 2 (land) 900 → frame 3 (merge) | differs |
| det2 reveal (right answer): line 150 → highlight main 350 → carry (on last landing nothing) 300 → carry other with 160 lead and select inside, values row on landing, 300 → collect 350 → [write 350]; budget 14.9 s | same frames as entry | missing |
| `sarrus({mat, copy, into, only, plus, minus, result, rhs, rhsFrom, given, then})`: column copy matrix `copy` (cells j ≥ 3 map to it); line "plus" (role row, chip "artılar") = sum of the 3 down-right products; line "minus" (role col, chip "eksiler") = 3 down-left; final line `@plus − @minus` with `into`; `only` keeps one side; `given` lists sides known from earlier steps (12020-12036) | `sarrus(matrix)`: extended copy rises in; 3 "+ a · b · c = v" notes (row) then 3 "− …" notes (col), each marking its diagonal; final single note "P − M = det" + result (timeline.ts:204-269) | differs |
| Sarrus faded repetition: plus terms 2-3 lead (×0.5 dwells); minus line has the same shape → whole line ×0.5 and every term leads; final line pulses the two side results (`pulseToken`) and carries them (11473-11485) | each diagonal is a full 900 ms frame | missing |
| Sarrus fold: with > `workMax` lines, older lines fold into chips "artılar: 24" / "eksiler: 8" (labels from `line.chip`) (11563, 12026) | notes cleared/replaced at the final frame (timeline.ts:265) | differs |
| Current-only kinds: `expand` (row/column marked, then one "± a · Mij" note per entry, ok-tone mark), `area` (unit square image), `frames`, `equation`, `rowOps` (two frames per op with label `R_i → …` in TeX) (timeline.ts:271-365) | — | n/a (current additions; old used `script`/legacy beats for these) |

### 6b.9 Paced actions: free frames on the runner (old 12041-12215)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| `pacedWork`: a frame's work replaces the last line when that line is labels-only, the new one is labels-only, the old is empty, or the new text extends the old; else it is pushed below (intermediate results stay) (12048-12058) | `frames` beat: note appended, or all notes cleared on `clear` (timeline.ts:355-361) | differs |
| `setOnLanding` / `landSet`: a chip carrying into a cell writes that cell's next non-blank `set` on contact; that set is skipped at its own cue, so the cell never shows old text, "?" or blank under a landed chip (12060-12083) | none | missing |
| `joinOp`: numbers flying into one token are joined with "·" unless their sum (not product) equals the token's value → "+" (12086-12092) | none | missing |
| Frame → up to 6 actions in teaching order: line, highlight, carry, combine, collect, write (12094-12099) | one frame = one state | differs |
| `endMarks` appended unless `endMarks: false` (12102-12103) | none | missing |
| Each work frame counts as one line for the block width (`widthOnly` layout) and adds 1 to `pacedLines` (12104-12107) | none | missing |
| A `sum` token right after "=" (index ≥ 2) becomes a collect: hidden with its "=", revealed by a `collect` action after the line (12113-12125) | none | missing |
| **line**: dwell T.line if anything visible, else 0 (12126-12130) | — | missing |
| **highlight** (dwell T.highlight): clear if `frame.clear`, marks on matrices this frame does not write; ordered before the line unless numbers fly into the new line ("cells first, then the words about them") (12131-12145) | marks and note appear together | differs |
| Marks on matrices the frame writes (`late`) wait for the write action (12133-12134, 12210) | none | missing |
| **carry** (dwell T.carry if any merge into a work token, else T.value): plain reveals drawn; chips grouped by target; a work token receiving several chips is opened into parts (`openSlot`, `data-final` keeps the declared value); chips `carryStagger` apart across all groups; returns `(n−1) × stagger`, or `false` if nothing moved (12146-12191) | none | missing |
| **combine** per merged work token (dwell T.value): parts fade out on `leave`, then the final value draws on `draw`; line glides to the new width (12192-12197, 10915-10937) | none | missing |
| **collect** per collected ref (dwell T.collect) (12198-12200) | none | missing |
| **write** (dwell T.write): remaining sets with `land`, `describeMatrix`, label with `land`, late marks (12201-12212) | none | missing |

### 6b.10 Compile, plan work, fold chips (old 12217-12338)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| `compileBeat(beat, family, mats)`: ctx `{T: teachTimes(family), layouts, mats, pacedLines, labelWrites}`; actions carry `layouts`, `pacedLines`, `labelWrites`; `null` → legacy timed beat (12222-12231) | `compile(lesson, beat)` → frames (timeline.ts:375-379) | differs |
| `teachActions`: `sequence` flattens parts (legacy parts inside a sequence are dropped: `|| []`, oddity), recipes, `derive`, `paced`; else null (12234-12240) | `sequence` recurses; unknown kinds show their end state only (timeline.ts:366-371) | differs |
| `stepMats(step)`: matrices as the step's scene will load them (`step.state` overrides) for planning before the scene exists (12243-12249) | lesson matrices are static | n/a |
| `workRowsOf`: rows a beat writes in total (wrapped line = 2, + paced lines) and its tallest line, measured at `var(--work-text)` = clamp(17px, 6cqw, 24px) (12255-12266, old.css:579) | `reserve` = max notes count (LessonPlayer.tsx:161) | differs |
| `foldChipsWidth`: widest fold chip ("label: result") the step's beats will make, measured hidden (12269-12291) | none | missing |
| `planWork`: workHeight = 2·pad-y 7 + lines × line-h 34 + gaps 4 (+ fold row 22 + 4); cell size = (stage h − work − stage-gap 12 − space-xl 24) / (rows + 0.8); rows = tallest matrix, min 2 (12300-12309, old.css:571-580) | `fitCell`: cell = probe 64 × min(free w / natural w, free h / natural h), clamped 30-88 px; notes reserve 31 px per line + 12 gap (Stage.tsx:94-139) | differs |
| Wrap off when a wrapped line's second row would push cells below `--cell-min` 28 px (12318-12322, old.css:664) | none | missing |
| `is-transport-top` on the stage when a one-row line cannot clear the transport even at 15 px (12324) | none | missing |
| Open lines = min(needed, 5), reduced while cells < 32 px, never below the tallest line (12325-12326) | all notes shown | missing |
| `is-fold-side`: no room for a chip row (3×3 on a small phone) → fold chips park in a column at the stage's top-left corner, `--fold-side-w` = widest chip (12327-12334, old.css:1465-1473) | none | missing |
| Sets `--work-lines` and `--work-fold` before the scene fit, so the work area never grows during a step (12335-12336, old.css:611-618) | min-height reserve, same intent | differs |

### 6b.11 Legacy cue-timed beats `BEATS` (old 12340-12733)

Cue times are ×`cue` tempo (teach class 2.4 → 650 ms reads as 1560 ms on screen) and every `cue` passes the
`CueGate` reading floor. `clock.after` inside a cue is a plain stagger (also ×tempo).

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| `readEntry({mat, i, j})`: t0 row i `is-row`, work label "{i+1}. satır" (a); 650: col j `is-col`, work "{i+1}. satır ve {j+1}. sütun"; 1250: clear, cell `is-result`, cell `scale 0.7 → 1` on `land`, work "a<sub>ij</sub> = v" (sum) (12342-12359) | none (no such beat kind) | missing |
| `multiply({a, b, c, i, j})`: work "a·b + a·b + … = sum" all hidden; target cell emptied and `is-target`; row i of a `is-row`, col j of b `is-col`; per k at 380 + 520k: "+" shown, a-cell flies (`row`) into its token; 90 ms later b-cell flies (`col`), then "·" and b drawn; at 380 + 520n + 260: "=" and sum; +380: sum token flies (`result`) into the cell, `setCell` land, `is-target` → `is-result` (12361-12411) | none | missing |
| `rowOp({mat, source, target, factor})`: source row `is-row`; label "R<sub>t</sub> → R<sub>t</sub> ± |f|R<sub>s</sub>"; 420: copies of source cells drop to 1.3 × target-row height below the target row on `teachY`, 60 ms apart; 1250: chip text → scaled value, `scale 0.7 → 1` on `land`; 1750: target row `is-result`, chips rise on `teachY` into the target cells, each cell written on its own chip's contact (`landChip`), describe on the last (12413-12467) | `rowOps`: frame 1 label + marks (target row, source col tone), frame 2 rows replaced and changed rows `ok` (timeline.ts:317-351); no chips | differs |
| Bug: `rowOp` adds raw cell values (`value + scaled[j]`); a symbolic cell concatenates strings (12416-12417) | exact rationals; non-numeric matrices skip the beat (timeline.ts:320) | n/a (note) |
| `minor({mat, i, j})`: pivot cell `is-pivot` (ink fill, surface text, old.css:1321-1325); label "a<sub>ij</sub> = v"; 450: rest of row i `is-struck` (muted, pen line); 800: rest of col j struck; 1250: remaining cells `is-col`, work "C<sub>ij</sub> = (−1)<sup>i+j</sup> M<sub>ij</sub>"; 2050: "C<sub>ij</sub> = ± (a·d − b·c) = value" for a numeric 3×3 (else "± M<sub>ij</sub>"), sign token `scale 0.5 → 1` on `land` (12470-12511) | `minor`: frame 1 row and column `strike` tone; frame 2 lifted "M<sub>ij</sub> = |…|" beside the matrix (timeline.ts:310-316, Stage.tsx:324-329); no cofactor sign or value | differs |
| `rowSwap({mat, a, b, note})`: row a `is-row`, row b `is-col`; label "R<sub>a</sub> ↔ R<sub>b</sub>"; 450: every cell of both rows flies at once to the other row (a's as `row`, b's as `col`), source cells blanked at lift-off; after all 2n land: both rows written, marks swap colours with the numbers, optional note (sum) (12514-12540) | `rowOps` swap: two frames, rows replaced in place (timeline.ts:327-347) | differs |
| `rowScale({mat, row, factor, note})`: row `is-row`, label "R<sub>r</sub> → fR<sub>r</sub>"; 700: cells rewritten in place 90 ms apart (land, no chip); 700 + 90n + 200: row `is-result`, note (12543-12560) | `rowOps` scale: two frames | differs |
| `transpose({mat, into})`: `into` emptied; label "satır → sütun"; row i at 350 + 750i: row i `is-row`, cells fly (`row`) to `into(j, i)` 35 ms (on-screen, `chromeDelay`) apart; each landing writes the cell and adds `is-col` (12563-12580) | none | missing |
| `script({frames})`: free frames at `at` ms: clear, marks, work, set, label, fly, reveal (12582-12587) | `frames` beat: marks + note only (types.ts:70) | differs |
| Script volleys: a fly-only frame closer than `floorValue` 400 ms (on screen) to the previous fly frame is re-timed to `lead + sibling × 35 / tempo` (12590-12606) | none | missing |
| Bug: the volley lead is `at` of the previous fly frame and is tested for truthiness, so a fly frame at `at: 0` never leads a volley (12594-12603) | n/a | n/a (note) |
| Script frame order: clear, marks, blank sets, work, reveals, flights first; then non-blank sets and the label at `drawIn + DRAW_READ` (118.7 ms) of the new line, or `leaveHead` 120 ms when the frame has other head moves, else immediately; a label written with a new line is its own cue one frame (16.7 ms) past half ink (12614-12643) | none | missing |
| `flyFrame` product: several chips into one work token: room for the joined factors ("0·(−5)") is reserved as they lift off (FLIP min-width, line glides once during flight); each landing shows the partial product ("1", then "1·4"; negative factors after the first parenthesised); once all landed and the line stopped gliding (poll 16 ms), after `floorValue` 400 ms the token becomes its declared value; the gate's `pending` holds the next cue meanwhile (12645-12710) | none | missing |
| Single flights: into a work token → reveal on landing; into a cell → its next frame's set written on contact (`setOnLanding(f + 1)`, since this frame's own set already ran) (12711-12729) | none | missing |
| Oddity: `pacedActions` looks for the landing set from the same frame `f`, `script` from `f + 1` (12181 vs 12720); intentional (paced runs sets after flights), keep both | n/a | n/a (note) |

### 6b.12 End marks and answer labels (old 12731-12775)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| `endMarks`: if the last marking frame uses one class and no later frame clears, a final frame at `max(at) + 600 ms` re-marks every cell of the last run of same-class frames (the three diagonals of a sum, not only the last) (12736-12757) | sarrus/det2 `withMarks` accumulates within a side (timeline.ts:235-239), but `frames` beats do not | differs |
| `answerLabels(step)`: after the reveal is idle (`whenIdle`, poll 50 ms) and still on the same answered step, every scene label ending in "?" gets the right answer as `<span class="st-hl-result">` (ok ink, bold, old.css:1679-1682), written with `land`; only for numeric answers (`/^−?\d+([.,]\d+)?$/`) (12763-12775, 12886-12890) | scene `result` slot shows `scene.result ?? '?'` until a frame sets `result`; tinted `--color-ok-ink` when done (Stage.tsx:292-298, shell.css:730-732) | differs |

### 6b.13 Tempo classes (old 12777-12862)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| `frameMoves`: per frame, each fly target → `copy` (into a cell), `product` (>1 chips into one token) or `carry`; a work text with "=" and an operation (`CALC` regex) → `calc` (12786-12802) | none | missing |
| `beatMoves`: script/paced → frame moves + `write` if a cell gets a letter/digit no chip carries; `readEntry` → none; other beats → `type` (+ `:letters` if `values` contain a letter) (12808-12823) | none | missing |
| Oddity: `:letters` is read from `beat.values` only, so a symbolic `sarrus` (uses `plus` / `minus`) or a `derive` never counts as a distinct move (12821-12822) | n/a | n/a (note) |
| `tempoClass`: `beat.tempo` overrides; else no moves → `quick`; every move already played earlier in the lesson (steps before, and for a reveal its own entry beat) → `repeat`; else `teach`; a wrong answer turns a `repeat` reveal into `teach` (12829-12842) | none: one tempo | missing |
| `tempoLog` per played beat {step, name, cls, at} (QA hook) (12845) | none | n/a |
| `useTempo(name)`: sets `channelPace[name]` before anything is scheduled (12848-12853); also called on step entry before the 420 ms `beatDelay` (13792-13793) | none | missing |
| `answeredRight`: choice → option.correct; keypad → `Number(answered) === answer` (12856-12860) | `checkKeypad` / option key (LessonPlayer.tsx:177, 289) | differs (owned by section 7) |

### 6b.14 `playBeat` (old 12864-12891)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| Channels: entry beat on `beat` (İleri lands it first), reveal on `reveal` (never holds up Devam) (12777-12781) | one channel `lesson` for both (LessonPlayer.tsx:24) | differs |
| Compiles with family `reveal` for reveals, `teach` otherwise; a right-answer reveal gets deadline `revealTapAt + 16000 − 1100` (tap time; a revisit counts from now); `revealTapAt` reset (12866-12872) | none | missing |
| Runner beats start through `freshWork`; legacy beats run inside a new `CueGate` registered in `cueGates`, `cueGate` reset in `finally` (12873-12884) | none | n/a |
| After a reveal: `answerLabels` once idle (12885-12890) | none | missing |
| Entry beat starts `chromeDelay(beatDelay 420 + delay)` after step entry (13793) | first frame shown at once (`startAt = 1`), next after 900 ms (LessonPlayer.tsx:61) | differs |
| Reduced motion: no special path in this region (engine-level; section 1) | all frames shown at once (`startAt = frames.length`) (LessonPlayer.tsx:61) | differs |
| Sounds fired here: `teach.select` per highlight, `teach.land` per carried chip landing (in `carry`), `teach.merge` per collect (11608, 10858, 10968); mapping to `select` / `land` / `merge` (6497) | `land` per frame (with frame index), `merge` on a frame that changes `result` (LessonPlayer.tsx:97-100); no select on highlights; no per-chip land | differs |

### Port notes

- The heart of the old system is **reading-floor pacing**, not fixed times: the next action never starts until
  what the previous one made readable has been still for 1000 + 200·words ms (400 ms for one value in place),
  measured from the moment the words passed 50 % opacity. Porting only the TEACH dwell numbers without the
  floor measurement loses the meaning. Our `StageState` frames could carry a declared "new words" count instead of
  measuring the DOM, but the floor rule itself must survive.
- **Dwells are on-screen ms; leads, staggers and springs scale with pace.** With pace 1.6 the visible stagger is
  288 ms, the lead 400 ms, a carry about 0.96 s. Mixing those two kinds of time is the most likely porting error.
- **Values row discipline** (Eren 2026-10-29): "= v1 − v2" appears only once every product is on the line; never
  write a value before its operands. Current det2 writes "a · d = v" on one note at once, which is fine as a
  single product, but the combined line form "a·d − b·c = v1 − v2 = r" with carried values is the old design.
- **Nothing on a line moves**: all tokens are laid out hidden at line start; equation chains share their "="
  column; block width is fixed per beat; the work area height is reserved per step (planWork). Current
  `reserve` covers height only.
- **Reveal after a right answer is a confirmation**, not a re-teach: its own timing family, leads instead of
  highlights, values on landing, and a 14.9 s target that trims only dwell above floors. A wrong answer plays at
  the teaching pace (and a `repeat` reveal is upgraded to `teach`). The current app replays identical frames.
- **Tempo class is inferred from the beat** (`quick` / `repeat` / `teach`), never per lesson; `beat.tempo`
  overrides. Needs a per-lesson "moves seen" pass in step order.
- **Transport**: pause takes effect after the current action; resume continues; replay on finish; stage taps also
  answer (pause/resume, land a right-answer reveal while staying on the step, or nudge the icon). Current app has
  only replay-after-finish and hides it for one-frame beats.
- **Sounds**: select on each highlight, land on each carried chip, merge on each collect. Current fires one sound
  per frame.
- Old oddities not to copy blindly: empty 580 ms `value` dwell for non-last terms; `given` uses the teach `line`
  dwell in reveals; `rhs` collect ignores the repeat factor; `Runner.share` assigned but unused; volley lead at
  `at: 0` ignored; `:letters` only from `values`; legacy beats show "replay" while still playing; `rowOp`
  string concatenation on symbolic cells; `TEMPO` constant unused.
- Could not determine from old.js: the transport button's markup and class list (assumed `.st-icon-btn
  .st-replay`, 48 px); the exact helpers' visuals (`carry`, `fly`, `landChip`, `ghostToken`, fold chips) belong to
  section 6a; how `lesson.answered` and `revealTapAt` are set (section 7).

## 7. Lesson chrome and answers (old 12896-13600, 14411-14446; CSS old.css 900-947, 1120-1180, 1615-1915, 1967-1978, 2005-2015, 2185-2440)

Shipped build note: the old page ran with every feel flag on (`FEEL_FLAGS`, old.js:8061), so several engine
defaults below are replaced by feel-layer slots (old.js:8721-8730): `sheetMascot`/`sheetReact` (duo in the sheet,
section 3), `answerFx` (no-op: the answer sparks never ship), `endScene`/`endNarration` (section 8.4-8.6),
`beforeEnd`/`stepEyebrow` (section 4). Rows mark which version Eren actually saw.

Key old constants used here (old.js:8836-8860): `CHOREO.stagger` 35 ms, `beatDelay` 420, `revealDelay` 160,
`correctDelay` 220, `sheetDelay` 380, `mascotDelay` 140, `cellStagger` 80, `idlePoll` 50; `SHIFT` narr 14,
dock 16, count 6, scene 10; `ENTER_FLOOR` 0.35. Springs: `move` k700/ζ0.9 (0.237 s, bounce 0.10), `ui`
k1400/ζ0.9, `fade` k1600/ζ1, `land` k400/ζ0.6, `shake` k1300/ζ0.2, `draw` k200/ζ1.

Old palette values quoted as light / dark (old.css:38-143, 253-359). Current colours are oklch tokens in
`src/styles/tokens.css`, aliased in `src/shell/shell.css:6-31`.

### 7.1 Lesson layout and top bar

| Old (what + values + lines) | Current (file:line or "none") | Status |
| --- | --- | --- |
| `.st-lesson` grid: rows `--top-h` 48 px / stage `minmax(150px,1fr)` / narr auto / dock auto; one fixed screen, never scrolls (old.css:1121-1125) | `.ls-run` flex column, gap 12, fixed inset, max 440, padding safe-area/16 (shell.css:534-546); narration scrolls (`.ls-narr overflow-y:auto`, shell.css:604-612) | differs |
| View: max-width `--view-max` 440, gutters `max(16px, safe-area)`, bottom padding 12 (old.css:844-853) | same 440 / 16 px; bottom `max(12px, safe-area)` (shell.css:534-546) | same |
| Landscape ≤520 px high: two columns (stage left 1.15fr, narr+dock right 1fr), max 920 (old.css:1980-1993) | none | missing |
| Short portrait ≤600 px high: narration padding 8, unclear margin −8, body margin-top 4 (old.css:1967-1978) | none | missing |
| `.st-top` flex, align center, gap 12 (old.css:1126-1131); touch mode pulls adjacent icon buttons to 8 px gap (old.css:2218-2221) | `.ls-top` grid `44px 44px 1fr auto`, gap 4 (shell.css:547-552) | differs |
| Icon buttons (close, back): 48×48 (`--hit`), radius 12, transparent, SVG icon 22 px stroke 2.2 (old.css:934-947, 870-878) | `.ls-top__btn` 44×44, radius 14, text glyphs "✕" and "‹" at 1.3rem/600 (shell.css:553-566; LessonPlayer.tsx:192-203) | differs |
| Close: opens the map (Escape key too, old.js:14441); during the secret moment it is "Geç" (section 4) | `<Link to=returnTab>` aria "Dersten çık" (LessonPlayer.tsx:192) | differs (no key) |
| Back chevron `syncBack`: shown on every step after the first, hidden on the lesson end screen; hidden = `visibility:hidden` + `disabled`, keeps its place so the bar never moves (old.js:13040-13045, old.css:1133-1135) | always visible; `disabled` at index 0, colour `--sh-line` (LessonPlayer.tsx:195-203, shell.css:567-569) | differs |
| Back on the end screen: returns to the last step (old.js:13801-13804) | no end screen | missing |
| No Geri in the dock: the chevron is the one back location (UC-D10, old.js:12999-13001, old.css:2378-2383) | same: no Geri in dock | same |
| Keyboard: ArrowRight = `next()`, ArrowLeft = `back()`, Escape = map; ignored when the lesson view is inert (old.js:14438-14443) | none | missing |
| Bug: ArrowRight on an unanswered question calls `next()`, which moves on: a question can be skipped by keyboard (its end cell shows "–") (old.js:13780-13798) | n/a | n/a |

### 7.2 Progress bar and counter

| Old (what + values + lines) | Current (file:line or "none") | Status |
| --- | --- | --- |
| One segment per step (`.st-progress__seg` + `.st-progress__fill`), height 6 (`--progress-h`), flex 1 (old.js:13063-13075, old.css:1136-1166) | one continuous bar, fill `width:%` (LessonPlayer.tsx:204-216, shell.css:570-582) | differs |
| Segments touch (gap 0, UC-D11); only bar ends and the midpoint gap are rounded (old.css:2384-2405). Earlier gap 4 / dense 2 rules are overridden, so `DENSE_PROGRESS = 12` and `.is-dense` are dead (old.js:13060, old.css:1142) | n/a | dropped (dead in old) |
| Midpoint mark: extra `margin-inline-start: 4px` before step `floor(n/2)`, so the bar reads as two halves (old.js:13048-13050, 13066-13070) | none | missing |
| Oddity: `midpointOf` doc says "first 'Sınav tipi' step"; code is always `floor(n/2)` (old.js:13047-13050) | n/a | n/a |
| Track: `--color-soft-strong` (#e0ddd7 / #33312c) at opacity 0.55 (old.css:1150-1157) | `--sh-soft` = `--surface-sunk`, full opacity (shell.css:570-576) | differs |
| Fill: `--color-action` (#29354d / #cedffd); current step opacity 0.45, done steps 1; opacity change is a CSS fade 160 ms `cubic-bezier(.2,0,0,1)` (old.css:1158-1169) | `--sh-action`, one opacity; current step counts as filled (width (i+1)/n) | differs |
| Fill motion: `scaleX` 0→1 on `move` spring, origin left, stagger 17.5 ms per changed segment (stagger/2); back drains segments (old.js:13078-13094) | width jumps, no motion | missing |
| Counter: "B2 · " in `#count-lesson` + rolling "7/18" in `#count`; min-width 66, right aligned, 14 px medium, muted, tabular, nowrap (old.js:13095-13101, old.css:1170-1182) | "{node} · 7/18" in one span, min 4.5em, 0.82rem/600, letter-spacing .02em, `aria-hidden` (LessonPlayer.tsx:217-219, shell.css:583-591) | differs |
| Counter roll: on change, opacity 0 + y `6×direction` → 1/0 on `move`, after the step delay (old.js:13097-13101) | none | missing |
| Counter on end screen shows n/n (old.js:13096) | no end screen | missing |
| Progress semantics: none on the old element (no role) | `role="progressbar"` with aria values and label (LessonPlayer.tsx:206-210) | differs (current better) |
| Lesson-end ripple: each fill gets `scaleY` velocity 9 on `land`, staggered 23.3 ms (stagger/1.5), starting 70 ms after the end screen (old.js:13104-13108, 13731) | none | missing |

### 7.3 Narration

| Old (what + values + lines) | Current (file:line or "none") | Status |
| --- | --- | --- |
| `.st-narr` padding-block 12; `.st-narr__row` flex space-between, gap 8, min-height 24 (eyebrow + unclear button) (old.css:1615-1626) | `.ls-narr` grid gap 8, scrolls (shell.css:604-617) | differs |
| Eyebrow: 14 px / 17 px line, semibold, muted, sentence case (old.css:1627-1633) | 0.8rem, 600, letter-spacing .04em, UPPERCASE, muted (shell.css:618-625) | differs |
| Eyebrow source: `feelSlot('stepEyebrow')` (section 4: "Artık yapabildiğin" on pay-off steps) (old.js:12922) | `step.eyebrow` (LessonPlayer.tsx:234) | differs |
| Midpoint line: eyebrow prefixed "Yarısı bitti · " once per page session per lesson, only when walking forward one step onto `floor(n/2)` of a lesson not yet done; silent (old.js:12924, 13052-13055, 13747-13749) | none (sound `halfway` exists but means half of all lessons, reward.ts) | missing |
| Title: 24 px / 1.2, bold, `text-wrap: balance`, margin-top 4 (old.css:1650-1656) | 1.41rem (~22.6 px), 700, 1.2, letter-spacing −.015em, no balance (shell.css:626-632) | differs |
| `mathTitle`: runs like "A = 0", "det(cA) ≠ c·det A" (terms joined by spaced `= ≠ < > ≤ ≥ + − · →`) wrapped in `.st-math` (nowrap, math font, proportional nums) so math never breaks; skips text already inside a `<span>` (old.js:12903-12919, old.css:1666-1670) | `RichText` handles tone markup only (src/exam/Blocks.tsx:23) | missing |
| Body: 17 px / 25 px, `text-wrap: pretty`, margin-top 8; `<b>` bold; `sup/sub` ≥ 13 px (old.css:1657-1665, 2341-2345) | 1rem (16 px) / 1.5 (shell.css:633-637) | differs |
| Body hidden when the step has none (old.js:12927) | rendered only if `step.body` (LessonPlayer.tsx:238) | same |
| Entry: eyebrow row, title, body each start at opacity 0.35, x `14×direction`, then `move` to 1/0, 35 ms apart (old.js:12896-12901) | none | missing |
| Narration clip (UC-6): when the feedback sheet reaches into the body, the body line the sheet edge would cut is clipped (`clip-path: inset(0 0 Npx 0)`), so a sheet never shows half a line; cleared on removeSheet (old.js:13369-13393) | no overlay sheet | missing |
| Step text scroll reset on step change | `scrollTo(0,0)` per step (LessonPlayer.tsx:82-86) | n/a (current only) |

### 7.4 "Anlamadım" / "Bilmiyorum" control (UC-1)

| Old (what + values + lines) | Current (file:line or "none") | Status |
| --- | --- | --- |
| One quiet button in the narration row; on an unanswered choice/keypad step it reads "Bilmiyorum" (`data-mode=unknown`, never `aria-pressed`); otherwise "Anlamadım" toggle with `aria-pressed` from storage (old.js:12936-12944) | none | missing |
| Style: min-height 48, margin −12 0 (no row growth), padding 0 8, radius 12, transparent, 15 px medium muted; pressed: `--color-soft` bg, ink text (old.css:1634-1649); touch mode: `translate` down by 4 with padding to keep the label on the eyebrow line (old.css:2223-2226) | none | missing |
| Hidden on steps with `hideUnclear` (end screen) (old.js:12928, 13736) | none | missing |
| "Anlamadım" tap toggles `satir.v3.unclear["<lesson>:<index>"]`; no sound, no motion (old.js:14411-14421) | none | missing |
| Label swap after an answer: fade out (`fade`) → change text/mode → fade in, on the chrome channel; labels never crossfade (old.js:12946-12952) | none | missing |
| Oddity: unclear flags and picks are keyed by step index, so editing a lesson shifts them (old.js:12943, 13311) | current records key on step id (progress.ts:60) | n/a (current better) |

### 7.5 Dock and buttons

| Old (what + values + lines) | Current (file:line or "none") | Status |
| --- | --- | --- |
| `.st-dock` grid, gap 8, grid-area dock (old.css:1684-1689) | `.ls-dock` grid gap 8 (shell.css:832-836) | same |
| Dock kinds: `nav` (explain/summary), `choice`, `keypad`, `sheet`, `done`; `data-group` tap budget markup (old.js:12981-13032) | one dock, contents by step kind (LessonPlayer.tsx:279-308) | differs |
| Nav dock: one full-width primary "İleri", "Bitir" on the last step (old.js:13030-13031, old.css:2380-2382) | primary "İleri" / "Dersi bitir" (strings.ts:130,133) | differs (label) |
| nav→nav: buttons stay, only the label changes, no re-entry (old.js:12997-13003) | button re-renders in place, no entry motion | same (visually) |
| `.st-btn`: min-height 56, padding 0 16, radius 16, no border, `--color-soft` bg, 17 px semibold, gap 8 (old.css:901-915); primary `--color-action`/`--color-on-action` (#29354d on #fff / #cedffd on #111318) | `.sh-btn` 56 (`--button-height`), radius 16, 1rem/600, width 100% (shell.css:62-74) | differs (16 vs 17 px) |
| Disabled `.st-btn`: muted text (old.css:930-933) | none | missing |
| Soft İleri (UC-2): while the entry beat plays, İleri gets `.is-soft` (soft bg, ink text; colour fade 160 ms), never disabled; the label stays "İleri"; it turns primary when the beat channel is idle (polled every 50 ms) (old.js:12958-12965, old.css:920-929) | label changes to "Hareketi bitir" while a beat plays (LessonPlayer.tsx:146-151) | differs |
| Two-tap rule in `next()`: first tap while beat cues remain finishes the beat and stops; if only settling motion is left, it lands it and moves on in the same tap; after an answer, Devam lands the reveal and moves on at once (old.js:13780-13798) | first tap finishes the beat, second moves (LessonPlayer.tsx:139-145); no "settling only" case | differs |
| Dock entry: every item from opacity 0.35, y +16, rows grouped by `offsetTop`, 35 ms per row, `move` (old.js:12968-12975) | none | missing |
| Tap feedback: pointer press scale (section 1); keyboard activation (`event.detail === 0`) gets `pulse`: scale 0.96 → 1 on `ui` (old.js:14259-14262, 14425) | `sh-press` (src/shell/press.ts) | differs (see section 1) |
| Touch mode press ink: `--press-tint` = ink 14% over the control, in at 0 s, fades out 160 ms; applies to `.st-btn .st-option .st-key .st-unclear` and others (old.css:2190-2212) | `PRESS.dim` 0.06 overlay (engine/tokens.ts) | differs |
| Touch mode: control text centred on cap height (`text-box: trim-both cap alphabetic`), options padding-top `2×0.06em` (old.css:2231-2244) | none | missing |
| Focus ring: 2 px `--color-focus` (#0961bb), offset 2 (old.css:833-836) | not checked in shell.css for `.ls-*` | unknown |
| One click handler on the lesson view routes by `data-option`, `data-key`, `data-action` (check, next, back, map, next-lesson, restart); disabled buttons ignored (old.js:14422-14437) | per-button React handlers | n/a |

### 7.6 Choice options

| Old (what + values + lines) | Current (file:line or "none") | Status |
| --- | --- | --- |
| `.st-option`: flex, gap 12, min-height 56, padding 0 16 0 12, radius 16, no border, `--color-surface` + `--shadow-raised` (0 1px 2px), 20 px medium, line-height 1, tabular nums, left aligned; bg/colour/shadow fade 160 ms (old.css:1702-1722) | `.ex-opt` + `.ls-opts`: min 52, padding 8 14, 1.5 px transparent border, radius 16, surface + shadow, 1.06rem/500 (shell.css:356-370, 837-841) | differs |
| Oddity: line-height 1 for option text, so a wrapped long option has cramped lines (old.css:1715) | content blocks (`Blocks`) | n/a |
| Key badge `.st-option__key`: 28×28, radius 8, `--color-soft`, 14 px semibold muted (old.css:1723-1737) | `.ex-opt__key` 28×28, radius 8, soft, .85rem/600, ink colour (shell.css:374-384) | differs (colour) |
| Badge letters "ABCD", or "1234" when any option names a matrix (a lone capital A–Z not inside a word, tags stripped), so "B  A" never reads as a product (old.js:12980-12986) | `option.key` from content (LessonPlayer.tsx:179) | differs |
| 2×2 grid (`.st-dock--grid`, 1fr 1fr) when exactly 4 options and every plain text ≤ 7 chars (`SHORT_OPTION`) (old.js:12977, 13009-13012, old.css:1699-1701) | always one column (`.ex-opts` grid) | missing |
| Option text is authored HTML (old.js:13014-13016) | `Blocks` content (LessonPlayer.tsx:180-182) | differs (richer) |
| One try: after any pick all options are disabled (old.js:13253-13258) | retry until right; only the wrong option is disabled (LessonPlayer.tsx:168-177) | differs (decision 0003 keeps retry) |
| Right pick: `.is-correct` (ok-wash #d0eee2 / #152e25, ok-ink #007a5c / #60d7af, 2 px inset ok-edge ring #6ac6a5 / #006f53); key turns ok-fill #1acf9f with `--on-ok` #111318 and its letter becomes a check glyph drawn on `draw` spring (old.js:13263-13268, old.css:1742-1750) | `data-state=right`: 2 px inset `--ok-ink` ring only, letter stays (shell.css:806-808) | differs |
| Right pick swell: `scale` velocity 0.9 on `land`; haptic 12 ms (old.js:13494-13499) | none | missing |
| Answer sparks: 10 particles, speed 0.5, life 650 ms, seeded by `lesson:index` (old.js:13496-13497); disabled in the shipped build (`answerFx: () => {}`, old.js:8728) | none | dropped (old shipped without it) |
| Wrong pick: `.is-wrong` (bad-wash #ffddda / #3d1e1c, bad-ink #b23333 / #ffa098, 2 px bad-edge ring #fc8d85 / #9c3634); key bad-edge bg, ink text, cross glyph drawn (old.js:13270-13271, old.css:1751-1759) | `data-state=wrong`: opacity 0.5, disabled (shell.css:809-811) | differs |
| Wrong shake: `x` velocity 320 px/s on `shake` (k1300 ζ0.2); haptic [24,40,24] (old.js:13502-13505) | none | missing |
| Cause then effect: the right option lights up (`is-correct` + drawn check) 220 ms after the shake (`correctDelay`) (old.js:13276-13278) | right option shown only when revealed | differs |
| Others: `.is-dim` muted text, no shadow (old.js:13257, old.css:1760-1763) | unchanged | missing |
| Revisit (non-animated): marks applied at once, wrong + right both shown (old.js:13272-13275) | revisit shows the question fresh (attempt reset in `go`) | differs |
| "Bilmiyorum" shown state `.is-shown`: right option 2 px inset ink ring, others dim, no glyph, no shake (old.js:13299-13306, old.css:1805-1809) | "Cevabı göster" after a wrong try: right option gets the ok ring (LessonPlayer.tsx:294-302) | differs |
| `.st-option.is-miss` (struck, muted, line-through) used only by the secret moment (old.css:2255-2260) | none | see section 4 |

### 7.7 Keypad

| Old (what + values + lines) | Current (file:line or "none") | Status |
| --- | --- | --- |
| Layout: 6-column grid, gap 8; row 1 = display (span 4) + "Kontrol" primary (span 2, padding 0 8); rows 2-3 = `1 2 3 4 5 6` / `7 8 9 0 − ⌫` (old.js:13019-13027, old.css:1764-1767, 1815-1818) | display full width; 4-col keys `1 2 3 ⌫ / 4 5 6 − / 7 8 9 / / 0 [Kontrol et ×3]`, gap 6 (Keypad.tsx:3, 27-53; shell.css:842-880) | differs |
| Display: min-height 56, padding 0 16, radius 16, surface + raised shadow, 20 px medium, tabular, flex space-between (value left, caret right) (old.css:1768-1786) | `.ls-answer` `<output>` min 52, padding 12 16, radius 16, inset 1.5 px hairline, 1.3rem, centred, no caret (shell.css:846-857) | differs |
| Empty: "Cevap" in muted 17 px (`.is-empty`) (old.js:13023, 13538-13540, old.css:1791-1794) | "Cevabını yaz" muted (strings.ts:138) | differs |
| Caret: static 2×24 bar in ink, always shown until answered (old.css:1810-1814) | none | missing |
| Keys: min-height 48, radius 12, `--color-soft`, 20 px medium (old.css:1819-1829) | `.ls-key` 48, radius 14, surface + shadow (function keys soft), 1.2rem (shell.css:863-876) | differs |
| `aria-label` "Sil" for ⌫, "Eksi" for − (`KEY_NAMES`) (old.js:12987, 13026-13027) | same labels (strings.ts:139-140, Keypad.tsx:38) | same |
| Input: ⌫ removes last char; − toggles a leading minus; digits only while ≤ 4 digits (minus not counted) (old.js:13529-13537) | ⌫ same; − same; "/" adds one fraction bar; ≤ 8 chars total (Keypad.tsx:20-25) | differs (fractions added) |
| Digit tick: value jumps y −6 → 0 on `ui` only when the value grew (old.js:13541-13544) | none; sound `select` on every change (LessonPlayer.tsx:284-287) | differs |
| No keypad sound in old | `select` sound per key | differs |
| Kontrol with empty or "−" value: silently ignored, button not disabled (old.js:13548-13549) | button disabled for "" and "−" (Keypad.tsx:48) | differs (current clearer) |
| Check: `Number()` of the value, compared with `===` to an integer answer ("007" = 7; "−0" = 0) (old.js:13550-13551) | exact rational compare, "-8/6" = "-4/3" (progress.ts:83-88) | differs (current richer) |
| After check: display keeps the value (formatted with real minus), `is-correct`/`is-wrong` colours as options (old.css:1795-1804); all keypad buttons disabled (old.js:13283-13293) | keypad hidden once revealed; wrong try clears the field (LessonPlayer.tsx:281-291) | differs |
| Right: display swells (`land`, velocity 0.9) + haptic 12; wrong: display shakes (velocity 320) + haptic [24,40,24] (old.js:13555-13556) | none | missing |
| "Bilmiyorum": display `.is-shown` (ink ring) with the right value, typed value cleared (old.js:13307-13317) | none | missing |

### 7.8 Answer flow, recording, streak

| Old (what + values + lines) | Current (file:line or "none") | Status |
| --- | --- | --- |
| `settleBeat`: an answer during the entry beat lands the beat on its end state first (old.js:13507-13510) | answering during a beat does not finish it | missing |
| `answerChoice`/`checkKeypad` guard: ignored once `lesson.answered !== null` (rapid double taps) (old.js:13512-13515, 13528, 13548) | buttons disabled after reveal | same (effect) |
| Order on answer: mark dock → streak → record → `answer` event → save pick → swap unclear label → reveal (old.js:13511-13526) | record + sound + state (LessonPlayer.tsx:116-128) | differs |
| `recordAnswer`: append `{lesson, step, result, at}` to `satir.v3.answers` (kept last 500); first result per question this run into `satir.v3.run` for the score (old.js:13427-13437) | first try per step id into the lesson record; later right first try clears an old mistake (progress.ts:90-119) | differs |
| Result tags: `correct`, the option's own `tag` for a wrong choice, `wrong-value` for keypad, `unknown` (old.js:13522, 13560, 13580) | `given` + `correct` | differs |
| `savePick` per question per run in `satir.v3.picks` → a revisit shows the answer read-only with its sheet (old.js:13396-13405) | none: a revisit is answerable again | missing |
| `startRun` clears run and picks and resets the streak (Baştan, next lesson) (old.js:13439-13447) | none | missing |
| Streak `lesson.streak`: +1 per right answer, 0 on wrong or Bilmiyorum; persists across steps in the run (old.js:13520, 13557, 13578) | `run.current` +1 per first-try right, 0 on wrong (LessonPlayer.tsx:118-126) | differs |
| Streak badge in the sheet head "N üst üste" from 3 on (`STREAK_MIN`), ok-fill pill 14 px semibold (old.js:13114, 13180, old.css:1880-1889, 2313-2322) | none | missing |
| Answer sound: `answer.correct` → `correct`, `answer.wrong` → `wrong`, fired 140 ms after the sheet starts (≈520 ms after the tap) by the sheet duo; exactly at streak 3 also `seal.mini` → `streak` and the duo is "proud" (old.js:6495, 7059-7072) | `correct`/`wrong` at the tap; `streak` instead of `correct` for every run ≥ 3 (LessonPlayer.tsx:121-125) | differs |
| Bilmiyorum: no sound, no reaction, no verdict (old.js:7061) | n/a | missing |
| `answerUnknown`: lands the beat, `answered='unknown'`, shows the right answer, streak 0, records `unknown`, saves the pick, sets the step's Anlamadım flag (so the swapped label reads pressed), plays the reveal (old.js:13570-13585) | none | missing |
| Haptics are skipped under `prefers-reduced-motion` and in QA; `navigator.vibrate` does not exist on iOS, so on iPhone the old app had no haptics at all (old.js:9375-9383) | none | n/a (porter: iOS needs another route) |

### 7.9 Reveal and stage room (`reveal`, `reserveDock`)

| Old (what + values + lines) | Current (file:line or "none") | Status |
| --- | --- | --- |
| Timeline after a tap: t0 marks + swell/shake; reveal beat at 160 ms (`revealDelay`, tempo-corrected by `chromeDelay`) on the `reveal` channel and tempo; sheet at 380 ms (`sheetDelay`) (old.js:13324-13332) | reveal beat plays when `revealed` becomes true; no sheet (LessonPlayer.tsx:42-46) | differs |
| `reserveDock` in the tap's frame: measure the sheet invisibly; if taller than the dock, grow dock `min-height` so the sheet never covers the question; binary search (6 passes) for the largest growth that keeps the narration below the top bar, scene objects and work inside the stage and the dock inside the view (old.js:13404-13447, 13472-13480) | none | missing |
| Still no room: `.is-tight` lowers `--cell-min` 28 → 20 px and searches again (small phones) (old.js:13438-13441, old.css:661-668) | none | missing |
| FLIP: scene objects, work line and narration glide from old to new boxes on `move`; scene objects never start outside the shrunk stage (`startInside`); boxes measured at rest (`restingRect`) (old.js:13442-13470) | none | missing |
| Dock sizes that trigger growth: nav 56, keypad ~168, 2×2 grid 120 < sheet 211; 4-row choice 248 does not (computed from the CSS above) | n/a | n/a |
| `removeSheet(release)`: clears the clip, removes sheets, unhides the dock; release also drops `min-height` and `is-tight` (old.js:13395-13402) | n/a | missing |

### 7.10 Feedback sheet (answer card)

| Old (what + values + lines) | Current (file:line or "none") | Status |
| --- | --- | --- |
| Overlay card on the dock's grid area, anchored bottom, `z-index` 2, padding 12, radius 20 20 28 28 (bottom = button radius 16 + padding 12, concentric), shadow `0 -6px 24px` (old.css:1833-1850, 2290-2296) | inline `.ls-feedback` box in the narration: padding 14 16, radius 18, soft bg (shell.css:812-820) | differs |
| Fixed height 211 px: rows 40 (head) / 3 × 25 (text) / Devam 56, gaps 4, Devam margin-top 8 (old.css:2286-2292, 2334-2340) | content height | differs |
| Backgrounds: right `--color-ok-tint` (#e1f4ec / #16241e); wrong `--color-bad-tint` (#ffe9e6 / #2d1b19); neutral `--color-soft` + 1 px inset `--color-soft-strong` hairline (UC-D13) (old.css:1853-1859, 2408-2414) | ok-wash for right, soft otherwise | differs |
| `role="status"` on the sheet (old.js:13174) | `role="status"` (LessonPlayer.tsx:260) | same |
| Head row: verdict 17 px / 25 bold, ok-ink / bad-ink / ink; flex nowrap, height 40, inline padding 4 (old.css:1860-1879, 2297-2312) | bold "Doğru." / "Tekrar dene." inline (strings.ts:135-136) | differs |
| Verdict copy: "Doğru" / "Tam değil"; neutral "Birlikte bakalım" (old.js:13110-13112, 13179) | "Doğru." / "Tekrar dene." / none on reveal | differs |
| "Senin: X" chip (soft pill, 14 px semibold, ellipsis) for a wrong keypad value, or a wrong choice on a revisit (old.js:13154-13160, 13181, old.css:2313-2333) | none | missing |
| Oddity: on a first wrong choice the chip is omitted because the option "is visible", but once the sheet lands `.has-sheet` hides every dock child, so the wrong pick is no longer on screen (old.js:13156, 13232-13235, old.css:1690-1692) | n/a | n/a |
| Mascot column: shipped as the duo (`sm`, mood happy/console; pair 64 px wide at margin −8/−4) instead of the engine's single head; none on the neutral sheet (old.js:13182, 7048-7056, old.css:2110-2116, 2431-2435) | none | missing (see section 3) |
| Text: first sentence "Cevabın: X." (right) or "Doğrusu: X." (wrong, neutral), value bold ink in `.st-sheet__value`; then the why (old.js:13143-13147, old.css:1903-1906) | the authored `solution` or wrong-option feedback | differs |
| `valueHtml`: plain values split into word runs (letters only, ≥2 chars, optional `,.;`) in the text face and math runs in `.st-math`; authored markup passes through (old.js:13126-13139) | none | missing |
| `stageExplains`: when the reveal ends on the whole derivation, the right-answer explanation is not repeated in the sheet; wrong answers always keep theirs (old.js:13118-13124) | none | missing |
| Why text: choice → the picked option's `feedback`; keypad → `feedbackRight`/`feedbackWrong`; Bilmiyorum → the right option's feedback or `feedbackRight` (old.js:13151-13163) | wrong → option feedback / `feedbackWrong`; reveal → `solution` | differs |
| Text box: 3 lines (`--sheet-lines`), overflow hidden; runtime overflow → `-webkit-line-clamp: 3` and a "Tamamı" button (48 px high, muted 14 px semibold) in the head; tap opens the text, sheet grows upward and glides (`y` from the growth to 0 on `move`); "Kısalt" folds; `aria-expanded` (old.js:13188-13215, old.css:2346-2373) | none | missing |
| Devam: full-width primary "Devam", always enabled at once (chrome) (old.js:13184, old.css:1911-1914) | "İleri" primary appears after the reveal | differs (label) |
| Entry (first answer): slides up from `height + 16` below to 0 on `move` (epsilon 1); on arrival the dock children hide and the narration clip applies (old.js:13232-13239) | none | missing |
| Entry (revisit, `quiet`): appears like a dock row (opacity 0.35, y +16 → 1/0), dock hidden at once, no mascot reaction (old.js:13226-13231) | none | missing |
| Words: verdict, streak, text from opacity 0 (0.35 on revisit), x −14 → 0 on `move`, at 140 ms + 35 ms each (0 on revisit). The "Senin" chip is not in the list, so it does not animate (oddity) (old.js:13243-13246) | none | missing |
| Dock `data-kind='sheet'` while shown (old.js:13225) | n/a | n/a |

### 7.11 Step navigation (`goStep`, `next`, `back`, `replay`, restart)

| Old (what + values + lines) | Current (file:line or "none") | Status |
| --- | --- | --- |
| `goStep`: emits `step:leave`, `stopMotion` (finish all, cancel cues, drop runners, clear fx), clamps index, clears keypad value (old.js:13742-13750, 13744-13749) | `go`: resets replays, attempt, typed (LessonPlayer.tsx:109-114); beat cues cancelled on effect cleanup | differs |
| Renders progress, narration, dock, back, then plans the work line and swaps the scene with a direction (+1 forward, −1 back) (old.js:13758-13770) | no direction | missing |
| Past pick: entry beat landed at once, reveal replays after 420 ms, sheet shown quietly (old.js:13771-13779) | none | missing |
| Fresh step with a beat: `beat` tempo, beat starts after 420 ms (`beatDelay`), soft İleri (old.js:13780-13784) | beat starts at frame 1 at once (LessonPlayer.tsx:61, 91-105) | differs |
| Saves `satir.v3.progress {lesson, step}` on every step (old.js:13785) | saves resume step id (LessonPlayer.tsx:77-80) | same (by id) |
| `replay`: reload matrices, clear work, play the beat; after an answer, land the beat and play the reveal (old.js:13788-13797) | replay button bumps a key and replays frames (LessonPlayer.tsx:229) | differs (see section 6) |
| `restartLesson` "Baştan": new run, step 0, direction −1 (old.js:13836-13839) | none | missing |
| `startNextLesson`: load the following lesson's data without clearing the stage (old scene fades out while the new one rises), new run, step 0 forward (old.js:13819-13834) | none | missing |

### 7.12 Copy (verbatim)

| Old | Current | Status |
| --- | --- | --- |
| "İleri", "Bitir", "Devam", "Kontrol" | "İleri", "Dersi bitir", (no Devam), "Kontrol et", plus "Hareketi bitir", "Cevabı göster" | differs |
| "Bilmiyorum", "Anlamadım" | none | missing |
| "Cevap" (empty display) | "Cevabını yaz" | differs |
| "Doğru", "Tam değil", "Birlikte bakalım" | "Doğru.", "Tekrar dene." | differs |
| "Cevabın: X.", "Doğrusu: X.", "Senin: X", "N üst üste", "Tamamı", "Kısalt" | none | missing |
| "Yarısı bitti · " | none | missing |
| "Sil", "Eksi" | "Sil", "Eksi" | same |

## 8. Lesson end (old 13588-13740, 8352-8590; CSS old.css 1233-1290, 1311-1320, 1370-1378, 2012-2085, 2245-2254)

### 8.1 Completion

| Old (what + values + lines) | Current (file:line or "none") | Status |
| --- | --- | --- |
| Bitir on the last step → `completeLesson`: stop motion, `satir.v3.done[code] = now`, progress → next lesson step 0 (wraps to the first lesson after the last), remove sheet, `lesson.complete = true` (old.js:13704-13717) | `finish`: `doneAt` saved, resume cleared, reward sound, navigate back to the tab (LessonPlayer.tsx:130-135) | differs |
| Emits `lesson:complete` → feel ledger counts the lesson, picks one ceremony: unit over row (old.js:8378-8386) | `rewardFor` picks a sound: unit `milestone` > half of all lessons `halfway` > `lessonEnd` (reward.ts) | differs |
| `beforeEnd` slot: the secret moment may play first, then the end screen (old.js:13717; section 4) | none | see section 4 |
| End screen exists: same lesson view, top bar n/n, back chevron hidden, Anlamadım hidden (old.js:13719-13741) | none: straight back to the map/tab | missing |
| `showLessonEnd` clears the work line and fold state, progress all done + ripple at 70 ms, haptic [10,60,18] (old.js:13721-13741) | none | missing |
| Stage tap during the end animation lands everything in one frame; buttons still act at once (old.js:8603-8607) | none | missing |

### 8.2 Score

| Old (what + values + lines) | Current (file:line or "none") | Status |
| --- | --- | --- |
| `lessonScore`: per question in order, the first result of this run: true / false / `'unknown'` / null (never answered); `correct` = count of true (old.js:13600-13609) | `firstTryScore`: first try ever per step id, right count / question count (progress.ts:121-127) | differs (run vs ever) |
| `scoreTitle` (engine fallback only): no questions "Ders bitti"; all right "Kusursuz, hepsi doğru"; ≥70% "Ders tamam!"; else "Bitti; bir tur daha iyi gelir" (old.js:13611-13615) | none | dropped in old (feel narration replaces it) |
| Score shown where | summary step line "İlk denemede X / Y doğru" (LessonPlayer.tsx:313-317, strings.ts:143) | differs |

### 8.3 End narration

| Old (what + values + lines) | Current (file:line or "none") | Status |
| --- | --- | --- |
| Eyebrow "<code> · Ders tamam" (old.js:13733) | none | missing |
| Shipped title (feel): the lesson's `outcome` can-do line, else "Bu dersi bitirdin" (old.js:8355) | none (no `outcome` field in lesson types) | missing |
| Shipped body: "Her kare bir soru." (empty with no questions) (old.js:8356) | none | missing |
| Row seal ceremony: title "N ders bitti. Ders matrisinde K. satır doldu.", body "Her üç ders bir satır; ara verince hiçbir şey silinmez." (old.js:8358-8361) | none | missing |
| Unit seal: title "<unit> ünitesi bitti.", body "Mührün kapandı." + " Vizede X/34 soru bu üniteden." (A 14, B 15, C 5) (old.js:8362-8366, 8078-8079) | map shows unit weight (strings.ts:34) | missing |
| Secret solved without a ceremony: title = the moment's title (old.js:8368) | none | see section 4 |
| Extra seals: muted line "+ N mühür daha · Profilinde" (16 px muted, `.st-narr__extra`) (old.js:8370, old.css:2081-2084) | none | missing |
| Engine fallback (not shipped): title `scoreTitle`, body "Her kare bir soru: ilk denemendeki cevabın." + " Sıradaki: <b>B2 · name</b>." or " Yeni dersler hazır oldukça haritada açılır." (old.js:13730-13737) | none | dropped in old |
| Oddity: the feel narration overwrites the whole body, so the shipped end screen never says the next lesson in words and never shows the score as a number (only the dock button names it) (old.js:8371, 8352-8372) | n/a | n/a |
| Narration enters forward (direction +1) like a step (old.js:13738) | none | missing |

### 8.4 End scene: answers matrix (shipped `feelEndScene`)

| Old (what + values + lines) | Current (file:line or "none") | Status |
| --- | --- | --- |
| Duo stacked above an answers seal named "Cevapların" (`buildSeal` tier `lesson`), aria "N sorunun cevapları" (old.js:8535-8550) | none | missing |
| Summary step's duo carries over and glides into place (not with reduced motion: a fresh duo fades in) (old.js:8541-8543, 8552-8558) | none | missing |
| Start: every answered cell `is-skipped` (1.5 px inset soft-strong ring, muted); unanswered cells show "–"; pad cells hidden (`.st-seal__pad`) (old.js:8546-8548, old.css:1371-1374, 2048-2050) | none | missing |
| Brackets start open by 14 px (`--seal-gap`) and invisible (old.js:6988-6994) | none | missing |
| Fill: from 210 ms (6 × stagger), one cell every 80 ms (`cellStagger`): right → `is-result` (ok-fill bg, on-ok, semibold) + check drawn; wrong → `is-miss` (soft bg, ink, semibold; never red, council 27 Oct) + cross drawn; unknown → `is-unknown` soft bg, no glyph; each cell scale 0.55 → 1 on `land` (old.js:8506-8519, 8566-8567, old.css:1311-1315, 2245-2254) | none | missing |
| Brackets close at `210 + n×80 + 105` ms on the tier spring; on close: sound `seal.lesson` → `lessonEnd`, then the duo reacts (old.js:8568-8575) | `lessonEnd` plays at tap, then the app leaves | differs |
| Duo mood: "proud" for a first completion or any ceremony, else "happy" (pride is for finishing, not a clean sheet) (old.js:8561-8563) | none | missing |
| No questions: no matrix; duo reacts at the same time; no lesson-end sound at all (the cue is only on bracket close) (old.js:8576-8578) | `lessonEnd` always | n/a (old gap) |
| CSS duplication: `.st-cell.is-unknown` is muted text (old.css:1295) and soft bg (old.css:2245); both apply | n/a | n/a |
| Engine fallback (not shipped): single mascot, `.st-mat` grid with rows 1/2/3 for n ≤5/≤12/more, wrong cells red `is-wrong`, unknown `is-unknown-answer`, then a work-line counter "0 / N doğru" counting up on `draw` and a 30/18-spark burst of "1"/"0" glyphs (old.js:13618-13690) | none | dropped in old |

### 8.5 End layout (`feelEndLayout`)

| Old (what + values + lines) | Current (file:line or "none") | Status |
| --- | --- | --- |
| Duo width = `clamp(56, 0.3 × stage height, 128)` (`--duo-sm`, `--end-duo-share`, `--duo-xl`); height from the duo's aspect (old.js:8411-8413, old.css:713-719) | none | missing |
| Group (duo + matrix) fills at most 70% of stage height (`--end-fill`); room = that − duo − 2 × stage gap 12; width room = stage − 2 × scene inset 24 (old.js:8414-8415) | none | missing |
| Cell size: for column counts `min(3,n)…+3` (≤ n), cell = `min(88, roomW/(cols+0.5), roomH/(rows+0.7))`; prefer a full last row unless it costs >10% of the largest cell (`padTolerance`) (old.js:8416-8427, 8086) | none | missing |
| Top offset = `0.4 × (stage − work − group)` (`--end-top-share`), so the leaving duo stays inside the stage on re-flow (old.js:8428-8431) | none | missing |
| Applied via `--duo-fit`, `--end-cell`, `--end-top`; scene `.st-scene--stack` column, top-aligned; cell `--cell-stack = clamp(cell-min, min(fit-x, end-cell), 88)` (old.js:8435-8441, old.css:785-795, 2016-2022) | none | missing |

### 8.6 Ceremony (row or unit seal)

| Old (what + values + lines) | Current (file:line or "none") | Status |
| --- | --- | --- |
| At most one per lesson end, unit over row; starts 350 ms (`ceremonyHold`) after the duo reacts; whole move capped at 1200 ms (old.js:8381-8384, 8459-8463, 8065-8072) | sound only (`milestone`/`halfway`) | missing |
| Row seal: course matrix of 3 columns (`COURSE_COLS`), last ≤ 3 rows shown, older cells already inked, newest row takes ink; name "Ders matrisi", label "N ders bitti" (old.js:8452-8460, 8093-8095) | none | missing |
| Unit seal: the unit's lessons, 3 columns (≤6) or 4, all take ink; name and label "<unit> ünitesi" (old.js:8446-8450) | none | missing |
| Travel: a flyer clone of the answers matrix (keeps `--cell` vars, `.st-ghost`) shrinks and moves on `move` into its course cell (aiming at the rising matrix's resting box); then fades out, the cell fades in, brackets close, ink fills cell by cell 35 ms apart; sound `seal.row` → `halfway` or `seal.unit` → `milestone` (old.js:8392-8405, 8466-8510) | none | missing |
| Reduced motion: no travel; answers crossfade out, course matrix fades in already sealed (old.js:8463-8483) | none | missing |
| Seal ink: `--color-seal-ink` brand-9 (#29354d / #cedffd), on-seal text; wash neutral-3 (old.css:697-701, 2052-2069) | none | missing |

### 8.7 End dock

| Old (what + values + lines) | Current (file:line or "none") | Status |
| --- | --- | --- |
| With a following lesson: secondary "Harita" + primary "Sıradaki: B2"; label upgraded by `fitLabel` to "Sıradaki: B2 · <name>" when it fits on one line (re-fitted on resize) (old.js:13693-13699, 8580-8583, 8335-8347) | none | missing |
| Last lesson: secondary "Baştan" (restart) + primary "Haritaya dön" (old.js:13698-13699) | none | missing |
| Enters at 140 ms (4 × stagger) like any dock (old.js:13700) | none | missing |
| Oddity: the end dock reuses `.st-dock--nav`, whose columns became `1fr` (UC-D10), so the two buttons stack full width, secondary on top, instead of the earlier 1fr / 2fr side by side (old.css:1693-1695, 2380-2382) | n/a | n/a |
| "Harita" returns to the map, where the feel layer plays the map-side moment (`view` → `feelOnMap`, section 9) (old.js:8622) | navigate to the return tab | differs |

### Port notes

- The shipped old app is the feel-layer version: duo in the sheet, no answer sparks, `feelEndScene` with seals,
  narration from `outcome`, no numeric score on the end screen. Port that, not the engine fallbacks
  (`renderEndScene`, `scoreTitle`, the "Sıradaki" body sentence), unless Eren wants the number back.
- Retry vs one try: old is one try per question with an immediate reveal and sheet; current retries (decision
  0003). Every sheet, mark and streak row above assumes one try, so the port has to define what the sheet says on
  a wrong try that can be retried (verdict "Tam değil" + option feedback + no "Doğrusu" yet?) and when Devam
  appears. This is Eren's call, not a porting detail.
- Timing chain to keep: answer tap → marks (0) → reveal beat (160) → right option lights (220) → sheet rises
  (380) → words (520 + 35 n) → duo reaction + sound (520). Current sounds fire at the tap; moving them to 520 ms
  is part of the port.
- The sheet never covers the question: `reserveDock` + FLIP + `is-tight` + narration line clip are one system;
  porting the sheet without them reintroduces the overlap they fixed.
- The 211 px fixed card (3 text lines) depends on authored text fitting 3 lines; "Tamamı" is runtime safety
  only. Current `solution` texts are longer than old sheet texts; measure them before choosing the card height.
- Revisit is read-only in old (picks per run); current reopens the question. Porting picks needs a stored-data
  migration (step-id keys, not indices).
- Bilmiyorum / Anlamadım: one control, two modes; the flag store is index-keyed in old; use step ids.
- Option badges switch to numbers when an option names a matrix; current takes keys from content, so a content
  rule (or the same regex) is needed.
- Progress: segments with a 0.45 current fill, midpoint gap, `scaleX` spring fill, rolling counter, end ripple.
- iPhone has no `navigator.vibrate`: the old haptic patterns ([12], [24,40,24], [10,60,18]) never fired on
  iPhone; decide whether to drop them or use the iOS 18 switch-tick route current uses for Switch.
- A lesson with no questions gets no lesson-end sound in old (cue tied to bracket close). Do not copy.
- ArrowRight skips an unanswered question in old. Do not copy.
- Could not determine: the old lesson-view HTML (element order in the top bar, the close/back/replay icons, the
  count's ARIA) is not in old.js or old.css; only element ids are (old.js:9254-9256). Screenshots in
  /tmp/cmp/shots show the order (close, back, bar, count). Also not checked here: focus styles for current
  `.ls-*` buttons, and `seal`, `duo` and moment internals (sections 3 and 4).

## 9. Shell (old 7410-8060, 13866-14516, page markup)

Old shell in one line: one fixed screen, never scrolls (`body` overflow hidden). The map view is a 5-row grid: a top bar
holding the title switch "[ Dersler ]  Profil", segmented unit tabs with a sliding pill, a unit head (one line + a
segment strip), one inset list of every lesson of the unit (scrolls inside itself when it must), and one primary button
in the thumb zone. Profil is a second page inside the same view. A lesson opens by morphing the tapped row into the
stage. The current shell is a different structure: four mounted tab panes (Bugün, Harita, Sınav, Ben) behind a
floating glass tab bar, scrolling screens with large titles, a sheet before a lesson, and a clip-path grow from the
Today card only.

Spring names below are the old presets; their duration/bounce equivalents are in 1.1 (press 0.102/0, ui 0.168/0.10,
move 0.237/0.10, page 0.363/0.10, land 0.314/0.40, fade 0.157/0, shake 0.174/0.80, leave 0.123/0). `stagger` = 35 ms.
Colour roles are the old semantic tokens (light / dark palette step): `--color-bg` neutral-2 #f9f6f2 / #1a1815,
`--color-surface` neutral-1 #fdfcf8 / #141310, `--color-soft` neutral-3 #f1eee9 / #22201c, `--color-soft-strong`
neutral-5, `--color-ink` neutral-12 #302e29 / #efece7, `--color-muted` neutral-11 #6a6761 / #c1bdb6, `--color-action`
brand-9 #29354d / #cedffd, `--color-seal-ink` brand-9, `--color-pill` neutral-1 light / neutral-5 dark (raised, not
sunken), `--shadow-raised` 0 1px 2px rgba(48,46,41,.14) / rgba(0,0,0,.55).

### 9.1 Page frame and markup (HTML outside the script)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| `<title>Dizey — Lineer Cebir</title>`, meta description "Dizey: metroda telefonla çalışılan, animasyonlu, kısa adımlı Lineer Cebir dersleri (YTÜ MAT1320 Vize 1)." (html:2-4) | `index.html`: title "Dizey", no description; PWA meta (theme-color #ffffff, apple-mobile-web-app-*) | differs |
| Viewport `width=device-width,initial-scale=1,viewport-fit=cover` (html:1) | same (`index.html`) | same |
| Onest 400/500/600/700 from Google Fonts at runtime, preconnect (html:5-7) | self-hosted (`styles/fonts`, decision 0006 "no Google Fonts at runtime") | n/a |
| Map markup: `#map-view.st-view.st-map[lang=tr]` > `#map-top` (`#brand` "Dizey", `#exam-countdown` "Vize 1 · 20 Kas"), `#map-head` (h1 "Lineer Cebir", `#unit-meta` p aria-live=polite "Ünite A · 11 ders"), `#unit-tabs` role=tablist aria-label "Üniteler", `#tiles` role=tabpanel, `#map-dock` > `#map-continue.st-btn--primary[data-primary]` "A3 · Matris çarpımına başla", `#map-ghost` aria-hidden (html:1259-1274) | `shell/Shell.tsx:120-156` panes + `TabBar`; `MapView.tsx` | differs |
| Static texts in markup are placeholders overwritten at boot: exam line removed, map head hidden, unit meta becomes the notice pill, continue label rewritten (old.js:7774-7776, 14158) | none | n/a |
| Lesson markup: `#lesson-view.st-view.st-lesson[hidden]` > header `#top` (close × "Ders haritasına dön", back ‹ "Önceki adım" disabled, `#progress` aria-hidden, `.st-count` "1/10"), `main#stage` (scene, work aria-live, fx, `#replay` "Hareketi tekrar oynat" hidden), `section#narr` aria-live (eyebrow, "Anlamadım" aria-pressed, h2 title, p body), `footer#dock` (html:1276-1303) | `lesson/LessonPlayer.tsx` (close label "Dersten çık") | differs (section 7) |
| `#overlay.st-overlay` fixed, inset 0, z 10, pointer-events none, overflow hidden: hosts morphs and particles above both views (html:1305, old.css:859) | `.sh-sheet-host` z 25, `.sh-overlay` z 30, `.dz-morph` z 40 | differs |
| Body: height 100%, overflow hidden, overscroll none, `touch-action: manipulation`, tap highlight transparent, antialiased, font 400 17px/1.5 `--font-ui`, bg `--color-bg`, ink `--color-ink` (old.css:801-830) | `styles/app.css` tap highlight transparent; screens scroll (`.dz-screen` overflow-y auto) | differs |
| Focus ring: `button:focus-visible` 2px solid `--color-focus` (row-9 #0961bb, blue), offset 2px (old.css:836) | `.dz-pressable:focus-visible` 2px solid `--ink-1`, offset 3px (`ui/ui.css:158`) | differs |
| `.st-view`: absolute inset 0, max-width 440 centred, side padding max(16px, safe-area), bottom 12, `overflow: clip`, `transform-origin: 50% 40%` (the map sinks around that point) (old.css:844) | screens full width, no max-width; lesson `.ls-run` max 440 | differs |
| Safe areas: `:root` padding-top/bottom env(safe-area-inset-*) (old.css:1-6) | `.dz-screen` top padding env + 12; tab bar `--bar-bottom` | differs |
| Map grid: rows `48px auto auto minmax(0,1fr) auto`, row-gap 12; children pinned by id: map-top 1, unit-tabs 2, tiles-soon 3, tiles 4, map-dock 5 (old.css:950, 2468-2481) | `Screen` scroll column | differs |
| Landscape ≤520 px high: view max 920; map row-gap 8, title 24, tiles 6 columns, dock `1fr auto` (old.css:1980-2008) | none | missing |
| `color-scheme: light` on `:root` while the token layer has full dark themes via `prefers-color-scheme` and `[data-theme]` (old.css:1, 144, 253) | theme setting Sistem / Açık / Koyu (`MeView.tsx:147`) writes `data-theme` | differs (current adds a control) |

### 9.2 Press feel (old 7410-7458, 14275-14303, old.css 2185-2245)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| `PRESSABLE` = `.st-btn, .st-option, .st-key, .st-tab, .st-icon-btn, .st-unclear, .st-tile, .st-map-chip, .st-me-cell, .st-me-sound`, one document-level pointerdown (old.js:14275) | per element `attachPress` (`engine/press.ts:13`) on `Pressable` / `PressLink`; `.sh-press` delegate (`shell/press.ts`) | differs |
| Press-in: scale to `1 - (1 - PRESS_SCALE)` = 0.96 on `press`, every element the same depth (old.js:14295) | width-based scale 0.92-0.985 (3 px per side) on `tap` 0.14 s | differs |
| Feel layer draws half the depth at once (`FEEL_PRESS.first` 0.5: scale jumps to 0.98 in the tap's frame) then springs to 0.96 (old.js:7410-7421) | spring starts from 1 | missing |
| Release: `releasePress` on pointerup/cancel: if the press was not drawn yet (less than half depth) it is set to full depth first, then `ui` back to 1. A tap shorter than a frame is never invisible (old.js:14286-14291) | `release` 0.34 s / 0.22 from wherever it is; no minimum depth | missing |
| Pointerleave does not release in the engine handler (only up/cancel) | `attachPress` lifts on pointerleave and on move > 10 px | differs |
| Disabled elements take no press (`el.disabled`) (old.js:14292, 7424) | `disabled()` option; `.sh-press` `:disabled` | same |
| Keyboard activation (`event.detail === 0`): `pulse(el)` sets 0.96 then `ui` to 1 (old.js:14294-14298, used by tabs, tiles, nav, back, dock buttons) | "keyboard activation does not animate" (`press.ts:12`) | differs |
| Press ink: class `is-pressed` (only with `.st-touch`) sets registered `--press-tint` = ink at 14 % (`color-mix`) drawn as a background-image gradient; in 0 s, out 160 ms `cubic-bezier(.2,0,0,1)` (old.css:745-748, 2185-2210) | `::after` overlay, opacity `--press` × 0.06 (primary: on-action × 0.14), in on `tap`, out on `fade` (`ui/ui.css:149`) | differs (strength 14 % vs 6 %) |
| Stage press: pointerdown anywhere on the stage that is not a pressable scales the stage card to 0.96 (half at once), release on `ui` (old.js:7430-7444) | none | missing |
| Stage click with nothing to play: card dips 0.96 (reduced motion: opacity 0.7 = `ENTER_FLOOR × 2`) then `ui` back (old.js:14392-14399) | none | missing (section 7) |
| Touch boot adds `:root.st-touch` and the three listeners; everything in 9.2 CSS is scoped to it (old.js:7452) | always on | n/a |
| Tap gaps on touch: unit tabs gap 8 (`--tap-gap`), top bar icon buttons pulled to 8 px apart, "Anlamadım" shifted by `translate` so the row keeps its height (old.css:2215-2228) | none | missing |
| Cap-height centring: `text-box: trim-both cap alphabetic` on buttons, tabs, keys, "Anlamadım", count; `.st-btn` becomes inline-block; option padding-top `2 × --cap-lift` (0.06 em) (old.css:2231-2245) | none | missing |
| Nav tabs have their own press (not in `PRESSABLE`): down 0.96 `press`, up/cancel/leave back on `land` (bouncy 0.40) (old.js:7744-7746) | `Pressable` | differs |

### 9.3 Launch greeting (old 7460-7527, old.css 2262-2289)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| Kind from the ledger's `lastSeen`: none 0 → `first`; gap < 20 min → `none`; 20 min to 72 h → `daily`; > 72 h → `long` (`FEEL_LAUNCH` nearGapMs 1 200 000, longGapMs 259 200 000) (old.js:7470, 7477-7482) | none | missing |
| Greeting by local hour: < 5 "İyi geceler", < 12 "Günaydın", < 18 "İyi günler", else "İyi akşamlar" (old.js:7472-7474) | none | missing |
| Copy: first "`<greeting>`, başlayalım." / long "`<greeting>`, devam edelim." / daily greeting alone; nothing to continue on a first launch (old.js:7495) | none | missing |
| Layer `.st-launch`: fixed inset 0, z `--z-overlay + 1` (11), centred column, gap 12, bg `--color-bg`; `data-cast="brand"` (old.js:7486-7488, old.css:2262) | none | missing |
| Contents: Köşeli mark cloned from the brand (happy face) at 96 px (`--launch-mark`), word "Dizey" 30 px bold, leading 1.15, tracking -0.01em, margin-top 8; line 17 px muted, margin 0 (old.css:2273-2289) | none | missing |
| Motion: items start opacity 0, y 12 (`SHIFT.enter`); mark also scale 0.86; each rises at 80 + i × 220 ms (80, 300, 520) on `move`; mark cheers (hop, strength 0.9) at 500 ms (old.js:7510-7515) | none | missing |
| Hold: total 1300 ms (`daily`) or 2100 ms (`first`, `long`), then the layer fades on `fade` and is removed (old.js:7503-7509, 7517) | none | missing |
| Skip: pointerdown anywhere on the layer (capture, preventDefault, stopPropagation) fades it at once; the tap never reaches the map (old.js:7508) | none | missing |
| Reduced motion: items shown at once (no rise, no cheer); hold and fade unchanged (old.js:7511) | none | missing |
| Skipped under QA (`SATIR_QA`) (old.js:7524) | none | missing |
| Oddity: `FEEL_LAUNCH.outMs` 260 is never read (the fade uses the `fade` preset) (old.js:7470) | n/a | n/a |
| Oddity: no keyboard skip (pointer only); the timer still ends it | n/a | n/a |
| Oddity: a negative gap (device clock moved back) or NaN reads as `none` (`!(gap >= near)`) (old.js:7480) | n/a | n/a |

### 9.4 Boot and map entrance (old 14462-14481, 14256-14270)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| Before the entrance, map-top, map-head, tabs, tiles and dock are set to opacity 0 (no reflow jump while the webfont loads) (old.js:14468) | panes render at once | missing |
| Start gate: first of `document.fonts.ready` or `CHOREO.fontWait` 500 ms; runs once (`started`); QA starts at once (old.js:14469-14480) | none | missing |
| `playLoad`: map-top, map-head, tabs rise from y 12, opacity 0 at 0, 70, 140 ms on `move` (old.js:14257-14260) | none | missing |
| Rows ripple from the saved lesson's row (or the first row): opacity 0, y 12, scale 0.96 → 1 on `move` at 175 ms + min(240, distance / 1.4 px per ms) (`waveIn`, old.js:14244-14252, 14261) | none | missing |
| Dock rises from y 16 (`SHIFT.dock`) at 280 ms (old.js:14262-14263) | none | missing |
| Brand mascot cheers at 420 ms (strength 0.8) and blinks at 1050 ms; the brand is hidden by the feel layer so this plays unseen (old.js:14264-14266, 7775) | none | n/a |
| Oddity: the unit head (`#tiles-soon`) and the notice pill are not in the sequence, so the unit head shows at full opacity before everything else arrives | n/a | n/a |
| Reduced motion: the sequence is not skipped; the engine lands transforms at once and fades opacity (section 1.3) | n/a | n/a |
| Boot order: brand mascot inserted, tabs built, saved lesson loaded, map rendered, entrance, test hooks, then `feelEmit('boot')` runs the feel layer (launch, ledger touch, home shaping) (old.js:14462-14515, 8587-8607) | `main.tsx` | n/a |

### 9.5 Home structure (feel layer, old 7529-7546, 7773-7807)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| Removed or hidden at boot: `#exam-countdown` removed, map head ("Lineer Cebir" + meta) hidden, brand hidden (old.js:7774-7776) | n/a | n/a |
| Resulting Dersler screen, top to bottom: title switch; unit tabs; unit head; lesson list; primary button; notice pill floating above the primary (old.js:7529-7536) | Harita: large title "Harita", lead "Vize 1 dersleri. Her birine istediğin zaman girebilirsin.", one section per unit (`MapView.tsx:24-68`) | differs |
| Exam date lives on Profil only, not on the home (old.js:7535) | Bugün lead line `examLine` / `examWeekLine` (`TodayView.tsx:22-25`) | differs |
| Re-shape triggers: MutationObserver on `#tiles` childList → shape + fit; boot; fonts ready (fit + nav place); map shown again (`feelOnMap`); resize (fit, nav place, Profil knob) (old.js:7789-7807) | React render | n/a |

### 9.6 Title switch "[ Dersler ]  Profil" (old 7651-7759, old.css 2482-2525)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| `nav.st-nav` role=tablist aria-label "Yer", in `#map-top`, flex, height 48 (`--top-h`) (old.js:7735-7739, old.css:2482) | floating bottom tab bar `nav.dz-tabbar` aria-label "Bölümler", 4 tabs with icons (`ui/TabBar.tsx`) | differs |
| Tabs: buttons role=tab ids `nav-dersler`, `nav-profil` (`aria-controls="profile-view"`), labels "Dersler", "Profil" (old.js:7740-7742) | "Bugün", "Harita", "Sınav", "Ben" (`strings.tabs`) | differs |
| Tab type: 24 px (`--nav-title`), bold, leading 1, tracking -0.01em; height 48, padding 0 12; muted; selected ink; colour transition 160 ms `cubic-bezier(.2,0,0,1)` (old.css:2488-2503) | icon + label, `aria-current="page"` | differs |
| Focus ring inside the target (offset -2 px, radius 12) so the viewport never clips it (old.css:2505) | offset 3 px | differs |
| Brackets: two `<i>` arms 8 px wide (`--nav-arm`), top/bottom inset 8, border 2 px ink (`--seal-bracket-stroke`), open side removed, outer corners radius 4; pointer-events none (old.css:2509-2525) | lens behind the active tab (glass) | differs |
| Bracket placement: left arm x = tab.offsetLeft, right arm x = tab.offsetLeft + width - arm, on `ui`; jump when reduced or not animated; skipped while the tab has no width (old.js:7654-7663) | lens edges: leading `snap`, trailing `glide` | differs |
| Roving tabindex and `aria-selected` (old.js:7665-7671) | `aria-current` only, all tabs focusable | differs |
| Keys: ArrowRight → Profil, ArrowLeft → Dersler, focus follows (`preventScroll`); Escape on Profil → Dersler with focus (old.js:7752-7756, 8039-8041) | none | missing |
| Click with keyboard (`detail` 0) pulses the tab (old.js:7748) | none | differs |
| Guards: same place, map hidden, or `shelf` flag off → no-op (old.js:7681) | `if (!active) onSelect` | differs |
| Crossing: outgoing blocks go to opacity 0, x −dir × 12 on `leave`; incoming start at x dir × 12, opacity 0, arrive one by one at 35 × (i + 1) ms on `move`; dir +1 toward Profil (old.js:7691-7705) | incoming pane fades in on `fade` over the outgoing, which hides when the fade lands (`Shell.tsx:58-84`) | differs |
| Reduced motion: outgoing fade, incoming set to 0 then fade, no travel, no stagger (old.js:7692-7699) | fade only | same idea |
| Both pages stay in layout during the crossing; outgoing blocks `inert`; a reversal mid-way retargets the springs from where they are; a `serial` guards stale hides and staggered starts (old.js:7684-7703) | panes `inert` when inactive | differs |
| Dersler blocks in order: unit tabs, unit head, list, dock; Profil blocks: intro, hero, card, switches (old.js:7676, 8000-8003) | whole pane | differs |
| The title switch never leaves the screen (Profil lives inside the map view) (old.js:7812) | tab bar hides under full-screen routes (slides down on `page`) | differs |
| Tab-bar scrub with rubber band and throw (current only) | `TabBar.tsx:106-167` | n/a (current-only) |

### 9.7 Unit tabs, pill, swipe (old 14100-14243, 14300-14381, old.css 989-1020)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| `.st-tabs`: grid 3 equal columns, gap 4 (touch 8), padding 4, radius 16, bg `--color-soft` (old.css:989, 2215) | none (units are stacked sections) | missing |
| Pill: absolute, top/bottom 4, radius 12, bg `--color-pill` (neutral-1; dark neutral-5, lighter than its track), `--shadow-raised`, aria-hidden; width = selected tab width (old.css:998, old.js:14104, 14125) | none | missing |
| Tab: min-height 48, radius 12, transparent, 15 px medium; selected bold; above the pill (z 1) (old.css:1007-1020) | none | missing |
| Labels from `UNITS`: "Matrisler", "Determinant", "Sistemler"; ids `tab-A`, `tab-B`, `tab-C`; list has `aria-labelledby` of the selected tab (old.js:14103, 14138) | unit labels "Matrisler", "Satır işlemleri ve ters matris", "Determinant", "Lineer denklem sistemleri" as h2 (`content/units.ts:8-11`) | differs |
| Pill motion: x = tab.offsetLeft on `ui`, carries a swipe's velocity; set without motion on render and resize (old.js:14121-14129, 14457) | none | missing |
| Roving tabindex, `aria-selected` (old.js:14107-14113) | none | missing |
| Keys on tabs: ArrowRight/Left switch unit and focus the new tab; no wrap at the ends (old.js:14366-14373) | none | missing |
| Click: keyboard pulse, then `switchUnit` (old.js:14360-14365) | none | missing |
| Active unit at boot = unit of the saved lesson; after a lesson completes, the completed lesson's unit (old.js:14098, 13999) | none | missing |
| `switchUnit`: same unit → list springs back to x 0 on `move` with velocity, pill re-placed; else ghost out, render, pill to new tab with its velocity, rows enter, notice slides in from x 6 × dir (old.js:14192-14210) | none | missing |
| Ghost rows: every row measured first, then moved absolutely into `#map-ghost` at its place and slid to x −dir × 36 (`SHIFT.tiles`), opacity 0 on `move` with the flick velocity, removed on arrival (old.js:14212-14229) | none | missing |
| Entering rows: from x dir × 36, opacity 0, at `tilesHead` 70 + column order × 35 + row × 17.5 ms on `move`; column order reverses for leftward travel (old.js:14231-14241) | none | missing |
| Swipe on the list: starts after |dx| ≥ 10 and |dx| ≥ 1.2 |dy|; cancels any press and the prepared lesson; pointer capture (try/catch) (old.js:14316-14329) | none | missing |
| Follow 1:1; at the first/last unit rubber band `sign × (1 − 1 / (|over| × 0.55 / width + 1)) × width`; pill follows by −(shown / width) × tab step, except when blocked (old.js:14306-14337) | `rubberBand` with c 0.55 exists (`engine/gesture.ts:59`) | missing (helper same) |
| Release: velocity from samples in the last 100 ms (first-to-last slope, px/ms); projected = offset + v × 180 ms; changes unit when |projected| > 30 % of the width (old.js:14341-14355) | `VelocityTracker` (least squares, 100 ms window), `project` with deceleration 0.998 | missing |
| A drag swallows the click that ends it (capture listener, `drag.moved`) (old.js:14358-14363) | none | missing |
| List `touch-action: pan-y` (old.css:1028) | none | missing |

### 9.8 Lesson list rows (old 7539-7593, 14141-14167, old.css 2530-2740)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| Every lesson the unit lists is a row in course order, ready or not; not-written lessons stay in place as quiet rows (old.js:7531-7534) | only lessons that exist, all units on one page (`MapView.tsx:27-28`) | differs |
| List surface: one inset group, radius 16, bg `--color-surface`, `--shadow-raised`; flex column, gap 0 (old.css:2530) | `.dz-list` radius 20 (`--corner-card`), `--shadow-1` + edge light (`ui/ui.css:175`) | differs (radius) |
| Row: grid `36px | 1fr | auto`, column gap 8, row gap 2, padding 0 16, flex basis 56 (`--row-h`), min 48 (old.css:2573-2586) | `.dz-row` flex, gap 12, min-height 52, padding 8 16 (`ui/ui.css:181`) | differs |
| Separator: 1 px, colour `--color-soft`, inset left 16, none after the last row, none above or below the next row (old.css:2588-2600) | 0.5 px `--hairline-strong`, inset 16 (`ui/ui.css:191`) | differs |
| Code: column 1, 14 px semibold, leading 17 px, muted, tabular (old.css:2601) | `.sh-code` footnote semibold tabular, inside a 2.4em column | differs |
| Name: column 2, 17 px / 25 semibold ink, one line, clipped; fitted to the longest variant that fits: whole name, else the part before the first comma or colon (`feelNameVariants`, `fitLabel`) (old.css:2610, old.js:7542, 7631) | title wraps; plus a state word line ("başlanmadı", "kaldığın yer", "tamamlandı") | differs |
| Ready, not done: chevron drawn as an 8 px box with 2 px top/right border, muted, rotated 45°, margin-right 4 (old.css:2638) | `ChevronRight` icon, `--ink-3` | differs |
| Done: name drops to medium (500); a 20 px green check badge (`--color-ok-fill` circle, `--color-on-ok` check) closes the row; chevron hidden; aria-label "`<code>` `<name>`, tamamlandı" (old.css:2621-2636, old.js:14157-14166) | `Glyph` 2×2 mastery mark at the start, first cell filled | differs |
| In progress (saved step > 0): `.is-current`, step "n/N" in column 3, 14 px semibold ink, chevron hidden; aria-label adds ", `<n>`. adımda" (old.css:2649, 2677, old.js:14155-14163) | state word "kaldığın yer" | differs |
| Next lesson (one row): `.is-next`, taller (72, `--row-next-h`), ring inset 4, radius 12, 2 px `--color-action`; chevron in action colour; second line "Sıradaki · N adım · Q soru", or "Kaldığın yer · n/N" with a 4 px progress bar (track soft, fill seal-ink, scaleX = (step+1)/N, set without motion) (old.css:2692-2740, old.js:7569-7585) | none (Bugün card plays this role) | missing |
| "Sıradaki" tag (14 px semibold action) exists in every next row but shows only on short phones, in place of meta, bar and chevron (old.css:2714, 3084-3090) | none | missing |
| Not written yet: div, not a button; muted; name medium muted; lock glyph hidden; "Yakında" 13 px medium muted at the end; aria-label "`<code>` `<name>`, yakında" (old.css:2656-2675, old.js:14143-14147) | `strings.map.state.soon` and `.sh-glyph[data-state="soon"]` exist but are never rendered | missing |
| Tap on a not-written row: shake on `shake` with push 180 px/s, notice "`<code>` · Bu ders yakında", `haptic(8)` (old.js:14378-14384) | none | dropped in 1.4 (no locks, decision 0003); the notice and the row itself are not locks: check with Eren |
| Tap on a ready row opens the lesson directly, at the saved step if it is the saved lesson, else step 0; origin of the morph = the row (old.js:14385-14388) | opens a sheet (code, title, Durum, Uzunluk, one button "Derse gir" / "Devam et" / "Tekrar et"), then the route (`MapView.tsx:49-52, 82-123`) | differs |
| Short phones (max-height 699): rows 48 / min 44, next row 56; meta, bar and next chevron hidden, tag shown (old.css:3077-3090) | none | missing |
| Row shaping is idempotent: built once per tile (`dataset.row`), per-render parts (meta, tag, bar) removed and re-added (old.js:7551-7563, 7618) | React | n/a |

### 9.9 Unit head (old 7594-7623, old.css 2741-2780)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| `.st-unit#tiles-soon` between tabs and list: flex column, gap 8, padding-inline 4; hidden on Profil (old.js:7779-7784, old.css:2741) | `.sh-unit-head`: h2 + "d / n tamam" right-aligned, then "geçmiş sınavlarda n / 34 soru" (`MapView.tsx:30-38`) | differs |
| Line: 14 px semibold muted, one line; parts "N ders", then "hazır olanların hepsi bitti" when every ready lesson is done, else "K bitti" (if any), then "S yakında" (if any); joined " · "; fitted to all, first two, first (old.js:7604-7611, 7633-7635) | "d / n tamam" | differs |
| Strip: one segment per lesson in list order, flex 1 each, height 6, gap 4, pill radius; done seal-ink; next surface + 2 px action ring; ready soft-strong; soon soft; aria-hidden (old.js:7612-7620, old.css:2759-2780) | none | missing |
| Done is read from storage, so a lesson whose check is still to be stamped already counts; the next lesson counts as next even if done earlier (revisit in progress) (old.js:7597-7602) | records | n/a |
| Oddity: `data-calm="done"` is set when finished but no CSS reads it (old.js:7612) | n/a | n/a |

### 9.10 List fit, inner scroll, edge fades (old 7625-7649, old.css 2530-2572)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| The list fills its grid row (`max-height: 100%`) and scrolls inside it when the unit is taller: `overflow-y: auto`, `overscroll-behavior: contain`, no scrollbar (old.css:2530-2547) | the whole screen scrolls (`.dz-screen`) | differs |
| Edge fades: sticky 24 px (`--list-fade`) gradients from transparent to surface at top and bottom, opacity 0 → 1 (160 ms) only while there is more to scroll that way (`is-more-up`, `is-more-down`, 1 px tolerance), updated on scroll (passive) (old.css:2549-2572, old.js:7645-7649, 7785) | scroll-edge glass title bar at top (`ui/Screen.tsx`), fixed fade under the tab bar (`.dz-edge-bottom`) | differs |
| After each render the next row (or the first ready, not done) is centred in the list; with no scroll, scrollTop 0 (old.js:7638-7642) | scroll position kept per pane | missing |
| Fit is skipped while the map is hidden, on Profil, or the list has no width (old.js:7629) | n/a | n/a |

### 9.11 Primary action and the next-lesson pick (old 14084-14097, 7544-7549, 14146-14164)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| `#map-continue`: `.st-btn--primary` full width, height 56, radius 16, `--color-action` / `--color-on-action`, 17 px semibold; dock grid gap 8 (old.css:901-921, 1115) | `.dz-button[data-kind=primary]` 56, radius 16, action, `--shadow-1`; no sticky primary on Harita | differs |
| Label: saved step > 0 "`<code>` · `<n>`. adımdan devam et"; else "Başla: `<code>` · `<name>`", or "Tekrar: …" when the saved lesson is done (all done, revisit) (old.js:14155-14157) | Bugün card: "Kaldığın yer" / "Sıradaki ders", code, title, progress, "n / N adım" (`TodayView.tsx:31-65`); sheet buttons "Derse gir", "Devam et", "Tekrar et" | differs |
| Tap opens the saved lesson at the saved step, morphing from the button (with the action-colour tint) (old.js:14389-14392) | Bugün card grows into the route (`Shell.tsx:218`) | differs |
| `savedProgress`: no or unknown saved lesson → first visit starts at B1 (determinants, heaviest exam topic) if ready, else the first ready lesson (old.js:14086-14088) | `upNext`: lesson in progress, else the first not done in study order (`lesson/state.ts:12-21`) | differs |
| A done lesson that is not mid-way is never "next": the pick moves to the first ready lesson still undone in course order; when every lesson is done the old pick stays (revisit) (old.js:14089-14092) | all done → "Bütün dersleri bitirdin…" + "Sınav provasına geç" | differs |
| A saved step that no longer exists (lesson got shorter) restarts the lesson at step 0 (old.js:14094-14096) | step ids, not indices; unknown id → step 0 (`lesson/progress.ts:17-20`) | same idea |
| `feelNextLesson`: the row ring and Profil use the same pick, but null when the pick is done and at step 0 (old.js:7546-7549) | `upNext` | differs |

### 9.12 Notices (old 7761-7771, 14168-14183, 14149-14154, old.css 2781-2799)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| `#unit-meta` becomes `.st-notice`: moved out of the flow into the map view; a pill above the primary: absolute, bottom 12 + 56 + 8 = 76 px, height 32, padding 0 12, pill radius, bg soft, ink, 14 px semibold, width fit-content centred, pointer-events none; aria-live polite (old.js:7762-7770, old.css:2781) | none | missing |
| Shown only while it holds something other than the resting text `unitMetaText()` = "Vize 1 · 20 Kasım" (MutationObserver) (old.js:7766-7769, 14132-14134) | none | missing |
| `showNotice(text)`: text swaps in from opacity 0, y 6 on `move`; after 1800 ms (`noticeHold`) it swaps back (and hides); a newer notice or any render cancels the old timer (`noticeSerial`) (old.js:14168-14183, 14137) | none | missing |
| Storage notice: when storage is blocked, "Bu görünümde ilerleme kaydedilmiyor." once per visit, stays until the next render (old.js:14149-14154) | none (storage failure is not handled, see 10) | missing |

### 9.13 Lesson open and close morph (old 13866-14076)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| Prepare on pointerdown (ready row or primary): lesson laid out invisibly (`.is-prepping` = visibility hidden, inert), progress built; reverted after 1000 ms (`prepHold`) or when a swipe starts (old.js:13930-13947, 14290-14291) | none | missing |
| Animated only when motion is not reduced, the map is visible and the origin is still in the document (old.js:13965) | `visibleCard()`: card connected and on screen (`Shell.tsx:163-168`) | differs |
| Morph surface `.st-morph`: a div at the stage's rest rect, bg `--color-stage`, `--shadow-raised`, transform-origin 0 0, starts transformed onto the origin rect (FLIP scaleX/scaleY), fades in on `fade` over its source (old.js:13874-13894, old.css:866) | clip-path inset on the route layer, from the card's insets and radius (`Shell.tsx:184-239`) | differs |
| Corner radius interpolated from the origin's radius to the stage's by progress and counter-scaled per axis every frame (`r / scaleX px / r / scaleY px`) so corners stay round (old.js:13889-13893) | clip radius animates directly (no scale) | differs |
| Tint layer in `--color-action` when the origin is the primary button: open 1 → 0, close 0 → 1, on `page` (old.js:13881-13886, 13917, 14055) | none | missing |
| Open: stage hidden until the morph lands (epsilon 3 px), then stage shown and morph fades out and is removed; origin fades out, restored when the map settles (old.js:13907-13926) | card copy ("face") fades on `fade`; card hidden until the grow lands | differs |
| Open: lesson top bar opacity 0 → 1 on `move` at 105 ms; narration and dock at 250 ms on `fade` (they wait for the map to clear); first step starts after 180 ms (`openDelay`) (old.js:13910-13915, 13970) | content opacity 0, y 12 → `glide` at 90 ms | differs |
| Open: the map sinks: opacity 0, scale 0.97 (`DEPTH_SCALE`) on `page`, around 50 % 40 %, then hidden and un-inerted (old.js:13916-13919, 13864) | shell stays; route layer covers it (bg `--bg`) | missing |
| Non-animated open: lesson fades in, map fades out (old.js:13897-13902) | rise 24 px + fade | differs |
| Close: lesson view fades on `leave`; map from scale 0.97 → 1 on `page`, opacity from 120 ms (`mapFadeDelay`) on `page`; morph from the stage rect back to the row (epsilon 2) (old.js:14047-14058) | back into the card if it is on screen, else down 24 px and fade (`Shell.tsx:242-274`) | differs |
| Close target = the current lesson's row, else the primary; on arrival the row lands from 0.96 on `land` (a small pop), morph fades (old.js:14044-14062) | card visibility restored | missing |
| A finished lesson stamps its check on arrival: row gets `is-done`, aria-label updated, badge 0.5 → 1 on `land`, check drawn after 70 ms, 8 particles (speed 0.42, life 560 ms, kinds ok and accent, seed = hash of the code) (`stampBadge`, old.js:14065-14076) | none | missing |
| Reduced-motion close: crossfade, stamp at once (old.js:14039-14045) | fade | differs |
| Keys while a lesson is open: ArrowRight next, ArrowLeft back, Escape → map (old.js:14446-14451) | none | missing (section 7) |
| Resize: pill re-placed; open lesson re-fits its scene (old.js:14452-14455) | ResizeObserver on the tab bar | differs |
| Oddity: rows have radius 0, so the close morph lands on square corners while the next row's visible ring has radius 12 | n/a | n/a |
| Oddity: the close target can be scrolled out of view inside the list (the fit re-centres on the next lesson, not the closed one); the morph then flies to a clipped rect | n/a | n/a |

### 9.14 Lesson-view events in the region (old 14382-14445)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| "Anlamadım": toggles a mark per `lesson:index` in `satir.v3.unclear` and `aria-pressed`; in `unknown` mode it answers "Bilmiyorum" instead (old.js:14419-14429) | none | missing (section 7) |
| Dock and sheet buttons delegated by `data-action`: check, next, back, map, next-lesson, restart; options by `data-option`, keys by `data-key`; keyboard click pulses (old.js:14430-14444) | per-component handlers | n/a |
| Stage tap while a reveal plays after a right answer: lands the reveal and stays on the step; replay icon 0.8 → 1 on `land` (old.js:14400-14409) | none | missing (section 6) |
| Stage tap while a runner plays: pause or resume (`pressTransport`); otherwise the replay icon pulses 1.25 → 1 on `land` to show where to replay (old.js:14410-14417) | none | missing (section 6) |

### 9.15 Profil (old 7809-8045, old.css 2438-2460, 2800-3136)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| A page inside the map view: `section#profile-view.st-me` role=tabpanel, aria-labelledby `nav-profil`, lang tr; absolute below the 48 px top bar; flex column, gap 12, scrolls without a bar; padding 12 and the gutter (old.js:7871-7877, old.css:2806) | `MeView` tab pane "Ben" with large title and subtitle "İlerlemen, hataların ve ayarların." | differs |
| Rule: only things done are shown: no misses, no ratios, no day counts, no badges, no taps on cells (old.js:7813-7814) | Me shows the "Hata defteri" with open mistakes (decision 0003) and "devam ediyor" / "başlanmadı" counts | differs (conflicts with the old rule; needs Eren) |
| Intro: the duo pair (both faces, size md 72 px, drawn still, no idle loop) beside one sentence 17 / 25 medium, balanced; padding-inline 4, gap 12 (old.js:7976-7979, old.css:2820-2842) | none | missing |
| Sentence by state: none done → "İlk dersin bitince burası dolmaya başlar." (neutral); the last finished lesson's unit has every ready lesson done → "`<unit>` hazır derslerinin hepsi bitti." (proud); else next pick → "Sıradaki: `<code>` · `<name>`." (happy); none left → "Hazır derslerin hepsi bitti." (proud) (old.js:7932-7941) | none | missing |
| Hero card (padding 16, radius 16, surface, raised): row "Sınav" (14 semibold muted) and the date "Vize 1 · 20 Kasım" (17 semibold ink), baseline, space-between, hairline under it (soft), padding-bottom 12 (old.css:2844-2870) | exam date is a setting ("Vize 1 tarihi", date input 2026-11-01..12-31) and a Bugün countdown "Vize 1'e N gün · `<date>`" | differs (old: a date, never a countdown, old.js:14147 "no day counts anywhere (Eren's rule)") |
| Stats: grid 3 columns, gap 8, margin-top 12; value 24 / 1.2 bold tabular above label 14 medium muted nowrap; labels "ders bitti", "soru çalıştın", "mühür" (old.js:7846, 7983-7993, old.css:2871-2897) | card with 3 stats: glyph + value (title2) + "tamamlandı" / "devam ediyor" / "başlanmadı" | differs |
| Counts: lessons = known lessons done in the ledger; worked = distinct `lesson:index` answered (right, wrong or "Bilmiyorum"), union of the ledger and the engine answer log, written back when the log adds some; seals = row and unit seals; secrets (solved moments) computed but not shown (old.js:7824-7845) | lesson states from records | differs |
| "Ders matrisi" card: title 15 bold; legend 13 muted with 10 px keys (radius 4): "bitti" seal-ink, "sıradaki" 2 px action ring, "hazır" 1 px muted ring, "yakında" soft; aria-hidden (old.js:7879-7882, old.css:2899-2942) | none | missing |
| Matrix: role img, aria-label "Ders matrisi, N ders bitti" (or "Ders matrisi"); seal brackets (`--cell` 40 → arm 6.4 px, stroke 2) around all units; padding 8 12; 16 between units (old.js:7997-8003, old.css:2946) | none | missing |
| Unit label row (14 semibold): unit name, then "mühürlü" (ok-ink, semibold) when the unit seal exists, else "k/n bitti", else "n ders" (medium muted tabular) (old.js:7953-7960, old.css:2954-2970) | none | missing |
| Cells: grid 10 columns (`--course-cols`), gap 4, height 36 (short phones 28), radius 4, 13 px semibold tabular; done seal-ink with on-seal text; next 2 px action ring; ready 1 px muted ring; not written soft + muted medium; text = the lesson's number within its unit; a lesson borrowed from another unit (A10 in Determinant) shows its full code and spans 2 columns; tooltip "`<code>` · `<title>`" (old.js:7963-7972, old.css:2972-3006) | none | missing |
| Solved "Gizli an" dot: 6 px circle in `--color-head-col`, top-right 2 px (old.js:7973-7977, old.css:3008) | none | missing |
| Arrival: each visit to Profil opens the matrix brackets by the seal gap and closes them on `move` after 180 ms; reduced motion: closed at once (old.js:8027-8034) | none | missing |
| Switches card (pinned to the bottom by `margin-top: auto`; one surface, radius 16, raised; rows flat; 1 px soft-strong divider) (old.css:2438-2460, 3018) | "Ayarlar" list: date, Görünüm segments, "Ders sesleri" switch ("Telefon sessizdeyken çalmaz.") | differs |
| "Ses" — "Ders, cevap ve mühür sesleri"; "Müzik" — "Çok hafif fon müziği"; buttons role=switch with `aria-checked` (old.js:7883-7889) | "Ders sesleri" only; no music | differs / missing (Müzik) |
| Switch row: min-height 56 (short 48), padding 0 16, gap 12; name 17 / 25 semibold, sub 14 medium muted (hidden on short phones) (old.css:3022-3050) | `.dz-row` + `.sh-row-sub` | differs |
| Track 52 × 28 (`--hit + 4`, `--switch-h`), pill, soft-strong → action when on (160 ms colour transition); knob inset 4 (20 px), surface → on-action; knob x = track − knob − 2 × inset on `ui` (old.css:3051-3076, old.js:7857-7866) | track 52 × 32, knob 26 at inset 3, travel 20 on `snap`, widens to 1.2 while pressed, colour as an effect (`ui/Switch.tsx`) | differs |
| Müzik follows Ses: with Ses off it shows off, is disabled (opacity 0.45, cursor default) and ignores taps; its own value is kept and returns with Ses (old.js:7853-7866, 7898, old.css:2457) | none | missing |
| Ses on → plays a preview cue `teach.land` and unlocks audio inside the tap (old.js:6533-6541) | `setSoundOn(true)` unlocks and plays `land` (`sound/player.ts:96-103`) | same idea |
| Short phones (max-height 699): pair hidden, sentence 15 / 17, cards padding 12, matrix title hidden, stat value 20, gaps 8 (old.css:3091-3135) | none | missing |
| Resize while on Profil re-places the knobs (old.js:8035-8037) | n/a | n/a |
| Current-only Me items: mistake log, theme, exam date, backup and restore, version line | `MeView.tsx` | n/a (kept by decision 0006) |

### 9.16 Brand and logo (html:1261, old.js:14464, 9464-9510, old.css 960, 1917-1966)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| Brand `#brand`: Köşeli (the square-bracket face, mood happy, 22 px = `--icon`) then "Dizey", 15 px bold, gap 8; `data-cast="brand"` (old.js:14464, 8590, old.css:960, 1961) | none in the app | missing |
| In v21 the brand is hidden on the home by the feel layer; Köşeli only appears in the launch greeting (96 px) (old.js:7775, 7489) | none | missing |
| Köşeli SVG, viewBox 40: arms `M10 6H6v28h4`, `M30 6h4v28h-4` (stroke 3.2, ink, round); happy eyes `M13.5 19.5q2.5-3 5 0M21.5 19.5q2.5-3 5 0`, mouth `M15.5 25.5q4.5 4 9 0` (stroke 2.4); oops eyes circles r 2.4 at (16,19), (24,19), mouth `M16.5 27h7` (old.js:9464-9476) | app icon `public/icons/icon.svg`: dark square, white brackets with four dots (a 2×2 matrix), no face | differs |
| Cheer: body hop with push −150 × strength px/s on `land`, squash push scaleY +2.2, scaleX −1.4; arms fling ±70 px/s; blink: eyes scaleY 0.12 → 1 on `move` (old.js:9486-9510) | none | missing (section 3) |
| Cast rule: Köşeli only on brand surfaces, the duo only in lessons, never both on one screen (old.js:8053-8055) | none | missing |

### 9.17 Bugs and oddities (shell)

| Old (what + lines) | Current | Status |
| --- | --- | --- |
| Ghost rows lose their list styling: moved into `#map-ghost`, they no longer match `.st-list .st-tile`, so during a unit swipe the outgoing rows render as old grid tiles (card bg, radius 12, 2 px action ring, column layout) (old.js:14216-14226, old.css:1030-1070) | n/a | n/a |
| Ghost rows are measured with `getBoundingClientRect`, so rows scrolled out of the list's view slide out visibly outside the list's clip (old.js:14215) | n/a | n/a |
| `enterTiles` reads `gridTemplateColumns` but the list is flex, so it counts 1 column: rows enter one by one at 70 + 17.5 × i ms, not by column (old.js:14234) | n/a | n/a |
| `drag.moved` stays true if no click follows a drag (e.g. the pointer ended outside), so the next real tap on the list is swallowed (old.js:14358-14363) | n/a | n/a |
| Short phones: an in-progress next row hides both its step and its bar (tag replaces them), so the resume position is not shown on the home (old.css:2736, 3084-3090) | n/a | n/a |
| `switchUnit` animates the notice pill (x 6 × dir) even when it is hidden (old.js:14208-14209) | n/a | n/a |
| `.st-map-chip` and `.st-me-cell` are in `PRESSABLE` and the press-ink rule but no element uses them in v21 (old.js:14275) | n/a | n/a |
| Exam date is hard-coded twice and differently: "Vize 1 · 20 Kas" in markup, "Vize 1 · 20 Kasım" in `unitMetaText`; current says "15 Kasım civarı" until set (old.js:14132, html:1263, `content/exam.ts:5`) | n/a | n/a (date is content: confirm with Eren) |

### Port notes (shell)

- The home's meaning is "one fixed screen, the whole course visible, one primary in the thumb zone": unit tabs + unit
  head + one list that scrolls inside itself, never the page. Porting it as a scrolling `Screen` loses that.
- Two navigation models conflict: old = two places (Dersler / Profil) as a bracketed title at the top that never leaves
  the screen; current = four bottom tabs (Bugün, Harita, Sınav, Ben). Decision 0006 step 6 asks for the old language
  with "better structure"; where Sınav and the mistake log live in a two-place model is an open question for Eren.
- The press has two parts that must both survive: half the depth in the tap's own frame, and a minimum visible depth
  on release (a sub-frame tap is never silent). Old depth is one fixed scale (0.96) for everything; ours is width-based.
- "No day counts anywhere" and "only things done on Profil" are Eren rules in the old code comments; the current app
  shows a countdown on Bugün and misses on Ben. Ask before porting either way.
- Rows are a single grid (`36px | 1fr | auto`) with three end-slot variants (chevron, check, step or "Yakında"); the next
  row is the only ringed, taller row and carries a second line and a bar. Names shorten by variant, never ellipsis.
- The lesson morph is FLIP with counter-scaled radius plus the map sinking to 0.97 around 50 % 40 %; the stage stays
  hidden until the morph lands. Ours clips instead of scaling; decide which (clip avoids text distortion; the old
  surface is empty during the morph, so scale did not distort text either).
- The launch greeting reads `lastSeen`, which only exists in the old ledger (stamped on step enter, page hide and
  pagehide). Porting it needs that timestamp in our storage.
- Not determined: the exact `sealOpen` / `sealClose` gap and motion (section 8 owns the seal); the duo `md` size
  geometry (section 3); `drawGlyphs` and `burst` (section 1 / 8).

## 10. Storage (old 8061-8351, 9277-9375)

The old app stores everything in `localStorage` as JSON under `satir.v3.*` keys, mirrored in memory for blocked
storage. The engine owns six keys; the feel layer owns one versioned "ledger" with its own read gate, repair,
migrations, corruption keeping and cross-tab merge. The current app stores three plain JSON keys through a
channel-prefixed `appStorage`, with no version, mirror, merge or failure handling; a Dexie database is declared but
unused.

### 10.1 Engine keys and the storage gate (old 9277-9375)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| Keys: `satir.v3.progress` {lesson, step}, `satir.v3.done` {code: last completion ms}, `satir.v3.answers` (log, last 500), `satir.v3.unclear` {"lesson:index": bool}, `satir.v3.run`, `satir.v3.picks` (old.js:9348-9351, 13459-13467) | `dizey.lessons` {id: {at, doneAt, answers, cleared}}, `dizey.settings`, exam keys (`exam/store.ts`), `dizey.onboarding.safari` | differs |
| `storageGet(key, fallback)`: localStorage first; a value must have the fallback's shape (object vs array; null fallback = any object), else falls to the memory copy, else the fallback; never throws (old.js:9280-9296) | `lesson/store.ts:9-16` and `settings.ts` parse in try; `getItem` itself outside try in settings (`settings.ts:37`), Onboarding, exam store | differs |
| `storageSet`: memory mirror first, then localStorage in try; failure is silent and the visit keeps working (old.js:9298-9305) | `appStorage.setItem` unguarded: a quota or blocked-storage error throws into React (`lesson/store.ts:39`, `settings.ts:53`) | missing |
| Boot probe `satir.v3.probe` write/remove → `storageBlocked`; the home says "Bu görünümde ilerleme kaydedilmiyor." once per visit (old.js:9337-9346) | none | missing |
| No channel separation (one origin, one app) | prefix per deployment channel (`pr-N:`) so previews never touch real progress (`lib/storage/app-storage.ts:7`) | n/a (current-only) |
| No persistence request | `navigator.storage.persist()` at boot (`lib/storage/db.ts:29`, `main.tsx:20`) | n/a (current-only) |
| No backup | export / restore of every channel key as JSON, format 1 (`lib/backup/backup.ts`, `MeView.tsx:187`) | n/a (current-only) |
| Bug: reads prefer localStorage over the memory mirror, so after a failed write (quota) the visit reads the stale stored value, not its own write (old.js:9287-9295, 8114-8120) | n/a | n/a |

### 10.2 Flags and constant tables (old 8060-8100)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| `FEEL_FLAGS` build-time, one per item: end, answer, moment, launch, touch, shelf, sound, all true in v21; with all off the feel layer registers nothing (old.js:8061-8062, 8049-8051) | none | n/a (decide whether we want feature flags) |
| `FEEL_TIMING` (ms): closeCap 600 (answers matrix soft close), ceremonyHold 350, ceremonyCap 1200, endSettleCap 4000, resumeHold 360 (a beat paused by a hidden page resumes this long after it is visible), streakSealCap 900 (reserved) (old.js:8065-8072) | none | missing (sections 8, 4, 6 use them) |
| `UNIT_EXAM_SHARE` A 14, B 15, C 5 of `EXAM_QUESTIONS` 34 (four real Vize 1 papers; topic sums in the comment), used in lesson-end narration " Vizede n/34 soru bu üniteden." (old.js:8074-8082, 8365) | `examItems` M 12, R 4, D 13, S 5 of 34 (`content/units.ts`), shown on Harita "geçmiş sınavlarda n / 34 soru" | differs (different unit split; both sum to 34) |
| `FEEL_LAYOUT.padTolerance` 0.1; `COURSE_COLS` 3 (row seal every 3 lessons, lesson-end matrix 3 wide); `COURSE_ROWS_SHOWN` 3 (old.js:8086, 8092-8095) | none | missing (section 8) |
| `feelState` {warnings, cues, timeline, events, end, moment, readOnly}; `feelWarn` collects messages; `feelMark` timeline only under QA (old.js:8097-8106) | none | n/a |

### 10.3 Ledger shape (`satir.v3.feel`, version 1) (old 8083-8084, 8152-8160)

| Old field | Meaning | Current | Status |
| --- | --- | --- | --- |
| `version` | integer ≥ 1; `LEDGER_VERSION` 1 | none (records unversioned; backup has `format` 1) | missing |
| `lastSeen` | ms of the last visit activity (launch greeting) | none | missing |
| `storage` | 'ok' / 'blocked' from the probe at load; never read | none | n/a |
| `lessonsDone` | completion order, distinct codes (drives row seals) | `doneAt` per record (no order list) | differs |
| `seals` | [{id `unit-X` / `row-N`, kind, at, lesson, silent?}] | none | missing |
| `moments` | {code: 'solved' / 'skipped' / 'open'} | none | missing |
| `notices` | string list, merged and cleaned but never written or read | none | n/a |
| `settings` | {sound: true, ambient?} | `dizey.settings` {examDate?, hideExamClock?, theme?, sound?: false} | differs |
| `stamps` | {"settings.name": ms} for cross-tab merge | none | missing |
| `worked` | ["lesson:index"] questions answered at least once | `answers` per record (first try) | differs |

### 10.4 Read path, repair and corruption (old 8108-8150, 8162-8186, 8276-8330)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| `feelRaw`: localStorage, else the memory mirror, never throws (old.js:8112-8121) | `appStorage.getItem` throws when storage is blocked | missing |
| `readKey(key, validate, fallback)`: unparsable or wrong shape → fallback plus a warning (old.js:8124-8135) | try/catch → `{}` | same idea |
| Shape check: object, integer version ≥ 1, arrays lessonsDone/seals/notices, objects moments/settings (old.js:8157-8160) | object check only (`lesson/store.ts:12`) | differs |
| `feelClean`, element by element: non-empty strings only, unique; seals need a string id, first id wins, kind defaults to the id prefix, `at` defaults to 0; moments keep only known states; stamps keep finite numbers; settings defaults merged, `sound` true unless exactly false; `lastSeen` finite else 0 (old.js:8168-8178) | `parseSettings` keeps only valid fields (`settings.ts:17-31`); lesson records not checked per field | differs |
| Codes the course no longer knows stay in the ledger but never count or render (`feelKnown`, `feelKnownDone`) (old.js:8163-8165) | records for unknown ids are ignored by views (iteration over `lessons`) | same idea |
| Unreadable ledger: kept once under `satir.v3.feel.corrupt-<ms>` (try; nothing if storage is full), then a fresh ledger replaces it; a warning is logged (old.js:8280-8287, 8317-8322) | unreadable value → `{}`, and the next save overwrites it: data lost silently | missing |
| Something unreadable appearing mid-visit (another tab, a bug) is also kept once before this save replaces it (old.js:8230-8232) | none | missing |
| `feelLedger()` is cached per visit; first read absorbs engine progress, probes storage and saves (old.js:8312-8330) | module-level cache read once (`lesson/store.ts:18`, `settings.ts:35-37`) | same idea |

### 10.5 Migrations (old 8088-8090, 8289-8300)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| `LEDGER_UPGRADES[v](ledger)` returns version v + 1; applied step by step from the stored version; empty in v21 (only version 1 exists) (old.js:8088-8090, 8291-8295) | Dexie `version(n)` rule documented but the DB is unused; localStorage records have no version | missing |
| A missing upgrader → treated as unreadable (kept and replaced) (old.js:8293) | none | missing |
| A newer ledger (from a newer build) is read and never written back: `readOnly` for the rest of the visit, warning logged (old.js:8296-8299, 8260) | none: an older build would overwrite newer data | missing |
| After adopting: defaults filled from the empty ledger, version clamped to the current, then cleaned (old.js:8300) | `parseSettings` drops unknown fields, so a newer field is lost on the next save | differs |
| Bug risk: `readOnly` is set as a side effect of any parse, including the merge before a save, so one newer copy appearing from another tab silently stops this tab's saves (old.js:8296, 8229) | n/a | n/a |

### 10.6 Absorbing engine progress and filing seals (old 8180-8221)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| `feelAbsorbDone`: lessons in `satir.v3.done` the ledger has not seen are added with silent seals (no ceremony); order by the earliest answer in the answer log for that lesson, else the done stamp (which is the last completion, rewritten on every repeat) (old.js:8207-8221) | none (one store) | n/a |
| `feelAddDone`: adds once; unknown codes are stored but earn nothing (old.js:8194-8205) | `doneAt` set on every finish (`LessonPlayer.tsx:132`) | differs |
| `feelSealsFor`: unit seal `unit-<id>` when every lesson the unit lists is done (not-ready lessons count, so a unit with "Yakında" lessons cannot be sealed yet); row seal `row-<n>` at every 3rd distinct done lesson; each id filed once (old.js:8186-8192) | none | missing (section 8) |

### 10.7 Cross-tab merge (old 8223-8256)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| Before every save (and before a completion is decided) the stored copy is folded in: lessonsDone union in stored order then ours; seals by id, stored first; notices and worked unions (old.js:8228-8239) | none: each tab writes its whole in-memory copy, so the last writer wins and the other tab's lessons are lost | missing |
| Moments only move forward: solved > skipped > open (`feelMomentRank`) (old.js:8087, 8241-8244) | none | missing |
| Settings: per setting, the copy with the newer stamp wins; a tie keeps the stored value; stamps merged to the max (old.js:8245-8253) | none | missing |
| `lastSeen` = max of both (old.js:8254) | none | missing |
| No `storage` event listener: another tab's change is picked up only at the next save, not shown live | none | same (neither listens) |

### 10.8 Save, setting, touch (old 8258-8278, 8587-8594, 8616-8621)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| `feelSave`: merge, then write unless read-only (old.js:8258-8261) | `saveRecord` / `saveSettings` write directly | differs |
| `feelSetting(name, value)`: sets and stamps `settings.<name>` with now (old.js:8264-8269) | `saveSettings(next)` | differs |
| `feelTouch` stamps `lastSeen` on boot, every step enter, `visibilitychange` to hidden, and `pagehide` (old.js:8272-8276, 8590-8594, 8621) | none | missing |
| `feelNoteWorked`: on every answer event, `lesson:index` added once (old.js:7824-7831, 8616) | first answer per step id in the record | differs |
| `feelFail`: a failure inside the feel layer never stops the engine; logged once, slots fall back (old.js:8629-8637, 9315-9333) | none | n/a |

### 10.9 Label fit (old 8333-8348)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| `fitLabel(el, variants)`: adds `.st-fit` (min-width 0, nowrap), stores variants in `data-variants`, tries each until `scrollWidth ≤ clientWidth + 0.5`, else keeps the last (shortest) (old.js:8336-8344, old.css:2012) | none | missing |
| `fitLabels()` re-fits every `[data-variants]` on resize (old.js:8346-8348, 8592) | none | missing |
| Users: row names, unit head line, lesson-end "Sıradaki: `<code>` · `<name>`" / "Sıradaki: `<code>`" (old.js:7631-7635, 8581) | none | missing |

### 10.10 QA hooks touching storage (old 8640-8700)

| Old (what + values + lines) | Current | Status |
| --- | --- | --- |
| `satir.feel.reset()`: removes every `satir.*` key and the mirror, clears the cache, `readOnly`, failure flag and logs, then reloads the ledger (old.js:8676-8690) | none | n/a |
| `satir.feel.ledger()` deep copy; `setSetting`; `seed(code)` marks a draft lesson done with silent seals (old.js:8655-8661, 8669, 8693) | none | n/a |

### Port notes (storage)

- The old ledger's guarantees are what we lack today: never throw on blocked or full storage (memory mirror), keep a
  corrupt value under a dated key before replacing it, never write back data from a newer build, upgrade step by step,
  and merge with the stored copy before every write so two tabs (Safari + Home Screen app on the same origin, or two
  tabs) never lose a lesson. Our `appStorage.setItem` can throw inside a React handler and our records have no version.
- CLAUDE.md non-negotiable 5 ("stored data migrates, never breaks") is not enforced by any code path yet: the Dexie
  schema is declared but nothing reads or writes it; progress lives in localStorage JSON without a version.
- The old app counts "worked" questions (any answer, once) and lessons in completion order (for row seals every 3);
  we store first-try answers and a completion time per lesson. Seals and "soru çalıştın" need either a new field or a
  derivation from our records (order can be derived from `doneAt`, but repeats overwrite it, like the old done stamp).
- Settings semantics differ: old `sound` defaults true and `ambient` (Müzik) is opt-in and subordinate to sound; ours
  stores `sound: false` only. A ported Müzik needs a new optional field.
- Exam share: both apps total 34 items but split them over different units; the number shown depends on our units.
- Not determined: what `satir.v3.run` and `satir.v3.picks` hold in detail (outside this region, old.js:13323-13467).
