// Component: RoleBuilder.tsx
// Purpose: Advanced inline editor for individual roles with optional modal
// Location: apps/appclient/src/components/projects/RoleBuilder.tsx

import React, { useState } from 'react'
import { useProjectWizardStore, RoleEntry } from '../../store/useProjectWizardStore'
import { ChevronDown, Plus } from 'lucide-react'

interface Props {
  roleId?: string // For editing existing role
}

const RoleBuilder: React.FC<Props> = ({ roleId }) => {
  const { draft, updateRole } = useProjectWizardStore()
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(roleId || null)

  if (!draft) return null

  const role = roleId ? draft.step2.roles.find((r) => r.id === roleId) : null

  if (roleId && !role) return null

  const handleRoleUpdate = (field: keyof RoleEntry, value: any) => {
    if (!roleId) return
    updateRole(roleId, { [field]: value })
  }

  const toggleExpanded = (id: string) => {
    setExpandedRoleId(expandedRoleId === id ? null : id)
  }

  return (
    <div className="space-y-3">
      {draft.step2.roles.map((r) => (
        <div key={r.id} className="bg-slate-700/40 rounded-lg overflow-hidden border border-slate-600">
          {/* Role Header - Always Visible */}
          <button
            onClick={() => toggleExpanded(r.id)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/60 transition-all"
          >
            <div className="flex-1 text-left">
              <p className="font-semibold text-white">{r.roleName || '(Untitled Role)'}</p>
              <p className="text-xs text-slate-400">
                {r.quantityNeeded} position(s) • Rp {r.budgetPerTalent.toLocaleString()} each
              </p>
            </div>
            <ChevronDown
              size={20}
              className={`text-slate-400 transition-transform ${expandedRoleId === r.id ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Role Details - Expandable */}
          {expandedRoleId === r.id && (
            <div className="px-4 py-4 bg-slate-700/20 border-t border-slate-600 space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-2 block">Role Name *</label>
                  <input
                    type="text"
                    value={r.roleName}
                    onChange={(e) => handleRoleUpdate('roleName', e.target.value)}
                    placeholder="e.g., Lead Female Actor"
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded text-sm text-white placeholder-slate-500 focus:border-gold-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-2 block">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    value={r.quantityNeeded}
                    onChange={(e) => handleRoleUpdate('quantityNeeded', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded text-sm text-white focus:border-gold-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-2 block">Budget Per Talent (Rp) *</label>
                <input
                  type="number"
                  min="0"
                  value={r.budgetPerTalent}
                  onChange={(e) => handleRoleUpdate('budgetPerTalent', parseFloat(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded text-sm text-white focus:border-gold-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-2 block">Description</label>
                <textarea
                  value={r.roleDescription || ''}
                  onChange={(e) => handleRoleUpdate('roleDescription', e.target.value)}
                  placeholder="More details about the role..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded text-sm text-white placeholder-slate-500 focus:border-gold-500 focus:outline-none resize-none"
                />
              </div>

              {/* Advanced - Collapsible Section */}
              <details className="cursor-pointer">
                <summary className="text-sm font-semibold text-gold-400 hover:text-gold-300 transition-colors">
                  ⚙️ Advanced Options
                </summary>

                <div className="mt-3 space-y-4 p-3 bg-slate-700/30 rounded border border-slate-600">
                  {/* Gender */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-2 block">Gender Requirement</label>
                    <select
                      value={r.genderRequirement || 'any'}
                      onChange={(e) => handleRoleUpdate('genderRequirement', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded text-sm text-white focus:border-gold-500 focus:outline-none"
                    >
                      <option value="any">Any</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Age Range */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 mb-2 block">Age Min</label>
                      <input
                        type="number"
                        min="0"
                        value={r.ageMin || ''}
                        onChange={(e) => handleRoleUpdate('ageMin', e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="Min age"
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded text-sm text-white placeholder-slate-500 focus:border-gold-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 mb-2 block">Age Max</label>
                      <input
                        type="number"
                        min="0"
                        value={r.ageMax || ''}
                        onChange={(e) => handleRoleUpdate('ageMax', e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="Max age"
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded text-sm text-white placeholder-slate-500 focus:border-gold-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Height Range */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 mb-2 block">Height Min (cm)</label>
                      <input
                        type="number"
                        min="0"
                        value={r.heightMinCm || ''}
                        onChange={(e) => handleRoleUpdate('heightMinCm', e.target.value ? parseFloat(e.target.value) : undefined)}
                        placeholder="Min height"
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded text-sm text-white placeholder-slate-500 focus:border-gold-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 mb-2 block">Height Max (cm)</label>
                      <input
                        type="number"
                        min="0"
                        value={r.heightMaxCm || ''}
                        onChange={(e) => handleRoleUpdate('heightMaxCm', e.target.value ? parseFloat(e.target.value) : undefined)}
                        placeholder="Max height"
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded text-sm text-white placeholder-slate-500 focus:border-gold-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Skills Tags */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-2 block">Preferred Skills</label>
                    <p className="text-xs text-slate-400 mb-2">Comma-separated: e.g., "Acting, Singing, Dancing"</p>
                    <input
                      type="text"
                      value={r.preferredSkills?.join(', ') || ''}
                      onChange={(e) =>
                        handleRoleUpdate('preferredSkills', e.target.value.split(',').map((s) => s.trim()))
                      }
                      placeholder="Add skills..."
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded text-sm text-white placeholder-slate-500 focus:border-gold-500 focus:outline-none"
                    />
                  </div>
                </div>
              </details>

              {/* Budget Breakdown */}
              <div className="p-3 bg-gold-600/10 border border-gold-600/30 rounded">
                <p className="text-xs text-slate-400">Total for this role:</p>
                <p className="text-lg font-bold text-gold-400">
                  Rp {(r.budgetPerTalent * r.quantityNeeded).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default RoleBuilder
