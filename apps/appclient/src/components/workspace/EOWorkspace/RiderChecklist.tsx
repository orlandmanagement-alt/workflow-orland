// File: apps/appclient/src/components/workspace/EOWorkspace/RiderChecklist.tsx
// Component untuk menampilkan dan approve hospitality & technical riders

import React, { useState } from 'react'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'
import { useEOWorkspaceStore } from '../../../store/useEOWorkspaceStore'

export interface RiderChecklistProps {
  projectId: string
}

export const RiderChecklist: React.FC<RiderChecklistProps> = ({ projectId }) => {
  const { riders, selectedRiderId, selectRider, approveRider, rejectRider, isApprovingRider } =
    useEOWorkspaceStore()

  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null)
  const [rejectType, setRejectType] = useState<'hospitality' | 'technical'>()

  const handleApprove = async (riderId: string, hospitality: boolean, technical: boolean) => {
    try {
      await approveRider(riderId, hospitality, technical)
    } catch (error) {
      console.error('Failed to approve:', error)
    }
  }

  const handleReject = async (riderId: string) => {
    if (!rejectType) return
    try {
      await rejectRider(riderId, rejectType, rejectReason)
      setShowRejectModal(null)
      setRejectReason('')
    } catch (error) {
      console.error('Failed to reject:', error)
    }
  }

  const getStatusBadge = (status: number) => {
    if (status === 1)
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
          <CheckCircle2 size={14} /> Approved
        </span>
      )
    if (status === -1)
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
          <XCircle size={14} /> Rejected
        </span>
      )
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium">
        <Clock size={14} /> Pending
      </span>
    )
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700">
        {['all', 'pending', 'approved'].map((tab) => (
          <button
            key={tab}
            className="px-4 py-2 text-sm font-medium text-slate-300 border-b-2 border-transparent hover:text-white transition-colors"
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Riders Grid */}
      <div className="grid gap-3">
        {riders.map((rider) => (
          <div
            key={rider.id}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4 cursor-pointer hover:border-slate-600 transition-all"
            onClick={() => selectRider(rider.id)}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-white">{rider.talent_name}</h3>
                <p className="text-xs text-slate-400">{rider.talent_id}</p>
              </div>
              {selectedRiderId === rider.id && (
                <div className="w-2 h-2 rounded-full bg-blue-500" />
              )}
            </div>

            {/* Hospitality & Technical rows */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {/* Hospitality Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Hospitality</span>
                  {getStatusBadge(rider.hospitality.is_approved)}
                </div>
                {rider.hospitality.is_approved === 0 && selectedRiderId === rider.id && (
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleApprove(rider.id, true, false)
                      }}
                      disabled={isApprovingRider}
                      className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowRejectModal(rider.id)
                        setRejectType('hospitality')
                      }}
                      className="flex-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>

              {/* Technical Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Technical</span>
                  {getStatusBadge(rider.technical.is_approved)}
                </div>
                {rider.technical.is_approved === 0 && selectedRiderId === rider.id && (
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleApprove(rider.id, false, true)
                      }}
                      disabled={isApprovingRider}
                      className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowRejectModal(rider.id)
                        setRejectType('technical')
                      }}
                      className="flex-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Details preview */}
            {selectedRiderId === rider.id && (
              <div className="mt-3 pt-3 border-t border-slate-700 space-y-2 text-xs text-slate-400">
                {rider.hospitality.special_requests && (
                  <p>
                    <strong>Special Requests:</strong> {rider.hospitality.special_requests}
                  </p>
                )}
                {rider.technical.special_equipment && (
                  <p>
                    <strong>Equipment:</strong> {rider.technical.special_equipment}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Reject Rider</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowRejectModal(null)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(showRejectModal)}
                disabled={!rejectReason}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
