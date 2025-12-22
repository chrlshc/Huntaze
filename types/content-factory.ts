/**
 * Content Factory Types
 * 
 * Type definitions for the Content Factory and Marketing War Room features.
 * End 2025 compliant with platform requirements.
 */

// Source types
export type SourceType = 'upload' | 'link';
export type ScriptMode = 'simple' | 'pro';
export type AudienceType = 'existing_fans' | 'new_fans' | 'all';
export type GoalType = 'views' | 'link_taps' | 'new_subs';

// Job statuses
export type ProductionJobStatus = 'idle' | 'queued' | 'processing' | 'needs_review' | 'ready' | 'failed';
export type DistributionStatus = 'draft' | 'scheduled' | 'posted' | 'failed' | 'needs_permission';

// Platforms
export type Platform = 'tiktok' | 'instagram' | 'reddit';

// Token and permission statuses
export type TokenStatus = 'valid' | 'expiring_soon' | 'expired';
export type AuditStatus = 'approved' | 'pending' | 'not_submitted';

// Script output from AI generation
export interface ScriptOutput {
  hook: string;
  body: string;
  cta: string;
  variations?: {
    hook: string;
    body: string;
    cta: string;
  }[];
}

// Production job settings
export interface ProductionSettings {
  captions: boolean;
  smartCuts: boolean;
  safeZoneCrop: boolean;
  watermarkFree: boolean;
}

// Production job output
export interface ProductionOutput {
  variant: string;
  url: string;
  duration: string;
  thumbnail?: string;
}

// Production job
export interface ProductionJob {
  id: string;
  status: ProductionJobStatus;
  sourceType: SourceType;
  sourceUrl?: string;
  filePath?: string;
  idea: string;
  script?: ScriptOutput;
  targets: Platform[];
  settings: ProductionSettings;
  outputs?: ProductionOutput[];
  error?: string;
  createdAt: string;
  updatedAt: string;
}

// Content queue item for War Room
export interface ContentQueueItem {
  id: string;
  title: string;
  thumbnail?: string;
  platforms: Platform[];
  status: DistributionStatus;
  scheduledAt?: string;
  postedAt?: string;
  error?: string;
  needsReview?: boolean;
  productionJobId?: string;
}

// Distribution job
export interface DistributionJob {
  id: string;
  contentId: string;
  platform: Platform;
  status: DistributionStatus;
  scheduledAt?: string;
  postedAt?: string;
  postUrl?: string;
  caption?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

// Platform permission
export interface PlatformPermission {
  name: string;
  granted: boolean;
  required: boolean;
}

// Connected account health
export interface AccountHealth {
  id: string;
  platform: Platform;
  accountName: string;
  accountId: string;
  tokenStatus: TokenStatus;
  tokenExpiresAt?: string;
  permissions: PlatformPermission[];
  auditStatus?: AuditStatus;
  errorsLast24h: number;
  rateLimitRemaining?: number;
  connectedAt: string;
  updatedAt: string;
}

// Automation settings (compliant)
export interface AutomationSettings {
  autoReplyDM: boolean;
  commentToDM: boolean;
  savedReplies: boolean;
  leadCapture: boolean;
}

// Content KPIs (end 2025)
export interface ContentKPIs {
  hookRate: number;
  completionRate: number;
  avgWatchTime: number;
  saves: number;
  shares: number;
  newFollowersPerPost: number;
}

// Acquisition KPIs
export interface AcquisitionKPIs {
  profileToLinkCTR: number;
  linkToSubsCVR: number;
  rpm: number;
}

// Instagram required scopes (2025)
export const INSTAGRAM_REQUIRED_SCOPES = [
  'instagram_business_basic',
  'instagram_business_content_publish',
  'instagram_business_manage_messages',
  'instagram_business_manage_comments',
] as const;

// TikTok required scopes
export const TIKTOK_REQUIRED_SCOPES = [
  'video.upload',
  'video.publish',
  'user.info.basic',
] as const;

// Reddit required scopes
export const REDDIT_REQUIRED_SCOPES = [
  'submit',
  'read',
  'identity',
] as const;

// KPI definitions for tooltips
export const KPI_DEFINITIONS = {
  hookRate: {
    title: 'Hook Rate',
    description: 'Percentage of viewers who stay past 3 seconds.',
    whyItMatters: 'A strong hook is crucial for algorithm favor.',
    tip: 'Aim for 70%+ hook rate.',
  },
  completionRate: {
    title: 'Completion Rate',
    description: 'Percentage who watch until the end.',
    whyItMatters: 'High completion = more algorithm push.',
    tip: 'Keep videos under 30s for better completion.',
  },
  avgWatchTime: {
    title: 'Average Watch Time',
    description: 'How long viewers watch on average.',
    whyItMatters: 'Longer watch time signals quality content.',
    tip: 'Front-load value to keep viewers engaged.',
  },
  saves: {
    title: 'Saves',
    description: 'Number of times your content was saved.',
    whyItMatters: 'Saves indicate high-value content.',
    tip: 'Create educational or reference content.',
  },
  shares: {
    title: 'Shares',
    description: 'Number of times your content was shared.',
    whyItMatters: 'Shares expand your reach organically.',
    tip: 'Make content relatable or surprising.',
  },
  profileToLinkCTR: {
    title: 'Profile → Link CTR',
    description: 'Link taps divided by profile clicks.',
    whyItMatters: 'Shows how well your bio converts visitors.',
    tip: 'Clear CTA in bio improves this metric.',
  },
  linkToSubsCVR: {
    title: 'Link → Subs CVR',
    description: 'New subscribers divided by link taps.',
    whyItMatters: 'Your ultimate conversion metric.',
    tip: 'Optimize your landing page for conversions.',
  },
  rpm: {
    title: 'RPM',
    description: 'Revenue per 1,000 views.',
    whyItMatters: 'Shows how efficiently your content monetizes.',
    tip: 'Higher RPM = more valuable audience.',
  },
  arpu: {
    title: 'ARPU',
    description: 'Average revenue per user over a period.',
    whyItMatters: 'Shows how much each fan is worth.',
    tip: 'Increase with upsells and premium content.',
  },
  ltv: {
    title: 'LTV',
    description: 'Total revenue a fan generates before churning.',
    whyItMatters: 'Helps you understand acquisition costs.',
    tip: 'Improve retention to increase LTV.',
  },
} as const;
