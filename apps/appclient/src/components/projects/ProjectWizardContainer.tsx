// Component: ProjectWizardContainer.tsx
// Purpose: Main wizard coordinator with step navigation
// Location: apps/appclient/src/components/projects/ProjectWizardContainer.tsx

import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProjectWizardStore, selectCurrentStep, selectBudgetStatus } from '../../store/useProjectWizardStore'
import Step1ProjectBrief from './steps/Step1ProjectBrief'
import Step2RoleBreakdown from './steps/Step2RoleBreakdown'
import Step3CastingMode from './steps/Step3CastingMode'
import Step4ProductionLogistics from './steps/Step4ProductionLogistics'

interface Props {
  clientId: string
  projectId?: string
  onSuccess?: (data: { projectId: string; castingLink?: string }) => void
  onCancel?: () => void
}

export const ProjectWizardContainer: React.FC<Props> = ({
  clientId,
  projectId,
  onSuccess,
  onCancel,
}) => {
  const {
    draft,
    initializeDraft,
    loadDraftFromDb,
    goToStep,
    nextStep,
    previousStep,
    autosaveDraft,
    publishProject,
    isPublishing,
    isSaving,
    validationErrors,
  } = useProjectWizardStore()

  const currentStep = selectCurrentStep(useProjectWizardStore.getState())
  const budgetStatus = selectBudgetStatus(useProjectWizardStore.getState())

  // Initialize or load draft
  useEffect(() => {
    if (projectId) {
      loadDraftFromDb(projectId)
    } else {
      initializeDraft(clientId)
    }
  }, [clientId, projectId])

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (draft) {
        autosaveDraft()
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [draft, autosaveDraft])

  const handleNext = async () => {
    if (nextStep()) {
      // Autosave after step validation
      await autosaveDraft()
    }
  }

  const handlePublish = async () => {
    try {
      const result = await publishProject()
      onSuccess?.(result)
    } catch (error) {
      console.error('Publish failed:', error)
      // Show error toast
    }
  }

  const steps = [
    { number: 1, title: 'Project Brief', component: Step1ProjectBrief },
    { number: 2, title: 'Casting Breakdown', component: Step2RoleBreakdown },
    { number: 3, title: 'Casting Mode', component: Step3CastingMode },
    { number: 4, title: 'Production Files', component: Step4ProductionLogistics },
  ]

  if (!draft) {
    return (
      <div className="flex items-center justify-center h-96 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading project...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create New Project</h1>
          <p className="text-slate-400">
            {draft.lastSavedAt && (
              <span>
                Last saved: {new Date(draft.lastSavedAt).toLocaleTimeString()}
                {isSaving && ' (saving...)'}
              </span>
            )}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 bg-slate-800 rounded-2xl p-6 backdrop-blur-xl border border-slate-700">
          <div className="flex gap-4 mb-4">
            {steps.map((step, idx) => (
              <button
                key={step.number}
                onClick={() => goToStep(step.number)}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                  currentStep === step.number
                    ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-slate-900 shadow-lg shadow-gold-500/50'
                    : currentStep > step.number
                    ? 'bg-green-600/30 text-green-300'
                    : 'bg-slate-700/50 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2 justify-center">
                  <span className="text-xl">{step.number}</span>
                  <span className="hidden sm:inline">{step.title}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Budget Status Bar */}
          {currentStep >= 2 && (
            <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-300">Budget Allocation</span>
                <span className={`text-sm font-bold ${budgetStatus.isOverBudget ? 'text-red-400' : 'text-green-400'}`}>
                  Rp {budgetStatus.allocated.toLocaleString()} / Rp {budgetStatus.total.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    budgetStatus.isOverBudget ? 'bg-red-500' : 'bg-gradient-to-r from-gold-400 to-gold-600'
                  }`}
                  style={{
                    width: `${Math.min((budgetStatus.allocated / budgetStatus.total) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {validationErrors.length > 0 && (
          <div className="mb-6 bg-red-900/30 border border-red-600 rounded-lg p-4 backdrop-blur-xl">
            <h3 className="text-red-400 font-bold mb-2">Please fix the following errors:</h3>
            <ul className="list-disc list-inside text-red-300 space-y-1">
              {validationErrors.map((error, idx) => (
                <li key={idx}>{error.message}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 backdrop-blur-xl p-8 mb-8 min-h-96">
          <AnimatePresence mode="wait">
            {steps.map((step) => {
              if (step.number !== currentStep) return null
              const StepComponent = step.component
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <StepComponent />
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4 justify-between">
          <button
            onClick={onCancel || previousStep}
            disabled={currentStep === 1 || isPublishing}
            className="px-6 py-3 rounded-lg font-semibold border border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>

          <div className="flex gap-4">
            {currentStep < 4 && (
              <button
                onClick={handleNext}
                disabled={isSaving || isPublishing}
                className="px-8 py-3 rounded-lg font-semibold bg-gradient-to-r from-gold-500 to-gold-600 text-slate-900 hover:shadow-lg shadow-gold-500/50 transition-all disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Continue'}
              </button>
            )}

            {currentStep === 4 && (
              <button
                onClick={handlePublish}
                disabled={isPublishing || isSaving}
                className="px-8 py-3 rounded-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg shadow-green-600/50 transition-all disabled:opacity-50"
              >
                {isPublishing ? 'Publishing...' : 'Publish Project'}
              </button>
            )}
          </div>
        </div>

        {/* Step Counter */}
        <div className="text-center mt-8 text-slate-400 text-sm">
          Step {currentStep} of {steps.length}
        </div>
      </div>
    </div>
  )
}

export default ProjectWizardContainer
