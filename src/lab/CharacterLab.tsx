import { useNavigate } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { Duo, type DuoHandle } from '../character/Duo'
import type { Mood } from '../character/rig'
import { lab } from '../content/lab'
import { strings } from '../content/strings'
import { BadgeReveal } from '../rewards/BadgeReveal'
import { BADGES, type Badge } from '../rewards/badges'
import { Emblem } from '../rewards/Emblem'
import { Pressable } from '../ui/Pressable'
import { Screen } from '../ui/Screen'
import '../ui/ui.css'
import './lab.css'

const MOODS: Mood[] = ['happy', 'proud', 'wow', 'curious', 'console', 'neutral']

/** Satır and Sütun and every rozet, to try by hand: linked from Profil. */
export function CharacterLab() {
  const navigate = useNavigate()
  const duo = useRef<DuoHandle>(null)
  const [mood, setMood] = useState<Mood>('happy')
  const [shown, setShown] = useState<{ badge: Badge; n: number } | null>(null)
  const text = lab.character
  return (
    <Screen title={text.title} back={() => void navigate({ to: '/me' })} backLabel={lab.back}>
      <p className="dz-footnote lab-char__lead">{text.lead}</p>
      <div className="lab-char__stage">
        <Duo ref={duo} mood="happy" className="lab-char__duo" />
      </div>
      <div className="lab-char__moods">
        {MOODS.map((name) => (
          <Pressable
            key={name}
            className="sh-btn sh-btn--soft lab-char__mood"
            data-on={mood === name || undefined}
            onClick={() => {
              setMood(name)
              duo.current?.react(name)
            }}
          >
            {text.moods[name]}
          </Pressable>
        ))}
      </div>

      <h2 className="dz-section-label">{strings.badges.shelf}</h2>
      <p className="dz-footnote">{text.badgesLead}</p>
      <div className="lab-char__reveal">
        {shown ? (
          <BadgeReveal
            key={`${shown.badge.id}-${shown.n}`}
            badge={shown.badge}
            onClosed={() => duo.current?.react('wow')}
          />
        ) : (
          <p className="dz-footnote">{text.tapBadge}</p>
        )}
      </div>
      <div className="lab-char__grid">
        {BADGES.map((badge) => (
          <Pressable
            key={badge.id}
            className="lab-char__badge"
            aria-label={strings.badges.items[badge.id].name}
            onClick={() => setShown((was) => ({ badge, n: (was?.n ?? 0) + 1 }))}
          >
            <Emblem badge={badge} />
            <span className="lab-char__badge-name">{strings.badges.items[badge.id].name}</span>
          </Pressable>
        ))}
      </div>
    </Screen>
  )
}
