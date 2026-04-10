// Onboarding Page
// File: apps/appagency/src/pages/Onboarding.tsx

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const Onboarding: React.FC = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const handleNext = async () => {
    if (step === 4) {
      setLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      localStorage.setItem('cachedUser', JSON.stringify({
        id: 'agency_new',
        email: 'newagency@example.com',
        name: 'New Agency',
        role: 'agency',
      }))
      
      navigate('/')
    } else {
      setStep(step + 1)
    }
  }

  const steps = [
    {
      title: 'Selamat Datang!',
      description: 'Mari mulai dengan mengatur agency Anda',
      content: (
        <div className="text-center">
          <div className="text-6xl mb-4">👋</div>
          <p className="text-slate-600 mb-6">Kami senang menyambut Anda di Orland Agency Management Platform</p>
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-left">
            <p className="text-sm text-indigo-900">Platform kami membantu Anda:</p>
            <ul className="text-sm text-indigo-900 mt-2 space-y-1">
              <li>✓ Mengelola talent dengan mudah</li>
              <li>✓ Menangani inquiry dari klien</li>
              <li>✓ Tracking revenue dan performance</li>
              <li>✓ Mengoptimalkan earnings</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: 'Informasi Agency',
      description: 'Beritahu kami tentang agency Anda',
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Nama Agency</label>
            <input
              type="text"
              placeholder="PT Nama Anda"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Website (Opsional)</label>
            <input
              type="url"
              placeholder="https://agency.com"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Jenis Talent</label>
            <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option>Content Creator</option>
              <option>Influencer</option>
              <option>Model</option>
              <option>Musician</option>
              <option>Multiple</option>
            </select>
          </div>
        </div>
      ),
    },
    {
      title: 'Kelola Talent',
      description: 'Mulai dengan menambah talent pertama Anda',
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6 text-center">
            <p className="text-3xl mb-2">👥</p>
            <p className="font-semibold text-slate-900">Tambahkan Talent Anda</p>
            <p className="text-sm text-slate-600 mt-2">Kelola semua talent Anda dalam satu dashboard</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-slate-900 mb-2">Fitur:</p>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>✓ Buat profil talent tanpa perlu email mereka</li>
              <li>✓ Atur harga dan availability</li>
              <li>✓ Lock portfolio jika perlu</li>
              <li>✓ Impersonation mode untuk setup</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: 'Selesai!',
      description: 'Agency Anda siap digunakan',
      content: (
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <p className="text-slate-600 mb-6">Selamat! Agency Anda sudah siap.</p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-green-900 mb-2">Next Steps:</p>
            <p className="text-sm text-green-800">1. Buat talent pertama Anda</p>
            <p className="text-sm text-green-800 mt-1">2. Setup komisi dan pricing</p>
            <p className="text-sm text-green-800 mt-1">3. Mulai terima inquiry dari klien</p>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1 rounded-full transition-all ${
                  s <= step ? 'bg-indigo-500' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{steps[step - 1].title}</h1>
          <p className="text-slate-600 mb-6">{steps[step - 1].description}</p>

          {/* Content */}
          <div className="mb-8">{steps[step - 1].content}</div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Kembali
            </button>
            <button
              onClick={handleNext}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : step === 4 ? 'Selesai' : 'Lanjut'}
            </button>
          </div>

          {/* Step indicator */}
          <p className="text-center text-sm text-slate-500 mt-4">
            Step {step} dari 4
          </p>
        </div>
      </div>
    </div>
  )
}

export default Onboarding
