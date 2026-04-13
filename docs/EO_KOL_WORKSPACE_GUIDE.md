## Orland Client Dashboard - EO & KOL Workspace Implementation Guide

**Status:** Production Ready (Backend + Frontend Architecture)
**Date:** April 2026
**Version:** 1.0.0

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Frontend Implementation](#frontend-implementation)
4. [Backend API Routes](#backend-api-routes)
5. [State Management](#state-management)
6. [Integration Guide](#integration-guide)
7. [Deployment Checklist](#deployment-checklist)

---

## Overview

### Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                  CLIENT DASHBOARD (React)                     │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐    ┌──────────────────────┐        │
│  │  EO Workspace        │    │  KOL Workspace       │        │
│  ├──────────────────────┤    ├──────────────────────┤        │
│  │ • RiderChecklist     │    │ • DigitalBriefForm   │        │
│  │ • InteractiveTimeline│    │ • ContentKanbanBoard │        │
│  │ • ScannerDashboard   │    │ • PerformanceAnalytics
│  └──────────────────────┘    └──────────────────────┘        │
│         ↓ Zustand Store            ↓ Zustand Store           │
│  useEOWorkspaceStore         useKOLWorkspaceStore            │
└─────────────────────────────────────────────────────────────┘
         ↓ HTTP (JWT Auth)
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND API (Hono.js)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐    ┌──────────────────────┐        │
│  │  EO Routes           │    │  KOL Routes          │        │
│  ├──────────────────────┤    ├──────────────────────┤        │
│  │ /workspace/eo/:id    │    │ /kol/briefs/:id      │        │
│  │ /eo/riders/:id/*     │    │ /kol/content/*       │        │
│  │ /eo/gate-pass/*      │    │ /kol/tracking/*      │        │
│  └──────────────────────┘    └──────────────────────┘        │
│         ↓ Database Transaction      ↓ Database Transaction   │
└─────────────────────────────────────────────────────────────┘
         ↓ SQLite D1
┌─────────────────────────────────────────────────────────────┐
│                  DATABASE (SQLite D1)                         │
├─────────────────────────────────────────────────────────────┤
│  Tables:                                                      │
│  • eo_hospitality_riders (032)                              │
│  • eo_technical_riders (032)                                │
│  • wo_rundowns (032)                                        │
│  • eo_gate_passes (032)                                     │
│  • kol_briefs (033)                                         │
│  • kol_content_drafts (033)                                 │
│  • kol_tracking_links (033)                                 │
│  • kol_content_review_history (033)                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### EO Workspace Tables (Migration 032)

#### `eo_hospitality_riders`
- **Purpose:** Track hospitality requirements from talent
- **Key Fields:**
  - `is_approved`: 0=pending, 1=approved, -1=rejected
  - `accommodation_type`, `meal_preferences`, `transportation_type`
  - `special_requests`
- **Index:** `project_id`, `talent_id`, `is_approved`

#### `eo_technical_riders`
- **Purpose:** Track technical requirements from talent
- **Key Fields:**
  - `is_approved`: 0=pending, 1=approved, -1=rejected
  - `audio_requirements`, `lighting_requirements`, `dressing_room_requirements`
  - `special_equipment` (JSON)
- **Index:** `project_id`, `talent_id`, `is_approved`

#### `wo_rundowns`
- **Purpose:** Event timeline management with drag-and-drop support
- **Key Fields:**
  - `timeline`: JSON array of `RundownSegment` objects
  - `version`: For collaborative editing
  - `is_finalized`: 0=draft, 1=locked for execution
  - `last_modified_by`: Track who last edited
- **Structure:** `start_time`, `end_time`, `talent_ids`, `stage`, `status`

#### `eo_gate_passes`
- **Purpose:** Access control and attendance tracking
- **Key Fields:**
  - `pass_code`: Unique QR code token
  - `pass_type`: performer, crew, vip_guest, stage_crew
  - `access_areas`: JSON array of allowed areas
  - `is_present`: 0=not arrived, 1=checked in, -1=absent
  - `scanned_at`: Check-in timestamp

### KOL Workspace Tables (Migration 033)

#### `kol_briefs`
- **Purpose:** Digital campaign guidelines for KOL
- **Key Fields:**
  - `guidelines`: JSON with do's/don'ts, hashtags, tone, visual guidelines
  - `moodboard_urls`: Array of reference images
  - `submission_deadline`: Talent deadline
  - `campaign_objective`: awareness, engagement, conversion, viral

#### `kol_content_drafts`
- **Purpose:** Track submitted content through review workflow
- **Key Fields:**
  - `status`: pending_review → revision_requested → approved (or rejected)
  - `video_url`, `video_thumbnail_url`
  - `feedback_text`: Revision notes
  - `revision_count`: Track resubmissions
  - `approved_at`: Final approval timestamp

#### `kol_tracking_links`
- **Purpose:** Measure performance per KOL content
- **Key Fields:**
  - `tracking_token`: Unique URL token
  - `total_clicks`, `unique_visitors`, `conversion_count`
  - `bounce_rate`, `top_countries`, `device_breakdown`
  - `link_created_at`, `link_activated_at`

#### `kol_content_review_history`
- **Purpose:** Audit trail for compliance and history
- **Fields:** `action`, `feedback`, `action_timestamp`, `reviewed_by`

---

## Frontend Implementation

### Component Structure

```
apps/appclient/src/
├── components/
│   └── workspace/
│       ├── EOWorkspace/
│       │   ├── RiderChecklist.tsx (280 lines)
│       │   ├── InteractiveTimeline.tsx (350 lines)
│       │   └── ScannerDashboard.tsx (280 lines)
│       └── KOLWorkspace/
│           ├── DigitalBriefForm.tsx (320 lines)
│           ├── ContentKanbanBoard.tsx (380 lines)
│           └── PerformanceAnalytics.tsx (360 lines)
├── store/
│   ├── useEOWorkspaceStore.ts (450 lines - Zustand)
│   └── useKOLWorkspaceStore.ts (480 lines - Zustand)
```

### Components Delivered

#### **EO Workspace - Event Operations**

##### 1. RiderChecklist.tsx
**Purpose:** Approve/reject talent hospitality and technical riders
**Features:**
- 2-column layout: Hospitality + Technical status badges
- Inline approval/rejection with modal for feedback
- Color-coded status (green=approved, yellow=pending, red=rejected)
- Tab filtering: all, pending, approved

**Usage:**
```tsx
<RiderChecklist projectId={projectId} />
```

**State Management:**
```typescript
const { riders, selectRider, approveRider, rejectRider } = useEOWorkspaceStore()
```

##### 2. InteractiveTimeline.tsx
**Purpose:** Drag-and-drop rundown management with Gantt visualization
**Features:**
- Visual timeline bar showing all segments proportionally
- Drag-to-reorder segments (cursor feedback)
- Start/Done buttons for live status tracking
- Auto-calculates total duration in minutes
- Version tracking for collaborative editing
- "Finalize" button locks rundown for execution

**Timeline Structure:**
```json
{
  "id": "seg_1",
  "segment_name": "Opening Performance",
  "start_time": "18:00",
  "end_time": "18:15",
  "duration_minutes": 15,
  "talent_ids": ["talent_123"],
  "stage": "main_stage",
  "status": "not_started" | "in_progress" | "completed"
}
```

##### 3. ScannerDashboard.tsx
**Purpose:** QR code scanning for talent check-in
**Features:**
- Real-time scanner input with debounce
- 4-stat cards: Total, Present, Not Arrived, Absent
- Pass list with instant visual feedback on scan
- Filter by attendance status with tap-to-filter
- Last scanned highlight (blue ring)

**Scan Flow:**
```typescript
await scanPass(passCode) → Update is_present = 1 → Show success message
```

---

#### **KOL Workspace - Digital Campaign**

##### 1. DigitalBriefForm.tsx
**Purpose:** Create campaign guidelines for KOL talent
**Features:**
- Multi-section form organized with headers
- Dynamic list management (Do's, Don'ts, Hashtags, Guidelines)
- Tone selector (casual, professional, funny, serious, aspirational)
- Campaign objective selector (awareness, engagement, conversion, viral)
- Moodboard URLs + inspiration links
- Target audience + posting schedule fields

**Brief Guidelines JSON:**
```json
{
  "do_list": ["Mention product 3x", "Use brand colors"],
  "dont_list": ["No politics", "No competitor mentions"],
  "mandatory_hashtags": ["#BrandName"],
  "optional_hashtags": ["#Trending"],
  "tone": "casual",
  "visual_guidelines": ["Use brand kit colors"],
  "target_audience": "18-35 years old, Urban",
  "posting_schedule": "Post by April 15, 2026"
}
```

##### 2. ContentKanbanBoard.tsx
**Purpose:** Review content workflow (Trello-like board)
**Features:**
- 3-column Kanban: Pending Review → Revision Requested → Approved
- Drag-and-drop between columns (auto-approves when dropped to Approved)
- Card preview: Thumbnail, talent name, caption, hashtags, date
- Play button overlay for video preview
- **Action buttons (when card selected):**
  - Pending: "Request Revision" or "Approve"
  - Revision: "Approve"
  - Approved: Display "Content Live" status
- Modal for revision feedback
- Color-coded headers per column

##### 3. PerformanceAnalytics.tsx
**Purpose:** Track KOL content performance metrics
**Features:**
- 4 summary cards: Total Clicks, Conversions, Approved Content, Avg Bounce Rate
- Top Performers leaderboard (sorted by clicks)
- Individual talent analytics with trending sparklines
- Geographic breakdown (top countries by clicks)
- Device breakdown (mobile vs desktop pie chart)
- CTR (Click-through Rate) calculation

---

### State Management (Zustand)

#### useEOWorkspaceStore
**State Structure:**
```typescript
{
  // Rundown
  rundown: RundownTimeline | null
  draggedSegment: RundownSegment | null
  isSavingRundown: boolean
  
  // Riders
  riders: RiderChecklistItem[]
  selectedRiderId: string | null
  isApprovingRider: boolean
  
  // Gate Passes  
  gatePasses: GatePass[]
  scannerFilter: 'all' | 'present' | 'absent' | 'not_arrived'
}
```

**Key Actions:**
- `updateRundownSegment()` - Update single segment
- `reorderSegments()` - Drag-drop reorder
- `saveRundown()` - Auto-save to API
- `finalizeRundown()` - Lock for execution
- `approveRider()` - Approve hospitality/technical
- `scanPass()` - Check-in talent
- `getFilteredPasses()` - Filter gate passes by status

**Persistence:** localStorage (rundown, filters, selections)

#### useKOLWorkspaceStore
**State Structure:**
```typescript
{
  // Briefs
  briefs: KOLBrief[]
  selectedBriefId: string | null
  
  // Kanban Board
  kanbanBoard: {
    pending_review: KanbanCard[]
    revision_requested: KanbanCard[]
    approved: KanbanCard[]
  }
  draggedCard: KanbanCard | null
  
  // Performance
  performanceMetrics: Record<string, KOLTrackingLink>
  
  // UI
  kanbanFilter: 'all' | 'pending_only' | 'high_revision'
  sortBy: 'recent' | 'clicks' | 'talent_name'
}
```

**Key Actions:**
- `approveContent()` - Approve with tracking link generation
- `requestRevision()` - Send back for revision with feedback
- `rejectContent()` - Reject with reason
- `moveCardLocally()` - Update kanban position
- `getFilteredBoard()` - Apply filters and sorting
- `setPerformanceMetrics()` - Load analytics data

**Persistence:** localStorage (selectedBriefId, filters, sort)

---

## Backend API Routes

### EO Workspace Endpoints

#### GET /api/client/workspace/eo/:projectId
**Purpose:** Fetch all EO workspace data (riders, rundown, gate passes)
**Response:**
```json
{
  "success": true,
  "data": {
    "project_id": "proj_123",
    "riders": [{
      "id": "rider_1",
      "talent_id": "talent_123",
      "talent_name": "Budi Santoso",
      "hospitality": { "is_approved": 1, ... },
      "technical": { "is_approved": -1, "rejection_reason": "..." }
    }],
    "rundown": {
      "timeline": [...],
      "version": 2,
      "is_finalized": false
    },
    "gate_passes": [...],
    "stats": {
      "riders_approved_hospitality": 8,
      "riders_approved_technical": 6,
      "passes_checked_in": 12
    }
  }
}
```

#### PUT /api/client/eo/riders/:riderId/approve?type=hospitality|technical
**Purpose:** Approve rider request
**Request:**
```json
{
  "action": "approve"
}
```
**Response:**
```json
{
  "success": true,
  "message": "hospitality rider approved"
}
```
**Side Effects:**
- Send email notification to talent
- Update approval timestamp
- Record approver ID for audit

#### PUT /api/client/eo/riders/:riderId/reject?type=hospitality|technical
**Purpose:** Reject rider request with reason
**Request:**
```json
{
  "reason": "Venue doesn't support wireless mics"
}
```
**Response:**
```json
{
  "success": true,
  "message": "hospitality rider rejected"
}
```

#### PUT /api/client/workspace/eo/:projectId/rundown
**Purpose:** Save rundown timeline changes
**Request:**
```json
{
  "timeline": [
    {
      "id": "seg_1",
      "segment_name": "Opening",
      "start_time": "18:00",
      "end_time": "18:15",
      "duration_minutes": 15,
      "talent_ids": ["talent_123"],
      "stage": "main_stage",
      "notes": "...",
      "status": "not_started",
      "order": 1
    }
  ],
  "version": 2
}
```
**Response:**
```json
{
  "success": true,
  "message": "Rundown saved"
}
```

#### POST /api/client/workspace/eo/:projectId/rundown/finalize
**Purpose:** Lock rundown for execution
**Response:**
```json
{
  "success": true,
  "message": "Rundown finalized"
}
```
**Side Effects:**
- Set `is_finalized = 1`
- Send confirmation to all stakeholders
- Trigger event execution workflows

#### POST /api/client/eo/gate-pass/scan
**Purpose:** Scan QR code for check-in
**Request:**
```json
{
  "pass_code": "PASS_ABC123XYZ"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "pass_1",
    "talent_name": "Budi Santoso",
    "is_present": 1,
    "scanned_at": "2026-04-10T18:05:00Z"
  }
}
```

---

### KOL Workspace Endpoints

#### GET /api/client/kol/briefs/:briefId?project_id=proj_123
**Purpose:** Fetch brief details
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "brief_1",
    "campaign_name": "Summer Campaign 2026",
    "guidelines": {
      "do_list": ["Mention product 3x"],
      "dont_list": ["No politics"],
      "mandatory_hashtags": ["#Brand"]
    },
    "submission_deadline": "2026-04-15T23:59:59Z"
  }
}
```

#### POST /api/client/kol/content/:draftId/review
**Purpose:** Review content with transaction support
**Request:**
```json
{
  "action": "revision_requested" | "approved" | "rejected",
  "feedback": "Please add more brand mentions"
}
```

**Database Transaction:**
```sql
BEGIN TRANSACTION
  -- Update content draft status
  UPDATE kol_content_drafts SET status = ?, reviewed_by = ?, feedback_text = ?
  
  -- Create audit trail
  INSERT INTO kol_content_review_history (...)
  
  -- If approved, generate tracking link
  INSERT INTO kol_tracking_links (...)
  UPDATE kol_content_drafts SET tracking_link_id = ?
  
COMMIT
```

**Response:**
```json
{
  "success": true,
  "data": {
    "content": { ... updated draft ... },
    "tracking_data": { ... if approved ... }
  }
}
```

**Side Effects:**
- Send email/notification to talent
- If revision: "Your video needs revision: {feedback}"
- If approved: "Your video is approved! View tracking: {link}"

#### GET /api/client/kol/content/board?project_id=proj_123
**Purpose:** Fetch kanban board with all columns
**Response:**
```json
{
  "success": true,
  "data": {
    "pending_review": [ ... ],
    "revision_requested": [ ... ],
    "approved": [ ... with tracking_data ... ]
  },
  "stats": {
    "pending_review": 5,
    "revision_requested": 2,
    "approved": 12
  }
}
```

#### GET /api/client/kol/tracking/:trackingToken/click
**Purpose:** Record click on tracking link
**Response:**
```json
{
  "success": true,
  "clicks": 150
}
```
**Side Effects:**
- Increment `total_clicks`
- Track geo/device info
- Update analytics in real-time

---

## Integration Guide

### Setup Step-by-Step

#### 1. Database Migrations
```bash
# Apply migrations in order
sqlite3 database.db < 032_DB_CORE_eo_workspace_runners.sql
sqlite3 database.db < 033_DB_CORE_kol_specialist_workspace.sql
```

#### 2. Update Main API Router
In `apps/appapi/src/index.ts`:
```typescript
import eoWorkspaceRoutes from './routes/eo-workspace'
import kolWorkspaceRoutes from './routes/kol-workspace'

app.route('/api/client/workspace', eoWorkspaceRoutes)
app.route('/api/client/eo', eoWorkspaceRoutes)
app.route('/api/client/kol', kolWorkspaceRoutes)
```

#### 3. Install Frontend Dependencies
```bash
npm install zustand
```

#### 4. Create Pages in appclient
```typescript
// apps/appclient/src/pages/workspace/eo.tsx
import { RiderChecklist } from '@/components/workspace/EOWorkspace/RiderChecklist'
import { InteractiveTimeline } from '@/components/workspace/EOWorkspace/InteractiveTimeline'
import { ScannerDashboard } from '@/components/workspace/EOWorkspace/ScannerDashboard'
import { useEOWorkspaceStore } from '@/store/useEOWorkspaceStore'

export default function EOWorkspacePage() {
  const { rundown, setRundown } = useEOWorkspaceStore()
  
  useEffect(() => {
    // Fetch data
    fetch('/api/client/workspace/eo/proj_123')
      .then(r => r.json())
      .then(data => {
        setRundown(data.data.rundown)
        // ... set other state
      })
  }, [])
  
  return (
    <div className="space-y-6">
      <RiderChecklist projectId="proj_123" />
      <InteractiveTimeline projectId="proj_123" />
      <ScannerDashboard projectId="proj_123" />
    </div>
  )
}
```

#### 5. Similar Setup for KOL Workspace
```typescript
// apps/appclient/src/pages/workspace/kol.tsx
import { DigitalBriefForm } from '@/components/workspace/KOLWorkspace/DigitalBriefForm'
import { ContentKanbanBoard } from '@/components/workspace/KOLWorkspace/ContentKanbanBoard'
import { PerformanceAnalytics } from '@/components/workspace/KOLWorkspace/PerformanceAnalytics'
```

---

## Deployment Checklist

### Database
- [ ] Run migrations 032 and 033
- [ ] Verify all tables created with correct schema
- [ ] Create indexes for performance
- [ ] Test triggers for auto-update timestamps

### Backend (Hono API)
- [ ] Deploy eo-workspace.ts routes
- [ ] Deploy kol-workspace.ts routes
- [ ] Test JWT authentication middleware
- [ ] Verify database transactions work correctly
- [ ] Set up error logging (Sentry/Rollbar)
- [ ] Configure email service for notifications

### Frontend (React)
- [ ] npm run build - should complete without errors
- [ ] Test all components in dev mode
- [ ] Verify state persistence to localStorage
- [ ] Test drag-and-drop functionality
- [ ] Icons and styling render correctly
- [ ] Responsive design on mobile

### Testing
- [ ] Test rider approval workflow end-to-end
- [ ] Test rundown save and finalize
- [ ] Test QR code scanning (manual or barcode simulator)
- [ ] Test content review workflow (approve/revision/reject)
- [ ] Test tracking link generation
- [ ] Verify audit trail entries created

### Performance
- [ ] Database queries optimized (analyze query plans)
- [ ] Frontend components lazy-loaded where possible
- [ ] Images optimized (<100KB each)
- [ ] API response times < 500ms for normal operations
- [ ] Kanban board smooth with 50+ drafts

### Security
- [ ] JWT tokens validated on every API call
- [ ] CORS headers configured correctly
- [ ] SQL injection prevented (using prepared statements)
- [ ] Rate limiting on sensitive endpoints
- [ ] Error messages don't leak sensitive data

### Monitoring
- [ ] Set up alerts for transaction rollbacks
- [ ] Monitor email delivery rate
- [ ] Track API error rates
- [ ] Dashboard for real-time user activity

---

## FAQ & Troubleshooting

### Q: Drag-and-drop not working?
**A:** Ensure `draggable` prop is set on elements, and `onDragStart`, `onDragOver`, `onDrop` handlers are properly bound.

### Q: Kanban board not updating after approval?
**A:** Check that `setKanbanBoard()` is called after API response. Verify tracking link was created if moving to "approved" column.

### Q: Performance issues with 1000+ riders?
**A:** Implement pagination or virtualization. Add database indexes on `project_id`, `is_approved`.

### Q: Notifications not being sent?
**A:** Implement `sendNotificationToTalent()` function. Configure SMTP/SendGrid. Add retry logic for failed sends.

---

## Next Steps (Phase 2)

1. **Real-time Updates:** WebSocket for live rundown updates
2. **Mobile App:** React Native for gate pass scanning
3. **AI Insights:** Content recommendations based on performance
4. **Advanced Analytics:** Heatmaps, A/B testing for KOL campaigns
5. **Automation:** Auto-reject if guidelines not met, auto-approve after 2x checks

---

## Support & Contact

For issues or questions:
1. Check error logs in browser console
2. Review database for audit trail entries
3. Verify JWT token validity
4. Check API response times
5. File issue with reproduction steps

---

**Document Version:** 1.0.0
**Last Updated:** April 10, 2026
**Maintained By:** Engineering Team
