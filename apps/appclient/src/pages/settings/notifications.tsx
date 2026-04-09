import { useState, useEffect } from 'react'
import { Bell, Mail, Smartphone, Volume2, Clock, AlertCircle, Loader2 } from 'lucide-react'
import axios from 'axios'

const API_BASE = 'https://api.orlandmanagement.com/api/v1'

interface NotificationSettings {
  setting_id?: string
  user_id?: string
  // Messages
  msg_enabled: number
  msg_via_email: number
  msg_via_push: number
  msg_sound: number
  // Projects
  project_enabled: number
  project_updates: number
  project_assignments: number
  project_via_email: number
  project_via_push: number
  // Talent
  talent_request_enabled: number
  talent_approval_enabled: number
  talent_via_email: number
  talent_via_push: number
  // Payment
  payment_enabled: number
  invoice_enabled: number
  payment_via_email: number
  payment_via_push: number
  // Booking
  booking_enabled: number
  booking_via_email: number
  booking_via_push: number
  // System
  system_enabled: number
  system_urgent_only: number
  // Schedule
  schedule_reminder_24h: number
  schedule_reminder_1h: number
  schedule_via_email: number
  schedule_via_push: number
  schedule_via_sms: number
  // Quiet hours
  quiet_hours_enabled: number
  quiet_hours_start?: string
  quiet_hours_end?: string
}

export default function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Categories for notification types
  const notificationCategories = [
    {
      id: 'messages',
      name: 'Pesan & Chat',
      description: 'Notifikasi untuk pesan baru dari klien dan talent',
      settings: ['msg_enabled', 'msg_via_email', 'msg_via_push', 'msg_sound'],
    },
    {
      id: 'projects',
      name: 'Proyek',
      description: 'Update status proyek, penugasan, dan deadline',
      settings: ['project_enabled', 'project_updates', 'project_assignments', 'project_via_email', 'project_via_push'],
    },
    {
      id: 'talent',
      name: 'Talent & Request',
      description: 'Notifikasi talent yang baru dan approval request',
      settings: ['talent_request_enabled', 'talent_approval_enabled', 'talent_via_email', 'talent_via_push'],
    },
    {
      id: 'payment',
      name: 'Pembayaran & Invoice',
      description: 'Notifikasi pembayaran, invoice, dan keuangan',
      settings: ['payment_enabled', 'invoice_enabled', 'payment_via_email', 'payment_via_push'],
    },
    {
      id: 'booking',
      name: 'Booking',
      description: 'Notifikasi konfirmasi booking dan jadwal',
      settings: ['booking_enabled', 'booking_via_email', 'booking_via_push'],
    },
    {
      id: 'system',
      name: 'Sistem',
      description: 'Notifikasi sistem dan pembaruan penting',
      settings: ['system_enabled', 'system_urgent_only'],
    },
  ]

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE}/notifications/settings`, {
        withCredentials: true,
      })

      if (response.data.success) {
        setSettings(response.data.data)
        setError(null)
      }
    } catch (err) {
      console.error('Error fetching settings:', err)
      setError('Gagal memuat pengaturan notifikasi')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = (key: keyof NotificationSettings) => {
    if (settings) {
      setSettings({
        ...settings,
        [key]: settings[key] === 1 ? 0 : 1,
      })
    }
  }

  const handleTimeChange = (key: 'quiet_hours_start' | 'quiet_hours_end', value: string) => {
    if (settings) {
      setSettings({
        ...settings,
        [key]: value,
      })
    }
  }

  const handleSave = async () => {
    if (!settings) return

    setSaving(true)
    try {
      const response = await axios.put(
        `${API_BASE}/notifications/settings`,
        settings,
        { withCredentials: true }
      )

      if (response.data.success) {
        setSuccess(true)
        setError(null)
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (err) {
      console.error('Error saving settings:', err)
      setError('Gagal menyimpan pengaturan')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-brand-500" />
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="text-center py-20 text-slate-500">
        Gagal memuat pengaturan notifikasi
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Bell size={28} className="text-brand-500" />
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Pengaturan Notifikasi</h1>
        </div>
        <p className="text-slate-500">Atur preferensi notifikasi untuk berbagai tipe aktivitas</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-green-700 dark:text-green-300">✓ Pengaturan berhasil disimpan</p>
        </div>
      )}

      {/* Notification Categories */}
      <div className="space-y-6 mb-8">
        {notificationCategories.map(category => (
          <div
            key={category.id}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 overflow-hidden"
          >
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{category.name}</h3>
              <p className="text-sm text-slate-500">{category.description}</p>
            </div>

            <div className="space-y-4">
              {category.id === 'messages' && (
                <>
                  <ToggleRow
                    label="Aktifkan notifikasi pesan"
                    checked={settings.msg_enabled === 1}
                    onChange={() => handleToggle('msg_enabled')}
                  />
                  {settings.msg_enabled === 1 && (
                    <>
                      <ToggleRow
                        label="Kirim via Email"
                        checked={settings.msg_via_email === 1}
                        onChange={() => handleToggle('msg_via_email')}
                        sublevel
                        icon={<Mail size={16} />}
                      />
                      <ToggleRow
                        label="Kirim via Push Notification"
                        checked={settings.msg_via_push === 1}
                        onChange={() => handleToggle('msg_via_push')}
                        sublevel
                        icon={<Smartphone size={16} />}
                      />
                      <ToggleRow
                        label="Bunyikan suara notifikasi"
                        checked={settings.msg_sound === 1}
                        onChange={() => handleToggle('msg_sound')}
                        sublevel
                        icon={<Volume2 size={16} />}
                      />
                    </>
                  )}
                </>
              )}

              {category.id === 'projects' && (
                <>
                  <ToggleRow
                    label="Aktifkan notifikasi proyek"
                    checked={settings.project_enabled === 1}
                    onChange={() => handleToggle('project_enabled')}
                  />
                  {settings.project_enabled === 1 && (
                    <>
                      <ToggleRow
                        label="Update status proyek"
                        checked={settings.project_updates === 1}
                        onChange={() => handleToggle('project_updates')}
                        sublevel
                      />
                      <ToggleRow
                        label="Penugasan proyek baru"
                        checked={settings.project_assignments === 1}
                        onChange={() => handleToggle('project_assignments')}
                        sublevel
                      />
                      <ToggleRow
                        label="Kirim via Email"
                        checked={settings.project_via_email === 1}
                        onChange={() => handleToggle('project_via_email')}
                        sublevel
                        icon={<Mail size={16} />}
                      />
                      <ToggleRow
                        label="Kirim via Push"
                        checked={settings.project_via_push === 1}
                        onChange={() => handleToggle('project_via_push')}
                        sublevel
                        icon={<Smartphone size={16} />}
                      />
                    </>
                  )}
                </>
              )}

              {category.id === 'talent' && (
                <>
                  <ToggleRow
                    label="Notifikasi request talent baru"
                    checked={settings.talent_request_enabled === 1}
                    onChange={() => handleToggle('talent_request_enabled')}
                  />
                  <ToggleRow
                    label="Notifikasi approval talent"
                    checked={settings.talent_approval_enabled === 1}
                    onChange={() => handleToggle('talent_approval_enabled')}
                  />
                  {(settings.talent_request_enabled === 1 || settings.talent_approval_enabled === 1) && (
                    <>
                      <ToggleRow
                        label="Kirim via Email"
                        checked={settings.talent_via_email === 1}
                        onChange={() => handleToggle('talent_via_email')}
                        sublevel
                        icon={<Mail size={16} />}
                      />
                      <ToggleRow
                        label="Kirim via Push"
                        checked={settings.talent_via_push === 1}
                        onChange={() => handleToggle('talent_via_push')}
                        sublevel
                        icon={<Smartphone size={16} />}
                      />
                    </>
                  )}
                </>
              )}

              {category.id === 'payment' && (
                <>
                  <ToggleRow
                    label="Notifikasi pembayaran"
                    checked={settings.payment_enabled === 1}
                    onChange={() => handleToggle('payment_enabled')}
                  />
                  <ToggleRow
                    label="Notifikasi invoice"
                    checked={settings.invoice_enabled === 1}
                    onChange={() => handleToggle('invoice_enabled')}
                  />
                  {(settings.payment_enabled === 1 || settings.invoice_enabled === 1) && (
                    <>
                      <ToggleRow
                        label="Kirim via Email"
                        checked={settings.payment_via_email === 1}
                        onChange={() => handleToggle('payment_via_email')}
                        sublevel
                        icon={<Mail size={16} />}
                      />
                      <ToggleRow
                        label="Kirim via Push"
                        checked={settings.payment_via_push === 1}
                        onChange={() => handleToggle('payment_via_push')}
                        sublevel
                        icon={<Smartphone size={16} />}
                      />
                    </>
                  )}
                </>
              )}

              {category.id === 'booking' && (
                <>
                  <ToggleRow
                    label="Aktifkan notifikasi booking"
                    checked={settings.booking_enabled === 1}
                    onChange={() => handleToggle('booking_enabled')}
                  />
                  {settings.booking_enabled === 1 && (
                    <>
                      <ToggleRow
                        label="Kirim via Email"
                        checked={settings.booking_via_email === 1}
                        onChange={() => handleToggle('booking_via_email')}
                        sublevel
                        icon={<Mail size={16} />}
                      />
                      <ToggleRow
                        label="Kirim via Push"
                        checked={settings.booking_via_push === 1}
                        onChange={() => handleToggle('booking_via_push')}
                        sublevel
                        icon={<Smartphone size={16} />}
                      />
                    </>
                  )}
                </>
              )}

              {category.id === 'system' && (
                <>
                  <ToggleRow
                    label="Aktifkan notifikasi sistem"
                    checked={settings.system_enabled === 1}
                    onChange={() => handleToggle('system_enabled')}
                  />
                  {settings.system_enabled === 1 && (
                    <ToggleRow
                      label="Hanya notifikasi penting"
                      checked={settings.system_urgent_only === 1}
                      onChange={() => handleToggle('system_urgent_only')}
                      sublevel
                    />
                  )}
                </>
              )}
            </div>
          </div>
        ))}

        {/* Schedule Reminders */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Reminder Jadwal</h3>
            <p className="text-sm text-slate-500">Notifikasi kapan talent harus hadir</p>
          </div>

          <div className="space-y-4">
            <ToggleRow
              label="Reminder 24 jam sebelumnya"
              checked={settings.schedule_reminder_24h === 1}
              onChange={() => handleToggle('schedule_reminder_24h')}
            />
            <ToggleRow
              label="Reminder 1 jam sebelumnya"
              checked={settings.schedule_reminder_1h === 1}
              onChange={() => handleToggle('schedule_reminder_1h')}
            />
            {(settings.schedule_reminder_24h === 1 || settings.schedule_reminder_1h === 1) && (
              <>
                <ToggleRow
                  label="Kirim via Email"
                  checked={settings.schedule_via_email === 1}
                  onChange={() => handleToggle('schedule_via_email')}
                  sublevel
                  icon={<Mail size={16} />}
                />
                <ToggleRow
                  label="Kirim via Push"
                  checked={settings.schedule_via_push === 1}
                  onChange={() => handleToggle('schedule_via_push')}
                  sublevel
                  icon={<Smartphone size={16} />}
                />
                <ToggleRow
                  label="Kirim via SMS"
                  checked={settings.schedule_via_sms === 1}
                  onChange={() => handleToggle('schedule_via_sms')}
                  sublevel
                  icon={<Volume2 size={16} />}
                />
              </>
            )}
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Jam Sunyi</h3>
            <p className="text-sm text-slate-500">Jangan kirim notifikasi di jam tertentu</p>
          </div>

          <div className="space-y-4">
            <ToggleRow
              label="Aktifkan jam sunyi"
              checked={settings.quiet_hours_enabled === 1}
              onChange={() => handleToggle('quiet_hours_enabled')}
            />
            {settings.quiet_hours_enabled === 1 && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-white mb-2">Mulai</label>
                  <input
                    type="time"
                    value={settings.quiet_hours_start || '21:00'}
                    onChange={(e) => handleTimeChange('quiet_hours_start', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-white mb-2">Selesai</label>
                  <input
                    type="time"
                    value={settings.quiet_hours_end || '09:00'}
                    onChange={(e) => handleTimeChange('quiet_hours_end', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => fetchSettings()}
          className="px-6 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          disabled={saving}
        >
          Reset
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </div>
    </div>
  )
}

interface ToggleRowProps {
  label: string
  checked: boolean
  onChange: () => void
  sublevel?: boolean
  icon?: React.ReactNode
}

function ToggleRow({ label, checked, onChange, sublevel, icon }: ToggleRowProps) {
  return (
    <div className={`flex items-center justify-between ${sublevel ? 'pl-4' : ''}`}>
      <div className="flex items-center gap-3">
        {icon && <span className="text-slate-400">{icon}</span>}
        <label className={`${sublevel ? 'text-sm' : 'text-base'} text-slate-700 dark:text-slate-300 cursor-pointer`}>
          {label}
        </label>
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}
