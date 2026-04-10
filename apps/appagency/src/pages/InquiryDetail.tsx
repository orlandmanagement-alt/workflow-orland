// Inquiry Detail Page
// File: apps/appagency/src/pages/InquiryDetail.tsx

import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const InquiryDetail: React.FC = () => {
  const { inquiryId } = useParams()
  const navigate = useNavigate()
  const [replyMessage, setReplyMessage] = useState('')
  const [replying, setReplying] = useState(false)

  const inquiry = {
    id: inquiryId,
    talentName: 'Budi Santoso',
    clientName: 'PT Mitra Digital',
    clientEmail: 'contact@mitradigital.com',
    project: 'Premium Content Creator - 3 Bulan Campaign',
    budget: 50000000,
    status: 'new' as const,
    message: 'Kami mencari content creator berpengalaman untuk kampanye 3 bulan. Fokus pada Instagram dan TikTok dengan minimal 50K followers.',
    date: '2024-04-10T10:00:00',
    talentRate: {
      min: 10000000,
      max: 50000000,
    },
  }

  const handleReply = async () => {
    setReplying(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setReplying(false)
    setReplyMessage('')
    alert('Reply sent to client!')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div>
      <button
        onClick={() => navigate('/inbox')}
        className="mb-4 text-indigo-600 hover:text-indigo-700 font-semibold"
      >
        ← Kembali ke Inbox
      </button>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{inquiry.project}</h1>
              <p className="text-slate-600 mt-1">Dari: {inquiry.clientName}</p>
            </div>
            <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-semibold">BARU</span>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-slate-600">Budget Klien</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(inquiry.budget)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Rate Talent</p>
              <p className="text-sm text-slate-900">
                {formatCurrency(inquiry.talentRate.min)} - {formatCurrency(inquiry.talentRate.max)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Komisi Agency (15%)</p>
              <p className="text-2xl font-bold text-indigo-600">
                {formatCurrency((inquiry.budget * 0.15 * 0.85) / 0.85)}
              </p>
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Pesan dari Klien</h2>
          <p className="text-slate-700 leading-relaxed">{inquiry.message}</p>
          <p className="text-sm text-slate-500 mt-4">{inquiry.date}</p>
        </div>

        {/* Reply Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Balas Inquiry</h2>
          <div className="space-y-4">
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Tulis balasan Anda untuk klien..."
              rows={5}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div className="flex gap-4">
              <button
                disabled={!replyMessage || replying}
                onClick={handleReply}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                {replying ? 'Mengirim...' : 'Kirim Balasan'}
              </button>
              <button
                onClick={() => {
                  setReplyMessage('')
                }}
                className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
              >
                Batal
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Tindakan Lainnya</h2>
          <div className="grid grid-cols-2 gap-4">
            <button className="px-4 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition">
              Arahkan ke Talent
            </button>
            <button className="px-4 py-3 border border-red-300 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition">
              Tolak Inquiry
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InquiryDetail
