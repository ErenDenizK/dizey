import { useNavigate } from '@tanstack/react-router'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { lab } from '../content/lab'
import { engine } from '../engine/driver'
import { useSettings } from '../progress/settings'
import {
  CHORDS,
  type ChordId,
  chordAt,
  intervalOf,
  mod,
  PROGRESSION,
  seeded,
  TONIC_MIDI,
} from '../sound/harmony'
import { listenSounds, playSound, setMusicOn, setMusicSoft, setPalette, setSoundOn } from '../sound/player'
import { createScore, EVENTS, type Plan, type SoundEvent } from '../sound/score'
import { PALETTES, type PaletteId } from '../sound/synth'
import { ChevronLeft } from '../ui/icons'
import { Pressable } from '../ui/Pressable'
import { Switch } from '../ui/Switch'
import '../ui/ui.css'
import './lab.css'
import './sound-lab.css'

const STEPS = PROGRESSION.length
const text = lab.sounds

/* ---------- Names ---------- */

const NOTE_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B']
const noteName = (midi: number) => NOTE_NAMES[mod(midi, 12)] as string

/** "D♭maj9", or "D♭sus4" for a suspended chord as score.ts names it ("I:sus"). */
function chordLabel(name: string) {
  const [id, sus] = name.split(':') as [ChordId, string | undefined]
  const [full, , , root] = text.chords[id]
  return sus ? `${root}sus4` : full
}

/* ---------- Keyboard ---------- */

/** G2 to C6: every pitch any sound or the music plays. */
const LOW = 43
const HIGH = 84
const BLACK = new Set([1, 3, 6, 8, 10])
type Light = 'chord' | 'tension' | 'lean' | 'bass' | 'tone'

/** What a note is to the chord it sounds over: the keyboard colours it by that. */
function lightOf(plan: Plan, pitch: number, kind: string, ring: number): Light {
  if (kind === 'shine' || plan.notes.filter((n) => n.kind === 'main').length === 1) return 'tone'
  const last = plan.chords.at(-1)?.split(':')[0] as ChordId | undefined
  const chord = last ? CHORDS[last] : CHORDS.I
  if (pitch === chord.bass) return 'bass'
  if (plan.chords.some((c) => c.endsWith(':sus')) && ring < 0.7) return 'lean'
  const interval = intervalOf(chord, pitch)
  return [2, 5, 6, 9].includes(interval) ? 'tension' : 'chord'
}

function Keyboard({ lit }: { lit: Map<number, Light> }) {
  const whites: number[] = []
  for (let m = LOW; m <= HIGH; m++) if (!BLACK.has(mod(m, 12))) whites.push(m)
  const width = 100 / whites.length
  return (
    <div className="sl-kbd" aria-hidden="true">
      {whites.map((m) => (
        <span key={m} className="sl-key" data-on={lit.get(m)} style={{ width: `${width}%` }} />
      ))}
      {Array.from({ length: HIGH - LOW + 1 }, (_, k) => LOW + k)
        .filter((m) => BLACK.has(mod(m, 12)))
        .map((m) => {
          const left = whites.filter((w) => w < m).length * width
          return (
            <span
              key={m}
              className="sl-key sl-key--black"
              data-on={lit.get(m)}
              style={{ left: `calc(${left}% - ${width * 0.3}%)`, width: `${width * 0.6}%` }}
            />
          )
        })}
    </div>
  )
}

/* ---------- The lesson that plays itself ---------- */

const A = [
  [1, 2],
  [3, 1],
]
const B = [
  [2, 0],
  [1, 3],
]
const C = [0, 1].map((i) =>
  [0, 1].map((j) => (A[i]?.[0] ?? 0) * (B[0]?.[j] ?? 0) + (A[i]?.[1] ?? 0) * (B[1]?.[j] ?? 0)),
)

type Scene = {
  step: number
  row: number | null
  col: number | null
  filled: boolean[][]
  fresh: [number, number] | null
  caption: string
  options: { value: number; state?: 'wrong' | 'right' }[] | null
  done: boolean
}

const emptyScene = (): Scene => ({
  step: 0,
  row: null,
  col: null,
  filled: [
    [false, false],
    [false, false],
  ],
  fresh: null,
  caption: text.lesson.idle,
  options: null,
  done: false,
})

type Cue = [delay: number, event: SoundEvent | null, change: (scene: Scene) => Scene, index?: number]

/** Six steps, one per chord: three cells worked out, a question, the finished matrix, the lesson end. */
function lessonCues(): Cue[] {
  const cues: Cue[] = []
  const cells: [number, number][] = [
    [0, 0],
    [0, 1],
    [1, 0],
  ]
  cells.forEach(([i, j], s) => {
    const products = text.lesson.products(`${A[i]?.[0]}·${B[0]?.[j]}`, `${A[i]?.[1]}·${B[1]?.[j]}`)
    cues.push(
      [
        s === 0 ? 0 : 1.1,
        s === 0 ? 'lessonOpen' : 'step',
        (x) => ({ ...x, step: s, row: null, col: null, fresh: null }),
      ],
      [s === 0 ? 2 : 0.9, 'select', (x) => ({ ...x, row: i, caption: text.lesson.row(i + 1) }), 0],
      [0.55, 'select', (x) => ({ ...x, col: j, caption: text.lesson.col(j + 1) }), 1],
      [0.7, 'merge', (x) => ({ ...x, caption: products })],
      [
        0.75,
        'land',
        (x) => ({
          ...x,
          filled: x.filled.map((r, a) => r.map((v, b) => v || (a === i && b === j))),
          fresh: [i, j],
          caption: text.lesson.cell(i + 1, j + 1, C[i]?.[j] ?? 0),
        }),
        i * 2 + j,
      ],
    )
  })
  cues.push(
    [
      1.2,
      'step',
      (x) => ({
        ...x,
        step: 3,
        row: 1,
        col: 1,
        fresh: null,
        caption: text.lesson.question,
        options: [{ value: 9 }, { value: 3 }, { value: 5 }],
      }),
    ],
    [
      1.8,
      'wrong',
      (x) => ({
        ...x,
        caption: text.lesson.wrong,
        options: x.options?.map((o) => (o.value === 9 ? { ...o, state: 'wrong' as const } : o)) ?? null,
      }),
    ],
    [
      2.4,
      'correct',
      (x) => ({
        ...x,
        caption: text.lesson.right,
        filled: x.filled.map((r, a) => r.map((v, b) => v || (a === 1 && b === 1))),
        fresh: [1, 1],
        options: x.options?.map((o) => (o.value === 3 ? { ...o, state: 'right' as const } : o)) ?? null,
      }),
    ],
    [2.6, 'step', (x) => ({ ...x, step: 4, row: null, col: null, fresh: null, options: null })],
    [0.9, 'merge', (x) => ({ ...x, done: true })],
    [1.6, 'step', (x) => ({ ...x, step: 5 })],
    [1.2, 'lessonEnd', (x) => ({ ...x, caption: text.lesson.end })],
  )
  return cues
}

function Matrix({
  name,
  values,
  row,
  col,
  filled,
  fresh,
  done,
}: {
  name: string
  values: number[][]
  row?: number | null
  col?: number | null
  filled?: boolean[][]
  fresh?: [number, number] | null
  done?: boolean
}) {
  return (
    <div className="sl-mat">
      <div className="sl-mat__grid">
        {values.map((r, i) =>
          r.map((v, j) => {
            const shown = filled ? filled[i]?.[j] : true
            const tone = i === row ? 'row' : j === col ? 'col' : undefined
            return (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed 2×2 cells
                key={`${i}${j}`}
                className="sl-cell"
                data-tone={tone}
                data-empty={!shown || undefined}
                data-fresh={(fresh && fresh[0] === i && fresh[1] === j) || undefined}
                data-done={done || undefined}
              >
                {shown ? v : ''}
              </span>
            )
          }),
        )}
      </div>
      <span className="sl-mat__name">{name}</span>
    </div>
  )
}

/* ---------- The page ---------- */

const score = createScore(seeded(1))
const PLAIN: SoundEvent[] = ['select', 'land', 'merge', 'correct', 'wrong', 'lessonOpen', 'lessonEnd']
const TOUCH: SoundEvent[] = ['tap', 'tab', 'toggleOn', 'toggleOff', 'open', 'close', 'step']
const REWARDS: [SoundEvent, keyof typeof text.tags][] = [
  ['streak', 'small'],
  ['seal', 'medium'],
  ['halfway', 'medium'],
  ['milestone', 'large'],
  ['secret', 'hidden'],
]
const TIER_TAG = {
  frequent: 'frequent',
  question: 'question',
  lesson: 'lesson',
  touch: 'touch',
  reward: 'medium',
} as const

/**
 * Every sound in the app, heard and seen: a live keyboard that lights each note as it plays, a
 * lesson that plays itself, the chord walk, the three palettes, the background music, every event
 * and reward, and the theory behind them.
 */
export function SoundLab() {
  const navigate = useNavigate()
  const settings = useSettings()
  const on = settings.sound !== false
  const palette: PaletteId = settings.palette ?? 'rhodes'
  const [step, setStep] = useState(0)
  const [lit, setLit] = useState<Map<number, Light>>(new Map())
  const [readout, setReadout] = useState<{ event: string; chord: string; detail: string }>({
    event: text.console.idle,
    chord: 'I',
    detail: '',
  })
  const [scene, setScene] = useState<Scene>(emptyScene)
  const [playing, setPlaying] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const progress = useRef<HTMLSpanElement>(null)
  const stage = useRef<HTMLDivElement>(null)

  // Motion on the engine's springs: the progress bar glides; a value landing in C pops and settles.
  const filled = playing || scene.done ? (scene.step + 1) / STEPS : 0
  useLayoutEffect(() => {
    const bar = progress.current
    if (bar) engine.withChannel('chrome', () => engine.to(bar, { scaleX: filled }, 'glide'))
  }, [filled])
  const freshKey = scene.fresh ? scene.fresh.join('') : ''
  useLayoutEffect(() => {
    const cell = stage.current?.querySelector<HTMLElement>('.sl-cell[data-fresh]')
    if (!cell || !freshKey) return
    engine.set(cell, { scale: 0.7 })
    engine.withChannel('chrome', () => engine.to(cell, { scale: 1 }, 'snap'))
  }, [freshKey])

  // The keyboard and readout follow every sound the app schedules, on the moment it sounds.
  useEffect(() => {
    const pending = new Set<ReturnType<typeof setTimeout>>()
    const later = (ms: number, run: () => void) => {
      const t = setTimeout(() => {
        pending.delete(t)
        run()
      }, ms)
      pending.add(t)
    }
    const stop = listenSounds((plan, now) => {
      const name = text.events[plan.event as keyof typeof text.events]?.[0] ?? plan.event
      const last = plan.chords.at(-1) ?? 'I'
      const id = last.split(':')[0] as ChordId
      const one = plan.notes.filter((n) => n.kind === 'main' && n.pitch !== CHORDS[id].bass)
      later(Math.max(0, (plan.notes[0]?.at ?? now) - now) * 1000, () =>
        setReadout({
          event: name,
          chord: last,
          detail: one.length === 1 ? noteName(TONIC_MIDI + (one[0]?.pitch ?? 0)) : '',
        }),
      )
      for (const note of plan.notes) {
        if (note.kind === 'thump' || note.kind === 'halo') continue
        const midi = TONIC_MIDI + note.pitch
        if (midi < LOW || midi > HIGH) continue
        const light = lightOf(plan, note.pitch, note.kind, note.ring)
        const at = Math.max(0, note.at - now) * 1000
        later(at, () => setLit((m) => new Map(m).set(midi, light)))
        later(at + Math.min(900, note.ring * 450), () =>
          setLit((m) => {
            if (m.get(midi) !== light) return m
            const next = new Map(m)
            next.delete(midi)
            return next
          }),
        )
      }
    })
    return () => {
      stop()
      for (const t of pending) clearTimeout(t)
    }
  }, [])

  const stopLesson = () => {
    for (const t of timers.current) clearTimeout(t)
    timers.current = []
    setPlaying(false)
  }
  // biome-ignore lint/correctness/useExhaustiveDependencies: clears the lesson's timers on leaving
  useEffect(() => stopLesson, [])

  const startLesson = () => {
    stopLesson()
    setPlaying(true)
    let s = emptyScene()
    setScene(s)
    let at = 0
    const cues = lessonCues()
    cues.forEach(([delay, event, change, index], k) => {
      at += delay
      timers.current.push(
        setTimeout(() => {
          s = change(s)
          setScene(s)
          setStep(s.step)
          if (event)
            playSound(event, { step: s.step, steps: STEPS, ...(index === undefined ? {} : { index }) })
          if (k === cues.length - 1) setTimeout(() => setPlaying(false), 2000)
        }, at * 1000),
      )
    })
  }

  const play = (event: SoundEvent, index?: number) =>
    playSound(event, { step, steps: STEPS, ...(index === undefined ? {} : { index }) })

  const stepChord = chordAt(step, STEPS)
  const [chordName, roman] = text.chords[stepChord]
  const [readName, readRoman, readFn] = text.chords[readout.chord.split(':')[0] as ChordId]

  const card = (event: SoundEvent, tag: string, extra?: string, index?: number) => {
    const plan = score.plan(event, { step, steps: STEPS, ...(index === undefined ? {} : { index }) })
    const [name, body] = text.events[event as keyof typeof text.events]
    return (
      <Pressable
        key={event}
        className="sl-ev"
        data-tier={EVENTS[event].tier}
        data-testid={`sound-${event}`}
        onClick={() => play(event, index)}
      >
        <span className="sl-ev__head">
          <b>{name}</b>
          <small>{tag}</small>
        </span>
        <span className="sl-ev__body">{body}</span>
        <span className="sl-ev__chords">
          {plan.chords.map(chordLabel).join(' → ')}
          {extra ? ` · ${extra}` : ''}
        </span>
      </Pressable>
    )
  }

  return (
    <div className="dz dz-app">
      <div className="sl-page" data-sound="none">
        <header className="sl-console">
          <div className="sl-readout">
            <Pressable className="sl-back" aria-label={lab.back} onClick={() => void navigate({ to: '/me' })}>
              <ChevronLeft />
            </Pressable>
            <div className="sl-readout__main" aria-live="polite">
              <div className="sl-readout__event">{readout.event}</div>
              <div className="sl-readout__chord">
                <span className="sl-readout__name">{chordLabel(readout.chord) || readName}</span>
                <span className="sl-readout__roman">
                  {readRoman} · {readFn}
                  {readout.detail ? ` · ${readout.detail}` : ''}
                </span>
              </div>
            </div>
            <div className="sl-master">
              <span>{on ? text.console.soundOn : text.console.soundOff}</span>
              <Switch checked={on} onChange={setSoundOn} label={text.console.soundOn} />
            </div>
          </div>
          <Keyboard lit={lit} />
          <div className="sl-legend" aria-hidden="true">
            {(Object.keys(text.console.legend) as Light[]).map((k) => (
              <span key={k}>
                <i data-on={k} />
                {text.console.legend[k]}
              </span>
            ))}
          </div>
        </header>

        <main className="sl-main">
          <section>
            <div className="sl-eyebrow">{text.eyebrow}</div>
            <h1 className="sl-h1">{text.title}</h1>
            <p className="sl-lead">{text.intro}</p>
            <div className="sl-note">
              <b>{text.silentTitle}</b> {text.silentBody}
            </div>
            {on ? null : <p className="sl-lead">{text.off}</p>}
          </section>

          <section>
            <div className="sl-eyebrow">{text.lesson.eyebrow}</div>
            <div className="sl-row">
              <h2 className="sl-h2">{text.lesson.title}</h2>
              <Pressable
                className="sl-play"
                onClick={playing ? stopLesson : startLesson}
                data-testid="sound-lesson"
              >
                {playing ? text.lesson.stop : text.lesson.play}
              </Pressable>
            </div>
            <div className="sl-stage" ref={stage}>
              <div className="sl-mats">
                <Matrix name="A" values={A} row={scene.row} />
                <span className="sl-op">·</span>
                <Matrix name="B" values={B} col={scene.col} />
                <span className="sl-op">=</span>
                <Matrix name="C" values={C} filled={scene.filled} fresh={scene.fresh} done={scene.done} />
              </div>
              <div className="sl-opts">
                {scene.options?.map((o) => (
                  <span key={o.value} className="sl-opt" data-state={o.state}>
                    {o.value}
                  </span>
                ))}
              </div>
              <div className="sl-cap" aria-live="polite">
                {scene.caption}
              </div>
              <div className="sl-progress">
                <span ref={progress} />
              </div>
            </div>
            <fieldset className="sl-walk" aria-label={text.lesson.walk}>
              {PROGRESSION.map((id, i) => (
                <Pressable
                  key={id}
                  className="sl-chip"
                  aria-pressed={step === i}
                  onClick={() => {
                    setStep(i)
                    playSound('step', { step: i, steps: STEPS })
                  }}
                >
                  <b>{text.chords[id][1]}</b>
                  <small>{text.chords[id][0]}</small>
                </Pressable>
              ))}
            </fieldset>
          </section>

          <section>
            <div className="sl-eyebrow">{text.palette.eyebrow}</div>
            <fieldset className="sh-segments sl-seg" aria-label={text.palette.eyebrow}>
              {(Object.keys(PALETTES) as PaletteId[]).map((id) => (
                <Pressable
                  key={id}
                  className="sh-segment sl-seg__item"
                  aria-pressed={palette === id}
                  onClick={() => {
                    setPalette(id)
                    play('correct')
                  }}
                >
                  <b>{text.palette.items[id].name}</b>
                  <small>{text.palette.items[id].sub}</small>
                </Pressable>
              ))}
            </fieldset>
            <div className="sl-card">
              <div className="sl-card__head">
                <b>{text.palette.items[palette].name}</b>
                {palette === 'rhodes' ? <span className="sl-badge">{text.palette.recommended}</span> : null}
              </div>
              <p>{text.palette.items[palette].body}</p>
            </div>
          </section>

          <section>
            <div className="sl-eyebrow">{text.music.eyebrow}</div>
            <h2 className="sl-h2">{text.music.title}</h2>
            <p className="sl-lead">{text.music.body}</p>
            <div className="dz-list">
              <div className="dz-row">
                <span className="dz-row-main">{text.music.on}</span>
                <Switch checked={settings.music !== false} onChange={setMusicOn} label={text.music.on} />
              </div>
              <div className="dz-row">
                <span className="dz-row-main">{text.music.soft}</span>
                <Switch
                  checked={settings.musicSoft === true}
                  onChange={setMusicSoft}
                  label={text.music.soft}
                />
              </div>
            </div>
          </section>

          <section>
            <div className="sl-eyebrow">{text.singles.eyebrow}</div>
            <h2 className="sl-h2">{text.singles.title}</h2>
            <p className="sl-lead">{text.singles.lead(chordName, roman)}</p>
            <div className="sl-events">
              {PLAIN.map((event) =>
                card(
                  event,
                  text.tags[TIER_TAG[EVENTS[event].tier]],
                  undefined,
                  event === 'land' ? step : undefined,
                ),
              )}
            </div>
          </section>

          <section>
            <div className="sl-eyebrow">{text.interface.eyebrow}</div>
            <h2 className="sl-h2">{text.interface.title}</h2>
            <p className="sl-lead">{text.interface.lead}</p>
            <div className="sl-events">
              {TOUCH.map((event) =>
                card(event, text.tags.touch, undefined, event === 'tab' ? step % 4 : undefined),
              )}
            </div>
          </section>

          <section>
            <div className="sl-eyebrow">{text.rewards.eyebrow}</div>
            <h2 className="sl-h2">{text.rewards.title}</h2>
            <p className="sl-lead">{text.rewards.lead}</p>
            <div className="sl-events">
              {REWARDS.map(([event, size]) => {
                const rise = EVENTS[event].parts.reduce((n, part) => n + (part.arpeggio?.count ?? 0), 0)
                return card(event, text.tags[size], text.rewards.rise(rise))
              })}
            </div>
          </section>

          <section>
            <div className="sl-eyebrow">{text.theory.eyebrow}</div>
            <details className="sl-more">
              <summary>
                <h2 className="sl-h2">{text.theory.title}</h2>
              </summary>
              {text.theory.paragraphs.map((p) => (
                <p key={p} className="sl-lead">
                  {p}
                </p>
              ))}
            </details>
          </section>

          <section>
            <div className="sl-eyebrow">{text.rules.eyebrow}</div>
            <h2 className="sl-h2">{text.rules.title}</h2>
            <ul className="sl-rules">
              {text.rules.items.map(([b, rest]) => (
                <li key={b}>
                  <b>{b}</b>
                  {rest}
                </li>
              ))}
            </ul>
          </section>
        </main>
      </div>
    </div>
  )
}
