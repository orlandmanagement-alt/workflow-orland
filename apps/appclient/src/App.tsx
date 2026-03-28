import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Users, FileText, Settings } from 'lucide-react';
import Header from './components/layout/Header';
import OmniSearch from "./components/layout/OmniSearch";

// Pages
import AuthCallback from './pages/auth/callback';
import ClientAuth from "./pages/auth/client-login"; // Jika masih ada
import ClientDashboard from './pages/dashboard/index';
import ProjectsHub from './pages/projects/index';
import FinanceHub from "./pages/finance/invoices";
import ContractsHub from "./pages/contracts/index";
import TeamSettings from "./pages/settings/team";
import ClientMessages from "./pages/messages/index";
import TalentDiscovery from "./pages/talents/search";
import ProjectDetail from "./pages/projects/detail";

// --- STRICT GATEKEEPER: HANYA MENGECEK BRANKAS ---
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const authData = localStorage.getItem('orland-auth-client');
  let isValid = false;
  
  try {
    const parsed = JSON.parse(authData || '');
    // Harus ada token dan role wajib 'client'
    if (parsed?.state?.token && parsed?.state?.role === 'client') {
      isValid = true;
    }
  } catch (e) {}

  if (!isValid) {
    // Sapu data hantu dan lempar ke SSO
    localStorage.removeItem('orland-auth-client');
    window.location.replace(`https://sso.orlandmanagement.com/?redirect=${encodeURIComponent(window.location.href)}`);
    return null;
  }
  
  return <>{children}</>;
};

// --- KOMPONEN UI BAWAH ---
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
        
        {/* RUTE PENANGKAP TOKEN (TIDAK DILINDUNGI GATEKEEPER) */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/login" element={<ClientAuth />} />
        
        {/* SEMUA RUTE UTAMA DILINDUNGI GATEKEEPER */}
        <Route path="/dashboard" element={<ProtectedRoute><ClientLayout><ClientDashboard /></ClientLayout></ProtectedRoute>} />
        <Route path="/dashboard/projects" element={<ProtectedRoute><ClientLayout><ProjectsHub /></ClientLayout></ProtectedRoute>} />
        <Route path="/dashboard/projects/:id" element={<ProtectedRoute><ClientLayout><ProjectDetail /></ClientLayout></ProtectedRoute>} />
        <Route path="/dashboard/talents" element={<ProtectedRoute><ClientLayout><TalentDiscovery /></ClientLayout></ProtectedRoute>} />
        <Route path="/dashboard/finance" element={<ProtectedRoute><ClientLayout><FinanceHub /></ClientLayout></ProtectedRoute>} />
        <Route path="/dashboard/contracts" element={<ProtectedRoute><ClientLayout><ContractsHub /></ClientLayout></ProtectedRoute>} />
        <Route path="/dashboard/settings" element={<ProtectedRoute><ClientLayout><TeamSettings /></ClientLayout></ProtectedRoute>} />
        <Route path="/dashboard/messages" element={<ProtectedRoute><ClientLayout><ClientMessages /></ClientLayout></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}
