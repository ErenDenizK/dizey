import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Lesson } from '../content/lessons/types'
import { strings } from '../content/strings'
import { engine } from '../engine/driver'
import { stateOf } from '../lesson/state'
import { useLessonRecords } from '../lesson/store'
import { Pressable } from '../ui/Pressable'
import { PeekBody } from './LessonPeek'
import { morphFrom } from './stage'

/** A lesson picked on the path while the window is wide: its card replaces the dock's in the bottom-right slot. */
export type Preview = { lesson: Lesson; tile: HTMLElement }

type Layer = { id: number; preview: Preview; leaving: boolean }

/**
 * The wide screen's version of the lesson peek: the same content component (PeekBody), in the dock's own slot
 * instead of a sheet. Every pick is a layer that fades in over the spring engine while the one before fades out,
 * so a card never changes in a single frame; a "Sıradakine dön" control hands the slot back to the dock.
 */
export function DockPreview({ preview, onBack }: { preview: Preview | null; onBack: () => void }) {
  const [layers, setLayers] = useState<Layer[]>([])
  const counter = useRef(0)

  useEffect(() => {
    setLayers((now) => {
      const fading = now.map((layer) => (layer.leaving ? layer : { ...layer, leaving: true }))
      if (!preview) return fading
      counter.current += 1
      return [...fading, { id: counter.current, preview, leaving: false }]
    })
  }, [preview])

  return (
    <>
      {layers.map((layer) => (
        <PreviewLayer
          key={layer.id}
          layer={layer}
          onBack={onBack}
          onGone={(id) => setLayers((now) => now.filter((l) => l.id !== id))}
        />
      ))}
    </>
  )
}

function PreviewLayer({
  layer,
  onBack,
  onGone,
}: {
  layer: Layer
  onBack: () => void
  onGone: (id: number) => void
}) {
  const root = useRef<HTMLDivElement>(null)
  const records = useLessonRecords()
  const { lesson, tile } = layer.preview

  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    engine.set(el, { opacity: 0 })
    engine.to(el, { opacity: 1 }, 'fade')
  }, [])

  useLayoutEffect(() => {
    const el = root.current
    if (!el || !layer.leaving) return
    engine.to(el, { opacity: 0 }, 'fade', { onArrive: () => onGone(layer.id) })
  }, [layer.leaving, layer.id, onGone])

  return (
    <div ref={root} className="ph-lane ph-preview-lane" inert={layer.leaving || undefined}>
      <Pressable className="ph-back" onClick={onBack} data-testid="dock-back">
        {strings.path.backToNext}
      </Pressable>
      <div
        className="dz-card ph-preview"
        data-state={stateOf(records[lesson.id])}
        data-testid={layer.leaving ? undefined : 'dock-preview'}
      >
        <div className="lp__body">
          <PeekBody
            lesson={lesson}
            onEnter={() => {
              morphFrom.current = tile
            }}
          />
        </div>
      </div>
    </div>
  )
}
