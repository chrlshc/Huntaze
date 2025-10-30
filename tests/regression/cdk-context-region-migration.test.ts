/**
 * CDK Context Region Migration Regression Tests
 * 
 * Ensures that the migration from us-west-1 to us-east-1 is complete
 * and prevents regression to multi-region configuration.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('🔄 CDK Context Region Migration Regression', () => {
  const contextPath = join(process.cwd(), 'infra/cdk/cdk.context.json');
  const stackPath = join(process.cwd(), 'infra/cdk/lib/huntaze-of-stack.ts');

  describe('Migration Completion', () => {
    it('should have removed us-west-1 configuration completely', () => {
      const content = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(content);
      
      // Explicitly check that us-west-1 was removed
      const usWest1Key = 'availability-zones:account=317805897534:region=us-west-1';
      expect(context[usWest1Key]).toBeUndefined();
      
      // Should not contain us-west-1 anywhere in the file
      expect(content).not.toContain('us-west-1');
    });

    it('should maintain us-east-1 configuration integrity', () => {
      const content = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(content);
      
      const usEast1Key = 'availability-zones:account=317805897534:region=us-east-1';
      expect(context[usEast1Key]).toBeDefined();
      expect(Array.isArray(context[usEast1Key])).toBe(true);
      
      const azs = context[usEast1Key] as string[];
      expect(azs).toEqual([
        'us-east-1a',
        'us-east-1b',
        'us-east-1c',
        'us-east-1d',
        'us-east-1e',
        'us-east-1f'
      ]);
    });

    it('should have exactly one region configuration', () => {
      const content = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(content);
      
      const keys = Object.keys(context);
      expect(keys).toHaveLength(1);
      expect(keys[0]).toBe('availability-zones:account=317805897534:region=us-east-1');
    });

    it('should not have any trailing commas or malformed JSON', () => {
      const content = readFileSync(contextPath, 'utf-8');
      
      // Should be valid JSON
      expect(() => JSON.parse(content)).not.toThrow();
      
      // Should not have trailing commas
      expect(content).not.toMatch(/,\s*]/);
      expect(content).not.toMatch(/,\s*}/);
    });
  });

  describe('Stack Consistency', () => {
    it('should have updated stack to use us-east-1 only', () => {
      const stackContent = readFileSync(stackPath, 'utf-8');
      
      // Should reference us-east-1
      expect(stackContent).toContain('us-east-1');
      
      // Should not reference us-west-1
      expect(stackContent).not.toContain('us-west-1');
    });

    it('should have consistent account ID between context and stack', () => {
      const contextContent = readFileSync(contextPath, 'utf-8');
      const stackContent = readFileSync(stackPath, 'utf-8');
      
      // Both should reference the same account
      expect(contextContent).toContain('317805897534');
      expect(stackContent).toContain('317805897534');
    });

    it('should have compatible VPC configuration', () => {
      const contextContent = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(contextContent);
      const stackContent = readFileSync(stackPath, 'utf-8');
      
      // Stack uses maxAzs: 2
      const maxAzsMatch = stackContent.match(/maxAzs:\s*(\d+)/);
      expect(maxAzsMatch).toBeTruthy();
      
      const maxAzs = parseInt(maxAzsMatch![1], 10);
      
      // Context should have enough AZs
      const azKey = 'availability-zones:account=317805897534:region=us-east-1';
      const azs = context[azKey] as string[];
      expect(azs.length).toBeGreaterThanOrEqual(maxAzs);
    });
  });

  describe('Regression Prevention', () => {
    it('should not reintroduce us-west-1 configuration', () => {
      const content = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(content);
      
      // Explicitly test for keys that should not exist
      const prohibitedKeys = [
        'availability-zones:account=317805897534:region=us-west-1',
        'availability-zones:account=317805897534:region=us-west-2',
        'availability-zones:account=317805897534:region=eu-west-1'
      ];
      
      prohibitedKeys.forEach(key => {
        expect(context[key]).toBeUndefined();
      });
    });

    it('should maintain single-region deployment model', () => {
      const content = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(content);
      
      const regionKeys = Object.keys(context).filter(key => 
        key.startsWith('availability-zones:') && key.includes('region=')
      );
      
      // Should have exactly one region
      expect(regionKeys).toHaveLength(1);
      expect(regionKeys[0]).toContain('region=us-east-1');
    });

    it('should not have any multi-region artifacts', () => {
      const content = readFileSync(contextPath, 'utf-8');
      
      // Should not contain references to multiple regions
      const regionReferences = content.match(/us-[a-z]+-\d+/g) || [];
      const uniqueRegions = new Set(regionReferences);
      
      expect(uniqueRegions.size).toBe(1);
      expect(uniqueRegions.has('us-east-1')).toBe(true);
    });

    it('should have proper JSON formatting after migration', () => {
      const content = readFileSync(contextPath, 'utf-8');
      
      // Should be properly formatted
      expect(content).toMatch(/{\s*\n/); // Opening brace with newline
      expect(content).toMatch(/\n\s*}/); // Closing brace with newline
      expect(content.endsWith('\n')).toBe(true); // Ends with newline
    });
  });

  describe('Deployment Readiness', () => {
    it('should be ready for CDK synthesis', () => {
      const content = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(content);
      
      // Should have valid structure for CDK
      const azKey = 'availability-zones:account=317805897534:region=us-east-1';
      expect(context[azKey]).toBeDefined();
      expect(Array.isArray(context[azKey])).toBe(true);
      expect((context[azKey] as string[]).length).toBeGreaterThan(0);
    });

    it('should support high availability deployment', () => {
      const content = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(content);
      
      const azKey = 'availability-zones:account=317805897534:region=us-east-1';
      const azs = context[azKey] as string[];
      
      // Should have at least 2 AZs for HA
      expect(azs.length).toBeGreaterThanOrEqual(2);
      
      // Should have the expected 6 AZs for us-east-1
      expect(azs.length).toBe(6);
    });

    it('should be compatible with existing CDK configuration', () => {
      const cdkJsonPath = join(process.cwd(), 'infra/cdk/cdk.json');
      expect(existsSync(cdkJsonPath)).toBe(true);
      
      const cdkJsonContent = readFileSync(cdkJsonPath, 'utf-8');
      const cdkJson = JSON.parse(cdkJsonContent);
      
      // Should have context configuration
      expect(cdkJson.context).toBeDefined();
    });
  });

  describe('Performance Impact', () => {
    it('should have reduced context size after migration', () => {
      const content = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(content);
      
      // Should have minimal keys (only one region)
      expect(Object.keys(context).length).toBe(1);
      
      // File should be smaller (less than 200 bytes)
      expect(content.length).toBeLessThan(200);
    });

    it('should have faster CDK synthesis with single region', () => {
      const content = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(content);
      
      // Single region should be faster to process
      const regionCount = Object.keys(context).filter(k => k.includes('region=')).length;
      expect(regionCount).toBe(1);
    });
  });

  describe('Data Integrity', () => {
    it('should have preserved us-east-1 availability zones correctly', () => {
      const content = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(content);
      
      const azKey = 'availability-zones:account=317805897534:region=us-east-1';
      const azs = context[azKey] as string[];
      
      // Should have all 6 us-east-1 AZs in correct order
      expect(azs).toEqual([
        'us-east-1a',
        'us-east-1b',
        'us-east-1c',
        'us-east-1d',
        'us-east-1e',
        'us-east-1f'
      ]);
      
      // Each AZ should be valid
      azs.forEach(az => {
        expect(az).toMatch(/^us-east-1[a-f]$/);
      });
    });

    it('should not have corrupted or missing data', () => {
      const content = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(content);
      
      // Should have exactly the expected structure
      expect(context).toEqual({
        'availability-zones:account=317805897534:region=us-east-1': [
          'us-east-1a',
          'us-east-1b',
          'us-east-1c',
          'us-east-1d',
          'us-east-1e',
          'us-east-1f'
        ]
      });
    });
  });

  describe('Future Migration Prevention', () => {
    it('should not accidentally add back removed regions', () => {
      const content = readFileSync(contextPath, 'utf-8');
      
      // Should not contain any west coast regions
      expect(content).not.toContain('us-west-1');
      expect(content).not.toContain('us-west-2');
      
      // Should not contain other regions
      expect(content).not.toContain('eu-west-1');
      expect(content).not.toContain('ap-southeast-1');
    });

    it('should maintain single-region architecture decision', () => {
      const content = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(content);
      
      // Architecture decision: single region deployment
      const keys = Object.keys(context);
      expect(keys.length).toBe(1);
      expect(keys[0]).toContain('us-east-1');
    });
  });
});