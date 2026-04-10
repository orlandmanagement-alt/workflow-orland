/**
 * Orland Smart Matching Engine - Implementation
 *
 * Core implementation of the AI-powered talent-to-job matching algorithm.
 * Includes hard filter validation and soft scoring with detailed breakdowns.
 *
 * @version 2.0
 * @author Orland Team
 */

import {
  TalentProfile,
  CastingRequirement,
  MatchResult,
  ScoreBreakdown,
  ScoreFactor,
  MatchingConfig,
  getRecommendation,
} from '../types.talent';

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_MATCHING_CONFIG: MatchingConfig = {
  min_profile_completion: 50,
  weights: {
    age: 0.15,
    gender: 0.2,
    location: 0.15,
    height: 0.1,
    skin_tone: 0.08,
    skills: 0.15,
    budget: 0.1,
    profile_complete: 0.05,
    language: 0.02,
  },
  score_ranges: {
    strong_match: [80, 100],
    good_match: [60, 80],
    fair_match: [40, 60],
    poor_match: [0, 40],
  },
  age_tolerance: 3,
  age_score_degradation_rate: 10,
  height_tolerance: 5,
  height_score_degradation_rate: 5,
  budget_tolerance_percent: 120,
};

// ============================================================================
// SMART MATCHING ENGINE CLASS
// ============================================================================

export class SmartMatchingEngine {
  private config: MatchingConfig;

  constructor(config?: Partial<MatchingConfig>) {
    this.config = { ...DEFAULT_MATCHING_CONFIG, ...config };
  }

  // =========================================================================
  // PUBLIC API
  // =========================================================================

  /**
   * Main matching function - orchestrates hard filters and soft scoring
   * @returns MatchResult with final percentage and breakdown
   */
  public match(
    talent: TalentProfile,
    requirement: CastingRequirement
  ): MatchResult {
    const startTime = Date.now();

    // Phase 1: Hard Filters
    const hardFilters = this.validateHardFilters(talent, requirement);

    // If hard filters fail, return 0% match immediately
    if (!hardFilters.passed) {
      return {
        talent_id: talent.talent_id,
        project_id: requirement.project_id,
        role_id: requirement.role_id,
        hard_filters_passed: false,
        hard_filters_failed_reason: hardFilters.failureReason,
        hard_filters_details: hardFilters.details,
        soft_filters_score: 0,
        score_breakdown: {} as ScoreBreakdown,
        match_percentage: 0,
        recommendation: 'poor_match',
        reasoning: `Hard filter failed: ${hardFilters.failureReason}`,
        algorithm_version: 'v1.0',
        calculated_at: new Date().toISOString(),
        calculation_duration_ms: Date.now() - startTime,
      };
    }

    // Phase 2: Soft Scoring
    const scoreBreakdown = this.calculateSoftScores(talent, requirement);
    const softScore = this.calculateFinalScore(scoreBreakdown);

    const finalScore = Math.round(softScore);
    const recommendation = getRecommendation(finalScore);

    // Generate reasoning
    const reasoning = this.generateReasoning(
      talent,
      requirement,
      scoreBreakdown,
      finalScore
    );

    return {
      talent_id: talent.talent_id,
      project_id: requirement.project_id,
      role_id: requirement.role_id,
      hard_filters_passed: true,
      hard_filters_details: hardFilters.details,
      soft_filters_score: softScore,
      score_breakdown: scoreBreakdown,
      match_percentage: finalScore,
      recommendation,
      reasoning,
      algorithm_version: 'v1.0',
      calculated_at: new Date().toISOString(),
      calculation_duration_ms: Date.now() - startTime,
    };
  }

  /**
   * Batch matching - efficiently match one talent to multiple requirements
   */
  public matchBatch(
    talent: TalentProfile,
    requirements: CastingRequirement[]
  ): MatchResult[] {
    return requirements.map(req => this.match(talent, req)).sort((a, b) => b.match_percentage - a.match_percentage);
  }

  /**
   * Reverse batch - match multiple talents to one requirement
   */
  public matchReverse(
    talents: TalentProfile[],
    requirement: CastingRequirement
  ): MatchResult[] {
    return talents
      .map(talent => this.match(talent, requirement))
      .sort((a, b) => b.match_percentage - a.match_percentage);
  }

  // =========================================================================
  // PHASE 1: HARD FILTERS
  // =========================================================================

  private validateHardFilters(
    talent: TalentProfile,
    requirement: CastingRequirement
  ): {
    passed: boolean;
    failureReason?: string;
    details: Record<string, boolean>;
  } {
    const details: Record<string, boolean> = {};

    // 1. Gender Check
    if (requirement.required_gender && requirement.required_gender !== 'any') {
      const genderPassed = talent.gender === requirement.required_gender;
      details.gender_passed = genderPassed;
      if (!genderPassed) {
        return {
          passed: false,
          failureReason: `Gender mismatch: talent is ${talent.gender}, required ${requirement.required_gender}`,
          details,
        };
      }
    } else {
      details.gender_passed = true;
    }

    // 2. Age Range Check
    if (requirement.required_age_min) {
      const agePassed = talent.age >= requirement.required_age_min;
      details.age_min_passed = agePassed;
      if (!agePassed) {
        return {
          passed: false,
          failureReason: `Too young: talent is ${talent.age}, minimum required ${requirement.required_age_min}`,
          details,
        };
      }
    } else {
      details.age_min_passed = true;
    }

    if (requirement.required_age_max) {
      const agePassed = talent.age <= requirement.required_age_max;
      details.age_max_passed = agePassed;
      if (!agePassed) {
        return {
          passed: false,
          failureReason: `Too old: talent is ${talent.age}, maximum required ${requirement.required_age_max}`,
          details,
        };
      }
    } else {
      details.age_max_passed = true;
    }

    // 3. Availability Check
    if (!talent.is_available) {
      details.availability_passed = false;
      return {
        passed: false,
        failureReason: `Talent is not currently available`,
        details,
      };
    }
    details.availability_passed = true;

    // 4. Profile Completeness Check
    const completeness = talent.profile_completion_percent || 0;
    if (completeness < this.config.min_profile_completion) {
      details.profile_complete_passed = false;
      return {
        passed: false,
        failureReason: `Profile incomplete: ${completeness}% vs minimum ${this.config.min_profile_completion}%`,
        details,
      };
    }
    details.profile_complete_passed = true;

    // 5. Location Check (if no travel budget)
    if (!requirement.travel_required) {
      const locationMatch =
        talent.domicile === requirement.shoot_location ||
        talent.location_willing_to_travel;
      details.location_passed = locationMatch;
      if (!locationMatch) {
        return {
          passed: false,
          failureReason: `Location conflict: talent in ${talent.domicile}, shoot in ${requirement.shoot_location}`,
          details,
        };
      }
    } else {
      details.location_passed = true;
    }

    // All hard filters passed
    return { passed: true, details };
  }

  // =========================================================================
  // PHASE 2: SOFT SCORING
  // =========================================================================

  private calculateSoftScores(
    talent: TalentProfile,
    requirement: CastingRequirement
  ): ScoreBreakdown {
    return {
      age_match: this.scoreAge(talent, requirement),
      height_match: this.scoreHeight(talent, requirement),
      skin_tone_match: this.scoreSkinTone(talent, requirement),
      face_type_match: this.scoreFaceType(talent, requirement),
      skills_match: this.scoreSkills(talent, requirement),
      language_match: this.scoreLanguage(talent, requirement),
      location_match: this.scoreLocation(talent, requirement),
      availability_match: this.scoreAvailability(talent, requirement),
      travel_capability: requirement.travel_required
        ? this.scoreTravelCapability(talent, requirement)
        : undefined,
      budget_fit: this.scoreBudget(talent, requirement),
      profile_completeness: this.scoreProfileCompleteness(talent),
      gender_match: this.scoreGender(talent, requirement),
    };
  }

  /**
   * Age Matching Score (0-100)
   * Full points within tolerance, degrades linearly outside
   */
  private scoreAge(
    talent: TalentProfile,
    requirement: CastingRequirement
  ): ScoreFactor {
    if (!requirement.required_age_min || !requirement.required_age_max) {
      return {
        score: 100,
        weight: this.config.weights.age,
        reason: 'No age preference specified',
      };
    }

    const idealAge =
      (requirement.required_age_min + requirement.required_age_max) / 2;
    const ageDiff = Math.abs(talent.age - idealAge);

    let score: number;
    if (ageDiff <= this.config.age_tolerance) {
      score = 100;
    } else {
      const excessDiff = ageDiff - this.config.age_tolerance;
      score = Math.max(
        0,
        100 - excessDiff * this.config.age_score_degradation_rate
      );
    }

    return {
      score: Math.round(score),
      weight: this.config.weights.age,
      reason: `Talent age ${talent.age} vs ideal ${Math.round(idealAge)}`,
      details: {
        talent_age: talent.age,
        ideal_age: Math.round(idealAge),
        age_diff: ageDiff.toFixed(1),
      },
    };
  }

  /**
   * Height Matching Score (0-100)
   * Full points within range, degrades outside
   */
  private scoreHeight(
    talent: TalentProfile,
    requirement: CastingRequirement
  ): ScoreFactor {
    if (!requirement.height_min_cm || !requirement.height_max_cm) {
      return {
        score: 100,
        weight: this.config.weights.height,
        reason: 'No height preference specified',
      };
    }

    const range = requirement.height_max_cm - requirement.height_min_cm;
    const ideal = (requirement.height_min_cm + requirement.height_max_cm) / 2;
    const diff = Math.abs(talent.height_cm - ideal);

    let score: number;
    if (diff <= range / 2) {
      score = 100;
    } else {
      const excessDiff = diff - range / 2;
      score = Math.max(
        0,
        100 - excessDiff * this.config.height_score_degradation_rate
      );
    }

    return {
      score: Math.round(score),
      weight: this.config.weights.height,
      reason: `Talent height ${talent.height_cm}cm vs ideal ${Math.round(ideal)}cm (range ${requirement.height_min_cm}-${requirement.height_max_cm}cm)`,
      details: {
        talent_height: talent.height_cm,
        ideal_height: Math.round(ideal),
        height_range: [requirement.height_min_cm, requirement.height_max_cm],
      },
    };
  }

  /**
   * Skin Tone Matching Score (0-100)
   * Exact match = 100, preference list match = 90, other = 50
   */
  private scoreSkinTone(
    talent: TalentProfile,
    requirement: CastingRequirement
  ): ScoreFactor {
    if (!requirement.skin_tone_preferred || requirement.skin_tone_preferred.length === 0) {
      return {
        score: 100,
        weight: this.config.weights.skin_tone,
        reason: 'No skin tone preference specified',
      };
    }

    const preferred = requirement.skin_tone_preferred;
    const isPreferred = preferred.includes(talent.skin_tone);

    return {
      score: isPreferred ? 100 : 50,
      weight: this.config.weights.skin_tone,
      reason: isPreferred
        ? `Talent skin tone "${talent.skin_tone}" is in preferred list`
        : `Talent skin tone "${talent.skin_tone}" not in preferred list`,
      details: {
        talent_tone: talent.skin_tone,
        preferred_tones: preferred,
      },
    };
  }

  /**
   * Face Type Matching Score (0-100)
   */
  private scoreFaceType(
    talent: TalentProfile,
    requirement: CastingRequirement
  ): ScoreFactor {
    if (!requirement.face_type_preferred || requirement.face_type_preferred.length === 0) {
      return {
        score: 100,
        weight: 0,
        reason: 'No face type preference specified',
      };
    }

    const preferred = requirement.face_type_preferred;
    const isPreferred = preferred.includes(talent.face_type);

    return {
      score: isPreferred ? 100 : 60,
      weight: 0, // Not included in main weights
      reason: isPreferred
        ? `Talent face type "${talent.face_type}" is in preferred list`
        : `Talent face type "${talent.face_type}" not in preferred list`,
    };
  }

  /**
   * Skills Matching Score (0-100)
   * Percentage of required skills that talent possesses
   */
  private scoreSkills(
    talent: TalentProfile,
    requirement: CastingRequirement
  ): ScoreFactor {
    if (!requirement.required_skills || requirement.required_skills.length === 0) {
      return {
        score: 100,
        weight: this.config.weights.skills,
        reason: 'No specific skills required',
      };
    }

    const talentSkills = talent.skills_json || [];
    const required = requirement.required_skills;
    const matched = required.filter(skill => talentSkills.includes(skill));
    const score = (matched.length / required.length) * 100;

    return {
      score: Math.round(score),
      weight: this.config.weights.skills,
      reason: `Talent has ${matched.length}/${required.length} required skills`,
      details: {
        required_skills: required,
        matched_skills: matched,
        missing_skills: required.filter(s => !talentSkills.includes(s)),
      },
    };
  }

  /**
   * Language Matching Score (0-100)
   */
  private scoreLanguage(
    talent: TalentProfile,
    requirement: CastingRequirement
  ): ScoreFactor {
    if (!requirement.required_languages || requirement.required_languages.length === 0) {
      return {
        score: 100,
        weight: this.config.weights.language,
        reason: 'No specific language required',
      };
    }

    const talentLanguages = talent.languages_json || [];
    const required = requirement.required_languages;
    const matched = required.filter(lang => talentLanguages.includes(lang));
    const score = (matched.length / required.length) * 100;

    return {
      score: Math.round(score),
      weight: this.config.weights.language,
      reason: `Talent speaks ${matched.length}/${required.length} required languages`,
      details: {
        required_languages: required,
        talents_languages: talentLanguages,
      },
    };
  }

  /**
   * Location Matching Score (0-100)
   */
  private scoreLocation(
    talent: TalentProfile,
    requirement: CastingRequirement
  ): ScoreFactor {
    const sameLocation = talent.domicile === requirement.shoot_location;

    if (sameLocation) {
      return {
        score: 100,
        weight: this.config.weights.location,
        reason: `Talent domicile matches shoot location: ${talent.domicile}`,
      };
    }

    if (talent.location_willing_to_travel) {
      return {
        score: 80,
        weight: this.config.weights.location,
        reason: `Different location but talent willing to travel`,
        details: {
          talent_domicile: talent.domicile,
          shoot_location: requirement.shoot_location,
          max_travel_hours: talent.max_travel_hours,
        },
      };
    }

    return {
      score: 0,
      weight: this.config.weights.location,
      reason: `Location mismatch and talent not willing to travel`,
      details: {
        talent_domicile: talent.domicile,
        shoot_location: requirement.shoot_location,
      },
    };
  }

  /**
   * Availability Matching Score (0-100)
   */
  private scoreAvailability(
    talent: TalentProfile,
    requirement: CastingRequirement
  ): ScoreFactor {
    // Hard filter already checked this, so it's always available here
    return {
      score: 100,
      weight: 0, // Weight handled in hard filter
      reason: `Talent is available during shoot dates`,
      details: {
        talent_available: talent.is_available,
      },
    };
  }

  /**
   * Travel Capability Score (0-100)
   */
  private scoreTravelCapability(
    talent: TalentProfile,
    requirement: CastingRequirement
  ): ScoreFactor {
    if (!requirement.travel_required) {
      return {
        score: 100,
        weight: 0,
        reason: 'Travel not required',
      };
    }

    if (!talent.location_willing_to_travel) {
      return {
        score: 0,
        weight: 0.05,
        reason: 'Travel required but talent not willing',
      };
    }

    if (talent.max_travel_hours && requirement.travel_budget) {
      // Simple estimation: assume 100km per hour
      const estimatedDistance = requirement.travel_budget / 1000; // Rough proxy
      const canTravelDistance = (talent.max_travel_hours || 0) * 100;

      if (canTravelDistance >= estimatedDistance) {
        return {
          score: 100,
          weight: 0.05,
          reason: `Talent can travel (max ${talent.max_travel_hours} hours)`,
        };
      }
    }

    return {
      score: 70,
      weight: 0.05,
      reason: 'Talent willing to travel',
    };
  }

  /**
   * Budget Fitting Score (0-100)
   * Talent rate vs job budget
   */
  private scoreBudget(
    talent: TalentProfile,
    requirement: CastingRequirement
  ): ScoreFactor {
    const talentRate = talent.rate_daily_min || 1000000; // Default 1M IDR
    const budgetAvg = (requirement.budget_min + requirement.budget_max) / 2;
    const tolerance = (this.config.budget_tolerance_percent / 100) * budgetAvg;
    const maxAcceptable = budgetAvg * (this.config.budget_tolerance_percent / 100);

    if (talentRate <= budgetAvg) {
      return {
        score: 100,
        weight: this.config.weights.budget,
        reason: `Talent rate within budget (${talentRate.toLocaleString()} IDR)`,
        details: {
          talent_rate: talentRate,
          budget_avg: Math.round(budgetAvg),
          budget_range: [requirement.budget_min, requirement.budget_max],
        },
      };
    }

    if (talentRate <= maxAcceptable) {
      const percentAbove = ((talentRate - budgetAvg) / budgetAvg) * 100;
      const score = Math.max(0, 100 - percentAbove * 2);
      return {
        score: Math.round(score),
        weight: this.config.weights.budget,
        reason: `Talent rate slightly above budget (+${percentAbove.toFixed(1)}%)`,
        details: {
          talent_rate: talentRate,
          budget_avg: Math.round(budgetAvg),
          percent_above: percentAbove.toFixed(1),
        },
      };
    }

    const percentAbove = ((talentRate - budgetAvg) / budgetAvg) * 100;
    const score = Math.max(0, 100 - percentAbove);
    return {
      score: Math.round(score),
      weight: this.config.weights.budget,
      reason: `Talent rate significantly above budget (+${percentAbove.toFixed(1)}%)`,
      details: {
        talent_rate: talentRate,
        budget_avg: Math.round(budgetAvg),
        percent_above: percentAbove.toFixed(1),
      },
    };
  }

  /**
   * Profile Completeness Score (0-100)
   */
  private scoreProfileCompleteness(talent: TalentProfile): ScoreFactor {
    const completeness = talent.profile_completion_percent || 0;
    return {
      score: Math.round(completeness),
      weight: this.config.weights.profile_complete,
      reason: `Profile is ${completeness}% complete`,
      details: {
        completion_percent: completeness,
      },
    };
  }

  /**
   * Gender Matching Score (0-100)
   */
  private scoreGender(
    talent: TalentProfile,
    requirement: CastingRequirement
  ): ScoreFactor {
    if (!requirement.required_gender || requirement.required_gender === 'any') {
      return {
        score: 100,
        weight: this.config.weights.gender,
        reason: 'No specific gender required',
      };
    }

    const isMatch = talent.gender === requirement.required_gender;
    return {
      score: isMatch ? 100 : 0,
      weight: this.config.weights.gender,
      reason: isMatch
        ? `Gender matches: ${talent.gender}`
        : `Gender mismatch: ${talent.gender} vs ${requirement.required_gender}`,
      details: {
        talent_gender: talent.gender,
        required_gender: requirement.required_gender,
      },
    };
  }

  // =========================================================================
  // FINAL SCORE CALCULATION
  // =========================================================================

  private calculateFinalScore(scoreBreakdown: Partial<ScoreBreakdown>): number {
    let totalScore = 0;
    let totalWeight = 0;

    for (const [key, factor] of Object.entries(scoreBreakdown)) {
      if (factor && factor.score !== undefined && factor.weight > 0) {
        totalScore += factor.score * factor.weight;
        totalWeight += factor.weight;
      }
    }

    if (totalWeight === 0) return 50; // Fallback
    return Math.round((totalScore / totalWeight) * 100) / 100;
  }

  // =========================================================================
  // REASONING GENERATION
  // =========================================================================

  private generateReasoning(
    talent: TalentProfile,
    requirement: CastingRequirement,
    scoreBreakdown: Partial<ScoreBreakdown>,
    finalScore: number
  ): string {
    const topFactors = Object.entries(scoreBreakdown)
      .filter(([, factor]) => factor && factor.weight > 0)
      .sort(([, a], [, b]) => (b?.score || 0) - (a?.score || 0))
      .slice(0, 3)
      .map(([, factor]) => `${factor?.reason}`)
      .join('; ');

    return `Match: ${finalScore}%. Top factors: ${topFactors}`;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const smartMatchingEngine = new SmartMatchingEngine();

export default smartMatchingEngine;
