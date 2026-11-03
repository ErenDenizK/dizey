import { createFileRoute } from '@tanstack/react-router'
import { FormulaPage } from '../summary/FormulaPage'

/** Formül kağıdı: every Vize 1 formula on one page. */
export const Route = createFileRoute('/summary/formulas')({ component: FormulaPage })
