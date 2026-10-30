import { useRef } from 'react'
import { lab } from '../content/lab'
import { engine } from '../engine/driver'
import { overshoot, physicsOf, settleTime, solve } from '../engine/spring'
import { SPRINGS, type SpringName } from '../engine/tokens'
import { Pressable } from '../ui/Pressable'
import { Screen } from '../ui/Screen'

const W = 300
const H = 64
const T = 1

/** Every spring token: its curve over one second, its numbers, and a ball to play it. */
export function SpringLab({ back }: { back: () => void }) {
  return (
    <Screen title={lab.springs.title} back={back} backLabel={lab.back} pushed>
      <p className="dz-read dz-subhead">{lab.springs.intro}</p>
      <div style={{ display: 'grid', gap: 'var(--stack-gap)', marginTop: 'var(--space-5)' }}>
        {(Object.keys(SPRINGS) as SpringName[]).map((name) => (
          <SpringRow key={name} name={name} />
        ))}
      </div>
    </Screen>
  )
}

function SpringRow({ name }: { name: SpringName }) {
  const ball = useRef<HTMLSpanElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const spec = SPRINGS[name]
  const p = physicsOf(spec)
  const points: string[] = []
  for (let i = 0; i <= 120; i++) {
    const t = (i / 120) * T
    const v = 1 - solve(p, 1, 0, t)[0]
    points.push(`${((t / T) * W).toFixed(1)},${(H - 8 - v * (H - 20)).toFixed(1)}`)
  }
  const play = () => {
    const b = ball.current
    const tr = track.current
    if (!b || !tr) return
    const end = tr.clientWidth - 24
    const at = engine.value(b, 'x')
    engine.withChannel('chrome', () => engine.to(b, { x: at > end / 2 ? 0 : end }, name))
  }
  return (
    <div className="dz-card" style={{ paddingBottom: 'var(--space-3)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
        <span className="dz-headline">{name}</span>
        <span className="dz-footnote num">
          {Math.round(spec.duration * 1000)} ms · {spec.bounce} · {lab.springs.settle}{' '}
          {Math.round(settleTime(spec) * 1000)} ms · {lab.springs.overshoot}{' '}
          {(overshoot(spec) * 100).toFixed(1)}%
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        aria-hidden="true"
        style={{ marginTop: 'var(--space-2)' }}
      >
        <line x1="0" x2={W} y1="12" y2="12" stroke="var(--hairline-strong)" strokeDasharray="3 3" />
        <polyline points={points.join(' ')} fill="none" stroke="var(--ink-1)" strokeWidth="1.8" />
      </svg>
      <div ref={track} className="lab-track">
        <span ref={ball} className="lab-ball" />
        <Pressable
          className="dz-button"
          data-kind="secondary"
          style={{ minHeight: 36, padding: '0 14px' }}
          onClick={play}
        >
          {lab.springs.play}
        </Pressable>
      </div>
    </div>
  )
}
