// Utility Helpers
// File: apps/appagency/src/lib/helpers.ts

/**
 * Format number as Indonesian Rupiah currency
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format date to readable format
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: Date | string): string => {
  const now = new Date()
  const d = typeof date === 'string' ? new Date(date) : date
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (seconds < 60) return 'Baru saja'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} menit lalu`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam lalu`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} hari lalu`

  return formatDate(d)
}

/**
 * Truncate text to specific length
 */
export const truncateText = (text: string, length: number): string => {
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

/**
 * Get initials from name
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

/**
 * Get status badge color
 */
export const getStatusColor = (
  status: string,
): 'blue' | 'green' | 'yellow' | 'red' | 'slate' => {
  const colorMap: Record<string, 'blue' | 'green' | 'yellow' | 'red' | 'slate'> = {
    active: 'green',
    pending_review: 'yellow',
    draft: 'slate',
    archived: 'red',
    new: 'blue',
    replied: 'green',
    negotiating: 'yellow',
    declined: 'red',
    accepted: 'green',
  }
  return colorMap[status] || 'slate'
}

/**
 * Get status label in Indonesian
 */
export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    active: 'Aktif',
    pending_review: 'Pending Review',
    draft: 'Draft',
    archived: 'Archived',
    new: 'Baru',
    replied: 'Replied',
    negotiating: 'Negotiating',
    declined: 'Declined',
    accepted: 'Accepted',
  }
  return labels[status] || status
}

/**
 * Calculate commission based on amount and percentage
 */
export const calculateCommission = (amount: number, percentage: number = 15): number => {
  return (amount * percentage) / 100
}

/**
 * Generate random ID
 */
export const generateId = (prefix: string = ''): string => {
  return prefix + Math.random().toString(36).substring(2, 11)
}
