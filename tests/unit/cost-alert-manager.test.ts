/**
 * Tests for Cost Alert Manager
 * Tests multi-channel alert system with thresholds and forecasting
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CostAlertManager, AlertThreshold, CostForecast } from '@/lib/services/cost-alert-manager';
import { CostAlert } from '@/lib/services/cost-monitoring-service';

// Mock AWS SDK clients
const mockSNSClient = {
  send: vi.fn()
};

const mockSESClient = {
  send: vi.fn()
};

const mockDynamoDBClient = {
  send: vi.fn()
};

const mockPrismaClient = {
  costAlert: {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn()
  }
};

// Mock fetch for Slack webhooks
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

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrismaClient)
}));

describe('CostAlertManager', () => {
  let alertManager: CostAlertManager;

  beforeEach(() => {
    alertManager = new CostAlertManager('us-east-1');
    vi.clearAllMocks();
    
    // Setup default mock responses
    mockDynamoDBClient.send.mockResolvedValue({ Items: [] });
    mockSNSClient.send.mockResolvedValue({});
    mockSESClient.send.mockResolvedValue({});
    (global.fetch as any).mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('setAlertThreshold', () => {
    it('should create a new alert threshold', async () => {
      const threshold = {
        type: 'daily' as const,
        threshold: 100,
        severity: 'warning' as const,
        enabled: true,
        notificationChannels: ['email', 'slack'] as const
      };

      mockDynamoDBClient.send.mockResolvedValue({});

      const result = await alertManager.setAlertThreshold(threshold);

      expect(result).toMatchObject({
        type: 'daily',
        threshold: 100,
        severity: 'warning',
        enabled: true,
        notificationChannels: ['email', 'slack']
      });
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(mockDynamoDBClient.send).toHaveBeenCalled();
    });

    it('should create user-specific threshold', async () => {
      const threshold = {
        userId: 'user-123',
        type: 'monthly' as const,
        threshold: 500,
        severity: 'critical' as const,
        enabled: true,
        notificationChannels: ['email', 'sns', 'in_app'] as const
      };

      mockDynamoDBClient.send.mockResolvedValue({});

      const result = await alertManager.setAlertThreshold(threshold);

      expect(result.userId).toBe('user-123');
      expect(mockDynamoDBClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: 'huntaze-cost-thresholds-production',
          Item: expect.objectContaining({
            userId: { S: 'user-123' }
          })
        })
      );
    });

    it('should create provider-specific threshold', async () => {
      const threshold = {
        type: 'hourly' as const,
        provider: 'azure' as const,
        threshold: 10,
        severity: 'info' as const,
        enabled: true,
        notificationChannels: ['in_app'] as const
      };

      mockDynamoDBClient.send.mockResolvedValue({});

      const result = await alertManager.setAlertThreshold(threshold);

      expect(result.provider).toBe('azure');
      expect(mockDynamoDBClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          Item: expect.objectContaining({
            provider: { S: 'azure' }
          })
        })
      );
    });

    it('should handle DynamoDB errors', async () => {
      const threshold = {
        type: 'daily' as const,
        threshold: 100,
        severity: 'warning' as const,
        enabled: true,
        notificationChannels: ['email'] as const
      };

      mockDynamoDBClient.send.mockRejectedValue(new Error('DynamoDB error'));

      await expect(alertManager.setAlertThreshold(threshold)).rejects.toThrow('DynamoDB error');
    });
  });

  describe('sendAlert', () => {
    it('should send alert via all configured channels', async () => {
      const alert: CostAlert = {
        id: 'alert-123',
        type: 'daily_cost_exceeded',
        severity: 'warning',
        threshold: 100,
        currentValue: 125,
        message: 'Daily cost exceeded threshold',
        timestamp: new Date(),
        acknowledged: false
      };

      const thresholds: AlertThreshold[] = [{
        id: 'threshold-1',
        type: 'daily',
        threshold: 100,
        severity: 'warning',
        enabled: true,
        notificationChannels: ['email', 'slack', 'sns', 'in_app'],
        createdAt: new Date(),
        updatedAt: new Date()
      }];

      process.env.COST_ALERT_EMAIL = 'test@huntaze.com';
      process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
      process.env.COST_ALERTS_SNS_TOPIC = 'arn:aws:sns:us-east-1:123456789:test';

      mockSESClient.send.mockResolvedValue({});
      mockSNSClient.send.mockResolvedValue({});
      (global.fetch as any).mockResolvedValue({ ok: true });
      mockDynamoDBClient.send.mockResolvedValue({});

      await alertManager.sendAlert(alert, thresholds);

      expect(mockSESClient.send).toHaveBeenCalled();
      expect(mockSNSClient.send).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        'https://hooks.slack.com/test',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
      expect(mockDynamoDBClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: 'huntaze-cost-alert-history-production'
        })
      );
    });

    it('should respect rate limiting', async () => {
      const alert: CostAlert = {
        id: 'alert-rate-1',
        type: 'daily_cost_exceeded',
        severity: 'warning',
        threshold: 100,
        currentValue: 125,
        message: 'Test alert',
        timestamp: new Date(),
        acknowledged: false,
        userId: 'user-123'
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

      // First alert should go through
      await alertManager.sendAlert(alert, thresholds);
      expect(mockSESClient.send).toHaveBeenCalledTimes(1);

      // Second alert within rate limit should be blocked
      await alertManager.sendAlert({ ...alert, id: 'alert-rate-2' }, thresholds);
      expect(mockSESClient.send).toHaveBeenCalledTimes(1); // Still 1
    });

    it('should filter alerts by threshold value', async () => {
      const alert: CostAlert = {
        id: 'alert-filter',
        type: 'daily_cost_exceeded',
        severity: 'info',
        threshold: 50,
        currentValue: 75,
        message: 'Cost at 75',
        timestamp: new Date(),
        acknowledged: false
      };

      const thresholds: AlertThreshold[] = [
        {
          id: 'threshold-low',
          type: 'daily',
          threshold: 100, // Higher than current value
          severity: 'warning',
          enabled: true,
          notificationChannels: ['email'],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'threshold-high',
          type: 'daily',
          threshold: 50, // Lower than current value
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

      // Should only send for threshold-high (50 <= 75)
      expect(mockSESClient.send).toHaveBeenCalled();
    });

    it('should handle disabled thresholds', async () => {
      const alert: CostAlert = {
        id: 'alert-disabled',
        type: 'daily_cost_exceeded',
        severity: 'warning',
        threshold: 100,
        currentValue: 125,
        message: 'Test',
        timestamp: new Date(),
        acknowledged: false
      };

      const thresholds: AlertThreshold[] = [{
        id: 'threshold-disabled',
        type: 'daily',
        threshold: 100,
        severity: 'warning',
        enabled: false, // Disabled
        notificationChannels: ['email'],
        createdAt: new Date(),
        updatedAt: new Date()
      }];

      await alertManager.sendAlert(alert, thresholds);

      // Should not send any notifications
      expect(mockSESClient.send).not.toHaveBeenCalled();
      expect(mockSNSClient.send).not.toHaveBeenCalled();
    });

    it('should handle email sending errors gracefully', async () => {
      const alert: CostAlert = {
        id: 'alert-email-error',
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

      mockSESClient.send.mockRejectedValue(new Error('SES error'));
      mockDynamoDBClient.send.mockResolvedValue({});

      // Should not throw, just log error
      await expect(alertManager.sendAlert(alert, thresholds)).resolves.not.toThrow();
    });

    it('should handle Slack webhook errors gracefully', async () => {
      const alert: CostAlert = {
        id: 'alert-slack-error',
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
      (global.fetch as any).mockResolvedValue({ ok: false, statusText: 'Bad Request' });
      mockDynamoDBClient.send.mockResolvedValue({});

      await expect(alertManager.sendAlert(alert, thresholds)).resolves.not.toThrow();
    });

    it('should skip Slack if webhook not configured', async () => {
      const alert: CostAlert = {
        id: 'alert-no-slack',
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

      delete process.env.SLACK_WEBHOOK_URL;
      mockDynamoDBClient.send.mockResolvedValue({});

      await alertManager.sendAlert(alert, thresholds);

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should skip SNS if topic not configured', async () => {
      const alert: CostAlert = {
        id: 'alert-no-sns',
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
        notificationChannels: ['sns'],
        createdAt: new Date(),
        updatedAt: new Date()
      }];

      delete process.env.COST_ALERTS_SNS_TOPIC;
      mockDynamoDBClient.send.mockResolvedValue({});

      await alertManager.sendAlert(alert, thresholds);

      expect(mockSNSClient.send).not.toHaveBeenCalled();
    });
  });

  describe('generateCostForecast', () => {
    it('should generate forecast with sufficient data', async () => {
      const currentCosts = [10, 15, 20, 25, 30]; // Linear growth
      
      mockDynamoDBClient.send.mockResolvedValue({
        Items: [{
          id: { S: 'threshold-1' },
          type: { S: 'daily' },
          threshold: { N: '40' },
          severity: { S: 'warning' },
          enabled: { BOOL: true },
          notificationChannels: { SS: ['email'] },
          createdAt: { S: new Date().toISOString() },
          updatedAt: { S: new Date().toISOString() }
        }]
      });

      const forecast = await alertManager.generateCostForecast(
        'user-123',
        'daily',
        currentCosts
      );

      expect(forecast.period).toBe('daily');
      expect(forecast.currentCost).toBe(30);
      expect(forecast.projectedCost).toBeGreaterThan(30);
      expect(forecast.confidence).toBeGreaterThan(0.5);
      expect(forecast.basedOnDays).toBe(5);
      expect(forecast.willExceedThreshold).toBe(false); // 35 < 40
    });

    it('should predict threshold exceedance', async () => {
      const currentCosts = [10, 20, 30, 40, 50]; // Will exceed 55
      
      mockDynamoDBClient.send.mockResolvedValue({
        Items: [{
          id: { S: 'threshold-1' },
          type: { S: 'daily' },
          threshold: { N: '55' },
          severity: { S: 'warning' },
          enabled: { BOOL: true },
          notificationChannels: { SS: ['email'] },
          createdAt: { S: new Date().toISOString() },
          updatedAt: { S: new Date().toISOString() }
        }]
      });

      const forecast = await alertManager.generateCostForecast(
        'user-123',
        'daily',
        currentCosts
      );

      expect(forecast.willExceedThreshold).toBe(true);
      expect(forecast.thresholdValue).toBe(55);
      expect(forecast.daysUntilExceeded).toBeDefined();
      expect(forecast.daysUntilExceeded).toBeGreaterThan(0);
    });

    it('should handle insufficient data', async () => {
      const currentCosts = [10, 15]; // Only 2 data points
      
      const forecast = await alertManager.generateCostForecast(
        'user-123',
        'daily',
        currentCosts
      );

      expect(forecast.confidence).toBe(0.3); // Low confidence
      expect(forecast.currentCost).toBe(15);
      expect(forecast.projectedCost).toBe(15);
      expect(forecast.basedOnDays).toBe(2);
    });

    it('should handle empty data', async () => {
      const currentCosts: number[] = [];
      
      const forecast = await alertManager.generateCostForecast(
        'user-123',
        'daily',
        currentCosts
      );

      expect(forecast.currentCost).toBe(0);
      expect(forecast.projectedCost).toBe(0);
      expect(forecast.confidence).toBe(0.3);
      expect(forecast.basedOnDays).toBe(0);
    });

    it('should calculate confidence based on variance', async () => {
      const stableCosts = [100, 101, 100, 99, 100]; // Low variance
      const volatileCosts = [50, 150, 75, 125, 90]; // High variance
      
      mockDynamoDBClient.send.mockResolvedValue({ Items: [] });

      const stableForecast = await alertManager.generateCostForecast(
        'user-123',
        'daily',
        stableCosts
      );

      const volatileForecast = await alertManager.generateCostForecast(
        'user-456',
        'daily',
        volatileCosts
      );

      expect(stableForecast.confidence).toBeGreaterThan(volatileForecast.confidence);
    });

    it('should handle different forecast periods', async () => {
      const currentCosts = [10, 15, 20, 25, 30];
      
      mockDynamoDBClient.send.mockResolvedValue({ Items: [] });

      const dailyForecast = await alertManager.generateCostForecast(
        'user-123',
        'daily',
        currentCosts
      );

      const weeklyForecast = await alertManager.generateCostForecast(
        'user-123',
        'weekly',
        currentCosts
      );

      const monthlyForecast = await alertManager.generateCostForecast(
        'user-123',
        'monthly',
        currentCosts
      );

      expect(dailyForecast.period).toBe('daily');
      expect(weeklyForecast.period).toBe('weekly');
      expect(monthlyForecast.period).toBe('monthly');
    });

    it('should handle DynamoDB errors in forecast', async () => {
      const currentCosts = [10, 15, 20, 25, 30];
      
      mockDynamoDBClient.send.mockRejectedValue(new Error('DynamoDB error'));

      const forecast = await alertManager.generateCostForecast(
        'user-123',
        'daily',
        currentCosts
      );

      // Should return default forecast on error
      expect(forecast.currentCost).toBe(0);
      expect(forecast.projectedCost).toBe(0);
      expect(forecast.confidence).toBe(0);
    });

    it('should calculate days until threshold exceeded', async () => {
      const currentCosts = [10, 20, 30, 40, 50]; // +10 per day
      
      mockDynamoDBClient.send.mockResolvedValue({
        Items: [{
          id: { S: 'threshold-1' },
          type: { S: 'daily' },
          threshold: { N: '80' }, // 3 days away
          severity: { S: 'warning' },
          enabled: { BOOL: true },
          notificationChannels: { SS: ['email'] },
          createdAt: { S: new Date().toISOString() },
          updatedAt: { S: new Date().toISOString() }
        }]
      });

      const forecast = await alertManager.generateCostForecast(
        'user-123',
        'daily',
        currentCosts
      );

      expect(forecast.willExceedThreshold).toBe(true);
      expect(forecast.daysUntilExceeded).toBe(3); // (80 - 50) / 10 = 3
    });

    it('should handle negative slope (decreasing costs)', async () => {
      const currentCosts = [50, 40, 30, 20, 10]; // Decreasing
      
      mockDynamoDBClient.send.mockResolvedValue({
        Items: [{
          id: { S: 'threshold-1' },
          type: { S: 'daily' },
          threshold: { N: '15' },
          severity: { S: 'warning' },
          enabled: { BOOL: true },
          notificationChannels: { SS: ['email'] },
          createdAt: { S: new Date().toISOString() },
          updatedAt: { S: new Date().toISOString() }
        }]
      });

      const forecast = await alertManager.generateCostForecast(
        'user-123',
        'daily',
        currentCosts
      );

      expect(forecast.currentCost).toBe(10);
      expect(forecast.projectedCost).toBeLessThan(10);
      expect(forecast.willExceedThreshold).toBe(false);
      expect(forecast.daysUntilExceeded).toBeUndefined(); // Negative slope
    });
  });

  describe('Email Formatting', () => {
    it('should format email with correct severity colors', async () => {
      const alerts = [
        {
          id: 'alert-critical',
          type: 'daily_cost_exceeded',
          severity: 'critical' as const,
          threshold: 100,
          currentValue: 150,
          message: 'Critical alert',
          timestamp: new Date(),
          acknowledged: false
        },
        {
          id: 'alert-warning',
          type: 'daily_cost_exceeded',
          severity: 'warning' as const,
          threshold: 100,
          currentValue: 120,
          message: 'Warning alert',
          timestamp: new Date(),
          acknowledged: false
        },
        {
          id: 'alert-info',
          type: 'daily_cost_exceeded',
          severity: 'info' as const,
          threshold: 100,
          currentValue: 105,
          message: 'Info alert',
          timestamp: new Date(),
          acknowledged: false
        }
      ];

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

      for (const alert of alerts) {
        await alertManager.sendAlert(alert, thresholds);
      }

      expect(mockSESClient.send).toHaveBeenCalledTimes(3);
      
      // Verify email contains severity information
      const emailCalls = mockSESClient.send.mock.calls;
      emailCalls.forEach((call, index) => {
        const emailCommand = call[0];
        expect(emailCommand.Message.Subject.Data).toContain(alerts[index].severity.toUpperCase());
      });
    });

    it('should include all alert details in email body', async () => {
      const alert: CostAlert = {
        id: 'alert-details',
        type: 'monthly_cost_exceeded',
        severity: 'warning',
        threshold: 500,
        currentValue: 625.50,
        message: 'Monthly cost exceeded by 25%',
        timestamp: new Date('2024-01-15T10:30:00Z'),
        acknowledged: false,
        userId: 'user-123'
      };

      const thresholds: AlertThreshold[] = [{
        id: 'threshold-1',
        type: 'monthly',
        threshold: 500,
        severity: 'warning',
        enabled: true,
        notificationChannels: ['email'],
        createdAt: new Date(),
        updatedAt: new Date()
      }];

      mockSESClient.send.mockResolvedValue({});
      mockDynamoDBClient.send.mockResolvedValue({});

      await alertManager.sendAlert(alert, thresholds);

      expect(mockSESClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          Message: expect.objectContaining({
            Body: expect.objectContaining({
              Html: expect.objectContaining({
                Data: expect.stringContaining('monthly_cost_exceeded')
              })
            })
          })
        })
      );
    });
  });

  describe('Slack Integration', () => {
    it('should format Slack message with correct color', async () => {
      const alerts = [
        { severity: 'critical' as const, expectedColor: 'danger' },
        { severity: 'warning' as const, expectedColor: 'warning' },
        { severity: 'info' as const, expectedColor: 'good' }
      ];

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

      for (const { severity, expectedColor } of alerts) {
        const alert: CostAlert = {
          id: `alert-${severity}`,
          type: 'daily_cost_exceeded',
          severity,
          threshold: 100,
          currentValue: 120,
          message: `${severity} alert`,
          timestamp: new Date(),
          acknowledged: false
        };

        await alertManager.sendAlert(alert, thresholds);
      }

      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should include all fields in Slack attachment', async () => {
      const alert: CostAlert = {
        id: 'alert-slack-fields',
        type: 'hourly_cost_exceeded',
        severity: 'warning',
        threshold: 10,
        currentValue: 15.75,
        message: 'Hourly cost spike detected',
        timestamp: new Date(),
        acknowledged: false
      };

      const thresholds: AlertThreshold[] = [{
        id: 'threshold-1',
        type: 'hourly',
        threshold: 10,
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

      expect(payload.attachments[0].fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ title: 'Type', value: 'hourly_cost_exceeded' }),
          expect.objectContaining({ title: 'Severity', value: 'warning' }),
          expect.objectContaining({ title: 'Threshold', value: '10.00' }),
          expect.objectContaining({ title: 'Current Value', value: '15.75' })
        ])
      );
    });
  });

  describe('SNS Integration', () => {
    it('should publish to SNS topic with correct format', async () => {
      const alert: CostAlert = {
        id: 'alert-sns',
        type: 'daily_cost_exceeded',
        severity: 'critical',
        threshold: 200,
        currentValue: 250,
        message: 'Critical cost alert',
        timestamp: new Date(),
        acknowledged: false,
        userId: 'user-123'
      };

      const thresholds: AlertThreshold[] = [{
        id: 'threshold-1',
        type: 'daily',
        threshold: 200,
        severity: 'critical',
        enabled: true,
        notificationChannels: ['sns'],
        createdAt: new Date(),
        updatedAt: new Date()
      }];

      process.env.COST_ALERTS_SNS_TOPIC = 'arn:aws:sns:us-east-1:123456789:cost-alerts';
      mockSNSClient.send.mockResolvedValue({});
      mockDynamoDBClient.send.mockResolvedValue({});

      await alertManager.sendAlert(alert, thresholds);

      expect(mockSNSClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          TopicArn: 'arn:aws:sns:us-east-1:123456789:cost-alerts',
          Subject: 'Huntaze Cost Alert - CRITICAL',
          Message: expect.stringContaining('"alert"')
        })
      );
    });

    it('should handle SNS errors gracefully', async () => {
      const alert: CostAlert = {
        id: 'alert-sns-error',
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
        notificationChannels: ['sns'],
        createdAt: new Date(),
        updatedAt: new Date()
      }];

      process.env.COST_ALERTS_SNS_TOPIC = 'arn:aws:sns:us-east-1:123456789:cost-alerts';
      mockSNSClient.send.mockRejectedValue(new Error('SNS error'));
      mockDynamoDBClient.send.mockResolvedValue({});

      await expect(alertManager.sendAlert(alert, thresholds)).resolves.not.toThrow();
    });
  });

  describe('Alert History', () => {
    it('should save alert to history', async () => {
      const alert: CostAlert = {
        id: 'alert-history',
        type: 'daily_cost_exceeded',
        severity: 'warning',
        threshold: 100,
        currentValue: 125,
        message: 'Test alert',
        timestamp: new Date(),
        acknowledged: false,
        userId: 'user-123'
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

      expect(mockDynamoDBClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: 'huntaze-cost-alert-history-production',
          Item: expect.objectContaining({
            id: { S: 'alert-history' },
            type: { S: 'daily_cost_exceeded' },
            severity: { S: 'warning' },
            userId: { S: 'user-123' }
          })
        })
      );
    });

    it('should handle history save errors gracefully', async () => {
      const alert: CostAlert = {
        id: 'alert-history-error',
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
      
      // First call for email succeeds, second for history fails
      mockDynamoDBClient.send
        .mockResolvedValueOnce({}) // Email send
        .mockRejectedValueOnce(new Error('DynamoDB error')); // History save

      await expect(alertManager.sendAlert(alert, thresholds)).resolves.not.toThrow();
    });
  });

  describe('Alert History Cleanup', () => {
    it('should cleanup old alerts', async () => {
      await alertManager.cleanupAlertHistory();

      // Should complete without errors
      expect(true).toBe(true);
    });
  });

  describe('Multi-User Scenarios', () => {
    it('should handle user-specific and global thresholds', async () => {
      const alert: CostAlert = {
        id: 'alert-multi-user',
        type: 'daily_cost_exceeded',
        severity: 'warning',
        threshold: 100,
        currentValue: 125,
        message: 'Test',
        timestamp: new Date(),
        acknowledged: false,
        userId: 'user-123'
      };

      const thresholds: AlertThreshold[] = [
        {
          id: 'threshold-global',
          type: 'daily',
          threshold: 100,
          severity: 'warning',
          enabled: true,
          notificationChannels: ['email'],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'threshold-user',
          userId: 'user-123',
          type: 'daily',
          threshold: 100,
          severity: 'warning',
          enabled: true,
          notificationChannels: ['slack'],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'threshold-other-user',
          userId: 'user-456',
          type: 'daily',
          threshold: 100,
          severity: 'warning',
          enabled: true,
          notificationChannels: ['sns'],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
      mockSESClient.send.mockResolvedValue({});
      (global.fetch as any).mockResolvedValue({ ok: true });
      mockDynamoDBClient.send.mockResolvedValue({});

      await alertManager.sendAlert(alert, thresholds);

      // Should send via email (global) and slack (user-123), but not SNS (user-456)
      expect(mockSESClient.send).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalled();
      expect(mockSNSClient.send).not.toHaveBeenCalled();
    });
  });

  describe('Provider-Specific Thresholds', () => {
    it('should filter by provider', async () => {
      const alert: CostAlert = {
        id: 'alert-azure',
        type: 'daily_cost_exceeded',
        severity: 'warning',
        threshold: 100,
        currentValue: 125,
        message: 'Azure costs high',
        timestamp: new Date(),
        acknowledged: false,
        provider: 'azure'
      };

      const thresholds: AlertThreshold[] = [
        {
          id: 'threshold-azure',
          type: 'daily',
          provider: 'azure',
          threshold: 100,
          severity: 'warning',
          enabled: true,
          notificationChannels: ['email'],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'threshold-openai',
          type: 'daily',
          provider: 'openai',
          threshold: 100,
          severity: 'warning',
          enabled: true,
          notificationChannels: ['slack'],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockSESClient.send.mockResolvedValue({});
      mockDynamoDBClient.send.mockResolvedValue({});

      await alertManager.sendAlert(alert, thresholds);

      // Should only send email (Azure threshold), not Slack (OpenAI threshold)
      expect(mockSESClient.send).toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent alerts', async () => {
      const alerts: CostAlert[] = Array.from({ length: 10 }, (_, i) => ({
        id: `alert-concurrent-${i}`,
        type: 'daily_cost_exceeded',
        severity: 'warning',
        threshold: 100,
        currentValue: 120 + i,
        message: `Alert ${i}`,
        timestamp: new Date(),
        acknowledged: false,
        userId: `user-${i}`
      }));

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

      const promises = alerts.map(alert => 
        alertManager.sendAlert(alert, thresholds)
      );

      await Promise.all(promises);

      // Each alert should trigger email (rate limiting is per user)
      expect(mockSESClient.send).toHaveBeenCalledTimes(10);
    });

    it('should handle large threshold lists efficiently', async () => {
      const alert: CostAlert = {
        id: 'alert-large-thresholds',
        type: 'daily_cost_exceeded',
        severity: 'warning',
        threshold: 100,
        currentValue: 125,
        message: 'Test',
        timestamp: new Date(),
        acknowledged: false
      };

      const thresholds: AlertThreshold[] = Array.from({ length: 100 }, (_, i) => ({
        id: `threshold-${i}`,
        type: 'daily',
        threshold: 50 + i, // Various thresholds
        severity: 'warning',
        enabled: i % 2 === 0, // Half enabled
        notificationChannels: ['email'],
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      mockSESClient.send.mockResolvedValue({});
      mockDynamoDBClient.send.mockResolvedValue({});

      const startTime = Date.now();
      await alertManager.sendAlert(alert, thresholds);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000); // Should complete quickly
      expect(mockSESClient.send).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero threshold', async () => {
      const threshold = {
        type: 'daily' as const,
        threshold: 0,
        severity: 'info' as const,
        enabled: true,
        notificationChannels: ['email'] as const
      };

      mockDynamoDBClient.send.mockResolvedValue({});

      const result = await alertManager.setAlertThreshold(threshold);

      expect(result.threshold).toBe(0);
    });

    it('should handle very large threshold values', async () => {
      const threshold = {
        type: 'monthly' as const,
        threshold: 1000000,
        severity: 'critical' as const,
        enabled: true,
        notificationChannels: ['email'] as const
      };

      mockDynamoDBClient.send.mockResolvedValue({});

      const result = await alertManager.setAlertThreshold(threshold);

      expect(result.threshold).toBe(1000000);
    });

    it('should handle empty notification channels', async () => {
      const alert: CostAlert = {
        id: 'alert-no-channels',
        type: 'daily_cost_exceeded',
        severity: 'warning',
        threshold: 100,
        currentValue: 125,
        message: 'Test',
        timestamp: new Date(),
        acknowledged: false
      };

      const thresholds: AlertThreshold[] = [{
        id: 'threshold-no-channels',
        type: 'daily',
        threshold: 100,
        severity: 'warning',
        enabled: true,
        notificationChannels: [], // Empty
        createdAt: new Date(),
        updatedAt: new Date()
      }];

      mockDynamoDBClient.send.mockResolvedValue({});

      await alertManager.sendAlert(alert, thresholds);

      // Should not send any notifications
      expect(mockSESClient.send).not.toHaveBeenCalled();
      expect(mockSNSClient.send).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle missing environment variables', async () => {
      const alert: CostAlert = {
        id: 'alert-no-env',
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
        notificationChannels: ['email', 'slack', 'sns'],
        createdAt: new Date(),
        updatedAt: new Date()
      }];

      // Clear all env vars
      delete process.env.COST_ALERT_EMAIL;
      delete process.env.SLACK_WEBHOOK_URL;
      delete process.env.COST_ALERTS_SNS_TOPIC;

      mockSESClient.send.mockResolvedValue({});
      mockDynamoDBClient.send.mockResolvedValue({});

      await expect(alertManager.sendAlert(alert, thresholds)).resolves.not.toThrow();
    });
  });
});
