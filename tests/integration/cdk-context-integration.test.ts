/**
 * CDK Context Integration Tests
 * 
 * Tests that the CDK context configuration integrates properly with
 * the stack definition and deployment configuration.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('🔗 CDK Context Integration', () => {
  const contextPath = join(process.cwd(), 'infra/cdk/cdk.context.json');
  const stackPath = join(process.cwd(), 'infra/cdk/lib/huntaze-of-stack.ts');

  describe('Region Consistency', () => {
    it('should have matching region in context and stack', () => {
      const contextContent = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(contextContent);
      
      const stackContent = readFileSync(stackPath, 'utf-8');
      
      // Extract region from context
      const contextKeys = Object.keys(context);
      const regionMatch = contextKeys[0].match(/region=([a-z]+-[a-z]+-\d+)/);
      expect(regionMatch).toBeTruthy();
      
      const contextRegion = regionMatch![1];
      
      // Stack should reference the same region
      expect(stackContent).toContain(contextRegion);
    });

    it('should use us-east-1 consistently', () => {
      const contextContent = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(contextContent);
      
      const stackContent = readFileSync(stackPath, 'utf-8');
      
      // Context should have us-east-1
      const azKey = 'availability-zones:account=317805897534:region=us-east-1';
      expect(context[azKey]).toBeDefined();
      
      // Stack should reference us-east-1
      expect(stackContent).toContain('us-east-1');
    });
  });

  describe('Availability Zone Integration', () => {
    it('should have enough AZs for VPC configuration', () => {
      const contextContent = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(contextContent);
      
      const stackContent = readFileSync(stackPath, 'utf-8');
      
      // Stack uses maxAzs: 2
      const maxAzsMatch = stackContent.match(/maxAzs:\s*(\d+)/);
      expect(maxAzsMatch).toBeTruthy();
      
      const maxAzs = parseInt(maxAzsMatch![1], 10);
      
      // Context should have at least maxAzs available
      const azKey = 'availability-zones:account=317805897534:region=us-east-1';
      const azs = context[azKey] as string[];
      
      expect(azs.length).toBeGreaterThanOrEqual(maxAzs);
    });

    it('should support multi-AZ deployment', () => {
      const contextContent = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(contextContent);
      
      const azKey = 'availability-zones:account=317805897534:region=us-east-1';
      const azs = context[azKey] as string[];
      
      // Should have at least 2 AZs for high availability
      expect(azs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Account Integration', () => {
    it('should have matching account ID in context and stack', () => {
      const contextContent = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(contextContent);
      
      const stackContent = readFileSync(stackPath, 'utf-8');
      
      // Extract account from context
      const contextKeys = Object.keys(context);
      const accountMatch = contextKeys[0].match(/account=(\d+)/);
      expect(accountMatch).toBeTruthy();
      
      const contextAccount = accountMatch![1];
      
      // Stack should reference the same account
      expect(stackContent).toContain(contextAccount);
    });
  });

  describe('Deployment Configuration', () => {
    it('should be compatible with ECS Fargate deployment', () => {
      const contextContent = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(contextContent);
      
      const stackContent = readFileSync(stackPath, 'utf-8');
      
      // Should have ECS configuration
      expect(stackContent).toContain('ecs.Cluster');
      expect(stackContent).toContain('FargateTaskDefinition');
      
      // Should have enough AZs for ECS deployment
      const azKey = 'availability-zones:account=317805897534:region=us-east-1';
      const azs = context[azKey] as string[];
      expect(azs.length).toBeGreaterThanOrEqual(2);
    });

    it('should support DynamoDB global tables', () => {
      const contextContent = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(contextContent);
      
      const stackContent = readFileSync(stackPath, 'utf-8');
      
      // Should have DynamoDB configuration
      expect(stackContent).toContain('dynamodb.Table');
      
      // us-east-1 is a valid region for DynamoDB global tables
      const azKey = 'availability-zones:account=317805897534:region=us-east-1';
      expect(context[azKey]).toBeDefined();
    });
  });

  describe('Network Configuration', () => {
    it('should support VPC subnet configuration', () => {
      const contextContent = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(contextContent);
      
      const stackContent = readFileSync(stackPath, 'utf-8');
      
      // Stack should have VPC configuration
      expect(stackContent).toContain('new ec2.Vpc');
      expect(stackContent).toContain('subnetConfiguration');
      
      // Should have enough AZs for subnet distribution
      const azKey = 'availability-zones:account=317805897534:region=us-east-1';
      const azs = context[azKey] as string[];
      expect(azs.length).toBeGreaterThanOrEqual(2);
    });

    it('should support NAT gateway configuration', () => {
      const contextContent = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(contextContent);
      
      const stackContent = readFileSync(stackPath, 'utf-8');
      
      // Stack uses 1 NAT gateway
      expect(stackContent).toContain('natGateways: 1');
      
      // Should have AZs available for NAT gateway placement
      const azKey = 'availability-zones:account=317805897534:region=us-east-1';
      const azs = context[azKey] as string[];
      expect(azs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Service Availability', () => {
    it('should be in a region with all required AWS services', () => {
      const contextContent = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(contextContent);
      
      const azKey = 'availability-zones:account=317805897534:region=us-east-1';
      expect(context[azKey]).toBeDefined();
      
      // us-east-1 has all services:
      // - ECS Fargate ✓
      // - DynamoDB ✓
      // - KMS ✓
      // - Secrets Manager ✓
      // - CloudWatch ✓
      // - ECR ✓
    });
  });

  describe('Cost Optimization', () => {
    it('should use cost-effective region', () => {
      const contextContent = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(contextContent);
      
      const azKey = 'availability-zones:account=317805897534:region=us-east-1';
      expect(context[azKey]).toBeDefined();
      
      // us-east-1 is typically the most cost-effective region
    });
  });

  describe('Migration Validation', () => {
    it('should have completed migration from us-west-1', () => {
      const contextContent = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(contextContent);
      
      // Should not have us-west-1 configuration
      const oldAzKey = 'availability-zones:account=317805897534:region=us-west-1';
      expect(context[oldAzKey]).toBeUndefined();
      
      // Should have us-east-1 configuration
      const newAzKey = 'availability-zones:account=317805897534:region=us-east-1';
      expect(context[newAzKey]).toBeDefined();
    });

    it('should have updated all region references', () => {
      const stackContent = readFileSync(stackPath, 'utf-8');
      const contextContent = readFileSync(contextPath, 'utf-8');
      
      // Should not reference old region
      expect(stackContent).not.toContain('us-west-1');
      expect(contextContent).not.toContain('us-west-1');
      
      // Should reference new region
      expect(stackContent).toContain('us-east-1');
      expect(contextContent).toContain('us-east-1');
    });

    it('should have single region configuration', () => {
      const contextContent = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(contextContent);
      
      const keys = Object.keys(context);
      const regionKeys = keys.filter(k => k.includes('region='));
      
      // Should have exactly one region configured
      expect(regionKeys.length).toBe(1);
      expect(regionKeys[0]).toContain('region=us-east-1');
    });

    it('should have exactly 6 availability zones for us-east-1', () => {
      const contextContent = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(contextContent);
      
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

    it('should not have any other region configurations', () => {
      const contextContent = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(contextContent);
      
      const otherRegions = ['us-west-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'];
      
      otherRegions.forEach(region => {
        const key = `availability-zones:account=317805897534:region=${region}`;
        expect(context[key]).toBeUndefined();
      });
    });

    it('should have minimal context configuration', () => {
      const contextContent = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(contextContent);
      
      // Should have exactly one key
      expect(Object.keys(context)).toHaveLength(1);
      expect(context).toHaveProperty('availability-zones:account=317805897534:region=us-east-1');
    });
  });

  describe('CDK Synthesis', () => {
    it('should have valid context for CDK synthesis', () => {
      const contextContent = readFileSync(contextPath, 'utf-8');
      const context = JSON.parse(contextContent);
      
      // Should have at least one availability zone entry
      const keys = Object.keys(context);
      expect(keys.length).toBeGreaterThan(0);
      
      // Each entry should have valid structure
      keys.forEach(key => {
        expect(key).toMatch(/^availability-zones:account=\d+:region=[a-z]+-[a-z]+-\d+$/);
        expect(Array.isArray(context[key])).toBe(true);
        expect((context[key] as string[]).length).toBeGreaterThan(0);
      });
    });
  });
});
