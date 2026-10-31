import { createFileRoute } from '@tanstack/react-router'
import { SoundLab } from '../lab/SoundLab'

/** Every sound in the app, to hear side by side: linked from Ben's sound settings. */
export const Route = createFileRoute('/lab_/sounds')({ component: SoundLab })
