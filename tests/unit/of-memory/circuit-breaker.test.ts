/**
 * Circuit Breaker Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CircuitBreaker,
  CircuitState,
  CircuitBreakerError,
  CircuitBreakerRegistry
} from '@/lib/of-memory/utils/circuit-breaker';

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker({
      name: 'test-breaker',
      failureThreshold: 3,
      resetTimeout: 1000,
      monitoringPeriod: 5000
    });
  });

  describe('Normal Operation (CLOSED state)', () => {
    it('should execute function successfully when circuit is closed', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await breaker.execute(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should track successful executions', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      
      await breaker.execute(fn);
      await breaker.execute(fn);
      
      const stats = breaker.getStats();
      expect(stats.successes).toBe(2);
      expect(stats.failures).toBe(0);
    });
  });

  describe('Failure Handling', () => {
    it('should track failures', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('test error'));

      try {
        await breaker.execute(fn);
      } catch (error) {
        // Expected
      }

      const stats = breaker.getStats();
      expect(stats.failures).toBe(1);
      expect(stats.lastFailureTime).not.toBeNull();
    });

    it('should open circuit after threshold failures', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('test error'));

      // Trigger 3 failures (threshold)
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(fn);
        } catch (error) {
          // Expected
        }
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });

    it('should reject requests when circuit is open', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('test error'));

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(fn);
        } catch (error) {
          // Expected
        }
      }

      // Try to execute when open
      await expect(breaker.execute(fn)).rejects.toThrow(CircuitBreakerError);
    });
  });

  describe('Fallback Mechanism', () => {
    it('should use fallback when circuit is open', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('test error'));
      const fallback = vi.fn().mockResolvedValue('fallback-value');

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(fn);
        } catch (error) {
          // Expected
        }
      }

      // Execute with fallback
      const result = await breaker.execute(fn, fallback);
      
      expect(result).toBe('fallback-value');
      expect(fallback).toHaveBeenCalled();
    });

    it('should use fallback on failure even when closed', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('test error'));
      const fallback = vi.fn().mockResolvedValue('fallback-value');

      const result = await breaker.execute(fn, fallback);
      
      expect(result).toBe('fallback-value');
      expect(fallback).toHaveBeenCalled();
    });
  });

  describe('Half-Open State', () => {
    it('should transition to half-open after reset timeout', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('test error'));

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(fn);
        } catch (error) {
          // Expected
        }
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Next call should transition to half-open
      fn.mockResolvedValue('success');
      await breaker.execute(fn);

      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('Manual Reset', () => {
    it('should reset circuit breaker state', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('test error'));

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(fn);
        } catch (error) {
          // Expected
        }
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Manual reset
      breaker.reset();

      expect(breaker.getState()).toBe(CircuitState.CLOSED);
      const stats = breaker.getStats();
      expect(stats.failures).toBe(0);
      expect(stats.successes).toBe(0);
    });
  });
});

describe('CircuitBreakerRegistry', () => {
  let registry: CircuitBreakerRegistry;

  beforeEach(() => {
    registry = new CircuitBreakerRegistry();
  });

  it('should create and retrieve circuit breakers', () => {
    const breaker1 = registry.getOrCreate('test-1');
    const breaker2 = registry.getOrCreate('test-1');

    expect(breaker1).toBe(breaker2); // Same instance
  });

  it('should create different breakers for different names', () => {
    const breaker1 = registry.getOrCreate('test-1');
    const breaker2 = registry.getOrCreate('test-2');

    expect(breaker1).not.toBe(breaker2);
  });

  it('should get stats for all breakers', async () => {
    const breaker1 = registry.getOrCreate('test-1');
    const breaker2 = registry.getOrCreate('test-2');

    const fn = vi.fn().mockResolvedValue('success');
    await breaker1.execute(fn);
    await breaker2.execute(fn);

    const stats = registry.getAllStats();
    
    expect(stats['test-1']).toBeDefined();
    expect(stats['test-2']).toBeDefined();
    expect(stats['test-1'].successes).toBe(1);
    expect(stats['test-2'].successes).toBe(1);
  });

  it('should reset all breakers', async () => {
    const breaker1 = registry.getOrCreate('test-1');
    const breaker2 = registry.getOrCreate('test-2');

    const fn = vi.fn().mockResolvedValue('success');
    await breaker1.execute(fn);
    await breaker2.execute(fn);

    registry.resetAll();

    const stats = registry.getAllStats();
    expect(stats['test-1'].successes).toBe(0);
    expect(stats['test-2'].successes).toBe(0);
  });

  it('should reset specific breaker', async () => {
    const breaker1 = registry.getOrCreate('test-1');
    const breaker2 = registry.getOrCreate('test-2');

    const fn = vi.fn().mockResolvedValue('success');
    await breaker1.execute(fn);
    await breaker2.execute(fn);

    registry.reset('test-1');

    const stats = registry.getAllStats();
    expect(stats['test-1'].successes).toBe(0);
    expect(stats['test-2'].successes).toBe(1);
  });
});
