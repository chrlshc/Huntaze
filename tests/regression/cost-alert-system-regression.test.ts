/**
 * Regression Tests for Cost Alert System
 * Ensures future changes don't break existing functionality
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CostAlertManager, AlertThreshold } from '@/lib/services/cost-alert-manager';
import { CostAlert } from '@/lib/services/cost-monitoring-service';

// Mock AWS clients
const mockSNSClient = { send: vi.fn() };
const mockSESClient = { send: vi.fn() };
const mockDynamoDBClient = { send: vi.fn() };

global.fetch = vi.fn();

vi.mock('@aws-sdk/client-sns', () => ({
  SNSClient: vi.fn(() => mockSNSClient),
  PublishCommand: vi.fn((params) => params)
}));

vi.mock('@aws-sdk/client-ses', () => ({
  SESClient: vi.fn(() => mockSESClient),
  SendEmailCommand: vi.fn((params) => params)
}));

vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: vi.fn(() => mockDynamoDBClient),
  PutItemCommand: vi.fn((params) => params),
  QueryCommand: vi.fn((params) => params),
  UpdateItemCommand: vi.fn((params) => params)
}));

describe('Cost Alert System Regression Tests', () => {
  let alertManager: CostAlertManager;

  beforeEach(() => {
    alertManager = new CostAlertManager('us-east-1');
    vi.clearAllMocks();
    
    mockDynamoDBClient.send.mockResolvedValue({ Items: [] });
    mockSNSClient.send.mockResolvedValue({});
    mockSESClient.send.mockResolvedValue({});
    (global.fetch as any).mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Backward Compatibility', () => {
    it('should maintain existing threshold structure', async () => {
      const threshold = await alertManager.setAlertThreshold({
        type: 'daily',
        threshold: 100,
        severity: 'warning',
        enabled: true,
        notificationChannels: ['email']
      });

      // Verify structure hasn't changed
      expect(threshold).toHaveProperty('id');
      expect(threshold).toHaveProperty('type');
      expect(threshold).toHaveProperty('threshold');
      expect(threshold).toHaveProperty('severity');
      expect(threshold).toHaveProperty('enabled');
      expect(threshold).toHaveProperty('notificationChannels');
      expect(threshold).toHaveProperty('createdAt');
      expect(threshold).toHaveProperty('updatedAt');
    });

    it('should maintain alert structure', async () => {
      const alert: CostAlert = {
        id: 'alert-regression',
        type: 'daily_cost_exceeded',
        severity: 'warning',
        threshold: 100,
        currentValue: 125,
        message: 'Test',
        timestamp: new Date(),
        acknowledged: false
      };

      const thresholds: AlertThreshold[] = [{
        id: 'threshold-1',
        type: 'daily',
        threshold: 100,
        severity: 'warning',
        enabled: true,
        notificationChannels: ['email'],
        createdAt: new Date(),
        updatedAt: new Date()
      }];

      mockSESClient.send.mockResolvedValue({});
      mockDynamoDBClient.send.mockResolvedValue({});

      await alertManager.sendAlert(alert, thresholds);

      // Verify alert was processed
      expect(mockSESClient.send).toHaveBeenCalled();
    });

    it('should maintain forecast structure', async () => {
      const forecast = await alertManager.generateCostForecast(
        'user-123',
        'daily',
        [10, 20, 30, 40, 50]
      );

      // Verify structure hasn't changed
      expect(forecast).toHaveProperty('period');
      expect(forecast).toHaveProperty('currentCost');
      expect(forecast).toHaveProperty('projectedCost');
      expect(forecast).toHaveProperty('confidence');
      expect(forecast).toHaveProperty('willExceedThreshold');
      expect(forecast).toHaveProperty('basedOnDays');
    });
  });

  describe('API Contract Stability', () => {
    it('should maintain setAlertThreshold signature', async () => {
      // Original signature should still work
      const result = await alertManager.setAlertThreshold({
        type: 'daily',
        threshold: 100,
        severity: 'warning',
        enabled: true,
        notificationChannels: ['email']
      });

      expect(result).toBeDefined();
      expect(typeof result.id).toBe('string');
    });

    it('should maintain sendAlert signature', async () => {
      const alert: CostAlert = {
        id: 'test',
        type: 'daily_cost_exceeded',
        severity: 'warning',
        threshold: 100,
        currentValue: 125,
        message: 'Test',
        timestamp: new Date(),
        acknowledged: false
      };

      mockDynamoDBClient.send.mockResolvedValue({});

      // Original signature should still work
      await expect(alertManager.sendAlert(alert, [])).resolves.not.toThrow();
    });

    it('should maintain generateCostForecast signature', async () => {
      // Original signature should still work
      const result = await alertManager.generateCostForecast(
        'user-123',
        'daily',
        [10, 20, 30]
      );

      expect(result).toBeDefined();
      expect(typeof result.projectedCost).toBe('number');
    });
  });

  describe('Data Format Stability', () => {
    it('should maintain DynamoDB item format for thresholds', async () => {
      await alertManager.setAlertThreshold({
        userId: 'user-123',
        type: 'daily',
        provider: 'azure',
        threshold: 100,
        severity: 'warning',
        enabled: true,
        notificationChannels: ['email', 'slack']
      });

      const putCall = mockDynamoDBClient.send.mock.calls[0][0];
      
      // Verify DynamoDB format hasn't changed
      expect(putCall.Item).toHaveProperty('id');
      expect(putCall.Item).toHaveProperty('type');
      expect(putCall.Item).toHaveProperty('threshold');
      expect(putCall.Item).toHaveProperty('severity');
      expect(putCall.Item).toHaveProperty('enabled');
      expect(putCall.Item).toHaveProperty('notificationChannels');
      expect(putCall.Item).toHaveProperty('userId');
      expect(putCall.Item).toHaveProperty('provider');
    });

    it('should maintain email format', async () => {
      const alert: CostAlert = {
        id: 'alert-email-format',
        type: 'daily_cost_exceeded',
        severity: 'critical',
        threshold: 100,
        currentValue: 150,
        message: 'Critical alert',
        timestamp: new Date(),
        acknowledged: false
      };

      const thresholds: AlertThreshold[] = [{
        id: 'threshold-1',
        type: 'daily',
        threshold: 100,
        severity: 'critical',
        enabled: true,
        notificationChannels: ['email'],
        createdAt: new Date(),
        updatedAt: new Date()
      }];

      mockSESClient.send.mockResolvedValue({});
      mockDynamoDBClient.send.mockResolvedValue({});

      await alertManager.sendAlert(alert, thresholds);

      const emailCommand = mockSESClient.send.mock.calls[0][0];
      
      // Verify email structure
      expect(emailCommand).toHaveProperty('Message');
      expect(emailCommand.Message).toHaveProperty('Subject');
      expect(emailCommand.Message).toHaveProperty('Body');
      expect(emailCommand.Message.Body).toHaveProperty('Html');
      expect(emailCommand.Message.Body).toHaveProperty('Text');
    });

    it('should maintain Slack payload format', async () => {
      const alert: CostAlert = {
        id: 'alert-slack-format',
        type: 'daily_cost_exceeded',
        severity: 'warning',
        threshold: 100,
        currentValue: 120,
        message: 'Test',
        timestamp: new Date(),
        acknowledged: false
      };

      const thresholds: AlertThreshold[] = [{
        id: 'threshold-1',
        type: 'daily',
        threshold: 100,
        severity: 'warning',
        enabled: true,
        notificationChannels: ['slack'],
        createdAt: new Date(),
        updatedAt: new Date()
      }];

      process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
      (global.fetch as any).mockResolvedValue({ ok: true });
      mockDynamoDBClient.send.mockResolvedValue({});

      await alertManager.sendAlert(alert, thresholds);

      const fetchCall = (global.fetch as any).mock.calls[0];
      const payload = JSON.parse(fetchCall[1].body);

      // Verify Slack format
      expect(payload).toHaveProperty('text');
      expect(payload).toHaveProperty('attachments');
      expect(payload.attachments[0]).toHaveProperty('color');
      expect(payload.attachments[0]).toHaveProperty('fields');
    });
  });

  describe('Behavior Consistency', () => {
    it('should maintain rate limiting behavior', async () => {
      const alert: CostAlert = {
        id: 'alert-rate-1',
        type: 'daily_cost_exceeded',
        severity: 'warning',
        threshold: 100,
        currentValue: 125,
        message: 'Test',
        timestamp: new Date(),
        acknowledged: false,
        userId: 'user-rate'
      };

      const thresholds: AlertThreshold[] = [{
        id: 'threshold-1',
        type: 'daily',
        threshold: 100,
        severity: 'warning',
        enabled: true,
        notificationChannels: ['email'],
        createdAt: new Date(),
        updatedAt: new Date()
      }];

      mockSESClient.send.mockResolvedValue({});
      mockDynamoDBClient.send.mockResolvedValue({});

      // First alert
      await alertManager.sendAlert(alert, thresholds);
      expect(mockSESClient.send).toHaveBeenCalledTimes(1);

      // Second alert (should be rate limited)
      await alertManager.sendAlert({ ...alert, id: 'alert-rate-2' }, thresholds);
      expect(mockSESClient.send).toHaveBeenCalledTimes(1); // Still 1
    });

    it('should maintain threshold filtering behavior', async () => {
      const alert: CostAlert = {
        id: 'alert-filter',
        type: 'daily_cost_exceeded',
        severity: 'info',
        threshold: 50,
        currentValue: 75,
        message: 'Test',
        timestamp: new Date(),
        acknowledged: false
      };

      const thresholds: AlertThreshold[] = [
        {
          id: 'threshold-high',
          type: 'daily',
          threshold: 100, // Higher than current
          severity: 'warning',
          enabled: true,
          notificationChannels: ['email'],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'threshold-low',
          type: 'daily',
          threshold: 50, // Lower than current
          severity: 'info',
          enabled: true,
          notificationChannels: ['email'],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockSESClient.send.mockResolvedValue({});
      mockDynamoDBClient.send.mockResolvedValue({});

      await alertManager.sendAlert(alert, thresholds);

      // Should only send for threshold-low
      expect(mockSESClient.send).toHaveBeenCalledTimes(1);
    });

    it('should maintain forecasting accuracy', async () => {
      const linearCosts = [10, 20, 30, 40, 50]; // Perfect linear growth
      
      mockDynamoDBClient.send.mockResolvedValue({ Items: [] });

      const forecast = await alertManager.generateCostForecast(
        'user-123',
        'daily',
        linearCosts
      );

      // Should predict next value around 60
      expect(forecast.projectedCost).toBeGreaterThan(50);
      expect(forecast.projectedCost).toBeLessThan(70);
      expect(forecast.confidence).toBeGreaterThan(0.8); // High confidence for linear data
    });
  });

  describe('Error Handling Consistency', () => {
    it('should maintain graceful degradation on channel failures', async () => {
      const alert: CostAlert = {
        id: 'alert-error',
        type: 'daily_cost_exceeded',
        severity: 'warning',
        threshold: 100,
        currentValue: 125,
        message: 'Test',
        timestamp: new Date(),
        acknowledged: false
      };

      const thresholds: AlertThreshold[] = [{
        id: 'threshold-1',
        type: 'daily',
        threshold: 100,
        severity: 'warning',
        enabled: true,
        notificationChannels: ['email', 'slack'],
        createdAt: new Date(),
        updatedAt: new Date()
      }];

      process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
      mockSESClient.send.mockRejectedValue(new Error('Email error'));
      (global.fetch as any).mockResolvedValue({ ok: true });
      mockDynamoDBClient.send.mockResolvedValue({});

      // Should not throw
      await expect(alertManager.sendAlert(alert, thresholds)).resolves.not.toThrow();

      // Slack should still be sent
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should maintain error handling for missing config', async () => {
      const alert: CostAlert = {
        id: 'alert-no-config',
        type: 'daily_cost_exceeded',
        severity: 'warning',
        threshold: 100,
        currentValue: 125,
        message: 'Test',
        timestamp: new Date(),
        acknowledged: false
      };

      const thresholds: AlertThreshold[] = [{
        id: 'threshold-1',
        type: 'daily',
        threshold: 100,
        severity: 'warning',
        enabled: true,
        notificationChannels: ['slack', 'sns'],
        createdAt: new Date(),
        updatedAt: new Date()
      }];

      // No config
      delete process.env.SLACK_WEBHOOK_URL;
      delete process.env.COST_ALERTS_SNS_TOPIC;
      mockDynamoDBClient.send.mockResolvedValue({});

      // Should not throw
      await expect(alertManager.sendAlert(alert, thresholds)).resolves.not.toThrow();
    });
  });

  describe('Performance Regression', () => {
    it('should maintain alert sending performance', async () => {
      const alert: CostAlert = {
        id: 'alert-perf',
        type: 'daily_cost_exceeded',
        severity: 'warning',
        threshold: 100,
        currentValue: 125,
        message: 'Test',
        timestamp: new Date(),
        acknowledged: false
      };

      const thresholds: AlertThreshold[] = [{
        id: 'threshold-1',
        type: 'daily',
        threshold: 100,
        severity: 'warning',
        enabled: true,
        notificationChannels: ['email'],
        createdAt: new Date(),
        updatedAt: new Date()
      }];

      mockSESClient.send.mockResolvedValue({});
      mockDynamoDBClient.send.mockResolvedValue({});

      const startTime = Date.now();
      await alertManager.sendAlert(alert, thresholds);
      const duration = Date.now() - startTime;

      // Should complete quickly
      expect(duration).toBeLessThan(500);
    });

    it('should maintain forecasting performance', async () => {
      const costs = Array.from({ length: 100 }, (_, i) => 10 + i);
      
      mockDynamoDBClient.send.mockResolvedValue({ Items: [] });

      const startTime = Date.now();
      await alertManager.generateCostForecast('user-123', 'daily', costs);
      const duration = Date.now() - startTime;

      // Should complete quickly even with 100 data points
      expect(duration).toBeLessThan(200);
    });
  });
});
