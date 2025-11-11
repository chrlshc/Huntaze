import { BehaviorEvent, DataValidationResult, DataQualityMetrics } from '../types';
import { logger } from '../../utils/logger';

interface ValidationConfig {
  strictMode: boolean;
  customRules: CustomValidationRule[];
  qualityThresholds: {
    minEngagementScore: number;
    maxTimeSpent: number;
    requiredFields: string[];
  };
}

type CustomValidationRule = {
  id: string;
  validate: (event: BehaviorEvent) => Promise<{ isValid: boolean; errors: string[] }> | { isValid: boolean; errors: string[] };
};

export class DataValidationService {
  private config: ValidationConfig;
  private validationStats = {
    totalValidated: 0,
    passed: 0,
    failed: 0,
    qualityScores: [] as number[]
  };

  constructor(config: Partial<ValidationConfig> = {}) {
    this.config = {
      strictMode: false,
      customRules: [],
      qualityThresholds: {
        minEngagementScore: 0,
        maxTimeSpent: 3600, // 1 hour
        requiredFields: ['id', 'userId', 'eventType', 'timestamp']
      },
      ...config
    };
  }

  /**
   * Comprehensive validation of behavioral event
   */
  async validateEvent(event: BehaviorEvent): Promise<DataValidationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Basic structure validation
      const structureErrors = this.validateStructure(event);
      errors.push(...structureErrors);

      // Data type validation
      const typeErrors = this.validateDataTypes(event);
      errors.push(...typeErrors);

      // Business logic validation
      const businessErrors = this.validateBusinessLogic(event);
      errors.push(...businessErrors);

      // Data quality validation
      const qualityResult = this.validateDataQuality(event);
      warnings.push(...qualityResult.warnings);

      // Custom rules validation
      const customErrors = await this.validateCustomRules(event);
      errors.push(...customErrors);

      // Calculate overall quality score
      const qualityScore = this.calculateQualityScore(event, errors, warnings);

      const result: DataValidationResult = {
        isValid: errors.length === 0,
        errors,
        warnings,
        qualityScore,
        validatedAt: new Date(),
        validationTime: Date.now() - startTime,
        metadata: {
          strictMode: this.config.strictMode,
          rulesApplied: this.config.customRules.length + 4, // 4 built-in rule sets
          dataCompleteness: this.calculateDataCompleteness(event)
        }
      };

      // Update statistics
      this.updateValidationStats(result);

      return result;

    } catch (error) {
      logger.error('Validation process failed', { error, eventId: event.id });
      return {
        isValid: false,
        errors: ['Validation process encountered an error'],
        warnings: [],
        qualityScore: 0,
        validatedAt: new Date(),
        validationTime: Date.now() - startTime
      };
    }
  }

  /**
   * Validate basic event structure
   */
  private validateStructure(event: BehaviorEvent): string[] {
    const errors: string[] = [];

    // Check required fields
    for (const field of this.config.qualityThresholds.requiredFields) {
      if (!event[field as keyof BehaviorEvent]) {
        errors.push(`Required field '${field}' is missing`);
      }
    }

    // Check event structure
    if (typeof event !== 'object' || event === null) {
      errors.push('Event must be a valid object');
    }

    return errors;
  }

  /**
   * Validate data types
   */
  private validateDataTypes(event: BehaviorEvent): string[] {
    const errors: string[] = [];

    // ID validation
    if (event.id && typeof event.id !== 'string') {
      errors.push('Event ID must be a string');
    }

    // User ID validation
    if (event.userId && typeof event.userId !== 'string') {
      errors.push('User ID must be a string');
    }

    // Timestamp validation
    if (event.timestamp) {
      if (!(event.timestamp instanceof Date) && typeof event.timestamp !== 'string') {
        errors.push('Timestamp must be a Date object or ISO string');
      } else if (typeof event.timestamp === 'string') {
        const date = new Date(event.timestamp);
        if (isNaN(date.getTime())) {
          errors.push('Timestamp must be a valid date');
        }
      }
    }

    // Interaction data validation
    if (event.interactionData) {
      if (typeof event.interactionData !== 'object') {
        errors.push('Interaction data must be an object');
      } else {
        // Time spent validation
        if (event.interactionData.timeSpent !== undefined) {
          if (typeof event.interactionData.timeSpent !== 'number' || event.interactionData.timeSpent < 0) {
            errors.push('Time spent must be a non-negative number');
          }
        }

        // Engagement score validation
        if (event.interactionData.engagementScore !== undefined) {
          if (typeof event.interactionData.engagementScore !== 'number' || 
              event.interactionData.engagementScore < 0 || 
              event.interactionData.engagementScore > 100) {
            errors.push('Engagement score must be a number between 0 and 100');
          }
        }

        // Mouse movements validation
        if (event.interactionData.mouseMovements && !Array.isArray(event.interactionData.mouseMovements)) {
          errors.push('Mouse movements must be an array');
        }

        // Click patterns validation
        if (event.interactionData.clickPatterns && !Array.isArray(event.interactionData.clickPatterns)) {
          errors.push('Click patterns must be an array');
        }
      }
    }

    return errors;
  }

  /**
   * Validate business logic rules
   */
  private validateBusinessLogic(event: BehaviorEvent): string[] {
    const errors: string[] = [];

    // Timestamp business rules
    if (event.timestamp) {
      const eventTime = new Date(event.timestamp);
      const now = new Date();
      
      // Event cannot be in the future
      if (eventTime > now) {
        errors.push('Event timestamp cannot be in the future');
      }

      // Event cannot be too old (configurable threshold)
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      if (now.getTime() - eventTime.getTime() > maxAge) {
        errors.push('Event timestamp is too old (>7 days)');
      }
    }

    // Time spent validation
    if (event.interactionData?.timeSpent) {
      if (event.interactionData.timeSpent > this.config.qualityThresholds.maxTimeSpent) {
        errors.push(`Time spent exceeds maximum threshold (${this.config.qualityThresholds.maxTimeSpent}s)`);
      }
    }

    // Engagement score business rules
    if (event.interactionData?.engagementScore !== undefined) {
      if (event.interactionData.engagementScore < this.config.qualityThresholds.minEngagementScore) {
        if (this.config.strictMode) {
          errors.push(`Engagement score below minimum threshold (${this.config.qualityThresholds.minEngagementScore})`);
        }
      }
    }

    // Event type validation
    const validEventTypes = [
      'page_view', 'click', 'scroll', 'hover', 'focus', 'blur',
      'form_interaction', 'step_completion', 'step_start', 'help_request',
      'error_encounter', 'success_action', 'navigation', 'search'
    ];
    
    if (event.eventType && !validEventTypes.includes(event.eventType)) {
      errors.push(`Invalid event type: ${event.eventType}`);
    }

    return errors;
  }

  /**
   * Validate data quality
   */
  private validateDataQuality(event: BehaviorEvent): { warnings: string[] } {
    const warnings: string[] = [];

    // Check for missing optional but important fields
    if (!event.stepId) {
      warnings.push('Step ID is missing - may affect analytics accuracy');
    }

    if (!event.interactionData) {
      warnings.push('Interaction data is missing - limited behavioral insights available');
    } else {
      // Check interaction data completeness
      if (!event.interactionData.mouseMovements?.length) {
        warnings.push('No mouse movement data - may indicate tracking issues');
      }

      if (!event.interactionData.clickPatterns?.length && event.eventType === 'click') {
        warnings.push('Click event without click patterns data');
      }

      if (event.interactionData.engagementScore === undefined) {
        warnings.push('Engagement score missing - may affect ML model accuracy');
      }
    }

    // Check for suspicious patterns
    if (event.interactionData?.timeSpent === 0 && String(event.eventType) !== 'page_view') {
      warnings.push('Zero time spent on non-page-view event may indicate tracking error');
    }

    // Check for data consistency
    if (event.interactionData?.clickPatterns?.length && 
        event.interactionData.clickPatterns.length > (event.interactionData.timeSpent || 0)) {
      warnings.push('More clicks than seconds spent - may indicate rapid clicking or data error');
    }

    return { warnings };
  }

  /**
   * Apply custom validation rules
   */
  private async validateCustomRules(event: BehaviorEvent): Promise<string[]> {
    const errors: string[] = [];

    for (const rule of this.config.customRules) {
      try {
        const result = await rule.validate(event);
        if (!result.isValid) {
          errors.push(...result.errors);
        }
      } catch (error) {
        logger.error('Custom validation rule failed', { error, ruleId: rule.id });
        errors.push(`Custom rule '${rule.id}' failed to execute`);
      }
    }

    return errors;
  }

  /**
   * Calculate overall quality score
   */
  private calculateQualityScore(event: BehaviorEvent, errors: string[], warnings: string[]): number {
    let score = 100;

    // Deduct points for errors (more severe)
    score -= errors.length * 20;

    // Deduct points for warnings (less severe)
    score -= warnings.length * 5;

    // Bonus points for data completeness
    const completeness = this.calculateDataCompleteness(event);
    score += completeness * 10;

    // Bonus points for rich interaction data
    if (event.interactionData?.mouseMovements?.length) score += 5;
    if (event.interactionData?.clickPatterns?.length) score += 5;
    if (event.interactionData?.scrollBehavior) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate data completeness percentage
   */
  private calculateDataCompleteness(event: BehaviorEvent): number {
    const totalFields = [
      'id', 'userId', 'eventType', 'timestamp', 'stepId',
      'interactionData', 'contextualData'
    ];
    
    const presentFields = totalFields.filter(field => {
      const value = event[field as keyof BehaviorEvent];
      return value !== undefined && value !== null && value !== '';
    });

    return presentFields.length / totalFields.length;
  }

  /**
   * Update validation statistics
   */
  private updateValidationStats(result: DataValidationResult): void {
    this.validationStats.totalValidated++;
    
    if (result.isValid) {
      this.validationStats.passed++;
    } else {
      this.validationStats.failed++;
    }

    if (result.qualityScore !== undefined) {
      this.validationStats.qualityScores.push(result.qualityScore);
      
      // Keep only last 1000 scores for memory efficiency
      if (this.validationStats.qualityScores.length > 1000) {
        this.validationStats.qualityScores = this.validationStats.qualityScores.slice(-1000);
      }
    }
  }

  /**
   * Clean and normalize event data
   */
  async cleanEvent(event: BehaviorEvent): Promise<BehaviorEvent> {
    const cleanedEvent = { ...event };

    try {
      // Normalize timestamp
      if (typeof cleanedEvent.timestamp === 'string') {
        cleanedEvent.timestamp = new Date(cleanedEvent.timestamp);
      }

      // Trim string fields
      if (cleanedEvent.id) cleanedEvent.id = cleanedEvent.id.trim();
      if (cleanedEvent.userId) cleanedEvent.userId = cleanedEvent.userId.trim();
      if (cleanedEvent.eventType) {
        const t = String(cleanedEvent.eventType).trim().toLowerCase();
        (cleanedEvent as any).eventType = t;
      }
      if (cleanedEvent.stepId) cleanedEvent.stepId = cleanedEvent.stepId.trim();

      // Clean interaction data
      if (cleanedEvent.interactionData) {
        // Round numeric values
        if (cleanedEvent.interactionData.timeSpent) {
          cleanedEvent.interactionData.timeSpent = Math.round(cleanedEvent.interactionData.timeSpent * 100) / 100;
        }
        
        if (cleanedEvent.interactionData.engagementScore) {
          cleanedEvent.interactionData.engagementScore = Math.round(cleanedEvent.interactionData.engagementScore * 100) / 100;
        }

        // Remove empty arrays
        // Keep empty arrays as-is to preserve type shape
        if (cleanedEvent.interactionData.mouseMovements?.length === 0) {
          // no-op
        }
        if (cleanedEvent.interactionData.clickPatterns?.length === 0) {
          // no-op
        }
      }

      // Remove null/undefined values
      const ce: any = cleanedEvent as any;
      Object.keys(ce).forEach(key => {
        const value = ce[key];
        if (value === null || value === undefined) {
          delete ce[key];
        }
      });

      return cleanedEvent;

    } catch (error) {
      logger.error('Event cleaning failed', { error, eventId: event.id });
      return event; // Return original if cleaning fails
    }
  }

  /**
   * Get validation statistics
   */
  getValidationStats(): DataQualityMetrics {
    const avgQualityScore = this.validationStats.qualityScores.length > 0
      ? this.validationStats.qualityScores.reduce((a, b) => a + b, 0) / this.validationStats.qualityScores.length
      : 0;

    return {
      totalValidated: this.validationStats.totalValidated,
      validationSuccessRate: this.validationStats.totalValidated > 0 
        ? (this.validationStats.passed / this.validationStats.totalValidated) * 100 
        : 0,
      averageQualityScore: Math.round(avgQualityScore * 100) / 100,
      qualityDistribution: this.calculateQualityDistribution(),
      lastUpdated: new Date()
    };
  }

  /**
   * Calculate quality score distribution
   */
  private calculateQualityDistribution(): { excellent: number; good: number; fair: number; poor: number } {
    const scores = this.validationStats.qualityScores;
    const total = scores.length;
    
    if (total === 0) {
      return { excellent: 0, good: 0, fair: 0, poor: 0 };
    }

    const excellent = scores.filter(s => s >= 90).length;
    const good = scores.filter(s => s >= 70 && s < 90).length;
    const fair = scores.filter(s => s >= 50 && s < 70).length;
    const poor = scores.filter(s => s < 50).length;

    return {
      excellent: (excellent / total) * 100,
      good: (good / total) * 100,
      fair: (fair / total) * 100,
      poor: (poor / total) * 100
    };
  }

  /**
   * Add custom validation rule
   */
  addCustomRule(rule: CustomValidationRule): void {
    this.config.customRules.push(rule);
  }

  /**
   * Remove custom validation rule
   */
  removeCustomRule(ruleId: string): void {
    this.config.customRules = this.config.customRules.filter(rule => rule.id !== ruleId);
  }

  /**
   * Update validation configuration
   */
  updateConfig(newConfig: Partial<ValidationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

export const dataValidationService = new DataValidationService();
