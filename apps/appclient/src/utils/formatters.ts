// ─────────────────────────────────────────────
// Format Currency IDR
export const formatIDR = (amount: number | null | undefined, compact = false): string => {
  if (amount === null || amount === undefined) return 'Rp —';
  if (compact && Math.abs(amount) >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1)}jt`;
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// ─────────────────────────────────────────────
// Format Date (locale Indonesia)
export const formatDate = (date: string | Date | null | undefined, style: 'short' | 'long' = 'short'): string => {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: style === 'long' ? 'long' : '2-digit',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
};

// ─────────────────────────────────────────────
// Format time ago ("2 jam yang lalu", "3 hari lalu")
export const timeAgo = (date: string | Date | null | undefined): string => {
  if (!date) return '—';
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) return formatDate(date);
  if (days > 0) return `${days} hari lalu`;
  if (hours > 0) return `${hours} jam lalu`;
  if (minutes > 0) return `${minutes} menit lalu`;
  return 'Baru saja';
};

// ─────────────────────────────────────────────
// Generate short random ID
export const generateShortID = (): string => {
  return Math.random().toString(36).substring(2, 9).toUpperCase();
};

// ─────────────────────────────────────────────
// Truncate text
export const truncate = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
};

// ─────────────────────────────────────────────
// Get initials from name
export const getInitials = (name: string | null | undefined): string => {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0]?.toUpperCase() ?? '')
    .join('');
};

// ─────────────────────────────────────────────
// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

// ─────────────────────────────────────────────
// Format phone number Indonesia
export const formatPhone = (phone: string | null | undefined): string => {
  if (!phone) return '—';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('62')) return `+${cleaned}`;
  if (cleaned.startsWith('0')) return `+62${cleaned.slice(1)}`;
  return phone;
};
