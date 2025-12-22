/**
 * Text Analysis Worker
 * 
 * BullMQ worker for processing text analysis jobs using DeepSeek models.
 * Routes tasks to appropriate models based on complexity.
 * 
 * @see .kiro/specs/content-trends-ai-engine/design.md - Section 2
 */

import { Job } from 'bullmq';
import { Redis } from 'ioredis';
import {
  QueueName,
  WorkerConfig,
  TextAnalysisJobData,
} from '../types';
import { BaseWorker, ProcessingError, RateLimiterConfig } from './base-worker';
import {
  ContentTrendsAIRouter,
  getContentTrendsRouter,
  RoutingDecision,
} from '../../ai-router';
import {
  ReasoningChainManager,
  getReasoningChainManager,
  ReasoningChain,
} from '../../reasoning-chain-manager';

/**
 * Default worker configuration for text analysis
 */
const DEFAULT_CONFIG: WorkerConfig = {
  queueName: QueueName.TEXT_ANALYSIS,
  concurrency: 10, // Higher concurrency for text tasks
  lockDuration: 60000, // 1 minute
  stalledInterval: 15000, // 15 seconds
  maxStalledCount: 3,
};

/**
 * Default rate limiter for AI API calls
 */
const DEFAULT_RATE_LIMITER: RateLimiterConfig = {
  maxRequests: 100, // 100 requests per minute per user
  windowMs: 60000,
  keyPrefix: 'ratelimit:text-analysis',
};

/**
 * Text analysis worker result
 */
export interface TextAnalysisWorkerResult {
  routingDecision: RoutingDecision;
  response: string;
  reasoningChain?: ReasoningChain;
  processingTimeMs: number;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Text Analysis Worker
 * 
 * Processes text analysis tasks by routing them to the appropriate
 * AI model based on complexity and capturing reasoning chains.
 */
export class TextAnalysisWorker extends BaseWorker<
  TextAnalysisJobData,
  TextAnalysisWorkerResult
> {
  private router: ContentTrendsAIRouter;
  private reasoningManager: ReasoningChainManager;

  constructor(
    redis: Redis,
    config: Partial<WorkerConfig> = {},
    rateLimiter: RateLimiterConfig = DEFAULT_RATE_LIMITER,
    router?: ContentTrendsAIRouter,
    reasoningManager?: ReasoningChainManager
  ) {
    super(redis, { ...DEFAULT_CONFIG, ...config }, rateLimiter);
    this.router = router || getContentTrendsRouter();
    this.reasoningManager = reasoningManager || getReasoningChainManager();
  }

  /**
   * Process a text analysis job
   */
  protected async processJob(
    job: Job<TextAnalysisJobData>
  ): Promise<TextAnalysisWorkerResult> {
    const { task, content } = job.data;
    const startTime = Date.now();

    try {
      // Validate inputs
      if (!task) {
        throw new ProcessingError(
          'Analysis task is required',
          'INVALID_INPUT',
          false
        );
      }

      if (!content || content.trim().length === 0) {
        throw new ProcessingError(
          'Content is required for analysis',
          'INVALID_INPUT',
          false
        );
      }

      await job.updateProgress(10);

      // Route the task to appropriate model
      const routingDecision = this.router.routeTask(task);
      
      await job.log(
        `Task routed to ${routingDecision.selectedModel} (complexity: ${routingDecision.complexity})`
      );

      await job.updateProgress(30);

      // Execute the analysis
      const { response, reasoningChain, tokenUsage } = await this.executeAnalysis(
        content,
        task,
        routingDecision,
        job
      );

      await job.updateProgress(90);

      const processingTimeMs = Date.now() - startTime;

      await job.log(
        `Analysis completed in ${processingTimeMs}ms using ${routingDecision.selectedModel}`
      );

      await job.updateProgress(100);

      return {
        routingDecision,
        response,
        reasoningChain,
        processingTimeMs,
        tokenUsage,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await job.log(`Text analysis failed: ${errorMessage}`);

      if (error instanceof ProcessingError) {
        throw error;
      }

      throw new ProcessingError(
        `Text analysis failed: ${errorMessage}`,
        'PROCESSING_ERROR',
        true
      );
    }
  }

  /**
   * Execute the analysis using the routed model
   */
  private async executeAnalysis(
    content: string,
    task: TextAnalysisJobData['task'],
    routingDecision: RoutingDecision,
    job: Job<TextAnalysisJobData>
  ): Promise<{
    response: string;
    reasoningChain?: ReasoningChain;
    tokenUsage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  }> {
    const { selectedModel, parameters } = routingDecision;

    // Build the prompt based on task type
    const prompt = this.buildPrompt(content, task);

    // For DeepSeek R1, use reasoning chain management
    if (selectedModel === 'deepseek-r1') {
      return this.executeWithReasoning(prompt, parameters, job);
    }

    // For other models, execute directly
    return this.executeDirectly(prompt, selectedModel, parameters);
  }

  /**
   * Execute analysis with reasoning chain capture (DeepSeek R1)
   */
  private async executeWithReasoning(
    prompt: string,
    parameters: RoutingDecision['parameters'],
    job: Job<TextAnalysisJobData>
  ): Promise<{
    response: string;
    reasoningChain?: ReasoningChain;
    tokenUsage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  }> {
    // Build minimal system prompt to preserve reasoning
    const systemPrompt = this.reasoningManager.buildMinimalSystemPrompt(
      'You are an expert content analyst.'
    );

    // Build thinking prompt to encourage CoT
    const thinkingPrompt = this.reasoningManager.buildThinkingPrompt(prompt);

    // Simulate API call (in production, this would call the actual API)
    const rawResponse = await this.callDeepSeekR1(
      systemPrompt,
      thinkingPrompt,
      parameters
    );

    // Extract reasoning chain
    const reasoningChain = this.reasoningManager.extractReasoningChain(
      rawResponse,
      job.data.jobId
    );

    // Store reasoning chain
    this.reasoningManager.storeChain(reasoningChain);

    // Get clean response without reasoning tokens
    const response = this.reasoningManager.getCleanResponse(rawResponse);

    return {
      response,
      reasoningChain,
      tokenUsage: {
        promptTokens: Math.ceil(thinkingPrompt.length / 4),
        completionTokens: Math.ceil(rawResponse.length / 4),
        totalTokens: Math.ceil((thinkingPrompt.length + rawResponse.length) / 4),
      },
    };
  }

  /**
   * Execute analysis directly (DeepSeek V3 or other models)
   */
  private async executeDirectly(
    prompt: string,
    model: string,
    parameters: RoutingDecision['parameters']
  ): Promise<{
    response: string;
    tokenUsage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  }> {
    // Simulate API call (in production, this would call the actual API)
    const response = await this.callModel(model, prompt, parameters);

    return {
      response,
      tokenUsage: {
        promptTokens: Math.ceil(prompt.length / 4),
        completionTokens: Math.ceil(response.length / 4),
        totalTokens: Math.ceil((prompt.length + response.length) / 4),
      },
    };
  }

  /**
   * Build prompt based on task type
   */
  private buildPrompt(content: string, task: TextAnalysisJobData['task']): string {
    const taskPrompts: Record<string, string> = {
      'trend-analysis': `Analyze the following content for trending patterns and viral potential:\n\n${content}`,
      'sentiment-analysis': `Analyze the sentiment and emotional tone of the following content:\n\n${content}`,
      'content-classification': `Classify the following content by category, theme, and target audience:\n\n${content}`,
      'engagement-prediction': `Predict the engagement potential of the following content:\n\n${content}`,
      'viral-mechanism-detection': `Identify viral mechanisms and psychological triggers in the following content:\n\n${content}`,
    };

    return taskPrompts[task.type] || `Analyze the following content:\n\n${content}`;
  }

  /**
   * Call DeepSeek R1 API (placeholder - implement actual API call)
   */
  private async callDeepSeekR1(
    systemPrompt: string,
    userPrompt: string,
    parameters: RoutingDecision['parameters']
  ): Promise<string> {
    // In production, this would make an actual API call
    // For now, return a simulated response with reasoning
    return `<think>
Let me analyze this content step by step:
1. First, I'll identify the key themes and patterns
2. Then, I'll assess the emotional triggers
3. Finally, I'll evaluate viral potential
</think>

Based on my analysis, this content shows strong viral potential due to:
- Clear emotional hooks
- Relatable narrative structure
- Effective use of cognitive dissonance`;
  }

  /**
   * Call model API (placeholder - implement actual API call)
   */
  private async callModel(
    model: string,
    prompt: string,
    parameters: RoutingDecision['parameters']
  ): Promise<string> {
    // In production, this would make an actual API call
    // For now, return a simulated response
    return `Analysis complete. The content demonstrates effective engagement patterns.`;
  }

  /**
   * Handle job completion
   */
  protected onJobCompleted(job: Job<TextAnalysisJobData>): void {
    console.log(
      `Text analysis job ${job.id} completed for user ${job.data.userId}`
    );
  }

  /**
   * Handle job failure
   */
  protected onJobFailed(
    job: Job<TextAnalysisJobData> | undefined,
    error: Error
  ): void {
    console.error(
      `Text analysis job ${job?.id} failed:`,
      error.message
    );
  }
}

/**
 * Create a text analysis worker instance
 */
export function createTextAnalysisWorker(
  redis: Redis,
  config?: Partial<WorkerConfig>,
  rateLimiter?: RateLimiterConfig,
  router?: ContentTrendsAIRouter,
  reasoningManager?: ReasoningChainManager
): TextAnalysisWorker {
  return new TextAnalysisWorker(redis, config, rateLimiter, router, reasoningManager);
}
