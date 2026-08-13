import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

// Layout & Auth
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import Login from '@/pages/auth/login';
import AuthCallback from '@/pages/auth/callback';

// Pages
import Dashboard from '@/pages/dashboard';
import Projects from '@/pages/projects';
import ProjectDetail from '@/pages/projects/[id]';
import Schedules from '@/pages/schedules';
import Earnings from '@/pages/earnings';
import Payouts from '@/pages/payouts';
import MediaPortfolio from '@/pages/media';
import Contracts from '@/pages/contracts';
import Messages from '@/pages/messages';
import AIMatch from "@/pages/jobs/match";
import JobInvites from '@/pages/jobs/invites';
import JobBoard from '@/pages/jobs/board';
import JobDetail from '@/pages/jobs/board/[id]';
import KYCVerification from '@/pages/kyc';
import Audition from "@/pages/audition";
import Helpdesk from '@/pages/help';
import Settings from '@/pages/settings';
import ProfileEditor from '@/pages/profile';
import LiveBoardJoin from '@/pages/live-boards/[id]';
import PublicProfile from '@/pages/p/[username]';
import InviteLandingPage from '@/pages/Invite/InviteLandingPage';

export default function App() {
  // Apply dark mode by default
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/invite/:token" element={<InviteLandingPage />} />
          <Route path="/p/:username" element={<PublicProfile />} />
          <Route path="/live-boards/:id" element={<LiveBoardJoin />} />

          {/* Protected Routes */}
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/jobs/match" element={<AIMatch />} />
            <Route path="/profile" element={<ProfileEditor />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/schedules" element={<Schedules />} />
            <Route path="/earnings" element={<Earnings />} />
            <Route path="/payouts" element={<Payouts />} />
            <Route path="/media" element={<MediaPortfolio />} />
            <Route path="/contracts" element={<Contracts />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/jobs/board" element={<JobBoard />} />
            <Route path="/jobs/board/:id" element={<JobDetail />} />
            <Route path="/jobs/invites" element={<JobInvites />} />
            <Route path="/kyc" element={<KYCVerification />} />
            <Route path="/audition" element={<Audition />} />
            <Route path="/help" element={<Helpdesk />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Fallback 404 */}
          <Route path="*" element={
            <div className="flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white">
              <h1 className="text-6xl font-extrabold text-brand-600 mb-4">404</h1>
              <p className="text-xl font-bold mb-6">Halaman tidak ditemukan</p>
              <button onClick={() => window.location.href = '/dashboard'} className="px-6 py-2 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors">
                Kembali ke Beranda
              </button>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}