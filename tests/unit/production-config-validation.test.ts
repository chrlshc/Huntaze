/**
 * Production Configuration Validation Tests
 * Tests the .env.production file and environment configuration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Production Configuration Validation', () => {
  const envProductionPath = join(process.cwd(), '.env.production');
  let originalEnv: NodeJS.ProcessEnv;
  
  beforeEach(() => {
    vi.clearAllMocks();
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = originalEnv;
  });

  describe('Environment File Structure', () => {
    it('should have .env.production file', () => {
      expect(existsSync(envProductionPath)).toBe(true);
    });

    it('should contain all required AWS configuration', () => {
      const content = readFileSync(envProductionPath, 'utf-8');
      
      // AWS Configuration
      expect(content).toContain('AWS_REGION=us-east-1');
      expect(content).toContain('AWS_ACCOUNT_ID=317805897534');
    });

    it('should contain all required ECS configuration', () => {
      const content = readFileSync(envProductionPath, 'utf-8');
      
      // ECS Configuration
      expect(content).toContain('ECS_CLUSTER_ARN=arn:aws:ecs:us-east-1:317805897534:cluster/huntaze-of-fargate');
      expect(content).toContain('ECS_TASK_DEFINITION=HuntazeOfStackBrowserWorkerTask:1');
      expect(content).toContain('ECS_SUBNETS=');
      expect(content).toContain('ECS_SECURITY_GROUPS=');
    });

    it('should contain all required DynamoDB configuration', () => {
      const content = readFileSync(envProductionPath, 'utf-8');
      
      // DynamoDB Configuration
      expect(content).toContain('DYNAMODB_REGION=us-east-1');
      expect(content).toContain('DYNAMODB_TABLE_SESSIONS=HuntazeOfSessions');
      expect(content).toContain('DYNAMODB_TABLE_THREADS=HuntazeOfThreads');
      expect(content).toContain('DYNAMODB_TABLE_MESSAGES=HuntazeOfMessages');
    });

    it('should contain security and monitoring configuration', () => {
      const content = readFileSync(envProductionPath, 'utf-8');
      
      // Security
      expect(content).toContain('KMS_KEY_ID=arn:aws:kms:us-east-1:317805897534:key/');
      expect(content).toContain('SECRETS_MANAGER_SECRET=of/creds/huntaze');
      
      // Monitoring
      expect(content).toContain('ENABLE_DETAILED_LOGS=true');
      expect(content).toContain('ENABLE_METRICS=true');
      expect(content).toContain('METRICS_INTERVAL=60000');
    });

    it('should contain feature flags configuration', () => {
      const content = readFileSync(envProductionPath, 'utf-8');
      
      // Feature Flags
      expect(content).toContain('PLAYWRIGHT_ENABLED_PERCENT=10');
      expect(content).toContain('NODE_ENV=production');
    });
  });

  describe('AWS Resource ARN Validation', () => {
    it('should have valid ECS cluster ARN format', () => {
      const content = readFileSync(envProductionPath, 'utf-8');
      const ecsClusterMatch = content.match(/ECS_CLUSTER_ARN=(.+)/);
      
      expect(ecsClusterMatch).toBeTruthy();
      const clusterArn = ecsClusterMatch![1];
      
      expect(clusterArn).toMatch(/^arn:aws:ecs:us-east-1:317805897534:cluster\/huntaze-of-fargate$/);
    });

    it('should have valid KMS key ARN format', () => {
      const content = readFileSync(envProductionPath, 'utf-8');
      const kmsKeyMatch = content.match(/KMS_KEY_ID=(.+)/);
      
      expect(kmsKeyMatch).toBeTruthy();
      const kmsKeyArn = kmsKeyMatch![1];
      
      expect(kmsKeyArn).toMatch(/^arn:aws:kms:us-east-1:317805897534:key\/[a-f0-9-]{36}$/);
    });

    it('should have consistent AWS region across all services', () => {
      const content = readFileSync(envProductionPath, 'utf-8');
      
      // Extract all regions
      const awsRegionMatch = content.match(/AWS_REGION=(.+)/);
      const dynamoRegionMatch = content.match(/DYNAMODB_REGION=(.+)/);
      const ecsArnMatch = content.match(/ECS_CLUSTER_ARN=arn:aws:ecs:([^:]+):/);
      const kmsArnMatch = content.match(/KMS_KEY_ID=arn:aws:kms:([^:]+):/);
      
      expect(awsRegionMatch![1]).toBe('us-east-1');
      expect(dynamoRegionMatch![1]).toBe('us-east-1');
      expect(ecsArnMatch![1]).toBe('us-east-1');
      expect(kmsArnMatch![1]).toBe('us-east-1');
    });

    it('should have consistent AWS account ID across all services', () => {
      const content = readFileSync(envProductionPath, 'utf-8');
      
      // Extract all account IDs
      const awsAccountMatch = content.match(/AWS_ACCOUNT_ID=(.+)/);
      const ecsArnMatch = content.match(/ECS_CLUSTER_ARN=arn:aws:ecs:[^:]+:([^:]+):/);
      const kmsArnMatch = content.match(/KMS_KEY_ID=arn:aws:kms:[^:]+:([^:]+):/);
      
      expect(awsAccountMatch![1]).toBe('317805897534');
      expect(ecsArnMatch![1]).toBe('317805897534');
      expect(kmsArnMatch![1]).toBe('317805897534');
    });
  });

  describe('DynamoDB Table Names Validation', () => {
    it('should have consistent table naming convention', () => {
      const content = readFileSync(envProductionPath, 'utf-8');
      
      const sessionsMatch = content.match(/DYNAMODB_TABLE_SESSIONS=(.+)/);
      const threadsMatch = content.match(/DYNAMODB_TABLE_THREADS=(.+)/);
      const messagesMatch = content.match(/DYNAMODB_TABLE_MESSAGES=(.+)/);
      
      expect(sessionsMatch![1]).toBe('HuntazeOfSessions');
      expect(threadsMatch![1]).toBe('HuntazeOfThreads');
      expect(messagesMatch![1]).toBe('HuntazeOfMessages');
      
      // All tables should start with 'HuntazeOf'
      expect(sessionsMatch![1]).toMatch(/^HuntazeOf/);
      expect(threadsMatch![1]).toMatch(/^HuntazeOf/);
      expect(messagesMatch![1]).toMatch(/^HuntazeOf/);
    });

    it('should have unique table names', () => {
      const content = readFileSync(envProductionPath, 'utf-8');
      
      const sessionsMatch = content.match(/DYNAMODB_TABLE_SESSIONS=(.+)/);
      const threadsMatch = content.match(/DYNAMODB_TABLE_THREADS=(.+)/);
      const messagesMatch = content.match(/DYNAMODB_TABLE_MESSAGES=(.+)/);
      
      const tableNames = [sessionsMatch![1], threadsMatch![1], messagesMatch![1]];
      const uniqueNames = new Set(tableNames);
      
      expect(uniqueNames.size).toBe(tableNames.length);
    });
  });

  describe('Feature Flags Validation', () => {
    it('should have valid Playwright enabled percentage', () => {
      const content = readFileSync(envProductionPath, 'utf-8');
      const playwrightMatch = content.match(/PLAYWRIGHT_ENABLED_PERCENT=(.+)/);
      
      expect(playwrightMatch).toBeTruthy();
      const percentage = parseInt(playwrightMatch![1]);
      
      expect(percentage).toBeGreaterThanOrEqual(0);
      expect(percentage).toBeLessThanOrEqual(100);
      expect(percentage).toBe(10); // Conservative rollout
    });

    it('should have production environment set correctly', () => {
      const content = readFileSync(envProductionPath, 'utf-8');
      
      expect(content).toContain('NODE_ENV=production');
    });

    it('should have monitoring enabled for production', () => {
      const content = readFileSync(envProductionPath, 'utf-8');
      
      expect(content).toContain('ENABLE_DETAILED_LOGS=true');
      expect(content).toContain('ENABLE_METRICS=true');
    });

    it('should have reasonable metrics interval', () => {
      const content = readFileSync(envProductionPath, 'utf-8');
      const metricsMatch = content.match(/METRICS_INTERVAL=(.+)/);
      
      expect(metricsMatch).toBeTruthy();
      const interval = parseInt(metricsMatch![1]);
      
      expect(interval).toBeGreaterThanOrEqual(30000); // At least 30 seconds
      expect(interval).toBeLessThanOrEqual(300000); // At most 5 minutes
      expect(interval).toBe(60000); // 1 minute
    });
  });

  describe('Security Configuration Validation', () => {
    it('should have secrets manager configuration', () => {
      const content = readFileSync(envProductionPath, 'utf-8');
      
      expect(content).toContain('SECRETS_MANAGER_SECRET=of/creds/huntaze');
    });

    it('should not contain any hardcoded credentials', () => {
      const content = readFileSync(envProductionPath, 'utf-8');
      
      // Should not contain common credential patterns
      expect(content).not.toMatch(/password\s*=/i);
      expect(content).not.toMatch(/secret\s*=\s*[^\/]/i); // Except for secret paths
      expect(content).not.toMatch(/key\s*=\s*[A-Za-z0-9]{20,}/); // Except for ARNs
      expect(content).not.toMatch(/token\s*=/i);
    });

    it('should use placeholder values for sensitive network configuration', () => {
      const content = readFileSync(envProductionPath, 'utf-8');
      
      // Subnets and security groups should be placeholders in template
      expect(content).toContain('ECS_SUBNETS=subnet-xxxxx,subnet-yyyyy');
      expect(content).toContain('ECS_SECURITY_GROUPS=sg-xxxxx');
    });
  });

  describe('Environment Loading Simulation', () => {
    it('should load all configuration values correctly', () => {
      const content = readFileSync(envProductionPath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
      
      // Simulate loading environment variables
      const envVars: Record<string, string> = {};
      lines.forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          envVars[key] = value;
        }
      });
      
      // Verify all expected variables are loaded
      expect(envVars.AWS_REGION).toBe('us-east-1');
      expect(envVars.AWS_ACCOUNT_ID).toBe('317805897534');
      expect(envVars.ECS_CLUSTER_ARN).toContain('huntaze-of-fargate');
      expect(envVars.DYNAMODB_TABLE_MESSAGES).toBe('HuntazeOfMessages');
      expect(envVars.PLAYWRIGHT_ENABLED_PERCENT).toBe('10');
      expect(envVars.NODE_ENV).toBe('production');
    });

    it('should have all required variables for browser worker client', () => {
      const content = readFileSync(envProductionPath, 'utf-8');
      
      // Variables needed by BrowserWorkerClient
      expect(content).toContain('AWS_REGION=');
      expect(content).toContain('ECS_CLUSTER_ARN=');
      expect(content).toContain('ECS_TASK_DEFINITION=');
      expect(content).toContain('ECS_SUBNETS=');
      expect(content).toContain('ECS_SECURITY_GROUPS=');
      expect(content).toContain('DYNAMODB_TABLE_MESSAGES=');
    });

    it('should have all required variables for monitoring', () => {
      const content = readFileSync(envProductionPath, 'utf-8');
      
      // Variables needed for CloudWatch monitoring
      expect(content).toContain('ENABLE_METRICS=');
      expect(content).toContain('METRICS_INTERVAL=');
      expect(content).toContain('ENABLE_DETAILED_LOGS=');
    });
  });

  describe('Configuration Consistency with Infrastructure', () => {
    it('should match CDK stack naming convention', () => {
      const content = readFileSync(envProductionPath, 'utf-8');
      
      // Task definition should match CDK naming
      expect(content).toContain('ECS_TASK_DEFINITION=HuntazeOfStackBrowserWorkerTask:1');
      
      // Cluster name should match CDK naming
      expect(content).toContain('cluster/huntaze-of-fargate');
      
      // DynamoDB tables should match CDK naming
      expect(content).toContain('HuntazeOfSessions');
      expect(content).toContain('HuntazeOfThreads');
      expect(content).toContain('HuntazeOfMessages');
    });

    it('should use correct AWS region for all services', () => {
      const content = readFileSync(envProductionPath, 'utf-8');
      
      // All AWS services should be in us-east-1
      expect(content).toMatch(/AWS_REGION=us-east-1/);
      expect(content).toMatch(/DYNAMODB_REGION=us-east-1/);
      expect(content).toMatch(/arn:aws:ecs:us-east-1:/);
      expect(content).toMatch(/arn:aws:kms:us-east-1:/);
    });

    it('should use correct AWS account ID for all services', () => {
      const content = readFileSync(envProductionPath, 'utf-8');
      
      // All AWS services should use the same account ID
      expect(content).toMatch(/AWS_ACCOUNT_ID=317805897534/);
      expect(content).toMatch(/arn:aws:ecs:us-east-1:317805897534:/);
      expect(content).toMatch(/arn:aws:kms:us-east-1:317805897534:/);
    });
  });

  describe('Production Readiness Validation', () => {
    it('should have conservative feature flag settings', () => {
      const content = readFileSync(envProductionPath, 'utf-8');
      
      // Playwright should be enabled for only 10% of requests (beta rollout)
      expect(content).toContain('PLAYWRIGHT_ENABLED_PERCENT=10');
    });

    it('should have monitoring enabled', () => {
      const content = readFileSync(envProductionPath, 'utf-8');
      
      expect(content).toContain('ENABLE_DETAILED_LOGS=true');
      expect(content).toContain('ENABLE_METRICS=true');
    });

    it('should have production environment set', () => {
      const content = readFileSync(envProductionPath, 'utf-8');
      
      expect(content).toContain('NODE_ENV=production');
    });

    it('should not have debug or development flags', () => {
      const content = readFileSync(envProductionPath, 'utf-8');
      
      expect(content).not.toContain('DEBUG=');
      expect(content).not.toContain('NODE_ENV=development');
      expect(content).not.toContain('PLAYWRIGHT_ENABLED_PERCENT=100');
    });
  });

  describe('File Format Validation', () => {
    it('should have proper environment file format', () => {
      const content = readFileSync(envProductionPath, 'utf-8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        if (line.trim() === '') return; // Skip empty lines
        
        if (line.startsWith('#')) {
          // Comment line - should be properly formatted
          expect(line).toMatch(/^#\s+/);
        } else {
          // Environment variable line - should have KEY=VALUE format
          expect(line).toMatch(/^[A-Z_]+=.+$/);
        }
      });
    });

    it('should have organized sections with comments', () => {
      const content = readFileSync(envProductionPath, 'utf-8');
      
      // Should have section headers
      expect(content).toContain('# AWS Configuration');
      expect(content).toContain('# ECS Configuration');
      expect(content).toContain('# DynamoDB Configuration');
      expect(content).toContain('# KMS Configuration');
      expect(content).toContain('# Secrets Manager');
      expect(content).toContain('# Feature Flags');
      expect(content).toContain('# Monitoring');
    });

    it('should not have trailing whitespace or inconsistent line endings', () => {
      const content = readFileSync(envProductionPath, 'utf-8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        if (index < lines.length - 1) { // Skip last line
          expect(line).not.toMatch(/\s+$/); // No trailing whitespace
        }
      });
    });
  });
});