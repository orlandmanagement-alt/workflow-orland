// Main Layout - Navigation + Sidebar
// File: apps/appagency/src/layouts/MainLayout.tsx

import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../middleware/authMiddlewareExtended'
import { ImpersonationHeader } from '../middleware/authMiddlewareExtended'

interface MainLayoutProps {
  children: React.ReactNode
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { user, currentViewAs, logout, clearImpersonation } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '📊',
      path: '/',
      badge: null,
    },
    {
      id: 'roster',
      label: 'Talent Roster',
      icon: '👥',
      path: '/roster',
      badge: null,
    },
    {
      id: 'inbox',
      label: 'Inquiries',
      icon: '💬',
      path: '/inbox',
      badge: '3', // Would be dynamic from API
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: '📈',
      path: '/analytics',
      badge: null,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      path: '/settings',
      badge: null,
    },
  ]

  const isActive = (path: string) => {
    if (path === '/' && (location.pathname === '/' || location.pathname.startsWith('/dashboard'))) {
      return true
    }
    return location.pathname.startsWith(path) && path !== '/'
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white transform transition-transform duration-300 lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white">
              A
            </div>
            <div>
              <h1 className="font-bold text-lg">Orland Agency</h1>
              <p className="text-xs text-slate-400">Management Platform</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="mt-8 px-3 space-y-2 flex-1 overflow-y-auto pb-20">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                navigate(item.path)
                setSidebarOpen(false) // Close on mobile
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                isActive(item.path)
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                  : 'text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* User Profile at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-700 bg-slate-900/50 p-4">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout()
              navigate('/login')
            }}
            className="w-full px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-all"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-slate-200 rounded-lg transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <h1 className="text-2xl font-bold text-slate-900">
              {user?.name ? `Halo, ${user.name.split(' ')[0]}!` : 'Agency Dashboard'}
            </h1>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <button className="relative p-2 hover:bg-slate-100 rounded-lg transition">
              <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>

            {/* Help */}
            <button className="p-2 hover:bg-slate-100 rounded-lg transition">
              <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Impersonation Header (if active) */}
        {currentViewAs && (
          <ImpersonationHeader
            currentUser={user!}
            viewAsUser={currentViewAs}
            onClearImpersonation={clearImpersonation}
          />
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-slate-50">
          <div className="p-6">{children}</div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

export default MainLayout
