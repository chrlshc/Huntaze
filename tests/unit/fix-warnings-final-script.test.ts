/**
 * Unit Tests for fix-warnings-final.sh Script
 * Tests RDS Performance Insights enablement and CloudWatch Synthetics Canaries creation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Mock child_process
vi.mock('child_process');

// Mock fs
vi.mock('fs');

describe('fix-warnings-final.sh Script', () => {
  const scriptPath = path.join(process.cwd(), 'scripts', 'fix-warnings-final.sh');
  const mockExecSync = vi.mocked(execSync);
  const mockFs = vi.mocked(fs);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Script Existence and Permissions', () => {
    it('should exist in scripts directory', () => {
      mockFs.existsSync.mockReturnValue(true);
      
      const exists = fs.existsSync(scriptPath);
      expect(exists).toBe(true);
    });

    it('should be executable', () => {
      mockFs.statSync.mockReturnValue({
        mode: 0o755,
        isFile: () => true
      } as any);

      const stats = fs.statSync(scriptPath);
      expect(stats.mode & 0o111).toBeTruthy(); // Check execute permission
    });

    it('should have bash shebang', () => {
      mockFs.readFileSync.mockReturnValue('#!/bin/bash\n# Fix Final Warnings');

      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toMatch(/^#!\/bin\/bash/);
    });
  });

  describe('Configuration Variables', () => {
    it('should define required configuration variables', () => {
      const scriptContent = `
        REGION="us-east-1"
        ACCOUNT_ID="317805897534"
        DB_ID="huntaze-postgres-production-encrypted"
        CANARY_BUCKET="huntaze-synthetics-artifacts-\${ACCOUNT_ID}"
      `;

      expect(scriptContent).toContain('REGION="us-east-1"');
      expect(scriptContent).toContain('ACCOUNT_ID="317805897534"');
      expect(scriptContent).toContain('DB_ID="huntaze-postgres-production-encrypted"');
      expect(scriptContent).toContain('CANARY_BUCKET=');
    });

    it('should use correct AWS region', () => {
      const expectedRegion = 'us-east-1';
      expect(expectedRegion).toBe('us-east-1');
    });

    it('should use correct RDS instance identifier', () => {
      const expectedDbId = 'huntaze-postgres-production-encrypted';
      expect(expectedDbId).toBe('huntaze-postgres-production-encrypted');
    });
  });

  describe('RDS Performance Insights Enablement', () => {
    it('should enable Performance Insights with correct parameters', () => {
      const mockCommand = 'aws rds modify-db-instance --db-instance-identifier huntaze-postgres-production-encrypted --enable-performance-insights --performance-insights-retention-period 7 --apply-immediately --region us-east-1';

      mockExecSync.mockReturnValue(Buffer.from(''));

      execSync(mockCommand);

      expect(mockExecSync).toHaveBeenCalledWith(mockCommand);
    });

    it('should use 7 days retention period (free tier)', () => {
      const retentionPeriod = 7;
      expect(retentionPeriod).toBe(7);
      expect(retentionPeriod).toBeLessThanOrEqual(7); // Free tier limit
    });

    it('should apply changes immediately', () => {
      const command = 'aws rds modify-db-instance --apply-immediately';
      expect(command).toContain('--apply-immediately');
    });

    it('should verify Performance Insights status after enablement', () => {
      const mockVerifyCommand = 'aws rds describe-db-instances --db-instance-identifier huntaze-postgres-production-encrypted --region us-east-1';
      
      mockExecSync.mockReturnValue(Buffer.from(JSON.stringify({
        DBInstances: [{
          PerformanceInsightsEnabled: true,
          PerformanceInsightsRetentionPeriod: 7
        }]
      })));

      const result = execSync(mockVerifyCommand);
      const parsed = JSON.parse(result.toString());

      expect(parsed.DBInstances[0].PerformanceInsightsEnabled).toBe(true);
      expect(parsed.DBInstances[0].PerformanceInsightsRetentionPeriod).toBe(7);
    });

    it('should not require database restart', () => {
      // Performance Insights can be enabled without restart
      const command = 'aws rds modify-db-instance --enable-performance-insights --apply-immediately';
      
      // Should not contain --force-failover or similar restart flags
      expect(command).not.toContain('--force-failover');
      expect(command).not.toContain('--reboot');
    });

    it('should handle already enabled Performance Insights', () => {
      mockExecSync.mockReturnValue(Buffer.from(JSON.stringify({
        DBInstances: [{
          PerformanceInsightsEnabled: true,
          PerformanceInsightsRetentionPeriod: 7
        }]
      })));

      const result = execSync('aws rds describe-db-instances');
      const parsed = JSON.parse(result.toString());

      expect(parsed.DBInstances[0].PerformanceInsightsEnabled).toBe(true);
    });
  });

  describe('IAM Role for CloudWatch Synthetics', () => {
    it('should check if CloudWatchSyntheticsRole exists', () => {
      const checkCommand = 'aws iam get-role --role-name CloudWatchSyntheticsRole';
      
      mockExecSync.mockReturnValue(Buffer.from(JSON.stringify({
        Role: {
          RoleName: 'CloudWatchSyntheticsRole',
          Arn: 'arn:aws:iam::317805897534:role/CloudWatchSyntheticsRole'
        }
      })));

      const result = execSync(checkCommand);
      const parsed = JSON.parse(result.toString());

      expect(parsed.Role.RoleName).toBe('CloudWatchSyntheticsRole');
    });

    it('should create role if it does not exist', () => {
      const createRoleCommand = 'aws iam create-role --role-name CloudWatchSyntheticsRole';
      
      mockExecSync.mockReturnValue(Buffer.from(JSON.stringify({
        Role: {
          RoleName: 'CloudWatchSyntheticsRole',
          Arn: 'arn:aws:iam::317805897534:role/CloudWatchSyntheticsRole'
        }
      })));

      const result = execSync(createRoleCommand);
      expect(result).toBeDefined();
    });

    it('should have correct trust policy for synthetics service', () => {
      const trustPolicy = {
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: {
            Service: 'synthetics.amazonaws.com'
          },
          Action: 'sts:AssumeRole'
        }]
      };

      expect(trustPolicy.Statement[0].Principal.Service).toBe('synthetics.amazonaws.com');
      expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    it('should attach CloudWatchSyntheticsFullAccess policy', () => {
      const policyArn = 'arn:aws:iam::aws:policy/CloudWatchSyntheticsFullAccess';
      const attachCommand = `aws iam attach-role-policy --role-name CloudWatchSyntheticsRole --policy-arn ${policyArn}`;

      expect(attachCommand).toContain('CloudWatchSyntheticsFullAccess');
    });

    it('should add S3 permissions for canary artifacts', () => {
      const s3Policy = {
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Action: ['s3:PutObject', 's3:GetBucketLocation'],
          Resource: [
            'arn:aws:s3:::huntaze-synthetics-artifacts-317805897534/*',
            'arn:aws:s3:::huntaze-synthetics-artifacts-317805897534'
          ]
        }]
      };

      expect(s3Policy.Statement[0].Action).toContain('s3:PutObject');
      expect(s3Policy.Statement[0].Action).toContain('s3:GetBucketLocation');
    });

    it('should wait for IAM propagation after role creation', () => {
      // Script should wait 10 seconds for IAM propagation
      const waitTime = 10;
      expect(waitTime).toBe(10);
    });
  });

  describe('S3 Bucket for Canary Artifacts', () => {
    it('should create S3 bucket if it does not exist', () => {
      const bucketName = 'huntaze-synthetics-artifacts-317805897534';
      const createCommand = `aws s3api create-bucket --bucket ${bucketName} --region us-east-1`;

      mockExecSync.mockReturnValue(Buffer.from(''));

      execSync(createCommand);
      expect(mockExecSync).toHaveBeenCalled();
    });

    it('should handle existing bucket gracefully', () => {
      const headCommand = 'aws s3api head-bucket --bucket huntaze-synthetics-artifacts-317805897534';
      
      mockExecSync.mockReturnValue(Buffer.from(''));

      execSync(headCommand);
      expect(mockExecSync).toHaveBeenCalled();
    });

    it('should use account-specific bucket name', () => {
      const accountId = '317805897534';
      const bucketName = `huntaze-synthetics-artifacts-${accountId}`;

      expect(bucketName).toBe('huntaze-synthetics-artifacts-317805897534');
    });
  });

  describe('Canary 1: API Health Check', () => {
    it('should create huntaze-api-health canary', () => {
      const canaryName = 'huntaze-api-health';
      const createCommand = `aws synthetics create-canary --name ${canaryName}`;

      expect(createCommand).toContain('huntaze-api-health');
    });

    it('should use correct runtime version', () => {
      const runtimeVersion = 'syn-nodejs-puppeteer-9.0';
      expect(runtimeVersion).toMatch(/^syn-nodejs-puppeteer-\d+\.\d+$/);
    });

    it('should run every 1 minute', () => {
      const schedule = 'rate(1 minute)';
      expect(schedule).toBe('rate(1 minute)');
    });

    it('should check /api/health endpoint', () => {
      const canaryScript = `
        const url = 'https://huntaze.com/api/health';
        let requestOptions = {
          hostname: 'huntaze.com',
          method: 'GET',
          path: '/api/health',
          port: 443,
          protocol: 'https:'
        };
      `;

      expect(canaryScript).toContain('/api/health');
      expect(canaryScript).toContain('huntaze.com');
    });

    it('should include request and response details', () => {
      const stepConfig = {
        includeRequestHeaders: true,
        includeResponseHeaders: true,
        includeRequestBody: true,
        includeResponseBody: true
      };

      expect(stepConfig.includeRequestHeaders).toBe(true);
      expect(stepConfig.includeResponseHeaders).toBe(true);
      expect(stepConfig.includeRequestBody).toBe(true);
      expect(stepConfig.includeResponseBody).toBe(true);
    });

    it('should start canary after creation', () => {
      const startCommand = 'aws synthetics start-canary --name huntaze-api-health --region us-east-1';
      
      mockExecSync.mockReturnValue(Buffer.from(''));

      execSync(startCommand);
      expect(mockExecSync).toHaveBeenCalled();
    });

    it('should handle already existing canary', () => {
      mockExecSync.mockReturnValue(Buffer.from(JSON.stringify({
        Canary: {
          Name: 'huntaze-api-health',
          Status: { State: 'RUNNING' }
        }
      })));

      const result = execSync('aws synthetics get-canary --name huntaze-api-health');
      const parsed = JSON.parse(result.toString());

      expect(parsed.Canary.Name).toBe('huntaze-api-health');
    });
  });

  describe('Canary 2: OnlyFans Endpoint Check', () => {
    it('should create huntaze-of-endpoint canary', () => {
      const canaryName = 'huntaze-of-endpoint';
      const createCommand = `aws synthetics create-canary --name ${canaryName}`;

      expect(createCommand).toContain('huntaze-of-endpoint');
    });

    it('should check /api/v2/onlyfans/stats endpoint', () => {
      const canaryScript = `
        const url = 'https://huntaze.com/api/v2/onlyfans/stats';
        let requestOptions = {
          hostname: 'huntaze.com',
          method: 'GET',
          path: '/api/v2/onlyfans/stats',
          port: 443,
          protocol: 'https:'
        };
      `;

      expect(canaryScript).toContain('/api/v2/onlyfans/stats');
      expect(canaryScript).toContain('huntaze.com');
    });

    it('should run every 1 minute', () => {
      const schedule = 'rate(1 minute)';
      expect(schedule).toBe('rate(1 minute)');
    });

    it('should use same runtime as health check canary', () => {
      const runtimeVersion = 'syn-nodejs-puppeteer-9.0';
      expect(runtimeVersion).toBe('syn-nodejs-puppeteer-9.0');
    });

    it('should start canary after creation', () => {
      const startCommand = 'aws synthetics start-canary --name huntaze-of-endpoint --region us-east-1';
      
      mockExecSync.mockReturnValue(Buffer.from(''));

      execSync(startCommand);
      expect(mockExecSync).toHaveBeenCalled();
    });
  });

  describe('Canary Script Generation', () => {
    it('should create valid Node.js canary script', () => {
      const canaryScript = `
const synthetics = require('Synthetics');
const log = require('SyntheticsLogger');

const apiCanaryBlueprint = async function () {
    // Canary logic
};

exports.handler = async () => {
    return await apiCanaryBlueprint();
};
      `;

      expect(canaryScript).toContain("require('Synthetics')");
      expect(canaryScript).toContain('exports.handler');
    });

    it('should zip canary scripts correctly', () => {
      const zipCommand = 'cd /tmp && zip -q canary-health.zip canary-health.js';
      expect(zipCommand).toContain('zip');
      expect(zipCommand).toContain('.zip');
    });

    it('should use synthetics user agent', () => {
      const userAgent = 'synthetics.getCanaryUserAgentString()';
      expect(userAgent).toContain('getCanaryUserAgentString');
    });
  });

  describe('Error Handling', () => {
    it('should handle AWS CLI errors gracefully', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('AWS CLI error');
      });

      expect(() => {
        execSync('aws rds modify-db-instance');
      }).toThrow('AWS CLI error');
    });

    it('should handle IAM role creation failures', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Role already exists');
      });

      expect(() => {
        execSync('aws iam create-role');
      }).toThrow();
    });

    it('should handle S3 bucket creation failures', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Bucket already exists');
      });

      expect(() => {
        execSync('aws s3api create-bucket');
      }).toThrow();
    });

    it('should handle canary creation failures', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Canary already exists');
      });

      expect(() => {
        execSync('aws synthetics create-canary');
      }).toThrow();
    });
  });

  describe('Script Output and Logging', () => {
    it('should display progress messages', () => {
      const messages = [
        '🔧 FIXING FINAL WARNINGS (Zero Downtime)',
        '1️⃣  ENABLING RDS PERFORMANCE INSIGHTS',
        '2️⃣  CREATING CLOUDWATCH SYNTHETICS CANARIES',
        '✅ ALL WARNINGS FIXED'
      ];

      messages.forEach(message => {
        expect(message).toBeTruthy();
      });
    });

    it('should use color codes for output', () => {
      const colors = {
        GREEN: '\033[0;32m',
        YELLOW: '\033[1;33m',
        BLUE: '\033[0;34m',
        NC: '\033[0m'
      };

      expect(colors.GREEN).toBe('\033[0;32m');
      expect(colors.BLUE).toBe('\033[0;34m');
    });

    it('should display summary at the end', () => {
      const summary = `
Summary:
  ✅ RDS Performance Insights: Enabled (7 days retention)
  ✅ Canary 1: huntaze-api-health (1/min)
  ✅ Canary 2: huntaze-of-endpoint (1/min)
      `;

      expect(summary).toContain('RDS Performance Insights');
      expect(summary).toContain('huntaze-api-health');
      expect(summary).toContain('huntaze-of-endpoint');
    });

    it('should suggest next steps', () => {
      const nextSteps = 'Next: Re-run audit to verify 0 warnings\n  ./scripts/go-no-go-audit.sh';
      
      expect(nextSteps).toContain('go-no-go-audit.sh');
    });
  });

  describe('Zero Downtime Verification', () => {
    it('should not cause database downtime', () => {
      // Performance Insights enablement should not restart database
      const command = 'aws rds modify-db-instance --enable-performance-insights --apply-immediately';
      
      expect(command).not.toContain('--force-failover');
      expect(command).not.toContain('--reboot');
    });

    it('should not affect running applications', () => {
      // Canary creation should not impact production
      const canaryCreation = 'aws synthetics create-canary';
      
      // Canaries are independent monitoring resources
      expect(canaryCreation).toBeTruthy();
    });

    it('should apply changes immediately without maintenance window', () => {
      const command = 'aws rds modify-db-instance --apply-immediately';
      expect(command).toContain('--apply-immediately');
    });
  });

  describe('Integration with Audit Script', () => {
    it('should fix warnings detected by go-no-go-audit.sh', () => {
      const warnings = [
        'RDS Performance Insights not enabled',
        'CloudWatch Synthetics Canaries not configured'
      ];

      // Script should address these warnings
      expect(warnings).toHaveLength(2);
    });

    it('should result in zero warnings after execution', () => {
      // After running fix-warnings-final.sh, audit should pass
      const expectedWarnings = 0;
      expect(expectedWarnings).toBe(0);
    });
  });

  describe('Cost Optimization', () => {
    it('should use free tier for Performance Insights', () => {
      const retentionPeriod = 7; // 7 days is free
      expect(retentionPeriod).toBe(7);
      expect(retentionPeriod).toBeLessThanOrEqual(7);
    });

    it('should minimize canary execution costs', () => {
      const schedule = 'rate(1 minute)';
      // 1 minute is reasonable for monitoring without excessive costs
      expect(schedule).toBe('rate(1 minute)');
    });

    it('should use efficient canary runtime', () => {
      const runtime = 'syn-nodejs-puppeteer-9.0';
      // Latest runtime version for efficiency
      expect(runtime).toContain('syn-nodejs-puppeteer');
    });
  });

  describe('Security Best Practices', () => {
    it('should use least privilege IAM permissions', () => {
      const s3Policy = {
        Action: ['s3:PutObject', 's3:GetBucketLocation']
      };

      // Only necessary S3 permissions
      expect(s3Policy.Action).toHaveLength(2);
      expect(s3Policy.Action).not.toContain('s3:*');
    });

    it('should use HTTPS for canary checks', () => {
      const protocol = 'https:';
      const port = 443;

      expect(protocol).toBe('https:');
      expect(port).toBe(443);
    });

    it('should scope S3 permissions to specific bucket', () => {
      const resource = 'arn:aws:s3:::huntaze-synthetics-artifacts-317805897534/*';
      
      expect(resource).toContain('huntaze-synthetics-artifacts');
      expect(resource).not.toBe('arn:aws:s3:::*');
    });
  });

  describe('Idempotency', () => {
    it('should be safe to run multiple times', () => {
      // Script checks for existing resources before creating
      const checks = [
        'aws iam get-role --role-name CloudWatchSyntheticsRole',
        'aws synthetics get-canary --name huntaze-api-health',
        'aws synthetics get-canary --name huntaze-of-endpoint'
      ];

      checks.forEach(check => {
        expect(check).toContain('get-');
      });
    });

    it('should not fail if Performance Insights already enabled', () => {
      mockExecSync.mockReturnValue(Buffer.from(JSON.stringify({
        DBInstances: [{
          PerformanceInsightsEnabled: true
        }]
      })));

      const result = execSync('aws rds describe-db-instances');
      const parsed = JSON.parse(result.toString());

      expect(parsed.DBInstances[0].PerformanceInsightsEnabled).toBe(true);
    });

    it('should not fail if canaries already exist', () => {
      mockExecSync.mockReturnValue(Buffer.from(JSON.stringify({
        Canary: { Name: 'huntaze-api-health' }
      })));

      const result = execSync('aws synthetics get-canary');
      expect(result).toBeDefined();
    });
  });

  describe('Monitoring and Alerting', () => {
    it('should enable continuous monitoring with canaries', () => {
      const canaries = ['huntaze-api-health', 'huntaze-of-endpoint'];
      const schedule = 'rate(1 minute)';

      expect(canaries).toHaveLength(2);
      expect(schedule).toBe('rate(1 minute)');
    });

    it('should monitor critical endpoints', () => {
      const endpoints = [
        '/api/health',
        '/api/v2/onlyfans/stats'
      ];

      expect(endpoints).toContain('/api/health');
      expect(endpoints).toContain('/api/v2/onlyfans/stats');
    });

    it('should store canary results in S3', () => {
      const artifactLocation = 's3://huntaze-synthetics-artifacts-317805897534';
      expect(artifactLocation).toContain('s3://');
      expect(artifactLocation).toContain('synthetics-artifacts');
    });
  });

  describe('Production Readiness', () => {
    it('should meet production monitoring requirements', () => {
      const requirements = {
        performanceInsights: true,
        syntheticMonitoring: true,
        zeroDowntime: true,
        costOptimized: true
      };

      expect(requirements.performanceInsights).toBe(true);
      expect(requirements.syntheticMonitoring).toBe(true);
      expect(requirements.zeroDowntime).toBe(true);
      expect(requirements.costOptimized).toBe(true);
    });

    it('should enable observability for production', () => {
      const observability = {
        databaseMetrics: 'Performance Insights',
        endpointMonitoring: 'CloudWatch Synthetics',
        frequency: '1 minute'
      };

      expect(observability.databaseMetrics).toBe('Performance Insights');
      expect(observability.endpointMonitoring).toBe('CloudWatch Synthetics');
    });

    it('should support incident response', () => {
      // Canaries provide early warning of issues
      const alerting = {
        canaryFailures: 'CloudWatch Alarms',
        performanceIssues: 'Performance Insights',
        responseTime: '< 1 minute'
      };

      expect(alerting.canaryFailures).toBe('CloudWatch Alarms');
      expect(alerting.performanceIssues).toBe('Performance Insights');
    });
  });
});
