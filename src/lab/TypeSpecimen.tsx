import { lab } from '../content/lab'
import { Screen } from '../ui/Screen'

/** The type scale and the meaning colours, on both themes, for review. */
export function TypeSpecimen({ back }: { back: () => void }) {
  const t = lab.type
  return (
    <Screen title={t.title} back={back} backLabel={lab.back} pushed>
      <div className="dz-card" style={{ display: 'grid', gap: 'var(--space-3)' }}>
        <div className="dz-large-title" style={{ margin: 0 }}>
          {t.large}
        </div>
        <div className="dz-title2" style={{ fontSize: 'var(--type-title1)' }}>
          {t.title1}
        </div>
        <div className="dz-title2">{t.title2}</div>
        <div className="dz-title3">{t.title3}</div>
        <p className="dz-read">{t.body}</p>
        <div className="dz-subhead">{t.subhead}</div>
        <div className="dz-footnote">{t.footnote}</div>
      </div>
      <div className="dz-section-label">{t.roles}</div>
      <div className="lab-roles">
        {(['ok', 'bad', 'row', 'col'] as const).map((role) => (
          <div
            key={role}
            className="lab-role"
            style={{ background: `var(--${role}-tint)`, color: `var(--${role}-ink)` }}
          >
            <span className="lab-role-swatch" style={{ background: `var(--${role}-fill)` }} />
            {t[role]}
          </div>
        ))}
      </div>
    </Screen>
  )
}
