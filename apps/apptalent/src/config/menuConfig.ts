import { LayoutDashboard, Briefcase, CalendarDays, Wallet, ImagePlus, FileSignature, MessageSquare, Sparkles, UserCheck, Video, Headset } from 'lucide-react';

export const MENU_ITEMS = [
  { path: '/dashboard', label: 'Beranda', icon: LayoutDashboard },
  { path: '/jobs/match', label: 'Smart Match AI', icon: Sparkles, badge: 'New' },
  { path: '/projects', label: 'Proyek Aktif', icon: Briefcase },
  { path: '/schedules', label: 'Jadwal Saya', icon: CalendarDays },
  { path: '/audition', label: 'Studio Self-Tape', icon: Video, badge: 'Hot' },
  { path: '/payouts', label: 'Dompet Pendapatan', icon: Wallet },
  { path: '/media', label: 'Comp Card Pro', icon: ImagePlus },
  { path: '/kyc', label: 'Verifikasi KYC', icon: UserCheck },
  { path: '/contracts', label: 'NDA & SPK', icon: FileSignature, badge: '2' },
  { path: '/messages', label: 'Kotak Masuk', icon: MessageSquare, badge: '!' },
  { path: '/help', label: 'VIP Concierge', icon: Headset },
];
