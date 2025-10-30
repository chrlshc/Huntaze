/**
 * Tests for Enhanced Error Handler
 * Tests error classification, retry strategies, and fallback mechanisms
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  EnhancedErrorHandler, 
  ErrorType, 
  EnhancedError 
} from '@/lib/services/enhanced-error-handler';
import { TraceContext } from '@/lib/services/production-hybrid-orchestrator-v2';

describe('EnhancedErrorHandler', () => {
  let mockTraceContext: TraceContext;

  beforeEach(() => {
    mockTraceContext = {
      traceId: 'trace-123',
      spanId: 'span-456',
      userId: 'user-789',
      workflowId: 'workflow-abc',
      timestamp: new Date()
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('classifyError', () => {
    it('should classify rate limit errors correctly', () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.status = 429;

      const enhancedError = EnhancedErrorHandler.classifyError(rateLimitError, mockTraceContext);

      expect(enhancedError.type).toBe(ErrorType.RATE_LIMIT_EXCEEDED);
      expect(enhancedError.retryable).toBe(true);
      expect(enhancedError.retryAfter).toBe(60);
      expect(enhancedError.traceContext).toEqual(mockTraceContext);
      expect(enhancedError.originalError).toBe(rateLimitError);
    });

    it('should classify Azure timeout errors', () => {
      const timeoutError = new Error('Azure request timeout');
      timeoutError.code = 'TIMEOUT';

      const enhancedError = EnhancedErrorHandler.classifyError(timeoutError, mockTraceContext);

      expect(enhancedError.type).toBe(ErrorType.AZURE_TIMEOUT);
      expect(enhancedError.retryable).toBe(true);
      expect(enhancedError.retryAfter).toBe(30);
    });

    it('should classify OpenAI timeout errors', () => {
      const timeoutError = new Error('OpenAI timeout occurred');
      timeoutError.code = 'TIMEOUT';

      const enhancedError = EnhancedErrorHandler.classifyError(timeoutError, mockTraceContext);

      expect(enhancedError.type).toBe(ErrorType.OPENAI_TIMEOUT);
      expect(enhancedError.retryable).toBe(true);
      expect(enhancedError.retryAfter).toBe(30);
    });

    it('should classify OnlyFans API errors', () => {
      const ofError = new Error('OnlyFans API access denied');
      ofError.status = 403;

      const enhancedError = EnhancedErrorHandler.classifyError(ofError, mockTraceContext);

      expect(enhancedError.type).toBe(ErrorType.ONLYFANS_API_ERROR);
      expect(enhancedError.retryable).toBe(false);
      expect(enhancedError.retryAfter).toBeUndefined();
    });

    it('should classify database errors', () => {
      const dbError = new Error('Unique constraint violation');
      dbError.code = 'P2002';

      const enhancedError = EnhancedErrorHandler.classifyError(dbError, mockTraceContext);

      expect(enhancedError.type).toBe(ErrorType.DATABASE_ERROR);
      expect(enhancedError.retryable).toBe(true);
      expect(enhancedError.retryAfter).toBe(5);
    });

    it('should handle errors with custom retry-after header', () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.status = 429;
      rateLimitError.retryAfter = 120;

      const enhancedError = EnhancedErrorHandler.classifyError(rateLimitError, mockTraceContext);

      expect(enhancedError.type).toBe(ErrorType.RATE_LIMIT_EXCEEDED);
      expect(enhancedError.retryAfter).toBe(120);
    });

    it('should classify unknown errors as provider unavailable', () => {
      const unknownError = new Error('Something went wrong');

      const enhancedError = EnhancedErrorHandler.classifyError(unknownError, mockTraceContext);

      expect(enhancedError.type).toBe(ErrorType.PROVIDER_UNAVAILABLE);
      expect(enhancedError.retryable).toBe(true);
      expect(enhancedError.retryAfter).toBe(10);
    });

    it('should work without trace context', () => {
      const error = new Error('Test error');

      const enhancedError = EnhancedErrorHandler.classifyError(error);

      expect(enhancedError.type).toBe(ErrorType.PROVIDER_UNAVAILABLE);
      expect(enhancedError.traceContext).toBeUndefined();
    });
  });

  describe('getRetryStrategy', () => {
    it('should return no retry for non-retryable errors', () => {
      const error = new Error('OnlyFans API error') as EnhancedError;
      error.type = ErrorType.ONLYFANS_API_ERROR;
      error.retryable = false;

      const strategy = EnhancedErrorHandler.getRetryStrategy(error);

      expect(strategy.shouldRetry).toBe(false);
      expect(strategy.delayMs).toBe(0);
      expect(strategy.maxRetries).toBe(0);
    });

    it('should return appropriate strategy for rate limit errors', () => {
      const error = new Error('Rate limit exceeded') as EnhancedError;
      error.type = ErrorType.RATE_LIMIT_EXCEEDED;
      error.retryable = true;
      error.retryAfter = 90;

      const strategy = EnhancedErrorHandler.getRetryStrategy(error);

      expect(strategy.shouldRetry).toBe(true);
      expect(strategy.delayMs).toBe(90000); // 90 seconds in ms
      expect(strategy.maxRetries).toBe(3);
    });

    it('should return strategy for timeout errors', () => {
      const error = new Error('Azure timeout') as EnhancedError;
      error.type = ErrorType.AZURE_TIMEOUT;
      error.retryable = true;

      const strategy = EnhancedErrorHandler.getRetryStrategy(error);

      expect(strategy.shouldRetry).toBe(true);
      expect(strategy.delayMs).toBe(5000);
      expect(strategy.maxRetries).toBe(2);
    });

    it('should return strategy for database errors', () => {
      const error = new Error('Database error') as EnhancedError;
      error.type = ErrorType.DATABASE_ERROR;
      error.retryable = true;

      const strategy = EnhancedErrorHandler.getRetryStrategy(error);

      expect(strategy.shouldRetry).toBe(true);
      expect(strategy.delayMs).toBe(1000);
      expect(strategy.maxRetries).toBe(5);
    });

    it('should return default strategy for unknown retryable errors', () => {
      const error = new Error('Unknown error') as EnhancedError;
      error.type = ErrorType.PROVIDER_UNAVAILABLE;
      error.retryable = true;

      const strategy = EnhancedErrorHandler.getRetryStrategy(error);

      expect(strategy.shouldRetry).toBe(true);
      expect(strategy.delayMs).toBe(2000);
      expect(strategy.maxRetries).toBe(3);
    });
  });

  describe('executeWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const mockOperation = vi.fn().mockResolvedValue('success');

      const result = await EnhancedErrorHandler.executeWithRetry(
        mockOperation,
        mockTraceContext,
        3
      );

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors with exponential backoff', async () => {
      const mockOperation = vi.fn()
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockRejectedValueOnce(new Error('Another temporary failure'))
        .mockResolvedValue('success');

      // Mock setTimeout to avoid actual delays in tests
      vi.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback();
        return {} as any;
      });

      const result = await EnhancedErrorHandler.executeWithRetry(
        mockOperation,
        mockTraceContext,
        3
      );

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries exceeded', async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error('Persistent failure'));

      vi.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback();
        return {} as any;
      });

      await expect(
        EnhancedErrorHandler.executeWithRetry(mockOperation, mockTraceContext, 2)
      ).rejects.toThrow('Persistent failure');

      expect(mockOperation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should not retry non-retryable errors', async () => {
      const nonRetryableError = new Error('OnlyFans API forbidden');
      nonRetryableError.status = 403;
      
      const mockOperation = vi.fn().mockRejectedValue(nonRetryableError);

      await expect(
        EnhancedErrorHandler.executeWithRetry(mockOperation, mockTraceContext, 3)
      ).rejects.toThrow('OnlyFans API forbidden');

      expect(mockOperation).toHaveBeenCalledTimes(1); // No retries
    });

    it('should apply exponential backoff correctly', async () => {
      const mockOperation = vi.fn()
        .mockRejectedValueOnce(new Error('Failure 1'))
        .mockRejectedValueOnce(new Error('Failure 2'))
        .mockResolvedValue('success');

      const setTimeoutSpy = vi.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback();
        return {} as any;
      });

      await EnhancedErrorHandler.executeWithRetry(mockOperation, mockTraceContext, 3);

      // Verify exponential backoff delays
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 2000); // First retry: 2000ms * 2^0
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 4000); // Second retry: 2000ms * 2^1
    });

    it('should handle rate limit errors with custom delay', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.status = 429;
      rateLimitError.retryAfter = 30;

      const mockOperation = vi.fn()
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValue('success');

      const setTimeoutSpy = vi.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback();
        return {} as any;
      });

      await EnhancedErrorHandler.executeWithRetry(mockOperation, mockTraceContext, 2);

      // Should use the rate limit delay (30s * 1000ms)
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 30000);
    });

    it('should log retry attempts', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const mockOperation = vi.fn()
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValue('success');

      vi.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback();
        return {} as any;
      });

      await EnhancedErrorHandler.executeWithRetry(mockOperation, mockTraceContext, 2);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[RETRY] Attempt 1/3 failed'),
        expect.objectContaining({
          error: 'Temporary failure',
          type: ErrorType.PROVIDER_UNAVAILABLE,
          traceContext: mockTraceContext
        })
      );
    });

    it('should work without trace context', async () => {
      const mockOperation = vi.fn()
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValue('success');

      vi.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback();
        return {} as any;
      });

      const result = await EnhancedErrorHandler.executeWithRetry(mockOperation, undefined, 2);

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('should handle async operation errors correctly', async () => {
      const asyncError = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Async failure')), 10);
      });

      const mockOperation = vi.fn().mockReturnValue(asyncError);

      await expect(
        EnhancedErrorHandler.executeWithRetry(mockOperation, mockTraceContext, 1)
      ).rejects.toThrow('Async failure');
    });
  });

  describe('Error Type Classification Edge Cases', () => {
    it('should handle errors without status codes', () => {
      const error = new Error('rate limit in message');

      const enhancedError = EnhancedErrorHandler.classifyError(error);

      expect(enhancedError.type).toBe(ErrorType.RATE_LIMIT_EXCEEDED);
      expect(enhancedError.retryable).toBe(true);
    });

    it('should handle errors with both message and status indicators', () => {
      const error = new Error('OnlyFans rate limit exceeded');
      error.status = 429;

      const enhancedError = EnhancedErrorHandler.classifyError(error);

      // Should prioritize status code over message content
      expect(enhancedError.type).toBe(ErrorType.RATE_LIMIT_EXCEEDED);
    });

    it('should handle null or undefined errors', () => {
      const enhancedError1 = EnhancedErrorHandler.classifyError(null);
      const enhancedError2 = EnhancedErrorHandler.classifyError(undefined);

      expect(enhancedError1.type).toBe(ErrorType.PROVIDER_UNAVAILABLE);
      expect(enhancedError2.type).toBe(ErrorType.PROVIDER_UNAVAILABLE);
    });

    it('should handle errors with nested error objects', () => {
      const nestedError = new Error('Wrapper error');
      nestedError.cause = new Error('Azure timeout occurred');

      const enhancedError = EnhancedErrorHandler.classifyError(nestedError);

      expect(enhancedError.type).toBe(ErrorType.PROVIDER_UNAVAILABLE);
      expect(enhancedError.originalError).toBe(nestedError);
    });
  });
});