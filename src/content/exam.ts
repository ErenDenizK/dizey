/**
 * Vize 1 timing. Eren (2026-10-30): exam week starts around 15 November; the linear algebra date
 * itself is not announced (likely 18 to 20 November). The countdown targets the start of exam week.
 */
export const examWeek = { iso: '2026-11-15', label: '15 Kasım' } as const

/** Whole days from `today` (local) until `iso`; 0 on the day itself, negative after it. */
export function daysUntil(iso: string, today: Date): number {
  const [year, month, day] = iso.split('-').map(Number)
  const target = Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1)
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((target - now) / 86_400_000)
}

const months = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
]

/** "2026-11-19" → "19 Kasım". */
export function dayLabel(iso: string): string {
  const [, month, day] = iso.split('-').map(Number)
  return `${day} ${months[(month ?? 1) - 1]}`
}
