import { createRef, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { lab } from '../content/lab'
import { engine, review } from '../engine/driver'
import { ChevronRight, Close, ExamIcon, MeIcon, PathIcon } from '../ui/icons'
import { Morph } from '../ui/Morph'
import { Pressable } from '../ui/Pressable'
import { Push } from '../ui/Push'
import { Screen } from '../ui/Screen'
import { Sheet } from '../ui/Sheet'
import { Switch } from '../ui/Switch'
import { TabBar } from '../ui/TabBar'
import '../ui/ui.css'
import './lab.css'
import { SpringLab } from './SpringLab'
import { TypeSpecimen } from './TypeSpecimen'

type TabId = 'today' | 'map' | 'exam' | 'me'

const TABS = [
  { id: 'today', label: lab.tabs.today, Icon: PathIcon },
  { id: 'map', label: lab.tabs.map, Icon: PathIcon },
  { id: 'exam', label: lab.tabs.exam, Icon: ExamIcon },
  { id: 'me', label: lab.tabs.me, Icon: MeIcon },
] as const

/**
 * The living reference for the motion and visual system: every component and transition from
 * docs/design/ in one place, on real Dizey content, for review on a phone and frame by frame.
 */
export function MotionLab() {
  const [tab, setTab] = useState<TabId>('today')
  const [pushed, setPushed] = useState<{ tab: TabId; node: React.ReactNode; immersive?: boolean } | null>(
    null,
  )
  const [sheet, setSheet] = useState(false)
  const [stageOpen, setStageOpen] = useState(false)
  const [stageMounted, setStageMounted] = useState(false)
  const stage = useRef<HTMLDivElement>(null)
  const roots = useRef({
    today: createRef<HTMLDivElement>(),
    map: createRef<HTMLDivElement>(),
    exam: createRef<HTMLDivElement>(),
    me: createRef<HTMLDivElement>(),
  })
  const panes = useRef<Partial<Record<TabId, HTMLDivElement | null>>>({})
  const card = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    ;(window as unknown as { __dz?: unknown }).__dz = {
      engine,
      review,
      openSheet: () => setSheet(true),
      closeSheet: () => setSheet(false),
      openStage: () => {
        setStageMounted(true)
        setStageOpen(true)
      },
      closeStage: () => setStageOpen(false),
      selectTab: (id: TabId) => setTab(id),
      push: () => openDetail(lab.today.items[0]?.title ?? ''),
      pop: () => setPushed((p) => (p ? { ...p, node: null } : p)),
    }
  })

  // Tabs are peers and switched often: no travel. The incoming pane fades in on top of the outgoing
  // one, which stays visible underneath until the fade lands, so no frame is ever empty.
  const shownTab = useRef<TabId | null>(null)
  useLayoutEffect(() => {
    const previous = shownTab.current
    shownTab.current = tab
    for (const id of Object.keys(panes.current) as TabId[]) {
      const pane = panes.current[id]
      if (!pane) continue
      const active = id === tab
      pane.style.pointerEvents = active ? '' : 'none'
      pane.style.zIndex = active ? '1' : ''
      if (active) {
        pane.style.visibility = ''
        if (previous === null) continue
        engine.set(pane, { opacity: 0 })
        engine.withChannel('chrome', () =>
          engine.to(pane, { opacity: 1 }, 'fade', {
            onArrive: () => {
              const old = previous ? panes.current[previous] : null
              if (old && shownTab.current !== previous) old.style.visibility = 'hidden'
            },
          }),
        )
      } else if (id !== previous) {
        pane.style.visibility = 'hidden'
      }
    }
  }, [tab])

  const openDetail = (title: string) =>
    setPushed({
      tab,
      node: (
        <Screen
          title={title}
          back={() => setPushed((p) => (p ? { ...p, node: null } : p))}
          backLabel={lab.back}
          pushed
        >
          <p className="dz-read">{lab.today.detailBody}</p>
        </Screen>
      ),
    })

  const pushScreen = (node: (back: () => void) => React.ReactNode, immersive = false) => {
    const back = () => setPushed((p) => (p ? { ...p, node: null } : p))
    setPushed({ tab, node: node(back), immersive })
  }

  const hideBar = stageMounted || (pushed?.immersive === true && pushed.node !== null)

  return (
    <div className="dz dz-app">
      <div ref={stage} className="dz-stage">
        {TABS.map(({ id }) => (
          <div
            key={id}
            ref={(el) => {
              panes.current[id] = el
            }}
            className="lab-pane"
          >
            <div ref={roots.current[id]} className="lab-root">
              {id === 'today' && (
                <TodayPane
                  card={card}
                  onOpenStage={() => {
                    setStageMounted(true)
                    setStageOpen(true)
                  }}
                  onOpen={openDetail}
                />
              )}
              {id === 'map' && <MapPane onOpen={() => setSheet(true)} />}
              {id === 'exam' && (
                <ExamPane onStart={() => pushScreen((back) => <Rehearsal close={back} />, true)} />
              )}
              {id === 'me' && (
                <MePane
                  onSprings={() => pushScreen((back) => <SpringLab back={back} />)}
                  onType={() => pushScreen((back) => <TypeSpecimen back={back} />)}
                />
              )}
            </div>
            {pushed?.tab === id && (
              <Push content={pushed.node} under={roots.current[id]} onPopped={() => setPushed(null)} />
            )}
          </div>
        ))}
        <div className="dz-edge-bottom" />
      </div>
      <TabBar tabs={TABS} current={tab} onSelect={setTab} hidden={hideBar} label={lab.tabsLabel} />
      <Sheet open={sheet} onClose={() => setSheet(false)} stage={stage} label={lab.map.sheetTitle}>
        <h2 className="dz-title2">{lab.map.sheetTitle}</h2>
        <p className="dz-read" style={{ marginTop: 'var(--space-3)' }}>
          {lab.map.sheetBody}
        </p>
        <p className="dz-footnote" style={{ marginTop: 'var(--space-3)' }}>
          {lab.map.sheetHint}
        </p>
        <Pressable
          className="dz-button"
          data-kind="primary"
          data-wide=""
          style={{ marginTop: 'var(--space-6)' }}
        >
          {lab.map.sheetAction}
        </Pressable>
      </Sheet>
      <Morph open={stageOpen} from={card} face={<ContinueFace />} onClosed={() => setStageMounted(false)}>
        <LessonStage close={() => setStageOpen(false)} />
      </Morph>
    </div>
  )
}

function ContinueFace() {
  return (
    <div style={{ padding: 'var(--card-pad)' }}>
      <div className="dz-footnote">{lab.today.continueLabel}</div>
      <div className="dz-title3" style={{ marginTop: 'var(--space-1)' }}>
        {lab.today.continueTitle}
      </div>
      <div className="dz-subhead" style={{ marginTop: 'var(--space-1)' }}>
        {lab.today.continueMeta}
      </div>
      <div className="lab-continue-row">
        <MiniMatrix
          rows={[
            [2, 1, 0],
            [0, 3, 1],
            [1, 0, 4],
          ]}
          highlight={1}
        />
        <span className="lab-continue-action">{lab.today.continueAction}</span>
      </div>
    </div>
  )
}

function TodayPane({
  card,
  onOpenStage,
  onOpen,
}: {
  card: React.RefObject<HTMLButtonElement | null>
  onOpenStage: () => void
  onOpen: (title: string) => void
}) {
  return (
    <Screen title={lab.tabs.today}>
      <Pressable ref={card} className="dz-card lab-continue" style={{ padding: 0 }} onClick={onOpenStage}>
        <ContinueFace />
      </Pressable>
      <div className="dz-section-label">{lab.today.nextLabel}</div>
      <div className="dz-list">
        {lab.today.items.map((item) => (
          <Pressable key={item.title} className="dz-row" onClick={() => onOpen(item.title)}>
            <span className="dz-row-main">
              <span className="dz-headline" style={{ display: 'block' }}>
                {item.title}
              </span>
              <span className="dz-subhead">{item.meta}</span>
            </span>
            <ChevronRight />
          </Pressable>
        ))}
      </div>
    </Screen>
  )
}

function MapPane({ onOpen }: { onOpen: () => void }) {
  return (
    <Screen title={lab.tabs.map}>
      {lab.map.groups.map((group, g) => (
        <section key={group.title}>
          <div className="dz-section-label" style={g === 0 ? { marginTop: 0 } : undefined}>
            {group.title}
          </div>
          <div className="dz-list">
            {group.items.map((item, i) => (
              <Pressable key={item} className="dz-row" onClick={onOpen}>
                <MasteryGlyph level={(g * 3 + i) % 4} />
                <span className="dz-row-main dz-headline" style={{ fontWeight: 'var(--weight-medium)' }}>
                  {item}
                </span>
                <ChevronRight />
              </Pressable>
            ))}
          </div>
        </section>
      ))}
    </Screen>
  )
}

function ExamPane({ onStart }: { onStart: () => void }) {
  return (
    <Screen title={lab.tabs.exam}>
      <div className="dz-card">
        <div className="dz-title3">{lab.exam.title}</div>
        <div className="dz-subhead" style={{ marginTop: 'var(--space-1)' }}>
          {lab.exam.meta}
        </div>
        <Pressable
          className="dz-button"
          data-kind="primary"
          data-wide=""
          style={{ marginTop: 'var(--space-5)' }}
          onClick={onStart}
        >
          {lab.exam.start}
        </Pressable>
      </div>
      <div className="dz-section-label">{lab.exam.past}</div>
      <div className="dz-list">
        {lab.exam.pastItems.map((item) => (
          <Pressable key={item} className="dz-row">
            <span className="dz-row-main dz-headline" style={{ fontWeight: 'var(--weight-medium)' }}>
              {item}
            </span>
            <ChevronRight />
          </Pressable>
        ))}
      </div>
    </Screen>
  )
}

function MePane({ onSprings, onType }: { onSprings: () => void; onType: () => void }) {
  const [sound, setSound] = useState(false)
  const [dark, setDark] = useState(() => {
    if (typeof document === 'undefined') return false
    const set = document.documentElement.dataset.theme
    return set ? set === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const [reduce, setReduce] = useState(engine.reducedMotion)
  return (
    <Screen title={lab.tabs.me}>
      <div className="dz-section-label" style={{ marginTop: 0 }}>
        {lab.me.settings}
      </div>
      <div className="dz-list">
        <div className="dz-row">
          <span className="dz-row-main dz-headline" style={{ fontWeight: 'var(--weight-medium)' }}>
            {lab.me.sound}
          </span>
          <Switch checked={sound} onChange={setSound} label={lab.me.sound} />
        </div>
        <div className="dz-row">
          <span className="dz-row-main dz-headline" style={{ fontWeight: 'var(--weight-medium)' }}>
            {lab.me.dark}
          </span>
          <Switch
            checked={dark}
            onChange={(on) => {
              setDark(on)
              document.documentElement.dataset.theme = on ? 'dark' : 'light'
            }}
            label={lab.me.dark}
          />
        </div>
        <div className="dz-row">
          <span className="dz-row-main dz-headline" style={{ fontWeight: 'var(--weight-medium)' }}>
            {lab.me.reduce}
          </span>
          <Switch
            checked={reduce}
            onChange={(on) => {
              setReduce(on)
              engine.reducedMotion = on
            }}
            label={lab.me.reduce}
          />
        </div>
      </div>
      <div className="dz-list" style={{ marginTop: 'var(--group-gap)' }}>
        <Pressable className="dz-row" onClick={onSprings}>
          <span className="dz-row-main dz-headline" style={{ fontWeight: 'var(--weight-medium)' }}>
            {lab.me.springs}
          </span>
          <ChevronRight />
        </Pressable>
        <Pressable className="dz-row" onClick={onType}>
          <span className="dz-row-main dz-headline" style={{ fontWeight: 'var(--weight-medium)' }}>
            {lab.me.type}
          </span>
          <ChevronRight />
        </Pressable>
      </div>
    </Screen>
  )
}

function LessonStage({ close }: { close: () => void }) {
  return (
    <div className="lab-stage">
      <div className="lab-stage-top">
        <Pressable className="dz-icon-button" onClick={close} aria-label={lab.close}>
          <Close />
        </Pressable>
        <div className="lab-progress" aria-hidden="true">
          <span style={{ width: '37.5%' }} />
        </div>
      </div>
      <h2 className="dz-title2" style={{ marginTop: 'var(--space-6)' }}>
        {lab.today.stageTitle}
      </h2>
      <div className="lab-stage-matrix">
        <MiniMatrix
          rows={[
            [2, 1, 0],
            [0, 3, 1],
            [1, 0, 4],
          ]}
          highlight={1}
          large
        />
      </div>
      <p className="dz-read">{lab.today.stageBody}</p>
      <div className="lab-stage-dock">
        <Pressable className="dz-button" data-kind="primary" data-wide="">
          {lab.today.stageAction}
        </Pressable>
      </div>
    </div>
  )
}

function Rehearsal({ close }: { close: () => void }) {
  return (
    <div className="lab-stage" style={{ background: 'var(--bg)' }}>
      <div className="lab-stage-top">
        <Pressable className="dz-icon-button" onClick={close} aria-label={lab.close}>
          <Close />
        </Pressable>
        <span className="dz-subhead num">1 / 18</span>
      </div>
      <h2 className="dz-title2" style={{ marginTop: 'var(--space-6)' }}>
        {lab.exam.title}
      </h2>
      <p className="dz-read dz-subhead" style={{ marginTop: 'var(--space-2)' }}>
        {lab.exam.meta}
      </p>
    </div>
  )
}

function MiniMatrix({ rows, highlight, large }: { rows: number[][]; highlight?: number; large?: boolean }) {
  return (
    <span
      className={`lab-matrix num${large ? ' lab-matrix-large' : ''}`}
      role="img"
      aria-label="3'e 3 matris"
    >
      {rows.map((row, r) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: a matrix row is identified by its position.
        <span key={r} className="lab-matrix-row" data-row={r === highlight || undefined}>
          {row.map((n, c) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: a matrix cell is identified by its position.
            <span key={c}>{n}</span>
          ))}
        </span>
      ))}
    </span>
  )
}

/** Mastery as a 2 x 2 glyph that fills along the diagonal; shape carries the state, not colour. */
function MasteryGlyph({ level }: { level: number }) {
  const cells = [
    [0, 0],
    [1, 1],
    [0, 1],
    [1, 0],
  ]
  return (
    <svg viewBox="0 0 22 22" width="22" height="22" aria-hidden="true" className="lab-glyph">
      {cells.map(([x, y], i) => (
        <rect
          key={`${x}${y}`}
          x={2 + (x ?? 0) * 10}
          y={2 + (y ?? 0) * 10}
          width="8"
          height="8"
          rx="2.2"
          fill={i < level ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.3"
        />
      ))}
    </svg>
  )
}
