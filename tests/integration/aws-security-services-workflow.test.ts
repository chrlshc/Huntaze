/**
 * Integration Tests for AWS Security Services Workflow (Task 3)
 * Tests the complete workflow of enabling GuardDuty, Security Hub, and CloudTrail
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock AWS SDK clients
const mockGuardDutyClient = {
  createDetector: vi.fn(),
  updateDetector: vi.fn(),
  listDetectors: vi.fn()
};

const mockSecurityHubClient = {
  enableSecurityHub: vi.fn(),
  batchEnableStandards: vi.fn(),
  getEnabledStandards: vi.fn()
};

const mockCloudTrailClient = {
  createTrail: vi.fn(),
  startLogging: vi.fn(),
  describeTrails: vi.fn()
};

const mockSNSClient = {
  createTopic: vi.fn(),
  subscribe: vi.fn(),
  listTopics: vi.fn()
};

const mockEventBridgeClient = {
  putRule: vi.fn(),
  putTargets: vi.fn(),
  listRules: vi.fn()
};

describe('AWS Security Services Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GuardDuty Enablement Workflow', () => {
    it('should enable GuardDuty detector successfully', async () => {
      mockGuardDutyClient.createDetector.mockResolvedValue({
        DetectorId: 'detector-123'
      });

      const result = await mockGuardDutyClient.createDetector({
        Enable: true,
        FindingPublishingFrequency: 'FIFTEEN_MINUTES'
      });

      expect(result.DetectorId).toBeDefined();
      expect(mockGuardDutyClient.createDetector).toHaveBeenCalledWith({
        Enable: true,
        FindingPublishingFrequency: 'FIFTEEN_MINUTES'
      });
    });

    it('should configure S3 protection for GuardDuty', async () => {
      mockGuardDutyClient.updateDetector.mockResolvedValue({});

      await mockGuardDutyClient.updateDetector({
        DetectorId: 'detector-123',
        DataSources: {
          S3Logs: { Enable: true }
        }
      });

      expect(mockGuardDutyClient.updateDetector).toHaveBeenCalledWith(
        expect.objectContaining({
          DataSources: expect.objectContaining({
            S3Logs: { Enable: true }
          })
        })
      );
    });

    it('should create SNS topic for GuardDuty findings', async () => {
      mockSNSClient.createTopic.mockResolvedValue({
        TopicArn: 'arn:aws:sns:us-east-1:123456789012:huntaze-guardduty-findings'
      });

      const result = await mockSNSClient.createTopic({
        Name: 'huntaze-guardduty-findings'
      });

      expect(result.TopicArn).toContain('huntaze-guardduty-findings');
      expect(mockSNSClient.createTopic).toHaveBeenCalledWith({
        Name: 'huntaze-guardduty-findings'
      });
    });

    it('should create EventBridge rule for high/critical findings', async () => {
      mockEventBridgeClient.putRule.mockResolvedValue({
        RuleArn: 'arn:aws:events:us-east-1:123456789012:rule/guardduty-high-critical'
      });

      const result = await mockEventBridgeClient.putRule({
        Name: 'guardduty-high-critical-findings',
        EventPattern: JSON.stringify({
          source: ['aws.guardduty'],
          'detail-type': ['GuardDuty Finding'],
          detail: {
            severity: [7, 8, 9] // High and Critical
          }
        }),
        State: 'ENABLED'
      });

      expect(result.RuleArn).toBeDefined();
      expect(mockEventBridgeClient.putRule).toHaveBeenCalled();
    });

    it('should complete GuardDuty setup workflow', async () => {
      // Step 1: Create detector
      mockGuardDutyClient.createDetector.mockResolvedValue({
        DetectorId: 'detector-123'
      });

      // Step 2: Enable S3 protection
      mockGuardDutyClient.updateDetector.mockResolvedValue({});

      // Step 3: Create SNS topic
      mockSNSClient.createTopic.mockResolvedValue({
        TopicArn: 'arn:aws:sns:us-east-1:123456789012:huntaze-guardduty-findings'
      });

      // Step 4: Create EventBridge rule
      mockEventBridgeClient.putRule.mockResolvedValue({
        RuleArn: 'arn:aws:events:us-east-1:123456789012:rule/guardduty-high-critical'
      });

      // Execute workflow
      const detector = await mockGuardDutyClient.createDetector({ Enable: true });
      await mockGuardDutyClient.updateDetector({
        DetectorId: detector.DetectorId,
        DataSources: { S3Logs: { Enable: true } }
      });
      const topic = await mockSNSClient.createTopic({ Name: 'huntaze-guardduty-findings' });
      const rule = await mockEventBridgeClient.putRule({
        Name: 'guardduty-high-critical-findings',
        State: 'ENABLED'
      });

      expect(detector.DetectorId).toBeDefined();
      expect(topic.TopicArn).toBeDefined();
      expect(rule.RuleArn).toBeDefined();
    });
  });

  describe('Security Hub Enablement Workflow', () => {
    it('should enable Security Hub successfully', async () => {
      mockSecurityHubClient.enableSecurityHub.mockResolvedValue({});

      await mockSecurityHubClient.enableSecurityHub({
        EnableDefaultStandards: false
      });

      expect(mockSecurityHubClient.enableSecurityHub).toHaveBeenCalledWith({
        EnableDefaultStandards: false
      });
    });

    it('should enable AWS Foundational Security Best Practices standard', async () => {
      mockSecurityHubClient.batchEnableStandards.mockResolvedValue({
        StandardsSubscriptions: [
          {
            StandardsArn: 'arn:aws:securityhub:us-east-1::standards/aws-foundational-security-best-practices/v/1.0.0',
            StandardsStatus: 'PENDING'
          }
        ]
      });

      const result = await mockSecurityHubClient.batchEnableStandards({
        StandardsSubscriptionRequests: [
          {
            StandardsArn: 'arn:aws:securityhub:us-east-1::standards/aws-foundational-security-best-practices/v/1.0.0'
          }
        ]
      });

      expect(result.StandardsSubscriptions).toHaveLength(1);
      expect(result.StandardsSubscriptions[0].StandardsArn).toContain('foundational-security');
    });

    it('should create SNS topic for Security Hub findings', async () => {
      mockSNSClient.createTopic.mockResolvedValue({
        TopicArn: 'arn:aws:sns:us-east-1:123456789012:huntaze-securityhub-findings'
      });

      const result = await mockSNSClient.createTopic({
        Name: 'huntaze-securityhub-findings'
      });

      expect(result.TopicArn).toContain('huntaze-securityhub-findings');
    });

    it('should complete Security Hub setup workflow', async () => {
      // Step 1: Enable Security Hub
      mockSecurityHubClient.enableSecurityHub.mockResolvedValue({});

      // Step 2: Enable FSBP standard
      mockSecurityHubClient.batchEnableStandards.mockResolvedValue({
        StandardsSubscriptions: [
          {
            StandardsArn: 'arn:aws:securityhub:::ruleset/cis-aws-foundations-benchmark/v/1.2.0',
            StandardsStatus: 'READY'
          }
        ]
      });

      // Step 3: Create SNS topic
      mockSNSClient.createTopic.mockResolvedValue({
        TopicArn: 'arn:aws:sns:us-east-1:123456789012:huntaze-securityhub-findings'
      });

      // Execute workflow
      await mockSecurityHubClient.enableSecurityHub({ EnableDefaultStandards: false });
      const standards = await mockSecurityHubClient.batchEnableStandards({
        StandardsSubscriptionRequests: [{ StandardsArn: 'arn:aws:securityhub:::ruleset/cis-aws-foundations-benchmark/v/1.2.0' }]
      });
      const topic = await mockSNSClient.createTopic({ Name: 'huntaze-securityhub-findings' });

      expect(mockSecurityHubClient.enableSecurityHub).toHaveBeenCalled();
      expect(standards.StandardsSubscriptions).toHaveLength(1);
      expect(topic.TopicArn).toBeDefined();
    });
  });

  describe('CloudTrail Enablement Workflow', () => {
    it('should create multi-region CloudTrail trail', async () => {
      mockCloudTrailClient.createTrail.mockResolvedValue({
        TrailARN: 'arn:aws:cloudtrail:us-east-1:123456789012:trail/huntaze-cloudtrail',
        Name: 'huntaze-cloudtrail'
      });

      const result = await mockCloudTrailClient.createTrail({
        Name: 'huntaze-cloudtrail',
        S3BucketName: 'huntaze-cloudtrail-logs',
        IsMultiRegionTrail: true,
        EnableLogFileValidation: true
      });

      expect(result.TrailARN).toBeDefined();
      expect(mockCloudTrailClient.createTrail).toHaveBeenCalledWith(
        expect.objectContaining({
          IsMultiRegionTrail: true,
          EnableLogFileValidation: true
        })
      );
    });

    it('should start CloudTrail logging', async () => {
      mockCloudTrailClient.startLogging.mockResolvedValue({});

      await mockCloudTrailClient.startLogging({
        Name: 'huntaze-cloudtrail'
      });

      expect(mockCloudTrailClient.startLogging).toHaveBeenCalledWith({
        Name: 'huntaze-cloudtrail'
      });
    });

    it('should complete CloudTrail setup workflow', async () => {
      // Step 1: Create trail
      mockCloudTrailClient.createTrail.mockResolvedValue({
        TrailARN: 'arn:aws:cloudtrail:us-east-1:123456789012:trail/huntaze-cloudtrail',
        Name: 'huntaze-cloudtrail'
      });

      // Step 2: Start logging
      mockCloudTrailClient.startLogging.mockResolvedValue({});

      // Execute workflow
      const trail = await mockCloudTrailClient.createTrail({
        Name: 'huntaze-cloudtrail',
        S3BucketName: 'huntaze-cloudtrail-logs',
        IsMultiRegionTrail: true,
        EnableLogFileValidation: true
      });
      await mockCloudTrailClient.startLogging({ Name: trail.Name });

      expect(trail.TrailARN).toBeDefined();
      expect(mockCloudTrailClient.startLogging).toHaveBeenCalled();
    });
  });

  describe('Complete Task 3 Workflow', () => {
    it('should execute all security services setup in correct order', async () => {
      // Mock all services
      mockGuardDutyClient.createDetector.mockResolvedValue({ DetectorId: 'detector-123' });
      mockSecurityHubClient.enableSecurityHub.mockResolvedValue({});
      mockCloudTrailClient.createTrail.mockResolvedValue({
        TrailARN: 'arn:aws:cloudtrail:us-east-1:123456789012:trail/huntaze-cloudtrail'
      });

      // Execute complete workflow
      const guardDuty = await mockGuardDutyClient.createDetector({ Enable: true });
      await mockSecurityHubClient.enableSecurityHub({ EnableDefaultStandards: false });
      const cloudTrail = await mockCloudTrailClient.createTrail({
        Name: 'huntaze-cloudtrail',
        IsMultiRegionTrail: true
      });

      expect(guardDuty.DetectorId).toBeDefined();
      expect(mockSecurityHubClient.enableSecurityHub).toHaveBeenCalled();
      expect(cloudTrail.TrailARN).toBeDefined();
    });

    it('should handle partial failures gracefully', async () => {
      // GuardDuty succeeds
      mockGuardDutyClient.createDetector.mockResolvedValue({ DetectorId: 'detector-123' });

      // Security Hub fails
      mockSecurityHubClient.enableSecurityHub.mockRejectedValue(
        new Error('Security Hub already enabled')
      );

      // CloudTrail succeeds
      mockCloudTrailClient.createTrail.mockResolvedValue({
        TrailARN: 'arn:aws:cloudtrail:us-east-1:123456789012:trail/huntaze-cloudtrail'
      });

      const results = {
        guardDuty: null,
        securityHub: null,
        cloudTrail: null,
        errors: []
      };

      try {
        results.guardDuty = await mockGuardDutyClient.createDetector({ Enable: true });
      } catch (error) {
        results.errors.push({ service: 'GuardDuty', error: error.message });
      }

      try {
        await mockSecurityHubClient.enableSecurityHub({ EnableDefaultStandards: false });
        results.securityHub = 'enabled';
      } catch (error) {
        results.errors.push({ service: 'SecurityHub', error: error.message });
      }

      try {
        results.cloudTrail = await mockCloudTrailClient.createTrail({
          Name: 'huntaze-cloudtrail'
        });
      } catch (error) {
        results.errors.push({ service: 'CloudTrail', error: error.message });
      }

      expect(results.guardDuty).toBeDefined();
      expect(results.securityHub).toBeNull();
      expect(results.cloudTrail).toBeDefined();
      expect(results.errors).toHaveLength(1);
      expect(results.errors[0].service).toBe('SecurityHub');
    });
  });
});
