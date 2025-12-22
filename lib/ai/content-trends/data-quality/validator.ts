/**
 * Data Quality Validator
 * Content & Trends AI Engine - Phase 4
 * 
 * Validates scraped content against quality rules and standards.
 */

import { ScrapedData, SocialPlatform } from '../apify/types';
import {
  ValidationResult,
  DataValidationError,
  DataValidationWarning,
  ValidationRule,
  ValidationRuleSet,
  ValidationSeverity,
  IDataQualityValidator,
} from './types';

// ============================================================================
// Built-in Validation Rules
// ============================================================================

const CORE_VALIDATION_RULES: ValidationRule[] = [
  // ID validation
  {
    id: 'required_id',
    name: 'Required ID',
    description: 'Content must have a unique identifier',
    field: 'id',
    validator: (value) => typeof value === 'string' && value.length > 0,
    errorMessage: 'Content ID is required',
    severity: 'critical',
  },
  // URL validation
  {
    id: 'valid_url',
    name: 'Valid URL',
    description: 'Content URL must be valid',
    field: 'url',
    validator: (value) => {
      if (typeof value !== 'string') return false;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    errorMessage: 'Invalid content URL',
    severity: 'critical',
  },
  // Platform validation
  {
    id: 'valid_platform',
    name: 'Valid Platform',
    description: 'Platform must be a supported value',
    field: 'platform',
    validator: (value) => {
      const validPlatforms: SocialPlatform[] = ['tiktok', 'instagram', 'youtube', 'twitter'];
      return validPlatforms.includes(value as SocialPlatform);
    },
    errorMessage: 'Invalid or unsupported platform',
    severity: 'critical',
  },
  // Scraped timestamp validation
  {
    id: 'valid_scraped_at',
    name: 'Valid Scraped Timestamp',
    description: 'Scraped timestamp must be valid',
    field: 'scrapedAt',
    validator: (value) => {
      if (!value) return false;
      const date = new Date(value as string | number | Date);
      return !isNaN(date.getTime()) && date <= new Date();
    },
    errorMessage: 'Invalid or future scraped timestamp',
    severity: 'major',
  },
  // Author validation
  {
    id: 'valid_author',
    name: 'Valid Author',
    description: 'Author information must be present',
    field: 'author',
    validator: (value) => {
      if (!value || typeof value !== 'object') return false;
      const author = value as Record<string, unknown>;
      return typeof author.username === 'string' && author.username.length > 0;
    },
    errorMessage: 'Author information is missing or invalid',
    severity: 'major',
  },
  // Stats validation
  {
    id: 'valid_stats',
    name: 'Valid Stats',
    description: 'Engagement stats must be non-negative',
    field: 'stats',
    validator: (value) => {
      if (!value || typeof value !== 'object') return false;
      const stats = value as Record<string, unknown>;
      const numericFields = ['viewCount', 'likeCount', 'shareCount', 'commentCount'];
      return numericFields.every(field => {
        const val = stats[field];
        return val === undefined || (typeof val === 'number' && val >= 0);
      });
    },
    errorMessage: 'Stats contain invalid or negative values',
    severity: 'major',
  },
  // Description length validation
  {
    id: 'description_length',
    name: 'Description Length',
    description: 'Description should have meaningful content',
    field: 'description',
    validator: (value) => {
      if (value === undefined || value === null) return true; // Optional
      return typeof value === 'string';
    },
    errorMessage: 'Description must be a string',
    severity: 'minor',
  },
  // Hashtags validation
  {
    id: 'valid_hashtags',
    name: 'Valid Hashtags',
    description: 'Hashtags must be an array of strings',
    field: 'hashtags',
    validator: (value) => {
      if (value === undefined) return true; // Optional
      if (!Array.isArray(value)) return false;
      return value.every(tag => typeof tag === 'string');
    },
    errorMessage: 'Hashtags must be an array of strings',
    severity: 'minor',
  },
];

// Platform-specific rules
const TIKTOK_RULES: ValidationRule[] = [
  {
    id: 'tiktok_video_url',
    name: 'TikTok Video URL',
    description: 'TikTok content should have video URL',
    field: 'videoUrl',
    validator: (value, context) => {
      if (context?.platform !== 'tiktok') return true;
      return typeof value === 'string' && value.length > 0;
    },
    errorMessage: 'TikTok content missing video URL',
    severity: 'major',
    platforms: ['tiktok'],
  },
  {
    id: 'tiktok_music',
    name: 'TikTok Music Info',
    description: 'TikTok content should have music information',
    field: 'music',
    validator: (value, context) => {
      if (context?.platform !== 'tiktok') return true;
      if (!value) return true; // Optional but recommended
      const music = value as Record<string, unknown>;
      return typeof music.title === 'string';
    },
    errorMessage: 'TikTok music information is incomplete',
    severity: 'minor',
    platforms: ['tiktok'],
  },
];

const INSTAGRAM_RULES: ValidationRule[] = [
  {
    id: 'instagram_media_type',
    name: 'Instagram Media Type',
    description: 'Instagram content must have valid media type',
    field: 'mediaType',
    validator: (value, context) => {
      if (context?.platform !== 'instagram') return true;
      const validTypes = ['photo', 'video', 'carousel'];
      return validTypes.includes(value as string);
    },
    errorMessage: 'Invalid Instagram media type',
    severity: 'major',
    platforms: ['instagram'],
  },
  {
    id: 'instagram_shortcode',
    name: 'Instagram Shortcode',
    description: 'Instagram content should have shortcode',
    field: 'shortcode',
    validator: (value, context) => {
      if (context?.platform !== 'instagram') return true;
      return typeof value === 'string' && value.length > 0;
    },
    errorMessage: 'Instagram shortcode is missing',
    severity: 'minor',
    platforms: ['instagram'],
  },
];

const YOUTUBE_RULES: ValidationRule[] = [
  {
    id: 'youtube_video_id',
    name: 'YouTube Video ID',
    description: 'YouTube content must have video ID',
    field: 'videoId',
    validator: (value, context) => {
      if (context?.platform !== 'youtube') return true;
      return typeof value === 'string' && value.length === 11;
    },
    errorMessage: 'Invalid YouTube video ID',
    severity: 'major',
    platforms: ['youtube'],
  },
  {
    id: 'youtube_channel',
    name: 'YouTube Channel Info',
    description: 'YouTube content should have channel information',
    field: 'channel',
    validator: (value, context) => {
      if (context?.platform !== 'youtube') return true;
      if (!value) return false;
      const channel = value as Record<string, unknown>;
      return typeof channel.channelId === 'string';
    },
    errorMessage: 'YouTube channel information is missing',
    severity: 'major',
    platforms: ['youtube'],
  },
];

// ============================================================================
// Data Quality Validator
// ============================================================================

export class DataQualityValidator implements IDataQualityValidator {
  private rules: ValidationRule[];
  private customRules: ValidationRule[] = [];

  constructor(options?: { includeAllPlatformRules?: boolean }) {
    this.rules = [...CORE_VALIDATION_RULES];
    
    if (options?.includeAllPlatformRules !== false) {
      this.rules.push(...TIKTOK_RULES, ...INSTAGRAM_RULES, ...YOUTUBE_RULES);
    }
  }

  /**
   * Validate a single scraped content item
   */
  validateScrapedContent(data: ScrapedData): ValidationResult {
    const errors: DataValidationError[] = [];
    const warnings: DataValidationWarning[] = [];
    
    // Get applicable rules for this platform
    const applicableRules = this.getApplicableRules(data.platform);
    
    // Run each validation rule
    for (const rule of applicableRules) {
      const fieldValue = this.getFieldValue(data, rule.field);
      const isValid = rule.validator(fieldValue, data);
      
      if (!isValid) {
        if (rule.severity === 'minor') {
          warnings.push({
            field: rule.field,
            message: rule.errorMessage,
            suggestion: `Consider providing valid ${rule.field}`,
          });
        } else {
          errors.push({
            field: rule.field,
            message: rule.errorMessage,
            severity: rule.severity,
            code: rule.id,
            value: fieldValue,
          });
        }
      }
    }
    
    // Additional contextual warnings
    this.addContextualWarnings(data, warnings);
    
    // Calculate quality score
    const qualityScore = this.calculateValidationScore(errors, warnings);
    
    return {
      isValid: errors.filter(e => e.severity === 'critical').length === 0,
      errors,
      warnings,
      qualityScore,
      validatedAt: new Date(),
    };
  }

  /**
   * Validate a batch of scraped content
   */
  validateBatch(data: ScrapedData[]): Map<string, ValidationResult> {
    const results = new Map<string, ValidationResult>();
    
    for (const item of data) {
      const result = this.validateScrapedContent(item);
      results.set(item.id, result);
    }
    
    return results;
  }

  /**
   * Get all validation rules
   */
  getValidationRules(): ValidationRule[] {
    return [...this.rules, ...this.customRules];
  }

  /**
   * Add a custom validation rule
   */
  addCustomRule(rule: ValidationRule): void {
    // Validate rule structure
    if (!rule.id || !rule.validator || !rule.errorMessage) {
      throw new Error('Invalid rule: missing required fields');
    }
    
    // Check for duplicate IDs
    const existingIds = this.getValidationRules().map(r => r.id);
    if (existingIds.includes(rule.id)) {
      throw new Error(`Rule with ID "${rule.id}" already exists`);
    }
    
    this.customRules.push(rule);
  }

  /**
   * Remove a custom rule by ID
   */
  removeCustomRule(ruleId: string): boolean {
    const index = this.customRules.findIndex(r => r.id === ruleId);
    if (index >= 0) {
      this.customRules.splice(index, 1);
      return true;
    }
    return false;
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private getApplicableRules(platform: SocialPlatform): ValidationRule[] {
    const allRules = [...this.rules, ...this.customRules];
    
    return allRules.filter(rule => {
      // If no platforms specified, rule applies to all
      if (!rule.platforms || rule.platforms.length === 0) {
        return true;
      }
      // Otherwise, check if current platform is in the list
      return rule.platforms.includes(platform);
    });
  }

  private getFieldValue(data: ScrapedData, field: string): unknown {
    // Handle nested fields with dot notation
    const parts = field.split('.');
    let value: unknown = data;
    
    for (const part of parts) {
      if (value === null || value === undefined) return undefined;
      value = (value as Record<string, unknown>)[part];
    }
    
    return value;
  }

  private addContextualWarnings(data: ScrapedData, warnings: DataValidationWarning[]): void {
    const dataRecord = data as unknown as Record<string, unknown>;
    
    // Check for suspiciously high engagement
    const stats = dataRecord.stats as Record<string, number> | undefined;
    if (stats) {
      const viewCount = stats.viewCount || 0;
      const likeCount = stats.likeCount || 0;
      
      // Suspicious like-to-view ratio (> 50%)
      if (viewCount > 0 && likeCount / viewCount > 0.5) {
        warnings.push({
          field: 'stats',
          message: 'Unusually high like-to-view ratio detected',
          suggestion: 'Verify engagement metrics authenticity',
        });
      }
    }
    
    // Check for very old content
    const createdAt = dataRecord.createdAt;
    if (createdAt) {
      const contentAge = Date.now() - new Date(createdAt as string).getTime();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      
      if (contentAge > thirtyDaysMs) {
        warnings.push({
          field: 'createdAt',
          message: 'Content is older than 30 days',
          suggestion: 'Consider freshness when analyzing trends',
        });
      }
    }
    
    // Check for missing description
    const description = dataRecord.description;
    if (!description || (typeof description === 'string' && description.trim().length < 10)) {
      warnings.push({
        field: 'description',
        message: 'Description is missing or very short',
        suggestion: 'Content with descriptions provides better analysis',
      });
    }
  }

  private calculateValidationScore(
    errors: DataValidationError[],
    warnings: DataValidationWarning[]
  ): number {
    let score = 1.0;
    
    // Deduct for errors based on severity
    for (const error of errors) {
      switch (error.severity) {
        case 'critical':
          score -= 0.4;
          break;
        case 'major':
          score -= 0.2;
          break;
        case 'minor':
          score -= 0.05;
          break;
      }
    }
    
    // Deduct for warnings
    score -= warnings.length * 0.02;
    
    // Ensure score is between 0 and 1
    return Math.max(0, Math.min(1, score));
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a data quality validator instance
 */
export function createDataQualityValidator(
  options?: { includeAllPlatformRules?: boolean }
): DataQualityValidator {
  return new DataQualityValidator(options);
}

// ============================================================================
// Exports
// ============================================================================

export {
  CORE_VALIDATION_RULES,
  TIKTOK_RULES,
  INSTAGRAM_RULES,
  YOUTUBE_RULES,
};
