/**
 * OF Scraper Queue - BullMQ Integration
 * 
 * Permet d'envoyer des jobs de scraping en async pour éviter les timeouts Vercel.
 * Le worker tourne sur AWS App Runner et traite les jobs en arrière-plan.
 */

import { Queue, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';

// Types
export interface ScrapeJobData {
  userId: number;
  endpoint: string;
  cookies: string;
  userAgent?: string;
  proxyUrl?: string;
  callbackUrl?: string; // Webhook pour notifier quand c'est fini
  metadata?: Record<string, unknown>; // Données additionnelles pour le callback
}

export interface AddScrapeJobParams {
  jobId?: string;
  userId: number;
  endpoint: string;
  cookies: string;
  userAgent?: string;
  proxyUrl?: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface ScrapeJobResult {
  success: boolean;
  data?: unknown;
  error?: string;
  duration?: number;
}

export type ScrapeJobType = 
  | 'sync-profile'
  | 'sync-subscribers' 
  | 'sync-earnings'
  | 'sync-messages'
  | 'sync-statistics'
  | 'sync-full';

// Redis connection (réutilise REDIS_URL existant)
function getRedisConnection() {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error('❌ REDIS_URL manquant pour BullMQ');
  }
  return new IORedis(url, {
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: false,
  });
}

// Singleton queue instance
let _queue: Queue<ScrapeJobData, ScrapeJobResult> | null = null;
let _queueEvents: QueueEvents | null = null;

export function getScraperQueue(): Queue<ScrapeJobData, ScrapeJobResult> {
  if (_queue) return _queue;
  
  _queue = new Queue<ScrapeJobData, ScrapeJobResult>('of-scraper', {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: {
        age: 3600, // Keep completed jobs for 1 hour
        count: 100,
      },
      removeOnFail: {
        age: 86400, // Keep failed jobs for 24 hours
      },
    },
  });

  return _queue;
}

export function getQueueEvents(): QueueEvents {
  if (_queueEvents) return _queueEvents;
  
  _queueEvents = new QueueEvents('of-scraper', {
    connection: getRedisConnection(),
  });

  return _queueEvents;
}

/**
 * Ajoute un job de scraping à la queue
 * Retourne immédiatement avec le jobId
 */
export async function enqueueScrapeJob(
  type: ScrapeJobType,
  data: ScrapeJobData
): Promise<{ jobId: string; status: 'queued' }> {
  const queue = getScraperQueue();
  
  const job = await queue.add(type, data, {
    jobId: `${type}-${data.userId}-${Date.now()}`,
  });

  console.log(`📤 Job enqueued: ${job.id} (${type}) for user ${data.userId}`);
  
  return {
    jobId: job.id!,
    status: 'queued',
  };
}

/**
 * Récupère le statut d'un job
 */
export async function getJobStatus(jobId: string): Promise<{
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'unknown';
  result?: ScrapeJobResult;
  error?: string;
  progress?: number;
}> {
  const queue = getScraperQueue();
  const job = await queue.getJob(jobId);
  
  if (!job) {
    return { status: 'unknown' };
  }

  const state = await job.getState();
  
  return {
    status: state as 'waiting' | 'active' | 'completed' | 'failed',
    result: job.returnvalue as ScrapeJobResult | undefined,
    error: job.failedReason,
    progress: job.progress as number | undefined,
  };
}

/**
 * Attend qu'un job soit terminé (avec timeout)
 */
export async function waitForJob(
  jobId: string,
  timeoutMs: number = 60000
): Promise<ScrapeJobResult> {
  const queue = getScraperQueue();
  const job = await queue.getJob(jobId);
  
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  const result = await job.waitUntilFinished(getQueueEvents(), timeoutMs);
  return result;
}

// Endpoints OF courants
export const OF_SCRAPE_ENDPOINTS = {
  PROFILE: '/api2/v2/users/me',
  SUBSCRIBERS: '/api2/v2/subscriptions/subscribers',
  EARNINGS: '/api2/v2/earnings',
  MESSAGES: '/api2/v2/chats',
  STATISTICS: '/api2/v2/users/me/stats',
} as const;

/**
 * Helper function pour ajouter un job avec un ID personnalisé
 */
export async function addScrapeJob(params: AddScrapeJobParams): Promise<{ jobId: string; status: 'queued' }> {
  const queue = getScraperQueue();
  
  const jobId = params.jobId || `scrape-${params.userId}-${Date.now()}`;
  const jobData: ScrapeJobData = {
    userId: params.userId,
    endpoint: params.endpoint,
    cookies: params.cookies,
    userAgent: params.userAgent,
    proxyUrl: params.proxyUrl,
    callbackUrl: params.callbackUrl,
    metadata: params.metadata,
  };

  const job = await queue.add('scrape', jobData, { jobId });

  console.log(`📤 Job enqueued: ${job.id} for user ${params.userId}`);
  
  return {
    jobId: job.id!,
    status: 'queued',
  };
}
