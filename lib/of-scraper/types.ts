/**
 * Types partagés entre l'app Next.js et le Worker
 */

export interface ScrapeJobData {
  userId: number;
  endpoint: string;
  cookies: string;
  userAgent?: string;
  proxyUrl?: string;
  callbackUrl?: string;
}

export interface ScrapeJobResult {
  success: boolean;
  data?: unknown;
  error?: string;
  duration?: number;
  mode?: 'stealth';
}

export type ScrapeJobType = 
  | 'sync-profile'
  | 'sync-subscribers' 
  | 'sync-earnings'
  | 'sync-messages'
  | 'sync-statistics'
  | 'sync-full';

export interface JobStatusResponse {
  jobId: string;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'unknown';
  result?: ScrapeJobResult;
  error?: string;
  progress?: number;
}

export const OF_ENDPOINTS = {
  PROFILE: '/api2/v2/users/me',
  SUBSCRIBERS: '/api2/v2/subscriptions/subscribers',
  EARNINGS: '/api2/v2/earnings',
  MESSAGES: '/api2/v2/chats',
  STATISTICS: '/api2/v2/users/me/stats',
} as const;
