"""The six musical cues as scores. Key: D-flat major (MIDI 61 = D-flat 4). Times in seconds.

Sound map (docs/decisions/0019): the downbeat is at 0 (no pickup), a cue is as short as its moment, and each
cue reports its timeline (chord changes, melody notes before home, home, end) so the light follows the music.
"""

from __future__ import annotations

from model import Builder, Cue

# D-flat major chords as voicings.
I_62 = [56, 61, 65]  # I over its fifth, the strings' home voicing
IV = [54, 58, 61]
V7_SHELL = [54, 60, 63]
I_FINAL = [56, 61, 65, 68]


def lesson_end() -> Cue:
    """I, IV, V7, I (home at 1.5 s). The motif and colour of the first prototype, in 3.2 s."""
    s = Builder('lessonEnd', 0.15, 3.2, 11)
    mel = [(68, 0.0, 0.45), (65, 0.45, 0.15), (70, 0.6, 0.45), (66, 1.05, 0.15),
           (72, 1.2, 0.10), (73, 1.3, 0.10), (75, 1.4, 0.10), (77, 1.5, 1.0)]
    s.melody(mel, flute_vel=0.5, flute_cap=84, flute_octave=True, final_rel=0.7, final_end=2.5)
    s.strings(I_62, 0.0, 0.6, 0.45)
    s.strings(IV, 0.6, 1.2, 0.45)
    s.strings(V7_SHELL, 1.2, 1.55, 0.45, rel=0.3)
    s.strings(I_FINAL, 1.5, 2.6, 0.5, rel=0.6)
    for root, a, b in ((37, 0.0, 0.6), (42, 0.6, 1.2), (44, 1.2, 1.5)):
        s.cello(root, a, b)
        s.piano(root, a, 0.5, 0.55, pan=-0.05, rel=0.4)
    s.cello(37, 1.5, 2.6, rel=0.6)
    s.piano(37, 1.5, 1.1, 0.6, pan=-0.05, rel=0.6)
    s.piano(49, 1.52, 1.1, 0.6, pan=-0.05, rel=0.6)
    s.roll('harp', [49, 56, 61, 65], 0.0, 0.04, 0.4)
    s.roll('harp', [42, 49, 54, 58], 0.6, 0.04, 0.4)
    s.roll('harp', [44, 54, 60, 63], 1.2, 0.04, 0.4)
    s.gliss(61, 97, 1.5, 0.35)
    s.glock([89, 92, 97], 1.6, 0.1, vel=0.3, rel=1.0)
    return s.cue([0.0, 0.6, 1.2, 1.5], [0.0, 0.45, 0.6, 1.05, 1.2, 1.3, 1.4], 1.5)


def halfway() -> Cue:
    """iv, then I (home at 0.8 s)."""
    s = Builder('halfway', 0.4, 2.4, 23)
    b = s.b
    mel = [(78, 0, b(.5)), (81, b(.5), b(.5)), (85, b(1), b(1)), (84, b(2), b(.5)), (85, b(2.5), b(2))]
    s.melody(mel, flute_vel=0.35, final_rel=0.6, final_end=b(4.5))
    s.strings([54, 57, 61], 0.0, b(2), 0.4)
    s.strings([56, 61, 65], b(2), b(4.5), 0.42, rel=0.6)
    s.cello(42, 0.0, b(2))
    s.cello(37, b(2), b(4.5), rel=0.6)
    for i, m in enumerate([42, 54, 57, 61]):
        s.add('harp', m, b(i * 0.5), b(0.5), 0.45, pan=-0.3, rel=1.0)
    s.gliss(61, 85, b(2), 0.3, rel=1.0)
    s.glock([89], b(2.5), 0, vel=0.3, rel=0.8)
    return s.cue([0.0, b(2)], [0.0, b(.5), b(1)], b(2))


def milestone() -> Cue:
    """iv, bVII, then I (home at 0.8 s): the biggest reward."""
    s = Builder('milestone', 0.4, 3.2, 31)
    b = s.b
    t = 1 / 3
    mel = [(73, 0, b(t)), (78, b(t), b(t)), (81, b(2 * t), b(t)), (82, b(1), b(t)), (83, b(1 + t), b(t)),
           (87, b(1 + 2 * t), b(t)), (85, b(2), b(.5)), (89, b(2.5), b(2.5))]
    s.melody(mel, final_rel=1.2, final_end=b(5))
    # The flute doubles only up to its comfortable top (84).
    for m, at, dur in mel:
        if m <= 84:
            s.add('flute', m, at, dur + 0.04, 0.4, pan=0.2, rel=0.3, attack=0.05, gain_db=2.0, human=False)
    s.strings([54, 57, 61], 0.0, b(1), 0.4)
    s.strings([59, 63, 66], b(1), b(2), 0.4)
    s.strings(I_62, b(2), b(5), 0.45, rel=1.2)
    s.cello(42, 0.0, b(1))
    s.cello(47, b(1), b(2))
    s.cello(37, b(2), b(5), rel=1.2)
    s.roll('harp', [42, 54, 57, 61], 0.0, 0.035, 0.42)
    s.roll('harp', [47, 59, 63, 66], b(1), 0.035, 0.42)
    s.gliss(61, 89, b(2), 0.35, rel=1.2)
    s.glock([89, 92, 97], b(2.5), 0.12, vel=0.35, rel=1.2)
    return s.cue([0.0, b(1), b(2)], [b(i * t) for i in range(6)], b(2))


def seal() -> Cue:
    """Vsus resolving to I (home at 0.57 s), the rozet's seal: 1.74 s."""
    s = Builder('seal', 0.38, 1.74, 41)
    b = s.b
    mel = [(80, 0, b(.5)), (82, b(.5), b(.5)), (84, b(1), b(.5)), (85, b(1.5), b(1.5))]
    s.melody(mel, harp_vel=0.4, final_rel=0.6, final_end=b(3))
    s.strings([56, 61, 63], 0.0, b(1.5), 0.4)
    s.strings([56, 61, 65], b(1.5), b(3), 0.42, rel=0.6)
    s.cello(44, 0.0, b(1.5))
    s.cello(37, b(1.5), b(3), rel=0.6)
    s.glock([97], b(1.5), 0, vel=0.28, rel=0.8)
    return s.cue([0.0, b(1.5)], [0.0, b(.5), b(1)], b(1.5))


def secret() -> Cue:
    """bVI (A major), then I sus2, held open (home at 0.9 s): mysterious and soft."""
    s = Builder('secret', 0.45, 2.6, 53)
    b = s.b
    mel = [(76, 0, b(.5)), (81, b(.5), b(.5)), (85, b(1), b(1)), (84, b(2), b(.5)), (79, b(2.5), b(.5)),
           (80, b(3), b(2))]
    for i, (m, at, dur) in enumerate(mel):
        last = i == len(mel) - 1
        s.add('flute', m, at, (b(5) - at) if last else dur, 0.6, pan=0.2, rel=0.35 if last else 0.25,
              attack=0.05, gain_db=2.0)
    s.strings([57, 61, 64], 0.0, b(2), 0.22)
    s.strings([61, 63, 68], b(2), b(5), 0.24, rel=0.35)
    s.cello(45, 0.0, b(2), vel=0.45)
    s.cello(37, b(2), b(5), vel=0.45, rel=0.35)
    s.roll('harp', [45, 57, 61, 64], 0.0, 0.12, 0.35, rel=1.2)
    s.roll('harp', [49, 61, 63, 68], b(2), 0.12, 0.35, rel=1.2)
    s.glock([92], b(3), 0, vel=0.2, rel=0.8)
    return s.cue([0.0, b(2)], [0.0, b(.5), b(1)], b(2))


def lesson_open() -> Cue:
    """A rising I arpeggio (home on the top note at 0.375 s): an invitation, not a fanfare."""
    s = Builder('lessonOpen', 0.25, 1.3, 67)
    b = s.b
    for i, m in enumerate([61, 65, 68, 73]):
        top = i == 3
        dur = 0.5 if top else b(.5)
        rel = 0.4 if top else 0.5
        s.add('harp', m, b(i * .5), dur, 0.5, pan=-0.3, rel=rel + 0.2)
        s.piano(m, b(i * .5), dur, 0.45, pan=0.05, rel=rel)
    s.strings(I_62, 0.0, 0.9, 0.3, rel=0.4, swell=[(0.0, 0.2), (0.6, 1.0)])
    return s.cue([0.0], [0.0, b(.5), b(1)], b(1.5))


CUES = [lesson_open, halfway, milestone, seal, secret, lesson_end]
