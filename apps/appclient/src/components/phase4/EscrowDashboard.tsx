/**
 * Escrow Dashboard Component
 * Shows client's held escrow and payment status
 */

import React, { useEffect } from 'react'
import { DollarSign, AlertCircle, CheckCircle, Clock, ArrowRight } from 'lucide-react'
import { phase4API } from '../../lib/phase4API'

interface EscrowContract {
  contract_id: string
  talent_name: string
  project_name: string
  escrow_amount: number
  status: string
  signatures_needed: string[]
}

interface EscrowDashboardProps {
  onPaymentClick?: (contractId: string, invoiceId: string) => void
}

export const EscrowDashboard: React.FC<EscrowDashboardProps> = ({ onPaymentClick }) => {
  const [escrow, setEscrow] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  useEffect(() => {
    const fetchEscrow = async () => {
      try {
        const response = await phase4API.getEscrowDashboard()
        if (response.status === 'success' && response.data) {
          setEscrow(response.data)
        }
      } catch (err) {
        setError(phase4API.parseError(err))
      } finally {
        setLoading(false)
      }
    }

    fetchEscrow()
  }, [])

  if (loading) {
    return (
      <div className="w-full p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const totalEscrow = escrow?.total_escrow_held || 0
  const readyToRelease = escrow?.ready_to_release || 0
  const contracts = escrow?.contracts || []

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Escrow Dashboard</h2>
        <p className="text-gray-600 mt-1">
          Monitor your held escrow and pending contract signatures
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Error loading escrow</p>
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Held */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-600">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Escrow Held</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {phase4API.formatIDR(totalEscrow)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        {/* Ready to Release */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-600">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm">Ready to Release</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {phase4API.formatIDR(readyToRelease)}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        {/* Pending Signature */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-600">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm">Awaiting Signatures</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {contracts.filter((c: EscrowContract) => c.signatures_needed.length > 0).length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Contracts List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="font-semibold text-gray-900">Active Contracts</h3>
        </div>

        {contracts.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No active contracts with held escrow</p>
          </div>
        ) : (
          <div className="divide-y">
            {contracts.map((contract: EscrowContract) => (
              <div key={contract.contract_id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      {contract.project_name}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Talent: {contract.talent_name}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Contract ID: {contract.contract_id.substring(0, 12)}...
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      {phase4API.formatIDR(contract.escrow_amount)}
                    </p>
                    <div className="mt-3 space-y-1">
                      {contract.signatures_needed.length > 0 ? (
                        <div className="flex items-center gap-2 text-yellow-700 text-sm">
                          <Clock className="w-4 h-4" />
                          <span>
                            Waiting for {contract.signatures_needed.join(', ')} signature
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-green-700 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          <span>Both signed, ready to release</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {contract.signatures_needed.length === 0 && (
                  <button
                    onClick={() =>
                      onPaymentClick?.(contract.contract_id, contract.contract_id)
                    }
                    className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-semibold"
                  >
                    Process Payment
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">How escrow works:</span> When you create a contract, 
          50% of the fee is held in escrow. Once both parties sign, the full amount is released. 
          You can then process payment to distribute funds to the talent and agency.
        </p>
      </div>
    </div>
  )
}

export default EscrowDashboard
