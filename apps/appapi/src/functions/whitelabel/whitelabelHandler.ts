/**
 * White-Labeling & Agency Branding
 * Enables agencies to customize their branded experience
 */

import { Hono } from 'hono';
import { Context } from 'hono';
import type { Bindings, Variables } from '../../index';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * Middleware: Validate agency owner
 */
const validateAgencyOwner = async (c: Context, agencyId: string) => {
  const userId = c.get('userId');
  const userRole = c.get('userRole');

  if (userRole !== 'agency_admin' && userRole !== 'platform_admin') {
    return false;
  }

  if (userRole === 'agency_admin') {
    const agency = await c.env.DB_CORE.prepare(
      'SELECT owner_id FROM agencies WHERE id = ?'
    ).bind(agencyId).first<any>();

    return agency?.owner_id === userId;
  }

  return true;
};

/**
 * GET /api/v1/agencies/me/whitelabel
 * Get agency white-label settings
 */
app.get('/agencies/me/whitelabel', async (c) => {
  const userId = c.get('userId');

  try {
    // Get agency for current user
    const agency = await c.env.DB_CORE.prepare(`
      SELECT 
        id,
        name,
        custom_domain,
        watermark_url,
        white_label_enabled,
        primary_color,
        secondary_color,
        logo_url,
        created_at,
        updated_at
      FROM agencies
      WHERE owner_id = ? OR id = (SELECT agency_id FROM users WHERE id = ?)
      LIMIT 1
    `).bind(userId, userId).first<any>();

    if (!agency) {
      return c.json({ error: 'Agency not found' }, 404);
    }

    return c.json({
      status: 'success',
      data: agency
    });
  } catch (error) {
    return c.json({ status: 'error', message: 'Failed to fetch settings' }, 500);
  }
});

/**
 * PATCH /api/v1/agencies/me/whitelabel
 * Update white-label settings
 */
app.patch('/agencies/me/whitelabel', async (c) => {
  const userId = c.get('userId');

  try {
    const body = await c.req.json<any>();
    const {
      custom_domain,
      primary_color,
      secondary_color,
      logo_url,
      white_label_enabled
    } = body;

    // Get agency
    const agency = await c.env.DB_CORE.prepare(
      'SELECT id FROM agencies WHERE owner_id = ? LIMIT 1'
    ).bind(userId).first<any>();

    if (!agency) {
      return c.json({ error: 'Agency not found' }, 404);
    }

    // Validate custom domain format
    if (custom_domain) {
      if (!custom_domain.match(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$|^localhost$/i)) {
        return c.json({ 
          error: 'Invalid domain format', 
          message: 'Domain must be a valid hostname' 
        }, 400);
      }
    }

    // Store settings
    const now = new Date().toISOString();
    const updates: string[] = [];
    const params: any[] = [];

    if (custom_domain !== undefined) {
      updates.push('custom_domain = ?');
      params.push(custom_domain);
    }
    if (primary_color !== undefined) {
      updates.push('primary_color = ?');
      params.push(primary_color);
    }
    if (secondary_color !== undefined) {
      updates.push('secondary_color = ?');
      params.push(secondary_color);
    }
    if (logo_url !== undefined) {
      updates.push('logo_url = ?');
      params.push(logo_url);
    }
    if (white_label_enabled !== undefined) {
      updates.push('white_label_enabled = ?');
      params.push(white_label_enabled ? 1 : 0);
    }

    updates.push('updated_at = ?');
    params.push(now);
    params.push(agency.id);

    if (updates.length > 1) {
      await c.env.DB_CORE.prepare(`
        UPDATE agencies
        SET ${updates.join(', ')}
        WHERE id = ?
      `).bind(...params).run();
    }

    // Return updated settings
    const updated = await c.env.DB_CORE.prepare(
      'SELECT custom_domain, primary_color, secondary_color, logo_url, white_label_enabled, updated_at FROM agencies WHERE id = ?'
    ).bind(agency.id).first<any>();

    return c.json({
      status: 'success',
      message: 'White-label settings updated',
      data: updated
    });
  } catch (error) {
    return c.json({ status: 'error', message: 'Failed to update settings' }, 500);
  }
});

/**
 * POST /api/v1/agencies/me/watermark/upload
 * Upload watermark image to R2 storage
 */
app.post('/agencies/me/watermark/upload', async (c) => {
  const userId = c.get('userId');

  try {
    // Get agency
    const agency = await c.env.DB_CORE.prepare(
      'SELECT id FROM agencies WHERE owner_id = ? LIMIT 1'
    ).bind(userId).first<any>();

    if (!agency) {
      return c.json({ error: 'Agency not found' }, 404);
    }

    // Get uploaded file from FormData
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return c.json({ 
        error: 'Invalid file type',
        message: 'Only PNG, JPEG, GIF, and WebP images are allowed'
      }, 400);
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return c.json({
        error: 'File too large',
        message: 'Maximum file size is 5MB'
      }, 400);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const ext = file.name.split('.').pop();
    const filename = `watermarks/${agency.id}/watermark_${timestamp}_${randomStr}.${ext}`;

    // Upload to R2
    const buffer = await file.arrayBuffer();
    const uploadUrl = await c.env.R2_BUCKET.put(filename, buffer, {
      httpMetadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=3600'
      }
    });

    // Generate public URL
    const publicUrl = `${c.env.R2_PUBLIC_URL}/${filename}`;

    // Store watermark URL in database
    await c.env.DB_CORE.prepare(
      'UPDATE agencies SET watermark_url = ? WHERE id = ?'
    ).bind(publicUrl, agency.id).run();

    return c.json({
      status: 'success',
      message: 'Watermark uploaded successfully',
      data: {
        url: publicUrl,
        filename
      }
    });

  } catch (error) {
    return c.json({ status: 'error', message: 'Failed to upload watermark' }, 500);
  }
});

/**
 * GET /api/v1/whitelabel/config/:domain
 * Get white-label config by custom domain (public endpoint)
 */
app.get('/whitelabel/config/:domain', async (c) => {
  const domain = c.req.param('domain');

  try {
    // Find agency with this custom domain
    const agency = await c.env.DB_CORE.prepare(`
      SELECT 
        id,
        name,
        custom_domain,
        watermark_url,
        primary_color,
        secondary_color,
        logo_url
      FROM agencies
      WHERE custom_domain = ? AND white_label_enabled = 1
      LIMIT 1
    `).bind(domain).first<any>();

    if (!agency) {
      return c.json({ 
        error: 'Domain not found',
        message: 'This custom domain is not configured'
      }, 404);
    }

    return c.json({
      status: 'success',
      data: {
        brandName: agency.name,
        primaryColor: agency.primary_color || '#3b82f6',
        secondaryColor: agency.secondary_color || '#1e40af',
        logoUrl: agency.logo_url,
        watermarkUrl: agency.watermark_url
      }
    });
  } catch (error) {
    return c.json({ status: 'error', message: 'Failed to fetch config' }, 500);
  }
});

export default app;
