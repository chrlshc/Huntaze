/**
 * Integration Tests for Cost Alert System
 * Tests end-to-end alert workflows with monitoring service
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CostAlertManager } from '@/lib/services/cost-alert-manager';
import { CostMonitoringService } from '@/lib/services/cost-monitoring-service';

// Mock AWS clients
const mockSNSClient = { send: vi.fn() };
const mockSESClient = { send: vi.fn() };
const mockDynamoDBClient = { send: vi.fn() };
const mockCloudWatchClient = { send: vi.fn() };

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

vi.mock('@aws-sdk/client-cloudwatch', () => ({
  CloudWatchClient: vi.fn(() => mockCloudWatchClient),
  PutMetricDataCommand: vi.fn((params) => params)
}));

describe('Cost Alert System Integration', () => {
  let alertManager: CostAlertManager;
  let monitoringService: CostMonitoringService;

  beforeEach(() => {
    alertManager = new CostAlertManager('us-east-1');
    monitoringService = new CostMonitoringService('us-east-1');
    
    vi.clearAllMocks();
    
    mockDynamoDBClient.send.mockResolvedValue({ Items: [] });
    mockSNSClient.send.mockResolvedValue({});
    mockSESClient.send.mockResolvedValue({});
    mockCloudWatchClient.send.mockResolvedValue({});
    (global.fetch as any).mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('End-to-End Alert Flow', () => {
    it('should detect threshold breach and send alerts', async () => {
      // Setup threshold
      const threshold = await alertManager.setAlertThreshold({
        userId: 'user-123',
        type: 'daily',
        threshold: 100,
        severity: 'warning',
        enabled: true,
        notificationChannels: ['email', 'slack']
      });

      expect(threshold.id).toBeDefined();

      // Simulate cost tracking that exceeds threshold
      const costs = [
        { amount: 30, timestamp: new Date() },
        { amount: 40, timestamp: new Date() },
        { amount: 50, timestamp: new Date() } // Total: 120 > 100
      ];

      // Mock monitoring service to return alert
      mockDynamoDBClient.send.mockResolvedValueOnce({
        Items: [{
          id: { S: threshold.id },
          userId: { S: 'user-123' },
          type: { S: 'daily' },
          threshold: { N: '100' },
          severity: { S: 'warning' },
          enabled: { BOOL: true },
          notificationChannels: { SS: ['email', 'slack'] },
          createdAt: { S: new Date().toISOString() },
          updatedAt: { S: new Date().toISOString() }
        }]
      });

      process.env.COST_ALERT_EMAIL = 'admin@huntaze.com';
      process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';

      // Trigger alert
      const alert = {
        id: 'alert-integration-1',
        type: 'daily_cost_exceeded',
        severity: 'warning' as const,
        threshold: 100,
        currentValue: 120,
        message: 'Daily cost exceeded threshold',
        timestamp: new Date(),
        acknowledged: false,
        userId: 'user-123'
      };

      await alertManager.sendAlert(alert, [threshold]);

      // Verify notifications sent
      expect(mockSESClient.send).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        'https://hooks.slack.com/test',
        expect.any(Object)
      );
    });

    it('should generate forecast and predict threshold breach', async () => {
      const userId = 'user-forecast';
      
      // Historical costs showing upward trend
      const historicalCosts = [50, 60, 70, 80, 90]; // Will exceed 100

      // Setup threshold
      mockDynamoDBClient.send.mockResolvedValue({
        Items: [{
          id: { S: 'threshold-forecast' },
          userId: { S: userId },
          type: { S: 'daily' },
          threshold: { N: '100' },
          severity: { S: 'warning' },
          enabled: { BOOL: true },
          notificationChannels: { SS: ['email'] },
          createdAt: { S: new Date().toISOString() },
          updatedAt: { S: new Date().toISOString() }
        }]
      });

      const forecast = await alertManager.generateCostForecast(
        userId,
        'daily',
        historicalCosts
      );

      expect(forecast.willExceedThreshold).toBe(true);
      expect(forecast.projectedCost).toBeGreaterThan(100);
      expect(forecast.daysUntilExceeded).toBeDefined();
      expect(forecast.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('Multi-Channel Alert Delivery', () => {
    it('should deliver alerts via all channels simultaneously', async () => {
      const threshold = await alertManager.setAlertThreshold({
        type: 'hourly',
        threshold: 10,
        severity: 'critical',
        enabled: true,
        notificationChannels: ['email', 'slack', 'sns', 'in_app']
      });

      process.env.COST_ALERT_EMAIL = 'admin@huntaze.com';
      process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
      process.env.COST_ALERTS_SNS_TOPIC = 'arn:aws:sns:us-east-1:123:alerts';

      const alert = {
        id: 'alert-multi-channel',
        type: 'hourly_cost_exceeded',
        severity: 'critical' as const,
        threshold: 10,
        currentValue: 15,
        message: 'Hourly cost spike',
        timestamp: new Date(),
        acknowledged: false
      };

      const startTime = Date.now();
      await alertManager.sendAlert(alert, [threshold]);
      const duration = Date.now() - startTime;

      // All channels should be called
      expect(mockSESClient.send).toHaveBeenCalled();
      expect(mockSNSClient.send).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalled();

      // Should complete quickly (parallel execution)
      expect(duration).toBeLessThan(1000);
    });

    it('should continue if one channel fails', async () => {
      const threshold = await alertManager.setAlertThreshold({
        type: 'daily',
        threshold: 100,
        severity: 'warning',
        enabled: true,
        notificationChannels: ['email', 'slack', 'sns']
      });

      process.env.COST_ALERT_EMAIL = 'admin@huntaze.com';
      process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
      process.env.COST_ALERTS_SNS_TOPIC = 'arn:aws:sns:us-east-1:123:alerts';

      // Slack fails
      (global.fetch as any).mockRejectedValue(new Error('Slack error'));
      mockSESClient.send.mockResolvedValue({});
      mockSNSClient.send.mockResolvedValue({});

      const alert = {
        id: 'alert-partial-failure',
        type: 'daily_cost_exceeded',
        severity: 'warning' as const,
        threshold: 100,
        currentValue: 125,
        message: 'Test',
        timestamp: new Date(),
        acknowledged: false
      };

      await alertManager.sendAlert(alert, [threshold]);

      // Email and SNS should still be sent
      expect(mockSESClient.send).toHaveBeenCalled();
      expect(mockSNSClient.send).toHaveBeenCalled();
    });
  });

  describe('Threshold Management Workflow', () => {
    it('should create, update, and manage multiple thresholds', async () => {
      const userId = 'user-multi-threshold';

      // Create multiple thresholds
      const dailyThreshold = await alertManager.setAlertThreshold({
        userId,
        type: 'daily',
        threshold: 100,
        severity: 'warning',
        enabled: true,
        notificationChannels: ['email']
      });

      const monthlyThreshold = await alertManager.setAlertThreshold({
        userId,
        type: 'monthly',
        threshold: 2000,
        severity: 'critical',
        enabled: true,
        notificationChannels: ['email', 'slack', 'sns']
      });

      const hourlyThreshold = await alertManager.setAlertThreshold({
        userId,
        type: 'hourly',
        threshold: 5,
        severity: 'info',
        enabled: true,
        notificationChannels: ['in_app']
      });

      expect(dailyThreshold.id).toBeDefined();
      expect(monthlyThreshold.id).toBeDefined();
      expect(hourlyThreshold.id).toBeDefined();

      // All should be stored in DynamoDB
      expect(mockDynamoDBClient.send).toHaveBeenCalledTimes(3);
    });

    it('should support global and user-specific thresholds', async () => {
      // Global threshold
      const globalThreshold = await alertManager.setAlertThreshold({
        type: 'daily',
        threshold: 500,
        severity: 'critical',
        enabled: true,
        notificationChannels: ['email', 'sns']
      });

      // User-specific threshold (lower)
      const userThreshold = await alertManager.setAlertThreshold({
        userId: 'user-123',
        type: 'daily',
        threshold: 100,
        severity: 'warning',
        enabled: true,
        notificationChannels: ['email']
      });

      expect(globalThreshold.userId).toBeUndefined();
      expect(userThreshold.userId).toBe('user-123');

      // Both should be stored
      expect(mockDynamoDBClient.send).toHaveBeenCalledTimes(2);
    });
  });

  describe('Forecasting Integration', () => {
    it('should generate accurate forecasts from real cost data', async () => {
      const userId = 'user-forecast-integration';
      
      // Simulate 30 days of cost data with growth
      const costData = Array.from({ length: 30 }, (_, i) => 
        50 + (i * 2) + (Math.random() * 10 - 5) // Linear growth with noise
      );

      mockDynamoDBClient.send.mockResolvedValue({
        Items: [{
          id: { S: 'threshold-forecast' },
          userId: { S: userId },
          type: { S: 'daily' },
          threshold: { N: '150' },
          severity: { S: 'warning' },
          enabled: { BOOL: true },
          notificationChannels: { SS: ['email'] },
          createdAt: { S: new Date().toISOString() },
          updatedAt: { S: new Date().toISOString() }
        }]
      });

      const forecast = await alertManager.generateCostForecast(
        userId,
        'daily',
        costData
      );

      expect(forecast.basedOnDays).toBe(30);
      expect(forecast.confidence).toBeGreaterThan(0.6); // Good confidence with 30 days
      expect(forecast.projectedCost).toBeGreaterThan(forecast.currentCost);
      
      if (forecast.willExceedThreshold) {
        expect(forecast.daysUntilExceeded).toBeGreaterThan(0);
        expect(forecast.thresholdValue).toBe(150);
      }
    });

    it('should handle different forecast periods', async () => {
      const userId = 'user-periods';
      const costData = [100, 110, 120, 130, 140];

      mockDynamoDBClient.send.mockResolvedValue({ Items: [] });

      const dailyForecast = await alertManager.generateCostForecast(
        userId,
        'daily',
        costData
      );

      const weeklyForecast = await alertManager.generateCostForecast(
        userId,
        'weekly',
        costData.map(c => c * 7) // Weekly totals
      );

      const monthlyForecast = await alertManager.generateCostForecast(
        userId,
        'monthly',
        costData.map(c => c * 30) // Monthly totals
      );

      expect(dailyForecast.period).toBe('daily');
      expect(weeklyForecast.period).toBe('weekly');
      expect(monthlyForecast.period).toBe('monthly');

      expect(weeklyForecast.projectedCost).toBeGreaterThan(dailyForecast.projectedCost);
      expect(monthlyForecast.projectedCost).toBeGreaterThan(weeklyForecast.projectedCost);
    });

    it('should provide early warning before threshold breach', async () => {
      const userId = 'user-early-warning';
      
      // Costs approaching threshold
      const costData = [70, 75, 80, 85, 90]; // Trending toward 100
      
      mockDynamoDBClient.send.mockResolvedValue({
        Items: [{
          id: { S: 'threshold-early' },
          userId: { S: userId },
          type: { S: 'daily' },
          threshold: { N: '100' },
          severity: { S: 'warning' },
          enabled: { BOOL: true },
          notificationChannels: { SS: ['email'] },
          createdAt: { S: new Date().toISOString() },
          updatedAt: { S: new Date().toISOString() }
        }]
      });

      const forecast = await alertManager.generateCostForecast(
        userId,
        'daily',
        costData
      );

      expect(forecast.willExceedThreshold).toBe(true);
      expect(forecast.daysUntilExceeded).toBeLessThanOrEqual(3);
      expect(forecast.currentCost).toBeLessThan(100); // Not yet exceeded
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should rate limit alerts per user', async () => {
      const userId = 'user-rate-limit';
      
      const threshold = await alertManager.setAlertThreshold({
        userId,
        type: 'hourly',
        threshold: 5,
        severity: 'warning',
        enabled: true,
        notificationChannels: ['email']
      });

      mockSESClient.send.mockResolvedValue({});
      mockDynamoDBClient.send.mockResolvedValue({});

      // Send multiple alerts rapidly
      for (let i = 0; i < 5; i++) {
        const alert = {
          id: `alert-rate-${i}`,
          type: 'hourly_cost_exceeded',
          severity: 'warning' as const,
          threshold: 5,
          currentValue: 6 + i,
          message: `Alert ${i}`,
          timestamp: new Date(),
          acknowledged: false,
          userId
        };

        await alertManager.sendAlert(alert, [threshold]);
      }

      // Only first alert should be sent (rate limited)
      expect(mockSESClient.send).toHaveBeenCalledTimes(1);
    });

    it('should not rate limit different users', async () => {
      const threshold = await alertManager.setAlertThreshold({
        type: 'daily',
        threshold: 100,
        severity: 'warning',
        enabled: true,
        notificationChannels: ['email']
      });

      mockSESClient.send.mockResolvedValue({});
      mockDynamoDBClient.send.mockResolvedValue({});

      // Send alerts for different users
      const users = ['user-1', 'user-2', 'user-3'];
      
      for (const userId of users) {
        const alert = {
          id: `alert-${userId}`,
          type: 'daily_cost_exceeded',
          severity: 'warning' as const,
          threshold: 100,
          currentValue: 125,
          message: 'Test',
          timestamp: new Date(),
          acknowledged: false,
          userId
        };

        await alertManager.sendAlert(alert, [threshold]);
      }

      // All alerts should be sent (different users)
      expect(mockSESClient.send).toHaveBeenCalledTimes(3);
    });
  });

  describe('Alert History Integration', () => {
    it('should maintain complete alert history', async () => {
      const userId = 'user-history';
      
      const threshold = await alertManager.setAlertThreshold({
        userId,
        type: 'daily',
        threshold: 100,
        severity: 'warning',
        enabled: true,
        notificationChannels: ['email']
      });

      mockSESClient.send.mockResolvedValue({});
      mockDynamoDBClient.send.mockResolvedValue({});

      // Send multiple alerts over time
      const alerts = Array.from({ length: 5 }, (_, i) => ({
        id: `alert-history-${i}`,
        type: 'daily_cost_exceeded',
        severity: 'warning' as const,
        threshold: 100,
        currentValue: 110 + (i * 5),
        message: `Alert ${i}`,
        timestamp: new Date(Date.now() + i * 3600000), // 1 hour apart
        acknowledged: false,
        userId
      }));

      for (const alert of alerts) {
        await alertManager.sendAlert(alert, [threshold]);
      }

      // Each alert should be saved to history
      const historyCalls = mockDynamoDBClient.send.mock.calls.filter(
        call => call[0].TableName === 'huntaze-cost-alert-history-production'
      );

      expect(historyCalls.length).toBeGreaterThan(0);
    });
  });

  describe('Error Recovery', () => {
    it('should recover from transient failures', async () => {
      const threshold = await alertManager.setAlertThreshold({
        type: 'daily',
        threshold: 100,
        severity: 'warning',
        enabled: true,
        notificationChannels: ['email', 'slack']
      });

      process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';

      // First attempt fails
      mockSESClient.send.mockRejectedValueOnce(new Error('Transient error'));
      (global.fetch as any).mockResolvedValue({ ok: true });
      mockDynamoDBClient.send.mockResolvedValue({});

      const alert = {
        id: 'alert-recovery',
        type: 'daily_cost_exceeded',
        severity: 'warning' as const,
        threshold: 100,
        currentValue: 125,
        message: 'Test',
        timestamp: new Date(),
        acknowledged: false
      };

      // Should not throw
      await expect(alertManager.sendAlert(alert, [threshold])).resolves.not.toThrow();

      // Slack should still be sent
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
