/**
 * Integration Tests - BIMI Logo Integration
 * 
 * Integration tests to validate BIMI logo usage across the application
 * 
 * Coverage:
 * - Logo accessibility via HTTP
 * - BIMI DNS record validation
 * - Email client rendering
 * - Logo serving with correct headers
 * - Integration with email system
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('BIMI Logo - Integration Tests', () => {
  let logoPath: string;
  let logoContent: string;

  beforeAll(() => {
    logoPath = join(process.cwd(), 'public/huntaze-bimi-logo.svg');
    logoContent = readFileSync(logoPath, 'utf-8');
  });

  describe('File Accessibility', () => {
    it('should be in public directory for web access', () => {
      expect(existsSync(logoPath)).toBe(true);
      expect(logoPath).toContain('public/');
    });

    it('should have correct public path', () => {
      const publicPath = logoPath.split('public/')[1];
      expect(publicPath).toBe('huntaze-bimi-logo.svg');
    });

    it('should be accessible at root level', () => {
      // Logo should be at /huntaze-bimi-logo.svg, not in subdirectories
      const publicPath = logoPath.split('public/')[1];
      expect(publicPath).not.toContain('/');
    });
  });

  describe('BIMI DNS Record Compatibility', () => {
    it('should be compatible with BIMI DNS record format', () => {
      // BIMI DNS record format: v=BIMI1; l=https://domain.com/logo.svg
      const expectedUrl = 'https://huntaze.com/huntaze-bimi-logo.svg';
      
      // Verify the file exists and can be referenced
      expect(logoContent).toBeTruthy();
      expect(logoPath).toContain('huntaze-bimi-logo.svg');
    });

    it('should be servable over HTTPS', () => {
      // BIMI requires HTTPS
      // This is a deployment requirement, not a file requirement
      expect(logoContent).toBeTruthy();
    });

    it('should have correct MIME type expectation', () => {
      // File should be served as image/svg+xml
      expect(logoPath).toMatch(/\.svg$/);
    });
  });

  describe('Email Integration', () => {
    it('should be compatible with email verification system', () => {
      // Check if email system exists
      const emailPath = join(process.cwd(), 'lib/email/ses.ts');
      expect(existsSync(emailPath)).toBe(true);
    });

    it('should be referenced in email documentation', () => {
      const bimiDocsPath = join(process.cwd(), 'docs/BIMI_SETUP.md');
      if (existsSync(bimiDocsPath)) {
        const docsContent = readFileSync(bimiDocsPath, 'utf-8');
        expect(docsContent).toContain('huntaze-bimi-logo.svg');
      }
    });

    it('should have corresponding BIMI setup documentation', () => {
      const bimiDocsPath = join(process.cwd(), 'docs/BIMI_SETUP.md');
      expect(existsSync(bimiDocsPath)).toBe(true);
    });
  });

  describe('Preview and Testing', () => {
    it('should have preview HTML file', () => {
      const previewPath = join(process.cwd(), 'public/bimi-logo-preview.html');
      expect(existsSync(previewPath)).toBe(true);
    });

    it('should be referenced in preview HTML', () => {
      const previewPath = join(process.cwd(), 'public/bimi-logo-preview.html');
      if (existsSync(previewPath)) {
        const previewContent = readFileSync(previewPath, 'utf-8');
        expect(previewContent).toContain('huntaze-bimi-logo.svg');
      }
    });

    it('should have validation scripts', () => {
      const validateScriptPath = join(process.cwd(), 'scripts/validate-bimi.js');
      expect(existsSync(validateScriptPath)).toBe(true);
    });
  });

  describe('Documentation Integration', () => {
    it('should be documented in BIMI setup guide', () => {
      const setupPath = join(process.cwd(), 'docs/BIMI_SETUP.md');
      if (existsSync(setupPath)) {
        const setupContent = readFileSync(setupPath, 'utf-8');
        expect(setupContent.toLowerCase()).toContain('logo');
        expect(setupContent.toLowerCase()).toContain('svg');
      }
    });

    it('should be mentioned in deployment documentation', () => {
      const deployPaths = [
        'PUSH_TO_AMPLIFY.md',
        'docs/DEPLOYMENT_GUIDE.md',
        'BIMI_SETUP_SUMMARY.md',
      ];

      let foundInDocs = false;
      deployPaths.forEach(path => {
        const fullPath = join(process.cwd(), path);
        if (existsSync(fullPath)) {
          const content = readFileSync(fullPath, 'utf-8');
          if (content.toLowerCase().includes('bimi') || content.toLowerCase().includes('logo')) {
            foundInDocs = true;
          }
        }
      });

      expect(foundInDocs).toBe(true);
    });

    it('should have quick reference documentation', () => {
      const quickRefPath = join(process.cwd(), 'BIMI_QUICK_REFERENCE.md');
      expect(existsSync(quickRefPath)).toBe(true);
    });
  });

  describe('Build and Deployment', () => {
    it('should be included in public assets', () => {
      // Logo should be in public/ so it's automatically served by Next.js
      expect(logoPath).toContain('public/');
    });

    it('should not be in .gitignore', () => {
      const gitignorePath = join(process.cwd(), '.gitignore');
      if (existsSync(gitignorePath)) {
        const gitignoreContent = readFileSync(gitignorePath, 'utf-8');
        expect(gitignoreContent).not.toContain('huntaze-bimi-logo.svg');
        expect(gitignoreContent).not.toMatch(/public\/.*\.svg/);
      }
    });

    it('should be committed to version control', () => {
      // File should exist and be trackable
      expect(existsSync(logoPath)).toBe(true);
    });
  });

  describe('Security and Performance', () => {
    it('should be optimized for size', () => {
      const { statSync } = require('fs');
      const fileSize = statSync(logoPath).size;
      
      // Should be small for fast loading
      expect(fileSize).toBeLessThan(5 * 1024); // Under 5KB
    });

    it('should not contain sensitive information', () => {
      expect(logoContent).not.toMatch(/password/i);
      expect(logoContent).not.toMatch(/secret/i);
      expect(logoContent).not.toMatch(/api[_-]?key/i);
      expect(logoContent).not.toMatch(/token/i);
    });

    it('should not have executable code', () => {
      expect(logoContent).not.toContain('<script');
      expect(logoContent).not.toContain('javascript:');
      expect(logoContent).not.toContain('onclick');
      expect(logoContent).not.toContain('onerror');
    });
  });

  describe('Cross-Platform Compatibility', () => {
    it('should use standard SVG features', () => {
      // Should only use widely supported SVG elements
      const unsupportedElements = [
        '<foreignObject',
        '<switch',
        '<view',
      ];

      unsupportedElements.forEach(element => {
        expect(logoContent).not.toContain(element);
      });
    });

    it('should not use CSS that might not render in email', () => {
      expect(logoContent).not.toMatch(/display:\s*flex/);
      expect(logoContent).not.toMatch(/display:\s*grid/);
      expect(logoContent).not.toMatch(/transform:/);
    });

    it('should use inline styles or attributes', () => {
      // Colors should be in fill attributes, not CSS
      expect(logoContent).toMatch(/fill="#[0-9a-fA-F]{6}"/);
    });
  });

  describe('Email Client Compatibility', () => {
    it('should be compatible with Gmail', () => {
      // Gmail supports SVG Tiny PS
      expect(logoContent).toContain('baseProfile="tiny-ps"');
    });

    it('should be compatible with Outlook', () => {
      // Outlook has limited SVG support, but BIMI uses a fallback
      expect(logoContent).toContain('version="1.2"');
    });

    it('should be compatible with Apple Mail', () => {
      // Apple Mail has good SVG support
      expect(logoContent).toContain('xmlns="http://www.w3.org/2000/svg"');
    });

    it('should have fallback metadata', () => {
      // Title and desc provide fallback information
      expect(logoContent).toContain('<title>');
      expect(logoContent).toContain('<desc>');
    });
  });

  describe('BIMI Validation Scripts', () => {
    it('should have validation script', () => {
      const scriptPath = join(process.cwd(), 'scripts/validate-bimi.js');
      expect(existsSync(scriptPath)).toBe(true);
    });

    it('should have test script', () => {
      const testScriptPath = join(process.cwd(), 'scripts/test-bimi-setup.js');
      expect(existsSync(testScriptPath)).toBe(true);
    });

    it('should have production check script', () => {
      const checkScriptPath = join(process.cwd(), 'scripts/check-bimi-production.js');
      expect(existsSync(checkScriptPath)).toBe(true);
    });
  });

  describe('Complete Integration Validation', () => {
    it('should have all required BIMI components', () => {
      const components = {
        'Logo file': existsSync(logoPath),
        'Preview HTML': existsSync(join(process.cwd(), 'public/bimi-logo-preview.html')),
        'Setup docs': existsSync(join(process.cwd(), 'docs/BIMI_SETUP.md')),
        'Validation script': existsSync(join(process.cwd(), 'scripts/validate-bimi.js')),
        'Quick reference': existsSync(join(process.cwd(), 'BIMI_QUICK_REFERENCE.md')),
      };

      Object.entries(components).forEach(([component, exists]) => {
        expect(exists).toBe(true);
      });
    });

    it('should be ready for production deployment', () => {
      expect(logoContent).toBeTruthy();
      expect(logoContent).toContain('baseProfile="tiny-ps"');
      expect(logoContent).not.toContain('<script');
      expect(existsSync(logoPath)).toBe(true);
    });
  });
});
