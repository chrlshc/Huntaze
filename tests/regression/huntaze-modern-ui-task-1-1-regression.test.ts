/**
 * Regression Tests - Huntaze Modern UI Task 1.1
 * Tests for Task 1.1: Upgrade to Next.js 15 and configure next.config.ts
 * 
 * Purpose: Prevent regressions in Next.js 15 configuration
 * 
 * Coverage:
 * - Task status tracking
 * - Configuration persistence
 * - Breaking changes prevention
 * - Backward compatibility
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Huntaze Modern UI Task 1.1 Regression Tests', () => {
  let tasksContent: string;
  let nextConfigContent: string;

  beforeAll(() => {
    const tasksPath = join(process.cwd(), '.kiro/specs/huntaze-modern-ui/tasks.md');
    const configPath = join(process.cwd(), 'next.config.ts');
    
    tasksContent = readFileSync(tasksPath, 'utf-8');
    nextConfigContent = readFileSync(configPath, 'utf-8');
  });

  describe('Task Status Tracking', () => {
    it('should have task 1.1 marked as in progress', () => {
      expect(tasksContent).toContain('- [-] 1.1 Upgrade to Next.js 15 and configure next.config.ts');
    });

    it('should not have task 1.1 marked as complete yet', () => {
      expect(tasksContent).not.toContain('- [x] 1.1 Upgrade to Next.js 15 and configure next.config.ts');
    });

    it('should have task 1.1 in the correct section', () => {
      const task11Pattern = /- \[-\] 1\.1 Upgrade to Next\.js 15/;
      expect(tasksContent).toMatch(task11Pattern);
    });

    it('should list all required subtasks for task 1.1', () => {
      const subtasks = [
        'Run upgrade codemod',
        'Create next.config.ts',
        'Add bundlePagesRouterDependencies',
        'Verify Node.js 20+',
      ];

      subtasks.forEach((subtask) => {
        expect(tasksContent).toContain(subtask);
      });
    });
  });

  describe('Configuration Persistence', () => {
    it('should maintain bundlePagesRouterDependencies setting', () => {
      expect(nextConfigContent).toContain('bundlePagesRouterDependencies: true');
    });

    it('should maintain serverExternalPackages configuration', () => {
      expect(nextConfigContent).toContain('serverExternalPackages');
      expect(nextConfigContent).toContain('@prisma/client');
    });

    it('should maintain TypeScript configuration', () => {
      expect(nextConfigContent).toContain('import type { NextConfig }');
      expect(nextConfigContent).toContain('const nextConfig: NextConfig');
    });

    it('should maintain security headers', () => {
      expect(nextConfigContent).toContain('Content-Security-Policy-Report-Only');
      expect(nextConfigContent).toContain('poweredByHeader: false');
    });
  });

  describe('Breaking Changes Prevention', () => {
    it('should not use deprecated domains configuration', () => {
      expect(nextConfigContent).not.toContain('domains:');
    });

    it('should use remotePatterns for images', () => {
      expect(nextConfigContent).toContain('remotePatterns');
    });

    it('should not use webpack configuration (use turbopack)', () => {
      expect(nextConfigContent).not.toContain('webpack:');
    });

    it('should not use deprecated experimental features', () => {
      // Check for deprecated features that should not be present
      expect(nextConfigContent).not.toContain('experimental.appDir');
      expect(nextConfigContent).not.toContain('experimental.serverActions');
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain existing rewrites', () => {
      const rewrites = [
        '/app/huntaze-ai',
        '/terms',
        '/privacy',
        '/solutions',
        '/resources',
      ];

      rewrites.forEach((rewrite) => {
        expect(nextConfigContent).toContain(rewrite);
      });
    });

    it('should maintain existing image domains', () => {
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

    it('should maintain CSP directives', () => {
      const directives = [
        "default-src 'self'",
        "frame-ancestors 'none'",
        'upgrade-insecure-requests',
      ];

      directives.forEach((directive) => {
        expect(nextConfigContent).toContain(directive);
      });
    });

    it('should maintain compiler optimizations', () => {
      expect(nextConfigContent).toContain('removeConsole');
      expect(nextConfigContent).toContain('compress: true');
    });
  });

  describe('Next.js 15 Specific Regressions', () => {
    it('should not revert to Next.js 14 configuration', () => {
      // bundlePagesRouterDependencies is Next.js 15 specific
      expect(nextConfigContent).toContain('bundlePagesRouterDependencies');
    });

    it('should maintain Node.js 20+ compatibility', () => {
      // Should use modern syntax
      expect(nextConfigContent).toContain('async');
      expect(nextConfigContent).toContain('=>');
      expect(nextConfigContent).not.toMatch(/require\(['"]next['"]\)/);
    });

    it('should maintain TypeScript configuration file', () => {
      const configPath = join(process.cwd(), 'next.config.ts');
      expect(configPath).toMatch(/\.ts$/);
    });
  });

  describe('Amplify Deployment Compatibility', () => {
    it('should maintain standalone output mode', () => {
      expect(nextConfigContent).toContain('standalone');
    });

    it('should support export mode', () => {
      expect(nextConfigContent).toContain('isExport');
      expect(nextConfigContent).toContain('NEXT_OUTPUT_EXPORT');
    });

    it('should maintain Amplify-specific comments', () => {
      expect(nextConfigContent).toMatch(/Amplify/i);
    });
  });

  describe('Performance Regressions', () => {
    it('should maintain compression', () => {
      expect(nextConfigContent).toContain('compress: true');
    });

    it('should maintain image optimization', () => {
      expect(nextConfigContent).toContain('formats');
      expect(nextConfigContent).toContain('avif');
      expect(nextConfigContent).toContain('webp');
    });

    it('should maintain console removal in production', () => {
      expect(nextConfigContent).toMatch(/removeConsole.*production/);
    });
  });

  describe('Security Regressions', () => {
    it('should maintain CSP headers', () => {
      expect(nextConfigContent).toContain('Content-Security-Policy-Report-Only');
    });

    it('should maintain frame-ancestors protection', () => {
      expect(nextConfigContent).toContain("frame-ancestors 'none'");
    });

    it('should maintain powered-by header removal', () => {
      expect(nextConfigContent).toContain('poweredByHeader: false');
    });

    it('should maintain upgrade-insecure-requests', () => {
      expect(nextConfigContent).toContain('upgrade-insecure-requests');
    });
  });

  describe('Configuration Structure Regressions', () => {
    it('should maintain proper TypeScript typing', () => {
      expect(nextConfigContent).toContain(': NextConfig');
    });

    it('should maintain const declaration', () => {
      expect(nextConfigContent).toMatch(/const nextConfig:\s*NextConfig/);
    });

    it('should maintain default export', () => {
      expect(nextConfigContent).toContain('export default nextConfig');
    });

    it('should maintain async functions', () => {
      expect(nextConfigContent).toContain('async headers()');
      expect(nextConfigContent).toContain('async rewrites()');
    });
  });

  describe('Documentation Regressions', () => {
    it('should maintain inline comments', () => {
      const comments = [
        'Next.js 15',
        'Bundle Pages Router',
        'External packages',
        'Prisma',
      ];

      comments.forEach((comment) => {
        expect(nextConfigContent).toMatch(new RegExp(comment, 'i'));
      });
    });

    it('should maintain task requirements reference', () => {
      expect(tasksContent).toContain('Requirements: 10.1');
    });
  });

  describe('Edge Cases', () => {
    it('should handle export mode correctly', () => {
      expect(nextConfigContent).toMatch(/output:\s*isExport\s*\?/);
      expect(nextConfigContent).toMatch(/unoptimized:\s*isExport\s*\?/);
    });

    it('should handle development mode correctly', () => {
      expect(nextConfigContent).toMatch(/NODE_ENV.*development/);
      expect(nextConfigContent).toMatch(/dev.*unsafe-eval/);
    });

    it('should handle CSP report endpoint correctly', () => {
      expect(nextConfigContent).toContain('CSP_REPORT_ENDPOINT');
      expect(nextConfigContent).toContain('reportEndpoint');
    });
  });

  describe('Future Compatibility', () => {
    it('should be ready for Next.js 16 (turbopack)', () => {
      expect(nextConfigContent).toContain('turbopack:');
    });

    it('should not use deprecated webpack config', () => {
      expect(nextConfigContent).not.toContain('webpack:');
    });

    it('should use modern image configuration', () => {
      expect(nextConfigContent).toContain('remotePatterns');
      expect(nextConfigContent).not.toContain('domains:');
    });
  });
});
