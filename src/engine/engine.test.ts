import { describe, expect, it } from 'vitest'
import { Engine, type Target } from './engine'
import { nearestStop, project, rubberBand, rubberClamp, VelocityTracker } from './gesture'
import { overshoot, physicsOf, settleTime, solve, stiffnessOf } from './spring'
import { pressScale, SPRINGS } from './tokens'

function element(): Target & { style: { transform: string; opacity: string; vars: Record<string, string> } } {
  const vars: Record<string, string> = {}
  return {
    style: {
      transform: '',
      opacity: '',
      vars,
      setProperty: (name: string, value: string) => {
        vars[name] = value
      },
    },
    isConnected: true,
  }
}

function runFor(engine: Engine, ms: number, frame = 1000 / 60) {
  let t = 0
  while (t + frame <= ms) {
    engine.advance(frame)
    t += frame
  }
  if (ms - t > 0) engine.advance(ms - t)
}

describe('spring math', () => {
  it('matches a numerical integration of the same spring', () => {
    for (const spec of Object.values(SPRINGS)) {
      const { k, c } = stiffnessOf(spec)
      let x = 1
      let v = 0
      const h = 1e-5
      for (let i = 0; i < 0.2 / h; i++) {
        v += (-k * x - c * v) * h
        x += v * h
      }
      const [u, vel] = solve(physicsOf(spec), 1, 0, 0.2)
      expect(u).toBeCloseTo(x, 3)
      expect(vel).toBeCloseTo(v, 1)
    }
  })

  it('keeps every token inside the limits written in the motion spec', () => {
    for (const [name, spec] of Object.entries(SPRINGS)) {
      expect(spec.bounce, name).toBeLessThanOrEqual(0.35)
      // Perceptual duration and the 1% settle time stay within 10% for bounce 0.
      if (spec.bounce === 0) expect(settleTime(spec)).toBeLessThan(spec.duration * 1.1)
    }
    expect(overshoot(SPRINGS.page)).toBe(0)
    expect(overshoot(SPRINGS.snap)).toBeLessThan(0.02)
    expect(overshoot(SPRINGS.settle)).toBeLessThan(0.08)
  })

  it('carries an initial velocity: a flick keeps moving before it returns', () => {
    const [u] = solve(physicsOf(SPRINGS.glide), 0, 2000, 0.03)
    expect(u).toBeGreaterThan(30)
  })
})

describe('engine', () => {
  it('runs cues in time order on the virtual clock', () => {
    const engine = new Engine()
    const seen: string[] = []
    engine.after(200, () => seen.push('b'))
    engine.after(100, () => seen.push('a'))
    engine.advance(150)
    expect(seen).toEqual(['a'])
    engine.advance(100)
    expect(seen).toEqual(['a', 'b'])
  })

  it('settles exactly on the target and stops', () => {
    const engine = new Engine()
    const el = element()
    engine.to(el, { x: 100 }, 'glide')
    engine.advance(16)
    expect(el.style.transform).toMatch(/^translate3d\(/)
    runFor(engine, 1500)
    expect(engine.value(el, 'x')).toBe(100)
    expect(el.style.transform).toBe('translate3d(100px, 0px, 0) scale(1)')
    expect(el.style.opacity).toBe('')
    expect(engine.isActive()).toBe(false)
  })

  it('gives the same curve at 60 Hz, 120 Hz and with dropped frames', () => {
    const at = (frame: number) => {
      const engine = new Engine()
      const el = element()
      engine.to(el, { y: 300 }, 'page')
      runFor(engine, 120, frame)
      return engine.value(el, 'y')
    }
    expect(at(1000 / 120)).toBeCloseTo(at(1000 / 60), 1)
    expect(at(40)).toBeCloseTo(at(1000 / 60), 1)
  })

  it('retargets from the live value and velocity: no jump, no stall', () => {
    const engine = new Engine()
    const el = element()
    engine.to(el, { x: 200 }, 'glide')
    runFor(engine, 80)
    const before = engine.value(el, 'x')
    const speed = engine.velocity(el, 'x')
    expect(speed).toBeGreaterThan(0)
    engine.to(el, { x: 0 }, 'glide')
    expect(engine.value(el, 'x')).toBe(before)
    expect(engine.velocity(el, 'x')).toBeCloseTo(speed, 6)
    engine.advance(4)
    // Momentum carries it a little further before it turns.
    expect(engine.value(el, 'x')).toBeGreaterThan(before)
  })

  it('moves on the first frame after a tap when launched, without overshooting', () => {
    const engine = new Engine()
    const plain = element()
    const launched = element()
    engine.set(plain, { x: 390 })
    engine.set(launched, { x: 390 })
    engine.to(plain, { x: 0 }, 'page')
    engine.to(launched, { x: 0 }, 'page', { launch: 0.6 })
    engine.advance(1000 / 60)
    expect(390 - engine.value(launched, 'x')).toBeGreaterThan(2 * (390 - engine.value(plain, 'x')))
    let min = 390
    for (let i = 0; i < 80; i++) {
      engine.advance(1000 / 60)
      min = Math.min(min, engine.value(launched, 'x'))
    }
    expect(min).toBeGreaterThanOrEqual(0)
  })

  it('never overshoots effects, even with a bouncy spring', () => {
    const engine = new Engine()
    const el = element()
    engine.set(el, { opacity: 0 })
    engine.to(el, { opacity: 1 }, 'settle')
    let max = 0
    for (let i = 0; i < 100; i++) {
      engine.advance(10)
      max = Math.max(max, engine.value(el, 'opacity'))
    }
    expect(max).toBeLessThanOrEqual(1)
  })

  it('lands spatial motion at once under reduced motion but still fades', () => {
    const engine = new Engine()
    engine.reducedMotion = true
    const el = element()
    engine.set(el, { opacity: 0 })
    engine.to(el, { y: 40, opacity: 1 }, 'page')
    expect(engine.value(el, 'y')).toBe(40)
    engine.advance(50)
    expect(engine.value(el, 'opacity')).toBeGreaterThan(0)
    expect(engine.value(el, 'opacity')).toBeLessThan(1)
  })

  it('finishes one channel and leaves the others running', () => {
    const engine = new Engine()
    const a = element()
    const b = element()
    const seen: string[] = []
    engine.withChannel('beat', () => {
      engine.to(a, { x: 50 }, 'teach', { onArrive: () => seen.push('a') })
      engine.after(300, () => seen.push('cue'))
    })
    engine.to(b, { x: 50 }, 'glide')
    engine.advance(16)
    engine.finishChannel('beat')
    expect(engine.value(a, 'x')).toBe(50)
    expect(seen).toEqual(['a', 'cue'])
    expect(engine.isActive('chrome')).toBe(true)
  })

  it('scales a channel by its tempo', () => {
    const engine = new Engine()
    engine.setTempo('beat', 2)
    const fast = element()
    const slow = element()
    engine.to(fast, { x: 100 }, 'teach')
    engine.withChannel('beat', () => engine.to(slow, { x: 100 }, 'teach'))
    runFor(engine, 200)
    expect(engine.value(slow, 'x')).toBeLessThan(engine.value(fast, 'x'))
  })

  it('finishes long custom pixel travels promptly (a 700 px clip settles within a second)', () => {
    const engine = new Engine()
    const el = element()
    let arrived = false
    engine.set(el, { t: 700 })
    engine.to(el, { t: 0 }, 'page', { onArrive: () => (arrived = true) })
    runFor(engine, 1000)
    expect(arrived).toBe(true)
  })

  it('writes custom properties for CSS to read', () => {
    const engine = new Engine()
    const el = element()
    engine.to(el, { '--press': 1 }, 'tap', { effect: true })
    runFor(engine, 500)
    expect(el.style.vars['--press']).toBe('1')
  })

  it('accepts the previous engine names while callers migrate', () => {
    const engine = new Engine()
    const el = element()
    engine.to(el, { scale: 0.97 }, 'press')
    runFor(engine, 400)
    expect(engine.value(el, 'scale')).toBe(0.97)
  })
})

describe('gestures', () => {
  it('measures a steady swipe and ignores a finger that stopped', () => {
    const tracker = new VelocityTracker()
    for (let t = 0; t <= 100; t += 8) tracker.add(t, 0, t * 1.2)
    expect(tracker.velocity(100).y).toBeCloseTo(1200, 0)
    expect(tracker.velocity(300).y).toBe(0)
  })

  it('rubber-bands: resistance grows and never passes the dimension', () => {
    expect(rubberBand(0, 800)).toBe(0)
    expect(rubberBand(100, 800)).toBeLessThan(100)
    expect(rubberBand(10_000, 800)).toBeLessThan(800)
    expect(rubberBand(-100, 800)).toBeCloseTo(-rubberBand(100, 800))
    expect(rubberClamp(50, 0, 100, 800)).toBe(50)
    expect(rubberClamp(150, 0, 100, 800)).toBeLessThan(150)
  })

  it('projects momentum the way UIKit does', () => {
    expect(project(0, 1000)).toBeCloseTo(499, 0)
    expect(nearestStop(300, 0, [0, 400, 800])).toBe(400)
    expect(nearestStop(300, -1500, [0, 400, 800])).toBe(0)
  })

  it('presses every element by the same physical depth', () => {
    expect(pressScale(350)).toBeCloseTo(1 - 6 / 350)
    expect(pressScale(44)).toBeGreaterThanOrEqual(0.86)
    expect(pressScale(44)).toBe(0.92)
    expect(pressScale(1000)).toBe(0.985)
  })
})
