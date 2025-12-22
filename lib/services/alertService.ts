/**
 * Alert Service
 * Monitors metrics and triggers alerts based on thresholds
 */

import { metrics } from '@/lib/utils/metrics';
import { logger } from '@/lib/utils/logger';
import { externalFetch } from '@/lib/services/external/http';

interface AlertConfig {
  name: string;
  condition: () => boolean;
  message: string;
  severity: 'warning' | 'error' | 'critical';
}

interface Alert {
  id: string;
  name: string;
  message: string;
  severity: 'warning' | 'error' | 'critical';
  timestamp: string;
  resolved: boolean;
}

class AlertService {
  private alerts: Alert[] = [];
  private readonly MAX_ALERTS = 100;
  private alertConfigs: AlertConfig[] = [];

  constructor() {
    this.setupDefaultAlerts();
  }

  /**
   * Setup default alert configurations
   */
  private setupDefaultAlerts(): void {
    // High error rate alert (>5%)
    this.addAlertConfig({
      name: 'high_error_rate',
      condition: () => {
        const summary = metrics.getSummary();
        const platforms = ['tiktok', 'instagram'];
        
        for (const platform of platforms) {
          const success = summary[`upload.success.${platform}`] || 0;
          const failure = summary[`upload.failure.${platform}`] || 0;
          const total = success + failure;
          
          if (total > 10 && (failure / total) > 0.05) {
            return true;
          }
        }
        return false;
      },
      message: 'Upload error rate exceeds 5%',
      severity: 'error',
    });

    // Token refresh failures
    this.addAlertConfig({
      name: 'token_refresh_failure',
      condition: () => {
        const summary = metrics.getSummary();
        const platforms = ['tiktok', 'instagram'];
        
        for (const platform of platforms) {
          const failures = summary[`token.refresh.failure.${platform}`] || 0;
          if (failures > 3) {
            return true;
          }
        }
        return false;
      },
      message: 'Multiple token refresh failures detected',
      severity: 'critical',
    });

    // High webhook latency
    this.addAlertConfig({
      name: 'high_webhook_latency',
      condition: () => {
        const recentMetrics = metrics.getRecentMetrics(50);
        const latencies = recentMetrics
          .filter(m => m.metric === 'webhook.latency')
          .map(m => m.value);
        
        if (latencies.length > 5) {
          const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
          return avg > 5000; // 5 seconds
        }
        return false;
      },
      message: 'Webhook processing latency exceeds 5 seconds',
      severity: 'warning',
    });

    // OAuth failures
    this.addAlertConfig({
      name: 'oauth_failures',
      condition: () => {
        const summary = metrics.getSummary();
        const platforms = ['tiktok', 'instagram'];
        
        for (const platform of platforms) {
          const failures = summary[`oauth.failure.${platform}`] || 0;
          if (failures > 5) {
            return true;
          }
        }
        return false;
      },
      message: 'Multiple OAuth failures detected',
      severity: 'error',
    });
  }

  /**
   * Add a custom alert configuration
   */
  addAlertConfig(config: AlertConfig): void {
    this.alertConfigs.push(config);
  }

  /**
   * Check all alert conditions
   */
  checkAlerts(): Alert[] {
    const newAlerts: Alert[] = [];

    for (const config of this.alertConfigs) {
      try {
        if (config.condition()) {
          // Check if alert already exists and is not resolved
          const existingAlert = this.alerts.find(
            a => a.name === config.name && !a.resolved
          );

          if (!existingAlert) {
            const alert: Alert = {
              id: `${config.name}_${Date.now()}`,
              name: config.name,
              message: config.message,
              severity: config.severity,
              timestamp: new Date().toISOString(),
              resolved: false,
            };

            this.alerts.push(alert);
            newAlerts.push(alert);

            // Log the alert
            logger.warn('Alert triggered', {
              alert: config.name,
              severity: config.severity,
              message: config.message,
            });

            // In production, send notifications
            this.sendNotification(alert);
          }
        } else {
          // Resolve existing alerts if condition is no longer met
          const existingAlert = this.alerts.find(
            a => a.name === config.name && !a.resolved
          );

          if (existingAlert) {
            existingAlert.resolved = true;
            logger.info('Alert resolved', { alert: config.name });
          }
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Error checking alert condition', err, {
          alert: config.name,
        });
      }
    }

    // Keep only last MAX_ALERTS
    if (this.alerts.length > this.MAX_ALERTS) {
      this.alerts = this.alerts.slice(-this.MAX_ALERTS);
    }

    return newAlerts;
  }

  /**
   * Send notification for alert
   * In production, this would integrate with email, Slack, PagerDuty, etc.
   */
  private sendNotification(alert: Alert): void {
    // TODO: Implement actual notification logic
    // Examples:
    // - Send email via SES
    // - Post to Slack webhook
    // - Create PagerDuty incident
    // - Send SMS via SNS

    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify({
        type: 'alert',
        ...alert,
      }));
    }

    // Example: Send to Slack (if webhook URL is configured)
    if (process.env.SLACK_WEBHOOK_URL) {
      this.sendSlackNotification(alert);
    }
  }

  /**
   * Send alert to Slack
   */
  private async sendSlackNotification(alert: Alert): Promise<void> {
    try {
      const webhookUrl = process.env.SLACK_WEBHOOK_URL;
      if (!webhookUrl) return;

      const color = {
        warning: '#FFA500',
        error: '#FF0000',
        critical: '#8B0000',
      }[alert.severity];

      await externalFetch(webhookUrl, {
        service: 'slack',
        operation: 'webhook.post',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attachments: [{
            color,
            title: `🚨 ${alert.severity.toUpperCase()}: ${alert.name}`,
            text: alert.message,
            footer: 'Social Integrations Monitoring',
            ts: Math.floor(new Date(alert.timestamp).getTime() / 1000),
          }],
        }),
        cache: 'no-store',
        timeoutMs: 5_000,
        retry: { maxRetries: 0, retryMethods: [] },
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to send Slack notification', err);
    }
  }

  /**
   * Get all alerts
   */
  getAlerts(includeResolved: boolean = false): Alert[] {
    if (includeResolved) {
      return [...this.alerts];
    }
    return this.alerts.filter(a => !a.resolved);
  }

  /**
   * Get active alerts count
   */
  getActiveAlertsCount(): number {
    return this.alerts.filter(a => !a.resolved).length;
  }

  /**
   * Resolve an alert manually
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      logger.info('Alert manually resolved', { alertId });
      return true;
    }
    return false;
  }

  /**
   * Clear all resolved alerts
   */
  clearResolvedAlerts(): void {
    this.alerts = this.alerts.filter(a => !a.resolved);
  }
}

// Export singleton instance
export const alertService = new AlertService();
