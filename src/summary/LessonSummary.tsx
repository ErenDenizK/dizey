import { useCallback, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { strings } from '../content/strings'
import type { Summary } from '../content/summaries'
import { ChevronRight } from '../ui/icons'
import { Pressable } from '../ui/Pressable'
import { Sheet } from '../ui/Sheet'
import { SummaryBody } from './SummaryBody'
import './summary.css'

/**
 * "Bu dersin özeti" at a lesson's end: a quiet row that opens the lesson's one-page summary in a sheet over
 * the end screen, so reading it never replays the lesson.
 */
export function LessonSummary({ title, summary }: { title: string; summary: Summary }) {
  const [host, setHost] = useState<HTMLElement | null>(null)
  const content = useRef<HTMLElement | null>(null)
  const mounted = useCallback((el: HTMLElement | null) => {
    content.current = el?.closest<HTMLElement>('.sh-overlay__content') ?? null
    setHost(el?.closest<HTMLElement>('.sh-overlay') ?? null)
  }, [])
  const [open, setOpen] = useState(false)
  return (
    <div ref={mounted} data-late="">
      <Pressable className="ls-asked" data-testid="lesson-summary-open" onClick={() => setOpen(true)}>
        <span className="ls-asked__main">{strings.summary.lessonRow}</span>
        <ChevronRight />
      </Pressable>
      {host
        ? createPortal(
            <Sheet
              open={open}
              onClose={() => setOpen(false)}
              stage={content}
              label={strings.summary.sheetLabel}
              detent="large"
            >
              <div className="sh-sheet-body sm-sheet" data-testid="lesson-summary-sheet">
                <h2 className="dz-title2 sm-sheet__title">{title}</h2>
                <div className="sm-sheet__scroll">
                  <SummaryBody summary={summary} />
                </div>
              </div>
            </Sheet>,
            host,
          )
        : null}
    </div>
  )
}
