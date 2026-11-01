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
import { ChevronRight } from '../ui/icons'
import { Pressable } from '../ui/Pressable'
import { Screen } from '../ui/Screen'
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

  const row = (event: SoundEvent, tag: string, extra?: string, index?: number) => {
    const plan = score.plan(event, { step, steps: STEPS, ...(index === undefined ? {} : { index }) })
    const [name, body] = text.events[event as keyof typeof text.events]
    return (
      <Pressable
        key={event}
        className="dz-row sl-ev"
        data-tier={EVENTS[event].tier}
        data-testid={`sound-${event}`}
        onClick={() => play(event, index)}
      >
        <span className="dz-row-main">
          <span className="sl-ev__name">{name}</span>
          <small className="dz-footnote sh-row-sub">{body}</small>
          <small className="sl-ev__chords">
            {plan.chords.map((c, k) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: a chord can repeat in a plan
              <span key={k}>
                {k > 0 ? ' → ' : ''}
                <span className="sl-nowrap">{chordLabel(c)}</span>
              </span>
            ))}
            {extra ? <span className="sl-nowrap">{` · ${extra}`}</span> : null}
          </small>
        </span>
        {tag ? <small className="sl-ev__tag">{tag}</small> : null}
        <PlayGlyph />
      </Pressable>
    )
  }

  return (
    <div className="dz dz-app" data-sound="none">
      <Screen title={text.title} back={() => void navigate({ to: '/me' })} backLabel={lab.back} pushed>
        <p className="dz-subhead sl-lead">{text.intro}</p>
        {on ? null : <p className="dz-subhead sl-lead">{text.off}</p>}
        <div className="dz-list">
          <div className="dz-row">
            <span className="dz-row-main">
              {text.silentTitle}
              <small className="dz-footnote sh-row-sub">{text.silentBody}</small>
            </span>
          </div>
          <div className="dz-row sl-legend" aria-hidden="true">
            {(Object.keys(text.console.legend) as Light[]).map((k) => (
              <span key={k} className="dz-footnote">
                <i data-on={k} />
                {text.console.legend[k]}
              </span>
            ))}
          </div>
        </div>

        <h2 className="dz-section-label">{text.lesson.eyebrow}</h2>
        <p className="dz-footnote sl-lead">{text.lesson.lead}</p>
        <div className="dz-card sl-stage" ref={stage}>
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
          <div className="dz-subhead sl-cap" aria-live="polite">
            {scene.caption}
          </div>
          <div className="sl-progress">
            <span ref={progress} />
          </div>
          <Pressable
            className="dz-button"
            data-kind={playing ? 'secondary' : 'primary'}
            data-wide=""
            onClick={playing ? stopLesson : startLesson}
            data-testid="sound-lesson"
          >
            {playing ? text.lesson.stop : text.lesson.play}
          </Pressable>
        </div>

        <h2 className="dz-section-label">{text.lesson.walk}</h2>
        <p className="dz-footnote sl-lead">{text.lesson.walkLead}</p>
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

        <h2 className="dz-section-label">{text.palette.eyebrow}</h2>
        <div className="dz-list">
          <div className="dz-row">
            <span className="dz-row-main" id="sl-palette">
              {text.palette.label}
            </span>
            <fieldset className="sh-segments" aria-labelledby="sl-palette">
              {(Object.keys(PALETTES) as PaletteId[]).map((id) => (
                <Pressable
                  key={id}
                  className="sh-segment"
                  aria-pressed={palette === id}
                  onClick={() => {
                    setPalette(id)
                    play('correct')
                  }}
                >
                  {text.palette.items[id].name}
                </Pressable>
              ))}
            </fieldset>
          </div>
          <div className="dz-row">
            <span className="dz-row-main dz-footnote">{text.palette.items[palette].body}</span>
          </div>
        </div>

        <h2 className="dz-section-label">{text.music.eyebrow}</h2>
        <p className="dz-footnote sl-lead">{text.music.lead}</p>
        <div className="dz-list">
          <div className="dz-row">
            <span className="dz-row-main">{text.music.on}</span>
            <Switch checked={settings.music !== false} onChange={setMusicOn} label={text.music.on} />
          </div>
          <div className="dz-row">
            <span className="dz-row-main">{text.music.soft}</span>
            <Switch checked={settings.musicSoft === true} onChange={setMusicSoft} label={text.music.soft} />
          </div>
        </div>

        <h2 className="dz-section-label">{text.singles.eyebrow}</h2>
        <p className="dz-footnote sl-lead">{text.singles.lead(chordName, roman)}</p>
        <div className="dz-list">
          {PLAIN.map((event) =>
            row(
              event,
              text.tags[TIER_TAG[EVENTS[event].tier]],
              undefined,
              event === 'land' ? step : undefined,
            ),
          )}
        </div>

        <h2 className="dz-section-label">{text.interface.eyebrow}</h2>
        <p className="dz-footnote sl-lead">{text.interface.lead}</p>
        <div className="dz-list">
          {TOUCH.map((event) => row(event, '', undefined, event === 'tab' ? step % 4 : undefined))}
        </div>

        <h2 className="dz-section-label">{text.rewards.eyebrow}</h2>
        <p className="dz-footnote sl-lead">{text.rewards.lead}</p>
        <div className="dz-list">
          {REWARDS.map(([event, size]) => {
            const rise = EVENTS[event].parts.reduce((n, part) => n + (part.arpeggio?.count ?? 0), 0)
            return row(event, text.tags[size], text.rewards.rise(rise))
          })}
        </div>

        <h2 className="dz-section-label">{text.theory.eyebrow}</h2>
        <details className="dz-list sl-more">
          <summary className="dz-row">
            <span className="dz-row-main">{text.theory.title}</span>
            <span className="dz-chevron sl-more__chev">
              <ChevronRight />
            </span>
          </summary>
          {text.theory.paragraphs.map((p) => (
            <div key={p} className="dz-row">
              <span className="dz-row-main dz-footnote">{p}</span>
            </div>
          ))}
        </details>

        <h2 className="dz-section-label">{text.rules.eyebrow}</h2>
        <div className="dz-list">
          {text.rules.items.map(([title, body]) => (
            <div key={title} className="dz-row">
              <span className="dz-row-main">
                {title}
                <small className="dz-footnote sh-row-sub">{body}</small>
              </span>
            </div>
          ))}
        </div>
        <div className="sl-dock-space" aria-hidden="true" />
      </Screen>
      <div className="dz-edge-bottom sl-edge" aria-hidden="true" />
      <section className="sl-dock" aria-label={text.console.label}>
        <div className="sl-readout">
          <div className="sl-readout__main" aria-live="polite">
            <span className="sl-readout__name">{chordLabel(readout.chord) || readName}</span>
            <span className="sl-readout__meta">
              {readRoman} · {readFn} · {readout.event}
              {readout.detail ? ` · ${readout.detail}` : ''}
            </span>
          </div>
          <Switch checked={on} onChange={setSoundOn} label={text.console.sound} />
        </div>
        <Keyboard lit={lit} />
      </section>
    </div>
  )
}

function PlayGlyph() {
  return (
    <svg className="sl-ev__play" width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <circle cx="11" cy="11" r="10" />
      <path d="M9 7.2v7.6L15 11z" />
    </svg>
  )
}
