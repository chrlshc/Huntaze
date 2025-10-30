/**
 * Integration Tests - Next.js 15 Configuration
 * Tests for Task 1.1: Integration with build system and runtime
 * 
 * Coverage:
 * - Configuration loading
 * - Environment variable handling
 * - Build compatibility
 * - Runtime behavior
 * - Prisma integration
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Next.js 15 Configuration Integration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Configuration Loading', () => {
    it('should load next.config.ts without errors', async () => {
      let configModule;
      let error;

      try {
        // Dynamic import to test loading
        configModule = await import('../../next.config');
      } catch (e) {
        error = e;
      }

      expect(error).toBeUndefined();
      expect(configModule).toBeDefined();
    });

    it('should export a valid NextConfig object', async () => {
      const configModule = await import('../../next.config');
      const config = configModule.default;

      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    });

    it('should have required Next.js 15 properties', async () => {
      const configModule = await import('../../next.config');
      const config = configModule.default;

      expect(config.bundlePagesRouterDependencies).toBe(true);
      expect(config.serverExternalPackages).toBeDefined();
      expect(Array.isArray(config.serverExternalPackages)).toBe(true);
    });
  });

  describe('Environment Variable Handling', () => {
    it('should handle NEXT_OUTPUT_EXPORT=1', async () => {
      process.env.NEXT_OUTPUT_EXPORT = '1';
      
      // Re-import to get fresh config
      delete require.cache[require.resolve('../../next.config')];
      const configModule = await import('../../next.config');
      const config = configModule.default;

      expect(config.output).toBe('export');
    });

    it('should default to standalone output', async () => {
      delete process.env.NEXT_OUTPUT_EXPORT;
      
      delete require.cache[require.resolve('../../next.config')];
      const configModule = await import('../../next.config');
      const config = configModule.default;

      expect(config.output).toBe('standalone');
    });

    it('should handle NODE_ENV=development', async () => {
      process.env.NODE_ENV = 'development';
      
      delete require.cache[require.resolve('../../next.config')];
      const configModule = await import('../../next.config');
      const config = configModule.default;

      // In development, compiler.removeConsole should be false
      expect(config.compiler?.removeConsole).toBe(false);
    });

    it('should handle NODE_ENV=production', async () => {
      process.env.NODE_ENV = 'production';
      
      delete require.cache[require.resolve('../../next.config')];
      const configModule = await import('../../next.config');
      const config = configModule.default;

      // In production, compiler.removeConsole should be true
      expect(config.compiler?.removeConsole).toBe(true);
    });

    it('should handle CSP_REPORT_ENDPOINT', async () => {
      process.env.CSP_REPORT_ENDPOINT = 'https://example.com/csp-report';
      
      delete require.cache[require.resolve('../../next.config')];
      const configModule = await import('../../next.config');
      const config = configModule.default;

      expect(config.headers).toBeDefined();
      expect(typeof config.headers).toBe('function');
    });
  });

  describe('Headers Function Integration', () => {
    it('should generate headers array', async () => {
      const configModule = await import('../../next.config');
      const config = configModule.default;

      expect(config.headers).toBeDefined();
      
      if (typeof config.headers === 'function') {
        const headers = await config.headers();
        expect(Array.isArray(headers)).toBe(true);
        expect(headers.length).toBeGreaterThan(0);
      }
    });

    it('should include CSP header', async () => {
      const configModule = await import('../../next.config');
      const config = configModule.default;

      if (typeof config.headers === 'function') {
        const headers = await config.headers();
        const firstHeader = headers[0];
        
        expect(firstHeader.source).toBe('/:path*');
        expect(firstHeader.headers).toBeDefined();
        
        const cspHeader = firstHeader.headers.find(
          (h: any) => h.key === 'Content-Security-Policy-Report-Only'
        );
        
        expect(cspHeader).toBeDefined();
        expect(cspHeader.value).toContain("default-src 'self'");
      }
    });

    it('should include Report-To header when CSP_REPORT_ENDPOINT is set', async () => {
      process.env.CSP_REPORT_ENDPOINT = 'https://example.com/csp-report';
      
      delete require.cache[require.resolve('../../next.config')];
      const configModule = await import('../../next.config');
      const config = configModule.default;

      if (typeof config.headers === 'function') {
        const headers = await config.headers();
        const firstHeader = headers[0];
        
        const reportToHeader = firstHeader.headers.find(
          (h: any) => h.key === 'Report-To'
        );
        
        expect(reportToHeader).toBeDefined();
      }
    });
  });

  describe('Rewrites Function Integration', () => {
    it('should generate rewrites array', async () => {
      const configModule = await import('../../next.config');
      const config = configModule.default;

      expect(config.rewrites).toBeDefined();
      
      if (typeof config.rewrites === 'function') {
        const rewrites = await config.rewrites();
        expect(Array.isArray(rewrites)).toBe(true);
        expect(rewrites.length).toBeGreaterThan(0);
      }
    });

    it('should include huntaze-ai rewrite', async () => {
      const configModule = await import('../../next.config');
      const config = configModule.default;

      if (typeof config.rewrites === 'function') {
        const rewrites = await config.rewrites();
        
        const huntazeRewrite = rewrites.find(
          (r: any) => r.source === '/app/huntaze-ai'
        );
        
        expect(huntazeRewrite).toBeDefined();
        expect(huntazeRewrite.destination).toBe('/dashboard/huntaze-ai');
      }
    });

    it('should include all navigation rewrites', async () => {
      const configModule = await import('../../next.config');
      const config = configModule.default;

      if (typeof config.rewrites === 'function') {
        const rewrites = await config.rewrites();
        
        const expectedRewrites = [
          { source: '/terms', destination: '/terms-of-service' },
          { source: '/privacy', destination: '/privacy-policy' },
          { source: '/solutions', destination: '/features' },
          { source: '/resources', destination: '/learn' },
          { source: '/enterprise', destination: '/for-agencies' },
          { source: '/help', destination: '/support' },
        ];

        expectedRewrites.forEach(({ source, destination }) => {
          const rewrite = rewrites.find((r: any) => r.source === source);
          expect(rewrite).toBeDefined();
          expect(rewrite.destination).toBe(destination);
        });
      }
    });
  });

  describe('Image Configuration Integration', () => {
    it('should configure image optimization', async () => {
      const configModule = await import('../../next.config');
      const config = configModule.default;

      expect(config.images).toBeDefined();
      expect(config.images.remotePatterns).toBeDefined();
      expect(Array.isArray(config.images.remotePatterns)).toBe(true);
    });

    it('should include all required image domains', async () => {
      const configModule = await import('../../next.config');
      const config = configModule.default;

      const expectedDomains = [
        'api.dicebear.com',
        'ui-avatars.com',
        'cdn.huntaze.com',
        'static.onlyfansassets.com',
      ];

      expectedDomains.forEach((hostname) => {
        const pattern = config.images.remotePatterns.find(
          (p: any) => p.hostname === hostname
        );
        expect(pattern).toBeDefined();
        expect(pattern.protocol).toBe('https');
      });
    });

    it('should configure modern image formats', async () => {
      const configModule = await import('../../next.config');
      const config = configModule.default;

      expect(config.images.formats).toBeDefined();
      expect(config.images.formats).toContain('image/avif');
      expect(config.images.formats).toContain('image/webp');
    });

    it('should handle export mode for images', async () => {
      process.env.NEXT_OUTPUT_EXPORT = '1';
      
      delete require.cache[require.resolve('../../next.config')];
      const configModule = await import('../../next.config');
      const config = configModule.default;

      expect(config.images.unoptimized).toBe(true);
    });
  });

  describe('Prisma Integration', () => {
    it('should exclude @prisma/client from bundling', async () => {
      const configModule = await import('../../next.config');
      const config = configModule.default;

      expect(config.serverExternalPackages).toContain('@prisma/client');
    });

    it('should allow Prisma to work in serverless environment', async () => {
      const configModule = await import('../../next.config');
      const config = configModule.default;

      // serverExternalPackages prevents bundling of Prisma binary
      expect(config.serverExternalPackages).toBeDefined();
      expect(Array.isArray(config.serverExternalPackages)).toBe(true);
      expect(config.serverExternalPackages.length).toBeGreaterThan(0);
    });
  });

  describe('Build Compatibility', () => {
    it('should enable React strict mode', async () => {
      const configModule = await import('../../next.config');
      const config = configModule.default;

      expect(config.reactStrictMode).toBe(true);
    });

    it('should enable compression', async () => {
      const configModule = await import('../../next.config');
      const config = configModule.default;

      expect(config.compress).toBe(true);
    });

    it('should configure TypeScript to allow build errors', async () => {
      const configModule = await import('../../next.config');
      const config = configModule.default;

      expect(config.typescript?.ignoreBuildErrors).toBe(true);
    });

    it('should configure experimental features', async () => {
      const configModule = await import('../../next.config');
      const config = configModule.default;

      expect(config.experimental).toBeDefined();
      expect(config.experimental.optimizeCss).toBe(false);
    });
  });

  describe('Security Integration', () => {
    it('should disable powered-by header', async () => {
      const configModule = await import('../../next.config');
      const config = configModule.default;

      expect(config.poweredByHeader).toBe(false);
    });

    it('should configure CSP in report-only mode', async () => {
      const configModule = await import('../../next.config');
      const config = configModule.default;

      if (typeof config.headers === 'function') {
        const headers = await config.headers();
        const cspHeader = headers[0].headers.find(
          (h: any) => h.key === 'Content-Security-Policy-Report-Only'
        );
        
        expect(cspHeader).toBeDefined();
        expect(cspHeader.value).toContain("frame-ancestors 'none'");
        expect(cspHeader.value).toContain('upgrade-insecure-requests');
      }
    });
  });

  describe('Performance Integration', () => {
    it('should remove console logs in production', async () => {
      process.env.NODE_ENV = 'production';
      
      delete require.cache[require.resolve('../../next.config')];
      const configModule = await import('../../next.config');
      const config = configModule.default;

      expect(config.compiler?.removeConsole).toBe(true);
    });

    it('should keep console logs in development', async () => {
      process.env.NODE_ENV = 'development';
      
      delete require.cache[require.resolve('../../next.config')];
      const configModule = await import('../../next.config');
      const config = configModule.default;

      expect(config.compiler?.removeConsole).toBe(false);
    });
  });

  describe('Turbopack Integration', () => {
    it('should configure turbopack', async () => {
      const configModule = await import('../../next.config');
      const config = configModule.default;

      expect(config.turbopack).toBeDefined();
      expect(typeof config.turbopack).toBe('object');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing environment variables gracefully', async () => {
      delete process.env.NEXT_OUTPUT_EXPORT;
      delete process.env.CSP_REPORT_ENDPOINT;
      delete process.env.NODE_ENV;
      
      delete require.cache[require.resolve('../../next.config')];
      
      let error;
      try {
        await import('../../next.config');
      } catch (e) {
        error = e;
      }

      expect(error).toBeUndefined();
    });

    it('should handle invalid environment variable values', async () => {
      process.env.NEXT_OUTPUT_EXPORT = 'invalid';
      
      delete require.cache[require.resolve('../../next.config')];
      
      let error;
      try {
        const configModule = await import('../../next.config');
        const config = configModule.default;
        
        // Should default to standalone
        expect(config.output).toBe('standalone');
      } catch (e) {
        error = e;
      }

      expect(error).toBeUndefined();
    });
  });
});
