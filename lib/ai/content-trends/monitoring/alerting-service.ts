/**
 * Alerting Service
 * Content & Trends AI Engine - Phase 6
 * 
 * Automated alerting for anomalies and SLA violations.
 * Supports multiple notification channels.
 */

import {
  AlertRule,
  Alert,
  AlertSeverity,
  AlertStatus,
  AlertCondition,
  AlertAction,
  AlertingService,
  MetricValue,
  ComparisonOperator,
} from './types';
import { externalFetch } from '@/lib/services/external/http';

// ============================================================================
// Alerting Service Implementation
// ============================================================================

export class ContentTrendsAlertingService implements AlertingService {
  private rules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private alertHistory: Alert[] = [];
  private metricsStore: Map<string, MetricValue[]> = new Map();
  private cooldowns: Map<string, Date> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Create a new alert rule
   */
  async createRule(rule: AlertRule): Promise<void> {
    this.rules.set(rule.id, rule);
  }

  /**
   * Update an existing alert rule
   */
  async updateRule(ruleId: string, updates: Partial<AlertRule>): Promise<void> {
    const existing = this.rules.get(ruleId);
    if (!existing) {
      throw new Error(`Rule ${ruleId} not found`);
    }
    this.rules.set(ruleId, { ...existing, ...updates });
  }

  /**
   * Delete an alert rule
   */
  async deleteRule(ruleId: string): Promise<void> {
    this.rules.delete(ruleId);
  }

  /**
   * Evaluate all rules against current metrics
   */
  async evaluateRules(): Promise<Alert[]> {
    const newAlerts: Alert[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      // Check cooldown
      const cooldownEnd = this.cooldowns.get(rule.id);
      if (cooldownEnd && cooldownEnd > new Date()) continue;

      const result = this.evaluateCondition(rule.condition);
      
      if (result.triggered) {
        const alert = this.createAlert(rule, result.value);
        newAlerts.push(alert);
        this.activeAlerts.set(alert.id, alert);
        this.alertHistory.push(alert);

        // Set cooldown
        this.cooldowns.set(
          rule.id,
          new Date(Date.now() + rule.cooldownMinutes * 60 * 1000)
        );

        // Execute actions
        await this.executeActions(rule.actions, alert);
      }
    }

    return newAlerts;
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.status = 'acknowledged';
    }
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.status = 'resolved';
      alert.resolvedAt = new Date();
      this.activeAlerts.delete(alertId);
    }
  }

  /**
   * Get all active alerts
   */
  async getActiveAlerts(): Promise<Alert[]> {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit: number = 100): Alert[] {
    return this.alertHistory.slice(-limit);
  }

  /**
   * Ingest metric for evaluation
   */
  ingestMetric(metric: MetricValue): void {
    const key = this.getMetricKey(metric.name, metric.dimensions);
    const existing = this.metricsStore.get(key) || [];
    existing.push(metric);

    // Keep only last hour of metrics
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const filtered = existing.filter(m => m.timestamp > oneHourAgo);
    this.metricsStore.set(key, filtered);
  }

  /**
   * Get rule by ID
   */
  getRule(ruleId: string): AlertRule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * List all rules
   */
  listRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private initializeDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'high-error-rate',
        name: 'High AI Model Error Rate',
        description: 'Alert when AI model error rate exceeds 5%',
        enabled: true,
        severity: 'error',
        condition: {
          metricName: 'ai.model.error_rate',
          operator: 'greater_than',
          threshold: 5,
          aggregation: 'average',
          windowMinutes: 5,
        },
        actions: [{ type: 'slack', config: { channel: '#alerts' } }],
        cooldownMinutes: 15,
        evaluationFrequencyMinutes: 1,
      },
      {
        id: 'high-latency',
        name: 'High AI Model Latency',
        description: 'Alert when p95 latency exceeds 5 seconds',
        enabled: true,
        severity: 'warning',
        condition: {
          metricName: 'ai.model.latency.p95',
          operator: 'greater_than',
          threshold: 5000,
          aggregation: 'average',
          windowMinutes: 5,
        },
        actions: [{ type: 'slack', config: { channel: '#alerts' } }],
        cooldownMinutes: 10,
        evaluationFrequencyMinutes: 1,
      },
      {
        id: 'low-prediction-accuracy',
        name: 'Low Viral Prediction Accuracy',
        description: 'Alert when prediction accuracy drops below 70%',
        enabled: true,
        severity: 'warning',
        condition: {
          metricName: 'viral.predictions.accuracy',
          operator: 'less_than',
          threshold: 70,
          aggregation: 'average',
          windowMinutes: 60,
        },
        actions: [{ type: 'email', config: { recipients: ['team@example.com'] } }],
        cooldownMinutes: 60,
        evaluationFrequencyMinutes: 15,
      },
      {
        id: 'high-token-consumption',
        name: 'High Token Consumption',
        description: 'Alert when token consumption exceeds threshold',
        enabled: true,
        severity: 'info',
        condition: {
          metricName: 'ai.model.tokens.total',
          operator: 'greater_than',
          threshold: 1000000,
          aggregation: 'sum',
          windowMinutes: 60,
        },
        actions: [{ type: 'slack', config: { channel: '#costs' } }],
        cooldownMinutes: 60,
        evaluationFrequencyMinutes: 15,
      },
    ];

    for (const rule of defaultRules) {
      this.rules.set(rule.id, rule);
    }
  }

  private evaluateCondition(condition: AlertCondition): { triggered: boolean; value: number } {
    const key = this.getMetricKey(condition.metricName, condition.dimensions || {});
    const metrics = this.metricsStore.get(key) || [];

    const windowStart = new Date(Date.now() - condition.windowMinutes * 60 * 1000);
    const windowMetrics = metrics.filter(m => m.timestamp > windowStart);

    if (windowMetrics.length === 0) {
      return { triggered: false, value: 0 };
    }

    const value = this.aggregate(windowMetrics, condition.aggregation);
    const triggered = this.compare(value, condition.operator, condition.threshold);

    return { triggered, value };
  }

  private aggregate(metrics: MetricValue[], aggregation: string): number {
    const values = metrics.map(m => m.value);

    switch (aggregation) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'average':
        return values.reduce((a, b) => a + b, 0) / values.length;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      case 'count':
        return values.length;
      default:
        return values.reduce((a, b) => a + b, 0) / values.length;
    }
  }

  private compare(value: number, operator: ComparisonOperator, threshold: number): boolean {
    switch (operator) {
      case 'greater_than': return value > threshold;
      case 'greater_than_or_equal': return value >= threshold;
      case 'less_than': return value < threshold;
      case 'less_than_or_equal': return value <= threshold;
      case 'equal': return value === threshold;
      case 'not_equal': return value !== threshold;
      default: return false;
    }
  }

  private createAlert(rule: AlertRule, metricValue: number): Alert {
    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      status: 'firing',
      firedAt: new Date(),
      metricValue,
      threshold: rule.condition.threshold,
      description: rule.description,
      dimensions: rule.condition.dimensions || {},
    };
  }

  private async executeActions(actions: AlertAction[], alert: Alert): Promise<void> {
    for (const action of actions) {
      try {
        await this.executeAction(action, alert);
      } catch (error) {
        console.error(`Failed to execute alert action ${action.type}:`, error);
      }
    }
  }

  private async executeAction(action: AlertAction, alert: Alert): Promise<void> {
    switch (action.type) {
      case 'slack':
        await this.sendSlackNotification(action.config, alert);
        break;
      case 'email':
        await this.sendEmailNotification(action.config, alert);
        break;
      case 'webhook':
        await this.sendWebhookNotification(action.config, alert);
        break;
      case 'teams':
        await this.sendTeamsNotification(action.config, alert);
        break;
      default:
        console.log(`Action type ${action.type} not implemented`);
    }
  }

  private async sendSlackNotification(config: Record<string, unknown>, alert: Alert): Promise<void> {
    const webhookUrl = config.webhookUrl as string || process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) return;

    const color = this.getSeverityColor(alert.severity);
    await externalFetch(webhookUrl, {
      service: 'slack',
      operation: 'alert',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachments: [{
          color,
          title: `🚨 ${alert.ruleName}`,
          text: alert.description,
          fields: [
            { title: 'Severity', value: alert.severity, short: true },
            { title: 'Value', value: alert.metricValue.toFixed(2), short: true },
            { title: 'Threshold', value: alert.threshold.toString(), short: true },
          ],
          ts: Math.floor(alert.firedAt.getTime() / 1000),
        }],
      }),
      cache: 'no-store',
      timeoutMs: 8_000,
      retry: { maxRetries: 1, retryMethods: ['POST'] },
    });
  }

  private async sendEmailNotification(config: Record<string, unknown>, alert: Alert): Promise<void> {
    console.log(`Would send email to ${config.recipients} for alert: ${alert.ruleName}`);
  }

  private async sendWebhookNotification(config: Record<string, unknown>, alert: Alert): Promise<void> {
    const url = config.url as string;
    if (!url) return;

    await externalFetch(url, {
      service: 'webhook',
      operation: 'alert',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert),
      cache: 'no-store',
      timeoutMs: 8_000,
      retry: { maxRetries: 1, retryMethods: ['POST'] },
    });
  }

  private async sendTeamsNotification(config: Record<string, unknown>, alert: Alert): Promise<void> {
    const webhookUrl = config.webhookUrl as string;
    if (!webhookUrl) return;

    await externalFetch(webhookUrl, {
      service: 'teams',
      operation: 'alert',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        '@type': 'MessageCard',
        themeColor: this.getSeverityColor(alert.severity).replace('#', ''),
        title: `🚨 ${alert.ruleName}`,
        text: alert.description,
      }),
      cache: 'no-store',
      timeoutMs: 8_000,
      retry: { maxRetries: 1, retryMethods: ['POST'] },
    });
  }

  private getSeverityColor(severity: AlertSeverity): string {
    const colors: Record<AlertSeverity, string> = {
      critical: '#dc3545',
      error: '#fd7e14',
      warning: '#ffc107',
      info: '#17a2b8',
    };
    return colors[severity] || '#6c757d';
  }

  private getMetricKey(name: string, dimensions: Record<string, string>): string {
    const dimStr = Object.entries(dimensions)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return dimStr ? `${name}:${dimStr}` : name;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createAlertingService(): ContentTrendsAlertingService {
  return new ContentTrendsAlertingService();
}
