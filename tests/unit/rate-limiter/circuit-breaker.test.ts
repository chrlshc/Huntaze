/**
 * Circuit Breaker Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CircuitBreaker } from '../../../lib/services/rate-limiter/circuit-breaker';

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;
  
  beforeEach(() => {
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 1000, // 1 second for testing
      halfOpenSuccessThreshold: 2,
    });
  });
  
  describe('State Transitions', () => {
    it('should start in closed state', () => {
      expect(circuitBreaker.getState()).toBe('closed');
    });
    
    it('should transition to open after failure threshold', async () => {
      const failingFn = async () => {
        throw new Error('Redis connection failed');
      };
      const fallback = () => 'fallback';
      
      // Execute 3 times to hit threshold
      await circuitBreaker.execute(failingFn, fallback);
      await circuitBreaker.execute(failingFn, fallback);
      await circuitBreaker.execute(failingFn, fallback);
      
      expect(circuitBreaker.getState()).toBe('open');
    });
    
    it('should use fallback when circuit is open', async () => {
      const failingFn = async () => {
        throw new Error('Redis connection failed');
      };
      const fallback = () => 'fallback-value';
      
      // Open the circuit
      await circuitBreaker.execute(failingFn, fallback);
      await circuitBreaker.execute(failingFn, fallback);
      await circuitBreaker.execute(failingFn, fallback);
      
      // Next call should use fallback without calling fn
      const fnSpy = vi.fn(failingFn);
      const result = await circuitBreaker.execute(fnSpy, fallback);
      
      expect(result).toBe('fallback-value');
      expect(fnSpy).not.toHaveBeenCalled();
    });
    
    it('should transition to half-open after reset timeout', async () => {
      const failingFn = async () => {
        throw new Error('Redis connection failed');
      };
      const fallback = () => 'fallback';
      
      // Open the circuit
      await circuitBreaker.execute(failingFn, fallback);
      await circuitBreaker.execute(failingFn, fallback);
      await circuitBreaker.execute(failingFn, fallback);
      
      expect(circuitBreaker.getState()).toBe('open');
      
      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Next execution should transition to half-open
      const successFn = async () => 'success';
      await circuitBreaker.execute(successFn, fallback);
      
      expect(circuitBreaker.getState()).toBe('half-open');
    });
    
    it('should transition to closed after successful half-open attempts', async () => {
      const failingFn = async () => {
        throw new Error('Redis connection failed');
      };
      const successFn = async () => 'success';
      const fallback = () => 'fallback';
      
      // Open the circuit
      await circuitBreaker.execute(failingFn, fallback);
      await circuitBreaker.execute(failingFn, fallback);
      await circuitBreaker.execute(failingFn, fallback);
      
      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Execute successful requests in half-open state
      await circuitBreaker.execute(successFn, fallback);
      await circuitBreaker.execute(successFn, fallback);
      
      expect(circuitBreaker.getState()).toBe('closed');
    });
    
    it('should reopen circuit on failure in half-open state', async () => {
      const failingFn = async () => {
        throw new Error('Redis connection failed');
      };
      const fallback = () => 'fallback';
      
      // Open the circuit
      await circuitBreaker.execute(failingFn, fallback);
      await circuitBreaker.execute(failingFn, fallback);
      await circuitBreaker.execute(failingFn, fallback);
      
      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Fail in half-open state
      await circuitBreaker.execute(failingFn, fallback);
      
      expect(circuitBreaker.getState()).toBe('open');
    });
  });
  
  describe('Failure Tracking', () => {
    it('should reset failure count on success in closed state', async () => {
      const failingFn = async () => {
        throw new Error('Redis connection failed');
      };
      const successFn = async () => 'success';
      const fallback = () => 'fallback';
      
      // Fail twice
      await circuitBreaker.execute(failingFn, fallback);
      await circuitBreaker.execute(failingFn, fallback);
      
      const stats = circuitBreaker.getStats();
      expect(stats.failureCount).toBe(2);
      
      // Succeed once
      await circuitBreaker.execute(successFn, fallback);
      
      const statsAfter = circuitBreaker.getStats();
      expect(statsAfter.failureCount).toBe(0);
    });
  });
  
  describe('Manual Reset', () => {
    it('should reset circuit breaker to closed state', async () => {
      const failingFn = async () => {
        throw new Error('Redis connection failed');
      };
      const fallback = () => 'fallback';
      
      // Open the circuit
      await circuitBreaker.execute(failingFn, fallback);
      await circuitBreaker.execute(failingFn, fallback);
      await circuitBreaker.execute(failingFn, fallback);
      
      expect(circuitBreaker.getState()).toBe('open');
      
      // Manual reset
      circuitBreaker.reset();
      
      expect(circuitBreaker.getState()).toBe('closed');
      const stats = circuitBreaker.getStats();
      expect(stats.failureCount).toBe(0);
    });
  });
  
  describe('Statistics', () => {
    it('should provide accurate statistics', async () => {
      const failingFn = async () => {
        throw new Error('Redis connection failed');
      };
      const fallback = () => 'fallback';
      
      await circuitBreaker.execute(failingFn, fallback);
      await circuitBreaker.execute(failingFn, fallback);
      
      const stats = circuitBreaker.getStats();
      
      expect(stats.state).toBe('closed');
      expect(stats.failureCount).toBe(2);
      expect(stats.successCount).toBe(0);
      expect(stats.lastFailureTime).toBeGreaterThan(0);
    });
  });
});
