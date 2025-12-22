/**
 * Duplicate Detector
 * Content & Trends AI Engine - Phase 4
 * 
 * Detects duplicate content using multiple strategies:
 * - Exact ID matching
 * - URL matching
 * - Content hash comparison
 * - Fuzzy text matching
 */

import { createHash } from 'crypto';
import { ScrapedData } from '../apify/types';
import {
  DuplicateReport,
  DuplicateEntry,
  DuplicateMethod,
  IDuplicateDetector,
} from './types';

// ============================================================================
// Configuration
// ============================================================================

export interface DuplicateDetectorConfig {
  /** Enable exact ID matching */
  enableIdMatching: boolean;
  /** Enable URL matching */
  enableUrlMatching: boolean;
  /** Enable content hash matching */
  enableHashMatching: boolean;
  /** Enable fuzzy text matching */
  enableFuzzyMatching: boolean;
  /** Minimum similarity threshold for fuzzy matching (0-1) */
  fuzzyThreshold: number;
  /** Fields to include in content hash */
  hashFields: string[];
}

export const DEFAULT_DUPLICATE_CONFIG: DuplicateDetectorConfig = {
  enableIdMatching: true,
  enableUrlMatching: true,
  enableHashMatching: true,
  enableFuzzyMatching: true,
  fuzzyThreshold: 0.85,
  hashFields: ['platform', 'description', 'author.username'],
};

// ============================================================================
// Duplicate Detector
// ============================================================================

export class DuplicateDetector implements IDuplicateDetector {
  private config: DuplicateDetectorConfig;

  constructor(config: Partial<DuplicateDetectorConfig> = {}) {
    this.config = { ...DEFAULT_DUPLICATE_CONFIG, ...config };
  }

  /**
   * Detect duplicates between new data and existing data
   */
  detectDuplicates(newData: ScrapedData[], existing: ScrapedData[]): DuplicateReport {
    const startTime = Date.now();
    const duplicates: DuplicateEntry[] = [];
    const seenIds = new Set<string>();
    
    // Build lookup maps for existing data
    const existingById = new Map<string, ScrapedData>();
    const existingByUrl = new Map<string, ScrapedData>();
    const existingByHash = new Map<string, ScrapedData>();
    
    for (const item of existing) {
      existingById.set(item.id, item);
      existingByUrl.set(this.normalizeUrl(item.url), item);
      if (this.config.enableHashMatching) {
        existingByHash.set(this.computeContentHash(item), item);
      }
    }
    
    // Check each new item for duplicates
    for (const newItem of newData) {
      // Skip if already marked as duplicate
      if (seenIds.has(newItem.id)) continue;
      
      let duplicate: DuplicateEntry | null = null;
      
      // Check by ID
      if (this.config.enableIdMatching && existingById.has(newItem.id)) {
        duplicate = {
          originalId: existingById.get(newItem.id)!.id,
          duplicateId: newItem.id,
          method: 'exact_id',
          similarity: 1.0,
          detectedAt: new Date(),
        };
      }
      
      // Check by URL
      if (!duplicate && this.config.enableUrlMatching) {
        const normalizedUrl = this.normalizeUrl(newItem.url);
        if (existingByUrl.has(normalizedUrl)) {
          duplicate = {
            originalId: existingByUrl.get(normalizedUrl)!.id,
            duplicateId: newItem.id,
            method: 'url_match',
            similarity: 1.0,
            detectedAt: new Date(),
          };
        }
      }
      
      // Check by content hash
      if (!duplicate && this.config.enableHashMatching) {
        const hash = this.computeContentHash(newItem);
        if (existingByHash.has(hash)) {
          duplicate = {
            originalId: existingByHash.get(hash)!.id,
            duplicateId: newItem.id,
            method: 'content_hash',
            similarity: 1.0,
            detectedAt: new Date(),
          };
        }
      }
      
      // Check by fuzzy text matching
      if (!duplicate && this.config.enableFuzzyMatching) {
        const fuzzyMatch = this.findFuzzyMatch(newItem, existing);
        if (fuzzyMatch) {
          duplicate = fuzzyMatch;
        }
      }
      
      if (duplicate) {
        duplicates.push(duplicate);
        seenIds.add(newItem.id);
      }
    }
    
    return {
      totalChecked: newData.length,
      duplicatesFound: duplicates.length,
      uniqueItems: newData.length - duplicates.length,
      duplicates,
      processingTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Find duplicates within a single batch
   */
  findDuplicatesInBatch(data: ScrapedData[]): DuplicateReport {
    const startTime = Date.now();
    const duplicates: DuplicateEntry[] = [];
    const seenIds = new Set<string>();
    const seenUrls = new Map<string, string>();
    const seenHashes = new Map<string, string>();
    
    for (const item of data) {
      if (seenIds.has(item.id)) continue;
      
      let duplicate: DuplicateEntry | null = null;
      
      // Check URL
      const normalizedUrl = this.normalizeUrl(item.url);
      if (seenUrls.has(normalizedUrl)) {
        duplicate = {
          originalId: seenUrls.get(normalizedUrl)!,
          duplicateId: item.id,
          method: 'url_match',
          similarity: 1.0,
          detectedAt: new Date(),
        };
      }
      
      // Check hash
      if (!duplicate && this.config.enableHashMatching) {
        const hash = this.computeContentHash(item);
        if (seenHashes.has(hash)) {
          duplicate = {
            originalId: seenHashes.get(hash)!,
            duplicateId: item.id,
            method: 'content_hash',
            similarity: 1.0,
            detectedAt: new Date(),
          };
        } else {
          seenHashes.set(hash, item.id);
        }
      }
      
      if (duplicate) {
        duplicates.push(duplicate);
        seenIds.add(item.id);
      } else {
        seenUrls.set(normalizedUrl, item.id);
      }
    }
    
    return {
      totalChecked: data.length,
      duplicatesFound: duplicates.length,
      uniqueItems: data.length - duplicates.length,
      duplicates,
      processingTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Compute content hash for a scraped item
   */
  computeContentHash(data: ScrapedData): string {
    const hashContent: string[] = [];
    
    for (const field of this.config.hashFields) {
      const value = this.getNestedValue(data, field);
      if (value !== undefined && value !== null) {
        hashContent.push(String(value).toLowerCase().trim());
      }
    }
    
    const content = hashContent.join('|');
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Compute similarity between two items
   */
  computeSimilarity(a: ScrapedData, b: ScrapedData): number {
    // Same ID = identical
    if (a.id === b.id) return 1.0;
    
    // Same URL = identical
    if (this.normalizeUrl(a.url) === this.normalizeUrl(b.url)) return 1.0;
    
    // Same hash = identical
    if (this.computeContentHash(a) === this.computeContentHash(b)) return 1.0;
    
    // Calculate text similarity
    const descA = this.getDescription(a);
    const descB = this.getDescription(b);
    
    if (!descA || !descB) return 0;
    
    return this.calculateTextSimilarity(descA, descB);
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      // Remove tracking parameters
      const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'ref', 'fbclid'];
      trackingParams.forEach(param => parsed.searchParams.delete(param));
      // Normalize to lowercase
      return parsed.toString().toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  }

  private getNestedValue(obj: unknown, path: string): unknown {
    const parts = path.split('.');
    let value: unknown = obj;
    
    for (const part of parts) {
      if (value === null || value === undefined) return undefined;
      value = (value as Record<string, unknown>)[part];
    }
    
    return value;
  }

  private getDescription(data: ScrapedData): string | null {
    const dataRecord = data as unknown as Record<string, unknown>;
    const desc = dataRecord.description;
    if (typeof desc === 'string') return desc;
    
    const caption = dataRecord.caption;
    if (typeof caption === 'string') return caption;
    
    return null;
  }

  private findFuzzyMatch(
    newItem: ScrapedData,
    existing: ScrapedData[]
  ): DuplicateEntry | null {
    const newDesc = this.getDescription(newItem);
    if (!newDesc || newDesc.length < 20) return null;
    
    let bestMatch: { item: ScrapedData; similarity: number } | null = null;
    
    for (const existingItem of existing) {
      // Skip if different platform
      if (existingItem.platform !== newItem.platform) continue;
      
      const existingDesc = this.getDescription(existingItem);
      if (!existingDesc) continue;
      
      const similarity = this.calculateTextSimilarity(newDesc, existingDesc);
      
      if (similarity >= this.config.fuzzyThreshold) {
        if (!bestMatch || similarity > bestMatch.similarity) {
          bestMatch = { item: existingItem, similarity };
        }
      }
    }
    
    if (bestMatch) {
      return {
        originalId: bestMatch.item.id,
        duplicateId: newItem.id,
        method: 'fuzzy_text',
        similarity: bestMatch.similarity,
        detectedAt: new Date(),
      };
    }
    
    return null;
  }

  /**
   * Calculate text similarity using Jaccard index on word sets
   */
  private calculateTextSimilarity(a: string, b: string): number {
    const wordsA = this.tokenize(a);
    const wordsB = this.tokenize(b);
    
    if (wordsA.size === 0 || wordsB.size === 0) return 0;
    
    // Calculate Jaccard similarity
    const intersection = new Set(Array.from(wordsA).filter(x => wordsB.has(x)));
    const union = new Set([...Array.from(wordsA), ...Array.from(wordsB)]);
    
    return intersection.size / union.size;
  }

  private tokenize(text: string): Set<string> {
    // Normalize and split into words
    const normalized = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    const words = normalized.split(' ').filter(w => w.length > 2);
    return new Set(words);
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a duplicate detector instance
 */
export function createDuplicateDetector(
  config?: Partial<DuplicateDetectorConfig>
): DuplicateDetector {
  return new DuplicateDetector(config);
}
