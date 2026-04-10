// Component: Step4ProductionLogistics.tsx
// Purpose: Optional file uploads for scripts, storyboards, etc
// Location: apps/appclient/src/components/projects/steps/Step4ProductionLogistics.tsx

import React, { useRef } from 'react'
import { useProjectWizardStore, selectStep4Data } from '../../../store/useProjectWizardStore'
import { Upload, X, FileText } from 'lucide-react'

const Step4ProductionLogistics: React.FC = () => {
  const { updateStep4 } = useProjectWizardStore()
  const step4Data = selectStep4Data(useProjectWizardStore.getState())

  const scriptInputRef = useRef<HTMLInputElement>(null)
  const storyboardInputRef = useRef<HTMLInputElement>(null)
  const rundownInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fileType: 'scriptFile' | 'storyboardFile' | 'rundownFile'
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      updateStep4({ [fileType]: file })
    }
  }

  const handleRemoveFile = (fileType: 'scriptFile' | 'storyboardFile' | 'rundownFile') => {
    updateStep4({ [fileType]: undefined })
  }

  const fileTypes = [
    {
      key: 'scriptFile' as const,
      label: 'Script / Dialogue',
      description: 'PDF or DOCX with cast dialogue and scenes',
      inputRef: scriptInputRef,
      accept: '.pdf,.doc,.docx,.txt',
    },
    {
      key: 'storyboardFile' as const,
      label: 'Storyboard / Concept',
      description: 'Images or PDF with visual direction',
      inputRef: storyboardInputRef,
      accept: '.pdf,.jpg,.jpeg,.png,.pptx',
    },
    {
      key: 'rundownFile' as const,
      label: 'Shooting Rundown / Call Sheet',
      description: 'Timeline and schedule for the shoot',
      inputRef: rundownInputRef,
      accept: '.pdf,.xlsx,.xls,.csv',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-bold text-white mb-2">Production Files (Optional)</h2>
        <p className="text-slate-400 text-sm mb-6">
          Upload supporting documents that will help talents understand the project better.
        </p>
      </div>

      {/* File Upload Cards */}
      <div className="grid grid-cols-1 gap-6">
        {fileTypes.map((fileType) => {
          const file = step4Data?.[fileType.key]
          const hasFile = file !== undefined

          return (
            <div
              key={fileType.key}
              className="bg-slate-700/30 border border-slate-600 rounded-lg p-6 hover:border-slate-500 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-white">{fileType.label}</h3>
                  <p className="text-sm text-slate-400 mt-1">{fileType.description}</p>
                </div>
                {hasFile && (
                  <button
                    onClick={() => handleRemoveFile(fileType.key)}
                    className="p-2 hover:bg-red-600/30 rounded text-red-400 hover:text-red-300 transition-all"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {hasFile ? (
                <div className="flex items-center gap-3 p-3 bg-green-600/20 border border-green-600/50 rounded-lg">
                  <FileText size={20} className="text-green-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-300">
                      {(file as File).name || 'File uploaded'}
                    </p>
                    <p className="text-xs text-green-400">
                      {((file as File).size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <span className="text-green-400 font-bold">✓</span>
                </div>
              ) : (
                <button
                  onClick={() => fileType.inputRef.current?.click()}
                  className="w-full p-4 border-2 border-dashed border-slate-600 rounded-lg hover:border-gold-500 hover:bg-gold-600/5 transition-all flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-gold-400"
                >
                  <Upload size={24} />
                  <span className="text-sm font-medium">Click to upload or drag and drop</span>
                  <span className="text-xs">Max 50MB</span>
                </button>
              )}

              <input
                ref={fileType.inputRef}
                type="file"
                accept={fileType.accept}
                onChange={(e) => handleFileChange(e, fileType.key)}
                className="hidden"
              />
            </div>
          )
        })}
      </div>

      {/* Production Notes */}
      <div>
        <label className="block text-sm font-semibold text-slate-200 mb-3">Production Notes</label>
        <textarea
          value={step4Data?.productionNotes || ''}
          onChange={(e) => updateStep4({ productionNotes: e.target.value })}
          placeholder="Any additional notes, requirements, or special instructions for talents..."
          rows={5}
          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all resize-none"
        />
      </div>

      {/* Summary */}
      <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
        <h3 className="font-bold text-white mb-4">Upload Summary</h3>
        <div className="space-y-2">
          {fileTypes.map((fileType) => {
            const hasFile = step4Data?.[fileType.key] !== undefined
            return (
              <div key={fileType.key} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${hasFile ? 'bg-green-400' : 'bg-slate-600'}`}></span>
                <span className={`text-sm ${hasFile ? 'text-green-400 font-medium' : 'text-slate-400'}`}>
                  {fileType.label} {hasFile ? '✓' : '(optional)'}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Final Check */}
      <div className="bg-gold-900/20 border border-gold-600/30 rounded-lg p-4">
        <p className="text-gold-300 text-sm">
          ✨ You're ready to publish! All your project information will be saved and made available to talents through
          your chosen casting mode.
        </p>
      </div>
    </div>
  )
}

export default Step4ProductionLogistics
