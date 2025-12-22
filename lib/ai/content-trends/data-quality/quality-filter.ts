/**
 * Quality Filter
 * Content & Trends AI Engine - Phase 4
 * 
 * Filters low-quality content based on configurable criteria.
 */

import { ScrapedData } from '../apify/types';
import {
  QualityFilterConfig,
  DEFAULT_QUALITY_FILTER_CONFIG,
  QualityMetrics,
  QualityDimensions,
  QualityFlag,
  IQualityFilter,
} from './types';

// Helper to safely access properties on ScrapedData union type
function asRecord(data: ScrapedData): Record<string, unknown> {
  return data as unknown as Record<string, unknown>;
}

// ============================================================================
// Quality Filter
// ============================================================================

export class QualityFilter implements IQualityFilter {
  private defaultConfig: QualityFilterConfig;

  constructor(config: Partial<QualityFilterConfig> = {}) {
    this.defaultConfig = { ...DEFAULT_QUALITY_FILTER_CONFIG, ...config };
  }

  /**
   * Filter out low-quality content
   */
  filterLowQuality(
    data: ScrapedData[],
    config?: Partial<QualityFilterConfig>
  ): ScrapedData[] {
    const filterConfig = { ...this.defaultConfig, ...config };
    
    return data.filter(item => {
      const metrics = this.calculateQualityScore(item);
      const flags = this.getQualityFlags(item);
      
      // Check quality score threshold
      if (metrics.overallScore < filterConfig.minQualityScore) {
        return false;
      }
      
      // Check engagement threshold
      const itemRecord = asRecord(item);
      const stats = itemRecord.stats as Record<string, number> | undefined;
      if (stats) {
        const totalEngagement = (stats.viewCount || 0) + 
                               (stats.likeCount || 0) + 
                               (stats.shareCount || 0) + 
                               (stats.commentCount || 0);
        if (totalEngagement < filterConfig.minEngagement) {
          return false;
        }
      }
      
      // Check content age
      const createdAt = itemRecord.createdAt as string | Date | undefined;
      if (createdAt && filterConfig.maxAgeHours > 0) {
        const ageHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
        if (ageHours > filterConfig.maxAgeHours) {
          return false;
        }
      }
      
      // Check excluded flags
      const hasExcludedFlag = flags.some(flag => 
        filterConfig.excludeFlags.includes(flag.type)
      );
      if (hasExcludedFlag) {
        return false;
      }
      
      // Check media requirement
      if (filterConfig.requireMedia) {
        const hasMedia = !!(
          itemRecord.videoUrl ||
          itemRecord.mediaUrls ||
          itemRecord.thumbnailUrl
        );
        if (!hasMedia) {
          return false;
        }
      }
      
      // Check description requirement
      if (filterConfig.requireDescription) {
        const description = itemRecord.description as string | undefined;
        const caption = itemRecord.caption as string | undefined;
        const text = description || caption || '';
        if (text.trim().length < filterConfig.minDescriptionLength) {
          return false;
        }
      }
      
      return true;
    });
  }

  /**
   * Calculate quality score for a single item
   */
  calculateQualityScore(data: ScrapedData): QualityMetrics {
    const dimensions = this.calculateDimensions(data);
    const flags = this.getQualityFlags(data);
    
    // Calculate weighted overall score
    const weights = {
      completeness: 0.25,
      accuracy: 0.2,
      freshness: 0.2,
      engagement: 0.25,
      mediaQuality: 0.1,
    };
    
    let overallScore = Object.entries(weights).reduce((sum, [key, weight]) => {
      return sum + dimensions[key as keyof QualityDimensions] * weight;
    }, 0);
    
    // Penalize for critical flags
    const criticalFlags = flags.filter(f => f.severity === 'critical');
    const majorFlags = flags.filter(f => f.severity === 'major');
    
    overallScore -= criticalFlags.length * 0.2;
    overallScore -= majorFlags.length * 0.1;
    
    overallScore = Math.max(0, Math.min(1, overallScore));
    
    const recommendations = this.generateRecommendations(dimensions, flags);
    
    return {
      overallScore,
      dimensions,
      flags,
      recommendations,
    };
  }

  /**
   * Get quality flags for a single item
   */
  getQualityFlags(data: ScrapedData): QualityFlag[] {
    const flags: QualityFlag[] = [];
    const dataRecord = asRecord(data);
    const stats = dataRecord.stats as Record<string, number> | undefined;
    
    // Missing media check
    const hasMedia = !!(
      dataRecord.videoUrl ||
      dataRecord.mediaUrls ||
      dataRecord.thumbnailUrl
    );
    if (!hasMedia) {
      flags.push({
        type: 'missing_media',
        severity: 'minor',
        description: 'Content has no media URL',
        field: 'mediaUrl',
      });
    }
    
    // Low engagement check
    if (stats) {
      const totalEngagement = (stats.viewCount || 0) + 
                             (stats.likeCount || 0) + 
                             (stats.shareCount || 0);
      if (totalEngagement < 100) {
        flags.push({
          type: 'low_engagement',
          severity: 'minor',
          description: 'Content has very low engagement',
          field: 'stats',
        });
      }
    }
    
    // Suspicious metrics check
    if (stats && stats.viewCount > 0) {
      const likeRatio = (stats.likeCount || 0) / stats.viewCount;
      const shareRatio = (stats.shareCount || 0) / stats.viewCount;
      
      // Unusually high like ratio (> 50%)
      if (likeRatio > 0.5) {
        flags.push({
          type: 'suspicious_metrics',
          severity: 'major',
          description: 'Like-to-view ratio is suspiciously high (>50%)',
          field: 'stats.likeCount',
        });
      }
      
      // Unusually high share ratio (> 30%)
      if (shareRatio > 0.3) {
        flags.push({
          type: 'suspicious_metrics',
          severity: 'major',
          description: 'Share-to-view ratio is suspiciously high (>30%)',
          field: 'stats.shareCount',
        });
      }
    }
    
    // Incomplete metadata check
    const description = dataRecord.description as string | undefined;
    const caption = dataRecord.caption as string | undefined;
    if (!description && !caption) {
      flags.push({
        type: 'incomplete_metadata',
        severity: 'minor',
        description: 'Content has no description or caption',
        field: 'description',
      });
    }
    
    // Stale content check
    const createdAt = dataRecord.createdAt as string | Date | undefined;
    if (createdAt) {
      const ageHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
      if (ageHours > 720) { // 30 days
        flags.push({
          type: 'stale_content',
          severity: 'minor',
          description: 'Content is older than 30 days',
          field: 'createdAt',
        });
      }
    }
    
    // Invalid URL check
    try {
      new URL(data.url);
    } catch {
      flags.push({
        type: 'invalid_url',
        severity: 'critical',
        description: 'Content URL is invalid',
        field: 'url',
      });
    }
    
    // Spam detection (basic heuristics)
    const text = (description || caption || '').toLowerCase();
    const spamIndicators = [
      'click link in bio',
      'dm for collab',
      'follow for follow',
      'f4f',
      'l4l',
      'free followers',
      'get rich quick',
    ];
    
    const spamCount = spamIndicators.filter(indicator => 
      text.includes(indicator)
    ).length;
    
    if (spamCount >= 2) {
      flags.push({
        type: 'spam_detected',
        severity: 'major',
        description: 'Content contains spam indicators',
        field: 'description',
      });
    }
    
    // Bot activity detection (basic heuristics)
    const author = dataRecord.author as Record<string, unknown> | undefined;
    if (author) {
      const username = (author.username as string) || '';
      // Check for bot-like username patterns
      if (/^[a-z]+\d{5,}$/i.test(username) || /bot|auto|spam/i.test(username)) {
        flags.push({
          type: 'bot_activity',
          severity: 'major',
          description: 'Author username suggests bot activity',
          field: 'author.username',
        });
      }
    }
    
    return flags;
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private calculateDimensions(data: ScrapedData): QualityDimensions {
    const dataRecord = asRecord(data);
    
    // Completeness
    let completeness = 0;
    const fields = ['id', 'url', 'platform', 'scrapedAt', 'description', 'author', 'stats', 'hashtags'];
    for (const field of fields) {
      if (dataRecord[field]) {
        completeness += 1 / fields.length;
      }
    }
    
    // Accuracy (based on URL validity and data consistency)
    let accuracy = 0.5;
    try {
      new URL(data.url);
      accuracy += 0.3;
    } catch {
      accuracy -= 0.3;
    }
    
    const stats = dataRecord.stats as Record<string, number> | undefined;
    if (stats) {
      const hasValidStats = Object.values(stats).every(v => typeof v === 'number' && v >= 0);
      if (hasValidStats) accuracy += 0.2;
    }
    
    // Freshness
    let freshness = 0.5;
    const createdAt = dataRecord.createdAt as string | Date | undefined;
    if (createdAt) {
      const ageHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
      if (ageHours < 24) freshness = 1.0;
      else if (ageHours < 72) freshness = 0.8;
      else if (ageHours < 168) freshness = 0.6;
      else if (ageHours < 720) freshness = 0.4;
      else freshness = 0.2;
    }
    
    // Engagement
    let engagement = 0.3;
    if (stats) {
      const viewCount = stats.viewCount || 0;
      const likeCount = stats.likeCount || 0;
      const shareCount = stats.shareCount || 0;
      
      // Logarithmic scaling for engagement
      if (viewCount > 0) {
        engagement = Math.min(1, Math.log10(viewCount) / 7); // 10M views = 1.0
      }
      
      // Boost for high engagement rate
      if (viewCount > 0) {
        const engagementRate = (likeCount + shareCount) / viewCount;
        if (engagementRate > 0.05) engagement = Math.min(1, engagement + 0.2);
      }
    }
    
    // Media quality (placeholder - would need actual media analysis)
    const mediaQuality = 0.7;
    
    return {
      completeness: Math.min(1, Math.max(0, completeness)),
      accuracy: Math.min(1, Math.max(0, accuracy)),
      freshness: Math.min(1, Math.max(0, freshness)),
      engagement: Math.min(1, Math.max(0, engagement)),
      mediaQuality,
    };
  }

  private generateRecommendations(
    dimensions: QualityDimensions,
    flags: QualityFlag[]
  ): string[] {
    const recommendations: string[] = [];
    
    if (dimensions.completeness < 0.6) {
      recommendations.push('Content is missing important metadata fields');
    }
    
    if (dimensions.freshness < 0.4) {
      recommendations.push('Content may be too old for trend analysis');
    }
    
    if (dimensions.engagement < 0.3) {
      recommendations.push('Low engagement may indicate limited viral potential');
    }
    
    const criticalFlags = flags.filter(f => f.severity === 'critical');
    if (criticalFlags.length > 0) {
      recommendations.push('Critical issues detected - content may be invalid');
    }
    
    const spamFlag = flags.find(f => f.type === 'spam_detected');
    if (spamFlag) {
      recommendations.push('Content appears to be spam - exclude from analysis');
    }
    
    return recommendations;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a quality filter instance
 */
export function createQualityFilter(
  config?: Partial<QualityFilterConfig>
): QualityFilter {
  return new QualityFilter(config);
}
