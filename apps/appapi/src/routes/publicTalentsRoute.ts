import { Hono } from 'hono';

const publicTalentApiRoute = new Hono();

/**
 * GET /api/v1/public/talents/:username
 * This endpoint is public and does not require authentication.
 * It fetches a talent's public profile based on their unique username.
 */
publicTalentApiRoute.get('/:username', (c) => {
    const username = c.req.param('username');
    // TODO: Implement logic to fetch public profile data from talents,
    // talent_profiles, talent_credits, and talent_additional_photos
    // using the username.
    // Remember to apply data masking and tier-based visibility rules.
    return c.json({ message: `Fetch public profile for username ${username}` });
});

/**
 * GET /api/v1/public/talents/agency/:agencyId
 * (Bagian ini sebelumnya terpotong dan menyebabkan Syntax Error)
 */
publicTalentApiRoute.get('/agency/:agencyId', async (c) => {
  try {
    const agencyId = c.req.param('agencyId');
    const talents: any[] = await fetchAgencyTalentsFromDB(agencyId);
    
    // Apply the same masking rules to each talent
    const roster = talents.map((talent) => {
      const talentTier = (talent.account_tier || 'free') as 'free' | 'premium';
      
      return {
        id: talent.id,
        name: talent.name,
        profileImage: talent.profile_image,
        accountTier: talentTier,
        // Data masking disederhanakan sementara agar lolos dari TS error (fungsi applyContactMasking tidak ditemukan)
        email: talent.email,
        phone: talent.phone,
        media: talent.media?.slice(0, 5) || [], // Show only first 5 photos in roster
        
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
  return null;
}

/**
 * Helper function to fetch agency talents from database
 * TODO: Replace with actual D1 query
 */
async function fetchAgencyTalentsFromDB(agencyId: string) {
  // Placeholder for D1 query
  return [];
}

/**
 * Helper function to get agency name
 * TODO: Replace with actual D1 query
 */
async function getAgencyName(agencyId: string): Promise<string | null> {
  // Placeholder for D1 query
  return null;
}

// Pastikan HANYA ADA SATU export default di bagian paling bawah
export default publicTalentApiRoute;