/**
 * Video Processing Worker
 * 
 * BullMQ worker for processing video analysis jobs.
 * Handles keyframe extraction, composite grid generation,
 * and blob storage upload.
 * 
 * @see .kiro/specs/content-trends-ai-engine/design.md - Section 3
 */

import { Job } from 'bullmq';
import { Redis } from 'ioredis';
import {
  QueueName,
  WorkerConfig,
  VideoProcessingJobData,
} from '../types';
import { BaseWorker, ProcessingError } from './base-worker';
import {
  VideoProcessor,
  VideoProcessingResult,
  createVideoProcessor,
} from '../../video-processor';

/**
 * Default worker configuration for video processing
 */
const DEFAULT_CONFIG: WorkerConfig = {
  queueName: QueueName.VIDEO_PROCESSING,
  concurrency: 2, // Limited due to CPU-intensive FFmpeg operations
  lockDuration: 300000, // 5 minutes - video processing can be slow
  stalledInterval: 60000, // 1 minute
  maxStalledCount: 2,
};

/**
 * Video processing worker result
 */
export interface VideoProcessingWorkerResult {
  processingResult: VideoProcessingResult;
  processingTimeMs: number;
  keyframeCount: number;
}

/**
 * Video Processing Worker
 * 
 * Processes video files to extract keyframes and generate
 * composite grid images for visual analysis.
 */
export class VideoProcessingWorker extends BaseWorker<
  VideoProcessingJobData,
  VideoProcessingWorkerResult
> {
  private videoProcessor: VideoProcessor;

  constructor(
    redis: Redis,
    config: Partial<WorkerConfig> = {},
    videoProcessor?: VideoProcessor
  ) {
    super(redis, { ...DEFAULT_CONFIG, ...config });
    this.videoProcessor = videoProcessor || createVideoProcessor();
  }

  /**
   * Process a video processing job
   */
  protected async processJob(
    job: Job<VideoProcessingJobData>
  ): Promise<VideoProcessingWorkerResult> {
    const { videoSource, gridLayout, uploadToBlob, sceneChangeThreshold } = job.data;
    const startTime = Date.now();

    try {
      // Update job progress
      await job.updateProgress(10);

      // Validate video source
      if (!videoSource) {
        throw new ProcessingError(
          'Video source is required',
          'INVALID_INPUT',
          false
        );
      }

      await job.updateProgress(20);

      // Process the video
      const processingResult = await this.videoProcessor.processVideo(
        videoSource,
        {
          gridLayout,
          uploadToBlob,
          sceneChangeThreshold,
        }
      );

      await job.updateProgress(90);

      const processingTimeMs = Date.now() - startTime;

      // Log completion
      await job.log(
        `Video processed successfully: ${processingResult.keyframes.length} keyframes extracted`
      );

      await job.updateProgress(100);

      return {
        processingResult,
        processingTimeMs,
        keyframeCount: processingResult.keyframes.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await job.log(`Video processing failed: ${errorMessage}`);

      if (error instanceof ProcessingError) {
        throw error;
      }

      // Wrap unknown errors
      throw new ProcessingError(
        `Video processing failed: ${errorMessage}`,
        'PROCESSING_ERROR',
        true
      );
    }
  }

  /**
   * Handle job completion
   */
  protected onJobCompleted(job: Job<VideoProcessingJobData>): void {
    console.log(
      `Video processing job ${job.id} completed for user ${job.data.userId}`
    );
  }

  /**
   * Handle job failure
   */
  protected onJobFailed(
    job: Job<VideoProcessingJobData> | undefined,
    error: Error
  ): void {
    console.error(
      `Video processing job ${job?.id} failed:`,
      error.message
    );
  }
}

/**
 * Create a video processing worker instance
 */
export function createVideoProcessingWorker(
  redis: Redis,
  config?: Partial<WorkerConfig>,
  videoProcessor?: VideoProcessor
): VideoProcessingWorker {
  return new VideoProcessingWorker(redis, config, videoProcessor);
}
