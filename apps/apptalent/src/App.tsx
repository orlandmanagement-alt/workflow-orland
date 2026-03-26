import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import Login from '@/pages/auth/login'
import SSOCallback from '@/pages/auth/callback' // Import halaman callback baru
import Register from '@/pages/auth/register'
import DashboardHome from '@/pages/dashboard/index'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<SSOCallback />} /> {/* Rute Callback SSO */}
        <Route path="/register" element={<Register />} />

        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={<ErrorBoundary><DashboardLayout /></ErrorBoundary>}>
          <Route index element={<DashboardHome />} />
          {/* Rute dinamis lainnya ditaruh di sini */}
        </Route>

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
