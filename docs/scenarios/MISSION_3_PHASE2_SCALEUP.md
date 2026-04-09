# MISSION 3: Architect Phase 2 "Scale-Up" for Orland Management SaaS

**Project:** Orland Management SaaS  
**Mission:** 3  
**Date:** April 9, 2026  
**Status:** Design & Implementation Guide  
**Phase:** Scale-Up & Advanced Features

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Feature 1: Fintech & E-Signature](#feature-1-fintech--e-signature)
5. [Feature 2: Cloudflare Workers AI](#feature-2-cloudflare-workers-ai)
6. [Feature 3: White-Labeling](#feature-3-white-labeling)
7. [Feature 4: Analytics & Gamification](#feature-4-analytics--gamification)
8. [Feature 5: Calendar Synchronization](#feature-5-calendar-synchronization)
9. [Implementation Roadmap](#implementation-roadmap)

---

## Overview

MISSION 3 elevates Orland to an enterprise platform with:

### **Five Advanced Features**

1. **Fintech & E-Signature**
   - Dynamic contract generation (PDF)
   - Digital signature capture
   - Escrow payment tracking
   - Split payment calculations (Agency 20%, Talent 80%)

2. **Cloudflare Workers AI (Smart Matching)**
   - Parse natural language job descriptions
   - AI-powered talent matching
   - Parameter extraction from text
   - Semantic talent search

3. **White-Labeling for Premium Agencies**
   - Custom domain support
   - Agency watermark stamping
   - Branded exports
   - White-label comp cards

4. **Analytics & Gamification**
   - Profile view tracking
   - Talent leaderboards
   - Ranking badges
   - Week/month performance metrics

5. **Calendar Synchronization**
   - Availability management
   - Booked date visualization
   - Conflict prevention
   - Public calendar display

---

## Architecture

```
┌────────────────────────────────────────────────────┐
│         Frontend (React / Vite)                   │
├────────────────────────────────────────────────────┤
│ Client Job Search      │  AI Match UI              │
│ → Smart Matching       │  → Parameters Input      │
│                        │                          │
│ Agency Settings        │  Talent Calendar         │
│ → White-Label Config   │  → Availability Mgmt     │
│                        │                          │
│ Contract Signing       │  Talent Analytics        │
│ → E-Signature          │  → Leaderboard          │
└────────────────────────────────────────────────────┘
              ↓                    ↓
┌────────────────────────────────────────────────────┐
│      Backend (Hono.js + Workers AI)               │
├────────────────────────────────────────────────────┤
│ Routes:                                           │
│ ├─ POST /ai/match (LLaMA parsing)                │
│ ├─ POST /contracts/generate (PDF)                │
│ ├─ POST /contracts/:id/sign (E-Sig)              │
│ ├─ GET /analytics/profile-views                  │
│ ├─ GET /talents/leaderboard                      │
│ ├─ POST /availability/add                        │
│ └─ GET /public/compcard (watermarked)            │
│                                                  │
│ Bindings:                                        │
│ - @cf/meta/llama-3-8b-instruct (AI Model)       │
│ - D1 Database                                    │
│ - R2 Storage                                     │
└────────────────────────────────────────────────────┘
         ↙              ↓              ↘
    ┌─────────┐   ┌─────────┐   ┌──────────┐
    │D1: Core │   │D1: D1   │   │  R2:     │
    │Profile  │   │Profile  │   │ PDFs &   │
    │Contracts│   │Views Analytics  Watermarks│
    └─────────┘   └─────────┘   └──────────┘
```

---

## Database Schema

### 1. Contracts Table (D1)

```sql
CREATE TABLE contracts (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  talent_id TEXT NOT NULL,
  agency_id TEXT,
  client_id TEXT NOT NULL,
  status TEXT DEFAULT 'draft',              -- 'draft', 'sent', 'signed', 'completed'
  fee REAL NOT NULL,
  contract_content TEXT,                    -- Rich HTML/PDF template
  signature_talent TEXT,                    -- Base64-encoded signature image
  signature_client TEXT,
  signature_agency TEXT,
  signed_at_talent DATETIME,
  signed_at_client DATETIME,
  signed_at_agency DATETIME,
  payment_status TEXT DEFAULT 'pending',    -- 'pending', 'escrow', 'released'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME
);

CREATE INDEX idx_contracts_talent ON contracts(talent_id);
CREATE INDEX idx_contracts_client ON contracts(client_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_payment ON contracts(payment_status);
```

### 2. Invoices Table (D1)

```sql
CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  agency_id TEXT,
  talent_id TEXT NOT NULL,
  gross_amount REAL NOT NULL,
  agency_cut REAL DEFAULT 0,                -- 20%
  talent_cut REAL DEFAULT 0,                -- 80%
  platform_fee REAL DEFAULT 0,              -- 5%
  net_amount REAL NOT NULL,
  status TEXT DEFAULT 'pending',            -- 'pending', 'paid', 'failed'
  payment_method TEXT,                      -- 'credit_card', 'bank_transfer'
  payment_url TEXT,                         -- Midtrans/PayMu link
  receipt_url TEXT,
  paid_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(contract_id) REFERENCES contracts(id),
  FOREIGN KEY(client_id) REFERENCES clients(id),
  FOREIGN KEY(talent_id) REFERENCES talents(id)
);

CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_client ON invoices(client_id);
```

### 3. Profile Views Table (D1)

```sql
CREATE TABLE profile_views (
  id TEXT PRIMARY KEY,
  talent_id TEXT NOT NULL,
  viewer_id TEXT,                           -- NULL if anonymous
  viewer_role TEXT,                         -- 'client', 'agency', 'talent'
  viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(talent_id) REFERENCES talents(id)
);

CREATE INDEX idx_profile_views_talent ON profile_views(talent_id);
CREATE INDEX idx_profile_views_date ON profile_views(viewed_at DESC);
```

### 4. Availability Table (D1)

```sql
CREATE TABLE availability (
  id TEXT PRIMARY KEY,
  talent_id TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'unavailable',        -- 'booked', 'unavailable', 'available'
  job_id TEXT,                              -- Link to booking
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(talent_id) REFERENCES talents(id)
);

CREATE INDEX idx_availability_talent ON availability(talent_id);
CREATE INDEX idx_availability_date ON availability(start_date, end_date);
```

### 5. Agencies Table Update (D1)

```sql
-- Add white-labeling fields to existing agencies table
ALTER TABLE agencies ADD COLUMN custom_domain TEXT;         -- e.g., talents.mystudio.com
ALTER TABLE agencies ADD COLUMN watermark_url TEXT;         -- R2 URL to watermark image
ALTER TABLE agencies ADD COLUMN s3_bucket_name TEXT;        -- For white-label exports
ALTER TABLE agencies ADD COLUMN brand_color TEXT;           -- Hex color for theming
ALTER TABLE agencies ADD COLUMN is_white_label INTEGER DEFAULT 0;
```

### Example Data

```sql
-- Contract for a booking
INSERT INTO contracts (id, job_id, talent_id, client_id, fee, status)
VALUES ('contract-1', 'job-123', 'talent-456', 'client-789', 50000, 'draft');

-- Profile view tracking
INSERT INTO profile_views (id, talent_id, viewer_id, viewed_at)
VALUES ('view-1', 'talent-456', 'client-789', CURRENT_TIMESTAMP);

-- Availability (booked date)
INSERT INTO availability (id, talent_id, start_date, end_date, status, job_id)
VALUES ('avail-1', 'talent-456', '2026-04-20', '2026-04-22', 'booked', 'job-123');
```

---

## Feature 1: Fintech & E-Signature

### 1a. Contract Generation (PDF)

```typescript
// apps/appapi/src/handlers/contractHandler.ts

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { PDFDocument, PDFPage } from 'pdf-lib';
import { Database } from '@cloudflare/workers-types';

export interface Env {
  DB: Database;
  R2: R2Bucket;
}

const router = new Hono<{ Bindings: Env }>();

const ContractGenerateSchema = z.object({
  job_id: z.string(),
  talent_id: z.string(),
  client_id: z.string(),
  fee: z.number().positive()
});

/**
 * POST /api/v1/contracts/generate
 * Create a new contract and generate PDF
 */
router.post(
  '/contracts/generate',
  zValidator('json', ContractGenerateSchema),
  async (c) => {
    const db = c.env.DB;
    const r2 = c.env.R2;
    const body = c.req.valid('json');

    try {
      // Fetch job, talent, and client details
      const job = await db
        .prepare('SELECT * FROM projects WHERE project_id = ?')
        .bind(body.job_id)
        .first();

      const talent = await db
        .prepare('SELECT * FROM talents WHERE id = ?')
        .bind(body.talent_id)
        .first();

      const client = await db
        .prepare('SELECT * FROM clients WHERE id = ?')
        .bind(body.client_id)
        .first();

      // Generate contract content (HTML template)
      const contractHTML = generateContractHTML({
        jobTitle: job.title,
        talentName: talent.full_name,
        clientName: client.company_name,
        fee: body.fee,
        startDate: new Date().toISOString().split('T')[0],
        duration: '3 days'
      });

      // Convert HTML to PDF (using a library like html2pdf or pdfmake)
      const pdfBuffer = await generatePDFFromHTML(contractHTML);

      // Upload to R2
      const pdfUrl = await uploadToR2(
        r2,
        `contracts/${body.job_id}_${body.talent_id}.pdf`,
        pdfBuffer
      );

      // Create contract record in database
      const contractId = `contract-${Date.now()}`;

      await db
        .prepare(`
          INSERT INTO contracts 
          (id, job_id, talent_id, client_id, fee, contract_content, status)
          VALUES (?, ?, ?, ?, ?, ?, 'draft')
        `)
        .bind(
          contractId,
          body.job_id,
          body.talent_id,
          body.client_id,
          body.fee,
          pdfUrl
        )
        .run();

      return c.json({
        success: true,
        data: {
          contractId,
          pdfUrl,
          status: 'draft'
        }
      });

    } catch (error) {
      console.error('Contract generation error:', error);
      return c.json({ error: 'Failed to generate contract' }, { status: 500 });
    }
  }
);

/**
 * Generate HTML contract template
 */
function generateContractHTML(data: {
  jobTitle: string;
  talentName: string;
  clientName: string;
  fee: number;
  startDate: string;
  duration: string;
}): string {
  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
          h1 { color: #333; text-align: center; }
          .section { margin: 20px 0; }
          .signature-line { border-top: 1px solid black; margin-top: 30px; padding-top: 10px; }
        </style>
      </head>
      <body>
        <h1>Talent Services Agreement</h1>
        
        <div class="section">
          <h2>Parties</h2>
          <p><strong>Client:</strong> ${data.clientName}</p>
          <p><strong>Talent:</strong> ${data.talentName}</p>
          <p><strong>Job:</strong> ${data.jobTitle}</p>
        </div>

        <div class="section">
          <h2>Terms</h2>
          <p><strong>Fee:</strong> IDR ${data.fee.toLocaleString('id-ID')}</p>
          <p><strong>Start Date:</strong> ${data.startDate}</p>
          <p><strong>Duration:</strong> ${data.duration}</p>
          <p><strong>Agency Commission:</strong> 20% (IDR ${(data.fee * 0.2).toLocaleString('id-ID')})</p>
          <p><strong>Talent Payment:</strong> 80% (IDR ${(data.fee * 0.8).toLocaleString('id-ID')})</p>
        </div>

        <div class="section">
          <h2>Liability & Confidentiality</h2>
          <p>Talent agrees to maintain confidentiality regarding the project details and client information.</p>
        </div>

        <div class="section signature-line">
          <p>Client Signature: _________________</p>
          <p>Date: _________________</p>
        </div>

        <div class="section signature-line">
          <p>Talent Signature: _________________</p>
          <p>Date: _________________</p>
        </div>
      </body>
    </html>
  `;
}

async function generatePDFFromHTML(html: string): Promise<Buffer> {
  // Use a library like html2pdf, pdfmake, or puppeteer
  // This is pseudo-code; implement with your chosen library
  throw new Error('Implement PDF generation with html2pdf or pdfmake');
}

async function uploadToR2(
  r2: R2Bucket,
  key: string,
  buffer: Buffer
): Promise<string> {
  const object = await r2.put(key, buffer, {
    httpMetadata: { contentType: 'application/pdf' }
  });
  return `https://r2.example.com/${key}`;
}

export default router;
```

### 1b. E-Signature Handler

```typescript
/**
 * POST /api/v1/contracts/:id/sign
 * Add digital signature to contract
 */
router.post(
  '/contracts/:id/sign',
  zValidator('json', z.object({
    signature_base64: z.string(),
    signer_role: z.enum(['talent', 'client', 'agency'])
  })),
  async (c) => {
    const db = c.env.DB;
    const { id } = c.req.param();
    const body = c.req.valid('json');
    const userId = c.get('userId');

    try {
      // Verify contract exists and user is authorized
      const contract = await db
        .prepare('SELECT * FROM contracts WHERE id = ?')
        .bind(id)
        .first();

      if (!contract) {
        return c.json({ error: 'Contract not found' }, { status: 404 });
      }

      // Verify user is authorized to sign
      const isAuthorized =
        (body.signer_role === 'talent' && userId === contract.talent_id) ||
        (body.signer_role === 'client' && userId === contract.client_id) ||
        (body.signer_role === 'agency' && userId === contract.agency_id);

      if (!isAuthorized) {
        return c.json(
          { error: 'Not authorized to sign this contract' },
          { status: 403 }
        );
      }

      // Store signature
      const column = `signature_${body.signer_role}`;
      const timestampColumn = `signed_at_${body.signer_role}`;

      await db
        .prepare(`
          UPDATE contracts 
          SET ${column} = ?, ${timestampColumn} = CURRENT_TIMESTAMP
          WHERE id = ?
        `)
        .bind(body.signature_base64, id)
        .run();

      // Check if all parties have signed
      const updated = await db
        .prepare('SELECT * FROM contracts WHERE id = ?')
        .bind(id)
        .first();

      const allSigned =
        updated.signature_talent &&
        updated.signature_client &&
        updated.signature_agency;

      if (allSigned) {
        // Move to 'signed' status
        await db
          .prepare('UPDATE contracts SET status = ? WHERE id = ?')
          .bind('signed', id)
          .run();
      }

      return c.json({
        success: true,
        data: {
          contractId: id,
          signerRole: body.signer_role,
          allSigned: !!allSigned,
          nextStep: allSigned ? 'payment' : 'awaiting_signatures'
        }
      });

    } catch (error) {
      console.error('E-signature error:', error);
      return c.json({ error: 'Failed to sign contract' }, { status: 500 });
    }
  }
);
```

### 1c. Split Payment Calculation

```typescript
/**
 * Calculate split payments for a contract
 */
function calculateSplitPayment(grossAmount: number, platformFeePercent = 0.05) {
  const platformFee = grossAmount * platformFeePercent;
  const netAmount = grossAmount - platformFee;
  const agencyCut = netAmount * 0.20;  // 20% to agency
  const talentCut = netAmount * 0.80;  // 80% to talent

  return {
    grossAmount,
    platformFee,
    netAmount,
    agencyCut,
    talentCut,
    breakdown: {
      talent: { percentage: 80, amount: talentCut },
      agency: { percentage: 20, amount: agencyCut }
    }
  };
}

/**
 * GET /api/v1/contracts/:id/payment-split
 */
router.get('/contracts/:id/payment-split', async (c) => {
  const db = c.env.DB;
  const { id } = c.req.param();

  try {
    const contract = await db
      .prepare('SELECT fee FROM contracts WHERE id = ?')
      .bind(id)
      .first();

    if (!contract) {
      return c.json({ error: 'Contract not found' }, { status: 404 });
    }

    const split = calculateSplitPayment(contract.fee);

    return c.json({
      success: true,
      data: split
    });

  } catch (error) {
    return c.json({ error: 'Failed to calculate split' }, { status: 500 });
  }
});
```

---

## Feature 2: Cloudflare Workers AI

### 2a. Smart Talent Matching with LLaMA

```typescript
// apps/appapi/src/handlers/aiHandler.ts

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Database } from '@cloudflare/workers-types';
import { Ai } from '@cloudflare/workers-ai';

export interface Env {
  DB: Database;
  AI: Ai;
}

const router = new Hono<{ Bindings: Env }>();

const MatchSchema = z.object({
  prompt: z.string().min(10),  // e.g., "Need Asian female, 20s, beauty commercial"
  limit: z.number().default(10).max(50)
});

/**
 * POST /api/v1/ai/match
 * Parse job requirements and find matching talents
 */
router.post(
  '/ai/match',
  zValidator('json', MatchSchema),
  async (c) => {
    const db = c.env.DB;
    const ai = c.env.AI;
    const body = c.req.valid('json');

    try {
      // Use Cloudflare AI to parse the prompt
      const aiResponse = await ai.run('@cf/meta/llama-3-8b-instruct', {
        prompt: `Extract talent requirements from this job description. Return JSON with: gender (M/F/Any), age_range (min, max), ethnicity (optional), category (e.g., Commercial, Film, Event), special_skills (array).

Job Description: "${body.prompt}"

Respond ONLY with valid JSON, no markdown:`,
        max_tokens: 200
      });

      // Parse AI response
      const responseText = aiResponse.result.response;
      const requirements = JSON.parse(responseText);

      // Query database for matching talents
      const query = buildDynamicQuery(requirements);
      const talents = await db.prepare(query).all();

      return c.json({
        success: true,
        data: {
          extracted_requirements: requirements,
          matching_talents: (talents.results || []).slice(0, body.limit),
          total_matches: talents.results?.length || 0
        }
      });

    } catch (error) {
      console.error('AI Match error:', error);
      return c.json(
        { error: 'Failed to process job requirements' },
        { status: 500 }
      );
    }
  }
);

/**
 * Build dynamic SQL query based on extracted requirements
 */
function buildDynamicQuery(requirements: any): string {
  let query = 'SELECT id, full_name, category, gender, base_rate FROM talents WHERE is_active = 1';

  if (requirements.gender && requirements.gender !== 'Any') {
    query += ` AND gender = '${requirements.gender}'`;
  }

  if (requirements.age_range) {
    const birthYearMin = new Date().getFullYear() - requirements.age_range.max;
    const birthYearMax = new Date().getFullYear() - requirements.age_range.min;
    query += ` AND CAST(substr(birth_date, 1, 4) AS INTEGER) BETWEEN ${birthYearMin} AND ${birthYearMax}`;
  }

  if (requirements.category) {
    query += ` AND category = '${requirements.category}'`;
  }

  query += ' LIMIT 50';
  return query;
}

export default router;
```

---

## Feature 3: White-Labeling

### 3a. Watermarked Comp Card Generation

```typescript
/**
 * GET /api/v1/public/compcard
 * Generate white-labeled comp card with watermark
 */
router.get('/public/compcard/:talentId', async (c) => {
  const db = c.env.DB;
  const r2 = c.env.R2;
  const { talentId } = c.req.param();

  try {
    // Fetch talent
    const talent = await db
      .prepare('SELECT * FROM talents WHERE id = ?')
      .bind(talentId)
      .first();

    // Check if talent is agency-managed
    const agency = await db
      .prepare(`
        SELECT ag.* FROM agencies ag
        JOIN talents t ON t.agency_id = ag.id
        WHERE t.id = ?
      `)
      .bind(talentId)
      .first();

    // Fetch primary media
    const mediaResult = await db
      .prepare(`
        SELECT * FROM talent_media 
        WHERE talent_id = ? AND is_primary = 1
        LIMIT 1
      `)
      .bind(talentId)
      .first();

    // If agency has white-label enabled, add watermark
    if (agency?.is_white_label && agency?.watermark_url) {
      const watermarkedImage = await addWatermarkToImage(
        mediaResult?.media_url,
        agency.watermark_url,
        r2
      );

      return c.json({
        success: true,
        data: {
          talent: {
            name: talent.full_name,
            category: talent.category,
            height: talent.height,
            weight: talent.weight
          },
          compcardUrl: watermarkedImage,
          agency: {
            name: agency.agency_name,
            custom_domain: agency.custom_domain
          }
        }
      });
    }

    // No watermark, return plain comp card
    return c.json({
      success: true,
      data: {
        talent,
        compcardUrl: mediaResult?.media_url
      }
    });

  } catch (error) {
    console.error('Comp card error:', error);
    return c.json({ error: 'Failed to generate comp card' }, { status: 500 });
  }
});

/**
 * Add watermark to image using image manipulation library
 */
async function addWatermarkToImage(
  imageUrl: string | undefined,
  watermarkUrl: string,
  r2: R2Bucket
): Promise<string> {
  if (!imageUrl) throw new Error('No image to watermark');

  // Use Sharp or Canvas to overlay watermark
  // Pseudo-code:
  // const image = await sharp(imageUrl).toBuffer();
  // const watermark = await sharp(watermarkUrl).toBuffer();
  // const watermarked = await sharp(image).composite([{ input: watermark, gravity: 'southeast' }]).toBuffer();
  // const url = await uploadToR2(r2, `watermarked/${Date.now()}.png`, watermarked);
  // return url;

  throw new Error('Implement image watermarking with sharp or canvas');
}
```

---

## Feature 4: Analytics & Gamification

### 4a. Profile View Tracking

```typescript
/**
 * Track profile view (auto-called when talent profile is viewed)
 */
async function trackProfileView(
  db: Database,
  talentId: string,
  viewerId: string | null,
  viewerRole?: string
) {
  const viewId = `view-${Date.now()}`;

  await db
    .prepare(`
      INSERT INTO profile_views (id, talent_id, viewer_id, viewer_role, viewed_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)
    .bind(viewId, talentId, viewerId, viewerRole || null)
    .run();
}

/**
 * GET /api/v1/talents/me/analytics
 * Get personal talent analytics
 */
router.get('/talents/me/analytics', async (c) => {
  const db = c.env.DB;
  const userId = c.get('userId');

  try {
    const talent = await db
      .prepare('SELECT id FROM talents WHERE user_id = ?')
      .bind(userId)
      .first();

    // Views this week
    const weekViews = await db
      .prepare(`
        SELECT COUNT(*) as count
        FROM profile_views
        WHERE talent_id = ? AND viewed_at >= datetime('now', '-7 days')
      `)
      .bind(talent.id)
      .first<{ count: number }>();

    // Views this month
    const monthViews = await db
      .prepare(`
        SELECT COUNT(*) as count
        FROM profile_views
        WHERE talent_id = ? AND viewed_at >= datetime('now', '-30 days')
      `)
      .bind(talent.id)
      .first<{ count: number }>();

    // All-time views
    const allViews = await db
      .prepare('SELECT COUNT(*) as count FROM profile_views WHERE talent_id = ?')
      .bind(talent.id)
      .first<{ count: number }>();

    return c.json({
      success: true,
      data: {
        views_week: weekViews.count,
        views_month: monthViews.count,
        views_total: allViews.count
      }
    });

  } catch (error) {
    return c.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
});

/**
 * GET /api/v1/talents/leaderboard
 * Talent leaderboard by views (gamification)
 */
router.get('/talents/leaderboard', async (c) => {
  const db = c.env.DB;
  const period = c.req.query('period') || 'week';  // week, month, all

  const dateFilter =
    period === 'week' ? "datetime('now', '-7 days')" :
    period === 'month' ? "datetime('now', '-30 days')" :
    "'1970-01-01'";

  try {
    const leaderboard = await db
      .prepare(`
        SELECT 
          t.id,
          t.full_name,
          t.category,
          COUNT(pv.id) as view_count,
          RANK() OVER (ORDER BY COUNT(pv.id) DESC) as rank
        FROM talents t
        LEFT JOIN profile_views pv ON t.id = pv.talent_id AND pv.viewed_at >= ${dateFilter}
        WHERE t.is_active = 1
        GROUP BY t.id
        ORDER BY view_count DESC
        LIMIT 100
      `)
      .all();

    return c.json({
      success: true,
      data: {
        period,
        leaderboard: leaderboard.results || []
      }
    });

  } catch (error) {
    return c.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
});
```

---

## Feature 5: Calendar Synchronization

### 5a. Availability Management

```typescript
/**
 * POST /api/v1/talents/me/availability
 * Mark dates as booked/unavailable
 */
router.post(
  '/talents/me/availability',
  zValidator('json', z.object({
    start_date: z.string().date(),
    end_date: z.string().date(),
    status: z.enum(['booked', 'unavailable']),
    job_id: z.string().optional(),
    notes: z.string().optional()
  })),
  async (c) => {
    const db = c.env.DB;
    const userId = c.get('userId');
    const body = c.req.valid('json');

    try {
      const talent = await db
        .prepare('SELECT id FROM talents WHERE user_id = ?')
        .bind(userId)
        .first();

      const availId = `avail-${Date.now()}`;

      await db
        .prepare(`
          INSERT INTO availability (id, talent_id, start_date, end_date, status, job_id, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          availId,
          talent.id,
          body.start_date,
          body.end_date,
          body.status,
          body.job_id || null,
          body.notes || null
        )
        .run();

      return c.json({
        success: true,
        data: { availabilityId: availId }
      });

    } catch (error) {
      return c.json({ error: 'Failed to update availability' }, { status: 500 });
    }
  }
);

/**
 * GET /api/v1/public/talents/:id/calendar
 * Get public calendar view (availability)
 */
router.get('/public/talents/:id/calendar', async (c) => {
  const db = c.env.DB;
  const { id } = c.req.param();

  try {
    const availability = await db
      .prepare(`
        SELECT start_date, end_date, status, notes
        FROM availability
        WHERE talent_id = ? AND end_date >= DATE('now')
        ORDER BY start_date ASC
      `)
      .bind(id)
      .all();

    return c.json({
      success: true,
      data: availability.results || []
    });

  } catch (error) {
    return c.json({ error: 'Failed to fetch calendar' }, { status: 500 });
  }
});
```

---

## Implementation Roadmap

### Week 1: Fintech & Payments
- [ ] Create contracts & invoices tables
- [ ] Implement contract generation (PDF)
- [ ] Build e-signature handler
- [ ] Add payment split calculation

### Week 2: AI & Smart Matching
- [ ] Bind Cloudflare Workers AI to worker
- [ ] Implement LLaMA prompt engineering
- [ ] Build talent matching endpoint
- [ ] Test AI parsing accuracy

### Week 3: White-Label & Calendar
- [ ] Add white-label fields to agencies
- [ ] Implement watermark generation
- [ ] Build availability tracking
- [ ] Create calendar UI component

### Week 4: Analytics & Polish
- [ ] Implement profile view tracking
- [ ] Build leaderboard endpoint
- [ ] Create analytics dashboard
- [ ] Testing & optimization

---

**Status:** Ready for Implementation  
**Estimated Timeline:** 4 weeks  
**Complexity:** High  
**Priority:** Medium (Advanced Features)

---

*Created: April 9, 2026*
