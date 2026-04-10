// Main App Component - Agency Dashboard
// File: apps/appagency/src/App.tsx

import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProviderExtended, ProtectedRouteExtended } from './middleware/authMiddlewareExtended'

// Pages
import DashboardPage from './pages/Dashboard'
import RosterPage from './pages/Roster'
import TalentDetailPage from './pages/TalentDetail'
import InboxPage from './pages/Inbox'
import InquiryDetailPage from './pages/InquiryDetail'
import AnalyticsPage from './pages/Analytics'
import SettingsPage from './pages/Settings'
import LoginPage from './pages/Login'
import OnboardingPage from './pages/Onboarding'

// Layout
import MainLayout from './layouts/MainLayout'

function App() {
  useEffect(() => {
    // Check if user is authenticated
    const cached = localStorage.getItem('cachedUser')
    if (!cached) {
      // Will be handled by AuthProvider redirect
    }
  }, [])

  return (
    <Router>
      <AuthProviderExtended>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />

          {/* Protected Routes */}
          <Route
            path="/*"
            element={
              <ProtectedRouteExtended requiredRole="agency">
                <MainLayout>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />

                    {/* Roster Management */}
                    <Route path="/roster" element={<RosterPage />} />
                    <Route path="/talent/new" element={<TalentDetailPage mode="create" />} />
                    <Route path="/talent/:talentId" element={<TalentDetailPage mode="edit" />} />

                    {/* Communications */}
                    <Route path="/inbox" element={<InboxPage />} />
                    <Route path="/inbox/:inquiryId" element={<InquiryDetailPage />} />

                    {/* Insights */}
                    <Route path="/analytics" element={<AnalyticsPage />} />

                    {/* Account */}
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/settings/account" element={<SettingsPage tab="account" />} />
                    <Route path="/settings/billing" element={<SettingsPage tab="billing" />} />
                    <Route path="/settings/kyc" element={<SettingsPage tab="kyc" />} />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </MainLayout>
              </ProtectedRouteExtended>
            }
          />
        </Routes>
      </AuthProviderExtended>
    </Router>
  )
}

export default App
