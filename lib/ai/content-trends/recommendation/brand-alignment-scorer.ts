/**
 * Brand Alignment Scorer
 * Calculates how well content recommendations align with brand identity
 */

import type {
  BrandProfile,
  ContentRecommendation,
  TrendReference,
  ViralMechanismSuggestion,
} from './types';
import type { ViralMechanism } from '../viral-prediction/types';
import type { Trend } from '../trend-detection/types';

export interface AlignmentFactors {
  toneMatch: number;
  audienceMatch: number;
  valueMatch: number;
  goalMatch: number;
  platformMatch: number;
  historyMatch: number;
}

export interface AlignmentResult {
  score: number;
  factors: AlignmentFactors;
  warnings: string[];
  suggestions: string[];
}

export class BrandAlignmentScorer {
  /**
   * Calculate overall brand alignment score
   */
  calculateAlignment(
    brand: BrandProfile,
    trend: Trend,
    mechanisms: ViralMechanism[]
  ): AlignmentResult {
    const factors: AlignmentFactors = {
      toneMatch: this.calculateToneMatch(brand, trend, mechanisms),
      audienceMatch: this.calculateAudienceMatch(brand, trend),
      valueMatch: this.calculateValueMatch(brand, mechanisms),
      goalMatch: this.calculateGoalMatch(brand, trend),
      platformMatch: this.calculatePlatformMatch(brand, trend),
      historyMatch: this.calculateHistoryMatch(brand, trend),
    };

    const weights = {
      toneMatch: 0.2,
      audienceMatch: 0.25,
      valueMatch: 0.2,
      goalMatch: 0.15,
      platformMatch: 0.1,
      historyMatch: 0.1,
    };

    const score = Object.entries(factors).reduce(
      (sum, [key, value]) => sum + value * weights[key as keyof AlignmentFactors],
      0
    );

    const warnings = this.generateWarnings(factors, brand, trend);
    const suggestions = this.generateSuggestions(factors, brand, trend);

    return { score, factors, warnings, suggestions };
  }

  /**
   * Calculate tone compatibility
   */
  private calculateToneMatch(
    brand: BrandProfile,
    trend: Trend,
    mechanisms: ViralMechanism[]
  ): number {
    // Map mechanism types to compatible tones
    const mechanismToneCompatibility: Record<string, string[]> = {
      authenticity: ['casual', 'inspirational', 'professional'],
      controversy: ['authoritative', 'professional'],
      humor: ['casual', 'humorous'],
      surprise: ['casual', 'humorous', 'inspirational'],
      social_proof: ['professional', 'authoritative', 'inspirational'],
    };

    let compatibilityScore = 0;
    let totalMechanisms = 0;

    for (const mechanism of mechanisms) {
      const compatibleTones = mechanismToneCompatibility[mechanism.type] || [];
      if (compatibleTones.includes(brand.tone)) {
        compatibilityScore += mechanism.strength;
      } else {
        compatibilityScore += mechanism.strength * 0.3; // Partial score for adaptable content
      }
      totalMechanisms += mechanism.strength;
    }

    if (totalMechanisms === 0) return 0.5;
    return compatibilityScore / totalMechanisms;
  }

  /**
   * Calculate audience alignment
   */
  private calculateAudienceMatch(brand: BrandProfile, trend: Trend): number {
    const { targetAudience } = brand;
    let score = 0;
    let factors = 0;

    // Platform audience alignment
    const platformAudienceMap: Record<string, { ageRange: [number, number]; interests: string[] }> = {
      tiktok: { ageRange: [16, 34], interests: ['entertainment', 'trends', 'music'] },
      instagram: { ageRange: [18, 44], interests: ['lifestyle', 'fashion', 'food'] },
      youtube: { ageRange: [18, 54], interests: ['education', 'entertainment', 'tutorials'] },
      twitter: { ageRange: [25, 54], interests: ['news', 'tech', 'business'] },
    };

    const platformAudience = platformAudienceMap[trend.signal.platform];
    if (platformAudience) {
      // Age range overlap
      const ageOverlap = this.calculateRangeOverlap(
        [targetAudience.ageRange.min, targetAudience.ageRange.max],
        platformAudience.ageRange
      );
      score += ageOverlap;
      factors++;

      // Interest overlap
      const interestOverlap = this.calculateArrayOverlap(
        targetAudience.interests,
        platformAudience.interests
      );
      score += interestOverlap;
      factors++;
    }

    // Trend category relevance to audience interests
    const categoryInterestMap: Record<string, string[]> = {
      sound: ['music', 'entertainment', 'trends'],
      hashtag: ['trends', 'social', 'community'],
      format: ['creativity', 'entertainment'],
      topic: ['education', 'news', 'lifestyle'],
      challenge: ['entertainment', 'fitness', 'social'],
      meme: ['humor', 'entertainment', 'trends'],
    };

    const categoryInterests = categoryInterestMap[trend.signal.category] || [];
    const categoryMatch = this.calculateArrayOverlap(
      targetAudience.interests,
      categoryInterests
    );
    score += categoryMatch;
    factors++;

    return factors > 0 ? score / factors : 0.5;
  }

  /**
   * Calculate brand value alignment
   */
  private calculateValueMatch(brand: BrandProfile, mechanisms: ViralMechanism[]): number {
    const { brandValues } = brand;

    // Map values to compatible mechanisms
    const valueCompatibility: Record<string, string[]> = {
      authenticity: ['authenticity', 'social_proof'],
      innovation: ['surprise', 'controversy'],
      trust: ['authenticity', 'social_proof'],
      fun: ['humor', 'surprise'],
      quality: ['authenticity', 'social_proof'],
      community: ['social_proof', 'authenticity'],
      education: ['authenticity'],
      sustainability: ['authenticity', 'social_proof'],
    };

    let matchScore = 0;
    let totalWeight = 0;

    for (const value of brandValues) {
      const compatibleMechanisms = valueCompatibility[value.toLowerCase()] || [];
      
      for (const mechanism of mechanisms) {
        if (compatibleMechanisms.includes(mechanism.type)) {
          matchScore += mechanism.strength;
        }
        totalWeight += mechanism.strength;
      }
    }

    if (totalWeight === 0) return 0.5;
    return Math.min(1, matchScore / totalWeight);
  }

  /**
   * Calculate goal alignment
   */
  private calculateGoalMatch(brand: BrandProfile, trend: Trend): number {
    const { contentGoals } = brand;
    let score = 0;
    let totalPriority = 0;

    // Map trend characteristics to goals
    const trendGoalMap: Record<string, string[]> = {
      emerging: ['awareness', 'engagement'],
      growing: ['awareness', 'engagement', 'conversion'],
      peak: ['awareness', 'conversion'],
      declining: ['retention'],
      saturated: ['retention', 'education'],
    };

    const compatibleGoals = trendGoalMap[trend.phase] || [];

    for (const goal of contentGoals) {
      if (compatibleGoals.includes(goal.type)) {
        score += goal.priority;
      } else {
        score += goal.priority * 0.3;
      }
      totalPriority += goal.priority;
    }

    // Viral score bonus for awareness/engagement goals
    const hasViralGoals = contentGoals.some((g) =>
      ['awareness', 'engagement'].includes(g.type)
    );
    if (hasViralGoals && trend.viralScore > 0.7) {
      score *= 1.2;
    }

    if (totalPriority === 0) return 0.5;
    return Math.min(1, score / totalPriority);
  }

  /**
   * Calculate platform preference alignment
   */
  private calculatePlatformMatch(brand: BrandProfile, trend: Trend): number {
    const platformPref = brand.platforms.find(
      (p) => p.platform.toLowerCase() === trend.signal.platform.toLowerCase()
    );

    if (!platformPref) return 0.3; // Platform not in preferences

    // Priority score
    const priorityScore = platformPref.priority / 10;

    // Content type compatibility
    const trendContentTypes = this.getTrendContentTypes(trend);
    const typeOverlap = this.calculateArrayOverlap(
      platformPref.contentTypes,
      trendContentTypes
    );

    return (priorityScore * 0.6 + typeOverlap * 0.4);
  }

  /**
   * Calculate history-based alignment
   */
  private calculateHistoryMatch(brand: BrandProfile, trend: Trend): number {
    if (!brand.contentHistory || brand.contentHistory.length === 0) {
      return 0.5; // Neutral if no history
    }

    // Find similar past content
    const similarContent = brand.contentHistory.filter((item) => {
      const platformMatch = item.platform.toLowerCase() === trend.signal.platform.toLowerCase();
      const topicSimilarity = this.calculateStringSimilarity(
        item.topic.toLowerCase(),
        trend.signal.name.toLowerCase()
      );
      return platformMatch || topicSimilarity > 0.5;
    });

    if (similarContent.length === 0) return 0.5;

    // Calculate average performance of similar content
    const avgEngagement =
      similarContent.reduce((sum, c) => sum + c.performance.engagementRate, 0) /
      similarContent.length;

    // Higher past engagement = higher alignment score
    return Math.min(1, avgEngagement * 10 + 0.3);
  }

  /**
   * Generate warnings for low alignment factors
   */
  private generateWarnings(
    factors: AlignmentFactors,
    brand: BrandProfile,
    trend: Trend
  ): string[] {
    const warnings: string[] = [];

    if (factors.toneMatch < 0.4) {
      warnings.push(
        `Trend tone may not align with ${brand.tone} brand voice. Consider adaptation.`
      );
    }

    if (factors.audienceMatch < 0.4) {
      warnings.push(
        `Target audience on ${trend.signal.platform} may differ from brand audience.`
      );
    }

    if (factors.valueMatch < 0.4) {
      warnings.push(
        'Some viral mechanisms may conflict with brand values. Review before publishing.'
      );
    }

    if (factors.platformMatch < 0.3) {
      warnings.push(
        `${trend.signal.platform} is not a priority platform for this brand.`
      );
    }

    return warnings;
  }

  /**
   * Generate suggestions for improving alignment
   */
  private generateSuggestions(
    factors: AlignmentFactors,
    brand: BrandProfile,
    trend: Trend
  ): string[] {
    const suggestions: string[] = [];

    if (factors.toneMatch < 0.6) {
      suggestions.push(
        `Adapt content tone to be more ${brand.tone} while preserving viral elements.`
      );
    }

    if (factors.audienceMatch < 0.6) {
      suggestions.push(
        'Add brand-specific context to make content more relevant to target audience.'
      );
    }

    if (factors.goalMatch < 0.6) {
      const primaryGoal = brand.contentGoals.sort((a, b) => b.priority - a.priority)[0];
      if (primaryGoal) {
        suggestions.push(
          `Emphasize ${primaryGoal.type} elements to align with primary content goal.`
        );
      }
    }

    if (factors.historyMatch < 0.5 && brand.contentHistory?.length) {
      const topPerformer = brand.contentHistory.sort(
        (a, b) => b.performance.engagementRate - a.performance.engagementRate
      )[0];
      if (topPerformer) {
        suggestions.push(
          `Consider incorporating elements from past successful content: "${topPerformer.topic}".`
        );
      }
    }

    return suggestions;
  }

  // Helper methods

  private getTrendContentTypes(trend: Trend): string[] {
    const categoryContentMap: Record<string, string[]> = {
      sound: ['video', 'story'],
      hashtag: ['video', 'image', 'carousel'],
      format: ['video', 'carousel'],
      topic: ['video', 'image', 'text'],
      challenge: ['video', 'story'],
      meme: ['image', 'video'],
    };
    return categoryContentMap[trend.signal.category] || ['video'];
  }

  private calculateRangeOverlap(range1: [number, number], range2: [number, number]): number {
    const overlapStart = Math.max(range1[0], range2[0]);
    const overlapEnd = Math.min(range1[1], range2[1]);
    
    if (overlapStart >= overlapEnd) return 0;
    
    const overlapSize = overlapEnd - overlapStart;
    const range1Size = range1[1] - range1[0];
    const range2Size = range2[1] - range2[0];
    
    return overlapSize / Math.min(range1Size, range2Size);
  }

  private calculateArrayOverlap(arr1: string[], arr2: string[]): number {
    if (arr1.length === 0 || arr2.length === 0) return 0;
    
    const set1 = new Set(arr1.map((s) => s.toLowerCase()));
    const set2 = new Set(arr2.map((s) => s.toLowerCase()));
    
    let overlap = 0;
    for (const item of set1) {
      if (set2.has(item)) overlap++;
    }
    
    return overlap / Math.min(set1.size, set2.size);
  }

  private calculateStringSimilarity(a: string, b: string): number {
    if (a === b) return 1;
    if (a.length === 0 || b.length === 0) return 0;

    // Simple word overlap
    const wordsA = new Set(a.split(/\s+/));
    const wordsB = new Set(b.split(/\s+/));
    
    let overlap = 0;
    for (const word of wordsA) {
      if (wordsB.has(word)) overlap++;
    }
    
    return overlap / Math.max(wordsA.size, wordsB.size);
  }
}
