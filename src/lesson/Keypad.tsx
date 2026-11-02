import { useLayoutEffect, useRef, useState } from 'react'
import { strings } from '../content/strings'
import { engine } from '../engine/driver'
import { ENTER_FLOOR, SHIFT } from '../engine/tokens'
import { useEase } from './ease'

const fractionKeys = ['1', '2', '3', '⌫', '4', '5', '6', '−', '7', '8', '9', '/', '0'] as const
/** Without the fraction key, 0 takes its place and the check key spans the whole last row. */
const integerKeys = ['1', '2', '3', '⌫', '4', '5', '6', '−', '7', '8', '9', '0'] as const
type Key = (typeof fractionKeys)[number]

/**
 * Numeric keypad with minus and fraction keys (design review: the iOS number pad has no minus). The
 * system keyboard never opens, so the stage stays in view. The fraction key shows only when the lesson
 * has a fractional answer somewhere, so its presence never gives one step's answer away.
 */
export function Keypad({
  value,
  onChange,
  onSubmit,
  disabled,
  sound,
  fraction = false,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
  /** data-sound for the whole pad: "none" when the caller plays the keys' sounds itself. */
  sound?: string
  /** Offer the fraction key. */
  fraction?: boolean
}) {
  const keys: readonly Key[] = fraction ? fractionKeys : integerKeys
  const press = (key: Key) => {
    if (key === '⌫') onChange(value.slice(0, -1))
    else if (key === '−') onChange(value.startsWith('−') ? value.slice(1) : `−${value}`)
    else if (key === '/') onChange(value.includes('/') || value === '' ? value : `${value}/`)
    else if (value.length < 8) onChange(value + key)
  }
  const hint = useRef<HTMLSpanElement>(null)
  const last = useRef<HTMLSpanElement>(null)
  const check = useRef<HTMLButtonElement>(null)
  const before = useRef<string | null>(null)
  const line = useRef<HTMLSpanElement>(null)
  const ghostRef = useRef<HTMLSpanElement>(null)
  /** Layout left of the centred line before this change (without its running offset). */
  const lineLeft = useRef<number | null>(null)
  /** A deleted last character stays for its fade-out instead of vanishing in one frame (PR-16). */
  const ghostSerial = useRef(0)
  const [ghost, setGhost] = useState<{ char: string; id: number } | null>(null)
  const checkable = !disabled && value !== '' && value !== '−'
  useEase(check, checkable)
  // Direct feedback for a typed key: the new last character rises in. The placeholder fades out when
  // the first character arrives and back in when the field empties. A deleted character fades out where it
  // stood. The line is centred, so every change moves the characters already there: they glide to their new
  // place (FLIP on the line) instead of jumping half a digit in one frame.
  useLayoutEffect(() => {
    const previous = before.current
    before.current = value
    const row = line.current
    if (row) {
      const offset = engine.value(row, 'x')
      const left = row.getBoundingClientRect().left - offset
      const was = lineLeft.current
      lineLeft.current = left
      if (previous !== null && was !== null && Math.abs(was + offset - left) > 0.5) {
        engine.set(row, { x: was + offset - left })
        engine.withChannel('chrome', () => engine.to(row, { x: 0 }, 'ui'))
      }
    }
    if (previous !== null && value.length < previous.length && previous.startsWith(value))
      setGhost({ char: previous.slice(value.length), id: ++ghostSerial.current })
    else if (previous !== null && value !== previous) setGhost(null)
    const ink = hint.current
    const tail = last.current
    const shown = value === '' ? 1 : 0
    if (ink) {
      if (previous === null) engine.set(ink, { opacity: shown })
      else engine.withChannel('chrome', () => engine.to(ink, { opacity: shown }, 'fade'))
    }
    if (!tail) return
    if (previous !== null && value.length > previous.length && value.startsWith(previous)) {
      engine.set(tail, { opacity: ENTER_FLOOR, y: SHIFT.count })
      engine.withChannel('chrome', () => {
        engine.to(tail, { opacity: 1 }, 'ui')
        engine.to(tail, { y: 0 }, 'ui')
      })
    } else engine.set(tail, { opacity: 1, y: 0 })
  }, [value])
  // The deleted character fades out from where it stood, then leaves the DOM.
  useLayoutEffect(() => {
    const el = ghostRef.current
    if (!ghost || !el) return
    engine.set(el, { opacity: 1, y: 0 })
    engine.withChannel('chrome', () => {
      engine.to(el, { opacity: 0 }, 'fade')
      engine.to(el, { y: SHIFT.count }, 'ui')
    })
    engine.after(220, () => setGhost((g) => (g?.id === ghost.id ? null : g)))
  }, [ghost])
  return (
    <div className="ls-keypad-wrap" data-sound={sound}>
      <output className="ls-answer" aria-label={strings.lesson.answerField}>
        <span ref={hint} className="ls-answer__hint" aria-hidden={value !== '' || undefined}>
          <span>{strings.lesson.answerPlaceholder}</span>
        </span>
        <span ref={line} className="ls-answer__line">
          {value.slice(0, -1)}
          <span ref={last} className="ls-answer__last">
            {value.slice(-1)}
          </span>
          {ghost && (
            <span key={ghost.id} ref={ghostRef} className="ls-answer__ghost" aria-hidden="true">
              {ghost.char}
            </span>
          )}
        </span>
      </output>
      <div className="ls-keypad">
        {keys.map((key) => (
          <button
            key={key}
            type="button"
            className="ls-key sh-press"
            data-fn={key === '⌫' || key === '−' || key === '/'}
            aria-label={key === '⌫' ? strings.lesson.delete : key === '−' ? strings.lesson.minus : undefined}
            disabled={disabled}
            onClick={() => press(key)}
          >
            {key === '−' ? <MinusGlyph /> : key}
          </button>
        ))}
        <button
          ref={check}
          type="button"
          className="ls-key ls-key--go sh-press"
          data-wide={!fraction}
          disabled={!checkable}
          onClick={onSubmit}
        >
          {strings.lesson.check}
        </button>
      </div>
    </div>
  )
}

/** The font's minus is a thin short dash next to the digits; drawn at digit width and stroke instead. */
function MinusGlyph() {
  return (
    <svg className="ls-key__glyph" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 12h16" />
    </svg>
  )
}
