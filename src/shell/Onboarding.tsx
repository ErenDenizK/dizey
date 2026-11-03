import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { flight } from '../character/flight'
import { Mirtis, type MirtisHandle } from '../character/Mirtis'
import { strings } from '../content/strings'
import { engine } from '../engine/driver'
import { saveName } from '../progress/profile-store'
import { readSettings, saveSettings } from '../progress/settings'
import { holdMusic, playSound } from '../sound/player'
import { Pressable } from '../ui/Pressable'
import { useSizeClass } from '../ui/size-class'
import { HelloBeat, InstallBeat, TasteBeat, WakeBeat, YouBeat } from './onboarding/beats'
import { armFirstStop } from './onboarding/first-stop'
import { needsInstall, shouldShowOnboarding } from './onboarding/gate'
import { type BeatProps, type Ctx, Dots, useReveal } from './onboarding/parts'
import { markOnboardingDone } from './onboarding-state'
import './onboarding/onboarding.css'

/**
 * The first-run scene (about 30 s, four taps): Mırtis wakes, says hello, shows what a matrix is with one question, asks
 * for a name and the exam day, and then flies to her place on Yol. It sits over the shell; the music stays quiet until
 * she has landed. A learner who already has progress never sees it (gate.ts).
 *
 * One cat lives in the scene and glides between each beat's slot (an engine spring on x, y and scale), so she is never
 * twice on screen; the hand-off is flight.ts's `intro` spot flying to the dock.
 */

type Beat = 'install' | 'wake' | 'hello' | 'taste' | 'you'
const STORY = ['wake', 'hello', 'taste', 'you'] as const
const BEATS: Record<Beat, (props: BeatProps) => React.ReactNode> = {
  install: InstallBeat,
  wake: WakeBeat,
  hello: HelloBeat,
  taste: TasteBeat,
  you: YouBeat,
}
type Layer = { id: number; beat: Beat; out: boolean }

/** The cat's layout width; the slot of each beat scales her from this. */
const CAT_W = 160
const CHANNEL = 'onboarding'

export function Onboarding() {
  const [start] = useState<Beat | null>(() =>
    shouldShowOnboarding() ? (needsInstall() ? 'install' : 'wake') : null,
  )
  return start ? <Scene start={start} /> : null
}

function Scene({ start }: { start: Beat }) {
  const root = useRef<HTMLDivElement>(null)
  const catBox = useRef<HTMLDivElement>(null)
  const cat = useRef<MirtisHandle>(null)
  const slot = useRef<HTMLElement | null>(null)
  const placed = useRef(false)
  const ended = useRef(false)
  const musicHeld = useRef(false)
  const draft = useRef({ name: '', date: '' })
  const ids = useRef(2)
  const wide = useSizeClass() !== 'compact'
  const [layers, setLayers] = useState<Layer[]>(() => [{ id: 1, beat: start, out: false }])
  const [gone, setGone] = useState(false)
  const beat = layers.find((layer) => !layer.out)?.beat ?? start
  const beatRef = useRef(beat)
  beatRef.current = beat

  const later = useCallback((ms: number, fn: () => void) => {
    engine.withChannel(CHANNEL, () => engine.after(ms, fn))
  }, [])

  /** Glides the cat to her slot (or sets her there on the first placement and when the page itself moved). */
  const sync = useCallback((instant: boolean) => {
    const box = catBox.current
    const el = slot.current
    const host = root.current
    if (!box || !el?.isConnected || !host || ended.current) return
    const s = el.getBoundingClientRect()
    const h = host.getBoundingClientRect()
    if (s.width < 1) return
    const to = { x: s.left - h.left, y: s.top - h.top, scale: s.width / CAT_W }
    if (instant || !placed.current) engine.set(box, to)
    else
      engine.withChannel('onboarding-cat', () => engine.to(box, to, 'page', { effect: engine.reducedMotion }))
    placed.current = true
  }, [])

  const place = useCallback(
    (el: HTMLElement | null) => {
      slot.current = el
      sync(false)
    },
    [sync],
  )

  // The cat comes in softly (she is the one thing that is there from the first frame), the music is held.
  // biome-ignore lint/correctness/useExhaustiveDependencies: mount only
  useLayoutEffect(() => {
    const box = catBox.current
    if (box) {
      engine.set(box, { opacity: 0 })
      later(start === 'wake' ? 560 : 300, () => engine.to(box, { opacity: 1 }, 'enter'))
    }
    holdMusic(true)
    musicHeld.current = true
    root.current?.focus({ preventScroll: true })
    return () => {
      engine.cancelCues(CHANNEL)
      if (musicHeld.current) holdMusic(false)
    }
  }, [])

  const releaseMusic = useCallback(() => {
    if (!musicHeld.current) return
    musicHeld.current = false
    holdMusic(false)
  }, [])

  // The cat follows her slot when the page changes shape (a rotation, the keyboard) or scrolls.
  useEffect(() => {
    const host = root.current
    if (!host) return
    const observer = new ResizeObserver(() => sync(false))
    observer.observe(host)
    const view = window.visualViewport
    const fitView = () => {
      if (!view) return
      const keyboard = window.innerHeight - view.height > 120
      host.toggleAttribute('data-keyboard', keyboard)
      host.toggleAttribute('data-tight', view.height < 620)
      host.style.setProperty('--onb-h', `${view.height}px`)
      host.style.setProperty('--onb-top', `${view.offsetTop}px`)
      sync(false)
    }
    fitView()
    view?.addEventListener('resize', fitView)
    view?.addEventListener('scroll', fitView)
    return () => {
      observer.disconnect()
      view?.removeEventListener('resize', fitView)
      view?.removeEventListener('scroll', fitView)
    }
  }, [sync])

  const go = useCallback((to: Beat) => {
    setLayers((now) => [
      ...now.map((layer) => ({ ...layer, out: true })),
      { id: ids.current++, beat: to, out: false },
    ])
    if (to === 'wake') cat.current?.react('sleep')
  }, [])

  /** The beat `from` asks for the next one; a second tap on a beat that has already gone on does nothing. */
  const next = useCallback(
    (from: Beat) => {
      if (ended.current || beatRef.current !== from) return
      const at = STORY.indexOf(from as (typeof STORY)[number])
      const to = from === 'install' ? 'wake' : STORY[at + 1]
      if (!to) return
      beatRef.current = to
      go(to)
    },
    [go],
  )

  /** What the learner typed is saved on the way out, skipped or not. */
  const commit = useCallback(() => {
    const { name, date } = draft.current
    if (name.trim()) saveName(name)
    if (date) saveSettings({ ...readSettings(), examDate: date })
  }, [])

  /** The whole scene dissolves into Yol, which is already there underneath. */
  const dissolve = useCallback((done?: () => void) => {
    const host = root.current
    if (!host) return
    host.inert = true
    host.style.pointerEvents = 'none'
    engine.withChannel('onboarding-leave', () => {
      // The words go first and quickly; the paper dissolves into Yol a little more slowly.
      for (const part of host.querySelectorAll<HTMLElement>(':scope > .onb-stage, :scope > .onb-top'))
        engine.to(part, { opacity: 0 }, 'leave')
      engine.to(host, { opacity: 0 }, 'draw', {
        effect: true,
        onArrive: () => {
          done?.()
          setGone(true)
        },
      })
    })
  }, [])

  const skip = useCallback(() => {
    if (ended.current || beatRef.current === 'install' || beatRef.current === 'wake') return
    ended.current = true
    commit()
    markOnboardingDone()
    dissolve(releaseMusic)
  }, [commit, dissolve, releaseMusic])

  const finish = useCallback(() => {
    if (ended.current) return
    ended.current = true
    commit()
    markOnboardingDone()
    // She takes off from here and lands on the dock card; refused (no dock to land on, reduced motion's own
    // crossfade aside) she simply stays and dissolves with the scene.
    const landed =
      flight.depart('intro') &&
      flight.land('dock', 'happy', () => {
        playSound('seal')
        armFirstStop()
        releaseMusic()
      })
    dissolve(() => {
      if (landed) return
      armFirstStop()
      releaseMusic()
    })
  }, [commit, dissolve, releaseMusic])

  // Escape leaves the story (everywhere past the first two beats).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') skip()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [skip])

  const ctx: Ctx = {
    place,
    cat,
    catSvg: () => catBox.current?.querySelector('svg.mirtis') ?? null,
    later,
    next: () => undefined,
    skip,
    finish,
    draft,
  }

  if (gone) return null
  const step = STORY.indexOf(beat as (typeof STORY)[number])
  const skippable = beat === 'hello' || beat === 'taste' || beat === 'you'
  return (
    <div
      ref={root}
      className="sh-onb"
      role="dialog"
      aria-modal="true"
      aria-label={strings.onboarding.dialog}
      tabIndex={-1}
      onScrollCapture={() => sync(true)}
      data-beat={beat}
      onPointerDown={(event) => {
        if (
          wide &&
          skippable &&
          (event.target === event.currentTarget || (event.target as Element).classList.contains('onb-stage'))
        )
          skip()
      }}
    >
      <div className="onb-paper" aria-hidden="true" />
      <div className="onb-cat" ref={catBox} aria-hidden="true">
        <Mirtis ref={cat} size="hero" mood={start === 'wake' ? 'sleep' : 'rest'} anchor="intro" />
      </div>
      <div className="onb-stage">
        {layers.map((layer) => {
          const View = BEATS[layer.beat]
          return (
            <View
              key={layer.id}
              ctx={{ ...ctx, next: () => next(layer.beat) }}
              out={layer.out}
              onGone={() => setLayers((now) => now.filter((l) => l.id !== layer.id))}
            />
          )
        })}
      </div>
      <header className="onb-top">
        <span className="onb-top__side" />
        <Dots count={STORY.length} at={Math.max(0, step)} hidden={beat === 'install'} />
        <span className="onb-top__side onb-top__side--end">
          <SkipButton shown={skippable} onSkip={skip} />
        </span>
      </header>
    </div>
  )
}

function SkipButton({ shown, onSkip }: { shown: boolean; onSkip: () => void }) {
  const ref = useRef<HTMLButtonElement>(null)
  useReveal(ref, shown)
  return (
    <Pressable ref={ref} className="onb-skip" onClick={onSkip}>
      {strings.onboarding.skipAll}
    </Pressable>
  )
}
