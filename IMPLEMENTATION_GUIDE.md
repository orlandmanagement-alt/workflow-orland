# Smart Matching Integration Guide - Step-by-Step Implementation

## Overview

This guide provides step-by-step instructions to integrate the three core modules:
1. **MODUL 1: Profile** - Talent profile management (`/profile`)
2. **MODUL 2: Smart Match AI** - Job recommendations (`/jobs/match`)
3. **MODUL 3: Projects** - Application tracking (`/projects`)

---

## Prerequisites

- Node.js 18+ and npm/pnpm
- Cloudflare Wrangler CLI (`npm install -g wrangler@latest`)
- D1 SQLite database
- Understanding of TypeScript and React

---

## Phase 1: Database Setup

### 1.1 Create D1 Database

```bash
# Navigate to appapi
cd apps/appapi

# Create D1 database
wrangler d1 create talent_db

# This creates a new D1 database. Note the ID from the output.
# Update wrangler.toml with the database ID:

# wrangler.toml should have:
# [[env.production.d1_databases]]
# binding = "DB"
# database_name = "talent_db"
# database_id = "YOUR_DATABASE_ID"
```

### 1.2 Apply Migrations

```bash
# From apps/appapi directory

# Apply all migrations
wrangler d1 migrations apply talent_db --remote

# Verify migrations
wrangler d1 execute talent_db --remote --file=migrations/030_DB_CORE_talent_profiles.sql

# Check if tables were created
wrangler d1 execute talent_db --remote --command "SELECT name FROM sqlite_master WHERE type='table';"
```

### 1.3 Verify Schema

```bash
# Verify key tables exist
wrangler d1 execute talent_db --remote --command "
  SELECT name FROM sqlite_master 
  WHERE type='table' 
  AND name IN ('talent_profiles', 'casting_requirements', 'job_applications', 'smart_match_log');
"
```

---

## Phase 2: Backend Setup (appapi)

### 2.1 Install Routing Package

```bash
cd apps/appapi

# Ensure dependencies are installed
npm install

# Required packages should include:
# - itty-router (for routing)
# - zod (for validation)
# - jsonwebtoken (for JWT)
```

### 2.2 Create Core Route Files

#### File: `apps/appapi/src/routes/talent-profile.ts`

```typescript
import { Router } from 'itty-router';
import { z } from 'zod';
import { json, error } from 'itty-router-extras';
import { verifyJWT } from '../middleware/auth';
import {
  TalentProfile,
  UpdateProfilePayload,
  ApiResponse,
} from '@orland/db-schema/types.talent';

const router = Router();

// Middleware
router.use(verifyJWT);

// =========================================================================
// GET /api/profile/me - Fetch authenticated talent's profile
// =========================================================================
router.get('/api/profile/me', async (request: Request, env: { DB: D1Database }) => {
  const talentId = (request as any).talentId; // Set by auth middleware

  try {
    const profile = await env.DB
      .prepare('SELECT * FROM talent_profiles WHERE talent_id = ?')
      .bind(talentId)
      .first<TalentProfile>();

    if (!profile) {
      return json({ status: 'not_found', message: 'Profile not found' }, { status: 404 });
    }

    // Parse JSON fields
    const result = {
      ...profile,
      skills_json: profile.skills_json ? JSON.parse(profile.skills_json) : [],
      languages_json: profile.languages_json ? JSON.parse(profile.languages_json) : [],
      portfolio_photos: profile.portfolio_photos
        ? JSON.parse(profile.portfolio_photos)
        : [],
      preferred_project_types: profile.preferred_project_types
        ? JSON.parse(profile.preferred_project_types)
        : [],
    };

    return json({ status: 'ok', data: result });
  } catch (err) {
    return error(500, `Database error: ${(err as Error).message}`);
  }
});

// =========================================================================
// PUT /api/profile/update - Create or update talent profile
// =========================================================================
router.put('/api/profile/update', async (request: Request, env: { DB: D1Database }) => {
  const talentId = (request as any).talentId;
  const body = await request.json();

  // Validation using zod
  const updateSchema = z.object({
    age: z.number().min(18).max(100),
    gender: z.enum(['male', 'female', 'non-binary', 'other']),
    domicile: z.string().min(1),
    height_cm: z.number().positive(),
    weight_kg: z.number().positive(),
    skin_tone: z.enum(['fair', 'light', 'medium', 'olive', 'tan', 'deep']),
    hair_color: z.enum(['black', 'brown', 'blonde', 'red', 'gray']),
    face_type: z.enum([
      'oval',
      'round',
      'square',
      'heart',
      'oblong',
      'pan-asian',
    ]),
    skills_json: z.array(z.string()),
    languages_json: z.array(z.string()),
    // Optional fields...
    chest_cm: z.number().positive().optional(),
    waist_cm: z.number().positive().optional(),
    hip_cm: z.number().positive().optional(),
    comp_card_url: z.string().url().optional(),
    headshot_url: z.string().url().optional(),
    full_body_url: z.string().url().optional(),
    showreel_url: z.string().url().optional(),
    rate_daily_min: z.number().positive().optional(),
    rate_daily_max: z.number().positive().optional(),
    is_available: z.boolean().optional(),
    location_willing_to_travel: z.boolean().optional(),
  });

  try {
    const validated = updateSchema.parse(body);

    // Check if profile exists
    const existing = await env.DB
      .prepare('SELECT id FROM talent_profiles WHERE talent_id = ?')
      .bind(talentId)
      .first();

    const query = existing
      ? buildUpdateQuery(talentId, validated)
      : buildInsertQuery(talentId, validated);

    const result = await env.DB.prepare(query.sql).bind(...query.params).run();

    const updatedProfile = await env.DB
      .prepare('SELECT * FROM talent_profiles WHERE talent_id = ?')
      .bind(talentId)
      .first();

    return json(
      {
        status: 'ok',
        message: existing ? 'Profile updated successfully' : 'Profile created successfully',
        data: updatedProfile,
      },
      { status: existing ? 200 : 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return json({ status: 'error', errors: err.errors }, { status: 400 });
    }
    return error(500, `Server error: ${(err as Error).message}`);
  }
});

// =========================================================================
// Helper Functions
// =========================================================================

function buildInsertQuery(talentId: string, data: any) {
  const fields = [
    'talent_id',
    'age',
    'gender',
    'domicile',
    'height_cm',
    'weight_kg',
    'skin_tone',
    'hair_color',
    'face_type',
    'skills_json',
    'languages_json',
    'chest_cm',
    'waist_cm',
    'hip_cm',
    'comp_card_url',
    'headshot_url',
    'full_body_url',
    'showreel_url',
    'rate_daily_min',
    'rate_daily_max',
    'is_available',
    'location_willing_to_travel',
  ];

  const placeholders = fields.map(() => '?').join(', ');
  const values = fields.map(f => {
    if (f === 'talent_id') return talentId;
    if (f.endsWith('_json')) return JSON.stringify(data[f] || []);
    return data[f] ?? null;
  });

  return {
    sql: `INSERT INTO talent_profiles (${fields.join(', ')}) VALUES (${placeholders})`,
    params: values,
  };
}

function buildUpdateQuery(talentId: string, data: any) {
  const updates = [];
  const params = [];

  Object.entries(data).forEach(([key, value]) => {
    if (key.endsWith('_json')) {
      updates.push(`${key} = ?`);
      params.push(JSON.stringify(value));
    } else {
      updates.push(`${key} = ?`);
      params.push(value ?? null);
    }
  });

  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(talentId);

  return {
    sql: `UPDATE talent_profiles SET ${updates.join(', ')} WHERE talent_id = ?`,
    params,
  };
}

export default router;
```

### 2.3 Create Smart Matching Route

#### File: `apps/appapi/src/routes/smart-match.ts`

```typescript
import { Router } from 'itty-router';
import { json, error } from 'itty-router-extras';
import { verifyJWT } from '../middleware/auth';
import {
  smartMatchingEngine,
  SmartMatchingEngine,
} from '@orland/db-schema/smart-matching.engine';
import { TalentProfile, CastingRequirement, MatchResult } from '@orland/db-schema/types.talent';

const router = Router();
router.use(verifyJWT);

// =========================================================================
// GET /api/jobs/smart-match - Get AI-powered recommendations
// =========================================================================
router.get(
  '/api/jobs/smart-match',
  async (request: Request, env: { DB: D1Database }) => {
    const talentId = (request as any).talentId;
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const minMatch = parseInt(url.searchParams.get('minMatch') || '70');

    try {
      // Fetch talent profile
      const talent = await env.DB
        .prepare('SELECT * FROM talent_profiles WHERE talent_id = ?')
        .bind(talentId)
        .first<TalentProfile>();

      if (!talent) {
        return json({ status: 'not_found', message: 'Profile not found' }, { status: 404 });
      }

      // Parse JSON fields
      const talentData = {
        ...talent,
        skills_json: talent.skills_json ? JSON.parse(talent.skills_json) : [],
        languages_json: talent.languages_json ? JSON.parse(talent.languages_json) : [],
      };

      // Fetch active casting requirements
      const requirements = await env.DB
        .prepare(
          `SELECT * FROM casting_requirements 
         WHERE is_active = 1 
         ORDER BY created_at DESC 
         LIMIT ?`
        )
        .bind(limit * 2) // Fetch more to account for filtering
        .all<CastingRequirement>();

      if (!requirements.results) {
        return json({ status: 'ok', data: [], count: 0 });
      }

      // Parse JSON fields in requirements
      const requirementsData = requirements.results.map(req => ({
        ...req,
        required_skills: req.required_skills ? JSON.parse(req.required_skills) : [],
        required_languages: req.required_languages ? JSON.parse(req.required_languages) : [],
        skin_tone_preferred: req.skin_tone_preferred
          ? JSON.parse(req.skin_tone_preferred)
          : [],
        face_type_preferred: req.face_type_preferred
          ? JSON.parse(req.face_type_preferred)
          : [],
      }));

      // Run matching algorithm
      const matches = smartMatchingEngine.matchBatch(talentData, requirementsData);

      // Filter by minimum match percentage
      const filtered = matches.filter(m => m.match_percentage >= minMatch).slice(0, limit);

      // Log matches for audit trail
      for (const match of filtered) {
        await env.DB
          .prepare(
            `INSERT INTO smart_match_log 
           (talent_id, project_id, role_id, match_percentage, hard_filters_passed, soft_filters_score, score_breakdown)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            match.talent_id,
            match.project_id,
            match.role_id,
            match.match_percentage,
            match.hard_filters_passed,
            match.soft_filters_score,
            JSON.stringify(match.score_breakdown)
          )
          .run();
      }

      return json({
        status: 'ok',
        data: filtered,
        count: filtered.length,
      });
    } catch (err) {
      console.error('Smart match error:', err);
      return error(500, `Matching error: ${(err as Error).message}`);
    }
  }
);

export default router;
```

### 2.4 Update Worker Entry Point

#### File: `apps/appapi/src/index.ts`

```typescript
import { Router } from 'itty-router';
import { error } from 'itty-router-extras';

import talentProfile from './routes/talent-profile';
import smartMatch from './routes/smart-match';
import projects from './routes/projects';

const router = Router();

// Mount route handlers
router.all('/api/profile/*', talentProfile.fetch);
router.all('/api/jobs/*', smartMatch.fetch);
router.all('/api/projects/*', projects.fetch);

// 404 handler
router.all('*', () => error(404, 'Not Found'));

export default router;
```

---

## Phase 3: Frontend Setup (apptalent)

### 3.1 Create Profile Component

#### File: `apps/apptalent/src/pages/profile/Index.enhanced.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { TalentProfile, UpdateProfilePayload } from '@orland/db-schema/types.talent';
import ProfileForm from '@/components/ProfileForm';
import CompletionBar from '@/components/CompletionBar';

export default function ProfilePageEnhanced() {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState<TalentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const resp = await fetch('/api/profile/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await resp.json();
      if (data.status === 'ok') {
        setProfile(data.data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updates: UpdateProfilePayload) => {
    setSaving(true);
    try {
      const resp = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      const data = await resp.json();
      if (data.status === 'ok') {
        setProfile(data.data);
        // Show success toast
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      // Show error toast
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <CompletionBar percent={profile?.profile_completion_percent || 0} />
      </div>

      <ProfileForm profile={profile} onSave={handleSave} isSaving={saving} />
    </div>
  );
}
```

### 3.2 Create Smart Match Component

#### File: `apps/apptalent/src/pages/jobs/match.enhanced.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { MatchResult } from '@orland/db-schema/types.talent';
import JobMatchCard from '@/components/JobMatchCard';
import MatchFilters from '@/components/MatchFilters';

export default function SmartMatchEnhanced() {
  const { token } = useAuth();
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ minMatch: 70, limit: 20 });

  useEffect(() => {
    fetchMatches();
  }, [filters]);

  const fetchMatches = async () => {
    try {
      const url = `/api/jobs/smart-match?limit=${filters.limit}&minMatch=${filters.minMatch}`;
      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await resp.json();
      if (data.status === 'ok') {
        setMatches(data.data);
      }
    } catch (err) {
      console.error('Error fetching matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (match: MatchResult) => {
    try {
      const resp = await fetch('/api/jobs/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: match.project_id,
          roleId: match.role_id,
        }),
      });
      const data = await resp.json();
      if (data.status === 'ok') {
        // Remove from list or update status
        setMatches(matches.filter(m => m.project_id !== match.project_id));
      }
    } catch (err) {
      console.error('Error applying:', err);
    }
  };

  if (loading) return <div>Loading matches...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Smart Job Matches</h1>
        <span className="text-gray-600">{matches.length} opportunities</span>
      </div>

      <MatchFilters value={filters} onChange={setFilters} />

      <div className="space-y-4">
        {matches.length > 0 ? (
          matches.map(match => (
            <JobMatchCard
              key={`${match.project_id}-${match.role_id}`}
              match={match}
              onApply={() => handleApply(match)}
            />
          ))
        ) : (
          <div className="text-center text-gray-500">No matches found</div>
        )}
      </div>
    </div>
  );
}
```

---

## Phase 4: Testing

### 4.1 Test Profile API

```bash
# 1. Get Authentication Token (adjust based on your auth system)
TOKEN="your_jwt_token_here"

# 2. Test GET /api/profile/me
curl -X GET http://localhost:8787/api/profile/me \
  -H "Authorization: Bearer $TOKEN"

# 3. Test PUT /api/profile/update
curl -X PUT http://localhost:8787/api/profile/update \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "age": 25,
    "gender": "male",
    "domicile": "Jakarta, Indonesia",
    "height_cm": 178,
    "weight_kg": 70,
    "skin_tone": "medium",
    "hair_color": "black",
    "face_type": "oval",
    "skills_json": ["actor", "model_commercial"],
    "languages_json": ["indonesian", "english"]
  }'
```

### 4.2 Test Smart Match API

```bash
# Test GET /api/jobs/smart-match
curl -X GET "http://localhost:8787/api/jobs/smart-match?limit=20&minMatch=70" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Phase 5: Deployment

### 5.1 Deploy appapi Worker

```bash
cd apps/appapi

# Deploy to Cloudflare Workers
wrangler deploy

# Set environment variables
wrangler secret put DB_ID
```

### 5.2 Deploy apptalent

```bash
cd apps/apptalent

# Build for production
npm run build

# Deploy (adjust based on your hosting)
npm run deploy
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Verify D1 database is accessible
wrangler d1 info talent_db --remote

# Check migrations
wrangler d1 execute talent_db --remote --command "SELECT COUNT(*) FROM talent_profiles;"
```

### JWT Authentication Issues

```bash
# Verify token validity
# Token should contain: sub (user ID), aud, iss, exp

# Test in https://jwt.io
```

### Matching Algorithm Issues

```bash
# Check smart_match_log for audit trail
SELECT * FROM smart_match_log ORDER BY created_at DESC LIMIT 10;

# Verify profile completeness
SELECT talent_id, profile_completion_percent FROM talent_profiles;
```

---

## Performance Optimization

### Add Caching

```typescript
// In smart-match route
const cacheKey = `matches:${talentId}:${limit}:${minMatch}`;
const cached = await env.CACHE.get(cacheKey);
if (cached) return json(JSON.parse(cached));

// After fetching
await env.CACHE.put(cacheKey, JSON.stringify(matches), { expirationTtl: 300 });
```

### Batch Operations

```typescript
// Batch matching for multiple talents
const allMatches = await Promise.all(
  talents.map(t => smartMatchingEngine.matchBatch(t, requirements))
);
```

---

## Next Steps

1. ✅ Setup database and migrations
2. ✅ Deploy backend API routes
3. ✅ Build frontend components
4. ✅ Test all endpoints
5. ⏳ Add analytics and logging
6. ⏳ Implement email notifications
7. ⏳ Setup monitoring and alerting

---

**For detailed API documentation, see [ARCHITECTURE_GUIDE.md](./apps/apptalent/ARCHITECTURE_GUIDE.md)**
