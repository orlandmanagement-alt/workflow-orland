import { LayoutDashboard, CalendarDays, Wallet, UserCircle, Briefcase, FileText, Bell } from 'lucide-react';

export interface MenuItem {
  path: string;
  label: string;
  icon: React.ElementType;
  badge?: string; // Untuk notifikasi angka
}

export const MENU_ITEMS: MenuItem[] = [
  { path: '/dashboard', label: 'Beranda', icon: LayoutDashboard },
  { path: '/dashboard/projects', label: 'Proyek Aktif', icon: Briefcase },
  { path: '/dashboard/schedules', label: 'Jadwal Saya', icon: CalendarDays },
  { path: '/dashboard/payouts', label: 'Dompet Pendapatan', icon: Wallet },
  { path: '/dashboard/profile', label: 'Comp Card Pro', icon: UserCircle },
  { path: '/dashboard/contracts', label: 'NDA & SPK', icon: FileText, badge: '2' }, // Contoh badge
  { path: '/dashboard/messages', label: 'Kotak Masuk', icon: Bell, badge: '!' },
];
