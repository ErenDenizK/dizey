/** "74:05" from milliseconds, rounded up so the clock never shows 0:00 while time remains. */
export function clock(ms: number): string {
  const total = Math.ceil(ms / 1000)
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
