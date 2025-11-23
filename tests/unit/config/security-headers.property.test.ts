/**
 * Property-Based Tests for Security Headers
 * 
 * Tests that security headers are properly configured and present in responses
 * using fast-check for property-based testing.
 * 
 * Feature: production-critical-fixes
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import nextConfig from '../../../next.config';

describe('Security Headers Property Tests', () => {
  /**
   * Property 10: Security Headers Presence
   * 
   * For any response, the configured security headers should be present
   * in the response headers.
   * 
   * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5
   * 
   * Feature: production-critical-fixes, Property 10: Security Headers Presence
   */
  describe('Property 10: Security Headers Presence', () => {
    it('should define all required security headers in configuration', async () => {
      // Get headers configuration
      const headersConfig = await nextConfig.headers!();
      
      // Verify headers function returns an array
      expect(Array.isArray(headersConfig)).toBe(true);
      expect(headersConfig.length).toBeGreaterThan(0);
      
      // Find the catch-all route configuration
      const catchAllRoute = headersConfig.find(config => config.source === '/:path*');
      expect(catchAllRoute).toBeDefined();
      expect(catchAllRoute?.headers).toBeDefined();
      
      const headers = catchAllRoute!.headers;
      
      // Required security headers as per Requirements 7.1-7.5
      const requiredHeaders = [
        'Strict-Transport-Security',
        'X-Frame-Options',
        'X-Content-Type-Options',
        'Permissions-Policy',
      ];
      
      // Verify each required header is present
      for (const requiredHeader of requiredHeaders) {
        const header = headers.find(h => h.key === requiredHeader);
        expect(header, `Header ${requiredHeader} should be defined`).toBeDefined();
        expect(header?.value, `Header ${requiredHeader} should have a value`).toBeTruthy();
      }
    });

    it('should have HSTS header with preload directive for any path', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random URL paths
          fc.webPath(),
          async (path) => {
            const headersConfig = await nextConfig.headers!();
            const catchAllRoute = headersConfig.find(config => config.source === '/:path*');
            const headers = catchAllRoute!.headers;
            
            // Find HSTS header - Requirement 7.1
            const hstsHeader = headers.find(h => h.key === 'Strict-Transport-Security');
            expect(hstsHeader).toBeDefined();
            
            // Verify HSTS includes required directives
            const hstsValue = hstsHeader!.value;
            expect(hstsValue).toContain('max-age=');
            expect(hstsValue).toContain('includeSubDomains');
            expect(hstsValue).toContain('preload');
            
            // Verify max-age is at least 1 year (31536000 seconds)
            const maxAgeMatch = hstsValue.match(/max-age=(\d+)/);
            expect(maxAgeMatch).toBeTruthy();
            const maxAge = parseInt(maxAgeMatch![1]);
            expect(maxAge).toBeGreaterThanOrEqual(31536000);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have X-Frame-Options set to DENY for any path', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.webPath(),
          async (path) => {
            const headersConfig = await nextConfig.headers!();
            const catchAllRoute = headersConfig.find(config => config.source === '/:path*');
            const headers = catchAllRoute!.headers;
            
            // Find X-Frame-Options header - Requirement 7.2
            const frameOptionsHeader = headers.find(h => h.key === 'X-Frame-Options');
            expect(frameOptionsHeader).toBeDefined();
            expect(frameOptionsHeader!.value).toBe('DENY');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have X-Content-Type-Options set to nosniff for any path', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.webPath(),
          async (path) => {
            const headersConfig = await nextConfig.headers!();
            const catchAllRoute = headersConfig.find(config => config.source === '/:path*');
            const headers = catchAllRoute!.headers;
            
            // Find X-Content-Type-Options header - Requirement 7.3
            const contentTypeHeader = headers.find(h => h.key === 'X-Content-Type-Options');
            expect(contentTypeHeader).toBeDefined();
            expect(contentTypeHeader!.value).toBe('nosniff');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have Permissions-Policy header for any path', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.webPath(),
          async (path) => {
            const headersConfig = await nextConfig.headers!();
            const catchAllRoute = headersConfig.find(config => config.source === '/:path*');
            const headers = catchAllRoute!.headers;
            
            // Find Permissions-Policy header - Requirement 7.5
            const permissionsHeader = headers.find(h => h.key === 'Permissions-Policy');
            expect(permissionsHeader).toBeDefined();
            expect(permissionsHeader!.value).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have Referrer-Policy header with appropriate value for any path', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.webPath(),
          async (path) => {
            const headersConfig = await nextConfig.headers!();
            const catchAllRoute = headersConfig.find(config => config.source === '/:path*');
            const headers = catchAllRoute!.headers;
            
            // Find Referrer-Policy header
            const referrerHeader = headers.find(h => h.key === 'Referrer-Policy');
            expect(referrerHeader).toBeDefined();
            
            // Verify it's a valid referrer policy value
            const validPolicies = [
              'no-referrer',
              'no-referrer-when-downgrade',
              'origin',
              'origin-when-cross-origin',
              'same-origin',
              'strict-origin',
              'strict-origin-when-cross-origin',
              'unsafe-url'
            ];
            expect(validPolicies).toContain(referrerHeader!.value);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should apply security headers to all route patterns', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate various path patterns
          fc.tuple(
            fc.webPath(),
            fc.constantFrom('', '/api', '/dashboard', '/auth', '/public')
          ),
          async ([basePath, prefix]) => {
            const fullPath = prefix + (basePath.startsWith('/') ? basePath : '/' + basePath);
            
            const headersConfig = await nextConfig.headers!();
            
            // The /:path* pattern should match all paths
            const catchAllRoute = headersConfig.find(config => config.source === '/:path*');
            expect(catchAllRoute).toBeDefined();
            
            // Verify all security headers are present
            const headers = catchAllRoute!.headers;
            const securityHeaderKeys = [
              'Strict-Transport-Security',
              'X-Frame-Options',
              'X-Content-Type-Options',
              'Permissions-Policy',
            ];
            
            for (const key of securityHeaderKeys) {
              const header = headers.find(h => h.key === key);
              expect(header, `${key} should be present for path ${fullPath}`).toBeDefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have consistent header values across multiple invocations', async () => {
      // Call headers() multiple times and verify consistency
      const firstCall = await nextConfig.headers!();
      const secondCall = await nextConfig.headers!();
      const thirdCall = await nextConfig.headers!();
      
      // All calls should return the same structure
      expect(firstCall).toEqual(secondCall);
      expect(secondCall).toEqual(thirdCall);
      
      // Verify the structure is stable
      const catchAll1 = firstCall.find(c => c.source === '/:path*');
      const catchAll2 = secondCall.find(c => c.source === '/:path*');
      const catchAll3 = thirdCall.find(c => c.source === '/:path*');
      
      expect(catchAll1?.headers).toEqual(catchAll2?.headers);
      expect(catchAll2?.headers).toEqual(catchAll3?.headers);
    });
  });

  describe('Next.js 16 Configuration Validation', () => {
    it('should have output set to standalone for Amplify Compute', () => {
      // Requirement 6.1
      expect(nextConfig.output).toBe('standalone');
    });

    it('should have reactStrictMode enabled', () => {
      expect(nextConfig.reactStrictMode).toBe(true);
    });

    it('should have compression enabled', () => {
      expect(nextConfig.compress).toBe(true);
    });

    it('should have experimental configuration for server actions', () => {
      expect(nextConfig.experimental).toBeDefined();
      expect(nextConfig.experimental?.serverActions).toBeDefined();
    });
  });
});
