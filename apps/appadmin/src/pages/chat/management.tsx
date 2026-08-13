import { useState, useEffect } from 'react'
import { Search, Filter, Trash2, Eye, AlertCircle, Loader2, MessageSquare, Users, TrendingUp } from 'lucide-react'
import axios from 'axios'

const API_BASE = 'https://api.orlandmanagement.com/api/v1/admin'

interface ChatThread {
  thread_id: string
  project_id: string
  client_id: string
  talent_id: string
  subject: string
  is_archived: number
  created_at: string
  last_message_at: string
  message_count: number
  flagged_count: number
}

interface ModerationLog {
  moderation_id: string
  message_id?: string
  thread_id: string
  reason: string
  action_taken: string
  created_at: string
}

export default function AdminChatManagement() {
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [moderationLogs, setModerationLogs] = useState<ModerationLog[]>([])
  const [statistics, setStatistics] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'chats' | 'moderation' | 'stats'>('chats')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archived' | 'flagged'>('all')
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showModerationModal, setShowModerationModal] = useState(false)
  const [moderationReason, setModerationReason] = useState('')
  const [moderationAction, setModerationAction] = useState<'flag' | 'delete' | 'suspend'>('flag')

  useEffect(() => {
    if (activeTab === 'chats') {
      fetchThreads()
    } else if (activeTab === 'moderation') {
      fetchModerationLogs()
    } else if (activeTab === 'stats') {
      fetchStatistics()
    }
  }, [activeTab])

  const fetchThreads = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search: searchQuery,
        status: filterStatus,
        limit: '50',
      })

      const response = await axios.get(`${API_BASE}/chats?${params}`, {
        withCredentials: true,
      })

      if (response.data.success) {
        setThreads(response.data.data)
        setError(null)
      }
    } catch (err) {
      console.error('Error fetching chats:', err)
      setError('Gagal memuat chat')
    } finally {
      setLoading(false)
    }
  }

  const fetchModerationLogs = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE}/moderation-logs?limit=100`, {
        withCredentials: true,
      })

      if (response.data.success) {
        setModerationLogs(response.data.data)
        setError(null)
      }
    } catch (err) {
      console.error('Error fetching moderation logs:', err)
      setError('Gagal memuat log moderasi')
    } finally {
      setLoading(false)
    }
  }

  const fetchStatistics = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE}/statistics`, {
        withCredentials: true,
      })

      if (response.data.success) {
        setStatistics(response.data.data)
        setError(null)
      }
    } catch (err) {
      console.error('Error fetching statistics:', err)
      setError('Gagal memuat statistik')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteThread = async (threadId: string) => {
    if (!confirm('Anda yakin ingin menghapus chat thread ini? Tindakan ini tidak dapat dibatalkan.')) return

    try {
      await axios.delete(`${API_BASE}/chats/${threadId}`, {
        withCredentials: true,
      })

      setThreads(threads.filter(t => t.thread_id !== threadId))
      alert('Chat berhasil dihapus')
    } catch (err) {
      console.error('Error deleting thread:', err)
      setError('Gagal menghapus chat')
    }
  }

  const handleViewThread = async (thread: ChatThread) => {
    setSelectedThread(thread)
    setShowDetailModal(true)
  }

  const handleSubmitModeration = async () => {
    if (!selectedThread || !moderationReason) return

    try {
      await axios.post(
        `${API_BASE}/moderate`,
        {
          thread_id: selectedThread.thread_id,
          action: moderationAction,
          reason: moderationReason,
        },
        { withCredentials: true }
      )

      setShowModerationModal(false)
      setModerationReason('')
      setModerationAction('flag')
      fetchThreads()
      alert('Moderasi berhasil diterapkan')
    } catch (err) {
      console.error('Error applying moderation:', err)
      setError('Gagal menerapkan moderasi')
    }
  }

  const filteredThreads = threads.filter(thread =>
    thread.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    thread.thread_id?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Manajemen Chat & Moderasi
        </h1>
        <p className="text-slate-500">Kelola chat antar klien dan talent, dan pantau aktivitas moderasi</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-slate-200 dark:border-slate-700">
        {(['chats', 'moderation', 'stats'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab === 'chats' && <span className="flex items-center gap-2"><MessageSquare size={18} /> Chat</span>}
            {tab === 'moderation' && <span className="flex items-center gap-2"><AlertCircle size={18} /> Moderasi</span>}
            {tab === 'stats' && <span className="flex items-center gap-2"><TrendingUp size={18} /> Statistik</span>}
          </button>
        ))}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
          <div>
            <p className="text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-600 dark:text-red-400 text-sm mt-1 hover:underline"
            >
              ✕ Tutup
            </button>
          </div>
        </div>
      )}

      {/* CHATS TAB */}
      {activeTab === 'chats' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input
                placeholder="Cari chat atau thread..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'active', 'archived', 'flagged'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
                    filterStatus === status
                      ? 'bg-brand-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {status === 'all' && 'Semua'}
                  {status === 'active' && 'Aktif'}
                  {status === 'archived' && 'Arsip'}
                  {status === 'flagged' && 'Ditandai'}
                </button>
              ))}
            </div>
          </div>

          {/* Chat List */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 size={32} className="animate-spin text-brand-500" />
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              Tidak ada chat ditemukan
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Subject</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Pesan</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Terakhir</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900 dark:text-white">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredThreads.map(thread => (
                    <tr key={thread.thread_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{thread.subject}</p>
                          <p className="text-xs text-slate-500">{thread.thread_id}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {thread.message_count}
                        {thread.flagged_count > 0 && (
                          <span className="ml-2 inline-block px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-full">
                            {thread.flagged_count} ditandai
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            thread.is_archived === 1
                              ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          }`}
                        >
                          {thread.is_archived === 1 ? 'Arsip' : 'Aktif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {new Date(thread.last_message_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleViewThread(thread)}
                          className="text-blue-500 hover:text-blue-700 mr-3"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteThread(thread.thread_id)}
                          className="text-red-500 hover:text-red-700 inline-block"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODERATION TAB */}
      {activeTab === 'moderation' && (
        <div>
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 size={32} className="animate-spin text-brand-500" />
            </div>
          ) : moderationLogs.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              Tidak ada log moderasi
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Thread</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Alasan</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Aksi</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {moderationLogs.map(log => (
                    <tr key={log.moderation_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                        {log.thread_id}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {log.reason}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            log.action_taken === 'deleted'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                              : log.action_taken === 'flagged'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          }`}
                        >
                          {log.action_taken}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {new Date(log.created_at).toLocaleDateString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* STATS TAB */}
      {activeTab === 'stats' && (
        <div>
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 size={32} className="animate-spin text-brand-500" />
            </div>
          ) : statistics ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                label="Total Thread Aktif"
                value={statistics.active_threads?.toString() || '0'}
                icon={<MessageSquare />}
                color="blue"
              />
              <StatCard
                label="Total Thread"
                value={statistics.total_threads?.toString() || '0'}
                icon={<Users />}
                color="purple"
              />
              <StatCard
                label="Total Pesan"
                value={statistics.total_messages?.toString() || '0'}
                icon={<MessageSquare />}
                color="green"
              />
              <StatCard
                label="Total Moderasi"
                value={statistics.total_moderation_actions?.toString() || '0'}
                icon={<AlertCircle />}
                color="orange"
              />
              <StatCard
                label="Pesan Dihapus"
                value={statistics.deleted_messages?.toString() || '0'}
                icon={<Trash2 />}
                color="red"
              />
              <StatCard
                label="Pesan Ditandai"
                value={statistics.flagged_messages?.toString() || '0'}
                icon={<AlertCircle />}
                color="yellow"
              />
            </div>
          ) : null}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedThread && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedThread.subject}</h2>
                <p className="text-slate-500 text-sm mt-1">{selectedThread.thread_id}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-500 hover:text-slate-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Klien ID</p>
                  <p className="font-medium text-slate-900 dark:text-white">{selectedThread.client_id}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Talent ID</p>
                  <p className="font-medium text-slate-900 dark:text-white">{selectedThread.talent_id}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Total Pesan</p>
                  <p className="font-medium text-slate-900 dark:text-white">{selectedThread.message_count}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Status</p>
                  <p className={`font-medium ${selectedThread.is_archived ? 'text-slate-600' : 'text-green-600'}`}>
                    {selectedThread.is_archived ? 'Arsip' : 'Aktif'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => {
                    setShowDetailModal(false)
                    setShowModerationModal(true)
                  }}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Terapkan Moderasi
                </button>
                <button
                  onClick={() => {
                    handleDeleteThread(selectedThread.thread_id)
                    setShowDetailModal(false)
                  }}
                  className="flex-1 px-4 py-2.5 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Hapus Thread
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Moderation Modal */}
      {showModerationModal && selectedThread && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Terapkan Moderasi</h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-white mb-2">Aksi</label>
                <select
                  value={moderationAction}
                  onChange={(e) => setModerationAction(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="flag">Tandai</option>
                  <option value="delete">Hapus</option>
                  <option value="suspend">Suspend</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-white mb-2">Alasan</label>
                <textarea
                  value={moderationReason}
                  onChange={(e) => setModerationReason(e.target.value)}
                  placeholder="Jelaskan alasan moderasi..."
                  rows={4}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowModerationModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmitModeration}
                  disabled={!moderationReason}
                  className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
                >
                  Terapkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string
  icon: React.ReactNode
  color: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'yellow'
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  const colorMap = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
      <div className={`inline-block p-3 rounded-lg ${colorMap[color]} mb-4`}>{icon}</div>
      <p className="text-slate-500 text-sm mb-1">{label}</p>
      <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  )
}
