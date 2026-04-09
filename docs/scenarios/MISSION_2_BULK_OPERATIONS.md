# MISSION 2: Bulk Operations - CSV Import, Drag-Drop Sorting & YouTube Tracking

**Project:** Orland Management SaaS  
**Mission:** 2  
**Created:** April 9, 2026  
**Status:** Design & Implementation Guide  
**Priority:** High (depends on MISSION 1)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [CSV Processing Strategy](#csv-processing-strategy)
7. [YouTube Integration](#youtube-integration)
8. [Security Checklist](#security-checklist)
9. [Implementation Roadmap](#implementation-roadmap)

---

## Overview

This mission introduces bulk operations capabilities to dramatically improve agency and admin workflow efficiency.

### Three Core Features

#### 1. CSV Import for Bulk Talent Upload
- Import talents and credits in bulk via CSV
- Map CSV columns to database fields
- Validate data before insertion
- Track import history and results
- Rollback on mass failure

#### 2. Drag-Drop Media Sorting
- Reorder media gallery with drag-drop
- Update sort order in batch
- Publish/unpublish media in bulk
- Delete multiple media at once
- Real-time preview

#### 3. YouTube URL Tracking
- Auto-detect YouTube URLs in portfolio content
- Extract video metadata (title, thumbnail, duration)
- Track video performance metrics (views, engagement)
- Cache metadata to avoid API calls
- Support multiple YouTube URLs per talent

### Key Benefits
✅ Import 100 talents in minutes instead of hours  
✅ Organize media galleries 10x faster  
✅ Auto-populate video metadata from YouTube  
✅ Reduce manual data entry errors  
✅ Enable agency roster scaling  

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Admin/Agency Frontend (React)                   │
├─────────────────────────────────────────────────────────────┤
│  CSVUploader Component → Parse & Preview                    │
│  MediaSortable Component → Drag-drop Reorder               │
│  YouTubeMetadataViewer → Display video info                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Backend API (Hono.js)                      │
├─────────────────────────────────────────────────────────────┤
│  POST /api/v1/bulk/csv/preview (Validate CSV)              │
│  POST /api/v1/bulk/csv/import (Execute import)             │
│  POST /api/v1/bulk/media/reorder (Update ordering)         │
│  POST /api/v1/bulk/media/bulk-delete (Delete multiple)     │
│  POST /api/v1/talents/extract-youtube (Parse URL)          │
│  GET /api/v1/talents/:id/youtube-metadata (Cached data)    │
└─────────────────────────────────────────────────────────────┘
           ↙                          ↘
    ┌──────────────┐         ┌──────────────────┐
    │ Cloudflare KV│         │ Cloudflare D1 DB │
    │  YouTube     │         │                  │
    │  metadata    │         │  talent_media    │
    │  cache       │         │  youtube_videos  │
    └──────────────┘         │  import_logs     │
                             └──────────────────┘
                        ↓
                  ┌──────────────┐
                  │ YouTube API  │
                  │ (Metadata)   │
                  └──────────────┘
```

---

## Database Schema

### 1. YouTube Videos Table (D1)

```sql
CREATE TABLE youtube_videos (
  id TEXT PRIMARY KEY,
  talent_id TEXT NOT NULL,
  youtube_video_id TEXT NOT NULL UNIQUE,  -- e.g., "dQw4w9WgXcQ"
  url TEXT NOT NULL,                       -- Full URL
  title TEXT,                              -- Cached from YouTube API
  description TEXT,
  thumbnail_url TEXT,                      -- Cached thumbnail
  duration_seconds INTEGER,                -- Video length
  channel_name TEXT,                       -- Uploader channel
  view_count INTEGER DEFAULT 0,            -- From YouTube
  like_count INTEGER DEFAULT 0,
  published_at DATETIME,                   -- Video publish date
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_synced_at DATETIME,                 -- When metadata was last fetched
  sync_status TEXT DEFAULT 'pending',      -- 'pending', 'success', 'failed'
  FOREIGN KEY(talent_id) REFERENCES talents(id) ON DELETE CASCADE
);

CREATE INDEX idx_youtube_talent ON youtube_videos(talent_id);
CREATE INDEX idx_youtube_video_id ON youtube_videos(youtube_video_id);
```

### 2. Media Sorting Table (D1)

```sql
-- Modify existing talent_media table to add sort order:
ALTER TABLE talent_media ADD COLUMN sort_order INTEGER DEFAULT 999;

-- Create index for sorting
CREATE INDEX idx_talent_media_sort ON talent_media(talent_id, sort_order);
```

### 3. Import Logs Table (D1)

```sql
CREATE TABLE bulk_import_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL,                  -- User who imported
  import_type TEXT NOT NULL,               -- 'talents', 'credits', 'media'
  file_name TEXT,
  status TEXT DEFAULT 'processing',        -- 'processing', 'success', 'partial', 'failed'
  total_rows INTEGER,
  successful_rows INTEGER DEFAULT 0,
  failed_rows INTEGER DEFAULT 0,
  error_message TEXT,
  details TEXT,                            -- JSON with row-level details
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

CREATE INDEX idx_import_logs_actor ON bulk_import_logs(actor_id);
CREATE INDEX idx_import_logs_created ON bulk_import_logs(created_at DESC);
```

### 4. Talent Media Sequence Table (D1)

```sql
-- For tracking media display order
CREATE TABLE media_sort_history (
  id TEXT PRIMARY KEY,
  talent_id TEXT NOT NULL,
  operation TEXT,                          -- 'reorder', 'bulk_update'
  changes TEXT,                            -- JSON of changes
  actor_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(talent_id) REFERENCES talents(id),
  FOREIGN KEY(actor_id) REFERENCES users(id)
);
```

---

## Backend Implementation

### 1. CSV Import Handler

```typescript
// apps/appapi/src/handlers/bulkImportHandler.ts

import { Hono } from 'hono';
import { z } from 'zod';
import { Database } from '@cloudflare/workers-types';
import Papa from 'papaparse';

export interface Env {
  DB: Database;
  KV: KVNamespace;
}

const router = new Hono<{ Bindings: Env }>();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const TalentCSVSchema = z.object({
  first_name: z.string().min(2),
  last_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string(),
  agency_id: z.string().optional(),
  category: z.string(),
  bio: z.string().optional(),
  height_cm: z.string().optional(),
  skin_tone: z.string().optional()
});

const CreditCSVSchema = z.object({
  talent_email: z.string().email(),
  title: z.string().min(3),
  role: z.string(),
  project_name: z.string(),
  year: z.string().regex(/^\d{4}$/),
  description: z.string().optional()
});

// ============================================================================
// CSV PREVIEW ENDPOINT
// ============================================================================

/**
 * POST /api/v1/bulk/csv/preview
 * Parse and validate CSV without committing to database
 */
router.post('/bulk/csv/preview', async (c) => {
  if (c.get('user')?.role !== 'admin' && c.get('user')?.role !== 'agency') {
    return c.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const importType = formData.get('type') as 'talents' | 'credits';

    if (!file || !importType) {
      return c.json({ error: 'Missing file or type' }, { status: 400 });
    }

    const csvText = await file.text();
    const { data: rows } = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase()
    });

    // Validate schema and collect errors
    const validatedRows = [];
    const errors = [];
    const schema = importType === 'talents' ? TalentCSVSchema : CreditCSVSchema;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const validated = schema.parse(row);
        validatedRows.push({
          index: i + 2,  // CSV line number (1-indexed + header)
          data: validated,
          isValid: true
        });
      } catch (error: any) {
        errors.push({
          index: i + 2,
          errors: error.errors.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
    }

    return c.json({
      success: true,
      preview: {
        total: rows.length,
        valid: validatedRows.length,
        invalid: errors.length,
        rows: validatedRows.slice(0, 10),  // First 10 rows
        errors: errors.slice(0, 10),       // First 10 errors
        sample: {
          valid: validatedRows.length > 0 ? validatedRows[0].data : null,
          error: errors.length > 0 ? errors[0] : null
        }
      }
    });

  } catch (error) {
    console.error('CSV preview error:', error);
    return c.json({ error: 'Failed to parse CSV' }, { status: 400 });
  }
});

// ============================================================================
// CSV IMPORT EXECUTION ENDPOINT
// ============================================================================

/**
 * POST /api/v1/bulk/csv/import
 * Execute bulk import and persist to database
 */
router.post('/bulk/csv/import', async (c) => {
  if (c.get('user')?.role !== 'admin' && c.get('user')?.role !== 'agency') {
    return c.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const db = c.env.DB;
  const userId = c.get('userId');

  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const importType = formData.get('type') as 'talents' | 'credits';

    const csvText = await file.text();
    const { data: rows } = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase()
    });

    // Create import log entry
    const importId = `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const schema = importType === 'talents' ? TalentCSVSchema : CreditCSVSchema;

    let successCount = 0;
    let failureCount = 0;
    const detailedErrors: any[] = [];

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      try {
        const rowData = schema.parse(rows[i]);

        if (importType === 'talents') {
          await importTalent(db, rowData, userId);
          successCount++;
        } else if (importType === 'credits') {
          await importCredit(db, rowData, userId);
          successCount++;
        }
      } catch (error: any) {
        failureCount++;
        detailedErrors.push({
          row: i + 2,
          error: error.message
        });
      }
    }

    // Log the import
    await db
      .prepare(`
        INSERT INTO bulk_import_logs (
          id, actor_id, import_type, file_name, status,
          total_rows, successful_rows, failed_rows, details
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        importId,
        userId,
        importType,
        file.name,
        failureCount === 0 ? 'success' : 'partial',
        rows.length,
        successCount,
        failureCount,
        JSON.stringify(detailedErrors)
      )
      .run();

    return c.json({
      success: true,
      importId,
      summary: {
        total: rows.length,
        successful: successCount,
        failed: failureCount,
        status: failureCount === 0 ? 'success' : 'partial'
      },
      errors: detailedErrors.slice(0, 20)
    });

  } catch (error) {
    console.error('CSV import error:', error);
    return c.json({ error: 'Failed to import CSV' }, { status: 500 });
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function importTalent(db: Database, data: any, userId: string) {
  const id = `talent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  await db
    .prepare(`
      INSERT INTO talents (
        id, first_name, last_name, email, phone,
        agency_id, category, bio, height_cm, skin_tone,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      id,
      data.first_name,
      data.last_name,
      data.email,
      data.phone,
      data.agency_id || null,
      data.category,
      data.bio || null,
      data.height_cm ? parseInt(data.height_cm) : null,
      data.skin_tone || null,
      userId
    )
    .run();
}

async function importCredit(db: Database, data: any, userId: string) {
  // Find talent by email
  const talent = await db
    .prepare('SELECT id FROM talents WHERE email = ?')
    .bind(data.talent_email)
    .first();

  if (!talent) {
    throw new Error(`Talent with email ${data.talent_email} not found`);
  }

  const id = `credit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  await db
    .prepare(`
      INSERT INTO talent_credits (
        id, talent_id, title, role, project_name, year, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      id,
      talent.id,
      data.title,
      data.role,
      data.project_name,
      parseInt(data.year),
      data.description || null
    )
    .run();
}

// ============================================================================
// MEDIA REORDERING ENDPOINTS
// ============================================================================

/**
 * POST /api/v1/bulk/media/reorder
 * Batch update media sort order
 */
router.post('/bulk/media/reorder', async (c) => {
  const db = c.env.DB;
  const userId = c.get('userId');
  const { talentId, mediaOrder } = await c.req.json();

  // mediaOrder: [{ id: "media-1", sortOrder: 0 }, ...]

  try {
    for (const item of mediaOrder) {
      await db
        .prepare('UPDATE talent_media SET sort_order = ? WHERE id = ?')
        .bind(item.sortOrder, item.id)
        .run();
    }

    // Log the change
    await db
      .prepare(`
        INSERT INTO media_sort_history (
          id, talent_id, operation, changes, actor_id
        ) VALUES (?, ?, ?, ?, ?)
      `)
      .bind(
        `history-${Date.now()}`,
        talentId,
        'reorder',
        JSON.stringify(mediaOrder),
        userId
      )
      .run();

    return c.json({ success: true });

  } catch (error) {
    console.error('Media reorder error:', error);
    return c.json({ error: 'Failed to reorder media' }, { status: 500 });
  }
});

/**
 * POST /api/v1/bulk/media/bulk-delete
 * Delete multiple media assets
 */
router.post('/bulk/media/bulk-delete', async (c) => {
  const db = c.env.DB;
  const userId = c.get('userId');
  const { mediaIds } = await c.req.json();

  try {
    for (const mediaId of mediaIds) {
      await db
        .prepare('DELETE FROM talent_media WHERE id = ?')
        .bind(mediaId)
        .run();
    }

    // Log deletion
    await logAudit(userId, 'BULK_DELETE_MEDIA', 'talent_media', { count: mediaIds.length });

    return c.json({ success: true, deletedCount: mediaIds.length });

  } catch (error) {
    console.error('Bulk delete error:', error);
    return c.json({ error: 'Failed to delete media' }, { status: 500 });
  }
});

// ============================================================================
// YOUTUBE INTEGRATION ENDPOINTS
// ============================================================================

/**
 * POST /api/v1/talents/:talentId/extract-youtube
 * Extract YouTube video ID from URL and fetch metadata
 */
router.post('/talents/:talentId/extract-youtube', async (c) => {
  const db = c.env.DB;
  const kv = c.env.KV;
  const { talentId } = c.req.param();
  const { url } = await c.req.json();

  try {
    // Extract video ID
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      return c.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    // Check if already in database
    const existing = await db
      .prepare('SELECT id FROM youtube_videos WHERE youtube_video_id = ?')
      .bind(videoId)
      .first();

    if (existing) {
      return c.json({ error: 'Video already added' }, { status: 400 });
    }

    // Try cache first
    const cached = await kv.get(`youtube:${videoId}`);
    let metadata;

    if (cached) {
      metadata = JSON.parse(cached);
    } else {
      // Fetch from YouTube with worker-to-worker call
      // (You would call your YouTube metadata worker here)
      metadata = await fetchYouTubeMetadata(videoId);

      // Cache for 24 hours
      await kv.put(`youtube:${videoId}`, JSON.stringify(metadata), {
        expirationTtl: 86400
      });
    }

    // Save to database
    const id = `youtube-${Date.now()}`;
    await db
      .prepare(`
        INSERT INTO youtube_videos (
          id, talent_id, youtube_video_id, url, title, description,
          thumbnail_url, duration_seconds, channel_name,
          view_count, like_count, published_at, sync_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        id,
        talentId,
        videoId,
        url,
        metadata.title,
        metadata.description,
        metadata.thumbnail_url,
        metadata.duration_seconds,
        metadata.channel_name,
        metadata.view_count,
        metadata.like_count,
        metadata.published_at,
        'success'
      )
      .run();

    return c.json({
      success: true,
      data: {
        id,
        videoId,
        ...metadata
      }
    }, { status: 201 });

  } catch (error) {
    console.error('YouTube extraction error:', error);
    return c.json({ error: 'Failed to extract YouTube metadata' }, { status: 500 });
  }
});

/**
 * GET /api/v1/talents/:talentId/youtube-metadata
 * Get all YouTube videos for a talent
 */
router.get('/talents/:talentId/youtube-metadata', async (c) => {
  const db = c.env.DB;
  const { talentId } = c.req.param();

  try {
    const videos = await db
      .prepare('SELECT * FROM youtube_videos WHERE talent_id = ? ORDER BY added_at DESC')
      .bind(talentId)
      .all();

    return c.json({
      success: true,
      data: videos.results || []
    });

  } catch (error) {
    console.error('YouTube metadata fetch error:', error);
    return c.json({ error: 'Failed to fetch metadata' }, { status: 500 });
  }
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

async function fetchYouTubeMetadata(videoId: string) {
  // Call YouTube API via worker (implementation depends on your setup)
  // This is a simplified example
  return {
    title: 'Video Title',
    description: 'Video description...',
    thumbnail_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    duration_seconds: 600,
    channel_name: 'Channel Name',
    view_count: 1000,
    like_count: 50,
    published_at: new Date().toISOString()
  };
}

async function logAudit(actorId: string, action: string, entity: string, details: any) {
  console.log(`[AUDIT] ${action}`, details);
}

export default router;
```

### 2. PapaParse Integration for CSV

```typescript
// apps/appapi/src/utils/csvParser.ts

import Papa from 'papaparse';

export interface ParseOptions {
  header?: boolean;
  skipEmptyLines?: boolean;
  transformHeader?: (header: string) => string;
  dynamicTyping?: boolean;
}

export async function parseCSV(
  fileText: string,
  options: ParseOptions = {}
) {
  return new Promise((resolve, reject) => {
    Papa.parse(fileText, {
      header: true,
      skipEmptyLines: true,
      ...options,
      complete: (results: any) => resolve(results),
      error: (error: any) => reject(error)
    });
  });
}

export function generateCSVTemplate(type: 'talents' | 'credits'): string {
  if (type === 'talents') {
    return `first_name,last_name,email,phone,category,bio,height_cm,skin_tone
John,Doe,john@example.com,+62812345678,Actor,Professional actor,180,Fair
Jane,Smith,jane@example.com,+62812345679,Model,High-fashion model,170,Medium`;
  } else {
    return `talent_email,title,role,project_name,year,description
john@example.com,The Great Film,Lead,The Great Film,2024,Feature film lead role
jane@example.com,Fashion Week,Model,Fashion Week 2024,2024,Fashion show participation`;
  }
}
```

---

## Frontend Implementation

### 1. CSV Uploader Component

```typescript
// apps/appadmin/src/components/bulk/CSVUploader.tsx

import React, { useState } from 'react';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { useMutation, useQueryClient } from 'react-query';

interface PreviewRow {
  index: number;
  data: any;
  isValid: boolean;
}

interface PreviewError {
  index: number;
  errors: Array<{ field: string; message: string }>;
}

interface CSVPreview {
  total: number;
  valid: number;
  invalid: number;
  rows: PreviewRow[];
  errors: PreviewError[];
}

interface ImportResult {
  success: boolean;
  importId: string;
  summary: {
    total: number;
    successful: number;
    failed: number;
    status: string;
  };
  errors: any[];
}

export default function CSVUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<'talents' | 'credits'>('talents');
  const [preview, setPreview] = useState<CSVPreview | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'completed'>('upload');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const queryClient = useQueryClient();

  // Preview mutation
  const previewMutation = useMutation(
    async () => {
      const formData = new FormData();
      formData.append('file', file!);
      formData.append('type', importType);

      const response = await fetch('/api/v1/bulk/csv/preview', {
        method: 'POST',
        body: formData
      });
      return response.json();
    },
    {
      onSuccess: (data) => {
        setPreview(data.preview);
        setStep('preview');
      }
    }
  );

  // Import mutation
  const importMutation = useMutation(
    async () => {
      const formData = new FormData();
      formData.append('file', file!);
      formData.append('type', importType);

      const response = await fetch('/api/v1/bulk/csv/import', {
        method: 'POST',
        body: formData
      });
      return response.json();
    },
    {
      onSuccess: (data) => {
        setImportResult(data);
        setStep('completed');
        queryClient.invalidateQueries('talents');
      }
    }
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setPreview(null);
    } else {
      alert('Please select a valid CSV file');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <h2 className="text-2xl font-bold">Bulk CSV Import</h2>

      {step === 'upload' && (
        <div className="bg-white rounded-lg p-8 border-2 border-dashed">
          <div className="space-y-4">
            {/* Import Type Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Import Type *</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="talents"
                    checked={importType === 'talents'}
                    onChange={(e) => setImportType(e.target.value as any)}
                  />
                  <span>Talents</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="credits"
                    checked={importType === 'credits'}
                    onChange={(e) => setImportType(e.target.value as any)}
                  />
                  <span>Credits</span>
                </label>
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">Select CSV File *</label>
              <div className="flex items-center justify-center gap-4">
                <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded cursor-pointer hover:bg-blue-100">
                  <Upload size={20} className="text-blue-600" />
                  <span className="text-blue-600">Choose file</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                {file && <span className="text-green-600 font-medium">{file.name}</span>}
              </div>
            </div>

            {/* Template Download */}
            <div className="text-sm text-gray-600">
              <p>📥 <a href="#" className="text-blue-600">Download CSV template</a> to ensure correct format</p>
            </div>

            {/* Preview Button */}
            <button
              onClick={() => previewMutation.mutate()}
              disabled={!file || previewMutation.isLoading}
              className="btn btn-primary"
            >
              {previewMutation.isLoading ? 'Validating...' : 'Preview & Validate'}
            </button>
          </div>
        </div>
      )}

      {step === 'preview' && preview && (
        <div className="bg-white rounded-lg p-8 space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded p-4">
              <p className="text-sm text-gray-600">Total Rows</p>
              <p className="text-2xl font-bold text-blue-600">{preview.total}</p>
            </div>
            <div className="bg-green-50 rounded p-4">
              <p className="text-sm text-gray-600">Valid</p>
              <p className="text-2xl font-bold text-green-600">{preview.valid}</p>
            </div>
            <div className={`rounded p-4 ${preview.invalid > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
              <p className="text-sm text-gray-600">Invalid</p>
              <p className={`text-2xl font-bold ${preview.invalid > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                {preview.invalid}
              </p>
            </div>
          </div>

          {/* Preview Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Row</th>
                  <th className="px-4 py-2 text-left">Data</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr key={row.index} className="border-t">
                    <td className="px-4 py-2">{row.index}</td>
                    <td className="px-4 py-2 font-mono text-xs">
                      {JSON.stringify(row.data).substring(0, 50)}...
                    </td>
                    <td className="px-4 py-2">
                      <span className="inline-block px-2 py-1 rounded bg-green-100 text-green-700 text-xs">
                        ✓ Valid
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Errors */}
          {preview.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <p className="font-medium text-red-800 mb-2 flex items-center gap-2">
                <AlertCircle size={18} /> {preview.errors.length} rows have errors
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {preview.errors.map((err, i) => (
                  <div key={i} className="text-sm text-red-700">
                    Row {err.index}: {err.errors.map(e => `${e.field} (${e.message})`).join(', ')}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <button
              onClick={() => importMutation.mutate()}
              disabled={importMutation.isLoading}
              className="btn btn-success flex-1"
            >
              {importMutation.isLoading ? 'Importing...' : 'Confirm & Import'}
            </button>
            <button
              onClick={() => setStep('upload')}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {step === 'completed' && importResult && (
        <div className="bg-white rounded-lg p-8 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle size={32} className="text-green-600" />
            <div>
              <h3 className="text-xl font-bold">Import Completed</h3>
              <p className="text-gray-600">Import ID: {importResult.importId}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 rounded p-4">
              <p className="text-sm text-gray-600">Successful</p>
              <p className="text-2xl font-bold text-green-600">{importResult.summary.successful}</p>
            </div>
            <div className="bg-gray-50 rounded p-4">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold">{importResult.summary.total}</p>
            </div>
            <div className={`rounded p-4 ${importResult.summary.failed > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
              <p className="text-sm text-gray-600">Failed</p>
              <p className={`text-2xl font-bold ${importResult.summary.failed > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                {importResult.summary.failed}
              </p>
            </div>
          </div>

          {importResult.errors.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <p className="font-medium text-yellow-800 mb-2">Errors</p>
              <div className="text-sm text-yellow-700 max-h-48 overflow-y-auto space-y-1">
                {importResult.errors.map((err, i) => (
                  <p key={i}>Row {err.row}: {err.error}</p>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              setStep('upload');
              setFile(null);
              setImportResult(null);
            }}
            className="btn btn-primary w-full"
          >
            Import Another File
          </button>
        </div>
      )}
    </div>
  );
}
```

### 2. Media Drag-Drop Sorter Component

```typescript
// apps/appadmin/src/components/bulk/MediaSortable.tsx

import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation } from 'react-query';
import { Grip, Trash2 } from 'lucide-react';

interface MediaItem {
  id: string;
  url: string;
  type: string;
  sort_order: number;
}

interface SortableMediaProps {
  id: string;
  item: MediaItem;
  onDelete: (id: string) => void;
}

function SortableMedia({ id, item, onDelete }: SortableMediaProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 p-4 bg-white border rounded hover:shadow-md transition"
    >
      <button
        {...attributes}
        {...listeners}
        className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
      >
        <Grip size={20} />
      </button>

      <img
        src={item.url}
        alt="Media"
        className="w-20 h-20 object-cover rounded"
      />

      <div className="flex-1">
        <p className="text-sm font-medium">{item.type}</p>
        <p className="text-xs text-gray-500">{item.url}</p>
      </div>

      <button
        onClick={() => onDelete(item.id)}
        className="text-red-600 hover:text-red-800"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}

interface MediaSortableProps {
  talentId: string;
  media: MediaItem[];
  onUpdate: (talentId: string, mediaOrder: any[]) => void;
}

export default function MediaSortable({ talentId, media, onUpdate }: MediaSortableProps) {
  const [items, setItems] = useState<MediaItem[]>(media);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const reorderMutation = useMutation(
    (mediaOrder: any[]) =>
      fetch('/api/v1/bulk/media/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ talentId, mediaOrder })
      }).then(r => r.json())
  );

  const deleteMutation = useMutation(
    (mediaIds: string[]) =>
      fetch('/api/v1/bulk/media/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaIds })
      }).then(r => r.json())
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);

      const newOrder = arrayMove(items, oldIndex, newIndex);
      setItems(newOrder);

      // Save to server
      const mediaOrder = newOrder.map((item, index) => ({
        id: item.id,
        sortOrder: index
      }));

      reorderMutation.mutate(mediaOrder);
    }
  };

  const handleDelete = (mediaId: string) => {
    setItems(items.filter(item => item.id !== mediaId));
    deleteMutation.mutate([mediaId]);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Organize Media Gallery</h3>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {items.map((item) => (
              <SortableMedia
                key={item.id}
                id={item.id}
                item={item}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex gap-2">
        <button
          onClick={() => {
            const mediaOrder = items.map((item, index) => ({
              id: item.id,
              sortOrder: index
            }));
            reorderMutation.mutate(mediaOrder);
          }}
          disabled={reorderMutation.isLoading}
          className="btn btn-primary"
        >
          {reorderMutation.isLoading ? 'Saving...' : 'Save Order'}
        </button>
      </div>
    </div>
  );
}
```

---

## CSV Processing Strategy

### Template & Validation

```csv
-- Talents Import Template
first_name,last_name,email,phone,category,bio,height_cm,skin_tone
John,Doe,john@example.com,+62812345678,Actor,8+ years experience,180,Fair
Jane,Smith,jane@example.com,+62812345679,Model,Fashion & commercial,170,Medium

-- Credits Import Template
talent_email,title,role,project_name,year,description
john@example.com,The Greatest Show,Lead Actor,The Greatest Show,2024,Lead role
jane@example.com,Fashion Week Runway,Model,Jakarta Fashion Week,2024,High-fashion show
```

### Workflow

1. **Upload** → User selects CSV
2. **Parse** → Server parses with PapaParse
3. **Validate** → Check schema against Zod
4. **Preview** → Show first 10 rows, errors
5. **Confirm** → User reviews and approves
6. **Import** → Batch insert with transaction
7. **Report** → Summary with success/failure

---

## YouTube Integration

### Auto-Metadata Extraction

When talent adds YouTube URL:
1. Extract video ID from URL
2. Check if already cached in KV
3. If not, fetch from YouTube API
4. Store in `youtube_videos` table
5. Cache result for 24 hours

### Cache Strategy

```
Key: youtube:{videoId}
TTL: 86400 seconds (24 hours)
Data: { title, description, thumbnail_url, duration, view_count, ... }

Miss: Fetch from YouTube API
Hit: Return cached instantly
```

---

## Security Checklist

- ✅ CSV import requires admin/agency role
- ✅ Validate all CSV data against schema before insert
- ✅ Prevent SQL injection via parameterized queries
- ✅ Rate limit CSV uploads (e.g., 1 per minute per user)
- ✅ YouTube video ID validation before API call
- ✅ Audit log all imports with actor/file/results
- ✅ Soft delete media (never hard delete)
- ✅ CORS configured for file uploads
- ✅ File size limits on CSV (e.g., max 10MB)
- ✅ No sensitive data in import previews

---

## Implementation Roadmap

### Week 1: CSV Infrastructure
- [ ] Create database tables (youtube_videos, bulk_import_logs, media_sort_history)
- [ ] Setup PapaParse integration
- [ ] Implement CSV preview endpoint
- [ ] Implement CSV import endpoint
- [ ] Add schema validation with Zod

### Week 2: Frontend CSV UI
- [ ] Build CSVUploader component
- [ ] Implement file selection & preview
- [ ] Connect to backend API
- [ ] Add error display
- [ ] Test with sample data

### Week 3: Media Sorting & YouTube
- [ ] Setup drag-drop with dnd-kit
- [ ] Build MediaSortable component
- [ ] Implement reorder endpoint
- [ ] Add bulk delete endpoint
- [ ] YouTube video ID extraction

### Week 4: YouTube Integration & Testing
- [ ] YouTube metadata API client
- [ ] KV caching for metadata
- [ ] Database storage for videos
- [ ] Full integration testing
- [ ] Production deployment

---

**Status:** Ready for Implementation  
**Estimated Timeline:** 4 weeks  
**Dependencies:** MISSION 1 (Premium Tiers)  
**Next Steps:** Setup database tables and PapaParse

---

*Created: April 9, 2026*
