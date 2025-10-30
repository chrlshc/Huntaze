/**
 * AI Service - Unified AI Provider Integration
 * 
 * This service provides a unified interface for multiple AI providers (OpenAI, Azure OpenAI, Claude)
 * with built-in features:
 * - Automatic retry with exponential backoff
 * - Response caching for performance
 * - Rate limiting per user
 * - Provider fallback on failures
 * - Structured error handling
 * - Comprehensive logging
 * 
 * @example Basic Usage
 * ```typescript
 * const aiService = getAIService();
 * const response = await aiService.generateText({
 *   prompt: "Write a friendly message to a fan",
 *   context: {
 *     userId: "user-123",
 *     contentType: "message"
 *   }
 * });
 * console.log(response.content);
 * ```
 * 
 * @example With Options
 * ```typescript
 * const response = await aiService.generateText({
 *   prompt: "Generate a caption",
 *   context: { userId: "user-123", contentType: "caption" },
 *   options: {
 *     temperature: 0.9,
 *     maxTokens: 500,
 *     model: "gpt-4",
 *     timeout: 15000
 *   }
 * }, "openai");
 * ```
 * 
 * @example Error Handling
 * ```typescript
 * try {
 *   const response = await aiService.generateText(request);
 * } catch (error) {
 *   if (error instanceof AIServiceError) {
 *     if (error.type === AIErrorType.RATE_LIMIT) {
 *       console.log(`Rate limited. Retry after ${error.retryAfter}ms`);
 *     }
 *   }
 * }
 * ```
 * 
 * ## API Endpoints
 * 
 * ### OpenAI / Azure OpenAI
 * - **Standard OpenAI**: `https://api.openai.com/v1/chat/completions`
 * - **Azure OpenAI**: `{baseURL}/openai/deployments/{model}/chat/completions?api-version={version}`
 * 
 * **Authentication**:
 * - OpenAI: `Authorization: Bearer {apiKey}`
 * - Azure: `api-key: {apiKey}`
 * 
 * **Request Body**:
 * ```json
 * {
 *   "model": "gpt-4o-mini",
 *   "messages": [
 *     { "role": "system", "content": "..." },
 *     { "role": "user", "content": "..." }
 *   ],
 *   "temperature": 0.7,
 *   "max_tokens": 1000,
 *   "user": "user-id"
 * }
 * ```
 * 
 * **Response**:
 * ```json
 * {
 *   "choices": [{ "message": { "content": "..." }, "finish_reason": "stop" }],
 *   "usage": { "prompt_tokens": 10, "completion_tokens": 20, "total_tokens": 30 },
 *   "model": "gpt-4o-mini"
 * }
 * ```
 * 
 * ### Claude (Anthropic)
 * - **Endpoint**: `https://api.anthropic.com/v1/messages`
 * 
 * **Authentication**: `x-api-key: {apiKey}`
 * 
 * **Request Body**:
 * ```json
 * {
 *   "model": "claude-3-haiku-20240307",
 *   "max_tokens": 1000,
 *   "temperature": 0.7,
 *   "system": "...",
 *   "messages": [{ "role": "user", "content": "..." }]
 * }
 * ```
 * 
 * **Response**:
 * ```json
 * {
 *   "content": [{ "text": "..." }],
 *   "usage": { "input_tokens": 10, "output_tokens": 20 },
 *   "model": "claude-3-haiku-20240307",
 *   "stop_reason": "end_turn"
 * }
 * ```
 * 
 * ## Configuration
 * 
 * ### Environment Variables
 * ```bash
 * # OpenAI (Standard)
 * OPENAI_API_KEY=sk-...
 * OPENAI_BASE_URL=https://api.openai.com/v1  # Optional
 * 
 * # Azure OpenAI
 * AZURE_OPENAI_API_KEY=...
 * AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
 * AZURE_OPENAI_API_VERSION=2024-02-15-preview
 * 
 * # Claude
 * ANTHROPIC_API_KEY=sk-ant-...
 * 
 * # Service Configuration
 * DEFAULT_AI_PROVIDER=openai  # or claude
 * NODE_ENV=production  # Enables caching
 * ```
 * 
 * ## Rate Limits
 * 
 * ### OpenAI
 * - 60 requests/minute
 * - 3,000 requests/hour
 * - 10,000 requests/day
 * 
 * ### Claude
 * - 50 requests/minute
 * - 1,000 requests/hour
 * - 5,000 requests/day
 * 
 * ## Error Codes
 * 
 * | Status | Error Type | Retryable | Description |
 * |--------|-----------|-----------|-------------|
 * | 400 | INVALID_REQUEST | No | Bad request format |
 * | 401 | AUTHENTICATION | No | Invalid API key |
 * | 403 | AUTHENTICATION | No | Forbidden |
 * | 429 | RATE_LIMIT | Yes | Rate limit exceeded |
 * | 500 | SERVER_ERROR | Yes | Internal server error |
 * | 502 | SERVER_ERROR | Yes | Bad gateway |
 * | 503 | SERVER_ERROR | Yes | Service unavailable |
 * | 504 | SERVER_ERROR | Yes | Gateway timeout |
 * | - | NETWORK_ERROR | Yes | Network connectivity issue |
 * | - | TIMEOUT | Yes | Request timeout |
 * 
 * @module ai-service
 */

import { z } from 'zod';

// AI Provider types
export type AIProvider = 'openai' | 'claude' | 'gemini';

/**
 * AI Service Error Types
 * Categorizes errors for better handling and retry logic
 */
export enum AIErrorType {
  RATE_LIMIT = 'RATE_LIMIT',
  AUTHENTICATION = 'AUTHENTICATION',
  INVALID_REQUEST = 'INVALID_REQUEST',
  SERVER_ERROR = 'SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  CONTENT_FILTER = 'CONTENT_FILTER',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Custom AI Service Error
 * Provides detailed error information for debugging and handling
 */
export class AIServiceError extends Error {
  constructor(
    message: string,
    public type: AIErrorType,
    public provider: AIProvider,
    public statusCode?: number,
    public retryable: boolean = false,
    public retryAfter?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'AIServiceError';
    Object.setPrototypeOf(this, AIServiceError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      provider: this.provider,
      statusCode: this.statusCode,
      retryable: this.retryable,
      retryAfter: this.retryAfter,
    };
  }
}

// Request/Response schemas
const AIOptionsSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(4000).optional(),
  model: z.string().optional(),
  timeout: z.number().min(1000).max(60000).optional(), // 1s to 60s
});

const AIContextSchema = z.object({
  userId: z.string(),
  contentType: z.enum(['message', 'caption', 'idea', 'pricing', 'timing']).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const AIRequestSchema = z.object({
  prompt: z.string().min(1),
  context: AIContextSchema,
  options: AIOptionsSchema.optional(),
});

export const AIResponseSchema = z.object({
  content: z.string(),
  usage: z.object({
    promptTokens: z.number(),
    completionTokens: z.number(),
    totalTokens: z.number(),
  }),
  model: z.string(),
  provider: z.enum(['openai', 'claude', 'gemini']),
  finishReason: z.enum(['stop', 'length', 'content_filter']),
  metadata: z.record(z.string(), z.unknown()).optional(),
  cached: z.boolean().optional(),
  latencyMs: z.number().optional(),
});

export type AIRequest = z.infer<typeof AIRequestSchema>;
export type AIResponse = z.infer<typeof AIResponseSchema>;

/**
 * Retry Configuration
 * Controls retry behavior for failed API calls
 */
export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: AIErrorType[];
}

// Rate limiting and caching
interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
}

interface CacheConfig {
  enabled: boolean;
  ttlSeconds: number;
  maxSize: number;
}

// AI Provider interface
export interface AIProviderInterface {
  name: AIProvider;
  generateText(request: AIRequest): Promise<AIResponse>;
  isAvailable(): Promise<boolean>;
  getRateLimit(): RateLimitConfig;
}

// OpenAI Provider (supports Azure OpenAI)
export class OpenAIProvider implements AIProviderInterface {
  name: AIProvider = 'openai';
  private apiKey: string;
  private baseURL: string;
  private isAzure: boolean;
  private apiVersion: string;
  private logger: Logger;

  constructor(
    apiKey: string, 
    baseURL = 'https://api.openai.com/v1',
    options?: { isAzure?: boolean; apiVersion?: string; logger?: Logger }
  ) {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
    this.isAzure = options?.isAzure || false;
    this.apiVersion = options?.apiVersion || '2024-02-15-preview';
    this.logger = options?.logger || new ConsoleLogger('OpenAIProvider');
  }

  /**
   * Generate text using OpenAI/Azure OpenAI API
   * @param request - AI request with prompt and context
   * @returns AI response with generated content
   * @throws AIServiceError on API failures
   */
  async generateText(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    const { prompt, context, options } = request;
    
    this.logger.debug('Generating text', {
      userId: context.userId,
      contentType: context.contentType,
      promptLength: prompt.length,
      model: options?.model || 'gpt-4o-mini',
      isAzure: this.isAzure,
    });
    
    try {
      // Build URL based on Azure or standard OpenAI
      const url = this.isAzure 
        ? `${this.baseURL}/openai/deployments/${options?.model || 'gpt-4o-mini'}/chat/completions?api-version=${this.apiVersion}`
        : `${this.baseURL}/chat/completions`;
      
      // Build headers based on Azure or standard OpenAI
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (this.isAzure) {
        headers['api-key'] = this.apiKey;
      } else {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }
      
      const requestBody = {
        model: options?.model || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(context.contentType),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 1000,
        user: context.userId,
      };

      this.logger.debug('Sending request to OpenAI', { url, model: requestBody.model });

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeout = options?.timeout || 30000; // 30s default
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      let response: Response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || response.statusText;
        
        this.logger.error('OpenAI API error', {
          status: response.status,
          message: errorMessage,
          latencyMs,
        });

        throw this.createError(response.status, errorMessage, errorData);
      }

      const data = await response.json();
      const choice = data.choices[0];

      this.logger.info('Text generated successfully', {
        model: data.model,
        tokensUsed: data.usage.total_tokens,
        latencyMs,
      });

      return {
        content: choice.message.content,
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        },
        model: data.model,
        provider: 'openai',
        finishReason: choice.finish_reason === 'stop' ? 'stop' : 
                     choice.finish_reason === 'length' ? 'length' : 'content_filter',
        latencyMs,
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      
      if (error instanceof AIServiceError) {
        throw error;
      }

      // Handle abort/timeout
      if (error instanceof Error && error.name === 'AbortError') {
        this.logger.error('Request timeout', { latencyMs });
        throw new AIServiceError(
          'Request timeout',
          AIErrorType.TIMEOUT,
          'openai',
          undefined,
          true,
          undefined,
          error
        );
      }

      // Handle network errors
      if (error instanceof TypeError) {
        this.logger.error('Network error', { error: error.message, latencyMs });
        throw new AIServiceError(
          'Network error: ' + error.message,
          AIErrorType.NETWORK_ERROR,
          'openai',
          undefined,
          true,
          undefined,
          error
        );
      }

      this.logger.error('Unknown error', { error, latencyMs });
      throw new AIServiceError(
        error instanceof Error ? error.message : 'Unknown error',
        AIErrorType.UNKNOWN,
        'openai',
        undefined,
        false,
        undefined,
        error
      );
    }
  }

  /**
   * Create appropriate error based on HTTP status code
   */
  private createError(status: number, message: string, errorData: any): AIServiceError {
    let errorType: AIErrorType;
    let retryable = false;
    let retryAfter: number | undefined;

    switch (status) {
      case 401:
      case 403:
        errorType = AIErrorType.AUTHENTICATION;
        break;
      case 429:
        errorType = AIErrorType.RATE_LIMIT;
        retryable = true;
        retryAfter = errorData.error?.retry_after 
          ? errorData.error.retry_after * 1000 
          : 60000; // 1 minute default
        break;
      case 400:
        errorType = AIErrorType.INVALID_REQUEST;
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        errorType = AIErrorType.SERVER_ERROR;
        retryable = true;
        break;
      default:
        errorType = AIErrorType.UNKNOWN;
        retryable = status >= 500;
    }

    return new AIServiceError(
      message,
      errorType,
      'openai',
      status,
      retryable,
      retryAfter
    );
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Azure OpenAI doesn't have a /models endpoint, so we just return true if configured
      if (this.isAzure) {
        return true;
      }
      
      const response = await fetch(`${this.baseURL}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  getRateLimit(): RateLimitConfig {
    return {
      requestsPerMinute: 60,
      requestsPerHour: 3000,
      requestsPerDay: 10000,
    };
  }

  private getSystemPrompt(contentType?: string): string {
    const basePrompt = `You are an AI assistant for Huntaze, a platform for content creators. You help creators optimize their content, messaging, and monetization strategies.`;
    
    switch (contentType) {
      case 'message':
        return `${basePrompt} You specialize in creating personalized, engaging messages for fans that drive engagement and sales. Be friendly, authentic, and persuasive.`;
      case 'caption':
        return `${basePrompt} You create compelling captions for social media posts that maximize engagement. Include relevant emojis and hashtags when appropriate.`;
      case 'idea':
        return `${basePrompt} You generate creative content ideas based on trends, performance data, and audience preferences. Be innovative and data-driven.`;
      case 'pricing':
        return `${basePrompt} You provide pricing optimization recommendations based on market data, audience behavior, and performance metrics. Be analytical and strategic.`;
      case 'timing':
        return `${basePrompt} You analyze optimal timing for content publication and message sending based on audience activity patterns. Be precise and data-focused.`;
      default:
        return basePrompt;
    }
  }
}

// Claude Provider
export class ClaudeProvider implements AIProviderInterface {
  name: AIProvider = 'claude';
  private apiKey: string;
  private baseURL: string;
  private logger: Logger;

  constructor(apiKey: string, baseURL = 'https://api.anthropic.com/v1', logger?: Logger) {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
    this.logger = logger || new ConsoleLogger('ClaudeProvider');
  }

  /**
   * Generate text using Claude API
   * @param request - AI request with prompt and context
   * @returns AI response with generated content
   * @throws AIServiceError on API failures
   */
  async generateText(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    const { prompt, context, options } = request;
    
    this.logger.debug('Generating text with Claude', {
      userId: context.userId,
      contentType: context.contentType,
      promptLength: prompt.length,
      model: options?.model || 'claude-3-haiku-20240307',
    });

    try {
      const requestBody = {
        model: options?.model || 'claude-3-haiku-20240307',
        max_tokens: options?.maxTokens ?? 1000,
        temperature: options?.temperature ?? 0.7,
        system: this.getSystemPrompt(context.contentType),
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      };

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeout = options?.timeout || 30000;
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      let response: Response;
      try {
        response = await fetch(`${this.baseURL}/messages`, {
          method: 'POST',
          headers: {
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || response.statusText;
        
        this.logger.error('Claude API error', {
          status: response.status,
          message: errorMessage,
          latencyMs,
        });

        throw this.createError(response.status, errorMessage, errorData);
      }

      const data = await response.json();

      this.logger.info('Text generated successfully', {
        model: data.model,
        tokensUsed: data.usage.input_tokens + data.usage.output_tokens,
        latencyMs,
      });

      return {
        content: data.content[0].text,
        usage: {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens,
        },
        model: data.model,
        provider: 'claude',
        finishReason: data.stop_reason === 'end_turn' ? 'stop' : 
                     data.stop_reason === 'max_tokens' ? 'length' : 'content_filter',
        latencyMs,
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      
      if (error instanceof AIServiceError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        this.logger.error('Request timeout', { latencyMs });
        throw new AIServiceError(
          'Request timeout',
          AIErrorType.TIMEOUT,
          'claude',
          undefined,
          true,
          undefined,
          error
        );
      }

      if (error instanceof TypeError) {
        this.logger.error('Network error', { error: error.message, latencyMs });
        throw new AIServiceError(
          'Network error: ' + error.message,
          AIErrorType.NETWORK_ERROR,
          'claude',
          undefined,
          true,
          undefined,
          error
        );
      }

      this.logger.error('Unknown error', { error, latencyMs });
      throw new AIServiceError(
        error instanceof Error ? error.message : 'Unknown error',
        AIErrorType.UNKNOWN,
        'claude',
        undefined,
        false,
        undefined,
        error
      );
    }
  }

  private createError(status: number, message: string, errorData: any): AIServiceError {
    let errorType: AIErrorType;
    let retryable = false;
    let retryAfter: number | undefined;

    switch (status) {
      case 401:
      case 403:
        errorType = AIErrorType.AUTHENTICATION;
        break;
      case 429:
        errorType = AIErrorType.RATE_LIMIT;
        retryable = true;
        retryAfter = errorData.error?.retry_after 
          ? errorData.error.retry_after * 1000 
          : 60000;
        break;
      case 400:
        errorType = AIErrorType.INVALID_REQUEST;
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        errorType = AIErrorType.SERVER_ERROR;
        retryable = true;
        break;
      default:
        errorType = AIErrorType.UNKNOWN;
        retryable = status >= 500;
    }

    return new AIServiceError(
      message,
      errorType,
      'claude',
      status,
      retryable,
      retryAfter
    );
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }],
        }),
      });
      return response.ok || response.status === 400; // 400 is expected for minimal request
    } catch {
      return false;
    }
  }

  getRateLimit(): RateLimitConfig {
    return {
      requestsPerMinute: 50,
      requestsPerHour: 1000,
      requestsPerDay: 5000,
    };
  }

  private getSystemPrompt(contentType?: string): string {
    const basePrompt = `You are Claude, an AI assistant integrated into Huntaze, a platform for content creators. You help creators optimize their content strategy, fan engagement, and revenue generation.`;
    
    switch (contentType) {
      case 'message':
        return `${basePrompt} Focus on creating authentic, personalized messages that build genuine connections with fans while encouraging engagement and purchases.`;
      case 'caption':
        return `${basePrompt} Create engaging, platform-appropriate captions that drive interaction and showcase the creator's personality.`;
      case 'idea':
        return `${basePrompt} Generate innovative content ideas that align with current trends and the creator's brand while maximizing monetization potential.`;
      case 'pricing':
        return `${basePrompt} Provide strategic pricing recommendations based on market analysis, audience psychology, and revenue optimization principles.`;
      case 'timing':
        return `${basePrompt} Analyze audience behavior patterns to recommend optimal timing for maximum engagement and conversion.`;
      default:
        return basePrompt;
    }
  }
}

// Rate limiter
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  async checkLimit(key: string, limit: RateLimitConfig): Promise<boolean> {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Clean old requests
    const validRequests = requests.filter(timestamp => {
      const age = now - timestamp;
      return age < 24 * 60 * 60 * 1000; // Keep requests from last 24 hours
    });

    // Check limits
    const lastMinute = validRequests.filter(t => now - t < 60 * 1000).length;
    const lastHour = validRequests.filter(t => now - t < 60 * 60 * 1000).length;
    const lastDay = validRequests.length;

    if (lastMinute >= limit.requestsPerMinute ||
        lastHour >= limit.requestsPerHour ||
        lastDay >= limit.requestsPerDay) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }

  getWaitTime(key: string, limit: RateLimitConfig): number {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Find the oldest request that would need to expire
    const minuteRequests = requests.filter(t => now - t < 60 * 1000);
    const hourRequests = requests.filter(t => now - t < 60 * 60 * 1000);
    
    if (minuteRequests.length >= limit.requestsPerMinute) {
      return 60 * 1000 - (now - minuteRequests[0]);
    }
    
    if (hourRequests.length >= limit.requestsPerHour) {
      return 60 * 60 * 1000 - (now - hourRequests[0]);
    }
    
    return 0;
  }
}

// Response cache
class ResponseCache {
  private cache: Map<string, { response: AIResponse; timestamp: number }> = new Map();
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
  }

  private generateKey(request: AIRequest): string {
    return Buffer.from(JSON.stringify({
      prompt: request.prompt,
      contentType: request.context.contentType,
      temperature: request.options?.temperature,
    })).toString('base64');
  }

  get(request: AIRequest): AIResponse | null {
    if (!this.config.enabled) return null;

    const key = this.generateKey(request);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > this.config.ttlSeconds * 1000) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.response;
  }

  set(request: AIRequest, response: AIResponse): void {
    if (!this.config.enabled) return;

    const key = this.generateKey(request);
    
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * Logger Interface
 * Provides structured logging for debugging and monitoring
 */
export interface Logger {
  debug(message: string, meta?: Record<string, any>): void;
  info(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  error(message: string, meta?: Record<string, any>): void;
}

/**
 * Console Logger Implementation
 * Simple logger that outputs to console with structured format
 */
export class ConsoleLogger implements Logger {
  constructor(private context: string) {}

  debug(message: string, meta?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${this.context}] ${message}`, meta || '');
    }
  }

  info(message: string, meta?: Record<string, any>): void {
    console.info(`[${this.context}] ${message}`, meta || '');
  }

  warn(message: string, meta?: Record<string, any>): void {
    console.warn(`[${this.context}] ${message}`, meta || '');
  }

  error(message: string, meta?: Record<string, any>): void {
    console.error(`[${this.context}] ${message}`, meta || '');
  }
}

/**
 * Retry Helper
 * Implements exponential backoff retry logic
 */
class RetryHelper {
  constructor(private config: RetryConfig, private logger: Logger) {}

  /**
   * Execute function with retry logic
   * @param fn - Function to execute
   * @param context - Context for logging
   * @returns Result of function execution
   */
  async execute<T>(
    fn: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        this.logger.debug(`Attempt ${attempt}/${this.config.maxAttempts}`, { context });
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        // Check if error is retryable
        if (error instanceof AIServiceError) {
          if (!error.retryable || !this.config.retryableErrors.includes(error.type)) {
            this.logger.warn('Non-retryable error, aborting', { 
              context, 
              errorType: error.type,
              attempt 
            });
            throw error;
          }

          // Use retry-after header if available
          if (error.retryAfter) {
            this.logger.info('Waiting for retry-after', { 
              context, 
              retryAfterMs: error.retryAfter,
              attempt 
            });
            await this.sleep(error.retryAfter);
            continue;
          }
        }

        // Last attempt, throw error
        if (attempt === this.config.maxAttempts) {
          this.logger.error('Max retry attempts reached', { context, attempt });
          throw lastError;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.config.initialDelayMs * Math.pow(this.config.backoffMultiplier, attempt - 1),
          this.config.maxDelayMs
        );

        this.logger.warn('Retrying after delay', { 
          context, 
          attempt, 
          delayMs: delay,
          error: lastError.message 
        });
        
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Main AI Service
 * Orchestrates AI providers with caching, rate limiting, and retry logic
 */
export class AIService {
  private providers: Map<AIProvider, AIProviderInterface> = new Map();
  private rateLimiter = new RateLimiter();
  private cache: ResponseCache;
  private defaultProvider: AIProvider = 'openai';
  private retryHelper: RetryHelper;
  private logger: Logger;

  constructor(config: {
    openaiApiKey?: string;
    openaiBaseURL?: string;
    isAzureOpenAI?: boolean;
    azureApiVersion?: string;
    claudeApiKey?: string;
    defaultProvider?: AIProvider;
    cache?: CacheConfig;
    retry?: RetryConfig;
    logger?: Logger;
  }) {
    this.logger = config.logger || new ConsoleLogger('AIService');
    
    // Initialize retry helper
    this.retryHelper = new RetryHelper(
      config.retry || {
        maxAttempts: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        backoffMultiplier: 2,
        retryableErrors: [
          AIErrorType.RATE_LIMIT,
          AIErrorType.SERVER_ERROR,
          AIErrorType.NETWORK_ERROR,
          AIErrorType.TIMEOUT,
        ],
      },
      this.logger
    );

    // Initialize providers
    if (config.openaiApiKey) {
      this.providers.set('openai', new OpenAIProvider(
        config.openaiApiKey,
        config.openaiBaseURL,
        {
          isAzure: config.isAzureOpenAI,
          apiVersion: config.azureApiVersion,
          logger: this.logger,
        }
      ));
      this.logger.info('OpenAI provider initialized', { 
        isAzure: config.isAzureOpenAI,
        baseURL: config.openaiBaseURL 
      });
    }
    
    if (config.claudeApiKey) {
      this.providers.set('claude', new ClaudeProvider(config.claudeApiKey, undefined, this.logger));
      this.logger.info('Claude provider initialized');
    }

    this.defaultProvider = config.defaultProvider || 'openai';
    
    // Initialize cache
    this.cache = new ResponseCache(config.cache || {
      enabled: true,
      ttlSeconds: 300, // 5 minutes
      maxSize: 1000,
    });

    this.logger.info('AI Service initialized', {
      defaultProvider: this.defaultProvider,
      cacheEnabled: this.cache['config'].enabled,
      providersCount: this.providers.size,
    });
  }

  /**
   * Generate text using AI provider
   * @param request - AI request with prompt and context
   * @param preferredProvider - Optional preferred provider
   * @returns AI response with generated content
   * @throws AIServiceError on failures
   */
  async generateText(
    request: AIRequest, 
    preferredProvider?: AIProvider
  ): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      // Validate request
      const validatedRequest = AIRequestSchema.parse(request);
      
      this.logger.debug('Generating text', {
        userId: validatedRequest.context.userId,
        contentType: validatedRequest.context.contentType,
        preferredProvider,
      });
      
      // Apply defaults for options
      const requestWithDefaults: AIRequest = {
        ...validatedRequest,
        options: {
          temperature: validatedRequest.options?.temperature ?? 0.7,
          maxTokens: validatedRequest.options?.maxTokens ?? 1000,
          model: validatedRequest.options?.model,
          timeout: validatedRequest.options?.timeout ?? 30000,
        },
      };
      
      // Check cache first
      const cached = this.cache.get(requestWithDefaults);
      if (cached) {
        this.logger.debug('Cache hit', { userId: requestWithDefaults.context.userId });
        return { ...cached, cached: true };
      }

      // Select provider
      const provider = await this.selectProvider(preferredProvider);
      if (!provider) {
        throw new AIServiceError(
          'No AI providers available',
          AIErrorType.SERVER_ERROR,
          preferredProvider || this.defaultProvider,
          undefined,
          false
        );
      }

      this.logger.debug('Provider selected', { provider: provider.name });

      // Check rate limits
      const rateLimitKey = `${provider.name}:${requestWithDefaults.context.userId}`;
      const canProceed = await this.rateLimiter.checkLimit(rateLimitKey, provider.getRateLimit());
      
      if (!canProceed) {
        const waitTime = this.rateLimiter.getWaitTime(rateLimitKey, provider.getRateLimit());
        this.logger.warn('Rate limit exceeded', { 
          provider: provider.name,
          userId: requestWithDefaults.context.userId,
          waitTimeMs: waitTime 
        });
        
        throw new AIServiceError(
          `Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)} seconds.`,
          AIErrorType.RATE_LIMIT,
          provider.name,
          429,
          true,
          waitTime
        );
      }

      // Generate response with retry logic
      const response = await this.retryHelper.execute(
        async () => {
          try {
            return await provider.generateText(requestWithDefaults);
          } catch (error) {
            // Try fallback provider on first failure
            if (error instanceof AIServiceError && error.retryable) {
              const fallbackProvider = await this.selectFallbackProvider(provider.name);
              if (fallbackProvider) {
                this.logger.warn('Trying fallback provider', {
                  primary: provider.name,
                  fallback: fallbackProvider.name,
                });
                return await fallbackProvider.generateText(requestWithDefaults);
              }
            }
            throw error;
          }
        },
        `generateText:${provider.name}`
      );
      
      // Cache response
      this.cache.set(requestWithDefaults, response);
      
      const totalLatencyMs = Date.now() - startTime;
      this.logger.info('Text generated successfully', {
        provider: response.provider,
        model: response.model,
        tokensUsed: response.usage.totalTokens,
        totalLatencyMs,
      });
      
      return response;
    } catch (error) {
      const totalLatencyMs = Date.now() - startTime;
      
      if (error instanceof AIServiceError) {
        this.logger.error('AI Service error', {
          type: error.type,
          provider: error.provider,
          message: error.message,
          totalLatencyMs,
        });
        throw error;
      }

      this.logger.error('Unexpected error', {
        error: error instanceof Error ? error.message : 'Unknown',
        totalLatencyMs,
      });
      
      throw new AIServiceError(
        error instanceof Error ? error.message : 'Unknown error',
        AIErrorType.UNKNOWN,
        preferredProvider || this.defaultProvider,
        undefined,
        false,
        undefined,
        error
      );
    }
  }

  private async selectProvider(preferred?: AIProvider): Promise<AIProviderInterface | null> {
    // Try preferred provider first
    if (preferred && this.providers.has(preferred)) {
      const provider = this.providers.get(preferred)!;
      if (await provider.isAvailable()) {
        return provider;
      }
    }

    // Try default provider
    if (this.providers.has(this.defaultProvider)) {
      const provider = this.providers.get(this.defaultProvider)!;
      if (await provider.isAvailable()) {
        return provider;
      }
    }

    // Try any available provider
    for (const [_, provider] of this.providers) {
      if (await provider.isAvailable()) {
        return provider;
      }
    }

    return null;
  }

  private async selectFallbackProvider(exclude: AIProvider): Promise<AIProviderInterface | null> {
    for (const [name, provider] of this.providers) {
      if (name !== exclude && await provider.isAvailable()) {
        return provider;
      }
    }
    return null;
  }

  async getAvailableProviders(): Promise<AIProvider[]> {
    const available: AIProvider[] = [];
    
    for (const [name, provider] of this.providers) {
      if (await provider.isAvailable()) {
        available.push(name);
      }
    }
    
    return available;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getProviderStatus(): Record<AIProvider, boolean> {
    const status: Record<AIProvider, boolean> = {
      openai: false,
      claude: false,
      gemini: false,
    };

    for (const [name] of this.providers) {
      status[name] = true;
    }

    return status;
  }
}

// Singleton instance
let aiServiceInstance: AIService | null = null;

export function getAIService(): AIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService({
      openaiApiKey: process.env.OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY,
      openaiBaseURL: process.env.AZURE_OPENAI_ENDPOINT || process.env.OPENAI_BASE_URL,
      isAzureOpenAI: process.env.AZURE_OPENAI_ENDPOINT ? true : false,
      azureApiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
      claudeApiKey: process.env.ANTHROPIC_API_KEY,
      defaultProvider: (process.env.DEFAULT_AI_PROVIDER as AIProvider) || 'openai',
      cache: {
        enabled: process.env.NODE_ENV === 'production',
        ttlSeconds: 300,
        maxSize: 1000,
      },
    });
  }
  
  return aiServiceInstance;
}
