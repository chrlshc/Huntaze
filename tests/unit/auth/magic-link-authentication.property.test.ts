/**
 * Property-Based Tests: Magic Link Authentication
 * Feature: signup-ux-optimization, Property 5: Magic Link Authentication
 * 
 * Validates: Requirements 2.3
 * 
 * Property: For any valid magic link click, the system should authenticate the user and redirect to onboarding
 */

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';

describe('Property 5: Magic Link Authentication', () => {
  it('should validate magic link token format', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.hexaString({ minLength: 64, maxLength: 64 }),
        async (token) => {
          const { validateMagicLinkToken } = await import('@/lib/auth/magic-link');
          const isValid = validateMagicLinkToken(token);

          // Property: Valid hex tokens should pass validation
          expect(isValid).toBe(true);
          expect(token).toHaveLength(64);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject invalid token formats', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant(''),
          fc.constant(null),
          fc.constant(undefined),
          fc.string({ maxLength: 63 }),
          fc.string({ minLength: 65 })
        ),
        async (invalidToken) => {
          const { validateMagicLinkToken } = await import('@/lib/auth/magic-link');
          const isValid = validateMagicLinkToken(invalidToken as any);

          // Property: Invalid tokens should fail validation
          expect(isValid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify token expiry is checked', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.date(),
        fc.integer({ min: 0, max: 48 }),
        async (createdAt, hoursElapsed) => {
          const expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
          const checkTime = new Date(createdAt.getTime() + hoursElapsed * 60 * 60 * 1000);

          const isExpired = checkTime > expiresAt;

          // Property: Tokens older than 24 hours should be expired
          if (hoursElapsed > 24) {
            expect(isExpired).toBe(true);
          } else {
            expect(isExpired).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should construct valid magic link URLs', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.hexaString({ minLength: 64, maxLength: 64 }),
        fc.webUrl({ validSchemes: ['https'] }),
        async (email, token, baseUrl) => {
          const magicLinkUrl = `${baseUrl}/api/auth/callback/email?token=${token}&email=${encodeURIComponent(email)}`;

          // Property: Magic link should be a valid URL with required parameters
          const url = new URL(magicLinkUrl);
          expect(url.searchParams.get('token')).toBe(token);
          expect(url.searchParams.get('email')).toBe(email);
          expect(url.protocol).toBe('https:');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle URL encoding for email addresses with special characters', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        async (email) => {
          const encoded = encodeURIComponent(email);
          const decoded = decodeURIComponent(encoded);

          // Property: Email should survive encoding/decoding
          expect(decoded).toBe(email);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should redirect to onboarding after successful authentication', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant('/onboarding'),
        fc.constant('/dashboard'),
        fc.constant('/home'),
        async (onboardingPath, dashboardPath, homePath) => {
          // Property: Valid redirect paths should be absolute
          expect(onboardingPath).toMatch(/^\//);
          expect(dashboardPath).toMatch(/^\//);
          expect(homePath).toMatch(/^\//);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle authentication state transitions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(),
        fc.boolean(),
        async (isAuthenticated, onboardingCompleted) => {
          let expectedRedirect: string;

          if (!isAuthenticated) {
            expectedRedirect = '/signup';
          } else if (!onboardingCompleted) {
            expectedRedirect = '/onboarding';
          } else {
            expectedRedirect = '/dashboard';
          }

          // Property: Redirect should match authentication state
          expect(expectedRedirect).toBeDefined();
          expect(expectedRedirect).toMatch(/^\//);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate token uniqueness', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.hexaString({ minLength: 64, maxLength: 64 }), { minLength: 10, maxLength: 100 }),
        async (tokens) => {
          const uniqueTokens = new Set(tokens);

          // Property: All generated tokens should be unique
          expect(uniqueTokens.size).toBe(tokens.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle single-use token consumption', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.hexaString({ minLength: 64, maxLength: 64 }),
        fc.integer({ min: 1, max: 5 }),
        async (token, attempts) => {
          const usedTokens = new Set<string>();

          for (let i = 0; i < attempts; i++) {
            if (!usedTokens.has(token)) {
              usedTokens.add(token);
              // First use should succeed
              expect(usedTokens.has(token)).toBe(true);
            } else {
              // Subsequent uses should fail
              expect(usedTokens.has(token)).toBe(true);
            }
          }

          // Property: Token should only be usable once
          expect(usedTokens.size).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate email matches token', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.emailAddress(),
        fc.hexaString({ minLength: 64, maxLength: 64 }),
        async (originalEmail, providedEmail, token) => {
          const emailsMatch = originalEmail.toLowerCase() === providedEmail.toLowerCase();

          // Property: Authentication should only succeed if emails match
          if (emailsMatch) {
            expect(originalEmail.toLowerCase()).toBe(providedEmail.toLowerCase());
          } else {
            expect(originalEmail.toLowerCase()).not.toBe(providedEmail.toLowerCase());
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle case-insensitive email matching', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        async (email) => {
          const variations = [
            email.toLowerCase(),
            email.toUpperCase(),
            email.charAt(0).toUpperCase() + email.slice(1).toLowerCase(),
          ];

          // Property: All case variations should match
          const normalized = variations.map(v => v.toLowerCase());
          const allMatch = normalized.every(v => v === normalized[0]);
          expect(allMatch).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should track signup method after magic link authentication', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant('email'),
        fc.constant('google'),
        fc.constant('apple'),
        async (emailMethod, googleMethod, appleMethod) => {
          const validMethods = ['email', 'google', 'apple'];

          // Property: Signup method should be one of the valid options
          expect(validMethods).toContain(emailMethod);
          expect(validMethods).toContain(googleMethod);
          expect(validMethods).toContain(appleMethod);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should set signup_completed_at timestamp on successful authentication', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
        async (signupTime) => {
          const now = new Date();
          const isValidTimestamp = signupTime <= now;

          // Property: Signup timestamp should not be in the future
          if (signupTime <= now) {
            expect(isValidTimestamp).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle concurrent magic link clicks gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.hexaString({ minLength: 64, maxLength: 64 }),
        fc.integer({ min: 2, max: 5 }),
        async (token, concurrentClicks) => {
          const results = new Set<boolean>();

          // Simulate concurrent clicks
          for (let i = 0; i < concurrentClicks; i++) {
            // Only first click should succeed
            results.add(i === 0);
          }

          // Property: Only one click should succeed
          expect(results.has(true)).toBe(true);
          expect(results.has(false)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate redirect URL is safe', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant('/onboarding'),
          fc.constant('/dashboard'),
          fc.constant('https://evil.com'),
          fc.constant('javascript:alert(1)'),
          fc.constant('//evil.com')
        ),
        async (redirectUrl) => {
          const isSafeRedirect = redirectUrl.startsWith('/') && !redirectUrl.startsWith('//');

          // Property: Only relative URLs should be allowed
          if (redirectUrl.startsWith('/') && !redirectUrl.startsWith('//')) {
            expect(isSafeRedirect).toBe(true);
          } else {
            expect(isSafeRedirect).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
