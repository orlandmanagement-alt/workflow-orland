// Login Page
// File: apps/appagency/src/pages/Login.tsx

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const Login: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    
    // Simulate API call
    localStorage.setItem('cachedUser', JSON.stringify({
      id: 'agency_123',
      email: formData.email,
      name: 'PT Bintang Talent',
      role: 'agency',
    }))
    
    setLoading(false)
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-3xl mx-auto mb-4">
            A
          </div>
          <h1 className="text-3xl font-bold text-white">Orland Agency</h1>
          <p className="text-slate-400 mt-2">Platform Manajemen Talent</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="agency@example.com"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <p className="text-center text-sm text-slate-600">
            Belum punya akun?{' '}
            <a href="#" className="text-indigo-600 hover:text-indigo-700 font-semibold">
              Daftar sekarang
            </a>
          </p>
        </form>

        {/* Demo Credentials */}
        <div className="mt-6 bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-slate-300 mb-2">Demo Credentials:</p>
          <p className="text-xs text-slate-400">Email: demo@agency.com</p>
          <p className="text-xs text-slate-400">Password: demo123</p>
        </div>
      </div>
    </div>
  )
}

export default Login
