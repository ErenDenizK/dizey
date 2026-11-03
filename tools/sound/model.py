"""Score model for the sampled cues: notes in seconds, a builder with the shared instrument helpers."""

from __future__ import annotations

import math
from dataclasses import dataclass, field

import numpy as np

# A pad is one viola section note and, from G#3 up, one violin section note an octave-width apart in pan.
PAD_VIOLIN_FROM = 57
# Mix of the buses, dB relative to the instrument's own calibrated sample level.
MELODY_DB = 1.0
STRINGS_DB = 0.0
# After the last note the room keeps ringing: the file is this much longer than the music (seconds).
TAIL = 1.3

PENTATONIC = {1, 3, 5, 8, 10}  # D-flat major pentatonic pitch classes (D-flat, E-flat, F, A-flat, B-flat)


@dataclass
class Note:
    bank: str
    midi: int
    at: float  # seconds from the cue start (the downbeat is 0)
    dur: float  # sounding length before the release, seconds
    vel: float
    pan: float = 0.0
    rel: float = 0.5  # release, seconds
    attack: float = 0.004
    width: float = 1.0
    gain_db: float = 0.0
    early: float = 0.0  # legato: the note starts this much before `at`
    swell: list[tuple[float, float]] | None = None  # (absolute seconds, gain) breakpoints


@dataclass
class Cue:
    name: str
    notes: list[Note]
    length: float  # total length of the file, seconds
    chords: list[float]  # chord-change times, the last one is home
    shines: list[float]  # melody note times before home
    home: float
    fade: float = 0.8  # the last stretch falls exponentially to silence


class Builder:
    """Collects notes. `beat` is the length of one beat in seconds; `b(x)` converts beats to seconds."""

    def __init__(self, name: str, beat: float, length: float, seed: int):
        self.name, self.beat, self.length = name, beat, length
        self.rng = np.random.default_rng(seed)
        self.notes: list[Note] = []

    def b(self, beats: float) -> float:
        return beats * self.beat

    def humanise(self, at: float, vel: float) -> tuple[float, float]:
        """A player is never exact: up to 8 ms either way, 8 % in velocity. The downbeat stays at 0."""
        if at < 0.005:
            return at, vel * (1 + self.rng.uniform(-0.08, 0.08))
        return max(0.0, at + self.rng.uniform(-0.008, 0.008)), vel * (1 + self.rng.uniform(-0.08, 0.08))

    def add(self, bank: str, midi: int, at: float, dur: float, vel: float, human: bool = True, **kw) -> None:
        if human:
            at, vel = self.humanise(at, vel)
        self.notes.append(Note(bank, midi, at, dur, vel, **kw))

    def piano(self, midi, at, dur, vel, **kw):
        self.add('piano', midi, at, dur, vel, **kw)

    def melody(self, notes, home, harp_vel=None, final_rel=0.7, final_end=None, rel_short=0.3, piano_scale=1.0):
        """Soft piano melody (+1 dB) with an optional harp doubling. notes: (midi, at, dur) in seconds; the last
        one is held until `final_end` (seconds, sounding), then released over `final_rel`. Phrase dynamics: a gentle
        crescendo into `home` (0.36 up to 0.50), the home note at 0.55, then each later note a little softer."""
        before = [i for i, (_, at, _) in enumerate(notes) if at < home - 1e-6]
        later = 0
        for i, (m, at, dur) in enumerate(notes):
            last = i == len(notes) - 1
            if last and final_end is not None:
                dur = final_end - at
            rel = final_rel if last else min(rel_short, max(0.12, dur))
            if i in before:
                vel = 0.36 + 0.14 * (before.index(i) / max(1, len(before)))
            else:
                vel = 0.55 * 0.88 ** later
                later += 1
            self.piano(m, at, dur, vel * piano_scale, pan=0.05, rel=rel, gain_db=MELODY_DB)
            if harp_vel:
                self.add('harp', m, at, dur, harp_vel * (vel / 0.55) ** 0.5, pan=-0.3, rel=1.0 if last else 0.6,
                         gain_db=MELODY_DB)

    def strings(self, chord, at, end, vel, rel=0.4, legato=True, swell=None):
        """A viola + violin section pad on each chord tone, from `at` to `end` (sounding), then `rel`."""
        early = 0.04 if (legato and at > 0.01) else 0.0
        for m in chord:
            for bank, pan, gain in (('viola', 0.35, 1.0), ('violin', -0.35, 0.9)):
                if bank == 'violin' and m < PAD_VIOLIN_FROM:
                    continue
                self.add(bank, m, at, end - at, vel * gain, pan=pan, rel=rel, attack=0.08, width=1.5,
                         early=early, gain_db=STRINGS_DB, swell=swell, human=False)

    def cello(self, root, at, end, vel=0.7, rel=0.4):
        self.add('cello', root, at, end - at, vel, rel=rel, attack=0.08, early=0.04 if at > 0.01 else 0.0,
                 human=False)

    def roll(self, bank, chord, at, gap, vel, rel=1.0, dur=0.5, pan=-0.3):
        """A broken chord, lowest voice first, each a little softer."""
        for i, m in enumerate(chord):
            self.add(bank, m, at + i * gap, dur, vel * (1 - 0.05 * i), pan=pan, rel=rel)

    def gliss(self, lo, hi, at, over, vel_lo=0.22, vel_hi=0.4, rel=1.2, dur=1.0):
        """A quick pentatonic harp glissando, `over` seconds from `lo` to `hi`, brightening and panning right."""
        scale = [m for m in range(lo, hi + 1) if m % 12 in PENTATONIC]
        for i, m in enumerate(scale):
            f = i / max(1, len(scale) - 1)
            self.add('harp', m, at + f * over, dur, vel_lo + (vel_hi - vel_lo) * f, pan=-0.3 + 0.5 * f,
                     rel=rel, human=False)

    def glock(self, midis, at, gap, vel=0.18, rel=1.0, dur=0.5):
        for i, m in enumerate(midis):
            self.add('glock', m, at + i * gap, dur, vel, pan=0.4, rel=rel, human=False)

    def cue(self, chords, shines, home, tail=TAIL, fade=0.8) -> Cue:
        return Cue(self.name, self.notes, self.length + tail, chords, shines, home, fade)
