# Mission 5: Analytics & Reporting System - Complete Guide

**Status:** Complete  
**Phase:** Phase 3 - Advanced Analytics & Reporting  
**Date:** January 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Backend API Documentation](#backend-api-documentation)
5. [Frontend Components](#frontend-components)
6. [Data Aggregation](#data-aggregation)
7. [Dashboards](#dashboards)
8. [Export & Reporting](#export--reporting)
9. [Usage Examples](#usage-examples)
10. [Performance Considerations](#performance-considerations)
11. [Troubleshooting](#troubleshooting)

---

## Overview

The Analytics & Reporting system provides comprehensive dashboards and reporting capabilities for all user types:

### Key Features

✅ **Real-time Dashboards** - Platform, agency, talent, and client dashboards  
✅ **Data Aggregation** - Automatic hourly and daily metric calculations  
✅ **Advanced Analytics** - Cohort analysis, retention tracking, anomaly detection  
✅ **Custom Reports** - User-defined report builder with scheduling  
✅ **Export Capabilities** - PDF, CSV, and Excel export formats  
✅ **Performance Metrics** - KPI tracking and trend analysis  
✅ **Anomaly Detection** - Automatic detection of unusual patterns

### User Types & Features

| Feature | Talent | Agency | Client | Admin |
|---------|--------|--------|--------|-------|
| Personal Dashboard | ✅ | ✅ | ✅ | ✅ |
| Revenue/Spending | ✅ | ✅ | ✅ | ✅ |
| Performance Metrics | ✅ | ✅/Portfolio | ✅ | ✅/Platform |
| Custom Reports | ✅ | ✅ | ✅ | ✅ |
| Export Reports | ✅ | ✅ | ✅ | ✅ |
| Anomaly Alerts | ❌ | ❌ | ❌ | ✅ |
| Platform Insights | ❌ | ❌ | ❌ | ✅ |

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
├─────────────────────────────────────────────────────────────┤
│  AnalyticsDashboard → Talent/Agency/Client/Admin            │
│  CustomReportBuilder → Report Creation UI                   │
│  ExportDialog → PDF/CSV/Excel Generation                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   API Handlers (Backend)                     │
├─────────────────────────────────────────────────────────────┤
│  analyticsHandler.ts → Dashboard APIs                       │
│  MetricsCalculator → Calculation logic                      │
│  ExportService → PDF/CSV generation                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Data Aggregation Workers                        │
├─────────────────────────────────────────────────────────────┤
│  AnalyticsAggregator → Hourly/Daily aggregation            │
│  Runs on: Cloudflare Workers / Node.js Cron                │
│  Schedule: Every hour + daily at 00:00 UTC                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Database (D1/SQLite)                       │
├─────────────────────────────────────────────────────────────┤
│  Core Tables: talents, agencies, clients, bookings          │
│  Analytics: aggregation_hourly, kpi_daily, cohorts          │
│  Dimensions: time_dimension, entity_dimension               │
│  Exports: export_jobs, custom_reports                       │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Events (Views, Bookings) 
    ↓
Aggregation Worker (Hourly)
    ↓
analytics_aggregation_hourly (Real-time cache)
    ↓
Aggregation Worker (Daily)
    ↓
analytics_talent_daily / analytics_agency_daily / etc
    ↓
Dashboard APIs (Fetch & Calculate)
    ↓
Frontend Components (Display)
```

---

## Database Schema

### Core Analytics Tables (3 Migrations)

#### Migration 025: Core Schema
- `analytics_aggregation_hourly` - Real-time metrics (views, bookings, revenue)
- `analytics_kpi_daily` - Daily KPI snapshots
- `analytics_cohort` - User cohort analysis & retention
- `analytics_export_jobs` - Export request tracking
- `analytics_custom_reports` - Saved custom reports
- `analytics_metrics_cache` - Performance caching

#### Migration 026: Dimensions & Views
- `analytics_time_dimension` - Time reference (date parts, quarters, etc)
- `analytics_entity_dimension` - Denormalized entity data
- `analytics_talent_daily` - Daily talent metrics
- `analytics_agency_daily` - Daily agency metrics
- `analytics_client_daily` - Daily client metrics
- `analytics_funnel_daily` - Platform funnel metrics
- `analytics_revenue_summary` - Revenue aggregations
- `analytics_user_journey` - User progression & churn

#### Migration 027: Enhanced Tables
- Added analytics fields to existing tables:
  - `talents`: views, bookings, earnings, ratings
  - `agencies`: revenue, roster size, retention
  - `clients`: spent, bookings, churn indicators
  - `bookings`: value, fees, completion tracking

### Key Indexes

```sql
-- Performance optimization
CREATE INDEX idx_analytics_hourly_entity ON analytics_aggregation_hourly(entity_type, entity_id);
CREATE INDEX idx_analytics_hourly_composite ON analytics_aggregation_hourly(date_key, entity_type, entity_id, metric_type);
CREATE INDEX idx_analytics_kpi_date ON analytics_kpi_daily(kpi_date DESC);
CREATE INDEX idx_analytics_talent_daily_date ON analytics_talent_daily(metric_date DESC);
CREATE INDEX idx_analytics_talent_daily_talent ON analytics_talent_daily(talent_id);
```

---

## Backend API Documentation

### Base URL
```
/api/v1/analytics
```

### Authentication
All endpoints require authenticated user. User context injected via middleware.

### Standard Response Format
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

### Dashboard Endpoints

#### Talent Dashboard
```
GET /talent/dashboard
Query Params:
  - startDate: YYYY-MM-DD (optional)
  - endDate: YYYY-MM-DD (optional)

Response:
{
  "metrics": {
    "views": { "value": 1234, "trend": "up", "changePercent": 15.5 },
    "bookings": { ... },
    "revenue": { ... },
    "rating": { ... },
    "completionRate": { ... },
    "responseTime": { ... }
  },
  "recentBookings": [...],
  "recentReviews": [...]
}
```

#### Agency Dashboard
```
GET /agency/dashboard
Response:
{
  "metrics": {
    "portfolioViews": { ... },
    "bookings": { ... },
    "revenue": { ... },
    "avgTalentRating": { ... },
    "clientRetention": { ... },
    "talentRosterSize": 25
  },
  "topTalents": [ { id, name, bookings, revenue, avgRating }, ... ],
  "clientRetention": { uniqueClients: 45, repeatClients: 28 }
}
```

#### Client Dashboard
```
GET /client/dashboard
Response:
{
  "metrics": {
    "totalSpent": { ... },
    "bookingsCount": { ... },
    "avgBookingValue": { ... },
    "repeatTalentRate": { ... },
    "churnRisk": 25
  },
  "favoriteTalents": [ ... ],
  "recentBookings": [ ... ]
}
```

#### Admin Platform Dashboard
```
GET /admin/platform
Response:
{
  "overview": {
    "totalUsers": 5432,
    "activeUsers30Days": 2341,
    "totalBookings": 15234,
    "totalRevenue": 234500.00,
    "platformFees": 46900.00,
    "avgBookingValue": 15.38
  },
  "trends": { ... },
  "distribution": { ... },
  "comparison": { ... }
}
```

### Export Endpoints

#### Start PDF Export
```
POST /export/pdf
Body:
{
  "dashboardType": "agency",
  "dateRangeStart": "2026-01-01",
  "dateRangeEnd": "2026-01-31",
  "includeCharts": true
}

Response:
{
  "jobId": "export-123-abc"
}
```

#### Check Export Status
```
GET /export/jobs/:id
Response:
{
  "id": "export-123-abc",
  "status": "processing",
  "progress": 45,
  "fileUrl": "https://r2.example.com/exports/...",
  "completedAt": "2026-01-15T14:30:00Z"
}
```

### Custom Reports Endpoints

#### List Reports
```
GET /custom-reports
Response:
{
  "reports": [
    {
      "id": "report-123",
      "reportName": "Monthly Revenue Analysis",
      "dashboardType": "agency",
      "viewCount": 12,
      "createdAt": "2026-01-01T10:00:00Z"
    }
  ]
}
```

#### Create Report
```
POST /custom-reports
Body:
{
  "reportName": "Monthly Revenue Analysis",
  "dashboardType": "agency",
  "selectedMetrics": ["revenue", "bookings"],
  "selectedDimensions": ["month", "tier"],
  "chartType": "line",
  "filters": { "status": "active" },
  "scheduleFrequency": "monthly",
  "scheduleTime": "2026-02-01T09:00:00Z"
}

Response:
{
  "reportId": "report-123"
}
```

---

## Frontend Components

### Main Components

#### AnalyticsDashboard (apps/appadmin/src/components/analytics/)
```tsx
<AnalyticsDashboard
  userType="admin"  // 'talent' | 'agency' | 'client' | 'admin'
  userId="user-123"
/>
```

**Features:**
- Automatic dashboard routing based on user type
- Date range selector with presets
- Real-time refresh capabilities
- Export dialog integration

#### CustomReportBuilder
```tsx
<CustomReportBuilder
  dashboardType="agency"
  onReportCreated={(reportId) => console.log(reportId)}
/>
```

**Features:**
- Visual metric selection
- Dimension grouping options
- Chart type selection
- Report scheduling
- Export integration

### Reusable Components

#### MetricCard
```tsx
<MetricCard
  label="Total Revenue"
  value="$123,456"
  trend={{ value: 50000, trend: 'up', changePercent: 15.5 }}
  icon={<DollarSign />}
  color="green"
  onClick={() => console.log('clicked')}
/>
```

#### DateRangeSelector
```tsx
<DateRangeSelector
  dateRange={{ startDate: '2026-01-01', endDate: '2026-01-31' }}
  onDateRangeChange={(range) => console.log(range)}
  presets={[...]} // custom presets
/>
```

#### ExportDialog
```tsx
<ExportDialog
  open={true}
  onOpenChange={setOpen}
  dashboardType="agency"
  onExport={handleExport}
  loading={false}
  exportJob={jobData}
/>
```

### Custom Hooks

#### useAdminDashboard
```tsx
const { metrics, loading, error, refetch, data } = useAdminDashboard(dateRange);
```

#### useTalentDashboard
```tsx
const { metrics, loading, error, refetch, data } = useTalentDashboard(talentId, dateRange);
```

#### useAgencyDashboard
```tsx
const { metrics, loading, error, refetch, data } = useAgencyDashboard(agencyId, dateRange);
```

#### useClientDashboard
```tsx
const { metrics, loading, error, refetch, data } = useClientDashboard(clientId, dateRange);
```

#### useExport
```tsx
const { exportJob, loading, error, startExport, checkStatus } = useExport();

// Usage
await startExport({
  dashboardType: 'agency',
  format: 'pdf',
  dateRangeStart: '2026-01-01',
  dateRangeEnd: '2026-01-31'
});
```

#### useCustomReports
```tsx
const { reports, loading, error, createReport, refetch } = useCustomReports();

// Create report
await createReport({
  reportName: 'Monthly Analysis',
  dashboardType: 'agency',
  selectedMetrics: ['revenue', 'bookings'],
  ...
});
```

---

## Data Aggregation

### Aggregation Worker (analyticsAggregator.ts)

**Location:** `apps/appapi/src/workers/analyticsAggregator.ts`

**Runs on:**
- Cloudflare Workers with cron triggers
- Alternative: Node.js with node-cron

**Schedule:**
- Hourly: Every hour at :00 minutes (`0 * * * *`)
- Daily: Every day at 00:00 UTC (`0 0 * * *`)

### Hourly Aggregation

Processes raw events into hourly buckets:

1. **Talent Profile Views** - Aggregates view counts by talent per hour
2. **Bookings** - Counts new bookings per talent per hour
3. **Revenue** - Calculates revenue per talent per hour

**Example Hourly Data:**
```sql
INSERT INTO analytics_aggregation_hourly
(id, metric_type, entity_type, entity_id, metric_value, hour_timestamp, date_key)
VALUES 
('agg-001', 'views', 'talent', 'talent-123', 45, '2026-01-15 14:00:00', '2026-01-15 14:00'),
('agg-002', 'bookings', 'talent', 'talent-123', 3, '2026-01-15 14:00:00', '2026-01-15 14:00'),
('agg-003', 'revenue', 'talent', 'talent-123', 1500.00, '2026-01-15 14:00:00', '2026-01-15 14:00');
```

### Daily Aggregation

Creates snapshots and summary metrics:

1. **Talent Daily Snapshots** - Complete metrics for each talent per day
2. **Agency Daily Snapshots** - Portfolio and revenue metrics per agency per day
3. **Client Daily Snapshots** - Spending and activity per client per day
4. **Funnel Metrics** - Booking and payment funnel tracking
5. **KPI Daily** - Platform-wide KPIs
6. **Cohort Retention** - User cohort analysis
7. **Anomaly Detection** - Unusual pattern detection

### Aggregation Performance

**Typical Run Time:**
- Hourly: 2-5 seconds per aggregation
- Daily: 10-30 seconds total

**Database Impact:**
- Hourly: ~1000s records inserted daily
- Daily: ~100s records inserted daily

**Memory Usage:**
- Typical: < 50MB per run
- Peak: < 100MB during daily run

---

## Dashboards

### Talent Dashboard

**URL:** `/analytics` (for talent users)

**Displays:**
- Profile views (with trend)
- Active bookings count
- Total earnings
- Average rating and review count
- Recent bookings table
- Recent reviews list

**Key Metrics:**
- Views trending (up/down/stable)
- Booking completion rate
- Average response time
- Profile completeness score

### Agency Dashboard

**URL:** `/analytics/agency`

**Displays:**
- Portfolio views across all talents
- Total bookings and revenue
- Average talent rating
- Client retention rate
- Top 10 performing talents (by revenue)
- Client engagement metrics

**Key Features:**
- Talent performance ranking table
- Client retention breakdown
- Revenue by talent visualization
- Quality metrics (ratings, complaints)

### Client Dashboard

**URL:** `/analytics/client`

**Displays:**
- Total spending (with trend)
- Active bookings count
- Average booking value
- Repeat talent percentage
- Churn risk assessment
- Favorite talents list

**Key Features:**
- Spending history chart
- Booking status breakdown
- Talent preference analysis
- ROI by talent metrics

### Admin Dashboard

**URL:** `/admin/analytics`

**Displays:**
- Platform-wide user statistics
- Total bookings and revenue
- Active user metrics (30-day)
- Platform fee collection
- User distribution (by type and tier)
- Top agencies and talents (by revenue)
- Anomaly alerts and system health

**Admin Features:**
- Funding flow analysis
- Fraud detection alerts
- User acquisition trends
- Geographic distribution
- Payment disputes tracking
- System health monitoring

---

## Export & Reporting

### Export Formats

#### PDF Export
- Professional report layout
- Multiple sections per dashboard type
- Charts and visualizations
- Company branding
- Print-optimized

#### CSV Export
- All raw data for further analysis
- Compatible with Excel/Sheets
- Sortable and filterable
- Date range selection
- Metric-specific exports

#### Excel Export
- Multiple worksheets per dashboard
- Summary sheet with KPIs
- Detailed data sheets
- Chart embedding
- Conditional formatting

### Export Workflow

```
User clicks Export
    ↓
ExportDialog UI (format, date range selection)
    ↓
POST /api/v1/analytics/export/{format}
    ↓
Create analytics_export_jobs record (status: pending)
    ↓
Queue background job (depends on job queue system)
    ↓
Background Worker generates export
    ↓
Upload to R2/S3 storage
    ↓
Update job record (status: complete, fileUrl)
    ↓
Frontend polls GET /api/v1/analytics/export/jobs/{id}
    ↓
User downloads when ready
```

### Export Storage

**Storage:** R2 (Cloudflare) or S3-compatible

**URL Pattern:** `https://storage.example.com/exports/{jobId}/{timestamp}.{format}`

**Retention:** 30 days (configurable)

### Scheduled Reports

Custom reports can be scheduled for automatic generation:

**Frequencies:**
- Once (immediate)
- Daily (every day)
- Weekly (specific day)
- Monthly (specific day)

**Email Delivery:**
- Optional recipient emails
- Send when report is ready
- Download link auto-expires after 7 days

---

## Usage Examples

### Example 1: Agency Dashboard Integration

```tsx
import AnalyticsDashboard from './components/analytics/AnalyticsDashboard';

export default function AgencyAnalytics() {
  return (
    <AnalyticsDashboard
      userType="agency"
      userId={currentUser.id}
    />
  );
}
```

### Example 2: Custom Report Creation

```tsx
// Create a "Monthly Revenue by Category" report
const newReport = await customReportAPI.create({
  reportName: "Monthly Revenue by Category",
  dashboardType: "agency",
  selectedMetrics: ["revenue", "bookings"],
  selectedDimensions: ["month", "category"],
  chartType: "bar",
  filters: {
    status: "active",
    minBookings: 5
  },
  scheduleFrequency: "monthly",
  scheduleTime: "2026-02-01T09:00:00Z"
});
```

### Example 3: Export Report

```tsx
const { startExport } = useExport();

const handleExport = async () => {
  const job = await startExport({
    dashboardType: 'agency',
    format: 'pdf',
    dateRangeStart: '2026-01-01',
    dateRangeEnd: '2026-01-31',
    includeCharts: true
  });
  
  // Poll for completion
  const checkStatus = setInterval(async () => {
    const status = await checkExportStatus(job.jobId);
    if (status.status === 'complete') {
      window.location.href = status.fileUrl;
      clearInterval(checkStatus);
    }
  }, 2000);
};
```

### Example 4: Real-time Dashboard Updates

```tsx
const { metrics, loading, refetch } = useAdminDashboard();

// Refresh every 60 seconds
useEffect(() => {
  const interval = setInterval(refetch, 60000);
  return () => clearInterval(interval);
}, [refetch]);

// Or on-demand
<button onClick={refetch}>
  <RefreshCw /> Refresh Now
</button>
```

---

## Performance Considerations

### Query Optimization

```sql
-- ✅ Fast: Use aggregated tables
SELECT * FROM analytics_agency_daily 
WHERE agency_id = ? AND metric_date >= ?;

-- ❌ Slow: Raw event tables for recent data
SELECT COUNT(*) FROM bookings 
WHERE agency_id IN (SELECT id FROM ... 50 subqueries)
AND created_at >= ?
GROUP BY agency_id, DATE(created_at);
```

### Caching Strategy

1. **Dashboard Cache** (1 hour TTL)
   - Store calculated metrics
   - Key: `dashboard:{userType}:{userId}:{dateRange}`

2. **Aggregation Cache** (Fresh hourly)
   - Store hourly aggregations
   - Key: `aggregation:{entityType}:{entityId}:{hour}`

3. **API Response Cache** (15 minutes TTL)
   - Cache API responses
   - Key: `api:{endpoint}:{params}`

### Database Indexes

Critical indexes for query performance:

```sql
-- ✅ Most Important
CREATE INDEX idx_analytics_hourly_composite 
ON analytics_aggregation_hourly(date_key, entity_type, entity_id, metric_type);

CREATE INDEX idx_analytics_talent_daily_date 
ON analytics_talent_daily(metric_date DESC);

-- ✅ Important for Sorting
CREATE INDEX idx_talents_total_views ON talents(total_views DESC);
CREATE INDEX idx_talents_avg_rating ON talents(avg_rating DESC);
CREATE INDEX idx_agencies_total_revenue ON agencies(total_revenue DESC);
```

### Data Retention Policies

- **Real-time (hourly):** 30 days
- **Daily snapshots:** 2 years
- **Cohort data:** Indefinite
- **Export jobs:** 30 days
- **Anomaly records:** 90 days

---

## Troubleshooting

### Dashboard Not Loading

**Problem:** Dashboard shows loading spinner indefinitely

**Solutions:**
1. Check API server is running
2. Verify user authentication tokens
3. Check browser console for 401/403 errors
4. Verify user has permission for dashboard type

```
GET /api/v1/analytics/admin/platform → 401 Unauthorized
→ Regenerate auth token
```

### Missing Aggregation Data

**Problem:** Charts show gaps or old data

**Solutions:**
1. Check aggregation worker is running
2. Verify database connection
3. Check CloudFlare Workers logs
4. Run manual aggregation

```bash
# Trigger manual aggregation
curl -X POST https://worker.example.com/aggregate/hourly
curl -X POST https://worker.example.com/aggregate/daily
```

### Export Jobs Stuck in "Processing"

**Problem:** Export job never completes

**Solutions:**
1. Check backend logs for export errors
2. Verify R2/S3 storage is accessible
3. Check file size limits (max 500MB)
4. Restart background job processor

```sql
-- Reset failed job
UPDATE analytics_export_jobs 
SET status = 'failed', error_message = 'Restarted'
WHERE id = 'job-123' AND status = 'processing';
```

### High Memory Usage During Aggregation

**Problem:** Server memory spikes during daily aggregation

**Solutions:**
1. Reduce batch size (currently 1000 records)
2. Increase aggregation frequency (hourly instead of daily)
3. Enable streaming for large exports
4. Archive old data

```typescript
// In analyticsAggregator.ts
const BATCH_SIZE = 500; // Reduce from 1000
const processInBatches = async (items: any[]) => {
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    await processBatch(items.slice(i, i + BATCH_SIZE));
  }
};
```

---

## API Response Time SLAs

| Endpoint | P50 | P95 | P99 |
|----------|-----|-----|-----|
| Dashboard (hourly data) | 200ms | 500ms | 1s |
| Dashboard (daily data) | 300ms | 800ms | 2s |
| Export start | 500ms | 1s | 2s |
| Export status | 100ms | 200ms | 500ms |
| Custom reports list | 200ms | 500ms | 1.5s |

---

## Security & Privacy

### Access Control

All endpoints verify user authentication and authorization:

```typescript
if (req.user?.userType !== 'admin') {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
}
```

### Data Sanitization

All user inputs validated and sanitized:
- Date ranges (format: YYYY-MM-DD)
- Report names (max 255 chars, alphanumeric + spaces)
- Metrics selection (whitelist validation)

### Privacy

- No PII in exported reports
- Aggregated data only (no individual user data)
- Export links expire after 7 days
- Access logs all analytics API calls

---

## Next Steps & Future Enhancements

### Phase 2 Enhancements

- [ ] Real-time dashboards (WebSocket updates)
- [ ] Advanced filtering & saved filters
- [ ] Benchmarking (compare to similar agencies/talents)
- [ ] Predictive analytics (AI-powered forecasting)
- [ ] Mobile dashboard app
- [ ] Slack/Email integrations
- [ ] Custom alert thresholds
- [ ] Data source connectors (Google Sheets, Tableau)

### Performance Optimizations

- [ ] GraphQL API for dashboard data
- [ ] Server-side pagination for tables
- [ ] Incremental data loading
- [ ] WebAssembly for calculations
- [ ] Redis caching layer

---

**Last Updated:** January 15, 2026  
**Version:** 1.0.0  
**Maintainer:** Engineering Team
