import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Users, FileText, Settings } from 'lucide-react';
import Header from './components/layout/Header';
import OmniSearch from "./components/layout/OmniSearch";
import ClientDashboard from './pages/dashboard/index';
import ProjectsHub from './pages/projects/index';
import FinanceHub from "./pages/finance/invoices";
import ContractsHub from "./pages/contracts/index";
import TeamSettings from "./pages/settings/team";
import ClientMessages from "./pages/messages/index";
import TalentDiscovery from "./pages/talents/search";
import ProjectDetail from "./pages/projects/detail";

// --- STRICT GATEKEEPER: ANTI CROSS-ROLE ---
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get('token');
  const urlRole = params.get('role'); // Ambil role dari SSO
  
  // 1. TANGKAP & VERIFIKASI URL
  if (urlToken && urlRole) {
    // Jika Talent mencoba masuk ke URL Client, TENDANG!
    if (urlRole.toLowerCase() !== 'client') {
        localStorage.clear(); // Bersihkan sisa-sisa data
        window.location.replace('https://sso.orlandmanagement.com/');
        return null;
    }
    
    // Jika benar Client, simpan ke brankas
    localStorage.setItem('orland-auth-client', JSON.stringify({ state: { token: urlToken, role: 'client' } }));
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // 2. CEK BRANKAS LOKAL (GHOST DATA PROTECTION)
  const authData = localStorage.getItem('orland-auth-client');
  let isValid = false;
  
  try {
    const parsed = JSON.parse(authData || '');
    // Pastikan token ada DAN rolenya benar-benar client
    if (parsed?.state?.token && parsed?.state?.role === 'client') {
      isValid = true;
    }
  } catch (e) {}

  if (!isValid) {
    // Hapus ghost data jika formatnya salah, lalu tendang ke SSO
    localStorage.removeItem('orland-auth-client');
    window.location.replace(`https://sso.orlandmanagement.com/?redirect=${encodeURIComponent(window.location.href)}`);
    return null;
  }
  
  return <>{children}</>;
};

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
