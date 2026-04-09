/**
 * Public Talents API Route
 * Handles secure data masking based on tier and requester permissions
 */

import { Hono } from 'hono';
import { 
  maskEmail, 
  maskPhone, 
  applyContactMasking, 
  isRequesterAuthorized, 
  filterMediaByTier 
} from '../utils/maskingUtils';

const app = new Hono();

/**
 * GET /api/v1/public/talents/:id
 * Fetch public profile with secure gating based on tier
 */
app.get('/public/talents/:id', async (c) => {
  const talentId = c.req.param('id');
  const requesterId = c.req.header('x-user-id');
  const requesterTier = (c.req.header('x-user-tier') || 'free') as 'free' | 'premium';
  const requesterRole = c.req.header('x-user-role');
  
  try {
    // TODO: Fetch from database (Cloudflare D1)
    const talent = await fetchTalentFromDB(talentId);
    
    if (!talent) {
      return c.json({ error: 'Talent not found' }, 404);
    }
    
    const talentTier = (talent.account_tier || 'free') as 'free' | 'premium';
    const requesterIsPremium = isRequesterAuthorized(requesterTier, requesterRole);
    
    // Apply masking to contact information
    const contactInfo = {
      email: talent.email,
      phone: talent.phone,
      instagram: talent.instagram,
      tiktok: talent.tiktok,
      facebook: talent.facebook,
    };
    
    const maskedContacts = applyContactMasking(contactInfo, talentTier, requesterIsPremium);
    
    // Filter media based on tier
    const mediaToShow = filterMediaByTier(talent.media || [], talentTier, requesterIsPremium);
    
    // Build response
    const response = {
      id: talent.id,
      name: talent.name,
      bio: talent.bio,
      height: talent.height,
      gender: talent.gender,
      accountTier: talentTier,
      // Unmasked fields always visible
      bio: talent.bio,
      profileImage: talent.profile_image,
      portfolio: talent.portfolio,
      // Conditionally visible/masked contact fields
      email: maskedContacts.email,
      phone: maskedContacts.phone,
      instagram: maskedContacts.instagram,
      tiktok: maskedContacts.tiktok,
      facebook: maskedContacts.facebook,
      // Media limited by tier
      media: mediaToShow,
      // Credits/Experience (show more for premium)
      credits: talentTier === 'premium' || requesterIsPremium ? talent.credits : talent.credits?.slice(0, 3),
      // Agency info if applicable
      agencyId: talent.agency_id,
      agencyName: talent.agency_id ? await getAgencyName(talent.agency_id) : null,
    };
    
    return c.json(response, 200);
  } catch (error) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * GET /api/v1/public/agency/:id/roster
 * Fetch all talents managed by an agency
 */
app.get('/public/agency/:id/roster', async (c) => {
  const agencyId = c.req.param('id');
  const requesterTier = (c.req.header('x-user-tier') || 'free') as 'free' | 'premium';
  const requesterRole = c.req.header('x-user-role');
  const requesterIsPremium = isRequesterAuthorized(requesterTier, requesterRole);
  
  try {
    // TODO: Fetch from database
    const talents = await fetchAgencyTalentsFromDB(agencyId);
    
    if (!talents || talents.length === 0) {
      return c.json({ error: 'No talents found for this agency' }, 404);
    }
    
    // Apply the same masking rules to each talent
    const roster = talents.map((talent) => {
      const talentTier = (talent.account_tier || 'free') as 'free' | 'premium';
      const contactInfo = {
        email: talent.email,
        phone: talent.phone,
        instagram: talent.instagram,
        tiktok: talent.tiktok,
        facebook: talent.facebook,
      };
      
      const maskedContacts = applyContactMasking(contactInfo, talentTier, requesterIsPremium);
      const mediaToShow = filterMediaByTier(talent.media || [], talentTier, requesterIsPremium);
      
      return {
        id: talent.id,
        name: talent.name,
        profileImage: talent.profile_image,
        accountTier: talentTier,
        email: maskedContacts.email,
        phone: maskedContacts.phone,
        media: mediaToShow?.slice(0, 5), // Show only first 5 photos in roster
        // Contact redirect to agency
        contactEmail: talent.agency_contact_email,
        contactPhone: talent.agency_contact_phone,
        whatsappUrl: talent.agency_whatsapp_url,
      };
    });
    
    return c.json({
      agencyId,
      agencyName: await getAgencyName(agencyId),
      talentCount: roster.length,
      talents: roster,
    }, 200);
  } catch (error) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * Helper function to fetch talent from database
 * TODO: Replace with actual D1 query
 */
async function fetchTalentFromDB(talentId: string) {
  // Placeholder for D1 query
  // const db = ...
  // return await db.prepare('SELECT * FROM talents WHERE id = ?').bind(talentId).first();
  return null;
}

/**
 * Helper function to fetch agency talents from database
 * TODO: Replace with actual D1 query
 */
async function fetchAgencyTalentsFromDB(agencyId: string) {
  // Placeholder for D1 query
  // const db = ...
  // return await db.prepare('SELECT * FROM talents WHERE agency_id = ?').bind(agencyId).all();
  return [];
}

/**
 * Helper function to get agency name
 * TODO: Replace with actual D1 query
 */
async function getAgencyName(agencyId: string): Promise<string | null> {
  // Placeholder for D1 query
  // const db = ...
  // const result = await db.prepare('SELECT agency_name FROM agencies WHERE id = ?').bind(agencyId).first();
  // return result?.agency_name || null;
  return null;
}

export default app;
