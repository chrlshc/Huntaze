interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: AlertCondition;
  threshold: number;
  timeWindow: number; // in minutes
  enabled: boolean;
  notificationChannels: string[];
  cooldownPeriod: number; // in minutes
  lastTriggered?: Date;
}

interface AlertCondition {
  metric: 'completion_rate' | 'error_rate' | 'drop_off_rate' | 'active_users' | 'avg_completion_time';
  operator: 'less_than' | 'greater_than' | 'equals';
  aggregation?: 'avg' | 'sum' | 'count' | 'min' | 'max';
}

interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  triggeredAt: Date;
  currentValue: number;
  threshold: number;
  resolved: boolean;
  resolvedAt?: Date;
}

export class OnboardingAlertService {
  private analyticsService: any;
  private notificationService: any;
  private alertRules: AlertRule[] = [];
  private activeAlerts: Map<string, Alert> = new Map();

  constructor(analyticsService: any, notificationService: any) {
    this.analyticsService = analyticsService;
    this.notificationService = notificationService;
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    this.alertRules = [
      {
        id: 'low_completion_rate',
        name: 'Low Completion Rate',
        description: 'Alert when onboarding completion rate drops below threshold',
        condition: {
          metric: 'completion_rate',
          operator: 'less_than'
        },
        threshold: 50, // 50%
        timeWindow: 60, // 1 hour
        enabled: true,
        notificationChannels: ['email', 'slack'],
        cooldownPeriod: 30 // 30 minutes
      },
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        description: 'Alert when error rate exceeds threshold',
        condition: {
          metric: 'error_rate',
          operator: 'greater_than'
        },
        threshold: 5, // 5%
        timeWindow: 30, // 30 minutes
        enabled: true,
        notificationChannels: ['email', 'slack'],
        cooldownPeriod: 15 // 15 minutes
      },
      {
        id: 'high_drop_off_rate',
        name: 'High Drop-off Rate',
        description: 'Alert when step drop-off rate is too high',
        condition: {
          metric: 'drop_off_rate',
          operator: 'greater_than'
        },
        threshold: 30, // 30%
        timeWindow: 60, // 1 hour
        enabled: true,
        notificationChannels: ['email'],
        cooldownPeriod: 60 // 1 hour
      },
      {
        id: 'low_active_users',
        name: 'Low Active Users',
        description: 'Alert when active user count drops significantly',
        condition: {
          metric: 'active_users',
          operator: 'less_than'
        },
        threshold: 10, // 10 users
        timeWindow: 60, // 1 hour
        enabled: true,
        notificationChannels: ['slack'],
        cooldownPeriod: 120 // 2 hours
      },
      {
        id: 'long_completion_time',
        name: 'Long Completion Time',
        description: 'Alert when average completion time is too long',
        condition: {
          metric: 'avg_completion_time',
          operator: 'greater_than'
        },
        threshold: 1800, // 30 minutes in seconds
        timeWindow: 120, // 2 hours
        enabled: true,
        notificationChannels: ['email'],
        cooldownPeriod: 240 // 4 hours
      }
    ];
  }

  // Check all alert rules
  async checkAlerts(): Promise<void> {
    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;
      
      // Check cooldown period
      if (rule.lastTriggered) {
        const cooldownEnd = new Date(rule.lastTriggered.getTime() + rule.cooldownPeriod * 60 * 1000);
        if (new Date() < cooldownEnd) {
          continue; // Still in cooldown
        }
      }

      try {
        await this.checkRule(rule);
      } catch (error) {
        console.error(`Failed to check alert rule ${rule.id}:`, error);
      }
    }
  }

  private async checkRule(rule: AlertRule): Promise<void> {
    const currentValue = await this.getCurrentMetricValue(rule);
    const shouldTrigger = this.evaluateCondition(currentValue, rule.condition, rule.threshold);

    if (shouldTrigger) {
      await this.triggerAlert(rule, currentValue);
    } else {
      // Check if we should resolve any existing alerts for this rule
      await this.resolveAlert(rule.id);
    }
  }

  private async getCurrentMetricValue(rule: AlertRule): Promise<number> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - rule.timeWindow * 60 * 1000);

    switch (rule.condition.metric) {
      case 'completion_rate': {
        const metrics = await this.analyticsService.getOnboardingMetrics({
          start: startTime,
          end: endTime
        });
        return metrics.completionRate;
      }

      case 'error_rate': {
        // Calculate error rate from events
        const totalEvents = await this.analyticsService.getEventCount(startTime, endTime);
        const errorEvents = await this.analyticsService.getEventCount(
          startTime, 
          endTime, 
          'onboarding_error'
        );
        return totalEvents > 0 ? (errorEvents / totalEvents) * 100 : 0;
      }

      case 'drop_off_rate': {
        const metrics = await this.analyticsService.getOnboardingMetrics({
          start: startTime,
          end: endTime
        });
        // Get the highest drop-off rate from all steps
        return Math.max(...metrics.dropOffPoints.map(point => point.dropOffRate));
      }

      case 'active_users': {
        const realTimeData = await this.analyticsService.getRealTimeDashboardData();
        return realTimeData.activeUsers;
      }

      case 'avg_completion_time': {
        const metrics = await this.analyticsService.getOnboardingMetrics({
          start: startTime,
          end: endTime
        });
        return metrics.averageCompletionTime;
      }

      default:
        throw new Error(`Unknown metric: ${rule.condition.metric}`);
    }
  }

  private evaluateCondition(value: number, condition: AlertCondition, threshold: number): boolean {
    switch (condition.operator) {
      case 'less_than':
        return value < threshold;
      case 'greater_than':
        return value > threshold;
      case 'equals':
        return value === threshold;
      default:
        return false;
    }
  }

  private async triggerAlert(rule: AlertRule, currentValue: number): Promise<void> {
    const alertId = `${rule.id}_${Date.now()}`;
    
    const alert: Alert = {
      id: alertId,
      ruleId: rule.id,
      ruleName: rule.name,
      message: this.generateAlertMessage(rule, currentValue),
      severity: this.determineSeverity(rule, currentValue),
      triggeredAt: new Date(),
      currentValue,
      threshold: rule.threshold,
      resolved: false
    };

    // Store the alert
    this.activeAlerts.set(alertId, alert);

    // Update rule's last triggered time
    rule.lastTriggered = new Date();

    // Send notifications
    await this.sendNotifications(alert, rule.notificationChannels);

    console.log(`Alert triggered: ${alert.message}`);
  }

  private async resolveAlert(ruleId: string): Promise<void> {
    for (const [alertId, alert] of this.activeAlerts.entries()) {
      if (alert.ruleId === ruleId && !alert.resolved) {
        alert.resolved = true;
        alert.resolvedAt = new Date();
        
        // Send resolution notification
        await this.sendResolutionNotification(alert);
        
        console.log(`Alert resolved: ${alert.message}`);
      }
    }
  }

  private generateAlertMessage(rule: AlertRule, currentValue: number): string {
    const metricName = rule.condition.metric.replace(/_/g, ' ');
    const unit = this.getMetricUnit(rule.condition.metric);
    
    return `${rule.name}: ${metricName} is ${currentValue.toFixed(2)}${unit}, ` +
           `which is ${rule.condition.operator.replace(/_/g, ' ')} the threshold of ${rule.threshold}${unit}`;
  }

  private getMetricUnit(metric: string): string {
    switch (metric) {
      case 'completion_rate':
      case 'error_rate':
      case 'drop_off_rate':
        return '%';
      case 'active_users':
        return ' users';
      case 'avg_completion_time':
        return 's';
      default:
        return '';
    }
  }

  private determineSeverity(rule: AlertRule, currentValue: number): 'low' | 'medium' | 'high' | 'critical' {
    const deviation = Math.abs(currentValue - rule.threshold) / rule.threshold;
    
    if (deviation > 0.5) return 'critical';
    if (deviation > 0.3) return 'high';
    if (deviation > 0.1) return 'medium';
    return 'low';
  }

  private async sendNotifications(alert: Alert, channels: string[]): Promise<void> {
    for (const channel of channels) {
      try {
        switch (channel) {
          case 'email':
            await this.notificationService.sendEmail({
              subject: `🚨 Onboarding Alert: ${alert.ruleName}`,
              body: this.formatEmailAlert(alert),
              priority: alert.severity
            });
            break;

          case 'slack':
            await this.notificationService.sendSlack({
              message: this.formatSlackAlert(alert),
              channel: '#onboarding-alerts',
              severity: alert.severity
            });
            break;

          case 'webhook':
            await this.notificationService.sendWebhook({
              alert,
              type: 'alert_triggered'
            });
            break;
        }
      } catch (error) {
        console.error(`Failed to send ${channel} notification:`, error);
      }
    }
  }

  private async sendResolutionNotification(alert: Alert): Promise<void> {
    const message = `✅ Alert resolved: ${alert.ruleName}`;
    
    try {
      await this.notificationService.sendSlack({
        message,
        channel: '#onboarding-alerts',
        severity: 'low'
      });
    } catch (error) {
      console.error('Failed to send resolution notification:', error);
    }
  }

  private formatEmailAlert(alert: Alert): string {
    return `
      <h2>Onboarding Alert Triggered</h2>
      <p><strong>Alert:</strong> ${alert.ruleName}</p>
      <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
      <p><strong>Message:</strong> ${alert.message}</p>
      <p><strong>Triggered At:</strong> ${alert.triggeredAt.toISOString()}</p>
      <p><strong>Current Value:</strong> ${alert.currentValue}</p>
      <p><strong>Threshold:</strong> ${alert.threshold}</p>
      
      <p>Please check the onboarding analytics dashboard for more details.</p>
    `;
  }

  private formatSlackAlert(alert: Alert): string {
    const emoji = {
      low: '🟡',
      medium: '🟠',
      high: '🔴',
      critical: '🚨'
    }[alert.severity];

    return `${emoji} *${alert.ruleName}*\n` +
           `${alert.message}\n` +
           `Severity: ${alert.severity.toUpperCase()}\n` +
           `Triggered: ${alert.triggeredAt.toLocaleString()}`;
  }

  // Public methods for managing alerts

  async getActiveAlerts(): Promise<Alert[]> {
    return Array.from(this.activeAlerts.values()).filter(alert => !alert.resolved);
  }

  async getAlertHistory(limit: number = 50): Promise<Alert[]> {
    return Array.from(this.activeAlerts.values())
      .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime())
      .slice(0, limit);
  }

  async updateAlertRule(ruleId: string, updates: Partial<AlertRule>): Promise<void> {
    const rule = this.alertRules.find(r => r.id === ruleId);
    if (rule) {
      Object.assign(rule, updates);
    }
  }

  async getAlertRules(): Promise<AlertRule[]> {
    return [...this.alertRules];
  }

  async enableRule(ruleId: string): Promise<void> {
    const rule = this.alertRules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = true;
    }
  }

  async disableRule(ruleId: string): Promise<void> {
    const rule = this.alertRules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = false;
    }
  }

  // Start the alert monitoring process
  startMonitoring(intervalMinutes: number = 5): void {
    setInterval(async () => {
      await this.checkAlerts();
    }, intervalMinutes * 60 * 1000);

    console.log(`Onboarding alert monitoring started (checking every ${intervalMinutes} minutes)`);
  }
}