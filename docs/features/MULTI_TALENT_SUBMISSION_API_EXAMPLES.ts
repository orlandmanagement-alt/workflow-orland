/**
 * Multi-Talent Submission - API Usage Examples & Troubleshooting Guide
 * This file contains real-world examples and common issues/solutions
 */

// ============================================================================
// 1. FRONTED USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: Basic Multi-Talent Submission Flow
 * File: apps/appagency/src/pages/Projects/ProjectDetail.tsx
 */
import { MultiTalentSubmissionFlow } from '@/components/multiTalent/MultiTalentSubmissionFlow'
import { useAppStore } from '@/store/useAppStore'

export const ProjectDetailPage = ({ projectId }: Props) => {
  const { agencyId } = useAppStore()

  return (
    <div className="p-6">
      <h1>Submit Your Roster</h1>
      
      {/* Multi-Talent Component */}
      <MultiTalentSubmissionFlow
        projectId={projectId}
        projectName="Nike Summer Campaign"
        agencyId={agencyId}
        onSubmitted={(response) => {
          console.log('✅ Submission successful', response)
          // Redirect to submissions tracker
          window.location.href = `/agency/submissions/${response.batchId}`
        }}
      />
    </div>
  )
}

/**
 * Example 2: Custom Hook for Multi-Talent Operations
 * File: apps/appagency/src/hooks/useMultiTalentSubmission.ts
 */
import { useState, useCallback } from 'react'
import type { 
  BulkSubmissionPayload, 
  BulkSubmissionResponse,
  UseMultiTalentSubmissionReturn 
} from '@/types/multiTalentSubmission'

export const useMultiTalentSubmission = (): UseMultiTalentSubmissionReturn => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTalents, setSelectedTalents] = useState<Map<string, number>>(new Map())

  const submitBulk = useCallback(async (payload: BulkSubmissionPayload) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/agency/projects/apply-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const { error: apiError } = await response.json()
        throw new Error(apiError?.message || 'Submission failed')
      }

      const { data } = await response.json()
      return data as BulkSubmissionResponse
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMsg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    state: {} as any, // Would be real state
    filters: {} as any,
    submitBulk,
    // ... other methods
  } as UseMultiTalentSubmissionReturn
}

// ============================================================================
// 2. BACKEND TYPESCRIPT EXAMPLES
// ============================================================================

/**
 * Example 3: Smart Filter Implementation with Caching
 * File: apps/appapi/src/lib/smartFilter.ts
 */
import NodeCache from 'node-cache'

interface CacheEntry {
  eligible: any[]
  ineligible: any[]
  timestamp: number
}

const filterCache = new NodeCache({ stdTTL: 1800 }) // 30 min TTL

export async function applySmartFilterWithCache(
  projectId: string,
  talents: any[],
  requirements: any
): Promise<{ eligible: any[]; ineligible: any[] }> {
  // Check cache first
  const cacheKey = `filter_${projectId}`
  const cached = filterCache.get<CacheEntry>(cacheKey)

  if (cached && Date.now() - cached.timestamp < 1800000) {
    console.log('✅ Using cached filter results')
    return { eligible: cached.eligible, ineligible: cached.ineligible }
  }

  console.log('📝 Computing filter results (uncached)')
  const result = applySmartFilter(talents, requirements)

  filterCache.set(cacheKey, {
    ...result,
    timestamp: Date.now(),
  })

  return result
}

/**
 * Example 4: Bulk Submission with Comprehensive Error Handling
 */
export async function processBulkSubmissionWithValidation(
  payload: BulkSubmissionPayload,
  agencyId: string,
  db: D1Database
) {
  // Step 1: Validate payload structure
  if (!payload.projectId || !Array.isArray(payload.submissions)) {
    throw new Error('Invalid payload structure')
  }

  // Step 2: Verify project exists
  const project = await db
    .prepare('SELECT * FROM projects WHERE project_id = ?')
    .bind(payload.projectId)
    .first()

  if (!project) {
    throw new Error('PROJECT_NOT_FOUND')
  }

  // Step 3: Verify all talents belong to agency
  const talentIds = payload.submissions.map((s) => s.talentId)
  const verifiedTalents = await db
    .prepare(`SELECT COUNT(*) as count FROM agency_talents WHERE agencyId = ? AND talentId IN (${talentIds.map(() => '?').join(',')})`)
    .bind(agencyId, ...talentIds)
    .first()

  if ((verifiedTalents as any).count !== talentIds.length) {
    throw new Error('UNAUTHORIZED_TALENT')
  }

  // Step 4: Check for duplicate submissions (within 24h)
  const duplicates = await db
    .prepare(
      `SELECT COUNT(*) as count FROM project_talents 
       WHERE projectId = ? AND talentId IN (${talentIds.map(() => '?').join(',')})
       AND createdAt > ?`
    )
    .bind(payload.projectId, ...talentIds, Date.now() - 86400000)
    .first()

  if ((duplicates as any).count > 0) {
    throw new Error('DUPLICATE_SUBMISSION')
  }

  // Step 5: Process submission (all-or-nothing)
  try {
    // Start transaction
    const batchId = `batch_${generateId()}`

    // Insert records...
    // (see main implementation file)

    return { batchId, success: true }
  } catch (error) {
    // Rollback happens automatically on error
    console.error('Transaction failed:', error)
    throw error
  }
}

// ============================================================================
// 3. CURL/HTTP EXAMPLES
// ============================================================================

/**
 * Example 5: Fetch Eligible Roster via cURL
 */

// GET /api/agency/roster
/*
curl -X GET "https://api.orlandmanagement.com/api/agency/roster?project_id=proj_nike_001" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"

Response (200 OK):
{
  "success": true,
  "data": {
    "projectId": "proj_nike_001",
    "projectName": "Nike Summer Campaign",
    "totalRosterCount": 45,
    "eligibleCount": 18,
    "ineligibleCount": 27,
    "candidates": [
      {
        "id": "talent_budi",
        "name": "Budi Santoso",
        "matchScore": 92,
        "matchBreakdown": {...},
        "pricing": {
          "proposedAmount": 2500000,
          "agencyMarkupPercent": 15,
          "agencyCommissionPercent": 20,
          "agencyFee": 500000,
          "talentPayment": 2000000
        }
      }
    ]
  }
}
*/

/**
 * Example 6: Submit Bulk Application via cURL
 */

// POST /api/agency/projects/apply-bulk
/*
curl -X POST "https://api.orlandmanagement.com/api/agency/projects/apply-bulk" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "proj_nike_001",
    "batchNotes": "Wave 1 - Male Models",
    "submissions": [
      {
        "talentId": "talent_budi",
        "agencyTalentId": "agencytalent_123",
        "roleName": "Lead Model",
        "roleId": "role_lead",
        "matchScore": 92,
        "matchBreakdown": {
          "height": 15,
          "skills": 18,
          "languages": 8,
          "availability": 15,
          "profileQuality": 14,
          "rateAlignment": 7,
          "physique": 15
        },
        "pricing": {
          "serviceName": "Commercial Model - Full Day",
          "proposedAmount": 2500000,
          "currency": "IDR",
          "agencyMarkupPercent": 15,
          "agencyCommissionPercent": 20
        }
      }
    ]
  }'

Response (201 Created):
{
  "success": true,
  "data": {
    "batchId": "batch_def456",
    "financialSummary": {
      "totalProposedRevenue": 2500000,
      "totalAgencyFee": 500000,
      "totalTalentPayment": 2000000
    }
  }
}
*/

/**
 * Example 7: Impersonation Request via cURL
 */

// POST /api/agency/impersonate/start
/*
curl -X POST "https://api.orlandmanagement.com/api/agency/impersonate/start" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "talentId": "talent_budi",
    "reason": "update_comp_card"
  }'

Response (201 Created):
{
  "success": true,
  "data": {
    "impersonationSessionId": "imp_xyz789",
    "talentId": "talent_budi",
    "talentName": "Budi Santoso",
    "impersonationToken": "eyJhbGc...",
    "expiresIn": 3600,
    "redirectUrl": "https://talent.orlandmanagement.com?token=eyJhbGc..."
  }
}
*/

// ============================================================================
// 4. TROUBLESHOOTING & COMMON ISSUES
// ============================================================================

/**
 * ISSUE #1: Bulk submission returns 422 Unprocessable Entity
 * 
 * Symptoms:
 * - Error: VALIDATION_ERROR
 * - Details: "Ineligible for project"
 * 
 * Root Causes:
 * 1. Talent doesn't meet hard filter requirements
 * 2. Talent ID invalid or doesn't belong to agency
 * 3. Missing required fields in submission payload
 * 
 * Solution:
 * - Verify hard filters in your project's casting_requirements
 * - Call GET /api/agency/roster first to see ONLY eligible talents
 * - Ensure all talents in submission are in the "eligible" list returned
 * - Double-check JSON payload structure matches spec
 */

// BEFORE (Wrong - uses talent not from eligible list)
const wrongPayload = {
  projectId: 'proj_123',
  submissions: [
    { talentId: 'talent_excluded_due_to_gender', ... }
  ]
}

// AFTER (Correct - only uses candidates from eligible list)
const rosterResponse = await fetch('/api/agency/roster?project_id=proj_123')
const { data } = await rosterResponse.json()
const eligibleIds = data.candidates.map(c => c.id)

const correctPayload = {
  projectId: 'proj_123',
  submissions: data.candidates
    .filter(c => mySelectedTalentIds.includes(c.id))
    .map(c => ({
      talentId: c.id,
      // ... other fields
    }))
}

/**
 * ISSUE #2: Impersonation token always invalid
 * 
 * Symptoms:
 * - Error when accessing talent dashboard with token
 * - "Invalid token" or "Session expired"
 * 
 * Root Causes:
 * 1. Token expired (1 hour max)
 * 2. Talent switched to different browser/device
 * 3. Server JWT_SECRET mismatch across instances
 * 4. Token corrupted in URL encoding
 * 
 * Solution:
 * - Check token expiry: openToken in browser dev console
 * - Use SAME browser/device for impersonation session
 * - Verify JWT_SECRET consistent in all server instances
 * - URL-encode token when passing in query string
 */

// Check token validity in browser console
const token = new URLSearchParams(window.location.search).get('token')
try {
  const [header, payload, signature] = token.split('.')
  const decoded = JSON.parse(atob(payload))
  console.log('Token expires at:', new Date(decoded.exp * 1000))
  console.log('Current time:', new Date())
} catch (e) {
  console.error('Token is invalid/corrupted')
}

/**
 * ISSUE #3: Slow roster filtering (>2 seconds)
 * 
 * Symptoms:
 * - GET /api/agency/roster takes >2s to respond
 * - Modal freezes when opening
 * 
 * Root Causes:
 * 1. Missing database indexes
 * 2. Large talent profile with unoptimized queries
 * 3. Smart filter algorithm inefficient
 * 4. N+1 query problem
 * 
 * Solution:
 * - Verify indexes exist: CREATE INDEX idx_talent_profiles_gender_age...
 * - Use caching (30 min TTL) for filter results
 * - Profile slow queries with EXPLAIN QUERY PLAN
 * - Batch load talent related data in single query
 */

// DEBUG: Check index usage
/*
EXPLAIN QUERY PLAN 
SELECT * FROM talent_profiles 
WHERE gender = 'male' AND age BETWEEN 25 AND 35;

Expected output: Uses idx_talent_profiles_gender_age
If not using index, run:
CREATE INDEX idx_talent_profiles_gender_age ON talent_profiles(gender, age);
*/

/**
 * ISSUE #4: Rate limit exceeded on impersonation
 * 
 * Symptoms:
 * - POST /api/agency/impersonate/start returns 429 Too Many Requests
 * - Can't start new impersonation session
 * 
 * Root Causes:
 * 1. Started 5+ impersonations in last 15 minutes
 * 2. System clock out of sync
 * 3. Rate limit check bug
 * 
 * Solution:
 * - Wait 15 minutes before trying again
 * - Check system clock: date -s "$(curl -s http://worldtimeapi.org/api/timezone/Etc/UTC | jq -r '.datetime')"
 * - Contact support if legitimate use case requires more
 */

// DEBUG: Check rate limit status
const rateLimitResponse = await fetch('/api/agency/diagnostics/rate-limit', {
  headers: { 'Authorization': `Bearer ${token}` }
})
const { attemptsInWindow } = await rateLimitResponse.json()
console.log(`${attemptsInWindow}/5 impersonations in current 15-min window`)

/**
 * ISSUE #5: Bulk submission partially fails (some talents succeed)
 * 
 * Symptoms:
 * - Response shows only 2 of 5 talents submitted
 * - Database shows incomplete records
 * 
 * Root Causes:
 * 1. Transaction not properly configured
 * 2. Database crash mid-transaction
 * 3. Foreign key constraint violated
 * 
 * Solution:
 * - Ensure D1 has transactions enabled
 * - Check database logs for constraint errors
 * - Validate all foreign keys exist before submit
 * - Use dedicated transaction wrapper
 */

// Validate before submit
async function validateBeforeSubmit(projectId: string, talentIds: string[], agencyId: string) {
  // Check project exists
  const project = await db.query('SELECT * FROM projects WHERE id = ?', [projectId])
  if (project.length === 0) throw new Error('Project not found')

  // Check all talents belong to agency
  const talents = await db.query(
    'SELECT * FROM agency_talents WHERE agencyId = ? AND talentId IN (?)',
    [agencyId, talentIds]
  )
  if (talents.length !== talentIds.length) throw new Error('Some talents not found')

  // Check no duplicates
  const existing = await db.query(
    'SELECT * FROM project_talents WHERE projectId = ? AND talentId IN (?)',
    [projectId, talentIds]
  )
  if (existing.length > 0) throw new Error('Duplicate submission detected')
}

/**
 * ISSUE #6: Smart filter returns all ineligible (no candidates match)
 * 
 * Symptoms:
 * - GET /api/agency/roster returns eligibleCount: 0
 * - All talents in ineligibleReasons with various reasons
 * 
 * Root Causes:
 * 1. Project requirements too strict
 * 2. Roster doesn't match requirements (different market)
 * 3. Talent profiles missing critical data
 * 
 * Solution:
 * - Review casting_requirements (loosen filters)
 * - Check talent profiles completion % (should be >80%)
 * - Verify talents have all required skills
 * - Check age/height requirements reasonable
 */

// DEBUG: Analyze ineligibility reasons
const { data } = await rosterResponse.json()
const reasons = {}
data.ineligibleDetails.forEach(t => {
  reasons[t.reason] = (reasons[t.reason] || 0) + 1
})
console.table(reasons)
// Output:
// "Age out of range" : 12
// "Gender mismatch" : 8
// "Missing required skill" : 7
// → Adjust project requirements accordingly

// ============================================================================
// 5. PERFORMANCE OPTIMIZATIONS
// ============================================================================

/**
 * Optimization 1: Filter result caching
 */
import NodeCache from 'node-cache'

const filterCache = new NodeCache({ stdTTL: 1800 }) // 30 min

app.get('/api/agency/roster', async (c) => {
  const projectId = c.req.query('project_id')
  const cacheKey = `roster_${projectId}`

  // Check cache first
  if (filterCache.has(cacheKey)) {
    return c.json({ ...filterCache.get(cacheKey), cached: true })
  }

  // Compute if not cached
  const result = await computeRoster(projectId)
  filterCache.set(cacheKey, result)
  return c.json(result)
})

/**
 * Optimization 2: Batch database queries
 */

// BEFORE: N+1 queries (slow)
/*
SELECT * FROM talents WHERE agencyId = ?
SELECT rating FROM talent_ratings WHERE talentId = ? (N times)
SELECT availability FROM schedules WHERE talentId = ? (N times)
*/

// AFTER: Single batched query (fast)
/*
SELECT 
  t.*,
  COALESCE(tr.rating, 0) as rating,
  COUNT(DISTINCT s.id) as availability_slots
FROM talents t
LEFT JOIN talent_ratings tr ON t.id = tr.talentId
LEFT JOIN schedules s ON t.id = s.talentId AND s.date BETWEEN ? AND ?
WHERE t.agencyId = ?
GROUP BY t.id
*/

/**
 * Optimization 3: Debounce price input updates
 */

import { debounce } from 'lodash'

const debouncedPriceUpdate = debounce((talentId: string, newPrice: number) => {
  // Updates state only after user stops typing for 300ms
  setPricingOverrides(prev => new Map(prev).set(talentId, newPrice))
}, 300)

// ============================================================================
// 6. SECURITY CHECKLIST
// ============================================================================

/**
 * Security checklist for impersonation feature:
 * - [ ] JWT tokens signed with strong secret (>32 chars)
 * - [ ] Tokens hashed before storage (not plain text)
 * - [ ] Tokens have 1-hour expiry (not infinite)
 * - [ ] Rate limiting enforced (5 per hour per agency)
 * - [ ] All impersonation actions logged to audit table
 * - [ ] Talent cannot see who impersonated them
 * - [ ] Agency cannot access admin features while impersonating
 * - [ ] Tokens revoked on: session expiry, revocation request, account suspension
 * - [ ] HTTPS enforced for all token transmission
 * - [ ] CORS properly configured to prevent token theft
 */

// ============================================================================
// 7. MONITORING & ALERTS
// ============================================================================

/**
 * Metrics to monitor:
 * - API response time: p50, p95, p99 (should be <500ms, <1s, <2s)
 * - Error rate by endpoint: should be <0.1%
 * - Database query performance: slow query log (>1s)
 * - Impersonation abuse: 10+ sessions in 1 hour = alert
 * - Cache hit rate: should be >80%
 * - Submission success rate: should be >95%
 */

// ============================================================================
// END OF EXAMPLES & TROUBLESHOOTING
// ============================================================================
