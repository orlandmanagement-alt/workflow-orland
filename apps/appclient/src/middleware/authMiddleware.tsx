// Frontend Middleware for Role-Based Access Control
// File: apps/appclient/src/middleware/authMiddleware.tsx

import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

interface User {
  id: string
  email: string
  name: string
  role: 'talent' | 'client' | 'admin' | 'super_admin'
}

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  logout: () => Promise<void>
}

export const AuthContext = React.createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  logout: async () => {},
})

/**
 * Block Screen Component - Shows access denied message with 3-second countdown
 */
export const AccessDeniedBlock: React.FC<{
  userRole: string
  correctUrl: string
  onRedirect: () => void
}> = ({ userRole, correctUrl, onRedirect }) => {
  const [countdown, setCountdown] = useState(3)

  const roleLabels = {
    talent: 'Talent',
    client: 'Client',
    admin: 'Administrator',
    super_admin: 'Super Administrator',
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          onRedirect()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [onRedirect])

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="text-center px-4">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center animate-pulse">
            <i className="fa-solid fa-ban text-red-500 text-4xl"></i>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
          Akses Ditolak
        </h1>

        {/* Message */}
        <div className="mb-8 max-w-md mx-auto">
          <p className="text-slate-300 text-base sm:text-lg mb-4">
            Cek session SSO Anda
          </p>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
            <p className="text-blue-300 font-semibold">
              Anda adalah akun <span className="text-blue-400">{roleLabels[userRole as keyof typeof roleLabels] || userRole}</span>
            </p>
          </div>
          <p className="text-slate-400 text-sm">
            Mengalihkan ke portal yang sesuai dalam...
          </p>
        </div>

        {/* Countdown Timer */}
        <div className="mb-6">
          <div className="inline-block">
            <div className="w-16 h-16 rounded-full border-4 border-slate-600 border-t-indigo-500 animate-spin flex items-center justify-center">
              <span className="text-white font-bold text-2xl">{countdown}</span>
            </div>
          </div>
        </div>

        {/* Redirect URL */}
        <p className="text-xs text-slate-500 mb-4">
          Arah: <span className="text-slate-400 font-mono">{correctUrl}</span>
        </p>

        {/* Manual Redirect Button */}
        <button
          onClick={onRedirect}
          className="px-8 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all transform hover:scale-105 active:scale-95"
        >
          <i className="fa-solid fa-arrow-right mr-2"></i>
          Arahkan Sekarang
        </button>
      </div>
    </div>
  )
}

/**
 * Auth Provider Component
 * Wraps the application and handles authentication logic
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      // Call SSO /auth/me endpoint
      const response = await fetch('https://www.orlandmanagement.com/api/auth/me', {
        method: 'GET',
        credentials: 'include', // Include cookies from .orlandmanagement.com
      })

      if (response.ok) {
        const data = await response.json()
        if (data.status === 'ok' && data.user) {
          setUser(data.user)
          setIsAuthenticated(true)
          
          // Cache user info in localStorage
          localStorage.setItem('cachedUser', JSON.stringify(data.user))
          localStorage.setItem('authTime', Date.now().toString())
        }
      } else {
        // Check localStorage cache (valid for 1 hour)
        const cached = localStorage.getItem('cachedUser')
        const authTime = localStorage.getItem('authTime')
        
        if (cached && authTime && Date.now() - parseInt(authTime) < 3600000) {
          setUser(JSON.parse(cached))
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
          localStorage.removeItem('cachedUser')
          localStorage.removeItem('authTime')
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch('https://www.orlandmanagement.com/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout error:', error)
    }

    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('cachedUser')
    localStorage.removeItem('authTime')
    
    // Redirect to main domain
    window.location.href = 'https://www.orlandmanagement.com/'
  }

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Custom Hook: useAuth
 * Access auth context from any component
 */
export const useAuth = () => {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

/**
 * Role-Based Route Protection Component
 * Enforces access control based on user role
 */
export const ProtectedRoute: React.FC<{
  children: React.ReactNode
  requiredRole: 'talent' | 'client' | 'admin' | 'super_admin' | 'any'
}> = ({ children, requiredRole }) => {
  const { user, loading, isAuthenticated } = useAuth()
  const [showBlockScreen, setShowBlockScreen] = useState(false)
  const [blockInfo, setBlockInfo] = useState<{
    userRole: string
    correctUrl: string
  } | null>(null)

  const navigate = useNavigate()

  useEffect(() => {
    if (loading) return

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    // User authenticated but wrong role
    if (requiredRole !== 'any' && user && user.role !== requiredRole) {
      // Determine correct URL based on user's actual role
      const correctUrl = {
        talent: 'https://talent.orlandmanagement.com',
        client: 'https://client.orlandmanagement.com',
        admin: 'https://admin.orlandmanagement.com',
        super_admin: 'https://admin.orlandmanagement.com',
      }[user.role] || 'https://talent.orlandmanagement.com'

      setBlockInfo({
        userRole: user.role,
        correctUrl,
      })
      setShowBlockScreen(true)
    }
  }, [user, loading, isAuthenticated, requiredRole, navigate])

  const handleRedirect = () => {
    if (blockInfo) {
      window.location.href = blockInfo.correctUrl
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="inline-block">
            <div className="w-12 h-12 border-4 border-slate-600 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
          </div>
          <p className="text-slate-300">Memuat...</p>
        </div>
      </div>
    )
  }

  if (showBlockScreen && blockInfo) {
    return (
      <AccessDeniedBlock
        userRole={blockInfo.userRole}
        correctUrl={blockInfo.correctUrl}
        onRedirect={handleRedirect}
      />
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect in useEffect
  }

  return <>{children}</>
}

/**
 * Logout Trigger Component
 * Use this in your header/user menu
 */
export const LogoutButton: React.FC<{ className?: string }> = ({ className }) => {
  const { logout } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    await logout()
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className={className || 'px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50'}
    >
      <i className="fa-solid fa-sign-out-alt mr-2"></i>
      {isLoading ? 'Logging out...' : 'Logout'}
    </button>
  )
}

/**
 * Usage Example in App.tsx:
 * 
 * import { AuthProvider, ProtectedRoute, useAuth } from './middleware/authMiddleware'
 * 
 * function App() {
 *   return (
 *     <AuthProvider>
 *       <Routes>
 *         <Route path="/login" element={<LoginPage />} />
 *         <Route 
 *           path="/dashboard" 
 *           element={
 *             <ProtectedRoute requiredRole="client">
 *               <ClientDashboard />
 *             </ProtectedRoute>
 *           } 
 *         />
 *         <Route path="/profile" element={<ProtectedRoute requiredRole="any"><Profile /></ProtectedRoute>} />
 *       </Routes>
 *     </AuthProvider>
 *   )
 * }
 */
