import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  CircuitBreaker, 
  CircuitBreakerFactory, 
  CircuitBreakerOpenError,
  withCircuitBreaker 
} from '@/lib/services/circuit-breaker';

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker('test-service', {
      failureThreshold: 3,
      recoveryTimeout: 1000,
      monitoringWindow: 5000,
      expectedFailureRate: 10,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should execute successful operations normally', async () => {
      const mockOperation = vi.fn().mockResolvedValue('success');
      
      const result = await circuitBreaker.execute(mockOperation);
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledOnce();
      
      const metrics = circuitBreaker.getMetrics();
      expect(metrics.state).toBe('CLOSED');
      expect(metrics.successfulRequests).toBe(1);
      expect(metrics.failedRequests).toBe(0);
    });

    it('should track failures and open circuit when threshold reached', async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error('Service error'));
      
      // Fail 3 times to reach threshold
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(mockOperation);
        } catch (error) {
          // Expected to fail
        }
      }
      
      const metrics = circuitBreaker.getMetrics();
      expect(metrics.state).toBe('OPEN');
      expect(metrics.failedRequests).toBe(3);
      expect(metrics.circuitOpenCount).toBe(1);
    });

    it('should reject requests when circuit is open', async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error('Service error'));
      
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(mockOperation);
        } catch (error) {
          // Expected to fail
        }
      }
      
      // Next request should be rejected immediately
      await expect(circuitBreaker.execute(mockOperation))
        .rejects.toThrow(CircuitBreakerOpenError);
      
      // Operation should not be called when circuit is open
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('should use fallback when circuit is open', async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error('Service error'));
      const mockFallback = vi.fn().mockResolvedValue('fallback-result');
      
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(mockOperation);
        } catch (error) {
          // Expected to fail
        }
      }
      
      // Request with fallback should succeed
      const result = await circuitBreaker.execute(mockOperation, mockFallback);
      
      expect(result).toBe('fallback-result');
      expect(mockFallback).toHaveBeenCalledOnce();
    });
  });

  describe('Recovery Mechanism', () => {
    it('should transition to HALF_OPEN after recovery timeout', async () => {
      const mockOperation = vi.fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockRejectedValueOnce(new Error('Error 3'))
        .mockResolvedValueOnce('recovery-success');
      
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(mockOperation);
        } catch (error) {
          // Expected to fail
        }
      }
      
      expect(circuitBreaker.getMetrics().state).toBe('OPEN');
      
      // Wait for recovery timeout
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Next request should attempt recovery
      const result = await circuitBreaker.execute(mockOperation);
      
      expect(result).toBe('recovery-success');
      expect(circuitBreaker.getMetrics().state).toBe('CLOSED');
    });

    it('should remain open if recovery attempt fails', async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error('Service error'));
      
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(mockOperation);
        } catch (error) {
          // Expected to fail
        }
      }
      
      // Wait for recovery timeout
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Recovery attempt should fail
      try {
        await circuitBreaker.execute(mockOperation);
      } catch (error) {
        // Expected to fail
      }
      
      expect(circuitBreaker.getMetrics().state).toBe('OPEN');
    });
  });

  describe('Metrics and Monitoring', () => {
    it('should track response times correctly', async () => {
      const mockOperation = vi.fn()
        .mockImplementation(() => new Promise(resolve => setTimeout(() => resolve('success'), 100)));
      
      await circuitBreaker.execute(mockOperation);
      
      const metrics = circuitBreaker.getMetrics();
      expect(metrics.averageResponseTime).toBeGreaterThan(90);
      expect(metrics.averageResponseTime).toBeLessThan(150);
    });

    it('should calculate health status correctly', async () => {
      const mockOperation = vi.fn().mockResolvedValue('success');
      
      // All successful requests
      for (let i = 0; i < 10; i++) {
        await circuitBreaker.execute(mockOperation);
      }
      
      let metrics = circuitBreaker.getMetrics();
      expect(metrics.healthStatus).toBe('healthy');
      
      // Add some failures
      const failingOperation = vi.fn().mockRejectedValue(new Error('Error'));
      try {
        await circuitBreaker.execute(failingOperation);
      } catch (error) {
        // Expected to fail
      }
      
      metrics = circuitBreaker.getMetrics();
      expect(metrics.healthStatus).toBe('healthy'); // Still healthy with low failure rate
    });

    it('should track timeout metrics', async () => {
      const mockOperation = vi.fn()
        .mockImplementation(() => new Promise(resolve => setTimeout(resolve, 35000))); // Longer than timeout
      
      try {
        await circuitBreaker.execute(mockOperation);
      } catch (error) {
        expect(error.message).toContain('timeout');
      }
      
      const metrics = circuitBreaker.getMetrics();
      expect(metrics.timeouts).toBe(1);
    });
  });

  describe('Manual Control', () => {
    it('should allow manual circuit opening', () => {
      circuitBreaker.forceOpen();
      
      const metrics = circuitBreaker.getMetrics();
      expect(metrics.state).toBe('OPEN');
    });

    it('should allow manual circuit closing', async () => {
      // Open circuit first
      const mockOperation = vi.fn().mockRejectedValue(new Error('Service error'));
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(mockOperation);
        } catch (error) {
          // Expected to fail
        }
      }
      
      expect(circuitBreaker.getMetrics().state).toBe('OPEN');
      
      // Force close
      circuitBreaker.forceClose();
      
      expect(circuitBreaker.getMetrics().state).toBe('CLOSED');
      expect(circuitBreaker.getMetrics().failureCount).toBe(0);
    });

    it('should reset all metrics', async () => {
      const mockOperation = vi.fn().mockResolvedValue('success');
      
      await circuitBreaker.execute(mockOperation);
      
      let metrics = circuitBreaker.getMetrics();
      expect(metrics.totalRequests).toBe(1);
      
      circuitBreaker.reset();
      
      metrics = circuitBreaker.getMetrics();
      expect(metrics.totalRequests).toBe(0);
      expect(metrics.state).toBe('CLOSED');
    });
  });

  describe('Error Handling', () => {
    it('should handle fallback failures gracefully', async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error('Primary error'));
      const mockFallback = vi.fn().mockRejectedValue(new Error('Fallback error'));
      
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(mockOperation);
        } catch (error) {
          // Expected to fail
        }
      }
      
      // Both primary and fallback should fail
      await expect(circuitBreaker.execute(mockOperation, mockFallback))
        .rejects.toThrow('Both primary operation and fallback failed');
    });

    it('should handle different error types', async () => {
      const networkError = new Error('Network error');
      const timeoutError = new Error('Request timeout');
      const validationError = new Error('Validation failed');
      
      const mockOperation = vi.fn()
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(timeoutError)
        .mockRejectedValueOnce(validationError);
      
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(mockOperation);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      }
      
      expect(circuitBreaker.getMetrics().failedRequests).toBe(3);
    });
  });
});

describe('CircuitBreakerFactory', () => {
  beforeEach(() => {
    CircuitBreakerFactory.resetAll();
  });

  it('should create circuit breakers with predefined configurations', () => {
    const aiBreaker = CircuitBreakerFactory.getCircuitBreaker('openai', 'ai_service');
    const dbBreaker = CircuitBreakerFactory.getCircuitBreaker('postgres', 'database');
    
    expect(aiBreaker).toBeInstanceOf(CircuitBreaker);
    expect(dbBreaker).toBeInstanceOf(CircuitBreaker);
    
    const aiMetrics = aiBreaker.getMetrics();
    const dbMetrics = dbBreaker.getMetrics();
    
    expect(aiMetrics.config.failureThreshold).toBe(5);
    expect(dbMetrics.config.failureThreshold).toBe(3);
  });

  it('should reuse existing circuit breakers', () => {
    const breaker1 = CircuitBreakerFactory.getCircuitBreaker('test', 'ai_service');
    const breaker2 = CircuitBreakerFactory.getCircuitBreaker('test', 'ai_service');
    
    expect(breaker1).toBe(breaker2);
  });

  it('should allow custom configuration overrides', () => {
    const customBreaker = CircuitBreakerFactory.getCircuitBreaker('custom', 'ai_service', {
      failureThreshold: 10,
      recoveryTimeout: 30000,
    });
    
    const metrics = customBreaker.getMetrics();
    expect(metrics.config.failureThreshold).toBe(10);
    expect(metrics.config.recoveryTimeout).toBe(30000);
  });

  it('should collect metrics from all circuit breakers', async () => {
    const breaker1 = CircuitBreakerFactory.getCircuitBreaker('service1', 'ai_service');
    const breaker2 = CircuitBreakerFactory.getCircuitBreaker('service2', 'database');
    
    // Execute some operations
    await breaker1.execute(() => Promise.resolve('success'));
    await breaker2.execute(() => Promise.resolve('success'));
    
    const allMetrics = CircuitBreakerFactory.getAllMetrics();
    
    expect(allMetrics).toHaveProperty('ai_service:service1');
    expect(allMetrics).toHaveProperty('database:service2');
    expect(allMetrics['ai_service:service1'].totalRequests).toBe(1);
    expect(allMetrics['database:service2'].totalRequests).toBe(1);
  });

  it('should reset all circuit breakers', async () => {
    const breaker1 = CircuitBreakerFactory.getCircuitBreaker('service1', 'ai_service');
    const breaker2 = CircuitBreakerFactory.getCircuitBreaker('service2', 'database');
    
    // Execute some operations
    await breaker1.execute(() => Promise.resolve('success'));
    await breaker2.execute(() => Promise.resolve('success'));
    
    CircuitBreakerFactory.resetAll();
    
    const allMetrics = CircuitBreakerFactory.getAllMetrics();
    expect(allMetrics['ai_service:service1'].totalRequests).toBe(0);
    expect(allMetrics['database:service2'].totalRequests).toBe(0);
  });
});

describe('withCircuitBreaker Decorator', () => {
  class TestService {
    @withCircuitBreaker('test-method', 'ai_service', () => 'fallback-result')
    async testMethod(input: string): Promise<string> {
      if (input === 'fail') {
        throw new Error('Method failed');
      }
      return `processed: ${input}`;
    }

    @withCircuitBreaker('no-fallback', 'database')
    async methodWithoutFallback(input: string): Promise<string> {
      if (input === 'fail') {
        throw new Error('Method failed');
      }
      return `processed: ${input}`;
    }
  }

  let service: TestService;

  beforeEach(() => {
    service = new TestService();
    CircuitBreakerFactory.resetAll();
  });

  it('should apply circuit breaker to decorated methods', async () => {
    const result = await service.testMethod('success');
    expect(result).toBe('processed: success');
    
    const metrics = CircuitBreakerFactory.getAllMetrics();
    expect(metrics['ai_service:test-method'].totalRequests).toBe(1);
    expect(metrics['ai_service:test-method'].successfulRequests).toBe(1);
  });

  it('should use fallback when circuit is open', async () => {
    // Fail enough times to open circuit
    for (let i = 0; i < 5; i++) {
      try {
        await service.testMethod('fail');
      } catch (error) {
        // Expected to fail
      }
    }
    
    // Next call should use fallback
    const result = await service.testMethod('fail');
    expect(result).toBe('fallback-result');
  });

  it('should throw error when no fallback is provided and circuit is open', async () => {
    // Fail enough times to open circuit
    for (let i = 0; i < 3; i++) {
      try {
        await service.methodWithoutFallback('fail');
      } catch (error) {
        // Expected to fail
      }
    }
    
    // Next call should throw CircuitBreakerOpenError
    await expect(service.methodWithoutFallback('success'))
      .rejects.toThrow(CircuitBreakerOpenError);
  });
});

describe('Performance and Edge Cases', () => {
  it('should handle high-frequency requests', async () => {
    const circuitBreaker = new CircuitBreaker('high-frequency', {
      failureThreshold: 10,
      recoveryTimeout: 1000,
      monitoringWindow: 5000,
      expectedFailureRate: 5,
    });

    const mockOperation = vi.fn().mockResolvedValue('success');
    
    // Execute 100 concurrent requests
    const promises = Array(100).fill(null).map(() => 
      circuitBreaker.execute(mockOperation)
    );
    
    const results = await Promise.all(promises);
    
    expect(results).toHaveLength(100);
    expect(results.every(r => r === 'success')).toBe(true);
    
    const metrics = circuitBreaker.getMetrics();
    expect(metrics.totalRequests).toBe(100);
    expect(metrics.successfulRequests).toBe(100);
  });

  it('should handle mixed success/failure patterns', async () => {
    const circuitBreaker = new CircuitBreaker('mixed-pattern', {
      failureThreshold: 5,
      recoveryTimeout: 1000,
      monitoringWindow: 10000,
      expectedFailureRate: 20,
    });

    let callCount = 0;
    const mockOperation = vi.fn().mockImplementation(() => {
      callCount++;
      // Fail every 3rd request
      if (callCount % 3 === 0) {
        return Promise.reject(new Error('Intermittent failure'));
      }
      return Promise.resolve('success');
    });

    // Execute 15 requests
    const results = [];
    for (let i = 0; i < 15; i++) {
      try {
        const result = await circuitBreaker.execute(mockOperation);
        results.push(result);
      } catch (error) {
        results.push('error');
      }
    }

    const metrics = circuitBreaker.getMetrics();
    expect(metrics.totalRequests).toBe(15);
    expect(metrics.failedRequests).toBe(5); // Every 3rd request failed
    expect(metrics.successfulRequests).toBe(10);
    
    // Circuit should still be closed due to acceptable failure rate
    expect(metrics.state).toBe('CLOSED');
  });

  it('should handle rapid state transitions', async () => {
    const circuitBreaker = new CircuitBreaker('rapid-transitions', {
      failureThreshold: 2,
      recoveryTimeout: 100, // Very short recovery time
      monitoringWindow: 1000,
      expectedFailureRate: 10,
    });

    const mockOperation = vi.fn()
      .mockRejectedValueOnce(new Error('Error 1'))
      .mockRejectedValueOnce(new Error('Error 2'))
      .mockResolvedValueOnce('recovery');

    // Open circuit
    try { await circuitBreaker.execute(mockOperation); } catch {}
    try { await circuitBreaker.execute(mockOperation); } catch {}
    
    expect(circuitBreaker.getMetrics().state).toBe('OPEN');
    
    // Wait for recovery
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Should recover successfully
    const result = await circuitBreaker.execute(mockOperation);
    expect(result).toBe('recovery');
    expect(circuitBreaker.getMetrics().state).toBe('CLOSED');
  });
});