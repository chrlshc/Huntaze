/**
 * Alerting System for Golden Signals
 * Implements SLO-based alerting with escalation
 */

import { goldenSignals } from './telemetry';

interface AlertRule {
  name: string;
  description: string;
  metric: string;
  threshold: number;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  duration: number; // seconds
  severity: 'critical' | 'warning' | 'info';
  runbook?: string;
}

interface Alert {
  id: string;
  rule: AlertRule;
  value: number;
  timestamp: Date;
  status: 'firing' | 'resolved';
  escalated: boolean;
}

interface SLO {
  name: string;
  description: string;
  target: number; // percentage (e.g., 99.9)
  window: number; // seconds
  errorBudget: number; // calculated from target
}

class AlertManager {
  private static instance: AlertManager;
  private alerts = new Map<string, Alert>();
  private alertHistory: Alert[] = [];
  private slos: SLO[] = [];
  private rules: AlertRule[] = [];

  constructor() {
    this.initializeDefaultRules();
    this.initializeDefaultSLOs();
    // Avoid long-running intervals during `next build` (page data collection runs server code).
    if (process.env.NEXT_PHASE !== 'phase-production-build') {
      this.startAlertEvaluation();
    }
  }

  static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager();
    }
    return AlertManager.instance;
  }

  private initializeDefaultRules() {
    this.rules = [
      // LATENCY alerts
      {
        name: 'HighLatencyP95',
        description: 'P95 latency is above 1000ms',
        metric: 'http_request_duration_p95',
        threshold: 1000,
        operator: 'gt',
        duration: 300, // 5 minutes
        severity: 'warning',
        runbook: 'https://docs.huntaze.com/runbooks/high-latency',
      },
      {
        name: 'HighLatencyP99',
        description: 'P99 latency is above 2000ms',
        metric: 'http_request_duration_p99',
        threshold: 2000,
        operator: 'gt',
        duration: 180, // 3 minutes
        severity: 'critical',
        runbook: 'https://docs.huntaze.com/runbooks/high-latency',
      },

      // ERROR RATE alerts
      {
        name: 'HighErrorRate',
        description: 'Error rate is above 5%',
        metric: 'http_error_rate',
        threshold: 5,
        operator: 'gt',
        duration: 300, // 5 minutes
        severity: 'critical',
        runbook: 'https://docs.huntaze.com/runbooks/high-error-rate',
      },
      {
        name: 'DatabaseErrors',
        description: 'Database error rate is above 1%',
        metric: 'db_error_rate',
        threshold: 1,
        operator: 'gt',
        duration: 180, // 3 minutes
        severity: 'warning',
        runbook: 'https://docs.huntaze.com/runbooks/database-errors',
      },

      // SATURATION alerts
      {
        name: 'HighMemoryUsage',
        description: 'Memory usage is above 85%',
        metric: 'memory_usage_percent',
        threshold: 85,
        operator: 'gt',
        duration: 600, // 10 minutes
        severity: 'warning',
        runbook: 'https://docs.huntaze.com/runbooks/high-memory',
      },
      {
        name: 'CriticalMemoryUsage',
        description: 'Memory usage is above 95%',
        metric: 'memory_usage_percent',
        threshold: 95,
        operator: 'gt',
        duration: 300, // 5 minutes
        severity: 'critical',
        runbook: 'https://docs.huntaze.com/runbooks/critical-memory',
      },

      // TRAFFIC alerts
      {
        name: 'LowTraffic',
        description: 'Request rate is unusually low',
        metric: 'http_requests_per_second',
        threshold: 0.1,
        operator: 'lt',
        duration: 900, // 15 minutes
        severity: 'warning',
        runbook: 'https://docs.huntaze.com/runbooks/low-traffic',
      },
      {
        name: 'HighTraffic',
        description: 'Request rate is unusually high',
        metric: 'http_requests_per_second',
        threshold: 100,
        operator: 'gt',
        duration: 300, // 5 minutes
        severity: 'info',
        runbook: 'https://docs.huntaze.com/runbooks/high-traffic',
      },

      // CACHE alerts
      {
        name: 'LowCacheHitRate',
        description: 'Cache hit rate is below 70%',
        metric: 'cache_hit_rate',
        threshold: 70,
        operator: 'lt',
        duration: 600, // 10 minutes
        severity: 'warning',
        runbook: 'https://docs.huntaze.com/runbooks/low-cache-hit-rate',
      },
    ];
  }

  private initializeDefaultSLOs() {
    this.slos = [
      {
        name: 'API Availability',
        description: '99.9% of API requests should succeed',
        target: 99.9,
        window: 86400, // 24 hours
        errorBudget: 0.1,
      },
      {
        name: 'API Latency',
        description: '95% of API requests should complete within 500ms',
        target: 95,
        window: 3600, // 1 hour
        errorBudget: 5,
      },
      {
        name: 'Landing Page Load Time',
        description: '99% of landing page loads should complete within 2s',
        target: 99,
        window: 3600, // 1 hour
        errorBudget: 1,
      },
    ];
  }

  private startAlertEvaluation() {
    // Evaluate alerts every 30 seconds
    setInterval(() => {
      this.evaluateAlerts();
    }, 30000);

    console.log('🚨 Alert evaluation started (30s interval)');
  }

  private async evaluateAlerts() {
    for (const rule of this.rules) {
      try {
        const value = await this.getMetricValue(rule.metric);
        const shouldAlert = this.evaluateRule(rule, value);
        
        if (shouldAlert) {
          this.fireAlert(rule, value);
        } else {
          this.resolveAlert(rule.name);
        }
      } catch (error) {
        console.error(`Error evaluating alert rule ${rule.name}:`, error);
      }
    }
  }

  private evaluateRule(rule: AlertRule, value: number): boolean {
    switch (rule.operator) {
      case 'gt': return value > rule.threshold;
      case 'gte': return value >= rule.threshold;
      case 'lt': return value < rule.threshold;
      case 'lte': return value <= rule.threshold;
      case 'eq': return value === rule.threshold;
      default: return false;
    }
  }

  private async getMetricValue(metricName: string): Promise<number> {
    // This would integrate with your actual metrics backend
    // For now, we'll simulate some values based on system metrics
    
    switch (metricName) {
      case 'memory_usage_percent':
        const memUsage = process.memoryUsage();
        return (memUsage.heapUsed / memUsage.heapTotal) * 100;
      
      case 'http_error_rate':
        // Simulate error rate (would come from actual metrics)
        return Math.random() * 10; // 0-10%
      
      case 'http_request_duration_p95':
        // Simulate P95 latency (would come from actual metrics)
        return Math.random() * 2000; // 0-2000ms
      
      case 'http_request_duration_p99':
        // Simulate P99 latency (would come from actual metrics)
        return Math.random() * 3000; // 0-3000ms
      
      case 'cache_hit_rate':
        // Simulate cache hit rate (would come from actual metrics)
        return 60 + Math.random() * 40; // 60-100%
      
      case 'http_requests_per_second':
        // Simulate request rate (would come from actual metrics)
        return Math.random() * 50; // 0-50 RPS
      
      default:
        return 0;
    }
  }

  private fireAlert(rule: AlertRule, value: number) {
    const alertId = `${rule.name}_${Date.now()}`;
    const existingAlert = Array.from(this.alerts.values())
      .find(alert => alert.rule.name === rule.name && alert.status === 'firing');

    if (existingAlert) {
      // Alert already firing, update value
      existingAlert.value = value;
      existingAlert.timestamp = new Date();
      return;
    }

    const alert: Alert = {
      id: alertId,
      rule,
      value,
      timestamp: new Date(),
      status: 'firing',
      escalated: false,
    };

    this.alerts.set(alertId, alert);
    this.alertHistory.push(alert);

    // Send notification
    this.sendNotification(alert);

    console.log(`🚨 ALERT FIRED: ${rule.name} - ${rule.description} (value: ${value})`);
  }

  private resolveAlert(ruleName: string) {
    const firingAlert = Array.from(this.alerts.values())
      .find(alert => alert.rule.name === ruleName && alert.status === 'firing');

    if (firingAlert) {
      firingAlert.status = 'resolved';
      firingAlert.timestamp = new Date();
      
      // Send resolution notification
      this.sendResolutionNotification(firingAlert);
      
      console.log(`✅ ALERT RESOLVED: ${ruleName}`);
      
      // Remove from active alerts after a delay
      setTimeout(() => {
        this.alerts.delete(firingAlert.id);
      }, 300000); // 5 minutes
    }
  }

  private async sendNotification(alert: Alert) {
    // This would integrate with your notification system
    // (Slack, PagerDuty, email, etc.)
    
    const notification = {
      title: `🚨 ${alert.rule.severity.toUpperCase()}: ${alert.rule.name}`,
      message: alert.rule.description,
      value: alert.value,
      threshold: alert.rule.threshold,
      severity: alert.rule.severity,
      runbook: alert.rule.runbook,
      timestamp: alert.timestamp.toISOString(),
    };

    // Log for now (replace with actual notification service)
    console.log('📢 NOTIFICATION:', JSON.stringify(notification, null, 2));

    // In production, you would send to:
    // - Slack webhook
    // - PagerDuty API
    // - Email service
    // - SMS service
  }

  private async sendResolutionNotification(alert: Alert) {
    const notification = {
      title: `✅ RESOLVED: ${alert.rule.name}`,
      message: `Alert ${alert.rule.name} has been resolved`,
      severity: alert.rule.severity,
      timestamp: alert.timestamp.toISOString(),
    };

    console.log('📢 RESOLUTION:', JSON.stringify(notification, null, 2));
  }

  // Public API methods
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => alert.status === 'firing');
  }

  getAlertHistory(limit: number = 100): Alert[] {
    return this.alertHistory.slice(-limit);
  }

  getSLOs(): SLO[] {
    return this.slos;
  }

  getAlertRules(): AlertRule[] {
    return this.rules;
  }

  // Calculate SLO compliance
  async calculateSLOCompliance(sloName: string): Promise<{
    compliance: number;
    errorBudgetRemaining: number;
    status: 'healthy' | 'warning' | 'critical';
  }> {
    const slo = this.slos.find(s => s.name === sloName);
    if (!slo) {
      throw new Error(`SLO ${sloName} not found`);
    }

    // This would calculate actual compliance from metrics
    // For now, simulate compliance
    const compliance = 95 + Math.random() * 5; // 95-100%
    const errorBudgetRemaining = Math.max(0, slo.errorBudget - (100 - compliance));
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (compliance < slo.target - 1) {
      status = 'critical';
    } else if (compliance < slo.target - 0.5) {
      status = 'warning';
    }

    return {
      compliance,
      errorBudgetRemaining,
      status,
    };
  }

  // Health check for alerting system
  getHealth() {
    const activeAlerts = this.getActiveAlerts();
    const criticalAlerts = activeAlerts.filter(a => a.rule.severity === 'critical');
    
    return {
      status: criticalAlerts.length > 0 ? 'critical' : activeAlerts.length > 0 ? 'warning' : 'healthy',
      activeAlerts: activeAlerts.length,
      criticalAlerts: criticalAlerts.length,
      totalRules: this.rules.length,
      slos: this.slos.length,
      lastEvaluation: new Date().toISOString(),
    };
  }
}

export const alertManager = AlertManager.getInstance();
