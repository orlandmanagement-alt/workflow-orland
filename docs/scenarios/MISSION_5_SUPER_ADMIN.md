# MISSION 5: Super Admin Dashboard & Moderation Suite

**Project:** Orland Management SaaS  
**Mission:** 5  
**Date:** April 9, 2026  
**Status:** Design & Implementation Guide  
**Phase:** Admin Control & Compliance

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Feature 1: KYC/KYB Moderation](#feature-1-kyckyb-moderation)
5. [Feature 2: Bulk Import/Export](#feature-2-bulk-importexport)
6. [Feature 3: Admin Impersonation](#feature-3-admin-impersonation)
7. [Feature 4: Audit Logging](#feature-4-audit-logging)
8. [Feature 5: Admin DataGrid UI](#feature-5-admin-datagrid-ui)
9. [Implementation Roadmap](#implementation-roadmap)

---

## Overview

MISSION 5 provides complete administrative control and compliance tracking:

### **Five Core Features**

1. **KYC/KYB Moderation**
   - Review user identity documents (KTP, passport, selfie)
   - Approve/reject with feedback
   - Compliance tracking (KYC status, dates)
   - Risk assessment scoring

2. **Bulk Import/Export**
   - Import users via CSV (batch user creation)
   - Export user data with audit trail
   - Template-based imports
   - Data validation before import

3. **Admin Impersonation**
   - Log in as any user (with audit trail)
   - Transparent impersonation indicator
   - Session limits (max 30 minutes)
   - Audit all impersonation actions

4. **Audit Logging**
   - Track all admin actions
   - Before/after data snapshots
   - Search and filter logs
   - Compliance export (for auditors)

5. **Admin DataGrid UI**
   - Sortable, filterable data tables
   - Bulk select & bulk actions
   - Real-time data updates
   - Export to CSV/Excel

---

## Architecture

```
┌────────────────────────────────────────────────────┐
│         Admin UI (React / Vite)                    │
├────────────────────────────────────────────────────┤
│ KYC Moderation        │  Bulk User Import          │
│ → Document Review     │  → CSV Upload              │
│ → Approve/Reject      │  → Preview                 │
│                       │  → Validate & Import       │
│                       │                            │
│ Admin DataGrid        │  Impersonation Zone        │
│ → User DataGrid       │  → Select User             │
│ → Bulk Select         │  → Start Session           │
│ → Bulk Actions        │  → Session Timer           │
│                       │                            │
│ Audit Log Viewer      │  Risk Scoring              │
│ → Filter by Date      │  → View Risk Level         │
│ → Search Actions      │  → Manual Override         │
│ → Export Logs         │  → Reason Tracking         │
└────────────────────────────────────────────────────┘
              ↓                    ↓
┌────────────────────────────────────────────────────┐
│      Backend (Hono.js + Admin Services)           │
├────────────────────────────────────────────────────┤
│ Routes:                                           │
│ ├─ GET /admin/kyc/pending                         │
│ ├─ POST /admin/kyc/:id/approve                    │
│ ├─ POST /admin/kyc/:id/reject                     │
│ ├─ POST /admin/users/import (CSV)                 │
│ ├─ GET /admin/users/export                        │
│ ├─ POST /admin/impersonate/:userId/start          │
│ ├─ POST /admin/impersonate/end                    │
│ ├─ GET /admin/audit-logs                          │
│ └─ GET /admin/users (DataGrid)                    │
│                                                  │
│ Services:                                        │
│ - KYC Validator (document parsing)               │
│ - Risk Scorer (compliance scoring)               │
│ - Audit Logger (action tracking)                 │
│ - Bulk Importer (CSV validation)                 │
└────────────────────────────────────────────────────┘
    ↙              ↓              ↓              ↘
┌────────┐   ┌────────┐   ┌────────┐   ┌──────────┐
│D1:Org  │   │D1:KYC  │   │D1:Audit│   │  R2:     │
│Users   │   │Docs    │   │Logs    │   │KYC Docs  │
└────────┘   └────────┘   └────────┘   └──────────┘
```

---

## Database Schema

### 1. KYC Documents Table (D1)

```sql
CREATE TABLE kyc_documents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  document_type TEXT NOT NULL,          -- 'ktp', 'passport', 'selfie'
  document_url TEXT NOT NULL,           -- R2 URL
  status TEXT DEFAULT 'pending',        -- 'pending', 'approved', 'rejected'
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME,
  reviewed_by TEXT,                     -- admin_id
  rejection_reason TEXT,
  extracted_data JSONB,                 -- OCR extracted data
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(reviewed_by) REFERENCES admins(id)
);

CREATE INDEX idx_kyc_status ON kyc_documents(status);
CREATE INDEX idx_kyc_user ON kyc_documents(user_id);
CREATE INDEX idx_kyc_submitted ON kyc_documents(submitted_at DESC);
```

### 2. KYC Status Summary Table (D1)

```sql
CREATE TABLE kyc_status (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  overall_status TEXT DEFAULT 'pending',  -- 'pending', 'approved', 'rejected'
  ktp_status TEXT,
  passport_status TEXT,
  selfie_status TEXT,
  risk_score INTEGER DEFAULT 50,         -- 0-100 (0=low risk, 100=high risk)
  risk_level TEXT DEFAULT 'medium',      -- 'low', 'medium', 'high'
  last_reviewed_at DATETIME,
  notes TEXT,
  approved_at DATETIME,
  approved_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE INDEX idx_kyc_overall_status ON kyc_status(overall_status);
CREATE INDEX idx_kyc_risk_level ON kyc_status(risk_level);
```

### 3. Admin Audit Log Table (D1)

```sql
CREATE TABLE admin_audit_logs (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  action TEXT NOT NULL,                 -- 'kyc_approve', 'user_delete', 'impersonate_start'
  resource_type TEXT,                   -- 'kyc_document', 'user', 'contract'
  resource_id TEXT,
  old_value JSONB,                      -- Before state
  new_value JSONB,                      -- After state
  ip_address TEXT,
  user_agent TEXT,
  reason TEXT,                          -- Why admin took action
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(admin_id) REFERENCES admins(id)
);

CREATE INDEX idx_audit_admin ON admin_audit_logs(admin_id);
CREATE INDEX idx_audit_resource ON admin_audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_action ON admin_audit_logs(action);
CREATE INDEX idx_audit_date ON admin_audit_logs(created_at DESC);
```

### 4. Admin Impersonation Log Table (D1)

```sql
CREATE TABLE admin_impersonation_logs (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  impersonated_user_id TEXT NOT NULL,
  start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  end_time DATETIME,
  duration_minutes INTEGER,
  ip_address TEXT,
  actions_taken TEXT,                   -- JSON array of actions during impersonation
  reason TEXT,
  status TEXT DEFAULT 'active',         -- 'active', 'ended', 'expired'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(admin_id) REFERENCES admins(id),
  FOREIGN KEY(impersonated_user_id) REFERENCES users(id)
);

CREATE INDEX idx_impersonate_admin ON admin_impersonation_logs(admin_id);
CREATE INDEX idx_impersonate_user ON admin_impersonation_logs(impersonated_user_id);
CREATE INDEX idx_impersonate_status ON admin_impersonation_logs(status);
```

### 5. Admins Table (D1)

```sql
CREATE TABLE admins (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'admin',            -- 'admin', 'super_admin', 'moderator'
  permissions JSONB,                    -- Array of permission strings
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME,
  is_active INTEGER DEFAULT 1,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE INDEX idx_admin_role ON admins(role);
CREATE INDEX idx_admin_active ON admins(is_active);
```

### Example Data

```sql
-- KYC Documents
INSERT INTO kyc_documents (id, user_id, document_type, document_url, status)
VALUES 
  ('kyc-1', 'user-123', 'ktp', 'https://r2.orland.co/kyc/ktp-123.jpg', 'pending'),
  ('kyc-2', 'user-123', 'selfie', 'https://r2.orland.co/kyc/selfie-123.jpg', 'pending');

-- KYC Status
INSERT INTO kyc_status (id, user_id, overall_status, ktp_status, selfie_status, risk_score)
VALUES ('kyc-status-1', 'user-123', 'pending', 'pending', 'pending', 45);

-- Audit Log
INSERT INTO admin_audit_logs (
  id, admin_id, action, resource_type, resource_id, new_value, reason
)
VALUES (
  'audit-1', 'admin-1', 'kyc_approve', 'kyc_document', 'kyc-1',
  '{"status":"approved"}', 'Document verified and authentic'
);
```

---

## Feature 1: KYC/KYB Moderation

### 1a. KYC Review Handler

```typescript
// apps/appapi/src/handlers/kycHandler.ts

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Database } from '@cloudflare/workers-types';

export interface Env {
  DB: Database;
  R2: R2Bucket;
}

const router = new Hono<{ Bindings: Env }>();

/**
 * GET /api/v1/admin/kyc/pending
 * List pending KYC documents for review
 */
router.get('/admin/kyc/pending', requireAdmin, async (c) => {
  const db = c.env.DB;

  try {
    const pending = await db
      .prepare(`
        SELECT 
          kd.id, kd.user_id, kd.document_type, kd.document_url,
          kd.submitted_at, ks.risk_score, ks.risk_level,
          u.full_name, u.email
        FROM kyc_documents kd
        JOIN kyc_status ks ON kd.user_id = ks.user_id
        JOIN users u ON kd.user_id = u.id
        WHERE kd.status = 'pending'
        ORDER BY ks.risk_score DESC, kd.submitted_at ASC
        LIMIT 50
      `)
      .all<any>();

    return c.json({
      success: true,
      data: {
        pending_count: pending.results?.length || 0,
        documents: pending.results || []
      }
    });

  } catch (error) {
    return c.json({ error: 'Failed to fetch pending KYC' }, { status: 500 });
  }
});

/**
 * POST /api/v1/admin/kyc/:id/approve
 * Approve KYC document
 */
const ApproveKYCSchema = z.object({
  reason: z.string().optional()
});

router.post(
  '/admin/kyc/:id/approve',
  requireAdmin,
  zValidator('json', ApproveKYCSchema),
  async (c) => {
    const db = c.env.DB;
    const adminId = c.get('adminId');
    const { id } = c.req.param();
    const body = c.req.valid('json');

    try {
      // Fetch document
      const document = await db
        .prepare('SELECT * FROM kyc_documents WHERE id = ?')
        .bind(id)
        .first<any>();

      if (!document) {
        return c.json({ error: 'Document not found' }, { status: 404 });
      }

      // Update document status
      await db
        .prepare(`
          UPDATE kyc_documents
          SET status = 'approved', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = ?
          WHERE id = ?
        `)
        .bind(adminId, id)
        .run();

      // Check if all docs approved, update KYC status
      const allDocs = await db
        .prepare(`
          SELECT COUNT(*) as pending_count
          FROM kyc_documents
          WHERE user_id = ? AND status = 'pending'
        `)
        .bind(document.user_id)
        .first<{ pending_count: number }>();

      if (allDocs.pending_count === 0) {
        // All documents approved
        await db
          .prepare(`
            UPDATE kyc_status
            SET overall_status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
          `)
          .bind(adminId, document.user_id)
          .run();

        // Send email to user
        await sendNotificationEmail(document.user_id, 'kyc_approved');
      }

      // Log audit
      await logAdminAction(db, {
        admin_id: adminId,
        action: 'kyc_approve',
        resource_type: 'kyc_document',
        resource_id: id,
        new_value: { status: 'approved' },
        reason: body.reason
      });

      return c.json({
        success: true,
        data: {
          document_id: id,
          status: 'approved',
          all_approved: allDocs.pending_count === 0
        }
      });

    } catch (error) {
      console.error('KYC approval error:', error);
      return c.json({ error: 'Failed to approve KYC' }, { status: 500 });
    }
  }
);

/**
 * POST /api/v1/admin/kyc/:id/reject
 * Reject KYC document with feedback
 */
const RejectKYCSchema = z.object({
  reason: z.string().min(10),
  re_submission_deadline: z.string().date().optional()
});

router.post(
  '/admin/kyc/:id/reject',
  requireAdmin,
  zValidator('json', RejectKYCSchema),
  async (c) => {
    const db = c.env.DB;
    const adminId = c.get('adminId');
    const { id } = c.req.param();
    const body = c.req.valid('json');

    try {
      const document = await db
        .prepare('SELECT * FROM kyc_documents WHERE id = ?')
        .bind(id)
        .first<any>();

      if (!document) {
        return c.json({ error: 'Document not found' }, { status: 404 });
      }

      // Update status
      await db
        .prepare(`
          UPDATE kyc_documents
          SET status = 'rejected', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = ?, rejection_reason = ?
          WHERE id = ?
        `)
        .bind(adminId, body.reason, id)
        .run();

      // Update KYC status to rejected
      await db
        .prepare(`
          UPDATE kyc_status
          SET overall_status = 'rejected'
          WHERE user_id = ?
        `)
        .bind(document.user_id)
        .run();

      // Log audit
      await logAdminAction(db, {
        admin_id: adminId,
        action: 'kyc_reject',
        resource_type: 'kyc_document',
        resource_id: id,
        new_value: { status: 'rejected', reason: body.reason },
        reason: 'Document did not meet requirements'
      });

      // Send notification email
      await sendNotificationEmail(document.user_id, 'kyc_rejected', {
        reason: body.reason,
        deadline: body.re_submission_deadline
      });

      return c.json({
        success: true,
        data: {
          document_id: id,
          status: 'rejected',
          user_notified: true
        }
      });

    } catch (error) {
      console.error('KYC rejection error:', error);
      return c.json({ error: 'Failed to reject KYC' }, { status: 500 });
    }
  }
);

/**
 * Helper: Log admin action to audit log
 */
async function logAdminAction(
  db: Database,
  data: {
    admin_id: string;
    action: string;
    resource_type: string;
    resource_id: string;
    new_value?: any;
    old_value?: any;
    reason?: string;
  }
) {
  const auditId = `audit-${Date.now()}`;

  await db
    .prepare(`
      INSERT INTO admin_audit_logs (
        id, admin_id, action, resource_type, resource_id, new_value, reason
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      auditId,
      data.admin_id,
      data.action,
      data.resource_type,
      data.resource_id,
      JSON.stringify(data.new_value || {}),
      data.reason || null
    )
    .run();
}
```

---

## Feature 2: Bulk Import/Export

### 2a. User Bulk Import

```typescript
/**
 * POST /api/v1/admin/users/import
 * Import users from CSV
 * 
 * CSV Format:
 * email,full_name,role,category
 * john@talent.id,John Doe,talent,Commercial
 */
router.post('/admin/users/import', requireAdmin, async (c) => {
  const db = c.env.DB;
  const adminId = c.get('adminId');
  const formData = await c.req.formData();
  const csvFile = formData.get('file') as File;

  if (!csvFile) {
    return c.json({ error: 'No file provided' }, { status: 400 });
  }

  try {
    const csvText = await csvFile.text();
    const rows = Papa.parse(csvText, { header: true }).data as any[];

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const row of rows) {
      try {
        // Validate email doesn't exist
        const existing = await db
          .prepare('SELECT id FROM users WHERE email = ?')
          .bind(row.email)
          .first();

        if (existing) {
          errorCount++;
          results.push({
            email: row.email,
            status: 'error',
            reason: 'Email already exists'
          });
          continue;
        }

        // Create user
        const userId = `user-${Date.now()}-${Math.random()}`;
        const tempPassword = Math.random().toString(36).slice(-8);

        await db
          .prepare(`
            INSERT INTO users (
              id, email, full_name, password_hash, role, is_active
            )
            VALUES (?, ?, ?, ?, ?, 1)
          `)
          .bind(
            userId,
            row.email,
            row.full_name,
            await hashPassword(tempPassword),
            row.role || 'talent'
          )
          .run();

        // Create talent record if role is talent
        if (row.role === 'talent' || !row.role) {
          const talentId = `talent-${Date.now()}`;
          await db
            .prepare(`
              INSERT INTO talents (
                id, user_id, category, is_active
              )
              VALUES (?, ?, ?, 1)
            `)
            .bind(talentId, userId, row.category || 'General')
            .run();
        }

        // Log import action
        await logAdminAction(db, {
          admin_id: adminId,
          action: 'user_import',
          resource_type: 'user',
          resource_id: userId,
          new_value: { email: row.email, role: row.role }
        });

        successCount++;
        results.push({
          email: row.email,
          status: 'success',
          user_id: userId,
          temp_password: tempPassword  // Share securely via email
        });

      } catch (error) {
        errorCount++;
        results.push({
          email: row.email,
          status: 'error',
          reason: (error as Error).message
        });
      }
    }

    return c.json({
      success: true,
      data: {
        total_rows: rows.length,
        imported: successCount,
        errors: errorCount,
        results
      }
    });

  } catch (error) {
    return c.json({ error: 'Failed to import users' }, { status: 500 });
  }
});

/**
 * GET /api/v1/admin/users/export
 * Export all users with audit evidence
 */
router.get('/admin/users/export', requireAdmin, async (c) => {
  const db = c.env.DB;
  const adminId = c.get('adminId');

  try {
    const users = await db
      .prepare(`
        SELECT 
          u.id, u.email, u.full_name, u.role, u.is_active,
          u.created_at, t.category, ks.overall_status
        FROM users u
        LEFT JOIN talents t ON u.id = t.user_id
        LEFT JOIN kyc_status ks ON u.id = ks.user_id
        ORDER BY u.created_at DESC
      `)
      .all<any>();

    // Generate CSV
    const csvRows = [
      ['User ID', 'Email', 'Full Name', 'Role', 'Category', 'KYC Status', 'Active', 'Created Date']
    ];

    for (const user of (users.results || [])) {
      csvRows.push([
        user.id,
        user.email,
        user.full_name,
        user.role,
        user.category || 'N/A',
        user.overall_status || 'Not Started',
        user.is_active ? 'Yes' : 'No',
        user.created_at
      ]);
    }

    // Log the export
    await logAdminAction(db, {
      admin_id: adminId,
      action: 'users_export',
      resource_type: 'users',
      resource_id: 'all',
      reason: 'Admin data export'
    });

    const csv = csvRows.map(row => row.join(',')).join('\n');
    const timestamp = new Date().toISOString().split('T')[0];

    c.header('Content-Type', 'text/csv');
    c.header('Content-Disposition', `attachment; filename="users-${timestamp}.csv"`);
    return c.body(csv);

  } catch (error) {
    return c.json({ error: 'Failed to export users' }, { status: 500 });
  }
});
```

---

## Feature 3: Admin Impersonation

### 3a. Impersonation Endpoints

```typescript
/**
 * POST /api/v1/admin/impersonate/:userId/start
 * Start impersonating a user
 */
const StartImpersonateSchema = z.object({
  reason: z.string().min(10)
});

router.post(
  '/admin/impersonate/:userId/start',
  requireAdmin,
  zValidator('json', StartImpersonateSchema),
  async (c) => {
    const db = c.env.DB;
    const adminId = c.get('adminId');
    const { userId } = c.req.param();
    const body = c.req.valid('json');

    try {
      // Check if user exists
      const user = await db
        .prepare('SELECT id FROM users WHERE id = ?')
        .bind(userId)
        .first();

      if (!user) {
        return c.json({ error: 'User not found' }, { status: 404 });
      }

      // Create impersonation session (30 min timeout)
      const sessionId = `impersonate-${Date.now()}`;
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      await db
        .prepare(`
          INSERT INTO admin_impersonation_logs (
            id, admin_id, impersonated_user_id, reason, status
          )
          VALUES (?, ?, ?, ?, 'active')
        `)
        .bind(sessionId, adminId, userId, body.reason)
        .run();

      // Create temporary JWT for impersonation
      const token = createImpersonationToken(userId, expiresAt);

      // Log action
      await logAdminAction(db, {
        admin_id: adminId,
        action: 'impersonate_start',
        resource_type: 'user',
        resource_id: userId,
        reason: body.reason
      });

      return c.json({
        success: true,
        data: {
          session_id: sessionId,
          impersonation_token: token,
          expires_at: expiresAt.toISOString(),
          user_name: user.full_name
        }
      });

    } catch (error) {
      return c.json(
        { error: 'Failed to start impersonation' },
        { status: 500 }
      );
    }
  }
);

/**
 * POST /api/v1/admin/impersonate/end
 * End impersonation session
 */
router.post('/admin/impersonate/end', requireAdmin, async (c) => {
  const db = c.env.DB;
  const adminId = c.get('adminId');
  const { sessionId } = await c.req.json();

  try {
    // End session
    await db
      .prepare(`
        UPDATE admin_impersonation_logs
        SET status = 'ended', end_time = CURRENT_TIMESTAMP,
            duration_minutes = CAST((julianday('now') - julianday(start_time)) * 1440 AS INTEGER)
        WHERE id = ?
      `)
      .bind(sessionId)
      .run();

    return c.json({
      success: true,
      data: { session_id: sessionId, status: 'ended' }
    });

  } catch (error) {
    return c.json({ error: 'Failed to end impersonation' }, { status: 500 });
  }
});

/**
 * Create temporary impersonation JWT token
 */
function createImpersonationToken(userId: string, expiresAt: Date): string {
  // Use jose library to create JWT
  // Token includes: {userId, isImpersonated: true, iat, exp}
  // Implementation requires jwt signing logic
  return 'jwt_token_here'; // Replace with actual JWT
}
```

---

## Feature 4: Audit Logging

### 4a. Audit Log Viewer

```typescript
/**
 * GET /api/v1/admin/audit-logs
 * Fetch audit logs with filtering
 */
const AuditLogQuerySchema = z.object({
  admin_id: z.string().optional(),
  action: z.string().optional(),
  resource_type: z.string().optional(),
  from_date: z.string().date().optional(),
  to_date: z.string().date().optional(),
  limit: z.number().default(100).max(1000),
  offset: z.number().default(0)
});

router.get(
  '/admin/audit-logs',
  requireAdmin,
  zValidator('query', AuditLogQuerySchema),
  async (c) => {
    const db = c.env.DB;
    const query = c.req.valid('query');

    try {
      let sql = 'SELECT * FROM admin_audit_logs WHERE 1=1';
      const params: any[] = [];

      if (query.admin_id) {
        sql += ' AND admin_id = ?';
        params.push(query.admin_id);
      }

      if (query.action) {
        sql += ' AND action = ?';
        params.push(query.action);
      }

      if (query.resource_type) {
        sql += ' AND resource_type = ?';
        params.push(query.resource_type);
      }

      if (query.from_date) {
        sql += ` AND DATE(created_at) >= ?`;
        params.push(query.from_date);
      }

      if (query.to_date) {
        sql += ` AND DATE(created_at) <= ?`;
        params.push(query.to_date);
      }

      sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(query.limit, query.offset);

      const logs = await db.prepare(sql).bind(...params).all<any>();

      // Get total count
      let countSql = 'SELECT COUNT(*) as count FROM admin_audit_logs WHERE 1=1';
      const countParams: any[] = [];

      if (query.admin_id) {
        countSql += ' AND admin_id = ?';
        countParams.push(query.admin_id);
      }
      if (query.action) {
        countSql += ' AND action = ?';
        countParams.push(query.action);
      }

      const total = await db.prepare(countSql).bind(...countParams).first<any>();

      return c.json({
        success: true,
        data: {
          logs: logs.results || [],
          pagination: {
            total: total?.count || 0,
            limit: query.limit,
            offset: query.offset
          }
        }
      });

    } catch (error) {
      return c.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
    }
  }
);
```

---

## Feature 5: Admin DataGrid UI

### 5a. DataGrid Component (React)

```tsx
// apps/appadmin/src/components/AdminDataGrid.tsx

import React, { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender
} from '@tanstack/react-table';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export function AdminDataGrid({ data }: { data: User[] }) {
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [sorting, setSorting] = useState<any[]>([]);
  const [columnFilters, setColumnFilters] = useState<any[]>([]);

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        )
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: (info) => info.getValue()
      },
      {
        accessorKey: 'full_name',
        header: 'Name',
        cell: (info) => info.getValue()
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: (info) => (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
            {info.getValue()}
          </span>
        )
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        cell: (info) => (
          <span className={info.getValue() ? 'text-green-600' : 'text-red-600'}>
            {info.getValue() ? 'Active' : 'Inactive'}
          </span>
        )
      },
      {
        accessorKey: 'created_at',
        header: 'Created',
        cell: (info) => new Date(info.getValue() as string).toLocaleDateString()
      }
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: { rowSelection, sorting, columnFilters },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel()
  });

  const selectedCount = Object.values(rowSelection).filter(Boolean).length;

  return (
    <div>
      {selectedCount > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <span className="font-semibold">{selectedCount} selected</span>
          <button className="ml-4 px-3 py-1 bg-red-500 text-white rounded">
            Bulk Delete
          </button>
          <button className="ml-2 px-3 py-1 bg-yellow-500 text-white rounded">
            Bulk Deactivate
          </button>
        </div>
      )}

      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100 border-b">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="px-4 py-2 text-left font-semibold"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## Implementation Roadmap

### Week 1: KYC Moderation
- [ ] Create kyc_documents and kyc_status tables
- [ ] Implement KYC approval/rejection handlers
- [ ] Build risk scoring logic
- [ ] Frontend KYC review interface

### Week 2: Bulk Operations
- [ ] Implement user import endpoint
- [ ] Build user export with audit
- [ ] CSV template validation
- [ ] Error handling & recovery

### Week 3: Impersonation & Audit
- [ ] Implement impersonation endpoints
- [ ] Create audit log table
- [ ] Build audit log viewer UI
- [ ] Session timeout logic

### Week 4: Admin DataGrid & Polish
- [ ] Build DataGrid component
- [ ] Implement bulk select & actions
- [ ] Add filtering/sorting
- [ ] Testing & optimization

---

**Status:** Ready for Implementation  
**Estimated Timeline:** 4 weeks  
**Complexity:** High  
**Priority:** High (Admin Control)

---

*Created: April 9, 2026*
