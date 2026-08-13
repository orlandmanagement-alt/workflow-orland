/**
 * Cloudflare Workers AI Smart Matching
 * Uses Cloudflare's built-in AI to parse natural language talent requests
 */

import { Hono } from 'hono';
import { Context } from 'hono';
import type { Bindings, Variables } from '../../index';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

interface AIMatchRequest {
  prompt: string;
  limit?: number;
}

interface ExtractedCriteria {
  gender?: string;
  ethnicity?: string;
  ageMin?: number;
  ageMax?: number;
  category?: string;
  height?: string;
  language?: string;
  skills?: string[];
}

/**
 * POST /api/v1/ai/match
 * Parse natural language talent request using Cloudflare Workers AI
 * 
 * Example:
 * {
 *   "prompt": "I need an Asian female, 20s, for a beauty commercial with dance skills",
 *   "limit": 10
 * }
 */
app.post('/match', async (c) => {
  const userId = c.get('userId');

  try {
    const { prompt, limit = 10 } = await c.req.json<AIMatchRequest>();

    if (!prompt || prompt.trim().length === 0) {
      return c.json({
        error: 'Prompt is required'
      }, 400);
    }

    // Check user is premium client
    const userCheck = await c.env.DB_SSO.prepare(
      'SELECT account_tier FROM users WHERE id = ?'
    ).bind(userId).first<any>();

    if (!userCheck || userCheck.account_tier !== 'premium') {
      return c.json({
        error: 'Smart matching requires premium account',
        status: 'error'
      }, 403);
    }

    // Call Cloudflare Workers AI to extract criteria
    const aiPrompt = `Extract talent selection criteria from this request and return JSON:
"${prompt}"

Return ONLY valid JSON (no markdown, no extra text) with these fields:
{
  "gender": "male|female|any",
  "ethnicity": "asian|caucasian|african|latin|middle_eastern|mixed|any",
  "ageMin": number or null,
  "ageMax": number or null,
  "category": "modeling|acting|dancing|singing|hosting|sports|other",
  "height": "short|medium|tall" or null,
  "language": "english|indonesian|mandarin|other" or null,
  "skills": ["skill1", "skill2"] or []
}`;

    try {
      // Build AI request using Cloudflare's built-in models
      const response = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
        prompt: aiPrompt,
        max_tokens: 200
      }) as any;

      // Parse AI response
      let criteria: ExtractedCriteria = {};
      
      if (response.result && response.result.response) {
        try {
          // Extract JSON from response (AI might include extra text)
          const jsonMatch = response.result.response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            criteria = JSON.parse(jsonMatch[0]);
          }
        } catch (parseError) {
        }
      }

      // Query talents based on extracted criteria
      let query = `SELECT id, name, gender, age, height, category FROM talents WHERE profile_visible = true`;
      let params: any[] = [];

      if (criteria.gender && criteria.gender !== 'any') {
        query += ` AND LOWER(gender) = ?`;
        params.push(criteria.gender.toLowerCase());
      }

      if (criteria.ageMin && criteria.ageMax) {
        query += ` AND age BETWEEN ? AND ?`;
        params.push(criteria.ageMin, criteria.ageMax);
      }

      if (criteria.category) {
        query += ` AND category = ?`;
        params.push(criteria.category);
      }

      if (criteria.height) {
        query += ` AND height = ?`;
        params.push(criteria.height);
      }

      query += ` LIMIT ?`;
      params.push(Math.min(limit, 50)); // Max 50 results

      const results = await c.env.DB_CORE.prepare(query)
        .bind(...params)
        .all<any>();

      return c.json({
        status: 'success',
        data: {
          extractedCriteria: criteria,
          matchCount: results.results.length,
          talents: results.results
        }
      });
    } catch (aiError) {
      // Fallback: Return all public talents if AI fails
      const fallback = await c.env.DB_CORE.prepare(`
        SELECT id, name, gender, age, category 
        FROM talents 
        WHERE profile_visible = true 
        LIMIT ?
      `).bind(Math.min(limit, 50)).all<any>();

      return c.json({
        status: 'success',
        data: {
          message: 'AI processing failed, returning popular talents',
          matchCount: fallback.results.length,
          talents: fallback.results
        }
      });
    }
  } catch (error) {
    return c.json({ status: 'error', message: 'Failed to process talent search' }, 500);
  }
});

/**
 * POST /api/v1/ai/match/batch
 * Process multiple search prompts (for agency bulk operations)
 */
app.post('/match/batch', async (c) => {
  const userId = c.get('userId');

  try {
    const { prompts } = await c.req.json<{ prompts: string[] }>();

    if (!Array.isArray(prompts) || prompts.length === 0) {
      return c.json({
        error: 'Prompts array is required'
      }, 400);
    }

    if (prompts.length > 10) {
      return c.json({
        error: 'Maximum 10 prompts per batch'
      }, 400);
    }

    // Check user permission
    const userCheck = await c.env.DB_SSO.prepare(
      'SELECT account_tier, role FROM users WHERE id = ?'
    ).bind(userId).first<any>();

    if (!userCheck || (userCheck.account_tier !== 'premium' && userCheck.role !== 'admin')) {
      return c.json({
        error: 'Batch matching requires premium or admin account',
        status: 'error'
      }, 403);
    }

    // Process each prompt
    const results = await Promise.all(
      prompts.map(async (prompt) => {
        try {
          const aiPrompt = `Extract talent criteria: "${prompt}". Return JSON: {"gender":"male|female|any","ageMin":null,"ageMax":null,"category":"modeling|acting|dancing|singing|hosting|other","height":"short|medium|tall|any"}`;
          
          const response = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
            prompt: aiPrompt,
            max_tokens: 150
          }) as any;

          let criteria = {};
          if (response.result && response.result.response) {
            try {
              const jsonMatch = response.result.response.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                criteria = JSON.parse(jsonMatch[0]);
              }
            } catch (e) {}
          }

          return { prompt, criteria, success: true };
        } catch (err) {
          return { prompt, error: 'Processing failed', success: false };
        }
      })
    );

    return c.json({
      status: 'success',
      data: {
        processed: results.filter(r => r.success).length,
        total: results.length,
        results
      }
    });
  } catch (error) {
    return c.json({ status: 'error', message: 'Failed to process batch search' }, 500);
  }
});

/**
 * GET /api/v1/ai/match/suggestions
 * Get AI-powered talent suggestions based on previous views
 */
app.get('/match/suggestions', async (c) => {
  const userId = c.get('userId');

  try {
    // Get user's recent talent views to understand preferences
    const recentViews = await c.env.DB_LOGS.prepare(`
      SELECT pv.talent_id, t.gender, t.age, t.category, COUNT(*) as view_count
      FROM profile_views pv
      JOIN talents t ON pv.talent_id = t.id
      WHERE pv.viewer_id = ? 
      AND pv.viewed_at > datetime('now', '-30 days')
      GROUP BY t.category, t.gender
      ORDER BY view_count DESC
      LIMIT 5
    `).bind(userId).all<any>();

    if (recentViews.results.length === 0) {
      return c.json({
        status: 'success',
        data: {
          message: 'Not enough viewing history for suggestions',
          suggestions: []
        }
      });
    }

    // Build AI prompt based on viewing patterns
    const categories = recentViews.results.map(v => v.category).join(', ');
    const genders = recentViews.results.map(v => v.gender).join(', ');

    const aiPrompt = `Based on this viewing pattern, suggest what type of talents to search for: Categories: ${categories}, Genders: ${genders}. Respond with 3 search prompts as JSON array ["prompt1", "prompt2", "prompt3"]`;

    const response = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
      prompt: aiPrompt,
      max_tokens: 200
    }) as any;

    let suggestions = [];
    if (response.result && response.result.response) {
      try {
        const jsonMatch = response.result.response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          suggestions = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
      }
    }

    return c.json({
      status: 'success',
      data: {
        viewingPattern: recentViews.results,
        suggestions: suggestions.slice(0, 3)
      }
    });
  } catch (error) {
    return c.json({ status: 'error', message: 'Failed to get suggestions' }, 500);
  }
});

export default app;
