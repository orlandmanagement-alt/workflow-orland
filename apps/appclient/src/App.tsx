import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Users, FileText, Settings } from 'lucide-react';
import Header from './components/layout/Header';
import OmniSearch from "./components/layout/OmniSearch";
import ClientDashboard from '@/pages/dashboard/index';
import ProjectsHub from '@/pages/projects/index';
import FinanceHub from "@/pages/finance/invoices";
import ContractsHub from "@/pages/contracts/index";
import TeamSettings from "@/pages/settings/team";
import ScriptBreakdown from "@/pages/tools/ph/scripts";
import KOLDraftReview from "@/pages/tools/kol/drafts";
import ClientAuth from "@/pages/auth/client-login";
import WORundown from "@/pages/tools/wo/rundown";
import BrandSafetyScanner from "@/pages/tools/brand/safety";
import BriefBuilder from "@/pages/tools/kol/brief-builder";
import LiveCastingBoard from "@/pages/castings/live-board";
import DisputeCenter from "@/pages/help/index";
import InfraCatalog from "@/pages/infrastructure/index";
import CallSheetGenerator from "@/pages/tools/ph/call-sheets";
import OrlandAcademy from "@/pages/academy/index";
import InventoryTracker from "@/pages/inventory/index";
import ClientMessages from "@/pages/messages/index";
import TalentDiscovery from "@/pages/talents/search";
import ProjectDetail from "@/pages/projects/detail";

// B2B Bottom Navigation (Mobile)
const BottomNav = () => {
  const location = useLocation();
  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { path: '/dashboard/projects', icon: Briefcase, label: 'Projects' },
    { path: '/dashboard/talents', icon: Users, label: 'Talents' },
    { path: '/dashboard/finance', icon: FileText, label: 'Finance' },
    { path: '/dashboard/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="fixed bottom-0 w-full bg-white dark:bg-dark-card border-t border-slate-200 dark:border-slate-800 flex justify-around p-3 z-50 sm:hidden">
      {navItems.map((item) => {
        const isActive = location.pathname.includes(item.path) && (item.path !== '/dashboard' || location.pathname === '/dashboard');
        return (
          <Link key={item.path} to={item.path} className={`flex flex-col items-center gap-1 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'}`}>
            <item.icon size={20} className={isActive ? 'fill-brand-600/20' : ''} />
            <span className="text-[10px] font-bold">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
};

// Layout Wrapper Khusus Klien
const ClientLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-slate-50 dark:bg-[#071122]">
    <Header />
    <OmniSearch />
    <main className="pb-24 sm:pb-10">{children}</main>
    <BottomNav />
  </div>
);

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<ClientAuth />} />
        <Route path="/setup" element={<ClientAuth />} />
        <Route path="/dashboard" element={<ClientLayout><ClientDashboard /></ClientLayout>} />
        <Route path="/dashboard/projects" element={<ClientLayout><ProjectsHub /></ClientLayout>} />
        <Route path="/dashboard/projects/:id" element={<ClientLayout><ProjectDetail /></ClientLayout>} />
        {/* Rute Stub untuk menghindari error 404 saat klik menu lain */}
        <Route path="/dashboard/talents" element={<ClientLayout><TalentDiscovery /></ClientLayout>} />
        <Route path="/dashboard/finance" element={<ClientLayout><FinanceHub /></ClientLayout>} />
        <Route path="/dashboard/contracts" element={<ClientLayout><ContractsHub /></ClientLayout>} />
        <Route path="/dashboard/settings" element={<ClientLayout><TeamSettings /></ClientLayout>} />
        <Route path="/dashboard/tools/ph/scripts" element={<ClientLayout><ScriptBreakdown /></ClientLayout>} />
        <Route path="/dashboard/tools/kol/drafts" element={<ClientLayout><KOLDraftReview /></ClientLayout>} />
        <Route path="/dashboard/tools/wo/rundown" element={<ClientLayout><WORundown /></ClientLayout>} />
        <Route path="/dashboard/tools/brand/safety" element={<ClientLayout><BrandSafetyScanner /></ClientLayout>} />
        <Route path="/dashboard/tools/kol/brief" element={<ClientLayout><BriefBuilder /></ClientLayout>} />
        <Route path="/dashboard/castings/live" element={<ClientLayout><LiveCastingBoard /></ClientLayout>} />
        <Route path="/dashboard/help" element={<ClientLayout><DisputeCenter /></ClientLayout>} />
        <Route path="/dashboard/logistics" element={<ClientLayout><InfraCatalog /></ClientLayout>} />
        <Route path="/dashboard/tools/ph/call-sheets" element={<ClientLayout><CallSheetGenerator /></ClientLayout>} />
        <Route path="/dashboard/academy" element={<ClientLayout><OrlandAcademy /></ClientLayout>} />
        <Route path="/dashboard/inventory" element={<ClientLayout><InventoryTracker /></ClientLayout>} />
      </Routes>
    </Router>
  );
}
