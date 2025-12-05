/**
 * AlertingService - Canary deployment alerting
 * 
 * Sends alerts on threshold breaches via configured channels.
 * Supports Slack and email notifications.
 * 
 * Requirements: 5.3 - Alerting on anomalies
 */

export type AlertChannel = 'slack' | 'email' | 'console';
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
  /** Alert ID */
  id: string;
  /** Alert severity */
  severity: AlertSeverity;
  /** Alert title */
  title: string;
  /** Alert message */
  message: string;
  /** Timestamp */
  timestamp: Date;
  /** Source of alert */
  source: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

export interface AlertingConfig {
  /** Enabled channels */
  channels: AlertChannel[];
  /** Slack webhook URL */
  slackWebhookUrl?: string;
  /** Email recipients */
  emailRecipients?: string[];
  /** Minimum severity to alert */
  minSeverity: AlertSeverity;
  /** Cooldown between same alerts in ms */
  cooldownMs: number;
  /** Enable alerting */
  enabled: boolean;
}

const DEFAULT_CONFIG: AlertingConfig = {
  channels: ['console'],
  minSeverity: 'warning',
  cooldownMs: 5 * 60 * 1000, // 5 minutes
  enabled: true,
};

const SEVERITY_ORDER: Record<AlertSeverity, number> = {
  info: 0,
  warning: 1,
  critical: 2,
};

/**
 * AlertingService for canary deployments
 * 
 * Features:
 * - Multi-channel alerting (Slack, email, console)
 * - Severity-based filtering
 * - Cooldown to prevent alert fatigue
 * - Alert history tracking
 */
export class AlertingService {
  private config: AlertingConfig;
  private alertHistory: Alert[] = [];
  private lastAlertByKey: Map<string, Date> = new Map();
  private static instance: AlertingService | null = null;

  constructor(config: Partial<AlertingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<AlertingConfig>): AlertingService {
    if (!AlertingService.instance) {
      AlertingService.instance = new AlertingService(config);
    }
    return AlertingService.instance;
  }

  /**
   * Reset singleton instance (for testing)
   */
  static resetInstance(): void {
    AlertingService.instance = null;
  }

  /**
   * Send an alert
   */
  async sendAlert(params: {
    severity: AlertSeverity;
    title: string;
    message: string;
    source: string;
    metadata?: Record<string, unknown>;
  }): Promise<Alert | null> {
    if (!this.config.enabled) {
      return null;
    }

    // Check severity threshold
    if (SEVERITY_ORDER[params.severity] < SEVERITY_ORDER[this.config.minSeverity]) {
      return null;
    }

    // Check cooldown
    const alertKey = `${params.source}:${params.title}`;
    if (this.isInCooldown(alertKey)) {
      return null;
    }

    const alert: Alert = {
      id: this.generateAlertId(),
      severity: params.severity,
      title: params.title,
      message: params.message,
      timestamp: new Date(),
      source: params.source,
      metadata: params.metadata,
    };

    // Send to all configured channels
    await Promise.all(
      this.config.channels.map(channel => this.sendToChannel(channel, alert))
    );

    // Record alert
    this.alertHistory.push(alert);
    this.lastAlertByKey.set(alertKey, new Date());

    return alert;
  }

  /**
   * Send alert for error rate breach
   */
  async alertErrorRate(errorRate: number, threshold: number): Promise<Alert | null> {
    return this.sendAlert({
      severity: 'critical',
      title: 'Foundry Error Rate Exceeded',
      message: `Error rate ${(errorRate * 100).toFixed(2)}% exceeds threshold ${(threshold * 100).toFixed(2)}%`,
      source: 'RollbackController',
      metadata: { errorRate, threshold },
    });
  }

  /**
   * Send alert for latency breach
   */
  async alertLatency(latencyP95: number, threshold: number): Promise<Alert | null> {
    return this.sendAlert({
      severity: 'warning',
      title: 'Foundry Latency Exceeded',
      message: `Latency p95 ${latencyP95.toFixed(0)}ms exceeds threshold ${threshold}ms`,
      source: 'RollbackController',
      metadata: { latencyP95, threshold },
    });
  }

  /**
   * Send alert for cost breach
   */
  async alertCost(avgCost: number, threshold: number): Promise<Alert | null> {
    return this.sendAlert({
      severity: 'warning',
      title: 'Foundry Cost Exceeded',
      message: `Average cost $${avgCost.toFixed(4)}/req exceeds threshold $${threshold}/req`,
      source: 'RollbackController',
      metadata: { avgCost, threshold },
    });
  }

  /**
   * Send alert for rollback event
   */
  async alertRollback(reason: string, metrics: Record<string, number>): Promise<Alert | null> {
    return this.sendAlert({
      severity: 'critical',
      title: 'Automatic Rollback Triggered',
      message: `Rollback triggered due to: ${reason}`,
      source: 'RollbackController',
      metadata: { reason, ...metrics },
    });
  }

  /**
   * Send to specific channel
   */
  private async sendToChannel(channel: AlertChannel, alert: Alert): Promise<void> {
    switch (channel) {
      case 'console':
        this.sendToConsole(alert);
        break;
      case 'slack':
        await this.sendToSlack(alert);
        break;
      case 'email':
        await this.sendToEmail(alert);
        break;
    }
  }

  /**
   * Send to console
   */
  private sendToConsole(alert: Alert): void {
    const prefix = this.getSeverityPrefix(alert.severity);
    console.log(`${prefix} [${alert.source}] ${alert.title}: ${alert.message}`);
    if (alert.metadata) {
      console.log('  Metadata:', JSON.stringify(alert.metadata));
    }
  }

  /**
   * Send to Slack
   */
  private async sendToSlack(alert: Alert): Promise<void> {
    if (!this.config.slackWebhookUrl) {
      console.warn('[AlertingService] Slack webhook URL not configured');
      return;
    }

    const color = this.getSeverityColor(alert.severity);
    const payload = {
      attachments: [
        {
          color,
          title: alert.title,
          text: alert.message,
          fields: [
            { title: 'Source', value: alert.source, short: true },
            { title: 'Severity', value: alert.severity.toUpperCase(), short: true },
            { title: 'Time', value: alert.timestamp.toISOString(), short: true },
          ],
          footer: 'Huntaze AI Canary',
          ts: Math.floor(alert.timestamp.getTime() / 1000),
        },
      ],
    };

    try {
      const response = await fetch(this.config.slackWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error('[AlertingService] Slack alert failed:', response.statusText);
      }
    } catch (error) {
      console.error('[AlertingService] Slack alert error:', error);
    }
  }

  /**
   * Send to email (placeholder - would integrate with SES or similar)
   */
  private async sendToEmail(alert: Alert): Promise<void> {
    if (!this.config.emailRecipients?.length) {
      console.warn('[AlertingService] Email recipients not configured');
      return;
    }

    // In production, this would integrate with AWS SES or similar
    console.log(`[AlertingService] Would send email to: ${this.config.emailRecipients.join(', ')}`);
    console.log(`  Subject: [${alert.severity.toUpperCase()}] ${alert.title}`);
    console.log(`  Body: ${alert.message}`);
  }

  /**
   * Check if alert is in cooldown
   */
  private isInCooldown(alertKey: string): boolean {
    const lastAlert = this.lastAlertByKey.get(alertKey);
    if (!lastAlert) return false;

    const elapsed = Date.now() - lastAlert.getTime();
    return elapsed < this.config.cooldownMs;
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get severity prefix for console
   */
  private getSeverityPrefix(severity: AlertSeverity): string {
    switch (severity) {
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'critical': return '🚨';
    }
  }

  /**
   * Get severity color for Slack
   */
  private getSeverityColor(severity: AlertSeverity): string {
    switch (severity) {
      case 'info': return '#36a64f';
      case 'warning': return '#ff9800';
      case 'critical': return '#f44336';
    }
  }

  /**
   * Get alert history
   */
  getHistory(): Alert[] {
    return [...this.alertHistory];
  }

  /**
   * Clear history (for testing)
   */
  clearHistory(): void {
    this.alertHistory = [];
    this.lastAlertByKey.clear();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AlertingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): AlertingConfig {
    return { ...this.config };
  }
}

/**
 * Convenience function to get alerting service instance
 */
export function getAlertingService(config?: Partial<AlertingConfig>): AlertingService {
  return AlertingService.getInstance(config);
}
