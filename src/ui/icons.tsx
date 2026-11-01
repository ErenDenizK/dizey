/**
 * Tab and chrome icons, drawn for Dizey on a 26 px grid with a 1.7 px stroke. Inactive tabs are
 * outlined; the active tab adds a soft fill, so selection never depends on colour alone.
 */
interface IconProps {
  active?: boolean
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

const softFill = (active?: boolean) => ({ fill: 'currentColor', fillOpacity: active ? 0.18 : 0 })

/** Dersler: a 2 x 2 matrix in brackets, its first entry done. */
export function PathIcon({ active }: IconProps) {
  return (
    <svg viewBox="0 0 26 26" aria-hidden="true">
      <path d="M5.5 4H4v18h1.5M20.5 4H22v18h-1.5" {...stroke} />
      <rect x="6.6" y="6.2" width="5.6" height="5.6" rx="1.6" fill="currentColor" />
      <rect x="13.8" y="6.2" width="5.6" height="5.6" rx="1.6" {...stroke} {...softFill(active)} />
      <rect x="13.8" y="14.2" width="5.6" height="5.6" rx="1.6" {...stroke} {...softFill(active)} />
      <rect x="6.6" y="14.2" width="5.6" height="5.6" rx="1.6" {...stroke} {...softFill(active)} />
    </svg>
  )
}

/** Exam: a paper with options, one marked. */
export function ExamIcon({ active }: IconProps) {
  return (
    <svg viewBox="0 0 26 26" aria-hidden="true">
      <rect x="5" y="3.5" width="16" height="19" rx="4" {...stroke} {...softFill(active)} />
      <circle cx="9.6" cy="9.5" r="1.5" fill="currentColor" />
      <path d="M13 9.5h4.5M13 14h4.5M13 18.5h4.5" {...stroke} />
      <circle cx="9.6" cy="14" r="1.5" {...stroke} strokeWidth={1.2} />
      <circle cx="9.6" cy="18.5" r="1.5" {...stroke} strokeWidth={1.2} />
    </svg>
  )
}

/** Me: a person. */
export function MeIcon({ active }: IconProps) {
  return (
    <svg viewBox="0 0 26 26" aria-hidden="true">
      <circle cx="13" cy="9" r="4.2" {...stroke} {...softFill(active)} />
      <path d="M5 21.5c1.4-4 4.4-6 8-6s6.6 2 8 6" {...stroke} {...softFill(active)} />
    </svg>
  )
}

export function ChevronRight() {
  return (
    <svg viewBox="0 0 10 16" width="10" height="16" aria-hidden="true" className="dz-chevron">
      <path d="M2 2l6 6-6 6" {...stroke} strokeWidth={2} />
    </svg>
  )
}

export function ChevronLeft() {
  return (
    <svg viewBox="0 0 12 20" width="12" height="20" aria-hidden="true">
      <path d="M10 2 2 10l8 8" {...stroke} strokeWidth={2.2} />
    </svg>
  )
}

export function Close() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path d="M3 3l10 10M13 3 3 13" {...stroke} strokeWidth={2} />
    </svg>
  )
}

export function Check() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path d="M3 8.5l3.2 3.2L13 4.8" {...stroke} strokeWidth={2.2} />
    </svg>
  )
}

/** A flag on a pole: an exam item marked to come back to. Filled when set. */
export function Flag({ active }: IconProps) {
  return (
    <svg viewBox="0 0 22 22" width="22" height="22" aria-hidden="true">
      <path d="M5 19.5V3" {...stroke} strokeWidth={2} />
      <path
        d="M5 3.8c2.6-1.3 4.8-1.3 6.6 0s4 1.3 5.9 0v8.4c-1.9 1.3-4.1 1.3-5.9 0s-4-1.3-6.6 0"
        {...stroke}
        strokeWidth={1.9}
        fill="currentColor"
        fillOpacity={active ? 1 : 0}
      />
    </svg>
  )
}

/** A clock face, for the hidden exam timer. */
export function ClockIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" {...stroke} strokeWidth={1.8} />
      <path d="M10 6v4.2l2.8 1.8" {...stroke} strokeWidth={1.8} />
    </svg>
  )
}

/** Ayarlar: a gear, eight teeth around a round hub. */
export function GearIcon() {
  return (
    <svg viewBox="0 0 26 26" width="26" height="26" aria-hidden="true">
      <circle cx="13" cy="13" r="3.4" {...stroke} />
      <path
        d="M13 3.5v2.6M13 19.9v2.6M3.5 13h2.6M19.9 13h2.6M6.3 6.3l1.9 1.9M17.8 17.8l1.9 1.9M6.3 19.7l1.9-1.9M17.8 8.2l1.9-1.9"
        {...stroke}
        strokeWidth={2.2}
      />
      <circle cx="13" cy="13" r="6.6" {...stroke} />
    </svg>
  )
}
