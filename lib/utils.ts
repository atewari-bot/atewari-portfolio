/**
 * Shared client/server utility functions.
 */

/**
 * Returns a human-readable relative time string for a given ISO timestamp.
 * e.g. "just now", "5m ago", "3h ago", "2d ago", "Mar 13"
 */
export function relativeTime(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
