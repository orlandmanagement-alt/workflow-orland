import { 
  LayoutDashboard, Users, Video, Calendar, Trello, 
  FileText, Briefcase, Settings, Target, Shield,
  ClipboardList, Workflow
} from 'lucide-react';
import { CompanyCategory } from '../store/useAppStore';

export interface MenuItem {
  title: string;
  path: string;
  icon: any;
  requiredRoles?: CompanyCategory[];
  group?: 'core' | 'workspace' | 'system';
}

const ALL_MENUS: MenuItem[] = [
  // --- CORE B2B ---
  { title: 'Command Center', path: '/dashboard', icon: LayoutDashboard, group: 'core' },
  { title: 'Roster / Talent Search', path: '/dashboard/talents', icon: Users, group: 'core' },
  { title: 'Projects', path: '/dashboard/projects', icon: Briefcase, group: 'core' },
  { title: 'Finance', path: '/dashboard/finance', icon: FileText, group: 'core' },
  
  // --- WORKSPACE (DYNAMIC) ---
  // PH Workspace
  { title: 'Live Casting Board', path: '/dashboard/casting', icon: Video, requiredRoles: ['PH'], group: 'workspace' },
  { title: 'Scripts & Call Sheets', path: '/dashboard/tools/ph/scripts', icon: ClipboardList, requiredRoles: ['PH'], group: 'workspace' },
  // EO Workspace
  { title: 'Event Staffing', path: '/dashboard/staffing', icon: Users, requiredRoles: ['EO'], group: 'workspace' },
  { title: 'Riders & Gantt Chart', path: '/dashboard/tools/eo/riders', icon: Calendar, requiredRoles: ['EO'], group: 'workspace' },
  { title: 'Rundown Manager', path: '/dashboard/tools/wo/rundown', icon: Workflow, requiredRoles: ['EO'], group: 'workspace' },
  // KOL Workspace
  { title: 'Brief Builder', path: '/dashboard/tools/kol/brief-builder', icon: Target, requiredRoles: ['KOL', 'BRAND'], group: 'workspace' },
  { title: 'Content Pipeline', path: '/dashboard/tools/kol/drafts', icon: Trello, requiredRoles: ['KOL'], group: 'workspace' },
  // Brand Workspace
  { title: 'Brand Safety Check', path: '/dashboard/tools/brand/safety', icon: Shield, requiredRoles: ['BRAND'], group: 'workspace' },
  
  // --- SYSTEM ---
  { title: 'Settings', path: '/dashboard/settings', icon: Settings, group: 'system' }
];

export const getMenuItems = (category: CompanyCategory): MenuItem[] => {
  return ALL_MENUS.filter(menu => {
    if (!menu.requiredRoles) return true;
    return category && menu.requiredRoles.includes(category);
  });
};
