// Analytics Page
// File: apps/appagency/src/pages/Analytics.tsx

import React from 'react'

const Analytics: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Analytics & Insights</h1>
        <p className="text-slate-600 mt-1">Pantau performa talent dan revenue Anda</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: 'Rp 225.000.000', trend: '+12%', color: 'from-indigo-500' },
          { label: 'Total Booking', value: '26', trend: '+8%', color: 'from-purple-500' },
          { label: 'Avg Rating', value: '4.8⭐', trend: '+0.2', color: 'from-yellow-500' },
          { label: 'Response Rate', value: '95%', trend: '+5%', color: 'from-green-500' },
        ].map((metric) => (
          <div key={metric.label} className={`bg-gradient-to-br ${metric.color} to-pink-600 rounded-lg shadow p-6 text-white`}>
            <p className="text-sm opacity-90">{metric.label}</p>
            <p className="text-2xl font-bold mt-2">{metric.value}</p>
            <p className="text-xs opacity-75 mt-2">📈 {metric.trend}</p>
          </div>
        ))}
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Revenue Trend (6 Bulan)</h2>
          <div className="h-64 bg-slate-100 rounded flex items-center justify-center">
            <div className="text-center">
              <p className="text-slate-600">📊 Chart akan ditampilkan di sini</p>
              <p className="text-sm text-slate-500 mt-2">Menggunakan Recharts atau Chart.js</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Talent Performance</h2>
          <div className="h-64 bg-slate-100 rounded flex items-center justify-center">
            <div className="text-center">
              <p className="text-slate-600">📈 Chart akan ditampilkan di sini</p>
              <p className="text-sm text-slate-500 mt-2">Top performing talents</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Talents */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-6">Top Performing Talents</h2>
        <div className="space-y-4">
          {[
            { name: 'Ella Singh', bookings: 12, earnings: 62000000, rating: 4.9 },
            { name: 'Budi Santoso', bookings: 8, earnings: 45000000, rating: 4.8 },
            { name: 'Citra Dewi', bookings: 6, earnings: 38000000, rating: 4.7 },
          ].map((talent) => (
            <div
              key={talent.name}
              className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              <div>
                <p className="font-semibold text-slate-900">{talent.name}</p>
                <p className="text-sm text-slate-600">{talent.bookings} bookings • ⭐ {talent.rating}</p>
              </div>
              <p className="font-bold text-indigo-600">
                Rp {(talent.earnings * 0.15).toLocaleString('id-ID')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Analytics
