/**
 * Apify Integration Module
 * Content & Trends AI Engine - Phase 4
 * 
 * Exports for Apify actor management, scraping, and webhook processing
 */

// Types
export type {
  // Platform types
  SocialPlatform,
  ContentType,
  ProxyType,
  // Actor configuration
  ActorConfig,
  ActorInput,
  ContentFilters,
  // Proxy configuration
  ProxyConfig,
  CustomProxy,
  ProxyPool,
  // Anti-detection
  AntiDetectionConfig,
  // Actor run types
  ActorRunStatus,
  ActorRun,
  ActorRunStats,
  // Scraped data types
  ScrapedDataBase,
  TikTokScrapedData,
  TikTokAuthor,
  TikTokStats,
  TikTokMusic,
  InstagramScrapedData,
  InstagramAuthor,
  InstagramEngagement,
  InstagramLocation,
  YouTubeScrapedData,
  YouTubeChannel,
  YouTubeStats,
  TwitterScrapedData,
  TwitterAuthor,
  TwitterStats,
  ScrapedData,
  // Webhook types
  WebhookEventType,
  ApifyWebhookPayload,
  WebhookValidationResult,
  // Data quality types
  ValidationResult,
  ValidationError,
  ValidationWarning,
  DuplicateReport,
  DuplicateEntry,
  EnrichedData,
  ViralVelocity,
  // Scheduling types
  ScheduleConfig,
  ScrapeTarget,
  TrendAnalysisConfig,
  RetryPolicy,
  // Health and metrics
  ScrapingHealthReport,
  HealthIssue,
  ScrapingMetrics,
  // Interface
  IApifyActorManager,
} from './types';

// Actor Configurations
export {
  ACTOR_REGISTRY,
  getActorConfig,
  getPrimaryActor,
  getAllActorsForPlatform,
  buildActorInput,
  getRecommendedMemory,
  getRecommendedTimeout,
  DEFAULT_PROXY_CONFIG,
  DEFAULT_ANTI_DETECTION_CONFIG,
} from './actor-configs';

// Apify Client
export {
  ApifyClient,
  createApifyClient,
  ApifyClientError,
  type ApifyClientConfig,
} from './apify-client';

// Actor Manager
export {
  ApifyActorManager,
  createActorManager,
  type ActorManagerConfig,
  type TrendGap,
  type SoundArbitrageOpportunity,
} from './actor-manager';
