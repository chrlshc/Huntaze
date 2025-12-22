/**
 * Data Quality Module
 * Content & Trends AI Engine - Phase 4
 * 
 * Comprehensive data quality validation and enrichment for scraped content:
 * - Content validation against quality rules
 * - Duplicate detection using multiple strategies
 * - Metadata enrichment (language, categories, sentiment, velocity)
 * - Quality filtering based on configurable criteria
 */

// Types
export type {
  // Validation types
  ValidationSeverity,
  DataValidationError,
  DataValidationWarning,
  ValidationResult,
  ValidationRule,
  ValidationRuleSet,
  // Duplicate detection types
  DuplicateMethod,
  DuplicateEntry,
  DuplicateReport,
  // Quality types
  QualityDimensions,
  QualityMetrics,
  QualityFlag,
  QualityFlagType,
  QualityFilterConfig,
  // Enrichment types
  LanguageDetection,
  ContentCategory,
  SentimentAnalysis,
  ViralVelocityMetrics,
  AdditionalMetadata,
  ExtractedEntity,
  EnrichedData,
  // Service interfaces
  IDataQualityValidator,
  IDuplicateDetector,
  IMetadataEnrichmentService,
  IQualityFilter,
  IDataQualityService,
  // Stats
  ProcessingStats,
} from './types';

// Default configurations
export { DEFAULT_QUALITY_FILTER_CONFIG } from './types';

// Validator
export {
  DataQualityValidator,
  createDataQualityValidator,
  CORE_VALIDATION_RULES,
  TIKTOK_RULES,
  INSTAGRAM_RULES,
  YOUTUBE_RULES,
} from './validator';

// Duplicate Detector
export {
  DuplicateDetector,
  createDuplicateDetector,
  DEFAULT_DUPLICATE_CONFIG,
  type DuplicateDetectorConfig,
} from './duplicate-detector';

// Enrichment Service
export {
  MetadataEnrichmentService,
  createEnrichmentService,
  DEFAULT_ENRICHMENT_CONFIG,
  type EnrichmentConfig,
} from './enrichment-service';

// Quality Filter
export {
  QualityFilter,
  createQualityFilter,
} from './quality-filter';

// Data Quality Service (combined)
export {
  DataQualityService,
  createDataQualityService,
  getDataQualityService,
  setDataQualityService,
  DEFAULT_SERVICE_CONFIG,
  type DataQualityServiceConfig,
} from './data-quality-service';
