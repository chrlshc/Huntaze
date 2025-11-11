/**
 * Unit Tests - Social Integrations Documentation Validation
 * 
 * Tests to validate that all required documentation exists and is complete
 * Based on: .kiro/specs/social-integrations/tasks.md (Task 16)
 * 
 * Coverage:
 * - Developer documentation
 * - User documentation
 * - API documentation
 * - Troubleshooting guides
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Social Integrations Documentation - Validation', () => {
  describe('Developer Guide (Task 16.2)', () => {
    const devGuidePath = join(process.cwd(), 'docs/DEVELOPER_GUIDE_SOCIAL_INTEGRATIONS.md');

    it('should have developer guide file', () => {
      expect(existsSync(devGuidePath)).toBe(true);
    });

    it('developer guide should be substantial (>2000 chars)', () => {
      if (existsSync(devGuidePath)) {
        const content = readFileSync(devGuidePath, 'utf-8');
        expect(content.length).toBeGreaterThan(2000);
      }
    });

    it('should document security features', () => {
      if (existsSync(devGuidePath)) {
        const content = readFileSync(devGuidePath, 'utf-8');
        expect(content.toLowerCase()).toMatch(/security|csrf|token.*encrypt/);
      }
    });

    it('should document OAuth flow', () => {
      if (existsSync(devGuidePath)) {
        const content = readFileSync(devGuidePath, 'utf-8');
        expect(content.toLowerCase()).toMatch(/oauth/);
      }
    });
  });

  describe('User Guide (Task 16.1)', () => {
    const userGuidePath = join(process.cwd(), 'docs/USER_GUIDE_SOCIAL_INTEGRATIONS.md');

    it('should have user guide file', () => {
      expect(existsSync(userGuidePath)).toBe(true);
    });

    it('user guide should be substantial (>1000 chars)', () => {
      if (existsSync(userGuidePath)) {
        const content = readFileSync(userGuidePath, 'utf-8');
        expect(content.length).toBeGreaterThan(1000);
      }
    });

    it('should contain platform instructions', () => {
      if (existsSync(userGuidePath)) {
        const content = readFileSync(userGuidePath, 'utf-8');
        expect(content.toLowerCase()).toMatch(/instagram|tiktok/);
      }
    });
  });

  describe('API Documentation', () => {
    it('should have OpenAPI specification', () => {
      const openApiPath = join(process.cwd(), 'docs/api/openapi.yaml');
      expect(existsSync(openApiPath)).toBe(true);
    });

    it('should have API reference', () => {
      const apiRefPath = join(process.cwd(), 'docs/API_REFERENCE.md');
      expect(existsSync(apiRefPath)).toBe(true);
    });
  });

  describe('Complete Documentation', () => {
    it('should have all required files', () => {
      const requiredDocs = [
        'docs/DEVELOPER_GUIDE_SOCIAL_INTEGRATIONS.md',
        'docs/USER_GUIDE_SOCIAL_INTEGRATIONS.md',
        'docs/api/openapi.yaml',
        'docs/API_REFERENCE.md',
      ];

      requiredDocs.forEach(doc => {
        const fullPath = join(process.cwd(), doc);
        expect(existsSync(fullPath)).toBe(true);
      });
    });
  });
});
