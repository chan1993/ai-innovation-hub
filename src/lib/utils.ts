export function formatDistanceToNow(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks}w ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

export function getTimeFilterDate(period: string): string | null {
  const now = new Date()
  switch (period) {
    case 'today':
      now.setHours(0, 0, 0, 0)
      return now.toISOString()
    case 'week':
      now.setDate(now.getDate() - 7)
      return now.toISOString()
    case 'month':
      now.setMonth(now.getMonth() - 1)
      return now.toISOString()
    default:
      return null
  }
}

// Parses firstname.lastname@zoomrx.com → "Firstname Lastname"
export function parseNameFromEmail(email: string): string {
  const local = email.split('@')[0]
  return local
    .split('.')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}
