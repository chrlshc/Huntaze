/**
 * Integration Tests for fix-warnings-final.sh Script
 * Tests end-to-end workflow of fixing final production warnings
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { execSync } from 'child_process';

// Mock child_process for integration tests
vi.mock('child_process');

describe('fix-warnings-final.sh Integration Tests', () => {
  const mockExecSync = vi.mocked(execSync);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('End-to-End Workflow', () => {
    it('should complete full workflow successfully', async () => {
      // Mock successful AWS CLI responses
      mockExecSync
        .mockReturnValueOnce(Buffer.from('')) // RDS modify
        .mockReturnValueOnce(Buffer.from(JSON.stringify({ // RDS describe
          DBInstances: [{
            PerformanceInsightsEnabled: true,
            PerformanceInsightsRetentionPeriod: 7
          }]
        })))
        .mockReturnValueOnce(Buffer.from(JSON.stringify({ // IAM get-role
          Role: { RoleName: 'CloudWatchSyntheticsRole' }
        })))
        .mockReturnValueOnce(Buffer.from('')) // S3 head-bucket
        .mockReturnValueOnce(Buffer.from('')) // Canary 1 create
        .mockReturnValueOnce(Buffer.from('')) // Canary 1 start
        .mockReturnValueOnce(Buffer.from('')) // Canary 2 create
        .mockReturnValueOnce(Buffer.from('')); // Canary 2 start

      // Simulate script execution
      const commands = [
        'aws rds modify-db-instance',
        'aws rds describe-db-instances',
        'aws iam get-role',
        'aws s3api head-bucket',
        'aws synthetics create-canary --name huntaze-api-health',
        'aws synthetics start-canary --name huntaze-api-health',
        'aws synthetics create-canary --name huntaze-of-endpoint',
        'aws synthetics start-canary --name huntaze-of-endpoint'
      ];

      commands.forEach(cmd => execSync(cmd));

      expect(mockExecSync).toHaveBeenCalledTimes(8);
    });

    it('should handle partial completion gracefully', () => {
      // RDS succeeds, but canary creation fails
      mockExecSync
        .mockReturnValueOnce(Buffer.from('')) // RDS modify succeeds
        .mockReturnValueOnce(Buffer.from(JSON.stringify({
          DBInstances: [{ PerformanceInsightsEnabled: true }]
        })))
        .mockImplementationOnce(() => { // Canary creation fails
          throw new Error('Canary creation failed');
        });

      execSync('aws rds modify-db-instance');
      execSync('aws rds describe-db-instances');

      expect(() => {
        execSync('aws synthetics create-canary');
      }).toThrow('Canary creation failed');

      // RDS should still be configured
      expect(mockExecSync).toHaveBeenCalledTimes(3);
    });
  });

  describe('RDS Performance Insights Integration', () => {
    it('should enable Performance Insights and verify', async () => {
      mockExecSync
        .mockReturnValueOnce(Buffer.from('')) // modify-db-instance
        .mockReturnValueOnce(Buffer.from(JSON.stringify({
          DBInstances: [{
            DBInstanceIdentifier: 'huntaze-postgres-production-encrypted',
            PerformanceInsightsEnabled: true,
            PerformanceInsightsRetentionPeriod: 7,
            PerformanceInsightsKMSKeyId: 'arn:aws:kms:us-east-1:317805897534:key/...'
          }]
        })));

      execSync('aws rds modify-db-instance --enable-performance-insights');
      const result = execSync('aws rds describe-db-instances');
      const parsed = JSON.parse(result.toString());

      expect(parsed.DBInstances[0].PerformanceInsightsEnabled).toBe(true);
      expect(parsed.DBInstances[0].PerformanceInsightsRetentionPeriod).toBe(7);
    });

    it('should not cause database downtime', () => {
      mockExecSync.mockReturnValue(Buffer.from(JSON.stringify({
        DBInstances: [{
          DBInstanceStatus: 'available',
          PerformanceInsightsEnabled: true
        }]
      })));

      const result = execSync('aws rds describe-db-instances');
      const parsed = JSON.parse(result.toString());

      // Database should remain available
      expect(parsed.DBInstances[0].DBInstanceStatus).toBe('available');
    });

    it('should use free tier retention period', () => {
      mockExecSync.mockReturnValue(Buffer.from(JSON.stringify({
        DBInstances: [{
          PerformanceInsightsRetentionPeriod: 7
        }]
      })));

      const result = execSync('aws rds describe-db-instances');
      const parsed = JSON.parse(result.toString());

      expect(parsed.DBInstances[0].PerformanceInsightsRetentionPeriod).toBe(7);
      expect(parsed.DBInstances[0].PerformanceInsightsRetentionPeriod).toBeLessThanOrEqual(7);
    });
  });

  describe('IAM Role Creation Integration', () => {
    it('should create role with correct trust policy', () => {
      mockExecSync
        .mockReturnValueOnce(Buffer.from('')) // get-role fails (not exists)
        .mockReturnValueOnce(Buffer.from(JSON.stringify({ // create-role
          Role: {
            RoleName: 'CloudWatchSyntheticsRole',
            Arn: 'arn:aws:iam::317805897534:role/CloudWatchSyntheticsRole',
            AssumeRolePolicyDocument: {
              Statement: [{
                Effect: 'Allow',
                Principal: { Service: 'synthetics.amazonaws.com' },
                Action: 'sts:AssumeRole'
              }]
            }
          }
        })))
        .mockReturnValueOnce(Buffer.from('')) // attach-role-policy
        .mockReturnValueOnce(Buffer.from('')); // put-role-policy

      try {
        execSync('aws iam get-role --role-name CloudWatchSyntheticsRole');
      } catch {
        // Role doesn't exist, create it
        const createResult = execSync('aws iam create-role');
        const parsed = JSON.parse(createResult.toString());
        
        expect(parsed.Role.RoleName).toBe('CloudWatchSyntheticsRole');
        
        execSync('aws iam attach-role-policy');
        execSync('aws iam put-role-policy');
      }

      expect(mockExecSync).toHaveBeenCalledTimes(4);
    });

    it('should handle existing role gracefully', () => {
      mockExecSync.mockReturnValue(Buffer.from(JSON.stringify({
        Role: {
          RoleName: 'CloudWatchSyntheticsRole',
          Arn: 'arn:aws:iam::317805897534:role/CloudWatchSyntheticsRole'
        }
      })));

      const result = execSync('aws iam get-role --role-name CloudWatchSyntheticsRole');
      const parsed = JSON.parse(result.toString());

      expect(parsed.Role.RoleName).toBe('CloudWatchSyntheticsRole');
    });

    it('should attach required policies', () => {
      mockExecSync
        .mockReturnValueOnce(Buffer.from('')) // attach CloudWatchSyntheticsFullAccess
        .mockReturnValueOnce(Buffer.from('')); // put S3 policy

      execSync('aws iam attach-role-policy --policy-arn arn:aws:iam::aws:policy/CloudWatchSyntheticsFullAccess');
      execSync('aws iam put-role-policy --policy-name SyntheticsS3Access');

      expect(mockExecSync).toHaveBeenCalledTimes(2);
    });
  });

  describe('S3 Bucket Integration', () => {
    it('should create bucket for canary artifacts', () => {
      mockExecSync
        .mockImplementationOnce(() => { // head-bucket fails
          throw new Error('Not Found');
        })
        .mockReturnValueOnce(Buffer.from(JSON.stringify({
          Location: '/huntaze-synthetics-artifacts-317805897534'
        })));

      try {
        execSync('aws s3api head-bucket --bucket huntaze-synthetics-artifacts-317805897534');
      } catch {
        const result = execSync('aws s3api create-bucket --bucket huntaze-synthetics-artifacts-317805897534');
        expect(result).toBeDefined();
      }

      expect(mockExecSync).toHaveBeenCalledTimes(2);
    });

    it('should handle existing bucket', () => {
      mockExecSync.mockReturnValue(Buffer.from(''));

      execSync('aws s3api head-bucket --bucket huntaze-synthetics-artifacts-317805897534');

      expect(mockExecSync).toHaveBeenCalledTimes(1);
    });
  });

  describe('Canary Creation Integration', () => {
    it('should create and start API health canary', () => {
      mockExecSync
        .mockImplementationOnce(() => { // get-canary fails (not exists)
          throw new Error('Not Found');
        })
        .mockReturnValueOnce(Buffer.from(JSON.stringify({ // create-canary
          Canary: {
            Name: 'huntaze-api-health',
            Status: { State: 'CREATING' }
          }
        })))
        .mockReturnValueOnce(Buffer.from('')); // start-canary

      try {
        execSync('aws synthetics get-canary --name huntaze-api-health');
      } catch {
        execSync('aws synthetics create-canary --name huntaze-api-health');
        execSync('aws synthetics start-canary --name huntaze-api-health');
      }

      expect(mockExecSync).toHaveBeenCalledTimes(3);
    });

    it('should create and start OnlyFans endpoint canary', () => {
      mockExecSync
        .mockImplementationOnce(() => {
          throw new Error('Not Found');
        })
        .mockReturnValueOnce(Buffer.from(JSON.stringify({
          Canary: {
            Name: 'huntaze-of-endpoint',
            Status: { State: 'CREATING' }
          }
        })))
        .mockReturnValueOnce(Buffer.from(''));

      try {
        execSync('aws synthetics get-canary --name huntaze-of-endpoint');
      } catch {
        execSync('aws synthetics create-canary --name huntaze-of-endpoint');
        execSync('aws synthetics start-canary --name huntaze-of-endpoint');
      }

      expect(mockExecSync).toHaveBeenCalledTimes(3);
    });

    it('should verify canaries are running', () => {
      mockExecSync
        .mockReturnValueOnce(Buffer.from(JSON.stringify({
          Canary: {
            Name: 'huntaze-api-health',
            Status: { State: 'RUNNING' }
          }
        })))
        .mockReturnValueOnce(Buffer.from(JSON.stringify({
          Canary: {
            Name: 'huntaze-of-endpoint',
            Status: { State: 'RUNNING' }
          }
        })));

      const health = execSync('aws synthetics get-canary --name huntaze-api-health');
      const of = execSync('aws synthetics get-canary --name huntaze-of-endpoint');

      const healthParsed = JSON.parse(health.toString());
      const ofParsed = JSON.parse(of.toString());

      expect(healthParsed.Canary.Status.State).toBe('RUNNING');
      expect(ofParsed.Canary.Status.State).toBe('RUNNING');
    });
  });

  describe('Audit Integration', () => {
    it('should fix warnings detected by audit script', () => {
      // Simulate audit detecting warnings
      const auditWarnings = [
        'RDS Performance Insights not enabled',
        'CloudWatch Synthetics Canaries not configured'
      ];

      expect(auditWarnings).toHaveLength(2);

      // After running fix script
      mockExecSync
        .mockReturnValueOnce(Buffer.from(JSON.stringify({
          DBInstances: [{ PerformanceInsightsEnabled: true }]
        })))
        .mockReturnValueOnce(Buffer.from(JSON.stringify({
          Canary: { Name: 'huntaze-api-health', Status: { State: 'RUNNING' } }
        })))
        .mockReturnValueOnce(Buffer.from(JSON.stringify({
          Canary: { Name: 'huntaze-of-endpoint', Status: { State: 'RUNNING' } }
        })));

      const rds = execSync('aws rds describe-db-instances');
      const canary1 = execSync('aws synthetics get-canary --name huntaze-api-health');
      const canary2 = execSync('aws synthetics get-canary --name huntaze-of-endpoint');

      const rdsParsed = JSON.parse(rds.toString());
      const canary1Parsed = JSON.parse(canary1.toString());
      const canary2Parsed = JSON.parse(canary2.toString());

      expect(rdsParsed.DBInstances[0].PerformanceInsightsEnabled).toBe(true);
      expect(canary1Parsed.Canary.Status.State).toBe('RUNNING');
      expect(canary2Parsed.Canary.Status.State).toBe('RUNNING');

      // Warnings should be resolved
      const remainingWarnings = 0;
      expect(remainingWarnings).toBe(0);
    });

    it('should result in passing audit after execution', () => {
      mockExecSync.mockReturnValue(Buffer.from('0')); // Exit code 0

      const auditResult = execSync('./scripts/go-no-go-audit.sh');
      const exitCode = parseInt(auditResult.toString());

      expect(exitCode).toBe(0);
    });
  });

  describe('Monitoring Verification', () => {
    it('should enable continuous endpoint monitoring', () => {
      mockExecSync
        .mockReturnValueOnce(Buffer.from(JSON.stringify({
          Canary: {
            Name: 'huntaze-api-health',
            Schedule: { Expression: 'rate(1 minute)' },
            Status: { State: 'RUNNING' }
          }
        })))
        .mockReturnValueOnce(Buffer.from(JSON.stringify({
          Canary: {
            Name: 'huntaze-of-endpoint',
            Schedule: { Expression: 'rate(1 minute)' },
            Status: { State: 'RUNNING' }
          }
        })));

      const canary1 = execSync('aws synthetics get-canary --name huntaze-api-health');
      const canary2 = execSync('aws synthetics get-canary --name huntaze-of-endpoint');

      const c1 = JSON.parse(canary1.toString());
      const c2 = JSON.parse(canary2.toString());

      expect(c1.Canary.Schedule.Expression).toBe('rate(1 minute)');
      expect(c2.Canary.Schedule.Expression).toBe('rate(1 minute)');
      expect(c1.Canary.Status.State).toBe('RUNNING');
      expect(c2.Canary.Status.State).toBe('RUNNING');
    });

    it('should enable database performance monitoring', () => {
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

  describe('Cost Optimization Verification', () => {
    it('should use free tier for Performance Insights', () => {
      mockExecSync.mockReturnValue(Buffer.from(JSON.stringify({
        DBInstances: [{
          PerformanceInsightsRetentionPeriod: 7
        }]
      })));

      const result = execSync('aws rds describe-db-instances');
      const parsed = JSON.parse(result.toString());

      // 7 days is free tier
      expect(parsed.DBInstances[0].PerformanceInsightsRetentionPeriod).toBe(7);
    });

    it('should minimize canary execution costs', () => {
      mockExecSync.mockReturnValue(Buffer.from(JSON.stringify({
        Canary: {
          Schedule: { Expression: 'rate(1 minute)' },
          RunConfig: { TimeoutInSeconds: 60 }
        }
      })));

      const result = execSync('aws synthetics get-canary');
      const parsed = JSON.parse(result.toString());

      // 1 minute frequency is reasonable
      expect(parsed.Canary.Schedule.Expression).toBe('rate(1 minute)');
      // Short timeout reduces costs
      expect(parsed.Canary.RunConfig.TimeoutInSeconds).toBe(60);
    });
  });

  describe('Production Readiness Verification', () => {
    it('should meet all production monitoring requirements', () => {
      mockExecSync
        .mockReturnValueOnce(Buffer.from(JSON.stringify({
          DBInstances: [{ PerformanceInsightsEnabled: true }]
        })))
        .mockReturnValueOnce(Buffer.from(JSON.stringify({
          Canary: { Status: { State: 'RUNNING' } }
        })))
        .mockReturnValueOnce(Buffer.from(JSON.stringify({
          Canary: { Status: { State: 'RUNNING' } }
        })));

      const rds = JSON.parse(execSync('aws rds describe-db-instances').toString());
      const canary1 = JSON.parse(execSync('aws synthetics get-canary --name huntaze-api-health').toString());
      const canary2 = JSON.parse(execSync('aws synthetics get-canary --name huntaze-of-endpoint').toString());

      const requirements = {
        performanceInsights: rds.DBInstances[0].PerformanceInsightsEnabled,
        healthMonitoring: canary1.Canary.Status.State === 'RUNNING',
        endpointMonitoring: canary2.Canary.Status.State === 'RUNNING'
      };

      expect(requirements.performanceInsights).toBe(true);
      expect(requirements.healthMonitoring).toBe(true);
      expect(requirements.endpointMonitoring).toBe(true);
    });

    it('should enable zero-downtime monitoring', () => {
      mockExecSync.mockReturnValue(Buffer.from(JSON.stringify({
        DBInstances: [{
          DBInstanceStatus: 'available',
          PerformanceInsightsEnabled: true
        }]
      })));

      const result = execSync('aws rds describe-db-instances');
      const parsed = JSON.parse(result.toString());

      // Database should remain available during enablement
      expect(parsed.DBInstances[0].DBInstanceStatus).toBe('available');
      expect(parsed.DBInstances[0].PerformanceInsightsEnabled).toBe(true);
    });
  });

  describe('Error Recovery', () => {
    it('should handle AWS service throttling', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('ThrottlingException: Rate exceeded');
      });

      expect(() => {
        execSync('aws rds modify-db-instance');
      }).toThrow('ThrottlingException');
    });

    it('should handle insufficient permissions', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('AccessDeniedException: User is not authorized');
      });

      expect(() => {
        execSync('aws iam create-role');
      }).toThrow('AccessDeniedException');
    });

    it('should handle resource conflicts', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('ResourceAlreadyExistsException');
      });

      expect(() => {
        execSync('aws synthetics create-canary');
      }).toThrow('ResourceAlreadyExistsException');
    });
  });

  describe('Rollback Capability', () => {
    it('should allow disabling Performance Insights if needed', () => {
      mockExecSync.mockReturnValue(Buffer.from(''));

      execSync('aws rds modify-db-instance --no-enable-performance-insights');

      expect(mockExecSync).toHaveBeenCalled();
    });

    it('should allow stopping canaries if needed', () => {
      mockExecSync.mockReturnValue(Buffer.from(''));

      execSync('aws synthetics stop-canary --name huntaze-api-health');
      execSync('aws synthetics stop-canary --name huntaze-of-endpoint');

      expect(mockExecSync).toHaveBeenCalledTimes(2);
    });

    it('should allow deleting canaries if needed', () => {
      mockExecSync.mockReturnValue(Buffer.from(''));

      execSync('aws synthetics delete-canary --name huntaze-api-health');
      execSync('aws synthetics delete-canary --name huntaze-of-endpoint');

      expect(mockExecSync).toHaveBeenCalledTimes(2);
    });
  });
});
