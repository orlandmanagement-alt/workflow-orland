import { Hono } from 'hono';
import { Bindings, Variables } from '../index';
import { requireRole } from '../middleware/authRole';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const talentRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Middleware for routes that require authenticated talent role
talentRoutes.use('/*', requireRole(['talent']));

// Zod schema for validating the PUT request body
const profileUpdateSchema = z.object({
    name: z.object({
        first: z.string(),
        last: z.string(),
    }),
    personal: z.object({
        gender: z.string().optional(),
        dob: z.string().optional(),
        loc: z.string().optional(),
        ethnicity: z.string().optional(),
    }),
    interestedIn: z.array(z.string()).optional(),
    skills: z.array(z.string()).optional(),
    appearance: z.object({
        height: z.string().optional(),
        weight: z.string().optional(),
        eye: z.string().optional(),
        hair: z.string().optional(),
    }),
    photos: z.object({
        headshot: z.string().nullish(),
        side: z.string().nullish(),
        full: z.string().nullish(),
        additional: z.array(z.string()).optional(),
    }),
    credits: z.array(z.object({
        title: z.string(),
        year: z.string(),
        company: z.string(),
        about: z.string(),
        photo: z.string().optional(),
    })).optional(),
});


/**
 * GET /api/v1/talents/me
 * Fetches the complete profile for the currently authenticated talent.
 */
talentRoutes.get('/me', async (c) => {
    const userId = c.get('userId');
    const db = c.env.DB_CORE;

    try {
        // 1. Fetch main talent data and profile data in parallel
        const [talentRes, profileRes, creditsRes] = await Promise.all([
            db.prepare(`
                SELECT u.first_name, u.last_name, u.email, t.username
                FROM sso.users u
                LEFT JOIN core.talents t ON u.id = t.user_id
                WHERE u.id = ?
            `).bind(userId).first(),
            db.prepare('SELECT * FROM talent_profiles WHERE talent_id = ?').bind(userId).first(),
            db.prepare('SELECT * FROM talent_credits WHERE talent_id = ? ORDER BY year DESC').bind(userId).all()
        ]);

        if (!talentRes) {
            return c.json({ status: 'error', message: 'User not found' }, 404);
        }

        // Combine data into a frontend-friendly state object
        const profileData = profileRes || {};
        const state = {
            name: {
                first: talentRes.first_name || '',
                last: talentRes.last_name || '',
            },
            contacts: {
                email: talentRes.email || '',
                phone: profileData.phone || '',
            },
            personal: {
                gender: profileData.gender || '',
                dob: profileData.dob || '',
                loc: profileData.location || '',
                ethnicity: profileData.ethnicity || '',
            },
            interestedIn: profileData.interested_in ? JSON.parse(profileData.interested_in) : [],
            skills: profileData.skills ? JSON.parse(profileData.skills) : [],
            appearance: {
                height: profileData.height || '',
                weight: profileData.weight || '',
                eye: profileData.eye_color || '',
                hair: profileData.hair_color || '',
            },
            photos: {
                headshot: profileData.photo_headshot,
                side: profileData.photo_side,
                full: profileData.photo_full,
                additional: [], // Additional photos need another query if stored separately
            },
            credits: creditsRes.results || [],
        };

        return c.json({ status: 'ok', data: state });

    } catch (error: any) {
        console.error('GET /me error:', error);
        return c.json({ status: 'error', message: 'Failed to fetch profile', details: error.message }, 500);
    }
});

/**
 * PUT /api/v1/talents/me
 * Updates the profile for the currently authenticated talent.
 */
talentRoutes.put('/me', zValidator('json', profileUpdateSchema), async (c) => {
    const userId = c.get('userId');
    const body = c.req.valid('json');
    const db = c.env.DB_CORE;

    try {
        const batch = [
            // 1. Update/Insert talent_profiles
            db.prepare(`
                INSERT INTO talent_profiles (talent_id, gender, dob, location, ethnicity, interested_in, skills, height, weight, eye_color, hair_color, photo_headshot, photo_side, photo_full)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(talent_id) DO UPDATE SET
                    gender = excluded.gender,
                    dob = excluded.dob,
                    location = excluded.location,
                    ethnicity = excluded.ethnicity,
                    interested_in = excluded.interested_in,
                    skills = excluded.skills,
                    height = excluded.height,
                    weight = excluded.weight,
                    eye_color = excluded.eye_color,
                    hair_color = excluded.hair_color,
                    photo_headshot = excluded.photo_headshot,
                    photo_side = excluded.photo_side,
                    photo_full = excluded.photo_full;
            `).bind(
                userId,
                body.personal?.gender,
                body.personal?.dob,
                body.personal?.loc,
                body.personal?.ethnicity,
                JSON.stringify(body.interestedIn || []),
                JSON.stringify(body.skills || []),
                body.appearance?.height,
                body.appearance?.weight,
                body.appearance?.eye,
                body.appearance?.hair,
                body.photos?.headshot,
                body.photos?.side,
                body.photos?.full
            ),
            // 2. Delete old credits
            db.prepare('DELETE FROM talent_credits WHERE talent_id = ?').bind(userId)
        ];

        // 3. Prepare new credits for insertion
        const creditInserts = (body.credits || []).map(credit => 
            db.prepare('INSERT INTO talent_credits (talent_id, title, year, company, about, photo) VALUES (?, ?, ?, ?, ?, ?)')
              .bind(userId, credit.title, credit.year, credit.company, credit.about, credit.photo)
        );

        await db.batch([...batch, ...creditInserts]);
        
        // Invalidate public profile cache in KV if it exists
        await c.env.ORLAND_CACHE.delete(`public_profile:${userId}`);

        return c.json({ status: 'ok', message: 'Profile updated successfully' });

    } catch (error: any) {
        console.error('PUT /me error:', error);
        return c.json({ status: 'error', message: 'Failed to update profile', details: error.message }, 500);
    }
});

/**
 * POST /api/v1/talents/upload
 * Handles image uploads to R2 and returns a public URL.
 * Expects multipart/form-data with a single 'file' field.
 */
talentRoutes.post('/upload', async (c) => {
    const userId = c.get('userId');
    const body = await c.req.parseBody();
    const file = body['file'] as File;

    if (!file) {
        return c.json({ status: 'error', message: 'No file provided in the "file" field.' }, 400);
    }

    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const key = `profiles/${userId}/${Date.now()}-${cleanFileName}`;

    try {
        await c.env.R2_MEDIA.put(key, file, {
            httpMetadata: { contentType: file.type },
        });

        const publicUrl = `https://cdn.orlandmanagement.com/media/${key}`; // Assuming a public R2 domain/worker

        return c.json({ status: 'ok', url: publicUrl });

    } catch (error: any) {
        console.error('R2 Upload Error:', error);
        return c.json({ status: 'error', message: 'Failed to upload file to R2.', details: error.message }, 500);
    }
});

export default talentRoutes;
