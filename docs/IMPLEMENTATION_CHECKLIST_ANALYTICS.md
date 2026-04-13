# Analytics & Reporting System - Implementation Checklist

**Project:** Antigravity Talent Platform  
**Phase:** Phase 5 - Analytics & Reporting  
**Start Date:** January 2026  
**Status:** Ready for Implementation

---

## Overview

This checklist provides a complete implementation roadmap for the Analytics & Reporting system. Each section includes file creation, component development, and integration tasks.

---

## Phase 1: Database & Core Infrastructure (Week 1)

### Database Migrations

- [ ] **Migration 025: analytics_aggregation_hourly**
  - [ ] File: `apps/appapi/migrations/025_DB_ANALYTICS_core.sql`
  - [ ] Create table: `analytics_aggregation_hourly`
  - [ ] Create table: `analytics_kpi_daily`
  - [ ] Create table: `analytics_cohort`
  - [ ] Create table: `analytics_export_jobs`
  - [ ] Create table: `analytics_custom_reports`
  - [ ] Create table: `analytics_metrics_cache`
  - [ ] Add indexes for performance

- [ ] **Migration 026: analytics_dimensions**
  - [ ] File: `apps/appapi/migrations/026_DB_ANALYTICS_dimensions.sql`
  - [ ] Create table: `analytics_time_dimension`
  - [ ] Create table: `analytics_entity_dimension`
  - [ ] Create table: `analytics_talent_daily`
  - [ ] Create table: `analytics_agency_daily`
  - [ ] Create table: `analytics_client_daily`
  - [ ] Create table: `analytics_funnel_daily`
  - [ ] Create table: `analytics_revenue_summary`
  - [ ] Create table: `analytics_user_journey`

- [ ] **Migration 027: core_analytics_fields**
  - [ ] File: `apps/appapi/migrations/027_DB_CORE_analytics_fields.sql`
  - [ ] Add columns to `talents` table
  - [ ] Add columns to `agencies` table
  - [ ] Add columns to `clients` table
  - [ ] Add columns to `bookings` table
  - [ ] Create corresponding indexes

---

## Phase 2: Backend Infrastructure (Week 1-2)

### Data Aggregation System

- [ ] **Create Analytics Aggregator Worker**
  - [ ] File: `apps/appapi/src/workers/analyticsAggregator.ts`
  - [ ] Implement hourly aggregation logic
  - [ ] Implement daily aggregation logic
  - [ ] Implement cron trigger configuration
  - [ ] Add error handling and retry logic
  - [ ] Create monitoring/logging

- [ ] **Create Metrics Calculator Service**
  - [ ] File: `apps/appapi/src/services/MetricsCalculator.ts`
  - [ ] Implement metric calculation functions
  - [ ] Add caching layer
  - [ ] Implement performance optimization
  - [ ] Add unit tests

- [ ] **Create Database Queries Module**
  - [ ] File: `apps/appapi/src/db/analytics.queries.ts`
  - [ ] Query templates for aggregation data
  - [ ] Query templates for dimension tables
  - [ ] Query templates for retention calculations
  - [ ] Query performance optimization

### API Handlers

- [ ] **Create Analytics Handler (Dashboard APIs)**
  - [ ] File: `apps/appapi/src/handlers/analyticsHandler.ts`
  - [ ] `GET /api/v1/analytics/talent/dashboard`
  - [ ] `GET /api/v1/analytics/agency/dashboard`
  - [ ] `GET /api/v1/analytics/client/dashboard`
  - [ ] `GET /api/v1/analytics/admin/platform`
  - [ ] `GET /api/v1/analytics/admin/anomalies`

- [ ] **Create Export Handler**
  - [ ] File: `apps/appapi/src/handlers/exportHandler.ts`
  - [ ] `POST /api/v1/analytics/export/pdf`
  - [ ] `POST /api/v1/analytics/export/csv`
  - [ ] `POST /api/v1/analytics/export/excel`
  - [ ] `GET /api/v1/analytics/export/jobs/:id`
  - [ ] `GET /api/v1/analytics/export` (list jobs)

- [ ] **Create Custom Reports Handler**
  - [ ] File: `apps/appapi/src/handlers/customReportsHandler.ts`
  - [ ] `GET /api/v1/analytics/custom-reports`
  - [ ] `POST /api/v1/analytics/custom-reports`
  - [ ] `PUT /api/v1/analytics/custom-reports/:id`
  - [ ] `DELETE /api/v1/analytics/custom-reports/:id`
  - [ ] `POST /api/v1/analytics/custom-reports/:id/run`

### Export Services

- [ ] **Create Export Service**
  - [ ] File: `apps/appapi/src/services/ExportService.ts`
  - [ ] PDF generation (using PDFKit or similar)
  - [ ] CSV generation
  - [ ] Excel generation (using xlsx)
  - [ ] R2/S3 upload handler
  - [ ] Cleanup expired exports

- [ ] **Create PDF Report Generator**
  - [ ] File: `apps/appapi/src/services/PdfReportGenerator.ts`
  - [ ] Report templates for each dashboard type
  - [ ] Chart embedding
  - [ ] Branding/header/footer
  - [ ] Multi-page support

- [ ] **Create CSV/Excel Export Handler**
  - [ ] File: `apps/appapi/src/services/DataExportService.ts`
  - [ ] CSV formatting
  - [ ] Excel workbook creation
  - [ ] Conditional formatting
  - [ ] Data serialization

### Job Queue (Optional but Recommended)

- [ ] **Setup Export Job Queue**
  - [ ] Use existing job queue or implement simple queue
  - [ ] Queue export requests
  - [ ] Process jobs asynchronously
  - [ ] Track job status
  - [ ] Retry failed jobs

---

## Phase 3: Frontend Components (Week 2-3)

### Main Dashboard Component

- [ ] **Create AnalyticsDashboard Component**
  - [ ] File: `apps/appadmin/src/components/analytics/AnalyticsDashboard.tsx`
  - [ ] Route-based dashboard selection (talent/agency/client/admin)
  - [ ] Date range selector
  - [ ] Refresh controls
  - [ ] Export dialog integration
  - [ ] Error boundaries

### User-Specific Dashboard Components

- [ ] **Create Talent Dashboard**
  - [ ] File: `apps/appadmin/src/components/analytics/TalentDashboard.tsx`
  - [ ] Views metric with trend
  - [ ] Bookings metric and table
  - [ ] Revenue metric
  - [ ] Rating and reviews
  - [ ] Recent activity

- [ ] **Create Agency Dashboard**
  - [ ] File: `apps/appadmin/src/components/analytics/AgencyDashboard.tsx`
  - [ ] Portfolio views metric
  - [ ] Top talents table
  - [ ] Revenue by talent chart
  - [ ] Client retention metrics
  - [ ] Quality metrics

- [ ] **Create Client Dashboard**
  - [ ] File: `apps/appadmin/src/components/analytics/ClientDashboard.tsx`
  - [ ] Total spending metric
  - [ ] Active bookings
  - [ ] Favorite talents
  - [ ] Spending history chart
  - [ ] Churn risk indicator

- [ ] **Create Admin Platform Dashboard**
  - [ ] File: `apps/appadmin/src/components/analytics/AdminDashboard.tsx`
  - [ ] User statistics cards
  - [ ] Total revenue and fees
  - [ ] Distribution charts (by type, tier, geography)
  - [ ] Trends over time
  - [ ] Anomaly alerts
  - [ ] System health checks

### Reusable UI Components

- [ ] **Create MetricCard Component**
  - [ ] File: `apps/appadmin/src/components/analytics/MetricCard.tsx`
  - [ ] Display value, label, trend
  - [ ] Color-coded status
  - [ ] Click handlers
  - [ ] Loading state

- [ ] **Create DateRangeSelector Component**
  - [ ] File: `apps/appadmin/src/components/analytics/DateRangeSelector.tsx`
  - [ ] Date picker inputs
  - [ ] Preset buttons (today, week, month, year)
  - [ ] Custom range option
  - [ ] Date validation

- [ ] **Create TrendIndicator Component**
  - [ ] File: `apps/appadmin/src/components/analytics/TrendIndicator.tsx`
  - [ ] Up/Down/Stable indicators
  - [ ] Percentage display
  - [ ] Tooltip with details
  - [ ] Color-coded

- [ ] **Create ExportDialog Component**
  - [ ] File: `apps/appadmin/src/components/analytics/ExportDialog.tsx`
  - [ ] Format selection (PDF, CSV, Excel)
  - [ ] Date range within dialog
  - [ ] Export options (charts, data, etc)
  - [ ] Progress indicator
  - [ ] Download button

- [ ] **Create CustomReportBuilder Component**
  - [ ] File: `apps/appadmin/src/components/analytics/CustomReportBuilder.tsx`
  - [ ] Metric selection UI
  - [ ] Dimension selection
  - [ ] Chart type selection
  - [ ] Filter builder
  - [ ] Schedule configuration
  - [ ] Save/Update buttons

- [ ] **Create ChartRenderer Component**
  - [ ] File: `apps/appadmin/src/components/analytics/ChartRenderer.tsx`
  - [ ] Line charts (view trends, revenue trends)
  - [ ] Bar charts (revenue by talent, bookings by client)
  - [ ] Pie charts (distribution by type/tier/geography)
  - [ ] Table/Grid (detailed data)
  - [ ] Responsive design

### Custom Hooks

- [ ] **Create useAdminDashboard Hook**
  - [ ] File: `apps/appadmin/src/hooks/useAdminDashboard.ts`
  - [ ] Fetch admin dashboard data
  - [ ] Caching logic
  - [ ] Auto-refresh
  - [ ] Error handling

- [ ] **Create useTalentDashboard Hook**
  - [ ] File: `apps/appadmin/src/hooks/useTalentDashboard.ts`
  - [ ] Fetch talent metrics
  - [ ] Recent bookings
  - [ ] Reviews data

- [ ] **Create useAgencyDashboard Hook**
  - [ ] File: `apps/appadmin/src/hooks/useAgencyDashboard.ts`
  - [ ] Fetch agency metrics
  - [ ] Top talents
  - [ ] Client data

- [ ] **Create useClientDashboard Hook**
  - [ ] File: `apps/appadmin/src/hooks/useClientDashboard.ts`
  - [ ] Fetch client metrics
  - [ ] Spending history
  - [ ] Favorite talents

- [ ] **Create useExport Hook**
  - [ ] File: `apps/appadmin/src/hooks/useExport.ts`
  - [ ] Start export job
  - [ ] Poll job status
  - [ ] Error handling
  - [ ] Download handling

- [ ] **Create useCustomReports Hook**
  - [ ] File: `apps/appadmin/src/hooks/useCustomReports.ts`
  - [ ] List reports
  - [ ] Create report
  - [ ] Update report
  - [ ] Delete report
  - [ ] Run report

### API Client Layer

- [ ] **Create analyticsAPI Client**
  - [ ] File: `apps/appadmin/src/services/analytics.api.ts`
  - [ ] Dashboard endpoints
  - [ ] Export endpoints
  - [ ] Custom reports endpoints
  - [ ] Request/response formatting
  - [ ] Error handling

- [ ] **Create exportAPI Client**
  - [ ] File: `apps/appadmin/src/services/export.api.ts`
  - [ ] Start export
  - [ ] Check status
  - [ ] List jobs
  - [ ] Cancel job

---

## Phase 4: Integration & Testing (Week 3-4)

### Route Integration

- [ ] **Add Analytics Routes to Main App**
  - [ ] File: `apps/appadmin/src/main.tsx` or router config
  - [ ] `/analytics` - Dashboard (auto-route based on user type)
  - [ ] `/analytics/custom-reports` - Custom reports page
  - [ ] `/analytics/admin` - Admin dashboard (admin only)

### Test Files

- [ ] **Unit Tests**
  - [ ] `MetricsCalculator.test.ts`
  - [ ] `DateUtils.test.ts`
  - [ ] `ExportService.test.ts`

- [ ] **Component Tests**
  - [ ] `AnalyticsDashboard.test.tsx`
  - [ ] `MetricCard.test.tsx`
  - [ ] `ExportDialog.test.tsx`
  - [ ] `CustomReportBuilder.test.tsx`

- [ ] **Integration Tests**
  - [ ] Dashboard data loading
  - [ ] Export workflow
  - [ ] Custom report creation
  - [ ] Date range filtering

### API Testing

- [ ] **Endpoint Testing**
  - [ ] Test all dashboard endpoints
  - [ ] Test export endpoints
  - [ ] Test custom reports endpoints
  - [ ] Test error cases

---

## Phase 5: Deployment & Operations (Week 4)

### Deployment

- [ ] **Database Migrations**
  - [ ] Test migrations locally
  - [ ] Deploy to staging
  - [ ] Backup production
  - [ ] Deploy to production

- [ ] **Backend Deployment**
  - [ ] Build backend services
  - [ ] Test locally
  - [ ] Deploy to staging
  - [ ] Run smoke tests
  - [ ] Deploy to production

- [ ] **Frontend Deployment**
  - [ ] Build React app
  - [ ] Test in browser
  - [ ] Deploy to staging
  - [ ] Test all dashboards
  - [ ] Deploy to production

- [ ] **Worker/Cron Setup**
  - [ ] Configure CloudFlare Workers (if used)
  - [ ] Setup cron triggers
  - [ ] Configure Node.js cron jobs
  - [ ] Test aggregation from cold start
  - [ ] Monitor first runs

### Monitoring & Observability

- [ ] **Setup Monitoring**
  - [ ] API endpoint monitoring
  - [ ] Database query monitoring
  - [ ] Aggregation job monitoring
  - [ ] Export job monitoring
  - [ ] Error logging and alerting

- [ ] **Database Performance**
  - [ ] Monitor query execution times
  - [ ] Verify index usage
  - [ ] Check storage growth
  - [ ] Setup retention policies

- [ ] **Frontend Performance**
  - [ ] Monitor dashboard load times
  - [ ] Track API response times
  - [ ] Monitor bundle size
  - [ ] Setup RUM (Real User Monitoring)

---

## File Structure Recap

```
apps/
├── appapi/
│   ├── migrations/
│   │   ├── 025_DB_ANALYTICS_core.sql
│   │   ├── 026_DB_ANALYTICS_dimensions.sql
│   │   └── 027_DB_CORE_analytics_fields.sql
│   └── src/
│       ├── workers/
│       │   └── analyticsAggregator.ts
│       ├── services/
│       │   ├── MetricsCalculator.ts
│       │   ├── ExportService.ts
│       │   ├── PdfReportGenerator.ts
│       │   └── DataExportService.ts
│       ├── handlers/
│       │   ├── analyticsHandler.ts
│       │   ├── exportHandler.ts
│       │   └── customReportsHandler.ts
│       └── db/
│           └── analytics.queries.ts
└── appadmin/
    └── src/
        ├── components/
        │   └── analytics/
        │       ├── AnalyticsDashboard.tsx
        │       ├── TalentDashboard.tsx
        │       ├── AgencyDashboard.tsx
        │       ├── ClientDashboard.tsx
        │       ├── AdminDashboard.tsx
        │       ├── MetricCard.tsx
        │       ├── DateRangeSelector.tsx
        │       ├── TrendIndicator.tsx
        │       ├── ExportDialog.tsx
        │       ├── CustomReportBuilder.tsx
        │       └── ChartRenderer.tsx
        ├── hooks/
        │   ├── useAdminDashboard.ts
        │   ├── useTalentDashboard.ts
        │   ├── useAgencyDashboard.ts
        │   ├── useClientDashboard.ts
        │   ├── useExport.ts
        │   └── useCustomReports.ts
        └── services/
            ├── analytics.api.ts
            └── export.api.ts
```

---

## Dependency Checklist

### Backend Dependencies (package.json in appapi)

- [ ] `@cloudflare/workers-types` (if using Cloudflare Workers)
- [ ] `date-fns` (date manipulation)
- [ ] `pdfkit` or `pdf-lib` (PDF generation)
- [ ] `xlsx` (Excel generation)
- [ ] `csv-stringify` (CSV generation)
- [ ] `wrangler` (Cloudflare Workers CLI)
- [ ] `node-cron` (Alternative to Workers cron)

### Frontend Dependencies (package.json in appadmin)

- [ ] `recharts` or `chart.js` (charting library)
- [ ] `date-fns` (date utilities)
- [ ] `react-query` or `swr` (data fetching)
- [ ] `react-hook-form` (form handling for custom reports)
- [ ] `zod` or `yup` (validation)
- [ ] `zustand` or `jotai` (state management, optional)

---

## Performance Targets

| Metric | Target | Priority |
|--------|--------|----------|
| Dashboard load time | < 1s (p95) | High |
| API response time | < 500ms (p95) | High |
| Export start | < 1s | Medium |
| Aggregation run | < 5s (hourly) | High |
| Database indexes | All created | High |
| Query optimization | Below targets | High |

---

## Security Checklist

- [ ] API authentication on all endpoints
- [ ] Role-based access control
- [ ] Input validation and sanitization
- [ ] SQL injection prevention (parameterized queries)
- [ ] Rate limiting on export endpoints
- [ ] Secure file upload/download handling
- [ ] Export data encryption at rest
- [ ] HTTPS/TLS for all communications
- [ ] CORS properly configured
- [ ] Secrets management (API keys, DB credentials)

---

## Documentation Checklist

- [ ] API documentation (OpenAPI/Swagger)
- [ ] Component storybook stories
- [ ] Database schema documentation
- [ ] Setup/deployment guide
- [ ] Troubleshooting guide
- [ ] Performance tuning guide
- [ ] User guides for each dashboard
- [ ] Custom report builder guide

---

## Success Criteria

✅ All dashboards load in < 1s  
✅ Export jobs complete and deliver files  
✅ Custom reports can be created and scheduled  
✅ Aggregation runs on schedule without failures  
✅ All endpoints have proper error handling  
✅ All users see accurate metrics  
✅ No security vulnerabilities on signup  
✅ Database queries optimized with proper indexes  

---

## Notes

- Start with database and backend to establish data pipeline
- Build most complex dashboard (admin) first
- Use skeleton loading states for better UX
- Implement caching at multiple levels
- Monitor aggregation runs closely during first day
- Test export with large date ranges
- Get legal review before collecting/storing analytics data

---

**Created:** January 15, 2026  
**Last Updated:** January 15, 2026
