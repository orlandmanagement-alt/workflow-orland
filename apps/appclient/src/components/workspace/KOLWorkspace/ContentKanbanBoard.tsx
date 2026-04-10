// File: apps/appclient/src/components/workspace/KOLWorkspace/ContentKanbanBoard.tsx
// Component untuk Kanban board content review (drag-and-drop between columns)

import React, { useState } from 'react'
import { Play, MessageCircle, Trash2, BarChart3, Eye } from 'lucide-react'
import { useKOLWorkspaceStore } from '../../../store/useKOLWorkspaceStore'

export interface ContentKanbanBoardProps {
  projectId: string
}

interface ReviewModal {
  type: 'revision' | 'approve' | 'reject'
  cardId: string
  talent?: string
}

export const ContentKanbanBoard: React.FC<ContentKanbanBoardProps> = ({ projectId }) => {
  const {
    kanbanBoard,
    selectedCard,
    reviewFeedback,
    setReviewFeedback,
    selectCard,
    approveContent,
    requestRevision,
    rejectContent,
    isSubmittingReview,
  } = useKOLWorkspaceStore()

  const [draggedCard, setDraggedCard] = useState<any>(null)
  const [dropZone, setDropZone] = useState<string | null>(null)
  const [reviewModal, setReviewModal] = useState<ReviewModal | null>(null)
  const [showPreview, setShowPreview] = useState<string | null>(null)

  const handleDragStart = (card: any, fromColumn: string) => {
    setDraggedCard({ card, fromColumn })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.add('bg-blue-500/10')
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-blue-500/10')
  }

  const handleDrop = (e: React.DragEvent, toColumn: string) => {
    e.preventDefault()
    e.currentTarget.classList.remove('bg-blue-500/10')

    if (!draggedCard) return
    // Handle drop - move card to new column
    setDraggedCard(null)
  }

  const handleSubmitReview = async () => {
    if (!reviewModal) return

    try {
      if (reviewModal.type === 'approve') {
        await approveContent(reviewModal.cardId)
      } else if (reviewModal.type === 'revision') {
        await requestRevision(reviewModal.cardId, reviewFeedback)
      } else if (reviewModal.type === 'reject') {
        await rejectContent(reviewModal.cardId, reviewFeedback)
      }
      setReviewModal(null)
      setReviewFeedback('')
    } catch (error) {
      console.error('Review failed:', error)
    }
  }

  const Column = ({
    title,
    columnKey,
    cards,
    color,
  }: {
    title: string
    columnKey: 'pending_review' | 'revision_requested' | 'approved'
    cards: any[]
    color: string
  }) => (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e, columnKey)}
      className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg p-3 min-h-96 space-y-3"
    >
      {/* Column Header */}
      <div className={`flex items-center justify-between px-2 py-1 rounded ${color}`}>
        <h3 className="font-semibold text-white">{title}</h3>
        <span className="text-xs font-bold text-white">{cards.length}</span>
      </div>

      {/* Cards */}
      <div className="space-y-2">
        {cards.map((card) => (
          <div
            key={card.id}
            draggable
            onDragStart={() => handleDragStart(card, columnKey)}
            className={`bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-slate-600 transition-all group${
              draggedCard?.card.id === card.id ? ' opacity-50' : ''
            }`}
            onClick={() => selectCard(card)}
          >
            {/* Video Thumbnail */}
            <div className="relative mb-2 bg-slate-900 rounded aspect-video overflow-hidden group-hover:brightness-110 transition-all">
              {card.video_thumbnail_url && (
                <img
                  src={card.video_thumbnail_url}
                  alt="video"
                  className="w-full h-full object-cover"
                />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowPreview(card.id)
                }}
                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Play size={24} className="text-white" />
              </button>
            </div>

            {/* Content Info */}
            <div className="space-y-1">
              <div className="flex items-start justify-between">
                <p className="font-semibold text-white text-sm">{card.talent_name}</p>
                {card.revision_count > 0 && (
                  <span className="text-xs px-2 py-0.5 bg-yellow-600/30 text-yellow-300 rounded">
                    {card.revision_count}x
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 line-clamp-2">{card.caption_text}</p>

              {/* Hashtags */}
              {card.hashtags_used?.length > 0 && (
                <div className="text-xs text-slate-500 line-clamp-1">
                  {card.hashtags_used.slice(0, 3).join(' ')}
                </div>
              )}

              {/* Submitted date */}
              <p className="text-xs text-slate-500">
                {new Date(card.submitted_at).toLocaleDateString()}
              </p>
            </div>

            {/* Action Buttons (when selected) */}
            {selectedCard?.id === card.id && (
              <div className="mt-3 pt-2 border-t border-slate-700 flex gap-2">
                {columnKey === 'pending_review' && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setReviewModal({ type: 'revision', cardId: card.id, talent: card.talent_name })
                      }}
                      className="flex-1 px-2 py-1 bg-yellow-600/30 hover:bg-yellow-600/50 text-yellow-300 text-xs rounded flex items-center justify-center gap-1"
                    >
                      <MessageCircle size={12} /> Revise
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setReviewModal({ type: 'approve', cardId: card.id })
                      }}
                      className="flex-1 px-2 py-1 bg-green-600/30 hover:bg-green-600/50 text-green-300 text-xs rounded"
                    >
                      ✓ Approve
                    </button>
                  </>
                )}

                {columnKey === 'revision_requested' && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setReviewModal({ type: 'approve', cardId: card.id })
                      }}
                      className="flex-1 px-2 py-1 bg-green-600/30 hover:bg-green-600/50 text-green-300 text-xs rounded"
                    >
                      ✓ Approve
                    </button>
                  </>
                )}

                {columnKey === 'approved' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      alert(`Approved on ${new Date(card.approved_at).toLocaleDateString()}`)
                    }}
                    className="flex-1 px-2 py-1 bg-green-600/30 text-green-300 text-xs rounded cursor-default"
                  >
                    ✓ Content Live
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {cards.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-xs">
            <p>No content yet</p>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto">
        <Column
          title="Pending Review"
          columnKey="pending_review"
          cards={kanbanBoard.pending_review}
          color="bg-blue-600/30 text-blue-300 border border-blue-600/50"
        />
        <Column
          title="Revision Requested"
          columnKey="revision_requested"
          cards={kanbanBoard.revision_requested}
          color="bg-yellow-600/30 text-yellow-300 border border-yellow-600/50"
        />
        <Column
          title="Approved"
          columnKey="approved"
          cards={kanbanBoard.approved}
          color="bg-green-600/30 text-green-300 border border-green-600/50"
        />
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-2xl w-full mx-4 space-y-4">
            <h3 className="text-lg font-semibold text-white">
              {reviewModal.type === 'revision' && 'Request Revision'}
              {reviewModal.type === 'approve' && 'Approve Content'}
              {reviewModal.type === 'reject' && 'Reject Content'}
            </h3>

            {reviewModal.type !== 'approve' && (
              <textarea
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
                placeholder={
                  reviewModal.type === 'revision'
                    ? 'What needs to be fixed?'
                    : 'Why is this being rejected?'
                }
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                rows={4}
              />
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setReviewModal(null)
                  setReviewFeedback('')
                }}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={
                  isSubmittingReview ||
                  (reviewModal.type !== 'approve' && !reviewFeedback.trim())
                }
                className={`flex-1 px-4 py-2 text-white rounded text-sm disabled:opacity-50 ${
                  reviewModal.type === 'revision'
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : reviewModal.type === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isSubmittingReview ? 'Processing...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="max-w-2xl w-full mx-4">
            <button
              onClick={() => setShowPreview(null)}
              className="mb-4 text-white hover:text-slate-300"
            >
              ✕ Close
            </button>
            <video
              src={kanbanBoard.pending_review.find((c) => c.id === showPreview)?.video_url}
              controls
              className="w-full bg-black rounded"
            />
          </div>
        </div>
      )}
    </div>
  )
}
