import { useEffect, useRef } from 'react'
import { engine } from '../engine/driver'
import { Bubble } from './Bubble'
import { Mirtis, type MirtisHandle, type MirtisMood } from './Mirtis'
import { Perch } from './Perch'

/** When the wake storyboard has finished and she settles into a glad face (ms after she wakes). */
const WAKE_MS = 1700
/** The bubble comes in this long after the cat starts rising: the rise (about 300 ms) plus a beat. */
const BUBBLE_LAG = 300

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
  // biome-ignore lint/correctness/useExhaustiveDependencies: greet is fixed for the life of this cat
  useEffect(() => {
    if (!greet) return
    engine.withChannel('cheer', () => engine.after(WAKE_MS, () => cat.current?.react('happy')))
    return () => engine.cancelCues('cheer')
  }, [])
  return (
    <Perch right={16} delay={delay}>
      <Mirtis ref={cat} size="verdict" mood={mood} wake={greet} />
      {line ? <Bubble line={line} delay={delay + BUBBLE_LAG} /> : null}
    </Perch>
  )
}
