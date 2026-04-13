import { 
  LayoutDashboard, Users, Video, Calendar, Trello, 
  FileText, Briefcase, Settings, Target, Shield,
  ClipboardList, Workflow, Wrench, Users2
} from 'lucide-react';
import { CompanyCategory } from '../store/useAppStore';

export interface MenuItem {
  title: string;
  path: string;
  icon: any;
  requiredRoles?: CompanyCategory[];
  group?: 'core' | 'workspace' | 'system' | 'team' | 'tools';
}

const ALL_MENUS: MenuItem[] = [
  // --- CORE B2B ---
  { title: 'Command Center', path: '/dashboard', icon: LayoutDashboard, group: 'core' },
  { title: 'Roster / Talent Search', path: '/dashboard/talents', icon: Users, group: 'core' },
  { title: 'Projects', path: '/dashboard/projects', icon: Briefcase, group: 'core' },
  { title: 'Finance', path: '/dashboard/finance', icon: FileText, group: 'core' },
  
  // --- TEAM MANAGEMENT (NEW) ---
  { title: 'Team', path: '/dashboard/team', icon: Users2, group: 'team' },
  
  // --- PRODUCTION TOOLS (NEW - Grouped) ---
  { title: 'Production Tools', path: '/dashboard/tools', icon: Wrench, group: 'tools' },
  
  // Sub-tools for PH
  { title: 'Call Sheets', path: '/dashboard/tools/ph/scripts', icon: ClipboardList, requiredRoles: ['PH'], group: 'tools' },
  { title: 'Script Breakdown', path: '/dashboard/tools/ph/scripts', icon: ClipboardList, requiredRoles: ['PH'], group: 'tools' },
  { title: 'Talent Budgeting', path: '/dashboard/tools/ph/talent-budgeting', icon: Wrench, requiredRoles: ['PH'], group: 'tools' },
  
  // Sub-tools for EO
  { title: 'Riders', path: '/dashboard/tools/eo/riders', icon: Calendar, requiredRoles: ['EO'], group: 'tools' },
  { title: 'Guest Management', path: '/dashboard/tools/eo/guest-management', icon: Users, requiredRoles: ['EO'], group: 'tools' },
  { title: 'Rundown Manager', path: '/dashboard/tools/wo/rundown', icon: Workflow, requiredRoles: ['EO'], group: 'tools' },
  
  // Sub-tools for KOL
  { title: 'Brief Builder', path: '/dashboard/tools/kol/brief-builder', icon: Target, requiredRoles: ['KOL', 'BRAND'], group: 'tools' },
  { title: 'Content Pipeline', path: '/dashboard/tools/kol/drafts', icon: Trello, requiredRoles: ['KOL'], group: 'tools' },
  
  // Sub-tools for Brand
  { title: 'Brand Safety Check', path: '/dashboard/tools/brand/safety', icon: Shield, requiredRoles: ['BRAND'], group: 'tools' },
  
  // --- SYSTEM ---
  { title: 'Settings', path: '/dashboard/settings', icon: Settings, group: 'system' }
];

export const getMenuItems = (category: CompanyCategory): MenuItem[] => {
  return ALL_MENUS.filter(menu => {
    if (!menu.requiredRoles) return true;
    return category && menu.requiredRoles.includes(category);
  });
};
