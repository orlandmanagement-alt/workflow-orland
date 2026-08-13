/**
 * Admin Helper Functions
 * Utility functions for admin UI and logic
 */

export type UserStatus = 'active' | 'suspended' | 'deleted' | 'pending';
export type UserRole = 'talent' | 'client' | 'admin' | 'agency' | 'super_admin';

export interface UserStatusConfig {
  label: string;
  color: string;
  bgColor: string;
  description: string;
}

export interface UserRoleConfig {
  label: string;
  color: string;
  bgColor: string;
  permissions: string[];
}

/**
 * Status configuration
 */
export const STATUS_CONFIG: Record<UserStatus, UserStatusConfig> = {
  active: {
    label: 'Aktif',
    color: 'text-green-800',
    bgColor: 'bg-green-100',
    description: 'Pengguna aktif dan dapat mengakses platform'
  },
  suspended: {
    label: 'Ditangguhkan',
    color: 'text-yellow-800',
    bgColor: 'bg-yellow-100',
    description: 'Pengguna ditangguhkan sementara'
  },
  deleted: {
    label: 'Dihapus',
    color: 'text-red-800',
    bgColor: 'bg-red-100',
    description: 'Pengguna telah dihapus'
  },
  pending: {
    label: 'Pending',
    color: 'text-blue-800',
    bgColor: 'bg-blue-100',
    description: 'Pengguna dalam proses verifikasi'
  }
};

/**
 * Role configuration
 */
export const ROLE_CONFIG: Record<UserRole, UserRoleConfig> = {
  super_admin: {
    label: 'Super Admin',
    color: 'text-purple-800',
    bgColor: 'bg-purple-100',
    permissions: ['all']
  },
  admin: {
    label: 'Admin',
    color: 'text-indigo-800',
    bgColor: 'bg-indigo-100',
    permissions: ['manage_users', 'verify_talents', 'moderate_projects', 'manage_finance']
  },
  agency: {
    label: 'Agency',
    color: 'text-cyan-800',
    bgColor: 'bg-cyan-100',
    permissions: ['manage_talents', 'apply_projects', 'view_roster']
  },
  talent: {
    label: 'Talent',
    color: 'text-emerald-800',
    bgColor: 'bg-emerald-100',
    permissions: ['manage_profile', 'upload_media', 'view_projects']
  },
  client: {
    label: 'Client',
    color: 'text-sky-800',
    bgColor: 'bg-sky-100',
    permissions: ['create_projects', 'manage_bookings', 'view_talent']
  }
};

/**
 * Get status badge class
 */
export function getStatusBadgeClass(status: UserStatus): string {
  const config = STATUS_CONFIG[status];
  return `${config.bgColor} ${config.color}`;
}

/**
 * Get role badge class
 */
export function getRoleBadgeClass(role: UserRole): string {
  const config = ROLE_CONFIG[role];
  return `${config.bgColor} ${config.color}`;
}

/**
 * Check if user can perform action based on role
 */
export function canUserPerform(role: UserRole, action: string): boolean {
  const config = ROLE_CONFIG[role];
  return config.permissions.includes('all') || config.permissions.includes(action);
}

/**
 * Format date for display
 */
export function formatDate(dateStr: string, locale: string = 'id-ID'): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format datetime for display
 */
export function formatDateTime(dateStr: string, locale: string = 'id-ID'): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
}

/**
 * Get time ago string
 */
export function getTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' tahun lalu';

  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' bulan lalu';

  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' hari lalu';

  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' jam lalu';

  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' menit lalu';

  return Math.floor(seconds) + ' detik lalu';
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Validate phone format (Indonesia)
 */
export function isValidPhone(phone: string): boolean {
  const regex = /^(\+62|0)[0-9]{9,12}$/;
  return regex.test(phone.replace(/\s/g, ''));
}

/**
 * Mask email for display
 */
export function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 3) {
    return email; // Don't mask if too short
  }
  const masked = localPart.substring(0, 3) + '*'.repeat(localPart.length - 3) + '@' + domain;
  return masked;
}

/**
 * Mask phone for display
 */
export function maskPhone(phone: string): string {
  if (phone.length < 8) return phone;
  const visible = phone.slice(0, 4);
  const hidden = '*'.repeat(phone.length - 8);
  const end = phone.slice(-4);
  return visible + hidden + end;
}

/**
 * Get random color from list
 */
export function getAvatarColor(name: string): string {
  const colors = ['bg-red-500', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Export data to CSV
 */
export function exportToCSV(data: any[], filename: string = 'export.csv') {
  const headers = Object.keys(data[0] || {});
  const csv = [
    headers.join(','),
    ...data.map(row =>
      headers
        .map(header => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(',')
    )
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

/**
 * Get random ID
 */
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
}
