import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout, ProtectedRoute } from '@/components/layout/AdminLayout';
import AuthCallback from '@/pages/auth/callback';
import AdminLogin from '@/pages/auth/login';
import UsersCRM from '@/pages/users';
import FinanceTreasury from '@/pages/finance';
import ProjectOverwatch from '@/pages/projects';
import DisputeResolution from '@/pages/disputes';
import AdminDashboard from '@/pages/dashboard';
import { useThemeStore } from '@/store/useAppStore';

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

        {/* Auth Route: Menerima JWT dari SSO */}
        <Route path="/auth/login" element={<AdminLogin />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* STRICT ADMIN ROUTES */}
        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UsersCRM />} />
          <Route path="finance" element={<FinanceTreasury />} />
          <Route path="projects" element={<ProjectOverwatch />} />
          <Route path="disputes" element={<DisputeResolution />} />
        </Route>

        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
