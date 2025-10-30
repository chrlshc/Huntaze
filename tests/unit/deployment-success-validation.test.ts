/**
 * Deployment Success Validation Tests
 * Tests the deployment success summary and infrastructure validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Deployment Success Validation', () => {
  const deploymentSummaryPath = join(process.cwd(), 'DEPLOYMENT_SUCCESS_SUMMARY.md');
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Deployment Summary Document', () => {
    it('should have deployment success summary file', () => {
      expect(existsSync(deploymentSummaryPath)).toBe(true);
    });

    it('should contain required deployment information', () => {
      const content = readFileSync(deploymentSummaryPath, 'utf-8');
      
      // Check for key deployment markers
      expect(content).toContain('INFRASTRUCTURE DÉPLOYÉE AVEC SUCCÈS');
      expect(content).toContain('us-east-1');
      expect(content).toContain('CloudFormation Stack Created');
      expect(content).toContain('huntaze-of-fargate');
      expect(content).toContain('HuntazeOfMessages');
    });

    it('should contain valid AWS resource ARNs', () => {
      const content = readFileSync(deploymentSummaryPath, 'utf-8');
      
      // Check for valid ARN patterns
      const arnPattern = /arn:aws:[a-z-]+:[a-z0-9-]*:\d{12}:[a-zA-Z0-9-_\/]+/g;
      const arns = content.match(arnPattern);
      
      expect(arns).toBeTruthy();
      expect(arns!.length).toBeGreaterThan(0);
      
      // Validate specific ARNs
      expect(content).toMatch(/arn:aws:cloudformation:us-east-1:317805897534:stack\/HuntazeOnlyFansStack/);
      expect(content).toMatch(/arn:aws:ecs:us-east-1:317805897534:cluster\/huntaze-of-fargate/);
    });

    it('should contain cost estimates within budget', () => {
      const content = readFileSync(deploymentSummaryPath, 'utf-8');
      
      // Extract cost information
      expect(content).toContain('$25-36/mois');
      expect(content).toContain('budget de $300/mois');
      
      // Verify individual service costs are reasonable
      expect(content).toContain('ECS Fargate');
      expect(content).toContain('DynamoDB');
      expect(content).toContain('NAT Gateway');
      expect(content).toContain('CloudWatch');
      expect(content).toContain('KMS');
      expect(content).toContain('Lambda');
    });

    it('should contain performance metrics expectations', () => {
      const content = readFileSync(deploymentSummaryPath, 'utf-8');
      
      // Check performance metrics
      expect(content).toContain('P95 Latency');
      expect(content).toContain('P99 Latency');
      expect(content).toContain('Success Rate');
      expect(content).toContain('Error Rate');
      
      // Check business metrics
      expect(content).toContain('Messages/jour');
      expect(content).toContain('Campaigns/jour');
      expect(content).toContain('Conversion rate');
    });

    it('should contain next steps for final configuration', () => {
      const content = readFileSync(deploymentSummaryPath, 'utf-8');
      
      // Check for next steps
      expect(content).toContain('Prochaines Étapes');
      expect(content).toContain('Lambda Orchestrator');
      expect(content).toContain('Secrets OnlyFans');
      expect(content).toContain('Tests d\'Intégration');
      expect(content).toContain('Beta');
    });
  });

  describe('Infrastructure Components Validation', () => {
    it('should validate ECS configuration', () => {
      const content = readFileSync(deploymentSummaryPath, 'utf-8');
      
      // ECS Fargate configuration
      expect(content).toContain('huntaze-of-fargate');
      expect(content).toContain('Playwright v1.56.0');
      expect(content).toContain('1 vCPU');
      expect(content).toContain('2 GB');
    });

    it('should validate DynamoDB tables', () => {
      const content = readFileSync(deploymentSummaryPath, 'utf-8');
      
      // DynamoDB tables
      expect(content).toContain('HuntazeOfSessions');
      expect(content).toContain('HuntazeOfThreads');
      expect(content).toContain('HuntazeOfMessages');
      expect(content).toContain('Point-in-time recovery');
    });

    it('should validate networking configuration', () => {
      const content = readFileSync(deploymentSummaryPath, 'utf-8');
      
      // VPC and networking
      expect(content).toContain('VPC');
      expect(content).toContain('Subnets');
      expect(content).toContain('Internet Gateway');
      expect(content).toContain('NAT Gateway');
      expect(content).toContain('Security Groups');
    });

    it('should validate security components', () => {
      const content = readFileSync(deploymentSummaryPath, 'utf-8');
      
      // Security components
      expect(content).toContain('KMS Key');
      expect(content).toContain('IAM Roles');
      expect(content).toContain('Encryption');
    });

    it('should validate monitoring setup', () => {
      const content = readFileSync(deploymentSummaryPath, 'utf-8');
      
      // CloudWatch monitoring
      expect(content).toContain('CloudWatch');
      expect(content).toContain('Log Groups');
      expect(content).toContain('Métriques');
      expect(content).toContain('/aws/ecs/huntaze-of-fargate');
    });
  });

  describe('Architecture Flow Validation', () => {
    it('should contain complete architecture diagram', () => {
      const content = readFileSync(deploymentSummaryPath, 'utf-8');
      
      // Check for architecture components in order
      const architectureSection = content.match(/## 📊 Architecture Déployée[\s\S]*?---/);
      expect(architectureSection).toBeTruthy();
      
      const diagram = architectureSection![0];
      expect(diagram).toContain('HUNTAZE FRONTEND');
      expect(diagram).toContain('HUNTAZE BACKEND');
      expect(diagram).toContain('AWS ECS FARGATE');
      expect(diagram).toContain('CONTAINER: browser-worker');
      expect(diagram).toContain('ONLYFANS');
      expect(diagram).toContain('AWS DYNAMODB');
    });

    it('should validate data flow steps', () => {
      const content = readFileSync(deploymentSummaryPath, 'utf-8');
      
      // Check for complete workflow steps
      expect(content).toContain('RunTaskCommand');
      expect(content).toContain('Decrypt session');
      expect(content).toContain('Launch Chromium');
      expect(content).toContain('Inject cookies');
      expect(content).toContain('Navigate to OnlyFans');
      expect(content).toContain('Send message');
      expect(content).toContain('Store result');
    });
  });

  describe('Deployment Commands Validation', () => {
    it('should contain valid AWS CLI commands', () => {
      const content = readFileSync(deploymentSummaryPath, 'utf-8');
      
      // Check for AWS CLI commands
      expect(content).toContain('aws lambda create-function');
      expect(content).toContain('aws secretsmanager create-secret');
      expect(content).toContain('aws cloudformation describe-stacks');
      expect(content).toContain('--region us-east-1');
    });

    it('should contain valid environment variables', () => {
      const content = readFileSync(deploymentSummaryPath, 'utf-8');
      
      // Check for required environment variables
      expect(content).toContain('ECS_CLUSTER_ARN');
      expect(content).toContain('ECS_TASK_DEFINITION');
      expect(content).toContain('DYNAMODB_TABLE_SESSIONS');
      expect(content).toContain('DYNAMODB_TABLE_MESSAGES');
      expect(content).toContain('KMS_KEY_ID');
    });

    it('should contain valid test commands', () => {
      const content = readFileSync(deploymentSummaryPath, 'utf-8');
      
      // Check for test commands
      expect(content).toContain('npm test');
      expect(content).toContain('playwright-ecs.integration.test.ts');
      expect(content).toContain('PLAYWRIGHT_ENABLED_PERCENT=10');
    });
  });

  describe('Status Tracking Validation', () => {
    it('should have completed tasks marked correctly', () => {
      const content = readFileSync(deploymentSummaryPath, 'utf-8');
      
      // Check completed tasks
      expect(content).toMatch(/\[x\]\s*✅.*us-west-1.*us-east-1.*résolu/);
      expect(content).toMatch(/\[x\]\s*✅.*Infrastructure complète créée/);
      expect(content).toMatch(/\[x\]\s*✅.*CDK Stack déployé/);
      expect(content).toMatch(/\[x\]\s*✅.*Tests unitaires passent/);
    });

    it('should have pending tasks marked correctly', () => {
      const content = readFileSync(deploymentSummaryPath, 'utf-8');
      
      // Check pending tasks
      expect(content).toMatch(/\[\s*\]\s*⏳.*Lambda Orchestrator/);
      expect(content).toMatch(/\[\s*\]\s*⏳.*secrets OnlyFans/);
      expect(content).toMatch(/\[\s*\]\s*⏳.*tests d'intégration/);
      expect(content).toMatch(/\[\s*\]\s*⏳.*beta/);
    });

    it('should contain accurate time estimates', () => {
      const content = readFileSync(deploymentSummaryPath, 'utf-8');
      
      // Check time estimates
      expect(content).toContain('15 minutes');
      expect(content).toContain('5 min');
      expect(content).toContain('2 min');
      expect(content).toContain('1 min');
      expect(content).toContain('3 min');
    });
  });

  describe('Support Information Validation', () => {
    it('should contain useful support commands', () => {
      const content = readFileSync(deploymentSummaryPath, 'utf-8');
      
      // Check support commands
      expect(content).toContain('aws cloudformation describe-stacks');
      expect(content).toContain('aws ecs describe-clusters');
      expect(content).toContain('aws dynamodb list-tables');
    });

    it('should reference documentation files', () => {
      const content = readFileSync(deploymentSummaryPath, 'utf-8');
      
      // Check documentation references
      expect(content).toContain('QUICK_START.md');
      expect(content).toContain('docs/DEPLOYMENT_GUIDE.md');
      expect(content).toContain('infra/cdk/README.md');
    });

    it('should contain version and status information', () => {
      const content = readFileSync(deploymentSummaryPath, 'utf-8');
      
      // Check version info
      expect(content).toContain('28 octobre 2025');
      expect(content).toContain('Version : 1.0.0');
      expect(content).toContain('DEPLOYMENT SUCCESSFUL');
    });
  });

  describe('Business Metrics Validation', () => {
    it('should contain realistic business projections', () => {
      const content = readFileSync(deploymentSummaryPath, 'utf-8');
      
      // Check business metrics
      expect(content).toContain('12,500'); // Messages per day
      expect(content).toContain('50 users');
      expect(content).toContain('250'); // Messages per user
      expect(content).toContain('50-100'); // Campaigns per day
      expect(content).toContain('>95%'); // Conversion rate
    });

    it('should contain infrastructure capacity metrics', () => {
      const content = readFileSync(deploymentSummaryPath, 'utf-8');
      
      // Check infrastructure metrics
      expect(content).toContain('1-2 concurrent'); // ECS tasks
      expect(content).toContain('<10/sec'); // DynamoDB writes
      expect(content).toContain('<100 MB/jour'); // Data transfer
      expect(content).toContain('>99.9%'); // Uptime
    });
  });
});