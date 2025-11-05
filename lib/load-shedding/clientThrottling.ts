/**
 * Client-side Adaptive Throttling
 * Intelligent rate limiting based on server responses and load conditions
 */

export interface ThrottlingConfig {
  enabled: boolean;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
  windowSize: number; // Number of recent requests to consider
  throttleThreshold: number; // % of recent requests that trigger throttling
  recoveryFactor: number; // How quickly to recover from throttling
}

export interface RequestResult {
  timestamp: number;
  status: number;
  duration: number;
  throttled: boolean;
  retryAfter?: number;
}

export interface ThrottlingState {
  isThrottling: boolean;
  currentDelay: number;
  recentRequests: RequestResult[];
  throttleRate: number;
  lastThrottleTime: number;
  consecutiveSuccesses: number;
}

class ClientThrottling {
  private config: ThrottlingConfig;
  private state: ThrottlingState;
  private requestHistory: RequestResult[] = [];

  constructor(config: ThrottlingConfig) {
    this.config = config;
    this.state = {
      isThrottling: false,
      currentDelay: 0,
      recentRequests: [],
      throttleRate: 0,
      lastThrottleTime: 0,
      consecutiveSuccesses: 0
    };
  }

  async shouldThrottleRequest(): Promise<{
    shouldThrottle: boolean;
    delay: number;
    reason: string;
  }> {
    if (!this.config.enabled) {
      return {
        shouldThrottle: false,
        delay: 0,
        reason: 'Throttling disabled'
      };
    }

    // Update throttling state based on recent requests
    this.updateThrottlingState();

    if (this.state.isThrottling) {
      const delay = this.calculateDelay();
      return {
        shouldThrottle: true,
        delay,
        reason: `Adaptive throttling active (${this.state.throttleRate.toFixed(1)}% error rate)`
      };
    }

    return {
      shouldThrottle: false,
      delay: 0,
      reason: 'No throttling needed'
    };
  }

  recordRequestResult(result: RequestResult): void {
    // Add to request history
    this.requestHistory.push(result);
    
    // Keep only recent requests within window
    const cutoffTime = Date.now() - (this.config.windowSize * 60000); // windowSize in minutes
    this.requestHistory = this.requestHistory.filter(r => r.timestamp > cutoffTime);

    // Update state based on this result
    this.processRequestResult(result);
  }

  private updateThrottlingState(): void {
    const recentRequests = this.getRecentRequests();
    this.state.recentRequests = recentRequests;

    if (recentRequests.length === 0) {
      this.state.throttleRate = 0;
      this.state.isThrottling = false;
      return;
    }

    // Calculate throttle rate (429, 503, timeouts)
    const throttledRequests = recentRequests.filter(r => 
      r.status === 429 || r.status === 503 || r.throttled || r.duration > 30000
    );
    
    this.state.throttleRate = (throttledRequests.length / recentRequests.length) * 100;

    // Determine if we should throttle
    const shouldThrottle = this.state.throttleRate >= this.config.throttleThreshold;

    if (shouldThrottle && !this.state.isThrottling) {
      // Start throttling
      this.state.isThrottling = true;
      this.state.currentDelay = this.config.baseDelay;
      this.state.lastThrottleTime = Date.now();
      this.state.consecutiveSuccesses = 0;
      console.log(`🔄 Client throttling activated (${this.state.throttleRate.toFixed(1)}% error rate)`);
    } else if (!shouldThrottle && this.state.isThrottling) {
      // Check if we should stop throttling
      this.checkThrottlingRecovery();
    }
  }

  private processRequestResult(result: RequestResult): void {
    if (this.state.isThrottling) {
      if (result.status >= 200 && result.status < 300) {
        // Successful request
        this.state.consecutiveSuccesses++;
        
        // Reduce delay on success
        this.state.currentDelay = Math.max(
          this.config.baseDelay,
          this.state.currentDelay * this.config.recoveryFactor
        );
      } else if (result.status === 429 || result.status === 503) {
        // Server is still overloaded
        this.state.consecutiveSuccesses = 0;
        
        // Increase delay
        this.state.currentDelay = Math.min(
          this.config.maxDelay,
          this.state.currentDelay * this.config.backoffMultiplier
        );

        // Use server's Retry-After header if available
        if (result.retryAfter) {
          this.state.currentDelay = Math.max(this.state.currentDelay, result.retryAfter);
        }
      }
    }
  }

  private checkThrottlingRecovery(): void {
    const timeSinceThrottle = Date.now() - this.state.lastThrottleTime;
    const minRecoveryTime = this.config.baseDelay * 5; // Minimum time before recovery

    // Recovery conditions:
    // 1. Enough time has passed
    // 2. Recent success rate is good
    // 3. No recent throttling responses
    if (timeSinceThrottle > minRecoveryTime && 
        this.state.throttleRate < this.config.throttleThreshold / 2 &&
        this.state.consecutiveSuccesses >= 3) {
      
      this.state.isThrottling = false;
      this.state.currentDelay = 0;
      this.state.consecutiveSuccesses = 0;
      console.log(`✅ Client throttling deactivated (recovered)`);
    }
  }

  private calculateDelay(): number {
    let delay = this.state.currentDelay;

    // Add jitter if enabled
    if (this.config.jitter) {
      const jitterAmount = delay * 0.25; // ±25% jitter
      const jitter = (Math.random() - 0.5) * 2 * jitterAmount;
      delay += jitter;
    }

    return Math.max(0, Math.min(delay, this.config.maxDelay));
  }

  private getRecentRequests(): RequestResult[] {
    const cutoffTime = Date.now() - (5 * 60000); // Last 5 minutes
    return this.requestHistory.filter(r => r.timestamp > cutoffTime);
  }

  // Circuit breaker integration
  async executeWithThrottling<T>(
    operation: () => Promise<T>,
    operationName?: string
  ): Promise<T> {
    // Check if we should throttle
    const throttleCheck = await this.shouldThrottleRequest();
    
    if (throttleCheck.shouldThrottle) {
      console.log(`⏸️  Throttling ${operationName || 'request'} for ${throttleCheck.delay}ms: ${throttleCheck.reason}`);
      await this.sleep(throttleCheck.delay);
    }

    const startTime = Date.now();
    let result: T;
    let status = 200;
    let retryAfter: number | undefined;

    try {
      result = await operation();
      
      // Record successful request
      this.recordRequestResult({
        timestamp: Date.now(),
        status: 200,
        duration: Date.now() - startTime,
        throttled: false
      });

      return result;
    } catch (error: any) {
      // Determine status from error
      if (error.status) {
        status = error.status;
      } else if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
        status = 503;
      } else {
        status = 500;
      }

      // Extract Retry-After header if available
      if (error.headers && error.headers['retry-after']) {
        retryAfter = parseInt(error.headers['retry-after']) * 1000;
      }

      // Record failed request
      this.recordRequestResult({
        timestamp: Date.now(),
        status,
        duration: Date.now() - startTime,
        throttled: status === 429 || status === 503,
        retryAfter
      });

      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public API methods
  getState(): ThrottlingState {
    return { ...this.state };
  }

  getConfig(): ThrottlingConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<ThrottlingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  reset(): void {
    this.state = {
      isThrottling: false,
      currentDelay: 0,
      recentRequests: [],
      throttleRate: 0,
      lastThrottleTime: 0,
      consecutiveSuccesses: 0
    };
    this.requestHistory = [];
  }

  getMetrics(): {
    isThrottling: boolean;
    throttleRate: number;
    currentDelay: number;
    recentRequestCount: number;
    averageLatency: number;
    successRate: number;
  } {
    const recentRequests = this.getRecentRequests();
    const successfulRequests = recentRequests.filter(r => r.status >= 200 && r.status < 300);
    
    const averageLatency = recentRequests.length > 0
      ? recentRequests.reduce((sum, r) => sum + r.duration, 0) / recentRequests.length
      : 0;

    const successRate = recentRequests.length > 0
      ? (successfulRequests.length / recentRequests.length) * 100
      : 100;

    return {
      isThrottling: this.state.isThrottling,
      throttleRate: this.state.throttleRate,
      currentDelay: this.state.currentDelay,
      recentRequestCount: recentRequests.length,
      averageLatency,
      successRate
    };
  }
}

// Global instances for different services
const defaultConfig: ThrottlingConfig = {
  enabled: true,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitter: true,
  windowSize: 5, // 5 minutes
  throttleThreshold: 20, // 20% error rate triggers throttling
  recoveryFactor: 0.8
};

export const apiThrottling = new ClientThrottling(defaultConfig);

export const databaseThrottling = new ClientThrottling({
  ...defaultConfig,
  baseDelay: 500,
  maxDelay: 10000,
  throttleThreshold: 10 // More sensitive for database
});

export const cacheThrottling = new ClientThrottling({
  ...defaultConfig,
  baseDelay: 100,
  maxDelay: 5000,
  throttleThreshold: 30 // Less sensitive for cache
});

// Convenience functions
export const executeWithAPIThrottling = <T>(operation: () => Promise<T>, name?: string) =>
  apiThrottling.executeWithThrottling(operation, name);

export const executeWithDatabaseThrottling = <T>(operation: () => Promise<T>, name?: string) =>
  databaseThrottling.executeWithThrottling(operation, name);

export const executeWithCacheThrottling = <T>(operation: () => Promise<T>, name?: string) =>
  cacheThrottling.executeWithThrottling(operation, name);

// Integration with existing retry manager
export const executeWithThrottlingAndRetry = async <T>(
  operation: () => Promise<T>,
  throttling: ClientThrottling,
  retryConfig?: any
): Promise<T> => {
  const { retryManager } = await import('@/lib/recovery/retryManager');
  
  return retryManager.executeWithRetry(
    () => throttling.executeWithThrottling(operation),
    retryConfig
  );
};