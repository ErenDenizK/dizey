/**
 * The seam between the new shell and the kept v21 lesson layer. v21 publishes its lesson catalog
 * here at boot and hands control back through `exit` when a lesson closes; the shell never reaches
 * into v21 internals.
 */
export type LessonCatalog = {
  units: readonly { id: string; label: string; lessons: readonly (readonly [code: string, name: string])[] }[]
  /** Lessons that have content, in course order. */
  ready: readonly string[]
  steps: Readonly<Record<string, number>>
}

type Listener = () => void

let catalog: LessonCatalog | null = null
let exitHandler: ((completed: string | null) => void) | null = null
const listeners = new Set<Listener>()

function notify() {
  for (const listener of listeners) listener()
}

export const shellBridge = {
  /** v21 checks this: when true, closing a lesson returns to the shell instead of the v21 map. */
  embedded: true,
  publish(next: LessonCatalog) {
    catalog = next
    notify()
  },
  catalog(): LessonCatalog | null {
    return catalog
  },
  onExit(handler: ((completed: string | null) => void) | null) {
    exitHandler = handler
  },
  /** Called by v21 once the closing lesson has faded out. */
  exit(completed: string | null) {
    exitHandler?.(completed)
    notify()
  },
  /** Progress or catalog changed. */
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  notify,
}
