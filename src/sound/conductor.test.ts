import { describe, expect, it } from 'vitest'
import { CHANGE_TAU, createConductor, LOOKAHEAD, type MusicSink } from './conductor'
import type { Flourish, MusicCue, Role } from './form'
import { CHORDS, type ChordId, intervalOf, seeded } from './harmony'
import { BAR, BEAT, composeSection, freshState, type MusicState } from './music'
import type { Note } from './score'

type Play = { notes: Note[]; at: number; dropped: boolean; releasedAt?: number }

/** A fake clock and a fake synth: records what was played and how it was cut. */
function rig(wanted: (phrase: number) => MusicCue, seed = 1) {
  let time = 100
  const plays: Play[] = []
  const sink: MusicSink = {
    play: (notes, at) => void plays.push({ notes, at, dropped: false }),
    cut: (at) => {
      for (const play of plays) {
        if (play.dropped || play.releasedAt !== undefined) continue
        if (play.at >= at - 1e-4) play.dropped = true
        else play.releasedAt = at
      }
    },
  }
  const conductor = createConductor({ now: () => time, sink, random: seeded(seed), wanted })
  return {
    conductor,
    plays,
    now: () => time,
    advance: (dt: number) => {
      time += dt
    },
  }
}

const cue = (chord: ChordId, energy = 0.6, role: Role = 'travel'): MusicCue => ({
  chord,
  energy,
  role,
  act: 0,
  seed: 3,
})

const CHORD_IDS: ChordId[] = ['I', 'IV', 'iii', 'vi', 'ii', 'V']

const tonesOf = (id: ChordId) => {
  const c = CHORDS[id]
  return new Set(
    [...c.voicing, c.bass, ...c.arpeggio.map((i) => c.root + i)].map((pitch) => intervalOf(c, pitch)),
  )
}

/** Three minutes of listening: steps change at random 2 to 12 s, ticks at 400 ms with some late ones, a lesson end. */
function session(seed: number) {
  const random = seeded(seed)
  let chord: ChordId = 'I'
  const r = rig(() => cue(chord, 0.3 + random() * 0.6, random() < 0.2 ? 'arrival' : 'travel'), seed)
  const requests: { at: number; chord: ChordId; flourish: Flourish | undefined }[] = []
  const fades: { at: number; until: number }[] = []
  let nextRequest = r.now() + 5
  const fadeAt = r.now() + 150
  let faded = false
  const end = r.now() + 200
  let flourishes: (Flourish | undefined)[] = [undefined, 'rise', 'peak', 'cascade']
  while (r.now() < end) {
    r.conductor.tick()
    if (!faded && r.now() >= fadeAt) {
      faded = true
      const until = r.now() + 6
      r.conductor.fade(until)
      fades.push({ at: r.now(), until })
    }
    if (r.now() >= nextRequest && !r.conductor.paused) {
      const previous: ChordId = chord
      do chord = CHORD_IDS[Math.floor(random() * CHORD_IDS.length)] as ChordId
      while (chord === previous)
      const flourish = flourishes[Math.floor(random() * flourishes.length)]
      requests.push({ at: r.now(), chord, flourish })
      r.conductor.request(flourish)
      nextRequest = r.now() + 2 + random() * 10
    }
    // A busy frame now and then makes a tick up to 1 s late.
    r.advance(random() < 0.1 ? 0.4 + random() * 0.6 : 0.4)
  }
  flourishes = []
  return { ...r, requests, fades }
}

describe('music conductor', () => {
  it('starts every music group on the beat grid, within 1 ms', () => {
    for (const seed of [1, 2, 3]) {
      const { plays, conductor } = session(seed)
      const { origin } = conductor.grid
      const live = plays.filter((p) => !p.dropped)
      expect(live.length).toBeGreaterThan(100)
      for (const play of live) {
        const beats = (play.at - origin) / BEAT
        expect(Math.abs(beats - Math.round(beats)) * BEAT).toBeLessThan(0.001)
      }
    }
  })

  it('never leaves the pad silent for over 0.3 s outside a lesson end', () => {
    for (const seed of [1, 2, 3]) {
      const { plays, fades } = session(seed)
      const pads = plays
        .filter((p) => !p.dropped)
        .flatMap((p) =>
          p.notes
            .filter((n) => n.kind === 'pad')
            .map((n) => [n.at, Math.min(n.at + n.ring, p.releasedAt ?? Infinity)] as const),
        )
        .sort((a, b) => a[0] - b[0])
      let covered = pads[0]?.[1] ?? 0
      for (const [from, to] of pads) {
        const inCadence = fades.some((f) => covered >= f.at - 0.1 && from <= f.until + 3)
        if (from - covered > 0.3 && !inCadence)
          throw new Error(`seed ${seed}: pad gap of ${(from - covered).toFixed(2)} s at ${from.toFixed(2)}`)
        covered = Math.max(covered, to)
      }
    }
  })

  it('applies a step change within one beat and drops what had not started', () => {
    for (const seed of [1, 2, 3]) {
      const { requests, conductor, plays } = session(seed)
      expect(requests.length).toBeGreaterThan(10)
      for (const request of requests) {
        // The new phrase's first group starts on the first beat after the request.
        const first = plays.find(
          (p) => !p.dropped && p.at > request.at && p.notes.some((n) => n.kind === 'pad'),
        )
        expect(first).toBeDefined()
        expect((first as Play).at - request.at).toBeLessThanOrEqual(BEAT + 1e-6)
        // Nothing the old phrase wrote starts after that beat: it was dropped.
        const changeAt = (first as Play).at
        const stale = plays.filter(
          (p) =>
            !p.dropped &&
            p.at >= changeAt - 1e-4 &&
            p.at < changeAt + 1e-4 &&
            p !== first &&
            p.notes.some((n) => n.kind === 'pad'),
        )
        expect(stale).toEqual([])
      }
      expect(conductor.grid.beat).toBe(BEAT)
      expect(CHANGE_TAU).toBe(0.3)
    }
  })

  it('releases ringing groups at the change, not at the request', () => {
    const r = rig(() => cue('I'))
    r.conductor.tick()
    r.advance(1.1)
    r.conductor.tick()
    const before = r.plays.filter((p) => p.at < r.now() && !p.dropped).length
    r.conductor.request()
    const released = r.plays.filter((p) => p.releasedAt !== undefined)
    expect(before).toBeGreaterThan(0)
    expect(released.length).toBeGreaterThan(0)
    for (const play of released) expect(play.releasedAt).toBeGreaterThan(r.now())
    expect(r.plays.some((p) => p.dropped)).toBe(true)
  })

  it('writes no more than the lookahead and skips a late tick to the grid, never to now', () => {
    const r = rig(() => cue('vi'))
    r.conductor.tick()
    for (const p of r.plays) expect(p.at - r.now()).toBeLessThanOrEqual(LOOKAHEAD + BAR)
    const { origin } = r.conductor.grid
    // The page stalls for 7.3 s.
    r.advance(7.3)
    const before = r.plays.length
    r.conductor.tick()
    const fresh = r.plays.slice(before)
    expect(fresh.length).toBeGreaterThan(0)
    for (const p of fresh) {
      expect(p.at).toBeGreaterThan(r.now())
      const beats = (p.at - origin) / BEAT
      expect(Math.abs(beats - Math.round(beats)) * BEAT).toBeLessThan(0.001)
    }
  })

  it('plays the flourish on the first beat of the new phrase, with chord tones of the new chord only', () => {
    for (const kind of ['rise', 'peak', 'cascade'] as const)
      for (const chord of CHORD_IDS) {
        const r = rig(() => cue(chord))
        r.conductor.tick()
        r.advance(2)
        r.conductor.tick()
        r.conductor.request(kind)
        const first = r.plays.find(
          (p) =>
            !p.dropped &&
            p.notes.some((n) => n.kind === 'pad') &&
            p.at > r.now() - 0.001 &&
            p.releasedAt === undefined,
        )
        const start = (first as Play).at
        const flourish = r.plays
          .filter((p) => !p.dropped)
          .flatMap((p) => p.notes)
          .filter(
            (n) =>
              n.kind === 'shine' &&
              n.at >= start &&
              n.at < start + 0.3 * 10 &&
              n.velocity >= 0.1 &&
              n.at < start + 2 * BEAT,
          )
        expect(flourish.length, `${kind} ${chord}`).toBeGreaterThanOrEqual(5)
        for (const note of flourish)
          expect(tonesOf(chord), `${kind} ${chord} ${note.pitch}`).toContain(
            intervalOf(CHORDS[chord], note.pitch),
          )
      }
  })

  it('fades for a lesson end, stays out until it has rung, then returns on the grid with a soft pad', () => {
    const r = rig(() => cue('I'))
    r.conductor.tick()
    r.advance(3)
    r.conductor.tick()
    const { origin } = r.conductor.grid
    const until = r.now() + 5
    const count = r.plays.length
    r.conductor.fade(until)
    const cutAt = r.now()
    expect(r.conductor.paused).toBe(true)
    while (r.now() + 0.4 < until) {
      r.advance(0.4)
      r.conductor.tick()
    }
    expect(r.plays.length).toBe(count)
    for (const p of r.plays) expect(p.dropped || p.releasedAt !== undefined || p.at < cutAt).toBe(true)
    r.advance(0.5)
    r.conductor.tick()
    const back = r.plays.slice(count)
    expect(back.length).toBeGreaterThan(0)
    const first = back[0] as Play
    expect(first.at).toBeGreaterThanOrEqual(until)
    const beats = (first.at - origin) / BEAT
    expect(Math.abs(beats - Math.round(beats)) * BEAT).toBeLessThan(0.001)
    expect(first.notes.find((n) => n.kind === 'pad')?.rise).toBe(0.3)
  })
})

describe('bars', () => {
  it('never plays the same melody in two bars in a row, over three minutes', () => {
    for (const seed of [1, 2, 3, 4]) {
      const random = seeded(seed)
      let state: MusicState = freshState(seed)
      const bars: string[] = []
      let chord: ChordId = 'I'
      for (let n = 0; n < Math.ceil(180 / (BAR * 2)); n++) {
        if (n % 2 === 0) {
          chord = CHORD_IDS[Math.floor(random() * CHORD_IDS.length)] as ChordId
          state = { ...state, bar: 0 }
        }
        const energy = 0.3 + random() * 0.7
        const { notes, state: next } = composeSection(cue(chord, energy), 0, random, state, n === 0)
        state = next
        for (const [from, to] of [
          [0, BAR],
          [BAR, 2 * BAR],
        ] as const)
          bars.push(
            notes
              .filter((x) => x.kind === 'main' && x.bright > 0.1 && x.at >= from - 1e-6 && x.at < to - 1e-6)
              .map((x) => x.pitch)
              .join(','),
          )
      }
      const melodic = bars.map((b, i) => [b, i] as const)
      for (let i = 1; i < melodic.length; i++) {
        const [a, b] = [bars[i - 1] as string, bars[i] as string]
        if (a && b) expect(b, `seed ${seed} bar ${i}`).not.toBe(a)
      }
      expect(melodic.length).toBeGreaterThan(20)
    }
  })

  it('splits the pad so the first bar rings into the second without a gap', () => {
    const { notes } = composeSection(cue('IV', 0.5), 10, seeded(1), freshState(3))
    const pads = notes.filter((n) => n.kind === 'pad')
    const first = pads.filter((n) => n.at < 10 + BAR)
    const second = pads.filter((n) => n.at >= 10 + BAR)
    expect(first.length).toBe(second.length)
    for (const n of first) expect(n.at + n.ring).toBeGreaterThan(10 + BAR + 0.5)
  })
})
