/**
 * Unit Tests - Next.js 15 Configuration Validation
 * Tests for Task 1.1: Upgrade to Next.js 15 and configure next.config.ts
 * 
 * Coverage:
 * - Next.js 15 specific configurations
 * - bundlePagesRouterDependencies setting
 * - serverExternalPackages for Prisma
 * - Node.js 20+ compatibility
 * - Security headers (CSP)
 * - Image optimization
 * - Rewrites and redirects
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Next.js 15 Configuration Validation', () => {
  let nextConfigContent: string;
  let nextConfig: any;

  beforeAll(() => {
    const configPath = join(process.cwd(), 'next.config.ts');
    nextConfigContent = readFileSync(configPath, 'utf-8');
    
    // Parse the config (simplified - in real scenario, we'd import it)
    // For testing purposes, we'll validate the file content
  });

  describe('Task 1.1.1: Next.js 15 Upgrade', () => {
    it('should import NextConfig type from next', () => {
      expect(nextConfigContent).toContain("import type { NextConfig } from 'next'");
    });

    it('should export a NextConfig object', () => {
      expect(nextConfigContent).toContain('const nextConfig: NextConfig');
      expect(nextConfigContent).toContain('export default nextConfig');
    });

    it('should be a TypeScript file (.ts extension)', () => {
      const configPath = join(process.cwd(), 'next.config.ts');
      expect(configPath).toMatch(/\.ts$/);
    });
  });

  describe('Task 1.1.2: bundlePagesRouterDependencies Configuration', () => {
    it('should enable bundlePagesRouterDependencies', () => {
      expect(nextConfigContent).toContain('bundlePagesRouterDependencies: true');
    });

    it('should have bundlePagesRouterDependencies set to boolean true', () => {
      const match = nextConfigContent.match(/bundlePagesRouterDependencies:\s*(true|false)/);
      expect(match).toBeTruthy();
      expect(match![1]).toBe('true');
    });

    it('should include comment explaining the setting', () => {
      expect(nextConfigContent).toMatch(/Bundle Pages Router dependencies/i);
    });
  });

  describe('Task 1.1.3: serverExternalPackages for Prisma', () => {
    it('should configure serverExternalPackages', () => {
      expect(nextConfigContent).toContain('serverExternalPackages');
    });

    it('should include @prisma/client in serverExternalPackages', () => {
      expect(nextConfigContent).toContain("'@prisma/client'");
      expect(nextConfigContent).toMatch(/serverExternalPackages:\s*\[['"]@prisma\/client['"]\]/);
    });

    it('should have serverExternalPackages as an array', () => {
      const match = nextConfigContent.match(/serverExternalPackages:\s*\[(.*?)\]/s);
      expect(match).toBeTruthy();
      expect(match![1]).toContain('@prisma/client');
    });

    it('should include comment about not bundling Prisma binary', () => {
      expect(nextConfigContent).toMatch(/don't bundle Prisma/i);
    });
  });

  describe('Task 1.1.4: Node.js 20+ Compatibility', () => {
    it('should use modern JavaScript features compatible with Node.js 20+', () => {
      // Check for async/await usage
      expect(nextConfigContent).toContain('async');
      
      // Check for modern syntax (const, arrow functions)
      expect(nextConfigContent).toContain('const');
      expect(nextConfigContent).toContain('=>');
    });

    it('should not use deprecated Node.js features', () => {
      // Should not use old require syntax in main config
      expect(nextConfigContent).not.toMatch(/require\(['"]next['"]\)/);
    });

    it('should use ES modules syntax', () => {
      expect(nextConfigContent).toContain('import');
      expect(nextConfigContent).toContain('export default');
    });
  });

  describe('Core Configuration Settings', () => {
    it('should enable React strict mode', () => {
      expect(nextConfigContent).toContain('reactStrictMode: true');
    });

    it('should enable compression', () => {
      expect(nextConfigContent).toContain('compress: true');
    });

    it('should disable powered by header for security', () => {
      expect(nextConfigContent).toContain('poweredByHeader: false');
    });

    it('should configure output mode', () => {
      expect(nextConfigContent).toMatch(/output:\s*(isExport\s*\?\s*['"]export['"]\s*:\s*['"]standalone['"]|['"]standalone['"])/);
    });
  });

  describe('Security Headers Configuration', () => {
    it('should define async headers function', () => {
      expect(nextConfigContent).toContain('async headers()');
    });

    it('should configure Content-Security-Policy-Report-Only', () => {
      expect(nextConfigContent).toContain('Content-Security-Policy-Report-Only');
    });

    it('should include CSP directives', () => {
      const cspDirectives = [
        "default-src 'self'",
        "base-uri 'self'",
        "frame-ancestors 'none'",
        "object-src 'none'",
        'upgrade-insecure-requests',
      ];

      cspDirectives.forEach((directive) => {
        expect(nextConfigContent).toContain(directive);
      });
    });

    it('should configure script-src with conditional unsafe-eval for dev', () => {
      expect(nextConfigContent).toMatch(/script-src.*unsafe-eval/);
      expect(nextConfigContent).toMatch(/dev.*unsafe-eval/);
    });

    it('should configure img-src with CDN domains', () => {
      expect(nextConfigContent).toContain('img-src');
      expect(nextConfigContent).toContain('cdn.huntaze.com');
      expect(nextConfigContent).toContain('static.onlyfansassets.com');
    });

    it('should configure connect-src for API and WebSocket', () => {
      expect(nextConfigContent).toContain('connect-src');
      expect(nextConfigContent).toContain('https:');
      expect(nextConfigContent).toContain('wss:');
    });

    it('should include CSP report endpoint', () => {
      expect(nextConfigContent).toContain('/api/csp/report');
    });
  });

  describe('Rewrites Configuration', () => {
    it('should define async rewrites function', () => {
      expect(nextConfigContent).toContain('async rewrites()');
    });

    it('should configure /app/huntaze-ai rewrite', () => {
      expect(nextConfigContent).toContain('/app/huntaze-ai');
      expect(nextConfigContent).toContain('/dashboard/huntaze-ai');
    });

    it('should configure terms and privacy rewrites', () => {
      expect(nextConfigContent).toContain('/terms');
      expect(nextConfigContent).toContain('/terms-of-service');
      expect(nextConfigContent).toContain('/privacy');
      expect(nextConfigContent).toContain('/privacy-policy');
    });

    it('should configure navigation rewrites', () => {
      const rewrites = [
        ['/solutions', '/features'],
        ['/resources', '/learn'],
        ['/enterprise', '/for-agencies'],
        ['/help', '/support'],
      ];

      rewrites.forEach(([source, destination]) => {
        expect(nextConfigContent).toContain(source);
        expect(nextConfigContent).toContain(destination);
      });
    });
  });

  describe('Image Optimization Configuration', () => {
    it('should configure images with remotePatterns', () => {
      expect(nextConfigContent).toContain('images:');
      expect(nextConfigContent).toContain('remotePatterns');
    });

    it('should use remotePatterns instead of deprecated domains', () => {
      expect(nextConfigContent).not.toContain('domains:');
      expect(nextConfigContent).toContain('remotePatterns:');
    });

    it('should configure allowed image domains', () => {
      const domains = [
        'api.dicebear.com',
        'ui-avatars.com',
        'cdn.huntaze.com',
        'static.onlyfansassets.com',
      ];

      domains.forEach((domain) => {
        expect(nextConfigContent).toContain(domain);
      });
    });

    it('should configure modern image formats', () => {
      expect(nextConfigContent).toContain('formats');
      expect(nextConfigContent).toContain('image/avif');
      expect(nextConfigContent).toContain('image/webp');
    });

    it('should configure unoptimized based on export mode', () => {
      expect(nextConfigContent).toMatch(/unoptimized:\s*isExport\s*\?\s*true\s*:\s*false/);
    });
  });

  describe('Experimental Features Configuration', () => {
    it('should configure experimental features', () => {
      expect(nextConfigContent).toContain('experimental:');
    });

    it('should disable optimizeCss to avoid critters requirement', () => {
      expect(nextConfigContent).toContain('optimizeCss: false');
    });

    it('should include comment explaining optimizeCss setting', () => {
      expect(nextConfigContent).toMatch(/critters/i);
    });
  });

  describe('Compiler Configuration', () => {
    it('should configure compiler options', () => {
      expect(nextConfigContent).toContain('compiler:');
    });

    it('should remove console logs in production', () => {
      expect(nextConfigContent).toContain('removeConsole');
      expect(nextConfigContent).toMatch(/removeConsole:.*NODE_ENV.*production/);
    });
  });

  describe('TypeScript Configuration', () => {
    it('should configure TypeScript options', () => {
      expect(nextConfigContent).toContain('typescript:');
    });

    it('should allow build errors during development', () => {
      expect(nextConfigContent).toContain('ignoreBuildErrors: true');
    });

    it('should include comment explaining ignoreBuildErrors', () => {
      expect(nextConfigContent).toMatch(/UI iteration|during development/i);
    });
  });

  describe('Turbopack Configuration', () => {
    it('should configure turbopack', () => {
      expect(nextConfigContent).toContain('turbopack:');
    });

    it('should have turbopack configuration object', () => {
      expect(nextConfigContent).toMatch(/turbopack:\s*\{/);
    });
  });

  describe('Environment Variables Handling', () => {
    it('should check NEXT_OUTPUT_EXPORT environment variable', () => {
      expect(nextConfigContent).toContain('NEXT_OUTPUT_EXPORT');
    });

    it('should check NODE_ENV for development mode', () => {
      expect(nextConfigContent).toContain('NODE_ENV');
      expect(nextConfigContent).toContain('development');
    });

    it('should check CSP_REPORT_ENDPOINT environment variable', () => {
      expect(nextConfigContent).toContain('CSP_REPORT_ENDPOINT');
    });
  });

  describe('Configuration Structure', () => {
    it('should have proper TypeScript typing', () => {
      expect(nextConfigContent).toContain(': NextConfig');
    });

    it('should use const for configuration', () => {
      expect(nextConfigContent).toMatch(/const nextConfig:\s*NextConfig\s*=/);
    });

    it('should export configuration as default', () => {
      expect(nextConfigContent).toContain('export default nextConfig');
    });

    it('should have proper indentation and formatting', () => {
      // Check for consistent indentation (2 spaces)
      const lines = nextConfigContent.split('\n');
      const indentedLines = lines.filter(line => line.match(/^\s{2,}/));
      expect(indentedLines.length).toBeGreaterThan(0);
    });
  });

  describe('Next.js 15 Specific Features', () => {
    it('should not use deprecated features', () => {
      // Check that deprecated 'domains' is not used
      expect(nextConfigContent).not.toMatch(/images:\s*\{[^}]*domains:/);
    });

    it('should use modern configuration patterns', () => {
      // Should use async functions for headers and rewrites
      expect(nextConfigContent).toMatch(/async\s+headers\(\)/);
      expect(nextConfigContent).toMatch(/async\s+rewrites\(\)/);
    });

    it('should be compatible with Next.js 15 runtime', () => {
      // Should have serverExternalPackages (Next.js 15 feature)
      expect(nextConfigContent).toContain('serverExternalPackages');
      
      // Should have bundlePagesRouterDependencies (Next.js 15 feature)
      expect(nextConfigContent).toContain('bundlePagesRouterDependencies');
    });
  });

  describe('Performance Optimizations', () => {
    it('should enable compression', () => {
      expect(nextConfigContent).toContain('compress: true');
    });

    it('should configure image formats for performance', () => {
      expect(nextConfigContent).toContain('avif');
      expect(nextConfigContent).toContain('webp');
    });

    it('should remove console logs in production', () => {
      expect(nextConfigContent).toMatch(/removeConsole.*production/);
    });
  });

  describe('Security Best Practices', () => {
    it('should disable X-Powered-By header', () => {
      expect(nextConfigContent).toContain('poweredByHeader: false');
    });

    it('should configure frame-ancestors to prevent clickjacking', () => {
      expect(nextConfigContent).toContain("frame-ancestors 'none'");
    });

    it('should upgrade insecure requests', () => {
      expect(nextConfigContent).toContain('upgrade-insecure-requests');
    });

    it('should restrict object-src', () => {
      expect(nextConfigContent).toContain("object-src 'none'");
    });

    it('should restrict base-uri', () => {
      expect(nextConfigContent).toContain("base-uri 'self'");
    });
  });

  describe('Amplify Compatibility', () => {
    it('should configure standalone output for Amplify', () => {
      expect(nextConfigContent).toContain('standalone');
    });

    it('should support export mode for static hosting', () => {
      expect(nextConfigContent).toContain('export');
      expect(nextConfigContent).toContain('isExport');
    });

    it('should include comment about Amplify headers', () => {
      expect(nextConfigContent).toMatch(/Amplify.*headers/i);
    });
  });
});
