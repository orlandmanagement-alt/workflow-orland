// Settings Page
// File: apps/appagency/src/pages/Settings.tsx

import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../middleware/authMiddlewareExtended'

interface SettingsProps {
  tab?: 'account' | 'billing' | 'kyc' | 'security'
}

const Settings: React.FC<SettingsProps> = ({ tab: initialTab = 'account' }) => {
  const [searchParams] = useSearchParams()
  const tab = (searchParams.get('tab') as any) || initialTab
  const [activeTab, setActiveTab] = useState<'account' | 'billing' | 'kyc' | 'security'>(tab)
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setSaving(false)
    alert('Settings saved successfully!')
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Pengaturan</h1>
        <p className="text-slate-600 mt-1">Kelola akun dan preferensi agency Anda</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-8 -mb-px">
          {['account', 'billing', 'kyc', 'security'].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t as any)}
              className={`pb-4 px-2 font-medium border-b-2 transition ${
                activeTab === t
                  ? 'text-indigo-600 border-indigo-600'
                  : 'text-slate-600 border-transparent hover:text-slate-900'
              }`}
            >
              {t === 'account'
                ? '👤 Akun'
                : t === 'billing'
                  ? '💳 Billing'
                  : t === 'kyc'
                    ? '🆔 KYC/KBB'
                    : '🔐 Keamanan'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Nama Perusahaan</label>
                <input
                  type="text"
                  defaultValue="PT Bintang Talent"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Email</label>
                <input
                  type="email"
                  defaultValue={user?.email}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 cursor-not-allowed"
                  disabled
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Nomor Telepon</label>
              <input
                type="tel"
                defaultValue="+62 812 3456 7890"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Alamat</label>
              <textarea
                defaultValue="Jl. Example No. 123, Jakarta, Indonesia"
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Metode Pembayaran</h3>
              <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                <p className="text-slate-600">💳 Tidak ada metode pembayaran yang terdaftar</p>
                <button className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition">
                  Tambah Metode Pembayaran
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Riwayat Invoice</h3>
              <div className="space-y-3">
                {[
                  { id: 'INV-001', date: '2024-04-01', amount: 'Rp 2.500.000', status: 'paid' },
                  { id: 'INV-002', date: '2024-03-01', amount: 'Rp 2.500.000', status: 'paid' },
                ].map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                    <div>
                      <p className="font-semibold text-slate-900">{invoice.id}</p>
                      <p className="text-sm text-slate-600">{invoice.date}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-semibold text-slate-900">{invoice.amount}</p>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                        Dibayar
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* KYC Tab */}
        {activeTab === 'kyc' && (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-900">
                ⚠️ KYC/KBB diperlukan untuk verifikasi akun. Status saat ini: <strong>Pending</strong>
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Nomor Identitas (KTP/Paspor)</label>
              <input
                type="text"
                placeholder="e.g., 1234567890123456"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Nomor NPWP</label>
              <input
                type="text"
                placeholder="Nomor Pokok Wajib Pajak"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Nomor Registrasi Bisnis</label>
              <input
                type="text"
                placeholder="NIB atau dokumen bisnis lainnya"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
              >
                {saving ? 'Mengirim...' : 'Submit KYC/KBB'}
              </button>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Ubah Password</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Password Lama</label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Password Baru</label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Konfirmasi Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
              >
                {saving ? 'Mengupdate...' : 'Update Password'}
              </button>
            </div>

            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Active Sessions</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
                  <div>
                    <p className="font-semibold text-slate-900">Chrome on Windows</p>
                    <p className="text-sm text-slate-600">Last active: Just now</p>
                  </div>
                  <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-1 rounded">AKTIF</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Settings
