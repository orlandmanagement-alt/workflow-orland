import { api } from '@/lib/api'

/**
 * Tools Service - Manage all tools by category
 * PH (Production House), KOL (Content Creator), EO (Event Organizer), WO (Web/Online), Brand Safety
 */

// ============ PH (PRODUCTION HOUSE) ============

export const phService = {
  /**
   * Get all call sheets for current project
   */
  async getCallSheets(projectId?: string) {
    try {
      const response = await api.get(`/tools/ph/call-sheets${projectId ? `?project_id=${projectId}` : ''}`)
      return response.data?.data || []
    } catch (err) {
      console.error('Failed to fetch call sheets:', err)
      throw err
    }
  },

  /**
   * Get single call sheet
   */
  async getCallSheet(callSheetId: string) {
    try {
      const response = await api.get(`/tools/ph/call-sheets/${callSheetId}`)
      return response.data?.data
    } catch (err) {
      console.error('Failed to fetch call sheet:', err)
      throw err
    }
  },

  /**
   * Create new call sheet
   */
  async createCallSheet(data: any) {
    try {
      const response = await api.post('/tools/ph/call-sheets', data)
      return response.data?.data
    } catch (err) {
      console.error('Failed to create call sheet:', err)
      throw err
    }
  },

  /**
   * Publish and send call sheet via WhatsApp
   */
  async publishCallSheet(callSheetId: string) {
    try {
      const response = await api.post(`/tools/ph/call-sheets/${callSheetId}/publish`)
      return response.data?.data
    } catch (err) {
      console.error('Failed to publish call sheet:', err)
      throw err
    }
  },

  /**
   * Get all scripts/scenes
   */
  async getScripts(projectId?: string) {
    try {
      const response = await api.get(`/tools/ph/scripts${projectId ? `?project_id=${projectId}` : ''}`)
      return response.data?.data || []
    } catch (err) {
      console.error('Failed to fetch scripts:', err)
      throw err
    }
  },

  /**
   * Get single script
   */
  async getScript(scriptId: string) {
    try {
      const response = await api.get(`/tools/ph/scripts/${scriptId}`)
      return response.data?.data
    } catch (err) {
      console.error('Failed to fetch script:', err)
      throw err
    }
  },

  /**
   * Upload script file
   */
  async uploadScript(data: FormData) {
    try {
      const response = await api.post('/tools/ph/scripts', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return response.data?.data
    } catch (err) {
      console.error('Failed to upload script:', err)
      throw err
    }
  }
}

// ============ KOL (CONTENT CREATOR) ============

export const kolService = {
  /**
   * Get drafts for content creator
   */
  async getDrafts(talentId?: string) {
    try {
      const response = await api.get(`/tools/kol/drafts${talentId ? `?talent_id=${talentId}` : ''}`)
      return response.data?.data || []
    } catch (err) {
      console.error('Failed to fetch drafts:', err)
      throw err
    }
  },

  /**
   * Get single draft with comments
   */
  async getDraft(draftId: string) {
    try {
      const response = await api.get(`/tools/kol/drafts/${draftId}`)
      return response.data?.data
    } catch (err) {
      console.error('Failed to fetch draft:', err)
      throw err
    }
  },

  /**
   * Add comment to draft at specific timestamp
   */
  async addDraftComment(draftId: string, payload: {
    text: string
    timestamp: number
  }) {
    try {
      const response = await api.post(`/tools/kol/drafts/${draftId}/comments`, payload)
      return response.data?.data
    } catch (err) {
      console.error('Failed to add comment:', err)
      throw err
    }
  },

  /**
   * Approve draft for posting
   */
  async approveDraft(draftId: string) {
    try {
      const response = await api.patch(`/tools/kol/drafts/${draftId}`, { status: 'approved' })
      return response.data?.data
    } catch (err) {
      console.error('Failed to approve draft:', err)
      throw err
    }
  },

  /**
   * Request revision on draft
   */
  async requestDraftRevision(draftId: string, payload: { comments: any[] }) {
    try {
      const response = await api.patch(`/tools/kol/drafts/${draftId}`, {
        status: 'revision_requested',
        revision_comments: payload.comments
      })
      return response.data?.data
    } catch (err) {
      console.error('Failed to request revision:', err)
      throw err
    }
  },

  /**
   * Get brief templates
   */
  async getBriefTemplates() {
    try {
      const response = await api.get('/tools/kol/brief-templates')
      return response.data?.data || []
    } catch (err) {
      console.error('Failed to fetch brief templates:', err)
      throw err
    }
  },

  /**
   * Create brief
   */
  async createBrief(payload: any) {
    try {
      const response = await api.post('/tools/kol/briefs', payload)
      return response.data?.data
    } catch (err) {
      console.error('Failed to create brief:', err)
      throw err
    }
  }
}

// ============ EO (EVENT ORGANIZER) ============

export const eoService = {
  /**
   * Get all riders for talents
   */
  async getRiders(projectId?: string) {
    try {
      const response = await api.get(`/tools/eo/riders${projectId ? `?project_id=${projectId}` : ''}`)
      return response.data?.data || []
    } catch (err) {
      console.error('Failed to fetch riders:', err)
      throw err
    }
  },

  /**
   * Get single rider
   */
  async getRider(riderId: string) {
    try {
      const response = await api.get(`/tools/eo/riders/${riderId}`)
      return response.data?.data
    } catch (err) {
      console.error('Failed to fetch rider:', err)
      throw err
    }
  },

  /**
   * Create rider template
   */
  async createRider(payload: any) {
    try {
      const response = await api.post('/tools/eo/riders', payload)
      return response.data?.data
    } catch (err) {
      console.error('Failed to create rider:', err)
      throw err
    }
  },

  /**
   * Get project timeline/gantt
   */
  async getTimeline(projectId: string) {
    try {
      const response = await api.get(`/tools/eo/timeline/${projectId}`)
      return response.data?.data
    } catch (err) {
      console.error('Failed to fetch timeline:', err)
      throw err
    }
  },

  /**
   * Get technical requirements
   */
  async getTechRequirements(projectId?: string) {
    try {
      const response = await api.get(`/tools/eo/tech-requirements${projectId ? `?project_id=${projectId}` : ''}`)
      return response.data?.data || []
    } catch (err) {
      console.error('Failed to fetch tech requirements:', err)
      throw err
    }
  }
}

// ============ WO (WEB/ONLINE - WEDDING ORGANIZER) ============

export const woService = {
  /**
   * Get rundown for event
   */
  async getRundown(projectId: string) {
    try {
      const response = await api.get(`/tools/wo/rundown/${projectId}`)
      return response.data?.data || []
    } catch (err) {
      console.error('Failed to fetch rundown:', err)
      throw err
    }
  },

  /**
   * Update rundown item status
   */
  async updateRundownStatus(rundownId: string, status: 'done' | 'ongoing' | 'upcoming') {
    try {
      const response = await api.patch(`/tools/wo/rundown/${rundownId}`, { status })
      return response.data?.data
    } catch (err) {
      console.error('Failed to update rundown status:', err)
      throw err
    }
  },

  /**
   * Emergency shift all upcoming items by N minutes
   */
  async shiftRundown(projectId: string, minutes: number) {
    try {
      const response = await api.post(`/tools/wo/rundown/${projectId}/shift`, { minutes })
      return response.data?.data
    } catch (err) {
      console.error('Failed to shift rundown:', err)
      throw err
    }
  },

  /**
   * Get song list for event
   */
  async getSongList(projectId: string) {
    try {
      const response = await api.get(`/tools/wo/songs/${projectId}`)
      return response.data?.data || []
    } catch (err) {
      console.error('Failed to fetch song list:', err)
      throw err
    }
  }
}

// ============ BRAND SAFETY ============

export const brandService = {
  /**
   * Scan talent social media for brand safety risks
   */
  async scanTalentSafety(talentUsername: string) {
    try {
      const response = await api.post('/tools/brand/scan', {
        username: talentUsername
      })
      return response.data?.data
    } catch (err) {
      console.error('Failed to scan talent:', err)
      throw err
    }
  },

  /**
   * Get scan history
   */
  async getScanHistory() {
    try {
      const response = await api.get('/tools/brand/scan-history')
      return response.data?.data || []
    } catch (err) {
      console.error('Failed to fetch scan history:', err)
      throw err
    }
  },

  /**
   * Get scan result details
   */
  async getScanResult(scanId: string) {
    try {
      const response = await api.get(`/tools/brand/scan/${scanId}`)
      return response.data?.data
    } catch (err) {
      console.error('Failed to fetch scan result:', err)
      throw err
    }
  }
}
