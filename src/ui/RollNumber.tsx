import { useLayoutEffect, useRef, useState } from 'react'
import { engine } from '../engine/driver'
import { CHOREO_MS } from '../engine/tokens'

/**
 * A number whose changed digits roll and whose unchanged digits stay still (Stageshow motion rule
 * "change only what changed"; numbers roll last digit first). Each place (ones, tens, ...) is its own
 * slot: on a change the old digit leaves through the slot's soft edge while the new one arrives from the
 * other side, in the direction the value moved. The ones roll first, each higher place one stagger later.
 * The slots sit against the right edge, so text after the number never moves.
 */
export function RollNumber({ value }: { value: number }) {
  const [places, setPlaces] = useState(() => toPlaces(value, null, 1))
  const shown = useRef(value)
  if (shown.current !== value) {
    const direction = value > shown.current ? 1 : -1
    shown.current = value
    setPlaces((before) => toPlaces(value, before, direction))
  }
  return (
    <span className="dz-roll">
      {places.map((place) => (
        <Slot key={place.place} place={place} onSettled={() => settle(setPlaces, place.place)} />
      ))}
    </span>
  )
}

type Place = {
  /** 0 = ones, 1 = tens, ... */
  place: number
  digit: string
  /** The digit leaving, while it rolls out. */
  leaving: string | null
  /** +1 = the value grew (digits roll up), -1 = it shrank. */
  direction: number
  /** Bumps on every change so the slot replays its roll. */
  turn: number
}

export function toPlaces(value: number, before: Place[] | null, direction: number): Place[] {
  const digits = String(value).split('').reverse()
  const width = Math.max(digits.length, before?.length ?? 0)
  const next: Place[] = []
  for (let place = width - 1; place >= 0; place--) {
    const digit = digits[place] ?? ''
    const old = before?.find((p) => p.place === place)
    if (!digit && !old?.digit) continue
    if (old && old.digit === digit) next.push(old)
    else
      next.push({
        place,
        digit,
        leaving: old?.digit || null,
        direction,
        turn: (old?.turn ?? 0) + (before ? 1 : 0),
      })
  }
  return next
}

function settle(setPlaces: (fn: (p: Place[]) => Place[]) => void, place: number) {
  setPlaces((all) =>
    all
      .filter((p) => p.place !== place || p.digit)
      .map((p) => (p.place === place && p.leaving !== null ? { ...p, leaving: null } : p)),
  )
}

function Slot({ place, onSettled }: { place: Place; onSettled: () => void }) {
  const incoming = useRef<HTMLSpanElement>(null)
  const outgoing = useRef<HTMLSpanElement>(null)
  const done = useRef(onSettled)
  done.current = onSettled

  // biome-ignore lint/correctness/useExhaustiveDependencies: replays once per turn of this place
  useLayoutEffect(() => {
    if (place.turn === 0) return
    const inEl = incoming.current
    const outEl = outgoing.current
    const travel = (inEl ?? outEl)?.offsetHeight ?? 16
    const delay = place.place * CHOREO_MS.stagger
    engine.withChannel('chrome', () => {
      if (inEl) engine.set(inEl, { y: travel * place.direction, opacity: 0 })
      if (outEl) engine.set(outEl, { y: 0, opacity: 1 })
      engine.after(delay, () => {
        if (outEl) engine.to(outEl, { y: -travel * place.direction, opacity: 0 }, 'move')
        if (inEl) engine.to(inEl, { y: 0, opacity: 1 }, 'move', { onArrive: () => done.current() })
        else done.current()
      })
    })
  }, [place.turn])

  return (
    <span className="dz-roll__slot" data-leaving={place.leaving !== null || undefined}>
      {place.digit ? (
        <span ref={incoming} className="dz-roll__digit">
          {place.digit}
        </span>
      ) : null}
      {place.leaving !== null ? (
        <span ref={outgoing} className="dz-roll__digit dz-roll__digit--out" aria-hidden="true">
          {place.leaving}
        </span>
      ) : null}
    </span>
  )
}
