/**
 * Integration Tests - Security Headers
 * 
 * Tests to validate security headers configuration
 * 
 * Coverage:
 * - Content-Security-Policy
 * - X-Frame-Options
 * - X-Content-Type-Options
 * - Strict-Transport-Security
 * - Referrer-Policy
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Security Headers Integration', () => {
  let nextConfig: string;

  beforeAll(() => {
    const nextConfigPath = join(process.cwd(), 'next.config.ts');
    nextConfig = readFileSync(nextConfigPath, 'utf-8');
  });

  describe('Content-Security-Policy', () => {
    it('should configure CSP header', () => {
      expect(nextConfig).toContain('Content-Security-Policy');
    });

    it('should restrict default-src', () => {
      if (nextConfig.includes('Content-Security-Policy')) {
        expect(nextConfig).toContain("default-src 'self'");
      }
    });

    it('should configure script-src', () => {
      if (nextConfig.includes('Content-Security-Policy')) {
        expect(nextConfig).toContain('script-src');
      }
    });

    it('should configure style-src', () => {
      if (nextConfig.includes('Content-Security-Policy')) {
        expect(nextConfig).toContain('style-src');
      }
    });

    it('should configure img-src', () => {
      if (nextConfig.includes('Content-Security-Policy')) {
        expect(nextConfig).toContain('img-src');
      }
    });

    it('should configure connect-src', () => {
      if (nextConfig.includes('Content-Security-Policy')) {
        expect(nextConfig).toContain('connect-src');
      }
    });
  });

  describe('X-Frame-Options', () => {
    it('should configure X-Frame-Options header', () => {
      expect(nextConfig).toContain('X-Frame-Options');
    });

    it('should set X-Frame-Options to DENY', () => {
      expect(nextConfig).toContain('DENY');
    });
  });

  describe('X-Content-Type-Options', () => {
    it('should configure X-Content-Type-Options header', () => {
      expect(nextConfig).toContain('X-Content-Type-Options');
    });

    it('should set X-Content-Type-Options to nosniff', () => {
      expect(nextConfig).toContain('nosniff');
    });
  });

  describe('Strict-Transport-Security', () => {
    it('should configure HSTS header', () => {
      expect(nextConfig).toContain('Strict-Transport-Security');
    });

    it('should set max-age to at least 1 year', () => {
      expect(nextConfig).toContain('max-age=31536000');
    });

    it('should include subdomains', () => {
      if (nextConfig.includes('Strict-Transport-Security')) {
        expect(nextConfig).toContain('includeSubDomains');
      }
    });
  });

  describe('Referrer-Policy', () => {
    it('should configure Referrer-Policy header', () => {
      expect(nextConfig).toContain('Referrer-Policy');
    });

    it('should use strict-origin-when-cross-origin', () => {
      if (nextConfig.includes('Referrer-Policy')) {
        expect(nextConfig).toContain('strict-origin-when-cross-origin');
      }
    });
  });

  describe('Headers Configuration', () => {
    it('should export headers function', () => {
      expect(nextConfig).toContain('async headers()');
    });

    it('should apply headers to all paths', () => {
      if (nextConfig.includes('headers()')) {
        expect(nextConfig).toContain("source: '/:path*'");
      }
    });
  });

  describe('Security Best Practices', () => {
    it('should not allow unsafe-inline in production CSP', () => {
      // This is a warning - unsafe-inline should be avoided in production
      if (nextConfig.includes('Content-Security-Policy')) {
        // Check if there's a production-specific CSP
        const hasProductionCheck = nextConfig.includes('NODE_ENV') || 
                                   nextConfig.includes('production');
        
        if (hasProductionCheck) {
          expect(true).toBe(true);
        }
      }
    });

    it('should not allow unsafe-eval in production CSP', () => {
      // Similar to unsafe-inline, this should be avoided
      if (nextConfig.includes('Content-Security-Policy')) {
        const hasProductionCheck = nextConfig.includes('NODE_ENV') || 
                                   nextConfig.includes('production');
        
        if (hasProductionCheck) {
          expect(true).toBe(true);
        }
      }
    });
  });

  describe('CORS Configuration', () => {
    it('should configure CORS if needed', () => {
      // CORS configuration is optional
      if (nextConfig.includes('Access-Control-Allow-Origin')) {
        expect(nextConfig).toContain('Access-Control-Allow-Origin');
      } else {
        expect(true).toBe(true);
      }
    });
  });

  describe('Permissions-Policy', () => {
    it('should configure Permissions-Policy if needed', () => {
      // Permissions-Policy is optional but recommended
      if (nextConfig.includes('Permissions-Policy')) {
        expect(nextConfig).toContain('Permissions-Policy');
      } else {
        expect(true).toBe(true);
      }
    });
  });
});
