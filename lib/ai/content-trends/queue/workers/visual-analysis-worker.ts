/**
 * Visual Analysis Worker
 * 
 * BullMQ worker for processing visual analysis jobs using Llama Vision.
 * Handles OCR, facial expression detection, editing dynamics analysis,
 * and visual element detection.
 * 
 * @see .kiro/specs/content-trends-ai-engine/design.md - Section 3
 */

import { Job } from 'bullmq';
import { Redis } from 'ioredis';
import {
  QueueName,
  WorkerConfig,
  VisualAnalysisJobData,
} from '../types';
import { BaseWorker, ProcessingError, RateLimiterConfig } from './base-worker';
import {
  LlamaVisionService,
  VisualAnalysisResult,
  createLlamaVisionService,
  AnalysisType,
} from '../../llama-vision-service';

/**
 * Default worker configuration for visual analysis
 */
const DEFAULT_CONFIG: WorkerConfig = {
  queueName: QueueName.VISUAL_ANALYSIS,
  concurrency: 5, // Higher concurrency for API-bound tasks
  lockDuration: 120000, // 2 minutes
  stalledInterval: 30000, // 30 seconds
  maxStalledCount: 3,
};

/**
 * Default rate limiter for Llama Vision API
 */
const DEFAULT_RATE_LIMITER: RateLimiterConfig = {
  maxRequests: 60, // 60 requests per minute per user
  windowMs: 60000,
  keyPrefix: 'ratelimit:visual-analysis',
};

/**
 * Visual analysis worker result
 */
export interface VisualAnalysisWorkerResult {
  results: VisualAnalysisResult[];
  processingTimeMs: number;
  imageCount: number;
  analysisTypes: string[];
}

/**
 * Visual Analysis Worker
 * 
 * Processes images using Llama Vision for various analysis types
 * including OCR, facial expressions, and editing dynamics.
 */
export class VisualAnalysisWorker extends BaseWorker<
  VisualAnalysisJobData,
  VisualAnalysisWorkerResult
> {
  private visionService: LlamaVisionService;

  constructor(
    redis: Redis,
    config: Partial<WorkerConfig> = {},
    rateLimiter: RateLimiterConfig = DEFAULT_RATE_LIMITER,
    visionService?: LlamaVisionService
  ) {
    super(redis, { ...DEFAULT_CONFIG, ...config }, rateLimiter);
    this.visionService = visionService || createLlamaVisionService();
  }

  /**
   * Process a visual analysis job
   */
  protected async processJob(
    job: Job<VisualAnalysisJobData>
  ): Promise<VisualAnalysisWorkerResult> {
    const { imageUrls, analysisTypes } = job.data;
    const startTime = Date.now();

    try {
      // Validate inputs
      if (!imageUrls || imageUrls.length === 0) {
        throw new ProcessingError(
          'At least one image URL is required',
          'INVALID_INPUT',
          false
        );
      }

      if (!analysisTypes || analysisTypes.length === 0) {
        throw new ProcessingError(
          'At least one analysis type is required',
          'INVALID_INPUT',
          false
        );
      }

      await job.updateProgress(10);

      // Process each image
      const results: VisualAnalysisResult[] = [];
      const totalImages = imageUrls.length;

      for (let i = 0; i < totalImages; i++) {
        const imageUrl = imageUrls[i];
        
        try {
          const result = await this.analyzeImage(imageUrl, analysisTypes);
          results.push(result);
        } catch (error) {
          // Log individual image failures but continue processing
          await job.log(
            `Failed to analyze image ${i + 1}/${totalImages}: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          );
          
          // Add a partial result with error info
          results.push({
            imageUrl,
            error: error instanceof Error ? error.message : 'Unknown error',
          } as VisualAnalysisResult);
        }

        // Update progress
        const progress = 10 + Math.floor((i + 1) / totalImages * 80);
        await job.updateProgress(progress);
      }

      await job.updateProgress(95);

      const processingTimeMs = Date.now() - startTime;

      // Log completion
      const successCount = results.filter(r => !('error' in r)).length;
      await job.log(
        `Visual analysis completed: ${successCount}/${totalImages} images analyzed successfully`
      );

      await job.updateProgress(100);

      return {
        results,
        processingTimeMs,
        imageCount: totalImages,
        analysisTypes,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await job.log(`Visual analysis failed: ${errorMessage}`);

      if (error instanceof ProcessingError) {
        throw error;
      }

      throw new ProcessingError(
        `Visual analysis failed: ${errorMessage}`,
        'PROCESSING_ERROR',
        true
      );
    }
  }

  /**
   * Analyze a single image with specified analysis types
   */
  private async analyzeImage(
    imageUrl: string,
    analysisTypes: string[]
  ): Promise<VisualAnalysisResult> {
    const result: VisualAnalysisResult = {
      imageUrl,
      timestamp: Date.now(),
    };

    // Map string types to AnalysisType enum
    const typeMap: Record<string, AnalysisType> = {
      'ocr': 'ocr',
      'facial': 'facial_expression',
      'editing': 'editing_dynamics',
      'elements': 'visual_elements',
      'caption': 'dense_caption',
    };

    for (const type of analysisTypes) {
      const analysisType = typeMap[type];
      
      if (!analysisType) {
        continue;
      }

      try {
        const analysisResult = await this.visionService.analyzeImage({
          imageUrl,
          analysisType,
        });

        // Merge results based on type
        switch (type) {
          case 'ocr':
            result.ocr = analysisResult.ocr;
            break;
          case 'facial':
            result.facialExpressions = analysisResult.facialExpressions;
            break;
          case 'editing':
            result.editingDynamics = analysisResult.editingDynamics;
            break;
          case 'elements':
            result.visualElements = analysisResult.visualElements;
            break;
          case 'caption':
            result.denseCaption = analysisResult.denseCaption;
            break;
        }
      } catch (error) {
        // Log but continue with other analysis types
        console.warn(
          `Analysis type ${type} failed for ${imageUrl}:`,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }

    return result;
  }

  /**
   * Handle job completion
   */
  protected onJobCompleted(job: Job<VisualAnalysisJobData>): void {
    console.log(
      `Visual analysis job ${job.id} completed for user ${job.data.userId}`
    );
  }

  /**
   * Handle job failure
   */
  protected onJobFailed(
    job: Job<VisualAnalysisJobData> | undefined,
    error: Error
  ): void {
    console.error(
      `Visual analysis job ${job?.id} failed:`,
      error.message
    );
  }
}

/**
 * Create a visual analysis worker instance
 */
export function createVisualAnalysisWorker(
  redis: Redis,
  config?: Partial<WorkerConfig>,
  rateLimiter?: RateLimiterConfig,
  visionService?: LlamaVisionService
): VisualAnalysisWorker {
  return new VisualAnalysisWorker(redis, config, rateLimiter, visionService);
}
