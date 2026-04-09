/**
 * Phase 4 React Hooks
 * Custom hooks for managing Phase 4 feature state
 */

import { useState, useCallback, useEffect } from 'react'
import type {
  Contract,
  Invoice,
  AIMatchResult,
  TalentAnalytics,
  Availability,
  WhiteLabelConfig,
  LoadingState,
  ApiResponse,
} from '../types/phase4'
import { phase4API } from '@/lib/phase4API'

// ============ CONTRACT HOOKS ============

export function useContract(contractId?: string) {
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchContract = useCallback(async (id: string) => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const response = await phase4API.getContract(id)
      if (response.status === 'success' && response.data) {
        setContract(response.data as Contract)
      }
    } catch (err) {
      setError(phase4API.parseError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  const createContract = useCallback(async (jobId: string, talentId: string, fee: number) => {
    setLoading(true)
    setError(null)
    try {
      const response = await phase4API.createContract(jobId, talentId, fee)
      if (response.status === 'success' && response.data) {
        setContract(response.data as Contract)
        return response.data
      }
    } catch (err) {
      setError(phase4API.parseError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  const signContract = useCallback(
    async (id: string, signatureData: string, signerType: 'talent' | 'client') => {
      setLoading(true)
      setError(null)
      try {
        const response = await phase4API.signContract(id, signatureData, signerType)
        if (response.status === 'success') {
          if (contractId) await fetchContract(id)
          return true
        }
      } catch (err) {
        setError(phase4API.parseError(err))
      } finally {
        setLoading(false)
      }
      return false
    },
    [contractId, fetchContract]
  )

  useEffect(() => {
    if (contractId) {
      fetchContract(contractId)
    }
  }, [contractId, fetchContract])

  return { contract, loading, error, fetchContract, createContract, signContract }
}

// ============ INVOICE HOOKS ============

export function useInvoice(invoiceId?: string) {
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchInvoice = useCallback(async (id: string) => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const response = await phase4API.getInvoice(id)
      if (response.status === 'success' && response.data) {
        setInvoice(response.data as Invoice)
      }
    } catch (err) {
      setError(phase4API.parseError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  const processPayment = useCallback(async (id: string, method: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await phase4API.processPayment(id, method)
      if (response.status === 'success') {
        await fetchInvoice(id)
        return true
      }
    } catch (err) {
      setError(phase4API.parseError(err))
    } finally {
      setLoading(false)
    }
    return false
  }, [fetchInvoice])

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice(invoiceId)
    }
  }, [invoiceId, fetchInvoice])

  return { invoice, loading, error, fetchInvoice, processPayment }
}

// ============ AI MATCHING HOOKS ============

export function useAIMatch() {
  const [results, setResults] = useState<AIMatchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const match = useCallback(async (prompt: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await phase4API.matchTalents(prompt)
      if (response.status === 'success' && response.data) {
        setResults(response.data as AIMatchResult)
        return response.data
      }
    } catch (err) {
      setError(phase4API.parseError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  const batchMatch = useCallback(async (prompts: string[]) => {
    setLoading(true)
    setError(null)
    try {
      const response = await phase4API.batchMatch(prompts)
      if (response.status === 'success') {
        return response.data
      }
    } catch (err) {
      setError(phase4API.parseError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  return { results, loading, error, match, batchMatch }
}

// ============ ANALYTICS HOOKS ============

export function useAnalytics(talentId?: string) {
  const [analytics, setAnalytics] = useState<TalentAnalytics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async (id: string) => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const response = await phase4API.getTalentAnalytics(id)
      if (response.status === 'success' && response.data) {
        setAnalytics(response.data as TalentAnalytics)
      }
    } catch (err) {
      setError(phase4API.parseError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (talentId) {
      fetchAnalytics(talentId)
    }
  }, [talentId, fetchAnalytics])

  return { analytics, loading, error, fetchAnalytics }
}

export function useMyAnalytics() {
  const [dashboard, setDashboard] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await phase4API.getMyAnalyticsDashboard()
      if (response.status === 'success' && response.data) {
        setDashboard(response.data)
      }
    } catch (err) {
      setError(phase4API.parseError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { dashboard, loading, error, refresh: fetch }
}

// ============ AVAILABILITY HOOKS ============

export function useAvailability() {
  const [availability, setAvailability] = useState<Availability[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await phase4API.getMyAvailability()
      if (response.status === 'success' && response.data) {
        setAvailability(response.data.availability as Availability[])
      }
    } catch (err) {
      setError(phase4API.parseError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  const create = useCallback(
    async (startDate: string, endDate: string, status: string, reason?: string) => {
      try {
        const response = await phase4API.createAvailability({
          start_date: startDate,
          end_date: endDate,
          status: status as any,
          reason,
        })
        if (response.status === 'success') {
          await fetch()
          return true
        }
      } catch (err) {
        setError(phase4API.parseError(err))
      }
      return false
    },
    [fetch]
  )

  const update = useCallback(
    async (id: string, updates: any) => {
      try {
        const response = await phase4API.updateAvailability(id, updates)
        if (response.status === 'success') {
          await fetch()
          return true
        }
      } catch (err) {
        setError(phase4API.parseError(err))
      }
      return false
    },
    [fetch]
  )

  const remove = useCallback(
    async (id: string) => {
      try {
        const response = await phase4API.deleteAvailability(id)
        if (response.status === 'success') {
          await fetch()
          return true
        }
      } catch (err) {
        setError(phase4API.parseError(err))
      }
      return false
    },
    [fetch]
  )

  useEffect(() => {
    fetch()
  }, [fetch])

  return { availability, loading, error, fetch, create, update, remove }
}

// ============ WHITE-LABEL HOOKS ============

export function useWhiteLabel() {
  const [config, setConfig] = useState<WhiteLabelConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await phase4API.getWhiteLabelConfig()
      if (response.status === 'success' && response.data) {
        setConfig(response.data as WhiteLabelConfig)
      }
    } catch (err) {
      setError(phase4API.parseError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  const update = useCallback(
    async (updates: Partial<WhiteLabelConfig>) => {
      setLoading(true)
      setError(null)
      try {
        const response = await phase4API.updateWhiteLabelConfig(updates)
        if (response.status === 'success' && response.data) {
          setConfig(response.data as WhiteLabelConfig)
          return true
        }
      } catch (err) {
        setError(phase4API.parseError(err))
      } finally {
        setLoading(false)
      }
      return false
    },
    []
  )

  const uploadWatermark = useCallback(
    async (file: File) => {
      setLoading(true)
      setError(null)
      try {
        const response = await phase4API.uploadWatermark(file)
        if (response.status === 'success') {
          await fetch()
          return true
        }
      } catch (err) {
        setError(phase4API.parseError(err))
      } finally {
        setLoading(false)
      }
      return false
    },
    [fetch]
  )

  useEffect(() => {
    fetch()
  }, [fetch])

  return { config, loading, error, fetch, update, uploadWatermark }
}

// ============ UTILITY HOOKS ============

export function useLoadingState(initialState: boolean = false): LoadingState & {
  set: (loading: boolean, error?: string | null) => void
  clear: () => void
} {
  const [state, setState] = useState<LoadingState>({
    isLoading: initialState,
    error: null,
    success: false,
  })

  return {
    ...state,
    set: (loading, error = null) =>
      setState((prev) => ({
        ...prev,
        isLoading: loading,
        error,
        success: false,
      })),
    clear: () =>
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: null,
        success: false,
      })),
  }
}
