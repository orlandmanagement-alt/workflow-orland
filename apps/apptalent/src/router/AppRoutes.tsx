import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import pages
import Dashboard from '../pages/dashboard/index';
import Profile from '../pages/profile/index';
import Projects from '../pages/projects/index';
import ProjectDetail from '../pages/projects/[id]';
import Messages from '../pages/messages/index';
import Earnings from '../pages/earnings/index';
import Payouts from '../pages/payouts/index';
import Media from '../pages/media/index';
import Schedules from '../pages/schedules/index';
import Contracts from '../pages/contracts/index';
import Audition from '../pages/audition/index';
import KYC from '../pages/kyc/index';
import Help from '../pages/help/index';
import Settings from '../pages/settings/index';
import JobsMatch from '../pages/jobs/match/index';
import JobsInvites from '../pages/jobs/invites';
import JobBoard from '../pages/jobs/board/index';
import JobBoardDetail from '../pages/jobs/board/[id]';
import PublicProfile from '../pages/p/[username]';
import LiveBoards from '../pages/live-boards/[id]';
import CastingGuest from '../pages/casting/[boardToken]';
import Leaderboard from '../pages/Leaderboard/TalentLeaderboard';
import InviteLandingPage from '../pages/Invite/InviteLandingPage';
import NotFound from '../pages/NotFound';

/**
 * App Routes Configuration
 * Includes both authenticated and public routes
 */
export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes (no auth required) */}
      <Route path="/invite/:token" element={<InviteLandingPage />} />
      <Route path="/p/:username" element={<PublicProfile />} />

      {/* Protected Routes - Dashboard */}
      <Route path="/" element={<Dashboard />} />
      <Route path="/home" element={<Dashboard />} />
      <Route path="/dashboard" element={<Dashboard />} />

      {/* Profile Management */}
      <Route path="/profile" element={<Profile />} />

      {/* Projects & Opportunities */}
      <Route path="/projects" element={<Projects />} />
      <Route path="/projects/:id" element={<ProjectDetail />} />

      {/* Jobs & Matching */}
      <Route path="/jobs" element={<JobBoard />} />
      <Route path="/jobs/match" element={<JobsMatch />} />
      <Route path="/jobs/invites" element={<JobsInvites />} />
      <Route path="/jobs/board" element={<JobBoard />} />
      <Route path="/jobs/board/:id" element={<JobBoardDetail />} />

      {/* Messages & Communication */}
      <Route path="/messages" element={<Messages />} />
      <Route path="/messages/:conversationId" element={<Messages />} />

      {/* Audition & Self-Tape */}
      <Route path="/audition" element={<Audition />} />

      {/* Schedule Management */}
      <Route path="/schedules" element={<Schedules />} />

      {/* Financial & Earnings */}
      <Route path="/earnings" element={<Earnings />} />
      <Route path="/payouts" element={<Payouts />} />

      {/* Media & Portfolio */}
      <Route path="/media" element={<Media />} />

      {/* KYC Verification */}
      <Route path="/kyc" element={<KYC />} />

      {/* Contracts & Legal */}
      <Route path="/contracts" element={<Contracts />} />

      {/* Live Casting */}
      <Route path="/live-boards/:id" element={<LiveBoards />} />
      <Route path="/casting/:boardToken" element={<CastingGuest />} />

      {/* Leaderboard */}
      <Route path="/leaderboard" element={<Leaderboard />} />

      {/* Support & Settings */}
      <Route path="/help" element={<Help />} />
      <Route path="/settings" element={<Settings />} />

      {/* 404 */}
      <Route path="/not-found" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/not-found" replace />} />
    </Routes>
  );
};

export default AppRoutes;
