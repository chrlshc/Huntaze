/**
 * Data Quality and Validation Types
 * Content & Trends AI Engine - Phase 4
 * 
 * Type definitions for data quality validation, duplicate detection,
 * metadata enrichment, and content quality scoring.
 */

import { ScrapedData, SocialPlatform, ContentType } from '../apify/types';

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Severity levels for validation issues
 */
export type ValidationSeverity = 'critical' | 'major' | 'minor';

/**
 * Validation error details
 */
export interface DataValidationError {
  field: string;
  message: string;
  severity: ValidationSeverity;
  code: string;
  value?: unknown;
}

/**
 * Validation warning details
 */
export interface DataValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

/**
 * Result of content validation
 */
export interface ValidationResult {
  isValid: boolean;
  errors: DataValidationError[];
  warnings: DataValidationWarning[];
  qualityScore: number;
  validatedAt: Date;
}

// ============================================================================
// Duplicate Detection Types
// ============================================================================

/**
 * Duplicate detection methods
 */
export type DuplicateMethod = 
  | 'exact_id'
  | 'url_match'
  | 'content_hash'
  | 'fuzzy_text'
  | 'visual_similarity';

/**
 * Single duplicate entry
 */
export interface DuplicateEntry {
  originalId: string;
  duplicateId: string;
  method: DuplicateMethod;
  similarity: number;
  detectedAt: Date;
}

/**
 * Report of duplicate detection
 */
export interface DuplicateReport {
  totalChecked: number;
  duplicatesFound: number;
  uniqueItems: number;
  duplicates: DuplicateEntry[];
  processingTimeMs: number;
}

// ============================================================================
// Content Quality Types
// ============================================================================

/**
 * Quality dimensions for content
 */
export interface QualityDimensions {
  completeness: number;      // 0-1: How complete is the data
  accuracy: number;          // 0-1: How accurate/valid are the values
  freshness: number;         // 0-1: How recent is the content
  engagement: number;        // 0-1: Engagement quality score
  mediaQuality: number;      // 0-1: Quality of media assets
}

/**
 * Quality metrics for content
 */
export interface QualityMetrics {
  overallScore: number;
  dimensions: QualityDimensions;
  flags: QualityFlag[];
  recommendations: string[];
}

/**
 * Quality flags for content issues
 */
export interface QualityFlag {
  type: QualityFlagType;
  severity: ValidationSeverity;
  description: string;
  field?: string;
}

export type QualityFlagType =
  | 'missing_media'
  | 'low_engagement'
  | 'suspicious_metrics'
  | 'incomplete_metadata'
  | 'stale_content'
  | 'invalid_url'
  | 'spam_detected'
  | 'bot_activity'
  | 'low_quality_media';

// ============================================================================
// Metadata Enrichment Types
// ============================================================================

/**
 * Language detection result
 */
export interface LanguageDetection {
  language: string;
  confidence: number;
  alternatives: Array<{
    language: string;
    confidence: number;
  }>;
}

/**
 * Content category
 */
export interface ContentCategory {
  category: string;
  subcategory?: string;
  confidence: number;
  tags: string[];
}

/**
 * Sentiment analysis result
 */
export interface SentimentAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  score: number;
  confidence: number;
  aspects?: Array<{
    aspect: string;
    sentiment: string;
    score: number;
  }>;
}

/**
 * Viral velocity metrics
 */
export interface ViralVelocityMetrics {
  viewsPerHour: number;
  likesPerHour: number;
  sharesPerHour: number;
  commentsPerHour: number;
  velocityScore: number;
  trend: 'accelerating' | 'stable' | 'decelerating';
}

/**
 * Additional metadata extracted from content
 */
export interface AdditionalMetadata {
  language: LanguageDetection;
  categories: ContentCategory[];
  sentiment: SentimentAnalysis;
  viralVelocity: ViralVelocityMetrics;
  extractedEntities: ExtractedEntity[];
  contentSignature: string;
}

/**
 * Extracted entity from content
 */
export interface ExtractedEntity {
  type: 'person' | 'brand' | 'product' | 'location' | 'event' | 'hashtag' | 'mention';
  value: string;
  confidence: number;
  context?: string;
}

/**
 * Enriched data with additional metadata
 * Note: This type uses intersection with ScrapedData to properly handle the union type
 */
export type EnrichedData = ScrapedData & {
  enrichment: {
    metadata: AdditionalMetadata;
    qualityMetrics: QualityMetrics;
    enrichedAt: Date;
    version: string;
  };
};

// ============================================================================
// Filter Configuration Types
// ============================================================================

/**
 * Quality filter configuration
 */
export interface QualityFilterConfig {
  minQualityScore: number;
  minEngagement: number;
  maxAgeHours: number;
  excludeFlags: QualityFlagType[];
  requireMedia: boolean;
  requireDescription: boolean;
  minDescriptionLength: number;
}

/**
 * Default quality filter configuration
 */
export const DEFAULT_QUALITY_FILTER_CONFIG: QualityFilterConfig = {
  minQualityScore: 0.5,
  minEngagement: 100,
  maxAgeHours: 168, // 7 days
  excludeFlags: ['spam_detected', 'bot_activity'],
  requireMedia: true,
  requireDescription: true,
  minDescriptionLength: 10,
};

// ============================================================================
// Validation Rules Types
// ============================================================================

/**
 * Validation rule definition
 */
export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  field: string;
  validator: (value: unknown, context?: ScrapedData) => boolean;
  errorMessage: string;
  severity: ValidationSeverity;
  platforms?: SocialPlatform[];
}

/**
 * Validation rule set
 */
export interface ValidationRuleSet {
  id: string;
  name: string;
  rules: ValidationRule[];
  enabled: boolean;
}

// ============================================================================
// Service Interfaces
// ============================================================================

/**
 * Data quality validator interface
 */
export interface IDataQualityValidator {
  validateScrapedContent(data: ScrapedData): ValidationResult;
  validateBatch(data: ScrapedData[]): Map<string, ValidationResult>;
  getValidationRules(): ValidationRule[];
  addCustomRule(rule: ValidationRule): void;
}

/**
 * Duplicate detector interface
 */
export interface IDuplicateDetector {
  detectDuplicates(newData: ScrapedData[], existing: ScrapedData[]): DuplicateReport;
  findDuplicatesInBatch(data: ScrapedData[]): DuplicateReport;
  computeContentHash(data: ScrapedData): string;
  computeSimilarity(a: ScrapedData, b: ScrapedData): number;
}

/**
 * Metadata enrichment service interface
 */
export interface IMetadataEnrichmentService {
  enrichMetadata(data: ScrapedData): Promise<EnrichedData>;
  enrichBatch(data: ScrapedData[]): Promise<EnrichedData[]>;
  detectLanguage(text: string): Promise<LanguageDetection>;
  categorizeContent(data: ScrapedData): Promise<ContentCategory[]>;
  analyzeSentiment(text: string): Promise<SentimentAnalysis>;
  calculateViralVelocity(data: ScrapedData): ViralVelocityMetrics;
}

/**
 * Quality filter interface
 */
export interface IQualityFilter {
  filterLowQuality(data: ScrapedData[], config?: QualityFilterConfig): ScrapedData[];
  calculateQualityScore(data: ScrapedData): QualityMetrics;
  getQualityFlags(data: ScrapedData): QualityFlag[];
}

/**
 * Combined data quality service interface
 */
export interface IDataQualityService extends 
  IDataQualityValidator, 
  IDuplicateDetector, 
  IMetadataEnrichmentService, 
  IQualityFilter {
  processAndValidate(data: ScrapedData[]): Promise<{
    valid: EnrichedData[];
    invalid: Array<{ data: ScrapedData; result: ValidationResult }>;
    duplicates: DuplicateReport;
    stats: ProcessingStats;
  }>;
}

/**
 * Processing statistics
 */
export interface ProcessingStats {
  totalInput: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  enrichedCount: number;
  processingTimeMs: number;
  averageQualityScore: number;
}
