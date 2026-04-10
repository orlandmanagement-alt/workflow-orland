# Multi-Talent Submission - Implementation Checklist & Quick Reference

**Status:** Ready for Development  
**Priority:** P1 (Core Feature)  
**Est. Dev Time:** 2-3 weeks  
**Team:** Backend (1), Frontend (1), QA (1)

---

## 📋 PHASE 1: DATABASE & BACKEND (Week 1)

### Database Setup
- [ ] Apply migration: `034_DB_CORE_multi_talent_submission.sql`
  ```bash
  npm run migrate -- 034_DB_CORE_multi_talent_submission.sql
  ```
- [ ] Verify tables created:
  ```sql
  SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%agency_bulk%' OR name LIKE '%impersonation%';
  ```
- [ ] Test indexes are functioning:
  ```sql
  EXPLAIN QUERY PLAN SELECT * FROM agency_bulk_submissions WHERE status = 'submitted';
  ```

### Backend API Development

#### 1. Setup Router
```typescript
// apps/appapi/src/routes/agency/index.ts
import { createMultiTalentRouter } from './multiTalent'

export const setupAgencyRoutes = (app: Hono, db: D1Database) => {
  const multiTalentRouter = createMultiTalentRouter(db)
  app.route('/api/agency', multiTalentRouter)
}
```

#### 2. Smart Filter Algorithm
- [ ] Implement `applySmartFilter()` function (copy from design doc)
- [ ] Test hard filters:
  - [ ] Gender filtering works correctly
  - [ ] Age range validation accurate
  - [ ] Skill matching logic correct
  - [ ] Location preference honored
- [ ] Test soft filters (scoring):
  - [ ] Height matching (±5cm tolerance)
  - [ ] Physique calculation
  - [ ] Language bonus applied
  - [ ] Profile quality scored

#### 3. API Endpoints Implementation

**Endpoint 1: GET /api/agency/roster**
- [ ] Fetch project requirements
- [ ] Get agency talents
- [ ] Apply smart filter
- [ ] Return formatted response
- [ ] Test: 200 OK response with eligible candidates
- [ ] Test: 404 when project not found
- [ ] Test: Empty roster when no talents match

**Endpoint 2: POST /api/agency/projects/apply-bulk**
- [ ] Validate auth & agency ownership
- [ ] Validate submission payload
- [ ] Create batch record
- [ ] Insert project_talents records (transactional)
- [ ] Calculate financial splits
- [ ] Insert bulk_submission_items
- [ ] Return 201 with batch details
- [ ] Test: 422 error on ineligible talent
- [ ] Test: Transaction rollback on error
- [ ] Test: Duplicate detection

**Endpoint 3: GET /api/agency/submissions**
- [ ] Query by status, projectId, pagination
- [ ] Fetch items for each batch
- [ ] Return list with summary stats
- [ ] Test: Filtering works for all statuses
- [ ] Test: Pagination works (limit/offset)

**Endpoint 4: POST /api/agency/impersonate/start**
- [ ] Validate talent belongs to agency
- [ ] Generate impersonation token
- [ ] Store session with hash
- [ ] Insert audit log
- [ ] Check rate limits
- [ ] Return session + redirect URL
- [ ] Test: Rate limit enforced (max 5/hour)
- [ ] Test: Invalid talent rejected

### Backend Testing
- [ ] Unit tests for smart filter algorithm
- [ ] Integration tests for all endpoints
- [ ] Database transaction tests
- [ ] Error handling for edge cases
- [ ] Load test with 100+ talents

---

## 🎨 PHASE 2: FRONTEND - AGENCY APP (Week 2)

### Component Development

#### 1. MultiTalentSubmissionFlow Component
- [ ] Implement main orchestrator component
- [ ] Test step transitions: filter → select → review → confirm
- [ ] Test error handling and display
- [ ] Test loading states

#### 2. TalentSelectionTable Component
- [ ] Implement table rendering with 100+ rows
- [ ] Implement row selection (individual + select all)
- [ ] Implement inline price editing
- [ ] Test sorting by match score
- [ ] Test search/filter (optional)
- [ ] Test hover effects and interactions

#### 3. FinancialSummary Component
- [ ] Implement real-time calculation updates
- [ ] Implement revenue split visualization
- [ ] Test calculations are accurate
- [ ] Test currency formatting (IDR)

#### 4. SubmissionConfirmation Component
- [ ] Display success message with summary
- [ ] Show financial breakdown
- [ ] Link to submissions tracker
- [ ] Link back to roster

### UI/UX Implementation
- [ ] Apply dark mode theme (black #0A0E27)
- [ ] Apply gold accents (#D4AF37)
- [ ] Implement glassmorphism effects (blur 20px)
- [ ] Create loading animations (3-second spin)
- [ ] Test responsive design (desktop + tablet)
- [ ] Test accessibility (aria labels, keyboard nav)

### Integration with API
- [ ] Connect to GET /api/agency/roster
- [ ] Connect to POST /api/agency/projects/apply-bulk
- [ ] Connect to GET /api/agency/submissions
- [ ] Implement error handling & user feedback
- [ ] Add loading states throughout
- [ ] Test with real API (staging)

### State Management
- [ ] Create Zustand store for multi-talent state (optional)
- [ ] Implement selection persistence
- [ ] Implement pricing override state
- [ ] Test state updates on rapid changes

### Testing
- [ ] Component unit tests (React Testing Library)
- [ ] API integration tests
- [ ] E2E tests with Cypress
- [ ] Performance test (render 100+ rows)
- [ ] Accessibility test (axe scanning)

---

## 🔐 PHASE 3: IMPERSONATION FEATURE (Week 2.5)

### Agency Dashboard
- [ ] Add "View as Talent" button to roster cards
- [ ] Implement impersonation modal with reason selection
- [ ] Create session management UI (show active sessions)

### Talent Dashboard (appadmin)
- [ ] Add middleware to validate impersonation token
- [ ] Show "Impersonated as" banner at top
- [ ] Allow profile editing while impersonated
- [ ] Track all edits in audit log
- [ ] Add "Exit Impersonation" button

### Backend Validation
- [ ] Validate token on each request
- [ ] Check session not expired
- [ ] Prevent double-impersonation
- [ ] Log all activities during session

### Security Testing
- [ ] Test token expiration (1 hour)
- [ ] Test rate limiting (max 5/hour)
- [ ] Test audit logging
- [ ] Test token validation fails after revocation
- [ ] Test talent cannot access agency controls

---

## 📊 PHASE 4: MONITORING & ANALYTICS (Week 3)

### Metrics to Track
- [ ] Submissions per agency per month
- [ ] Conversion rate (approved / total)
- [ ] Avg time to approval
- [ ] Avg match score across submissions
- [ ] Revenue generated per submission

### Admin Dashboard (appadmin)
- [ ] Add "Multi-Talent Submissions" section
- [ ] Show real-time stats dashboard
- [ ] Create bulk submission timeline view
- [ ] Create revenue analytics charts

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] All tests passing (100% unit + integration)
- [ ] Code review approved
- [ ] Database migration tested on staging
- [ ] Load testing completed (5,000+ concurrent users)
- [ ] Security audit passed
- [ ] Documentation complete

### Staging Deployment
```bash
# 1. Run migration
npm run migrate -- 034_DB_CORE_multi_talent_submission.sql

# 2. Deploy API
git push origin feature/multi-talent-submission
# Automated CI/CD deploys to staging

# 3. Run smoke tests
npm run test:e2e -- --env=staging

# 4. Manual QA testing
# - Create test project
# - Submit 5+ talents as test agency
# - Verify all calculations
# - Test impersonation workflow
```

### Production Deployment
```bash
# Same as staging, after sign-off

# 1. Backup database
pg_dump orland_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Run migration
npm run migrate -- 034_DB_CORE_multi_talent_submission.sql

# 3. Deploy API
git tag v1.5.0-multi-talent
git push --tags

# 4. Monitor logs for errors
tail -f logs/production.log | grep "multi-talent"

# 5. Monitor performance
# - Check response times for new endpoints
# - Check database query performance
# - Check for errors in error tracking (Sentry)
```

---

## 🔍 TESTING SCENARIOS

### Happy Path
```
1. Agency logs in
2. Browses projects
3. Clicks "Apply Roster"
4. Modal loads with 18/45 eligible talents
5. Selects 5 talents
6. Reviews prices (auto-calculated)
7. Clicks "Submit All"
8. Receives batch ID
9. Checks "Submissions" page - shows "submitted" status
```

### Edge Cases
```
1. No eligible talents for project
2. Talent already applied to same project
3. Pricing below talent's minimum rate (warning)
4. Bulk submission with 1 talent (allowed)
5. Bulk submission with 100 talents (performance test)
6. Concurrent submissions from same agency
7. Impersonation session expires during edit
```

### Error Scenarios
```
1. Network error during submit
2. Server error (500)
3. Invalid project ID
4. Unauthorized access (not agency owner)
5. Rate limit exceeded (6th impersonation in hour)
```

---

## 📚 TECHNICAL REFERENCE

### Key Files
- **Design Doc:** `docs/features/MULTI_TALENT_SUBMISSION_DESIGN.md`
- **Types:** `apps/appagency/src/types/multiTalentSubmission.ts`
- **Components:** `apps/appagency/src/components/multiTalent/`
- **Backend:** `apps/appapi/src/routes/agency/multiTalent.ts`
- **Migration:** `apps/appapi/migrations/034_DB_CORE_multi_talent_submission.sql`

### Environment Variables
```env
# Talent Dashboard URL for impersonation redirects
TALENT_DASHBOARD_URL=https://talent.orlandmanagement.com

# JWT Secret for impersonation tokens
JWT_SECRET=your_secret_key_here

# Rate limit (impersonations per hour)
IMPERSONATION_RATE_LIMIT=5
```

### Database Queries Reference

```sql
-- Check bulk submission status
SELECT * FROM agency_bulk_submissions 
WHERE agencyId = 'agency_xyz' 
AND status NOT IN ('cancelled', 'all_rejected')
ORDER BY submittedAt DESC;

-- Get eligible talents for project
SELECT COUNT(*) 
FROM bulk_submission_items 
WHERE batchId = 'batch_xyz' 
AND itemStatus = 'approved';

-- Check active impersonations
SELECT * FROM impersonation_sessions 
WHERE status = 'active' 
AND expiresAt > strftime('%s', 'now') * 1000;

-- Audit log for specific agency
SELECT * FROM impersonation_audit_log 
WHERE agencyId = 'agency_xyz' 
AND timestamp > strftime('%s', datetime('now', '-7 days')) * 1000
ORDER BY timestamp DESC;
```

### Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Slow roster filtering | Add composite index on (agencyId, profileStatus) in talent_profiles |
| Impersonation token invalid | Verify JWT_SECRET is consistent across servers |
| Rate limit always exceeded | Check system clock sync across servers |
| Bulk submission fails halfway | Ensure transactions enabled in D1 database |

---

## 📞 SUPPORT & ESCALATION

### During Development
- Technical architect: Lead decisions on smart filter
- Backend lead: API endpoint design review
- Frontend lead: Component architecture review

### Post-Launch Issues
1. **API Performance:** Check database indexes, enable query caching
2. **UI Slowness:** Check React.memo usage, optimize table rendering
3. **High Error Rate:** Check error logs in Sentry, verify auth tokens

---

## 📈 SUCCESS METRICS (Post-Launch)

- **Adoption:** 70%+ of agencies using feature within 2 weeks
- **Conversion:** 50%+ of bulk submissions approved by clients
- **Performance:** <500ms API response time (p95)
- **Reliability:** 99.9% uptime, <0.1% error rate
- **Revenue Impact:** +15% average transaction value from bulk submissions

---

## 🔄 FUTURE ENHANCEMENTS

**Phase 2 (Post-Launch):**
- [ ] AI-powered talent suggestions (auto-fill selections)
- [ ] Template submissions (save configurations for future use)
- [ ] Bulk negotiation UI (counter-offers management)
- [ ] Email notifications for status changes
- [ ] Integration with talent communication platform

**Phase 3:**
- [ ] Mobile app support for roster browsing
- [ ] Batch scheduling (submit at specific time)
- [ ] A/B testing different talent combinations
- [ ] Predictive success scoring (AI predicts approval likelihood)

---

**Last Updated:** April 10, 2026  
**Next Review:** May 10, 2026
