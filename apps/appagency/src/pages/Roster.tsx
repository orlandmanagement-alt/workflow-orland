// Roster Page - Manage All Talents
// File: apps/appagency/src/pages/Roster.tsx

import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../middleware/authMiddlewareExtended'

interface Talent {
  id: string
  name: string
  email: string
  profileStatus: 'draft' | 'pending_review' | 'active' | 'archived'
  canLoginIndependently: boolean
  portfolioEditLock: boolean
  priceNegotiationLock: boolean
  bookings: number
  rating: number
  earnings: number
  createdAt: string
}

const Roster: React.FC = () => {
  const navigate = useNavigate()
  const { user, switchToTalent } = useAuth()

  const [talents, setTalents] = useState<Talent[]>([
    {
      id: 'talent_1',
      name: 'Budi Santoso',
      email: 'budi@example.com',
      profileStatus: 'active',
      canLoginIndependently: true,
      portfolioEditLock: false,
      priceNegotiationLock: false,
      bookings: 8,
      rating: 4.8,
      earnings: 45000000,
      createdAt: '2024-01-15',
    },
    {
      id: 'talent_2',
      name: 'Ella Singh',
      email: 'ella@example.com',
      profileStatus: 'active',
      canLoginIndependently: true,
      portfolioEditLock: false,
      priceNegotiationLock: false,
      bookings: 12,
      rating: 4.9,
      earnings: 62000000,
      createdAt: '2024-02-10',
    },
    {
      id: 'talent_3',
      name: 'Citra Dewi',
      email: 'citra@example.com',
      profileStatus: 'pending_review',
      canLoginIndependently: false,
      portfolioEditLock: true,
      priceNegotiationLock: false,
      bookings: 0,
      rating: 0,
      earnings: 0,
      createdAt: '2024-04-01',
    },
  ])

  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'draft' | 'archived'>('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'earnings' | 'rating' | 'recent'>('name')

  const filteredTalents = useMemo(() => {
    let result = talents

    // Filter by status
    if (filter !== 'all') {
      result = result.filter(
        (t) =>
          (filter === 'active' && t.profileStatus === 'active') ||
          (filter === 'pending' && t.profileStatus === 'pending_review') ||
          (filter === 'draft' && t.profileStatus === 'draft') ||
          (filter === 'archived' && t.profileStatus === 'archived')
      )
    }

    // Filter by search
    if (search) {
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.email.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'earnings':
          return b.earnings - a.earnings
        case 'rating':
          return b.rating - a.rating
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'name':
        default:
          return a.name.localeCompare(b.name)
      }
    })

    return result
  }, [talents, filter, search, sortBy])

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'pending_review':
        return 'bg-yellow-100 text-yellow-800'
      case 'draft':
        return 'bg-slate-100 text-slate-800'
      case 'archived':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const handleImpersonate = async (talentId: string) => {
    const success = await switchToTalent(talentId)
    if (success) {
      // Show confirmation and allow viewing as talent
      alert('Anda sekarang melihat sebagai talent. Header kuning di atas menunjukkan status impersonation.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Talent Roster</h1>
          <p className="text-slate-600 mt-1">Kelola {talents.length} talent di agency Anda</p>
        </div>
        <button
          onClick={() => navigate('/talent/new')}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
        >
          + Tambah Talent Baru
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Cari talent nama atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="pending">Pending Review</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="name">Urutkan: Nama</option>
            <option value="earnings">Urutkan: Komisi Tertinggi</option>
            <option value="rating">Urutkan: Rating</option>
            <option value="recent">Urutkan: Terbaru</option>
          </select>
        </div>
      </div>

      {/* Talents Grid */}
      {filteredTalents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTalents.map((talent) => (
            <div
              key={talent.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-all overflow-hidden"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold">{talent.name}</h3>
                    <p className="text-sm text-indigo-100">{talent.email}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(talent.profileStatus)}`}>
                    {talent.profileStatus === 'pending_review' ? 'Pending' : talent.profileStatus}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-4">
                {/* Stats Row 1 */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">{talent.bookings}</p>
                    <p className="text-xs text-slate-600">Booking</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-500">
                      {talent.rating > 0 ? talent.rating.toFixed(1) : '-'}
                    </p>
                    <p className="text-xs text-slate-600">Rating</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-slate-900">
                      {formatCurrency(talent.earnings * 0.15).replace('Rp', '').slice(0, -3)}
                    </p>
                    <p className="text-xs text-slate-600">Komisi</p>
                  </div>
                </div>

                {/* Locks Status */}
                {(talent.portfolioEditLock || talent.priceNegotiationLock) && (
                  <div className="space-y-2">
                    {talent.portfolioEditLock && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 p-2 rounded">
                        <span>🔒</span>
                        <span>Portfolio terkunci</span>
                      </div>
                    )}
                    {talent.priceNegotiationLock && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 p-2 rounded">
                        <span>💰</span>
                        <span>Harga terkunci</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Independent Login Status */}
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium ${
                    talent.canLoginIndependently
                      ? 'bg-green-100 text-green-800'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {talent.canLoginIndependently ? '✓' : '✗'}
                  <span>{talent.canLoginIndependently ? 'Login Independen Aktif' : 'Tidak Bisa Login'}</span>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                  <button
                    onClick={() => navigate(`/talent/${talent.id}`)}
                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded font-medium text-sm transition"
                  >
                    Edit
                  </button>
                  {talent.profileStatus === 'active' && (
                    <button
                      onClick={() => handleImpersonate(talent.id)}
                      className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded font-medium text-sm transition"
                    >
                      Lihat Sebagai
                    </button>
                  )}
                  {talent.profileStatus !== 'active' && (
                    <button
                      disabled
                      className="px-3 py-2 bg-slate-50 text-slate-400 rounded font-medium text-sm cursor-not-allowed"
                    >
                      N/A
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-xl text-slate-600 mb-4">Tidak ada talent yang sesuai dengan filter</p>
          <button
            onClick={() => navigate('/talent/new')}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition"
          >
            Tambah Talent Pertama
          </button>
        </div>
      )}
    </div>
  )
}

export default Roster
