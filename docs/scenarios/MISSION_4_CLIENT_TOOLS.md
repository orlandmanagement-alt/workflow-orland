# MISSION 4: Client Project Tools & Casting Operations

**Project:** Orland Management SaaS  
**Mission:** 4  
**Date:** April 9, 2026  
**Status:** Design & Implementation Guide  
**Phase:** Client-Facing Casting Tools

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Feature 1: CSV Casting Breakdown Import](#feature-1-csv-casting-breakdown-import)
5. [Feature 2: Bulk Casting Invitations](#feature-2-bulk-casting-invitations)
6. [Feature 3: Kanban Status Management](#feature-3-kanban-status-management)
7. [Feature 4: Casting Deck Export](#feature-4-casting-deck-export)
8. [Implementation Roadmap](#implementation-roadmap)

---

## Overview

MISSION 4 empowers clients to manage casting operations at scale:

### **Four Core Features**

1. **CSV Casting Breakdown Import**
   - Upload CSV with role definitions
   - Parse: Role Name, Gender, Age Range, Requirements, Notes
   - Auto-create casting breakdowns
   - Validate data integrity

2. **Bulk Casting Invitations**
   - Invite multiple talents to a project
   - Batch email notifications
   - Track invitation status
   - Resume invitations (retry failed)

3. **Kanban Status Management**
   - Drag-drop talent status columns
   - Statuses: Invited → Shortlist → Callback → Booked
   - Bulk moves (select multiple, move at once)
   - Timeline tracking

4. **Casting Deck Export**
   - Export shortlist talent data
   - Format: PDF (comp cards) + CSV (summary data)
   - Include photos, rates, availability
   - Professional PDF layout

---

## Architecture

```
┌────────────────────────────────────────────────────┐
│         Frontend (React / Vite)                   │
├────────────────────────────────────────────────────┤
│ Casting Breakdown CSV      │  Bulk Invitations     │
│ Upload Component           │  → Select Talents     │
│ → Validate & Preview       │  → Email Preview      │
│                            │  → Send Batch        │
│                            │                      │
│ Kanban Board               │  Casting Deck Export  │
│ → Drag-Drop Talents        │  → PDF Generation    │
│ → Bulk Select              │  → CSV Download      │
│ → Status Timeline          │  → Share Link        │
└────────────────────────────────────────────────────┘
              ↓                    ↓
┌────────────────────────────────────────────────────┐
│      Backend (Hono.js + Bulk Operations)          │
├────────────────────────────────────────────────────┤
│ Routes:                                           │
│ ├─ POST /casting-breakdowns/import (CSV)          │
│ ├─ POST /casting-invitations/bulk-send            │
│ ├─ PATCH /casting-invitations/:id/status          │
│ ├─ PATCH /casting-invitations/bulk-move           │
│ ├─ GET /casting/:id/talents (kanban view)         │
│ └─ GET /casting/:id/export (PDF/CSV)              │
│                                                  │
│ Services:                                        │
│ - CSV Parser (PapaParse)                         │
│ - Bulk Inviter (Batch Email)                     │
│ - PDF Generator (pdfmake)                        │
└────────────────────────────────────────────────────┘
         ↙              ↓              ↘
    ┌─────────┐   ┌──────────┐   ┌──────────┐
    │D1:      │   │D1:       │   │  R2:     │
    │Casting  │   │Talent    │   │ PDFs &   │
    │Details  │   │Invites   │   │ Exports  │
    └─────────┘   └──────────┘   └──────────┘
```

---

## Database Schema

### 1. Casting Breakdowns Table (D1)

```sql
CREATE TABLE casting_breakdowns (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  role_name TEXT NOT NULL,                  -- e.g., "Female Lead", "Supporting Actor"
  gender TEXT,                              -- 'M', 'F', 'Any'
  age_min INTEGER,
  age_max INTEGER,
  description TEXT,                         -- Role details, character description
  requirements TEXT,                        -- Special skills, ethnicity, etc.
  budget_per_role REAL,
  priority INTEGER DEFAULT 0,               -- 0 (low) to 5 (high)
  status TEXT DEFAULT 'open',               -- 'open', 'filled', 'closed'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME,
  FOREIGN KEY(project_id) REFERENCES projects(project_id),
  FOREIGN KEY(client_id) REFERENCES clients(id)
);

CREATE INDEX idx_casting_project ON casting_breakdowns(project_id);
CREATE INDEX idx_casting_status ON casting_breakdowns(status);
```

### 2. Casting Invitations Table (D1)

```sql
CREATE TABLE casting_invitations (
  id TEXT PRIMARY KEY,
  casting_breakdown_id TEXT NOT NULL,
  talent_id TEXT NOT NULL,
  invited_by TEXT NOT NULL,                 -- client_id or agency_id
  status TEXT DEFAULT 'invited',            -- 'invited', 'viewed', 'shortlist', 'callback', 'booked', 'rejected'
  status_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  invited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  viewed_at DATETIME,
  response_at DATETIME,
  notes TEXT,                               -- Client feedback
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(casting_breakdown_id) REFERENCES casting_breakdowns(id),
  FOREIGN KEY(talent_id) REFERENCES talents(id),
  FOREIGN KEY(invited_by) REFERENCES clients(id)
);

CREATE INDEX idx_invitations_breakdown ON casting_invitations(casting_breakdown_id);
CREATE INDEX idx_invitations_talent ON casting_invitations(talent_id);
CREATE INDEX idx_invitations_status ON casting_invitations(status);
```

### 3. Casting Timeline Table (D1)

```sql
CREATE TABLE casting_timeline (
  id TEXT PRIMARY KEY,
  casting_invitation_id TEXT NOT NULL,
  status_from TEXT,
  status_to TEXT,
  changed_by TEXT,
  changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  FOREIGN KEY(casting_invitation_id) REFERENCES casting_invitations(id)
);

CREATE INDEX idx_timeline_invitation ON casting_timeline(casting_invitation_id);
```

### Example Data

```sql
-- Casting breakdown
INSERT INTO casting_breakdowns (
  id, project_id, client_id, role_name, gender, age_min, age_max, description
)
VALUES (
  'breakdown-1', 'project-123', 'client-456',
  'Female Lead', 'F', 25, 35,
  'Strong, independent female character for TV commercial'
);

-- Casting invitations (batch)
INSERT INTO casting_invitations (
  id, casting_breakdown_id, talent_id, invited_by, status
)
VALUES 
  ('invite-1', 'breakdown-1', 'talent-1', 'client-456', 'invited'),
  ('invite-2', 'breakdown-1', 'talent-2', 'client-456', 'invited'),
  ('invite-3', 'breakdown-1', 'talent-3', 'client-456', 'invited');

-- Timeline tracking
INSERT INTO casting_timeline (
  id, casting_invitation_id, status_from, status_to, changed_by
)
VALUES ('timeline-1', 'invite-1', 'invited', 'shortlist', 'client-456');
```

---

## Feature 1: CSV Casting Breakdown Import

### 1a. CSV Upload Handler

```typescript
// apps/appapi/src/handlers/castingHandler.ts

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Database } from '@cloudflare/workers-types';
import Papa from 'papaparse';

export interface Env {
  DB: Database;
}

const router = new Hono<{ Bindings: Env }>();

/**
 * POST /api/v1/casting-breakdowns/import
 * Upload CSV with casting breakdown rows
 * 
 * CSV Format:
 * role_name,gender,age_min,age_max,requirements,description,budget,priority
 * Female Lead,F,25,35,Commercial experience required,Lead for TVC,5000000,5
 */
router.post('/casting-breakdowns/import', async (c) => {
  const db = c.env.DB;
  const clientId = c.get('userId');
  const formData = await c.req.formData();
  const csvFile = formData.get('file') as File;

  if (!csvFile || csvFile.type !== 'text/csv') {
    return c.json({ error: 'Invalid CSV file' }, { status: 400 });
  }

  try {
    const csvText = await csvFile.text();
    const projectId = formData.get('project_id') as string;

    // Parse CSV using PapaParse
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase()
    });

    if (parsed.errors.length > 0) {
      return c.json(
        { error: 'CSV parsing error', details: parsed.errors },
        { status: 400 }
      );
    }

    // Validate and insert rows
    const rows = parsed.data as any[];
    const validatedRows = [];
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      try {
        // Validate required fields
        if (!row.role_name) {
          throw new Error('Missing role_name');
        }

        const breakdownId = `breakdown-${Date.now()}-${i}`;

        // Insert into database
        await db
          .prepare(`
            INSERT INTO casting_breakdowns (
              id, project_id, client_id, role_name, gender,
              age_min, age_max, requirements, description,
              budget_per_role, priority, status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `)
          .bind(
            breakdownId,
            projectId,
            clientId,
            row.role_name?.trim(),
            row.gender?.trim() || null,
            parseInt(row.age_min) || null,
            parseInt(row.age_max) || null,
            row.requirements?.trim() || null,
            row.description?.trim() || null,
            parseFloat(row.budget) || null,
            parseInt(row.priority) || 0,
            'open'
          )
          .run();

        validatedRows.push({
          row_number: i + 2,  // +2 because CSV has header
          breakdown_id: breakdownId,
          role_name: row.role_name,
          status: 'success'
        });

      } catch (error) {
        errors.push({
          row_number: i + 2,
          role_name: row.role_name || '(missing)',
          error: (error as Error).message
        });
      }
    }

    return c.json({
      success: true,
      data: {
        projectId,
        imported: validatedRows.length,
        errors: errors.length,
        results: {
          successful: validatedRows,
          failed: errors
        }
      }
    });

  } catch (error) {
    console.error('CSV Import error:', error);
    return c.json({ error: 'Failed to import CSV' }, { status: 500 });
  }
});

/**
 * GET /api/v1/casting-breakdowns/:projectId
 * Fetch all casting breakdowns for a project
 */
router.get('/casting-breakdowns/:projectId', async (c) => {
  const db = c.env.DB;
  const { projectId } = c.req.param();

  try {
    const breakdowns = await db
      .prepare(`
        SELECT 
          id, role_name, gender, age_min, age_max, description,
          requirements, budget_per_role, priority, status, created_at
        FROM casting_breakdowns
        WHERE project_id = ? AND deleted_at IS NULL
        ORDER BY priority DESC, created_at DESC
      `)
      .bind(projectId)
      .all();

    return c.json({
      success: true,
      data: breakdowns.results || []
    });

  } catch (error) {
    return c.json({ error: 'Failed to fetch breakdowns' }, { status: 500 });
  }
});
```

---

## Feature 2: Bulk Casting Invitations

### 2a. Bulk Invite Handler

```typescript
/**
 * POST /api/v1/casting-invitations/bulk-send
 * Invite multiple talents to a casting breakdown
 */
const BulkInviteSchema = z.object({
  casting_breakdown_id: z.string(),
  talent_ids: z.array(z.string()).min(1).max(100),
  message_template: z.string().optional()
});

router.post(
  '/casting-invitations/bulk-send',
  zValidator('json', BulkInviteSchema),
  async (c) => {
    const db = c.env.DB;
    const clientId = c.get('userId');
    const body = c.req.valid('json');

    try {
      // Fetch casting breakdown
      const breakdown = await db
        .prepare('SELECT * FROM casting_breakdowns WHERE id = ?')
        .bind(body.casting_breakdown_id)
        .first<any>();

      if (!breakdown || breakdown.client_id !== clientId) {
        return c.json(
          { error: 'Casting breakdown not found or unauthorized' },
          { status: 404 }
        );
      }

      // Batch insert invitations
      const invitationResults = [];
      const emailQueue = [];

      for (const talentId of body.talent_ids) {
        const inviteId = `invite-${Date.now()}-${talentId}`;

        try {
          // Check if already invited
          const existing = await db
            .prepare(`
              SELECT id FROM casting_invitations
              WHERE casting_breakdown_id = ? AND talent_id = ?
            `)
            .bind(body.casting_breakdown_id, talentId)
            .first();

          if (existing) {
            invitationResults.push({
              talentId,
              inviteId: null,
              status: 'skipped',
              reason: 'Already invited'
            });
            continue;
          }

          // Insert invitation
          await db
            .prepare(`
              INSERT INTO casting_invitations (
                id, casting_breakdown_id, talent_id, invited_by, status
              )
              VALUES (?, ?, ?, ?, 'invited')
            `)
            .bind(inviteId, body.casting_breakdown_id, talentId, clientId)
            .run();

          // Fetch talent email for notification
          const talent = await db
            .prepare('SELECT email FROM talents WHERE id = ?')
            .bind(talentId)
            .first<{ email: string }>();

          if (talent?.email) {
            emailQueue.push({
              to: talent.email,
              talentId,
              inviteId,
              role: breakdown.role_name,
              projectId: breakdown.project_id
            });
          }

          invitationResults.push({
            talentId,
            inviteId,
            status: 'success'
          });

        } catch (error) {
          invitationResults.push({
            talentId,
            inviteId: null,
            status: 'error',
            reason: (error as Error).message
          });
        }
      }

      // Send emails asynchronously (queue to worker)
      if (emailQueue.length > 0) {
        // In production, use a proper email service queue
        await sendBulkEmails(emailQueue);
      }

      return c.json({
        success: true,
        data: {
          casting_breakdown_id: body.casting_breakdown_id,
          invitations_sent: invitationResults.filter(r => r.status === 'success').length,
          skipped: invitationResults.filter(r => r.status === 'skipped').length,
          errors: invitationResults.filter(r => r.status === 'error').length,
          results: invitationResults
        }
      });

    } catch (error) {
      console.error('Bulk invite error:', error);
      return c.json({ error: 'Failed to send invitations' }, { status: 500 });
    }
  }
);

/**
 * Send bulk notification emails
 */
async function sendBulkEmails(queue: any[]) {
  // Implementation using Resend, SendGrid, or similar
  for (const item of queue) {
    // const response = await resend.emails.send({
    //   from: 'casting@orland.co',
    //   to: item.to,
    //   subject: `Casting Invitation: ${item.role}`,
    //   html: `You're invited to audition for ${item.role}...`
    // });

    console.log(`Email sent to ${item.to} for role ${item.role}`);
  }
}
```

---

## Feature 3: Kanban Status Management

### 3a. Bulk Status Update

```typescript
/**
 * PATCH /api/v1/casting-invitations/bulk-move
 * Move multiple talents to a new status
 */
const BulkMoveSchema = z.object({
  invitation_ids: z.array(z.string()).min(1).max(100),
  new_status: z.enum(['invited', 'viewed', 'shortlist', 'callback', 'booked', 'rejected'])
});

router.patch(
  '/casting-invitations/bulk-move',
  zValidator('json', BulkMoveSchema),
  async (c) => {
    const db = c.env.DB;
    const userId = c.get('userId');
    const body = c.req.valid('json');

    try {
      const movedCount = [];

      for (const invitationId of body.invitation_ids) {
        // Get invitation
        const invitation = await db
          .prepare('SELECT * FROM casting_invitations WHERE id = ?')
          .bind(invitationId)
          .first<any>();

        if (!invitation || invitation.invited_by !== userId) {
          continue;  // Skip unauthorized
        }

        const oldStatus = invitation.status;

        // Update status
        await db
          .prepare(`
            UPDATE casting_invitations
            SET status = ?, status_updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `)
          .bind(body.new_status, invitationId)
          .run();

        // Log to timeline
        const timelineId = `timeline-${Date.now()}`;
        await db
          .prepare(`
            INSERT INTO casting_timeline (
              id, casting_invitation_id, status_from, status_to, changed_by
            )
            VALUES (?, ?, ?, ?, ?)
          `)
          .bind(timelineId, invitationId, oldStatus, body.new_status, userId)
          .run();

        movedCount.push(invitationId);
      }

      return c.json({
        success: true,
        data: {
          moved_count: movedCount.length,
          new_status: body.new_status,
          moved_invitation_ids: movedCount
        }
      });

    } catch (error) {
      return c.json({ error: 'Failed to move invitations' }, { status: 500 });
    }
  }
);

/**
 * GET /api/v1/casting/:projectId/kanban
 * Get kanban view with all statuses
 */
router.get('/casting/:projectId/kanban', async (c) => {
  const db = c.env.DB;
  const { projectId } = c.req.param();

  try {
    // Fetch all invitations grouped by status
    const statuses = ['invited', 'viewed', 'shortlist', 'callback', 'booked', 'rejected'];
    const kanban: any = {};

    for (const status of statuses) {
      const invitations = await db
        .prepare(`
          SELECT 
            ci.id, ci.talent_id, ci.status, ci.status_updated_at,
            t.full_name, t.category, t.profile_image_url, t.base_rate
          FROM casting_invitations ci
          JOIN talents t ON ci.talent_id = t.id
          WHERE ci.casting_breakdown_id IN (
            SELECT id FROM casting_breakdowns WHERE project_id = ?
          ) AND ci.status = ?
          ORDER BY ci.status_updated_at DESC
        `)
        .bind(projectId, status)
        .all();

      kanban[status] = invitations.results || [];
    }

    return c.json({
      success: true,
      data: kanban
    });

  } catch (error) {
    return c.json({ error: 'Failed to fetch kanban' }, { status: 500 });
  }
});
```

---

## Feature 4: Casting Deck Export

### 4a. PDF & CSV Export

```typescript
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

/**
 * GET /api/v1/casting/:projectId/export
 * Export casting deck as PDF or CSV
 */
const ExportSchema = z.object({
  format: z.enum(['pdf', 'csv']).default('pdf'),
  status_filter: z.enum(['all', 'invited', 'shortlist', 'callback', 'booked']).default('all')
});

router.get(
  '/casting/:projectId/export',
  zValidator('query', ExportSchema),
  async (c) => {
    const db = c.env.DB;
    const r2 = c.env.R2;
    const { projectId } = c.req.param();
    const query = c.req.valid('query');

    try {
      // Fetch project details
      const project = await db
        .prepare('SELECT * FROM projects WHERE project_id = ?')
        .bind(projectId)
        .first<any>();

      // Fetch invitations based on filter
      let statusWhere = '';
      if (query.status_filter !== 'all') {
        statusWhere = `AND ci.status = '${query.status_filter}'`;
      }

      const invitations = await db
        .prepare(`
          SELECT 
            ci.id, ci.talent_id, ci.status, ci.status_updated_at,
            t.full_name, t.category, t.height, t.weight, t.profile_image_url,
            t.base_rate, t.email, t.phone
          FROM casting_invitations ci
          JOIN talents t ON ci.talent_id = t.id
          WHERE ci.casting_breakdown_id IN (
            SELECT id FROM casting_breakdowns WHERE project_id = ?
          ) ${statusWhere}
          ORDER BY ci.status_updated_at DESC
        `)
        .bind(projectId)
        .all<any>();

      if (query.format === 'csv') {
        return await exportAsCSV(c, project, invitations.results || []);
      } else {
        return await exportAsPDF(c, r2, project, invitations.results || []);
      }

    } catch (error) {
      console.error('Export error:', error);
      return c.json({ error: 'Failed to export' }, { status: 500 });
    }
  }
);

/**
 * Export as CSV
 */
async function exportAsCSV(c: any, project: any, invitations: any[]) {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `casting-${project.project_id}-${timestamp}.csv`;

  const csv = [
    ['Talent Name', 'Category', 'Height', 'Weight', 'Rate', 'Status', 'Invited Date'].join(',')
  ];

  for (const inv of invitations) {
    csv.push([
      inv.full_name,
      inv.category,
      inv.height || '',
      inv.weight || '',
      inv.base_rate || '',
      inv.status,
      inv.status_updated_at || ''
    ].join(','));
  }

  c.header('Content-Type', 'text/csv');
  c.header('Content-Disposition', `attachment; filename="${filename}"`);
  return c.body(csv.join('\n'));
}

/**
 * Export as PDF (casting deck with comp cards)
 */
async function exportAsPDF(c: any, r2: R2Bucket, project: any, invitations: any[]) {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `casting-${project.project_id}-${timestamp}.pdf`;

  // Build PDF document
  const docDefinition: any = {
    content: [
      {
        text: `Casting Deck: ${project.title}`,
        style: 'title',
        alignment: 'center'
      },
      { text: `Generated: ${new Date().toLocaleDateString()}`, style: 'subtitle' },
      { text: `Total Talents: ${invitations.length}`, style: 'normal' },
      { text: '', pageBreak: 'before' }
    ],
    styles: {
      title: { fontSize: 28, bold: true, margin: [0, 0, 0, 20] },
      subtitle: { fontSize: 10, color: '#666', margin: [0, 0, 0, 20] },
      compcard: { margin: [0, 10, 0, 10] },
      talentName: { fontSize: 14, bold: true },
      talentInfo: { fontSize: 10, color: '#555' }
    }
  };

  // Add comp card for each talent
  for (const inv of invitations) {
    const compCard = {
      columns: [
        {
          width: 100,
          image: inv.profile_image_url || 'placeholder.jpg',
          fit: [100, 150]
        },
        {
          width: '*',
          margin: [10, 0, 0, 0],
          stack: [
            { text: inv.full_name, style: 'talentName' },
            { text: `Category: ${inv.category}`, style: 'talentInfo' },
            { text: `Height: ${inv.height || 'N/A'} | Weight: ${inv.weight || 'N/A'}`, style: 'talentInfo' },
            { text: `Rate: IDR ${inv.base_rate?.toLocaleString() || 'N/A'}`, style: 'talentInfo' },
            { text: `Status: ${inv.status}`, style: 'talentInfo' }
          ]
        }
      ],
      style: 'compcard',
      pageBreak: 'after'
    };

    docDefinition.content.push(compCard);
  }

  // Generate PDF
  const pdfDoc = pdfMake.createPdf(docDefinition);

  // Convert to buffer and upload to R2
  return new Promise((resolve) => {
    pdfDoc.getBuffer((buffer: any) => {
      // Upload to R2
      try {
        r2.put(filename, buffer, {
          httpMetadata: { contentType: 'application/pdf' }
        }).then(() => {
          c.header('Content-Type', 'application/pdf');
          c.header('Content-Disposition', `attachment; filename="${filename}"`);
          resolve(c.body(buffer));
        });
      } catch (error) {
        console.error('PDF upload error:', error);
        resolve(c.json({ error: 'Failed to generate PDF' }, { status: 500 }));
      }
    });
  });
}
```

---

## Frontend Components

### 4b. Kanban Board Component (React)

```tsx
// apps/appclient/src/components/CastingKanban.tsx

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { DndContext, DragEndEvent } from '@dnd-kit/core';

interface Talent {
  id: string;
  full_name: string;
  category: string;
  profile_image_url: string;
  base_rate: number;
}

interface KanbanColumn {
  status: string;
  invitations: Talent[];
}

const STATUSES = ['invited', 'viewed', 'shortlist', 'callback', 'booked', 'rejected'];

export function CastingKanban({ projectId }: { projectId: string }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Fetch kanban data
  const { data: kanban, isLoading } = useQuery({
    queryKey: ['casting', projectId, 'kanban'],
    queryFn: async () => {
      const res = await fetch(`/api/v1/casting/${projectId}/kanban`);
      return res.json();
    }
  });

  // Bulk move mutation
  const bulkMoveMutation = useMutation({
    mutationFn: async ({ invitationIds, newStatus }: any) => {
      const res = await fetch('/api/v1/casting-invitations/bulk-move', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitation_ids: invitationIds,
          new_status: newStatus
        })
      });
      return res.json();
    }
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const invitationId = active.id as string;
    const newStatus = over.id as string;

    bulkMoveMutation.mutate({
      invitationIds: Array.from(selected).length > 0
        ? Array.from(selected)
        : [invitationId],
      newStatus
    });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto p-4">
        {STATUSES.map((status) => (
          <div
            key={status}
            id={status}
            className="flex-1 min-w-72 bg-gray-100 rounded-lg p-4"
          >
            <h3 className="font-bold text-lg mb-4 capitalize">
              {status} ({kanban?.data?.[status]?.length || 0})
            </h3>

            <div className="space-y-2">
              {kanban?.data?.[status]?.map((talent: Talent) => (
                <div
                  key={talent.id}
                  draggable
                  onClick={() => {
                    const newSelected = new Set(selected);
                    if (newSelected.has(talent.id)) {
                      newSelected.delete(talent.id);
                    } else {
                      newSelected.add(talent.id);
                    }
                    setSelected(newSelected);
                  }}
                  className={`p-3 rounded-lg cursor-move transition ${
                    selected.has(talent.id)
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border-2 border-gray-200'
                  }`}
                >
                  <p className="font-semibold">{talent.full_name}</p>
                  <p className="text-sm opacity-75">{talent.category}</p>
                  <p className="text-xs opacity-50">
                    IDR {talent.base_rate?.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DndContext>
  );
}
```

---

## Implementation Roadmap

### Week 1: CSV Import & Data Validation
- [ ] Create casting_breakdowns table
- [ ] Implement CSV upload handler
- [ ] Add PapaParse CSV parsing
- [ ] Error handling & validation

### Week 2: Bulk Invitations
- [ ] Create casting_invitations table
- [ ] Implement bulk-send endpoint
- [ ] Email notification queue
- [ ] Track invitation status

### Week 3: Kanban Management
- [ ] Create casting_timeline table
- [ ] Implement bulk-move endpoint
- [ ] Build drag-drop UI (dnd-kit)
- [ ] Status tracking

### Week 4: Export & Polish
- [ ] Implement PDF generation (pdfmake)
- [ ] CSV export endpoint
- [ ] Testing & optimization
- [ ] Performance tuning

---

**Status:** Ready for Implementation  
**Estimated Timeline:** 4 weeks  
**Complexity:** Medium-High  
**Priority:** High (Core Client Feature)

---

*Created: April 9, 2026*
