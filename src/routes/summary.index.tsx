import { createFileRoute } from '@tanstack/react-router'
import { SummaryIndex } from '../summary/SummaryIndex'

/** Son tekrar: the formula sheet and every lesson's summary, reached from the exam hub. */
export const Route = createFileRoute('/summary/')({ component: SummaryIndex })
