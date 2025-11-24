/**
 * Cold Start Prevention Service
 * 
 * Prevents cold starts on staging by periodically pinging the server
 * to keep it warm and responsive.
 * 
 * Features:
 * - Automatic retry with exponential backoff
 * - Circuit breaker pattern for cascading failures
 * - Comprehensive error handling and logging
 * - Performance monitoring and alerting
 * - Graceful degradation
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4
 * 
 * @example
 * ```typescript
 * const pingService = new PingService({
 *   url: 'https://staging.huntaze.com/api/health',
 *   interval: 10 * 60 * 1000, // 10 minutes
 *   timeout: 3000,
 *   enabled: true,
 *   retryConfig: {
 *     maxRetries: 3,
 *     initialDelay: 1000,
 *     maxDelay: 10000,
 *     backoffFactor: 2,
 *   },
 * });
 * 
 * pingService.start();
 * ```
 */

/**
 * HTTP methods supported for pinging
 */
export type PingMethod = 'GET' | 'HEAD' | 'OPTIONS';

/**
 * Error types for categorization and handling
 */
export enum PingErrorType {
  TIMEOUT = 'TIMEOUT',
  NETWORK = 'NETWORK',
  HTTP_ERROR = 'HTTP_ERROR',
  ABORT = 'ABORT',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Circuit breaker states
 */
export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Failing, stop trying
  HALF_OPEN = 'HALF_OPEN', // Testing if recovered
}

/**
 * Retry configuration for failed pings
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Initial delay in milliseconds */
  initialDelay: number;
  /** Maximum delay in milliseconds */
  maxDelay: number;
  /** Backoff multiplier (exponential backoff) */
  backoffFactor: number;
  /** Jitter factor (0-1) to randomize delays */
  jitterFactor?: number;
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  /** Number of failures before opening circuit */
  failureThreshold: number;
  /** Time in ms to wait before attempting recovery */
  resetTimeout: number;
  /** Number of successful requests to close circuit */
  successThreshold: number;
}

/**
 * Main service configuration
 */
export interface PingServiceConfig {
  /** Target URL to ping */
  url: string;
  /** Ping interval in milliseconds (default: 10 minutes) */
  interval: number;
  /** HTTP method to use */
  method?: PingMethod;
  /** Request timeout in milliseconds (default: 3 seconds) */
  timeout: number;
  /** Whether the service is enabled */
  enabled: boolean;
  /** Retry configuration */
  retryConfig?: RetryConfig;
  /** Circuit breaker configuration */
  circuitBreakerConfig?: CircuitBreakerConfig;
  /** Custom headers to include in requests */
  headers?: Record<string, string>;
  /** Success callback */
  onSuccess?: (response: PingResponse) => void;
  /** Failure callback */
  onFailure?: (error: PingError) => void;
  /** Circuit state change callback */
  onCircuitStateChange?: (state: CircuitState) => void;
}

/**
 * Successful ping response
 */
export interface PingResponse {
  /** Target URL */
  url: string;
  /** HTTP status code */
  status: number;
  /** Response time in milliseconds */
  responseTime: number;
  /** Response timestamp */
  timestamp: Date;
  /** Response headers (optional) */
  headers?: Record<string, string>;
  /** Whether this was a retry attempt */
  isRetry: boolean;
  /** Retry attempt number (0 for first attempt) */
  retryAttempt: number;
}

/**
 * Ping error details
 */
export interface PingError {
  /** Target URL */
  url: string;
  /** Error type for categorization */
  type: PingErrorType;
  /** Original error object */
  error: Error;
  /** Error message */
  message: string;
  /** HTTP status code (if applicable) */
  status?: number;
  /** Error timestamp */
  timestamp: Date;
  /** Number of consecutive failures */
  consecutiveFailures: number;
  /** Whether retry will be attempted */
  willRetry: boolean;
  /** Retry attempt number */
  retryAttempt: number;
  /** Circuit breaker state */
  circuitState: CircuitState;
}

/**
 * Service statistics and health metrics
 */
export interface PingServiceStats {
  /** Total number of ping attempts */
  totalPings: number;
  /** Number of successful pings */
  successfulPings: number;
  /** Number of failed pings */
  failedPings: number;
  /** Current consecutive failures */
  consecutiveFailures: number;
  /** Total retry attempts */
  totalRetries: number;
  /** Last ping timestamp */
  lastPingTime: Date | null;
  /** Last successful ping timestamp */
  lastSuccessTime: Date | null;
  /** Last failure timestamp */
  lastFailureTime: Date | null;
  /** Average response time in milliseconds */
  averageResponseTime: number;
  /** Minimum response time */
  minResponseTime: number;
  /** Maximum response time */
  maxResponseTime: number;
  /** P95 response time */
  p95ResponseTime: number;
  /** Current circuit breaker state */
  circuitState: CircuitState;
  /** Success rate (0-1) */
  successRate: number;
  /** Service uptime in milliseconds */
  uptime: number;
  /** Service start time */
  startTime: Date | null;
}

/**
 * PingService - Prevents cold starts by keeping the server warm
 * 
 * This service periodically pings a configured URL to prevent the server
 * from going into a cold start state. It includes:
 * - Automatic retry with exponential backoff
 * - Circuit breaker pattern
 * - Comprehensive monitoring and alerting
 * - Graceful error handling
 */
export class PingService {
  private config: Required<PingServiceConfig>;
  private intervalId: NodeJS.Timeout | null = null;
  private stats: PingServiceStats;
  private responseTimes: number[] = [];
  private circuitState: CircuitState = CircuitState.CLOSED;
  private circuitFailureCount: number = 0;
  private circuitSuccessCount: number = 0;
  private circuitOpenTime: number | null = null;
  private readonly MAX_RESPONSE_TIMES = 100; // Keep last 100 response times

  // Default configurations
  private readonly DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    jitterFactor: 0.1,
  };

  private readonly DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
    failureThreshold: 5,
    resetTimeout: 60000, // 1 minute
    successThreshold: 2,
  };

  constructor(config: PingServiceConfig) {
    this.config = {
      method: 'HEAD',
      enabled: true,
      headers: {},
      onSuccess: () => {},
      onFailure: () => {},
      onCircuitStateChange: () => {},
      ...config,
      retryConfig: { ...this.DEFAULT_RETRY_CONFIG, ...config.retryConfig },
      circuitBreakerConfig: { ...this.DEFAULT_CIRCUIT_BREAKER_CONFIG, ...config.circuitBreakerConfig },
    };

    this.stats = {
      totalPings: 0,
      successfulPings: 0,
      failedPings: 0,
      consecutiveFailures: 0,
      totalRetries: 0,
      lastPingTime: null,
      lastSuccessTime: null,
      lastFailureTime: null,
      averageResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      p95ResponseTime: 0,
      circuitState: CircuitState.CLOSED,
      successRate: 0,
      uptime: 0,
      startTime: null,
    };

    this.validateConfig();
  }

  /**
   * Validates the service configuration
   */
  private validateConfig(): void {
    if (!this.config.url) {
      throw new Error('PingService: URL is required');
    }

    if (!this.isValidUrl(this.config.url)) {
      throw new Error(`PingService: Invalid URL: ${this.config.url}`);
    }

    if (this.config.interval <= 0) {
      throw new Error('PingService: Interval must be greater than 0');
    }

    if (this.config.timeout <= 0) {
      throw new Error('PingService: Timeout must be greater than 0');
    }

    if (this.config.timeout > this.config.interval) {
      throw new Error('PingService: Timeout cannot exceed interval');
    }
  }

  /**
   * Validates URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Starts the ping service
   */
  start(): void {
    if (!this.config.enabled) {
      this.log('info', 'Service is disabled, not starting');
      return;
    }

    if (this.intervalId) {
      this.log('info', 'Service is already running');
      return;
    }

    this.stats.startTime = new Date();
    this.log('info', `Starting service (interval: ${this.config.interval}ms, timeout: ${this.config.timeout}ms)`);
    
    // Perform initial ping immediately (don't await to avoid blocking)
    void this.ping();

    // Set up interval for subsequent pings
    this.intervalId = setInterval(() => {
      void this.ping();
    }, this.config.interval);
  }

  /**
   * Stops the ping service
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.log('info', 'Service stopped');
    }
  }

  /**
   * Checks if the service is running
   */
  isRunning(): boolean {
    return this.intervalId !== null;
  }

  /**
   * Performs a single ping with retry logic
   */
  private async ping(): Promise<void> {
    // Check circuit breaker
    if (this.circuitState === CircuitState.OPEN) {
      const now = Date.now();
      if (this.circuitOpenTime && now - this.circuitOpenTime >= this.config.circuitBreakerConfig.resetTimeout) {
        this.setCircuitState(CircuitState.HALF_OPEN);
        this.log('info', 'Circuit breaker entering HALF_OPEN state');
      } else {
        this.log('warn', 'Circuit breaker is OPEN, skipping ping');
        return;
      }
    }

    const startTime = Date.now();
    this.stats.totalPings++;
    this.stats.lastPingTime = new Date();

    let lastError: Error | null = null;
    let retryAttempt = 0;

    // Retry loop
    while (retryAttempt <= this.config.retryConfig.maxRetries) {
      try {
        const response = await this.performRequest(retryAttempt);
        this.recordSuccess(response, retryAttempt, Date.now() - startTime);
        return;
      } catch (error) {
        lastError = error as Error;
        const errorType = this.categorizeError(error as Error);
        
        // Check if we should retry
        const shouldRetry = retryAttempt < this.config.retryConfig.maxRetries && this.isRetryableError(errorType);
        
        if (shouldRetry) {
          this.stats.totalRetries++;
          const delay = this.calculateRetryDelay(retryAttempt);
          this.log('warn', `Ping failed, retrying in ${delay}ms (attempt ${retryAttempt + 1}/${this.config.retryConfig.maxRetries})`, { error: (error as Error).message });
          await this.sleep(delay);
          retryAttempt++;
        } else {
          break;
        }
      }
    }

    // All retries failed
    if (lastError) {
      this.recordFailure(lastError, retryAttempt, Date.now() - startTime);
    }
  }

  /**
   * Performs the actual HTTP request
   */
  private async performRequest(retryAttempt: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(this.config.url, {
        method: this.config.method,
        signal: controller.signal,
        cache: 'no-store',
        headers: {
          'User-Agent': 'Huntaze-PingService/1.0',
          'X-Ping-Service': 'true',
          'X-Retry-Attempt': retryAttempt.toString(),
          ...this.config.headers,
        },
      });

      clearTimeout(timeoutId);

      // Check for HTTP errors
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Records a successful ping
   */
  private recordSuccess(response: Response, retryAttempt: number, totalTime: number): void {
    this.stats.successfulPings++;
    this.stats.consecutiveFailures = 0;
    this.stats.lastSuccessTime = new Date();

    // Update circuit breaker
    if (this.circuitState === CircuitState.HALF_OPEN) {
      this.circuitSuccessCount++;
      if (this.circuitSuccessCount >= this.config.circuitBreakerConfig.successThreshold) {
        this.setCircuitState(CircuitState.CLOSED);
        this.circuitFailureCount = 0;
        this.circuitSuccessCount = 0;
        this.log('info', 'Circuit breaker closed after successful recovery');
      }
    }

    // Track response times
    this.responseTimes.push(totalTime);
    if (this.responseTimes.length > this.MAX_RESPONSE_TIMES) {
      this.responseTimes.shift();
    }

    // Calculate statistics
    this.updateResponseTimeStats();
    this.updateSuccessRate();

    const pingResponse: PingResponse = {
      url: this.config.url,
      status: response.status,
      responseTime: totalTime,
      timestamp: new Date(),
      isRetry: retryAttempt > 0,
      retryAttempt,
    };

    this.log('info', `Ping successful (status: ${response.status}, time: ${totalTime}ms, retry: ${retryAttempt})`);
    this.config.onSuccess?.(pingResponse);
  }

  /**
   * Records a failed ping
   */
  private recordFailure(error: Error, retryAttempt: number, totalTime: number): void {
    this.stats.failedPings++;
    this.stats.consecutiveFailures++;
    this.stats.lastFailureTime = new Date();

    // Update circuit breaker
    this.circuitFailureCount++;
    if (this.circuitFailureCount >= this.config.circuitBreakerConfig.failureThreshold) {
      this.setCircuitState(CircuitState.OPEN);
      this.circuitOpenTime = Date.now();
      this.log('error', `Circuit breaker opened after ${this.circuitFailureCount} failures`);
    }

    // Update success rate
    this.updateSuccessRate();

    const errorType = this.categorizeError(error);
    const pingError: PingError = {
      url: this.config.url,
      type: errorType,
      error,
      message: error.message,
      timestamp: new Date(),
      consecutiveFailures: this.stats.consecutiveFailures,
      willRetry: false,
      retryAttempt,
      circuitState: this.circuitState,
    };

    this.log('error', `Ping failed after ${retryAttempt + 1} attempts (consecutive failures: ${this.stats.consecutiveFailures})`, { error: error.message });

    // Alert after 3 consecutive failures
    if (this.stats.consecutiveFailures >= 3) {
      this.log('error', `ALERT - ${this.stats.consecutiveFailures} consecutive failures detected!`);
    }

    this.config.onFailure?.(pingError);
  }

  /**
   * Categorizes error type for better handling
   */
  private categorizeError(error: Error): PingErrorType {
    const message = error.message.toLowerCase();
    
    if (error.name === 'AbortError' || message.includes('abort')) {
      return PingErrorType.TIMEOUT;
    }
    
    if (message.includes('network') || message.includes('fetch')) {
      return PingErrorType.NETWORK;
    }
    
    if (message.includes('http')) {
      return PingErrorType.HTTP_ERROR;
    }
    
    return PingErrorType.UNKNOWN;
  }

  /**
   * Checks if error is retryable
   */
  private isRetryableError(errorType: PingErrorType): boolean {
    return errorType === PingErrorType.TIMEOUT || 
           errorType === PingErrorType.NETWORK ||
           errorType === PingErrorType.HTTP_ERROR;
  }

  /**
   * Calculates retry delay with exponential backoff and jitter
   */
  private calculateRetryDelay(attempt: number): number {
    const { initialDelay, maxDelay, backoffFactor, jitterFactor = 0.1 } = this.config.retryConfig;
    
    // Exponential backoff
    const exponentialDelay = initialDelay * Math.pow(backoffFactor, attempt);
    
    // Cap at max delay
    const cappedDelay = Math.min(exponentialDelay, maxDelay);
    
    // Add jitter to prevent thundering herd
    const jitter = cappedDelay * jitterFactor * (Math.random() - 0.5) * 2;
    
    return Math.floor(cappedDelay + jitter);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Updates response time statistics
   */
  private updateResponseTimeStats(): void {
    if (this.responseTimes.length === 0) return;

    // Average
    this.stats.averageResponseTime = 
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;

    // Min/Max
    this.stats.minResponseTime = Math.min(...this.responseTimes);
    this.stats.maxResponseTime = Math.max(...this.responseTimes);

    // P95
    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    this.stats.p95ResponseTime = sorted[p95Index] || 0;
  }

  /**
   * Updates success rate
   */
  private updateSuccessRate(): void {
    const total = this.stats.successfulPings + this.stats.failedPings;
    this.stats.successRate = total > 0 ? this.stats.successfulPings / total : 0;
  }

  /**
   * Sets circuit breaker state and notifies
   */
  private setCircuitState(state: CircuitState): void {
    if (this.circuitState !== state) {
      this.circuitState = state;
      this.stats.circuitState = state;
      this.config.onCircuitStateChange?.(state);
    }
  }

  /**
   * Structured logging
   */
  private log(level: 'info' | 'warn' | 'error', message: string, metadata?: Record<string, any>): void {
    const logMessage = `[PingService] ${message}`;
    const logData = {
      url: this.config.url,
      circuitState: this.circuitState,
      ...metadata,
    };

    switch (level) {
      case 'info':
        console.log(logMessage, logData);
        break;
      case 'warn':
        console.warn(logMessage, logData);
        break;
      case 'error':
        console.error(logMessage, logData);
        break;
    }
  }

  /**
   * Gets current service statistics
   */
  getStats(): PingServiceStats {
    // Calculate uptime
    if (this.stats.startTime) {
      this.stats.uptime = Date.now() - this.stats.startTime.getTime();
    }
    
    return { ...this.stats };
  }

  /**
   * Resets service statistics
   */
  resetStats(): void {
    this.stats = {
      totalPings: 0,
      successfulPings: 0,
      failedPings: 0,
      consecutiveFailures: 0,
      totalRetries: 0,
      lastPingTime: null,
      lastSuccessTime: null,
      lastFailureTime: null,
      averageResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      p95ResponseTime: 0,
      circuitState: this.circuitState,
      successRate: 0,
      uptime: 0,
      startTime: this.stats.startTime,
    };
    this.responseTimes = [];
  }

  /**
   * Updates service configuration
   */
  updateConfig(config: Partial<PingServiceConfig>): void {
    const wasRunning = this.isRunning();
    
    if (wasRunning) {
      this.stop();
    }

    this.config = {
      ...this.config,
      ...config,
      retryConfig: { ...this.config.retryConfig, ...config.retryConfig },
      circuitBreakerConfig: { ...this.config.circuitBreakerConfig, ...config.circuitBreakerConfig },
    };

    this.validateConfig();

    if (wasRunning && this.config.enabled) {
      this.start();
    }
  }

  /**
   * Gets current configuration
   */
  getConfig(): Required<PingServiceConfig> {
    return { ...this.config };
  }
}

/**
 * Creates a ping service instance with default configuration for staging
 */
export function createStagingPingService(stagingUrl: string): PingService {
  return new PingService({
    url: stagingUrl,
    interval: 10 * 60 * 1000, // 10 minutes
    method: 'HEAD',
    timeout: 3000, // 3 seconds
    enabled: true,
    onSuccess: (response) => {
      console.log(`[Staging Ping] Success: ${response.status} (${response.responseTime}ms)`);
    },
    onFailure: (error) => {
      console.error(`[Staging Ping] Failed (${error.consecutiveFailures} consecutive):`, error.message);
    },
    onCircuitStateChange: (state) => {
      console.log(`[Staging Ping] Circuit breaker state changed to: ${state}`);
    },
  });
}
