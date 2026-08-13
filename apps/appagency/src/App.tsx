// Main App Component - Agency Dashboard
// File: apps/appagency/src/App.tsx

import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from './components/layout/DashboardLayout'

// Pages
import Dashboard from './pages/Dashboard'
import Roster from './pages/Roster'
import TalentDetail from './pages/TalentDetail'
import Inbox from './pages/Inbox'
import Finance from './pages/Finance'
import Settings from './pages/Settings'
import Importer from './pages/Importer'
import ProjectApply from './pages/ProjectApply'
import PublicLinks from './pages/PublicLinks'

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Dashboard Portal */}
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/roster" element={<Roster />} />
          <Route path="/roster/new" element={<TalentDetail />} />
          <Route path="/roster/:id" element={<TalentDetail />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/projects/apply/:projectId" element={<ProjectApply />} />
          <Route path="/links" element={<PublicLinks />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/tools/importer" element={<Importer />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Router>
  )
}
