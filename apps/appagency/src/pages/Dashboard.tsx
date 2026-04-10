// Dashboard Page - Overview & Analytics
// File: apps/appagency/src/pages/Dashboard.tsx

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../middleware/authMiddlewareExtended'

interface DashboardStats {
  totalTalents: number
  activeTalents: number
  totalInquiries: number
  newInquiries: number
  totalEarnings: number
  commissionThisMonth: number
  pendingProfiles: number
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalTalents: 12,
    activeTalents: 10,
    totalInquiries: 45,
    newInquiries: 3,
    totalEarnings: 125000000, // IDR
    commissionThisMonth: 18750000, // 15% of earnings
    pendingProfiles: 2,
  })
  const [recentInquiries, setRecentInquiries] = useState([
    {
      id: 'inq_1',
      talentName: 'Budi Santoso',
      clientName: 'PT Mitra Digital',
      project: 'Premium Content Creator',
      date: '2 jam lalu',
      status: 'new' as const,
      budget: 50000000,
    },
    {
      id: 'inq_2',
      talentName: 'Ella Singh',
      clientName: 'CV Kreatif Media',
      project: 'Influencer Campaign',
      date: '5 jam lalu',
      status: 'replied' as const,
      budget: 75000000,
    },
    {
      id: 'inq_3',
      talentName: 'Citra Dewi',
      clientName: 'Agensi Periklanan XYZ',
      project: 'Brand Ambassador',
      date: '1 hari lalu',
      status: 'negotiating' as const,
      budget: 100000000,
    },
  ])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const StatCard: React.FC<{
    title: string
    value: string | number
    icon: string
    trend?: { value: number; direction: 'up' | 'down' }
    onClick?: () => void
  }> = ({ title, value, icon, trend, onClick }) => (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow p-6 border-l-4 border-indigo-500 hover:shadow-lg transition-all ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-600 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{value}</p>
          {trend && (
            <p className={`text-sm mt-1 ${trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend.direction === 'up' ? '↑' : '↓'} {trend.value}% dari bulan lalu
            </p>
          )}
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Selamat Datang!</h1>
          <p className="text-slate-600 mt-1">Kelola talenta Anda dan tingkatkan penghasilan bersama Orland</p>
        </div>
        <button
          onClick={() => navigate('/talent/new')}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
        >
          + Tambah Talent
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Talent"
          value={stats.totalTalents}
          icon="👥"
          trend={{ value: 25, direction: 'up' }}
          onClick={() => navigate('/roster')}
        />
        <StatCard
          title="Talent Aktif"
          value={stats.activeTalents}
          icon="⭐"
          trend={{ value: 10, direction: 'up' }}
        />
        <StatCard
          title="Inquiry Baru"
          value={stats.newInquiries}
          icon="💬"
          trend={{ value: 15, direction: 'up' }}
          onClick={() => navigate('/inbox')}
        />
        <StatCard
          title="Komisi Bulan Ini"
          value={formatCurrency(stats.commissionThisMonth)}
          icon="💰"
          trend={{ value: 8, direction: 'up' }}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Inquiries */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Inquiry Terbaru</h2>
            <button
              onClick={() => navigate('/inbox')}
              className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm"
            >
              Lihat Semua →
            </button>
          </div>

          {recentInquiries.length > 0 ? (
            <div className="space-y-3">
              {recentInquiries.map((inquiry) => (
                <div
                  key={inquiry.id}
                  onClick={() => navigate(`/inbox/${inquiry.id}`)}
                  className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition"
                >
                  {/* Status Indicator */}
                  <div
                    className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      inquiry.status === 'new'
                        ? 'bg-blue-500'
                        : inquiry.status === 'replied'
                          ? 'bg-green-500'
                          : 'bg-yellow-500'
                    }`}
                  ></div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900">{inquiry.talentName}</h3>
                      <span className="text-sm text-slate-500">{inquiry.date}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{inquiry.clientName}</p>
                    <p className="text-xs text-slate-500 mt-1">{inquiry.project}</p>
                  </div>

                  {/* Budget */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-slate-900">{formatCurrency(inquiry.budget)}</p>
                    <p className="text-xs text-slate-500 mt-1 capitalize">{inquiry.status}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">Tidak ada inquiry baru</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          {/* Pending Profiles Card */}
          {stats.pendingProfiles > 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2">Profile Menunggu Review</h3>
              <p className="text-sm text-yellow-800 mb-3">{stats.pendingProfiles} talent menunggu approval</p>
              <button
                onClick={() => navigate('/roster')}
                className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded font-semibold transition"
              >
                Review Sekarang
              </button>
            </div>
          )}

          {/* Contact Support Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
            <h3 className="font-semibold text-indigo-900 mb-2">Perlu Bantuan?</h3>
            <p className="text-sm text-indigo-800 mb-3">Tim kami siap membantu Anda 24/7</p>
            <button className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold transition">
              Hubungi Support
            </button>
          </div>

          {/* Earnings Progress */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h3 className="font-semibold text-slate-900 mb-3">Target Komisi Bulan Ini</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Progress</span>
                <span className="font-semibold text-slate-900">65%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
              <p className="text-xs text-slate-500 mt-2">Rp 20.000.000 / Rp 30.000.000</p>
            </div>
          </div>

          {/* Performance Badge */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">🏆</div>
            <h3 className="font-semibold text-green-900">Top Performer</h3>
            <p className="text-xs text-green-700 mt-1">Dalam top 10% agency di platform</p>
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Performa Talent (Bulan Ini)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Budi Santoso', bookings: 8, rating: 4.8, earnings: 45000000 },
            { name: 'Ella Singh', bookings: 12, rating: 4.9, earnings: 62000000 },
            { name: 'Citra Dewi', bookings: 6, rating: 4.7, earnings: 38000000 },
          ].map((talent) => (
            <div key={talent.name} className="border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900">{talent.name}</h3>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Booking</span>
                  <span className="font-semibold text-slate-900">{talent.bookings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Rating</span>
                  <span className="text-yellow-500 font-semibold">⭐ {talent.rating}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Komisi</span>
                  <span className="text-indigo-600 font-semibold">{formatCurrency(talent.earnings * 0.15)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
