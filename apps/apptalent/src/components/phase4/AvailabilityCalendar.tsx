/**
 * Availability Calendar Component
 * Manage talent availability and booking dates
 */

import React, { useState } from 'react'
import { Calendar, Plus, Loader2, AlertCircle, Trash2 } from 'lucide-react'
import { useAvailability } from '../../hooks/usePhase4'

interface DateRange {
  startDate: string
  endDate: string
  status: 'available' | 'booked' | 'unavailable'
  reason?: string
}

export const AvailabilityCalendar: React.FC = () => {
  const { availability, loading, create, remove } = useAvailability()
  const [form, setForm] = useState<DateRange>({
    startDate: '',
    endDate: '',
    status: 'unavailable',
    reason: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.startDate || !form.endDate) {
      setError('Start and end dates are required')
      return
    }

    if (new Date(form.startDate) >= new Date(form.endDate)) {
      setError('Start date must be before end date')
      return
    }

    setIsSubmitting(true)
    const success = await create(form.startDate, form.endDate, form.status, form.reason)

    if (success) {
      setForm({
        startDate: '',
        endDate: '',
        status: 'unavailable',
        reason: '',
      })
    }
    setIsSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this availability block?')) {
      await remove(id)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-50 border-green-200 text-green-900'
      case 'booked':
        return 'bg-blue-50 border-blue-200 text-blue-900'
      case 'unavailable':
        return 'bg-gray-50 border-gray-200 text-gray-900'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return '✓ Available'
      case 'booked':
        return '📅 Booked'
      case 'unavailable':
        return '✕ Unavailable'
      default:
        return status
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Availability Calendar</h2>
        </div>
        <p className="text-gray-600">
          Manage your availability and let clients know when you're booked
        </p>
      </div>

      {/* Add Availability Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
        <h3 className="font-semibold text-gray-900">Add Availability Block</h3>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Error</p>
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Start Date */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-900">
              Start Date
            </label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              disabled={isSubmitting}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-gray-100"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-900">
              End Date
            </label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              disabled={isSubmitting}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-gray-100"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-900">Status</label>
          <select
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value as 'available' | 'booked' | 'unavailable' })
            }
            disabled={isSubmitting}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-gray-100"
          >
            <option value="available">Available</option>
            <option value="booked">Booked (On Project)</option>
            <option value="unavailable">Unavailable</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {form.status === 'available' && 'Mark yourself as available during this period'}
            {form.status === 'booked' && 'You are on a confirmed project/booking'}
            {form.status === 'unavailable' && 'You cannot accept bookings during this time'}
          </p>
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-900">Reason (Optional)</label>
          <input
            type="text"
            value={form.reason || ''}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="E.g., On project, Vacation, Personal matter"
            disabled={isSubmitting}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-gray-100"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || !form.startDate || !form.endDate}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              Add Availability
            </>
          )}
        </button>
      </form>

      {/* Current Availability Blocks */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Current Availability</h3>

        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
          </div>
        ) : availability.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
            <Calendar className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600">No availability blocks yet</p>
            <p className="text-gray-500 text-sm">Add your first availability block above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {availability.map((block) => {
              const startDate = new Date(block.start_date)
              const endDate = new Date(block.end_date)
              const days = Math.ceil(
                (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
              )

              return (
                <div
                  key={block.id}
                  className={`p-4 rounded-lg border ${getStatusColor(block.status)} space-y-2`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">
                        {block.start_date} to {block.end_date}
                      </p>
                      <p className="text-xs opacity-75 mt-1">{days} day(s)</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-black bg-opacity-10 rounded text-xs font-semibold">
                        {getStatusBadge(block.status)}
                      </span>
                      <button
                        onClick={() => handleDelete(block.id)}
                        className="p-1.5 hover:bg-black hover:bg-opacity-10 rounded transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {block.reason && (
                    <p className="text-xs italic opacity-75">Reason: {block.reason}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">📌 Tip:</span> Your availability helps clients know 
          when you're available for new projects. Update this frequently to keep your profile current.
        </p>
      </div>
    </div>
  )
}

export default AvailabilityCalendar
