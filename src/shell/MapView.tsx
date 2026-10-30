import { useState } from 'react'
import { strings } from '../content/strings'
import { Glyph } from './Glyph'
import { LessonSheet } from './LessonSheet'
import { lessonState } from './progress'
import { useShell } from './store'

export function MapView() {
  const { catalog, done, resume } = useShell()
  const [sheet, setSheet] = useState<string | null>(null)

  return (
    <div className="sh-view">
      <header>
        <h1 className="sh-title">{strings.map.title}</h1>
        <p className="sh-sub">{strings.map.subtitle}</p>
      </header>
      {!catalog ? (
        <p className="sh-sub">{strings.loading}</p>
      ) : (
        <>
          <ul className="sh-legend" aria-label="Durumlar">
            {(['new', 'done', 'soon'] as const).map((state) => (
              <li key={state}>
                <Glyph state={state} />
                {strings.map.state[state]}
              </li>
            ))}
          </ul>
          {catalog.units.map((unit) => {
            const ready = unit.lessons.filter(([code]) => catalog.ready.includes(code))
            const finished = ready.filter(([code]) => done[code]).length
            return (
              <section key={unit.id} aria-labelledby={`unit-${unit.id}`}>
                <div className="sh-group-head">
                  <h2 id={`unit-${unit.id}`}>{unit.label}</h2>
                  <span>{strings.map.unitProgress(finished, ready.length)}</span>
                </div>
                <div className="sh-card sh-nodes">
                  {unit.lessons.map(([code, name]) => {
                    const state = lessonState(code, catalog, done, resume)
                    return (
                      <button
                        key={code}
                        type="button"
                        className="sh-node"
                        data-state={state}
                        disabled={state === 'soon'}
                        onClick={() => setSheet(code)}
                      >
                        <Glyph state={state} />
                        <span className="sh-node__id">{code}</span>
                        <span className="sh-node__nm">{name}</span>
                        <span className="sh-node__st">{strings.map.state[state]}</span>
                      </button>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </>
      )}
      <LessonSheet code={sheet} onClose={() => setSheet(null)} />
    </div>
  )
}
