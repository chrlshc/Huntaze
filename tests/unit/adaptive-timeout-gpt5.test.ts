/**
 * Tests for Adaptive Timeout GPT-5 System
 * Validates error handling, retry logic, and API integration
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  AdaptiveTimeoutCalculator,
  CircuitBreakerWithAdaptiveTimeout,
  RetryExecutor,
  createAdaptiveCircuitBreaker,
  createTimeoutCalculator,
  AdaptiveTimeoutError,
  TimeoutExceededError,
  CircuitBreakerOpenError,
  CONFIG,
  RETRY_CONFIG,
  type TimeoutConfig,
  type LatencyMetric,
  type Logger
} from '@/lib/services/adaptive-timeout-gpt5';

// Mock logger
const mockLogger: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};

describe('AdaptiveTimeoutCalculator', () => {
  let calculator: AdaptiveTimeoutCalculator;

  beforeEach(() => {
    calculator = new AdaptiveTimeoutCalculator(mockLogger);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('calculateTimeout', () => {
    it('should calculate timeout for GPT-5 with high reasoning', () => {
      const config: TimeoutConfig = {
        model: 'gpt-5',
        reasoningEffort: 'high',
        tokenCount: 1500,
        systemLoad: 0.5
      };

      const result = calculator.calculateTimeout(config);

      expect(result.timeout).toBeGreaterThan(0);
      expect(result.reasoning.baseTimeout).toBe(CONFIG.baseTimeouts['gpt-5'].high);
      expect(result.reasoning.tokenAdjustment).toBeGreaterThan(0);
      expect(result.confidence).toBe('low'); // No historical data yet
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Calculating adaptive timeout',
        expect.objectContaining(config)
      );
    });

    it('should adjust timeout based on token count', () => {
      const lowTokenConfig: TimeoutConfig = {
        model: 'gpt-5',
        reasoningEffort: 'medium',
        tokenCount: 100,
        systemLoad: 0.3
      };

      const highTokenConfig: TimeoutConfig = {
        ...lowTokenConfig,
        tokenCount: 5000
      };

      const lowResult = calculator.calculateTimeout(lowTokenConfig);
      const highResult = calculator.calculateTimeout(highTokenConfig);

      expect(highResult.timeout).toBeGreaterThan(lowResult.timeout);
      expect(highResult.reasoning.tokenAdjustment).toBeGreaterThan(
        lowResult.reasoning.tokenAdjustment
      );
    });

    it('should adjust timeout based on system load', () => {
      const lowLoadConfig: TimeoutConfig = {
        model: 'gpt-5-mini',
        reasoningEffort: 'medium',
        tokenCount: 1000,
        systemLoad: 0.2
      };

      const highLoadConfig: TimeoutConfig = {
        ...lowLoadConfig,
        systemLoad: 0.9
      };

      const lowResult = calculator.calculateTimeout(lowLoadConfig);
      const highResult = calculator.calculateTimeout(highLoadConfig);

      expect(highResult.timeout).toBeGreaterThan(lowResult.timeout);
      expect(highResult.reasoning.loadAdjustment).toBeGreaterThan(
        lowResult.reasoning.loadAdjustment
      );
    });

    it('should respect minimum and maximum timeout limits', () => {
      const extremeConfig: TimeoutConfig = {
        model: 'gpt-5-nano',
        reasoningEffort: 'minimal',
        tokenCount: 10,
        systemLoad: 0.1
      };

      const result = calculator.calculateTimeout(extremeConfig);

      expect(result.timeout).toBeGreaterThanOrEqual(CONFIG.minTimeout);
      expect(result.timeout).toBeLessThanOrEqual(CONFIG.maxTimeout);
    });

    it('should throw error for invalid model', () => {
      const invalidConfig = {
        model: 'invalid-model' as any,
        reasoningEffort: 'high' as const,
        tokenCount: 1000,
        systemLoad: 0.5
      };

      expect(() => calculator.calculateTimeout(invalidConfig)).toThrow(AdaptiveTimeoutError);
      expect(() => calculator.calculateTimeout(invalidConfig)).toThrow('Invalid model');
    });

    it('should throw error for invalid token count', () => {
      const invalidConfig: TimeoutConfig = {
        model: 'gpt-5',
        reasoningEffort: 'high',
        tokenCount: -100,
        systemLoad: 0.5
      };

      expect(() => calculator.calculateTimeout(invalidConfig)).toThrow(AdaptiveTimeoutError);
      expect(() => calculator.calculateTimeout(invalidConfig)).toThrow('Invalid token count');
    });

    it('should improve confidence with more data', () => {
      const config: TimeoutConfig = {
        model: 'gpt-5',
        reasoningEffort: 'medium',
        tokenCount: 1000,
        systemLoad: 0.5
      };

      // First calculation - low confidence
      const result1 = calculator.calculateTimeout(config);
      expect(result1.confidence).toBe('low');

      // Record many successful completions
      for (let i = 0; i < 100; i++) {
        calculator.recordCompletion({
          timestamp: Date.now(),
          latency: 2000 + Math.random() * 1000,
          model: 'gpt-5',
          tokenCount: 1000,
          success: true,
          reasoningEffort: 'medium'
        });
      }

      // Second calculation - high confidence
      const result2 = calculator.calculateTimeout(config);
      expect(result2.confidence).toBe('high');
      expect(result2.metrics.sampleCount).toBeGreaterThanOrEqual(100);
    });

    it('should generate retry strategy', () => {
      const config: TimeoutConfig = {
        model: 'gpt-5',
        reasoningEffort: 'high',
        tokenCount: 2000,
        systemLoad: 0.6
      };

      const result = calculator.calculateTimeout(config);

      expect(result.recommendedRetryStrategy).toBeDefined();
      expect(result.recommendedRetryStrategy?.maxRetries).toBeGreaterThan(0);
      expect(result.recommendedRetryStrategy?.baseDelay).toBeGreaterThan(0);
      expect(result.recommendedRetryStrategy?.retryableErrors).toContain('TIMEOUT_EXCEEDED');
    });
  });

  describe('recordCompletion', () => {
    it('should record successful completion', () => {
      const metric: LatencyMetric = {
        timestamp: Date.now(),
        latency: 2500,
        model: 'gpt-5',
        tokenCount: 1500,
        success: true,
        reasoningEffort: 'high',
        requestId: 'req-123'
      };

      calculator.recordCompletion(metric);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Completion recorded',
        expect.objectContaining({
          model: 'gpt-5',
          latency: 2500,
          success: true
        })
      );
    });

    it('should record failed completion with error details', () => {
      const metric: LatencyMetric = {
        timestamp: Date.now(),
        latency: 5000,
        model: 'gpt-5',
        tokenCount: 1500,
        success: false,
        reasoningEffort: 'high',
        errorCode: 'TIMEOUT_EXCEEDED',
        errorMessage: 'Request timeout',
        requestId: 'req-456'
      };

      calculator.recordCompletion(metric);

      expect(mockLogger.debug).toHaveBeenCalled();
    });

    it('should handle recording errors gracefully', () => {
      const invalidMetric = null as any;

      expect(() => calculator.recordCompletion(invalidMetric)).not.toThrow();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('getHealthMetrics', () => {
    it('should return health metrics', () => {
      // Record some metrics
      for (let i = 0; i < 20; i++) {
        calculator.recordCompletion({
          timestamp: Date.now(),
          latency: 2000 + Math.random() * 1000,
          model: 'gpt-5',
          tokenCount: 1000,
          success: true,
          reasoningEffort: 'medium'
        });
      }

      const health = calculator.getHealthMetrics();

      expect(health).toHaveProperty('currentLoad');
      expect(health).toHaveProperty('buckets');
      expect(health).toHaveProperty('config');
      expect(health.currentLoad).toBeGreaterThanOrEqual(0);
      expect(health.currentLoad).toBeLessThanOrEqual(1);
    });
  });
});

describe('RetryExecutor', () => {
  let executor: RetryExecutor;

  beforeEach(() => {
    executor = new RetryExecutor(mockLogger);
    vi.clearAllMocks();
  });

  describe('executeWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');

      const result = await executor.executeWithRetry(mockFn, RETRY_CONFIG);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).not.toHaveBeenCalledWith(
        expect.stringContaining('Retry attempt')
      );
    });

    it('should retry on retryable error', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new TimeoutExceededError(5000))
        .mockRejectedValueOnce(new TimeoutExceededError(5000))
        .mockResolvedValue('success');

      const result = await executor.executeWithRetry(mockFn, RETRY_CONFIG);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
      expect(mockLogger.warn).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable error', async () => {
      const nonRetryableError = new AdaptiveTimeoutError(
        'Invalid API key',
        'INVALID_API_KEY',
        false
      );
      const mockFn = vi.fn().mockRejectedValue(nonRetryableError);

      await expect(executor.executeWithRetry(mockFn, RETRY_CONFIG)).rejects.toThrow(
        'Invalid API key'
      );

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should respect max retries', async () => {
      const mockFn = vi.fn().mockRejectedValue(new TimeoutExceededError(5000));

      await expect(executor.executeWithRetry(mockFn, RETRY_CONFIG)).rejects.toThrow();

      expect(mockFn).toHaveBeenCalledTimes(RETRY_CONFIG.maxRetries + 1);
    });

    it('should apply exponential backoff', async () => {
      const delays: number[] = [];
      const mockFn = vi.fn().mockRejectedValue(new TimeoutExceededError(5000));

      vi.spyOn(global, 'setTimeout').mockImplementation((callback: any, delay: number) => {
        delays.push(delay);
        callback();
        return {} as any;
      });

      await expect(executor.executeWithRetry(mockFn, RETRY_CONFIG)).rejects.toThrow();

      // Verify exponential backoff
      expect(delays.length).toBe(RETRY_CONFIG.maxRetries);
      expect(delays[1]).toBeGreaterThan(delays[0]);
      expect(delays[2]).toBeGreaterThan(delays[1]);
    });
  });
});

describe('CircuitBreakerWithAdaptiveTimeout', () => {
  let breaker: CircuitBreakerWithAdaptiveTimeout;

  beforeEach(() => {
    breaker = new CircuitBreakerWithAdaptiveTimeout(mockLogger);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    const config: TimeoutConfig = {
      model: 'gpt-5',
      reasoningEffort: 'medium',
      tokenCount: 1000,
      systemLoad: 0.5
    };

    it('should execute successfully', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');

      const result = await breaker.execute(mockFn, config, {
        requestId: 'req-123'
      });

      expect(result).toBe('success');
      expect(breaker.getState()).toBe('CLOSED');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Request completed successfully',
        expect.any(Object)
      );
    });

    it('should handle timeout', async () => {
      const slowFn = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100000))
      );

      await expect(
        breaker.execute(slowFn, config, { requestId: 'req-timeout' })
      ).rejects.toThrow(TimeoutExceededError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Request failed',
        expect.any(Error),
        expect.any(Object)
      );
    });

    it('should open circuit after threshold failures', async () => {
      const failingFn = vi.fn().mockRejectedValue(new Error('Service unavailable'));

      // Trigger failures to open circuit
      for (let i = 0; i < 5; i++) {
        await expect(breaker.execute(failingFn, config)).rejects.toThrow();
      }

      expect(breaker.getState()).toBe('OPEN');

      // Next request should fail immediately
      await expect(breaker.execute(failingFn, config)).rejects.toThrow(
        CircuitBreakerOpenError
      );

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Circuit breaker is OPEN',
        expect.any(Object)
      );
    });

    it('should transition to HALF_OPEN after timeout', async () => {
      const failingFn = vi.fn().mockRejectedValue(new Error('Service unavailable'));

      // Open circuit
      for (let i = 0; i < 5; i++) {
        await expect(breaker.execute(failingFn, config)).rejects.toThrow();
      }

      expect(breaker.getState()).toBe('OPEN');

      // Fast-forward time
      vi.useFakeTimers();
      vi.advanceTimersByTime(61000); // 61 seconds

      // Should transition to HALF_OPEN
      const successFn = vi.fn().mockResolvedValue('success');
      await breaker.execute(successFn, config);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('HALF_OPEN'),
        expect.any(Object)
      );

      vi.useRealTimers();
    });

    it('should close circuit after successful requests in HALF_OPEN', async () => {
      const failingFn = vi.fn().mockRejectedValue(new Error('Service unavailable'));
      const successFn = vi.fn().mockResolvedValue('success');

      // Open circuit
      for (let i = 0; i < 5; i++) {
        await expect(breaker.execute(failingFn, config)).rejects.toThrow();
      }

      // Manually set to HALF_OPEN for testing
      (breaker as any).state = 'HALF_OPEN';
      (breaker as any).successCount = 0;

      // Execute successful requests
      await breaker.execute(successFn, config);
      await breaker.execute(successFn, config);

      expect(breaker.getState()).toBe('CLOSED');
    });

    it('should execute with retry when enabled', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new TimeoutExceededError(5000))
        .mockResolvedValue('success');

      const result = await breaker.execute(mockFn, config, {
        enableRetry: true,
        requestId: 'req-retry'
      });

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should not retry when disabled', async () => {
      const mockFn = vi.fn().mockRejectedValue(new TimeoutExceededError(5000));

      await expect(
        breaker.execute(mockFn, config, { enableRetry: false })
      ).rejects.toThrow();

      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('getHealthMetrics', () => {
    it('should return health metrics', () => {
      const health = breaker.getHealthMetrics();

      expect(health).toHaveProperty('state');
      expect(health).toHaveProperty('failureCount');
      expect(health).toHaveProperty('successCount');
      expect(health).toHaveProperty('isHealthy');
      expect(health.state).toBe('CLOSED');
      expect(health.isHealthy).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset circuit breaker state', async () => {
      const failingFn = vi.fn().mockRejectedValue(new Error('Service unavailable'));

      // Open circuit
      for (let i = 0; i < 5; i++) {
        await expect(breaker.execute(failingFn, { 
          model: 'gpt-5',
          reasoningEffort: 'medium',
          tokenCount: 1000,
          systemLoad: 0.5
        })).rejects.toThrow();
      }

      expect(breaker.getState()).toBe('OPEN');

      // Reset
      breaker.reset();

      expect(breaker.getState()).toBe('CLOSED');
      expect(breaker.getHealthMetrics().failureCount).toBe(0);
      expect(mockLogger.info).toHaveBeenCalledWith('Resetting circuit breaker');
    });
  });
});

describe('Factory Functions', () => {
  it('should create circuit breaker with factory', () => {
    const breaker = createAdaptiveCircuitBreaker(mockLogger);

    expect(breaker).toBeInstanceOf(CircuitBreakerWithAdaptiveTimeout);
    expect(breaker.getState()).toBe('CLOSED');
  });

  it('should create timeout calculator with factory', () => {
    const calculator = createTimeoutCalculator(mockLogger);

    expect(calculator).toBeInstanceOf(AdaptiveTimeoutCalculator);
  });
});

describe('Error Types', () => {
  it('should create TimeoutExceededError with context', () => {
    const error = new TimeoutExceededError(5000, { requestId: 'req-123' });

    expect(error).toBeInstanceOf(AdaptiveTimeoutError);
    expect(error.name).toBe('TimeoutExceededError');
    expect(error.code).toBe('TIMEOUT_EXCEEDED');
    expect(error.retryable).toBe(true);
    expect(error.context).toHaveProperty('timeout', 5000);
    expect(error.context).toHaveProperty('requestId', 'req-123');
  });

  it('should create CircuitBreakerOpenError with reset time', () => {
    const resetTime = Date.now() + 60000;
    const error = new CircuitBreakerOpenError(resetTime);

    expect(error).toBeInstanceOf(AdaptiveTimeoutError);
    expect(error.name).toBe('CircuitBreakerOpenError');
    expect(error.code).toBe('CIRCUIT_BREAKER_OPEN');
    expect(error.retryable).toBe(false);
    expect(error.resetTime).toBe(resetTime);
  });
});

describe('Integration Tests', () => {
  it('should handle complete request lifecycle', async () => {
    const breaker = createAdaptiveCircuitBreaker(mockLogger);
    const config: TimeoutConfig = {
      model: 'gpt-5',
      reasoningEffort: 'high',
      tokenCount: 1500,
      systemLoad: 0.6
    };

    // Simulate API call
    const mockAPICall = vi.fn().mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return { response: 'GPT-5 response', tokens: 1500 };
    });

    const result = await breaker.execute(mockAPICall, config, {
      enableRetry: true,
      requestId: 'integration-test-1',
      userId: 'user-123'
    });

    expect(result).toHaveProperty('response');
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Executing request with adaptive timeout',
      expect.any(Object)
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Request completed successfully',
      expect.any(Object)
    );
  });

  it('should handle retry and recovery', async () => {
    const breaker = createAdaptiveCircuitBreaker(mockLogger);
    const config: TimeoutConfig = {
      model: 'gpt-5-mini',
      reasoningEffort: 'medium',
      tokenCount: 800,
      systemLoad: 0.4
    };

    let attempts = 0;
    const mockAPICall = vi.fn().mockImplementation(async () => {
      attempts++;
      if (attempts < 3) {
        throw new TimeoutExceededError(5000);
      }
      return { response: 'Success after retries' };
    });

    const result = await breaker.execute(mockAPICall, config, {
      enableRetry: true,
      requestId: 'retry-test-1'
    });

    expect(result).toHaveProperty('response', 'Success after retries');
    expect(attempts).toBe(3);
    expect(mockLogger.warn).toHaveBeenCalled();
  });
});
