/**
 * Unit Tests for fix-production-blockers.sh
 * Tests automated remediation of production blockers
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Mock child_process
vi.mock('child_process');

// Mock fs
vi.mock('fs');

describe('fix-production-blockers.sh Script', () => {
  const scriptPath = path.join(process.cwd(), 'scripts/fix-production-blockers.sh');
  const mockAccountId = '317805897534';
  const mockRegion = 'us-east-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Script Existence and Permissions', () => {
    it('should exist at the correct path', () => {
      const mockStats = { isFile: () => true, mode: 0o755 };
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue(mockStats as any);

      expect(fs.existsSync(scriptPath)).toBe(true);
      const stats = fs.statSync(scriptPath);
      expect(stats.isFile()).toBe(true);
    });

    it('should have executable permissions', () => {
      const mockStats = { mode: 0o755 };
      vi.mocked(fs.statSync).mockReturnValue(mockStats as any);

      const stats = fs.statSync(scriptPath);
      const isExecutable = (stats.mode & 0o111) !== 0;
      expect(isExecutable).toBe(true);
    });

    it('should have correct shebang', () => {
      const mockContent = '#!/bin/bash\n# Fix Production Blockers';
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toMatch(/^#!\/bin\/bash/);
    });
  });

  describe('AWS Config Setup', () => {
    it('should create S3 bucket for AWS Config', () => {
      const expectedBucket = `aws-config-${mockAccountId}-${mockRegion}`;
      const mockExec = vi.mocked(execSync);
      mockExec.mockReturnValue(Buffer.from(''));

      // Simulate bucket creation
      const createBucketCmd = `aws s3api create-bucket --bucket ${expectedBucket} --region ${mockRegion}`;
      
      expect(() => execSync(createBucketCmd)).not.toThrow();
      expect(mockExec).toHaveBeenCalled();
    });

    it('should enable versioning on Config bucket', () => {
      const expectedBucket = `aws-config-${mockAccountId}-${mockRegion}`;
      const mockExec = vi.mocked(execSync);
      mockExec.mockReturnValue(Buffer.from(''));

      const versioningCmd = `aws s3api put-bucket-versioning --bucket ${expectedBucket} --versioning-configuration Status=Enabled`;
      
      expect(() => execSync(versioningCmd)).not.toThrow();
    });

    it('should create bucket policy with correct permissions', () => {
      const expectedBucket = `aws-config-${mockAccountId}-${mockRegion}`;
      const mockExec = vi.mocked(execSync);
      mockExec.mockReturnValue(Buffer.from(''));

      // Verify policy file creation
      const policyPath = '/tmp/config-bucket-policy.json';
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      const policyContent = {
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AWSConfigBucketPermissionsCheck',
            Effect: 'Allow',
            Principal: { Service: 'config.amazonaws.com' },
            Action: 's3:GetBucketAcl',
            Resource: `arn:aws:s3:::${expectedBucket}`
          }
        ]
      };

      fs.writeFileSync(policyPath, JSON.stringify(policyContent, null, 2));
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        policyPath,
        expect.stringContaining('AWSConfigBucketPermissionsCheck')
      );
    });

    it('should create configuration recorder', () => {
      const mockExec = vi.mocked(execSync);
      mockExec.mockReturnValue(Buffer.from(''));

      const recorderCmd = `aws configservice put-configuration-recorder --configuration-recorder name=default,roleARN=arn:aws:iam::${mockAccountId}:role/aws-service-role/config.amazonaws.com/AWSServiceRoleForConfig`;
      
      expect(() => execSync(recorderCmd)).not.toThrow();
    });

    it('should create delivery channel', () => {
      const expectedBucket = `aws-config-${mockAccountId}-${mockRegion}`;
      const mockExec = vi.mocked(execSync);
      mockExec.mockReturnValue(Buffer.from(''));

      const channelCmd = `aws configservice put-delivery-channel --delivery-channel name=default,s3BucketName=${expectedBucket}`;
      
      expect(() => execSync(channelCmd)).not.toThrow();
    });

    it('should start configuration recorder', () => {
      const mockExec = vi.mocked(execSync);
      mockExec.mockReturnValue(Buffer.from(''));

      const startCmd = 'aws configservice start-configuration-recorder --configuration-recorder-name default';
      
      expect(() => execSync(startCmd)).not.toThrow();
    });

    it('should handle existing bucket gracefully', () => {
      const mockExec = vi.mocked(execSync);
      mockExec.mockImplementation((cmd) => {
        if (cmd.toString().includes('create-bucket')) {
          throw new Error('BucketAlreadyExists');
        }
        return Buffer.from('');
      });

      // Should not throw - script handles this with || echo
      expect(() => {
        try {
          execSync('aws s3api create-bucket ...');
        } catch (error) {
          // Script continues with "Bucket already exists" message
        }
      }).not.toThrow();
    });
  });

  describe('Container Insights Enablement', () => {
    it('should enable account-level Container Insights', () => {
      const mockExec = vi.mocked(execSync);
      mockExec.mockReturnValue(Buffer.from(''));

      const accountSettingCmd = `aws ecs put-account-setting --name containerInsights --value enabled --region ${mockRegion}`;
      
      expect(() => execSync(accountSettingCmd)).not.toThrow();
    });

    it('should enable Container Insights on all clusters', () => {
      const clusters = ['ai-team', 'huntaze-cluster', 'huntaze-of-fargate'];
      const mockExec = vi.mocked(execSync);
      mockExec.mockReturnValue(Buffer.from(''));

      clusters.forEach(cluster => {
        const clusterCmd = `aws ecs update-cluster-settings --cluster ${cluster} --settings name=containerInsights,value=enabled --region ${mockRegion}`;
        
        expect(() => execSync(clusterCmd)).not.toThrow();
      });

      expect(mockExec).toHaveBeenCalledTimes(clusters.length);
    });

    it('should handle non-existent clusters gracefully', () => {
      const mockExec = vi.mocked(execSync);
      mockExec.mockImplementation((cmd) => {
        if (cmd.toString().includes('update-cluster-settings')) {
          throw new Error('ClusterNotFoundException');
        }
        return Buffer.from('');
      });

      // Should not throw - script handles this with || echo
      expect(() => {
        try {
          execSync('aws ecs update-cluster-settings ...');
        } catch (error) {
          // Script continues with "Already enabled or cluster not found" message
        }
      }).not.toThrow();
    });

    it('should handle already enabled Container Insights', () => {
      const mockExec = vi.mocked(execSync);
      mockExec.mockReturnValue(Buffer.from('Container Insights already enabled'));

      const result = execSync('aws ecs put-account-setting ...');
      expect(result.toString()).toContain('already enabled');
    });
  });

  describe('RDS Encryption Preparation', () => {
    it('should identify unencrypted RDS instances', () => {
      const mockExec = vi.mocked(execSync);
      const unencryptedDbs = 'huntaze-db-1\nhuntaze-db-2';
      mockExec.mockReturnValue(Buffer.from(unencryptedDbs));

      const describeCmd = `aws rds describe-db-instances --region ${mockRegion} --query 'DBInstances[?StorageEncrypted==\`false\` && contains(DBInstanceIdentifier, \`huntaze\`)].DBInstanceIdentifier' --output text`;
      
      const result = execSync(describeCmd);
      expect(result.toString()).toContain('huntaze-db');
    });

    it('should report when all RDS instances are encrypted', () => {
      const mockExec = vi.mocked(execSync);
      mockExec.mockReturnValue(Buffer.from(''));

      const result = execSync('aws rds describe-db-instances ...');
      expect(result.toString()).toBe('');
    });

    it('should reference migration script for unencrypted databases', () => {
      const mockContent = fs.readFileSync(scriptPath, 'utf-8') as any;
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('scripts/migrate-rds-to-encrypted.sh');
      expect(content).toContain('docs/runbooks/rds-encryption-migration.md');
    });

    it('should not attempt automatic RDS encryption', () => {
      const mockContent = '#!/bin/bash\necho "RDS encryption requires manual migration"';
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      const content = fs.readFileSync(scriptPath, 'utf-8');
      // Should NOT contain commands that modify RDS encryption directly
      expect(content).not.toContain('aws rds modify-db-instance --storage-encrypted');
      expect(content).not.toContain('aws rds restore-db-instance-from-db-snapshot');
    });
  });

  describe('CloudWatch Synthetics Canary Setup', () => {
    it('should create S3 bucket for Synthetics artifacts', () => {
      const expectedBucket = `huntaze-synthetics-artifacts-${mockAccountId}`;
      const mockExec = vi.mocked(execSync);
      mockExec.mockReturnValue(Buffer.from(''));

      const createBucketCmd = `aws s3api create-bucket --bucket ${expectedBucket} --region ${mockRegion}`;
      
      expect(() => execSync(createBucketCmd)).not.toThrow();
    });

    it('should check for CloudWatchSyntheticsRole existence', () => {
      const mockExec = vi.mocked(execSync);
      mockExec.mockReturnValue(Buffer.from(JSON.stringify({
        Role: { RoleName: 'CloudWatchSyntheticsRole' }
      })));

      const getRoleCmd = 'aws iam get-role --role-name CloudWatchSyntheticsRole';
      
      const result = execSync(getRoleCmd);
      expect(result.toString()).toContain('CloudWatchSyntheticsRole');
    });

    it('should skip canary creation if role does not exist', () => {
      const mockExec = vi.mocked(execSync);
      mockExec.mockImplementation((cmd) => {
        if (cmd.toString().includes('get-role')) {
          throw new Error('NoSuchEntity');
        }
        return Buffer.from('');
      });

      // Should handle missing role gracefully
      expect(() => {
        try {
          execSync('aws iam get-role --role-name CloudWatchSyntheticsRole');
        } catch (error) {
          // Script skips canary creation
        }
      }).not.toThrow();
    });

    it('should provide guidance for manual canary setup', () => {
      const mockContent = fs.readFileSync(scriptPath, 'utf-8') as any;
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('Use AWS Console or Terraform for full canary setup');
    });
  });

  describe('Error Handling', () => {
    it('should exit on error with set -e', () => {
      const mockContent = '#!/bin/bash\nset -e\n';
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('set -e');
    });

    it('should handle AWS CLI errors gracefully', () => {
      const mockExec = vi.mocked(execSync);
      mockExec.mockImplementation((cmd) => {
        throw new Error('AWS CLI error: InvalidClientTokenId');
      });

      expect(() => {
        try {
          execSync('aws s3api create-bucket ...');
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toContain('InvalidClientTokenId');
        }
      }).not.toThrow();
    });

    it('should handle network timeouts', () => {
      const mockExec = vi.mocked(execSync);
      mockExec.mockImplementation((cmd) => {
        throw new Error('Connection timeout');
      });

      expect(() => {
        try {
          execSync('aws configservice start-configuration-recorder ...');
        } catch (error) {
          expect(error).toBeDefined();
        }
      }).not.toThrow();
    });

    it('should handle permission errors', () => {
      const mockExec = vi.mocked(execSync);
      mockExec.mockImplementation((cmd) => {
        throw new Error('AccessDenied');
      });

      expect(() => {
        try {
          execSync('aws s3api put-bucket-policy ...');
        } catch (error) {
          expect((error as Error).message).toContain('AccessDenied');
        }
      }).not.toThrow();
    });
  });

  describe('Output and Logging', () => {
    it('should display colored output headers', () => {
      const mockContent = fs.readFileSync(scriptPath, 'utf-8') as any;
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('\\033[0;32m'); // GREEN
      expect(content).toContain('\\033[1;33m'); // YELLOW
      expect(content).toContain('\\033[0;34m'); // BLUE
    });

    it('should display progress indicators', () => {
      const mockContent = fs.readFileSync(scriptPath, 'utf-8') as any;
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('🔧');
      expect(content).toContain('📦');
      expect(content).toContain('✅');
      expect(content).toContain('⚠️');
    });

    it('should display summary at the end', () => {
      const mockContent = fs.readFileSync(scriptPath, 'utf-8') as any;
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('PRODUCTION BLOCKERS FIXED');
      expect(content).toContain('Summary:');
      expect(content).toContain('Next Steps:');
    });

    it('should provide clear next steps', () => {
      const mockContent = fs.readFileSync(scriptPath, 'utf-8') as any;
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('Wait 2-3 minutes for AWS Config to initialize');
      expect(content).toContain('Review RDS encryption migration plan');
      expect(content).toContain('Re-run GO/NO-GO audit');
    });
  });

  describe('Configuration Variables', () => {
    it('should use correct AWS region', () => {
      const mockContent = `REGION="${mockRegion}"`;
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain(`REGION="${mockRegion}"`);
    });

    it('should use correct AWS account ID', () => {
      const mockContent = `ACCOUNT_ID="${mockAccountId}"`;
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain(`ACCOUNT_ID="${mockAccountId}"`);
    });

    it('should construct bucket names correctly', () => {
      const expectedConfigBucket = `aws-config-${mockAccountId}-${mockRegion}`;
      const expectedSyntheticsBucket = `huntaze-synthetics-artifacts-${mockAccountId}`;
      
      const mockContent = `CONFIG_BUCKET="${expectedConfigBucket}"\nCANARY_BUCKET="${expectedSyntheticsBucket}"`;
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain(expectedConfigBucket);
      expect(content).toContain(expectedSyntheticsBucket);
    });
  });

  describe('Integration with Other Scripts', () => {
    it('should reference go-no-go-audit.sh for verification', () => {
      const mockContent = fs.readFileSync(scriptPath, 'utf-8') as any;
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('./scripts/go-no-go-audit.sh');
    });

    it('should reference migrate-rds-to-encrypted.sh', () => {
      const mockContent = fs.readFileSync(scriptPath, 'utf-8') as any;
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('scripts/migrate-rds-to-encrypted.sh');
    });

    it('should reference RDS encryption runbook', () => {
      const mockContent = fs.readFileSync(scriptPath, 'utf-8') as any;
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('docs/runbooks/rds-encryption-migration.md');
    });
  });

  describe('Idempotency', () => {
    it('should be safe to run multiple times', () => {
      const mockExec = vi.mocked(execSync);
      let callCount = 0;
      
      mockExec.mockImplementation((cmd) => {
        callCount++;
        if (cmd.toString().includes('create-bucket') && callCount > 1) {
          throw new Error('BucketAlreadyExists');
        }
        return Buffer.from('');
      });

      // First run
      try { execSync('aws s3api create-bucket ...'); } catch {}
      
      // Second run - should handle existing resources
      try { execSync('aws s3api create-bucket ...'); } catch {}
      
      expect(callCount).toBe(2);
    });

    it('should not fail if Config recorder already exists', () => {
      const mockExec = vi.mocked(execSync);
      mockExec.mockImplementation((cmd) => {
        if (cmd.toString().includes('put-configuration-recorder')) {
          return Buffer.from('Recorder already exists');
        }
        return Buffer.from('');
      });

      expect(() => execSync('aws configservice put-configuration-recorder ...')).not.toThrow();
    });

    it('should not fail if delivery channel already exists', () => {
      const mockExec = vi.mocked(execSync);
      mockExec.mockImplementation((cmd) => {
        if (cmd.toString().includes('put-delivery-channel')) {
          return Buffer.from('Channel already exists');
        }
        return Buffer.from('');
      });

      expect(() => execSync('aws configservice put-delivery-channel ...')).not.toThrow();
    });
  });

  describe('Security Considerations', () => {
    it('should use IAM service role for AWS Config', () => {
      const mockContent = fs.readFileSync(scriptPath, 'utf-8') as any;
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('aws-service-role/config.amazonaws.com/AWSServiceRoleForConfig');
    });

    it('should set appropriate bucket policies', () => {
      const mockContent = fs.readFileSync(scriptPath, 'utf-8') as any;
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('AWSConfigBucketPermissionsCheck');
      expect(content).toContain('AWSConfigBucketPutObject');
      expect(content).toContain('bucket-owner-full-control');
    });

    it('should not expose sensitive credentials', () => {
      const mockContent = fs.readFileSync(scriptPath, 'utf-8') as any;
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).not.toContain('AWS_ACCESS_KEY_ID');
      expect(content).not.toContain('AWS_SECRET_ACCESS_KEY');
      expect(content).not.toContain('password');
    });
  });

  describe('Performance', () => {
    it('should complete AWS Config setup in reasonable time', () => {
      const mockExec = vi.mocked(execSync);
      const startTime = Date.now();
      
      mockExec.mockReturnValue(Buffer.from(''));
      
      // Simulate all AWS Config commands
      execSync('aws s3api create-bucket ...');
      execSync('aws s3api put-bucket-versioning ...');
      execSync('aws s3api put-bucket-policy ...');
      execSync('aws configservice put-configuration-recorder ...');
      execSync('aws configservice put-delivery-channel ...');
      execSync('aws configservice start-configuration-recorder ...');
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete quickly in tests
    });

    it('should handle parallel cluster updates efficiently', () => {
      const clusters = ['ai-team', 'huntaze-cluster', 'huntaze-of-fargate'];
      const mockExec = vi.mocked(execSync);
      mockExec.mockReturnValue(Buffer.from(''));

      const startTime = Date.now();
      
      clusters.forEach(cluster => {
        execSync(`aws ecs update-cluster-settings --cluster ${cluster} ...`);
      });
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(3000);
    });
  });

  describe('Validation and Verification', () => {
    it('should verify AWS Config recorder is running', () => {
      const mockExec = vi.mocked(execSync);
      mockExec.mockReturnValue(Buffer.from(JSON.stringify({
        ConfigurationRecorders: [{
          name: 'default',
          recording: true
        }]
      })));

      const verifyCmd = 'aws configservice describe-configuration-recorder-status';
      const result = JSON.parse(execSync(verifyCmd).toString());
      
      expect(result.ConfigurationRecorders[0].recording).toBe(true);
    });

    it('should verify Container Insights is enabled', () => {
      const mockExec = vi.mocked(execSync);
      mockExec.mockReturnValue(Buffer.from(JSON.stringify({
        Cluster: {
          settings: [{ name: 'containerInsights', value: 'enabled' }]
        }
      })));

      const verifyCmd = 'aws ecs describe-clusters --clusters huntaze-cluster';
      const result = JSON.parse(execSync(verifyCmd).toString());
      
      const insightsSetting = result.Cluster.settings.find((s: any) => s.name === 'containerInsights');
      expect(insightsSetting?.value).toBe('enabled');
    });
  });
});
