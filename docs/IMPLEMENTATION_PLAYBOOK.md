## Orland Client Dashboard - Implementation Playbook
## Step-by-Step Integration & Deployment Guide

**Target:** Production deployment of Project Creation Wizard  
**Audience:** Senior Full-Stack Engineers  
**Duration:** ~2-3 days for full integration

---

## 📦 PHASE 1: DATABASE & BACKEND SETUP (1 day)

### Step 1.1: Database Migration
```bash
# In apps/appapi/
# File already created: migrations/031_DB_CLIENT_PROJECT_CASCADE.sql

# Apply migration via Wrangler
wrangler d1 migrations apply DATABASE_NAME --env production

# Verify tables exist
wrangler d1 execute DATABASE_NAME --command "SELECT name FROM sqlite_master WHERE type='table'"

# Expected tables:
# ✓ client_projects
# ✓ project_roles
# ✓ live_casting_boards
# ✓ job_applications
# ✓ ph_production_logistics
# ✓ project_draft_state
```

### Step 1.2: Backend Routes Integration

**File to create/modify:**
```
apps/appapi/src/routes/client-projects.ts
```

**Register in main index.ts:**
```typescript
// apps/appapi/src/index.ts

import clientProjectsRouter from './routes/client-projects'

const app = new Hono()

// ... other middleware ...

// Mount routes
app.route('/api/client', clientProjectsRouter)

export default app
```

### Step 1.3: Auth Middleware Enhancement

**Required:** Ensure `x-client-id` header is set in all requests

**In middleware:**
```typescript
// apps/appapi/src/middleware/authMiddleware.ts

export const extractClientId = async (c: Context, next: Next) => {
  try {
    // From JWT token
    const token = c.req.header('Authorization')?.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)
    
    c.req.header('x-client-id', decoded.sub) // Set for backend use
    
  } catch (error) {
    throw new HTTPException(401, { message: 'Unauthorized' })
  }
  
  await next()
}

app.use('*', extractClientId)
```

### Step 1.4: Test Backend Endpoints

**Create test file:**
```bash
# apps/appapi/tests/client-projects.test.ts

import { describe, it, expect } from 'vitest'
import { createTestClient } from 'hono/testing'
import app from '../src/index'

const client = createTestClient(app)

describe('POST /api/client/projects/draft', () => {
  it('should create new project draft', async () => {
    const res = await client.post('/api/client/projects/draft', {
      clientId: 'client_test_123',
      step1: {
        title: 'Test Project',
        budgetTotal: 100000000,
        budgetCurrency: 'IDR',
        castingDeadline: '2026-05-10'
      },
      step2: { roles: [] },
      step3: { castingMode: 'private' }
    }, {
      headers: { 'x-client-id': 'client_test_123' }
    })
    
    expect(res.status).toBe(200)
    expect(res.json().projectId).toBeDefined()
  })
})

# Run tests:
npm run test --filter=appapi
```

---

## 🎨 PHASE 2: FRONTEND SETUP (1 day)

### Step 2.1: Install Dependencies

```bash
# In apps/appclient/

npm install zustand framer-motion lucide-react
npm install -D @types/zustand
```

### Step 2.2: Create Store File

**File:**
```
apps/appclient/src/store/useProjectWizardStore.ts
```

**Already created** - Verify Zustand middleware is imported:
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Middleware config
name: 'project-wizard-store',
partialize: (state) => ({ draft: state.draft })
```

### Step 2.3: Create Component Files

**Directory structure:**
```
apps/appclient/src/components/projects/
├── ProjectWizardContainer.tsx    [✓ CREATED]
├── RoleBuilder.tsx               [✓ CREATED]
└── steps/
    ├── Step1ProjectBrief.tsx     [✓ CREATED]
    ├── Step2RoleBreakdown.tsx    [✓ CREATED]
    ├── Step3CastingMode.tsx      [✓ CREATED]
    └── Step4ProductionLogistics.tsx [✓ CREATED]
```

### Step 2.4: Integrate into Router

**In main page:**
```typescript
// apps/appclient/src/pages/projects/create.tsx

import React from 'react'
import ProjectWizardContainer from '../../components/projects/ProjectWizardContainer'
import { useAuth } from '../../hooks/useAuth'

export default function ProjectCreatePage() {
  const { user } = useAuth()

  if (!user) {
    return <div>Unauthorized</div>
  }

  return (
    <ProjectWizardContainer
      clientId={user.id}
      onSuccess={(data) => {
        console.log('Project published:', data)
        // Redirect or show success toast
      }}
      onCancel={() => {
        // Navigate back
      }}
    />
  )
}
```

### Step 2.5: Tailwind Dark Mode Setup

**Verify in `tailwind.config.js`:**
```javascript
export default {
  darkMode: 'class', // or 'media'
  theme: {
    extend: {
      colors: {
        gold: {
          500: '#FFD700',
          600: '#FFC700',
          // ...
        }
      }
    }
  }
}
```

### Step 2.6: Test Components Locally

```bash
# Start dev server
npm run dev --filter=appclient

# Navigate to: http://localhost:5173/projects/create
# Test interaction:
# - Fill Step 1 form
# - Add multiple roles in Step 2
# - Select casting mode in Step 3
# - Upload files in Step 4
# - Check localStorage for persistent state
```

---

## 🔗 PHASE 3: FRONTEND-BACKEND INTEGRATION (1 day)

### Step 3.1: Create API Client Service

**File:**
```typescript
// apps/appclient/src/lib/projectService.ts

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787'

export const projectService = {
  async createDraft(payload: ProjectDraftPayload) {
    const response = await fetch(`${API_BASE}/api/client/projects/draft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      credentials: 'include',
      body: JSON.stringify(payload)
    })
    
    if (!response.ok) {
      throw new Error('Failed to create draft')
    }
    
    return response.json()
  },

  async updateDraft(projectId: string, payload: ProjectDraftPayload) {
    const response = await fetch(
      `${API_BASE}/api/client/projects/${projectId}/draft`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      }
    )
    
    if (!response.ok) {
      throw new Error('Failed to save draft')
    }
    
    return response.json()
  },

  async publishProject(projectId: string, payload: ProjectDraftPayload) {
    const response = await fetch(
      `${API_BASE}/api/client/projects/${projectId}/publish`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      }
    )
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Publish failed')
    }
    
    return response.json()
  }
}

function getToken(): string {
  // From auth context or localStorage
  return localStorage.getItem('authToken') || ''
}
```

### Step 3.2: Update Store with API Calls

**Modify autosaveDraft and publishProject methods:**
```typescript
// In useProjectWizardStore.ts

autosaveDraft: async () => {
  // Already implemented - uses projectService
},

publishProject: async () => {
  // Already implemented - uses projectService
  // with proper error handling
}
```

### Step 3.3: Test Full Flow Locally

**Setup local backend:**
```bash
cd apps/appapi
npm run dev
# Runs on http://localhost:8787

cd apps/appclient
npm run dev
# Runs on http://localhost:5173

# Test in browser DevTools:
# 1. Fill form in all steps
# 2. Check localStorage: project-wizard-store
# 3. Open Network tab: watch /api/client/projects/* calls
# 4. Verify autosave every 30s
# 5. Click Publish → Check transaction success
```

---

## 🧪 PHASE 4: TESTING & QA

### Step 4.1: Unit Tests

```typescript
// tests/projectWizard.test.ts

describe('useProjectWizardStore', () => {
  it('should validate budget correctly', () => {
    const store = useProjectWizardStore.getState()
    store.initializeDraft('client_123')
    
    store.updateStep1({ budgetTotal: 100 })
    store.addRole()
    // ... fill role data ...
    
    const budgetStatus = store.calculateBudgetStatus()
    expect(budgetStatus.isOverBudget).toBe(false)
  })

  it('should prevent invalid transitions', () => {
    const store = useProjectWizardStore.getState()
    const canAdvance = store.nextStep()
    expect(canAdvance).toBe(false) // No step1 data
  })
})
```

**Run tests:**
```bash
npm run test --filter=appclient
```

### Step 4.2: E2E Tests

```typescript
// tests/e2e/projectWizard.test.ts
// Using Playwright/Cypress

describe('Project Creation Wizard', () => {
  it('should complete full wizard flow', async ({ page }) => {
    // 1. Navigate to create
    await page.goto('/projects/create')
    
    // 2. Fill Step 1
    await page.fill('input[placeholder*="Project Title"]', 'E2E Test Project')
    await page.fill('input[type="number"]', '100000000') // Budget
    await page.click('button:has-text("Continue")')
    
    // 3. Fill Step 2
    await page.click('button:has-text("Add Role")')
    // ... fill role details ...
    
    // 4. Select Step 3 mode
    await page.click('button:has-text("Public Casting Call")')
    
    // 5. Publish
    await page.click('button:has-text("Publish Project")')
    
    // 6. Verify success
    await expect(page).toHaveURL(/\/projects\/\w+/)
  })
})

npm run test:e2e
```

### Step 4.3: Manual QA Checklist

**Browser Testing:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS 14+)
- [ ] Chrome Mobile (Android)

**Dark Mode:**
- [ ] All fields readable on dark background
- [ ] Gold accent visible against dark
- [ ] Glassmorphism effect works (Windows 11+)

**Responsiveness:**
- [ ] Mobile (< 640px): Single column, stacked roles
- [ ] Tablet (640-1024px): 2 columns for role cards
- [ ] Desktop (> 1024px): Full layout with all details

**Data Flow:**
- [ ] Autosave every 30 seconds
- [ ] localStorage persists on refresh
- [ ] Budget validation blocks over-allocation
- [ ] Publish creates all DB records atomically

**Error Scenarios:**
- [ ] Network disconnect → Retry on reconnect
- [ ] Publish fails → Draft preserved
- [ ] Budget exceeded → Red error display
- [ ] Missing required field → Next button disabled

---

## 🚀 PHASE 5: DEPLOYMENT

### Step 5.1: Environment Configuration

**Production Environment Variables:**

```env
# .env.production

VITE_API_URL=https://api.orlandmanagement.com
VITE_AUTH_URL=https://auth.orlandmanagement.com
VITE_ENVIRONMENT=production
```

**Backend Configuration:**

```toml
# wrangler.toml

[env.production]
vars = { ENVIRONMENT = "production" }

[[d1_databases]]
binding = "DB"
database_name = "orland_prod"
database_id = "xxx-xxx-xxx"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "orland-assets-prod"
```

### Step 5.2: Security Checklist

- [ ] HTTPS only (wrangler auto-handles)
- [ ] CORS configured for talentplatform.com
- [ ] Rate limiting on /publish endpoint (1 req/5 sec)
- [ ] JWT signing key rotated
- [ ] Database encryption enabled
- [ ] Sensitive env vars in Cloudflare Secret Manager
- [ ] SQL injection prevention (parameterized queries ✓)
- [ ] XSS prevention (sanitize role descriptions)

### Step 5.3: Build & Deploy

```bash
# Frontend Build
npm run build --filter=appclient
# Output: apps/appclient/dist/

# Backend Build
npm run build --filter=appapi
# Output: apps/appapi/dist/

# Deploy to Cloudflare
# Frontend
wrangler pages deploy apps/appclient/dist --project-name orland-client

# Backend
wrangler deploy --env production
```

### Step 5.4: Post-Deployment Verification

```bash
# 1. Database integrity
wrangler d1 execute DATABASE_ID --command "SELECT COUNT(*) FROM client_projects"

# 2. API health check
curl -X GET https://api.orlandmanagement.com/health

# 3. Frontend load test
curl -I https://client.orlandmanagement.com

# 4. Monitor logs
wrangler tail --env production

# 5. Smoke test - Create project
curl -X POST https://api.orlandmanagement.com/api/client/projects/draft \
  -H "Content-Type: application/json" \
  -H "x-client-id: test_user" \
  -d '{...}'
```

---

## 📊 PHASE 6: MONITORING & MAINTENANCE

### Step 6.1: Observability Setup

**Sentry Integration (Errors):**
```typescript
import * as Sentry from "@sentry/react"

Sentry.init({
  dsn: "https://xxx@sentry.io/yyyy",
  environment: "production",
  tracesSampleRate: 0.1
})
```

**Datadog Integration (Performance):**
```typescript
import { datadogRum } from '@datadog/browser-rum'

datadogRum.init({
  applicationId: 'xxx',
  clientToken: 'xxx',
  site: 'datadoghq.com',
  service: 'orland-client',
  env: 'production'
})
```

### Step 6.2: Key Metrics to Monitor

**Application Metrics:**
- `wizard_completion_rate` - % of started → published
- `step_abandonment_rate` - Where users drop off most
- `autosave_success_rate` - Draft saves succeeding
- `publish_transaction_success_rate` - Should be ~99%+

**Database Metrics:**
- Query latency (p50, p95, p99)
- Transaction rollback rate
- DB storage growth
- Connection pool utilization

**Error Metrics:**
- Budget validation failures
- Network timeout rate
- JWT validation failures
- DB constraint violations

### Step 6.3: Alerting Rules

```
Alert: "Publishing Transactions > 1% Failure"
  Condition: publish_failures_rate > 0.01
  Action: Slack #alerts + PagerDuty

Alert: "Autosave Latency P95 > 2s"
  Condition: autosave_latency_p95 > 2000ms
  Action: Email DBA + Check DB performance

Alert: "Wizard Abandonment Rate Spike"
  Condition: abandonment_rate > baseline + 10%
  Action: Slack #product-team (user experience concern)
```

---

## 📋 FINAL DEPLOYMENT CHECKLIST

### Pre-Launch (48 hours before)
- [ ] Run full E2E test suite - All pass ✓
- [ ] Load test with 1000 concurrent users
- [ ] Database backup taken
- [ ] Rollback plan documented
- [ ] Team trained on monitoring dashboards
- [ ] Customer support prepped with FAQ

### Launch Day
- [ ] Deploy to production
- [ ] Monitor error rates for 2 hours (< 0.1%)
- [ ] Test with real client account
- [ ] Verify casting links work
- [ ] Check database replication
- [ ] Announce in Slack #releases

### Post-Launch (First Week)
- [ ] Daily performance review
- [ ] Monitor user feedback
- [ ] Track completion rate
- [ ] Fine-tune rate limits if needed
- [ ] Archive error logs after 7 days

---

## 🎯 SUCCESS METRICS

**Target Numbers (First Month):**
- Wizard Completion Rate: > 85%
- Publish Transaction Success: > 99%
- Autosave Response Time: < 500ms (p95)
- Budget Validation Accuracy: 100%
- User Satisfaction Score: > 4.5/5

---

## 🆘 TROUBLESHOOTING

### Issue: "Autosave failing with 401 Unauthorized"
**Solution:** Check JWT token in localStorage - may be expired. Refresh page forces re-auth.

### Issue: "Budget calculation showing wrong total"
**Solution:** Ensure role.budgetPerTalent is NUMBER, not STRING. Check browser console for type errors.

### Issue: "Publish succeeds but project doesn't appear in list"
**Solution:** Query may use stale cache. Clear browser cache or add `cache-control: max-age=0` header.

### Issue: "Casting link token not generated"
**Solution:** Check for DB constraint violations - token must be unique. Retry publish.

---

## 📞 SUPPORT CONTACTS

- **Backend Issues:** @backend-team on Slack
- **Database Emergencies:** @dba-oncall
- **Deployment Help:** @devops-team
- **Product Questions:** @product-managers

---

**Status:** Ready for Production ✅  
**Last Updated:** April 10, 2026  
**Reviewed By:** Senior Engineering Team
