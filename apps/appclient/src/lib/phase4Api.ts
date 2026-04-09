/**
 * API Client for Phase 4 Features
 * Centralized HTTP client for all backend API calls
 */

import axios, { AxiosInstance, AxiosError } from 'axios'
import type {
  Contract,
  Invoice,
  AIMatchRequest,
  AIMatchResult,
  TalentAnalytics,
  Availability,
  WhiteLabelConfig,
  ApiResponse,
  ApiErrorResponse,
} from '@/types/phase4'

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.orlandmanagement.com/api/v1'

class Phase4ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Include cookies
    })

    // Add error interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Handle unauthorized
          window.location.href = '/login'
        }
        throw error
      }
    )
  }

  // ============ CONTRACTS & FINTECH ============

  /**
   * Create a contract with escrow
   */
  async createContract(payload: {
    job_id: string
    talent_id: string
    fee: number
    invoice_due_date?: string
  }): Promise<ApiResponse<any>> {
    const response = await this.client.post('/contracts/generate', payload)
    return response.data
  }

  /**
   * Get contract details
   */
  async getContract(contractId: string): Promise<ApiResponse<Contract>> {
    const response = await this.client.get(`/contracts/${contractId}`)
    return response.data
  }

  /**
   * Sign a contract (talent or client)
   */
  async signContract(contractId: string, payload: {
    signature_data: string // Base64 image
    signer_type: 'talent' | 'client'
  }): Promise<ApiResponse<any>> {
    const response = await this.client.post(`/contracts/${contractId}/sign`, payload)
    return response.data
  }

  /**
   * Get invoice details with payment split
   */
  async getInvoice(invoiceId: string): Promise<ApiResponse<Invoice & any>> {
    const response = await this.client.get(`/invoices/${invoiceId}`)
    return response.data
  }

  /**
   * Process payment
   */
  async processPayment(invoiceId: string, payload: {
    payment_method: 'bank_transfer' | 'xendit' | 'midtrans'
  }): Promise<ApiResponse<any>> {
    const response = await this.client.post(`/invoices/${invoiceId}/payment`, payload)
    return response.data
  }

  /**
   * Get escrow dashboard for client
   */
  async getEscrowDashboard(): Promise<ApiResponse<any>> {
    const response = await this.client.get('/dashboard/escrow')
    return response.data
  }

  /**
   * Get all contracts for client
   */
  async getContracts(): Promise<ApiResponse<any>> {
    const response = await this.client.get('/contracts')
    return response.data
  }

  /**
   * Get all invoices for client
   */
  async getInvoices(): Promise<ApiResponse<any>> {
    const response = await this.client.get('/invoices')
    return response.data
  }

  // ============ AI MATCHING ============

  /**
   * Match talents from natural language prompt
   */
  async aiMatch(request: AIMatchRequest): Promise<ApiResponse<AIMatchResult>> {
    const response = await this.client.post('/ai/match', request)
    return response.data
  }

  /**
   * Batch match multiple prompts
   */
  async aiMatchBatch(payload: {
    prompts: string[]
  }): Promise<ApiResponse<any>> {
    const response = await this.client.post('/ai/match/batch', payload)
    return response.data
  }

  /**
   * Get AI suggestions based on viewing history
   */
  async getAISuggestions(): Promise<ApiResponse<any>> {
    const response = await this.client.get('/ai/match/suggestions')
    return response.data
  }

  // ============ ANALYTICS ============

  /**
   * Get talent's profile analytics (public)
   */
  async getTalentAnalytics(talentId: string): Promise<ApiResponse<TalentAnalytics>> {
    const response = await this.client.get(`/talents/${talentId}/analytics`)
    return response.data
  }

  /**
   * Get current talent's analytics dashboard
   */
  async getTalentAnalyticsDashboard(): Promise<ApiResponse<any>> {
    const response = await this.client.get('/dashboard/talent/analytics')
    return response.data
  }

  /**
   * Get rankings leaderboard
   */
  async getRankings(params?: {
    period?: '7d' | '30d' | 'alltime'
    category?: string
    limit?: number
  }): Promise<ApiResponse<any>> {
    const response = await this.client.get('/rankings', { params })
    return response.data
  }

  // ============ AVAILABILITY ============

  /**
   * Get talent's availability
   */
  async getAvailability(): Promise<ApiResponse<any>> {
    const response = await this.client.get('/talents/me/availability')
    return response.data
  }

  /**
   * Create availability block
   */
  async createAvailability(payload: {
    start_date: string
    end_date: string
    status: 'available' | 'booked' | 'unavailable'
    reason?: string
  }): Promise<ApiResponse<any>> {
    const response = await this.client.post('/talents/me/availability', payload)
    return response.data
  }

  /**
   * Update availability block
   */
  async updateAvailability(availabilityId: string, payload: Partial<{
    start_date: string
    end_date: string
    status: string
    reason: string
  }>): Promise<ApiResponse<any>> {
    const response = await this.client.patch(`/talents/me/availability/${availabilityId}`, payload)
    return response.data
  }

  /**
   * Delete availability block
   */
  async deleteAvailability(availabilityId: string): Promise<ApiResponse<any>> {
    const response = await this.client.delete(`/talents/me/availability/${availabilityId}`)
    return response.data
  }

  /**
   * Get public availability summary for talent
   */
  async getPublicAvailability(talentId: string): Promise<ApiResponse<AvailabilitySummary>> {
    const response = await this.client.get(`/public/talents/${talentId}/availability`)
    return response.data
  }

  /**
   * Get admin availability summary
   */
  async getAdminAvailabilitySummary(): Promise<ApiResponse<any>> {
    const response = await this.client.get('/admin/talents/availability-summary')
    return response.data
  }

  // ============ WHITE-LABELING ============

  /**
   * Get agency white-label settings
   */
  async getWhiteLabelSettings(): Promise<ApiResponse<WhiteLabelConfig>> {
    const response = await this.client.get('/agencies/me/whitelabel')
    return response.data
  }

  /**
   * Update white-label settings
   */
  async updateWhiteLabelSettings(payload: Partial<{
    custom_domain: string
    primary_color: string
    secondary_color: string
    logo_url: string
    white_label_enabled: boolean
  }>): Promise<ApiResponse<any>> {
    const response = await this.client.patch('/agencies/me/whitelabel', payload)
    return response.data
  }

  /**
   * Upload watermark image
   */
  async uploadWatermark(file: File): Promise<ApiResponse<any>> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await this.client.post('/agencies/me/watermark/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  /**
   * Get white-label config by domain (public)
   */
  async getWhiteLabelConfigByDomain(domain: string): Promise<ApiResponse<any>> {
    const response = await this.client.get(`/whitelabel/config/${domain}`)
    return response.data
  }

  // ============ ERROR HANDLING ============

  /**
   * Safely handle API errors
   */
  static handleError(error: any): ApiErrorResponse {
    if (error.response?.data) {
      return error.response.data
    }

    if (error.message) {
      return {
        status: 'error',
        message: error.message,
      }
    }

    return {
      status: 'error',
      message: 'An unexpected error occurred',
    }
  }
}

export const apiClient = new Phase4ApiClient()
