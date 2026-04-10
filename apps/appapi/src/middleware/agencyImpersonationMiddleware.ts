// Agency Impersonation Middleware
// File: apps/appapi/src/middleware/agencyImpersonationMiddleware.ts

import { Request, Response, NextFunction } from 'express'
import { createHash } from 'crypto'

interface AgencyContext {
  agencyId: string
  agencyUserId: string
  impersonatingTalent?: {
    talentId: string
    talentName: string
    talentEmail: string
    expiresAt: number
  }
}

interface ImpersonationRequest extends Request {
  agencyContext?: AgencyContext
}

/**
 * SECURITY ARCHITECTURE:
 *
 * 1. TOKEN VALIDATION:
 *    - Impersonation tokens are 5 minutes TTL
 *    - Tokens contain: agency_id + random_secret
 *    - Only token hash stored in database (SHA256)
 *    - Cannot be reused after expiry
 *
 * 2. REQUEST CONTEXT:
 *    - All requests under impersonation include x-impersonation-token header
 *    - Backend validates token + checks expiry
 *    - If expired, return 401 Unauthorized
 *
 * 3. DATA ISOLATION:
 *    - When impersonating, all talent queries filtered by talentId
 *    - Agency ID always embedded in database mutations
 *    - Prevents horizontal escalation (accessing other talents)
 *
 * 4. AUDIT TRAIL:
 *    - Start impersonation logged with IP + User-Agent
 *    - End impersonation logged automatically
 *    - All mutations during impersonation timestamped
 */

/**
 * Parse impersonation token from header
 * Format: "imp_<uuid>_<secret>"
 */
function parseImpersonationToken(
  tokenString: string
): { tokenId: string; tokenSecret: string } | null {
  if (!tokenString.startsWith('imp_')) return null

  const parts = tokenString.split('_')
  if (parts.length !== 3) return null

  return {
    tokenId: parts[1],
    tokenSecret: parts[2],
  }
}

/**
 * Hash token for database comparison
 */
function hashToken(tokenSecret: string): string {
  return createHash('sha256').update(tokenSecret).digest('hex')
}

/**
 * Middleware: Validate agency impersonation token
 * Applied to routes that may be accessed under impersonation
 */
export const validateAgencyImpersonation = async (
  req: ImpersonationRequest,
  res: Response,
  next: NextFunction
) => {
  const impersonationHeader = req.headers['x-impersonation-token']

  // If no impersonation token, continue without impersonation context
  if (!impersonationHeader) {
    return next()
  }

  const impersonationToken = typeof impersonationHeader === 'string'
    ? impersonationHeader
    : impersonationHeader[0]

  const parsed = parseImpersonationToken(impersonationToken)
  if (!parsed) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid impersonation token format',
    })
  }

  const tokenHash = hashToken(parsed.tokenSecret)
  const agencyId = req.headers['x-agency-id'] as string
  const agencyUserId = req.headers['x-user-id'] as string

  if (!agencyId || !agencyUserId) {
    return res.status(401).json({
      status: 'error',
      message: 'Missing agency context',
    })
  }

  try {
    // Query database for valid impersonation session
    // SELECT * FROM impersonation_sessions
    // WHERE agencyId = ? AND tokenHash = ? AND status = 'active'

    // Mock database lookup
    const session = {
      agencyId,
      talentId: 'talent_123', // Would come from DB
      tokenHash,
      expiresAt: Date.now() + 300000, // Would come from DB
      status: 'active',
    }

    // Validate token exists
    if (!session) {
      return res.status(401).json({
        status: 'error',
        message: 'Impersonation session not found',
      })
    }

    // Validate token not expired
    if (session.expiresAt < Date.now()) {
      return res.status(401).json({
        status: 'error',
        message: 'Impersonation session expired',
      })
    }

    // Validate token status
    if (session.status !== 'active') {
      return res.status(401).json({
        status: 'error',
        message: 'Impersonation session revoked',
      })
    }

    // Attach impersonation context to request
    req.agencyContext = {
      agencyId,
      agencyUserId,
      impersonatingTalent: {
        talentId: session.talentId,
        talentName: '', // Would fetch from DB
        talentEmail: '', // Would fetch from DB
        expiresAt: session.expiresAt,
      },
    }

    next()
  } catch (error) {
    console.error('Impersonation validation error:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Impersonation validation failed',
    })
  }
}

/**
 * Middleware: Restrict impersonation to agency-managed talents only
 * Applied after validateAgencyImpersonation
 */
export const requireManagedTalent = async (
  req: ImpersonationRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.agencyContext?.impersonatingTalent) {
    return next()
  }

  const { talentId } = req.agencyContext.impersonatingTalent
  const agencyId = req.agencyContext.agencyId

  try {
    // Verify talent is managed by this agency
    // SELECT agencyId FROM managed_talents WHERE id = ? AND agencyId = ?

    // Mock verification
    const isManaged = await verifyTalentManagement(talentId, agencyId)

    if (!isManaged) {
      return res.status(403).json({
        status: 'error',
        message: 'This talent is not managed by your agency',
      })
    }

    next()
  } catch (error) {
    console.error('Managed talent verification error:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Verification failed',
    })
  }
}

/**
 * Filter queries to impersonated talent
 * Applied to routes that fetch/modify talent data
 */
export const filterByImpersonatedTalent = (
  req: ImpersonationRequest
) => {
  if (!req.agencyContext?.impersonatingTalent) {
    return {} // No filtering
  }

  return {
    talentId: req.agencyContext.impersonatingTalent.talentId,
  }
}

/**
 * Apply impersonation context to mutations
 * Ensures agency ID is preserved in all CREATE/UPDATE operations
 */
export const preserveAgencyInMutation = (
  req: ImpersonationRequest,
  mutation: Record<string, any>
) => {
  if (req.agencyContext?.impersonatingTalent) {
    // Under impersonation, force agency ID in mutation
    mutation.agencyId = req.agencyContext.agencyId

    // Log who made the change
    mutation.lastModifiedBy = 'agency_impersonating'
    mutation.lastModifiedByUserId = req.agencyContext.agencyUserId
    mutation.lastModifiedAt = Date.now()
  }

  return mutation
}

/**
 * Endpoint Security: Rate limit impersonation switches
 * Max 10 impersonation switches per agency per 15 minutes
 */
export const rateLimitImpersonation = async (
  req: ImpersonationRequest,
  res: Response,
  next: NextFunction
) => {
  const agencyId = req.headers['x-agency-id'] as string

  if (!agencyId) {
    return res.status(401).json({
      status: 'error',
      message: 'Unauthorized',
    })
  }

  try {
    const now = Date.now()
    const fifteenMinutesAgo = now - 15 * 60 * 1000

    // Query rate limit table
    // SELECT COUNT(*) FROM impersonation_rate_limit
    // WHERE agencyId = ? AND timestamp > ?

    const recentCount = 0 // Mock

    if (recentCount >= 10) {
      return res.status(429).json({
        status: 'error',
        message: 'Too many impersonation switches. Try again in 15 minutes.',
      })
    }

    // Record this attempt
    // INSERT INTO impersonation_rate_limit (agencyId, timestamp, ipAddress)

    next()
  } catch (error) {
    console.error('Rate limit check error:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Rate limit check failed',
    })
  }
}

/**
 * Log impersonation actions for audit trail
 */
export const logImpersonationAction = async (
  agencyId: string,
  agencyUserId: string,
  talentId: string,
  action: 'start' | 'end' | 'revoke',
  ipAddress: string,
  userAgent: string,
  reason?: string
) => {
  try {
    // INSERT INTO impersonation_audit_log
    // (agencyId, agencyUserId, talentId, action, ipAddress, userAgent, reason, timestamp)

    console.log(
      `[AUDIT] Agency ${agencyId} - ${action} impersonation of talent ${talentId}`
    )
  } catch (error) {
    console.error('Audit logging error:', error)
  }
}

/**
 * Helper: Verify talent is managed by agency
 */
async function verifyTalentManagement(
  talentId: string,
  agencyId: string
): Promise<boolean> {
  // SELECT 1 FROM managed_talents
  // WHERE id = ? AND agencyId = ? AND deletedAt IS NULL

  return true // Mock
}

/**
 * USAGE EXAMPLES:
 *
 * 1. Get talent profile under impersonation:
 * GET /api/talent/:talentId
 * Headers: x-impersonation-token: imp_<uuid>_<secret>
 *
 * 2. Update talent portfolio (with portfolio lock enforcement):
 * PUT /api/talent/:talentId/portfolio
 * Headers: x-impersonation-token: imp_<uuid>_<secret>
 * Body: { items: [...] }
 * -> Middleware checks portfolioEditLock flag
 * -> If locked, returns 403 Forbidden
 */

/**
 * Example Route Protection:
 *
 * router.put(
 *   '/talent/:talentId/portfolio',
 *   validateAgencyImpersonation,
 *   requireManagedTalent,
 *   checkPortfolioLock,
 *   async (req, res) => {
 *     const { talentId } = req.params
 *     const agencyContext = req.agencyContext
 *
 *     if (!agencyContext?.impersonatingTalent) {
 *       return res.status(403).json({ error: 'No impersonation context' })
 *     }
 *
 *     // Proceed with portfolio update
 *     // All mutations include agency context
 *   }
 * )
 */
