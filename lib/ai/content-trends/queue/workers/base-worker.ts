/**
 * Base Worker for Content Trends Queue
 * 
 * Abstract base class for BullMQ workers with common functionality
 * including rate limiting, error handling, and metrics collection.
 * 
 * @see .kiro/specs/content-trends-ai-engine/design.md - Section 4
 */

import { Worker, Job, Processor } from 'bullmq';
import { Redis } from 'ioredis';
import {
  QueueName,
  WorkerConfig,
  ContentTrendsJobData,
  JobResult,
  JobStatus,
} from '../types';

/**
 * Worker metrics for monitoring
 */
export interface WorkerMetrics {
  workerId: string;
  queueName: QueueName;
  processedCount: number;
  failedCount: number;
  avgProcessingTime: number;
  lastProcessedAt?: number;
  isRunning: boolean;
}

/**
 * Rate limiter configuration
 */
export interface RateLimiterConfig {
  /** Maximum requests per window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
  /** Key prefix for rate limiting */
  keyPrefix: string;
}

/**
 * Abstract base worker class
 */
export abstract class BaseWorker<T extends ContentTrendsJobData, R = unknown> {
  protected worker: Worker<T, R> | null = null;
  protected redis: Redis;
  protected config: WorkerConfig;
  protected rateLimiter?: RateLimiterConfig;
  protected metrics: WorkerMetrics;
  protected processingTimes: number[] = [];
  protected maxProcessingTimeSamples = 100;

  constructor(
    redis: Redis,
    config: WorkerConfig,
    rateLimiter?: RateLimiterConfig
  ) {
    this.redis = redis;
    this.config = config;
    this.rateLimiter = rateLimiter;
    this.metrics = {
      workerId: `${config.queueName}-${Date.now()}`,
      queueName: config.queueName,
      processedCount: 0,
      failedCount: 0,
      avgProcessingTime: 0,
      isRunning: false,
    };
  }

  /**
   * Abstract method to process a job - must be implemented by subclasses
   */
  protected abstract processJob(job: Job<T>): Promise<R>;

  /**
   * Start the worker
   */
  async start(): Promise<void> {
    if (this.worker) {
      return;
    }

    const processor: Processor<T, R> = async (job: Job<T>) => {
      const startTime = Date.now();

      try {
        // Check rate limit before processing
        if (this.rateLimiter) {
          await this.checkRateLimit(job);
        }

        // Process the job
        const result = await this.processJob(job);

        // Update metrics
        this.updateMetrics(startTime, true);

        return result;
      } catch (error) {
        // Update metrics
        this.updateMetrics(startTime, false);

        // Re-throw to let BullMQ handle retries
        throw error;
      }
    };

    this.worker = new Worker<T, R>(this.config.queueName, processor, {
      connection: this.redis.duplicate(),
      concurrency: this.config.concurrency,
      lockDuration: this.config.lockDuration,
      stalledInterval: this.config.stalledInterval,
      maxStalledCount: this.config.maxStalledCount,
    });

    // Set up event handlers
    this.setupEventHandlers();

    this.metrics.isRunning = true;
  }

  /**
   * Set up worker event handlers
   */
  private setupEventHandlers(): void {
    if (!this.worker) return;

    this.worker.on('completed', (job) => {
      this.onJobCompleted(job);
    });

    this.worker.on('failed', (job, error) => {
      this.onJobFailed(job, error);
    });

    this.worker.on('error', (error) => {
      this.onWorkerError(error);
    });

    this.worker.on('stalled', (jobId) => {
      this.onJobStalled(jobId);
    });
  }

  /**
   * Check rate limit before processing
   */
  protected async checkRateLimit(job: Job<T>): Promise<void> {
    if (!this.rateLimiter) return;

    const key = `${this.rateLimiter.keyPrefix}:${job.data.userId}`;
    const now = Date.now();
    const windowStart = now - this.rateLimiter.windowMs;

    // Remove old entries
    await this.redis.zremrangebyscore(key, 0, windowStart);

    // Count current requests
    const count = await this.redis.zcard(key);

    if (count >= this.rateLimiter.maxRequests) {
      // Calculate wait time
      const oldestEntry = await this.redis.zrange(key, 0, 0, 'WITHSCORES');
      const waitTime = oldestEntry.length > 1 
        ? parseInt(oldestEntry[1]) + this.rateLimiter.windowMs - now
        : this.rateLimiter.windowMs;

      throw new RateLimitError(
        `Rate limit exceeded for user ${job.data.userId}`,
        waitTime
      );
    }

    // Add current request
    await this.redis.zadd(key, now, `${job.id}:${now}`);
    await this.redis.expire(key, Math.ceil(this.rateLimiter.windowMs / 1000));
  }

  /**
   * Update worker metrics
   */
  private updateMetrics(startTime: number, success: boolean): void {
    const processingTime = Date.now() - startTime;

    if (success) {
      this.metrics.processedCount++;
    } else {
      this.metrics.failedCount++;
    }

    this.metrics.lastProcessedAt = Date.now();

    // Update average processing time
    this.processingTimes.push(processingTime);
    if (this.processingTimes.length > this.maxProcessingTimeSamples) {
      this.processingTimes.shift();
    }

    this.metrics.avgProcessingTime = 
      this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length;
  }

  /**
   * Hook for job completion - can be overridden
   */
  protected onJobCompleted(job: Job<T>): void {
    // Default implementation - can be overridden
  }

  /**
   * Hook for job failure - can be overridden
   */
  protected onJobFailed(job: Job<T> | undefined, error: Error): void {
    console.error(`Job ${job?.id} failed:`, error.message);
  }

  /**
   * Hook for worker errors - can be overridden
   */
  protected onWorkerError(error: Error): void {
    console.error(`Worker error:`, error.message);
  }

  /**
   * Hook for stalled jobs - can be overridden
   */
  protected onJobStalled(jobId: string): void {
    console.warn(`Job ${jobId} stalled`);
  }

  /**
   * Get worker metrics
   */
  getMetrics(): WorkerMetrics {
    return { ...this.metrics };
  }

  /**
   * Pause the worker
   */
  async pause(force = false): Promise<void> {
    if (this.worker) {
      await this.worker.pause(force);
      this.metrics.isRunning = false;
    }
  }

  /**
   * Resume the worker
   */
  async resume(): Promise<void> {
    if (this.worker) {
      this.worker.resume();
      this.metrics.isRunning = true;
    }
  }

  /**
   * Stop the worker
   */
  async stop(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
      this.metrics.isRunning = false;
    }
  }

  /**
   * Check if worker is running
   */
  get isRunning(): boolean {
    return this.metrics.isRunning;
  }
}

/**
 * Rate limit error with retry information
 */
export class RateLimitError extends Error {
  constructor(
    message: string,
    public readonly retryAfterMs: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Processing error with retry information
 */
export class ProcessingError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean = true
  ) {
    super(message);
    this.name = 'ProcessingError';
  }
}
