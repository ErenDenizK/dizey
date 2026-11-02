import { useId } from 'react'
import type { Badge, BadgeId } from './badges'
import './rewards.css'

/**
 * A rozet's emblem: an enamel tile between the app's own brackets, so a badge reads as a 1×1 matrix, a sealed
 * cell. The brackets are separate elements (`.emblem__br`) so the earning moment can close them like every other
 * seal. Inside: a drawn scene of the technique or habit (tile coordinates 0 to 76). When illustrated art exists for
 * the badge (public/badges/<id>.webp), it replaces the drawn scene inside the same tile.
 */
export function Emblem({
  badge,
  art,
  className = '',
  bare = false,
}: {
  badge: Badge
  art?: string | undefined
  className?: string
  /** An item, not a slot: the same footprint without the brackets (docs/decisions/0016-bracket-grammar.md). */
  bare?: boolean
}) {
  const id = useId().replace(/:/g, '')
  return (
    <svg className={`emblem emblem--${badge.hue} ${className}`} viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-enamel`} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" className="emblem__enamel-top" />
          <stop offset="1" className="emblem__enamel-bottom" />
        </linearGradient>
        <radialGradient id={`${id}-gloss`} cx="0.3" cy="0.12" r="0.75">
          <stop offset="0" className="emblem__gloss-in" />
          <stop offset="1" className="emblem__gloss-out" />
        </radialGradient>
        <clipPath id={`${id}-tile`}>
          <rect x="22" y="22" width="76" height="76" rx="22" />
        </clipPath>
      </defs>
      <ellipse className="emblem__ground" cx="60" cy="104" rx="30" ry="4" />
      <g className="emblem__tile">
        <rect x="22" y="22" width="76" height="76" rx="22" fill={`url(#${id}-enamel)`} />
        {art ? (
          <image
            href={art}
            x="22"
            y="22"
            width="76"
            height="76"
            clipPath={`url(#${id}-tile)`}
            preserveAspectRatio="xMidYMid slice"
          />
        ) : (
          <g transform="translate(22 22)">
            <Scene id={badge.id} />
          </g>
        )}
        <rect x="22" y="22" width="76" height="76" rx="22" fill={`url(#${id}-gloss)`} />
        <rect className="emblem__rim" x="22.75" y="22.75" width="74.5" height="74.5" rx="21.25" />
      </g>
      {bare ? null : (
        <>
          <path className="emblem__br emblem__br--l" d="M16 20H11V100H16" />
          <path className="emblem__br emblem__br--r" d="M104 20H109V100H104" />
        </>
      )}
    </svg>
  )
}

/* The drawn scenes. Ink is the light colour on the enamel; `faint` is the same ink, quieter; `deep` is the hue's
   dark, for marks on an inked cell. */

function Cell({ x, y, s = 14, on = false }: { x: number; y: number; s?: number; on?: boolean }) {
  return (
    <rect className={on ? 'emblem__ink' : 'emblem__line'} x={x} y={y} width={s} height={s} rx={s * 0.28} />
  )
}

function Scene({ id }: { id: BadgeId }) {
  switch (id) {
    case 'first-lesson':
      // The path: three cells, the first one done.
      return (
        <g>
          <path className="emblem__stroke emblem__faint-stroke" d="M30 38H46M50 38H58" />
          <Cell x={10} y={27} s={22} on />
          <path className="emblem__deep-stroke" d="M15.5 38.5l4 4 7.5-8.5" />
          <Cell x={44} y={31} s={14} />
          <Cell x={62} y={33} s={10} />
        </g>
      )
    case 'sarrus': {
      // A 3×3 of dots with its first two columns copied (faint) and the three down diagonals drawn.
      const xs = [14, 26, 38, 50, 62]
      const ys = [24, 38, 52]
      return (
        <g>
          <path className="emblem__stroke" d="M14 24L38 52M26 24L50 52M38 24L62 52" />
          {ys.map((y) =>
            xs.map((x, i) => (
              <circle
                key={`${x}-${y}`}
                className={i < 3 ? 'emblem__ink' : 'emblem__faint'}
                cx={x}
                cy={y}
                r="4"
              />
            )),
          )}
        </g>
      )
    }
    case 'laplace': {
      // Expansion along the first row: its cells inked with alternating signs, the minors quiet.
      const at = [16, 31, 46]
      return (
        <g>
          {at.map((y, r) => at.map((x) => <Cell key={`${x}-${y}`} x={x} y={y} on={r === 0} />))}
          <path
            className="emblem__deep-stroke emblem__thin"
            d="M19.5 23h7M23 19.5v7M34.5 23h7M49.5 23h7M53 19.5v7"
          />
        </g>
      )
    }
    case 'gauss': {
      // Echelon form: a staircase of inked cells over quiet zeros.
      const at = [16, 31, 46]
      return (
        <g>
          {at.map((y, r) =>
            at.map((x, c) =>
              c >= r ? (
                <Cell key={`${x}-${y}`} x={x} y={y} on />
              ) : (
                <circle key={`${x}-${y}`} className="emblem__faint" cx={x + 7} cy={y + 7} r="2.4" />
              ),
            ),
          )}
        </g>
      )
    }
    case 'inverse': {
      // The identity: ones on the diagonal, nothing else.
      const at = [16, 31, 46]
      return (
        <g>
          {at.map((y, r) =>
            at.map((x, c) =>
              r === c ? (
                <Cell key={`${x}-${y}`} x={x} y={y} on />
              ) : (
                <circle key={`${x}-${y}`} className="emblem__faint" cx={x + 7} cy={y + 7} r="2.4" />
              ),
            ),
          )}
          {at.map((v) => (
            <path key={v} className="emblem__deep-stroke emblem__thin" d={`M${v + 6} ${v + 4.5}l1.5-1v8`} />
          ))}
        </g>
      )
    }
    case 'cramer':
      // x = |A_x| / |A|: two determinants, the top one with its column replaced by the right-hand side.
      return (
        <g>
          <path className="emblem__stroke emblem__thin" d="M20 11v22M56 11v22M20 43v22M56 43v22" />
          <path className="emblem__stroke" d="M12 38H64" />
          {[0, 1].map((half) =>
            [0, 1].map((r) =>
              [26, 34, 42].map((x, c) => (
                <rect
                  key={`${half}-${r}-${x}`}
                  className={half === 0 && c === 1 ? 'emblem__ink' : 'emblem__faint'}
                  x={x}
                  y={13 + half * 32 + r * 10}
                  width="8"
                  height="8"
                  rx="2.4"
                />
              )),
            ),
          )}
        </g>
      )
    case 'fixed':
      // A mistake, struck through by the right answer.
      return (
        <g>
          <path className="emblem__stroke emblem__faint-stroke" d="M17 20L39 42M39 20L17 42" />
          <path className="emblem__stroke emblem__bold" d="M28 46l10 10 22-26" />
        </g>
      )
    case 'clean-notebook':
      // A notebook page whose every line is ticked.
      return (
        <g>
          <rect className="emblem__line" x="16" y="12" width="44" height="52" rx="8" />
          {[0, 1, 2, 3].map((n) => (
            <circle key={n} className="emblem__ink" cx="16" cy={21 + n * 11} r="2.6" />
          ))}
          {[24, 35, 46].map((y) => (
            <g key={y}>
              <path className="emblem__stroke emblem__faint-stroke emblem__thin" d={`M24 ${y}H42`} />
              <path className="emblem__stroke emblem__thin" d={`M46 ${y}l3 3 6-6.5`} />
            </g>
          ))}
        </g>
      )
    case 'insight': {
      // Seeing without computing: a 3×3 of dots whose third column is joined to the first two by thin lines,
      // under an eye-like arc.
      const xs = [18, 38, 58]
      const ys = [34, 48, 62]
      return (
        <g>
          <path className="emblem__stroke" d="M10 22Q38 2 66 22" />
          <circle className="emblem__ink" cx="38" cy="14" r="3.4" />
          <path
            className="emblem__stroke emblem__faint-stroke emblem__thin"
            d="M18 34Q38 26 58 34M38 34Q48 28 58 34"
          />
          {ys.map((y) =>
            xs.map((x, i) => (
              <circle
                key={`${x}-${y}`}
                className={i === 2 ? 'emblem__ink' : 'emblem__faint'}
                cx={x}
                cy={y}
                r="4.2"
              />
            )),
          )}
        </g>
      )
    }
    case 'rehearsal':
      // An exam paper: options, one chosen, and the clock that ran beside it.
      return (
        <g>
          <rect className="emblem__line" x="14" y="12" width="40" height="52" rx="8" />
          {[24, 35, 46].map((y, n) => (
            <g key={y}>
              <circle className={n === 1 ? 'emblem__ink' : 'emblem__line'} cx="23" cy={y} r="3.6" />
              <path className="emblem__stroke emblem__faint-stroke emblem__thin" d={`M31 ${y}H46`} />
            </g>
          ))}
          <circle className="emblem__disc" cx="56" cy="54" r="12" />
          <path className="emblem__deep-stroke emblem__thin" d="M56 47v7.5l4.5 3" />
        </g>
      )
  }
}

/** Where a badge's illustrated art would live, when it exists. */
export function artFor(id: BadgeId, available: ReadonlySet<BadgeId>): string | undefined {
  return available.has(id) ? `${import.meta.env.BASE_URL}badges/${id}.webp` : undefined
}
