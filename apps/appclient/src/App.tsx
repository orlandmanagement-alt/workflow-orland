import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAppStore';

// Layout
import ClientLayout from './components/layout/ClientLayout';

// Pages
import AuthCallback from './pages/auth/callback';
import ClientAuth from "./pages/auth/client-login";
import ClientDashboard from './pages/dashboard/index';
import ProjectsHub from './pages/projects/index';
import FinanceHub from "./pages/finance/invoices";
import ContractsHub from "./pages/contracts/index";
import TeamSettings from "./pages/settings/team";
import ClientMessages from "./pages/messages/index";
import TalentDiscovery from "./pages/talents/search";
import ProjectDetail from "./pages/projects/detail";
import CreateProjectWizard from "./pages/projects/create";
import WorkspaceHost from "./pages/projects/workspace";

// Dynamic Tools (Import directly or dynamically in a real app)
import PHScripts from "./pages/tools/ph/scripts";
import KOLBriefBuilder from "./pages/tools/kol/brief-builder";
import KOLDrafts from "./pages/tools/kol/drafts";
import BrandSafety from "./pages/tools/brand/safety";
import WORundown from "./pages/tools/wo/rundown";
import EORiders from "./pages/tools/eo/riders"; // Kita akan buat file ini setelahnya

// --- STRICT GATEKEEPER ---
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthorized = useAuthStore(state => state.isAuthenticated);

  if (!isAuthorized) {
    window.location.replace(`https://sso.orlandmanagement.com/?redirect=${encodeURIComponent(window.location.href)}`);
    return null;
  }
  
  return <>{children}</>;
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* RUTE PENANGKAP TOKEN (TIDAK DILINDUNGI GATEKEEPER) */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/login" element={<ClientAuth />} />
        
        {/* SEMUA RUTE UTAMA DILINDUNGI GATEKEEPER & DI DALAM CLIENT LAYOUT */}
        <Route element={<ProtectedRoute><ClientLayout /></ProtectedRoute>}>
          {/* Core Routes */}
          <Route path="/dashboard" element={<ClientDashboard />} />
          <Route path="/dashboard/projects" element={<ProjectsHub />} />
          <Route path="/dashboard/projects/new" element={<CreateProjectWizard />} />
          <Route path="/dashboard/projects/:id" element={<ProjectDetail />} />
          <Route path="/dashboard/projects/:id/workspace" element={<WorkspaceHost />} />
          <Route path="/dashboard/talents" element={<TalentDiscovery />} />
          <Route path="/dashboard/finance" element={<FinanceHub />} />
          <Route path="/dashboard/contracts" element={<ContractsHub />} />
          <Route path="/dashboard/settings" element={<TeamSettings />} />
          <Route path="/dashboard/messages" element={<ClientMessages />} />

          {/* Dynamic Tools Routes */}
          <Route path="/dashboard/tools/ph/scripts" element={<PHScripts />} />
          <Route path="/dashboard/tools/kol/brief-builder" element={<KOLBriefBuilder />} />
          <Route path="/dashboard/tools/kol/drafts" element={<KOLDrafts />} />
          <Route path="/dashboard/tools/brand/safety" element={<BrandSafety />} />
          <Route path="/dashboard/tools/wo/rundown" element={<WORundown />} />
          <Route path="/dashboard/tools/eo/riders" element={<EORiders />} />
          
          {/* Missing route stubs to prevent 404 on layout click */}
          <Route path="/dashboard/casting" element={<div className="p-10"><h1 className="text-2xl font-bold dark:text-white">Live Casting Board</h1></div>} />
          <Route path="/dashboard/staffing" element={<div className="p-10"><h1 className="text-2xl font-bold dark:text-white">Event Staffing</h1></div>} />
        </Route>
      </Routes>
    </Router>
  );
}
