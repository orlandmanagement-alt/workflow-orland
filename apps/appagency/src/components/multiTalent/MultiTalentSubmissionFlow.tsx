/**
 * Multi-Talent Submission React Components
 * File: apps/appagency/src/components/multiTalent/MultiTalentSubmissionFlow.tsx
 * 
 * Components:
 * - MultiTalentSubmissionFlow (main orchestrator)
 * - RosterFilterModal
 * - TalentSelectionTable
 * - FinancialSummary
 * - SubmissionConfirmation
 */

import React, { useMemo, useState, useCallback } from 'react'
import { formatCurrency } from '../../lib/helpers'
import type {
  TalentCandidate,
  FilteredRoster,
  BulkSubmissionPayload,
  BulkSubmissionResponse,
  FinancialSummary as FinancialSummaryType,
  MultiTalentSubmissionState,
} from '@/types/multiTalentSubmission'

// ============================================================================
// MAIN FLOW COMPONENT
// ============================================================================

interface MultiTalentSubmissionFlowProps {
  projectId: string
  projectName: string
  agencyId: string
  onSubmitted?: (response: BulkSubmissionResponse) => void
}

export const MultiTalentSubmissionFlow: React.FC<MultiTalentSubmissionFlowProps> = ({
  projectId,
  projectName,
  agencyId,
  onSubmitted,
}) => {
  const [step, setStep] = useState<'filter' | 'select' | 'review' | 'confirm'>('filter')
  const [rosterData, setRosterData] = useState<FilteredRoster | null>(null)
  const [selectedTalents, setSelectedTalents] = useState<Set<string>>(new Set())
  const [pricingOverrides, setPricingOverrides] = useState<Map<string, number>>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submissionResponse, setSubmissionResponse] = useState<BulkSubmissionResponse | null>(null)

  // Fetch filtered roster
  const fetchRoster = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/v1/agency/roster?project_id=${projectId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      const { success, data, error: apiError } = await response.json()

      if (!success) {
        throw new Error(apiError?.message || 'Failed to fetch roster')
      }

      setRosterData(data)
      setStep('select')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  // Handle talent selection
  const toggleTalent = useCallback((talentId: string) => {
    setSelectedTalents((prev) => {
      const next = new Set(prev)
      if (next.has(talentId)) {
        next.delete(talentId)
      } else {
        next.add(talentId)
      }
      return next
    })
  }, [])

  // Handle pricing override
  const updatePrice = useCallback((talentId: string, newPrice: number) => {
    setPricingOverrides((prev) => {
      const next = new Map(prev)
      if (newPrice <= 0) {
        next.delete(talentId)
      } else {
        next.set(talentId, newPrice)
      }
      return next
    })
  }, [])

  // Submit bulk application
  const submitBulk = useCallback(async () => {
    if (selectedTalents.size === 0) {
      setError('Select at least one talent')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const submissions = Array.from(selectedTalents).map((talentId) => {
        const candidate = rosterData?.candidates.find((c) => c.id === talentId)
        if (!candidate) throw new Error(`Candidate ${talentId} not found`)

        const proposedAmount = pricingOverrides.get(talentId) || candidate.pricing.proposedAmount

        return {
          talentId,
          agencyTalentId: candidate.agencyTalentId,
          roleName: candidate.rateCard.serviceName,
          roleId: 'role_' + talentId,
          matchScore: candidate.matchScore,
          matchBreakdown: candidate.matchBreakdown,
          pricing: {
            serviceName: candidate.rateCard.serviceName,
            proposedAmount,
            currency: candidate.rateCard.baseCurrency,
            agencyMarkupPercent: 15,
            agencyCommissionPercent: 20,
          },
        }
      })

      const payload: BulkSubmissionPayload = {
        projectId,
        batchNotes: `Multi-talent submission - ${submissions.length} candidates`,
        submissions,
      }

      const response = await fetch('/api/v1/agency/projects/apply-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      })

      const { success, data: respData, error: apiError } = await response.json()

      if (!success) {
        throw new Error(apiError?.message || 'Submission failed')
      }

      setSubmissionResponse(respData)
      setStep('confirm')
      onSubmitted?.(respData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [selectedTalents, pricingOverrides, rosterData, projectId, onSubmitted])

  // Calculate financial summary
  const financialSummary = useMemo(() => {
    if (!rosterData) return null

    const selectedCandidates = rosterData.candidates.filter((c: TalentCandidate) => selectedTalents.has(c.id))
    const totalProposed = selectedCandidates.reduce((sum: number, c: TalentCandidate) => {
      return sum + (pricingOverrides.get(c.id) || c.pricing.proposedAmount)
    }, 0)

    return {
      totalProposedRevenue: totalProposed,
      totalAgencyFee: totalProposed * 0.2,
      totalTalentPayment: totalProposed * 0.8,
      currency: 'IDR',
      agencyCommissionPercent: 20,
    }
  }, [rosterData, selectedTalents, pricingOverrides])

  // Render based on step
  if (step === 'filter' || !rosterData) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-xl border border-gold/20 p-8">
          <h2 className="text-2xl font-bold text-white mb-2">{projectName}</h2>
          <p className="text-gray-400 mb-6">
            {rosterData?.eligibleCount || 0} eligible talents in your roster for this project
          </p>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/50 p-4 mb-6">
              <p className="text-red-200">{error}</p>
            </div>
          )}

          <button
            onClick={fetchRoster}
            disabled={loading}
            className="px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-gold/90 disabled:opacity-50 transition-all"
          >
            {loading ? 'Loading...' : 'View Eligible Talents'}
          </button>
        </div>
      </div>
    )
  }

  if (step === 'confirm' && submissionResponse) {
    return <SubmissionConfirmation response={submissionResponse} projectName={projectName} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">{projectName}</h2>
          <p className="text-gray-400 text-sm">
            {selectedTalents.size} of {rosterData.eligibleCount} selected
          </p>
        </div>
        <button
          onClick={() => setStep('filter')}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ← Back
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/50 p-4">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Main Table */}
        <div className="col-span-2">
          <TalentSelectionTable
            candidates={rosterData.candidates}
            selectedTalents={selectedTalents}
            onSelectionChange={toggleTalent}
            onPricingChange={updatePrice}
            agencyCommissionPercent={20}
            loading={loading}
          />
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-4">
          {financialSummary && <FinancialSummary {...financialSummary} />}

          <button
            onClick={submitBulk}
            disabled={selectedTalents.size === 0 || loading}
            className="w-full px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-gold/90 disabled:opacity-50 transition-all"
          >
            {loading ? 'Submitting...' : `Submit ${selectedTalents.size} Talents`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// TALENT SELECTION TABLE COMPONENT
// ============================================================================

interface TalentSelectionTableProps {
  candidates: TalentCandidate[]
  selectedTalents: Set<string>
  onSelectionChange: (talentId: string, selected: boolean) => void
  onPricingChange: (talentId: string, newPrice: number, serviceName: string) => void
  agencyCommissionPercent: number
  loading?: boolean
}

export const TalentSelectionTable: React.FC<TalentSelectionTableProps> = ({
  candidates,
  selectedTalents,
  onSelectionChange,
  onPricingChange,
  agencyCommissionPercent,
  loading = false,
}) => {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null)

  const selectedCount = selectedTalents.size
  const selectedTotal = useMemo(() => {
    return candidates
      .filter((c: TalentCandidate) => selectedTalents.has(c.id))
      .reduce((sum: number, c: TalentCandidate) => sum + (c.pricing.proposedAmount || 0), 0)
  }, [candidates, selectedTalents])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gold/20 border-t-gold rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading eligible candidates...</p>
        </div>
      </div>
    )
  }

  if (candidates.length === 0) {
    return (
      <div className="rounded-xl bg-black/40 backdrop-blur-xl border border-gold/10 p-12 text-center">
        <p className="text-gray-400">No eligible talents found for this project</p>
        <p className="text-xs text-gray-500 mt-2">Check project requirements and roster profiles</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="flex justify-between items-center px-1 py-2 border-b border-gold/20">
        <p className="text-sm text-gray-400">
          {selectedCount} of {candidates.length} selected
        </p>
        <p className="text-sm font-mono text-gold">{formatCurrency(selectedTotal, 'IDR')}</p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl bg-black/40 backdrop-blur-xl border border-gold/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gold/20 bg-gradient-to-r from-black/60 to-black/20">
              <th className="px-4 py-3 text-left font-semibold text-gray-200 w-12">
                <input
                  type="checkbox"
                  checked={selectedCount === candidates.length && candidates.length > 0}
                  onChange={(e) => {
                    candidates.forEach((c) => onSelectionChange(c.id, e.target.checked))
                  }}
                  className="w-5 h-5 rounded border-gold/30 bg-black/30 cursor-pointer accent-gold"
                />
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-200">Talent</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-200 w-20">Match %</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-200 w-32">Service</th>
              <th className="px-4 py-3 text-right font-semibold text-gold w-40">Proposed Rate</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-200 w-32">Agency Fee</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((talent) => {
              const isSelected = selectedTalents.has(talent.id)
              const isHovered = hoveredRow === talent.id
              const agencyFee = talent.pricing.proposedAmount * (agencyCommissionPercent / 100)

              return (
                <tr
                  key={talent.id}
                  onMouseEnter={() => setHoveredRow(talent.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className={`border-b border-gold/5 transition-all ${
                    isSelected ? 'bg-gold/5' : isHovered ? 'bg-black/30' : 'hover:bg-black/20'
                  }`}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => onSelectionChange(talent.id, e.target.checked)}
                      className="w-5 h-5 rounded border-gold/30 bg-black/30 cursor-pointer accent-gold"
                    />
                  </td>

                  {/* Talent Info */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {talent.profilePhoto && (
                        <img
                          src={talent.profilePhoto}
                          alt={talent.name}
                          className="w-10 h-10 rounded-lg object-cover border border-gold/20"
                        />
                      )}
                      <div>
                        <p className="font-medium text-white">{talent.name}</p>
                        <p className="text-xs text-gray-400">
                          {talent.profiles.age}y • {talent.profiles.height_cm}cm
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Match Score */}
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center">
                      <div className="relative w-12 h-12">
                        <svg className="w-12 h-12" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="16" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.1" />
                          <circle
                            cx="18"
                            cy="18"
                            r="16"
                            fill="none"
                            stroke="#D4AF37"
                            strokeWidth="2"
                            strokeDasharray={`${(talent.matchScore / 100) * 100.5} 100.5`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gold">
                          {Math.round(talent.matchScore)}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Service Name */}
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium px-2 py-1 rounded-md bg-black/40 text-gray-300 border border-gold/10">
                      {talent.rateCard.serviceName.substring(0, 20)}...
                    </span>
                  </td>

                  {/* Pricing (Editable) */}
                  <td className="px-4 py-3 text-right">
                    {editingPriceId === talent.id ? (
                      <input
                        type="number"
                        value={talent.pricing.proposedAmount}
                        onChange={(e) => {
                          onPricingChange(talent.id, parseFloat(e.target.value), talent.rateCard.serviceName)
                        }}
                        onBlur={() => setEditingPriceId(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setEditingPriceId(null)
                        }}
                        className="w-full px-3 py-2 rounded-lg bg-gold/10 border border-gold/50 text-gold font-mono text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => setEditingPriceId(talent.id)}
                        className="font-mono text-gold hover:text-gold/80 transition-colors"
                      >
                        {formatCurrency(talent.pricing.proposedAmount, 'IDR')}
                      </button>
                    )}
                  </td>

                  {/* Agency Fee */}
                  <td className="px-4 py-3 text-right text-gray-400 font-mono text-xs">
                    {formatCurrency(agencyFee, 'IDR')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ============================================================================
// FINANCIAL SUMMARY COMPONENT
// ============================================================================

export const FinancialSummary: React.FC<FinancialSummaryType> = ({
  totalProposedRevenue,
  totalAgencyFee,
  totalTalentPayment,
  currency,
  agencyCommissionPercent,
}) => {
  return (
    <div className="rounded-xl bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-xl border border-gold/20 p-6 space-y-6">
      <h3 className="text-lg font-semibold text-white">Financial Summary</h3>

      {/* Summary Cards */}
      <div className="space-y-3">
        <div className="rounded-lg bg-black/60 border border-gold/10 p-4">
          <p className="text-xs text-gray-400 mb-1">Total Proposed</p>
          <p className="text-2xl font-bold text-gold">{formatCurrency(totalProposedRevenue, currency)}</p>
        </div>
        <div className="rounded-lg bg-black/60 border border-green-500/10 p-4">
          <p className="text-xs text-gray-400 mb-1">Talent Payment</p>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(totalTalentPayment, currency)}</p>
        </div>
        <div className="rounded-lg bg-black/60 border border-gold/20 p-4">
          <p className="text-xs text-gray-400 mb-1">Agency Fee</p>
          <p className="text-2xl font-bold text-gold">{formatCurrency(totalAgencyFee, currency)}</p>
        </div>
      </div>

      {/* Revenue Split */}
      <div className="space-y-2">
        <p className="text-xs text-gray-400">Revenue Split</p>
        <div className="flex gap-2 h-8 rounded-lg overflow-hidden border border-gold/10">
          <div
            className="bg-green-500/60 flex items-center justify-center text-xs font-bold text-white"
            style={{ width: `${(totalTalentPayment / totalProposedRevenue) * 100}%` }}
          >
            {Math.round((totalTalentPayment / totalProposedRevenue) * 100)}%
          </div>
          <div
            className="bg-gold/60 flex items-center justify-center text-xs font-bold text-black"
            style={{ width: `${(totalAgencyFee / totalProposedRevenue) * 100}%` }}
          >
            {Math.round((totalAgencyFee / totalProposedRevenue) * 100)}%
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gold/10 space-y-1">
        <p className="text-xs text-gray-400">Commission</p>
        <p className="text-sm text-gold font-mono">{agencyCommissionPercent}% agency fee</p>
      </div>
    </div>
  )
}

// ============================================================================
// SUBMISSION CONFIRMATION COMPONENT
// ============================================================================

interface SubmissionConfirmationProps {
  response: BulkSubmissionResponse
  projectName: string
}

export const SubmissionConfirmation: React.FC<SubmissionConfirmationProps> = ({ response, projectName }) => {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Success Card */}
      <div className="rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 backdrop-blur-xl border border-green-500/30 p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Submission Successful!</h2>
          <p className="text-gray-400">All {response.totalSubmissions} talents have been submitted to {projectName}</p>
        </div>
      </div>

      {/* Results */}
      <div className="rounded-xl bg-black/40 backdrop-blur-xl border border-gold/10 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">Submission Summary</h3>

        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-black/60 border border-gold/20 p-4 text-center">
            <p className="text-3xl font-bold text-gold">{response.totalSubmissions}</p>
            <p className="text-xs text-gray-400 mt-1">Talents Submitted</p>
          </div>
          <div className="rounded-lg bg-black/60 border border-gold/20 p-4 text-center">
            <p className="text-3xl font-bold text-green-400">{formatCurrency(response.financialSummary.totalProposedRevenue, response.financialSummary.currency)}</p>
            <p className="text-xs text-gray-400 mt-1">Total Value</p>
          </div>
          <div className="rounded-lg bg-black/60 border border-gold/20 p-4 text-center">
            <p className="text-3xl font-bold text-gold">{formatCurrency(response.financialSummary.totalAgencyFee, response.financialSummary.currency)}</p>
            <p className="text-xs text-gray-400 mt-1">Agency Fee</p>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="rounded-xl bg-black/40 backdrop-blur-xl border border-gold/10 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">Next Steps</h3>
        <ul className="space-y-2">
          {response.nextSteps.map((step: string, idx: number) => (
            <li key={idx} className="flex items-start gap-3 text-gray-300">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center text-gold text-sm font-semibold mt-0.5">
                {idx + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Batch ID */}
      <div className="text-center space-y-2">
        <p className="text-xs text-gray-400">Batch Reference</p>
        <p className="font-mono text-gold text-lg break-all">{response.batchId}</p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => window.location.href = '/agency/submissions'}
          className="flex-1 px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-gold/90 transition-all"
        >
          View All Submissions
        </button>
        <button
          onClick={() => window.location.href = '/agency/roster'}
          className="flex-1 px-6 py-3 bg-black/60 text-gold border border-gold/30 font-semibold rounded-lg hover:bg-black/80 transition-all"
        >
          Back to Roster
        </button>
      </div>
    </div>
  )
}
