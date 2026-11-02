import type { DuoHandle } from '../character/Duo'
import type { Mood } from '../character/rig'

/** Where a screen wants the duo. Names in use: today, me, lesson (top bar), end (lesson end hero). */
export type AnchorSize = 'small' | 'medium' | 'large' | 'lesson' | 'hero'

export type AnchorMood = Mood | 'keep'

export type Anchor = {
  id: string
  name: string
  size: AnchorSize
  el: HTMLElement
  /** The expression posed on arrival; `keep` leaves whatever the duo wears. */
  mood: AnchorMood
  alive: boolean
  /** Where the eyes glance on arrival (face units), toward the screen's content. */
  look: [number, number]
}

export type RouteContext = {
  tab: '/' | '/me'
  /** A route above the tabs (a lesson, a sheet). */
  overlay: boolean
  present: 'sheet' | 'push'
}

/** The anchors a route would take, best first. A sheet keeps the tab behind it; a full-screen route takes the lesson's. */
export function wantedNames(ctx: RouteContext): string[] {
  if (ctx.overlay && ctx.present === 'push') return ['end', 'lesson']
  if (ctx.tab === '/') return ['today']
  if (ctx.tab === '/me') return ['me']
  return []
}

/** The first wanted name that has a live anchor (the latest registered wins among equals). */
export function pickAnchor(anchors: Iterable<Anchor>, wanted: readonly string[]): Anchor | null {
  const live = [...anchors].filter((anchor) => anchor.el.isConnected)
  for (const name of wanted) {
    const found = live.findLast((anchor) => anchor.name === name)
    if (found) return found
  }
  return null
}

type Command = (handle: DuoHandle) => void

/** A command that arrived for an anchor that was not active yet: replayed when the duo has landed there. */
const PENDING_MAX = 6

export class AnchorRegistry {
  private readonly items = new Map<string, Anchor>()
  private readonly listeners = new Set<() => void>()
  private readonly pending = new Map<string, Command[]>()
  active: Anchor | null = null
  /** True from the moment the duo sets off until it lands: a screen's commands wait for the landing. */
  traveling = false

  all(): Anchor[] {
    return [...this.items.values()]
  }

  register(anchor: Anchor): () => void {
    this.items.set(anchor.id, anchor)
    this.emit()
    return () => {
      if (this.items.get(anchor.id) !== anchor) return
      this.items.delete(anchor.id)
      this.pending.delete(anchor.id)
      if (this.active?.id === anchor.id) this.active = null
      this.emit()
    }
  }

  update(id: string, patch: Partial<Pick<Anchor, 'mood' | 'alive' | 'look' | 'size'>>): void {
    const anchor = this.items.get(id)
    if (!anchor) return
    let changed = false
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || anchor[key as keyof typeof patch] === value) continue
      ;(anchor as Record<string, unknown>)[key] = value
      changed = true
    }
    if (changed) this.emit()
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private emit(): void {
    for (const fn of [...this.listeners]) fn()
  }

  /** Runs a command for an anchor now when it is the active one, otherwise keeps it for its arrival. */
  command(id: string, run: Command, handle: DuoHandle | null): void {
    if (this.active?.id === id && handle && !this.traveling) {
      run(handle)
      return
    }
    const queue = [...(this.pending.get(id) ?? []), run]
    this.pending.set(id, queue.slice(-PENDING_MAX))
  }

  /** The commands that waited for this anchor, in order (they are removed). */
  takePending(id: string): Command[] {
    const queue = this.pending.get(id) ?? []
    this.pending.delete(id)
    return queue
  }
}

export const registry = new AnchorRegistry()

/** The layer's handle and box, set while the layer is mounted. */
export const companion: { handle: DuoHandle | null; box: HTMLElement | null } = { handle: null, box: null }

/** One reaction per window: the gate lets a call through only when the last one is old enough. */
export function reactionGate(windowMs: number, clock: () => number = () => performance.now()) {
  let last = Number.NEGATIVE_INFINITY
  return () => {
    const now = clock()
    if (now - last < windowMs) return false
    last = now
    return true
  }
}

export const REACT_EVERY_MS = 1500
const gate = reactionGate(REACT_EVERY_MS)

/**
 * The lesson's reaction at an answer moment, at most one per 1.5 s. Goes to the duo wherever it is (on its way
 * to the lesson's top bar too).
 */
export function reactCompanion(mood: Mood): void {
  if (!companion.handle || !gate()) return
  companion.handle.react(mood)
}

/** The element that wears the duo's glow (`--glow`): the layer's box, or null when no layer is mounted. */
export function glowTarget(): HTMLElement | null {
  return companion.box
}
