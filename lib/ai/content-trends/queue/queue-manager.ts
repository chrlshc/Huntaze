/**
 * Content Trends Queue Manager
 * 
 * BullMQ-based queue management for asynchronous AI inference tasks.
 * Implements job prioritization, rate limiting, and monitoring.
 * 
 * @see .kiro/specs/content-trends-ai-engine/design.md - Section 4
 */

import { Queue, QueueEvents, Job, JobsOptions } from 'bullmq';
import { Redis } from 'ioredis';
import {
  QueueName,
  QueueConfig,
  QueueMetrics,
  JobPriority,
  JobStatus,
  ContentTrendsJobData,
  JobResult,
  QueueEvent,
  QueueEventType,
} from './types';

/**
 * Default queue configuration
 */
const DEFAULT_CONFIG: QueueConfig = {
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000, // 2s, 4s, 8s, 16s
    },
    removeOnComplete: 1000, // Keep last 1000 completed jobs
    removeOnFail: 5000, // Keep last 5000 failed jobs
  },
  concurrency: {
    [QueueName.VIDEO_PROCESSING]: 2,
    [QueueName.VISUAL_ANALYSIS]: 5,
    [QueueName.TEXT_ANALYSIS]: 10,
    [QueueName.VIRAL_PREDICTION]: 5,
    [QueueName.CONTENT_GENERATION]: 3,
    [QueueName.WEBHOOK_PROCESSING]: 10,
  },
};

/**
 * Queue Manager for Content Trends AI Engine
 * 
 * Manages multiple BullMQ queues for different task types,
 * providing job prioritization, monitoring, and lifecycle management.
 */
export class ContentTrendsQueueManager {
  private queues: Map<QueueName, Queue> = new Map();
  private queueEvents: Map<QueueName, QueueEvents> = new Map();
  private redis: Redis;
  private config: QueueConfig;
  private eventListeners: Map<QueueEventType, Set<(event: QueueEvent) => void>> = new Map();
  private isInitialized = false;

  constructor(config: Partial<QueueConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.redis = new Redis(this.config.redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }

  /**
   * Initialize all queues
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    const queueNames = Object.values(QueueName);
    
    for (const queueName of queueNames) {
      const queue = new Queue(queueName, {
        connection: this.redis,
        defaultJobOptions: this.config.defaultJobOptions,
      });

      const events = new QueueEvents(queueName, {
        connection: this.redis.duplicate(),
      });

      // Set up event listeners
      this.setupQueueEvents(queueName, events);

      this.queues.set(queueName, queue);
      this.queueEvents.set(queueName, events);
    }

    this.isInitialized = true;
  }

  /**
   * Set up event listeners for a queue
   */
  private setupQueueEvents(queueName: QueueName, events: QueueEvents): void {
    events.on('completed', ({ jobId }) => {
      this.emitEvent({
        type: 'job:completed',
        queueName,
        jobId,
        timestamp: Date.now(),
      });
    });

    events.on('failed', ({ jobId, failedReason }) => {
      this.emitEvent({
        type: 'job:failed',
        queueName,
        jobId,
        timestamp: Date.now(),
        data: { reason: failedReason },
      });
    });

    events.on('active', ({ jobId }) => {
      this.emitEvent({
        type: 'job:active',
        queueName,
        jobId,
        timestamp: Date.now(),
      });
    });

    events.on('stalled', ({ jobId }) => {
      this.emitEvent({
        type: 'job:stalled',
        queueName,
        jobId,
        timestamp: Date.now(),
      });
    });

    events.on('progress', ({ jobId, data }) => {
      this.emitEvent({
        type: 'job:progress',
        queueName,
        jobId,
        timestamp: Date.now(),
        data,
      });
    });

    events.on('drained', () => {
      this.emitEvent({
        type: 'queue:drained',
        queueName,
        timestamp: Date.now(),
      });
    });
  }

  /**
   * Emit an event to all registered listeners
   */
  private emitEvent(event: QueueEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => listener(event));
    }
  }

  /**
   * Register an event listener
   */
  on(eventType: QueueEventType, listener: (event: QueueEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(listener);
  }

  /**
   * Remove an event listener
   */
  off(eventType: QueueEventType, listener: (event: QueueEvent) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * Add a job to the appropriate queue
   */
  async addJob<T extends ContentTrendsJobData>(
    data: T,
    options?: Partial<JobsOptions>
  ): Promise<Job<T>> {
    const queueName = this.getQueueForJobType(data.type);
    const queue = this.queues.get(queueName);

    if (!queue) {
      throw new Error(`Queue ${queueName} not initialized`);
    }

    const jobOptions: JobsOptions = {
      ...this.config.defaultJobOptions,
      ...options,
      priority: data.priority,
      jobId: data.jobId,
    };

    const job = await queue.add(data.type, data, jobOptions);

    this.emitEvent({
      type: 'job:added',
      queueName,
      jobId: job.id!,
      timestamp: Date.now(),
      data: { type: data.type, priority: data.priority },
    });

    return job as Job<T>;
  }

  /**
   * Add multiple jobs in bulk
   */
  async addBulk<T extends ContentTrendsJobData>(
    jobs: Array<{ data: T; options?: Partial<JobsOptions> }>
  ): Promise<Job<T>[]> {
    const jobsByQueue = new Map<QueueName, Array<{ name: string; data: T; opts: JobsOptions }>>();

    // Group jobs by queue
    for (const { data, options } of jobs) {
      const queueName = this.getQueueForJobType(data.type);
      
      if (!jobsByQueue.has(queueName)) {
        jobsByQueue.set(queueName, []);
      }

      jobsByQueue.get(queueName)!.push({
        name: data.type,
        data,
        opts: {
          ...this.config.defaultJobOptions,
          ...options,
          priority: data.priority,
          jobId: data.jobId,
        },
      });
    }

    // Add jobs to each queue
    const results: Job<T>[] = [];
    
    for (const [queueName, queueJobs] of jobsByQueue) {
      const queue = this.queues.get(queueName);
      if (!queue) {
        throw new Error(`Queue ${queueName} not initialized`);
      }

      const addedJobs = await queue.addBulk(queueJobs);
      results.push(...(addedJobs as Job<T>[]));
    }

    return results;
  }

  /**
   * Get the appropriate queue for a job type
   */
  private getQueueForJobType(type: string): QueueName {
    switch (type) {
      case 'video-processing':
        return QueueName.VIDEO_PROCESSING;
      case 'visual-analysis':
        return QueueName.VISUAL_ANALYSIS;
      case 'text-analysis':
        return QueueName.TEXT_ANALYSIS;
      case 'viral-prediction':
        return QueueName.VIRAL_PREDICTION;
      case 'content-generation':
        return QueueName.CONTENT_GENERATION;
      case 'webhook-processing':
        return QueueName.WEBHOOK_PROCESSING;
      default:
        throw new Error(`Unknown job type: ${type}`);
    }
  }

  /**
   * Get a job by ID
   */
  async getJob<T extends ContentTrendsJobData>(
    queueName: QueueName,
    jobId: string
  ): Promise<Job<T> | undefined> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not initialized`);
    }

    return queue.getJob(jobId) as Promise<Job<T> | undefined>;
  }

  /**
   * Get job result
   */
  async getJobResult<T = unknown>(
    queueName: QueueName,
    jobId: string
  ): Promise<JobResult<T> | null> {
    const job = await this.getJob(queueName, jobId);
    
    if (!job) {
      return null;
    }

    const state = await job.getState();
    const status = this.mapStateToStatus(state);

    return {
      jobId,
      status,
      data: job.returnvalue as T,
      error: job.failedReason ? {
        message: job.failedReason,
        code: 'JOB_FAILED',
        retryable: job.attemptsMade < (job.opts.attempts || 3),
      } : undefined,
      metrics: {
        queuedAt: job.timestamp,
        startedAt: job.processedOn,
        completedAt: job.finishedOn,
        processingTimeMs: job.finishedOn && job.processedOn 
          ? job.finishedOn - job.processedOn 
          : undefined,
        retryCount: job.attemptsMade,
      },
    };
  }

  /**
   * Map BullMQ state to JobStatus
   */
  private mapStateToStatus(state: string): JobStatus {
    switch (state) {
      case 'waiting':
      case 'delayed':
        return JobStatus.QUEUED;
      case 'active':
        return JobStatus.PROCESSING;
      case 'completed':
        return JobStatus.COMPLETED;
      case 'failed':
        return JobStatus.FAILED;
      default:
        return JobStatus.PENDING;
    }
  }

  /**
   * Cancel a job
   */
  async cancelJob(queueName: QueueName, jobId: string): Promise<boolean> {
    const job = await this.getJob(queueName, jobId);
    
    if (!job) {
      return false;
    }

    const state = await job.getState();
    
    if (state === 'waiting' || state === 'delayed') {
      await job.remove();
      this.emitEvent({
        type: 'job:removed',
        queueName,
        jobId,
        timestamp: Date.now(),
      });
      return true;
    }

    return false;
  }

  /**
   * Retry a failed job
   */
  async retryJob(queueName: QueueName, jobId: string): Promise<boolean> {
    const job = await this.getJob(queueName, jobId);
    
    if (!job) {
      return false;
    }

    const state = await job.getState();
    
    if (state === 'failed') {
      await job.retry();
      return true;
    }

    return false;
  }

  /**
   * Get queue metrics
   */
  async getQueueMetrics(queueName: QueueName): Promise<QueueMetrics> {
    const queue = this.queues.get(queueName);
    
    if (!queue) {
      throw new Error(`Queue ${queueName} not initialized`);
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    // Calculate average processing time from recent completed jobs
    const recentCompleted = await queue.getCompleted(0, 100);
    let avgProcessingTime = 0;
    
    if (recentCompleted.length > 0) {
      const totalTime = recentCompleted.reduce((sum, job) => {
        if (job.finishedOn && job.processedOn) {
          return sum + (job.finishedOn - job.processedOn);
        }
        return sum;
      }, 0);
      avgProcessingTime = totalTime / recentCompleted.length;
    }

    // Calculate throughput (jobs per minute)
    const oneMinuteAgo = Date.now() - 60000;
    const recentJobs = recentCompleted.filter(
      job => job.finishedOn && job.finishedOn > oneMinuteAgo
    );
    const throughput = recentJobs.length;

    return {
      queueName,
      waiting,
      active,
      completed,
      failed,
      delayed,
      avgProcessingTime,
      throughput,
    };
  }

  /**
   * Get metrics for all queues
   */
  async getAllQueueMetrics(): Promise<QueueMetrics[]> {
    const metrics: QueueMetrics[] = [];
    
    for (const queueName of this.queues.keys()) {
      metrics.push(await this.getQueueMetrics(queueName));
    }

    return metrics;
  }

  /**
   * Pause a queue
   */
  async pauseQueue(queueName: QueueName): Promise<void> {
    const queue = this.queues.get(queueName);
    
    if (!queue) {
      throw new Error(`Queue ${queueName} not initialized`);
    }

    await queue.pause();
    
    this.emitEvent({
      type: 'queue:paused',
      queueName,
      timestamp: Date.now(),
    });
  }

  /**
   * Resume a queue
   */
  async resumeQueue(queueName: QueueName): Promise<void> {
    const queue = this.queues.get(queueName);
    
    if (!queue) {
      throw new Error(`Queue ${queueName} not initialized`);
    }

    await queue.resume();
    
    this.emitEvent({
      type: 'queue:resumed',
      queueName,
      timestamp: Date.now(),
    });
  }

  /**
   * Clean old jobs from a queue
   */
  async cleanQueue(
    queueName: QueueName,
    grace: number = 3600000, // 1 hour
    limit: number = 1000,
    status: 'completed' | 'failed' = 'completed'
  ): Promise<string[]> {
    const queue = this.queues.get(queueName);
    
    if (!queue) {
      throw new Error(`Queue ${queueName} not initialized`);
    }

    return queue.clean(grace, limit, status);
  }

  /**
   * Get queue by name
   */
  getQueue(queueName: QueueName): Queue | undefined {
    return this.queues.get(queueName);
  }

  /**
   * Get concurrency setting for a queue
   */
  getConcurrency(queueName: QueueName): number {
    return this.config.concurrency[queueName] || 1;
  }

  /**
   * Close all queues and connections
   */
  async close(): Promise<void> {
    for (const events of this.queueEvents.values()) {
      await events.close();
    }

    for (const queue of this.queues.values()) {
      await queue.close();
    }

    await this.redis.quit();
    
    this.queues.clear();
    this.queueEvents.clear();
    this.eventListeners.clear();
    this.isInitialized = false;
  }

  /**
   * Check if manager is initialized
   */
  get initialized(): boolean {
    return this.isInitialized;
  }
}

// Singleton instance
let queueManagerInstance: ContentTrendsQueueManager | null = null;

/**
 * Get or create the queue manager singleton
 */
export function getQueueManager(config?: Partial<QueueConfig>): ContentTrendsQueueManager {
  if (!queueManagerInstance) {
    queueManagerInstance = new ContentTrendsQueueManager(config);
  }
  return queueManagerInstance;
}

/**
 * Create a new queue manager instance (for testing)
 */
export function createQueueManager(config?: Partial<QueueConfig>): ContentTrendsQueueManager {
  return new ContentTrendsQueueManager(config);
}
