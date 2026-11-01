import { type Ref, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef } from 'react'
import { engine } from '../engine/driver'
import { browPath, eyePath, type Head, type Mood, mouthPath, Rig, type Who } from './rig'
import './character.css'

/** What a parent can ask of the duo. */
export type DuoHandle = {
  react(mood: Mood): void
  pose(mood: Mood): void
  look(x: number, y: number): void
  blink(): void
  /** Lands every running gesture now. */
  finish(): void
}

/** Head placement in the pair: Satır lower left in front, Sütun upper right behind (old geometry, 3.1). */
const PLACE: Record<Who, [number, number]> = { col: [34, -4], row: [0, 18] }
/** The ground line the contact shadows sit on, in viewBox units. */
const GROUND = 67.5
/** Idle life: a blink every few seconds and, now and then, a short glance. Never a loop of body motion. */
const IDLE = { blinkMin: 2600, blinkMax: 6200, glanceChance: 0.3 } as const

type Parts = {
  body: SVGGElement
  face: SVGGElement
  eyes: [SVGPathElement, SVGPathElement]
  brows: [SVGPathElement, SVGPathElement]
  cheeks: [SVGEllipseElement, SVGEllipseElement]
  mouth: SVGPathElement
  shadow: SVGEllipseElement
}

function draw(rig: Rig, head: Head, parts: Parts) {
  const v = (name: Parameters<Head['value']>[0]) => head.value(name)
  const y = v('y')
  // Pivot at the bottom of the head (22, 48 in the head's own box) so squash and tilt sit on the ground.
  parts.body.setAttribute(
    'transform',
    `translate(22 ${48 + y}) rotate(${v('rot')}) scale(${v('sx')} ${v('sy')}) translate(-22 -48)`,
  )
  parts.face.setAttribute('transform', `translate(${22 + v('lx')} ${26 + v('hy') + v('ly')})`)
  const happy = v('happy')
  parts.eyes[0].setAttribute('d', eyePath(v('openL') * rig.lid(head, 0), happy))
  parts.eyes[1].setAttribute('d', eyePath(v('openR') * rig.lid(head, 1), happy))
  parts.mouth.setAttribute('d', mouthPath(v('mc'), v('mo')))
  const brow = Math.min(Math.max(v('brow'), 0), 1)
  const tilt = v('tilt')
  parts.brows[0].setAttribute('transform', `translate(-7.5 -10.6) rotate(${-tilt})`)
  parts.brows[1].setAttribute('transform', `translate(7.5 -10.6) rotate(${tilt})`)
  for (const b of parts.brows) b.style.opacity = String(brow)
  const blush = Math.min(Math.max(v('blush'), 0), 1)
  for (const c of parts.cheeks) c.style.opacity = String(blush)
  // In the air the shadow shrinks and fades; on a squash it widens.
  const lift = Math.max(0, -y) / 30
  parts.shadow.setAttribute('rx', String(Math.max(6, 15 * v('sx') * (1 - lift * 0.6))))
  parts.shadow.style.opacity = String(Math.max(0.15, 1 - lift))
}

/**
 * Satır and Sütun, alive: two heads whose faces are drawn every frame from the spring rig, with a soft light from
 * the top left, cheeks that warm with joy, bracket-corner brows and contact shadows on one ground line.
 */
export function Duo({
  mood = 'happy',
  alive = true,
  className = '',
  ref,
}: {
  mood?: Mood
  /** Idle blinks and glances while on screen. */
  alive?: boolean
  className?: string
  ref?: Ref<DuoHandle>
}) {
  const id = useId().replace(/:/g, '')
  const svg = useRef<SVGSVGElement>(null)
  const rig = useRef<Rig>(null as unknown as Rig)
  rig.current ??= new Rig()
  const parts = useRef<Partial<Record<Who, Parts>>>({})
  const ticking = useRef(false)

  const render = () => {
    const r = rig.current
    for (const who of ['row', 'col'] as const) {
      const p = parts.current[who]
      if (p) draw(r, r.heads[who], p)
    }
  }

  const wake = () => {
    rig.current.reduced = engine.reducedMotion
    render()
    if (ticking.current) return
    ticking.current = true
    engine.addTicker({
      step: (ms) => {
        const going = rig.current.step(ms)
        render()
        if (!going) ticking.current = false
        return going
      },
      finish: () => {
        rig.current.finish()
        render()
        ticking.current = false
      },
    })
  }

  useImperativeHandle(ref, () => ({
    react: (next) => {
      rig.current.reduced = engine.reducedMotion
      rig.current.react(next)
      wake()
    },
    pose: (next) => {
      rig.current.pose(next)
      wake()
    },
    look: (x, y) => {
      rig.current.look(x, y)
      wake()
    },
    blink: () => {
      rig.current.blinkBoth()
      wake()
    },
    finish: () => {
      rig.current.finish()
      render()
    },
  }))

  // The first mood is drawn still, before paint.
  // biome-ignore lint/correctness/useExhaustiveDependencies: drawn once; later moods come through the handle
  useLayoutEffect(() => {
    const root = svg.current
    if (!root) return
    for (const who of ['row', 'col'] as const) {
      const g = root.querySelector<SVGGElement>(`.duo__head--${who}`)
      const shadow = root.querySelector<SVGEllipseElement>(`.duo__shadow--${who}`)
      if (!g || !shadow) continue
      const q = <T extends Element>(s: string) => [...g.querySelectorAll<T>(s)]
      parts.current[who] = {
        body: g,
        face: q<SVGGElement>('.duo__face')[0] as SVGGElement,
        eyes: q<SVGPathElement>('.duo__eye') as [SVGPathElement, SVGPathElement],
        brows: q<SVGPathElement>('.duo__brow') as [SVGPathElement, SVGPathElement],
        cheeks: q<SVGEllipseElement>('.duo__cheek') as [SVGEllipseElement, SVGEllipseElement],
        mouth: q<SVGPathElement>('.duo__mouth')[0] as SVGPathElement,
        shadow,
      }
    }
    rig.current.pose(mood, true)
    render()
  }, [])

  // biome-ignore lint/correctness/useExhaustiveDependencies: wake reads refs only
  useEffect(() => {
    if (!alive) return
    let timer = 0
    const next = () => {
      timer = window.setTimeout(
        () => {
          if (document.visibilityState === 'visible' && !engine.reducedMotion) {
            rig.current.blinkBoth()
            if (Math.random() < IDLE.glanceChance) {
              const x = (Math.random() - 0.5) * 2.4
              rig.current.look(x, (Math.random() - 0.5) * 1.2)
              rig.current.look(0, 0, 900 + Math.random() * 700)
            }
            wake()
          }
          next()
        },
        IDLE.blinkMin + Math.random() * (IDLE.blinkMax - IDLE.blinkMin),
      )
    }
    next()
    return () => window.clearTimeout(timer)
  }, [alive])

  const head = (who: Who) => {
    const [dx, dy] = PLACE[who]
    return (
      <g transform={`translate(${dx} ${dy})`}>
        <g className={`duo__head duo__head--${who}`}>
          <circle className="duo__skull" cx="22" cy="26" r="22" />
          <circle cx="22" cy="26" r="22" fill={`url(#${id}-shade)`} />
          <circle cx="22" cy="26" r="22" fill={`url(#${id}-gloss)`} />
          <g className="duo__face">
            <ellipse className="duo__cheek" cx="-11.5" cy="5" rx="3.6" ry="2.2" />
            <ellipse className="duo__cheek" cx="11.5" cy="5" rx="3.6" ry="2.2" />
            <path className="duo__eye" transform="translate(-7.5 -3)" />
            <path className="duo__eye" transform="translate(7.5 -3)" />
            <path className="duo__brow" d={browPath(0)} />
            <path className="duo__brow" d={browPath(1)} />
            <path className="duo__mouth" transform="translate(0 8)" />
          </g>
        </g>
      </g>
    )
  }

  return (
    <svg ref={svg} className={`duo ${className}`} viewBox="-4 -6 86 80" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-gloss`} cx="0.34" cy="0.26" r="0.55">
          <stop offset="0" className="duo__gloss-in" />
          <stop offset="1" className="duo__gloss-out" />
        </radialGradient>
        <radialGradient id={`${id}-shade`} cx="0.42" cy="0.36" r="0.68">
          <stop offset="0.62" className="duo__shade-in" />
          <stop offset="1" className="duo__shade-out" />
        </radialGradient>
      </defs>
      <ellipse className="duo__shadow duo__shadow--col" cx="58" cy="46.5" rx="15" ry="2.6" />
      <ellipse className="duo__shadow duo__shadow--row" cx="22" cy={GROUND} rx="15" ry="2.6" />
      {head('col')}
      {head('row')}
    </svg>
  )
}
