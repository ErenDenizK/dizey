# Sound cue renderer

Dizey's musical moments (lesson end, halfway, milestone, seal, secret, lesson open) are pre-composed and rendered
offline from real instrument samples, then played from `src/assets/sound/*.m4a` (decision 0019). The background music
plays on the same instruments (decision 0020): `render_music_sets.py` renders its sample sets into
`src/assets/sound/music/`. This folder holds both renderers, so every file can be reproduced and a score changed.

- `scores.py`: the six scores (D-flat major, times in seconds, downbeat at 0).
- `model.py`: the note model and the instrument helpers (strings, cello, rolled chords, glissando, glock).
- `render_cues.py`: the sampler, humaniser, the shared room (RT60 2.4 s, 32 % wet, -4 dB above 5 kHz), the fade, AAC
  encode and the timeline export. The instruments are softened here (piano: dyn1 layer, low-pass 3.5 kHz) and shared.
- `render_music_sets.py`: the music's sample sets (piano, harp, strings, cello) as mono sprites plus
  `src/sound/sampleSets.ts` (note positions and loop points).

## Samples

[VSCO 2 Community Edition](https://github.com/sgossner/VSCO-2-CE), CC0 (public domain). The samples are not
committed (`tools/sound/.samples/` is git-ignored). Fetch only the six folders used (about 700 MB), pinned to the
commit the cues were rendered from:

```sh
git clone --filter=blob:none --no-checkout https://github.com/sgossner/VSCO-2-CE.git tools/sound/.samples/vsco
cd tools/sound/.samples/vsco
git sparse-checkout set "Keys/Upright Piano" "Percussion/Glock" "Strings/Cello Section" "Strings/Harp" \
  "Strings/Viola Section" "Strings/Violin Section"
git checkout 440300901dfe9275fd84e0b7763af1f8443ae62e
```

## Run

Needs Python 3, NumPy and `ffmpeg` (with the native `aac` encoder) on the path.

```sh
python3 tools/sound/render_cues.py                      # reads tools/sound/.samples/vsco
python3 tools/sound/render_cues.py --samples DIR --wav-dir out/   # also keeps lossless WAVs
python3 tools/sound/render_cues.py --only seal                    # one cue (timeline file is left alone)
python3 tools/sound/render_music_sets.py                          # the music's sample sets and their manifest
```

Outputs:

- `src/assets/sound/<cue>.m4a`: AAC-LC, 44.1 kHz stereo, about 96 kbps, `+faststart` (iOS Safari decodes it).
- `src/sound/cueTimeline.ts`: when each cue changes chord, plays melody notes, lands home and ends. The light layer
  (`lightScore`) reads it so sparks and glows land on the recorded music. Generated: do not edit.

The renderer is deterministic (seeded humanising), so the same samples and scores give the same files. After
re-rendering, recalibrate the levels: run `__dzMeasure.calibrateCues()` in the sound lab (`/lab/sounds`) and copy the
table into `CUE_TRIM` in `src/sound/cues.ts`; after re-rendering the music sets, adjust `SAMPLED_TRIM_DB` in
`src/sound/synth.ts` until `measureLessonMusic()` matches the synth voices' level again (about -49 LUFS at peak).
`__dzMeasure.renderDemo('lesson' | 'cues' | 'music')` renders the listening samples for the owner.

## Credits

Instrument samples: VSCO 2 CE by Versilian Studios and Sam Gossner, released under CC0 1.0 (public domain
dedication). No attribution is required; it is given here out of courtesy.
