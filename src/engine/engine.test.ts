import { describe, expect, it } from 'vitest'
import { Engine, type Target } from './engine'

function element(): Target & { style: { transform: string; opacity: string; filter: string } } {
  return { style: { transform: '', opacity: '', filter: '' }, isConnected: true }
}

function runFor(engine: Engine, ms: number, frame = 16) {
  for (let t = 0; t < ms; t += frame) engine.advance(frame)
}

describe('engine', () => {
  it('runs cue timers in time order on the virtual clock', () => {
    const engine = new Engine()
    const seen: string[] = []
    engine.after(200, () => seen.push('b'))
    engine.after(100, () => seen.push('a'))
    engine.advance(150)
    expect(seen).toEqual(['a'])
    engine.advance(100)
    expect(seen).toEqual(['a', 'b'])
  })

  it('settles a spring on its target and renders a transform', () => {
    const engine = new Engine()
    const el = element()
    engine.to(el, { x: 100 }, 'move')
    engine.advance(16)
    expect(el.style.transform).toMatch(/^translate3d\(/)
    runFor(engine, 2000)
    expect(engine.stateOf(el).values.x).toBe(100)
    expect(engine.isActive()).toBe(false)
  })

  it('is deterministic: the same steps give the same values', () => {
    const sample = () => {
      const engine = new Engine()
      const el = element()
      engine.to(el, { x: 80, y: -20 }, 'land')
      runFor(engine, 120)
      return engine.stateOf(el).values
    }
    expect(sample()).toEqual(sample())
  })

  it('finishChannel lands only that channel and keeps the clock', () => {
    const engine = new Engine()
    const beat = element()
    const chrome = element()
    const cues: string[] = []
    engine.withChannel('beat', () => {
      engine.to(beat, { x: 50 }, 'teach')
      engine.after(900, () => cues.push('beat cue'))
    })
    engine.to(chrome, { y: 30 }, 'move')
    engine.advance(16)
    engine.finishChannel('beat')
    expect(engine.stateOf(beat).values.x).toBe(50)
    expect(cues).toEqual(['beat cue'])
    expect(engine.now).toBe(16)
    expect(engine.isActive('chrome')).toBe(true)
  })

  it('scales cue times and spring time by channel tempo', () => {
    const engine = new Engine()
    engine.setTempo('beat', 2)
    const fired: number[] = []
    engine.withChannel('beat', () => engine.after(100, () => fired.push(engine.now)))
    engine.advance(150)
    expect(fired).toEqual([])
    engine.advance(50)
    expect(fired).toEqual([200])
  })

  it('reduced motion lands movement at once but still fades opacity', () => {
    const engine = new Engine()
    engine.reducedMotion = true
    const el = element()
    engine.to(el, { x: 40, opacity: 0 }, 'move')
    expect(engine.stateOf(el).values.x).toBe(40)
    expect(engine.isActive()).toBe(true)
  })

  it('an entrance is never quicker than the enter spring', () => {
    const engine = new Engine()
    const el = element()
    engine.set(el, { opacity: 0 })
    engine.to(el, { opacity: 1 }, 'fade')
    engine.advance(100)
    expect(engine.stateOf(el).values.opacity).toBeLessThan(0.9)
  })

  it('fires onArrive once the spring is near its target', () => {
    const engine = new Engine()
    const el = element()
    let arrived = 0
    engine.to(el, { x: 10 }, 'ui', { onArrive: () => arrived++ })
    runFor(engine, 1000)
    expect(arrived).toBe(1)
  })
})
