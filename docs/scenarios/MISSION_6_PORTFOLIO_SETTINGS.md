# MISSION 6: Admin Portfolio CRUD, KV Global Settings & Secure Payment Config

**Project:** Orland Management SaaS  
**Mission:** 6  
**Created:** April 9, 2026  
**Status:** Design & Implementation Guide

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [KV Caching Strategy](#kv-caching-strategy)
7. [Payment Gateway Setup](#payment-gateway-setup)
8. [Security Checklist](#security-checklist)
9. [Implementation Roadmap](#implementation-roadmap)

---

## Overview

This mission extends the Orland Management platform with two critical systems:

### 1. Portfolio Management System
- Admin CRUD interface for past projects/films
- Public API for external consumption (e.g., Blogspot)
- Gallery image management with R2 storage
- SEO-friendly URLs and slug generation

### 2. Global Settings & Configuration
- Centralized app configuration (App Name, Logo, Contacts)
- KV caching for blazing-fast reads
- Payment gateway selection and configuration
- Secure secrets management via Cloudflare Workers

### Key Benefits
✅ No database hits for frequently-accessed settings  
✅ Gallery images handled efficiently via R2  
✅ Secure payment secrets never exposed to frontend  
✅ Public portfolio API for external consuming services  
✅ Admin interface for non-technical configuration  

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin Frontend (React)                    │
├─────────────────────────────────────────────────────────────┤
│  PortfolioManager Component → Portfolio CRUD                │
│  GlobalSettings Component → Settings Form                   │
│  PaymentGatewayConfig → Payment Setup                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Backend API (Hono.js)                      │
├─────────────────────────────────────────────────────────────┤
│  Admin Routes:                                              │
│  ├─ POST /api/v1/admin/portfolios (Create)                │
│  ├─ PUT /api/v1/admin/portfolios/:id (Update)             │
│  ├─ DELETE /api/v1/admin/portfolios/:id (Delete)          │
│  └─ PUT /api/v1/admin/settings (Update Settings)          │
│                                                             │
│  Public Routes:                                             │
│  ├─ GET /api/v1/public/portfolios (List)                  │
│  └─ GET /api/v1/settings (Read Settings)                  │
└─────────────────────────────────────────────────────────────┘
           ↙                          ↘
    ┌──────────────┐         ┌──────────────────┐
    │ Cloudflare KV│         │ Cloudflare D1 DB │
    │   (Cache)    │         │                  │
    │ Settings     │         │  portfolios      │
    │ stored for   │         │  system_settings │
    │ fast reads   │         │                  │
    └──────────────┘         └──────────────────┘
                        ↓
                  ┌──────────────┐
                  │ Cloudflare R2│
                  │ Portfolio    │
                  │ Gallery Imgs │
                  └──────────────┘
```

---

## Database Schema

### 1. Portfolios Table (D1)

```sql
CREATE TABLE portfolios (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,              -- URL-friendly slug (auto-generated from title)
  description TEXT,                        -- Short description (1-2 lines)
  content TEXT,                            -- Full rich text content
  cover_image TEXT,                        -- R2 URL for main portfolio image
  gallery_images TEXT,                     -- JSON array of R2 URLs: ["url1", "url2", ...]
  category TEXT,                           -- e.g., 'Film', 'Commercial', 'Music Video', 'Event'
  client_name TEXT,                        -- Brand/Company name
  release_date DATE,                       -- When project was released
  video_url TEXT,                          -- YouTube URL or R2 video URL (optional)
  view_count INTEGER DEFAULT 0,            -- For analytics
  featured BOOLEAN DEFAULT FALSE,          -- Show on homepage
  status TEXT DEFAULT 'published',         -- 'draft', 'published', 'archived'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME                      -- Soft delete
);

CREATE INDEX idx_portfolios_category ON portfolios(category);
CREATE INDEX idx_portfolios_release_date ON portfolios(release_date DESC);
CREATE INDEX idx_portfolios_featured ON portfolios(featured);
CREATE INDEX idx_portfolios_slug ON portfolios(slug);
```

### 2. System Settings Table (D1)

```sql
CREATE TABLE system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,                     -- JSON string
  description TEXT,                        -- Documentation
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Example initial records (Insert these):
INSERT INTO system_settings (key, value, description) VALUES
('app_name', '"Orland Management"', 'Application name'),
('app_title', '"Orland - Talent & Booking Platform"', 'SEO page title'),
('app_description', '"Connect with top talent and manage bookings globally"', 'SEO meta description'),
('app_logo', '"https://r2.example.com/branding/logo.png"', 'App logo URL'),
('contact_wa_talent', '"+62812345678"', 'WhatsApp for talent inquiries'),
('contact_wa_client', '"+62812345679"', 'WhatsApp for client inquiries'),
('active_payment_gateway', '"midtrans"', 'Which gateway is active (midtrans, paymu, doku)'),
('midtrans_client_key', '"Mid-client-XXXXXXXX"', 'Midtrans public key'),
('paymu_client_key', '"PU-XXXXXXXX"', 'PayMu public key'),
('doku_client_key', '"DOKU-XXXXXXXX"', 'DOKU public key'),
('seo_keywords', '"talent, booking, film, commercial"', 'SEO keywords'),
('currency', '"IDR"', 'Default currency');
```

### 3. Update Users Table (D1)

```sql
ALTER TABLE users ADD COLUMN kyc_status TEXT DEFAULT 'pending';    -- 'pending', 'approved', 'rejected'
ALTER TABLE users ADD COLUMN kyc_document_url TEXT;                -- URL to KYC document
```

### 4. Update Portfolios Access Control (Optional)

```sql
-- If you want to track portfolio view analytics:
CREATE TABLE portfolio_views (
  id TEXT PRIMARY KEY,
  portfolio_id TEXT NOT NULL,
  viewer_ip TEXT,
  viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(portfolio_id) REFERENCES portfolios(id)
);

CREATE INDEX idx_portfolio_views_date ON portfolio_views(viewed_at DESC);
```

---

## Backend Implementation

### 1. Hono.js Portfolio Routes

```typescript
// apps/appapi/src/handlers/portfolioHandler.ts

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Database } from '@cloudflare/workers-types';

export interface Env {
  DB: Database;
  R2: R2Bucket;
}

const router = new Hono<{ Bindings: Env }>();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const PortfolioCreateSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().min(10).max(500),
  content: z.string().optional(),
  cover_image: z.string().url(),
  gallery_images: z.array(z.string().url()).default([]),
  category: z.enum(['Film', 'Commercial', 'Music Video', 'Event', 'Other']),
  client_name: z.string().max(255),
  release_date: z.string().date(),  // YYYY-MM-DD
  video_url: z.string().url().optional(),
  featured: z.boolean().default(false),
  status: z.enum(['draft', 'published', 'archived']).default('published')
});

type PortfolioCreate = z.infer<typeof PortfolioCreateSchema>;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate URL-friendly slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `portfolio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// ADMIN ROUTES (Protected)
// ============================================================================

/**
 * POST /api/v1/admin/portfolios - Create new portfolio
 */
router.post(
  '/admin/portfolios',
  zValidator('json', PortfolioCreateSchema),
  async (c) => {
    // Check admin authorization
    if (c.get('user')?.role !== 'admin') {
      return c.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const db = c.env.DB;
    const body = c.req.valid('json');

    try {
      const id = generateId();
      const slug = generateSlug(body.title);

      // Check if slug already exists
      const existing = await db
        .prepare('SELECT id FROM portfolios WHERE slug = ?')
        .bind(slug)
        .first();

      if (existing) {
        return c.json(
          { error: 'Portfolio with this title already exists' },
          { status: 400 }
        );
      }

      // Insert portfolio
      await db
        .prepare(`
          INSERT INTO portfolios (
            id, title, slug, description, content, cover_image,
            gallery_images, category, client_name, release_date,
            video_url, featured, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          id,
          body.title,
          slug,
          body.description,
          body.content || null,
          body.cover_image,
          JSON.stringify(body.gallery_images),
          body.category,
          body.client_name,
          body.release_date,
          body.video_url || null,
          body.featured ? 1 : 0,
          body.status
        )
        .run();

      // Audit log
      await logAudit(
        c.get('userId'),
        'CREATE_PORTFOLIO',
        'portfolios',
        { id, title: body.title }
      );

      return c.json(
        {
          success: true,
          data: { id, slug }
        },
        { status: 201 }
      );

    } catch (error) {
      console.error('Portfolio creation error:', error);
      return c.json({ error: 'Failed to create portfolio' }, { status: 500 });
    }
  }
);

/**
 * PUT /api/v1/admin/portfolios/:id - Update portfolio
 */
router.put(
  '/admin/portfolios/:id',
  zValidator('json', PortfolioCreateSchema.partial()),
  async (c) => {
    if (c.get('user')?.role !== 'admin') {
      return c.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const db = c.env.DB;
    const { id } = c.req.param();
    const body = c.req.valid('json');

    try {
      // Build dynamic update query
      const updates = [];
      const values = [];

      if (body.title) {
        updates.push('title = ?');
        values.push(body.title);
      }
      if (body.description) {
        updates.push('description = ?');
        values.push(body.description);
      }
      if (body.content !== undefined) {
        updates.push('content = ?');
        values.push(body.content);
      }
      if (body.cover_image) {
        updates.push('cover_image = ?');
        values.push(body.cover_image);
      }
      if (body.gallery_images) {
        updates.push('gallery_images = ?');
        values.push(JSON.stringify(body.gallery_images));
      }
      if (body.category) {
        updates.push('category = ?');
        values.push(body.category);
      }
      if (body.client_name) {
        updates.push('client_name = ?');
        values.push(body.client_name);
      }
      if (body.release_date) {
        updates.push('release_date = ?');
        values.push(body.release_date);
      }
      if (body.video_url !== undefined) {
        updates.push('video_url = ?');
        values.push(body.video_url);
      }
      if (body.featured !== undefined) {
        updates.push('featured = ?');
        values.push(body.featured ? 1 : 0);
      }
      if (body.status) {
        updates.push('status = ?');
        values.push(body.status);
      }

      if (updates.length === 0) {
        return c.json({ error: 'No updates provided' }, { status: 400 });
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const query = `UPDATE portfolios SET ${updates.join(', ')} WHERE id = ?`;

      await db.prepare(query).bind(...values).run();

      await logAudit(
        c.get('userId'),
        'UPDATE_PORTFOLIO',
        'portfolios',
        { id }
      );

      return c.json({ success: true, data: { id } });

    } catch (error) {
      console.error('Portfolio update error:', error);
      return c.json({ error: 'Failed to update portfolio' }, { status: 500 });
    }
  }
);

/**
 * DELETE /api/v1/admin/portfolios/:id - Delete portfolio (soft delete)
 */
router.delete('/admin/portfolios/:id', async (c) => {
  if (c.get('user')?.role !== 'admin') {
    return c.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const db = c.env.DB;
  const { id } = c.req.param();

  try {
    await db
      .prepare('UPDATE portfolios SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(id)
      .run();

    await logAudit(
      c.get('userId'),
      'DELETE_PORTFOLIO',
      'portfolios',
      { id }
    );

    return c.json({ success: true });

  } catch (error) {
    console.error('Portfolio deletion error:', error);
    return c.json({ error: 'Failed to delete portfolio' }, { status: 500 });
  }
});

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

/**
 * GET /api/v1/public/portfolios - List portfolios (with caching)
 */
router.get('/public/portfolios', async (c) => {
  const db = c.env.DB;
  const { category, limit = '12', offset = '0', search } = c.req.query();

  try {
    // Build dynamic query
    let query = `
      SELECT id, title, slug, description, cover_image, category,
             client_name, release_date, featured, view_count
      FROM portfolios
      WHERE deleted_at IS NULL AND status = 'published'
    `;
    const params: any[] = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (title LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY featured DESC, release_date DESC';
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const portfolios = await db.prepare(query).bind(...params).all();

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as count FROM portfolios WHERE deleted_at IS NULL AND status = "published"';
    const countParams: any[] = [];

    if (category) {
      countQuery += ' AND category = ?';
      countParams.push(category);
    }

    if (search) {
      countQuery += ' AND (title LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
    }

    const countResult = await db.prepare(countQuery).bind(...countParams).first<{ count: number }>();

    return c.json({
      success: true,
      data: portfolios.results || [],
      pagination: {
        total: countResult?.count || 0,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('Portfolio list error:', error);
    return c.json({ error: 'Failed to fetch portfolios' }, { status: 500 });
  }
});

/**
 * GET /api/v1/public/portfolios/:slug - Get single portfolio with increment view count
 */
router.get('/public/portfolios/:slug', async (c) => {
  const db = c.env.DB;
  const { slug } = c.req.param();

  try {
    const portfolio = await db
      .prepare(`
        SELECT * FROM portfolios
        WHERE slug = ? AND deleted_at IS NULL
      `)
      .bind(slug)
      .first();

    if (!portfolio) {
      return c.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    // Increment view count (async, non-blocking)
    db.prepare('UPDATE portfolios SET view_count = view_count + 1 WHERE id = ?')
      .bind(portfolio.id)
      .run()
      .catch(err => console.error('View count increment failed:', err));

    // Parse gallery_images JSON
    const parsedPortfolio = {
      ...portfolio,
      gallery_images: portfolio.gallery_images ? JSON.parse(portfolio.gallery_images) : []
    };

    return c.json({
      success: true,
      data: parsedPortfolio
    });

  } catch (error) {
    console.error('Portfolio detail error:', error);
    return c.json({ error: 'Failed to fetch portfolio' }, { status: 500 });
  }
});

// ============================================================================
// AUDIT LOGGING
// ============================================================================

async function logAudit(
  actorId: string,
  action: string,
  entity: string,
  details: any
) {
  // Implementation depends on your audit logging setup
  console.log(`[AUDIT] ${action} by ${actorId} on ${entity}`, details);
}

export default router;
```

### 2. Hono.js Settings Routes with KV Caching

```typescript
// apps/appapi/src/handlers/settingsHandler.ts

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Database } from '@cloudflare/workers-types';
import { KVNamespace } from '@cloudflare/workers-types';

export interface Env {
  DB: Database;
  ORLAND_CACHE: KVNamespace;
}

const router = new Hono<{ Bindings: Env }>();

const SETTINGS_CACHE_KEY = 'global_settings';
const CACHE_TTL_SECONDS = 3600; // 1 hour

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const SettingsSchema = z.object({
  app_name: z.string().optional(),
  app_title: z.string().optional(),
  app_description: z.string().optional(),
  app_logo: z.string().url().optional(),
  contact_wa_talent: z.string().optional(),
  contact_wa_client: z.string().optional(),
  active_payment_gateway: z.enum(['midtrans', 'paymu', 'doku']).optional(),
  midtrans_client_key: z.string().optional(),
  paymu_client_key: z.string().optional(),
  doku_client_key: z.string().optional(),
  seo_keywords: z.string().optional(),
  currency: z.string().optional()
});

type SettingsUpdate = z.infer<typeof SettingsSchema>;

// ============================================================================
// PUBLIC ENDPOINT - Read with KV Caching
// ============================================================================

/**
 * GET /api/v1/settings
 * Returns settings with KV caching for fast reads
 */
router.get('/settings', async (c) => {
  const kv = c.env.ORLAND_CACHE;
  const db = c.env.DB;

  try {
    // Try to read from KV cache first
    const cached = await kv.get(SETTINGS_CACHE_KEY);
    if (cached) {
      return c.json({
        success: true,
        data: JSON.parse(cached),
        source: 'cache'
      });
    }

    // Cache miss - read from database
    const settings = await db
      .prepare('SELECT key, value FROM system_settings WHERE key NOT LIKE "?_hidden"')
      .all();

    if (!settings.results) {
      return c.json({ error: 'No settings found' }, { status: 404 });
    }

    // Convert array of { key, value } to object
    const settingsObj = {};
    for (const setting of settings.results) {
      settingsObj[setting.key] = JSON.parse(setting.value);
    }

    // Save to KV cache
    await kv.put(SETTINGS_CACHE_KEY, JSON.stringify(settingsObj), {
      expirationTtl: CACHE_TTL_SECONDS
    });

    return c.json({
      success: true,
      data: settingsObj,
      source: 'database'
    });

  } catch (error) {
    console.error('Settings read error:', error);
    return c.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
});

// ============================================================================
// ADMIN ENDPOINT - Update Settings
// ============================================================================

/**
 * PUT /api/v1/admin/settings
 * Update settings and invalidate KV cache
 */
router.put(
  '/admin/settings',
  zValidator('json', SettingsSchema),
  async (c) => {
    // Check admin authorization
    if (c.get('user')?.role !== 'admin') {
      return c.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const db = c.env.DB;
    const kv = c.env.ORLAND_CACHE;
    const body = c.req.valid('json');

    try {
      // Update each setting in database
      for (const [key, value] of Object.entries(body)) {
        if (value !== undefined) {
          await db
            .prepare(`
              INSERT INTO system_settings (key, value)
              VALUES (?, ?)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value
            `)
            .bind(key, JSON.stringify(value))
            .run();
        }
      }

      // Invalidate KV cache immediately
      await kv.delete(SETTINGS_CACHE_KEY);

      // Audit log
      await logAudit(
        c.get('userId'),
        'UPDATE_SETTINGS',
        'system_settings',
        { keys: Object.keys(body) }
      );

      return c.json({
        success: true,
        message: 'Settings updated and cache invalidated'
      });

    } catch (error) {
      console.error('Settings update error:', error);
      return c.json({ error: 'Failed to update settings' }, { status: 500 });
    }
  }
);

// ============================================================================
// PAYMENT GATEWAY CONFIGURATION
// ============================================================================

/**
 * GET /api/v1/admin/payment-config
 * Return ONLY public payment keys (NOT server secrets)
 */
router.get('/admin/payment-config', async (c) => {
  if (c.get('user')?.role !== 'admin') {
    return c.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const db = c.env.DB;

  try {
    const settings = await db
      .prepare(`
        SELECT key, value FROM system_settings
        WHERE key IN ('active_payment_gateway', 'midtrans_client_key', 'paymu_client_key', 'doku_client_key')
      `)
      .all();

    const config = {};
    for (const setting of settings.results) {
      config[setting.key] = JSON.parse(setting.value);
    }

    return c.json({
      success: true,
      data: config,
      warning: 'Server secrets are configured via Wrangler CLI and not exposed here'
    });

  } catch (error) {
    console.error('Payment config read error:', error);
    return c.json({ error: 'Failed to fetch payment config' }, { status: 500 });
  }
});

/**
 * POST /api/v1/payments/charge (Example)
 * This demonstrates how to use SERVER SECRET from environment
 */
router.post('/payments/charge', async (c) => {
  // Read active gateway from settings (cache/db)
  const settings = await fetch('http://localhost:8787/api/v1/settings').then(r => r.json());
  const activeGateway = settings.data.active_payment_gateway;

  // Read SERVER SECRET from environment (NEVER from database)
  let serverSecret: string;

  if (activeGateway === 'midtrans') {
    serverSecret = c.env.MIDTRANS_SERVER_KEY;
  } else if (activeGateway === 'paymu') {
    serverSecret = c.env.PAYMU_SECRET;
  } else if (activeGateway === 'doku') {
    serverSecret = c.env.DOKU_SECRET;
  }

  // Use serverSecret for backend payment processing
  // Never expose to frontend
  console.log('Processing payment with gateway:', activeGateway);

  return c.json({ success: true });
});

// ============================================================================
// AUDIT LOGGING
// ============================================================================

async function logAudit(actorId: string, action: string, entity: string, details: any) {
  console.log(`[AUDIT] ${action} by ${actorId}`, details);
}

export default router;
```

---

## Frontend Implementation

### 1. PortfolioManager Component

```typescript
// apps/appadmin/src/components/admin/PortfolioManager.tsx

import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { X, Plus, Edit2, Trash2 } from 'lucide-react';

interface Portfolio {
  id: string;
  title: string;
  slug: string;
  category: string;
  cover_image: string;
  client_name: string;
  release_date: string;
  featured: boolean;
  status: string;
}

interface PortfolioFormData {
  title: string;
  description: string;
  content?: string;
  cover_image: string;
  gallery_images: string[];
  category: 'Film' | 'Commercial' | 'Music Video' | 'Event' | 'Other';
  client_name: string;
  release_date: string;
  video_url?: string;
  featured: boolean;
  status: 'draft' | 'published' | 'archived';
}

export default function PortfolioManager() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<PortfolioFormData>>({});
  const queryClient = useQueryClient();

  // Fetch portfolios (admin view - includes drafts)
  const { data: portfolios, isLoading } = useQuery(
    'admin-portfolios',
    async () => {
      const response = await fetch('/api/v1/admin/portfolios');
      return response.json();
    }
  );

  // Create portfolio mutation
  const createMutation = useMutation(
    (data: PortfolioFormData) =>
      fetch('/api/v1/admin/portfolios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(r => r.json()),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-portfolios');
        setIsFormOpen(false);
        setFormData({});
      }
    }
  );

  // Update portfolio mutation
  const updateMutation = useMutation(
    (data: PortfolioFormData) =>
      fetch(`/api/v1/admin/portfolios/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(r => r.json()),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-portfolios');
        setIsFormOpen(false);
        setFormData({});
        setEditingId(null);
      }
    }
  );

  // Delete portfolio mutation
  const deleteMutation = useMutation(
    (id: string) =>
      fetch(`/api/v1/admin/portfolios/${id}`, {
        method: 'DELETE'
      }).then(r => r.json()),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-portfolios');
      }
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate(formData as PortfolioFormData);
    } else {
      createMutation.mutate(formData as PortfolioFormData);
    }
  };

  const handleEdit = (portfolio: Portfolio) => {
    setEditingId(portfolio.id);
    setFormData(portfolio);
    setIsFormOpen(true);
  };

  if (isLoading) return <div>Loading portfolios...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Portfolio Management</h1>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({});
            setIsFormOpen(true);
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={20} /> New Portfolio
        </button>
      </div>

      {/* Portfolio List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {portfolios?.data?.map((portfolio: Portfolio) => (
          <div key={portfolio.id} className="card border rounded-lg overflow-hidden">
            <img
              src={portfolio.cover_image}
              alt={portfolio.title}
              className="w-full h-40 object-cover"
            />
            <div className="p-4 space-y-3">
              <h3 className="font-bold text-lg">{portfolio.title}</h3>
              <p className="text-sm text-gray-600">{portfolio.client_name}</p>
              <div className="flex gap-2">
                <span className={`text-xs px-2 py-1 rounded ${
                  portfolio.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {portfolio.status}
                </span>
                <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                  {portfolio.category}
                </span>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleEdit(portfolio)}
                  className="btn btn-sm btn-secondary flex-1 flex items-center justify-center gap-1"
                >
                  <Edit2 size={16} /> Edit
                </button>
                <button
                  onClick={() => deleteMutation.mutate(portfolio.id)}
                  className="btn btn-sm btn-danger"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Portfolio Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {editingId ? 'Edit Portfolio' : 'New Portfolio'}
              </h2>
              <button onClick={() => setIsFormOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <select
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="">Select category</option>
                  <option value="Film">Film</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Music Video">Music Video</option>
                  <option value="Event">Event</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                  required
                />
              </div>

              {/* Client Name */}
              <div>
                <label className="block text-sm font-medium mb-1">Client Name *</label>
                <input
                  type="text"
                  value={formData.client_name || ''}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              {/* Release Date */}
              <div>
                <label className="block text-sm font-medium mb-1">Release Date *</label>
                <input
                  type="date"
                  value={formData.release_date || ''}
                  onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              {/* Cover Image */}
              <div>
                <label className="block text-sm font-medium mb-1">Cover Image URL *</label>
                <input
                  type="url"
                  value={formData.cover_image || ''}
                  onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="https://..."
                  required
                />
              </div>

              {/* Status */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.featured || false}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  />
                  <span className="text-sm font-medium">Featured</span>
                </label>
                <select
                  value={formData.status || 'published'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="border rounded px-3 py-2"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Submit */}
              <div className="flex gap-2 pt-6">
                <button type="submit" className="btn btn-primary flex-1">
                  {createMutation.isLoading || updateMutation.isLoading
                    ? 'Saving...'
                    : editingId ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
```

### 2. GlobalSettings Component

```typescript
// apps/appadmin/src/components/admin/GlobalSettings.tsx

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Save, AlertCircle } from 'lucide-react';

interface GlobalSettings {
  app_name: string;
  app_title: string;
  app_description: string;
  app_logo: string;
  contact_wa_talent: string;
  contact_wa_client: string;
  active_payment_gateway: 'midtrans' | 'paymu' | 'doku';
  midtrans_client_key: string;
  paymu_client_key: string;
  doku_client_key: string;
  seo_keywords: string;
  currency: string;
}

export default function GlobalSettings() {
  const [settings, setSettings] = useState<Partial<GlobalSettings>>({});
  const [activeTab, setActiveTab] = useState('general');
  const queryClient = useQueryClient();

  // Fetch current settings
  const { data: currentSettings, isLoading } = useQuery(
    'global-settings',
    async () => {
      const response = await fetch('/api/v1/admin/settings');
      return response.json();
    },
    {
      onSuccess: (data) => {
        setSettings(data.data);
      }
    }
  );

  // Update settings mutation
  const updateMutation = useMutation(
    (updatedSettings: Partial<GlobalSettings>) =>
      fetch('/api/v1/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      }).then(r => r.json()),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('global-settings');
        alert('Settings updated successfully!');
      }
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(settings as GlobalSettings);
  };

  if (isLoading) return <div>Loading settings...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Global Settings</h1>

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 font-medium border-b-2 ${
            activeTab === 'general'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600'
          }`}
        >
          General
        </button>
        <button
          onClick={() => setActiveTab('payment')}
          className={`px-4 py-2 font-medium border-b-2 ${
            activeTab === 'payment'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600'
          }`}
        >
          Payment Gateway
        </button>
        <button
          onClick={() => setActiveTab('contact')}
          className={`px-4 py-2 font-medium border-b-2 ${
            activeTab === 'contact'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600'
          }`}
        >
          Contact Info
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 space-y-6">
        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">App Name</label>
              <input
                type="text"
                value={settings.app_name || ''}
                onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">SEO Page Title</label>
              <input
                type="text"
                value={settings.app_title || ''}
                onChange={(e) => setSettings({ ...settings, app_title: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">SEO Meta Description</label>
              <textarea
                value={settings.app_description || ''}
                onChange={(e) => setSettings({ ...settings, app_description: e.target.value })}
                className="w-full border rounded px-3 py-2"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Logo URL (R2)</label>
              <input
                type="url"
                value={settings.app_logo || ''}
                onChange={(e) => setSettings({ ...settings, app_logo: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="https://r2.example.com/logo.png"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">SEO Keywords</label>
              <input
                type="text"
                value={settings.seo_keywords || ''}
                onChange={(e) => setSettings({ ...settings, seo_keywords: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="talent, booking, film"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Currency</label>
              <select
                value={settings.currency || 'IDR'}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="IDR">IDR (Indonesian Rupiah)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="SGD">SGD (Singapore Dollar)</option>
              </select>
            </div>
          </div>
        )}

        {/* Payment Tab */}
        {activeTab === 'payment' && (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4 flex gap-3">
              <AlertCircle className="text-yellow-600 flex-shrink-0" />
              <p className="text-sm text-yellow-800">
                Server secrets must be configured via <code className="bg-yellow-100 px-2 py-1 rounded">wrangler secret put</code> CLI.
                Only Client/Public keys are configured here.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Active Payment Gateway</label>
              <select
                value={settings.active_payment_gateway || 'midtrans'}
                onChange={(e) => setSettings({ ...settings, active_payment_gateway: e.target.value as any })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="midtrans">Midtrans</option>
                <option value="paymu">PayMu</option>
                <option value="doku">DOKU</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Midtrans Client Key (Public)</label>
              <input
                type="text"
                value={settings.midtrans_client_key || ''}
                onChange={(e) => setSettings({ ...settings, midtrans_client_key: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="Mid-client-XXXXXXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">PayMu Client Key (Public)</label>
              <input
                type="text"
                value={settings.paymu_client_key || ''}
                onChange={(e) => setSettings({ ...settings, paymu_client_key: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="PU-XXXXXXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">DOKU Client Key (Public)</label>
              <input
                type="text"
                value={settings.doku_client_key || ''}
                onChange={(e) => setSettings({ ...settings, doku_client_key: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="DOKU-XXXXXXXX"
              />
            </div>
          </div>
        )}

        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">WhatsApp - Talent Inquiries</label>
              <input
                type="tel"
                value={settings.contact_wa_talent || ''}
                onChange={(e) => setSettings({ ...settings, contact_wa_talent: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="+62812345678"
              />
              <p className="text-xs text-gray-500 mt-1">Format: +country_code + number</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">WhatsApp - Client Inquiries</label>
              <input
                type="tel"
                value={settings.contact_wa_client || ''}
                onChange={(e) => setSettings({ ...settings, contact_wa_client: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="+62812345679"
              />
              <p className="text-xs text-gray-500 mt-1">Format: +country_code + number</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-2 pt-6 border-t">
          <button
            type="submit"
            className="btn btn-primary flex items-center gap-2"
            disabled={updateMutation.isLoading}
          >
            <Save size={20} />
            {updateMutation.isLoading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

---

## KV Caching Strategy

### How KV Enhances Performance

1. **Initial Read (Cache Miss)**
   - Request: GET /api/v1/settings
   - Check KV: Not found
   - Hit Database: 50-100ms
   - Save to KV: < 5ms
   - Total: ~100ms

2. **Subsequent Reads (Cache Hit)**
   - Request: GET /api/v1/settings
   - Check KV: Found
   - Return immediately: < 5ms
   - Total: ~5ms

3. **After Update**
   - Admin updates setting
   - Database updated: 50ms
   - KV cache invalidated (deleted): 10ms
   - Next read goes to database again
   - Process repeats

### Cache Invalidation Best Practices

```typescript
// Good: Delete immediately after update
await kv.delete(SETTINGS_CACHE_KEY);

// Bad: Rely on TTL expiration (staleness)
// KV caches data, might serve stale data for up to 1 hour

// Smart: Use versioned cache keys
const cacheKey = `settings:v1:2026-04-09`;
// Update version on breaking changes
```

---

## Payment Gateway Setup

### Secure Secrets Configuration

**NEVER store in database:**
```typescript
// ❌ WRONG
const secret = settings.data.midtrans_server_key;  // Don't do this!
```

**ALWAYS use environment:**
```typescript
// ✅ CORRECT
const secret = c.env.MIDTRANS_SERVER_KEY;  // From Cloudflare secrets
```

**Setup in wrangler.toml:**
```toml
[env.production]
vars = { MIDTRANS_CLIENT_KEY = "Mid-client-XXXX" }

# Secrets (via CLI):
# wrangler secret put MIDTRANS_SERVER_KEY
# (Paste secret when prompted, it won't be stored in code)
```

---

## Security Checklist

- ✅ Admin endpoints require `requireAdmin` middleware
- ✅ Payment server secrets ONLY from environment
- ✅ Client keys can be in database/settings
- ✅ Portfolio soft deletes (not hard deletes)
- ✅ Audit logging for all admin actions
- ✅ KV cache invalidated after updates
- ✅ Input validation on all form fields
- ✅ CORS configured for public portfolio API
- ✅ Rate limiting on portfolio list endpoint
- ✅ No PII in portfolio data

---

## Implementation Roadmap

### Week 1: Database & API Foundation
- [ ] Create portfolios table (D1)
- [ ] Create system_settings table (D1)
- [ ] Implement portfolio CRUD endpoints
- [ ] Implement settings endpoints with KV
- [ ] Setup audit logging

### Week 2: Frontend Components
- [ ] Build PortfolioManager component
- [ ] Build GlobalSettings component
- [ ] Implement form validation
- [ ] Add success/error notifications
- [ ] Test all CRUD operations

### Week 3: Integration & Optimization
- [ ] Test KV caching behavior
- [ ] Verify cache invalidation
- [ ] Load test endpoints
- [ ] Setup monitoring/logging
- [ ] Create admin documentation

### Week 4: Public API & Polish
- [ ] Ensure public portfolio API works
- [ ] Test from external domain
- [ ] Setup CORS properly
- [ ] Create public portfolio page (if needed)
- [ ] Deploy to production

---

**Status:** Ready for Implementation  
**Estimated Timeline:** 4 weeks  
**Next Steps:** Start with database schema and API endpoints  

---

*Created: April 9, 2026*
