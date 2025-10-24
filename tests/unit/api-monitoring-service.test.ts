import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { APIMonitoringService, getAPIMonitoringService } from '@/lib/services/api-monitoring-service';

// Mock external webhook calls
global.fetch = vi.fn();

describe('APIMonitoringService', () => {
  let monitoringService: APIMonitoringService;

  beforeEach(() => {
    monitoringService = APIMonitoringService.getInstance();
    monitoringService.reset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Metric Recording', () => {
    it('should record API metrics correctly', () => {
      const metric = {
        endpoint: '/api/test',
        method: 'GET',
        statusCode: 200,
        responseTime: 150,
        userId: 'user123',
        tokensUsed: 50,
        cacheHit: false,
      };

      monitoringService.recordMetric(metric);

      const healthMetrics = monitoringService.getHealthMetrics();
      expect(healthMetrics.totalRequests).toBe(1);
      expect(healthMetrics.successRate).toBe(100);
      expect(healthMetrics.averageResponseTime).toBe(150);
      expect(healthMetrics.errorRate).toBe(0);
      expect(healthMetrics.totalTokensUsed).toBe(50);
    });

    it('should track different types of metrics', () => {
      const metrics = [
        { endpoint: '/api/success', method: 'GET', statusCode: 200, responseTime: 100 },
        { endpoint: '/api/error', method: 'POST', statusCode: 500, responseTime: 200 },
        { endpoint: '/api/rate-limit', method: 'GET', statusCode: 429, responseTime: 50 },
        { endpoint: '/api/cached', method: 'GET', statusCode: 200, responseTime: 25, cacheHit: true },
      ];

      metrics.forEach(metric => monitoringService.recordMetric(metric));

      const healthMetrics = monitoringService.getHealthMetrics();
      expect(healthMetrics.totalRequests).toBe(4);
      expect(healthMetrics.successRate).toBe(50); // 2 out of 4 successful
      expect(healthMetrics.errorRate).toBe(25); // 1 out of 4 errors (500)
      expect(healthMetrics.rateLimitHits).toBe(1);
      expect(healthMetrics.cacheHitRate).toBe(25); // 1 out of 4 cache hits
    });

    it('should calculate average response time correctly', () => {
      const responseTimes = [100, 200, 300, 400, 500];
      
      responseTimes.forEach((responseTime, index) => {
        monitoringService.recordMetric({
          endpoint: `/api/test${index}`,
          method: 'GET',
          statusCode: 200,
          responseTime,
        });
      });

      const healthMetrics = monitoringService.getHealthMetrics();
      expect(healthMetrics.averageResponseTime).toBe(300); // (100+200+300+400+500)/5
    });

    it('should track unique active users', () => {
      const users = ['user1', 'user2', 'user1', 'user3', 'user2'];
      
      users.forEach((userId, index) => {
        monitoringService.recordMetric({
          endpoint: `/api/test${index}`,
          method: 'GET',
          statusCode: 200,
          responseTime: 100,
          userId,
        });
      });

      const healthMetrics = monitoringService.getHealthMetrics();
      expect(healthMetrics.activeUsers).toBe(3); // user1, user2, user3
    });
  });

  describe('Alert System', () => {
    it('should generate high latency alerts', () => {
      // Configure lower threshold for testing
      monitoringService.updateAlertThresholds({ highLatency: 1000 });

      // Record high latency metric
      monitoringService.recordMetric({
        endpoint: '/api/slow',
        method: 'GET',
        statusCode: 200,
        responseTime: 1500, // Above threshold
        userId: 'user123',
      });

      const alerts = monitoringService.getActiveAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      
      const latencyAlert = alerts.find(a => a.type === 'high_latency');
      expect(latencyAlert).toBeDefined();
      expect(latencyAlert?.severity).toMatch(/high|critical/);
      expect(latencyAlert?.currentValue).toBe(1500);
      expect(latencyAlert?.threshold).toBe(1000);
    });

    it('should generate error rate alerts', () => {
      // Configure lower threshold for testing
      monitoringService.updateAlertThresholds({ errorRate: 20 });

      // Generate requests with high error rate
      for (let i = 0; i < 10; i++) {
        monitoringService.recordMetric({
          endpoint: '/api/error-prone',
          method: 'POST',
          statusCode: i < 3 ? 500 : 200, // 30% error rate
          responseTime: 100,
        });
      }

      const alerts = monitoringService.getActiveAlerts();
      const errorAlert = alerts.find(a => a.type === 'error_rate');
      
      expect(errorAlert).toBeDefined();
      expect(errorAlert?.currentValue).toBe(30);
      expect(errorAlert?.threshold).toBe(20);
    });

    it('should generate token usage alerts', () => {
      // Configure lower threshold for testing
      monitoringService.updateAlertThresholds({ tokenUsagePerHour: 500 });

      // Generate high token usage
      for (let i = 0; i < 5; i++) {
        monitoringService.recordMetric({
          endpoint: '/api/ai-heavy',
          method: 'POST',
          statusCode: 200,
          responseTime: 1000,
          tokensUsed: 150, // Total: 750 tokens
        });
      }

      const alerts = monitoringService.getActiveAlerts();
      const tokenAlert = alerts.find(a => a.type === 'token_usage');
      
      expect(tokenAlert).toBeDefined();
      expect(tokenAlert?.currentValue).toBe(750);
      expect(tokenAlert?.threshold).toBe(500);
    });

    it('should prevent duplicate alerts', () => {
      monitoringService.updateAlertThresholds({ highLatency: 500 });

      // Generate multiple high latency requests quickly
      for (let i = 0; i < 5; i++) {
        monitoringService.recordMetric({
          endpoint: '/api/duplicate-alert',
          method: 'GET',
          statusCode: 200,
          responseTime: 800,
          userId: 'user123',
        });
      }

      const alerts = monitoringService.getActiveAlerts();
      const latencyAlerts = alerts.filter(a => 
        a.type === 'high_latency' && 
        a.endpoint === '/api/duplicate-alert'
      );
      
      // Should only have one alert despite multiple violations
      expect(latencyAlerts.length).toBe(1);
    });

    it('should send alerts to external service in production', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);

      // Mock production environment
      const originalEnv = process.env.NODE_ENV;
      const originalWebhook = process.env.MONITORING_WEBHOOK_URL;
      
      process.env.NODE_ENV = 'production';
      process.env.MONITORING_WEBHOOK_URL = 'https://monitoring.example.com/webhook';

      try {
        monitoringService.updateAlertThresholds({ highLatency: 100 });

        monitoringService.recordMetric({
          endpoint: '/api/external-alert',
          method: 'GET',
          statusCode: 200,
          responseTime: 200,
        });

        // Wait a bit for async webhook call
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(mockFetch).toHaveBeenCalledWith(
          'https://monitoring.example.com/webhook',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('high_latency'),
          })
        );
      } finally {
        // Restore environment
        process.env.NODE_ENV = originalEnv;
        if (originalWebhook) {
          process.env.MONITORING_WEBHOOK_URL = originalWebhook;
        } else {
          delete process.env.MONITORING_WEBHOOK_URL;
        }
      }
    });

    it('should handle webhook failures gracefully', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockRejectedValue(new Error('Webhook failed'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      process.env.NODE_ENV = 'production';
      process.env.MONITORING_WEBHOOK_URL = 'https://failing-webhook.com';

      try {
        monitoringService.updateAlertThresholds({ highLatency: 100 });

        monitoringService.recordMetric({
          endpoint: '/api/webhook-fail',
          method: 'GET',
          statusCode: 200,
          responseTime: 200,
        });

        await new Promise(resolve => setTimeout(resolve, 100));

        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to send alert to external service:',
          expect.any(Error)
        );
      } finally {
        consoleSpy.mockRestore();
        delete process.env.MONITORING_WEBHOOK_URL;
      }
    });
  });

  describe('Endpoint Metrics', () => {
    it('should track metrics per endpoint', () => {
      const endpoints = [
        { endpoint: '/api/users', method: 'GET', statusCode: 200, responseTime: 100 },
        { endpoint: '/api/users', method: 'GET', statusCode: 200, responseTime: 150 },
        { endpoint: '/api/users', method: 'POST', statusCode: 201, responseTime: 200 },
        { endpoint: '/api/posts', method: 'GET', statusCode: 500, responseTime: 300 },
        { endpoint: '/api/posts', method: 'GET', statusCode: 200, responseTime: 120 },
      ];

      endpoints.forEach(metric => monitoringService.recordMetric(metric));

      const endpointMetrics = monitoringService.getEndpointMetrics();
      
      expect(endpointMetrics).toHaveProperty('GET /api/users');
      expect(endpointMetrics).toHaveProperty('POST /api/users');
      expect(endpointMetrics).toHaveProperty('GET /api/posts');

      const getUsersMetrics = endpointMetrics['GET /api/users'];
      expect(getUsersMetrics.requests).toBe(2);
      expect(getUsersMetrics.averageResponseTime).toBe(125); // (100+150)/2
      expect(getUsersMetrics.errorRate).toBe(0);
      expect(getUsersMetrics.successRate).toBe(100);

      const getPostsMetrics = endpointMetrics['GET /api/posts'];
      expect(getPostsMetrics.requests).toBe(2);
      expect(getPostsMetrics.errorRate).toBe(50); // 1 error out of 2 requests
      expect(getPostsMetrics.successRate).toBe(50);
    });

    it('should handle endpoints with no requests', () => {
      const endpointMetrics = monitoringService.getEndpointMetrics();
      expect(endpointMetrics).toEqual({});
    });
  });

  describe('User Metrics', () => {
    it('should track metrics per user', () => {
      const userRequests = [
        { userId: 'user1', statusCode: 200, responseTime: 100, tokensUsed: 50 },
        { userId: 'user1', statusCode: 500, responseTime: 200, tokensUsed: 0 },
        { userId: 'user2', statusCode: 200, responseTime: 150, tokensUsed: 75 },
      ];

      userRequests.forEach(({ userId, statusCode, responseTime, tokensUsed }) => {
        monitoringService.recordMetric({
          endpoint: '/api/test',
          method: 'GET',
          statusCode,
          responseTime,
          userId,
          tokensUsed,
        });
      });

      const user1Metrics = monitoringService.getUserMetrics('user1');
      expect(user1Metrics.totalRequests).toBe(2);
      expect(user1Metrics.averageResponseTime).toBe(150); // (100+200)/2
      expect(user1Metrics.errorRate).toBe(50); // 1 error out of 2 requests
      expect(user1Metrics.tokensUsed).toBe(50);
      expect(user1Metrics.lastActivity).toBeInstanceOf(Date);

      const user2Metrics = monitoringService.getUserMetrics('user2');
      expect(user2Metrics.totalRequests).toBe(1);
      expect(user2Metrics.errorRate).toBe(0);
      expect(user2Metrics.tokensUsed).toBe(75);

      const nonExistentUserMetrics = monitoringService.getUserMetrics('user3');
      expect(nonExistentUserMetrics.totalRequests).toBe(0);
      expect(nonExistentUserMetrics.lastActivity).toBeNull();
    });
  });

  describe('Data Management', () => {
    it('should cleanup old metrics automatically', () => {
      // Mock Date.now to simulate time passage
      const originalNow = Date.now;
      let currentTime = Date.now();
      Date.now = vi.fn(() => currentTime);

      try {
        // Add old metrics
        monitoringService.recordMetric({
          endpoint: '/api/old',
          method: 'GET',
          statusCode: 200,
          responseTime: 100,
        });

        // Advance time by 25 hours (beyond 24-hour retention)
        currentTime += 25 * 60 * 60 * 1000;

        // Add new metric to trigger cleanup
        monitoringService.recordMetric({
          endpoint: '/api/new',
          method: 'GET',
          statusCode: 200,
          responseTime: 100,
        });

        const healthMetrics = monitoringService.getHealthMetrics();
        expect(healthMetrics.totalRequests).toBe(1); // Only new metric should remain
      } finally {
        Date.now = originalNow;
      }
    });

    it('should cleanup old alerts', () => {
      const originalNow = Date.now;
      let currentTime = Date.now();
      Date.now = vi.fn(() => currentTime);

      try {
        monitoringService.updateAlertThresholds({ highLatency: 100 });

        // Generate alert
        monitoringService.recordMetric({
          endpoint: '/api/old-alert',
          method: 'GET',
          statusCode: 200,
          responseTime: 200,
        });

        let alerts = monitoringService.getActiveAlerts();
        expect(alerts.length).toBeGreaterThan(0);

        // Advance time by 73 hours (beyond 72-hour alert retention)
        currentTime += 73 * 60 * 60 * 1000;

        // Generate new alert to trigger cleanup
        monitoringService.recordMetric({
          endpoint: '/api/new-alert',
          method: 'GET',
          statusCode: 200,
          responseTime: 200,
        });

        alerts = monitoringService.getActiveAlerts();
        // Should only have the new alert
        expect(alerts.every(a => a.endpoint === '/api/new-alert')).toBe(true);
      } finally {
        Date.now = originalNow;
      }
    });

    it('should reset all data correctly', () => {
      // Add some data
      monitoringService.recordMetric({
        endpoint: '/api/test',
        method: 'GET',
        statusCode: 200,
        responseTime: 100,
        userId: 'user1',
        tokensUsed: 50,
      });

      monitoringService.updateAlertThresholds({ highLatency: 50 });

      let healthMetrics = monitoringService.getHealthMetrics();
      expect(healthMetrics.totalRequests).toBe(1);

      // Reset
      monitoringService.reset();

      healthMetrics = monitoringService.getHealthMetrics();
      expect(healthMetrics.totalRequests).toBe(0);
      expect(healthMetrics.uptime).toBe(0);
      
      const alerts = monitoringService.getActiveAlerts();
      expect(alerts.length).toBe(0);
    });
  });

  describe('Configuration and Thresholds', () => {
    it('should update alert thresholds', () => {
      const newThresholds = {
        highLatency: 2000,
        errorRate: 15,
        rateLimitRate: 20,
        tokenUsagePerHour: 5000,
      };

      monitoringService.updateAlertThresholds(newThresholds);

      // Test that new thresholds are applied
      monitoringService.recordMetric({
        endpoint: '/api/threshold-test',
        method: 'GET',
        statusCode: 200,
        responseTime: 1500, // Below new threshold
      });

      const alerts = monitoringService.getActiveAlerts();
      const latencyAlert = alerts.find(a => a.type === 'high_latency');
      expect(latencyAlert).toBeUndefined(); // Should not trigger with new threshold
    });

    it('should export metrics in different formats', () => {
      // Add some test data
      monitoringService.recordMetric({
        endpoint: '/api/export-test',
        method: 'GET',
        statusCode: 200,
        responseTime: 100,
        userId: 'user1',
        tokensUsed: 25,
      });

      // Test JSON export
      const jsonExport = monitoringService.exportMetrics('json');
      const exportData = JSON.parse(jsonExport);
      
      expect(exportData).toHaveProperty('exportedAt');
      expect(exportData).toHaveProperty('metricsCount');
      expect(exportData).toHaveProperty('healthMetrics');
      expect(exportData).toHaveProperty('endpointMetrics');
      expect(exportData).toHaveProperty('rawMetrics');
      expect(exportData.metricsCount).toBe(1);

      // Test CSV export
      const csvExport = monitoringService.exportMetrics('csv');
      const lines = csvExport.split('\n');
      
      expect(lines[0]).toContain('timestamp,endpoint,method,statusCode');
      expect(lines[1]).toContain('/api/export-test,GET,200,100');
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = APIMonitoringService.getInstance();
      const instance2 = APIMonitoringService.getInstance();
      const instance3 = getAPIMonitoringService();

      expect(instance1).toBe(instance2);
      expect(instance2).toBe(instance3);
      expect(instance1).toBeInstanceOf(APIMonitoringService);
    });

    it('should maintain state across instances', () => {
      const instance1 = APIMonitoringService.getInstance();
      const instance2 = getAPIMonitoringService();

      instance1.recordMetric({
        endpoint: '/api/singleton-test',
        method: 'GET',
        statusCode: 200,
        responseTime: 100,
      });

      const healthMetrics1 = instance1.getHealthMetrics();
      const healthMetrics2 = instance2.getHealthMetrics();

      expect(healthMetrics1.totalRequests).toBe(healthMetrics2.totalRequests);
      expect(healthMetrics1.totalRequests).toBe(1);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle high-frequency metric recording', () => {
      const startTime = Date.now();
      
      // Record 1000 metrics rapidly
      for (let i = 0; i < 1000; i++) {
        monitoringService.recordMetric({
          endpoint: `/api/perf-test-${i % 10}`, // 10 different endpoints
          method: 'GET',
          statusCode: i % 10 === 0 ? 500 : 200, // 10% error rate
          responseTime: Math.random() * 500 + 50,
          userId: `user-${i % 50}`, // 50 different users
        });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second

      const healthMetrics = monitoringService.getHealthMetrics();
      expect(healthMetrics.totalRequests).toBe(1000);
      expect(healthMetrics.activeUsers).toBe(50);
      expect(healthMetrics.errorRate).toBeCloseTo(10, 1);
    });

    it('should handle edge case values gracefully', () => {
      const edgeCases = [
        { responseTime: 0, statusCode: 200 },
        { responseTime: 999999, statusCode: 200 },
        { responseTime: 100, statusCode: 999 },
        { responseTime: 100, statusCode: 100 },
        { responseTime: -1, statusCode: 200 }, // Invalid but should not crash
      ];

      edgeCases.forEach((metric, index) => {
        expect(() => {
          monitoringService.recordMetric({
            endpoint: `/api/edge-case-${index}`,
            method: 'GET',
            ...metric,
          });
        }).not.toThrow();
      });

      const healthMetrics = monitoringService.getHealthMetrics();
      expect(healthMetrics.totalRequests).toBe(edgeCases.length);
    });

    it('should handle concurrent metric recording', async () => {
      const concurrentRequests = 100;
      
      const promises = Array(concurrentRequests).fill(null).map((_, i) => 
        new Promise<void>(resolve => {
          setTimeout(() => {
            monitoringService.recordMetric({
              endpoint: `/api/concurrent-${i}`,
              method: 'GET',
              statusCode: 200,
              responseTime: Math.random() * 200 + 50,
              userId: `concurrent-user-${i}`,
            });
            resolve();
          }, Math.random() * 10); // Random delay up to 10ms
        })
      );

      await Promise.all(promises);

      const healthMetrics = monitoringService.getHealthMetrics();
      expect(healthMetrics.totalRequests).toBe(concurrentRequests);
      expect(healthMetrics.activeUsers).toBe(concurrentRequests);
    });

    it('should maintain performance with large datasets', () => {
      // Add a large number of metrics
      const largeDatasetSize = 10000;
      
      for (let i = 0; i < largeDatasetSize; i++) {
        monitoringService.recordMetric({
          endpoint: `/api/large-dataset-${i % 100}`,
          method: i % 2 === 0 ? 'GET' : 'POST',
          statusCode: i % 20 === 0 ? 500 : 200,
          responseTime: Math.random() * 1000 + 50,
          userId: `large-user-${i % 1000}`,
          tokensUsed: Math.floor(Math.random() * 100),
        });
      }

      // Operations should still be fast
      const startTime = Date.now();
      
      const healthMetrics = monitoringService.getHealthMetrics();
      const endpointMetrics = monitoringService.getEndpointMetrics();
      const userMetrics = monitoringService.getUserMetrics('large-user-0');
      
      const operationTime = Date.now() - startTime;
      
      expect(operationTime).toBeLessThan(100); // Should complete within 100ms
      expect(healthMetrics.totalRequests).toBe(largeDatasetSize);
      expect(Object.keys(endpointMetrics).length).toBe(200); // 100 GET + 100 POST endpoints
      expect(userMetrics.totalRequests).toBeGreaterThan(0);
    });
  });
});