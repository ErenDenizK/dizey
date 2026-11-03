import { useLayoutEffect, useRef, useState } from 'react'
import { dayLabel } from '../../content/exam'
import type { Block } from '../../content/questions'
import { strings } from '../../content/strings'
import { engine } from '../../engine/driver'
import { SHIFT } from '../../engine/tokens'
import { Matrix } from '../../exam/Blocks'
import { NAME_MAX } from '../../progress/profile'
import { playSound } from '../../sound/player'
import { ChevronRight } from '../../ui/icons'
import { Pressable } from '../../ui/Pressable'
import { glow } from '../../ui/shine'
import { type BeatProps, type Ctx, Mark, Say, useBeatMotion, useReveal } from './parts'

const t = strings.onboarding

/** The date row's range is Settings' (the exam is in November or December 2026). */
const EXAM_MIN = '2026-11-01'
const EXAM_MAX = '2026-12-31'

function Action({
  children,
  onClick,
  kind = 'primary',
}: {
  children: string
  onClick: () => void
  kind?: 'primary' | 'secondary'
}) {
  return (
    <div className="onb-actions" data-part>
      <Pressable className="dz-button" data-kind={kind} data-wide data-sound="none" onClick={onClick}>
        {children}
      </Pressable>
    </div>
  )
}

/* ---- 0. Install (iPhone Safari, not yet on the Home Screen) -------------------------------------------------------- */

export function InstallBeat({ ctx, out, onGone }: BeatProps) {
  const layer = useRef<HTMLDivElement>(null)
  const slot = useRef<HTMLSpanElement>(null)
  useBeatMotion(layer, out, onGone)
  // biome-ignore lint/correctness/useExhaustiveDependencies: placed once
  useLayoutEffect(() => ctx.place(slot.current), [])
  return (
    <div ref={layer} className="onb-beat" data-beat="install">
      <div className="onb-body">
        <div className="onb-intro" data-part>
          <h1 id="onb-title">{t.title}</h1>
          <p>{t.body}</p>
        </div>
        <div className="onb-perch-host">
          <span ref={slot} className="onb-slot onb-slot--perch" />
          <ol className="sh-card onb-steps" data-part>
            <li>
              <span className="onb-steps__n">1</span>
              <span>
                {t.step1}{' '}
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 3v12M8 7l4-4 4 4" />
                  <path d="M6 11v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8" />
                </svg>
              </span>
            </li>
            <li>
              <span className="onb-steps__n">2</span>
              <span>{t.step2}</span>
            </li>
            <li>
              <span className="onb-steps__n">3</span>
              <span>{t.step3}</span>
            </li>
          </ol>
        </div>
      </div>
      <Action kind="secondary" onClick={ctx.next}>
        {t.skip}
      </Action>
    </div>
  )
}

/* ---- 1. Wake ------------------------------------------------------------------------------------------------------- */

/** ms from the tap to the cue: the wake storyboard is under way (the sampled cues may only have decoded on this tap). */
const CUE_AFTER_TAP = 950
/** ms from the tap until the story goes on: the stretch and the yawn have settled. */
const WAKE_TOTAL = 2150

export function WakeBeat({ ctx, out, onGone }: BeatProps) {
  const layer = useRef<HTMLDivElement>(null)
  const slot = useRef<HTMLSpanElement>(null)
  const hint = useRef<HTMLSpanElement>(null)
  const [woke, setWoke] = useState(false)
  useBeatMotion(layer, out, onGone)
  // biome-ignore lint/correctness/useExhaustiveDependencies: placed once
  useLayoutEffect(() => ctx.place(slot.current), [])
  useReveal(hint, false)
  // The soft "dokun" arrives last, once the mark and the sleeping cat are in.
  // biome-ignore lint/correctness/useExhaustiveDependencies: scheduled once
  useLayoutEffect(() => {
    ctx.later(1500, () => {
      const el = hint.current
      if (el) engine.to(el, { opacity: 1 }, 'enter')
    })
  }, [])

  const wake = () => {
    if (woke) return
    setWoke(true)
    const el = hint.current
    if (el) engine.to(el, { opacity: 0 }, 'leave')
    ctx.cat.current?.wake()
    ctx.later(CUE_AFTER_TAP, () => {
      playSound('lessonOpen')
      const svg = ctx.catSvg()
      if (svg) glow(svg as unknown as HTMLElement, 0.7)
    })
    ctx.later(WAKE_TOTAL, ctx.next)
  }

  return (
    <div ref={layer} className="onb-beat" data-beat="wake">
      <button
        type="button"
        className="onb-wake"
        data-sound="none"
        aria-label={t.wakeLabel}
        disabled={woke}
        onClick={wake}
      >
        <Mark ctx={ctx}>{strings.appName}</Mark>
        <span ref={slot} className="onb-slot onb-slot--wake" />
        <span ref={hint} className="onb-tap">
          {t.wakeHint}
        </span>
      </button>
    </div>
  )
}

/* ---- 2. Hello ------------------------------------------------------------------------------------------------------ */

export function HelloBeat({ ctx, out, onGone }: BeatProps) {
  const layer = useRef<HTMLDivElement>(null)
  const slot = useRef<HTMLSpanElement>(null)
  useBeatMotion(layer, out, onGone, 260)
  // biome-ignore lint/correctness/useExhaustiveDependencies: placed once
  useLayoutEffect(() => {
    ctx.place(slot.current)
    ctx.later(300, () => playSound('open'))
    ctx.later(520, () => ctx.cat.current?.react('happy'))
  }, [])
  return (
    <div ref={layer} className="onb-beat" data-beat="hello">
      <div className="onb-body">
        <div className="onb-say-row">
          <span ref={slot} className="onb-slot onb-slot--hello" />
          <Say lines={[t.helloBubble]} />
        </div>
        <div className="onb-intro" data-part>
          <h1 id="onb-title">{t.helloTitle}</h1>
          <p>{t.helloBody}</p>
        </div>
      </div>
      <Action onClick={ctx.next}>{t.helloGo}</Action>
    </div>
  )
}

/* ---- 3. Taste ------------------------------------------------------------------------------------------------------ */

const MATRIX: Extract<Block, { kind: 'matrix' }> = {
  kind: 'matrix',
  delimiter: 'brackets',
  rows: [
    ['2', '0', '5'],
    ['1', '3', '4'],
  ],
}
const ROWS = 2
const CELL_GAP = 130

const CHOICES = [
  { key: 'A', value: 2 },
  { key: 'B', value: 3 },
] as const

export function TasteBeat({ ctx, out, onGone }: BeatProps) {
  const layer = useRef<HTMLDivElement>(null)
  const slot = useRef<HTMLSpanElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const ask = useRef<HTMLDivElement>(null)
  const next = useRef<HTMLDivElement>(null)
  const bands = useRef<(HTMLSpanElement | null)[]>([])
  const [ready, setReady] = useState(false)
  const [pick, setPick] = useState<number | null>(null)
  const alive = useRef(true)
  useBeatMotion(layer, out, onGone, 200)
  useReveal(ask, ready)
  useReveal(next, pick !== null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: the matrix assembles once
  useLayoutEffect(() => {
    alive.current = true
    ctx.place(slot.current)
    const mat = inner.current?.querySelector<HTMLElement>('.ex-mat')
    const cells = [...(inner.current?.querySelectorAll<HTMLElement>('.ex-cell') ?? [])]
    if (mat) engine.set(mat, { '--draw': 0 })
    for (const cell of cells) engine.set(cell, { opacity: 0, y: SHIFT.scene * 2, scale: 0.7 })
    ctx.later(760, () => {
      if (mat) engine.to(mat, { '--draw': 1 }, 'draw', { effect: true })
    })
    cells.forEach((cell, i) => {
      ctx.later(980 + i * CELL_GAP, () => {
        if (!alive.current) return
        engine.to(cell, { opacity: 1 }, 'enter')
        engine.to(cell, { y: 0, scale: 1 }, 'land', { effect: engine.reducedMotion })
        playSound('land')
      })
    })
    ctx.later(980 + cells.length * CELL_GAP + 420, () => alive.current && setReady(true))
    return () => {
      alive.current = false
    }
  }, [])

  /** Both rows light up in the row colour, one after the other. */
  const glowRows = () => {
    const mat = inner.current?.querySelector<HTMLElement>('.ex-mat')
    if (!mat) return
    for (let r = 0; r < ROWS; r++) {
      const band = bands.current[r]
      const first = mat.querySelector<HTMLElement>(`[data-cell="${r}-0"]`)
      const last = mat.querySelector<HTMLElement>(`[data-cell="${r}-2"]`)
      if (!band || !first || !last) continue
      band.style.left = `${mat.offsetLeft + first.offsetLeft + 2}px`
      band.style.top = `${mat.offsetTop + first.offsetTop}px`
      band.style.width = `${last.offsetLeft + last.offsetWidth - first.offsetLeft - 4}px`
      band.style.height = `${first.offsetHeight}px`
      engine.set(band, { opacity: 0, scaleX: 0.92 })
      ctx.later(r * 160, () => {
        engine.to(band, { opacity: 1 }, 'enter')
        engine.to(band, { scaleX: 1 }, 'land', { effect: engine.reducedMotion })
      })
    }
  }

  const choose = (value: number) => {
    if (pick !== null) return
    setPick(value)
    const right = value === ROWS
    playSound(right ? 'correct' : 'wrong')
    ctx.cat.current?.react(right ? 'happy' : 'oops')
    ctx.later(180, glowRows)
  }

  const line = pick === null ? 0 : pick === ROWS ? 1 : 2
  return (
    <div ref={layer} className="onb-beat" data-beat="taste">
      <div className="onb-body">
        <div className="onb-say-row">
          <span ref={slot} className="onb-slot onb-slot--small" />
          <Say lines={[t.tasteLine, t.tasteRight, t.tasteWrong]} index={line} />
        </div>
        <div className="sh-card onb-mat" data-part>
          <div ref={inner} className="onb-mat__inner">
            {[0, 1].map((r) => (
              <span
                key={r}
                ref={(el) => {
                  bands.current[r] = el
                }}
                className="onb-band"
                aria-hidden="true"
              />
            ))}
            <Matrix block={MATRIX} />
          </div>
        </div>
        <div ref={ask} className="onb-ask">
          <h2 className="onb-ask__q">{t.tasteQuestion}</h2>
          <fieldset className="ex-opts onb-opts" aria-label={t.tasteChoices} data-sound="none">
            {CHOICES.map(({ key, value }) => {
              const state =
                pick === null ? undefined : value === ROWS ? 'right' : value === pick ? 'wrong' : undefined
              return (
                <button
                  key={key}
                  type="button"
                  className="ex-opt sh-press"
                  data-state={state}
                  data-testid={`onb-choice-${value}`}
                  disabled={pick !== null}
                  onClick={() => choose(value)}
                >
                  <span className="ex-opt__key">{key}</span>
                  <span className="ex-opt__body">{value}</span>
                </button>
              )
            })}
          </fieldset>
        </div>
      </div>
      <div ref={next} className="onb-actions">
        <Pressable className="dz-button" data-kind="primary" data-wide data-sound="none" onClick={ctx.next}>
          {t.tasteNext}
        </Pressable>
      </div>
    </div>
  )
}

/* ---- 4. You -------------------------------------------------------------------------------------------------------- */

export function YouBeat({ ctx, out, onGone }: BeatProps) {
  const layer = useRef<HTMLDivElement>(null)
  const slot = useRef<HTMLSpanElement>(null)
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  useBeatMotion(layer, out, onGone, 200)
  // biome-ignore lint/correctness/useExhaustiveDependencies: placed once
  useLayoutEffect(() => ctx.place(slot.current), [])

  return (
    <div ref={layer} className="onb-beat" data-beat="you">
      <div className="onb-body">
        <div className="onb-say-row">
          <span ref={slot} className="onb-slot onb-slot--small" />
          <Say lines={[t.youBubble]} />
        </div>
        <div className="onb-field" data-part>
          <input
            className="onb-field__input"
            data-testid="onb-name"
            type="text"
            value={name}
            maxLength={NAME_MAX}
            placeholder={strings.me.namePlaceholder}
            aria-label={strings.me.nameLabel}
            autoComplete="off"
            autoCapitalize="words"
            enterKeyHint="done"
            onChange={(event) => {
              const value = event.currentTarget.value
              // Her first purr: the name gets its first character.
              if (name.trim() === '' && value.trim() !== '') ctx.cat.current?.react('purr')
              setName(value)
              ctx.draft.current.name = value
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur()
            }}
            onFocus={(event) => event.currentTarget.scrollIntoView({ block: 'nearest' })}
          />
        </div>
        <label className="dz-row onb-date" data-part>
          <span className="onb-date__lead" aria-hidden="true">
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <rect x="3" y="4.5" width="14" height="12.5" rx="3" />
              <path d="M3 8.5h14M7 2.5v4M13 2.5v4" />
            </svg>
          </span>
          <span className="dz-row-main">{t.examAsk}</span>
          <span className="onb-date__value" data-set={date ? '' : undefined} aria-hidden="true">
            {date ? dayLabel(date) : strings.settings.examDatePick}
            <span className="dz-chevron">
              <ChevronRight />
            </span>
          </span>
          <input
            type="date"
            className="onb-date__input"
            data-testid="onb-date"
            min={EXAM_MIN}
            max={EXAM_MAX}
            value={date}
            aria-label={t.examAsk}
            onChange={(event) => {
              const value = event.currentTarget.value
              setDate(value)
              ctx.draft.current.date = value
            }}
          />
        </label>
        <p className="onb-note" data-part>
          {t.examHint}
        </p>
      </div>
      <Action onClick={ctx.finish}>{t.go}</Action>
    </div>
  )
}

export type { Ctx }
