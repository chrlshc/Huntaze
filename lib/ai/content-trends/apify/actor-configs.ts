/**
 * Apify Actor Configurations
 * Content & Trends AI Engine - Phase 4
 * 
 * Platform-specific scraper configurations for TikTok, Instagram, YouTube, Twitter
 */

import {
  ActorConfig,
  SocialPlatform,
  ProxyConfig,
  AntiDetectionConfig,
  ContentFilters,
} from './types';

// ============================================================================
// Default Configurations
// ============================================================================

export const DEFAULT_PROXY_CONFIG: ProxyConfig = {
  type: 'residential',
  useApifyProxy: true,
  apifyProxyGroups: ['RESIDENTIAL'],
  apifyProxyCountry: 'US',
};

export const DEFAULT_ANTI_DETECTION: AntiDetectionConfig = {
  userAgentRotation: true,
  headerRandomization: true,
  requestDelayRange: { min: 1000, max: 3000 },
  sessionPersistence: true,
  cookieManagement: true,
  fingerprintSpoofing: true,
  browserEmulation: true,
};

// Backwards-compatible alias (older modules expect this name)
export const DEFAULT_ANTI_DETECTION_CONFIG = DEFAULT_ANTI_DETECTION;

export const DEFAULT_CONTENT_FILTERS: ContentFilters = {
  minViews: 1000,
  excludePromoted: true,
  excludeAds: true,
  contentType: 'video',
};

// ============================================================================
// TikTok Actor Configuration
// ============================================================================

export const TIKTOK_TRENDS_ACTOR: ActorConfig = {
  name: 'TikTok Trends Scraper',
  platform: 'tiktok',
  actorId: 'clockworks/tiktok-trends-scraper',
  buildTag: 'latest',
  memoryMbytes: 4096,
  timeoutSecs: 3600,
  defaultInput: {
    maxItems: 100,
    includeVideoData: true,
    includeComments: false,
    proxyConfiguration: DEFAULT_PROXY_CONFIG,
  },
};

export const TIKTOK_SOUND_ACTOR: ActorConfig = {
  name: 'TikTok Sound Scraper',
  platform: 'tiktok',
  actorId: 'clockworks/tiktok-sound-scraper',
  buildTag: 'latest',
  memoryMbytes: 2048,
  timeoutSecs: 1800,
  defaultInput: {
    maxItems: 50,
    includeSoundMetrics: true,
    proxyConfiguration: DEFAULT_PROXY_CONFIG,
  },
};

export const TIKTOK_HASHTAG_ACTOR: ActorConfig = {
  name: 'TikTok Hashtag Scraper',
  platform: 'tiktok',
  actorId: 'clockworks/tiktok-scraper',
  buildTag: 'latest',
  memoryMbytes: 4096,
  timeoutSecs: 3600,
  defaultInput: {
    maxItems: 100,
    searchSection: 'hashtag',
    proxyConfiguration: DEFAULT_PROXY_CONFIG,
  },
};

// ============================================================================
// Instagram Actor Configuration
// ============================================================================

export const INSTAGRAM_REEL_ACTOR: ActorConfig = {
  name: 'Instagram Reel Scraper',
  platform: 'instagram',
  actorId: 'apify/instagram-reel-scraper',
  buildTag: 'latest',
  memoryMbytes: 4096,
  timeoutSecs: 3600,
  defaultInput: {
    maxItems: 100,
    includeComments: true,
    commentsLimit: 50,
    proxyConfiguration: DEFAULT_PROXY_CONFIG,
  },
};

export const INSTAGRAM_HASHTAG_ACTOR: ActorConfig = {
  name: 'Instagram Hashtag Scraper',
  platform: 'instagram',
  actorId: 'apify/instagram-hashtag-scraper',
  buildTag: 'latest',
  memoryMbytes: 4096,
  timeoutSecs: 3600,
  defaultInput: {
    maxItems: 100,
    resultsType: 'posts',
    proxyConfiguration: DEFAULT_PROXY_CONFIG,
  },
};

export const INSTAGRAM_PROFILE_ACTOR: ActorConfig = {
  name: 'Instagram Profile Scraper',
  platform: 'instagram',
  actorId: 'apify/instagram-profile-scraper',
  buildTag: 'latest',
  memoryMbytes: 2048,
  timeoutSecs: 1800,
  defaultInput: {
    maxItems: 50,
    includeReels: true,
    includeStories: false,
    proxyConfiguration: DEFAULT_PROXY_CONFIG,
  },
};

// ============================================================================
// YouTube Actor Configuration
// ============================================================================

export const YOUTUBE_SCRAPER_ACTOR: ActorConfig = {
  name: 'YouTube Scraper',
  platform: 'youtube',
  actorId: 'bernardo/youtube-scraper',
  buildTag: 'latest',
  memoryMbytes: 4096,
  timeoutSecs: 3600,
  defaultInput: {
    maxResults: 100,
    maxResultsShorts: 50,
    includeComments: true,
    commentsLimit: 100,
    proxyConfiguration: DEFAULT_PROXY_CONFIG,
  },
};

export const YOUTUBE_CHANNEL_ACTOR: ActorConfig = {
  name: 'YouTube Channel Scraper',
  platform: 'youtube',
  actorId: 'streamers/youtube-channel-scraper',
  buildTag: 'latest',
  memoryMbytes: 2048,
  timeoutSecs: 1800,
  defaultInput: {
    maxVideos: 50,
    includeShorts: true,
    proxyConfiguration: DEFAULT_PROXY_CONFIG,
  },
};

// ============================================================================
// Twitter Actor Configuration
// ============================================================================

export const TWITTER_SCRAPER_ACTOR: ActorConfig = {
  name: 'Twitter Scraper',
  platform: 'twitter',
  actorId: 'quacker/twitter-scraper',
  buildTag: 'latest',
  memoryMbytes: 4096,
  timeoutSecs: 3600,
  defaultInput: {
    maxItems: 100,
    includeReplies: false,
    includeRetweets: false,
    proxyConfiguration: DEFAULT_PROXY_CONFIG,
  },
};

export const TWITTER_PROFILE_ACTOR: ActorConfig = {
  name: 'Twitter Profile Scraper',
  platform: 'twitter',
  actorId: 'quacker/twitter-profile-scraper',
  buildTag: 'latest',
  memoryMbytes: 2048,
  timeoutSecs: 1800,
  defaultInput: {
    maxTweets: 50,
    proxyConfiguration: DEFAULT_PROXY_CONFIG,
  },
};

// ============================================================================
// Actor Registry
// ============================================================================

export interface ActorRegistry {
  platform: SocialPlatform;
  actors: {
    trends?: ActorConfig;
    hashtag?: ActorConfig;
    profile?: ActorConfig;
    sound?: ActorConfig;
    reel?: ActorConfig;
    channel?: ActorConfig;
  };
}

export const ACTOR_REGISTRY: Record<SocialPlatform, ActorRegistry> = {
  tiktok: {
    platform: 'tiktok',
    actors: {
      trends: TIKTOK_TRENDS_ACTOR,
      hashtag: TIKTOK_HASHTAG_ACTOR,
      sound: TIKTOK_SOUND_ACTOR,
    },
  },
  instagram: {
    platform: 'instagram',
    actors: {
      reel: INSTAGRAM_REEL_ACTOR,
      hashtag: INSTAGRAM_HASHTAG_ACTOR,
      profile: INSTAGRAM_PROFILE_ACTOR,
    },
  },
  youtube: {
    platform: 'youtube',
    actors: {
      trends: YOUTUBE_SCRAPER_ACTOR,
      channel: YOUTUBE_CHANNEL_ACTOR,
    },
  },
  twitter: {
    platform: 'twitter',
    actors: {
      trends: TWITTER_SCRAPER_ACTOR,
      profile: TWITTER_PROFILE_ACTOR,
    },
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get actor configuration for a specific platform and type
 */
export function getActorConfig(
  platform: SocialPlatform,
  type: keyof ActorRegistry['actors']
): ActorConfig | undefined {
  return ACTOR_REGISTRY[platform]?.actors[type];
}

/**
 * Get all actors for a platform
 */
export function getPlatformActors(platform: SocialPlatform): ActorConfig[] {
  const registry = ACTOR_REGISTRY[platform];
  if (!registry) return [];
  return Object.values(registry.actors).filter((a): a is ActorConfig => a !== undefined);
}

// Backwards-compatible alias
export const getAllActorsForPlatform = getPlatformActors;

/**
 * Get the primary actor for a platform (trends or main scraper)
 */
export function getPrimaryActor(platform: SocialPlatform): ActorConfig | undefined {
  const registry = ACTOR_REGISTRY[platform];
  if (!registry) return undefined;
  return registry.actors.trends || registry.actors.reel || Object.values(registry.actors)[0];
}

/**
 * Build actor input with defaults and overrides
 */
export function buildActorInput(
  actorConfig: ActorConfig,
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    ...actorConfig.defaultInput,
    ...overrides,
  };
}

/**
 * Get recommended memory for a platform based on expected load
 */
export function getRecommendedMemory(
  platform: SocialPlatform,
  expectedItems: number
): number {
  const baseMemory = 2048;
  const memoryPerItem = platform === 'youtube' ? 20 : 10;
  const calculated = baseMemory + (expectedItems * memoryPerItem);
  return Math.min(Math.max(calculated, 2048), 32768);
}

/**
 * Get recommended timeout based on expected items
 */
export function getRecommendedTimeout(expectedItems: number): number {
  const baseTimeout = 600; // 10 minutes
  const timeoutPerItem = 30; // 30 seconds per item
  const calculated = baseTimeout + (expectedItems * timeoutPerItem);
  return Math.min(calculated, 7200); // Max 2 hours
}
