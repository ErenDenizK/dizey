# Sound cue renderer

Dizey's musical moments (lesson end, halfway, milestone, seal, secret, lesson open) are pre-composed and rendered
offline from real instrument samples, then played from `src/assets/sound/*.m4a` (decision 0019). This folder holds the
renderer, so every file can be reproduced and a score changed.

- `scores.py`: the six scores (D-flat major, times in seconds, downbeat at 0).
- `model.py`: the note model and the instrument helpers (strings, cello, rolled chords, glissando, glock).
- `render_cues.py`: the sampler, humaniser, room reverb, limiter, AAC encode and the timeline export.

## Samples

[VSCO 2 Community Edition](https://github.com/sgossner/VSCO-2-CE), CC0 (public domain). The samples are not
committed (`tools/sound/.samples/` is git-ignored). Fetch only the seven folders used (about 800 MB), pinned to the
commit the cues were rendered from:

```sh
git clone --filter=blob:none --no-checkout https://github.com/sgossner/VSCO-2-CE.git tools/sound/.samples/vsco
cd tools/sound/.samples/vsco
git sparse-checkout set "Keys/Upright Piano" "Percussion/Glock" "Strings/Cello Section" "Strings/Harp" \
  "Strings/Viola Section" "Strings/Violin Section" "Woodwinds/Flute"
git checkout 440300901dfe9275fd84e0b7763af1f8443ae62e
```

## Run

Needs Python 3, NumPy and `ffmpeg` (with the native `aac` encoder) on the path.

```sh
python3 tools/sound/render_cues.py                      # reads tools/sound/.samples/vsco
python3 tools/sound/render_cues.py --samples DIR --wav-dir out/   # also keeps lossless WAVs
python3 tools/sound/render_cues.py --only seal                    # one cue (timeline file is left alone)
```

Outputs:

- `src/assets/sound/<cue>.m4a`: AAC-LC, 44.1 kHz stereo, about 96 kbps, `+faststart` (iOS Safari decodes it).
- `src/sound/cueTimeline.ts`: when each cue changes chord, plays melody notes, lands home and ends. The light layer
  (`lightScore`) reads it so sparks and glows land on the recorded music. Generated: do not edit.

The renderer is deterministic (seeded humanising), so the same samples and scores give the same files. After
re-rendering, recalibrate the levels: run `__dzMeasure.calibrateCues()` in the sound lab (`/lab/sounds`) and copy the
table into `CUE_TRIM` in `src/sound/cues.ts`.

## Credits

Instrument samples: VSCO 2 CE by Versilian Studios and Sam Gossner, released under CC0 1.0 (public domain
dedication). No attribution is required; it is given here out of courtesy.
