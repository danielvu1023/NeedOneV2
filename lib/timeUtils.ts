/** Returns a compact duration string like "5m", "1h 20m", "2h" */
export function formatCheckInDuration(checkedInAt: string): string {
  const minutes = Math.floor((Date.now() - new Date(checkedInAt).getTime()) / 60_000)
  if (minutes < 1) return 'Just arrived'
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}
