/**
 * Marketing War Room Worker
 * 
 * Processes publish jobs from the queue with:
 * - Idempotency (same job never runs twice)
 * - Retries with exponential backoff
 * - Event logging for real-time UI updates
 * 
 * In production, use BullMQ, Temporal, or similar for the queue.
 * This file shows the worker logic that processes jobs.
 */

import { publishInstagramReel } from './publish-instagram-reel';
import { publishTikTokDirectPost } from './publish-tiktok-direct-post';

// Database abstraction (implement with your actual DB)
const db = {
  async lockJobByIdempotency(idempotencyKey: string): Promise<Job | null> {
    // Atomic lock: UPDATE publish_jobs SET status = 'running' 
    // WHERE idempotency_key = $1 AND status IN ('queued', 'retrying')
    // RETURNING *
    console.log(`[worker] Locking job: ${idempotencyKey}`);
    return {
      id: 'mock-job-id',
      kind: 'PUBLISH_INSTAGRAM_REELS',
      idempotency_key: idempotencyKey,
      attempts: 0,
      max_attempts: 8,
    };
  },
  async setJobStatus(jobId: string, status: string) {
    // UPDATE publish_jobs SET status = $2, updated_at = now() WHERE id = $1
    console.log(`[worker] Job ${jobId} -> ${status}`);
  },
  async setJobAttempt(jobId: string, attempts: number, error: string) {
    // UPDATE publish_jobs SET attempts = $2, last_error = $3, updated_at = now() WHERE id = $1
    console.log(`[worker] Job ${jobId} attempt ${attempts}: ${error}`);
  },
  async addEvent(jobId: string, level: string, message: string, payload: Record<string, unknown> = {}) {
    // INSERT INTO job_events (job_id, level, message, payload) VALUES ($1, $2, $3, $4)
    console.log(`[event] [${level}] ${message}`, payload);
  },
};

interface Job {
  id: string;
  kind: string;
  idempotency_key: string;
  attempts: number;
  max_attempts: number;
  content_item_id?: string;
  platform_publication_id?: string;
}

interface JobData {
  kind: string;
  platformPublicationId: string;
  idempotencyKey: string;
}

/**
 * Calculate backoff delay with jitter.
 */
function backoff(attempt: number): number {
  const base = Math.min(60_000, 1000 * Math.pow(2, attempt));
  return Math.floor(base * (0.7 + Math.random() * 0.6));
}

/**
 * Process a single job.
 */
async function processJob(jobData: JobData): Promise<void> {
  const { kind, platformPublicationId, idempotencyKey } = jobData;

  // Hard idempotence check (DB lock)
  const dbJob = await db.lockJobByIdempotency(idempotencyKey);
  if (!dbJob) {
    console.log(`[worker] Job already processed or locked: ${idempotencyKey}`);
    return;
  }

  await db.setJobStatus(dbJob.id, 'running');
  await db.addEvent(dbJob.id, 'info', `Job started: ${kind}`, { idempotencyKey });

  try {
    // Route to appropriate publisher
    if (kind === 'PUBLISH_INSTAGRAM_REELS') {
      await publishInstagramReel({ 
        platformPublicationId, 
        jobId: dbJob.id 
      });
    } else if (kind === 'PUBLISH_TIKTOK_DIRECT_POST') {
      await publishTikTokDirectPost({ 
        platformPublicationId, 
        jobId: dbJob.id 
      });
    } else {
      throw new Error(`Unknown job kind: ${kind}`);
    }

    await db.setJobStatus(dbJob.id, 'succeeded');
    await db.addEvent(dbJob.id, 'success', 'Job succeeded');
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const attempts = (dbJob.attempts ?? 0) + 1;
    
    await db.setJobAttempt(dbJob.id, attempts, errorMessage);

    const retryable = attempts < (dbJob.max_attempts ?? 8);
    await db.setJobStatus(dbJob.id, retryable ? 'retrying' : 'failed');

    await db.addEvent(
      dbJob.id, 
      'error', 
      retryable ? 'Job failed, will retry' : 'Job failed permanently', 
      { error: errorMessage, attempts }
    );

    if (retryable) {
      // Schedule retry with backoff
      const delayMs = backoff(attempts);
      console.log(`[worker] Scheduling retry in ${delayMs}ms`);
      // In production: queue.add(jobData, { delay: delayMs })
    }

    // Re-throw for queue to handle
    throw error;
  }
}

/**
 * Start the worker (BullMQ example).
 * 
 * In production:
 * ```
 * import { Worker } from 'bullmq';
 * 
 * const worker = new Worker('PUBLISH', async (job) => {
 *   await processJob(job.data);
 * }, { connection: redis, concurrency: 4 });
 * ```
 */
export function startWorker(redis: unknown): void {
  console.log('[worker] Starting publish worker...');
  
  // BullMQ Worker example (uncomment in production):
  /*
  const worker = new Worker('PUBLISH', async (job) => {
    await processJob(job.data);
  }, { 
    connection: redis as ConnectionOptions, 
    concurrency: 4,
    limiter: {
      max: 10,
      duration: 1000, // 10 jobs per second max
    },
  });

  worker.on('completed', (job) => {
    console.log(`[worker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[worker] Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('[worker] Worker error:', err);
  });
  */
  
  console.log('[worker] Worker started (demo mode - implement with BullMQ/Temporal)');
}

/**
 * Poll-based worker for environments without Redis.
 * Polls the database for queued jobs.
 */
export async function pollAndProcessJobs(): Promise<number> {
  // In production:
  // SELECT * FROM publish_jobs 
  // WHERE status IN ('queued', 'retrying') AND run_at <= NOW()
  // ORDER BY run_at ASC
  // LIMIT 10
  // FOR UPDATE SKIP LOCKED
  
  console.log('[worker] Polling for jobs...');
  
  // Demo: no jobs to process
  return 0;
}

/**
 * Start poll-based worker.
 */
export function startPollWorker(intervalMs = 5000): NodeJS.Timeout {
  console.log(`[worker] Starting poll worker with ${intervalMs}ms interval`);
  
  return setInterval(async () => {
    try {
      const processed = await pollAndProcessJobs();
      if (processed > 0) {
        console.log(`[worker] Processed ${processed} jobs`);
      }
    } catch (error) {
      console.error('[worker] Poll error:', error);
    }
  }, intervalMs);
}

// Export for testing
export { processJob, backoff };
