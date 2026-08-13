// Smart Match Algorithm Service
// File: apps/appapi/src/services/smartMatchService.ts
// Purpose: AI-powered job-to-talent matching algorithm with configurable weights

import type { Database } from '@cloudflare/workers-types';

interface TalentProfile {
  id: string;
  age: number;
  gender: string;
  domicile: string;
  height_cm: number;
  weight_kg: number;
  skin_tone: string;
  face_type: string;
  skills_json: string; // JSON array stringified
  languages_json: string;
  rate_daily_min: number;
  rate_daily_max: number;
  preferred_project_types: string;
  location_willing_to_travel: boolean;
  max_travel_hours?: number;
  is_available: boolean;
  profile_completion_percent: number;
}

interface CastingRequirement {
  id: string;
  project_id: string;
  role_id: string;
  required_gender?: string;
  required_age_min?: number;
  required_age_max?: number;
  height_min_cm?: number;
  height_max_cm?: number;
  skin_tone_preferred?: string; // JSON array stringified
  face_type_preferred?: string;
  required_skills?: string; // JSON array
  budget_min: number;
  budget_max: number;
  shoot_location: string;
  travel_required: boolean;
  special_requirements?: string;
  preferred_qualities?: string; // JSON array
}

interface MatchResult {
  talent_id: string;
  project_id: string;
  role_id: string;
  match_percentage: number;
  hard_filters_passed: boolean;
  hard_filters_failed_reason?: string;
  soft_filters_score: number;
  score_breakdown: ScoreBreakdown;
}

interface ScoreBreakdown {
  age_match: { score: number; weight: number; reason: string };
  gender_match: { score: number; weight: number; reason: string };
  location_match: { score: number; weight: number; reason: string };
  height_match: { score: number; weight: number; reason: string };
  skin_tone_match: { score: number; weight: number; reason: string };
  skills_match: { score: number; weight: number; reason: string };
  budget_fit: { score: number; weight: number; reason: string };
  profile_completeness: { score: number; weight: number; reason: string };
  language_match: { score: number; weight: number; reason: string };
  [key: string]: any;
}

// ============================================================================
// WEIGHTING CONFIGURATION (Easy to tune for business rules)
// ============================================================================
const MATCHING_WEIGHTS = {
  age: 0.15, // 15% of final score
  gender: 0.20, // 20% (critical for some roles)
  location: 0.15, // 15%
  height: 0.10, // 10%
  skin_tone: 0.08, // 8%
  skills: 0.15, // 15%
  budget: 0.10, // 10%
  profile_complete: 0.05, // 5%
  language: 0.02, // 2%
};

// ============================================================================
// SMART MATCH SERVICE
// ============================================================================
export class SmartMatchService {
  /**
   * HARD FILTERS: Musti-pass requirements
   * Jika gagal, talent tidak akan masuk rekomendasi
   */
  private hardFiltersPass(
    talent: TalentProfile,
    requirements: CastingRequirement
  ): { passed: boolean; reason?: string } {
    // 1. Gender Filter
    if (requirements.required_gender && requirements.required_gender !== 'any') {
      if (talent.gender !== requirements.required_gender) {
        return {
          passed: false,
          reason: `Gender mismatch: Required "${requirements.required_gender}", but talent is "${talent.gender}"`,
        };
      }
    }

    // 2. Age Filter
    if (requirements.required_age_min && talent.age < requirements.required_age_min) {
      return {
        passed: false,
        reason: `Age too young: Required min ${requirements.required_age_min}, but talent is ${talent.age}`,
      };
    }
    if (requirements.required_age_max && talent.age > requirements.required_age_max) {
      return {
        passed: false,
        reason: `Age too old: Required max ${requirements.required_age_max}, but talent is ${talent.age}`,
      };
    }

    // 3. Location Filter (Hard if no travel budget)
    if (!requirements.travel_required) {
      if (talent.domicile !== requirements.shoot_location) {
        if (!talent.location_willing_to_travel) {
          return {
            passed: false,
            reason: `Location mismatch: Talent in "${talent.domicile}", but shoot is in "${requirements.shoot_location}" with no travel allowed`,
          };
        }
      }
    }

    // 4. Availability Check
    if (!talent.is_available) {
      return {
        passed: false,
        reason: 'Talent is currently not available',
      };
    }

    // 5. Profile Completeness (Must be at least 50% complete to apply)
    if (talent.profile_completion_percent < 50) {
      return {
        passed: false,
        reason: `Profile incomplete: Only ${talent.profile_completion_percent}% complete, required 50%`,
      };
    }

    return { passed: true };
  }

  /**
   * SOFT FILTERS: Scoring system (0-100)
   * Mengukur seberapa "cocok" talent dengan job
   */
  private softFiltersScore(
    talent: TalentProfile,
    requirements: CastingRequirement
  ): ScoreBreakdown {
    const breakdown: ScoreBreakdown = {
      age_match: this.scoreAge(talent, requirements),
      gender_match: this.scoreGender(talent, requirements),
      location_match: this.scoreLocation(talent, requirements),
      height_match: this.scoreHeight(talent, requirements),
      skin_tone_match: this.scoreSkinTone(talent, requirements),
      skills_match: this.scoreSkills(talent, requirements),
      budget_fit: this.scoreBudget(talent, requirements),
      profile_completeness: this.scoreProfileCompleteness(talent),
      language_match: this.scoreLanguage(talent, requirements),
    };

    return breakdown;
  }

  // === SCORING FUNCTIONS (Masing-masing return score 0-100) ===

  private scoreAge(talent: TalentProfile, req: CastingRequirement) {
    const weight = MATCHING_WEIGHTS.age;
    let score = 100;

    if (req.required_age_min && req.required_age_max) {
      const ideal_age = (req.required_age_min + req.required_age_max) / 2;
      const age_diff = Math.abs(talent.age - ideal_age);

      // Tolerance: ±3 years gives full score
      score = Math.max(0, 100 - age_diff * 10);
    }

    return {
      score: Math.round(score),
      weight,
      reason: `Age ${talent.age} vs required ${req.required_age_min}-${req.required_age_max}`,
    };
  }

  private scoreGender(talent: TalentProfile, req: CastingRequirement) {
    const weight = MATCHING_WEIGHTS.gender;
    let score = 100;

    if (req.required_gender && req.required_gender !== 'any') {
      score = talent.gender === req.required_gender ? 100 : 0;
    }

    return {
      score: Math.round(score),
      weight,
      reason: `Gender match: ${talent.gender} ${score === 100 ? '✓' : '✗'}`,
    };
  }

  private scoreLocation(talent: TalentProfile, req: CastingRequirement) {
    const weight = MATCHING_WEIGHTS.location;
    let score = 100;

    const talent_city = talent.domicile.split(',')[0].trim();
    const required_city = req.shoot_location.split(',')[0].trim();

    if (talent_city !== required_city) {
      if (req.travel_required) {
        // Travel is allowed, check distance willingness
        score = talent.location_willing_to_travel ? 80 : 30;
      } else {
        score = 20; // Severely penalize if travel not allowed
      }
    }

    return {
      score: Math.round(score),
      weight,
      reason: `Location: ${talent.domicile} to ${req.shoot_location}`,
    };
  }

  private scoreHeight(talent: TalentProfile, req: CastingRequirement) {
    const weight = MATCHING_WEIGHTS.height;
    let score = 100;

    if (req.height_min_cm && req.height_max_cm) {
      const height_range = req.height_max_cm - req.height_min_cm;
      const ideal_height = (req.height_min_cm + req.height_max_cm) / 2;
      const height_diff = Math.abs(talent.height_cm - ideal_height);

      // Within range = 100, outside = decreasing penalty
      if (height_diff <= height_range / 2) {
        score = 100;
      } else {
        score = Math.max(0, 100 - (height_diff - height_range / 2) * 5);
      }
    }

    return {
      score: Math.round(score),
      weight,
      reason: `Height ${talent.height_cm}cm vs ${req.height_min_cm}-${req.height_max_cm}cm`,
    };
  }

  private scoreSkinTone(talent: TalentProfile, req: CastingRequirement) {
    const weight = MATCHING_WEIGHTS.skin_tone;
    let score = 100;

    if (req.skin_tone_preferred) {
      try {
        const preferred = JSON.parse(req.skin_tone_preferred);
        score = preferred.includes(talent.skin_tone) ? 100 : 60;
      } catch {
        score = 100; // If no preference, assume match
      }
    }

    return {
      score: Math.round(score),
      weight,
      reason: `Skin tone: ${talent.skin_tone}`,
    };
  }

  private scoreSkills(talent: TalentProfile, req: CastingRequirement) {
    const weight = MATCHING_WEIGHTS.skills;
    let score = 100;

    if (req.required_skills) {
      try {
        const required = JSON.parse(req.required_skills);
        const talent_skills = JSON.parse(talent.skills_json || '[]');

        const matched = required.filter((skill: string) =>
          talent_skills.includes(skill)
        );

        score = (matched.length / required.length) * 100;
      } catch {
        score = 100; // If error, assume match
      }
    }

    return {
      score: Math.round(score),
      weight,
      reason: `Skills match score`,
    };
  }

  private scoreBudget(talent: TalentProfile, req: CastingRequirement) {
    const weight = MATCHING_WEIGHTS.budget;
    let score = 100;

    const talent_rate = talent.rate_daily_min || 1000000; // Default 1M if not set
    const budget_per_day = (req.budget_min + req.budget_max) / 2;

    if (talent_rate > budget_per_day * 1.2) {
      // Talent asks for 20% more than budget
      score = Math.max(0, 100 - (talent_rate - budget_per_day) / 100000);
    }

    return {
      score: Math.round(Math.min(score, 100)),
      weight,
      reason: `Budget: Talent asks ${talent_rate}, project budget ${req.budget_min}-${req.budget_max}`,
    };
  }

  private scoreProfileCompleteness(talent: TalentProfile) {
    const weight = MATCHING_WEIGHTS.profile_complete;
    const score = talent.profile_completion_percent; // 0-100

    return {
      score: Math.round(score),
      weight,
      reason: `Profile ${score}% complete`,
    };
  }

  private scoreLanguage(talent: TalentProfile, req: CastingRequirement) {
    const weight = MATCHING_WEIGHTS.language;
    let score = 100;

    if (req.required_languages) {
      try {
        const required = JSON.parse(req.required_languages);
        const talent_langs = JSON.parse(talent.languages_json || '[]');

        // Indonesian always assumed
        const matched = required.filter((lang: string) =>
          talent_langs.includes(lang) || lang === 'indonesian'
        );

        score = required.length === 0 ? 100 : (matched.length / required.length) * 100;
      } catch {
        score = 100;
      }
    }

    return {
      score: Math.round(score),
      weight,
      reason: `Language requirements met`,
    };
  }

  /**
   * CALCULATE WEIGHTED FINAL SCORE
   */
  private calculateFinalScore(breakdown: ScoreBreakdown): number {
    let totalScore = 0;
    let totalWeight = 0;

    for (const [key, data] of Object.entries(breakdown)) {
      if (data.weight && typeof data.score === 'number') {
        totalScore += data.score * data.weight;
        totalWeight += data.weight;
      }
    }

    return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) / 100 : 0;
  }

  /**
   * MAIN MATCHING FUNCTION
   * Returns match result with percentage and detailed breakdown
   */
  async matchTalentToJob(
    talent: TalentProfile,
    requirements: CastingRequirement
  ): Promise<MatchResult> {
    // Step 1: Hard Filters
    const hardFiltersResult = this.hardFiltersPass(talent, requirements);

    if (!hardFiltersResult.passed) {
      return {
        talent_id: talent.id,
        project_id: requirements.project_id,
        role_id: requirements.role_id,
        match_percentage: 0,
        hard_filters_passed: false,
        hard_filters_failed_reason: hardFiltersResult.reason,
        soft_filters_score: 0,
        score_breakdown: {},
      };
    }

    // Step 2: Soft Filters & Scoring
    const breakdown = this.softFiltersScore(talent, requirements);

    // Step 3: Calculate Final Score
    const finalScore = this.calculateFinalScore(breakdown);

    return {
      talent_id: talent.id,
      project_id: requirements.project_id,
      role_id: requirements.role_id,
      match_percentage: finalScore,
      hard_filters_passed: true,
      soft_filters_score: finalScore,
      score_breakdown: breakdown,
    };
  }

  /**
   * BATCH MATCHING: Find all suitable talents for a job
   * Used for smart recommendations
   */
  async findBestTalentsForJob(
    db: Database,
    projectId: string,
    roleId: string,
    limit: number = 20,
    minMatchPercent: number = 70
  ): Promise<MatchResult[]> {
    // Get casting requirements
    const requirements = await db
      .prepare(
        `SELECT * FROM casting_requirements WHERE project_id = ? AND role_id = ? AND is_active = TRUE`
      )
      .bind(projectId, roleId)
      .first();

    if (!requirements) {
      return [];
    }

    // Get all active talents (simplified query - in production, use pagination)
    const talents = await db
      .prepare(
        `SELECT * FROM talent_profiles WHERE is_available = TRUE AND profile_completion_percent >= 50`
      )
      .all();

    if (!talents.results) {
      return [];
    }

    // Score each talent
    const matches = await Promise.all(
      talents.results.map((talent: any) =>
        this.matchTalentToJob(talent, requirements)
      )
    );

    // Filter by minimum match percentage and sort by score
    return matches
      .filter((m) => m.match_percentage >= minMatchPercent)
      .sort((a, b) => b.match_percentage - a.match_percentage)
      .slice(0, limit);
  }

  /**
   * PERSONALIZED RECOMMENDATIONS: Find best jobs for a talent
   */
  async findBestJobsForTalent(
    db: Database,
    talentId: string,
    limit: number = 20,
    minMatchPercent: number = 70
  ): Promise<MatchResult[]> {
    // Get talent profile
    const talent = await db
      .prepare(`SELECT * FROM talent_profiles WHERE talent_id = ?`)
      .bind(talentId)
      .first();

    if (!talent) {
      return [];
    }

    // Get all active casting requirements
    const requirements = await db
      .prepare(
        `SELECT cr.* FROM casting_requirements cr
         JOIN projects p ON cr.project_id = p.id
         WHERE cr.is_active = TRUE
         AND p.status IN ('open', 'hiring')
         AND cr.project_id NOT IN (
           SELECT project_id FROM job_applications 
           WHERE talent_id = ? AND status IN ('applied', 'shortlisted', 'hired')
         )`
      )
      .bind(talentId)
      .all();

    if (!requirements.results) {
      return [];
    }

    // Score each job
    const matches = await Promise.all(
      requirements.results.map((req: any) =>
        this.matchTalentToJob(talent, req)
      )
    );

    // Filter and sort
    return matches
      .filter((m) => m.match_percentage >= minMatchPercent)
      .sort((a, b) => b.match_percentage - a.match_percentage)
      .slice(0, limit);
  }
}

export default new SmartMatchService();
