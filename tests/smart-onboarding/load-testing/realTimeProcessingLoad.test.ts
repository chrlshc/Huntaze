import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { LoadTestFramework, LoadTestConfig, LoadTestResult } from '../../../lib/smart-onboarding/testing/loadTestFramework';
import { BehaviorEvent } from '../../../lib/smart-onboarding/types';

describe('Real-Time Processing Load Tests', () => {
  let loadTester: LoadTestFramework;

  beforeEach(() => {
    loadTester = new LoadTestFramework();
  });

  afterEach(() => {
    loadTester.cleanup();
  });

  describe('Behavioral Event Processing', () => {
    it('should handle high-volume behavioral events', async () => {
      const config: LoadTestConfig = {
        testType: 'behavioral_events',
        duration: 30000, // 30 seconds
        concurrentUsers: 100,
        eventsPerSecond: 50,
        rampUpTime: 5000,
        targetEndpoints: ['/api/smart-onboarding/analytics/track'],
        expectedResponseTime: 100, // 100ms
        expectedSuccessRate: 99
      };

      const result = await loadTester.runLoadTest(config);

      expect(result.completed).toBe(true);
      expect(result.totalRequests).toBeGreaterThan(1000);
      expect(result.successRate).toBeGreaterThan(95);
      expect(result.averageResponseTime).toBeLessThan(200);
      expect(result.errors.length).toBeLessThan(result.totalRequests * 0.05);
      
      // Check that 95th percentile is reasonable
      expect(result.responseTimePercentiles.p95).toBeLessThan(300);
    });

    it('should maintain performance under sustained load', async () => {
      const config: LoadTestConfig = {
        testType: 'sustained_load',
        duration: 60000, // 1 minute
        concurrentUsers: 50,
        eventsPerSecond: 25,
        rampUpTime: 10000,
        targetEndpoints: [
          '/api/smart-onboarding/analytics/track',
          '/api/smart-onboarding/analytics/engagement'
        ],
        expectedResponseTime: 150,
        expectedSuccessRate: 98
      };

      const result = await loadTester.runLoadTest(config);

      expect(result.completed).toBe(true);
      expect(result.successRate).toBeGreaterThan(95);
      
      // Performance should not degrade significantly over time
      const firstHalfRequests = result.requestTimeline.filter(r => 
        r.timestamp < result.startTime + config.duration / 2
      );
      const secondHalfRequests = result.requestTimeline.filter(r => 
        r.timestamp >= result.startTime + config.duration / 2
      );

      if (firstHalfRequests.length > 0 && secondHalfRequests.length > 0) {
        const firstHalfAvg = firstHalfRequests.reduce((sum, r) => sum + r.responseTime, 0) / firstHalfRequests.length;
        const secondHalfAvg = secondHalfRequests.reduce((sum, r) => sum + r.responseTime, 0) / secondHalfRequests.length;
        
        // Second half should not be more than 50% slower
        expect(secondHalfAvg).toBeLessThan(firstHalfAvg * 1.5);
      }
    });
  });

  describe('ML Prediction Load', () => {
    it('should handle concurrent ML predictions', async () => {
      const config: LoadTestConfig = {
        testType: 'ml_predictions',
        duration: 45000, // 45 seconds
        concurrentUsers: 25,
        eventsPerSecond: 10,
        rampUpTime: 5000,
        targetEndpoints: [
          '/api/smart-onboarding/ml/persona',
          '/api/smart-onboarding/ml/success-prediction',
          '/api/smart-onboarding/ml/learning-path'
        ],
        expectedResponseTime: 2000, // ML predictions can be slower
        expectedSuccessRate: 95
      };

      const result = await loadTester.runLoadTest(config);

      expect(result.completed).toBe(true);
      expect(result.successRate).toBeGreaterThan(90);
      expect(result.averageResponseTime).toBeLessThan(3000);
      
      // ML endpoints should handle the load
      const mlErrors = result.errors.filter(error => 
        error.endpoint.includes('/ml/')
      );
      expect(mlErrors.length).toBeLessThan(result.totalRequests * 0.1);
    });

    it('should test model endpoint failover', async () => {
      const config: LoadTestConfig = {
        testType: 'failover_test',
        duration: 30000,
        concurrentUsers: 20,
        eventsPerSecond: 5,
        targetEndpoints: ['/api/smart-onboarding/ml-pipeline/predict'],
        expectedResponseTime: 1000,
        expectedSuccessRate: 90,
        failureSimulation: {
          enabled: true,
          failureRate: 0.1, // 10% of requests should simulate endpoint failure
          failureType: 'endpoint_unavailable'
        }
      };

      const result = await loadTester.runLoadTest(config);

      // Even with simulated failures, should maintain reasonable success rate
      expect(result.successRate).toBeGreaterThan(85);
      
      // Should have some failover events
      const failoverEvents = result.errors.filter(error => 
        error.type === 'failover' || error.message.includes('failover')
      );
      expect(failoverEvents.length).toBeGreaterThan(0);
    });
  });

  describe('WebSocket Load Testing', () => {
    it('should handle multiple concurrent WebSocket connections', async () => {
      const config: LoadTestConfig = {
        testType: 'websocket_load',
        duration: 20000,
        concurrentUsers: 200,
        eventsPerSecond: 100,
        targetEndpoints: ['ws://localhost:3000/smart-onboarding/realtime'],
        expectedResponseTime: 50,
        expectedSuccessRate: 98
      };

      const result = await loadTester.runLoadTest(config);

      expect(result.completed).toBe(true);
      expect(result.successRate).toBeGreaterThan(95);
      expect(result.averageResponseTime).toBeLessThan(100);
      
      // WebSocket connections should be stable
      const connectionErrors = result.errors.filter(error => 
        error.type === 'connection_error' || error.message.includes('connection')
      );
      expect(connectionErrors.length).toBeLessThan(result.totalRequests * 0.02);
    });

    it('should test real-time event broadcasting', async () => {
      const config: LoadTestConfig = {
        testType: 'broadcast_test',
        duration: 15000,
        concurrentUsers: 50,
        eventsPerSecond: 20,
        targetEndpoints: ['ws://localhost:3000/smart-onboarding/realtime'],
        expectedResponseTime: 25,
        expectedSuccessRate: 99
      };

      const result = await loadTester.runLoadTest(config);

      expect(result.completed).toBe(true);
      expect(result.averageResponseTime).toBeLessThan(50);
      
      // Broadcast events should be delivered quickly
      const broadcastLatencies = result.requestTimeline
        .filter(r => r.requestType === 'broadcast')
        .map(r => r.responseTime);
      
      if (broadcastLatencies.length > 0) {
        const avgBroadcastLatency = broadcastLatencies.reduce((sum, lat) => sum + lat, 0) / broadcastLatencies.length;
        expect(avgBroadcastLatency).toBeLessThan(30);
      }
    });
  });

  describe('Database Load Testing', () => {
    it('should handle high-volume data writes', async () => {
      const config: LoadTestConfig = {
        testType: 'database_writes',
        duration: 30000,
        concurrentUsers: 30,
        eventsPerSecond: 40,
        targetEndpoints: ['/api/smart-onboarding/analytics/track'],
        expectedResponseTime: 200,
        expectedSuccessRate: 97
      };

      const result = await loadTester.runLoadTest(config);

      expect(result.completed).toBe(true);
      expect(result.successRate).toBeGreaterThan(95);
      
      // Database writes should not cause significant slowdown
      expect(result.averageResponseTime).toBeLessThan(300);
      
      // Should not have database timeout errors
      const dbErrors = result.errors.filter(error => 
        error.message.includes('timeout') || error.message.includes('database')
      );
      expect(dbErrors.length).toBeLessThan(result.totalRequests * 0.03);
    });

    it('should test read performance under load', async () => {
      const config: LoadTestConfig = {
        testType: 'database_reads',
        duration: 25000,
        concurrentUsers: 100,
        eventsPerSecond: 80,
        targetEndpoints: [
          '/api/smart-onboarding/analytics/dashboard',
          '/api/smart-onboarding/analytics/insights'
        ],
        expectedResponseTime: 100,
        expectedSuccessRate: 99
      };

      const result = await loadTester.runLoadTest(config);

      expect(result.completed).toBe(true);
      expect(result.successRate).toBeGreaterThan(98);
      expect(result.averageResponseTime).toBeLessThan(150);
      
      // Read operations should be fast
      expect(result.responseTimePercentiles.p50).toBeLessThan(100);
      expect(result.responseTimePercentiles.p95).toBeLessThan(250);
    });
  });

  describe('Stress Testing', () => {
    it('should identify system breaking point', async () => {
      const config: LoadTestConfig = {
        testType: 'stress_test',
        duration: 60000,
        concurrentUsers: 500, // High load
        eventsPerSecond: 200,
        rampUpTime: 15000,
        targetEndpoints: ['/api/smart-onboarding/analytics/track'],
        expectedResponseTime: 500,
        expectedSuccessRate: 80 // Lower expectation for stress test
      };

      const result = await loadTester.runLoadTest(config);

      // Stress test might not complete successfully, but should provide insights
      expect(result.totalRequests).toBeGreaterThan(1000);
      
      // Should identify performance degradation
      if (result.successRate < 90) {
        expect(result.errors.length).toBeGreaterThan(0);
        
        // Should have performance-related errors
        const performanceErrors = result.errors.filter(error => 
          error.type === 'timeout' || error.type === 'server_error'
        );
        expect(performanceErrors.length).toBeGreaterThan(0);
      }
    });

    it('should test recovery after stress', async () => {
      // First, apply stress
      const stressConfig: LoadTestConfig = {
        testType: 'stress_test',
        duration: 20000,
        concurrentUsers: 300,
        eventsPerSecond: 150,
        targetEndpoints: ['/api/smart-onboarding/analytics/track'],
        expectedResponseTime: 1000,
        expectedSuccessRate: 70
      };

      await loadTester.runLoadTest(stressConfig);

      // Wait for recovery
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Test normal load after stress
      const normalConfig: LoadTestConfig = {
        testType: 'recovery_test',
        duration: 15000,
        concurrentUsers: 20,
        eventsPerSecond: 10,
        targetEndpoints: ['/api/smart-onboarding/analytics/track'],
        expectedResponseTime: 150,
        expectedSuccessRate: 98
      };

      const recoveryResult = await loadTester.runLoadTest(normalConfig);

      // System should recover to normal performance
      expect(recoveryResult.successRate).toBeGreaterThan(95);
      expect(recoveryResult.averageResponseTime).toBeLessThan(200);
    });
  });

  describe('Memory and Resource Testing', () => {
    it('should monitor memory usage during load', async () => {
      const config: LoadTestConfig = {
        testType: 'memory_test',
        duration: 30000,
        concurrentUsers: 50,
        eventsPerSecond: 30,
        targetEndpoints: ['/api/smart-onboarding/ml/persona'],
        expectedResponseTime: 500,
        expectedSuccessRate: 95,
        resourceMonitoring: {
          enabled: true,
          memoryThreshold: 1000, // 1GB
          cpuThreshold: 80 // 80%
        }
      };

      const result = await loadTester.runLoadTest(config);

      expect(result.resourceMetrics).toBeDefined();
      expect(result.resourceMetrics!.peakMemoryUsage).toBeLessThan(1500); // Should not exceed 1.5GB
      expect(result.resourceMetrics!.averageCpuUsage).toBeLessThan(90);
      
      // Should not have memory-related errors
      const memoryErrors = result.errors.filter(error => 
        error.message.includes('memory') || error.message.includes('heap')
      );
      expect(memoryErrors.length).toBe(0);
    });
  });
});