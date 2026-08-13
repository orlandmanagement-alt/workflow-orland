// Store: useProjectWizardStore.ts
// Purpose: Zustand store for multi-step project creation wizard
// Location: apps/appclient/src/store/useProjectWizardStore.ts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ===== TYPE DEFINITIONS =====
export interface Step1FormData {
  title: string
  description: string
  bannerFile?: File
  bannerUrl?: string
  budgetTotal: number
  budgetCurrency: 'IDR' | 'USD'
  castingDeadline: string
  projectStartDate?: string
}

export interface RoleEntry {
  id: string // temp ID or db ID
  roleName: string
  roleDescription?: string
  quantityNeeded: number
  budgetPerTalent: number
  genderRequirement?: 'any' | 'male' | 'female' | 'other'
  ageMin?: number
  ageMax?: number
  heightMinCm?: number
  heightMaxCm?: number
  preferredSkills?: string[]
  preferredAppearance?: Record<string, any>
  displayOrder: number
}

export interface Step2FormData {
  roles: RoleEntry[]
}

export type CastingMode = 'private' | 'public' | 'live-audition'

export interface Step3FormData {
  castingMode: CastingMode
  allowGuestSubmissions: boolean
  castingDirectorName?: string
  castingDirectorEmail?: string
  guestQuestions?: string[]
}

export interface Step4FormData {
  scriptFile?: File
  storyboardFile?: File
  rundownFile?: File
  productionNotes?: string
}

export interface ProjectDraft {
  projectId?: string
  clientId: string
  step1: Step1FormData
  step2: Step2FormData
  step3: Step3FormData
  step4: Step4FormData
  currentStep: number
  lastCompletedStep: number
  createdAt: Date
  lastSavedAt: Date
}

export interface ValidationError {
  step: number
  field: string
  message: string
}

// ===== STORE DEFINITION =====
interface ProjectWizardStore {
  // State
  draft: ProjectDraft | null
  isLoading: boolean
  isSaving: boolean
  isPublishing: boolean
  validationErrors: ValidationError[]

  // Actions: Initialize
  initializeDraft: (clientId: string, projectId?: string) => void
  loadDraftFromDb: (projectId: string) => Promise<void>

  // Actions: Update Steps
  updateStep1: (data: Partial<Step1FormData>) => void
  updateStep2: (roles: RoleEntry[]) => void
  updateStep3: (data: Partial<Step3FormData>) => void
  updateStep4: (data: Partial<Step4FormData>) => void

  // Actions: Role Management
  addRole: () => void
  updateRole: (roleId: string, updates: Partial<RoleEntry>) => void
  removeRole: (roleId: string) => void
  moveRole: (roleId: string, direction: 'up' | 'down') => void

  // Actions: Navigation
  goToStep: (step: number) => void
  nextStep: () => boolean // returns true if allowed
  previousStep: () => void

  // Actions: Save & Publish
  autosaveDraft: () => Promise<void>
  publishProject: () => Promise<{ projectId: string; castingLink?: string }>

  // Actions: Validation & Helpers
  validateStep: (step: number) => boolean
  calculateBudgetStatus: () => {
    allocated: number
    total: number
    remaining: number
    isOverBudget: boolean
  }
  clearDraft: () => void
  reset: () => void
}

// ===== ZUSTAND STORE IMPLEMENTATION =====
export const useProjectWizardStore = create<ProjectWizardStore>()(
  persist(
    (set, get) => ({
      // Initial state
      draft: null,
      isLoading: false,
      isSaving: false,
      isPublishing: false,
      validationErrors: [],

      // ===== INITIALIZE =====
      initializeDraft: (clientId: string, projectId?: string) => {
        const newDraft: ProjectDraft = {
          projectId,
          clientId,
          step1: {
            title: '',
            description: '',
            budgetTotal: 0,
            budgetCurrency: 'IDR',
            castingDeadline: '',
          },
          step2: {
            roles: [],
          },
          step3: {
            castingMode: 'private',
            allowGuestSubmissions: false,
          },
          step4: {
            productionNotes: '',
          },
          currentStep: 1,
          lastCompletedStep: 0,
          createdAt: new Date(),
          lastSavedAt: new Date(),
        }
        set({ draft: newDraft, validationErrors: [] })
      },

      loadDraftFromDb: async (projectId: string) => {
        set({ isLoading: true })
        try {
          const response = await fetch(`/api/client/projects/${projectId}/draft`, {
            credentials: 'include',
          })
          if (response.ok) {
            const data = await response.json()
            set({ draft: data })
          }
        } catch (error) {
          console.error('Failed to load draft:', error)
        } finally {
          set({ isLoading: false })
        }
      },

      // ===== UPDATE STEPS =====
      updateStep1: (data: Partial<Step1FormData>) => {
        set((state) => {
          if (!state.draft) return state
          return {
            draft: {
              ...state.draft,
              step1: { ...state.draft.step1, ...data },
              lastSavedAt: new Date(),
            },
          }
        })
      },

      updateStep2: (roles: RoleEntry[]) => {
        set((state) => {
          if (!state.draft) return state
          return {
            draft: {
              ...state.draft,
              step2: { roles },
              lastSavedAt: new Date(),
            },
          }
        })
      },

      updateStep3: (data: Partial<Step3FormData>) => {
        set((state) => {
          if (!state.draft) return state
          return {
            draft: {
              ...state.draft,
              step3: { ...state.draft.step3, ...data },
              lastSavedAt: new Date(),
            },
          }
        })
      },

      updateStep4: (data: Partial<Step4FormData>) => {
        set((state) => {
          if (!state.draft) return state
          return {
            draft: {
              ...state.draft,
              step4: { ...state.draft.step4, ...data },
              lastSavedAt: new Date(),
            },
          }
        })
      },

      // ===== ROLE MANAGEMENT =====
      addRole: () => {
        set((state) => {
          if (!state.draft) return state
          const newRole: RoleEntry = {
            id: `role_${Date.now()}_${Math.random()}`,
            roleName: '',
            quantityNeeded: 1,
            budgetPerTalent: 0,
            displayOrder: state.draft.step2.roles.length,
          }
          return {
            draft: {
              ...state.draft,
              step2: {
                roles: [...state.draft.step2.roles, newRole],
              },
              lastSavedAt: new Date(),
            },
          }
        })
      },

      updateRole: (roleId: string, updates: Partial<RoleEntry>) => {
        set((state) => {
          if (!state.draft) return state
          return {
            draft: {
              ...state.draft,
              step2: {
                roles: state.draft.step2.roles.map((role) =>
                  role.id === roleId ? { ...role, ...updates } : role
                ),
              },
              lastSavedAt: new Date(),
            },
          }
        })
      },

      removeRole: (roleId: string) => {
        set((state) => {
          if (!state.draft) return state
          return {
            draft: {
              ...state.draft,
              step2: {
                roles: state.draft.step2.roles.filter((role) => role.id !== roleId),
              },
              lastSavedAt: new Date(),
            },
          }
        })
      },

      moveRole: (roleId: string, direction: 'up' | 'down') => {
        set((state) => {
          if (!state.draft) return state
          const roles = [...state.draft.step2.roles]
          const index = roles.findIndex((r) => r.id === roleId)
          if (index === -1) return state

          if (direction === 'up' && index > 0) {
            ;[roles[index], roles[index - 1]] = [roles[index - 1], roles[index]]
          } else if (direction === 'down' && index < roles.length - 1) {
            ;[roles[index], roles[index + 1]] = [roles[index + 1], roles[index]]
          }

          return {
            draft: {
              ...state.draft,
              step2: { roles },
              lastSavedAt: new Date(),
            },
          }
        })
      },

      // ===== NAVIGATION =====
      goToStep: (step: number) => {
        set((state) => {
          if (!state.draft || step < 1 || step > 4) return state
          return {
            draft: {
              ...state.draft,
              currentStep: step,
            },
          }
        })
      },

      nextStep: () => {
        const state = get()
        if (!state.draft || state.draft.currentStep >= 4) return false

        // Validate current step before moving
        if (!state.validateStep(state.draft.currentStep)) {
          return false
        }

        set((prevState) => {
          if (!prevState.draft) return prevState
          return {
            draft: {
              ...prevState.draft,
              currentStep: Math.min(prevState.draft.currentStep + 1, 4),
              lastCompletedStep: Math.max(prevState.draft.lastCompletedStep, prevState.draft.currentStep),
            },
          }
        })
        return true
      },

      previousStep: () => {
        set((state) => {
          if (!state.draft || state.draft.currentStep <= 1) return state
          return {
            draft: {
              ...state.draft,
              currentStep: Math.max(state.draft.currentStep - 1, 1),
            },
          }
        })
      },

      // ===== SAVE & PUBLISH =====
      autosaveDraft: async () => {
        const state = get()
        if (!state.draft) return

        set({ isSaving: true })
        try {
          const endpoint = state.draft.projectId
            ? `/api/client/projects/${state.draft.projectId}/draft`
            : '/api/client/projects/draft'

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(state.draft),
          })

          if (response.ok) {
            const data = await response.json()
            // Update projectId if this is a new draft
            set((prevState) => {
              if (!prevState.draft) return prevState
              return {
                draft: {
                  ...prevState.draft,
                  projectId: data.projectId,
                  lastSavedAt: new Date(),
                },
              }
            })
          }
        } catch (error) {
          console.error('Autosave failed:', error)
        } finally {
          set({ isSaving: false })
        }
      },

      publishProject: async () => {
        const state = get()
        if (!state.draft || !state.draft.projectId) {
          throw new Error('No project draft to publish')
        }

        set({ isPublishing: true })
        try {
          const response = await fetch(`/api/client/projects/${state.draft.projectId}/publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(state.draft),
          })

          if (response.ok) {
            const data = await response.json()
            set({ draft: null }) // Clear draft on success
            return {
              projectId: data.projectId,
              castingLink: data.castingLink,
            }
          } else {
            throw new Error('Failed to publish project')
          }
        } finally {
          set({ isPublishing: false })
        }
      },

      // ===== VALIDATION =====
      validateStep: (step: number) => {
        const state = get()
        if (!state.draft) return false

        const errors: ValidationError[] = []

        if (step === 1) {
          const { title, budgetTotal, castingDeadline } = state.draft.step1
          if (!title?.trim()) errors.push({ step: 1, field: 'title', message: 'Title is required' })
          if (budgetTotal <= 0) errors.push({ step: 1, field: 'budgetTotal', message: 'Budget must be greater than 0' })
          if (!castingDeadline) errors.push({ step: 1, field: 'castingDeadline', message: 'Casting deadline is required' })
        }

        if (step === 2) {
          const { roles } = state.draft.step2
          if (roles.length === 0) {
            errors.push({ step: 2, field: 'roles', message: 'At least one role is required' })
          }
          roles.forEach((role, idx) => {
            if (!role.roleName?.trim()) errors.push({ step: 2, field: `role_${idx}_name`, message: 'Role name is required' })
            if (role.quantityNeeded <= 0) errors.push({ step: 2, field: `role_${idx}_qty`, message: 'Quantity must be > 0' })
            if (role.budgetPerTalent <= 0) errors.push({ step: 2, field: `role_${idx}_budget`, message: 'Budget must be > 0' })
          })

          // Check budget cap
          const budgetStatus = state.calculateBudgetStatus()
          if (budgetStatus.isOverBudget) {
            errors.push({ step: 2, field: 'totalBudget', message: 'Total role budget exceeds project budget' })
          }
        }

        if (step === 3) {
          // Step 3 is optional, but validate if needed
          // casting_mode is always set
        }

        set({ validationErrors: errors })
        return errors.length === 0
      },

      calculateBudgetStatus: () => {
        const state = get()
        if (!state.draft) {
          return { allocated: 0, total: 0, remaining: 0, isOverBudget: false }
        }

        const total = state.draft.step1.budgetTotal
        const allocated = state.draft.step2.roles.reduce(
          (sum, role) => sum + role.budgetPerTalent * role.quantityNeeded,
          0
        )
        const remaining = total - allocated

        return {
          allocated,
          total,
          remaining,
          isOverBudget: allocated > total,
        }
      },

      clearDraft: () => {
        set({ draft: null })
      },

      reset: () => {
        set({
          draft: null,
          isLoading: false,
          isSaving: false,
          isPublishing: false,
          validationErrors: [],
        })
      },
    }),
    {
      name: 'project-wizard-store',
      partialize: (state) => ({ draft: state.draft }), // Only persist draft data
    }
  )
)

// ===== SELECTORS =====
export const selectCurrentStep = (state: ProjectWizardStore) => state.draft?.currentStep || 1
export const selectStep1Data = (state: ProjectWizardStore) => state.draft?.step1
export const selectStep2Data = (state: ProjectWizardStore) => state.draft?.step2
export const selectStep3Data = (state: ProjectWizardStore) => state.draft?.step3
export const selectStep4Data = (state: ProjectWizardStore) => state.draft?.step4
export const selectBudgetStatus = (state: ProjectWizardStore) => state.calculateBudgetStatus()
export const selectIsValid = (state: ProjectWizardStore) =>
  state.validateStep(state.draft?.currentStep || 1)
