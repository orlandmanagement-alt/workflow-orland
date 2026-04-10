// File: apps/appclient/src/components/workspace/EOWorkspace/ScannerDashboard.tsx
// Component untuk scan QR code dan manage gate passes

import React, { useEffect, useRef, useState } from 'react'
import { QrCode, Users, CheckCircle2, XCircle, AlertCircle, Filter } from 'lucide-react'
import { useEOWorkspaceStore } from '../../../store/useEOWorkspaceStore'

export interface ScannerDashboardProps {
  projectId: string
}

export const ScannerDashboard: React.FC<ScannerDashboardProps> = ({ projectId }) => {
  const {
    gatePasses,
    scannerFilter,
    setScannerFilter,
    scanPass,
    isScanning,
    getFilteredPasses,
  } = useEOWorkspaceStore()

  const [passInput, setPassInput] = useState('')
  const [lastScanned, setLastScanned] = useState<string | null>(null)
  const [scanMessage, setScanMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredPasses = getFilteredPasses()
  const stats = {
    total: gatePasses.length,
    present: gatePasses.filter((p) => p.is_present === 1).length,
    absent: gatePasses.filter((p) => p.is_present === -1).length,
    not_arrived: gatePasses.filter((p) => p.is_present === 0).length,
  }

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleScan = async () => {
    if (!passInput.trim()) return

    const passCode = passInput.trim()
    setPassInput('')
    setScanMessage('')

    try {
      await scanPass(passCode)
      setLastScanned(passCode)
      setScanMessage(`✓ ${passCode} - Checked in!`)
      setTimeout(() => setScanMessage(''), 3000)
    } catch (error) {
      setScanMessage(`✗ Invalid pass code: ${passCode}`)
      setTimeout(() => setScanMessage(''), 3000)
    }

    inputRef.current?.focus()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Scanner Panel */}
      <div className="lg:col-span-1 space-y-4">
        {/* Stats Cards */}
        <div className="space-y-2">
          <div
            className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 cursor-pointer hover:border-slate-600 transition-all"
            onClick={() => setScannerFilter('all')}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Total Expected</span>
              <Users size={18} className="text-slate-500" />
            </div>
            <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
          </div>

          <div
            className={`bg-slate-800/50 border rounded-lg p-3 cursor-pointer hover:border-slate-600 transition-all ${
              scannerFilter === 'present' ? 'border-green-600' : 'border-slate-700'
            }`}
            onClick={() => setScannerFilter('present')}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Present</span>
              <CheckCircle2 size={18} className="text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-400 mt-1">{stats.present}</p>
          </div>

          <div
            className={`bg-slate-800/50 border rounded-lg p-3 cursor-pointer hover:border-slate-600 transition-all ${
              scannerFilter === 'not_arrived' ? 'border-yellow-600' : 'border-slate-700'
            }`}
            onClick={() => setScannerFilter('not_arrived')}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Not Arrived</span>
              <AlertCircle size={18} className="text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.not_arrived}</p>
          </div>

          <div
            className={`bg-slate-800/50 border rounded-lg p-3 cursor-pointer hover:border-slate-600 transition-all ${
              scannerFilter === 'absent' ? 'border-red-600' : 'border-slate-700'
            }`}
            onClick={() => setScannerFilter('absent')}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Absent</span>
              <XCircle size={18} className="text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-400 mt-1">{stats.absent}</p>
          </div>
        </div>

        {/* Scanner Input */}
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-white">
            <QrCode size={20} />
            <span className="text-sm font-semibold">Scan Pass Code</span>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={passInput}
            onChange={(e) => setPassInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleScan()
            }}
            placeholder="Point scanner here..."
            className="w-full bg-white/20 border border-white/30 rounded px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white text-center text-lg font-mono tracking-widest"
          />

          <button
            onClick={handleScan}
            disabled={isScanning || !passInput.trim()}
            className="w-full px-4 py-2 bg-white text-blue-600 font-semibold rounded hover:bg-slate-100 disabled:opacity-50 transition-all"
          >
            {isScanning ? 'Processing...' : 'Scan'}
          </button>

          {scanMessage && (
            <div
              className={`px-3 py-2 rounded text-sm font-medium text-center ${
                scanMessage.includes('✓')
                  ? 'bg-green-600/30 text-green-300 border border-green-600/50'
                  : 'bg-red-600/30 text-red-300 border border-red-600/50'
              }`}
            >
              {scanMessage}
            </div>
          )}
        </div>
      </div>

      {/* Pass List */}
      <div className="lg:col-span-2">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">
            Passes ({filteredPasses.length})
          </h3>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredPasses.map((pass) => (
              <div
                key={pass.id}
                className={`bg-slate-800/50 backdrop-blur-sm border rounded-lg p-3 transition-all ${
                  pass.is_present === 1
                    ? 'border-green-700 bg-green-600/10'
                    : pass.is_present === -1
                      ? 'border-red-700 bg-red-600/10'
                      : 'border-slate-700'
                } ${lastScanned === pass.pass_code ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">{pass.talent_name}</h4>
                    <p className="text-xs text-slate-400 font-mono">{pass.pass_code}</p>

                    <div className="flex gap-2 mt-2 text-xs">
                      <span className="px-2 py-1 bg-slate-700 rounded text-slate-300">
                        {pass.pass_type}
                      </span>
                      {pass.is_present === 1 && (
                        <span className="px-2 py-1 bg-green-600/30 text-green-400 rounded">
                          ✓ Checked in
                        </span>
                      )}
                      {pass.is_present === -1 && (
                        <span className="px-2 py-1 bg-red-600/30 text-red-400 rounded">
                          ✗ Absent
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-slate-400">
                    {pass.scanned_at
                      ? new Date(pass.scanned_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredPasses.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <Users size={32} className="mx-auto mb-2 opacity-50" />
              <p>No passes in this category</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
