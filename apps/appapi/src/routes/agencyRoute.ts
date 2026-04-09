/**
 * Agency API Routes
 * Handles agency management, bulk operations, and roster management
 */

import { Hono } from 'hono';
import { requireAgencyOrAdmin, requireAuth } from '../middleware/authMiddleware';

const app = new Hono();

/**
 * POST /api/v1/agency/projects/:id/apply
 * Batch casting apply - Agency applies multiple talents to a project
 */
app.post(
  '/agency/projects/:id/apply',
  requireAuth,
  requireAgencyOrAdmin,
  async (c) => {
    const projectId = c.req.param('id');
    const userId = c.get('userId') as string;

    try {
      const { talentIds } = await c.req.json();

      if (!Array.isArray(talentIds) || talentIds.length === 0) {
        return c.json(
          { error: 'Invalid request: talentIds must be a non-empty array' },
          400
        );
      }

      if (talentIds.length > 100) {
        return c.json(
          { error: 'Cannot apply more than 100 talents at once' },
          400
        );
      }

      // TODO: Verify agency ownership of talents

      // TODO: Batch insert applications
      // const results = await db.batch([
      //   ...talentIds.map(talentId => 
      //     db.prepare('INSERT INTO casting_applications ...')
      //       .bind(projectId, talentId, userId, new Date())
      //   )
      // ]);

      return c.json(
        {
          success: true,
          message: `Applied ${talentIds.length} talents to project`,
          projectId,
          appliedCount: talentIds.length,
        },
        201
      );
    } catch (error) {
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

/**
 * GET /api/v1/agency/:id/talents
 * Get all talents managed by an agency
 */
app.get('/agency/:id/talents', requireAuth, async (c) => {
  const agencyId = c.req.param('id');

  try {
    // TODO: Fetch talents from database
    // const talents = await db.prepare(
    //   'SELECT * FROM talents WHERE agency_id = ? ORDER BY created_at DESC'
    // ).bind(agencyId).all();

    return c.json({
      agencyId,
      talentCount: 0,
      talents: [],
    });
  } catch (error) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * POST /api/v1/agency/talents/bulk
 * Bulk create talents (CSV import)
 */
app.post('/agency/talents/bulk', requireAuth, requireAgencyOrAdmin, async (c) => {
  const userId = c.get('userId') as string;

  try {
    const { talents } = await c.req.json();

    if (!Array.isArray(talents) || talents.length === 0) {
      return c.json(
        { error: 'Invalid request: talents must be a non-empty array' },
        400
      );
    }

    if (talents.length > 100) {
      return c.json(
        { error: 'Cannot import more than 100 talents at once' },
        400
      );
    }

    // Validate talent data
    const validated = talents.every((talent) =>
      talent.name && talent.gender && talent.height
    );

    if (!validated) {
      return c.json(
        {
          error: 'Invalid talent data: name, gender, and height are required',
        },
        400
      );
    }

    // TODO: Batch insert talents into database
    // const results = await db.batch([
    //   ...talents.map(talent =>
    //     db.prepare('INSERT INTO talents ...')
    //       .bind(talent.name, talent.gender, ...)
    //   )
    // ]);

    return c.json(
      {
        success: true,
        message: `Successfully imported ${talents.length} talents`,
        importedCount: talents.length,
      },
      201
    );
  } catch (error) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * PUT /api/v1/media/reorder
 * Reorder media (photos/videos) using drag-and-drop
 */
app.put('/media/reorder', requireAuth, async (c) => {
  const userId = c.get('userId') as string;

  try {
    const { items } = await c.req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return c.json(
        { error: 'Invalid request: items must be a non-empty array' },
        400
      );
    }

    // Validate items structure
    const validated = items.every(
      (item) => item.id && typeof item.sort_order === 'number'
    );

    if (!validated) {
      return c.json(
        { error: 'Invalid items: each item must have id and sort_order' },
        400
      );
    }

    // TODO: Batch update sort_order in database
    // const results = await db.batch([
    //   ...items.map(item =>
    //     db.prepare('UPDATE media SET sort_order = ? WHERE id = ? AND talent_id IN (SELECT id FROM talents WHERE user_id = ?)')
    //       .bind(item.sort_order, item.id, userId)
    //   )
    // ]);

    return c.json(
      {
        success: true,
        message: 'Media reordered successfully',
        reorderedCount: items.length,
      },
      200
    );
  } catch (error) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * POST /api/v1/talents/me/credits/bulk
 * Bulk import credits/experience for talent
 */
app.post('/talents/me/credits/bulk', requireAuth, async (c) => {
  const userId = c.get('userId') as string;

  try {
    const { credits } = await c.req.json();

    if (!Array.isArray(credits) || credits.length === 0) {
      return c.json(
        { error: 'Invalid request: credits must be a non-empty array' },
        400
      );
    }

    if (credits.length > 100) {
      return c.json(
        { error: 'Cannot import more than 100 credits at once' },
        400
      );
    }

    // Validate credit data
    const validated = credits.every((credit) =>
      credit.title && credit.company && credit.date
    );

    if (!validated) {
      return c.json(
        {
          error: 'Invalid credit data: title, company, and date are required',
        },
        400
      );
    }

    // TODO: Get talent_id from userId
    // const talent = await db.prepare('SELECT id FROM talents WHERE user_id = ?')
    //   .bind(userId).first();

    // TODO: Batch insert credits
    // const results = await db.batch([
    //   ...credits.map(credit =>
    //     db.prepare('INSERT INTO credits (talent_id, title, company, date, description) VALUES (?, ?, ?, ?, ?)')
    //       .bind(talent.id, credit.title, credit.company, credit.date, credit.description)
    //   )
    // ]);

    return c.json(
      {
        success: true,
        message: `Successfully imported ${credits.length} credits`,
        importedCount: credits.length,
      },
      201
    );
  } catch (error) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * POST /api/v1/assets/youtube/bulk
 * Bulk import YouTube videos
 */
app.post('/assets/youtube/bulk', requireAuth, async (c) => {
  const userId = c.get('userId') as string;

  try {
    const { urls } = await c.req.json();

    if (!Array.isArray(urls) || urls.length === 0) {
      return c.json(
        { error: 'Invalid request: urls must be a non-empty array' },
        400
      );
    }

    if (urls.length > 50) {
      return c.json(
        { error: 'Cannot import more than 50 videos at once' },
        400
      );
    }

    // Extract YouTube video IDs from URLs
    const videoIds = urls.map((url) => extractYouTubeId(url)).filter(Boolean);

    if (videoIds.length === 0) {
      return c.json(
        { error: 'No valid YouTube URLs found' },
        400
      );
    }

    // TODO: Fetch metadata from YouTube API or oEmbed
    // TODO: Insert videos into database
    // const results = await db.batch([
    //   ...videoIds.map(id => {
    //     const metadata = await fetchYouTubeMetadata(id);
    //     return db.prepare('INSERT INTO assets (talent_id, video_id, title, thumbnail_url, view_count) VALUES (...)')
    //       .bind(talentId, id, metadata.title, metadata.thumbnail, metadata.viewCount)
    //   })
    // ]);

    return c.json(
      {
        success: true,
        message: `Successfully imported ${videoIds.length} videos`,
        importedCount: videoIds.length,
      },
      201
    );
  } catch (error) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * Helper: Extract YouTube video ID from URL
 */
function extractYouTubeId(url: string): string | null {
  const regexes = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ];

  for (const regex of regexes) {
    const match = url.match(regex);
    if (match) return match[1];
  }

  return null;
}

export default app;
