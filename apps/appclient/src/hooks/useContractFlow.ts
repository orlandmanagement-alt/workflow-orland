// @ts-nocheck
/**
 * useContractFlow Hook
 * Manages contract creation, signing, and payment flow
 */

import { useState, useCallback } from 'react'
import { apiClient } from '@/lib/phase4Api'
import type { Contract, LoadingState } from '@/types/phase4'

interface ContractFlowState {
  contract: Contract | null
  invoiceId: string | null
  paymentUrl: string | null
  signatures: {
    talent_signed: boolean
    client_signed: boolean
  }
}

interface UseContractFlowReturn {
  state: ContractFlowState
  loading: LoadingState
  createContract: (jobId: string, talentId: string, fee: number) => Promise<void>
  signContract: (contractId: string, signatureImage: string, signerType: 'talent' | 'client') => Promise<void>
  getContractDetails: (contractId: string) => Promise<void>
  resetFlow: () => void
  error: string | null
}

export const useContractFlow = (): UseContractFlowReturn => {
  const [state, setState] = useState<ContractFlowState>({
    contract: null,
    invoiceId: null,
    paymentUrl: null,
    signatures: {
      talent_signed: false,
      client_signed: false,
    },
  })

  const [loading, setLoading] = useState<LoadingState>({
    isLoading: false,
    error: null,
    success: false,
  })

  const [error, setError] = useState<string | null>(null)

  const createContract = useCallback(async (jobId: string, talentId: string, fee: number) => {
    setLoading({ isLoading: true, error: null, success: false })
    setError(null)

    try {
      const response = await apiClient.createContract({
        job_id: jobId,
        talent_id: talentId,
        fee,
      })

      if (response.status === 'success') {
        setState((prev) => ({
          ...prev,
          contract: response.data.contract || null,
          invoiceId: response.data.invoice_id,
          paymentUrl: response.data.payment_url,
        }))
        setLoading({ isLoading: false, error: null, success: true })
      } else {
        throw new Error(response.message || 'Failed to create contract')
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Unknown error'
      setError(errorMsg)
      setLoading({ isLoading: false, error: errorMsg, success: false })
    }
  }, [])

  const signContract = useCallback(
    async (contractId: string, signatureImage: string, signerType: 'talent' | 'client') => {
      setLoading({ isLoading: true, error: null, success: false })
      setError(null)

      try {
        const response = await apiClient.signContract(contractId, {
          signature_data: signatureImage,
          signer_type: signerType,
        })

        if (response.status === 'success') {
          setState((prev) => ({
            ...prev,
            signatures: {
              ...prev.signatures,
              [signerType === 'talent' ? 'talent_signed' : 'client_signed']: true,
            },
          }))

          // Refresh contract details to get updated status
          await getContractDetails(contractId)

          setLoading({ isLoading: false, error: null, success: true })
        } else {
          throw new Error(response.message || 'Failed to sign contract')
        }
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || err.message || 'Unknown error'
        setError(errorMsg)
        setLoading({ isLoading: false, error: errorMsg, success: false })
      }
    },
    []
  )

  const getContractDetails = useCallback(async (contractId: string) => {
    setLoading({ isLoading: true, error: null, success: false })
    setError(null)

    try {
      const response = await apiClient.getContract(contractId)

      if (response.status === 'success') {
        const contract = response.data

        setState((prev) => ({
          ...prev,
          contract,
          signatures: {
            talent_signed: !!contract.signature_talent,
            client_signed: !!contract.signature_client,
          },
        }))

        setLoading({ isLoading: false, error: null, success: true })
      } else {
        throw new Error(response.message || 'Failed to fetch contract')
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Unknown error'
      setError(errorMsg)
      setLoading({ isLoading: false, error: errorMsg, success: false })
    }
  }, [])

  const resetFlow = useCallback(() => {
    setState({
      contract: null,
      invoiceId: null,
      paymentUrl: null,
      signatures: {
        talent_signed: false,
        client_signed: false,
      },
    })
    setLoading({ isLoading: false, error: null, success: false })
    setError(null)
  }, [])

  return {
    state,
    loading,
    createContract,
    signContract,
    getContractDetails,
    resetFlow,
    error,
  }
}

// ============ usePayment Hook ============

interface UsePaymentReturn {
  loading: LoadingState
  processPayment: (invoiceId: string, method: string) => Promise<void>
  getInvoice: (invoiceId: string) => Promise<any>
}

export const usePayment = (): UsePaymentReturn => {
  const [loading, setLoading] = useState<LoadingState>({
    isLoading: false,
    error: null,
    success: false,
  })

  const processPayment = useCallback(async (invoiceId: string, method: string) => {
    setLoading({ isLoading: true, error: null, success: false })

    try {
      const response = await apiClient.processPayment(invoiceId, {
        payment_method: method as any,
      })

      if (response.status === 'success') {
        setLoading({ isLoading: false, error: null, success: true })
      } else {
        throw new Error(response.message || 'Payment failed')
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Payment processing error'
      setLoading({ isLoading: false, error: errorMsg, success: false })
    }
  }, [])

  const getInvoice = useCallback(async (invoiceId: string) => {
    setLoading({ isLoading: true, error: null, success: false })

    try {
      const response = await apiClient.getInvoice(invoiceId)

      if (response.status === 'success') {
        setLoading({ isLoading: false, error: null, success: true })
        return response.data
      } else {
        throw new Error(response.message || 'Failed to fetch invoice')
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Unknown error'
      setLoading({ isLoading: false, error: errorMsg, success: false })
      throw err
    }
  }, [])

  return {
    loading,
    processPayment,
    getInvoice,
  }
}

// ============ useEscrow Hook ============

interface EscrowData {
  total_escrow_held: number
  contracts: any[]
  ready_to_release: number
}

interface UseEscrowReturn {
  escrowData: EscrowData | null
  loading: LoadingState
  fetchEscrow: () => Promise<void>
}

export const useEscrow = (): UseEscrowReturn => {
  const [escrowData, setEscrowData] = useState<EscrowData | null>(null)
  const [loading, setLoading] = useState<LoadingState>({
    isLoading: false,
    error: null,
    success: false,
  })

  const fetchEscrow = useCallback(async () => {
    setLoading({ isLoading: true, error: null, success: false })

    try {
      const response = await apiClient.getEscrowDashboard()

      if (response.status === 'success') {
        setEscrowData(response.data)
        setLoading({ isLoading: false, error: null, success: true })
      } else {
        throw new Error(response.message || 'Failed to fetch escrow')
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Unknown error'
      setLoading({ isLoading: false, error: errorMsg, success: false })
    }
  }, [])

  return {
    escrowData,
    loading,
    fetchEscrow,
  }
}
