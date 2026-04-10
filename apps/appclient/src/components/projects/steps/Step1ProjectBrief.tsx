// Component: Step1ProjectBrief.tsx
// Purpose: Project basic information form
// Location: apps/appclient/src/components/projects/steps/Step1ProjectBrief.tsx

import React, { useRef, useState } from 'react'
import { useProjectWizardStore, selectStep1Data } from '../../../store/useProjectWizardStore'
import { Upload, X } from 'lucide-react'

const Step1ProjectBrief: React.FC = () => {
  const { draft, updateStep1 } = useProjectWizardStore()
  const step1Data = selectStep1Data(useProjectWizardStore.getState())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(step1Data?.bannerUrl || null)

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const preview = event.target?.result as string
        setBannerPreview(preview)
        updateStep1({ bannerFile: file, bannerUrl: preview })
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <label className="block text-sm font-semibold text-slate-200 mb-3">Project Title *</label>
        <input
          type="text"
          value={step1Data?.title || ''}
          onChange={(e) => updateStep1({ title: e.target.value })}
          placeholder="e.g., TVC Skincare Brand X - 2026"
          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-200 mb-3">Description</label>
        <textarea
          value={step1Data?.description || ''}
          onChange={(e) => updateStep1({ description: e.target.value })}
          placeholder="Describe the project, brand, and creative vision..."
          rows={4}
          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all resize-none"
        />
      </div>

      {/* Banner Upload */}
      <div>
        <label className="block text-sm font-semibold text-slate-200 mb-3">Project Banner</label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className="relative border-2 border-dashed border-slate-600 rounded-lg p-6 cursor-pointer hover:border-gold-500 transition-all bg-slate-700/20"
        >
          {bannerPreview ? (
            <div className="relative group">
              <img src={bannerPreview} alt="Banner preview" className="w-full h-48 object-cover rounded-lg" />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setBannerPreview(null)
                  updateStep1({ bannerFile: undefined, bannerUrl: undefined })
                }}
                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all"
              >
                <X size={18} className="text-white" />
              </button>
            </div>
          ) : (
            <div className="text-center">
              <Upload size={32} className="mx-auto text-slate-400 mb-3" />
              <p className="text-slate-300 font-medium">Click to upload banner image</p>
              <p className="text-slate-400 text-sm mt-1">or drag and drop</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleBannerChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Budget & Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-3">Total Budget *</label>
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="number"
                value={step1Data?.budgetTotal || ''}
                onChange={(e) => updateStep1({ budgetTotal: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-gold-500"
              />
            </div>
            <select
              value={step1Data?.budgetCurrency || 'IDR'}
              onChange={(e) => updateStep1({ budgetCurrency: e.target.value as 'IDR' | 'USD' })}
              className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-gold-500"
            >
              <option>IDR</option>
              <option>USD</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-3">Casting Deadline *</label>
          <input
            type="date"
            value={step1Data?.castingDeadline || ''}
            onChange={(e) => updateStep1({ castingDeadline: e.target.value })}
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-gold-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-200 mb-3">Project Start Date (Optional)</label>
        <input
          type="date"
          value={step1Data?.projectStartDate || ''}
          onChange={(e) => updateStep1({ projectStartDate: e.target.value })}
          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-gold-500"
        />
      </div>

      {/* Info Box */}
      <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
        <p className="text-blue-300 text-sm">
          💡 All information can be edited in subsequent steps. The project will be saved as a draft until you reach the final step.
        </p>
      </div>
    </div>
  )
}

export default Step1ProjectBrief
