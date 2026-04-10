// Component: Step2RoleBreakdown.tsx
// Purpose: Dynamic role builder with inline editing and budget validation
// Location: apps/appclient/src/components/projects/steps/Step2RoleBreakdown.tsx

import React from 'react'
import { useProjectWizardStore, selectStep2Data, RoleEntry } from '../../../store/useProjectWizardStore'
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import RoleBuilder from '../RoleBuilder'

const Step2RoleBreakdown: React.FC = () => {
  const { addRole, removeRole, moveRole } = useProjectWizardStore()
  const budgetStatus = useProjectWizardStore((state) => state.calculateBudgetStatus())
  const step2Data = selectStep2Data(useProjectWizardStore.getState())

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Casting Breakdown</h2>
          <button
            onClick={addRole}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold-600 hover:bg-gold-700 text-slate-900 font-semibold transition-all hover:shadow-lg hover:shadow-gold-600/50"
          >
            <Plus size={20} />
            Add Role
          </button>
        </div>

        {step2Data?.roles && step2Data.roles.length > 0 ? (
          <div className="space-y-4">
            {/* Desktop View - Table */}
            <div className="hidden lg:block bg-slate-700/30 rounded-lg overflow-hidden border border-slate-600">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-700/50 border-b border-slate-600">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Role Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Qty</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Budget/Talent</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Total</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {step2Data.roles.map((role, idx) => (
                    <tr key={role.id} className="border-b border-slate-600 hover:bg-slate-700/30 transition-all">
                      <td className="px-4 py-3 text-white font-medium">{role.roleName}</td>
                      <td className="px-4 py-3 text-slate-300">{role.quantityNeeded}</td>
                      <td className="px-4 py-3 text-slate-300">Rp {role.budgetPerTalent.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gold-400 font-semibold">
                        Rp {(role.budgetPerTalent * role.quantityNeeded).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        <button
                          onClick={() => moveRole(role.id, 'up')}
                          disabled={idx === 0}
                          className="p-2 hover:bg-slate-600 rounded disabled:opacity-30 text-slate-400 hover:text-slate-200 transition-all"
                        >
                          <ChevronUp size={18} />
                        </button>
                        <button
                          onClick={() => moveRole(role.id, 'down')}
                          disabled={idx === step2Data.roles.length - 1}
                          className="p-2 hover:bg-slate-600 rounded disabled:opacity-30 text-slate-400 hover:text-slate-200 transition-all"
                        >
                          <ChevronDown size={18} />
                        </button>
                        <button
                          onClick={() => removeRole(role.id)}
                          className="p-2 hover:bg-red-600/30 rounded text-red-400 hover:text-red-300 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View - Cards */}
            <div className="lg:hidden space-y-3">
              {step2Data.roles.map((role, idx) => (
                <div key={role.id} className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-white">{role.roleName}</p>
                      <p className="text-sm text-slate-400">Qty: {role.quantityNeeded}</p>
                    </div>
                    <button
                      onClick={() => removeRole(role.id)}
                      className="p-2 hover:bg-red-600/30 rounded text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Rp {role.budgetPerTalent.toLocaleString()}</span>
                    <span className="text-gold-400 font-semibold">
                      Rp {(role.budgetPerTalent * role.quantityNeeded).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => moveRole(role.id, 'up')}
                      disabled={idx === 0}
                      className="flex-1 py-2 bg-slate-600 rounded text-sm disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveRole(role.id, 'down')}
                      disabled={idx === step2Data.roles.length - 1}
                      className="flex-1 py-2 bg-slate-600 rounded text-sm disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-700/20 rounded-lg border border-dashed border-slate-600">
            <p className="text-slate-400">No roles added yet. Click "Add Role" to get started.</p>
          </div>
        )}
      </div>

      {/* Budget Summary */}
      <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
        <h3 className="font-bold text-white mb-4">Budget Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-slate-300">
            <span>Project Budget:</span>
            <span className="text-gold-400 font-semibold">Rp {budgetStatus.total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Allocated for Roles:</span>
            <span className="text-gold-400 font-semibold">Rp {budgetStatus.allocated.toLocaleString()}</span>
          </div>
          <div className="h-px bg-slate-600 my-2"></div>
          <div className="flex justify-between items-center">
            <span className="text-slate-300">Remaining Budget:</span>
            <span className={`font-bold text-lg ${budgetStatus.isOverBudget ? 'text-red-400' : 'text-green-400'}`}>
              Rp {budgetStatus.remaining.toLocaleString()}
            </span>
          </div>
          {budgetStatus.isOverBudget && (
            <div className="mt-4 p-3 bg-red-600/20 border border-red-600/50 rounded text-red-300 text-sm">
              ⚠️ Total role budget exceeds project budget! Please adjust amounts.
            </div>
          )}
        </div>
      </div>

      {/* Role Editor Modal - shown when adding or editing */}
      <RoleBuilder />
    </div>
  )
}

export default Step2RoleBreakdown
