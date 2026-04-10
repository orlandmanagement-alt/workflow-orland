// File: apps/appclient/src/store/useEOWorkspaceStore.ts
// Zustand store untuk Event Operations Workspace
// State management untuk drag-drop rundown, riders approval, gate passes

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

// ============================================================
// TYPES
// ============================================================

export interface RundownSegment {
  id: string
  segment_name: string
  start_time: string // Format: "HH:MM"
  end_time: string
  duration_minutes: number
  talent_ids: string[]
  stage: 'main_stage' | 'secondary_stage' | 'outdoor_area'
  notes: string
  status: 'not_started' | 'in_progress' | 'completed'
  order: number
}

export interface RundownTimeline {
  id: string
  project_id: string
  event_date: string // ISO date
  timeline: RundownSegment[]
  version: number
  last_modified_by: string
  is_finalized: boolean
}

export interface RiderChecklistItem {
  id: string
  talent_id: string
  talent_name: string
  hospitality: {
    accommodation_required: boolean
    accommodation_type: string | null
    meal_preferences: Record<string, any> | null
    transportation_required: boolean
    transportation_type: string | null
    special_requests: string | null
    is_approved: number // 0, 1, -1
  }
  technical: {
    audio_requirements: Record<string, any> | null
    lighting_requirements: Record<string, any> | null
    dressing_room_requirements: Record<string, any> | null
    special_equipment: string | null
    is_approved: number
  }
}

export interface GatePass {
  id: string
  talent_id: string
  talent_name: string
  pass_code: string
  pass_type: 'performer' | 'crew' | 'vip_guest' | 'stage_crew'
  access_areas: string[]
  expected_arrival: string // ISO datetime
  is_present: number // 0, 1, -1
  scanned_at: string | null
}

// ============================================================
// STORE STATE & ACTIONS
// ============================================================

interface EOWorkspaceStore {
  // Rundown State
  rundown: RundownTimeline | null
  draggedSegment: RundownSegment | null
  isSavingRundown: boolean
  rundownError: string | null

  // Riders State
  riders: RiderChecklistItem[]
  selectedRiderId: string | null
  isApprovingRider: boolean
  ridersError: string | null

  // Gate Passes State
  gatePasses: GatePass[]
  scannerFilter: 'all' | 'present' | 'absent' | 'not_arrived'
  isScanning: boolean

  // ACTIONS: Rundown
  setRundown: (rundown: RundownTimeline) => void
  updateRundownSegment: (segmentId: string, updates: Partial<RundownSegment>) => void
  reorderSegments: (segments: RundownSegment[]) => void
  startDragSegment: (segment: RundownSegment) => void
  dropSegment: (position: number) => void
  saveRundown: (projectId: string) => Promise<void>
  finalizeRundown: (projectId: string) => Promise<void>

  // ACTIONS: Riders
  setRiders: (riders: RiderChecklistItem[]) => void
  selectRider: (riderId: string) => void
  approveRider: (riderId: string, hospitality: boolean, technical: boolean) => Promise<void>
  rejectRider: (riderId: string, type: 'hospitality' | 'technical', reason: string) => Promise<void>

  // ACTIONS: Gate Passes
  setGatePasses: (passes: GatePass[]) => void
  setScannerFilter: (filter: 'all' | 'present' | 'absent' | 'not_arrived') => void
  scanPass: (passCode: string) => Promise<void>
  getFilteredPasses: () => GatePass[]

  // ACTIONS: UI
  resetStore: () => void
}

const initialState = {
  rundown: null,
  draggedSegment: null,
  isSavingRundown: false,
  rundownError: null,

  riders: [],
  selectedRiderId: null,
  isApprovingRider: false,
  ridersError: null,

  gatePasses: [],
  scannerFilter: 'all' as const,
  isScanning: false,
}

export const useEOWorkspaceStore = create<EOWorkspaceStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // RUNDOWN ACTIONS
        setRundown: (rundown) => set({ rundown }),

        updateRundownSegment: (segmentId, updates) => {
          set((state) => {
            if (!state.rundown) return state
            return {
              rundown: {
                ...state.rundown,
                timeline: state.rundown.timeline.map((seg) =>
                  seg.id === segmentId ? { ...seg, ...updates } : seg
                ),
                version: state.rundown.version + 1,
              },
            }
          })
        },

        reorderSegments: (segments) => {
          set((state) => {
            if (!state.rundown) return state
            const orderedSegments = segments.map((seg, idx) => ({
              ...seg,
              order: idx + 1,
            }))
            return {
              rundown: {
                ...state.rundown,
                timeline: orderedSegments,
                version: state.rundown.version + 1,
              },
            }
          })
        },

        startDragSegment: (segment) => set({ draggedSegment: segment }),

        dropSegment: (position) => {
          const { reorderSegments, draggedSegment, rundown } = get()
          if (!draggedSegment || !rundown) return

          const items = [...rundown.timeline]
          const draggedIdx = items.findIndex((s) => s.id === draggedSegment.id)
          const [movedItem] = items.splice(draggedIdx, 1)
          items.splice(position, 0, movedItem)

          reorderSegments(items)
          set({ draggedSegment: null })
        },

        saveRundown: async (projectId: string) => {
          const state = get()
          if (!state.rundown) throw new Error('No rundown loaded')

          set({ isSavingRundown: true, rundownError: null })
          try {
            const response = await fetch(
              `/api/client/workspace/eo/${projectId}/rundown`,
              {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(state.rundown),
              }
            )
            if (!response.ok) throw new Error('Failed to save rundown')
            set({ isSavingRundown: false })
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error'
            set({ isSavingRundown: false, rundownError: message })
            throw error
          }
        },

        finalizeRundown: async (projectId: string) => {
          const state = get()
          if (!state.rundown) throw new Error('No rundown loaded')

          set({ isSavingRundown: true, rundownError: null })
          try {
            const response = await fetch(
              `/api/client/workspace/eo/${projectId}/rundown/finalize`,
              { method: 'POST' }
            )
            if (!response.ok) throw new Error('Failed to finalize rundown')
            set((s) => ({
              isSavingRundown: false,
              rundown: s.rundown ? { ...s.rundown, is_finalized: true } : null,
            }))
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error'
            set({ isSavingRundown: false, rundownError: message })
            throw error
          }
        },

        // RIDERS ACTIONS
        setRiders: (riders) => set({ riders }),

        selectRider: (riderId) => set({ selectedRiderId: riderId }),

        approveRider: async (riderId, hospitality, technical) => {
          set({ isApprovingRider: true, ridersError: null })
          try {
            const requests = []

            if (hospitality) {
              requests.push(
                fetch(`/api/client/eo/riders/${riderId}/approve?type=hospitality`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'approve' }),
                })
              )
            }

            if (technical) {
              requests.push(
                fetch(`/api/client/eo/riders/${riderId}/approve?type=technical`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'approve' }),
                })
              )
            }

            const responses = await Promise.all(requests)
            if (!responses.every((r) => r.ok)) throw new Error('Failed to approve rider')

            // Update local state
            set((s) => ({
              riders: s.riders.map((r) => {
                if (r.id === riderId) {
                  return {
                    ...r,
                    hospitality: hospitality
                      ? { ...r.hospitality, is_approved: 1 }
                      : r.hospitality,
                    technical: technical
                      ? { ...r.technical, is_approved: 1 }
                      : r.technical,
                  }
                }
                return r
              }),
              isApprovingRider: false,
            }))
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error'
            set({ isApprovingRider: false, ridersError: message })
            throw error
          }
        },

        rejectRider: async (riderId, type, reason) => {
          set({ isApprovingRider: true, ridersError: null })
          try {
            const response = await fetch(
              `/api/client/eo/riders/${riderId}/reject?type=${type}`,
              {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason }),
              }
            )
            if (!response.ok) throw new Error('Failed to reject rider')

            set((s) => ({
              riders: s.riders.map((r) => {
                if (r.id === riderId) {
                  return {
                    ...r,
                    // ✅ Perbaikan: TypeScript sekarang tahu pasti ini adalah objek
                    [type]: { 
                      ...(type === 'hospitality' ? r.hospitality : r.technical), 
                      is_approved: -1 
                    },
                  }
                }
                return r
              }),
              isApprovingRider: false,
            }))
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error'
            set({ isApprovingRider: false, ridersError: message })
            throw error
          }
        },

        // GATE PASSES ACTIONS
        setGatePasses: (passes) => set({ gatePasses: passes }),

        setScannerFilter: (filter) => set({ scannerFilter: filter }),

        scanPass: async (passCode: string) => {
          set({ isScanning: true })
          try {
            const response = await fetch(`/api/client/eo/gate-pass/scan`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pass_code: passCode }),
            })
            if (!response.ok) throw new Error('Invalid pass code')

            const scanned = await response.json()
            set((s) => ({
              gatePasses: s.gatePasses.map((p) =>
                p.id === scanned.id ? { ...p, is_present: 1, scanned_at: new Date().toISOString() } : p
              ),
              isScanning: false,
            }))
          } catch (error) {
            set({ isScanning: false })
            throw error
          }
        },

        getFilteredPasses: () => {
          const { gatePasses, scannerFilter } = get()
          if (scannerFilter === 'all') return gatePasses
          return gatePasses.filter((p) => {
            if (scannerFilter === 'present') return p.is_present === 1
            if (scannerFilter === 'absent') return p.is_present === -1
            if (scannerFilter === 'not_arrived') return p.is_present === 0
            return true
          })
        },

        // UI ACTIONS
        resetStore: () => set(initialState),
      }),
      {
        name: 'eo-workspace-storage', // localStorage key
        partialize: (state) => ({
          rundown: state.rundown,
          selectedRiderId: state.selectedRiderId,
          scannerFilter: state.scannerFilter,
        }),
      }
    )
  )
)
