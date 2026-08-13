// File: apps/appclient/src/components/workspace/KOLWorkspace/DigitalBriefForm.tsx
// Component untuk membuat digital campaign brief untuk KOL

import React, { useState } from 'react'
import { Plus, X, Sparkles } from 'lucide-react'

export interface DigitalBriefFormProps {
  onSubmit: (brief: any) => Promise<void>
  isLoading?: boolean
}

export const DigitalBriefForm: React.FC<DigitalBriefFormProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    campaign_name: '',
    campaign_description: '',
    campaign_objective: 'awareness' as const,
    do_list: [] as string[],
    dont_list: [] as string[],
    mandatory_hashtags: [] as string[],
    optional_hashtags: [] as string[],
    tone: 'casual',
    visual_guidelines: [] as string[],
    target_audience: '',
    posting_schedule: '',
    moodboard_urls: [] as string[],
  })

  const [currentItem, setCurrentItem] = useState('')
  const [editingField, setEditingField] = useState<keyof typeof formData | null>(null)

  const handleAddItem = (field: 'do_list' | 'dont_list' | 'mandatory_hashtags' | 'optional_hashtags' | 'visual_guidelines') => {
    if (!currentItem.trim()) return
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], currentItem.trim()],
    }))
    setCurrentItem('')
  }

  const handleRemoveItem = (
    field: 'do_list' | 'dont_list' | 'mandatory_hashtags' | 'optional_hashtags' | 'visual_guidelines',
    index: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await onSubmit(formData)
      // Reset form
      setFormData({
        campaign_name: '',
        campaign_description: '',
        campaign_objective: 'awareness',
        do_list: [],
        dont_list: [],
        mandatory_hashtags: [],
        optional_hashtags: [],
        tone: 'casual',
        visual_guidelines: [],
        target_audience: '',
        posting_schedule: '',
        moodboard_urls: [],
      })
    } catch (error) {
      console.error('Failed to submit brief:', error)
    }
  }

  const SectionHeader = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
    <div className="flex items-center gap-2 mt-6 mb-3 pt-4 border-t border-slate-700">
      <div className="text-blue-400">{icon}</div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
    </div>
  )

  const ItemsList = ({
    items,
    field,
    label,
  }: {
    items: string[]
    field: 'do_list' | 'dont_list' | 'mandatory_hashtags' | 'optional_hashtags' | 'visual_guidelines'
    label: string
  }) => (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-slate-300">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={editingField === field ? currentItem : ''}
          onChange={(e) => {
            setEditingField(field)
            setCurrentItem(e.target.value)
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleAddItem(field)
              setEditingField(null)
            }
          }}
          placeholder={`Add ${label.toLowerCase()}...`}
          className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={() => {
            handleAddItem(field)
            setEditingField(null)
          }}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
        >
          <Plus size={16} />
        </button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-2 px-3 py-1 bg-slate-700 text-white text-xs rounded-full"
            >
              {item}
              <button
                type="button"
                onClick={() => handleRemoveItem(field, idx)}
                className="ml-1 hover:text-red-400"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-4">
      {/* Basic Info */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">Campaign Name</label>
          <input
            type="text"
            value={formData.campaign_name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, campaign_name: e.target.value }))
            }
            placeholder="E.g. Summer 2026 Product Launch"
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Description
          </label>
          <textarea
            value={formData.campaign_description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, campaign_description: e.target.value }))
            }
            placeholder="Brief description of campaign goals..."
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Campaign Objective
            </label>
            <select
              value={formData.campaign_objective}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  campaign_objective: e.target.value as any,
                }))
              }
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
            >
              <option value="awareness">Awareness</option>
              <option value="engagement">Engagement</option>
              <option value="conversion">Conversion</option>
              <option value="viral">Viral</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Tone</label>
            <select
              value={formData.tone}
              onChange={(e) => setFormData((prev) => ({ ...prev, tone: e.target.value }))}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
            >
              <option value="casual">Casual</option>
              <option value="professional">Professional</option>
              <option value="funny">Funny</option>
              <option value="serious">Serious</option>
              <option value="aspirational">Aspirational</option>
            </select>
          </div>
        </div>
      </div>

      {/* Guidelines */}
      <SectionHeader icon={<Sparkles size={18} />} title="Content Guidelines" />

      <div className="space-y-3">
        <ItemsList items={formData.do_list} field="do_list" label="DO's" />
        <ItemsList items={formData.dont_list} field="dont_list" label="DON'Ts" />
        <ItemsList
          items={formData.mandatory_hashtags}
          field="mandatory_hashtags"
          label="Mandatory Hashtags"
        />
        <ItemsList
          items={formData.optional_hashtags}
          field="optional_hashtags"
          label="Optional Hashtags"
        />
        <ItemsList
          items={formData.visual_guidelines}
          field="visual_guidelines"
          label="Visual Guidelines"
        />
      </div>

      {/* Additional Info */}
      <SectionHeader icon={<Sparkles size={18} />} title="Targeting & Schedule" />

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Target Audience
          </label>
          <input
            type="text"
            value={formData.target_audience}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, target_audience: e.target.value }))
            }
            placeholder="E.g. 18-35, Urban, Tech-savvy"
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Posting Schedule
          </label>
          <input
            type="text"
            value={formData.posting_schedule}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, posting_schedule: e.target.value }))
            }
            placeholder="E.g. Post by April 15, 2026 at 6 PM"
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-4 border-t border-slate-700">
        <button
          type="submit"
          disabled={isLoading || !formData.campaign_name}
          className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded font-semibold disabled:opacity-50 transition-all"
        >
          {isLoading ? 'Creating Brief...' : 'Publish Brief'}
        </button>
      </div>
    </form>
  )
}
