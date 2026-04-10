// File: apps/appclient/src/store/useKOLWorkspaceStore.ts
// Zustand store untuk KOL Specialist Workspace
// State management untuk Kanban board content review dan performance tracking

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

// ============================================================
// TYPES
// ============================================================

export interface KOLBrief {
  id: string
  project_id: string
  campaign_name: string
  campaign_description: string
  campaign_objective: 'awareness' | 'engagement' | 'conversion' | 'viral'
  guidelines: {
    do_list: string[]
    dont_list: string[]
    mandatory_hashtags: string[]
    optional_hashtags: string[]
    tone: string
    visual_guidelines: string[]
    target_audience: string
    posting_schedule: string
  }
  moodboard_urls: string[]
  inspiration_links: string[]
  submission_deadline: string // ISO datetime
  is_active: boolean
}

export interface KOLContentDraft {
  id: string
  brief_id: string
  talent_id: string
  talent_name: string
  video_url: string
  video_thumbnail_url: string | null
  caption_text: string | null
  hashtags_used: string[]
  submitted_at: string // ISO datetime
  status: 'pending_review' | 'revision_requested' | 'approved' | 'rejected'
  reviewed_by: string | null
  reviewed_at: string | null
  feedback_text: string | null
  revision_count: number
  approved_at: string | null
  tracking_link_id: string | null
}

export interface KOLTrackingLink {
  id: string
  content_draft_id: string
  talent_id: string
  tracking_token: string
  short_url: string | null
  total_clicks: number
  unique_visitors: number
  conversion_count: number
  bounce_rate: number
  top_countries: Array<{ country: string; clicks: number }>
  device_breakdown: Record<string, number>
}

export interface KanbanCard extends KOLContentDraft {
  tracking_data?: KOLTrackingLink
}

export interface KanbanBoard {
  pending_review: KanbanCard[]
  revision_requested: KanbanCard[]
  approved: KanbanCard[]
}

// ============================================================
// STORE STATE & ACTIONS
// ============================================================

interface KOLWorkspaceStore {
  // Brief State
  briefs: KOLBrief[]
  selectedBriefId: string | null
  selectedBrief: KOLBrief | null
  isBriefLoading: boolean

  // Kanban Board State
  kanbanBoard: KanbanBoard
  isDragDropping: boolean
  draggedCard: KanbanCard | null
  sourceColumn: keyof KanbanBoard | null

  // Content Review State
  selectedCard: KanbanCard | null
  reviewFeedback: string
  isSubmittingReview: boolean
  reviewError: string | null

  // Performance Tracking
  performanceMetrics: Record<string, KOLTrackingLink>
  selectedTrackingId: string | null

  // UI State
  kanbanFilter: 'all' | 'pending_only' | 'high_revision'
  sortBy: 'recent' | 'clicks' | 'talent_name'

  // ACTIONS: Briefs
  setBriefs: (briefs: KOLBrief[]) => void
  selectBrief: (briefId: string) => void
  loadBrief: (projectId: string, briefId: string) => Promise<void>

  // ACTIONS: Kanban Board
  setKanbanBoard: (board: KanbanBoard) => void
  startDragCard: (card: KanbanCard, fromColumn: keyof KanbanBoard) => void
  dropCard: (toColumn: keyof KanbanBoard, position: number) => Promise<void>
  moveCardLocally: (card: KanbanCard, toColumn: keyof KanbanBoard) => void

  // ACTIONS: Content Review
  selectCard: (card: KanbanCard) => void
  setReviewFeedback: (feedback: string) => void
  approveContent: (cardId: string, brief?: string) => Promise<void>
  requestRevision: (cardId: string, feedback: string) => Promise<void>
  rejectContent: (cardId: string, feedback: string) => Promise<void>

  // ACTIONS: Performance Tracking
  setPerformanceMetrics: (metrics: Record<string, KOLTrackingLink>) => void
  getCardMetrics: (cardId: string) => KOLTrackingLink | undefined

  // ACTIONS: UI
  setKanbanFilter: (filter: 'all' | 'pending_only' | 'high_revision') => void
  setSortBy: (sort: 'recent' | 'clicks' | 'talent_name') => void
  getFilteredBoard: () => KanbanBoard
  resetStore: () => void
}

const initialState = {
  briefs: [],
  selectedBriefId: null,
  selectedBrief: null,
  isBriefLoading: false,

  kanbanBoard: {
    pending_review: [],
    revision_requested: [],
    approved: [],
  },
  isDragDropping: false,
  draggedCard: null,
  sourceColumn: null,

  selectedCard: null,
  reviewFeedback: '',
  isSubmittingReview: false,
  reviewError: null,

  performanceMetrics: {},
  selectedTrackingId: null,

  kanbanFilter: 'all' as const,
  sortBy: 'recent' as const,
}

export const useKOLWorkspaceStore = create<KOLWorkspaceStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // BRIEFS ACTIONS
        setBriefs: (briefs) => set({ briefs }),

        selectBrief: (briefId) => {
          const brief = get().briefs.find((b) => b.id === briefId)
          set({ selectedBriefId: briefId, selectedBrief: brief || null })
        },

        loadBrief: async (projectId: string, briefId: string) => {
          set({ isBriefLoading: true })
          try {
            const response = await fetch(
              `/api/client/kol/briefs/${briefId}?project_id=${projectId}`
            )
            if (!response.ok) throw new Error('Failed to load brief')

            const brief = await response.json()
            set({ selectedBrief: brief, selectedBriefId: briefId, isBriefLoading: false })
          } catch (error) {
            set({ isBriefLoading: false })
            throw error
          }
        },

        // KANBAN BOARD ACTIONS
        setKanbanBoard: (board) => set({ kanbanBoard: board }),

        startDragCard: (card, fromColumn) => {
          set({ isDragDropping: true, draggedCard: card, sourceColumn: fromColumn })
        },

        moveCardLocally: (card, toColumn) => {
          const { draggedCard, sourceColumn, kanbanBoard } = get()
          if (!draggedCard || !sourceColumn) return

          const newBoard = {
            pending_review: kanbanBoard.pending_review.filter((c) => c.id !== card.id),
            revision_requested: kanbanBoard.revision_requested.filter(
              (c) => c.id !== card.id
            ),
            approved: kanbanBoard.approved.filter((c) => c.id !== card.id),
          }

          newBoard[toColumn].push(card)
          set({ kanbanBoard: newBoard })
        },

        dropCard: async (toColumn, position) => {
          const { draggedCard, sourceColumn } = get()
          if (!draggedCard || !sourceColumn) return

          set({ isSubmittingReview: true, reviewError: null })
          try {
            // Auto-approve if moving to 'approved' column from 'revision_requested'
            if (toColumn === 'approved' && sourceColumn === 'revision_requested') {
              await get().approveContent(draggedCard.id, 'Auto-approved from revision')
            }

            // Reset drag state
            set({
              isDragDropping: false,
              draggedCard: null,
              sourceColumn: null,
              isSubmittingReview: false,
            })
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error'
            set({
              isDragDropping: false,
              draggedCard: null,
              sourceColumn: null,
              isSubmittingReview: false,
              reviewError: message,
            })
            throw error
          }
        },

        // CONTENT REVIEW ACTIONS
        selectCard: (card) => {
          set({ selectedCard: card, reviewFeedback: '' })
        },

        setReviewFeedback: (feedback) => set({ reviewFeedback: feedback }),

        approveContent: async (cardId, brief) => {
          set({ isSubmittingReview: true, reviewError: null })
          try {
            const response = await fetch(`/api/client/kol/content/${cardId}/review`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'approve',
                feedback: brief,
              }),
            })
            if (!response.ok) throw new Error('Failed to approve content')

            const result = await response.json()

            // Update local kanban board
            set((s) => {
              const newBoard = { ...s.kanbanBoard }
              ;(['pending_review', 'revision_requested'] as const).forEach((col) => {
                newBoard[col] = newBoard[col].filter((c) => c.id !== cardId)
              })
              newBoard.approved.push({
                ...result.content,
                tracking_data: result.tracking_data,
              })

              return {
                kanbanBoard: newBoard,
                isSubmittingReview: false,
                selectedCard: null,
                reviewFeedback: '',
              }
            })
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error'
            set({ isSubmittingReview: false, reviewError: message })
            throw error
          }
        },

        requestRevision: async (cardId, feedback) => {
          set({ isSubmittingReview: true, reviewError: null })
          try {
            const response = await fetch(
              `/api/client/kol/content/${cardId}/review`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'revision_requested',
                  feedback,
                }),
              }
            )
            if (!response.ok) throw new Error('Failed to request revision')

            // Move card to revision_requested column
            set((s) => {
              const card = s.kanbanBoard.pending_review.find((c) => c.id === cardId)
              if (!card) return s

              return {
                kanbanBoard: {
                  ...s.kanbanBoard,
                  pending_review: s.kanbanBoard.pending_review.filter(
                    (c) => c.id !== cardId
                  ),
                  revision_requested: [
                    ...s.kanbanBoard.revision_requested,
                    { ...card, status: 'revision_requested' as const },
                  ],
                },
                isSubmittingReview: false,
                selectedCard: null,
                reviewFeedback: '',
              }
            })
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error'
            set({ isSubmittingReview: false, reviewError: message })
            throw error
          }
        },

        rejectContent: async (cardId, feedback) => {
          set({ isSubmittingReview: true, reviewError: null })
          try {
            const response = await fetch(`/api/client/kol/content/${cardId}/review`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'rejected',
                feedback,
              }),
            })
            if (!response.ok) throw new Error('Failed to reject content')

            // Remove card from board
            set((s) => ({
              kanbanBoard: {
                pending_review: s.kanbanBoard.pending_review.filter(
                  (c) => c.id !== cardId
                ),
                revision_requested: s.kanbanBoard.revision_requested.filter(
                  (c) => c.id !== cardId
                ),
                approved: s.kanbanBoard.approved.filter((c) => c.id !== cardId),
              },
              isSubmittingReview: false,
              selectedCard: null,
              reviewFeedback: '',
            }))
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error'
            set({ isSubmittingReview: false, reviewError: message })
            throw error
          }
        },

        // PERFORMANCE TRACKING ACTIONS
        setPerformanceMetrics: (metrics) => set({ performanceMetrics: metrics }),

        getCardMetrics: (cardId) => {
          const { performanceMetrics } = get()
          return performanceMetrics[cardId]
        },

        // UI ACTIONS
        setKanbanFilter: (filter) => set({ kanbanFilter: filter }),

        setSortBy: (sort) => set({ sortBy: sort }),

        getFilteredBoard: () => {
          const { kanbanBoard, kanbanFilter, sortBy } = get()

          let board = { ...kanbanBoard }

          // Apply filter
          if (kanbanFilter === 'pending_only') {
            board.approved = []
            board.revision_requested = []
          } else if (kanbanFilter === 'high_revision') {
            board.pending_review = board.pending_review.filter((c) => c.revision_count > 2)
            board.approved = []
          }

          // Apply sort
          const sortFn = (cards: KanbanCard[]) => {
            const sorted = [...cards]
            if (sortBy === 'recent') {
              sorted.sort(
                (a, b) =>
                  new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
              )
            } else if (sortBy === 'clicks') {
              sorted.sort((a, b) => {
                const aClicks = get().performanceMetrics[a.id]?.total_clicks || 0
                const bClicks = get().performanceMetrics[b.id]?.total_clicks || 0
                return bClicks - aClicks
              })
            } else if (sortBy === 'talent_name') {
              sorted.sort((a, b) => a.talent_name.localeCompare(b.talent_name))
            }
            return sorted
          }

          return {
            pending_review: sortFn(board.pending_review),
            revision_requested: sortFn(board.revision_requested),
            approved: sortFn(board.approved),
          }
        },

        resetStore: () => set(initialState),
      }),
      {
        name: 'kol-workspace-storage',
        partialize: (state) => ({
          selectedBriefId: state.selectedBriefId,
          kanbanFilter: state.kanbanFilter,
          sortBy: state.sortBy,
        }),
      }
    )
  )
)
