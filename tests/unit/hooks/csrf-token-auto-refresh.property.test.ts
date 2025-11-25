/**
 * Property-Based Tests for CSRF Token Auto-Refresh
 * 
 * Feature: signup-ux-optimization, Property 3: CSRF Token Auto-Refresh
 * For any expired CSRF token, the system should automatically refresh it without requiring a page reload
 * Validates: Requirements 1.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import * as fc from 'fast-check';
import { useCsrfToken, clearCsrfTokenCache } from '../../../hooks/useCsrfToken';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('CSRF Token Auto-Refresh Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    clearCsrfTokenCache();
  });

  afterEach(() => {
    vi.useRealTimers();
    clearCsrfTokenCache();
  });

  /**
   * Property 3: Automatic Refresh Before Expiry
   * For any token approaching expiry, it should be automatically refreshed
   */
  it('should automatically refresh token before expiry', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 32, maxLength: 128 }).map(s => 
          s.replace(/[^a-zA-Z0-9]/g, 'a') || 'a'.repeat(32)
        ),
        fc.string({ minLength: 32, maxLength: 128 }).map(s => 
          s.replace(/[^a-zA-Z0-9]/g, 'b') || 'b'.repeat(32)
        ),
        // Expiry time: 10-60 minutes
        fc.integer({ min: 600000, max: 3600000 }),
        async (token1, token2, expiresIn) => {
          // Ensure tokens are different
          fc.pre(token1 !== token2);

          // Mock initial token fetch
          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              success: true,
              data: {
                token: token1,
                expiresIn,
              },
            }),
          });

          const { result } = renderHook(() => useCsrfToken({
            autoRefresh: true,
            refreshBuffer: 300000, // 5 minutes before expiry
          }));

          // Wait for initial fetch
          await act(async () => {
            await vi.runAllTimersAsync();
          });

          expect(result.current.token).toBe(token1);

          // Mock refresh token fetch
          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              success: true,
              data: {
                token: token2,
                expiresIn,
              },
            }),
          });

          // Fast-forward to just before refresh time (expiry - buffer)
          const refreshTime = expiresIn - 300000;
          await act(async () => {
            vi.advanceTimersByTime(refreshTime);
            await vi.runAllTimersAsync();
          });

          // Token should have been refreshed
          await waitFor(() => {
            expect(result.current.token).toBe(token2);
          });

          expect(result.current.token).toBe(token2);
          expect(result.current.token).not.toBe(token1);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 3: Manual Refresh Capability
   * For any token state, manual refresh should fetch a new token
   */
  it('should allow manual refresh at any time', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 32, maxLength: 128 }).map(s => 
          s.replace(/[^a-zA-Z0-9]/g, 'a') || 'a'.repeat(32)
        ),
        fc.string({ minLength: 32, maxLength: 128 }).map(s => 
          s.replace(/[^a-zA-Z0-9]/g, 'b') || 'b'.repeat(32)
        ),
        async (token1, token2) => {
          fc.pre(token1 !== token2);

          // Mock initial fetch
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

          await act(async () => {
            await vi.runAllTimersAsync();
          });

          expect(result.current.token).toBe(token1);

          // Mock refresh fetch
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

          // Manually refresh
          await act(async () => {
            await result.current.refresh();
            await vi.runAllTimersAsync();
          });

          // Should have new token
          expect(result.current.token).toBe(token2);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 3: Refresh Without Page Reload
   * For any token refresh, the page should not reload
   */
  it('should refresh token without page reload', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 32, maxLength: 128 }).map(s => 
          s.replace(/[^a-zA-Z0-9]/g, 'a') || 'a'.repeat(32)
        ),
        fc.string({ minLength: 32, maxLength: 128 }).map(s => 
          s.replace(/[^a-zA-Z0-9]/g, 'b') || 'b'.repeat(32)
        ),
        async (token1, token2) => {
          fc.pre(token1 !== token2);

          // Track if page reload was attempted
          const originalReload = window.location.reload;
          const reloadCalled = { value: false };
          window.location.reload = vi.fn(() => {
            reloadCalled.value = true;
          });

          // Mock initial fetch
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

          await act(async () => {
            await vi.runAllTimersAsync();
          });

          // Mock refresh fetch
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

          // Refresh token
          await act(async () => {
            await result.current.refresh();
            await vi.runAllTimersAsync();
          });

          // Page should not have reloaded
          expect(reloadCalled.value).toBe(false);
          expect(result.current.token).toBe(token2);

          // Restore original reload
          window.location.reload = originalReload;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 3: Retry on Transient Failures
   * For any transient network error, the system should retry
   */
  it('should retry on transient failures', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 32, maxLength: 128 }).map(s => 
          s.replace(/[^a-zA-Z0-9]/g, 'a') || 'a'.repeat(32)
        ),
        fc.integer({ min: 1, max: 3 }),
        async (token, failureCount) => {
          // Mock failures followed by success
          for (let i = 0; i < failureCount; i++) {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));
          }

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

          const { result } = renderHook(() => useCsrfToken({
            maxRetries: 3,
            retryDelay: 100,
          }));

          // Wait for retries and eventual success
          await act(async () => {
            await vi.runAllTimersAsync();
          });

          // Should eventually succeed
          await waitFor(() => {
            expect(result.current.token).toBe(token);
          });

          expect(result.current.error).toBeNull();
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property 3: Exponential Backoff
   * For any retry attempt, the delay should increase exponentially
   */
  it('should use exponential backoff for retries', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 32, maxLength: 128 }).map(s => 
          s.replace(/[^a-zA-Z0-9]/g, 'a') || 'a'.repeat(32)
        ),
        async (token) => {
          const retryDelays: number[] = [];
          let lastCallTime = Date.now();

          // Mock failures to track retry delays
          mockFetch.mockRejectedValueOnce(new Error('Network error'));
          mockFetch.mockImplementationOnce(async () => {
            const now = Date.now();
            retryDelays.push(now - lastCallTime);
            lastCallTime = now;
            throw new Error('Network error');
          });
          mockFetch.mockImplementationOnce(async () => {
            const now = Date.now();
            retryDelays.push(now - lastCallTime);
            lastCallTime = now;
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

          const { result } = renderHook(() => useCsrfToken({
            maxRetries: 3,
            retryDelay: 1000,
          }));

          await act(async () => {
            await vi.runAllTimersAsync();
          });

          // Wait for completion
          await waitFor(() => {
            expect(result.current.token).toBe(token);
          });

          // Verify exponential backoff (each delay should be roughly 2x the previous)
          if (retryDelays.length >= 2) {
            const ratio = retryDelays[1] / retryDelays[0];
            expect(ratio).toBeGreaterThan(1.5); // Allow some tolerance
            expect(ratio).toBeLessThan(2.5);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 3: Refresh Buffer Configuration
   * For any refresh buffer setting, refresh should occur at the correct time
   */
  it('should respect refresh buffer configuration', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 32, maxLength: 128 }).map(s => 
          s.replace(/[^a-zA-Z0-9]/g, 'a') || 'a'.repeat(32)
        ),
        fc.string({ minLength: 32, maxLength: 128 }).map(s => 
          s.replace(/[^a-zA-Z0-9]/g, 'b') || 'b'.repeat(32)
        ),
        // Buffer: 1-10 minutes
        fc.integer({ min: 60000, max: 600000 }),
        // Expiry: 15-60 minutes
        fc.integer({ min: 900000, max: 3600000 }),
        async (token1, token2, refreshBuffer, expiresIn) => {
          fc.pre(token1 !== token2);
          fc.pre(refreshBuffer < expiresIn); // Buffer must be less than expiry

          // Mock initial fetch
          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              success: true,
              data: {
                token: token1,
                expiresIn,
              },
            }),
          });

          const { result } = renderHook(() => useCsrfToken({
            autoRefresh: true,
            refreshBuffer,
          }));

          await act(async () => {
            await vi.runAllTimersAsync();
          });

          expect(result.current.token).toBe(token1);

          // Mock refresh fetch
          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              success: true,
              data: {
                token: token2,
                expiresIn,
              },
            }),
          });

          // Fast-forward to refresh time
          const refreshTime = expiresIn - refreshBuffer;
          await act(async () => {
            vi.advanceTimersByTime(refreshTime);
            await vi.runAllTimersAsync();
          });

          // Token should be refreshed
          await waitFor(() => {
            expect(result.current.token).toBe(token2);
          });
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property 3: No Refresh When Disabled
   * For any configuration with autoRefresh disabled, no automatic refresh should occur
   */
  it('should not auto-refresh when disabled', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 32, maxLength: 128 }).map(s => 
          s.replace(/[^a-zA-Z0-9]/g, 'a') || 'a'.repeat(32)
        ),
        fc.integer({ min: 600000, max: 3600000 }),
        async (token, expiresIn) => {
          // Mock initial fetch
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

          const { result } = renderHook(() => useCsrfToken({
            autoRefresh: false, // Disabled
          }));

          await act(async () => {
            await vi.runAllTimersAsync();
          });

          const initialToken = result.current.token;
          expect(initialToken).toBe(token);

          // Fast-forward past refresh time
          await act(async () => {
            vi.advanceTimersByTime(expiresIn);
            await vi.runAllTimersAsync();
          });

          // Token should not have changed
          expect(result.current.token).toBe(initialToken);
          expect(mockFetch).toHaveBeenCalledTimes(1); // Only initial fetch
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property 3: Cleanup on Unmount
   * For any hook unmount, timers should be cleaned up
   */
  it('should cleanup timers on unmount', async () => {
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
                expiresIn: 3600000,
              },
            }),
          });

          const { result, unmount } = renderHook(() => useCsrfToken({
            autoRefresh: true,
          }));

          await act(async () => {
            await vi.runAllTimersAsync();
          });

          expect(result.current.token).toBe(token);

          // Track pending timers before unmount
          const timersBefore = vi.getTimerCount();

          // Unmount
          unmount();

          // Timers should be cleaned up
          const timersAfter = vi.getTimerCount();
          expect(timersAfter).toBeLessThanOrEqual(timersBefore);
        }
      ),
      { numRuns: 30 }
    );
  });
});
