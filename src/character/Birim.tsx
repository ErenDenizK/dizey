import { forwardRef, useId, useImperativeHandle, useLayoutEffect, useRef } from 'react'
import { engine } from '../engine/driver'
import {
  type BirimMood,
  bodyPoints,
  faceNumbers,
  type Mat,
  MOODS,
  openness,
  smileLift,
  TRANSIENT,
} from './birim'
import './birim.css'

export type BirimSize = 'answer' | 'path' | 'profile' | 'hero'

export type BirimHandle = {
  /** Springs to a mood; a transient one (oops, wow) comes back to the resting mood by itself. */
  react: (mood: BirimMood) => void
}

/** A transient mood holds this long after it lands before the way back begins. */
const HOLD_MS = 700

const num = (v: number) => v.toFixed(4)

/**
 * Birim, drawn inline in the card it belongs to (never over content, never following anyone). The body takes the
 * whole matrix; the face takes its polar part. The four entries a, b, c, d are engine values, so every mood is a
 * spring between matrices and nothing changes in one frame, reduced motion included (effect: true shortens, never cuts).
 */
export const Birim = forwardRef<BirimHandle, { size: BirimSize; mood?: BirimMood; className?: string }>(
  function Birim({ size, mood = 'rest', className = '' }, ref) {
    const root = useRef<SVGSVGElement>(null)
    const body = useRef<SVGPathElement>(null)
    const shadow = useRef<SVGEllipseElement>(null)
    const face = useRef<SVGGElement>(null)
    const eyes = useRef<SVGEllipseElement[]>([])
    const glints = useRef<SVGCircleElement[]>([])
    const smile = useRef<SVGPathElement>(null)
    const channel = `birim-${useId()}`
    const resting = useRef<BirimMood>(mood)
    resting.current = TRANSIENT.has(mood) ? 'rest' : mood

    const draw = (m: Mat) => {
      const pts = bodyPoints(m)
      body.current?.setAttribute('d', `M${pts.map((p) => `${num(p[0])} ${num(p[1])}`).join('L')}Z`)
      const low = Math.max(...pts.map((p) => p[1]))
      shadow.current?.setAttribute('cy', num(low + 0.12))
      shadow.current?.setAttribute('rx', num(Math.max(0.4, Math.abs(m[0]))))
      const f = faceNumbers(m)
      face.current?.setAttribute(
        'transform',
        `translate(${num(f.x)} ${num(f.y)}) rotate(${num(f.rotate)}) scale(${num(f.sx)} ${num(f.sy)})`,
      )
      const open = openness(m)
      for (const eye of eyes.current) eye.setAttribute('ry', num(0.04 + 0.18 * open))
      for (const glint of glints.current) glint.setAttribute('r', num(0.04 * open))
      const lift = smileLift(m)
      smile.current?.setAttribute('d', `M-0.2 0.28Q0 ${num(0.28 + lift)} 0.22 0.26`)
    }

    const go = (next: BirimMood, spring: 'ui' | 'move' | 'fade') => {
      const el = root.current
      if (!el) return
      engine.cancelCues(channel)
      const [a, b, c, d] = MOODS[next]
      engine.withChannel(channel, () =>
        engine.to(el, { a, b, c, d }, spring, {
          effect: true,
          ...(TRANSIENT.has(next)
            ? { onArrive: () => engine.after(HOLD_MS, () => go(resting.current, 'fade')) }
            : {}),
        }),
      )
    }

    // Bind the renderer once and start at rest; the mood effect below springs to the resting mood.
    // biome-ignore lint/correctness/useExhaustiveDependencies: bound once; draw only touches refs
    useLayoutEffect(() => {
      const el = root.current
      if (!el) return
      const [a, b, c, d] = MOODS.rest
      engine.bind(
        el,
        (v) => {
          draw([v.a ?? 1, v.b ?? 0, v.c ?? 0, v.d ?? 1])
          // The lesson end's glow (src/ui/shine.ts) is an engine value on this element; CSS reads it.
          if (v['--glow'] !== undefined) el.style.setProperty('--glow', num(v['--glow']))
        },
        { a, b, c, d },
      )
      return () => engine.cancelCues(channel)
    }, [])

    // biome-ignore lint/correctness/useExhaustiveDependencies: go reads refs and the channel only
    useLayoutEffect(() => {
      go(mood, TRANSIENT.has(mood) ? 'ui' : 'move')
    }, [mood])

    // biome-ignore lint/correctness/useExhaustiveDependencies: go reads refs and the channel only
    useImperativeHandle(ref, () => ({ react: (next) => go(next, 'ui') }), [])

    const set =
      <T,>(list: React.RefObject<T[]>, at: number) =>
      (node: T | null) => {
        if (node) list.current[at] = node
      }

    return (
      <svg
        ref={root}
        className={`birim birim--${size} ${className}`.trim()}
        viewBox="-1.4 -1.4 2.8 2.8"
        aria-hidden="true"
      >
        <ellipse ref={shadow} className="birim__shadow" cx="0" cy="1.12" rx="1" ry="0.1" />
        <path ref={body} className="birim__body" d="" />
        <g ref={face} className="birim__face">
          {[-0.38, 0.38].map((x, at) => (
            <g key={x}>
              <ellipse
                ref={set(eyes, at)}
                className="birim__eye"
                cx={x + 0.08}
                cy="-0.1"
                rx="0.13"
                ry="0.22"
              />
              <circle ref={set(glints, at)} className="birim__glint" cx={x + 0.12} cy="-0.17" r="0.04" />
            </g>
          ))}
          <path ref={smile} className="birim__smile" d="" />
        </g>
      </svg>
    )
  },
)
