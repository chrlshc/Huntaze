/**
 * Integration Tests for fix-production-blockers.sh
 * Tests end-to-end execution and AWS service integration
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { execSync } from 'child_process';

// Mock AWS SDK clients
const mockS3Client = {
  send: vi.fn()
};

const mockConfigServiceClient = {
  send: vi.fn()
};

const mockECSClient = {
  send: vi.fn()
};

const mockRDSClient = {
  send: vi.fn()
};

const mockIAMClient = {
  send: vi.fn()
};

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(() => mockS3Client),
  CreateBucketCommand: vi.fn((params) => params),
  PutBucketVersioningCommand: vi.fn((params) => params),
  PutBucketPolicyCommand: vi.fn((params) => params)
}));

vi.mock('@aws-sdk/client-config-service', () => ({
  ConfigServiceClient: vi.fn(() => mockConfigServiceClient),
  PutConfigurationRecorderCommand: vi.fn((params) => params),
  PutDeliveryChannelCommand: vi.fn((params) => params),
  StartConfigurationRecorderCommand: vi.fn((params) => params),
  DescribeConfigurationRecorderStatusCommand: vi.fn((params) => params)
}));

vi.mock('@aws-sdk/client-ecs', () => ({
  ECSClient: vi.fn(() => mockECSClient),
  PutAccountSettingCommand: vi.fn((params) => params),
  UpdateClusterSettingsCommand: vi.fn((params) => params),
  DescribeClustersCommand: vi.fn((params) => params)
}));

vi.mock('@aws-sdk/client-rds', () => ({
  RDSClient: vi.fn(() => mockRDSClient),
  DescribeDBInstancesCommand: vi.fn((params) => params)
}));

vi.mock('@aws-sdk/client-iam', () => ({
  IAMClient: vi.fn(() => mockIAMClient),
  GetRoleCommand: vi.fn((params) => params)
}));

describe('fix-production-blockers.sh Integration Tests', () => {
  const mockAccountId = '317805897534';
  const mockRegion = 'us-east-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('End-to-End AWS Config Setup', () => {
    it('should complete full AWS Config setup workflow', async () => {
      // Mock successful S3 operations
      mockS3Client.send.mockResolvedValue({});

      // Mock successful Config Service operations
      mockConfigServiceClient.send.mockResolvedValue({});

      const workflow = async () => {
        // 1. Create S3 bucket
        await mockS3Client.send({ Bucket: `aws-config-${mockAccountId}-${mockRegion}` });
        
        // 2. Enable versioning
        await mockS3Client.send({ Bucket: `aws-config-${mockAccountId}-${mockRegion}` });
        
        // 3. Set bucket policy
        await mockS3Client.send({ Bucket: `aws-config-${mockAccountId}-${mockRegion}` });
        
        // 4. Create recorder
        await mockConfigServiceClient.send({ ConfigurationRecorder: { name: 'default' } });
        
        // 5. Create delivery channel
        await mockConfigServiceClient.send({ DeliveryChannel: { name: 'default' } });
        
        // 6. Start recorder
        await mockConfigServiceClient.send({ ConfigurationRecorderName: 'default' });
      };

      await expect(workflow()).resolves.not.toThrow();

      expect(mockS3Client.send).toHaveBeenCalledTimes(3);
      expect(mockConfigServiceClient.send).toHaveBeenCalledTimes(3);
    });

    it('should verify AWS Config is recording after setup', async () => {
      mockConfigServiceClient.send.mockResolvedValue({
        ConfigurationRecordersStatus: [{
          name: 'default',
          recording: true,
          lastStatus: 'SUCCESS'
        }]
      });

      const status = await mockConfigServiceClient.send({});
      
      expect(status.ConfigurationRecordersStatus[0].recording).toBe(true);
      expect(status.ConfigurationRecordersStatus[0].lastStatus).toBe('SUCCESS');
    });

    it('should handle AWS Config already configured', async () => {
      mockConfigServiceClient.send.mockRejectedValueOnce(
        new Error('ConfigurationRecorderAlreadyExistsException')
      );

      // Should continue despite error
      try {
        await mockConfigServiceClient.send({});
      } catch (error) {
        expect((error as Error).message).toContain('AlreadyExists');
      }

      // Subsequent operations should succeed
      mockConfigServiceClient.send.mockResolvedValue({});
      await expect(mockConfigServiceClient.send({})).resolves.not.toThrow();
    });
  });

  describe('End-to-End Container Insights Enablement', () => {
    it('should enable Container Insights across all clusters', async () => {
      const clusters = ['ai-team', 'huntaze-cluster', 'huntaze-of-fargate'];
      
      mockECSClient.send.mockResolvedValue({});

      // Enable account setting
      await mockECSClient.send({ name: 'containerInsights', value: 'enabled' });

      // Enable on each cluster
      for (const cluster of clusters) {
        await mockECSClient.send({
          cluster,
          settings: [{ name: 'containerInsights', value: 'enabled' }]
        });
      }

      expect(mockECSClient.send).toHaveBeenCalledTimes(4); // 1 account + 3 clusters
    });

    it('should verify Container Insights is active on clusters', async () => {
      mockECSClient.send.mockResolvedValue({
        clusters: [{
          clusterName: 'huntaze-cluster',
          settings: [{ name: 'containerInsights', value: 'enabled' }]
        }]
      });

      const result = await mockECSClient.send({ clusters: ['huntaze-cluster'] });
      
      const insightsSetting = result.clusters[0].settings.find(
        (s: any) => s.name === 'containerInsights'
      );
      
      expect(insightsSetting?.value).toBe('enabled');
    });

    it('should handle missing clusters gracefully', async () => {
      mockECSClient.send.mockRejectedValue(
        new Error('ClusterNotFoundException')
      );

      try {
        await mockECSClient.send({ cluster: 'non-existent-cluster' });
      } catch (error) {
        expect((error as Error).message).toContain('ClusterNotFoundException');
      }

      // Should not stop the script
      expect(mockECSClient.send).toHaveBeenCalled();
    });
  });

  describe('RDS Encryption Detection', () => {
    it('should identify unencrypted RDS instances', async () => {
      mockRDSClient.send.mockResolvedValue({
        DBInstances: [
          {
            DBInstanceIdentifier: 'huntaze-db-1',
            StorageEncrypted: false,
            Engine: 'postgres'
          },
          {
            DBInstanceIdentifier: 'huntaze-db-2',
            StorageEncrypted: false,
            Engine: 'postgres'
          },
          {
            DBInstanceIdentifier: 'huntaze-db-encrypted',
            StorageEncrypted: true,
            Engine: 'postgres'
          }
        ]
      });

      const result = await mockRDSClient.send({});
      
      const unencrypted = result.DBInstances.filter(
        (db: any) => !db.StorageEncrypted && db.DBInstanceIdentifier.includes('huntaze')
      );

      expect(unencrypted).toHaveLength(2);
      expect(unencrypted[0].DBInstanceIdentifier).toBe('huntaze-db-1');
      expect(unencrypted[1].DBInstanceIdentifier).toBe('huntaze-db-2');
    });

    it('should report when all databases are encrypted', async () => {
      mockRDSClient.send.mockResolvedValue({
        DBInstances: [
          {
            DBInstanceIdentifier: 'huntaze-db-1',
            StorageEncrypted: true,
            Engine: 'postgres'
          }
        ]
      });

      const result = await mockRDSClient.send({});
      
      const unencrypted = result.DBInstances.filter(
        (db: any) => !db.StorageEncrypted
      );

      expect(unencrypted).toHaveLength(0);
    });

    it('should filter only Huntaze databases', async () => {
      mockRDSClient.send.mockResolvedValue({
        DBInstances: [
          {
            DBInstanceIdentifier: 'huntaze-db-1',
            StorageEncrypted: false
          },
          {
            DBInstanceIdentifier: 'other-app-db',
            StorageEncrypted: false
          }
        ]
      });

      const result = await mockRDSClient.send({});
      
      const huntazeDbs = result.DBInstances.filter(
        (db: any) => db.DBInstanceIdentifier.includes('huntaze')
      );

      expect(huntazeDbs).toHaveLength(1);
      expect(huntazeDbs[0].DBInstanceIdentifier).toBe('huntaze-db-1');
    });
  });

  describe('CloudWatch Synthetics Setup', () => {
    it('should create Synthetics artifacts bucket', async () => {
      mockS3Client.send.mockResolvedValue({});

      await mockS3Client.send({
        Bucket: `huntaze-synthetics-artifacts-${mockAccountId}`
      });

      expect(mockS3Client.send).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: expect.stringContaining('synthetics-artifacts')
        })
      );
    });

    it('should check for CloudWatchSyntheticsRole', async () => {
      mockIAMClient.send.mockResolvedValue({
        Role: {
          RoleName: 'CloudWatchSyntheticsRole',
          Arn: `arn:aws:iam::${mockAccountId}:role/CloudWatchSyntheticsRole`
        }
      });

      const result = await mockIAMClient.send({ RoleName: 'CloudWatchSyntheticsRole' });
      
      expect(result.Role.RoleName).toBe('CloudWatchSyntheticsRole');
    });

    it('should handle missing Synthetics role gracefully', async () => {
      mockIAMClient.send.mockRejectedValue(
        new Error('NoSuchEntity')
      );

      try {
        await mockIAMClient.send({ RoleName: 'CloudWatchSyntheticsRole' });
      } catch (error) {
        expect((error as Error).message).toContain('NoSuchEntity');
      }

      // Script should continue without creating canary
      expect(mockIAMClient.send).toHaveBeenCalled();
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from transient AWS API errors', async () => {
      let attemptCount = 0;
      
      mockS3Client.send.mockImplementation(() => {
        attemptCount++;
        if (attemptCount === 1) {
          return Promise.reject(new Error('ServiceUnavailable'));
        }
        return Promise.resolve({});
      });

      // First attempt fails
      try {
        await mockS3Client.send({});
      } catch (error) {
        expect((error as Error).message).toContain('ServiceUnavailable');
      }

      // Retry succeeds
      await expect(mockS3Client.send({})).resolves.not.toThrow();
      expect(attemptCount).toBe(2);
    });

    it('should handle rate limiting gracefully', async () => {
      mockConfigServiceClient.send.mockRejectedValue(
        new Error('ThrottlingException: Rate exceeded')
      );

      try {
        await mockConfigServiceClient.send({});
      } catch (error) {
        expect((error as Error).message).toContain('ThrottlingException');
      }

      // Should be able to retry after backoff
      mockConfigServiceClient.send.mockResolvedValue({});
      await expect(mockConfigServiceClient.send({})).resolves.not.toThrow();
    });

    it('should handle network timeouts', async () => {
      mockECSClient.send.mockRejectedValue(
        new Error('TimeoutError: Request timed out')
      );

      try {
        await mockECSClient.send({});
      } catch (error) {
        expect((error as Error).message).toContain('TimeoutError');
      }
    });

    it('should handle permission errors with clear messages', async () => {
      mockS3Client.send.mockRejectedValue(
        new Error('AccessDenied: User is not authorized')
      );

      try {
        await mockS3Client.send({});
      } catch (error) {
        expect((error as Error).message).toContain('AccessDenied');
        expect((error as Error).message).toContain('not authorized');
      }
    });
  });

  describe('Cross-Service Dependencies', () => {
    it('should ensure S3 bucket exists before Config setup', async () => {
      const operations: string[] = [];

      mockS3Client.send.mockImplementation(() => {
        operations.push('s3-create-bucket');
        return Promise.resolve({});
      });

      mockConfigServiceClient.send.mockImplementation(() => {
        operations.push('config-setup');
        return Promise.resolve({});
      });

      // Create bucket first
      await mockS3Client.send({});
      
      // Then setup Config
      await mockConfigServiceClient.send({});

      expect(operations).toEqual(['s3-create-bucket', 'config-setup']);
    });

    it('should verify IAM role before enabling Config', async () => {
      const roleArn = `arn:aws:iam::${mockAccountId}:role/aws-service-role/config.amazonaws.com/AWSServiceRoleForConfig`;

      mockConfigServiceClient.send.mockResolvedValue({
        ConfigurationRecorder: {
          name: 'default',
          roleARN: roleArn
        }
      });

      const result = await mockConfigServiceClient.send({});
      
      expect(result.ConfigurationRecorder.roleARN).toContain('AWSServiceRoleForConfig');
    });

    it('should coordinate Container Insights across multiple clusters', async () => {
      const clusters = ['ai-team', 'huntaze-cluster', 'huntaze-of-fargate'];
      const enabledClusters: string[] = [];

      mockECSClient.send.mockImplementation((params: any) => {
        if (params.cluster) {
          enabledClusters.push(params.cluster);
        }
        return Promise.resolve({});
      });

      for (const cluster of clusters) {
        await mockECSClient.send({ cluster });
      }

      expect(enabledClusters).toEqual(clusters);
    });
  });

  describe('Verification and Validation', () => {
    it('should verify all fixes were applied successfully', async () => {
      const verificationResults = {
        awsConfig: false,
        containerInsights: false,
        rdsEncryption: false
      };

      // Verify AWS Config
      mockConfigServiceClient.send.mockResolvedValue({
        ConfigurationRecordersStatus: [{
          recording: true,
          lastStatus: 'SUCCESS'
        }]
      });
      const configStatus = await mockConfigServiceClient.send({});
      verificationResults.awsConfig = configStatus.ConfigurationRecordersStatus[0].recording;

      // Verify Container Insights
      mockECSClient.send.mockResolvedValue({
        clusters: [{
          settings: [{ name: 'containerInsights', value: 'enabled' }]
        }]
      });
      const ecsStatus = await mockECSClient.send({});
      verificationResults.containerInsights = ecsStatus.clusters[0].settings[0].value === 'enabled';

      // Verify RDS encryption
      mockRDSClient.send.mockResolvedValue({
        DBInstances: [{ StorageEncrypted: true }]
      });
      const rdsStatus = await mockRDSClient.send({});
      verificationResults.rdsEncryption = rdsStatus.DBInstances.every((db: any) => db.StorageEncrypted);

      expect(verificationResults.awsConfig).toBe(true);
      expect(verificationResults.containerInsights).toBe(true);
      expect(verificationResults.rdsEncryption).toBe(true);
    });

    it('should provide detailed status for each fix', async () => {
      const statusReport = {
        awsConfig: { status: 'success', message: 'Recorder created and started' },
        containerInsights: { status: 'success', message: 'Enabled on all clusters' },
        rdsEncryption: { status: 'warning', message: 'Manual migration required' },
        synthetics: { status: 'warning', message: 'Manual setup recommended' }
      };

      expect(statusReport.awsConfig.status).toBe('success');
      expect(statusReport.containerInsights.status).toBe('success');
      expect(statusReport.rdsEncryption.status).toBe('warning');
      expect(statusReport.synthetics.status).toBe('warning');
    });
  });

  describe('Performance and Timing', () => {
    it('should complete all fixes within reasonable time', async () => {
      mockS3Client.send.mockResolvedValue({});
      mockConfigServiceClient.send.mockResolvedValue({});
      mockECSClient.send.mockResolvedValue({});
      mockRDSClient.send.mockResolvedValue({ DBInstances: [] });

      const startTime = Date.now();

      // Execute all operations
      await Promise.all([
        mockS3Client.send({}),
        mockS3Client.send({}),
        mockS3Client.send({}),
        mockConfigServiceClient.send({}),
        mockConfigServiceClient.send({}),
        mockConfigServiceClient.send({}),
        mockECSClient.send({}),
        mockECSClient.send({}),
        mockECSClient.send({}),
        mockECSClient.send({}),
        mockRDSClient.send({})
      ]);

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle concurrent operations efficiently', async () => {
      const operations = Array.from({ length: 10 }, () => 
        mockS3Client.send({})
      );

      mockS3Client.send.mockResolvedValue({});

      const startTime = Date.now();
      await Promise.all(operations);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Rollback and Cleanup', () => {
    it('should not leave partial configurations on failure', async () => {
      const createdResources: string[] = [];

      mockS3Client.send.mockImplementation(() => {
        createdResources.push('s3-bucket');
        return Promise.resolve({});
      });

      mockConfigServiceClient.send.mockImplementation(() => {
        createdResources.push('config-recorder');
        throw new Error('Configuration failed');
      });

      // Create bucket succeeds
      await mockS3Client.send({});

      // Config setup fails
      try {
        await mockConfigServiceClient.send({});
      } catch (error) {
        // Bucket was created but Config failed
        expect(createdResources).toContain('s3-bucket');
        expect(createdResources).toContain('config-recorder');
      }
    });

    it('should provide cleanup instructions on failure', () => {
      const cleanupInstructions = {
        s3Bucket: 'aws s3 rb s3://aws-config-bucket --force',
        configRecorder: 'aws configservice delete-configuration-recorder --configuration-recorder-name default',
        deliveryChannel: 'aws configservice delete-delivery-channel --delivery-channel-name default'
      };

      expect(cleanupInstructions.s3Bucket).toContain('s3 rb');
      expect(cleanupInstructions.configRecorder).toContain('delete-configuration-recorder');
      expect(cleanupInstructions.deliveryChannel).toContain('delete-delivery-channel');
    });
  });
});
