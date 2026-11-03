#!/usr/bin/env python3
"""Renders Dizey's musical cues from real instrument samples (VSCO 2 CE, CC0).

    python3 tools/sound/render_cues.py --samples tools/sound/.samples/vsco

Writes src/assets/sound/<cue>.m4a (AAC-LC, 44.1 kHz stereo, ~96 kbps) and src/sound/cueTimeline.ts.
Optional: --wav-dir DIR also writes the lossless WAVs. See tools/sound/README.md.
"""

from __future__ import annotations

import argparse
import glob
import json
import re
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import scores  # noqa: E402
from model import Cue, Note  # noqa: E402

SR = 44100
ROOT = Path(__file__).resolve().parents[2]
NOTE_NAMES = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}


def name_to_midi(name: str) -> int:
    m = re.match(r'([A-G])(#?)(\d)', name)
    return 12 * (int(m[3]) + 1) + NOTE_NAMES[m[1]] + (1 if m[2] else 0)


def read_wav(path: str) -> np.ndarray:
    w = wave.open(path)
    raw, ch, sw = w.readframes(w.getnframes()), w.getnchannels(), w.getsampwidth()
    assert w.getframerate() == SR, (path, w.getframerate())
    if sw == 2:
        a = np.frombuffer(raw, '<i2').astype(np.float32) / 32768
    elif sw == 3:
        b = np.frombuffer(raw, np.uint8).reshape(-1, 3).astype(np.int32)
        v = b[:, 0] | (b[:, 1] << 8) | (b[:, 2] << 16)
        a = (np.where(v >= 1 << 23, v - (1 << 24), v) / 8388608).astype(np.float32)
    else:
        raise ValueError(f'{path}: {sw * 8}-bit samples')
    a = a.reshape(-1, ch)
    if ch == 1:
        a = np.repeat(a, 2, 1)
    return a[:, :2].T.copy()


def write_wav(path: Path, y: np.ndarray) -> None:
    d = (np.clip(y, -1, 1).T * 32767).round().astype('<i2')
    w = wave.open(str(path), 'wb')
    w.setnchannels(2), w.setsampwidth(2), w.setframerate(SR)
    w.writeframes(d.tobytes())
    w.close()


def load_bank(pairs, target_rms: float):
    """(midi, layer, samples) with every layer of the instrument levelled to one RMS, onsets trimmed."""
    items = []
    for midi, layer, path in pairs:
        a = read_wav(path)
        env = np.abs(a).max(0)
        onset = int(np.argmax(env > 0.01 * env.max()))
        a = a[:, max(0, onset - 20):]
        items.append([midi, layer, a, np.sqrt((a[:, :SR] ** 2).mean())])
    per_layer: dict[int, list[float]] = {}
    for it in items:
        per_layer.setdefault(it[1], []).append(np.log(it[3]))
    layer_rms = {k: np.exp(np.mean(v)) for k, v in per_layer.items()}
    overall = np.exp(np.mean([np.log(v) for v in layer_rms.values()]))
    return [(m, l, a * (layer_rms[l] / r) * (target_rms / overall)) for m, l, a, r in items]


def load_banks(root: Path):
    def files(pattern):
        found = sorted(glob.glob(str(root / pattern)))
        if not found:
            sys.exit(f'No samples match {root / pattern}. See tools/sound/README.md to fetch them.')
        return found

    piano = []
    for f in files('Keys/Upright Piano/Player_dyn*_rr1_*.wav'):
        m = re.search(r'dyn(\d)_rr1_(\d+)', f)
        idx = int(m[2])
        piano.append((21 + 2 * idx if idx < 44 else 108, int(m[1]), f))
    by_name = lambda pattern, rx: [(name_to_midi(re.search(rx, f)[1]), 1, f) for f in files(pattern)]
    return {
        'piano': load_bank(piano, 0.10),
        'harp': load_bank(by_name('Strings/Harp/*.wav', r'_([A-G]#?\d)_'), 0.07),
        'violin': load_bank(by_name('Strings/Violin Section/susVib/*_v1.wav', r'susVib_([A-G]#?\d)_v1'), 0.055),
        'viola': load_bank(by_name('Strings/Viola Section/susvib/*_v1_1.wav', r'susvib_([A-G]#?\d)_v1'), 0.06),
        'cello': load_bank(by_name('Strings/Cello Section/susvib/*_v1_1.wav', r'susvib_([A-G]#?\d)_v1'), 0.08),
        'flute': load_bank(by_name('Woodwinds/Flute/susvib/*_1.wav', r'susvib_([A-G]#?\d)_'), 0.07),
        'glock': load_bank(by_name('Percussion/Glock/*.wav', r'medium_([A-G]#?\d)'), 0.05),
    }


def pan_gain(p: float):
    a = (p + 1) * np.pi / 4
    return np.cos(a) * 1.4142, np.sin(a) * 1.4142


def render_note(buf: np.ndarray, bank, n: Note, warnings: list[str]) -> None:
    layer = 1 if n.bank != 'piano' else (1 if n.vel < 0.4 else 2 if n.vel < 0.7 else 3)
    _, m, a = min(((abs(m - n.midi), m, a) for m, l, a in bank if l == layer), key=lambda c: c[0])
    st = n.midi - m
    if abs(st) > 4:
        warnings.append(f'{n.bank} {n.midi} stretched {st:+d} semitones')
    ratio = 2 ** (st / 12)  # resampling: pitch and time move together
    pos = np.arange(int((a.shape[1] - 2) / ratio)) * ratio
    i0 = pos.astype(int)
    fr = (pos - i0).astype(np.float32)
    y = a[:, i0] * (1 - fr) + a[:, i0 + 1] * fr
    start = max(0.0, n.at - n.early)
    nlen = int((n.dur + (n.at - start) + n.rel) * SR)
    if y.shape[1] < nlen:
        warnings.append(f'{n.bank} {n.midi} sample ends {y.shape[1] / SR:.2f}s, wanted {nlen / SR:.2f}s')
        nlen = y.shape[1]
    y = y[:, :nlen].copy()
    env = np.ones(nlen, np.float32)
    na = min(int(n.attack * SR), nlen)
    env[:na] = np.linspace(0, 1, na)
    r = min(int(n.rel * SR), nlen)
    env[nlen - r:] *= np.cos(np.linspace(0, np.pi / 2, r)) ** 2  # smooth to zero
    if n.swell:
        env *= np.interp(np.arange(nlen) / SR + start, [s[0] for s in n.swell], [s[1] for s in n.swell]).astype(np.float32)
    y *= env * n.vel * 10 ** (n.gain_db / 20)
    if n.width != 1.0:
        mid, side = (y[0] + y[1]) / 2, (y[0] - y[1]) / 2 * n.width
        y = np.stack([mid + side, mid - side])
    gl, gr = pan_gain(n.pan)
    y[0] *= gl
    y[1] *= gr
    s0 = int(round(start * SR))
    buf[:, s0:s0 + nlen] += y[:, :max(0, buf.shape[1] - s0)][:, :nlen]


def make_ir(rt60=2.0, pre=0.015, seed=7):
    """A synthetic stereo room: dark exponential noise tail."""
    rng = np.random.default_rng(seed)
    n = int(rt60 * 1.15 * SR)
    t = np.arange(n) / SR
    out = []
    for _ in range(2):
        z = rng.standard_normal(n)
        dark = np.convolve(z, np.ones(12) / 12, 'same')
        w = np.exp(-t / 0.45)
        x = (z * w + dark * 2.5 * (1 - w)) * np.exp(-6.9078 * t / rt60) * np.minimum(1, t / 0.01)
        out.append(np.concatenate([np.zeros(int(pre * SR)), x]))
    ir = np.stack(out)
    return ir / np.sqrt((ir ** 2).sum(1, keepdims=True))


def reverb(x: np.ndarray, wet=0.25) -> np.ndarray:
    ir = make_ir()
    n = x.shape[1] + ir.shape[1]
    size = 1 << (n - 1).bit_length()
    xh = x - np.stack([np.convolve(c, np.ones(300) / 300, 'same') for c in x])  # no low-end mud in the wet signal
    mono = np.fft.rfft(xh.mean(0), size)
    w = np.stack([np.fft.irfft(mono * np.fft.rfft(ir[c], size), size)[:n] for c in range(2)])
    pad = np.zeros((2, n))
    pad[:, :x.shape[1]] = x
    g = np.sqrt((x ** 2).mean() / ((w[:, :x.shape[1]] ** 2).mean() + 1e-12))
    return pad * (1 - 0.1 * wet) + wet * g * w


def soft_clip(x: np.ndarray, thresh=0.6) -> np.ndarray:
    a = np.abs(x)
    return np.where(a > thresh, np.sign(x) * (thresh + (1 - thresh) * np.tanh((a - thresh) / (1 - thresh))), x)


def render(cue: Cue, banks, warnings: list[str]) -> np.ndarray:
    buf = np.zeros((2, int((cue.length + 0.6) * SR)))
    for n in cue.notes:
        render_note(buf, banks[n.bank], n, warnings)
    y = reverb(buf)[:, :int(cue.length * SR)]
    f = int(cue.fade * SR)
    y[:, -f:] *= np.cos(np.linspace(0, np.pi / 2, f)) ** 2
    y = soft_clip(y / np.abs(y).max() * 0.9)
    # The cue must land on the tap: drop anything before the first audible sample (keep 2 ms).
    first = int(np.argmax(np.abs(y).max(0) > 10 ** (-60 / 20)))
    y = y[:, max(0, first - int(0.002 * SR)):]
    ramp = int(0.002 * SR)  # a 2 ms fade-in: the file can never begin with a step
    y[:, :ramp] *= np.linspace(0, 1, ramp)
    return y / np.abs(y).max() * 10 ** (-2 / 20)


def encode(wav: Path, m4a: Path) -> None:
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(wav), '-c:a', 'aac', '-b:a', '96k', '-ar', '44100',
                    '-ac', '2', '-movflags', '+faststart', str(m4a)], check=True)


def timeline_ts(cues: dict[str, Cue], lengths: dict[str, float]) -> str:
    rows = []
    for name, c in cues.items():
        r = lambda xs: '[' + ', '.join(f'{x:.3f}'.rstrip('0').rstrip('.') for x in xs) + ']'
        rows.append(f"  {name}: {{ chords: {r(c.chords)}, shines: {r(c.shines)}, home: {c.home:.3f}, "
                    f"end: {lengths[name]:.3f} }},")
    return ('// Generated by tools/sound/render_cues.py: do not edit. When each recorded cue changes chord, plays a\n'
            '// melody note before home, lands home and ends, in seconds from its first sample (the downbeat is 0).\n'
            'export type CueTimeline = { chords: number[]; shines: number[]; home: number; end: number }\n\n'
            'export const CUE_TIMELINE = {\n' + '\n'.join(rows) + '\n} satisfies Record<string, CueTimeline>\n')


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('--samples', type=Path, default=Path(__file__).parent / '.samples' / 'vsco')
    p.add_argument('--out', type=Path, default=ROOT / 'src' / 'assets' / 'sound')
    p.add_argument('--timeline', type=Path, default=ROOT / 'src' / 'sound' / 'cueTimeline.ts')
    p.add_argument('--wav-dir', type=Path, help='also write the lossless WAV of each cue here')
    p.add_argument('--only', nargs='*', help='render only these cues')
    args = p.parse_args()

    banks = load_banks(args.samples)
    args.out.mkdir(parents=True, exist_ok=True)
    cues, lengths = {}, {}
    for build in scores.CUES:
        cue = build()
        if args.only and cue.name not in args.only:
            continue
        warnings: list[str] = []
        y = render(cue, banks, warnings)
        wav = (args.wav_dir or args.out) / f'{cue.name}.wav'
        wav.parent.mkdir(parents=True, exist_ok=True)
        write_wav(wav, y)
        m4a = args.out / f'{cue.name}.m4a'
        encode(wav, m4a)
        if not args.wav_dir:
            wav.unlink()
        cues[cue.name], lengths[cue.name] = cue, y.shape[1] / SR
        print(f'{cue.name}: {y.shape[1] / SR:.2f} s, {m4a.stat().st_size / 1024:.0f} KB', *warnings, sep='\n  ' if warnings else '')
    if not args.only:
        args.timeline.write_text(timeline_ts(cues, lengths))


if __name__ == '__main__':
    main()
