import { forwardRef, useId, useImperativeHandle, useLayoutEffect, useRef } from 'react'
import { engine } from '../engine/driver'
import { flight, type Spot } from './flight'
import {
  CatMotion,
  createCat,
  type MirtisMood,
  type MirtisSize,
  type MotionHost,
  PLAY_OF,
  pose,
  RIG_OF,
} from './mirtis'
import './mirtis.css'

export type { MirtisMood, MirtisSize }

export type MirtisHandle = {
  /** Plays the reaction of a mood (a bounce, a flinch, a purr). Most come back to rest by themselves. */
  react: (mood: MirtisMood) => void
}

/**
 * The spring engine's clock as the cat's driver: frames are an engine ticker (so the cat is on the same virtual time
 * as everything else, and a review script steps it), blink waits are plain timers (so an idle cat keeps the engine
 * idle). The cat has its own channel; nothing else lands or cancels it.
 */
function engineHost(channel: string, landed: () => void): MotionHost {
  const timers = new Set<ReturnType<typeof setTimeout>>()
  return {
    frames: (tick) => engine.withChannel(channel, () => engine.addTicker({ step: tick, finish: landed })),
    later: (ms, fn) => {
      const id = setTimeout(() => {
        timers.delete(id)
        fn()
      }, ms)
      timers.add(id)
    },
    stop: () => {
      for (const id of timers) clearTimeout(id)
      timers.clear()
    },
  }
}

/** Each cat blinks on its own seed, so two on screen never blink together. */
let nextSeed = 1

/**
 * Mırtis, drawn inline in the card it belongs to (never over content, never following anyone). The rig is built once
 * (mirtis.ts); the motion runs its own springs and asks for frames only while something moves. Reduced motion follows
 * the engine's flag: reactions get shorter and stiffer, they are never cut.
 *
 * `anchor` names the spot she can be flown from or to between pages (flight.ts).
 * `mood` plays that mood's reaction when it changes; `wake` starts asleep and stretches awake (the app's hello).
 * The lesson end's glow is an engine value (`--glow`) on this very svg; CSS reads it.
 */
export const Mirtis = forwardRef<
  MirtisHandle,
  { size: MirtisSize; mood?: MirtisMood; className?: string; wake?: boolean; anchor?: Spot }
>(function Mirtis({ size, mood = 'rest', className = '', wake = false, anchor }, ref) {
  const root = useRef<SVGSVGElement>(null)
  const motion = useRef<CatMotion | null>(null)
  const first = useRef(true)
  const channel = `mirtis-${useId()}`
  const rig = RIG_OF[size]

  const react = (next: MirtisMood) => {
    const m = motion.current
    if (!m) return
    m.setReduced(engine.reducedMotion)
    m.play(PLAY_OF[next])
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: built once per rig; mood and wake are read at mount only
  useLayoutEffect(() => {
    const svg = root.current
    if (!svg) return
    const cat = createCat(svg, rig)
    const m = new CatMotion(
      (v) => {
        // The engine's flag can flip while a reaction runs; follow it frame by frame.
        if (m.reduced !== engine.reducedMotion) m.setReduced(engine.reducedMotion)
        cat.update(v)
      },
      {
        start: wake ? 'sleepy' : 'rest',
        seed: nextSeed++,
        reduced: engine.reducedMotion,
        host: engineHost(channel, () => m.land()),
      },
    )
    motion.current = m
    cat.update(wake ? pose('sleepy') : m.v)
    if (wake) m.play('wake')
    else if (mood !== 'rest') m.play(PLAY_OF[mood])
    first.current = true
    return () => {
      m.destroy()
      motion.current = null
      cat.dispose()
    }
  }, [rig.lod, rig.head])

  // biome-ignore lint/correctness/useExhaustiveDependencies: react reads refs only
  useLayoutEffect(() => {
    // The mount effect above already played the first mood.
    if (first.current) {
      first.current = false
      return
    }
    react(mood)
  }, [mood])

  // biome-ignore lint/correctness/useExhaustiveDependencies: react reads refs only
  useImperativeHandle(ref, () => ({ react }), [])

  // A cat with an anchor can be flown from and to (flight.ts).
  // biome-ignore lint/correctness/useExhaustiveDependencies: react reads refs only
  useLayoutEffect(() => {
    const svg = root.current
    if (!anchor || !svg) return
    return flight.register(anchor, { svg, react })
  }, [anchor])

  return (
    <svg
      ref={root}
      className={`mirtis mirtis--${size}${rig.head ? ' mirtis--head' : ''} ${className}`.trim()}
      aria-hidden="true"
    />
  )
})
