import { type RefObject, useLayoutEffect, useRef } from 'react'
import { engine } from '../engine/driver'
import { CHOREO_MS, ENTER_FLOOR, SHIFT } from '../engine/tokens'

/**
 * The lesson chrome's motion (old goStep, dock entry, progress and answer feedback; inventory 7.2-7.11).
 * Everything here runs on the chrome channel, so finishing a beat never cuts it short, and it only adds
 * motion to elements React already placed: no layout depends on it.
 */

/** Old `wrong` push for a shake: x velocity in px/s on the `shake` spring (k1300, zeta 0.2). */
const SHAKE_VELOCITY = 320
/** Old right-answer swell: scale velocity per second on `land`. */
const SWELL_VELOCITY = 0.9

const enter = (el: Element, from: Record<string, number>, delay: number) => {
  engine.set(el as HTMLElement, from)
  engine.after(delay, () => engine.to(el as HTMLElement, { opacity: 1, x: 0, y: 0 }, 'move'))
}

/**
 * Step change: the narration enters from the side the learner is walking to (0.35 opacity, 14 px, 35 ms
 * apart); the counter's changed digits roll (RollNumber); the progress fill glides. Within a step,
 * anything new in the narration (the feedback) and any new dock row rises into place instead of
 * appearing in one frame.
 */
export function useLessonMotion(root: RefObject<HTMLElement | null>, index: number, steps: number) {
  const shownIndex = useRef<number | null>(null)
  const seen = useRef(new WeakSet<Element>())
  const fill = useRef<HTMLElement | null>(null)
  const button = useRef<HTMLElement | null>(null)
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs after every commit; refs only
  useLayoutEffect(() => {
    const box = root.current
    if (!box) return
    const previous = shownIndex.current
    const changed = previous !== index
    shownIndex.current = index
    const direction = previous === null || index >= previous ? 1 : -1
    engine.withChannel('chrome', () => {
      const narration = [...box.querySelectorAll('.ls-narr > *')]
      if (changed) {
        narration.forEach((el, order) => {
          seen.current.add(el)
          enter(el, { opacity: ENTER_FLOOR, x: SHIFT.narr * direction }, order * CHOREO_MS.stagger)
        })
        // The counter rolls only its changed digits itself (RollNumber).
      } else {
        let order = 0
        for (const el of narration) {
          if (seen.current.has(el)) continue
          seen.current.add(el)
          enter(el, { opacity: 0, y: SHIFT.enter }, order++ * CHOREO_MS.stagger)
        }
      }
      // Dock rows: a control that was already there stays put (nav to nav only changes its label).
      let row = 0
      let lastTop = Number.NaN
      for (const el of box.querySelectorAll('.ls-dock > *')) {
        if (seen.current.has(el)) continue
        seen.current.add(el)
        const top = (el as HTMLElement).offsetTop
        if (top !== lastTop) row++
        lastTop = top
        enter(el, { opacity: ENTER_FLOOR, y: SHIFT.dock }, (row - 1) * CHOREO_MS.stagger)
      }
      // Soft İleri: the fill eases between primary and soft; the label ink flips at the midpoint.
      const primary = box.querySelector<HTMLElement>('.ls-dock .sh-btn--primary')
      if (primary) {
        const soft = primary.hasAttribute('data-soft') ? 1 : 0
        if (button.current !== primary) {
          button.current = primary
          engine.bind(primary, (v) => {
            const value = v['--soft'] ?? soft
            primary.dataset.ink = value > 0.5 ? 'soft' : 'action'
          })
          engine.set(primary, { '--soft': soft })
        } else if (engine.value(primary, '--soft') !== soft) engine.to(primary, { '--soft': soft }, 'fade')
      }
      // Progress fill: width glides on `move` (a width, not scaleX, so the rounded end keeps its shape).
      const bar = box.querySelector<HTMLElement>('.ls-progress__fill')
      if (bar) {
        const value = (index + 1) / steps
        if (fill.current !== bar) {
          fill.current = bar
          engine.bind(bar, (v) => {
            bar.style.width = `${(v.w ?? value) * 100}%`
          })
          engine.set(bar, { w: value })
        } else engine.to(bar, { w: value }, 'move')
      }
    })
  })
}

/** Answer feedback: a wrong pick shakes; the right one swells once; both are the old values. */
export function useAnswerMotion(
  root: RefObject<HTMLElement | null>,
  wrong: readonly string[],
  solved: boolean,
) {
  const counted = useRef({ wrong: wrong.length, solved })
  // biome-ignore lint/correctness/useExhaustiveDependencies: root is a stable ref
  useLayoutEffect(() => {
    const box = root.current
    const before = counted.current
    counted.current = { wrong: wrong.length, solved }
    if (!box) return
    engine.withChannel('chrome', () => {
      if (wrong.length > before.wrong) {
        const key = wrong.at(-1)
        const option = [...box.querySelectorAll<HTMLElement>('.ex-opt[data-state="wrong"]')].find(
          (el) => el.querySelector('.ex-opt__key')?.textContent === key,
        )
        const target = option ?? box.querySelector<HTMLElement>('.ls-answer')
        if (target) engine.to(target, { x: 0 }, 'shake', { velocity: { x: SHAKE_VELOCITY } })
      }
      if (solved && !before.solved) {
        const right = box.querySelector<HTMLElement>('.ex-opt[data-state="right"]')
        if (right) engine.to(right, { scale: 1 }, 'land', { velocity: { scale: SWELL_VELOCITY } })
      }
    })
  }, [wrong, solved])
}
