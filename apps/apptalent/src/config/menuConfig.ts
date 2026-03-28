import { LayoutDashboard, Briefcase, CalendarDays, Wallet, ImagePlus, FileSignature, MessageSquare, Sparkles, UserCheck } from 'lucide-react';

// Daftar menu ini akan otomatis dirender di DashboardLayout
export const MENU_ITEMS = [
  { path: '/dashboard', label: 'Beranda', icon: LayoutDashboard },
  { path: '/jobs/match', label: 'Smart Match AI', icon: Sparkles, badge: 'New' },
  { path: '/projects', label: 'Proyek Aktif', icon: Briefcase },
  { path: '/schedules', label: 'Jadwal Saya', icon: CalendarDays },
  { path: '/payouts', label: 'Dompet Pendapatan', icon: Wallet },
  { path: '/media', label: 'Comp Card Pro', icon: ImagePlus },
  { path: '/kyc', label: 'Verifikasi KYC', icon: UserCheck },
  { path: '/contracts', label: 'NDA & SPK', icon: FileSignature, badge: '2' },
  { path: '/messages', label: 'Kotak Masuk', icon: MessageSquare, badge: '!' },
];
