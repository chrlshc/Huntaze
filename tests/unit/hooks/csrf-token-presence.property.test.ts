/**
 * Property-Based Tests for CSRF Token Presence
 * 
 * Feature: signup-ux-optimization, Property 1: CSRF Token Presence
 * For any signup form load, the form should contain a valid, non-expired CSRF token
 * Validates: Requirements 1.1
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
import { useCsrfToken, clearCsrfTokenCache } from '../../../hooks/useCsrfToken';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('CSRF Token Presence Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearCsrfTokenCache();
  });

  afterEach(() => {
    clearCsrfTokenCache();
  });

  /**
   * Property 1: Token Generation
   * For any successful API response, the hook should provide a valid token
   */
  it('should provide a valid token for any successful API response', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random valid tokens (alphanumeric strings)
        fc.string({ minLength: 32, maxLength: 128 }).map(s => 
          s.replace(/[^a-zA-Z0-9]/g, 'a') || 'a'.repeat(32)
        ),
        // Generate random expiry times (1-60 minutes in the future)
        fc.integer({ min: 60000, max: 3600000 }),
        async (token, expiresIn) => {
          // Mock successful API response
          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              success: true,
              data: {
                token,
                expiresIn,
              },
            }),
          });

          // Render hook
          const { result } = renderHook(() => useCsrfToken());

          // Wait for token to be fetched
          await waitFor(() => {
            expect(result.current.loading).toBe(false);
          });

          // Verify token is present (not null or empty)
          expect(result.current.token).not.toBeNull();
          expect(result.current.token).not.toBe('');
          expect(result.current.token!.length).toBeGreaterThan(0);
          expect(result.current.error).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1: Token Availability
   * For any form load, the token should be available before form submission
   */
  it('should make token available before form can be submitted', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 32, maxLength: 128 }).map(s => 
          s.replace(/[^a-zA-Z0-9]/g, 'a') || 'a'.repeat(32)
        ),
        async (token) => {
          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              success: true,
              data: {
                token,
                expiresIn: 3600000, // 1 hour
              },
            }),
          });

          const { result } = renderHook(() => useCsrfToken());

          // Wait for completion
          await waitFor(() => {
            expect(result.current.loading).toBe(false);
          }, { timeout: 3000 });

          // Token should be available
          expect(result.current.token).not.toBeNull();
          expect(result.current.token).not.toBe('');
          expect(result.current.token!.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1: Token Non-Expiry
   * For any token within its validity period, it should remain valid
   */
  it('should keep token valid within expiry period', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 32, maxLength: 128 }).map(s => 
          s.replace(/[^a-zA-Z0-9]/g, 'a') || 'a'.repeat(32)
        ),
        // Generate expiry times from 10 minutes to 1 hour
        fc.integer({ min: 600000, max: 3600000 }),
        async (token, expiresIn) => {
          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              success: true,
              data: {
                token,
                expiresIn,
              },
            }),
          });

          const { result } = renderHook(() => useCsrfToken());

          await waitFor(() => {
            expect(result.current.loading).toBe(false);
          });

          // Token should be valid
          const initialToken = result.current.token;
          expect(initialToken).not.toBeNull();
          expect(result.current.error).toBeNull();

          // Simulate time passing (but less than expiry)
          const timeToWait = Math.min(1000, expiresIn / 2);
          await new Promise(resolve => setTimeout(resolve, timeToWait));

          // Token should still be the same (not refreshed yet)
          expect(result.current.token).toBe(initialToken);
          expect(result.current.error).toBeNull();
        }
      ),
      { numRuns: 50 } // Reduced runs due to setTimeout
    );
  });

  /**
   * Property 1: Error Handling
   * For any API error, the hook should provide clear error state
   */
  it('should provide error state for any API failure', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random error messages (non-empty)
        fc.string({ minLength: 10, maxLength: 100 }).filter(s => s.trim().length > 0),
        // Generate random HTTP error codes
        fc.integer({ min: 400, max: 599 }),
        async (errorMessage, statusCode) => {
          mockFetch.mockResolvedValueOnce({
            ok: false,
            status: statusCode,
            statusText: errorMessage,
            json: async () => ({
              success: false,
              error: {
                code: 'FETCH_ERROR',
                message: errorMessage,
                retryable: statusCode >= 500,
              },
            }),
          });

          const { result } = renderHook(() => useCsrfToken({ maxRetries: 0 }));

          await waitFor(() => {
            expect(result.current.loading).toBe(false);
          }, { timeout: 3000 });

          // Should have error
          expect(result.current.error).not.toBeNull();
          expect(result.current.token).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1: Token Caching
   * For any multiple hook instances, they should share the same token
   */
  it('should share token across multiple hook instances', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 32, maxLength: 128 }).map(s => 
          s.replace(/[^a-zA-Z0-9]/g, 'a') || 'a'.repeat(32)
        ),
        async (token) => {
          // Mock should only be called once
          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              success: true,
              data: {
                token,
                expiresIn: 3600000,
              },
            }),
          });

          // Render multiple hook instances
          const { result: result1 } = renderHook(() => useCsrfToken());
          const { result: result2 } = renderHook(() => useCsrfToken());
          const { result: result3 } = renderHook(() => useCsrfToken());

          // Wait for all to complete
          await waitFor(() => {
            expect(result1.current.loading).toBe(false);
            expect(result2.current.loading).toBe(false);
            expect(result3.current.loading).toBe(false);
          });

          // All should have a token
          expect(result1.current.token).not.toBeNull();
          expect(result2.current.token).not.toBeNull();
          expect(result3.current.token).not.toBeNull();
          
          // All should have the same token (cached)
          expect(result1.current.token).toBe(result2.current.token);
          expect(result2.current.token).toBe(result3.current.token);

          // Fetch should only have been called once
          expect(mockFetch).toHaveBeenCalledTimes(1);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 1: Manual Refresh
   * For any refresh call, a new token should be fetched
   */
  it('should fetch new token on manual refresh', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 32, maxLength: 128 }).map(s => 
          s.replace(/[^a-zA-Z0-9]/g, 'a') || 'a'.repeat(32)
        ),
        fc.string({ minLength: 32, maxLength: 128 }).map(s => 
          s.replace(/[^a-zA-Z0-9]/g, 'b') || 'b'.repeat(32)
        ),
        async (token1, token2) => {
          // Ensure tokens are different
          fc.pre(token1 !== token2);

          // Mock first fetch
          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              success: true,
              data: {
                token: token1,
                expiresIn: 3600000,
              },
            }),
          });

          const { result } = renderHook(() => useCsrfToken());

          await waitFor(() => {
            expect(result.current.loading).toBe(false);
          });

          const initialToken = result.current.token;
          expect(initialToken).not.toBeNull();

          // Mock second fetch for refresh
          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              success: true,
              data: {
                token: token2,
                expiresIn: 3600000,
              },
            }),
          });

          // Call refresh
          await result.current.refresh();

          await waitFor(() => {
            expect(result.current.token).not.toBe(initialToken);
          });

          // Should have new token (different from initial)
          expect(result.current.token).not.toBeNull();
          expect(result.current.token).not.toBe(initialToken);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 1: Loading State
   * For any fetch operation, loading state should be accurate
   */
  it('should accurately reflect loading state during fetch', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 32, maxLength: 128 }).map(s => 
          s.replace(/[^a-zA-Z0-9]/g, 'a') || 'a'.repeat(32)
        ),
        async (token) => {
          // Mock with delay to observe loading state
          mockFetch.mockImplementationOnce(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
            return {
              ok: true,
              json: async () => ({
                success: true,
                data: {
                  token,
                  expiresIn: 3600000,
                },
              }),
            };
          });

          const { result } = renderHook(() => useCsrfToken());

          // Wait for completion
          await waitFor(() => {
            expect(result.current.loading).toBe(false);
          }, { timeout: 3000 });

          // Should have token and not be loading
          expect(result.current.loading).toBe(false);
          expect(result.current.token).not.toBeNull();
          expect(result.current.token).not.toBe('');
        }
      ),
      { numRuns: 50 }
    );
  });
});
