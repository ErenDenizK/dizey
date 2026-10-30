import { createFileRoute } from '@tanstack/react-router'
import { MotionLab } from '../lab/MotionLab'

/** The motion and visual system lab: a living reference, not part of the student's app. */
export const Route = createFileRoute('/lab')({ component: MotionLab })
