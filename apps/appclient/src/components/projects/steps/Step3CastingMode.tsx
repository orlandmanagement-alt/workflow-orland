// Component: Step3CastingMode.tsx
// Purpose: Casting visibility and access configuration
// Location: apps/appclient/src/components/projects/steps/Step3CastingMode.tsx

import React from 'react'
import { useProjectWizardStore, selectStep3Data } from '../../../store/useProjectWizardStore'
import { Lock, Globe, Zap } from 'lucide-react'

const Step3CastingMode: React.FC = () => {
  const { updateStep3 } = useProjectWizardStore()
  const step3Data = selectStep3Data(useProjectWizardStore.getState())

  const castingModes = [
    {
      id: 'private',
      title: 'Private Search',
      description: 'Only your team can view and manage this casting through Smart Match',
      icon: Lock,
      color: 'slate',
    },
    {
      id: 'public',
      title: 'Public Casting Call',
      description: 'Open casting call visible to all talents on the platform',
      icon: Globe,
      color: 'blue',
    },
    {
      id: 'live-audition',
      title: 'Live Audition Board',
      description: 'Set up a live casting board where talents can submit auditions in real-time',
      icon: Zap,
      color: 'amber',
    },
  ]

  const selectedMode = castingModes.find((m) => m.id === step3Data?.castingMode)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-bold text-white mb-6">How would you like to run this casting?</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {castingModes.map((mode) => {
            const Icon = mode.icon
            const isSelected = step3Data?.castingMode === mode.id

            return (
              <button
                key={mode.id}
                onClick={() => updateStep3({ castingMode: mode.id as any })}
                className={`p-6 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? 'border-gold-500 bg-gold-600/10'
                    : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={`p-2 rounded-lg ${
                      isSelected
                        ? 'bg-gold-600/30 text-gold-400'
                        : 'bg-slate-600/30 text-slate-400'
                    }`}
                  >
                    <Icon size={24} />
                  </div>
                  {isSelected && <div className="ml-auto text-gold-400">✓</div>}
                </div>
                <h3 className="font-bold text-white mb-1">{mode.title}</h3>
                <p className="text-xs text-slate-400">{mode.description}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Mode-specific Configuration */}
      {step3Data?.castingMode === 'live-audition' && (
        <div className="bg-slate-700/30 rounded-lg p-6 border border-slate-600 space-y-4">
          <h3 className="font-bold text-white">Live Audition Configuration</h3>

          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Casting Director Name (Optional)
            </label>
            <input
              type="text"
              value={step3Data.castingDirectorName || ''}
              onChange={(e) => updateStep3({ castingDirectorName: e.target.value })}
              placeholder="e.g., John Doe"
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-gold-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Casting Director Email (Optional)
            </label>
            <input
              type="email"
              value={step3Data.castingDirectorEmail || ''}
              onChange={(e) => updateStep3({ castingDirectorEmail: e.target.value })}
              placeholder="casting@example.com"
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-gold-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="allowGuests"
              checked={step3Data.allowGuestSubmissions || false}
              onChange={(e) => updateStep3({ allowGuestSubmissions: e.target.checked })}
              className="w-4 h-4 accent-gold-600 cursor-pointer"
            />
            <label htmlFor="allowGuests" className="text-sm text-slate-300 cursor-pointer">
              Allow guest submissions (talents not on platform can submit auditions)
            </label>
          </div>
        </div>
      )}

      {step3Data?.castingMode === 'public' && (
        <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
          <p className="text-blue-300 text-sm">
            ℹ️ Your casting call will be visible to all talents on the platform. A unique link will be generated for
            sharing.
          </p>
        </div>
      )}

      {/* Summary */}
      <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
        <h3 className="font-bold text-white mb-4">Summary</h3>
        <div className="space-y-2 text-slate-300">
          <p>
            <span className="text-slate-400">Casting Mode:</span>
            <span className="ml-2 font-semibold text-white">{selectedMode?.title}</span>
          </p>
          {step3Data?.castingMode === 'live-audition' && step3Data?.castingDirectorName && (
            <p>
              <span className="text-slate-400">Casting Director:</span>
              <span className="ml-2 font-semibold text-white">{step3Data.castingDirectorName}</span>
            </p>
          )}
          {step3Data?.allowGuestSubmissions && (
            <p className="text-sm text-green-400">✓ Guest submissions enabled</p>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
        <p className="text-blue-300 text-sm">
          💡 You can change the casting mode later. Each mode has different visibility and submission options.
        </p>
      </div>
    </div>
  )
}

export default Step3CastingMode
