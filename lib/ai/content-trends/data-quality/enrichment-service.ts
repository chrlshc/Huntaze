/**
 * Metadata Enrichment Service
 * Content & Trends AI Engine - Phase 4
 * 
 * Enriches scraped content with additional metadata:
 * - Language detection
 * - Content categorization
 * - Sentiment analysis
 * - Viral velocity calculation
 * - Entity extraction
 */

import { createHash } from 'crypto';
import { ScrapedData } from '../apify/types';
import {
  EnrichedData,
  AdditionalMetadata,
  LanguageDetection,
  ContentCategory,
  SentimentAnalysis,
  ViralVelocityMetrics,
  ExtractedEntity,
  QualityMetrics,
  QualityDimensions,
  QualityFlag,
  IMetadataEnrichmentService,
} from './types';

// Helper to safely access properties on ScrapedData union type
function asRecord(data: ScrapedData): Record<string, unknown> {
  return data as unknown as Record<string, unknown>;
}

// ============================================================================
// Configuration
// ============================================================================

export interface EnrichmentConfig {
  /** Enable language detection */
  detectLanguage: boolean;
  /** Enable content categorization */
  categorizeContent: boolean;
  /** Enable sentiment analysis */
  analyzeSentiment: boolean;
  /** Enable entity extraction */
  extractEntities: boolean;
  /** Calculate viral velocity */
  calculateVelocity: boolean;
}

export const DEFAULT_ENRICHMENT_CONFIG: EnrichmentConfig = {
  detectLanguage: true,
  categorizeContent: true,
  analyzeSentiment: true,
  extractEntities: true,
  calculateVelocity: true,
};

// ============================================================================
// Language Detection Patterns
// ============================================================================

const LANGUAGE_PATTERNS: Record<string, RegExp[]> = {
  en: [/\b(the|and|is|are|was|were|have|has|been|will|would|could|should)\b/gi],
  fr: [/\b(le|la|les|de|du|des|est|sont|avec|pour|dans|sur)\b/gi],
  es: [/\b(el|la|los|las|de|del|es|son|con|para|en|que)\b/gi],
  de: [/\b(der|die|das|und|ist|sind|mit|für|auf|ein|eine)\b/gi],
  pt: [/\b(o|a|os|as|de|do|da|é|são|com|para|em|que)\b/gi],
  it: [/\b(il|la|i|le|di|del|è|sono|con|per|in|che)\b/gi],
  ja: [/[\u3040-\u309F\u30A0-\u30FF]/g],
  zh: [/[\u4E00-\u9FFF]/g],
  ko: [/[\uAC00-\uD7AF]/g],
  ar: [/[\u0600-\u06FF]/g],
};

// ============================================================================
// Content Categories
// ============================================================================

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  entertainment: ['funny', 'comedy', 'laugh', 'joke', 'meme', 'viral', 'trend'],
  education: ['learn', 'tutorial', 'how to', 'tips', 'guide', 'explain', 'teach'],
  lifestyle: ['life', 'daily', 'routine', 'vlog', 'day in', 'morning', 'night'],
  beauty: ['makeup', 'skincare', 'beauty', 'cosmetic', 'hair', 'nail', 'glow'],
  fashion: ['outfit', 'style', 'fashion', 'wear', 'clothes', 'dress', 'look'],
  fitness: ['workout', 'gym', 'fitness', 'exercise', 'health', 'muscle', 'diet'],
  food: ['recipe', 'cook', 'food', 'eat', 'meal', 'restaurant', 'delicious'],
  travel: ['travel', 'trip', 'vacation', 'explore', 'adventure', 'destination'],
  tech: ['tech', 'gadget', 'review', 'unbox', 'phone', 'computer', 'app'],
  gaming: ['game', 'gaming', 'play', 'stream', 'esports', 'console', 'pc'],
  music: ['music', 'song', 'dance', 'sing', 'cover', 'remix', 'beat'],
  business: ['business', 'entrepreneur', 'startup', 'money', 'invest', 'finance'],
};

// ============================================================================
// Sentiment Patterns
// ============================================================================

const POSITIVE_WORDS = new Set([
  'love', 'amazing', 'awesome', 'great', 'best', 'beautiful', 'perfect',
  'happy', 'excited', 'wonderful', 'fantastic', 'incredible', 'excellent',
  'brilliant', 'outstanding', 'superb', 'magnificent', 'delightful', 'joy',
]);

const NEGATIVE_WORDS = new Set([
  'hate', 'terrible', 'awful', 'worst', 'bad', 'ugly', 'horrible',
  'sad', 'angry', 'disappointed', 'disgusting', 'pathetic', 'annoying',
  'frustrating', 'boring', 'waste', 'fail', 'disaster', 'nightmare',
]);

// ============================================================================
// Metadata Enrichment Service
// ============================================================================

export class MetadataEnrichmentService implements IMetadataEnrichmentService {
  private config: EnrichmentConfig;
  private readonly VERSION = '1.0.0';

  constructor(config: Partial<EnrichmentConfig> = {}) {
    this.config = { ...DEFAULT_ENRICHMENT_CONFIG, ...config };
  }

  /**
   * Enrich a single scraped item with additional metadata
   */
  async enrichMetadata(data: ScrapedData): Promise<EnrichedData> {
    const text = this.extractText(data);
    
    const metadata: AdditionalMetadata = {
      language: this.config.detectLanguage 
        ? await this.detectLanguage(text)
        : { language: 'unknown', confidence: 0, alternatives: [] },
      categories: this.config.categorizeContent
        ? await this.categorizeContent(data)
        : [],
      sentiment: this.config.analyzeSentiment
        ? await this.analyzeSentiment(text)
        : { sentiment: 'neutral', score: 0, confidence: 0 },
      viralVelocity: this.config.calculateVelocity
        ? this.calculateViralVelocity(data)
        : { viewsPerHour: 0, likesPerHour: 0, sharesPerHour: 0, commentsPerHour: 0, velocityScore: 0, trend: 'stable' },
      extractedEntities: this.config.extractEntities
        ? this.extractEntities(data)
        : [],
      contentSignature: this.generateContentSignature(data),
    };

    const qualityMetrics = this.calculateQualityMetrics(data, metadata);

    return {
      ...data,
      enrichment: {
        metadata,
        qualityMetrics,
        enrichedAt: new Date(),
        version: this.VERSION,
      },
    } as EnrichedData;
  }

  /**
   * Enrich a batch of scraped items
   */
  async enrichBatch(data: ScrapedData[]): Promise<EnrichedData[]> {
    const results: EnrichedData[] = [];
    
    for (const item of data) {
      const enriched = await this.enrichMetadata(item);
      results.push(enriched);
    }
    
    return results;
  }

  /**
   * Detect language of text content
   */
  async detectLanguage(text: string): Promise<LanguageDetection> {
    if (!text || text.length < 10) {
      return { language: 'unknown', confidence: 0, alternatives: [] };
    }

    const scores: Record<string, number> = {};
    const normalizedText = text.toLowerCase();

    for (const [lang, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
      let matchCount = 0;
      for (const pattern of patterns) {
        const matches = normalizedText.match(pattern);
        matchCount += matches ? matches.length : 0;
      }
      scores[lang] = matchCount;
    }

    // Sort by score
    const sorted = Object.entries(scores)
      .filter(([, score]) => score > 0)
      .sort((a, b) => b[1] - a[1]);

    if (sorted.length === 0) {
      return { language: 'en', confidence: 0.5, alternatives: [] }; // Default to English
    }

    const totalScore = sorted.reduce((sum, [, score]) => sum + score, 0);
    const topLang = sorted[0][0];
    const topScore = sorted[0][1];
    const confidence = Math.min(0.95, topScore / Math.max(totalScore, 1));

    const alternatives = sorted.slice(1, 4).map(([lang, score]) => ({
      language: lang,
      confidence: score / Math.max(totalScore, 1),
    }));

    return {
      language: topLang,
      confidence,
      alternatives,
    };
  }

  /**
   * Categorize content based on text and metadata
   */
  async categorizeContent(data: ScrapedData): Promise<ContentCategory[]> {
    const text = this.extractText(data).toLowerCase();
    const dataRecord = asRecord(data);
    const hashtags = (dataRecord.hashtags as string[]) || [];
    const combinedText = `${text} ${hashtags.join(' ')}`;

    const categories: ContentCategory[] = [];

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      let matchCount = 0;
      const matchedTags: string[] = [];

      for (const keyword of keywords) {
        if (combinedText.includes(keyword)) {
          matchCount++;
          matchedTags.push(keyword);
        }
      }

      if (matchCount > 0) {
        const confidence = Math.min(0.95, matchCount / keywords.length * 2);
        categories.push({
          category,
          confidence,
          tags: matchedTags,
        });
      }
    }

    // Sort by confidence and return top 3
    return categories
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
  }

  /**
   * Analyze sentiment of text content
   */
  async analyzeSentiment(text: string): Promise<SentimentAnalysis> {
    if (!text || text.length < 5) {
      return { sentiment: 'neutral', score: 0, confidence: 0 };
    }

    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of words) {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (POSITIVE_WORDS.has(cleanWord)) positiveCount++;
      if (NEGATIVE_WORDS.has(cleanWord)) negativeCount++;
    }

    const total = positiveCount + negativeCount;
    if (total === 0) {
      return { sentiment: 'neutral', score: 0, confidence: 0.5 };
    }

    const score = (positiveCount - negativeCount) / total;
    const confidence = Math.min(0.9, total / words.length * 5);

    let sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
    if (score > 0.3) sentiment = 'positive';
    else if (score < -0.3) sentiment = 'negative';
    else if (positiveCount > 0 && negativeCount > 0) sentiment = 'mixed';
    else sentiment = 'neutral';

    return { sentiment, score, confidence };
  }

  /**
   * Calculate viral velocity metrics
   */
  calculateViralVelocity(data: ScrapedData): ViralVelocityMetrics {
    const dataRecord = asRecord(data);
    const stats = dataRecord.stats as Record<string, number> | undefined;
    const createdAt = dataRecord.createdAt as string | Date | undefined;
    const scrapedAt = data.scrapedAt;

    if (!stats || !createdAt || !scrapedAt) {
      return {
        viewsPerHour: 0,
        likesPerHour: 0,
        sharesPerHour: 0,
        commentsPerHour: 0,
        velocityScore: 0,
        trend: 'stable',
      };
    }

    const ageHours = Math.max(1, 
      (new Date(scrapedAt).getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60)
    );

    const viewsPerHour = (stats.viewCount || 0) / ageHours;
    const likesPerHour = (stats.likeCount || 0) / ageHours;
    const sharesPerHour = (stats.shareCount || 0) / ageHours;
    const commentsPerHour = (stats.commentCount || 0) / ageHours;

    // Calculate velocity score (weighted combination)
    const velocityScore = Math.min(1, (
      viewsPerHour * 0.001 +
      likesPerHour * 0.01 +
      sharesPerHour * 0.05 +
      commentsPerHour * 0.02
    ) / 100);

    // Determine trend based on engagement rate
    const engagementRate = stats.viewCount > 0
      ? (stats.likeCount + stats.shareCount + stats.commentCount) / stats.viewCount
      : 0;

    let trend: 'accelerating' | 'stable' | 'decelerating';
    if (engagementRate > 0.1 && velocityScore > 0.5) trend = 'accelerating';
    else if (engagementRate < 0.02 || velocityScore < 0.1) trend = 'decelerating';
    else trend = 'stable';

    return {
      viewsPerHour: Math.round(viewsPerHour),
      likesPerHour: Math.round(likesPerHour),
      sharesPerHour: Math.round(sharesPerHour),
      commentsPerHour: Math.round(commentsPerHour),
      velocityScore,
      trend,
    };
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private extractText(data: ScrapedData): string {
    const parts: string[] = [];
    const dataRecord = asRecord(data);
    
    const description = dataRecord.description;
    if (typeof description === 'string') parts.push(description);
    
    const caption = dataRecord.caption;
    if (typeof caption === 'string') parts.push(caption);
    
    const title = dataRecord.title;
    if (typeof title === 'string') parts.push(title);
    
    return parts.join(' ');
  }

  private extractEntities(data: ScrapedData): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    const text = this.extractText(data);
    const dataRecord = asRecord(data);
    
    // Extract hashtags
    const hashtags = (dataRecord.hashtags as string[]) || [];
    for (const tag of hashtags) {
      entities.push({
        type: 'hashtag',
        value: tag,
        confidence: 1.0,
      });
    }
    
    // Extract mentions
    const mentions = (dataRecord.mentions as string[]) || [];
    for (const mention of mentions) {
      entities.push({
        type: 'mention',
        value: mention,
        confidence: 1.0,
      });
    }
    
    // Extract @mentions from text
    const mentionMatches = text.match(/@[\w]+/g) || [];
    for (const match of mentionMatches) {
      if (!mentions.includes(match.substring(1))) {
        entities.push({
          type: 'mention',
          value: match.substring(1),
          confidence: 0.9,
        });
      }
    }
    
    // Extract #hashtags from text
    const hashtagMatches = text.match(/#[\w]+/g) || [];
    for (const match of hashtagMatches) {
      if (!hashtags.includes(match.substring(1))) {
        entities.push({
          type: 'hashtag',
          value: match.substring(1),
          confidence: 0.9,
        });
      }
    }
    
    return entities;
  }

  private generateContentSignature(data: ScrapedData): string {
    const text = this.extractText(data);
    const platform = data.platform;
    const dataRecord = asRecord(data);
    const author = (dataRecord.author as Record<string, unknown>)?.username || '';
    
    const content = `${platform}|${author}|${text.substring(0, 200)}`;
    return createHash('md5').update(content).digest('hex');
  }

  private calculateQualityMetrics(
    data: ScrapedData,
    metadata: AdditionalMetadata
  ): QualityMetrics {
    const dimensions = this.calculateQualityDimensions(data, metadata);
    const flags = this.getQualityFlags(data, metadata);
    
    // Calculate overall score
    const weights = {
      completeness: 0.25,
      accuracy: 0.25,
      freshness: 0.2,
      engagement: 0.2,
      mediaQuality: 0.1,
    };
    
    const overallScore = Object.entries(weights).reduce((sum, [key, weight]) => {
      return sum + dimensions[key as keyof QualityDimensions] * weight;
    }, 0);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(dimensions, flags);
    
    return {
      overallScore,
      dimensions,
      flags,
      recommendations,
    };
  }

  private calculateQualityDimensions(
    data: ScrapedData,
    metadata: AdditionalMetadata
  ): QualityDimensions {
    const dataRecord = asRecord(data);
    
    // Completeness: Check for required fields
    let completeness = 0;
    const requiredFields = ['id', 'url', 'platform', 'scrapedAt'];
    const optionalFields = ['description', 'author', 'stats', 'hashtags'];
    
    for (const field of requiredFields) {
      if (dataRecord[field]) completeness += 0.15;
    }
    for (const field of optionalFields) {
      if (dataRecord[field]) completeness += 0.1;
    }
    completeness = Math.min(1, completeness);
    
    // Accuracy: Based on validation and language detection confidence
    const accuracy = metadata.language.confidence * 0.5 + 
      (metadata.categories.length > 0 ? metadata.categories[0].confidence * 0.5 : 0.25);
    
    // Freshness: Based on content age
    const createdAt = dataRecord.createdAt as string | Date | undefined;
    let freshness = 0.5;
    if (createdAt) {
      const ageHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
      if (ageHours < 24) freshness = 1.0;
      else if (ageHours < 72) freshness = 0.8;
      else if (ageHours < 168) freshness = 0.6;
      else if (ageHours < 720) freshness = 0.4;
      else freshness = 0.2;
    }
    
    // Engagement: Based on viral velocity
    const engagement = metadata.viralVelocity.velocityScore;
    
    // Media quality: Placeholder (would need actual media analysis)
    const mediaQuality = 0.7;
    
    return {
      completeness,
      accuracy,
      freshness,
      engagement,
      mediaQuality,
    };
  }

  private getQualityFlags(
    data: ScrapedData,
    metadata: AdditionalMetadata
  ): QualityFlag[] {
    const flags: QualityFlag[] = [];
    const dataRecord = asRecord(data);
    const stats = dataRecord.stats as Record<string, number> | undefined;
    
    // Check for missing media
    const mediaUrl = dataRecord.videoUrl || 
                     dataRecord.mediaUrls ||
                     dataRecord.thumbnailUrl;
    if (!mediaUrl) {
      flags.push({
        type: 'missing_media',
        severity: 'minor',
        description: 'No media URL found',
        field: 'mediaUrl',
      });
    }
    
    // Check for low engagement
    if (stats && stats.viewCount < 100) {
      flags.push({
        type: 'low_engagement',
        severity: 'minor',
        description: 'Very low view count',
        field: 'stats.viewCount',
      });
    }
    
    // Check for suspicious metrics
    if (stats && stats.viewCount > 0) {
      const likeRatio = stats.likeCount / stats.viewCount;
      if (likeRatio > 0.5) {
        flags.push({
          type: 'suspicious_metrics',
          severity: 'major',
          description: 'Unusually high like-to-view ratio',
          field: 'stats',
        });
      }
    }
    
    // Check for incomplete metadata
    if (!metadata.categories.length) {
      flags.push({
        type: 'incomplete_metadata',
        severity: 'minor',
        description: 'Could not categorize content',
      });
    }
    
    // Check for stale content
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
    
    return flags;
  }

  private generateRecommendations(
    dimensions: QualityDimensions,
    flags: QualityFlag[]
  ): string[] {
    const recommendations: string[] = [];
    
    if (dimensions.completeness < 0.7) {
      recommendations.push('Add more metadata fields for better analysis');
    }
    
    if (dimensions.freshness < 0.5) {
      recommendations.push('Consider prioritizing more recent content');
    }
    
    if (dimensions.engagement < 0.3) {
      recommendations.push('Content has low engagement, may not be trending');
    }
    
    for (const flag of flags) {
      if (flag.type === 'suspicious_metrics') {
        recommendations.push('Verify engagement metrics authenticity');
      }
    }
    
    return recommendations;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a metadata enrichment service instance
 */
export function createEnrichmentService(
  config?: Partial<EnrichmentConfig>
): MetadataEnrichmentService {
  return new MetadataEnrichmentService(config);
}
