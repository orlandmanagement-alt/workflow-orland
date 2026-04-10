// API Routes: Talent Profile & Smart Match
// File: apps/appapi/src/routes/talent-profile-match.ts
// Purpose: Endpoints for profile management and AI job matching

import { Hono } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';
import type { Database } from '@cloudflare/workers-types';
import smartMatchService from '../services/smartMatchService';

interface Env {
  DB: Database;
  JWT_SECRET: string;
}

const app = new Hono<{ Bindings: Env }>();

// Middleware: Verify JWT from SSO
app.use('*', bearerAuth({ verifyToken: (token, c) => true })); // Simplified - use real JWT verification

// ============================================================================
// ENDPOINT: GET /api/profile/me
// Purpose: Fetch complete talent profile for authenticated user
// ============================================================================
app.get('/me', async (c) => {
  try {
    const db = c.env.DB;
    const talentId = c.get('userId'); // From JWT payload

    if (!talentId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await db
      .prepare(
        `SELECT * FROM talent_profiles WHERE talent_id = ?`
      )
      .bind(talentId)
      .first();

    if (!profile) {
      // Return empty profile structure if first time
      return c.json(
        {
          status: 'not_found',
          message: 'Profile belum dibuat. Silakan lengkapi profil Anda.',
          data: null,
        },
        200
      );
    }

    // Parse JSON fields
    const parsed = {
      ...profile,
      skills: profile.skills_json ? JSON.parse(profile.skills_json) : [],
      languages: profile.languages_json ? JSON.parse(profile.languages_json) : [],
      portfolio_photos: profile.portfolio_photos ? JSON.parse(profile.portfolio_photos) : [],
      preferred_project_types: profile.preferred_project_types
        ? JSON.parse(profile.preferred_project_types)
        : [],
    };

    return c.json({
      status: 'ok',
      data: parsed,
    });
  } catch (error: any) {
    console.error('GET /profile/me error:', error);
    return c.json(
      { error: error.message || 'Failed to fetch profile' },
      500
    );
  }
});

// ============================================================================
// ENDPOINT: PUT /api/profile/update
// Purpose: Update talent profile with comprehensive data
// ============================================================================
app.put('/update', async (c) => {
  try {
    const db = c.env.DB;
    const talentId = c.get('userId');

    if (!talentId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();

    // Validate required fields for minimum profile
    const requiredFields = [
      'age',
      'gender',
      'domicile',
      'height_cm',
      'weight_kg',
      'face_type',
      'skills_json',
    ];
    const missing = requiredFields.filter((field) => !body[field]);
    if (missing.length > 0) {
      return c.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        400
      );
    }

    // Prepare update data
    const updateData = {
      talent_id: talentId,
      age: body.age,
      gender: body.gender,
      domicile: body.domicile,
      phone: body.phone || null,
      email: body.email || null,
      bio: body.bio || null,
      height_cm: body.height_cm,
      weight_kg: body.weight_kg,
      skin_tone: body.skin_tone || null,
      hair_color: body.hair_color || null,
      eye_color: body.eye_color || null,
      face_type: body.face_type,
      chest_cm: body.chest_cm || null,
      waist_cm: body.waist_cm || null,
      hip_cm: body.hip_cm || null,
      shoe_size: body.shoe_size || null,
      shirt_size: body.shirt_size || null,
      skills_json: JSON.stringify(body.skills_json || []),
      languages_json: JSON.stringify(body.languages_json || []),
      comp_card_url: body.comp_card_url || null,
      headshot_url: body.headshot_url || null,
      full_body_url: body.full_body_url || null,
      showreel_url: body.showreel_url || null,
      portfolio_photos: JSON.stringify(body.portfolio_photos || []),
      rate_daily_min: body.rate_daily_min || null,
      rate_daily_max: body.rate_daily_max || null,
      rate_project_min: body.rate_project_min || null,
      rate_project_max: body.rate_project_max || null,
      rate_hourly: body.rate_hourly || null,
      preferred_currency: body.preferred_currency || 'IDR',
      is_available: body.is_available !== undefined ? body.is_available : true,
      availability_note: body.availability_note || null,
      preferred_project_types: JSON.stringify(body.preferred_project_types || []),
      location_willing_to_travel: body.location_willing_to_travel || false,
      max_travel_hours: body.max_travel_hours || 8,
      is_verified: body.is_verified || false,
      last_edited_by: talentId,
      updated_at: new Date().toISOString(),
    };

    // Check if profile exists
    const existing = await db
      .prepare(`SELECT id FROM talent_profiles WHERE talent_id = ?`)
      .bind(talentId)
      .first();

    let result;
    if (existing) {
      // UPDATE
      const updateFields = Object.entries(updateData)
        .map(([key]) => `${key} = ?`)
        .join(', ');
      const updateValues = Object.values(updateData);

      result = await db
        .prepare(
          `UPDATE talent_profiles SET ${updateFields} WHERE talent_id = ?`
        )
        .bind(...updateValues, talentId)
        .run();
    } else {
      // INSERT
      const id = `prof_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const fields = Object.keys(updateData).join(', ');
      const placeholders = Object.keys(updateData)
        .map(() => '?')
        .join(', ');

      result = await db
        .prepare(
          `INSERT INTO talent_profiles (id, ${fields}) VALUES (?, ${placeholders})`
        )
        .bind(id, ...Object.values(updateData))
        .run();
    }

    // Fetch updated profile
    const updated = await db
      .prepare(`SELECT * FROM talent_profiles WHERE talent_id = ?`)
      .bind(talentId)
      .first();

    return c.json({
      status: 'ok',
      message: existing ? 'Profile updated successfully' : 'Profile created successfully',
      data: updated,
    });
  } catch (error: any) {
    console.error('PUT /profile/update error:', error);
    return c.json(
      { error: error.message || 'Failed to update profile' },
      500
    );
  }
});

// ============================================================================
// ENDPOINT: GET /api/jobs/smart-match
// Purpose: Get AI-powered job recommendations for talent
// Query: ?limit=20&minMatch=70&skipApplied=true
// ============================================================================
app.get('/jobs/smart-match', async (c) => {
  try {
    const db = c.env.DB;
    const talentId = c.get('userId');

    if (!talentId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const limit = parseInt(c.req.query('limit') || '20');
    const minMatch = parseInt(c.req.query('minMatch') || '70');

    // Get AI recommendations
    const matches = await smartMatchService.findBestJobsForTalent(
      db,
      talentId,
      limit,
      minMatch
    );

    // Enrich with project details
    const enriched = await Promise.all(
      matches.map(async (match) => {
        const projectDetail = await db
          .prepare(
            `SELECT p.*, cr.* FROM projects p
             JOIN casting_requirements cr ON p.id = cr.project_id
             WHERE p.id = ? AND cr.role_id = ?`
          )
          .bind(match.project_id, match.role_id)
          .first();

        return {
          ...match,
          project: projectDetail,
        };
      })
    );

    // Log matching for analytics
    for (const match of enriched) {
      await db
        .prepare(
          `INSERT INTO smart_match_log (
            id, talent_id, project_id, role_id, match_percentage,
            hard_filters_passed, soft_filters_score, score_breakdown,
            algorithm_version
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT DO NOTHING`
        )
        .bind(
          `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          talentId,
          match.project_id,
          match.role_id,
          match.match_percentage,
          match.hard_filters_passed ? 1 : 0,
          match.soft_filters_score,
          JSON.stringify(match.score_breakdown),
          'v2.0'
        )
        .run();
    }

    return c.json({
      status: 'ok',
      data: enriched,
      count: enriched.length,
    });
  } catch (error: any) {
    console.error('GET /jobs/smart-match error:', error);
    return c.json(
      { error: error.message || 'Failed to fetch matches' },
      500
    );
  }
});

// ============================================================================
// ENDPOINT: GET /api/projects/my-projects
// Purpose: Get talent's active projects and application status
// Query: ?status=all|applied|shortlisted|hired|completed&sort=recent
// ============================================================================
app.get('/projects/my-projects', async (c) => {
  try {
    const db = c.env.DB;
    const talentId = c.get('userId');

    if (!talentId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const statusFilter = c.req.query('status') || 'all';
    const sortBy = c.req.query('sort') || 'recent';

    // Build query
    let query = `
      SELECT ja.*, p.*, cr.role_id
      FROM job_applications ja
      JOIN projects p ON ja.project_id = p.id
      LEFT JOIN casting_requirements cr ON p.id = cr.project_id
      WHERE ja.talent_id = ?
    `;

    const params: any[] = [talentId];

    // Filter by status
    if (statusFilter !== 'all') {
      query += ` AND ja.status = ?`;
      params.push(statusFilter);
    }

    // Sort
    if (sortBy === 'recent') {
      query += ` ORDER BY ja.applied_at DESC`;
    } else if (sortBy === 'oldest') {
      query += ` ORDER BY ja.applied_at ASC`;
    } else if (sortBy === 'updated') {
      query += ` ORDER BY ja.updated_at DESC`;
    }

    const results = await db.prepare(query).bind(...params).all();

    // Group by status
    const grouped: Record<string, any[]> = {
      applied: [],
      shortlisted: [],
      hired: [],
      completed: [],
      rejected: [],
      declined: [],
    };

    results.results?.forEach((app: any) => {
      const status = app.status || 'applied';
      if (grouped[status]) {
        grouped[status].push(app);
      }
    });

    return c.json({
      status: 'ok',
      data: grouped,
      stats: {
        total_applications: results.results?.length || 0,
        applied: grouped.applied.length,
        shortlisted: grouped.shortlisted.length,
        hired: grouped.hired.length,
        completed: grouped.completed.length,
        rejected: grouped.rejected.length,
      },
    });
  } catch (error: any) {
    console.error('GET /projects/my-projects error:', error);
    return c.json(
      { error: error.message || 'Failed to fetch projects' },
      500
    );
  }
});

// ============================================================================
// ENDPOINT: POST /api/jobs/apply
// Purpose: Submit application for a job
// ============================================================================
app.post('/jobs/apply', async (c) => {
  try {
    const db = c.env.DB;
    const talentId = c.get('userId');

    if (!talentId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { projectId, roleId } = await c.req.json();

    if (!projectId || !roleId) {
      return c.json(
        { error: 'projectId and roleId are required' },
        400
      );
    }

    // Check if already applied
    const existing = await db
      .prepare(
        `SELECT id FROM job_applications 
         WHERE talent_id = ? AND project_id = ? AND role_id = ?`
      )
      .bind(talentId, projectId, roleId)
      .first();

    if (existing) {
      return c.json(
        { error: 'Already applied for this role', status: 'duplicate' },
        409
      );
    }

    // Get talent profile for matching
    const talentProfile = await db
      .prepare(`SELECT * FROM talent_profiles WHERE talent_id = ?`)
      .bind(talentId)
      .first();

    if (!talentProfile) {
      return c.json(
        { error: 'Please complete your profile before applying' },
        400
      );
    }

    // Get job requirements
    const requirements = await db
      .prepare(
        `SELECT * FROM casting_requirements WHERE project_id = ? AND role_id = ?`
      )
      .bind(projectId, roleId)
      .first();

    if (!requirements) {
      return c.json({ error: 'Job not found' }, 404);
    }

    // Calculate match score
    const matchResult = await smartMatchService.matchTalentToJob(
      talentProfile,
      requirements
    );

    // Create application
    const appId = `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const result = await db
      .prepare(
        `INSERT INTO job_applications (
          id, talent_id, project_id, role_id, status,
          match_percentage, match_details, applied_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        appId,
        talentId,
        projectId,
        roleId,
        'applied',
        matchResult.match_percentage,
        JSON.stringify(matchResult),
        new Date().toISOString()
      )
      .run();

    return c.json({
      status: 'ok',
      message: 'Application submitted successfully',
      data: {
        app_id: appId,
        match_percentage: matchResult.match_percentage,
        match_details: matchResult,
      },
    });
  } catch (error: any) {
    console.error('POST /jobs/apply error:', error);
    return c.json(
      { error: error.message || 'Failed to submit application' },
      500
    );
  }
});

export default app;
