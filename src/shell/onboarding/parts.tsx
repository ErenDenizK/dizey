import { type ReactNode, type RefObject, useId, useLayoutEffect, useRef } from 'react'
import type { MirtisHandle } from '../../character/Mirtis'
import { engine } from '../../engine/driver'
import { CHOREO_MS, SHIFT } from '../../engine/tokens'

/** What a beat can ask of the scene around it (src/shell/Onboarding.tsx). */
export type Ctx = {
  /** Where Mırtis sits in this beat: the scene glides her to this box (and keeps her on it). */
  place: (slot: HTMLElement | null) => void
  cat: RefObject<MirtisHandle | null>
  /** The cat's svg, for the glow. */
  catSvg: () => SVGSVGElement | null
  /** A cue on the scene's clock, cancelled when the scene goes. */
  later: (ms: number, fn: () => void) => void
  next: () => void
  /** Leave at once (no flight). */
  skip: () => void
  /** The hand-off: save, fly to the Yol dock, dissolve. */
  finish: () => void
  /** What the "Sen" beat collects; saved when the scene ends. */
  draft: { current: { name: string; date: string } }
}

export type BeatProps = { ctx: Ctx; out: boolean; onGone: () => void }

/**
 * A beat's own motion: its `[data-part]` children rise in one after another (the lesson's choreography), and when the
 * beat is told to go the whole layer fades, then `onGone` lets the scene drop it. Reduced motion keeps the fades and
 * lets the rise land at once.
 */
export function useBeatMotion(
  layer: RefObject<HTMLElement | null>,
  out: boolean,
  onGone: () => void,
  lead = 140,
) {
  const channel = `onb-beat-${useId()}`
  const gone = useRef(onGone)
  gone.current = onGone

  // biome-ignore lint/correctness/useExhaustiveDependencies: runs once, when the beat mounts
  useLayoutEffect(() => {
    const el = layer.current
    if (!el) return
    const parts = [...el.querySelectorAll<HTMLElement>('[data-part]')]
    for (const part of parts) engine.set(part, { opacity: 0, y: SHIFT.enter })
    parts.forEach((part, i) => {
      engine.withChannel(channel, () =>
        engine.after(lead + i * CHOREO_MS.stagger * 3, () =>
          engine.withChannel(channel, () => {
            engine.to(part, { opacity: 1 }, 'enter')
            engine.to(part, { y: 0 }, 'glide', { effect: engine.reducedMotion })
          }),
        ),
      )
    })
    return () => engine.cancelCues(channel)
  }, [])

  // biome-ignore lint/correctness/useExhaustiveDependencies: only `out` starts the exit
  useLayoutEffect(() => {
    const el = layer.current
    if (!out || !el) return
    engine.cancelCues(channel)
    el.inert = true
    engine.withChannel(channel, () =>
      engine.to(el, { opacity: 0 }, 'leave', { onArrive: () => gone.current() }),
    )
  }, [out])
}

/** A part that comes and goes while its beat stays (a button that waits for the answer): a fade and a short rise. */
export function useReveal(ref: RefObject<HTMLElement | null>, shown: boolean) {
  const first = useRef(true)
  const channel = `onb-reveal-${useId()}`
  // biome-ignore lint/correctness/useExhaustiveDependencies: channel is stable
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    if (first.current) {
      first.current = false
      engine.set(el, { opacity: shown ? 1 : 0, y: shown ? 0 : SHIFT.enter })
    } else
      engine.withChannel(channel, () => {
        engine.to(el, { opacity: shown ? 1 : 0 }, shown ? 'enter' : 'leave')
        engine.to(el, { y: shown ? 0 : SHIFT.enter }, 'glide', { effect: engine.reducedMotion })
      })
    el.inert = !shown
  }, [shown])
}

/**
 * Mırtis's line: a speech bubble whose tail points back at her slot. Every line of the beat sits in the same grid cell
 * (so the bubble keeps one size) and the one in `index` is shown; changing it crossfades.
 */
export function Say({ lines, index = 0 }: { lines: readonly string[]; index?: number }) {
  const els = useRef<(HTMLSpanElement | null)[]>([])
  const first = useRef(true)
  // biome-ignore lint/correctness/useExhaustiveDependencies: lines are constant strings
  useLayoutEffect(() => {
    lines.forEach((_, i) => {
      const el = els.current[i]
      if (!el) return
      const on = i === index
      if (first.current) engine.set(el, { opacity: on ? 1 : 0 })
      else engine.to(el, { opacity: on ? 1 : 0 }, on ? 'enter' : 'leave')
    })
    first.current = false
  }, [index])
  return (
    <div className="onb-say" data-part aria-live="polite">
      {lines.map((line, i) => (
        <span
          key={line}
          ref={(el) => {
            els.current[i] = el
          }}
          className="onb-say__line"
          aria-hidden={i !== index}
        >
          {line}
        </span>
      ))}
    </div>
  )
}

/** The wordmark: two brackets draw themselves, then the name settles between them. */
export function Mark({ children, ctx, delay = 100 }: { children: ReactNode; ctx: Ctx; delay?: number }) {
  const root = useRef<HTMLDivElement>(null)
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs once, when the beat mounts
  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const brackets = [...el.querySelectorAll<HTMLElement>('[data-bracket]')]
    const word = el.querySelector<HTMLElement>('[data-word]')
    for (const b of brackets) engine.set(b, { '--draw': 0 })
    if (word) engine.set(word, { opacity: 0, y: SHIFT.enter })
    ctx.later(delay, () => {
      for (const b of brackets) engine.to(b, { '--draw': 1 }, 'draw', { effect: true })
    })
    ctx.later(delay + 380, () => {
      if (!word) return
      engine.to(word, { opacity: 1 }, 'enter')
      engine.to(word, { y: 0 }, 'glide', { effect: engine.reducedMotion })
    })
  }, [])
  return (
    <div ref={root} className="onb-mark" aria-hidden="true">
      <svg className="onb-bracket" data-bracket viewBox="0 0 14 44" aria-hidden="true" focusable="false">
        <path d="M12 2H3V42H12" pathLength="1" />
      </svg>
      <span className="onb-mark__word" data-word>
        {children}
      </span>
      <svg className="onb-bracket" data-bracket viewBox="0 0 14 44" aria-hidden="true" focusable="false">
        <path d="M2 2H11V42H2" pathLength="1" />
      </svg>
    </div>
  )
}

/** Progress dots: the current one stretches and turns amber (an engine value, `--on`, like the switch). */
export function Dots({ count, at, hidden }: { count: number; at: number; hidden: boolean }) {
  const root = useRef<HTMLOListElement>(null)
  const first = useRef(true)
  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    ;[...el.children].forEach((dot, i) => {
      const on = i === at ? 1 : 0
      if (first.current) engine.set(dot as HTMLElement, { '--on': on })
      else engine.to(dot as HTMLElement, { '--on': on }, 'ui', { effect: true })
    })
    first.current = false
  }, [at])
  useReveal(root, !hidden)
  return (
    <ol ref={root} className="onb-dots" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: fixed dots
        <li key={i} className="onb-dot" />
      ))}
    </ol>
  )
}
