// Inbox Page - Client Inquiries
// File: apps/appagency/src/pages/Inbox.tsx

import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

interface Inquiry {
  id: string
  talentName: string
  talentId: string
  clientName: string
  clientEmail: string
  project: string
  budget: number
  status: 'new' | 'replied' | 'negotiating' | 'declined' | 'accepted'
  message: string
  date: string
  lastActivityDate: string
}

const Inbox: React.FC = () => {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'all' | 'new' | 'replied' | 'negotiating' | 'declined' | 'accepted'>('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'budget_high' | 'budget_low'>('recent')

  const [inquiries, setInquiries] = useState<Inquiry[]>([
    {
      id: 'inq_1',
      talentName: 'Budi Santoso',
      talentId: 'talent_1',
      clientName: 'PT Mitra Digital',
      clientEmail: 'contact@mitradigital.com',
      project: 'Premium Content Creator',
      budget: 50000000,
      status: 'new',
      message:
        'Kami mencari content creator berpengalaman untuk kampanye 3 bulan. Fokus pada Instagram dan TikTok.',
      date: '2 jam lalu',
      lastActivityDate: '2024-04-10T10:00:00',
    },
    {
      id: 'inq_2',
      talentName: 'Ella Singh',
      talentId: 'talent_2',
      clientName: 'CV Kreatif Media',
      clientEmail: 'hello@kreatifmedia.com',
      project: 'Influencer Campaign',
      budget: 75000000,
      status: 'replied',
      message: 'Tertarik untuk campaign produk fashion selama 2 bulan. Budget fleksibel.',
      date: '5 jam lalu',
      lastActivityDate: '2024-04-10T08:00:00',
    },
    {
      id: 'inq_3',
      talentName: 'Citra Dewi',
      talentId: 'talent_3',
      clientName: 'Agensi Periklanan XYZ',
      clientEmail: 'project@agensixyz.com',
      project: 'Brand Ambassador',
      budget: 100000000,
      status: 'negotiating',
      message: 'Kami menawarkan kontrak brand ambassador untuk tahun penuh.',
      date: '1 hari lalu',
      lastActivityDate: '2024-04-09T14:00:00',
    },
  ])

  const filteredInquiries = useMemo(() => {
    let result = inquiries

    // Filter by status
    if (filter !== 'all') {
      result = result.filter((i) => i.status === filter)
    }

    // Filter by search
    if (search) {
      result = result.filter(
        (i) =>
          i.talentName.toLowerCase().includes(search.toLowerCase()) ||
          i.clientName.toLowerCase().includes(search.toLowerCase()) ||
          i.project.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.lastActivityDate).getTime() - new Date(b.lastActivityDate).getTime()
        case 'budget_high':
          return b.budget - a.budget
        case 'budget_low':
          return a.budget - b.budget
        case 'recent':
        default:
          return new Date(b.lastActivityDate).getTime() - new Date(a.lastActivityDate).getTime()
      }
    })

    return result
  }, [inquiries, filter, search, sortBy])

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800 border border-blue-300'
      case 'replied':
        return 'bg-green-100 text-green-800 border border-green-300'
      case 'negotiating':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300'
      case 'declined':
        return 'bg-red-100 text-red-800 border border-red-300'
      case 'accepted':
        return 'bg-purple-100 text-purple-800 border border-purple-300'
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

  const stats = {
    new: inquiries.filter((i) => i.status === 'new').length,
    replied: inquiries.filter((i) => i.status === 'replied').length,
    negotiating: inquiries.filter((i) => i.status === 'negotiating').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Inbox Inquiry</h1>
        <p className="text-slate-600 mt-1">Kelola semua inquiry klien untuk talent Anda</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Inquiry Baru', value: stats.new, icon: '🔔', color: 'from-blue-500 to-blue-600' },
          { label: 'Sudah Dibalas', value: stats.replied, icon: '✓', color: 'from-green-500 to-green-600' },
          { label: 'Sedang Nego', value: stats.negotiating, icon: '⚡', color: 'from-yellow-500 to-yellow-600' },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`bg-gradient-to-br ${stat.color} rounded-lg shadow p-4 text-white`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">{stat.label}</p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className="text-4xl opacity-50">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Cari talent, klien, atau project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Filter Status */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Semua Status</option>
            <option value="new">Inquiry Baru</option>
            <option value="replied">Sudah Dibalas</option>
            <option value="negotiating">Nego</option>
            <option value="declined">Ditolak</option>
            <option value="accepted">Diterima</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="recent">Terbaru Terlebih Dahulu</option>
            <option value="oldest">Terlama Terlebih Dahulu</option>
            <option value="budget_high">Budget Tertinggi</option>
            <option value="budget_low">Budget Terendah</option>
          </select>
        </div>
      </div>

      {/* Inquiries List */}
      {filteredInquiries.length > 0 ? (
        <div className="space-y-3">
          {filteredInquiries.map((inquiry) => (
            <div
              key={inquiry.id}
              onClick={() => navigate(`/inbox/${inquiry.id}`)}
              className="bg-white border-l-4 border-indigo-500 rounded-lg shadow hover:shadow-lg transition-all cursor-pointer p-4 hover:bg-slate-50"
            >
              <div className="flex items-start gap-4">
                {/* Status Dot */}
                <div className="flex-shrink-0 mt-1">
                  <div
                    className={`w-4 h-4 rounded-full ${
                      inquiry.status === 'new'
                        ? 'bg-blue-500 animate-pulse'
                        : inquiry.status === 'replied'
                          ? 'bg-green-500'
                          : inquiry.status === 'negotiating'
                            ? 'bg-yellow-500'
                            : 'bg-slate-400'
                    }`}
                  ></div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{inquiry.project}</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        {inquiry.talentName} • {inquiry.clientName}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-4 ${getStatusBadgeColor(inquiry.status)}`}>
                      {inquiry.status === 'new'
                        ? 'BARU'
                        : inquiry.status === 'replied'
                          ? 'DIBALAS'
                          : inquiry.status === 'negotiating'
                            ? 'NEGOSIASI'
                            : inquiry.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Message Preview */}
                  <p className="text-slate-600 mt-2 line-clamp-2">{inquiry.message}</p>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-slate-500">{inquiry.date}</span>
                      <span className="font-semibold text-indigo-600">{formatCurrency(inquiry.budget)}</span>
                    </div>
                    <div className="text-slate-400">→</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-xl text-slate-600 mb-4">📭 Tidak ada inquiry yang sesuai dengan filter</p>
          <p className="text-slate-500">Inquiry dari klien akan muncul di sini</p>
        </div>
      )}
    </div>
  )
}

export default Inbox
