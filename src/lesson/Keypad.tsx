import { strings } from '../content/strings'

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
  return (
    <div className="ls-keypad-wrap" data-sound={sound}>
      <output className="ls-answer" aria-label={strings.lesson.answerField}>
        {value || <span className="ls-answer__hint">{strings.lesson.answerPlaceholder}</span>}
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
            {key}
          </button>
        ))}
        <button
          type="button"
          className="ls-key ls-key--go sh-press"
          data-wide={!fraction}
          disabled={disabled || value === '' || value === '−'}
          onClick={onSubmit}
        >
          {strings.lesson.check}
        </button>
      </div>
    </div>
  )
}
