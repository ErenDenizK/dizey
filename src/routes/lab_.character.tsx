import { createFileRoute } from '@tanstack/react-router'
import { CharacterLab } from '../lab/CharacterLab'

/** Satır and Sütun and every rozet, side by side: linked from Profil. */
export const Route = createFileRoute('/lab_/character')({ component: CharacterLab })
