/**
 * Marketing War Room - Module Index
 * 
 * API-first, no-scraping architecture for content publishing.
 * 
 * Components:
 * - scheduler: Converts calendar items to publish jobs
 * - worker: Processes jobs with retries and idempotency
 * - publish-instagram-reel: Instagram Reels via Graph API
 * - publish-tiktok-direct-post: TikTok via Content Posting API
 * 
 * Database Schema: migrations/002_marketing_war_room_schema.sql
 * 
 * API Endpoints:
 * - GET  /api/marketing-war-room/state
 * - POST /api/marketing-war-room/automations/:key
 * - GET  /api/marketing-war-room/events (SSE)
 */

export { scheduleDueContent, startScheduler, stopScheduler } from './scheduler';
export { startWorker, startPollWorker, pollAndProcessJobs } from './worker';
export { publishInstagramReel } from './publish-instagram-reel';
export { publishTikTokDirectPost } from './publish-tiktok-direct-post';

// Types
export interface WarRoomState {
  queue: QueueItem[];
  automations: Record<string, Automation>;
  health: Health;
  trends: Trend[];
}

export interface QueueItem {
  id: string;
  title: string;
  scheduledAt: string;
  platforms: string[];
  status: 'scheduled' | 'uploading' | 'processing' | 'posted' | 'failed';
  steps: { key: string; label: string; status: string }[];
  lastUpdateAt: string;
  error?: string;
}

export interface Automation {
  enabled: boolean;
  label: string;
  description: string;
  compliance: string;
}

export interface Health {
  status: 'secure' | 'warning' | 'risk' | 'unknown';
  label: string;
  details: string;
  checks: HealthCheck[];
}

export interface HealthCheck {
  key: string;
  label: string;
  ok: boolean;
  detail: string;
}

export interface Trend {
  id: string;
  title: string;
  why: string;
  example?: string;
}
