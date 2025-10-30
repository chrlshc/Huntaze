/**
 * AI Model Router for Huntaze
 * 
 * Intelligent routing system that selects the optimal AI model based on:
 * - Task type and complexity
 * - Cost optimization (80-95% on mini models)
 * - Quality requirements (critical tasks use full models)
 * 
 * @module ai-router
 * @see {@link https://platform.openai.com/docs/guides/prompt-caching} for caching details
 */

export type TaskType =
  | 'chatbot'
  | 'moderation'
  | 'marketing_template'
  | 'basic_analytics'
  | 'sentiment_simple'
  | 'code'
  | 'strategy'
  | 'advanced_analytics'
  | 'compliance'
  | 'legal'
  | 'documentation';

export type ModelName = 'gpt-4o' | 'gpt-4o-mini';

export interface RoutingDecision {
  model: ModelName;
  reason: string;
  estimatedCost: string;
  useCache: boolean;
}

export interface RouteRequest {
  taskType: TaskType;
  complexityScore: number; // 0-10
  isCritical: boolean;
  outputLength?: 'short' | 'medium' | 'long'; // <100, 100-500, >500 tokens
  requiresReasoning?: boolean;
}

/**
 * API Response types for OpenAI integration
 */
export interface AIRouterAPIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: AIRouterError;
  metadata?: {
    model: ModelName;
    tokensUsed: number;
    cacheHit: boolean;
    latencyMs: number;
    requestId: string;
  };
}

export interface AIRouterError {
  code: string;
  message: string;
  details?: unknown;
  retryable: boolean;
  retryAfter?: number; // seconds
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

/**
 * API call options
 */
export interface AIRouterCallOptions {
  timeout?: number; // milliseconds
  retryConfig?: Partial<RetryConfig>;
  signal?: AbortSignal;
  metadata?: Record<string, unknown>;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableErrors: [
    'RATE_LIMIT_EXCEEDED',
    'TIMEOUT',
    'NETWORK_ERROR',
    'SERVICE_UNAVAILABLE',
    'INTERNAL_SERVER_ERROR',
  ],
};

/**
 * Logger utility for debugging
 */
const logger = {
  debug: (message: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_AI_ROUTER) {
      console.log(`[AI-Router Debug] ${message}`, data || '');
    }
  },
  info: (message: string, data?: unknown) => {
    console.log(`[AI-Router] ${message}`, data || '');
  },
  warn: (message: string, data?: unknown) => {
    console.warn(`[AI-Router Warning] ${message}`, data || '');
  },
  error: (message: string, error?: unknown) => {
    console.error(`[AI-Router Error] ${message}`, error || '');
  },
};

/**
 * Routes AI requests to the optimal model based on task characteristics
 * 
 * @param request - The routing request with task details
 * @returns Routing decision with model selection and reasoning
 * @throws {Error} If request validation fails
 * 
 * @example
 * ```typescript
 * const decision = routeAIRequest({
 *   taskType: 'chatbot',
 *   complexityScore: 3,
 *   isCritical: false,
 *   outputLength: 'short'
 * });
 * console.log(decision.model); // 'gpt-4o-mini'
 * ```
 */
export function routeAIRequest(request: RouteRequest): RoutingDecision {
  try {
    // Validate input
    validateRouteRequest(request);

    const { taskType, complexityScore, isCritical, outputLength, requiresReasoning } = request;

    logger.debug('Routing AI request', { taskType, complexityScore, isCritical });

    // Critical tasks always use full model (compliance, legal)
    if (isCritical || taskType === 'compliance' || taskType === 'legal') {
      logger.info('Routing to gpt-4o for critical task', { taskType });
      return {
        model: 'gpt-4o',
        reason: 'Critical task requiring zero-tolerance accuracy',
        estimatedCost: '$0.025-0.10 per request',
        useCache: true,
      };
    }

    // High complexity or reasoning-heavy tasks
    if (complexityScore >= 7 || requiresReasoning) {
      logger.info('Routing to gpt-4o for high complexity', { complexityScore, requiresReasoning });
      return {
        model: 'gpt-4o',
        reason: 'High complexity requiring advanced reasoning',
        estimatedCost: '$0.025-0.10 per request',
        useCache: true,
      };
    }

    // Long output tasks (>500 tokens)
    if (outputLength === 'long') {
      logger.info('Routing to gpt-4o for long output', { outputLength });
      return {
        model: 'gpt-4o',
        reason: 'Long-form output requiring precision',
        estimatedCost: '$0.05-0.15 per request',
        useCache: true,
      };
    }

    // Strategy and advanced analytics
    if (taskType === 'strategy' || taskType === 'advanced_analytics' || taskType === 'code') {
      logger.info('Routing to gpt-4o for strategic task', { taskType });
      return {
        model: 'gpt-4o',
        reason: 'Strategic planning or complex analysis',
        estimatedCost: '$0.025-0.10 per request',
        useCache: true,
      };
    }

    // High-volume, simple tasks use mini (80-95% of requests)
    const miniTasks: TaskType[] = [
      'chatbot',
      'moderation',
      'marketing_template',
      'basic_analytics',
      'sentiment_simple',
    ];

    if (miniTasks.includes(taskType) && complexityScore < 6) {
      logger.debug('Routing to gpt-4o-mini for simple task', { taskType, complexityScore });
      return {
        model: 'gpt-4o-mini',
        reason: 'High-volume simple task optimized for cost',
        estimatedCost: '$0.002-0.003 per request',
        useCache: true,
      };
    }

    // Default: mini for everything else
    logger.debug('Routing to gpt-4o-mini (default)', { taskType, complexityScore });
    return {
      model: 'gpt-4o-mini',
      reason: 'Standard task with moderate complexity',
      estimatedCost: '$0.002-0.003 per request',
      useCache: true,
    };
  } catch (error) {
    logger.error('Failed to route AI request', error);
    // Fallback to mini model on error
    return {
      model: 'gpt-4o-mini',
      reason: 'Fallback due to routing error',
      estimatedCost: '$0.002-0.003 per request',
      useCache: true,
    };
  }
}

/**
 * Validates route request parameters
 * @throws {Error} If validation fails
 */
function validateRouteRequest(request: RouteRequest): void {
  if (!request.taskType) {
    throw new Error('taskType is required');
  }

  if (typeof request.complexityScore !== 'number') {
    throw new Error('complexityScore must be a number');
  }

  if (request.complexityScore < 0 || request.complexityScore > 10) {
    throw new Error('complexityScore must be between 0 and 10');
  }

  if (typeof request.isCritical !== 'boolean') {
    throw new Error('isCritical must be a boolean');
  }

  const validOutputLengths = ['short', 'medium', 'long'];
  if (request.outputLength && !validOutputLengths.includes(request.outputLength)) {
    throw new Error(`outputLength must be one of: ${validOutputLengths.join(', ')}`);
  }
}

/**
 * Retry with exponential backoff
 * 
 * @param fn - Async function to retry
 * @param config - Retry configuration
 * @returns Promise with function result
 * 
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   () => fetch('/api/ai'),
 *   { maxAttempts: 3, initialDelayMs: 1000 }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error;

  for (let attempt = 0; attempt < finalConfig.maxAttempts; attempt++) {
    try {
      logger.debug(`Attempt ${attempt + 1}/${finalConfig.maxAttempts}`);
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Check if error is retryable
      const errorCode = (error as any)?.code || 'UNKNOWN_ERROR';
      const isRetryable = finalConfig.retryableErrors.includes(errorCode);

      if (!isRetryable || attempt === finalConfig.maxAttempts - 1) {
        logger.error(`Non-retryable error or max attempts reached`, error);
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        finalConfig.initialDelayMs * Math.pow(finalConfig.backoffMultiplier, attempt),
        finalConfig.maxDelayMs
      );

      logger.warn(`Retrying after ${delay}ms (attempt ${attempt + 1})`, { errorCode });
      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Make API call with timeout and retry
 * 
 * @param url - API endpoint
 * @param options - Fetch options and retry config
 * @returns API response
 * 
 * @example
 * ```typescript
 * const response = await makeAPICall('/api/ai/chat', {
 *   method: 'POST',
 *   body: JSON.stringify({ message: 'Hello' }),
 *   timeout: 30000,
 *   retryConfig: { maxAttempts: 3 }
 * });
 * ```
 */
export async function makeAPICall<T = unknown>(
  url: string,
  options: RequestInit & AIRouterCallOptions = {}
): Promise<AIRouterAPIResponse<T>> {
  const { timeout = 30000, retryConfig, signal, metadata, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await retryWithBackoff(
      async () => {
        const startTime = Date.now();
        
        const res = await fetch(url, {
          ...fetchOptions,
          signal: signal || controller.signal,
        });

        const latencyMs = Date.now() - startTime;

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw {
            code: errorData.code || `HTTP_${res.status}`,
            message: errorData.message || res.statusText,
            details: errorData,
            retryable: res.status >= 500 || res.status === 429,
          };
        }

        const data = await res.json();

        return {
          success: true,
          data: data as T,
          metadata: {
            ...metadata,
            latencyMs,
            requestId: res.headers.get('x-request-id') || '',
          },
        } as AIRouterAPIResponse<T>;
      },
      retryConfig
    );

    return response;
  } catch (error) {
    logger.error('API call failed', error);
    
    return {
      success: false,
      error: {
        code: (error as any)?.code || 'UNKNOWN_ERROR',
        message: (error as any)?.message || 'API call failed',
        details: error,
        retryable: (error as any)?.retryable || false,
      },
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Estimates complexity score based on input characteristics
 * 
 * @param input - Input characteristics
 * @returns Complexity score (0-10)
 * 
 * @example
 * ```typescript
 * const score = estimateComplexity({
 *   messageLength: 500,
 *   hasMultipleSteps: true,
 *   requiresContext: false,
 *   isCreative: false
 * });
 * console.log(score); // 5
 * ```
 */
export function estimateComplexity(input: {
  messageLength: number;
  hasMultipleSteps: boolean;
  requiresContext: boolean;
  isCreative: boolean;
}): number {
  let score = 0;

  // Base complexity from message length
  if (input.messageLength > 1000) score += 3;
  else if (input.messageLength > 500) score += 2;
  else if (input.messageLength > 200) score += 1;

  // Multi-step reasoning
  if (input.hasMultipleSteps) score += 3;

  // Context requirements
  if (input.requiresContext) score += 2;

  // Creative tasks
  if (input.isCreative) score += 2;

  return Math.min(score, 10);
}

/**
 * Builds optimized prompt structure for caching
 * Static content first, dynamic content last
 * 
 * @param params - Prompt parameters
 * @returns Structured prompt with system and user messages
 * 
 * @example
 * ```typescript
 * const prompt = buildCachedPrompt({
 *   systemInstructions: 'You are a helpful assistant',
 *   examples: 'Example 1: ...',
 *   guidelines: 'Always be polite',
 *   userData: 'User: John',
 *   userQuery: 'What is AI?'
 * });
 * ```
 */
export function buildCachedPrompt(params: {
  systemInstructions: string; // Static - will be cached
  examples?: string; // Static - will be cached
  guidelines?: string; // Static - will be cached
  userData: string; // Dynamic - not cached
  userQuery: string; // Dynamic - not cached
}): { system: string; user: string } {
  // Static content (cached after first request - 90% cost reduction)
  const staticContent = [
    params.systemInstructions,
    params.examples || '',
    params.guidelines || '',
  ]
    .filter(Boolean)
    .join('\n\n');

  // Dynamic content (always fresh)
  const dynamicContent = [
    `Context: ${params.userData}`,
    `Query: ${params.userQuery}`,
  ].join('\n\n');

  return {
    system: staticContent,
    user: dynamicContent,
  };
}

/**
 * Cost estimation per 1000 requests
 * 
 * @param params - Cost parameters
 * @returns Cost breakdown and savings
 * 
 * @example
 * ```typescript
 * const costs = estimateMonthlyCost({
 *   requestsPerDay: 10000,
 *   avgInputTokens: 500,
 *   avgOutputTokens: 200,
 *   miniPercentage: 85
 * });
 * console.log(costs.totalCost); // $45.50
 * console.log(costs.savings); // $120.00
 * ```
 */
export function estimateMonthlyCost(params: {
  requestsPerDay: number;
  avgInputTokens: number;
  avgOutputTokens: number;
  miniPercentage: number; // 0-100
}): {
  miniCost: number;
  fullCost: number;
  totalCost: number;
  savings: number;
} {
  const monthlyRequests = params.requestsPerDay * 30;
  const miniRequests = monthlyRequests * (params.miniPercentage / 100);
  const fullRequests = monthlyRequests - miniRequests;

  // Pricing per 1M tokens (with 90% cache hit rate)
  const miniInputPrice = 0.15 * 0.1; // $0.015 with cache
  const miniOutputPrice = 0.6;
  const fullInputPrice = 2.5 * 0.1; // $0.25 with cache
  const fullOutputPrice = 10.0;

  // Calculate costs
  const miniCost =
    (miniRequests / 1_000_000) *
    (params.avgInputTokens * miniInputPrice + params.avgOutputTokens * miniOutputPrice);

  const fullCost =
    (fullRequests / 1_000_000) *
    (params.avgInputTokens * fullInputPrice + params.avgOutputTokens * fullOutputPrice);

  const totalCost = miniCost + fullCost;

  // Calculate savings vs all-full-model
  const allFullCost =
    (monthlyRequests / 1_000_000) *
    (params.avgInputTokens * fullInputPrice + params.avgOutputTokens * fullOutputPrice);

  const savings = allFullCost - totalCost;

  return {
    miniCost: Math.round(miniCost * 100) / 100,
    fullCost: Math.round(fullCost * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    savings: Math.round(savings * 100) / 100,
  };
}
