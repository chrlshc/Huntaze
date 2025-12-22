/**
 * Apify Actor Manager
 * Content & Trends AI Engine - Phase 4
 * 
 * High-level service for managing Apify actors, orchestrating scraping jobs,
 * and processing results for viral content analysis
 */

import {
  ActorInput,
  ActorRun,
  ScrapedData,
  TikTokScrapedData,
  InstagramScrapedData,
  SocialPlatform,
  ScrapeTarget,
  TrendAnalysisConfig,
  ScheduleConfig,
  WebhookEventType,
  ScrapingHealthReport,
  ScrapingMetrics,
  ContentFilters,
  ViralVelocity,
  EnrichedData,
} from './types';
import { ApifyClient, createApifyClient } from './apify-client';
import {
  ACTOR_REGISTRY,
  getActorConfig,
  getPrimaryActor,
} from './actor-configs';

// ============================================================================
// Configuration
// ============================================================================

export interface ActorManagerConfig {
  apifyApiToken?: string;
  webhookBaseUrl?: string;
  defaultMaxResults?: number;
  enableCaching?: boolean;
  cacheTimeoutMs?: number;
}

const DEFAULT_CONFIG: ActorManagerConfig = {
  defaultMaxResults: 100,
  enableCaching: true,
  cacheTimeoutMs: 300000, // 5 minutes
};

// ============================================================================
// Actor Manager Implementation
// ============================================================================

export class ApifyActorManager {
  private client: ApifyClient;
  private config: Required<ActorManagerConfig>;
  private resultsCache: Map<string, { data: ScrapedData[]; timestamp: number }> = new Map();
  private activeJobs: Map<string, { runId: string; platform: SocialPlatform; startedAt: Date }> = new Map();

  constructor(config: ActorManagerConfig = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      apifyApiToken: config.apifyApiToken ?? process.env.APIFY_API_TOKEN ?? '',
      webhookBaseUrl: config.webhookBaseUrl ?? process.env.WEBHOOK_BASE_URL ?? '',
    } as Required<ActorManagerConfig>;

    this.client = createApifyClient({ apiToken: this.config.apifyApiToken });
  }

  // ==========================================================================
  // Scraping Operations
  // ==========================================================================

  /**
   * Scrape trending content from a platform
   */
  async scrapeTrending(
    platform: SocialPlatform,
    options?: {
      maxResults?: number;
      filters?: ContentFilters;
      waitForCompletion?: boolean;
    }
  ): Promise<{ runId: string; data?: ScrapedData[] }> {
    const actorConfig = getPrimaryActor(platform);
    if (!actorConfig) {
      throw new Error(`No actor configured for platform: ${platform}`);
    }

    const input: ActorInput = {
      maxResults: options?.maxResults ?? this.config.defaultMaxResults,
      filters: options?.filters,
    };

    const run = await this.client.runActor(actorConfig.actorId, input);
    
    this.activeJobs.set(run.id, {
      runId: run.id,
      platform,
      startedAt: new Date(),
    });

    if (options?.waitForCompletion) {
      const completedRun = await this.client.waitForRun(run.id);
      const data = await this.getResults(completedRun.defaultDatasetId, platform);
      return { runId: run.id, data };
    }

    return { runId: run.id };
  }

  /**
   * Scrape content by hashtag
   */
  async scrapeByHashtag(
    platform: SocialPlatform,
    hashtags: string[],
    options?: {
      maxResults?: number;
      filters?: ContentFilters;
    }
  ): Promise<{ runId: string }> {
    const actorConfig = getActorConfig(platform, 'hashtag') ?? getPrimaryActor(platform);
    if (!actorConfig) {
      throw new Error(`No hashtag actor configured for platform: ${platform}`);
    }

    const input: ActorInput = {
      hashtags,
      maxResults: options?.maxResults ?? this.config.defaultMaxResults,
      filters: options?.filters,
    };

    const run = await this.client.runActor(actorConfig.actorId, input);
    
    this.activeJobs.set(run.id, {
      runId: run.id,
      platform,
      startedAt: new Date(),
    });

    return { runId: run.id };
  }

  /**
   * Scrape content from specific users/profiles
   */
  async scrapeByProfile(
    platform: SocialPlatform,
    usernames: string[],
    options?: {
      maxResults?: number;
      filters?: ContentFilters;
    }
  ): Promise<{ runId: string }> {
    const actorConfig = getActorConfig(platform, 'profile') ?? getPrimaryActor(platform);
    if (!actorConfig) {
      throw new Error(`No profile actor configured for platform: ${platform}`);
    }

    const input: ActorInput = {
      usernames,
      maxResults: options?.maxResults ?? this.config.defaultMaxResults,
      filters: options?.filters,
    };

    const run = await this.client.runActor(actorConfig.actorId, input);
    
    this.activeJobs.set(run.id, {
      runId: run.id,
      platform,
      startedAt: new Date(),
    });

    return { runId: run.id };
  }

  /**
   * Scrape TikTok sounds/audio trends
   */
  async scrapeTikTokSounds(
    soundIds?: string[],
    options?: { maxResults?: number }
  ): Promise<{ runId: string }> {
    const actorConfig = getActorConfig('tiktok', 'sound');
    if (!actorConfig) {
      throw new Error('TikTok sound actor not configured');
    }

    const input: ActorInput = {
      searchTerms: soundIds,
      maxResults: options?.maxResults ?? 50,
    };

    const run = await this.client.runActor(actorConfig.actorId, input);
    
    this.activeJobs.set(run.id, {
      runId: run.id,
      platform: 'tiktok',
      startedAt: new Date(),
    });

    return { runId: run.id };
  }

  /**
   * Execute multiple scrape targets in parallel
   */
  async scrapeMultipleTargets(targets: ScrapeTarget[]): Promise<Map<string, string>> {
    const runIds = new Map<string, string>();

    const promises = targets.map(async (target) => {
      let result: { runId: string };

      switch (target.type) {
        case 'hashtag':
          result = await this.scrapeByHashtag(target.platform, [target.value], {
            maxResults: target.depth,
            filters: target.filters,
          });
          break;
        case 'user':
          result = await this.scrapeByProfile(target.platform, [target.value], {
            maxResults: target.depth,
            filters: target.filters,
          });
          break;
        case 'trending':
        default:
          result = await this.scrapeTrending(target.platform, {
            maxResults: target.depth,
            filters: target.filters,
          });
          break;
      }

      runIds.set(`${target.platform}:${target.type}:${target.value}`, result.runId);
    });

    await Promise.all(promises);
    return runIds;
  }

  // ==========================================================================
  // Results Retrieval
  // ==========================================================================

  /**
   * Get results from a completed run
   */
  async getResults<T extends ScrapedData = ScrapedData>(
    datasetId: string,
    platform?: SocialPlatform
  ): Promise<T[]> {
    // Check cache
    if (this.config.enableCaching) {
      const cached = this.resultsCache.get(datasetId);
      if (cached && Date.now() - cached.timestamp < this.config.cacheTimeoutMs) {
        return cached.data as T[];
      }
    }

    const items = await this.client.getDatasetItems<T>(datasetId);
    
    // Normalize and filter data
    const normalizedItems = items
      .map(item => this.normalizeScrapedData(item, platform))
      .filter((item): item is T => item !== null);

    // Cache results
    if (this.config.enableCaching) {
      this.resultsCache.set(datasetId, {
        data: normalizedItems,
        timestamp: Date.now(),
      });
    }

    return normalizedItems;
  }

  /**
   * Get results from a run by run ID
   */
  async getResultsByRunId<T extends ScrapedData = ScrapedData>(runId: string): Promise<T[]> {
    const run = await this.client.getRunStatus(runId);
    
    if (run.status !== 'SUCCEEDED') {
      throw new Error(`Run ${runId} has not completed successfully. Status: ${run.status}`);
    }

    const job = this.activeJobs.get(runId);
    return this.getResults<T>(run.defaultDatasetId, job?.platform);
  }

  /**
   * Get enriched results with viral velocity calculations
   */
  async getEnrichedResults(datasetId: string, platform: SocialPlatform): Promise<EnrichedData[]> {
    const items = await this.getResults(datasetId, platform);
    return items.map(item => this.enrichWithViralMetrics(item));
  }

  // ==========================================================================
  // Job Management
  // ==========================================================================

  /**
   * Get status of a running job
   */
  async getJobStatus(runId: string): Promise<ActorRun> {
    return this.client.getRunStatus(runId);
  }

  /**
   * Cancel a running job
   */
  async cancelJob(runId: string): Promise<void> {
    await this.client.abortRun(runId);
    this.activeJobs.delete(runId);
  }

  /**
   * Get all active jobs
   */
  getActiveJobs(): Map<string, { runId: string; platform: SocialPlatform; startedAt: Date }> {
    return new Map(this.activeJobs);
  }

  /**
   * Wait for a job to complete
   */
  async waitForJob(runId: string, options?: { timeout?: number }): Promise<ActorRun> {
    return this.client.waitForRun(runId, options);
  }

  // ==========================================================================
  // Scheduling
  // ==========================================================================

  /**
   * Schedule recurring trend analysis
   */
  async scheduleTrendAnalysis(config: TrendAnalysisConfig): Promise<string[]> {
    const scheduleIds: string[] = [];

    for (const platform of config.platforms) {
      const actorConfig = getPrimaryActor(platform);
      if (!actorConfig) continue;

      const scheduleConfig: ScheduleConfig = {
        name: `${platform}-trend-analysis`,
        cronExpression: config.schedule,
        timezone: 'UTC',
        isEnabled: true,
        actorId: actorConfig.actorId,
        actorInput: {
          searchTerms: config.keywords,
          maxResults: 100,
        },
        webhookUrl: this.config.webhookBaseUrl 
          ? `${this.config.webhookBaseUrl}/api/webhooks/apify`
          : undefined,
      };

      const scheduleId = await this.client.createSchedule(scheduleConfig);
      scheduleIds.push(scheduleId);
    }

    return scheduleIds;
  }

  /**
   * Schedule daily briefing (6:00 AM)
   */
  async scheduleDailyBriefing(
    platforms: SocialPlatform[],
    keywords: string[]
  ): Promise<string[]> {
    return this.scheduleTrendAnalysis({
      platforms,
      keywords,
      schedule: '0 6 * * *', // 6:00 AM daily
      priority: 'high',
      maxConcurrentJobs: 3,
      retryPolicy: {
        maxAttempts: 3,
        initialDelayMs: 5000,
        maxDelayMs: 60000,
        backoffMultiplier: 2,
        retryableErrors: ['RATE_LIMIT', 'TIMEOUT'],
      },
    });
  }

  // ==========================================================================
  // Webhook Configuration
  // ==========================================================================

  /**
   * Configure webhooks for all platform actors
   */
  async configureWebhooks(webhookUrl: string): Promise<Map<SocialPlatform, string>> {
    const webhookIds = new Map<SocialPlatform, string>();
    const events: WebhookEventType[] = [
      'ACTOR.RUN.SUCCEEDED',
      'ACTOR.RUN.FAILED',
      'ACTOR.RUN.TIMED_OUT',
    ];

    for (const [platform, registry] of Object.entries(ACTOR_REGISTRY)) {
      for (const actor of Object.values(registry.actors)) {
        if (!actor) continue;
        
        const webhookId = await this.client.configureWebhook(
          actor.actorId,
          webhookUrl,
          events
        );
        webhookIds.set(platform as SocialPlatform, webhookId);
      }
    }

    return webhookIds;
  }

  // ==========================================================================
  // Health & Monitoring
  // ==========================================================================

  /**
   * Get health report for a platform
   */
  async getHealthReport(platform: SocialPlatform): Promise<ScrapingHealthReport> {
    return this.client.getHealthReport(platform);
  }

  /**
   * Get health reports for all platforms
   */
  async getAllHealthReports(): Promise<Map<SocialPlatform, ScrapingHealthReport>> {
    const reports = new Map<SocialPlatform, ScrapingHealthReport>();
    
    const platforms: SocialPlatform[] = ['tiktok', 'instagram', 'youtube', 'twitter'];
    
    await Promise.all(
      platforms.map(async (platform) => {
        try {
          const report = await this.getHealthReport(platform);
          reports.set(platform, report);
        } catch (error) {
          // Log error but continue with other platforms
          console.error(`Failed to get health report for ${platform}:`, error);
        }
      })
    );

    return reports;
  }

  /**
   * Get metrics for a platform
   */
  async getMetrics(
    platform: SocialPlatform,
    timeRange: { from: Date; to: Date }
  ): Promise<ScrapingMetrics> {
    return this.client.getMetrics(platform, timeRange);
  }

  // ==========================================================================
  // Trend Detection
  // ==========================================================================

  /**
   * Detect trend gaps (high velocity, low total videos)
   */
  async detectTrendGaps(
    platform: SocialPlatform,
    datasetId: string
  ): Promise<TrendGap[]> {
    const items = await this.getResults(datasetId, platform);
    const enrichedItems = items.map(item => this.enrichWithViralMetrics(item));

    const gaps: TrendGap[] = [];

    // Group by sound/hashtag
    const grouped = this.groupByTrendIndicator(enrichedItems, platform);

    for (const [indicator, items] of grouped.entries()) {
      const avgVelocity = this.calculateAverageVelocity(items);
      const totalCount = items.length;

      // High velocity but low count = trend gap opportunity
      if (avgVelocity.viewsPerHour > 1000 && totalCount < 50) {
        gaps.push({
          indicator,
          platform,
          velocity: avgVelocity,
          totalCount,
          opportunityScore: this.calculateOpportunityScore(avgVelocity, totalCount),
          detectedAt: new Date(),
        });
      }
    }

    return gaps.sort((a, b) => b.opportunityScore - a.opportunityScore);
  }

  /**
   * Detect sound arbitrage opportunities (TikTok → Instagram lag)
   */
  async detectSoundArbitrage(
    tiktokDatasetId: string,
    instagramDatasetId: string
  ): Promise<SoundArbitrageOpportunity[]> {
    const tiktokItems = await this.getResults<TikTokScrapedData>(tiktokDatasetId, 'tiktok');
    const instagramItems = await this.getResults<InstagramScrapedData>(instagramDatasetId, 'instagram');

    const opportunities: SoundArbitrageOpportunity[] = [];

    // Get trending sounds on TikTok
    const tiktokSounds = new Map<string, { count: number; avgViews: number }>();
    for (const item of tiktokItems) {
      if (item.music?.title) {
        const existing = tiktokSounds.get(item.music.title) ?? { count: 0, avgViews: 0 };
        existing.count++;
        existing.avgViews = (existing.avgViews * (existing.count - 1) + item.stats.viewCount) / existing.count;
        tiktokSounds.set(item.music.title, existing);
      }
    }

    // Check Instagram usage
    const instagramSoundUsage = new Set<string>();
    for (const item of instagramItems) {
      // Instagram doesn't have direct sound info, would need audio analysis
      // This is a simplified check
      if (item.caption) {
        instagramSoundUsage.add(item.caption.toLowerCase());
      }
    }

    // Find sounds trending on TikTok but not on Instagram
    for (const [sound, stats] of tiktokSounds.entries()) {
      if (stats.count >= 10 && stats.avgViews > 10000) {
        const isOnInstagram = instagramSoundUsage.has(sound.toLowerCase());
        
        if (!isOnInstagram) {
          opportunities.push({
            soundName: sound,
            tiktokUsageCount: stats.count,
            tiktokAvgViews: stats.avgViews,
            instagramPresence: false,
            arbitrageScore: this.calculateArbitrageScore(stats),
            estimatedMigrationWindow: '1-2 weeks',
            detectedAt: new Date(),
          });
        }
      }
    }

    return opportunities.sort((a, b) => b.arbitrageScore - a.arbitrageScore);
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  private normalizeScrapedData<T extends ScrapedData>(
    item: T,
    platform?: SocialPlatform
  ): T | null {
    // Filter out promoted/ad content
    if (this.isPromotedContent(item)) {
      return null;
    }

    // Ensure required fields exist
    if (!item.id || !item.url) {
      return null;
    }

    // Add scrapedAt if missing
    if (!item.scrapedAt) {
      item.scrapedAt = new Date();
    }

    return item;
  }

  private isPromotedContent(item: ScrapedData): boolean {
    if ('isPromoted' in item && item.isPromoted) return true;
    if ('isAd' in item && item.isAd) return true;
    if ('isSponsored' in item && item.isSponsored) return true;
    return false;
  }

  private enrichWithViralMetrics(item: ScrapedData): EnrichedData {
    const createdAt = 'createdAt' in item ? new Date(item.createdAt) : new Date();
    const hoursSinceCreation = Math.max(1, (Date.now() - createdAt.getTime()) / (1000 * 60 * 60));

    let views = 0;
    let likes = 0;
    let shares = 0;
    let comments = 0;

    if ('stats' in item) {
      const stats = item.stats as unknown as Record<string, number | undefined>;
      views = stats.viewCount ?? 0;
      likes = stats.likeCount ?? 0;
      shares = stats.shareCount ?? 0;
      comments = stats.commentCount ?? 0;
    } else if ('engagement' in item) {
      const engagement = item.engagement as unknown as Record<string, number | undefined>;
      views = engagement.viewCount ?? 0;
      likes = engagement.likeCount ?? 0;
      comments = engagement.commentCount ?? 0;
    }

    const velocity: ViralVelocity = {
      viewsPerHour: views / hoursSinceCreation,
      likesPerHour: likes / hoursSinceCreation,
      sharesPerHour: shares / hoursSinceCreation,
      commentsPerHour: comments / hoursSinceCreation,
      accelerating: false, // Would need historical data
      peakReached: hoursSinceCreation > 48, // Simplified assumption
    };

    return {
      ...item,
      enrichment: {
        viralVelocity: velocity,
        qualityScore: this.calculateQualityScore(item, velocity),
      },
    };
  }

  private calculateQualityScore(item: ScrapedData, velocity: ViralVelocity): number {
    let score = 0.5; // Base score

    // Velocity factors
    if (velocity.viewsPerHour > 1000) score += 0.2;
    if (velocity.likesPerHour > 100) score += 0.1;
    if (velocity.sharesPerHour > 50) score += 0.1;

    // Content completeness
    if ('description' in item && item.description?.length > 50) score += 0.05;
    if ('hashtags' in item && item.hashtags?.length > 3) score += 0.05;

    return Math.min(1, score);
  }

  private groupByTrendIndicator(
    items: EnrichedData[],
    _platform: SocialPlatform
  ): Map<string, EnrichedData[]> {
    const grouped = new Map<string, EnrichedData[]>();

    for (const item of items) {
      let indicator: string | undefined;

      // Check for music (TikTok)
      if ('music' in item && item.music && typeof item.music === 'object') {
        const music = item.music as { title?: string };
        indicator = music.title;
      }
      
      // Fallback to hashtags
      if (!indicator && 'hashtags' in item) {
        const hashtags = item.hashtags as string[] | undefined;
        if (hashtags && hashtags.length > 0) {
          indicator = hashtags[0];
        }
      }

      if (indicator) {
        const existing = grouped.get(indicator) ?? [];
        existing.push(item);
        grouped.set(indicator, existing);
      }
    }

    return grouped;
  }

  private calculateAverageVelocity(items: EnrichedData[]): ViralVelocity {
    if (items.length === 0) {
      return {
        viewsPerHour: 0,
        likesPerHour: 0,
        sharesPerHour: 0,
        commentsPerHour: 0,
        accelerating: false,
        peakReached: false,
      };
    }

    const sum = items.reduce(
      (acc, item) => ({
        viewsPerHour: acc.viewsPerHour + (item.enrichment.viralVelocity?.viewsPerHour ?? 0),
        likesPerHour: acc.likesPerHour + (item.enrichment.viralVelocity?.likesPerHour ?? 0),
        sharesPerHour: acc.sharesPerHour + (item.enrichment.viralVelocity?.sharesPerHour ?? 0),
        commentsPerHour: acc.commentsPerHour + (item.enrichment.viralVelocity?.commentsPerHour ?? 0),
      }),
      { viewsPerHour: 0, likesPerHour: 0, sharesPerHour: 0, commentsPerHour: 0 }
    );

    return {
      viewsPerHour: sum.viewsPerHour / items.length,
      likesPerHour: sum.likesPerHour / items.length,
      sharesPerHour: sum.sharesPerHour / items.length,
      commentsPerHour: sum.commentsPerHour / items.length,
      accelerating: false,
      peakReached: false,
    };
  }

  private calculateOpportunityScore(velocity: ViralVelocity, totalCount: number): number {
    // Higher velocity + lower count = higher opportunity
    const velocityScore = Math.min(1, velocity.viewsPerHour / 10000);
    const scarcityScore = Math.max(0, 1 - totalCount / 100);
    return (velocityScore * 0.7) + (scarcityScore * 0.3);
  }

  private calculateArbitrageScore(stats: { count: number; avgViews: number }): number {
    const usageScore = Math.min(1, stats.count / 100);
    const viewsScore = Math.min(1, stats.avgViews / 100000);
    return (usageScore * 0.4) + (viewsScore * 0.6);
  }
}

// ============================================================================
// Additional Types
// ============================================================================

export interface TrendGap {
  indicator: string;
  platform: SocialPlatform;
  velocity: ViralVelocity;
  totalCount: number;
  opportunityScore: number;
  detectedAt: Date;
}

export interface SoundArbitrageOpportunity {
  soundName: string;
  tiktokUsageCount: number;
  tiktokAvgViews: number;
  instagramPresence: boolean;
  arbitrageScore: number;
  estimatedMigrationWindow: string;
  detectedAt: Date;
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create an Apify Actor Manager instance
 */
export function createActorManager(config?: ActorManagerConfig): ApifyActorManager {
  return new ApifyActorManager(config);
}
