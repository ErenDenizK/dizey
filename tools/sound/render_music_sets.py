#!/usr/bin/env python3
"""Renders the instrument sample sets of the background music (VSCO 2 CE, CC0) from the same banks as the cues.

    python3 tools/sound/render_music_sets.py --samples tools/sound/.samples/vsco

One small mono m4a "sprite" per instrument (all of its notes, one after another, with silence between), pre-filtered
and level-normalised, plus src/sound/sampleSets.ts (where each note sits, and its loop region). The samples are dry:
the app's music bus adds the room. See docs/decisions/0020-one-sound-world.md.

- piano: the upright's softest layer, low-passed (3.5 kHz), a note every 3 semitones, MIDI 37-85
- harp: KSHarp as recorded, every 3 semitones, MIDI 37-85
- strings: viola + violin section sustains, every 4 semitones, MIDI 49-77, with a crossfaded loop region
- cello: cello section sustain, every 4 semitones, MIDI 36-56, with a crossfaded loop region
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from render_cues import ROOT, SR, load_banks, write_wav  # noqa: E402

GAP = 0.15  # silence before and after every note in a sprite, seconds (absorbs any encoder delay)


def shifted(bank, midi: int) -> np.ndarray:
    """Mono, resampled from the nearest recorded note to `midi` (pitch and time move together)."""
    _, _, a = min(((abs(m - midi), m, a) for m, _l, a in bank), key=lambda c: c[0])
    src = min(bank, key=lambda c: abs(c[0] - midi))
    ratio = 2 ** ((midi - src[0]) / 12)
    x = src[2].mean(0)
    pos = np.arange(int((len(x) - 2) / ratio)) * ratio
    i0 = pos.astype(int)
    fr = (pos - i0).astype(np.float32)
    return x[i0] * (1 - fr) + x[i0 + 1] * fr


def plucked(bank, midi: int, length: float, fade: float, attack: float = 0.003) -> dict:
    """A decaying note: `length` seconds, the last `fade` of them a smooth fall to zero."""
    x = shifted(bank, midi)[:int(length * SR)].copy()
    n = len(x)
    f = min(int(fade * SR), n)
    x[n - f:] *= np.cos(np.linspace(0, np.pi / 2, f)) ** 2
    a = int(attack * SR)
    x[:a] *= np.linspace(0, 1, a)
    return {'x': x, 'loop': None}


def sustained(banks: list, midi: int, lead: float, body: float, cross: float = 0.6) -> dict:
    """A bowed note with a seamless loop: `lead` s of the natural attack, then `body` s of sustain whose first
    `cross` s are crossfaded with the material just after it, so the loop point has no seam."""
    parts = [shifted(bank, midi) * weight for bank, weight in banks]
    n = min(len(p) for p in parts)
    x = sum(p[:n] for p in parts)
    start = int(lead * SR)
    end = start + int((body + cross) * SR)
    assert end + SR // 4 <= n, (midi, n / SR)
    c = int(cross * SR)
    loop = x[start:end - c].copy()  # `body` seconds
    t = np.linspace(0, np.pi / 2, c)
    # The loop's first `c` samples fade from the material that follows the loop end into the loop's own start.
    loop[:c] = loop[:c] * np.sin(t) + x[end - c:end] * np.cos(t)
    out = np.concatenate([x[:start], loop])
    a = int(0.01 * SR)
    out[:a] *= np.linspace(0, 1, a)
    return {'x': out, 'loop': (lead, lead + body)}


def sprite(notes: dict[int, dict]) -> tuple[np.ndarray, list[dict]]:
    gap = np.zeros(int(GAP * SR), np.float32)
    chunks, rows, pos = [gap], [], GAP
    for midi, n in notes.items():
        x = n['x']
        # Each note ends in silence, so the slice after it is safe even when a decoder is a few ms off.
        chunks += [x.astype(np.float32), gap]
        row = {'midi': midi, 'at': round(pos, 4), 'length': round(len(x) / SR, 4)}
        if n['loop']:
            row['loop'] = [round(pos + n['loop'][0], 4), round(pos + n['loop'][1], 4)]
        rows.append(row)
        pos += len(x) / SR + GAP
    return np.concatenate(chunks), rows


def encode(x: np.ndarray, m4a: Path, kbps: int) -> None:
    wav = m4a.with_suffix('.wav')
    write_wav(wav, np.stack([x, x]))
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(wav), '-c:a', 'aac', '-b:a', f'{kbps}k', '-ar', '44100',
                    '-ac', '1', '-movflags', '+faststart', str(m4a)], check=True)
    wav.unlink()


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('--samples', type=Path, default=Path(__file__).parent / '.samples' / 'vsco')
    p.add_argument('--out', type=Path, default=ROOT / 'src' / 'assets' / 'sound' / 'music')
    p.add_argument('--manifest', type=Path, default=ROOT / 'src' / 'sound' / 'sampleSets.ts')
    p.add_argument('--bitrate', type=int, default=40)
    args = p.parse_args()
    banks = load_banks(args.samples)
    args.out.mkdir(parents=True, exist_ok=True)

    sets: dict[str, dict[int, dict]] = {
        'piano': {m: plucked(banks['piano'], m, 3.4, 0.9) for m in range(37, 86, 3)},
        'harp': {m: plucked(banks['harp'], m, 2.6, 0.7) for m in range(37, 86, 3)},
        'strings': {m: sustained([(banks['viola'], 0.7)] + ([(banks['violin'], 0.55)] if m >= 57 else []), m, 1.0, 3.0)
                    for m in range(49, 78, 4)},
        'cello': {m: sustained([(banks['cello'], 1.0)], m, 0.8, 2.5) for m in range(36, 57, 4)},
    }
    rows = []
    total = 0
    for name, notes in sets.items():
        x, table = sprite(notes)
        m4a = args.out / f'{name}.m4a'
        encode(x, m4a, args.bitrate)
        total += m4a.stat().st_size
        print(f'{name}: {len(notes)} notes, {len(x) / SR:.1f} s, {m4a.stat().st_size / 1024:.0f} KB')
        lines = []
        for r in table:
            loop = f", loop: [{r['loop'][0]}, {r['loop'][1]}]" if 'loop' in r else ''
            lines.append(f"    {{ midi: {r['midi']}, at: {r['at']}, length: {r['length']}{loop} }},")
        rows.append((name, lines))
    print(f'total {total / 1024:.0f} KB')
    imports = ''.join(f"import {n} from '../assets/sound/music/{n}.m4a'\n" for n, _ in rows)
    body = ''.join(f"  {n}: {{\n    url: {n},\n    notes: [\n" + '\n'.join(l) + '\n    ],\n  },\n' for n, l in rows)
    args.manifest.write_text(
        imports
        + '\n// Generated by tools/sound/render_music_sets.py: do not edit. Where every note sits in its sprite file\n'
        '// (seconds from the start of the decoded buffer) and, for sustained instruments, the loop region.\n'
        'export type SampleNote = { midi: number; at: number; length: number; loop?: [number, number] }\n'
        'export type SampleSetSpec = { url: string; notes: SampleNote[] }\n'
        'export type SampleSetId = keyof typeof SAMPLE_SETS\n\n'
        'export const SAMPLE_SETS = {\n' + body + '} satisfies Record<string, SampleSetSpec>\n'
    )


if __name__ == '__main__':
    main()
