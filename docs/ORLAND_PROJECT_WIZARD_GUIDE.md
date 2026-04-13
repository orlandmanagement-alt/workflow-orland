## Orland Client Dashboard - Project Creation System
## Complete Architecture & Integration Guide

**Version:** 1.0  
**Date:** April 2026  
**System:** Multi-step Project Wizard with Smart Publishing Engine

---

## 📋 TABLE OF CONTENTS

1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [Frontend State Management](#frontend-state-management)
4. [UI Components](#ui-components)
5. [Backend API Endpoints](#backend-api-endpoints)
6. [Transaction Flow](#transaction-flow)
7. [Error Handling](#error-handling)
8. [Integration Checklist](#integration-checklist)

---

## 🏗 SYSTEM ARCHITECTURE

### High-Level Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Client Browser (Dark Mode + Glassmorphism UI)              │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ProjectWizardContainer                               │  │
│  │  - Step 1: Project Brief                             │  │
│  │  - Step 2: Role Breakdown (RoleBuilder)              │  │
│  │  - Step 3: Casting Mode                              │  │
│  │  - Step 4: Production Logistics                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│         Zustand Store (useProjectWizardStore)              │
│         - Client-side state persistence                    │
│         - Auto-save every 30 seconds                       │
└─────────────────────────────────────────────────────────────┘
                          ↓ (JSON over HTTPS)
┌─────────────────────────────────────────────────────────────┐
│  Hono Backend (api.orlandmanagement.com)                    │
│                                                             │
│  POST  /api/client/projects/draft           [new project]  │
│  POST  /api/client/projects/{id}/draft      [autosave]      │
│  POST  /api/client/projects/{id}/publish    [TRANSACTION]   │
│  GET   /api/client/projects/{id}/draft      [load draft]    │
│  DELETE /api/client/projects/{id}           [delete draft]  │
└─────────────────────────────────────────────────────────────┘
                          ↓ (SQLite D1)
┌─────────────────────────────────────────────────────────────┐
│  Cloudflare D1 Database                                     │
│                                                             │
│  Tables:                                                    │
│  - client_projects       (Project metadata)                 │
│  - project_roles         (Casting breakdown)                │
│  - live_casting_boards   (Public casting config)            │
│  - job_applications      (For talent applications)          │
│  - project_draft_state   (Transient autosave)               │
│  - ph_production_logistics (Script/storyboard files)        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄 DATABASE SCHEMA

### Table: `client_projects`
**Purpose:** Core project records with publishing state

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| id | TEXT | PRIMARY KEY | Unique project ID (proj_*) |
| client_id | TEXT | FK(sso_users) | Project owner |
| title | TEXT | NOT NULL | Project name |
| description | TEXT | | Extended description |
| banner_url | TEXT | | Hero image URL |
| budget_total | REAL | NOT NULL | Total budget cap |
| budget_currency | TEXT | DEFAULT 'IDR' | Currency type |
| casting_deadline | TEXT | NOT NULL | Audition cutoff date |
| is_casting_open | BOOLEAN | DEFAULT FALSE | Public casting flag |
| casting_link_token | TEXT | UNIQUE | Public access token |
| casting_visibility | TEXT | IN('private','public','link-only') | Access control |
| status | TEXT | IN('draft','active','paused','completed') | Workflow state |
| published_at | TEXT | | Publication timestamp |
| created_at | TEXT | DEFAULT NOW | Creation timestamp |
| updated_at | TEXT | DEFAULT NOW | Last modification |

**Indices:**
- `idx_client_projects_client_id` (for fetching user's projects)
- `idx_client_projects_status` (for filtering by state)
- `idx_client_projects_casting_token` (for public lookup)

### Table: `project_roles`
**Purpose:** Casting breakdown - defines available positions

| Column | Type | Purpose |
|--------|------|---------|
| id | TEXT | Role ID (role_*) |
| project_id | TEXT | FK to project |
| role_name | TEXT | "Lead Actor", "Figurant", etc |
| role_description | TEXT | Role details |
| quantity_needed | INT | # positions to fill |
| budget_per_talent | REAL | Fee per talent |
| total_budget_allocated | REAL | COMPUTED: qty × budget |
| gender_requirement | TEXT | 'any'/'male'/'female'/'other' |
| age_min, age_max | INT | Age range filter |
| height_min_cm, height_max_cm | REAL | Physical specs |
| preferred_skills | JSON | ["Acting", "Singing"] |
| preferred_appearance | JSON | {face_type, skin_tone, etc} |
| status | TEXT | 'active'/'filled'/'cancelled' |
| positions_filled | INT | Counter for hiring |
| display_order | INT | UI sort order |
| created_at, updated_at | TEXT | Timestamps |

**Indices:**
- `idx_project_roles_project_id`
- `idx_project_roles_status`

### Table: `live_casting_boards`
**Purpose:** Public casting call configuration

| Column | Type | Purpose |
|--------|------|---------|
| id | TEXT | Board ID (board_*) |
| project_id | TEXT | FK to project |
| board_type | TEXT | 'private'/'public'/'link-only' |
| access_token | TEXT | UNIQUE public casting link |
| allow_guest_submissions | BOOLEAN | Non-platform submissions allowed |
| casting_director_name | TEXT | Casting person name |
| casting_director_email | TEXT | Contact email |
| guest_questions | JSON | Custom questions for talents |
| opened_at | TEXT | When casting opened |
| expires_at | TEXT | Casting deadline |
| status | TEXT | 'draft'/'active'/'closed' |
| created_at, updated_at | TEXT | Timestamps |

### Table: `project_draft_state`
**Purpose:** Transient autosave for incomplete wizards

| Column | Type | Purpose |
|--------|------|---------|
| id | TEXT | Draft state ID |
| project_id | TEXT | FK to project (UNIQUE) |
| client_id | TEXT | FK to user |
| step_1_data | JSON | Project brief form data |
| step_2_data | JSON | Roles array |
| step_3_data | JSON | Casting config |
| step_4_data | JSON | Production notes |
| current_step | INT | Last active step (1-4) |
| last_completed_step | INT | Furthest completed |
| last_saved_at | TEXT | Most recent autosave |
| expires_at | TEXT | Auto-delete after 7 days |

---

## 🧠 FRONTEND STATE MANAGEMENT

### Zustand Store: `useProjectWizardStore`

**Store Structure:**
```typescript
{
  // State
  draft: ProjectDraft | null
  isLoading: boolean
  isSaving: boolean
  isPublishing: boolean
  validationErrors: ValidationError[]

  // Actions (methods)
  initializeDraft(clientId, projectId?)
  loadDraftFromDb(projectId)
  updateStep1(data)
  updateStep2(roles)
  updateStep3(data)
  updateStep4(data)
  addRole()
  updateRole(roleId, updates)
  removeRole(roleId)
  moveRole(roleId, 'up'|'down')
  goToStep(step)
  nextStep() -> boolean
  previousStep()
  autosaveDraft()
  publishProject() -> {projectId, castingLink}
  validateStep(step) -> boolean
  calculateBudgetStatus()
  clearDraft()
  reset()
}
```

**Auto-persistence:**
- Uses `persist` middleware to localStorage
- Only persists `draft` object
- Reduces API load on refresh

**Budget Validation:**
```typescript
// Whenever roles change:
const budgetStatus = store.calculateBudgetStatus()
// Returns: { allocated, total, remaining, isOverBudget }
```

---

## 🎨 UI COMPONENTS

### Component Hierarchy

```
ProjectWizardContainer (Main coordinator)
├── Step Progress Bar
│   ├── Step Indicator Buttons (1-4)
│   └── Budget Status Bar
├── Step Content (AnimatePresence)
│   ├── Step1ProjectBrief
│   │   ├── Title input
│   │   ├── Description textarea
│   │   ├── Banner upload
│   │   ├── Budget & deadline inputs
│   │   └── Info box
│   ├── Step2RoleBreakdown
│   │   ├── Role table (desktop) / cards (mobile)
│   │   ├── RoleBuilder (inline editor)
│   │   │   └── Advanced options (collapsible)
│   │   ├── Add role button
│   │   └── Budget summary
│   ├── Step3CastingMode
│   │   ├── 3 mode selector cards
│   │   ├── Live audition config (conditional)
│   │   └── Summary
│   └── Step4ProductionLogistics
│       ├── 3 file upload cards
│       ├── Production notes textarea
│       └── Upload summary
└── Navigation buttons (Back/Continue/Publish)
```

### Component Props & State

**ProjectWizardContainer**
```tsx
<ProjectWizardContainer
  clientId={string}           // Required: from auth
  projectId={string}          // Optional: for edit mode
  onSuccess={callback}        // After publish
  onCancel={callback}         // Before step 1
/>
```

**RoleBuilder (Inline Editor)**
```tsx
// Renders all roles in project with expandable details
// Features:
// - Inline hover-to-expand
// - Advanced options (collapsible)
// - Skills & appearance as JSON
// - Budget calculation display
```

---

## 🌐 BACKEND API ENDPOINTS

### 1. POST /api/client/projects/draft
**Purpose:** Create new draft project

**Request:**
```json
{
  "clientId": "client_123",
  "step1": {...},
  "step2": {...},
  "step3": {...}
}
```

**Response (201):**
```json
{
  "projectId": "proj_1712829312_abc123"
}
```

**Headers:**
- `x-client-id`: JWT subject (from auth middleware)
- `Content-Type`: application/json

---

### 2. POST /api/client/projects/{id}/draft
**Purpose:** Autosave or update draft

**Request:**
```json
{
  "projectId": "proj_1712829312_abc123",
  "clientId": "client_123",
  "step1": {...},
  "step2": {...},
  "step3": {...},
  "step4": {...}
}
```

**Response (200):**
```json
{
  "projectId": "proj_1712829312_abc123",
  "message": "Draft saved"
}
```

**Validation:**
- ✓ Project ownership (clientId matches)
- ✓ Budget constraints (total roles ≤ project budget)
- ✓ Role count > 0

---

### 3. GET /api/client/projects/{id}/draft
**Purpose:** Load draft for resuming

**Response (200):**
```json
{
  "projectId": "proj_123",
  "clientId": "client_123",
  "step1": {...},
  "step2": {...},
  "step3": {...},
  "step4": {...},
  "currentStep": 2,
  "lastCompletedStep": 1,
  "lastSavedAt": "2026-04-10T14:30:00Z"
}
```

---

### 4. POST /api/client/projects/{id}/publish ⭐
**Purpose:** PUBLISH PROJECT WITH TRANSACTION**

**Request:**
```json
{
  "projectId": "proj_123",
  "clientId": "client_123",
  "step1": {...},
  "step2": {
    "roles": [
      {
        "id": "role_temp_1",
        "roleName": "Lead Actor",
        "quantityNeeded": 1,
        "budgetPerTalent": 5000000,
        ...
      }
    ]
  },
  "step3": {...},
  "step4": {...}
}
```

**Transaction Steps:**
```
BEGIN
  1. Validate budget (totalRoles ≤ projectBudget)
  2. UPDATE projects: status='active', published_at=NOW()
  3. DELETE old roles (if re-publish)
  4. INSERT new roles (batch)
  5. IF not 'private':
       - CREATE live_casting_boards record
       - Generate access_token
       - UPDATE projects.casting_link_token
  6. IF logistics: CREATE ph_production_logistics
  7. DELETE project_draft_state
COMMIT on success
ROLLBACK on error
```

**Response (200):**
```json
{
  "success": true,
  "projectId": "proj_123",
  "status": "active",
  "castingLink": "https://talent.orlandmanagement.com/casting/cast_proj_123_abc...",
  "rolesCreated": 3,
  "message": "Project published successfully"
}
```

**Response (400) - Budget Exceeded:**
```json
{
  "error": "Total role budget (Rp 50M) exceeds project budget (Rp 30M)"
}
```

**Response (400) - Validation Failed:**
```json
{
  "error": "At least one role is required"
}
```

---

### 5. DELETE /api/client/projects/{id}
**Purpose:** Delete draft (before publish)

**Response (200):**
```json
{ "message": "Project deleted" }
```

**Constraints:**
- ✓ Only delete if status = 'draft'
- ✓ Cascade deletes draft_state & logistics

---

## 🔄 TRANSACTION FLOW

### Publishing Flow (Atomic Operation)

```
Client Browser                    Hono Backend                  D1 Database
     │                                 │                              │
     │  POST /publish               │                              │
     ├──────────────────────────────>│                              │
     │                                 │  SELECT * FROM projects │
     │                                 ├─────────────────────────>│
     │                                 │<─────────────────────────┤
     │                                 │  (Verify ownership)        │
     │                                 │                              │
     │                                 │  BEGIN TRANSACTION          │
     │                                 ├─────────────────────────>│
     │                                 │                              │
     │                                 │  UPDATE projects          │
     │                                 ├─────────────────────────>│
     │                                 │  DELETE old roles         │
     │                                 ├─────────────────────────>│
     │                                 │  INSERT x roles (batch)   │
     │                                 ├─────────────────────────>│
     │                                 │  INSERT live board        │
     │                                 ├─────────────────────────>│
     │                                 │  (if not private)         │
     │                                 │                              │
     │                                 │  COMMIT /ROLLBACK        │
     │                                 ├─────────────────────────>│
     │                                 │<─────────────────────────┤
     │                                 │  (All or nothing)        │
     │                                 │                              │
     │<────────────────────────────────┤                              │
     │  {success: true, ...}           │                              │
     │                                 │                              │
```

### Error Handling in Transaction

```
IF any step fails:
  1. ROLLBACK all changes
  2. Return 500 with error message
  3. Log transaction ID for debugging
  4. Frontend retries autosave to preserve state

IF network fails:
  1. Draft persists in localStorage
  2. User can retry when connection restored
```

---

## ⚠ ERROR HANDLING

### Frontend (Client-side)

**Validation Errors:**
```typescript
// In ProjectWizardContainer
{
  validationErrors.length > 0 && (
    <ErrorBox>
      {validationErrors.map(error => (
        <li>{error.message}</li>
      ))}
    </ErrorBox>
  )
}
```

**Network Errors:**
```typescript
const handlePublish = async () => {
  try {
    await publishProject()
  } catch (error) {
    // Toast: "Failed to publish. Your draft is saved. Try again?"
    // Retry logic: exponential backoff
  }
}
```

### Backend (API-side)

**Budget Over-allocation:**
```typescript
if (!budgetCheck.valid) {
  throw new HTTPException(400, { message: budgetCheck.error })
}
// Response: { error: "Total role budget... exceeds..." }
```

**Validation Failures:**
```
400: Invalid input
401: Unauthorized (missing x-client-id)
403: Forbidden (not project owner)
404: Not found (project doesn't exist)
500: Transaction failed (DB error)
```

---

## ✅ INTEGRATION CHECKLIST

### Backend Setup
- [ ] Run migration: `031_DB_CLIENT_PROJECT_CASCADE.sql`
- [ ] Verify tables created with correct indices
- [ ] Add auth middleware that sets `x-client-id` header
- [ ] Implement JWT validation in middleware
- [ ] Set up error interceptor for HTTPException

### Frontend Setup
- [ ] Install `zustand` package: `npm install zustand`
- [ ] Create store: `useProjectWizardStore.ts`
- [ ] Create container: `ProjectWizardContainer.tsx`
- [ ] Create step components (Step1-4)
- [ ] Create role builder: `RoleBuilder.tsx`
- [ ] Import icon library: `lucide-react`
- [ ] Add Framer Motion: `npm install framer-motion`

### Integration Points
- [ ] Connect container to page router
- [ ] Verify auto-save interval (30 sec)
- [ ] Test localStorage persistence
- [ ] Test responsive design (mobile/tablet/desktop)
- [ ] Test dark mode styling

### Testing
- [ ] Unit: validateProjectBudget() function
- [ ] Unit: generateCastingToken() uniqueness
- [ ] Integration: POST /draft → GET /draft (state restore)
- [ ] Integration: POST /publish transaction atomicity
- [ ] E2E: Full wizard flow (Steps 1-4 → Publish)
- [ ] E2E: Re-edit after publish (if allowed)

### Performance Optimization
- [ ] Add React.memo to role cards (expensive renders)
- [ ] Implement useMemo for budget calculations
- [ ] Use Intersection Observer for role list virtualization
- [ ] Monitor bundle size (Framer Motion adds ~15KB)

### Security
- [ ] Validate `x-client-id` matches JWT subject
- [ ] Sanitize role descriptions (XSS prevention)
- [ ] Rate limit publish endpoint (1 req/5 sec per user)
- [ ] Encrypt sensitive data before storage (optional)

### Monitoring
- [ ] Log all publish transactions with unique ID
- [ ] Track validation errors (which step fails most)
- [ ] Monitor publish success rate
- [ ] Alert on DB connection errors
- [ ] Track average wizard completion time

---

## 🚀 USAGE EXAMPLE

### Starting New Project
```tsx
<ProjectWizardContainer
  clientId={userAuth.id}
  onSuccess={(data) => {
    console.log('Project published:', data.projectId)
    navigate(`/projects/${data.projectId}`)
  }}
/>
```

### Editing Existing Project
```tsx
<ProjectWizardContainer
  clientId={userAuth.id}
  projectId={params.projectId}
  onSuccess={() => navigate('/projects')}
/>
```

### Autosave Behavior
```
User types → Field changes → Zustand state updates
   ↓ (30 seconds later)
Auto-save triggers → POST /draft → Backend upserts
   ↓
localStorage synced + updated_at timestamp
```

### Publishing Flow
```
Final step clicked → Publish button → POST /publish
   ↓
Transaction begins → Validate budget → Create records
   ↓
Success: Clear draft + Navigate to project
Failure: Show error + Keep draft in localStorage
```

---

## 📞 SUPPORT & DEBUGGING

### Common Issues

**Q: Budget shows as over-allocated but math looks correct**
A: Check `calculateBudgetStatus()` - role.budgetPerTalent × role.quantityNeeded. Verify `role.quantityNeeded` is integer, not string.

**Q: Draft not persisting after refresh**
A: Check localStorage in DevTools. Zustand `persist` middleware requires `name: 'project-wizard-store'` key.

**Q: Transaction rolls back on publish**
A: Check backend logs for which INSERT failed. Most likely: FK constraint (role → project) or duplicate unique key.

**Q: Casting token not generating**
A: Verify `generateCastingToken()` is async/sync aligned with DB write. Token must be unique - check for duplicates in DB.

---

**Document Version:** 1.0  
**Last Updated:** April 10, 2026  
**Author:** Senior Full-Stack Engineer  
**Status:** Production Ready ✅
