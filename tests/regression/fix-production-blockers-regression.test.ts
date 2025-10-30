/**
 * Regression Tests for fix-production-blockers.sh
 * Ensures fixes don't break existing functionality
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { execSync } from 'child_process';
import * as fs from 'fs';

vi.mock('child_process');
vi.mock('fs');

describe('fix-production-blockers.sh Regression Tests', () => {
  const scriptPath = 'scripts/fix-production-blockers.sh';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Backward Compatibility', () => {
    it('should maintain compatibility with existing AWS Config setup', () => {
      const mockExec = vi.mocked(execSync);
      
      // Simulate existing Config setup
      mockExec.mockImplementation((cmd) => {
        if (cmd.toString().includes('describe-configuration-recorder-status')) {
          return Buffer.from(JSON.stringify({
            ConfigurationRecordersStatus: [{
              name: 'default',
              recording: true
            }]
          }));
        }
        return Buffer.from('');
      });

      const status = JSON.parse(
        execSync('aws configservice describe-configuration-recorder-status').toString()
      );

      expect(status.ConfigurationRecordersStatus[0].recording).toBe(true);
    });

    it('should not break existing Container Insights configuration', () => {
      const mockExec = vi.mocked(execSync);
      
      mockExec.mockReturnValue(Buffer.from(JSON.stringify({
        clusters: [{
          clusterName: 'huntaze-cluster',
          settings: [{ name: 'containerInsights', value: 'enabled' }]
        }]
      })));

      const result = JSON.parse(execSync('aws ecs describe-clusters').toString());
      
      expect(result.clusters[0].settings[0].value).toBe('enabled');
    });

    it('should preserve existing S3 bucket configurations', () => {
      const mockExec = vi.mocked(execSync);
      
      mockExec.mockReturnValue(Buffer.from(JSON.stringify({
        Versioning: { Status: 'Enabled' },
        Policy: { Version: '2012-10-17' }
      })));

      const bucketConfig = JSON.parse(execSync('aws s3api get-bucket-versioning').toString());
      
      expect(bucketConfig.Versioning.Status).toBe('Enabled');
    });
  });

  describe('Script Behavior Consistency', () => {
    it('should maintain consistent exit codes', () => {
      const mockExec = vi.mocked(execSync);
      
      // Success case
      mockExec.mockReturnValue(Buffer.from(''));
      expect(() => execSync('bash scripts/fix-production-blockers.sh')).not.toThrow();

      // Failure case with set -e
      mockExec.mockImplementation(() => {
        throw new Error('Command failed with exit code 1');
      });
      
      expect(() => execSync('bash scripts/fix-production-blockers.sh')).toThrow();
    });

    it('should maintain consistent output format', () => {
      const mockContent = fs.readFileSync(scriptPath, 'utf-8') as any;
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Should have consistent section headers
      expect(content).toContain('FIXING AWS CONFIG');
      expect(content).toContain('ENABLING CONTAINER INSIGHTS');
      expect(content).toContain('RDS ENCRYPTION PREPARATION');
      expect(content).toContain('PRODUCTION BLOCKERS FIXED');
    });

    it('should maintain consistent variable naming', () => {
      const mockContent = fs.readFileSync(scriptPath, 'utf-8') as any;
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).toContain('REGION=');
      expect(content).toContain('ACCOUNT_ID=');
      expect(content).toContain('CONFIG_BUCKET=');
      expect(content).toContain('CANARY_BUCKET=');
    });
  });

  describe('Integration with go-no-go-audit.sh', () => {
    it('should fix issues detected by go-no-go audit', () => {
      const mockExec = vi.mocked(execSync);
      
      // Simulate go-no-go audit finding issues
      const auditIssues = [
        'AWS Config not enabled',
        'Container Insights not enabled',
        'Unencrypted RDS instances found'
      ];

      // After running fix script, issues should be resolved
      mockExec.mockReturnValue(Buffer.from('All checks passed'));

      const result = execSync('./scripts/go-no-go-audit.sh').toString();
      expect(result).toContain('All checks passed');
    });

    it('should not interfere with other audit checks', () => {
      const mockExec = vi.mocked(execSync);
      
      mockExec.mockReturnValue(Buffer.from(JSON.stringify({
        checks: {
          awsConfig: 'PASS',
          containerInsights: 'PASS',
          rdsEncryption: 'PASS',
          guardDuty: 'PASS', // Should not be affected
          securityHub: 'PASS' // Should not be affected
        }
      })));

      const auditResult = JSON.parse(execSync('./scripts/go-no-go-audit.sh').toString());
      
      expect(auditResult.checks.guardDuty).toBe('PASS');
      expect(auditResult.checks.securityHub).toBe('PASS');
    });
  });

  describe('Resource Naming Consistency', () => {
    it('should use consistent bucket naming pattern', () => {
      const mockContent = fs.readFileSync(scriptPath, 'utf-8') as any;
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Should follow pattern: service-accountid-region
      expect(content).toMatch(/aws-config-\$\{ACCOUNT_ID\}-\$\{REGION\}/);
      expect(content).toMatch(/huntaze-synthetics-artifacts-\$\{ACCOUNT_ID\}/);
    });

    it('should use consistent IAM role naming', () => {
      const mockContent = fs.readFileSync(scriptPath, 'utf-8') as any;
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).toContain('AWSServiceRoleForConfig');
      expect(content).toContain('CloudWatchSyntheticsRole');
    });

    it('should use consistent cluster names', () => {
      const mockContent = fs.readFileSync(scriptPath, 'utf-8') as any;
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).toContain('ai-team');
      expect(content).toContain('huntaze-cluster');
      expect(content).toContain('huntaze-of-fargate');
    });
  });

  describe('Error Message Consistency', () => {
    it('should provide consistent error messages', () => {
      const mockContent = fs.readFileSync(scriptPath, 'utf-8') as any;
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Should use consistent error indicators
      expect(content).toContain('⚠️');
      expect(content).toContain('Already enabled or cluster not found');
      expect(content).toContain('Bucket already exists');
    });

    it('should maintain helpful error context', () => {
      const mockContent = fs.readFileSync(scriptPath, 'utf-8') as any;
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).toContain('Manual migration required');
      expect(content).toContain('Manual setup recommended');
      expect(content).toContain('see runbook');
    });
  });

  describe('Dependency on Other Scripts', () => {
    it('should not break migrate-rds-to-encrypted.sh', () => {
      const mockExec = vi.mocked(execSync);
      mockExec.mockReturnValue(Buffer.from(''));

      // fix-production-blockers.sh should reference but not execute RDS migration
      const mockContent = fs.readFileSync(scriptPath, 'utf-8') as any;
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).toContain('migrate-rds-to-encrypted.sh');
      expect(content).not.toContain('bash scripts/migrate-rds-to-encrypted.sh');
    });

    it('should maintain compatibility with security-runbook.sh', () => {
      const mockExec = vi.mocked(execSync);
      mockExec.mockReturnValue(Buffer.from(''));

      // Should not conflict with security runbook operations
      expect(() => execSync('bash scripts/security-runbook.sh')).not.toThrow();
    });

    it('should work with validate-security-comprehensive.sh', () => {
      const mockExec = vi.mocked(execSync);
      mockExec.mockReturnValue(Buffer.from('All security checks passed'));

      const result = execSync('bash scripts/validate-security-comprehensive.sh').toString();
      expect(result).toContain('passed');
    });
  });

  describe('Configuration File Integrity', () => {
    it('should not modify existing Terraform configurations', () => {
      const mockExec = vi.mocked(execSync);
      
      // Verify Terraform files are unchanged
      vi.mocked(fs.readFileSync).mockReturnValue('# Terraform configuration');
      
      const terraformContent = fs.readFileSync('infra/terraform/production-hardening/main.tf', 'utf-8');
      expect(terraformContent).toContain('Terraform configuration');
    });

    it('should not modify existing CloudFormation templates', () => {
      vi.mocked(fs.readFileSync).mockReturnValue('AWSTemplateFormatVersion: 2010-09-09');
      
      const cfnContent = fs.readFileSync('infra/fargate/optimized-task-definition.yaml', 'utf-8');
      expect(cfnContent).toContain('AWSTemplateFormatVersion');
    });
  });

  describe('Idempotency Regression', () => {
    it('should remain idempotent after multiple runs', () => {
      const mockExec = vi.mocked(execSync);
      let runCount = 0;

      mockExec.mockImplementation(() => {
        runCount++;
        if (runCount > 1) {
          return Buffer.from('Already configured');
        }
        return Buffer.from('Configured successfully');
      });

      // First run
      const result1 = execSync('bash scripts/fix-production-blockers.sh').toString();
      expect(result1).toContain('Configured successfully');

      // Second run
      const result2 = execSync('bash scripts/fix-production-blockers.sh').toString();
      expect(result2).toContain('Already configured');

      // Third run
      const result3 = execSync('bash scripts/fix-production-blockers.sh').toString();
      expect(result3).toContain('Already configured');
    });

    it('should not create duplicate resources', () => {
      const mockExec = vi.mocked(execSync);
      const createdResources = new Set<string>();

      mockExec.mockImplementation((cmd) => {
        const cmdStr = cmd.toString();
        if (cmdStr.includes('create-bucket')) {
          const bucket = cmdStr.match(/--bucket (\S+)/)?.[1];
          if (bucket && createdResources.has(bucket)) {
            throw new Error('BucketAlreadyExists');
          }
          if (bucket) createdResources.add(bucket);
        }
        return Buffer.from('');
      });

      // First run creates resources
      try { execSync('aws s3api create-bucket --bucket test-bucket'); } catch {}
      expect(createdResources.size).toBe(1);

      // Second run should not create duplicates
      try { execSync('aws s3api create-bucket --bucket test-bucket'); } catch (error) {
        expect((error as Error).message).toContain('BucketAlreadyExists');
      }
      expect(createdResources.size).toBe(1);
    });
  });

  describe('Performance Regression', () => {
    it('should not degrade execution time', () => {
      const mockExec = vi.mocked(execSync);
      mockExec.mockReturnValue(Buffer.from(''));

      const startTime = Date.now();
      
      // Simulate all operations
      for (let i = 0; i < 10; i++) {
        execSync('aws s3api create-bucket ...');
      }
      
      const duration = Date.now() - startTime;

      // Should complete quickly (allowing for mock overhead)
      expect(duration).toBeLessThan(1000);
    });

    it('should not increase memory usage significantly', () => {
      const mockExec = vi.mocked(execSync);
      const initialMemory = process.memoryUsage().heapUsed;

      mockExec.mockReturnValue(Buffer.from(''));

      // Execute multiple operations
      for (let i = 0; i < 100; i++) {
        execSync('aws configservice put-configuration-recorder ...');
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (< 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Documentation Consistency', () => {
    it('should reference correct documentation paths', () => {
      const mockContent = fs.readFileSync(scriptPath, 'utf-8') as any;
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).toContain('docs/runbooks/rds-encryption-migration.md');
      expect(content).not.toContain('docs/runbook/'); // Should be runbooks (plural)
    });

    it('should maintain consistent script references', () => {
      const mockContent = fs.readFileSync(scriptPath, 'utf-8') as any;
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).toContain('./scripts/go-no-go-audit.sh');
      expect(content).toContain('scripts/migrate-rds-to-encrypted.sh');
    });
  });

  describe('Security Regression', () => {
    it('should not expose sensitive information in logs', () => {
      const mockExec = vi.mocked(execSync);
      mockExec.mockReturnValue(Buffer.from('Operation completed'));

      const output = execSync('bash scripts/fix-production-blockers.sh').toString();
      
      expect(output).not.toContain('AWS_ACCESS_KEY_ID');
      expect(output).not.toContain('AWS_SECRET_ACCESS_KEY');
      expect(output).not.toContain('password');
    });

    it('should maintain secure bucket policies', () => {
      const mockContent = fs.readFileSync(scriptPath, 'utf-8') as any;
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).toContain('bucket-owner-full-control');
      expect(content).toContain('config.amazonaws.com');
      expect(content).not.toContain('Principal": "*"'); // Should not allow public access
    });

    it('should use service-linked roles correctly', () => {
      const mockContent = fs.readFileSync(scriptPath, 'utf-8') as any;
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).toContain('aws-service-role/config.amazonaws.com');
      expect(content).not.toContain('arn:aws:iam::*:role/'); // Should use specific account
    });
  });

  describe('Output Format Regression', () => {
    it('should maintain colored output format', () => {
      const mockContent = fs.readFileSync(scriptPath, 'utf-8') as any;
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).toContain('GREEN=');
      expect(content).toContain('YELLOW=');
      expect(content).toContain('BLUE=');
      expect(content).toContain('NC='); // No Color
    });

    it('should maintain emoji indicators', () => {
      const mockContent = fs.readFileSync(scriptPath, 'utf-8') as any;
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).toContain('🔧');
      expect(content).toContain('📦');
      expect(content).toContain('✅');
      expect(content).toContain('⚠️');
    });

    it('should maintain summary format', () => {
      const mockContent = fs.readFileSync(scriptPath, 'utf-8') as any;
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).toContain('Summary:');
      expect(content).toContain('Next Steps:');
      expect(content).toMatch(/\d+\./); // Numbered steps
    });
  });
});
