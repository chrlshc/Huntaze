/**
 * Data Quality Service
 * Content & Trends AI Engine - Phase 4
 * 
 * Combined service that orchestrates all data quality operations:
 * - Validation
 * - Duplicate detection
 * - Metadata enrichment
 * - Quality filtering
 */

import { ScrapedData } from '../apify/types';
import {
  ValidationResult,
  DuplicateReport,
  EnrichedData,
  QualityMetrics,
  QualityFlag,
  QualityFilterConfig,
  ProcessingStats,
  IDataQualityService,
  ValidationRule,
  LanguageDetection,
  ContentCategory,
  SentimentAnalysis,
  ViralVelocityMetrics,
} from './types';
import { DataQualityValidator, createDataQualityValidator } from './validator';
import { DuplicateDetector, createDuplicateDetector, DuplicateDetectorConfig } from './duplicate-detector';
import { MetadataEnrichmentService, createEnrichmentService, EnrichmentConfig } from './enrichment-service';
import { QualityFilter, createQualityFilter } from './quality-filter';

// ============================================================================
// Configuration
// ============================================================================

export interface DataQualityServiceConfig {
  /** Validator configuration */
  validator?: {
    includeAllPlatformRules?: boolean;
  };
  /** Duplicate detector configuration */
  duplicateDetector?: Partial<DuplicateDetectorConfig>;
  /** Enrichment service configuration */
  enrichment?: Partial<EnrichmentConfig>;
  /** Quality filter configuration */
  qualityFilter?: Partial<QualityFilterConfig>;
  /** Skip validation step */
  skipValidation?: boolean;
  /** Skip duplicate detection */
  skipDuplicateDetection?: boolean;
  /** Skip enrichment */
  skipEnrichment?: boolean;
  /** Skip quality filtering */
  skipQualityFiltering?: boolean;
}

export const DEFAULT_SERVICE_CONFIG: DataQualityServiceConfig = {
  skipValidation: false,
  skipDuplicateDetection: false,
  skipEnrichment: false,
  skipQualityFiltering: false,
};

// ============================================================================
// Data Quality Service
// ============================================================================

export class DataQualityService implements IDataQualityService {
  private validator: DataQualityValidator;
  private duplicateDetector: DuplicateDetector;
  private enrichmentService: MetadataEnrichmentService;
  private qualityFilter: QualityFilter;
  private config: DataQualityServiceConfig;

  constructor(config: DataQualityServiceConfig = {}) {
    this.config = { ...DEFAULT_SERVICE_CONFIG, ...config };
    
    this.validator = createDataQualityValidator(config.validator);
    this.duplicateDetector = createDuplicateDetector(config.duplicateDetector);
    this.enrichmentService = createEnrichmentService(config.enrichment);
    this.qualityFilter = createQualityFilter(config.qualityFilter);
  }

  /**
   * Process and validate a batch of scraped data
   * 
   * This is the main entry point that orchestrates all quality operations.
   */
  async processAndValidate(data: ScrapedData[]): Promise<{
    valid: EnrichedData[];
    invalid: Array<{ data: ScrapedData; result: ValidationResult }>;
    duplicates: DuplicateReport;
    stats: ProcessingStats;
  }> {
    const startTime = Date.now();
    const valid: EnrichedData[] = [];
    const invalid: Array<{ data: ScrapedData; result: ValidationResult }> = [];
    
    // Step 1: Validate all items
    let validatedData = data;
    if (!this.config.skipValidation) {
      const validationResults = this.validateBatch(data);
      
      validatedData = [];
      for (const item of data) {
        const result = validationResults.get(item.id);
        if (result && result.isValid) {
          validatedData.push(item);
        } else if (result) {
          invalid.push({ data: item, result });
        }
      }
    }
    
    // Step 2: Detect duplicates
    let duplicates: DuplicateReport = {
      totalChecked: 0,
      duplicatesFound: 0,
      uniqueItems: validatedData.length,
      duplicates: [],
      processingTimeMs: 0,
    };
    
    if (!this.config.skipDuplicateDetection) {
      duplicates = this.findDuplicatesInBatch(validatedData);
      
      // Remove duplicates from validated data
      const duplicateIds = new Set(duplicates.duplicates.map(d => d.duplicateId));
      validatedData = validatedData.filter(item => !duplicateIds.has(item.id));
    }
    
    // Step 3: Enrich metadata
    let enrichedData: EnrichedData[] = [];
    if (!this.config.skipEnrichment) {
      enrichedData = await this.enrichBatch(validatedData);
    } else {
      // Create minimal enriched data structure
      enrichedData = validatedData.map(item => ({
        ...item,
        enrichment: {
          metadata: {
            language: { language: 'unknown', confidence: 0, alternatives: [] },
            categories: [],
            sentiment: { sentiment: 'neutral' as const, score: 0, confidence: 0 },
            viralVelocity: { viewsPerHour: 0, likesPerHour: 0, sharesPerHour: 0, commentsPerHour: 0, velocityScore: 0, trend: 'stable' as const },
            extractedEntities: [],
            contentSignature: '',
          },
          qualityMetrics: this.calculateQualityScore(item),
          enrichedAt: new Date(),
          version: '1.0.0',
        },
      })) as EnrichedData[];
    }
    
    // Step 4: Filter low quality
    if (!this.config.skipQualityFiltering) {
      // Cast enriched data back to ScrapedData for filtering (they share the same base structure)
      const dataForFiltering = enrichedData.map(item => {
        // Extract the base ScrapedData properties
        const { enrichment: _enrichment, ...baseData } = item;
        return baseData as ScrapedData;
      });
      const filteredData = this.filterLowQuality(dataForFiltering);
      const filteredIds = new Set(filteredData.map(d => d.id));
      
      // Separate filtered out items
      for (const item of enrichedData) {
        // Access id from the base ScrapedData properties
        const itemId = (item as unknown as ScrapedData).id;
        if (filteredIds.has(itemId)) {
          valid.push(item);
        } else {
          // Add to invalid with quality-based rejection
          invalid.push({
            data: item as unknown as ScrapedData,
            result: {
              isValid: false,
              errors: [{
                field: 'quality',
                message: 'Content filtered due to low quality score',
                severity: 'major',
                code: 'quality_filter',
              }],
              warnings: [],
              qualityScore: item.enrichment.qualityMetrics.overallScore,
              validatedAt: new Date(),
            },
          });
        }
      }
    } else {
      valid.push(...enrichedData);
    }
    
    // Calculate stats
    const processingTimeMs = Date.now() - startTime;
    const averageQualityScore = valid.length > 0
      ? valid.reduce((sum, item) => sum + item.enrichment.qualityMetrics.overallScore, 0) / valid.length
      : 0;
    
    const stats: ProcessingStats = {
      totalInput: data.length,
      validCount: valid.length,
      invalidCount: invalid.length,
      duplicateCount: duplicates.duplicatesFound,
      enrichedCount: valid.length,
      processingTimeMs,
      averageQualityScore,
    };
    
    return { valid, invalid, duplicates, stats };
  }

  // ==========================================================================
  // IDataQualityValidator Implementation
  // ==========================================================================

  validateScrapedContent(data: ScrapedData): ValidationResult {
    return this.validator.validateScrapedContent(data);
  }

  validateBatch(data: ScrapedData[]): Map<string, ValidationResult> {
    return this.validator.validateBatch(data);
  }

  getValidationRules(): ValidationRule[] {
    return this.validator.getValidationRules();
  }

  addCustomRule(rule: ValidationRule): void {
    this.validator.addCustomRule(rule);
  }

  // ==========================================================================
  // IDuplicateDetector Implementation
  // ==========================================================================

  detectDuplicates(newData: ScrapedData[], existing: ScrapedData[]): DuplicateReport {
    return this.duplicateDetector.detectDuplicates(newData, existing);
  }

  findDuplicatesInBatch(data: ScrapedData[]): DuplicateReport {
    return this.duplicateDetector.findDuplicatesInBatch(data);
  }

  computeContentHash(data: ScrapedData): string {
    return this.duplicateDetector.computeContentHash(data);
  }

  computeSimilarity(a: ScrapedData, b: ScrapedData): number {
    return this.duplicateDetector.computeSimilarity(a, b);
  }

  // ==========================================================================
  // IMetadataEnrichmentService Implementation
  // ==========================================================================

  async enrichMetadata(data: ScrapedData): Promise<EnrichedData> {
    return this.enrichmentService.enrichMetadata(data);
  }

  async enrichBatch(data: ScrapedData[]): Promise<EnrichedData[]> {
    return this.enrichmentService.enrichBatch(data);
  }

  async detectLanguage(text: string): Promise<LanguageDetection> {
    return this.enrichmentService.detectLanguage(text);
  }

  async categorizeContent(data: ScrapedData): Promise<ContentCategory[]> {
    return this.enrichmentService.categorizeContent(data);
  }

  async analyzeSentiment(text: string): Promise<SentimentAnalysis> {
    return this.enrichmentService.analyzeSentiment(text);
  }

  calculateViralVelocity(data: ScrapedData): ViralVelocityMetrics {
    return this.enrichmentService.calculateViralVelocity(data);
  }

  // ==========================================================================
  // IQualityFilter Implementation
  // ==========================================================================

  filterLowQuality(data: ScrapedData[], config?: QualityFilterConfig): ScrapedData[] {
    return this.qualityFilter.filterLowQuality(data, config);
  }

  calculateQualityScore(data: ScrapedData): QualityMetrics {
    return this.qualityFilter.calculateQualityScore(data);
  }

  getQualityFlags(data: ScrapedData): QualityFlag[] {
    return this.qualityFilter.getQualityFlags(data);
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a data quality service instance
 */
export function createDataQualityService(
  config?: DataQualityServiceConfig
): DataQualityService {
  return new DataQualityService(config);
}

// Singleton instance
let defaultService: DataQualityService | null = null;

/**
 * Get the default data quality service instance
 */
export function getDataQualityService(): DataQualityService {
  if (!defaultService) {
    defaultService = createDataQualityService();
  }
  return defaultService;
}

/**
 * Set the default data quality service instance
 */
export function setDataQualityService(service: DataQualityService): void {
  defaultService = service;
}
