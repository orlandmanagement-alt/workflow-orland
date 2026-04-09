# MISSION 1: Premium Tiers, Agency Role, and Secure Feature Gating

**Project:** Orland Management SaaS  
**Mission:** 1  
**Date:** April 9, 2026  
**Status:** Design & Implementation Guide

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Feature Gating Logic](#feature-gating-logic)
7. [API Security](#api-security)
8. [Implementation Roadmap](#implementation-roadmap)

---

## Overview

Mission 1 introduces three critical monetization and role management features:

### **1. Premium Tiers System**
- Free and Premium account tiers
- Tiered feature access (media uploads, profile views, contact visibility)
- Backend data masking for free users
- Tier-based API endpoints

### **2. Agency Role & Management**
- New "Agency" user role (B2B)
- Agency dashboard for managing multiple talents (roster)
- Direct contact redirection for agency-managed talents
- Batch operations (bulk apply to projects)

### **3. Secure Feature Gating**
- Backend-enforced access controls
- Data masking for free users (email, phone, social)
- Premium client bypass for talent restrictions
- Middleware-protected premium endpoints

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Applications                    │
├─────────────────────────────────────────────────────────────┤
│  AppTalent (Talent)  │  AppClient (Client)  │  AppAgency    │
│  Profile Setup       │  Search/Browse       │  Roster Mgmt  │
│  Media Uploads       │  Contact View        │  Batch Apply  │
└─────────────────────────────────────────────────────────────┘
           ↓                    ↓                     ↓
┌─────────────────────────────────────────────────────────────┐
│              Hono.js Backend API with Gating               │
├─────────────────────────────────────────────────────────────┤
│  Middleware:                                                │
│  ├─ requireAuth        → Check JWT validity                │
│  ├─ requirePremium     → Check account_tier                │
│  ├─ requireAgency      → Check role === 'agency'           │
│  └─ maskDataForFree    → Redact PII for free users         │
│                                                             │
│  Public Routes:                                             │
│  ├─ GET /public/talents/:id (with masking)                │
│  ├─ GET /public/agency/:id/roster (list talents)          │
│  └─ GET /public/talents/search (filtered results)         │
│                                                             │
│  Protected Routes:                                          │
│  ├─ POST /talents/media (requires auth)                   │
│  ├─ GET /talents/contacts (requires premium/owner)        │
│  └─ POST /agency/projects/:id/apply (batch)               │
└─────────────────────────────────────────────────────────────┘
         ↓                      ↓                      ↓
    ┌──────────┐         ┌──────────────┐      ┌──────────┐
    │  DB_CORE │         │  DB_SSO      │      │    R2    │
    │ users    │         │ users.role   │      │  Media   │
    │ talents  │         │ users.tier   │      │ Uploads  │
    │ agencies │         └──────────────┘      └──────────┘
    └──────────┘
```

---

## Database Schema

### 1. Users Table Modifications (DB_SSO)

```sql
-- Add tier and role columns to users table
ALTER TABLE users ADD COLUMN account_tier TEXT DEFAULT 'free';    -- 'free', 'premium'
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'talent';          -- 'talent', 'client', 'agency', 'admin'
ALTER TABLE users ADD COLUMN tier_expires_at DATETIME;            -- For trial expiration

-- Add indexes for efficient role-based queries
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_tier ON users(account_tier);

-- Example: First-time user is free by default
-- INSERT INTO users (..., account_tier, role) VALUES (..., 'free', 'talent');
```

### 2. Talents Table Modifications (DB_CORE)

```sql
-- Link talent to agency (nullable - direct talent has no agency)
ALTER TABLE talents ADD COLUMN agency_id TEXT;
ALTER TABLE talents ADD COLUMN is_agency_managed INTEGER DEFAULT 0;  -- Soft flag

-- Add analytics fields (for free tier restrictions)
ALTER TABLE talents ADD COLUMN total_media_uploads INTEGER DEFAULT 0;
ALTER TABLE talents ADD COLUMN total_views INTEGER DEFAULT 0;

-- Add constraint
CREATE INDEX idx_talents_agency_id ON talents(agency_id);
```

### 3. New Agencies Table (DB_CORE)

```sql
CREATE TABLE agencies (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,           -- FK to users table (one agency per user)
  agency_name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,                          -- Agency branding
  cover_image TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website_url TEXT,
  kyc_status TEXT DEFAULT 'pending',      -- 'pending', 'verified', 'rejected'
  account_tier TEXT DEFAULT 'free',       -- Agencies can also be premium
  total_talents INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME
);

CREATE INDEX idx_agencies_user_id ON agencies(user_id);
CREATE INDEX idx_agencies_kyc_status ON agencies(kyc_status);
```

### 4. Agency-Talent Relationship Table (DB_CORE)

```sql
CREATE TABLE agency_talents (
  id TEXT PRIMARY KEY,
  agency_id TEXT NOT NULL,
  talent_id TEXT NOT NULL,
  role TEXT DEFAULT 'managed',            -- 'managed', 'represented', 'affiliated'
  commission_rate REAL DEFAULT 0.20,      -- Agency typically takes 20%
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(agency_id) REFERENCES agencies(id),
  FOREIGN KEY(talent_id) REFERENCES talents(id),
  UNIQUE(agency_id, talent_id)
);

CREATE INDEX idx_agency_talents_agency ON agency_talents(agency_id);
CREATE INDEX idx_agency_talents_talent ON agency_talents(talent_id);
```

### 5. Media Upload Table (DB_CORE)

```sql
-- Update existing talent_media table or create new one
CREATE TABLE IF NOT EXISTS talent_media (
  id TEXT PRIMARY KEY,
  talent_id TEXT NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT,                      -- 'photo', 'video', 'reel'
  is_primary INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(talent_id) REFERENCES talents(id)
);

CREATE INDEX idx_talent_media_talent ON talent_media(talent_id);
```

### Example Data Seed

```sql
-- Create free user
INSERT INTO users (id, full_name, email, phone, password_hash, role, account_tier, created_at)
VALUES ('user-free-1', 'John Talent', 'john@example.com', '08123456789', 'hashed_pwd', 'talent', 'free', CURRENT_TIMESTAMP);

-- Create premium user
INSERT INTO users (id, full_name, email, phone, password_hash, role, account_tier, created_at)
VALUES ('user-premium-1', 'Jane Actor', 'jane@example.com', '08987654321', 'hashed_pwd', 'talent', 'premium', CURRENT_TIMESTAMP);

-- Create agency user
INSERT INTO users (id, full_name, email, phone, password_hash, role, account_tier, created_at)
VALUES ('user-agency-1', 'Agency Owner', 'agency@example.com', '08555555555', 'hashed_pwd', 'agency', 'free', CURRENT_TIMESTAMP);

-- Create agency record
INSERT INTO agencies (id, user_id, agency_name, description, contact_email, created_at)
VALUES ('agency-1', 'user-agency-1', 'Stellar Agency', 'Top talent management', 'agency@example.com', CURRENT_TIMESTAMP);

-- Link talent to agency
INSERT INTO agency_talents (id, agency_id, talent_id, commission_rate)
VALUES ('link-1', 'agency-1', 'talent-john', 0.20);
```

---

## Backend Implementation

### 1. Middleware for Access Control

```typescript
// apps/appapi/src/middleware/auth.middleware.ts

import { Context } from 'hono';
import { JWT } from '@cloudflare/workers-types';

/**
 * Extract user from JWT and attach to context
 */
export async function authMiddleware(c: Context, next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    c.set('user', null);
    return next();
  }

  try {
    const token = authHeader.substring(7);
    const decoded = await verifyJWT(token, c.env.JWT_SECRET);
    
    c.set('userId', decoded.sub);
    c.set('userRole', decoded.role);
    c.set('userTier', decoded.tier);
    c.set('user', decoded);
    
  } catch (error) {
    console.error('Invalid token:', error);
    c.set('user', null);
  }

  return next();
}

/**
 * Require user to be authenticated
 */
export function requireAuth(c: Context) {
  if (!c.get('user')) {
    return c.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

/**
 * Require user to have premium tier
 */
export function requirePremium(c: Context) {
  requireAuth(c);
  if (c.get('userTier') !== 'premium') {
    return c.json(
      { error: 'This feature requires a premium account' },
      { status: 403 }
    );
  }
}

/**
 * Require user to have agency role
 */
export function requireAgency(c: Context) {
  requireAuth(c);
  if (c.get('userRole') !== 'agency') {
    return c.json(
      { error: 'This feature is only available to agencies' },
      { status: 403 }
    );
  }
}

/**
 * Require admin role
 */
export function requireAdmin(c: Context) {
  requireAuth(c);
  if (c.get('userRole') !== 'admin') {
    return c.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }
}

// Helper: Verify JWT token
async function verifyJWT(token: string, secret: string) {
  // Use your JWT library (jsonwebtoken, jose, etc.)
  // This is pseudo-code
  const decoded = JWT.verify(token, secret);
  return decoded;
}
```

### 2. Data Masking Utility

```typescript
// apps/appapi/src/utils/dataMasking.ts

/**
 * Mask email for free users
 * john.doe@gmail.com → jo***@gmail.com
 */
export function maskEmail(email: string): string {
  if (!email) return email;
  const [name, domain] = email.split('@');
  if (name.length < 3) return `*@${domain}`;
  return `${name.substring(0, 2)}${'*'.repeat(name.length - 2)}@${domain}`;
}

/**
 * Mask phone for free users
 * 08123456789 → 08****6789
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 6) return '****';
  return phone.substring(0, 2) + '*'.repeat(phone.length - 4) + phone.slice(-4);
}

/**
 * Hide social media links
 */
export function hideSocialMedia(socialLinks: any): any {
  if (!socialLinks) return null;
  return {
    instagram: null,
    tiktok: null,
    facebook: null,
    youtube: null
  };
}

/**
 * Get talentprofile with masking based on tier
 * This is called before returning to client
 */
export function maskTalentProfile(
  talent: any,
  requesterTier: string | null,
  isTalentOwner: boolean
): any {
  // If owned by requester or requester is premium, return full data
  if (isTalentOwner || requesterTier === 'premium') {
    return talent;
  }

  // If free user or not logged in, mask sensitive data
  return {
    ...talent,
    email: maskEmail(talent.email),
    phone: maskPhone(talent.phone),
    full_phone_hidden: true,
    instagram: null,
    tiktok: null,
    facebook: null,
    youtube: null,
    socials_hidden: true
  };
}

/**
 * Limit media visibility by tier
 */
export function filterMediaByTier(
  mediaArray: any[],
  requesterTier: string | null,
  talentTier: string
): any[] {
  // Premium talents: show all media to everyone
  if (talentTier === 'premium') {
    return mediaArray;
  }

  // Free talent + free requester: show max 3 photos
  if (requesterTier !== 'premium') {
    return mediaArray.slice(0, 3);
  }

  // Free talent + premium requester: show all
  return mediaArray;
}
```

### 3. Talent Profile Routes with Gating

```typescript
// apps/appapi/src/handlers/talentHandler.ts

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Database } from '@cloudflare/workers-types';
import {
  maskTalentProfile,
  filterMediaByTier,
  maskEmail,
  maskPhone
} from '../utils/dataMasking';
import {
  requireAuth,
  requirePremium,
  authMiddleware
} from '../middleware/auth.middleware';

export interface Env {
  DB: Database;
  R2: R2Bucket;
}

const router = new Hono<{ Bindings: Env }>();

// ============================================================================
// PUBLIC ENDPOINT - Get Talent Profile (with masking)
// ============================================================================

/**
 * GET /api/v1/public/talents/:id
 * Returns talent profile with optional data masking
 */
router.get('/public/talents/:id', authMiddleware, async (c) => {
  const db = c.env.DB;
  const { id } = c.req.param();
  const requesterTier = c.get('userTier');
  const requesterId = c.get('userId');

  try {
    // Fetch talent profile
    const talent = await db
      .prepare('SELECT * FROM talents WHERE id = ? AND is_active = 1')
      .bind(id)
      .first();

    if (!talent) {
      return c.json({ error: 'Talent not found' }, { status: 404 });
    }

    // Fetch media
    const mediaResult = await db
      .prepare('SELECT * FROM talent_media WHERE talent_id = ? ORDER BY sort_order ASC')
      .bind(id)
      .all();

    const media = mediaResult.results || [];

    // Fetch user record to get tier info
    const user = await db
      .prepare('SELECT account_tier FROM users WHERE id = ?')
      .bind(talent.user_id)
      .first();

    const talentTier = user?.account_tier || 'free';
    const isTalentOwner = requesterId === talent.user_id;

    // Apply masking/filtering based on tier
    const maskedProfile = maskTalentProfile(
      talent,
      requesterTier,
      isTalentOwner
    );

    const filteredMedia = filterMediaByTier(
      media,
      requesterTier,
      talentTier
    );

    return c.json({
      success: true,
      data: {
        ...maskedProfile,
        media: filteredMedia,
        _gating: {
          talentTier,
          requesterTier,
          dataMasked: requesterTier !== 'premium' && !isTalentOwner
        }
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return c.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
});

// ============================================================================
// PROTECTED ENDPOINT - Upload Media (with tier restrictions)
// ============================================================================

const MediaUploadSchema = z.object({
  media_url: z.string().url(),
  media_type: z.enum(['photo', 'video', 'reel']),
  is_primary: z.boolean().optional()
});

/**
 * POST /api/v1/talents/me/media
 * Upload media with free tier limits (max 3)
 */
router.post(
  '/talents/me/media',
  authMiddleware,
  zValidator('json', MediaUploadSchema),
  async (c) => {
    const db = c.env.DB;
    const userId = c.get('userId');
    const userTier = c.get('userTier');

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = c.req.valid('json');

    try {
      // Get talent record
      const talent = await db
        .prepare('SELECT id FROM talents WHERE user_id = ?')
        .bind(userId)
        .first();

      if (!talent) {
        return c.json({ error: 'Talent profile not found' }, { status: 404 });
      }

      // Check media count for free users
      if (userTier === 'free') {
        const mediaCount = await db
          .prepare('SELECT COUNT(*) as count FROM talent_media WHERE talent_id = ?')
          .bind(talent.id)
          .first<{ count: number }>();

        if (mediaCount.count >= 3) {
          return c.json(
            {
              error: 'Free accounts can upload maximum 3 photos',
              limit: 3,
              current: mediaCount.count
            },
            { status: 403 }
          );
        }
      }

      // Premium users: check 10 media limit
      if (userTier === 'premium') {
        const mediaCount = await db
          .prepare('SELECT COUNT(*) as count FROM talent_media WHERE talent_id = ?')
          .bind(talent.id)
          .first<{ count: number }>();

        if (mediaCount.count >= 10) {
          return c.json(
            {
              error: 'Premium accounts can upload maximum 10 photos',
              limit: 10,
              current: mediaCount.count
            },
            { status: 403 }
          );
        }
      }

      // Insert media record
      const mediaId = `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      await db
        .prepare(`
          INSERT INTO talent_media (id, talent_id, media_url, media_type, is_primary)
          VALUES (?, ?, ?, ?, ?)
        `)
        .bind(
          mediaId,
          talent.id,
          body.media_url,
          body.media_type,
          body.is_primary ? 1 : 0
        )
        .run();

      // Update talent view
      await db
        .prepare('UPDATE talents SET total_media_uploads = total_media_uploads + 1 WHERE id = ?')
        .bind(talent.id)
        .run();

      return c.json({
        success: true,
        data: { id: mediaId },
        remaining: userTier === 'free' ? 3 - (mediaCount.count + 1) : 10 - (mediaCount.count + 1)
      });

    } catch (error) {
      console.error('Media upload error:', error);
      return c.json({ error: 'Failed to upload media' }, { status: 500 });
    }
  }
);

// ============================================================================
// PROTECTED ENDPOINT - Get Contact Info (Premium Only or Owner)
// ============================================================================

/**
 * GET /api/v1/talents/:id/contacts
 * Return full contact info only for owner or premium users
 */
router.get('/talents/:id/contacts', authMiddleware, async (c) => {
  const db = c.env.DB;
  const { id } = c.req.param();
  const userId = c.get('userId');
  const userTier = c.get('userTier');

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const talent = await db
      .prepare('SELECT user_id, phone, email FROM talents WHERE id = ?')
      .bind(id)
      .first();

    if (!talent) {
      return c.json({ error: 'Talent not found' }, { status: 404 });
    }

    const isTalentOwner = userId === talent.user_id;
    const canViewContacts = isTalentOwner || userTier === 'premium';

    if (!canViewContacts) {
      return c.json(
        {
          error: 'Contact information requires premium account',
          email: maskEmail(talent.email),
          phone: maskPhone(talent.phone)
        },
        { status: 403 }
      );
    }

    // Premium user or owner - return full contacts
    return c.json({
      success: true,
      data: {
        email: talent.email,
        phone: talent.phone,
        whatsapp: talent.phone
      }
    });

  } catch (error) {
    console.error('Contact fetch error:', error);
    return c.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
});

export default router;
```

### 4. Agency Routes

```typescript
// apps/appapi/src/handlers/agencyHandler.ts

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Database } from '@cloudflare/workers-types';
import { requireAuth, requireAgency } from '../middleware/auth.middleware';

export interface Env {
  DB: Database;
}

const router = new Hono<{ Bindings: Env }>();

// ============================================================================
// AGENCY SETUP
// ============================================================================

const AgencyCreateSchema = z.object({
  agency_name: z.string().min(3).max(255),
  description: z.string().max(1000).optional(),
  contact_email: z.string().email(),
  contact_phone: z.string(),
  website_url: z.string().url().optional()
});

/**
 * POST /api/v1/agency/setup
 * Create agency for authenticated user
 */
router.post(
  '/agency/setup',
  authMiddleware,
  zValidator('json', AgencyCreateSchema),
  async (c) => {
    const db = c.env.DB;
    const userId = c.get('userId');

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = c.req.valid('json');

    try {
      // Check if user already has an agency
      const existing = await db
        .prepare('SELECT id FROM agencies WHERE user_id = ?')
        .bind(userId)
        .first();

      if (existing) {
        return c.json(
          { error: 'User already has an agency' },
          { status: 400 }
        );
      }

      // Create agency
      const agencyId = `agency-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      await db
        .prepare(`
          INSERT INTO agencies (
            id, user_id, agency_name, description,
            contact_email, contact_phone, website_url
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          agencyId,
          userId,
          body.agency_name,
          body.description || null,
          body.contact_email,
          body.contact_phone,
          body.website_url || null
        )
        .run();

      // Update user role to agency
      await db
        .prepare('UPDATE users SET role = ? WHERE id = ?')
        .bind('agency', userId)
        .run();

      return c.json(
        {
          success: true,
          data: { agencyId }
        },
        { status: 201 }
      );

    } catch (error) {
      console.error('Agency creation error:', error);
      return c.json({ error: 'Failed to create agency' }, { status: 500 });
    }
  }
);

// ============================================================================
// ROSTER MANAGEMENT
// ============================================================================

const AddTalentSchema = z.object({
  talent_id: z.string(),
  commission_rate: z.number().min(0).max(1).optional()
});

/**
 * POST /api/v1/agency/roster/add
 * Add talent to agency roster
 */
router.post(
  '/agency/roster/add',
  authMiddleware,
  requireAgency,
  zValidator('json', AddTalentSchema),
  async (c) => {
    const db = c.env.DB;
    const userId = c.get('userId');
    const body = c.req.valid('json');

    try {
      // Get agency ID
      const agency = await db
        .prepare('SELECT id FROM agencies WHERE user_id = ?')
        .bind(userId)
        .first();

      if (!agency) {
        return c.json({ error: 'Agency not found' }, { status: 404 });
      }

      // Check if talent exists
      const talent = await db
        .prepare('SELECT id FROM talents WHERE id = ?')
        .bind(body.talent_id)
        .first();

      if (!talent) {
        return c.json({ error: 'Talent not found' }, { status: 404 });
      }

      // Add to roster
      const linkId = `link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      await db
        .prepare(`
          INSERT INTO agency_talents (id, agency_id, talent_id, commission_rate)
          VALUES (?, ?, ?, ?)
        `)
        .bind(
          linkId,
          agency.id,
          body.talent_id,
          body.commission_rate || 0.20
        )
        .run();

      // Update talent agency_id
      await db
        .prepare('UPDATE talents SET agency_id = ? WHERE id = ?')
        .bind(agency.id, body.talent_id)
        .run();

      // Update agency talent count
      await db
        .prepare('UPDATE agencies SET total_talents = total_talents + 1 WHERE id = ?')
        .bind(agency.id)
        .run();

      return c.json({
        success: true,
        data: { linkId }
      });

    } catch (error) {
      console.error('Add talent error:', error);
      return c.json({ error: 'Failed to add talent' }, { status: 500 });
    }
  }
);

// ============================================================================
// PUBLIC AGENCY PROFILE & ROSTER
// ============================================================================

/**
 * GET /api/v1/public/agency/:id
 * Get agency profile (public)
 */
router.get('/public/agency/:id', async (c) => {
  const db = c.env.DB;
  const { id } = c.req.param();

  try {
    const agency = await db
      .prepare(`
        SELECT id, agency_name, description, logo_url, 
               contact_email, contact_phone, website_url, created_at
        FROM agencies
        WHERE id = ? AND deleted_at IS NULL
      `)
      .bind(id)
      .first();

    if (!agency) {
      return c.json({ error: 'Agency not found' }, { status: 404 });
    }

    return c.json({
      success: true,
      data: agency
    });

  } catch (error) {
    console.error('Agency profile error:', error);
    return c.json({ error: 'Failed to fetch agency' }, { status: 500 });
  }
});

/**
 * GET /api/v1/public/agency/:id/roster
 * Get all talents managed by agency (public)
 */
router.get('/public/agency/:id/roster', authMiddleware, async (c) => {
  const db = c.env.DB;
  const { id } = c.req.param();
  const requesterTier = c.get('userTier');

  try {
    // Get talents managed by agency
    const roster = await db
      .prepare(`
        SELECT 
          t.id, t.full_name, t.category, t.base_rate,
          (SELECT COUNT(*) FROM talent_media WHERE talent_id = t.id) as media_count
        FROM agency_talents at
        JOIN talents t ON at.talent_id = t.id
        WHERE at.agency_id = ? AND t.is_active = 1
        ORDER BY t.full_name ASC
      `)
      .bind(id)
      .all();

    return c.json({
      success: true,
      data: (roster.results || []).map(talent => ({
        ...talent,
        contactPhone: requesterTier === 'premium' ? talent.phone : maskPhone(talent.phone)
      }))
    });

  } catch (error) {
    console.error('Roster fetch error:', error);
    return c.json({ error: 'Failed to fetch roster' }, { status: 500 });
  }
});

// ============================================================================
// BATCH APPLY TO PROJECTS
// ============================================================================

const BatchApplySchema = z.object({
  project_id: z.string(),
  talent_ids: z.array(z.string()).min(1).max(50)
});

/**
 * POST /api/v1/agency/projects/:projectId/apply
 * Batch apply agency-managed talents to a project
 */
router.post(
  '/agency/projects/:projectId/apply',
  authMiddleware,
  requireAgency,
  zValidator('json', BatchApplySchema),
  async (c) => {
    const db = c.env.DB;
    const userId = c.get('userId');
    const { projectId } = c.req.param();
    const body = c.req.valid('json');

    try {
      // Get agency
      const agency = await db
        .prepare('SELECT id FROM agencies WHERE user_id = ?')
        .bind(userId)
        .first();

      if (!agency) {
        return c.json({ error: 'Agency not found' }, { status: 404 });
      }

      // Verify all talents belong to agency
      const talentCount = await db
        .prepare(`
          SELECT COUNT(*) as count FROM agency_talents
          WHERE agency_id = ? AND talent_id IN (${body.talent_ids.map(() => '?').join(',')})
        `)
        .bind(agency.id, ...body.talent_ids)
        .first<{ count: number }>();

      if (talentCount.count !== body.talent_ids.length) {
        return c.json(
          { error: 'One or more talents do not belong to your agency' },
          { status: 403 }
        );
      }

      // Create applications for all talents (pseudo-code - implement batch insert)
      const applications = [];

      for (const talentId of body.talent_ids) {
        const appId = `app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        await db
          .prepare(`
            INSERT INTO project_applications (
              id, project_role_id, talent_id, status
            ) VALUES (?, ?, ?, 'applied')
          `)
          .bind(appId, body.project_id, talentId)
          .run();

        applications.push(appId);
      }

      return c.json({
        success: true,
        data: {
          appliedCount: applications.length,
          applicationIds: applications
        }
      });

    } catch (error) {
      console.error('Batch apply error:', error);
      return c.json({ error: 'Failed to apply to project' }, { status: 500 });
    }
  }
);

export default router;
```

---

## Frontend Implementation

### 1. Talent Profile Upload Component

```typescript
// apps/apptalent/src/components/ProfileMediaUpload.tsx

import React, { useState, useEffect } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { talentAPI } from '../services/talent.api';

export default function ProfileMediaUpload() {
  const { user } = useAuth();
  const [mediaCount, setMediaCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxMedia = user?.account_tier === 'premium' ? 10 : 3;
  const remaining = maxMedia - mediaCount;

  useEffect(() => {
    // Fetch current media count
    fetchMediaCount();
  }, []);

  const fetchMediaCount = async () => {
    try {
      const response = await fetch('/api/v1/talents/me/media');
      const data = await response.json();
      setMediaCount(
        (data.data || []).length
      );
    } catch (err) {
      console.error('Failed to fetch media count:', err);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    if (remaining === 0) {
      setError(`You've reached the media limit for ${user?.account_tier || 'free'} accounts`);
      return;
    }

    for (const file of files.slice(0, remaining)) {
      try {
        setUploading(true);
        setError(null);

        // Get presigned URL
        const presignedResponse = await fetch('/media/upload-url', {
          method: 'POST',
          body: JSON.stringify({
            filename: `${user?.id}/${Date.now()}-${file.name}`,
            contentType: file.type
          })
        });

        const { presignedUrl } = await presignedResponse.json();

        // Upload to R2
        await fetch(presignedUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type }
        });

        // Register in database
        await talentAPI.uploadMedia({
          media_url: presignedUrl.split('?')[0],
          media_type: file.type.startsWith('video') ? 'video' : 'photo'
        });

        setMediaCount(prev => prev + 1);

      } catch (err) {
        setError(`Failed to upload ${file.name}`);
        console.error('Upload error:', err);
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div className="card p-6 space-y-4">
      <h3 className="text-xl font-bold">Upload Photos & Videos</h3>

      {/* Tier Info */}
      <div className={`p-3 rounded flex items-start gap-3 ${
        user?.account_tier === 'premium' 
          ? 'bg-blue-50 border border-blue-200'
          : 'bg-yellow-50 border border-yellow-200'
      }`}>
        <AlertCircle size={20} className={
          user?.account_tier === 'premium' ? 'text-blue-600' : 'text-yellow-600'
        } />
        <div className="text-sm">
          <p className="font-medium">
            {user?.account_tier === 'premium'
              ? '✅ Premium Account'
              : '⚠️ Free Account'}
          </p>
          <p className="text-xs mt-1">
            You can upload <strong>{maxMedia} media</strong> items
            ({remaining} remaining)
          </p>
          {user?.account_tier === 'free' && (
            <p className="text-xs mt-2">
              <a href="/upgrade" className="text-blue-600 underline">
                Upgrade to premium
              </a> to upload up to 10 items
            </p>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Upload Area */}
      {remaining > 0 ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            id="media-upload"
            multiple
            accept="image/*,video/*"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
          <label
            htmlFor="media-upload"
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            <Upload size={32} className="text-gray-400" />
            <span className="font-medium">
              {uploading ? 'Uploading...' : 'Click to upload'}
            </span>
            <span className="text-xs text-gray-500">
              {remaining} slots available
            </span>
          </label>
        </div>
      ) : (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-center">
          <p className="text-red-700 font-medium">Media limit reached</p>
          {user?.account_tier === 'free' && (
            <a href="/upgrade" className="text-red-600 underline text-sm mt-2 inline-block">
              Upgrade to add more
            </a>
          )}
        </div>
      )}
    </div>
  );
}
```

### 2. Agency Roster Manager Component

```typescript
// apps/appadmin/src/components/agency/RosterManager.tsx

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, X } from 'lucide-react';

export default function RosterManager() {
  const [isAddingTalent, setIsAddingTalent] = useState(false);
  const [talentSearchId, setTalentSearchId] = useState('');
  const queryClient = useQueryClient();

  // Fetch roster
  const { data: roster, isLoading } = useQuery(
    'agency-roster',
    async () => {
      const response = await fetch('/api/v1/agency/roster');
      return response.json();
    }
  );

  // Add talent mutation
  const addTalentMutation = useMutation(
    (talentId: string) =>
      fetch('/api/v1/agency/roster/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ talent_id: talentId })
      }).then(r => r.json()),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('agency-roster');
        setTalentSearchId('');
        setIsAddingTalent(false);
      }
    }
  );

  // Remove talent mutation
  const removeMutation = useMutation(
    (talentId: string) =>
      fetch(`/api/v1/agency/roster/${talentId}`, {
        method: 'DELETE'
      }).then(r => r.json()),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('agency-roster');
      }
    }
  );

  if (isLoading) return <div>Loading roster...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Talent Roster</h2>
        <button
          onClick={() => setIsAddingTalent(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={20} /> Add Talent
        </button>
      </div>

      {/* Add Talent Modal */}
      {isAddingTalent && (
        <div className="bg-blue-50 border border-blue-200 rounded p-4 space-y-3">
          <input
            type="text"
            placeholder="Search talent by ID or name..."
            value={talentSearchId}
            onChange={(e) => setTalentSearchId(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
          <div className="flex gap-2">
            <button
              onClick={() => addTalentMutation.mutate(talentSearchId)}
              disabled={!talentSearchId || addTalentMutation.isLoading}
              className="btn btn-primary flex-1"
            >
              {addTalentMutation.isLoading ? 'Adding...' : 'Add'}
            </button>
            <button
              onClick={() => setIsAddingTalent(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Roster Table */}
      <div className="bg-white rounded-lg overflow-hidden border">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left font-medium">Talent</th>
              <th className="px-6 py-3 text-left font-medium">Category</th>
              <th className="px-6 py-3 text-left font-medium">Commission</th>
              <th className="px-6 py-3 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {roster?.data?.map((talent: any) => (
              <tr key={talent.id} className="border-t">
                <td className="px-6 py-4">{talent.full_name}</td>
                <td className="px-6 py-4">{talent.category}</td>
                <td className="px-6 py-4">{(talent.commission_rate * 100).toFixed(0)}%</td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => removeMutation.mutate(talent.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {roster?.data?.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No talents in roster. Add one to get started.
          </div>
        )}
      </div>
    </div>
  );
}
```

### 3. Client Premium Feature Indicator

```typescript
// apps/appclient/src/components/TalentCard.tsx

import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Lock } from 'lucide-react';

interface Props {
  talent: any;
  onContactClick: () => void;
}

export default function TalentCard({ talent, onContactClick }: Props) {
  const { user } = useAuth();
  const isPremiumClient = user?.account_tier === 'premium';
  const canSeeFullContacts = isPremiumClient || talent.tier === 'premium';

  return (
    <div className="card border rounded-lg overflow-hidden">
      <img
        src={talent.cover_image}
        alt={talent.full_name}
        className="w-full h-48 object-cover"
      />

      <div className="p-4 space-y-3">
        <h3 className="font-bold text-lg">{talent.full_name}</h3>
        <p className="text-sm text-gray-600">{talent.category}</p>

        {/* Tier Badge */}
        <div className="flex gap-2">
          {talent.tier === 'premium' && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
              ⭐ Premium
            </span>
          )}
          {talent.tier === 'free' && (
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
              Free
            </span>
          )}
        </div>

        {/* Contact Button */}
        {canSeeFullContacts ? (
          <button onClick={onContactClick} className="btn btn-primary w-full">
            View Contact & Inquire
          </button>
        ) : (
          <button className="btn btn-secondary w-full flex items-center justify-center gap-2" disabled>
            <Lock size={16} />
            Contact (Premium Only)
          </button>
        )}

        {!isPremiumClient && !talent.tier === 'premium' && (
          <p className="text-xs text-gray-500 text-center">
            <a href="/upgrade" className="text-blue-600 underline">
              Upgrade to premium
            </a> to view full contact details
          </p>
        )}
      </div>
    </div>
  );
}
```

---

## Feature Gating Logic

### Summary Table

| Feature | Free Talent | Premium Talent | Free Client | Premium Client |
|---------|-----------|--------------|------------|-----------------|
| Profile Visibility | Masked | Full | Masked | Full |
| Email/Phone Visible | No | Yes | No | Yes |
| Social Media Links | No | Yes | No | Yes |
| Media Uploads | 3 max | 10 max | N/A | N/A |
| Contact Info Access | Owner only | Premium required | Premium required | Yes |
| Batch Project Apply | N/A | N/A | N/A | Agency only |

---

## API Security

### Key Security Principles

1. **Backend Masking is Critical**
   - Never rely on frontend hiding
   - Malicious clients can fetch raw API data

2. **JWT Payload Contains Tier & Role**
   - Reduces database queries
   - Enables efficient middleware checks

3. **Middleware Stack**
   ```typescript
   router.post('/protected-route', authMiddleware, requirePremium, handler);
   ```

4. **Audit Sensitive Operations**
   - Log all contact view attempts
   - Monitor tier upgrades/downgrades

---

## Implementation Roadmap

### Week 1: Database & Core API
- [ ] Add tier/role columns to users table
- [ ] Create agencies and agency_talents tables
- [ ] Implement auth middleware
- [ ] Build data masking utilities
- [ ] Create talent profile endpoint with gating

### Week 2: Agency Features
- [ ] Implement agency setup endpoint
- [ ] Build roster management endpoints
- [ ] Add batch apply functionality
- [ ] Create public agency roster API

### Week 3: Frontend Components
- [ ] Build ProfileMediaUpload component
- [ ] Build RosterManager component
- [ ] Create TalentCard with premium indicators
- [ ] Add tier upgrade flow

### Week 4: Testing & Polish
- [ ] Test all gating scenarios
- [ ] Verify masking works correctly
- [ ] Load test media upload endpoints
- [ ] Deploy to staging/production

---

**Status:** Ready for Implementation  
**Estimated Timeline:** 4 weeks  
**Complexity:** Medium-High  
**Priority:** Critical (Monetization Foundation)

---

*Created: April 9, 2026*
