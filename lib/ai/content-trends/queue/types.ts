/**
 * Content Trends Queue Types
 * 
 * Type definitions for BullMQ-based asynchronous processing
 * of AI inference tasks.
 * 
 * @see .kiro/specs/content-trends-ai-engine/design.md - Section 4
 */

import type { AnalysisTask, RoutingDecision } from '../ai-router';
import type { VideoProcessingResult } from '../video-processor';
import type { VisualAnalysisResult } from '../llama-vision-service';

/**
 * Job priority levels for queue management
 * Lower number = higher priority
 */
export enum JobPriority {
  CRITICAL = 1,      // System-critical tasks
  PREMIUM = 2,       // Premium user tasks
  HIGH = 3,          // High-priority analysis
  NORMAL = 5,        // Standard processing
  LOW = 10,          // Background/batch tasks
  ROUTINE = 15,      // Routine maintenance
}

/**
 * Job status tracking
 */
export enum JobStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RETRYING = 'retrying',
  CANCELLED = 'cancelled',
}

/**
 * Queue names for different task types
 */
export enum QueueName {
  VIDEO_PROCESSING = 'content-trends:video-processing',
  VISUAL_ANALYSIS = 'content-trends:visual-analysis',
  TEXT_ANALYSIS = 'content-trends:text-analysis',
  VIRAL_PREDICTION = 'content-trends:viral-prediction',
  CONTENT_GENERATION = 'content-trends:content-generation',
  WEBHOOK_PROCESSING = 'content-trends:webhook-processing',
}

/**
 * Base job data interface
 */
export interface BaseJobData {
  /** Unique job identifier */
  jobId: string;
  /** User or tenant ID */
  userId: string;
  /** Job priority level */
  priority: JobPriority;
  /** Timestamp when job was created */
  createdAt: number;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
  /** Correlation ID for tracing */
  correlationId?: string;
}

/**
 * Video processing job data
 */
export interface VideoProcessingJobData extends BaseJobData {
  type: 'video-processing';
  /** Video source URL or path */
  videoSource: string;
  /** Desired grid layout */
  gridLayout: '2x2' | '3x3';
  /** Whether to upload to blob storage */
  uploadToBlob: boolean;
  /** Optional scene change threshold */
  sceneChangeThreshold?: number;
}

/**
 * Visual analysis job data
 */
export interface VisualAnalysisJobData extends BaseJobData {
  type: 'visual-analysis';
  /** Image URLs to analyze */
  imageUrls: string[];
  /** Analysis types to perform */
  analysisTypes: ('ocr' | 'facial' | 'editing' | 'elements' | 'caption')[];
  /** Reference to video processing job if applicable */
  videoJobId?: string;
}

/**
 * Text analysis job data
 */
export interface TextAnalysisJobData extends BaseJobData {
  type: 'text-analysis';
  /** Content to analyze */
  content: string;
  /** Analysis task details */
  task: AnalysisTask;
}

/**
 * Viral prediction job data
 */
export interface ViralPredictionJobData extends BaseJobData {
  type: 'viral-prediction';
  /** Content metadata */
  contentMetadata: {
    platform: string;
    contentType: string;
    engagementMetrics?: {
      views?: number;
      likes?: number;
      shares?: number;
      comments?: number;
    };
  };
  /** Visual analysis results */
  visualAnalysis?: VisualAnalysisResult;
  /** Video processing results */
  videoProcessing?: VideoProcessingResult;
}

/**
 * Content generation job data
 */
export interface ContentGenerationJobData extends BaseJobData {
  type: 'content-generation';
  /** Viral mechanisms to replicate */
  viralMechanisms: string[];
  /** Brand context for adaptation */
  brandContext: {
    name: string;
    industry: string;
    tone: string;
    targetAudience: string;
  };
  /** Number of variations to generate */
  variationCount: number;
}

/**
 * Webhook processing job data
 */
export interface WebhookProcessingJobData extends BaseJobData {
  type: 'webhook-processing';
  /** Webhook source */
  source: 'apify' | 'external';
  /** Raw payload */
  payload: unknown;
  /** Signature for verification */
  signature?: string;
  /** Idempotency key */
  idempotencyKey: string;
}

/**
 * Union type for all job data types
 */
export type ContentTrendsJobData =
  | VideoProcessingJobData
  | VisualAnalysisJobData
  | TextAnalysisJobData
  | ViralPredictionJobData
  | ContentGenerationJobData
  | WebhookProcessingJobData;

/**
 * Job result interface
 */
export interface JobResult<T = unknown> {
  /** Job ID */
  jobId: string;
  /** Job status */
  status: JobStatus;
  /** Result data */
  data?: T;
  /** Error information if failed */
  error?: {
    message: string;
    code: string;
    retryable: boolean;
  };
  /** Processing metrics */
  metrics: {
    queuedAt: number;
    startedAt?: number;
    completedAt?: number;
    processingTimeMs?: number;
    retryCount: number;
  };
}

/**
 * Queue configuration options
 */
export interface QueueConfig {
  /** Redis connection URL */
  redisUrl: string;
  /** Default job options */
  defaultJobOptions: {
    attempts: number;
    backoff: {
      type: 'exponential' | 'fixed';
      delay: number;
    };
    removeOnComplete: boolean | number;
    removeOnFail: boolean | number;
  };
  /** Rate limiting configuration */
  rateLimiter?: {
    max: number;
    duration: number;
  };
  /** Concurrency settings per queue */
  concurrency: Record<QueueName, number>;
}

/**
 * Worker configuration
 */
export interface WorkerConfig {
  /** Queue to process */
  queueName: QueueName;
  /** Number of concurrent jobs */
  concurrency: number;
  /** Lock duration in ms */
  lockDuration: number;
  /** Stalled job check interval */
  stalledInterval: number;
  /** Maximum stalled count before failure */
  maxStalledCount: number;
}

/**
 * Queue metrics for monitoring
 */
export interface QueueMetrics {
  /** Queue name */
  queueName: QueueName;
  /** Number of waiting jobs */
  waiting: number;
  /** Number of active jobs */
  active: number;
  /** Number of completed jobs */
  completed: number;
  /** Number of failed jobs */
  failed: number;
  /** Number of delayed jobs */
  delayed: number;
  /** Average processing time in ms */
  avgProcessingTime: number;
  /** Jobs processed per minute */
  throughput: number;
}

/**
 * Event types emitted by the queue system
 */
export type QueueEventType =
  | 'job:added'
  | 'job:active'
  | 'job:completed'
  | 'job:failed'
  | 'job:progress'
  | 'job:stalled'
  | 'job:removed'
  | 'queue:paused'
  | 'queue:resumed'
  | 'queue:drained';

/**
 * Queue event payload
 */
export interface QueueEvent {
  type: QueueEventType;
  queueName: QueueName;
  jobId?: string;
  timestamp: number;
  data?: unknown;
}
