import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout, ProtectedRoute } from '@/components/layout/AdminLayout';
import AuthCallback from '@/pages/auth/callback';
import UsersCRM from '@/pages/users';
import FinanceTreasury from '@/pages/finance';
import ProjectOverwatch from '@/pages/projects';
import { useThemeStore } from '@/store/useAppStore';

// Temporary Mock Dashboard Component
const DashboardHome = () => (
  <div className="flex flex-col items-center justify-center h-full text-slate-400">
     <h1 className="text-4xl font-black text-slate-800 dark:text-slate-100 mb-2">ORLAND GOD MODE</h1>
     <p>Select a module from the Master Controls sidebar.</p>
  </div>
);

function App() {
  const isDark = useThemeStore(state => state.isDark);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        
        {/* Auth Route untuk menerima JWT dari SSO */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        {/* STRICT ADMIN ROUTES */}
        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<DashboardHome />} />
          <Route path="users" element={<UsersCRM />} />
          <Route path="finance" element={<FinanceTreasury />} />
          <Route path="projects" element={<ProjectOverwatch />} />
        </Route>

        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
