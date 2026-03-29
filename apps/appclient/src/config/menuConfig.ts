import { 
  LayoutDashboard, Users, Video, Calendar, Trello, 
  FileText, Briefcase, Settings, Target 
} from 'lucide-react';
import { CompanyCategory } from '../store/useAppStore';

export interface MenuItem {
  title: string;
  path: string;
  icon: any;
  requiredRoles?: CompanyCategory[];
}

const ALL_MENUS: MenuItem[] = [
  // Universals
  { title: 'Home', path: '/dashboard', icon: LayoutDashboard },
  { title: 'Projects', path: '/dashboard/projects', icon: Briefcase },
  
  // Features exclusively for Production House (PH)
  { title: 'Live Casting Board', path: '/dashboard/casting', icon: Video, requiredRoles: ['PH'] },
  { title: 'Talent Roster', path: '/dashboard/talents', icon: Users, requiredRoles: ['PH', 'EO'] },
  
  // Features exclusively for Event Organizer (EO)
  { title: 'Event Staffing', path: '/dashboard/staffing', icon: Users, requiredRoles: ['EO'] },
  { title: 'Run Down Manager', path: '/dashboard/rundown', icon: Calendar, requiredRoles: ['EO'] },
  
  // Features exclusively for KOL / Digital Agency
  { title: 'Campaign Briefs', path: '/dashboard/campaigns', icon: Target, requiredRoles: ['KOL', 'BRAND'] },
  { title: 'Content Pipeline', path: '/dashboard/pipeline', icon: Trello, requiredRoles: ['KOL'] },
  
  // Features exclusively for Brands / Corporate
  { title: 'BA Exclusivity', path: '/dashboard/exclusivity', icon: FileText, requiredRoles: ['BRAND'] },
  
  // Universals (Bottom aligned usually)
  { title: 'Finance Center', path: '/dashboard/finance', icon: FileText },
  { title: 'Settings', path: '/dashboard/settings', icon: Settings }
];

export const getMenuItems = (category: CompanyCategory): MenuItem[] => {
  return ALL_MENUS.filter(menu => {
    // If no specific roles required, it's public/universal inside the dashboard
    if (!menu.requiredRoles) return true;
    
    // Feature flagged module
    return category && menu.requiredRoles.includes(category);
  });
};
