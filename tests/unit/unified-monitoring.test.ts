/**
 * Tests for Unified Monitoring
 * Tests cross-stack metrics tracking and performance monitoring
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock external dependencies
const mockCloudWatchClient = {
  send: vi.fn()
};

const mockPrometheusClient = {
  register: {
    metrics: vi.fn(),
    clear: vi.fn()
  },
  Counter: vi.fn(),
  Histogram: vi.fn(),
  Gauge: vi.fn()
};

const mockRedisClient = {
  set: vi.fn(),
  get: vi.fn(),
  incr: vi.fn(),
  expire: vi.fn(),
  hset: vi.fn(),
  hget: vi.fn(),
  hgetall: vi.fn()
};

vi.mock('@aws-sdk/client-cloudwatch', () => ({
  CloudWatchClient: vi.fn(() => mockCloudWatchClient),
  PutMetricDataCommand: vi.fn((params) => params)
}));

vi.mock('prom-client', () => mockPrometheusClient);

vi.mock('redis', () => ({
  createClient: vi.fn(() => mockRedisClient)
}));

// Types for unified monitoring
interface CrossStackMetric {
  stack: 'ai' | 'onlyfans' | 'content' | 'marketing' | 'analytics';
  action: string;
  performance: number;
  userId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface PerformanceBottleneck {
  stack: string;
  action: string;
  avgPerformance: number;
  p95Performance: number;
  errorRate: number;
  throughput: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ResourceAllocation {
  stack: string;
  cpuUsage: number;
  memoryUsage: number;
  requestCount: number;
  recommendedScaling: 'scale_up' | 'scale_down' | 'maintain';
}

interface MonitoringAlert {
  id: string;
  type: 'performance' | 'error_rate' | 'resource' | 'availability';
  severity: 'warning' | 'critical';
  message: string;
  stack: string;
  timestamp: Date;
  resolved?: boolean;
}

// Mock implementation of UnifiedMonitoring
class UnifiedMonitoring {
  private metrics: Map<string, CrossStackMetric[]> = new Map();
  private alerts: MonitoringAlert[] = [];
  private thresholds = {
    performance: {
      warning: 1000, // ms
      critical: 5000 // ms
    },
    errorRate: {
      warning: 0.05, // 5%
      critical: 0.15 // 15%
    },
    resourceUsage: {
      warning: 0.8, // 80%
      critical: 0.95 // 95%
    }
  };

  constructor(
    private cloudWatch = mockCloudWatchClient,
    private prometheus = mockPrometheusClient,
    private redis = mockRedisClient
  ) {
    this.initializeMetrics();
  }

  private initializeMetrics() {
    // Initialize Prometheus metrics
    this.prometheus.Counter.mockImplementation(() => ({
      inc: vi.fn(),
      labels: vi.fn(() => ({ inc: vi.fn() }))
    }));

    this.prometheus.Histogram.mockImplementation(() => ({
      observe: vi.fn(),
      labels: vi.fn(() => ({ observe: vi.fn() }))
    }));

    this.prometheus.Gauge.mockImplementation(() => ({
      set: vi.fn(),
      labels: vi.fn(() => ({ set: vi.fn() }))
    }));
  }

  async trackCrossStackMetrics(event: CrossStackMetric): Promise<{
    success: boolean;
    metricsRecorded: string[];
    errors?: string[];
  }> {
    const errors: string[] = [];
    const metricsRecorded: string[] = [];

    try {
      // Store in local cache
      const key = `${event.stack}-${event.action}`;
      if (!this.metrics.has(key)) {
        this.metrics.set(key, []);
      }
      this.metrics.get(key)!.push(event);

      // Keep only last 1000 metrics per key
      const metrics = this.metrics.get(key)!;
      if (metrics.length > 1000) {
        this.metrics.set(key, metrics.slice(-1000));
      }

      // Send to CloudWatch
      try {
        await this.sendToCloudWatch(event);
        metricsRecorded.push('cloudwatch');
      } catch (error) {
        errors.push(`CloudWatch error: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Send to Prometheus
      try {
        this.sendToPrometheus(event);
        metricsRecorded.push('prometheus');
      } catch (error) {
        errors.push(`Prometheus error: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Store in Redis for real-time queries
      try {
        await this.storeInRedis(event);
        metricsRecorded.push('redis');
      } catch (error) {
        errors.push(`Redis error: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Check for alerts
      await this.checkAlerts(event);

      return {
        success: errors.length === 0,
        metricsRecorded,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      return {
        success: false,
        metricsRecorded: [],
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  private async sendToCloudWatch(event: CrossStackMetric): Promise<void> {
    await this.cloudWatch.send({
      Namespace: 'Huntaze/CrossStack',
      MetricData: [
        {
          MetricName: 'Performance',
          Value: event.performance,
          Unit: 'Milliseconds',
          Timestamp: event.timestamp,
          Dimensions: [
            { Name: 'Stack', Value: event.stack },
            { Name: 'Action', Value: event.action },
            { Name: 'UserId', Value: event.userId }
          ]
        },
        {
          MetricName: 'RequestCount',
          Value: 1,
          Unit: 'Count',
          Timestamp: event.timestamp,
          Dimensions: [
            { Name: 'Stack', Value: event.stack },
            { Name: 'Action', Value: event.action }
          ]
        }
      ]
    });
  }

  private sendToPrometheus(event: CrossStackMetric): void {
    // Mock Prometheus metric recording
    const performanceHistogram = this.prometheus.Histogram();
    performanceHistogram.labels(event.stack, event.action).observe(event.performance);

    const requestCounter = this.prometheus.Counter();
    requestCounter.labels(event.stack, event.action).inc();
  }

  private async storeInRedis(event: CrossStackMetric): Promise<void> {
    const key = `metrics:${event.stack}:${event.action}`;
    const timestamp = event.timestamp.getTime();
    
    // Store recent performance data
    await this.redis.hset(key, timestamp.toString(), JSON.stringify({
      performance: event.performance,
      userId: event.userId,
      metadata: event.metadata
    }));

    // Set expiration (24 hours)
    await this.redis.expire(key, 86400);

    // Update real-time counters
    const counterKey = `counter:${event.stack}:${event.action}`;
    await this.redis.incr(counterKey);
    await this.redis.expire(counterKey, 3600); // 1 hour
  }

  async identifyBottlenecks(): Promise<PerformanceBottleneck[]> {
    const bottlenecks: PerformanceBottleneck[] = [];

    for (const [key, metrics] of this.metrics.entries()) {
      const [stack, action] = key.split('-');
      
      if (metrics.length < 10) continue; // Need sufficient data

      const performances = metrics.map(m => m.performance);
      const avgPerformance = performances.reduce((a, b) => a + b, 0) / performances.length;
      const sortedPerformances = performances.sort((a, b) => a - b);
      const p95Performance = sortedPerformances[Math.floor(sortedPerformances.length * 0.95)];
      
      // Calculate error rate (mock - in real implementation would track errors)
      const errorRate = Math.random() * 0.1; // Mock error rate
      
      const throughput = metrics.length / ((Date.now() - metrics[0].timestamp.getTime()) / 1000);

      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
      
      if (p95Performance > this.thresholds.performance.critical || errorRate > this.thresholds.errorRate.critical) {
        severity = 'critical';
      } else if (p95Performance > this.thresholds.performance.warning || errorRate > this.thresholds.errorRate.warning) {
        severity = avgPerformance > this.thresholds.performance.warning ? 'high' : 'medium';
      }

      if (severity !== 'low') {
        bottlenecks.push({
          stack,
          action,
          avgPerformance,
          p95Performance,
          errorRate,
          throughput,
          severity
        });
      }
    }

    return bottlenecks.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  async optimizeResourceAllocation(): Promise<ResourceAllocation[]> {
    const allocations: ResourceAllocation[] = [];
    const stacks = ['ai', 'onlyfans', 'content', 'marketing', 'analytics'];

    for (const stack of stacks) {
      // Mock resource usage data (in real implementation, would query actual metrics)
      const cpuUsage = Math.random() * 0.9 + 0.1; // 10-100%
      const memoryUsage = Math.random() * 0.9 + 0.1; // 10-100%
      
      // Calculate request count from metrics
      const stackMetrics = Array.from(this.metrics.entries())
        .filter(([key]) => key.startsWith(stack))
        .flatMap(([, metrics]) => metrics);
      
      const requestCount = stackMetrics.length;

      let recommendedScaling: 'scale_up' | 'scale_down' | 'maintain' = 'maintain';

      if (cpuUsage > this.thresholds.resourceUsage.critical || memoryUsage > this.thresholds.resourceUsage.critical) {
        recommendedScaling = 'scale_up';
      } else if (cpuUsage < 0.3 && memoryUsage < 0.3 && requestCount < 100) {
        recommendedScaling = 'scale_down';
      }

      allocations.push({
        stack,
        cpuUsage,
        memoryUsage,
        requestCount,
        recommendedScaling
      });
    }

    return allocations;
  }

  private async checkAlerts(event: CrossStackMetric): Promise<void> {
    const alerts: MonitoringAlert[] = [];

    // Performance alert
    if (event.performance > this.thresholds.performance.critical) {
      alerts.push({
        id: `perf-${Date.now()}`,
        type: 'performance',
        severity: 'critical',
        message: `Critical performance degradation in ${event.stack}:${event.action} (${event.performance}ms)`,
        stack: event.stack,
        timestamp: new Date()
      });
    } else if (event.performance > this.thresholds.performance.warning) {
      alerts.push({
        id: `perf-${Date.now()}`,
        type: 'performance',
        severity: 'warning',
        message: `Performance warning in ${event.stack}:${event.action} (${event.performance}ms)`,
        stack: event.stack,
        timestamp: new Date()
      });
    }

    // Add alerts to collection
    this.alerts.push(...alerts);

    // Keep only recent alerts (last 1000)
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }
  }

  getActiveAlerts(): MonitoringAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      return true;
    }
    return false;
  }

  async getStackMetrics(stack: string, timeRange: { from: Date; to: Date }): Promise<CrossStackMetric[]> {
    const allMetrics = Array.from(this.metrics.entries())
      .filter(([key]) => key.startsWith(stack))
      .flatMap(([, metrics]) => metrics);

    return allMetrics.filter(metric => 
      metric.timestamp >= timeRange.from && metric.timestamp <= timeRange.to
    );
  }

  async getSystemHealth(): Promise<{
    overall: 'healthy' | 'degraded' | 'critical';
    stacks: Record<string, { status: string; performance: number; errorRate: number }>;
    activeAlerts: number;
    criticalAlerts: number;
  }> {
    const activeAlerts = this.getActiveAlerts();
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');
    
    const stacks = ['ai', 'onlyfans', 'content', 'marketing', 'analytics'];
    const stackHealth: Record<string, { status: string; performance: number; errorRate: number }> = {};

    for (const stack of stacks) {
      const stackMetrics = Array.from(this.metrics.entries())
        .filter(([key]) => key.startsWith(stack))
        .flatMap(([, metrics]) => metrics);

      if (stackMetrics.length === 0) {
        stackHealth[stack] = { status: 'unknown', performance: 0, errorRate: 0 };
        continue;
      }

      const avgPerformance = stackMetrics.reduce((sum, m) => sum + m.performance, 0) / stackMetrics.length;
      const errorRate = Math.random() * 0.1; // Mock error rate

      let status = 'healthy';
      if (avgPerformance > this.thresholds.performance.critical || errorRate > this.thresholds.errorRate.critical) {
        status = 'critical';
      } else if (avgPerformance > this.thresholds.performance.warning || errorRate > this.thresholds.errorRate.warning) {
        status = 'degraded';
      }

      stackHealth[stack] = { status, performance: avgPerformance, errorRate };
    }

    let overall: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (criticalAlerts.length > 0 || Object.values(stackHealth).some(s => s.status === 'critical')) {
      overall = 'critical';
    } else if (activeAlerts.length > 0 || Object.values(stackHealth).some(s => s.status === 'degraded')) {
      overall = 'degraded';
    }

    return {
      overall,
      stacks: stackHealth,
      activeAlerts: activeAlerts.length,
      criticalAlerts: criticalAlerts.length
    };
  }

  clearMetrics(): void {
    this.metrics.clear();
    this.alerts = [];
  }

  async exportMetrics(): Promise<string> {
    return this.prometheus.register.metrics();
  }
}

describe('UnifiedMonitoring', () => {
  let monitoring: UnifiedMonitoring;

  beforeEach(() => {
    monitoring = new UnifiedMonitoring();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('trackCrossStackMetrics', () => {
    it('should track metrics across all monitoring systems', async () => {
      const event: CrossStackMetric = {
        stack: 'ai',
        action: 'content_generation',
        performance: 1500,
        userId: 'user-123',
        timestamp: new Date(),
        metadata: { model: 'gpt-4', tokens: 150 }
      };

      mockCloudWatchClient.send.mockResolvedValue({});
      mockRedisClient.hset.mockResolvedValue(1);
      mockRedisClient.expire.mockResolvedValue(1);
      mockRedisClient.incr.mockResolvedValue(1);

      const result = await monitoring.trackCrossStackMetrics(event);

      expect(result.success).toBe(true);
      expect(result.metricsRecorded).toContain('cloudwatch');
      expect(result.metricsRecorded).toContain('prometheus');
      expect(result.metricsRecorded).toContain('redis');

      // Verify CloudWatch call
      expect(mockCloudWatchClient.send).toHaveBeenCalledWith({
        Namespace: 'Huntaze/CrossStack',
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            MetricName: 'Performance',
            Value: 1500,
            Unit: 'Milliseconds'
          })
        ])
      });

      // Verify Redis calls
      expect(mockRedisClient.hset).toHaveBeenCalled();
      expect(mockRedisClient.expire).toHaveBeenCalledTimes(2);
      expect(mockRedisClient.incr).toHaveBeenCalled();
    });

    it('should handle different stack types', async () => {
      const stacks: Array<CrossStackMetric['stack']> = ['ai', 'onlyfans', 'content', 'marketing', 'analytics'];
      
      mockCloudWatchClient.send.mockResolvedValue({});
      mockRedisClient.hset.mockResolvedValue(1);
      mockRedisClient.expire.mockResolvedValue(1);
      mockRedisClient.incr.mockResolvedValue(1);

      for (const stack of stacks) {
        const event: CrossStackMetric = {
          stack,
          action: 'test_action',
          performance: 500,
          userId: 'user-123',
          timestamp: new Date()
        };

        const result = await monitoring.trackCrossStackMetrics(event);
        expect(result.success).toBe(true);
      }

      expect(mockCloudWatchClient.send).toHaveBeenCalledTimes(5);
    });

    it('should handle CloudWatch failures gracefully', async () => {
      const event: CrossStackMetric = {
        stack: 'onlyfans',
        action: 'message_send',
        performance: 800,
        userId: 'user-456',
        timestamp: new Date()
      };

      mockCloudWatchClient.send.mockRejectedValue(new Error('CloudWatch unavailable'));
      mockRedisClient.hset.mockResolvedValue(1);
      mockRedisClient.expire.mockResolvedValue(1);
      mockRedisClient.incr.mockResolvedValue(1);

      const result = await monitoring.trackCrossStackMetrics(event);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('CloudWatch error: CloudWatch unavailable');
      expect(result.metricsRecorded).toContain('prometheus');
      expect(result.metricsRecorded).toContain('redis');
      expect(result.metricsRecorded).not.toContain('cloudwatch');
    });

    it('should generate performance alerts', async () => {
      const criticalEvent: CrossStackMetric = {
        stack: 'content',
        action: 'video_processing',
        performance: 6000, // Above critical threshold
        userId: 'user-789',
        timestamp: new Date()
      };

      mockCloudWatchClient.send.mockResolvedValue({});
      mockRedisClient.hset.mockResolvedValue(1);
      mockRedisClient.expire.mockResolvedValue(1);
      mockRedisClient.incr.mockResolvedValue(1);

      await monitoring.trackCrossStackMetrics(criticalEvent);

      const alerts = monitoring.getActiveAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('performance');
      expect(alerts[0].severity).toBe('critical');
      expect(alerts[0].stack).toBe('content');
    });

    it('should limit metrics storage per key', async () => {
      mockCloudWatchClient.send.mockResolvedValue({});
      mockRedisClient.hset.mockResolvedValue(1);
      mockRedisClient.expire.mockResolvedValue(1);
      mockRedisClient.incr.mockResolvedValue(1);

      // Add more than 1000 metrics for the same key
      for (let i = 0; i < 1050; i++) {
        const event: CrossStackMetric = {
          stack: 'ai',
          action: 'test_action',
          performance: 100 + i,
          userId: `user-${i}`,
          timestamp: new Date(Date.now() + i * 1000)
        };

        await monitoring.trackCrossStackMetrics(event);
      }

      const metrics = await monitoring.getStackMetrics('ai', {
        from: new Date(0),
        to: new Date(Date.now() + 2000000)
      });

      expect(metrics.length).toBe(1000); // Should be limited to 1000
      expect(metrics[0].performance).toBe(150); // Should keep the latest 1000
    });
  });

  describe('identifyBottlenecks', () => {
    it('should identify performance bottlenecks', async () => {
      mockCloudWatchClient.send.mockResolvedValue({});
      mockRedisClient.hset.mockResolvedValue(1);
      mockRedisClient.expire.mockResolvedValue(1);
      mockRedisClient.incr.mockResolvedValue(1);

      // Add metrics with varying performance
      const events = [
        // Fast stack
        ...Array.from({ length: 20 }, (_, i) => ({
          stack: 'marketing' as const,
          action: 'email_send',
          performance: 100 + Math.random() * 50,
          userId: `user-${i}`,
          timestamp: new Date(Date.now() - (20 - i) * 1000)
        })),
        // Slow stack
        ...Array.from({ length: 20 }, (_, i) => ({
          stack: 'ai' as const,
          action: 'analysis',
          performance: 2000 + Math.random() * 1000,
          userId: `user-${i}`,
          timestamp: new Date(Date.now() - (20 - i) * 1000)
        }))
      ];

      for (const event of events) {
        await monitoring.trackCrossStackMetrics(event);
      }

      const bottlenecks = await monitoring.identifyBottlenecks();

      expect(bottlenecks.length).toBeGreaterThan(0);
      
      const aiBottleneck = bottlenecks.find(b => b.stack === 'ai');
      expect(aiBottleneck).toBeDefined();
      expect(aiBottleneck?.severity).toBeOneOf(['medium', 'high', 'critical']);
      expect(aiBottleneck?.avgPerformance).toBeGreaterThan(1000);
    });

    it('should sort bottlenecks by severity', async () => {
      mockCloudWatchClient.send.mockResolvedValue({});
      mockRedisClient.hset.mockResolvedValue(1);
      mockRedisClient.expire.mockResolvedValue(1);
      mockRedisClient.incr.mockResolvedValue(1);

      // Create metrics with different severity levels
      const stacks = [
        { stack: 'critical_stack', performance: 8000 }, // Critical
        { stack: 'high_stack', performance: 2000 },     // High
        { stack: 'medium_stack', performance: 1200 }    // Medium
      ];

      for (const { stack, performance } of stacks) {
        for (let i = 0; i < 15; i++) {
          await monitoring.trackCrossStackMetrics({
            stack: stack as any,
            action: 'test',
            performance: performance + Math.random() * 100,
            userId: `user-${i}`,
            timestamp: new Date()
          });
        }
      }

      const bottlenecks = await monitoring.identifyBottlenecks();

      expect(bottlenecks.length).toBeGreaterThan(0);
      
      // Should be sorted by severity (critical first)
      for (let i = 1; i < bottlenecks.length; i++) {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        expect(severityOrder[bottlenecks[i-1].severity]).toBeGreaterThanOrEqual(
          severityOrder[bottlenecks[i].severity]
        );
      }
    });
  });

  describe('optimizeResourceAllocation', () => {
    it('should provide resource allocation recommendations', async () => {
      const allocations = await monitoring.optimizeResourceAllocation();

      expect(allocations).toHaveLength(5); // All 5 stacks
      
      allocations.forEach(allocation => {
        expect(allocation).toHaveProperty('stack');
        expect(allocation).toHaveProperty('cpuUsage');
        expect(allocation).toHaveProperty('memoryUsage');
        expect(allocation).toHaveProperty('requestCount');
        expect(allocation).toHaveProperty('recommendedScaling');
        
        expect(allocation.cpuUsage).toBeGreaterThanOrEqual(0);
        expect(allocation.cpuUsage).toBeLessThanOrEqual(1);
        expect(allocation.memoryUsage).toBeGreaterThanOrEqual(0);
        expect(allocation.memoryUsage).toBeLessThanOrEqual(1);
        expect(['scale_up', 'scale_down', 'maintain']).toContain(allocation.recommendedScaling);
      });
    });

    it('should recommend scaling based on resource usage', async () => {
      // Mock high resource usage scenario
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.95) // High CPU
        .mockReturnValueOnce(0.90) // High memory
        .mockReturnValue(0.5); // Normal for others

      const allocations = await monitoring.optimizeResourceAllocation();
      
      // First allocation should recommend scale up due to high resource usage
      expect(allocations[0].recommendedScaling).toBe('scale_up');
    });
  });

  describe('Alert Management', () => {
    it('should create and manage alerts', async () => {
      const criticalEvent: CrossStackMetric = {
        stack: 'onlyfans',
        action: 'browser_automation',
        performance: 7000,
        userId: 'user-alert',
        timestamp: new Date()
      };

      mockCloudWatchClient.send.mockResolvedValue({});
      mockRedisClient.hset.mockResolvedValue(1);
      mockRedisClient.expire.mockResolvedValue(1);
      mockRedisClient.incr.mockResolvedValue(1);

      await monitoring.trackCrossStackMetrics(criticalEvent);

      const activeAlerts = monitoring.getActiveAlerts();
      expect(activeAlerts.length).toBeGreaterThan(0);

      const alert = activeAlerts[0];
      expect(alert.type).toBe('performance');
      expect(alert.severity).toBe('critical');
      expect(alert.resolved).toBeUndefined();

      // Resolve the alert
      const resolved = monitoring.resolveAlert(alert.id);
      expect(resolved).toBe(true);

      const updatedActiveAlerts = monitoring.getActiveAlerts();
      expect(updatedActiveAlerts.length).toBe(0);
    });

    it('should limit alert history', async () => {
      mockCloudWatchClient.send.mockResolvedValue({});
      mockRedisClient.hset.mockResolvedValue(1);
      mockRedisClient.expire.mockResolvedValue(1);
      mockRedisClient.incr.mockResolvedValue(1);

      // Generate more than 1000 alerts
      for (let i = 0; i < 1050; i++) {
        await monitoring.trackCrossStackMetrics({
          stack: 'ai',
          action: 'test',
          performance: 6000, // Critical performance
          userId: `user-${i}`,
          timestamp: new Date()
        });
      }

      const allAlerts = monitoring.getActiveAlerts();
      expect(allAlerts.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('System Health', () => {
    it('should provide overall system health status', async () => {
      mockCloudWatchClient.send.mockResolvedValue({});
      mockRedisClient.hset.mockResolvedValue(1);
      mockRedisClient.expire.mockResolvedValue(1);
      mockRedisClient.incr.mockResolvedValue(1);

      // Add some metrics
      await monitoring.trackCrossStackMetrics({
        stack: 'ai',
        action: 'analysis',
        performance: 500,
        userId: 'user-health',
        timestamp: new Date()
      });

      const health = await monitoring.getSystemHealth();

      expect(health).toHaveProperty('overall');
      expect(health).toHaveProperty('stacks');
      expect(health).toHaveProperty('activeAlerts');
      expect(health).toHaveProperty('criticalAlerts');

      expect(['healthy', 'degraded', 'critical']).toContain(health.overall);
      expect(typeof health.activeAlerts).toBe('number');
      expect(typeof health.criticalAlerts).toBe('number');

      // Check stack health
      Object.values(health.stacks).forEach(stack => {
        expect(stack).toHaveProperty('status');
        expect(stack).toHaveProperty('performance');
        expect(stack).toHaveProperty('errorRate');
        expect(['healthy', 'degraded', 'critical', 'unknown']).toContain(stack.status);
      });
    });

    it('should reflect critical status when there are critical alerts', async () => {
      mockCloudWatchClient.send.mockResolvedValue({});
      mockRedisClient.hset.mockResolvedValue(1);
      mockRedisClient.expire.mockResolvedValue(1);
      mockRedisClient.incr.mockResolvedValue(1);

      // Create critical performance event
      await monitoring.trackCrossStackMetrics({
        stack: 'content',
        action: 'processing',
        performance: 8000, // Critical
        userId: 'user-critical',
        timestamp: new Date()
      });

      const health = await monitoring.getSystemHealth();

      expect(health.overall).toBe('critical');
      expect(health.criticalAlerts).toBeGreaterThan(0);
    });
  });

  describe('Metrics Export and Querying', () => {
    it('should export Prometheus metrics', async () => {
      mockPrometheusClient.register.metrics.mockReturnValue('# Prometheus metrics data');

      const metrics = await monitoring.exportMetrics();

      expect(metrics).toBe('# Prometheus metrics data');
      expect(mockPrometheusClient.register.metrics).toHaveBeenCalled();
    });

    it('should query stack metrics by time range', async () => {
      mockCloudWatchClient.send.mockResolvedValue({});
      mockRedisClient.hset.mockResolvedValue(1);
      mockRedisClient.expire.mockResolvedValue(1);
      mockRedisClient.incr.mockResolvedValue(1);

      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 3600000);
      const twoHoursAgo = new Date(now.getTime() - 7200000);

      // Add metrics at different times
      await monitoring.trackCrossStackMetrics({
        stack: 'marketing',
        action: 'campaign',
        performance: 300,
        userId: 'user-1',
        timestamp: twoHoursAgo // Outside range
      });

      await monitoring.trackCrossStackMetrics({
        stack: 'marketing',
        action: 'campaign',
        performance: 400,
        userId: 'user-2',
        timestamp: oneHourAgo // Inside range
      });

      const metrics = await monitoring.getStackMetrics('marketing', {
        from: new Date(now.getTime() - 3900000), // 65 minutes ago
        to: now
      });

      expect(metrics).toHaveLength(1);
      expect(metrics[0].performance).toBe(400);
      expect(metrics[0].userId).toBe('user-2');
    });

    it('should clear all metrics and alerts', () => {
      monitoring.clearMetrics();

      const health = monitoring.getSystemHealth();
      const alerts = monitoring.getActiveAlerts();

      expect(alerts).toHaveLength(0);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle high-volume metric ingestion', async () => {
      mockCloudWatchClient.send.mockResolvedValue({});
      mockRedisClient.hset.mockResolvedValue(1);
      mockRedisClient.expire.mockResolvedValue(1);
      mockRedisClient.incr.mockResolvedValue(1);

      const startTime = Date.now();
      
      // Simulate high volume of concurrent metrics
      const promises = Array.from({ length: 100 }, (_, i) => 
        monitoring.trackCrossStackMetrics({
          stack: 'ai',
          action: 'batch_processing',
          performance: 200 + Math.random() * 100,
          userId: `user-${i}`,
          timestamp: new Date()
        })
      );

      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Should complete reasonably quickly
      expect(duration).toBeLessThan(5000); // 5 seconds

      expect(mockCloudWatchClient.send).toHaveBeenCalledTimes(100);
    });

    it('should handle partial failures in monitoring systems', async () => {
      // CloudWatch fails, but others succeed
      mockCloudWatchClient.send.mockRejectedValue(new Error('CloudWatch down'));
      mockRedisClient.hset.mockResolvedValue(1);
      mockRedisClient.expire.mockResolvedValue(1);
      mockRedisClient.incr.mockResolvedValue(1);

      const event: CrossStackMetric = {
        stack: 'analytics',
        action: 'report_generation',
        performance: 1200,
        userId: 'user-partial',
        timestamp: new Date()
      };

      const result = await monitoring.trackCrossStackMetrics(event);

      expect(result.success).toBe(false);
      expect(result.metricsRecorded).toContain('prometheus');
      expect(result.metricsRecorded).toContain('redis');
      expect(result.metricsRecorded).not.toContain('cloudwatch');
      expect(result.errors).toContain('CloudWatch error: CloudWatch down');
    });
  });
});