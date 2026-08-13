// File: apps/apptalent/src/lib/profileHelpers.ts
// Helper functions untuk profile builder

/**
 * Konversi Tanggal Lahir ke Usia (dalam tahun)
 */
export const calculateAge = (birthDate: string | Date): number => {
  const today = new Date();
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return Math.max(0, age);
};

/**
 * Format tanggal ke format Indonesia (DD Maret YYYY)
 */
export const formatDateID = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

/**
 * Convert YYYY-MM-DD ke format input date [value]
 */
export const formatDateForInput = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Daftar Kota-Kota Besar Indonesia
 */
export const INDONESIAN_CITIES = [
  { value: 'jakarta', label: 'Jakarta DKI' },
  { value: 'bandung', label: 'Bandung, Jawa Barat' },
  { value: 'semarang', label: 'Semarang, Jawa Tengah' },
  { value: 'yogyakarta', label: 'Yogyakarta' },
  { value: 'surabaya', label: 'Surabaya, Jawa Timur' },
  { value: 'medan', label: 'Medan, Sumatera Utara' },
  { value: 'makassar', label: 'Makassar, Sulawesi Selatan' },
  { value: 'denpasar', label: 'Denpasar, Bali' },
  { value: 'palembang', label: 'Palembang, Sumatera Selatan' },
  { value: 'malang', label: 'Malang, Jawa Timur' },
  { value: 'depok', label: 'Depok, Jawa Barat' },
  { value: 'tangerang', label: 'Tangerang, Banten' },
  { value: 'bekasi', label: 'Bekasi, Jawa Barat' },
  { value: 'bogor', label: 'Bogor, Jawa Barat' },
];

/**
 * Opsi Ukuran (untuk shirt, shoe)
 */
export const SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
export const SHOE_SIZES = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];

/**
 * Opsi Tipe Wajah
 */
export const FACE_TYPES = [
  { value: 'oval', label: 'Oval (Proporsi Ideal)' },
  { value: 'round', label: 'Round (Bulat)' },
  { value: 'square', label: 'Square (Kotak)' },
  { value: 'heart', label: 'Heart (Hati)' },
  { value: 'oblong', label: 'Oblong (Memanjang)' },
  { value: 'diamond', label: 'Diamond (Berlian)' },
];

/**
 * Opsi Warna Kulit
 */
export const SKIN_TONES = [
  { value: 'fair', label: 'Putih/Fair' },
  { value: 'medium', label: 'Sawo Matang/Medium' },
  { value: 'tan', label: 'Coklat/Tan' },
  { value: 'dark', label: 'Gelap/Dark' },
];

/**
 * Opsi Warna Rambut
 */
export const HAIR_COLORS = [
  { value: 'black', label: 'Hitam' },
  { value: 'brown', label: 'Coklat' },
  { value: 'blonde', label: 'Pirang' },
  { value: 'red', label: 'Merah' },
  { value: 'gray', label: 'Abu-abu' },
];

/**
 * Extract YouTube Video ID dari URL
 */
export const extractYouTubeId = (url: string): string | null => {
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?([^\s&]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

/**
 * Check apakah URL adalah Spotify/Soundcloud link
 */
export const getAudioEmbedUrl = (url: string): string | null => {
  if (url.includes('spotify.com')) {
    const trackId = url.split('/').pop()?.split('?')[0];
    if (trackId) return `https://open.spotify.com/embed/track/${trackId}`;
  }
  if (url.includes('soundcloud.com')) {
    return url; // Soundcloud embed bisa langsung dengan API
  }
  return null;
};

/**
 * Validasi URL
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Format CDN URL untuk gambar
 */
export const formatCdnUrl = (path: string): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `https://cdn.orlandmanagement.com/${path}`;
};
