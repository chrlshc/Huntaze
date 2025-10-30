/**
 * CDK Region Migration Regression Tests
 * 
 * Ensures that the migration from us-west-1 to us-east-1 is complete
 * and prevents accidental rollback to the old region configuration.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('🔄 CDK Region Migration Validation', () => {
  const contextPath = join(process.cwd(), 'infra/cdk/cdk.context.json');
  const stackPath = join(process.cwd(), 'infra/cdk/lib/huntaze-of-stack.ts');

  describe('Migration Completeness', () => {
    it('should have removed all us-west-1 references from context', () => {
      expect(existsSync(contextPath)).toBe(true);
      
      const contextContent = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(contextContent);
      
      // Should not have any us-west-1 keys
      const keys = Object.keys(context);
      const westKeys = keys.filter(k => k.includes('us-west-1'));
      
      expect(westKeys).toHaveLength(0);
    });

    it('should have only us-east-1 configuration', () => {
      const contextContent = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(contextContent);
      
      const keys = Object.keys(context);
      const regionKeys = keys.filter(k => k.includes('availability-zones:account='));
      
      expect(regionKeys).toHaveLength(1);
      expect(regionKeys[0]).toContain('region=us-east-1');
    });

    it('should not contain us-west-1 text anywhere in context file', () => {
      const contextContent = readFileSync(contextPath, 'utf-8');
      
      expect(contextContent).not.toContain('us-west-1');
    });

    it('should have us-east-1 as the only region in stack', () => {
      const stackContent = readFileSync(stackPath, 'utf-8');
      
      // Should contain us-east-1
      expect(stackContent).toContain('us-east-1');
      
      // Should not contain us-west-1
      expect(stackContent).not.toContain('us-west-1');
    });
  });

  describe('Configuration Integrity', () => {
    it('should have valid us-east-1 availability zones', () => {
      const contextContent = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(contextContent);
      
      const azKey = 'availability-zones:account=317805897534:region=us-east-1';
      const azs = context[azKey] as string[];
      
      expect(azs).toBeDefined();
      expect(Array.isArray(azs)).toBe(true);
      expect(azs.length).toBeGreaterThanOrEqual(2);
      
      // All AZs should be us-east-1
      azs.forEach(az => {
        expect(az).toMatch(/^us-east-1[a-f]$/);
      });
    });

    it('should have expected us-east-1 availability zones', () => {
      const contextContent = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(contextContent);
      
      const azKey = 'availability-zones:account=317805897534:region=us-east-1';
      const azs = context[azKey] as string[];
      
      const expectedAzs = [
        'us-east-1a',
        'us-east-1b', 
        'us-east-1c',
        'us-east-1d',
        'us-east-1e',
        'us-east-1f'
      ];
      
      expect(azs).toEqual(expectedAzs);
    });

    it('should maintain account consistency', () => {
      const contextContent = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(contextContent);
      
      const keys = Object.keys(context);
      
      keys.forEach(key => {
        if (key.includes('account=')) {
          expect(key).toContain('account=317805897534');
        }
      });
    });
  });

  describe('Deployment Readiness', () => {
    it('should be ready for us-east-1 deployment', () => {
      const contextContent = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(contextContent);
      const stackContent = readFileSync(stackPath, 'utf-8');
      
      // Context should have us-east-1 AZs
      const azKey = 'availability-zones:account=317805897534:region=us-east-1';
      expect(context[azKey]).toBeDefined();
      
      // Stack should reference us-east-1
      expect(stackContent).toContain('us-east-1');
      
      // Should have enough AZs for multi-AZ deployment
      const azs = context[azKey] as string[];
      expect(azs.length).toBeGreaterThanOrEqual(2);
    });

    it('should support high availability deployment', () => {
      const contextContent = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(contextContent);
      
      const azKey = 'availability-zones:account=317805897534:region=us-east-1';
      const azs = context[azKey] as string[];
      
      // us-east-1 has 6 AZs, which is excellent for HA
      expect(azs.length).toBe(6);
    });
  });

  describe('Regression Prevention', () => {
    it('should prevent accidental us-west-1 restoration', () => {
      const contextContent = readFileSync(contextPath, 'utf-8');
      
      // These should never appear again
      const forbiddenPatterns = [
        'us-west-1a',
        'us-west-1c',
        'region=us-west-1',
        'availability-zones:account=317805897534:region=us-west-1'
      ];
      
      forbiddenPatterns.forEach(pattern => {
        expect(contextContent).not.toContain(pattern);
      });
    });

    it('should maintain single region configuration', () => {
      const contextContent = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(contextContent);
      
      const regionKeys = Object.keys(context).filter(k => k.includes('region='));
      
      // Should have exactly one region
      expect(regionKeys.length).toBe(1);
      expect(regionKeys[0]).toContain('us-east-1');
    });

    it('should have clean JSON structure', () => {
      const contextContent = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(contextContent);
      
      // Should have exactly one top-level key
      const keys = Object.keys(context);
      expect(keys.length).toBe(1);
      
      // Key should be for us-east-1
      expect(keys[0]).toBe('availability-zones:account=317805897534:region=us-east-1');
    });
  });

  describe('Performance Optimization', () => {
    it('should use cost-effective region', () => {
      const contextContent = readFileSync(contextPath, 'utf-8');
      
      // us-east-1 is typically the most cost-effective AWS region
      expect(contextContent).toContain('us-east-1');
    });

    it('should have optimal AZ distribution', () => {
      const contextContent = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(contextContent);
      
      const azKey = 'availability-zones:account=317805897534:region=us-east-1';
      const azs = context[azKey] as string[];
      
      // us-east-1 has the most AZs (6) for optimal distribution
      expect(azs.length).toBe(6);
      
      // Should be in alphabetical order for consistency
      const sortedAzs = [...azs].sort();
      expect(azs).toEqual(sortedAzs);
    });
  });
});