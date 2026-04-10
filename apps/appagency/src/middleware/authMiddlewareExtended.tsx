// Extended Auth Middleware - Agency Role + Advanced Redirection
// File: apps/appclient/src/middleware/authMiddlewareExtended.tsx

import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

interface User {
  id: string
  email: string
  name: string
  role: 'talent' | 'client' | 'admin' | 'agency' | 'super_admin'
  managedBy?: string // Agency ID if this is a managed talent
  parentAgencyId?: string // For agency-managed talent tracking
}

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  currentViewAs?: User | null // When impersonating a talent
  logout: () => Promise<void>
  switchToTalent: (talentId: string) => Promise<void>
  clearImpersonation: () => Promise<void>
}

export const AuthContext = React.createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  currentViewAs: null,
  logout: async () => {},
  switchToTalent: async () => {},
  clearImpersonation: async () => {},
})

/**
 * Extended Access Denied Block - Handles all role mismatches
 */
export const AccessDeniedBlock: React.FC<{
  userRole: string
  userSubdomain: string
  correctUrl: string
  onRedirect: () => void
}> = ({ userRole, userSubdomain, correctUrl, onRedirect }) => {
  const [countdown, setCountdown] = useState(3)

  const roleLabels = {
    talent: 'Talent',
    client: 'Client',
    admin: 'Administrator',
    agency: 'Agency',
    super_admin: 'Super Administrator',
  }

  const messages = {
    talent: 'Talent Account',
    client: 'Client Account',
    admin: 'Administrator Account',
    agency: 'Agency Roster Dashboard',
    super_admin: 'Super Administrator Account',
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
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
              Anda adalah akun{' '}
              <span className="text-blue-400">
                {roleLabels[userRole as keyof typeof roleLabels] || userRole}
              </span>
            </p>
            <p className="text-blue-200 text-sm mt-2">
              Mengalihkan ke {messages[userRole as keyof typeof messages]}...
            </p>
          </div>
          <p className="text-slate-400 text-sm">
            Mengalihkan dalam...
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
          Arah: <span className="text-slate-400 font-mono text-xs break-all">{correctUrl}</span>
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
 * Impersonation Header - Shows current view-as status for agencies
 */
export const ImpersonationHeader: React.FC<{
  currentUser: User
  viewAsUser: User
  onClearImpersonation: () => void
}> = ({ currentUser, viewAsUser, onClearImpersonation }) => {
  if (currentUser.role !== 'agency' || !viewAsUser) return null

  return (
    <div className="bg-yellow-500/10 border-b-2 border-yellow-500/30 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <i className="fa-solid fa-eye text-yellow-500 text-lg"></i>
        <div>
          <p className="text-yellow-200 font-semibold text-sm">
            Anda sedang melihat sebagai: <span className="text-yellow-300">{viewAsUser.name}</span>
          </p>
          <p className="text-yellow-600 text-xs">
            ID Talent: {viewAsUser.id}
          </p>
        </div>
      </div>
      <button
        onClick={onClearImpersonation}
        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded font-semibold transition-all text-sm"
      >
        <i className="fa-solid fa-times mr-2"></i>
        Keluar dari Mode Ini
      </button>
    </div>
  )
}

/**
 * Extended Auth Provider - Handles agency impersonation
 */
export const AuthProviderExtended: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [currentViewAs, setCurrentViewAs] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('https://www.orlandmanagement.com/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.status === 'ok' && data.user) {
          setUser(data.user)
          setIsAuthenticated(true)

          // Check if user is in impersonation mode
          if (data.user.impersonatingTalentId) {
            await fetchImpersonatedTalent(data.user.impersonatingTalentId)
          }

          localStorage.setItem('cachedUser', JSON.stringify(data.user))
          localStorage.setItem('authTime', Date.now().toString())
        }
      } else {
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

  const fetchImpersonatedTalent = async (talentId: string) => {
    try {
      const response = await fetch(
        `https://api.orlandmanagement.com/api/agency/talent/${talentId}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      )

      if (response.ok) {
        const data = await response.json()
        setCurrentViewAs(data.talent)
      }
    } catch (error) {
      console.error('Failed to fetch impersonated talent:', error)
    }
  }

  const switchToTalent = async (talentId: string) => {
    try {
      const response = await fetch(
        'https://www.orlandmanagement.com/api/auth/impersonate-talent',
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ talentId }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        setCurrentViewAs(data.talent)
        return true
      }
      return false
    } catch (error) {
      console.error('Switch talent failed:', error)
      return false
    }
  }

  const clearImpersonation = async () => {
    try {
      await fetch('https://www.orlandmanagement.com/api/auth/clear-impersonation', {
        method: 'POST',
        credentials: 'include',
      })

      setCurrentViewAs(null)
    } catch (error) {
      console.error('Clear impersonation failed:', error)
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
    setCurrentViewAs(null)
    setIsAuthenticated(false)
    localStorage.removeItem('cachedUser')
    localStorage.removeItem('authTime')

    window.location.href = 'https://www.orlandmanagement.com/'
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        currentViewAs,
        logout,
        switchToTalent,
        clearImpersonation,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Extended Protected Route - Handles all role validations including Agency
 */
export const ProtectedRouteExtended: React.FC<{
  children: React.ReactNode
  requiredRole: 'talent' | 'client' | 'admin' | 'agency' | 'super_admin' | 'any'
}> = ({ children, requiredRole }) => {
  const { user, loading, isAuthenticated } = useAuth()
  const [showBlockScreen, setShowBlockScreen] = useState(false)
  const [blockInfo, setBlockInfo] = useState<{
    userRole: string
    userSubdomain: string
    correctUrl: string
  } | null>(null)

  const navigate = useNavigate()

  // URL to role mapping
  const getExpectedRoleFromUrl = (): string | null => {
    const hostname = window.location.hostname
    if (hostname.includes('talent.')) return 'talent'
    if (hostname.includes('client.')) return 'client'
    if (hostname.includes('admin.')) return 'admin'
    if (hostname.includes('agency.')) return 'agency'
    return null
  }

  useEffect(() => {
    if (loading) return

    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (requiredRole !== 'any' && user && user.role !== requiredRole) {
      const correctUrl = {
        talent: 'https://talent.orlandmanagement.com',
        client: 'https://client.orlandmanagement.com',
        admin: 'https://admin.orlandmanagement.com',
        agency: 'https://agency.orlandmanagement.com',
        super_admin: 'https://admin.orlandmanagement.com',
      }[user.role] || 'https://talent.orlandmanagement.com'

      const expectedRole = getExpectedRoleFromUrl()

      setBlockInfo({
        userRole: user.role,
        userSubdomain: expectedRole || 'unknown',
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
        userSubdomain={blockInfo.userSubdomain}
        correctUrl={blockInfo.correctUrl}
        onRedirect={handleRedirect}
      />
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}

/**
 * Custom Hook: useAuth
 */
export const useAuth = () => {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

/**
 * Usage in appagency/src/App.tsx:
 *
 * <AuthProviderExtended>
 *   <Routes>
 *     <Route path="/dashboard" element={
 *       <ProtectedRouteExtended requiredRole="agency">
 *         <AgencyDashboard />
 *       </ProtectedRouteExtended>
 *     } />
 *     <Route path="/talent/:id" element={
 *       <ProtectedRouteExtended requiredRole="agency">
 *         <TalentDetail />
 *       </ProtectedRouteExtended>
 *     } />
 *   </Routes>
 * </AuthProviderExtended>
 */
