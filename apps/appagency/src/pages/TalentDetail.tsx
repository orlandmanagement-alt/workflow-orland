// Talent Detail Page - Create/Edit Talent
// File: apps/appagency/src/pages/TalentDetail.tsx

import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

interface TalentDetailProps {
  mode?: 'create' | 'edit'
}

const TalentDetail: React.FC<TalentDetailProps> = ({ mode = 'create' }) => {
  const { talentId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEdit = mode === 'edit' && talentId

  const [formData, setFormData] = useState({
    name: 'Budi Santoso',
    email: 'budi@example.com',
    category: 'content_creator',
    bio: 'Saya adalah content creator berpengalaman dengan 50K followers',
    location: 'Jakarta, Indonesia',
    canLoginIndependently: true,
    portfolioEditLock: false,
    priceNegotiationLock: false,
    minimumRate: 10000000,
    maximumRate: 50000000,
    availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  })

  const [activeTab, setActiveTab] = useState<'basic' | 'settings' | 'portfolio' | 'pricing'>('basic')

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Simulated API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (isEdit) {
        alert('Talent updated successfully!')
        navigate(`/talent/${talentId}`)
      } else {
        alert('Talent created successfully! Invitation email sent.')
        navigate('/roster')
      }
    } catch (err) {
      setError('Gagal menyimpan data talent')
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    { value: 'content_creator', label: 'Content Creator' },
    { value: 'influencer', label: 'Influencer' },
    { value: 'model', label: 'Model' },
    { value: 'actor', label: 'Actor/Actress' },
    { value: 'musician', label: 'Musician' },
    { value: 'photographer', label: 'Photographer' },
    { value: 'videographer', label: 'Videographer' },
    { value: 'other', label: 'Other' },
  ]

  const daysOfWeek = [
    { value: 'monday', label: 'Senin' },
    { value: 'tuesday', label: 'Selasa' },
    { value: 'wednesday', label: 'Rabu' },
    { value: 'thursday', label: 'Kamis' },
    { value: 'friday', label: 'Jumat' },
    { value: 'saturday', label: 'Sabtu' },
    { value: 'sunday', label: 'Minggu' },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {isEdit ? 'Edit Talent' : 'Tambah Talent Baru'}
          </h1>
          <p className="text-slate-600 mt-1">
            {isEdit ? 'Update informasi talent Anda' : 'Daftarkan talent baru ke roster agency Anda'}
          </p>
        </div>
        <button
          onClick={() => navigate('/roster')}
          className="text-slate-600 hover:text-slate-900 text-lg"
        >
          ✕
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tabs */}
        <div className="border-b border-slate-200">
          <div className="flex gap-8 -mb-px">
            {['basic', 'settings', 'portfolio', 'pricing'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab as any)}
                className={`pb-4 px-2 font-medium border-b-2 transition ${
                  activeTab === tab
                    ? 'text-indigo-600 border-indigo-600'
                    : 'text-slate-600 border-transparent hover:text-slate-900'
                }`}
              >
                {tab === 'basic'
                  ? '📋 Dasar'
                  : tab === 'settings'
                    ? '⚙️ Settings'
                    : tab === 'portfolio'
                      ? '🎨 Portfolio'
                      : '💰 Pricing'}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Basic Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Nama</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Kategori</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Lokasi</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Kota, Negara"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Biografi</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Deskripsikan keahlian dan pengalaman talent..."
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={formData.canLoginIndependently}
                    onChange={(e) => handleInputChange('canLoginIndependently', e.target.checked)}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                  />
                  <div>
                    <p className="font-semibold text-slate-900">Izinkan Login Independen</p>
                    <p className="text-sm text-slate-600">
                      Talent dapat login dan mengelola profil mereka sendiri
                    </p>
                  </div>
                </label>
              </div>

              <div>
                <label className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={formData.portfolioEditLock}
                    onChange={(e) => handleInputChange('portfolioEditLock', e.target.checked)}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                  />
                  <div>
                    <p className="font-semibold text-slate-900">Kunci Portfolio</p>
                    <p className="text-sm text-slate-600">
                      Talent tidak dapat mengedit portfolio mereka
                    </p>
                  </div>
                </label>
              </div>

              <div>
                <label className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={formData.priceNegotiationLock}
                    onChange={(e) => handleInputChange('priceNegotiationLock', e.target.checked)}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                  />
                  <div>
                    <p className="font-semibold text-slate-900">Kunci Harga</p>
                    <p className="text-sm text-slate-600">
                      Talent tidak dapat bernegosiasi harga dengan klien
                    </p>
                  </div>
                </label>
              </div>

              {!formData.canLoginIndependently && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    💡 Talent ini akan dikelola sepenuhnya oleh Anda melalui fitur impersonation
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Portfolio Tab */}
          {activeTab === 'portfolio' && (
            <div className="space-y-6">
              <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                <p className="text-slate-600">📸</p>
                <p className="text-slate-900 font-semibold mt-2">Portfolio akan dimulai dengan buka impersonation</p>
                <p className="text-sm text-slate-600 mt-1">Talent dapat menambah konten mereka setelah approval</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Hari Disponibilitas</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {daysOfWeek.map((day) => (
                    <label key={day.value} className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={formData.availableDays.includes(day.value)}
                        onChange={(e) => {
                          const newDays = e.target.checked
                            ? [...formData.availableDays, day.value]
                            : formData.availableDays.filter((d) => d !== day.value)
                          handleInputChange('availableDays', newDays)
                        }}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span className="text-sm font-medium text-slate-700">{day.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Pricing Tab */}
          {activeTab === 'pricing' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Harga Minimum</label>
                  <div className="flex items-center">
                    <span className="text-slate-600 mr-2">Rp</span>
                    <input
                      type="number"
                      value={formData.minimumRate}
                      onChange={(e) => handleInputChange('minimumRate', parseInt(e.target.value))}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Harga Maksimum</label>
                  <div className="flex items-center">
                    <span className="text-slate-600 mr-2">Rp</span>
                    <input
                      type="number"
                      value={formData.maximumRate}
                      onChange={(e) => handleInputChange('maximumRate', parseInt(e.target.value))}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-900">
                  💡 Komisi agency 15% akan dihitung otomatis dari setiap booking
                </p>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <p className="font-semibold text-indigo-900 mb-2">Contoh Perhitungan:</p>
                <p className="text-sm text-indigo-800">
                  Jika talent mendapat booking Rp 10 juta:
                </p>
                <p className="text-sm text-indigo-800 mt-1">
                  • Komisi Agency: Rp 1.500.000 (15%)
                </p>
                <p className="text-sm text-indigo-800">
                  • Penghasilan Talent: Rp 8.500.000 (85%)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => navigate('/roster')}
            className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : isEdit ? 'Update Talent' : 'Buat Talent'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default TalentDetail
