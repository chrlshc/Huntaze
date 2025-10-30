/**
 * ADAPTIVE TIMEOUT SYSTEM FOR GPT-5
 * Production-ready implementation with intelligent timeout adjustment
 * 
 * Features:
 * - Real-time percentile tracking (p50, p95, p99)
 * - Token count estimation for latency prediction
 * - Load-aware timeout calculation
 * - Smooth adaptation without abrupt changes
 * - Multi-model support (GPT-5, GPT-5-mini, GPT-5-nano)
 * - Comprehensive error handling with typed errors
 * - Retry strategies with exponential backoff
 * - Request/response logging for debugging
 * - Metrics export for monitoring
 * 
 * @module adaptive-timeout-gpt5
 * @version 1.0.0
 */

import { EventEmitter } from 'events';

// ============================================================================
// CUSTOM ERROR TYPES
// ============================================================================

export class AdaptiveTimeoutError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean = false,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AdaptiveTimeoutError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class TimeoutExceededError extends AdaptiveTimeoutError {
  constructor(timeout: number, context?: Record<string, any>) {
    super(
      `Request timeout exceeded: ${timeout}ms`,
      'TIMEOUT_EXCEEDED',
      true,
      { timeout, ...context }
    );
    this.name = 'TimeoutExceededError';
  }
}

export class CircuitBreakerOpenError extends AdaptiveTimeoutError {
  constructor(public readonly resetTime: number) {
    super(
      'Circuit breaker is OPEN - too many failures',
      'CIRCUIT_BREAKER_OPEN',
      false,
      { resetTime, retryAfter: resetTime - Date.now() }
    );
    this.name = 'CircuitBreakerOpenError';
  }
}

export class InsufficientDataError extends AdaptiveTimeoutError {
  constructor(sampleCount: number, required: number) {
    super(
      `Insufficient data for percentile calculation: ${sampleCount}/${required}`,
      'INSUFFICIENT_DATA',
      false,
      { sampleCount, required }
    );
    this.name = 'InsufficientDataError';
  }
}

// ============================================================================
// LOGGER INTERFACE
// ============================================================================

export interface Logger {
  debug(message: string, meta?: Record<string, any>): void;
  info(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  error(message: string, error?: Error, meta?: Record<string, any>): void;
}

// Default console logger
const defaultLogger: Logger = {
  debug: (msg, meta) => console.debug(`[AdaptiveTimeout] ${msg}`, meta || ''),
  info: (msg, meta) => console.info(`[AdaptiveTimeout] ${msg}`, meta || ''),
  warn: (msg, meta) => console.warn(`[AdaptiveTimeout] ${msg}`, meta || ''),
  error: (msg, err, meta) => console.error(`[AdaptiveTimeout] ${msg}`, err, meta || '')
};

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface LatencyMetric {
  timestamp: number;
  latency: number;
  model: 'gpt-5' | 'gpt-5-mini' | 'gpt-5-nano';
  tokenCount: number;
  success: boolean;
  reasoningEffort?: 'high' | 'medium' | 'minimal';
  errorCode?: string;
  errorMessage?: string;
  retryCount?: number;
  userId?: string;
  requestId?: string;
}

export interface PercentileData {
  p50: number;
  p95: number;
  p99: number;
  mean: number;
  stdDev: number;
  sampleCount: number;
}

export interface TimeoutConfig {
  model: 'gpt-5' | 'gpt-5-mini' | 'gpt-5-nano';
  reasoningEffort: 'high' | 'medium' | 'minimal';
  tokenCount: number;
  systemLoad: number; // 0-1
}

export interface AdaptiveTimeoutResult {
  timeout: number; // milliseconds
  reasoning: {
    baseTimeout: number;
    tokenAdjustment: number;
    loadAdjustment: number;
    percentileBuffer: number;
    finalTimeout: number;
  };
  metrics: PercentileData;
  confidence: 'high' | 'medium' | 'low'; // Based on sample count
  recommendedRetryStrategy?: RetryStrategy;
}

export interface RetryStrategy {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

// ============================================================================
// RETRY CONFIGURATION
// ============================================================================

export const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  retryableErrors: [
    'TIMEOUT_EXCEEDED',
    'ECONNRESET',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'NETWORK_ERROR',
    'SERVICE_UNAVAILABLE',
    '429', // Rate limit
    '500', // Internal server error
    '502', // Bad gateway
    '503', // Service unavailable
    '504'  // Gateway timeout
  ],
  nonRetryableErrors: [
    'CIRCUIT_BREAKER_OPEN',
    'INVALID_API_KEY',
    'INSUFFICIENT_QUOTA',
    '400', // Bad request
    '401', // Unauthorized
    '403', // Forbidden
    '404'  // Not found
  ]
};

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Base timeouts par modèle (ms)
  baseTimeouts: {
    'gpt-5': {
      high: 45000,      // 45s pour raisonnement complexe
      medium: 30000,    // 30s pour tâches standard
      minimal: 15000    // 15s pour tâches simples
    },
    'gpt-5-mini': {
      high: 30000,
      medium: 20000,
      minimal: 10000
    },
    'gpt-5-nano': {
      high: 15000,
      medium: 10000,
      minimal: 5000
    }
  },
  
  // Token impact (ms par 100 tokens)
  tokenImpact: {
    'gpt-5': {
      high: 50,      // 50ms par 100 tokens
      medium: 30,
      minimal: 10
    },
    'gpt-5-mini': {
      high: 30,
      medium: 20,
      minimal: 5
    },
    'gpt-5-nano': {
      high: 10,
      medium: 5,
      minimal: 2
    }
  },
  
  // Percentile buffer (multiplier sur p99)
  percentileBuffer: 1.2,
  
  // Max load adjustment (multiplier quand charge = 1.0)
  maxLoadAdjustment: 1.5,
  
  // Smooth adaptation (% max change per calculation)
  maxTimeoutChangePercent: 0.3, // 30% max
  
  // Absolute limits
  minTimeout: 5000,   // 5s minimum
  maxTimeout: 120000  // 2min maximum
};

// ============================================================================
// LATENCY TRACKER - Maintains rolling window of latencies
// ============================================================================

class LatencyTracker {
  private metrics: Map<string, LatencyMetric[]> = new Map();
  private readonly windowSize = 1000; // Keep last 1000 requests per bucket
  private readonly bucketSize = 5 * 60 * 1000; // 5-minute time buckets
  
  constructor(private logger: Logger = defaultLogger) {}
  
  recordLatency(metric: LatencyMetric): void {
    try {
      const bucket = this.getBucket(metric.model, metric.reasoningEffort);
      
      if (!this.metrics.has(bucket)) {
        this.metrics.set(bucket, []);
      }
      
      const bucketMetrics = this.metrics.get(bucket)!;
      bucketMetrics.push(metric);
      
      // Keep only last N metrics
      if (bucketMetrics.length > this.windowSize) {
        bucketMetrics.shift();
      }
      
      // Clean old metrics (> 1 hour)
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      this.metrics.set(
        bucket,
        bucketMetrics.filter(m => m.timestamp > oneHourAgo)
      );
      
      // Log metric recording
      this.logger.debug('Latency metric recorded', {
        bucket,
        latency: metric.latency,
        success: metric.success,
        tokenCount: metric.tokenCount,
        totalMetrics: bucketMetrics.length
      });
    } catch (error) {
      this.logger.error('Failed to record latency metric', error as Error, {
        model: metric.model,
        reasoningEffort: metric.reasoningEffort
      });
    }
  }
  
  getPercentiles(
    model: string,
    reasoningEffort?: string
  ): PercentileData | null {
    try {
      const bucket = this.getBucket(model, reasoningEffort);
      const bucketMetrics = this.metrics.get(bucket);
      
      if (!bucketMetrics || bucketMetrics.length < 10) {
        this.logger.debug('Insufficient data for percentile calculation', {
          bucket,
          sampleCount: bucketMetrics?.length || 0,
          required: 10
        });
        return null; // Need at least 10 samples
      }
      
      // Filter successful requests only
      const successfulLatencies = bucketMetrics
        .filter(m => m.success)
        .map(m => m.latency)
        .sort((a, b) => a - b);
      
      if (successfulLatencies.length < 5) {
        this.logger.debug('Insufficient successful requests for percentiles', {
          bucket,
          successfulCount: successfulLatencies.length,
          required: 5
        });
        return null;
      }
      
      const p50Index = Math.floor(successfulLatencies.length * 0.50);
      const p95Index = Math.floor(successfulLatencies.length * 0.95);
      const p99Index = Math.floor(successfulLatencies.length * 0.99);
      
      const mean = successfulLatencies.reduce((a, b) => a + b, 0) / successfulLatencies.length;
      const variance = successfulLatencies.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / successfulLatencies.length;
      const stdDev = Math.sqrt(variance);
      
      const percentiles = {
        p50: successfulLatencies[p50Index],
        p95: successfulLatencies[p95Index],
        p99: successfulLatencies[p99Index],
        mean,
        stdDev,
        sampleCount: successfulLatencies.length
      };
      
      this.logger.debug('Percentiles calculated', { bucket, ...percentiles });
      
      return percentiles;
    } catch (error) {
      this.logger.error('Failed to calculate percentiles', error as Error, {
        model,
        reasoningEffort
      });
      return null;
    }
  }
  
  private getBucket(model: string, reasoningEffort?: string): string {
    return `${model}-${reasoningEffort || 'default'}`;
  }
  
  getMetrics(): Map<string, LatencyMetric[]> {
    return this.metrics;
  }
}

// ============================================================================
// TOKEN IMPACT CALCULATOR
// ============================================================================

class TokenImpactCalculator {
  calculateTokenAdjustment(
    model: 'gpt-5' | 'gpt-5-mini' | 'gpt-5-nano',
    reasoningEffort: 'high' | 'medium' | 'minimal',
    tokenCount: number
  ): number {
    const impactPer100Tokens = CONFIG.tokenImpact[model][reasoningEffort];
    const tokenGroups = Math.ceil(tokenCount / 100);
    return tokenGroups * impactPer100Tokens;
  }
}

// ============================================================================
// SYSTEM LOAD MONITOR
// ============================================================================

class SystemLoadMonitor {
  private recentRequests: number[] = [];
  private readonly windowSize = 60; // 60 seconds
  
  recordRequest(): void {
    const now = Date.now();
    this.recentRequests.push(now);
    
    // Clean old requests
    const oneMinuteAgo = now - this.windowSize * 1000;
    this.recentRequests = this.recentRequests.filter(t => t > oneMinuteAgo);
  }
  
  getCurrentLoad(): number {
    // Load = requests per second / max expected RPS
    const rps = this.recentRequests.length / this.windowSize;
    const maxExpectedRPS = 10; // Adjust based on your capacity
    return Math.min(rps / maxExpectedRPS, 1.0);
  }
}

// ============================================================================
// ADAPTIVE TIMEOUT CALCULATOR - Main Engine
// ============================================================================

export class AdaptiveTimeoutCalculator extends EventEmitter {
  private latencyTracker: LatencyTracker;
  private tokenCalculator = new TokenImpactCalculator();
  private loadMonitor = new SystemLoadMonitor();
  private previousTimeouts: Map<string, number> = new Map();
  
  constructor(private logger: Logger = defaultLogger) {
    super();
    this.latencyTracker = new LatencyTracker(logger);
  }
  
  /**
   * Calculate optimal timeout for a request
   * 
   * @param config - Timeout configuration including model, reasoning effort, token count, and system load
   * @returns Adaptive timeout result with reasoning and metrics
   * @throws {AdaptiveTimeoutError} If configuration is invalid
   * 
   * @example
   * ```typescript
   * const calculator = new AdaptiveTimeoutCalculator();
   * const result = calculator.calculateTimeout({
   *   model: 'gpt-5',
   *   reasoningEffort: 'high',
   *   tokenCount: 1500,
   *   systemLoad: 0.6
   * });
   * console.log(`Recommended timeout: ${result.timeout}ms`);
   * ```
   */
  calculateTimeout(config: TimeoutConfig): AdaptiveTimeoutResult {
    try {
      this.validateConfig(config);
      this.logger.debug('Calculating adaptive timeout', config);
    this.loadMonitor.recordRequest();
    
    // 1. Get base timeout
    const baseTimeout = CONFIG.baseTimeouts[config.model][config.reasoningEffort];
    
    // 2. Calculate token adjustment
    const tokenAdjustment = this.tokenCalculator.calculateTokenAdjustment(
      config.model,
      config.reasoningEffort,
      config.tokenCount
    );
    
    // 3. Calculate load adjustment
    const loadMultiplier = 1 + (config.systemLoad * (CONFIG.maxLoadAdjustment - 1));
    const loadAdjustment = baseTimeout * (loadMultiplier - 1);
    
    // 4. Get percentile-based adjustment
    const percentiles = this.latencyTracker.getPercentiles(
      config.model,
      config.reasoningEffort
    );
    
    let percentileBuffer = 0;
    let finalTimeout = baseTimeout + tokenAdjustment + loadAdjustment;
    
    if (percentiles && percentiles.sampleCount >= 20) {
      // Use p99 with buffer
      const p99WithBuffer = percentiles.p99 * CONFIG.percentileBuffer;
      percentileBuffer = Math.max(0, p99WithBuffer - finalTimeout);
      finalTimeout = p99WithBuffer;
    }
    
    // 5. Apply smooth adaptation
    const bucket = `${config.model}-${config.reasoningEffort}`;
    const previousTimeout = this.previousTimeouts.get(bucket);
    
    if (previousTimeout) {
      const maxChange = previousTimeout * CONFIG.maxTimeoutChangePercent;
      const change = finalTimeout - previousTimeout;
      
      if (Math.abs(change) > maxChange) {
        finalTimeout = previousTimeout + (change > 0 ? maxChange : -maxChange);
      }
    }
    
    // 6. Apply absolute limits
    finalTimeout = Math.max(CONFIG.minTimeout, Math.min(CONFIG.maxTimeout, finalTimeout));
    
    // 7. Store for next calculation
    this.previousTimeouts.set(bucket, finalTimeout);
    
      // 8. Determine confidence level
      const confidence = this.determineConfidence(percentiles);
      
      // 9. Generate retry strategy
      const recommendedRetryStrategy = this.generateRetryStrategy(config, finalTimeout);
      
      // 10. Emit event for monitoring
      this.emit('timeout-calculated', {
        model: config.model,
        reasoningEffort: config.reasoningEffort,
        timeout: finalTimeout,
        percentiles,
        confidence
      });
      
      const result: AdaptiveTimeoutResult = {
        timeout: Math.round(finalTimeout),
        reasoning: {
          baseTimeout,
          tokenAdjustment,
          loadAdjustment,
          percentileBuffer,
          finalTimeout
        },
        metrics: percentiles || {
          p50: 0,
          p95: 0,
          p99: 0,
          mean: 0,
          stdDev: 0,
          sampleCount: 0
        },
        confidence,
        recommendedRetryStrategy
      };
      
      this.logger.info('Timeout calculated successfully', {
        model: config.model,
        timeout: result.timeout,
        confidence: result.confidence
      });
      
      return result;
    } catch (error) {
      this.logger.error('Failed to calculate timeout', error as Error, config);
      throw new AdaptiveTimeoutError(
        'Timeout calculation failed',
        'CALCULATION_ERROR',
        false,
        { config, error: (error as Error).message }
      );
    }
  }
  
  /**
   * Validate timeout configuration
   */
  private validateConfig(config: TimeoutConfig): void {
    if (!config.model || !['gpt-5', 'gpt-5-mini', 'gpt-5-nano'].includes(config.model)) {
      throw new AdaptiveTimeoutError(
        `Invalid model: ${config.model}`,
        'INVALID_MODEL',
        false,
        { model: config.model }
      );
    }
    
    if (!config.reasoningEffort || !['high', 'medium', 'minimal'].includes(config.reasoningEffort)) {
      throw new AdaptiveTimeoutError(
        `Invalid reasoning effort: ${config.reasoningEffort}`,
        'INVALID_REASONING_EFFORT',
        false,
        { reasoningEffort: config.reasoningEffort }
      );
    }
    
    if (config.tokenCount < 0 || config.tokenCount > 100000) {
      throw new AdaptiveTimeoutError(
        `Invalid token count: ${config.tokenCount}`,
        'INVALID_TOKEN_COUNT',
        false,
        { tokenCount: config.tokenCount }
      );
    }
    
    if (config.systemLoad < 0 || config.systemLoad > 1) {
      throw new AdaptiveTimeoutError(
        `Invalid system load: ${config.systemLoad}`,
        'INVALID_SYSTEM_LOAD',
        false,
        { systemLoad: config.systemLoad }
      );
    }
  }
  
  /**
   * Determine confidence level based on sample count
   */
  private determineConfidence(percentiles: PercentileData | null): 'high' | 'medium' | 'low' {
    if (!percentiles) return 'low';
    
    if (percentiles.sampleCount >= 100) return 'high';
    if (percentiles.sampleCount >= 20) return 'medium';
    return 'low';
  }
  
  /**
   * Generate recommended retry strategy
   */
  private generateRetryStrategy(config: TimeoutConfig, timeout: number): RetryStrategy {
    // Adjust retry strategy based on timeout and model
    const baseStrategy = { ...RETRY_CONFIG };
    
    // For longer timeouts, reduce max retries
    if (timeout > 60000) {
      baseStrategy.maxRetries = 2;
    }
    
    // For high reasoning effort, increase delays
    if (config.reasoningEffort === 'high') {
      baseStrategy.baseDelay = 2000;
      baseStrategy.maxDelay = 60000;
    }
    
    return baseStrategy;
  }
  
  /**
   * Record completion for learning
   * 
   * @param metric - Latency metric to record
   * 
   * @example
   * ```typescript
   * calculator.recordCompletion({
   *   timestamp: Date.now(),
   *   latency: 2500,
   *   model: 'gpt-5',
   *   tokenCount: 1500,
   *   success: true,
   *   reasoningEffort: 'high',
   *   requestId: 'req-123'
   * });
   * ```
   */
  recordCompletion(metric: LatencyMetric): void {
    try {
      this.latencyTracker.recordLatency(metric);
      
      this.emit('latency-recorded', metric);
      
      this.logger.debug('Completion recorded', {
        model: metric.model,
        latency: metric.latency,
        success: metric.success,
        requestId: metric.requestId
      });
    } catch (error) {
      this.logger.error('Failed to record completion', error as Error, {
        model: metric.model,
        requestId: metric.requestId
      });
    }
  }
  
  /**
   * Get health metrics for monitoring
   */
  getHealthMetrics(): any {
    const metrics: any = {};
    
    for (const [bucket, data] of this.latencyTracker.getMetrics()) {
      const percentiles = this.latencyTracker.getPercentiles(bucket.split('-')[0], bucket.split('-')[1]);
      if (percentiles) {
        metrics[bucket] = percentiles;
      }
    }
    
    return {
      currentLoad: this.loadMonitor.getCurrentLoad(),
      buckets: metrics,
      config: CONFIG
    };
  }
}

// ============================================================================
// RETRY EXECUTOR WITH EXPONENTIAL BACKOFF
// ============================================================================

export class RetryExecutor {
  constructor(private logger: Logger = defaultLogger) {}
  
  /**
   * Execute function with retry logic
   * 
   * @param fn - Function to execute
   * @param strategy - Retry strategy
   * @param context - Context for logging
   * @returns Result of function execution
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    strategy: RetryStrategy = RETRY_CONFIG,
    context?: Record<string, any>
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= strategy.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          this.logger.info(`Retry attempt ${attempt}/${strategy.maxRetries}`, context);
        }
        
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        // Check if error is retryable
        const isRetryable = this.isRetryableError(error as Error, strategy);
        
        if (!isRetryable || attempt === strategy.maxRetries) {
          this.logger.error(
            `Request failed after ${attempt + 1} attempts`,
            lastError,
            { ...context, retryable: isRetryable }
          );
          throw lastError;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          strategy.baseDelay * Math.pow(strategy.backoffMultiplier, attempt),
          strategy.maxDelay
        );
        
        this.logger.warn(
          `Request failed, retrying in ${delay}ms`,
          { ...context, attempt, error: lastError.message }
        );
        
        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }
  
  /**
   * Check if error is retryable
   */
  private isRetryableError(error: Error, strategy: RetryStrategy): boolean {
    if (error instanceof AdaptiveTimeoutError) {
      return error.retryable;
    }
    
    const errorCode = (error as any).code || error.name;
    return strategy.retryableErrors.some(code => 
      errorCode.includes(code) || error.message.includes(code)
    );
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// CIRCUIT BREAKER WITH ADAPTIVE TIMEOUT
// ============================================================================

export class CircuitBreakerWithAdaptiveTimeout {
  private calculator: AdaptiveTimeoutCalculator;
  private retryExecutor: RetryExecutor;
  private failureCount = 0;
  private successCount = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private lastFailureTime = 0;
  
  private readonly failureThreshold = 5;
  private readonly successThreshold = 2;
  private readonly openTimeout = 60000; // 1 minute
  
  constructor(private logger: Logger = defaultLogger) {
    this.calculator = new AdaptiveTimeoutCalculator(logger);
    this.retryExecutor = new RetryExecutor(logger);
  }
  
  /**
   * Execute function with circuit breaker, adaptive timeout, and retry logic
   * 
   * @param fn - Function to execute
   * @param config - Timeout configuration
   * @param options - Execution options
   * @returns Result of function execution
   * @throws {CircuitBreakerOpenError} If circuit breaker is open
   * @throws {TimeoutExceededError} If request times out
   * 
   * @example
   * ```typescript
   * const breaker = new CircuitBreakerWithAdaptiveTimeout();
   * const result = await breaker.execute(
   *   async () => callGPT5API(),
   *   {
   *     model: 'gpt-5',
   *     reasoningEffort: 'high',
   *     tokenCount: 1500,
   *     systemLoad: 0.6
   *   },
   *   { enableRetry: true, requestId: 'req-123' }
   * );
   * ```
   */
  async execute<T>(
    fn: () => Promise<T>,
    config: TimeoutConfig,
    options: {
      enableRetry?: boolean;
      requestId?: string;
      userId?: string;
    } = {}
  ): Promise<T> {
    const { enableRetry = true, requestId, userId } = options;
    
    // Check circuit breaker state
    if (this.state === 'OPEN') {
      const resetTime = this.lastFailureTime + this.openTimeout;
      
      if (Date.now() >= resetTime) {
        this.logger.info('Circuit breaker transitioning to HALF_OPEN', {
          requestId,
          resetTime: new Date(resetTime)
        });
        this.state = 'HALF_OPEN';
        this.successCount = 0;
      } else {
        this.logger.warn('Circuit breaker is OPEN', {
          requestId,
          retryAfter: resetTime - Date.now()
        });
        throw new CircuitBreakerOpenError(resetTime);
      }
    }
    
    // Calculate adaptive timeout
    const timeoutResult = this.calculator.calculateTimeout(config);
    const startTime = Date.now();
    
    this.logger.info('Executing request with adaptive timeout', {
      requestId,
      timeout: timeoutResult.timeout,
      confidence: timeoutResult.confidence,
      circuitState: this.state
    });
    
    const executeRequest = async (): Promise<T> => {
      try {
        // Execute with timeout
        const result = await this.executeWithTimeout(fn, timeoutResult.timeout);
        
        const latency = Date.now() - startTime;
        
        // Record success
        this.calculator.recordCompletion({
          timestamp: Date.now(),
          latency,
          model: config.model,
          tokenCount: config.tokenCount,
          success: true,
          reasoningEffort: config.reasoningEffort,
          requestId,
          userId
        });
        
        // Update circuit breaker
        this.onSuccess();
        
        this.logger.info('Request completed successfully', {
          requestId,
          latency,
          circuitState: this.state
        });
        
        return result;
      } catch (error) {
        const latency = Date.now() - startTime;
        const err = error as Error;
        
        // Record failure
        this.calculator.recordCompletion({
          timestamp: Date.now(),
          latency,
          model: config.model,
          tokenCount: config.tokenCount,
          success: false,
          reasoningEffort: config.reasoningEffort,
          errorCode: (err as any).code || err.name,
          errorMessage: err.message,
          requestId,
          userId
        });
        
        // Update circuit breaker
        this.onFailure();
        
        this.logger.error('Request failed', err, {
          requestId,
          latency,
          circuitState: this.state
        });
        
        throw error;
      }
    };
    
    // Execute with or without retry
    if (enableRetry && timeoutResult.recommendedRetryStrategy) {
      return await this.retryExecutor.executeWithRetry(
        executeRequest,
        timeoutResult.recommendedRetryStrategy,
        { requestId, userId, model: config.model }
      );
    } else {
      return await executeRequest();
    }
  }
  
  /**
   * Execute function with timeout
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    let timeoutId: NodeJS.Timeout;
    
    try {
      return await Promise.race([
        fn(),
        new Promise<T>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new TimeoutExceededError(timeout, {
              timestamp: Date.now()
            }));
          }, timeout);
        })
      ]);
    } finally {
      if (timeoutId!) {
        clearTimeout(timeoutId);
      }
    }
  }
  
  private onSuccess(): void {
    this.failureCount = 0;
    
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = 'CLOSED';
      }
    }
  }
  
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
  
  /**
   * Get current circuit breaker state
   */
  getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
    return this.state;
  }
  
  /**
   * Get circuit breaker health metrics
   */
  getHealthMetrics(): {
    state: string;
    failureCount: number;
    successCount: number;
    lastFailureTime: number;
    isHealthy: boolean;
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      isHealthy: this.state === 'CLOSED'
    };
  }
  
  /**
   * Get adaptive timeout calculator instance
   */
  getCalculator(): AdaptiveTimeoutCalculator {
    return this.calculator;
  }
  
  /**
   * Reset circuit breaker to initial state
   */
  reset(): void {
    this.logger.info('Resetting circuit breaker');
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a production-ready circuit breaker with adaptive timeout
 * 
 * @param logger - Optional custom logger
 * @returns Configured circuit breaker instance
 * 
 * @example
 * ```typescript
 * const breaker = createAdaptiveCircuitBreaker(customLogger);
 * 
 * const result = await breaker.execute(
 *   async () => await callGPT5API(prompt),
 *   {
 *     model: 'gpt-5',
 *     reasoningEffort: 'high',
 *     tokenCount: estimateTokens(prompt),
 *     systemLoad: getCurrentLoad()
 *   },
 *   { enableRetry: true, requestId: generateId() }
 * );
 * ```
 */
export function createAdaptiveCircuitBreaker(
  logger?: Logger
): CircuitBreakerWithAdaptiveTimeout {
  return new CircuitBreakerWithAdaptiveTimeout(logger);
}

/**
 * Create a standalone adaptive timeout calculator
 * 
 * @param logger - Optional custom logger
 * @returns Configured calculator instance
 */
export function createTimeoutCalculator(
  logger?: Logger
): AdaptiveTimeoutCalculator {
  return new AdaptiveTimeoutCalculator(logger);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  AdaptiveTimeoutCalculator,
  CircuitBreakerWithAdaptiveTimeout,
  RetryExecutor,
  createAdaptiveCircuitBreaker,
  createTimeoutCalculator,
  CONFIG,
  RETRY_CONFIG
};
