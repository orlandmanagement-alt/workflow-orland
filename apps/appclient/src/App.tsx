import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Users, FileText, Settings } from 'lucide-react';
import Header from './components/layout/Header';
import OmniSearch from "./components/layout/OmniSearch";
import ClientDashboard from './pages/dashboard/index';
import ProjectsHub from './pages/projects/index';
import FinanceHub from "./pages/finance/invoices";
import ContractsHub from "./pages/contracts/index";
import TeamSettings from "./pages/settings/team";
import ClientAuth from "./pages/auth/client-login";
import ClientMessages from "./pages/messages/index";
import TalentDiscovery from "./pages/talents/search";
import ProjectDetail from "./pages/projects/detail";

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
    <div className="fixed bottom-0 w-full bg-white dark:bg-[#0b141a] border-t border-slate-200 dark:border-slate-800 flex justify-around p-3 z-50 sm:hidden">
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
        <Route path="/dashboard" element={<ClientLayout><ClientDashboard /></ClientLayout>} />
        <Route path="/dashboard/projects" element={<ClientLayout><ProjectsHub /></ClientLayout>} />
        <Route path="/dashboard/projects/:id" element={<ClientLayout><ProjectDetail /></ClientLayout>} />
        <Route path="/dashboard/talents" element={<ClientLayout><TalentDiscovery /></ClientLayout>} />
        <Route path="/dashboard/finance" element={<ClientLayout><FinanceHub /></ClientLayout>} />
        <Route path="/dashboard/contracts" element={<ClientLayout><ContractsHub /></ClientLayout>} />
        <Route path="/dashboard/settings" element={<ClientLayout><TeamSettings /></ClientLayout>} />
        <Route path="/dashboard/messages" element={<ClientLayout><ClientMessages /></ClientLayout>} />
      </Routes>
    </Router>
  );
}
