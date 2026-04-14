import { Hono } from 'hono';
import { Bindings } from '../index'; // Import Bindings for env types

const publicTalentApiRoute = new Hono<{ Bindings: Bindings }>();

/**
 * Masks sensitive contact information for public display.
 * @param value - The string to mask (e.g., email or phone).
 * @param type - 'email' or 'phone'.
 * @returns The masked string.
 */
const maskContact = (value: string | null, type: 'email' | 'phone'): string => {
    if (!value) return '-';
    if (type === 'email') {
        const [user, domain] = value.split('@');
        if (!user || !domain) return value;
        return `${user.substring(0, 2)}...${user.slice(-1)}@${domain}`;
    }
    if (type === 'phone') {
        if (value.length < 8) return value;
        return `...${value.slice(-4)}`;
    }
    return value;
};


/**
 * GET /api/v1/public/talents/:username
 * This endpoint is public and does not require authentication.
 * It fetches a talent's public profile based on their unique username.
 */
publicTalentApiRoute.get('/:username', async (c) => {
    const username = c.req.param('username');
    const db = c.env.DB_CORE;
    const cache = c.env.ORLAND_CACHE;
    const cacheKey = `public_profile:${username}`;

    try {
        // 1. Check cache first
        const cachedProfile = await cache.get(cacheKey, 'json');
        if (cachedProfile) {
            return c.json({ status: 'ok', source: 'cache', data: cachedProfile });
        }

        // 2. If not in cache, fetch from D1
        const talent = await db.prepare(`
            SELECT t.id, t.fullname, t.username, p.*
            FROM talents t
            JOIN talent_profiles p ON t.id = p.talent_id
            WHERE t.username = ?
        `).bind(username).first<any>();

        if (!talent) {
            return c.json({ status: 'error', message: 'Talent not found' }, 404);
        }

        const credits = await db.prepare('SELECT * FROM talent_credits WHERE talent_id = ? ORDER BY year DESC').bind(talent.id).all();
        
        // 3. Construct the public profile with data masking
        const publicProfile = {
            name: talent.fullname,
            username: talent.username,
            personal: {
                gender: talent.gender,
                // Age can be calculated from DOB if needed, but not exposing DOB directly
                loc: talent.location,
                ethnicity: talent.ethnicity,
            },
            interestedIn: talent.interested_in ? JSON.parse(talent.interested_in) : [],
            skills: talent.skills ? JSON.parse(talent.skills) : [],
            appearance: {
                height: talent.height,
                weight: talent.weight,
                eye: talent.eye_color,
                hair: talent.hair_color,
            },
            photos: {
                headshot: talent.photo_headshot,
                side: talent.photo_side,
                full: talent.photo_full,
                additional: [], // Needs separate query if implemented
            },
            credits: credits.results || [],
            // Masked contact info
            contact: {
                email: maskContact(talent.email, 'email'), // Assuming email is on profiles table
                phone: maskContact(talent.phone, 'phone'), // Assuming phone is on profiles table
            }
        };

        // 4. Store in cache for 1 hour (3600 seconds)
        await cache.put(cacheKey, JSON.stringify(publicProfile), { expirationTtl: 3600 });

        return c.json({ status: 'ok', source: 'database', data: publicProfile });

    } catch (error: any) {
        console.error(`Error fetching public profile for ${username}:`, error);
        return c.json({ status: 'error', message: 'Internal Server Error' }, 500);
    }
});

// ... (rest of the file remains the same)
export default publicTalentApiRoute;