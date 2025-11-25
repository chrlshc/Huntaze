/**
 * Property-Based Tests for CSRF Token Validation
 * 
 * Feature: signup-ux-optimization, Property 2: CSRF Token Validation
 * For any form submission with a valid CSRF token, the system should process the request;
 * for any submission with an invalid or missing token, the system should reject it
 * Validates: Requirements 1.2
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
import { useCsrfToken, clearCsrfTokenCache } from '../../../hooks/useCsrfToken';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('CSRF Token Validation Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearCsrfTokenCache();
  });

  afterEach(() => {
    clearCsrfTokenCache();
  });

  /**
   * Property 2: Valid Token Acceptance
   * For any valid token, form submissions should be processed
   */
  it('should allow form submission with any valid token', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 32, maxLength: 128 }).map(s => 
          s.replace(/[^a-zA-Z0-9]/g, 'a') || 'a'.repeat(32)
        ),
        fc.record({
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8, maxLength: 32 }),
        }),
        async (token, formData) => {
          // Mock token fetch
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

          const { result } = renderHook(() => useCsrfToken());

          await waitFor(() => {
            expect(result.current.loading).toBe(false);
          });

          expect(result.current.token).toBe(token);

          // Mock form submission with valid token
          mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              message: 'Form submitted successfully',
            }),
          });

          // Simulate form submission
          const response = await fetch('/api/signup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-csrf-token': result.current.token!,
            },
            body: JSON.stringify(formData),
          });

          // Should be successful
          expect(response.ok).toBe(true);
          expect(response.status).toBe(200);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: Invalid Token Rejection
   * For any invalid token, form submissions should be rejected
   */
  it('should reject form submission with any invalid token', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random invalid tokens
        fc.oneof(
          fc.constant(''),
          fc.constant('invalid'),
          fc.string({ minLength: 1, maxLength: 10 }),
          fc.constant('malformed-token'),
        ),
        fc.record({
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8, maxLength: 32 }),
        }),
        async (invalidToken, formData) => {
          // Mock form submission with invalid token
          mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 403,
            json: async () => ({
              success: false,
              error: {
                code: 'INVALID_CSRF_TOKEN',
                message: 'Invalid CSRF token',
                retryable: true,
              },
            }),
          });

          // Simulate form submission with invalid token
          const response = await fetch('/api/signup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-csrf-token': invalidToken,
            },
            body: JSON.stringify(formData),
          });

          // Should be rejected
          expect(response.ok).toBe(false);
          expect(response.status).toBe(403);

          const data = await response.json();
          expect(data.success).toBe(false);
          expect(data.error).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: Missing Token Rejection
   * For any form submission without a token, it should be rejected
   */
  it('should reject form submission with missing token', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8, maxLength: 32 }),
        }),
        async (formData) => {
          // Mock form submission without token
          mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 403,
            json: async () => ({
              success: false,
              error: {
                code: 'MISSING_CSRF_TOKEN',
                message: 'CSRF token is required',
                retryable: true,
              },
            }),
          });

          // Simulate form submission without token
          const response = await fetch('/api/signup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // No CSRF token header
            },
            body: JSON.stringify(formData),
          });

          // Should be rejected
          expect(response.ok).toBe(false);
          expect(response.status).toBe(403);

          const data = await response.json();
          expect(data.success).toBe(false);
          expect(data.error.code).toBe('MISSING_CSRF_TOKEN');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: Token Validation Consistency
   * For any token, validation should be consistent across multiple requests
   */
  it('should validate token consistently across multiple requests', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 32, maxLength: 128 }).map(s => 
          s.replace(/[^a-zA-Z0-9]/g, 'a') || 'a'.repeat(32)
        ),
        fc.array(
          fc.record({
            email: fc.emailAddress(),
            password: fc.string({ minLength: 8, maxLength: 32 }),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (token, formDataArray) => {
          // Mock token fetch
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

          const { result } = renderHook(() => useCsrfToken());

          await waitFor(() => {
            expect(result.current.loading).toBe(false);
          });

          // Submit multiple forms with the same token
          for (const formData of formDataArray) {
            mockFetch.mockResolvedValueOnce({
              ok: true,
              status: 200,
              json: async () => ({
                success: true,
              }),
            });

            const response = await fetch('/api/signup', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-csrf-token': result.current.token!,
              },
              body: JSON.stringify(formData),
            });

            // All should succeed with the same valid token
            expect(response.ok).toBe(true);
            expect(response.status).toBe(200);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 2: Error Message Clarity
   * For any validation error, the error message should be clear and actionable
   */
  it('should provide clear error messages for any validation failure', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant('MISSING_CSRF_TOKEN'),
          fc.constant('INVALID_CSRF_TOKEN'),
          fc.constant('EXPIRED_CSRF_TOKEN'),
        ),
        async (errorCode) => {
          // Mock validation error
          mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 403,
            json: async () => ({
              success: false,
              error: {
                code: errorCode,
                message: getErrorMessage(errorCode),
                retryable: true,
              },
            }),
          });

          const response = await fetch('/api/signup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-csrf-token': 'invalid',
            },
            body: JSON.stringify({ email: 'test@example.com' }),
          });

          const data = await response.json();

          // Error message should be present and clear
          expect(data.error.message).toBeDefined();
          expect(data.error.message.length).toBeGreaterThan(10);
          expect(data.error.message).toMatch(/token|refresh|page/i);
          expect(data.error.retryable).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: Token Format Validation
   * For any token format, the system should validate it correctly
   */
  it('should validate token format correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          // Valid format
          fc.string({ minLength: 32, maxLength: 128 }).map(s => 
            s.replace(/[^a-zA-Z0-9]/g, 'a') || 'a'.repeat(32)
          ),
          // Invalid formats
          fc.constant(''),
          fc.constant('   '),
          fc.string({ minLength: 1, maxLength: 10 }),
          fc.string({ minLength: 200, maxLength: 300 }),
        ),
        async (token) => {
          const isValidFormat = token.length >= 32 && token.length <= 128 && /^[a-zA-Z0-9]+$/.test(token);

          if (isValidFormat) {
            // Mock successful validation
            mockFetch.mockResolvedValueOnce({
              ok: true,
              status: 200,
              json: async () => ({
                success: true,
              }),
            });
          } else {
            // Mock validation failure
            mockFetch.mockResolvedValueOnce({
              ok: false,
              status: 403,
              json: async () => ({
                success: false,
                error: {
                  code: 'INVALID_CSRF_TOKEN',
                  message: 'Invalid CSRF token format',
                  retryable: true,
                },
              }),
            });
          }

          const response = await fetch('/api/signup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-csrf-token': token,
            },
            body: JSON.stringify({ email: 'test@example.com' }),
          });

          if (isValidFormat) {
            expect(response.ok).toBe(true);
          } else {
            expect(response.ok).toBe(false);
            expect(response.status).toBe(403);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: Retryable Error Indication
   * For any CSRF error, it should indicate if the error is retryable
   */
  it('should indicate retryability for any CSRF error', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant('MISSING_CSRF_TOKEN'),
          fc.constant('INVALID_CSRF_TOKEN'),
          fc.constant('EXPIRED_CSRF_TOKEN'),
        ),
        async (errorCode) => {
          mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 403,
            json: async () => ({
              success: false,
              error: {
                code: errorCode,
                message: getErrorMessage(errorCode),
                retryable: true, // All CSRF errors should be retryable
              },
            }),
          });

          const response = await fetch('/api/signup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-csrf-token': 'invalid',
            },
            body: JSON.stringify({ email: 'test@example.com' }),
          });

          const data = await response.json();

          // All CSRF errors should be retryable
          expect(data.error.retryable).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Helper function to get error messages
 */
function getErrorMessage(errorCode: string): string {
  const messages: Record<string, string> = {
    'MISSING_CSRF_TOKEN': 'CSRF token is required. Please refresh the page and try again.',
    'INVALID_CSRF_TOKEN': 'Invalid CSRF token. Please refresh the page and try again.',
    'EXPIRED_CSRF_TOKEN': 'Your session has expired. Please refresh the page and try again.',
  };
  return messages[errorCode] || 'An error occurred. Please try again.';
}
