/**
 * Apify Integration Types
 * Content & Trends AI Engine - Phase 4
 * 
 * Type definitions for Apify actor management, scraping, and webhook processing
 */

// ============================================================================
// Platform Types
// ============================================================================

export type SocialPlatform = 'tiktok' | 'instagram' | 'youtube' | 'twitter';

export type ContentType = 'video' | 'image' | 'carousel' | 'text' | 'all';

export type ProxyType = 'datacenter' | 'residential' | 'mobile';

// ============================================================================
// Actor Configuration
// ============================================================================

export interface ActorConfig {
  name: string;
  platform: SocialPlatform;
  actorId: string;
  buildTag?: string;
  memoryMbytes: number;
  timeoutSecs: number;
  defaultInput?: Record<string, unknown>;
}

export interface ActorInput {
  searchTerms?: string[];
  hashtags?: string[];
  usernames?: string[];
  maxResults: number;
  dateRange?: {
    from: Date;
    to: Date;
  };
  filters?: ContentFilters;
  proxyConfiguration?: ProxyConfig;
}

export interface ContentFilters {
  minViews?: number;
  minLikes?: number;
  minShares?: number;
  minComments?: number;
  contentType?: ContentType;
  language?: string;
  excludePromoted?: boolean;
  excludeAds?: boolean;
}

// ============================================================================
// Proxy Configuration
// ============================================================================

export interface ProxyConfig {
  type: ProxyType;
  useApifyProxy: boolean;
  apifyProxyGroups?: string[];
  apifyProxyCountry?: string;
  customProxies?: CustomProxy[];
}

export interface CustomProxy {
  host: string;
  port: number;
  username?: string;
  password?: string;
  protocol: 'http' | 'https' | 'socks5';
}

export interface ProxyPool {
  platform: SocialPlatform;
  proxies: ProxyConfig[];
  rotationStrategy: 'round-robin' | 'random' | 'least-used';
  healthCheckInterval: number;
}

// ============================================================================
// Anti-Detection Configuration
// ============================================================================

export interface AntiDetectionConfig {
  userAgentRotation: boolean;
  headerRandomization: boolean;
  requestDelayRange: { min: number; max: number };
  sessionPersistence: boolean;
  cookieManagement: boolean;
  fingerprintSpoofing: boolean;
  browserEmulation: boolean;
}

// ============================================================================
// Actor Run Types
// ============================================================================

export type ActorRunStatus = 
  | 'READY'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'TIMED-OUT'
  | 'ABORTED';

export interface ActorRun {
  id: string;
  actorId: string;
  status: ActorRunStatus;
  startedAt?: Date;
  finishedAt?: Date;
  buildId: string;
  defaultKeyValueStoreId: string;
  defaultDatasetId: string;
  defaultRequestQueueId: string;
  stats?: ActorRunStats;
}

export interface ActorRunStats {
  inputBodyLen: number;
  restartCount: number;
  resurrectCount: number;
  memAvgBytes: number;
  memMaxBytes: number;
  memCurrentBytes: number;
  cpuAvgUsage: number;
  cpuMaxUsage: number;
  cpuCurrentUsage: number;
  netRxBytes: number;
  netTxBytes: number;
  durationMillis: number;
  runTimeSecs: number;
  computeUnits: number;
}

// ============================================================================
// Scraped Data Types
// ============================================================================

export interface ScrapedDataBase {
  id: string;
  platform: SocialPlatform;
  url: string;
  scrapedAt: Date;
  rawData?: Record<string, unknown>;
}

export interface TikTokScrapedData extends ScrapedDataBase {
  platform: 'tiktok';
  videoUrl: string;
  thumbnailUrl: string;
  description: string;
  hashtags: string[];
  mentions: string[];
  author: TikTokAuthor;
  stats: TikTokStats;
  music?: TikTokMusic;
  createdAt: Date;
  isPromoted?: boolean;
  isAd?: boolean;
}

export interface TikTokAuthor {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  followerCount: number;
  followingCount?: number;
  likeCount?: number;
  verified: boolean;
}

export interface TikTokStats {
  viewCount: number;
  likeCount: number;
  shareCount: number;
  commentCount: number;
  playCount?: number;
  collectCount?: number;
}

export interface TikTokMusic {
  id: string;
  title: string;
  author: string;
  duration: number;
  coverUrl?: string;
  playUrl?: string;
  isOriginal?: boolean;
}

export interface InstagramScrapedData extends ScrapedDataBase {
  platform: 'instagram';
  shortcode: string;
  mediaType: 'photo' | 'video' | 'carousel';
  mediaUrls: string[];
  thumbnailUrl?: string;
  caption: string;
  hashtags: string[];
  mentions: string[];
  location?: InstagramLocation;
  author: InstagramAuthor;
  engagement: InstagramEngagement;
  createdAt: Date;
  isSponsored?: boolean;
}

export interface InstagramAuthor {
  id: string;
  username: string;
  fullName: string;
  profilePicUrl?: string;
  followerCount: number;
  followingCount?: number;
  postCount?: number;
  verified: boolean;
  isPrivate: boolean;
}

export interface InstagramEngagement {
  likeCount: number;
  commentCount: number;
  viewCount?: number;
  saveCount?: number;
}

export interface InstagramLocation {
  id: string;
  name: string;
  slug?: string;
  coordinates?: { lat: number; lng: number };
}

export interface YouTubeScrapedData extends ScrapedDataBase {
  platform: 'youtube';
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: number;
  tags: string[];
  channel: YouTubeChannel;
  stats: YouTubeStats;
  publishedAt: Date;
  categoryId?: string;
}

export interface YouTubeChannel {
  id: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  subscriberCount?: number;
  verified: boolean;
}

export interface YouTubeStats {
  viewCount: number;
  likeCount: number;
  commentCount: number;
  favoriteCount?: number;
}

export interface TwitterScrapedData extends ScrapedDataBase {
  platform: 'twitter';
  tweetId: string;
  text: string;
  hashtags: string[];
  mentions: string[];
  mediaUrls: string[];
  author: TwitterAuthor;
  stats: TwitterStats;
  createdAt: Date;
  isRetweet: boolean;
  isQuote: boolean;
  quotedTweet?: TwitterScrapedData;
}

export interface TwitterAuthor {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl?: string;
  followerCount: number;
  followingCount: number;
  tweetCount: number;
  verified: boolean;
}

export interface TwitterStats {
  retweetCount: number;
  likeCount: number;
  replyCount: number;
  quoteCount: number;
  viewCount?: number;
  bookmarkCount?: number;
}

export type ScrapedData = 
  | TikTokScrapedData 
  | InstagramScrapedData 
  | YouTubeScrapedData 
  | TwitterScrapedData;

// ============================================================================
// Webhook Types
// ============================================================================

export type WebhookEventType = 
  | 'ACTOR.RUN.CREATED'
  | 'ACTOR.RUN.SUCCEEDED'
  | 'ACTOR.RUN.FAILED'
  | 'ACTOR.RUN.TIMED_OUT'
  | 'ACTOR.RUN.ABORTED'
  | 'ACTOR.RUN.RESURRECTED';

export interface ApifyWebhookPayload {
  userId: string;
  createdAt: string;
  eventType: WebhookEventType;
  eventData: {
    actorId: string;
    actorTaskId?: string;
    actorRunId: string;
    resourceId?: string;
  };
  resource?: {
    id: string;
    actId: string;
    userId: string;
    startedAt: string;
    finishedAt?: string;
    status: ActorRunStatus;
    statusMessage?: string;
    defaultKeyValueStoreId: string;
    defaultDatasetId: string;
    defaultRequestQueueId: string;
  };
}

export interface WebhookValidationResult {
  isValid: boolean;
  errors: string[];
  eventId?: string;
  timestamp?: Date;
}

// ============================================================================
// Data Quality Types
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  qualityScore: number;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'critical' | 'major' | 'minor';
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export interface DuplicateReport {
  totalChecked: number;
  duplicatesFound: number;
  duplicates: DuplicateEntry[];
}

export interface DuplicateEntry {
  newItemId: string;
  existingItemId: string;
  similarity: number;
  matchedFields: string[];
}

export interface EnrichedData extends ScrapedDataBase {
  enrichment: {
    language?: string;
    sentiment?: 'positive' | 'negative' | 'neutral';
    categories?: string[];
    keywords?: string[];
    viralVelocity?: ViralVelocity;
    qualityScore: number;
  };
}

export interface ViralVelocity {
  viewsPerHour: number;
  likesPerHour: number;
  sharesPerHour: number;
  commentsPerHour: number;
  accelerating: boolean;
  peakReached: boolean;
}

// ============================================================================
// Scheduling Types
// ============================================================================

export interface ScheduleConfig {
  id?: string;
  name: string;
  cronExpression: string;
  timezone: string;
  isEnabled: boolean;
  actorId: string;
  actorInput: ActorInput;
  webhookUrl?: string;
}

export interface ScrapeTarget {
  platform: SocialPlatform;
  type: 'hashtag' | 'user' | 'location' | 'trending' | 'search';
  value: string;
  depth: number;
  filters?: ContentFilters;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface TrendAnalysisConfig {
  platforms: SocialPlatform[];
  keywords: string[];
  schedule: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  maxConcurrentJobs: number;
  retryPolicy: RetryPolicy;
}

export interface RetryPolicy {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

// ============================================================================
// Health and Metrics Types
// ============================================================================

export interface ScrapingHealthReport {
  platform: SocialPlatform;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastSuccessfulRun?: Date;
  successRate: number;
  averageLatencyMs: number;
  errorRate: number;
  activeJobs: number;
  queuedJobs: number;
  issues: HealthIssue[];
}

export interface HealthIssue {
  type: 'rate_limit' | 'proxy_failure' | 'auth_error' | 'timeout' | 'unknown';
  message: string;
  occurredAt: Date;
  resolved: boolean;
}

export interface ScrapingMetrics {
  totalItems: number;
  successRate: number;
  averageLatencyMs: number;
  errorTypes: Record<string, number>;
  dataQualityScore: number;
  costPerItem: number;
  computeUnitsUsed: number;
}

// ============================================================================
// Actor Manager Interface
// ============================================================================

export interface IApifyActorManager {
  // Actor lifecycle
  getActorConfig(platform: SocialPlatform): ActorConfig;
  runActor(actorId: string, input: ActorInput): Promise<ActorRun>;
  getRunStatus(runId: string): Promise<ActorRun>;
  abortRun(runId: string): Promise<void>;
  
  // Results retrieval
  getDatasetItems<T extends ScrapedData>(datasetId: string): Promise<T[]>;
  getKeyValueStoreValue(storeId: string, key: string): Promise<unknown>;
  
  // Scheduling
  createSchedule(config: ScheduleConfig): Promise<string>;
  updateSchedule(scheduleId: string, config: Partial<ScheduleConfig>): Promise<void>;
  deleteSchedule(scheduleId: string): Promise<void>;
  
  // Webhooks
  configureWebhook(actorId: string, webhookUrl: string, events: WebhookEventType[]): Promise<string>;
  
  // Health monitoring
  getHealthReport(platform: SocialPlatform): Promise<ScrapingHealthReport>;
  getMetrics(platform: SocialPlatform, timeRange: { from: Date; to: Date }): Promise<ScrapingMetrics>;
}
