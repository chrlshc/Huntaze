/**
 * CDK Context Configuration Validation Tests
 * 
 * Validates that cdk.context.json is properly configured for the target region
 * and contains valid availability zone information.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('📍 CDK Context Configuration', () => {
  const contextPath = join(process.cwd(), 'infra/cdk/cdk.context.json');
  let context: Record<string, unknown>;

  it('should have cdk.context.json file', () => {
    expect(existsSync(contextPath)).toBe(true);
  });

  it('should be valid JSON', () => {
    const content = readFileSync(contextPath, 'utf-8');
    expect(() => JSON.parse(content)).not.toThrow();
    context = JSON.parse(content);
  });

  describe('Region Configuration', () => {
    it('should have us-east-1 region configured', () => {
      const content = readFileSync(contextPath, 'utf-8');
      context = JSON.parse(content);
      
      const azKey = 'availability-zones:account=317805897534:region=us-east-1';
      expect(context[azKey]).toBeDefined();
    });

    it('should have us-east-1 as primary region', () => {
      const content = readFileSync(contextPath, 'utf-8');
      context = JSON.parse(content);
      
      const usEast1Key = 'availability-zones:account=317805897534:region=us-east-1';
      expect(context[usEast1Key]).toBeDefined();
      expect(Array.isArray(context[usEast1Key])).toBe(true);
      expect((context[usEast1Key] as string[]).length).toBeGreaterThan(0);
    });

    it('should match stack configuration region', () => {
      const stackPath = join(process.cwd(), 'infra/cdk/lib/huntaze-of-stack.ts');
      const stackContent = readFileSync(stackPath, 'utf-8');
      
      // Stack should reference us-east-1 as primary region
      expect(stackContent).toContain('us-east-1');
    });
  });

  describe('Availability Zones', () => {
    it('should have availability zones array', () => {
      const content = readFileSync(contextPath, 'utf-8');
      context = JSON.parse(content);
      
      const azKey = 'availability-zones:account=317805897534:region=us-east-1';
      expect(Array.isArray(context[azKey])).toBe(true);
    });

    it('should have at least 2 availability zones', () => {
      const content = readFileSync(contextPath, 'utf-8');
      context = JSON.parse(content);
      
      const azKey = 'availability-zones:account=317805897534:region=us-east-1';
      const azs = context[azKey] as string[];
      
      expect(azs.length).toBeGreaterThanOrEqual(2);
    });

    it('should have valid us-east-1 AZ names', () => {
      const content = readFileSync(contextPath, 'utf-8');
      context = JSON.parse(content);
      
      const azKey = 'availability-zones:account=317805897534:region=us-east-1';
      const azs = context[azKey] as string[];
      
      azs.forEach(az => {
        expect(az).toMatch(/^us-east-1[a-f]$/);
      });
    });

    it('should have unique availability zones', () => {
      const content = readFileSync(contextPath, 'utf-8');
      context = JSON.parse(content);
      
      const azKey = 'availability-zones:account=317805897534:region=us-east-1';
      const azs = context[azKey] as string[];
      
      const uniqueAzs = new Set(azs);
      expect(uniqueAzs.size).toBe(azs.length);
    });

    it('should have AZs in alphabetical order', () => {
      const content = readFileSync(contextPath, 'utf-8');
      context = JSON.parse(content);
      
      const azKey = 'availability-zones:account=317805897534:region=us-east-1';
      const azs = context[azKey] as string[];
      
      const sortedAzs = [...azs].sort();
      expect(azs).toEqual(sortedAzs);
    });

    it('should contain expected us-east-1 AZs', () => {
      const content = readFileSync(contextPath, 'utf-8');
      context = JSON.parse(content);
      
      const azKey = 'availability-zones:account=317805897534:region=us-east-1';
      const azs = context[azKey] as string[];
      
      // us-east-1 has 6 AZs: a, b, c, d, e, f
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
  });

  describe('Account Configuration', () => {
    it('should have correct AWS account ID', () => {
      const content = readFileSync(contextPath, 'utf-8');
      context = JSON.parse(content);
      
      const keys = Object.keys(context);
      const accountKey = keys.find(k => k.includes('account='));
      
      expect(accountKey).toContain('account=317805897534');
    });

    it('should match stack account configuration', () => {
      const stackPath = join(process.cwd(), 'infra/cdk/lib/huntaze-of-stack.ts');
      const stackContent = readFileSync(stackPath, 'utf-8');
      
      expect(stackContent).toContain('317805897534');
    });
  });

  describe('Context Structure', () => {
    it('should have proper key format', () => {
      const content = readFileSync(contextPath, 'utf-8');
      context = JSON.parse(content);
      
      const keys = Object.keys(context);
      
      keys.forEach(key => {
        expect(key).toMatch(/^availability-zones:account=\d+:region=[a-z]+-[a-z]+-\d+$/);
      });
    });

    it('should not have empty values', () => {
      const content = readFileSync(contextPath, 'utf-8');
      context = JSON.parse(content);
      
      Object.values(context).forEach(value => {
        expect(value).toBeTruthy();
        if (Array.isArray(value)) {
          expect(value.length).toBeGreaterThan(0);
        }
      });
    });

    it('should be properly formatted JSON', () => {
      const content = readFileSync(contextPath, 'utf-8');
      
      // Should have proper indentation
      expect(content).toContain('  ');
      
      // Should end with newline
      expect(content.endsWith('\n')).toBe(true);
    });
  });

  describe('High Availability Requirements', () => {
    it('should support multi-AZ deployment (2 AZs minimum)', () => {
      const content = readFileSync(contextPath, 'utf-8');
      context = JSON.parse(content);
      
      const azKey = 'availability-zones:account=317805897534:region=us-east-1';
      const azs = context[azKey] as string[];
      
      // Stack uses maxAzs: 2, so we need at least 2 AZs
      expect(azs.length).toBeGreaterThanOrEqual(2);
    });

    it('should have enough AZs for production deployment', () => {
      const content = readFileSync(contextPath, 'utf-8');
      context = JSON.parse(content);
      
      const azKey = 'availability-zones:account=317805897534:region=us-east-1';
      const azs = context[azKey] as string[];
      
      // Production best practice: 3+ AZs for high availability
      expect(azs.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Migration Validation', () => {
    it('should have us-east-1 configuration only', () => {
      const content = readFileSync(contextPath, 'utf-8');
      context = JSON.parse(content);
      
      const usEast1Key = 'availability-zones:account=317805897534:region=us-east-1';
      expect(context[usEast1Key]).toBeDefined();
    });

    it('should not contain us-west-1 references', () => {
      const content = readFileSync(contextPath, 'utf-8');
      
      expect(content).not.toContain('us-west-1');
    });

    it('should have completed migration to us-east-1', () => {
      const content = readFileSync(contextPath, 'utf-8');
      context = JSON.parse(content);
      
      const keys = Object.keys(context);
      
      // Should only have us-east-1 region
      keys.forEach(key => {
        if (key.includes('region=')) {
          expect(key).toContain('region=us-east-1');
          expect(key).not.toContain('region=us-west-1');
        }
      });
    });

    it('should use us-east-1 for deployment', () => {
      const stackPath = join(process.cwd(), 'infra/cdk/lib/huntaze-of-stack.ts');
      const stackContent = readFileSync(stackPath, 'utf-8');
      
      // Stack should use us-east-1 as deployment region
      expect(stackContent).toContain('us-east-1');
      expect(stackContent).not.toContain('us-west-1');
    });

    it('should have exactly one region configuration', () => {
      const content = readFileSync(contextPath, 'utf-8');
      context = JSON.parse(content);
      
      const keys = Object.keys(context);
      const regionKeys = keys.filter(k => k.includes('region='));
      
      expect(regionKeys).toHaveLength(1);
      expect(regionKeys[0]).toBe('availability-zones:account=317805897534:region=us-east-1');
    });

    it('should not have us-west-1 availability zones', () => {
      const content = readFileSync(contextPath, 'utf-8');
      context = JSON.parse(content);
      
      const usWest1Key = 'availability-zones:account=317805897534:region=us-west-1';
      expect(context[usWest1Key]).toBeUndefined();
    });

    it('should have exactly 6 us-east-1 availability zones', () => {
      const content = readFileSync(contextPath, 'utf-8');
      context = JSON.parse(content);
      
      const azKey = 'availability-zones:account=317805897534:region=us-east-1';
      const azs = context[azKey] as string[];
      
      expect(azs).toHaveLength(6);
      expect(azs).toEqual([
        'us-east-1a',
        'us-east-1b',
        'us-east-1c',
        'us-east-1d',
        'us-east-1e',
        'us-east-1f'
      ]);
    });

    it('should have minimal context configuration', () => {
      const content = readFileSync(contextPath, 'utf-8');
      context = JSON.parse(content);
      
      // Should have exactly one key after migration
      expect(Object.keys(context)).toHaveLength(1);
    });

    it('should not have any other region configurations', () => {
      const content = readFileSync(contextPath, 'utf-8');
      context = JSON.parse(content);
      
      const otherRegions = ['us-west-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'];
      
      otherRegions.forEach(region => {
        const key = `availability-zones:account=317805897534:region=${region}`;
        expect(context[key]).toBeUndefined();
      });
    });
  });

  describe('CDK Compatibility', () => {
    it('should be compatible with CDK version', () => {
      const packagePath = join(process.cwd(), 'infra/cdk/package.json');
      const packageContent = readFileSync(packagePath, 'utf-8');
      const packageJson = JSON.parse(packageContent);
      
      // Should have aws-cdk-lib dependency
      expect(packageJson.dependencies['aws-cdk-lib']).toBeDefined();
    });

    it('should match cdk.json configuration', () => {
      const cdkJsonPath = join(process.cwd(), 'infra/cdk/cdk.json');
      const cdkJsonContent = readFileSync(cdkJsonPath, 'utf-8');
      const cdkJson = JSON.parse(cdkJsonContent);
      
      // cdk.json should have context section
      expect(cdkJson.context).toBeDefined();
    });
  });
});
