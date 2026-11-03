import { useEffect, useRef, useState } from 'react'
import { engine } from '../engine/driver'
import { Bubble } from './Bubble'
import { flight } from './flight'
import { Mirtis, type MirtisHandle, type MirtisMood } from './Mirtis'
import { Perch } from './Perch'

/** When the wake storyboard has finished and she settles into a glad face (ms after she wakes). */
const WAKE_MS = 1700
/** The bubble comes in this long after the cat starts rising: the rise (about 300 ms) plus a beat. */
const BUBBLE_LAG = 300
/** A flying cat's bubble waits for her landing (the flight takes about this long, ms). */
const FLIGHT_LAG = 480

/**
 * A lesson moment (src/character/moments.ts): the 56 px cat on the top edge of the card she belongs to, and, when the
 * moment has words, her bubble beside her head. `greet` wakes her from sleep and then lets her be glad (the lesson's
 * first step); otherwise she plays `mood` as soon as she is up. Put it inside a positioned card.
 */
export function Cheer({
  mood = 'rest',
  line,
  delay = 0,
  greet = false,
}: {
  mood?: MirtisMood
  line?: string
  /** ms to wait before the rise, as for Perch. */
  delay?: number
  greet?: boolean
}) {
  const cat = useRef<MirtisHandle>(null)
  // A cat already in the air (flight.ts) brings the greeting herself: she lands awake and plays `happy`, no wake-up.
  const [arriving] = useState(() => greet && flight.holding())
  // biome-ignore lint/correctness/useExhaustiveDependencies: greet is fixed for the life of this cat
  useEffect(() => {
    if (!greet || arriving) return
    engine.withChannel('cheer', () => engine.after(WAKE_MS, () => cat.current?.react('happy')))
    return () => engine.cancelCues('cheer')
  }, [])
  // The flight did not take her (nothing to land on): she rises awake and is glad a beat later.
  const claimed = (flown: boolean) => {
    if (arriving && !flown)
      engine.withChannel('cheer', () => engine.after(BUBBLE_LAG, () => cat.current?.react('happy')))
  }
  return (
    <Perch right={16} delay={delay} {...(greet ? { anchor: 'greet' as const } : {})} onClaim={claimed}>
      <Mirtis
        ref={cat}
        size="verdict"
        mood={mood}
        wake={greet && !arriving}
        anchor={greet ? 'greet' : 'verdict'}
      />
      {line ? <Bubble line={line} delay={arriving ? FLIGHT_LAG : delay + BUBBLE_LAG} /> : null}
    </Perch>
  )
}
