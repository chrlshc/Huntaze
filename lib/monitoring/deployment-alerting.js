/**
 * Deployment Alerting System
 * Alert generation and notification system for deployment issues
 */

const fs = require('fs');
const path = require('path');

class DeploymentAlertingSystem {
  constructor(config = {}) {
    this.config = {
      alertChannels: config.alertChannels || ['console', 'file'],
      alertThresholds: {
        responseTime: config.responseTimeThreshold || 3000,
        errorRate: config.errorRateThreshold || 0.1,
        consecutiveFailures: config.consecutiveFailuresThreshold || 3,
        ...config.alertThresholds
      },
      notificationSettings: {
        webhookUrl: config.webhookUrl,
        emailSettings: config.emailSettings,
        slackSettings: config.slackSettings,
        ...config.notificationSettings
      },
      alertCooldown: config.alertCooldown || 300000, // 5 minutes
      ...config
    };
    
    this.activeAlerts = new Map();
    this.alertHistory = [];
    this.alertCooldowns = new Map();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async processHealthCheckResult(healthCheckResult) {
    try {
      // Analyze health check for alert conditions
      const alerts = this.analyzeHealthCheck(healthCheckResult);
      
      // Process each alert
      for (const alert of alerts) {
        await this.processAlert(alert);
      }
      
      // Check for resolved alerts
      await this.checkResolvedAlerts(healthCheckResult);
      
    } catch (error) {
      this.log(`Error processing health check result: ${error.message}`, 'error');
    }
  }

  analyzeHealthCheck(healthCheckResult) {
    const alerts = [];
    const timestamp = new Date().toISOString();
    
    // Check connectivity issues
    if (healthCheckResult.connectivity) {
      const conn = healthCheckResult.connectivity;
      
      if (conn.status === 'unhealthy') {
        alerts.push({
          id: `connectivity_${Date.now()}`,
          type: 'CONNECTIVITY_FAILURE',
          severity: 'HIGH',
          timestamp,
          message: `Connectivity check failed: ${conn.message}`,
          details: {
            statusCode: conn.statusCode,
            responseTime: conn.responseTime,
            url: this.deploymentUrl
          }
        });
      } else if (conn.responseTime > this.config.alertThresholds.responseTime) {
        alerts.push({
          id: `response_time_${Date.now()}`,
          type: 'SLOW_RESPONSE',
          severity: 'MEDIUM',
          timestamp,
          message: `Slow response time detected: ${conn.responseTime}ms`,
          details: {
            responseTime: conn.responseTime,
            threshold: this.config.alertThresholds.responseTime,
            url: this.deploymentUrl
          }
        });
      }
    }
    
    // Check application health issues
    if (healthCheckResult.application) {
      const app = healthCheckResult.application;
      
      if (app.status === 'unhealthy') {
        alerts.push({
          id: `application_${Date.now()}`,
          type: 'APPLICATION_FAILURE',
          severity: 'HIGH',
          timestamp,
          message: `Application health check failed: ${app.message}`,
          details: {
            statusCode: app.statusCode,
            responseTime: app.responseTime,
            data: app.data
          }
        });
      }
    }
    
    // Check database health issues
    if (healthCheckResult.database) {
      const db = healthCheckResult.database;
      
      if (db.status === 'unhealthy') {
        alerts.push({
          id: `database_${Date.now()}`,
          type: 'DATABASE_FAILURE',
          severity: 'HIGH',
          timestamp,
          message: `Database health check failed: ${db.message}`,
          details: {
            statusCode: db.statusCode,
            responseTime: db.responseTime,
            data: db.data
          }
        });
      }
    }
    
    // Check overall health
    if (healthCheckResult.overall) {
      const overall = healthCheckResult.overall;
      
      if (overall.status === 'unhealthy') {
        alerts.push({
          id: `overall_${Date.now()}`,
          type: 'SYSTEM_FAILURE',
          severity: 'CRITICAL',
          timestamp,
          message: `System health check failed: ${overall.message}`,
          details: {
            duration: healthCheckResult.duration,
            components: {
              connectivity: healthCheckResult.connectivity?.status,
              application: healthCheckResult.application?.status,
              database: healthCheckResult.database?.status,
              performance: healthCheckResult.performance?.status
            }
          }
        });
      }
    }
    
    return alerts;
  }

  async processAlert(alert) {
    try {
      // Check if alert is in cooldown
      if (this.isInCooldown(alert.type)) {
        this.log(`Alert ${alert.type} is in cooldown, skipping`, 'info');
        return;
      }
      
      // Check if similar alert is already active
      const existingAlert = this.findSimilarActiveAlert(alert);
      if (existingAlert) {
        this.updateExistingAlert(existingAlert, alert);
        return;
      }
      
      // Create new alert
      this.activeAlerts.set(alert.id, {
        ...alert,
        count: 1,
        firstOccurrence: alert.timestamp,
        lastOccurrence: alert.timestamp,
        resolved: false
      });
      
      this.alertHistory.push(alert);
      
      // Send notifications
      await this.sendAlertNotifications(alert);
      
      // Set cooldown
      this.alertCooldowns.set(alert.type, Date.now() + this.config.alertCooldown);
      
      this.log(`Alert generated: ${alert.type} - ${alert.message}`, 'warning');
      
    } catch (error) {
      this.log(`Error processing alert: ${error.message}`, 'error');
    }
  }

  isInCooldown(alertType) {
    const cooldownEnd = this.alertCooldowns.get(alertType);
    return cooldownEnd && Date.now() < cooldownEnd;
  }

  findSimilarActiveAlert(alert) {
    for (const [id, activeAlert] of this.activeAlerts) {
      if (activeAlert.type === alert.type && !activeAlert.resolved) {
        return activeAlert;
      }
    }
    return null;
  }

  updateExistingAlert(existingAlert, newAlert) {
    existingAlert.count++;
    existingAlert.lastOccurrence = newAlert.timestamp;
    existingAlert.details = { ...existingAlert.details, ...newAlert.details };
    
    this.log(`Updated existing alert: ${existingAlert.type} (count: ${existingAlert.count})`, 'info');
  }

  async checkResolvedAlerts(healthCheckResult) {
    try {
      for (const [id, alert] of this.activeAlerts) {
        if (alert.resolved) continue;
        
        const isResolved = this.isAlertResolved(alert, healthCheckResult);
        
        if (isResolved) {
          alert.resolved = true;
          alert.resolvedAt = new Date().toISOString();
          
          await this.sendResolutionNotification(alert);
          this.log(`Alert resolved: ${alert.type}`, 'success');
        }
      }
    } catch (error) {
      this.log(`Error checking resolved alerts: ${error.message}`, 'error');
    }
  }

  isAlertResolved(alert, healthCheckResult) {
    switch (alert.type) {
      case 'CONNECTIVITY_FAILURE':
        return healthCheckResult.connectivity?.status === 'healthy';
      
      case 'SLOW_RESPONSE':
        return healthCheckResult.connectivity?.responseTime < this.config.alertThresholds.responseTime;
      
      case 'APPLICATION_FAILURE':
        return healthCheckResult.application?.status === 'healthy';
      
      case 'DATABASE_FAILURE':
        return healthCheckResult.database?.status === 'healthy';
      
      case 'SYSTEM_FAILURE':
        return healthCheckResult.overall?.status === 'healthy';
      
      default:
        return false;
    }
  }

  async sendAlertNotifications(alert) {
    const notifications = [];
    
    // Console notification
    if (this.config.alertChannels.includes('console')) {
      notifications.push(this.sendConsoleNotification(alert));
    }
    
    // File notification
    if (this.config.alertChannels.includes('file')) {
      notifications.push(this.sendFileNotification(alert));
    }
    
    // Webhook notification
    if (this.config.alertChannels.includes('webhook') && this.config.notificationSettings.webhookUrl) {
      notifications.push(this.sendWebhookNotification(alert));
    }
    
    // Slack notification
    if (this.config.alertChannels.includes('slack') && this.config.notificationSettings.slackSettings) {
      notifications.push(this.sendSlackNotification(alert));
    }
    
    // Email notification
    if (this.config.alertChannels.includes('email') && this.config.notificationSettings.emailSettings) {
      notifications.push(this.sendEmailNotification(alert));
    }
    
    try {
      await Promise.allSettled(notifications);
    } catch (error) {
      this.log(`Error sending notifications: ${error.message}`, 'error');
    }
  }

  async sendConsoleNotification(alert) {
    const severityEmoji = {
      'LOW': '🟡',
      'MEDIUM': '🟠',
      'HIGH': '🔴',
      'CRITICAL': '🚨'
    };
    
    console.log(`\n${severityEmoji[alert.severity]} DEPLOYMENT ALERT`);
    console.log(`Type: ${alert.type}`);
    console.log(`Severity: ${alert.severity}`);
    console.log(`Message: ${alert.message}`);
    console.log(`Time: ${alert.timestamp}`);
    
    if (alert.details) {
      console.log('Details:', JSON.stringify(alert.details, null, 2));
    }
    
    console.log('─'.repeat(50));
  }

  async sendFileNotification(alert) {
    const alertsDir = path.join(process.cwd(), 'alerts');
    
    // Ensure alerts directory exists
    if (!fs.existsSync(alertsDir)) {
      fs.mkdirSync(alertsDir, { recursive: true });
    }
    
    const alertFile = path.join(alertsDir, `alert-${alert.id}.json`);
    
    try {
      fs.writeFileSync(alertFile, JSON.stringify(alert, null, 2));
      
      // Also append to alerts log
      const alertsLog = path.join(alertsDir, 'alerts.log');
      const logEntry = `${alert.timestamp} [${alert.severity}] ${alert.type}: ${alert.message}\n`;
      fs.appendFileSync(alertsLog, logEntry);
      
    } catch (error) {
      this.log(`Error writing alert to file: ${error.message}`, 'error');
    }
  }

  async sendWebhookNotification(alert) {
    const webhookUrl = this.config.notificationSettings.webhookUrl;
    if (!webhookUrl) {
      throw new Error('Webhook URL not configured');
    }

    const payload = JSON.stringify({
      alert_type: alert.type,
      severity: alert.severity,
      message: alert.message,
      timestamp: alert.timestamp,
      details: alert.details,
      deployment_url: this.deploymentUrl
    });

    return this.sendWebhookRequest(webhookUrl, payload);
  }

  async sendSlackNotification(alert) {
    const slackSettings = this.config.notificationSettings.slackSettings;
    
    if (!slackSettings.webhookUrl) {
      throw new Error('Slack webhook URL not configured');
    }
    
    const colorMap = {
      'LOW': '#ffeb3b',
      'MEDIUM': '#ff9800',
      'HIGH': '#f44336',
      'CRITICAL': '#9c27b0'
    };
    
    const payload = JSON.stringify({
      text: `🚨 Deployment Alert: ${alert.type}`,
      attachments: [{
        color: colorMap[alert.severity],
        fields: [
          {
            title: 'Severity',
            value: alert.severity,
            short: true
          },
          {
            title: 'Message',
            value: alert.message,
            short: false
          },
          {
            title: 'Time',
            value: alert.timestamp,
            short: true
          },
          {
            title: 'Deployment URL',
            value: this.deploymentUrl || 'Not specified',
            short: true
          }
        ]
      }]
    });
    
    return this.sendWebhookRequest(slackSettings.webhookUrl, payload);
  }

  async sendEmailNotification(alert) {
    // This would integrate with an email service like SendGrid, SES, etc.
    // For now, we'll log that an email would be sent
    this.log(`Email notification would be sent for alert: ${alert.type}`, 'info');
    
    // In a real implementation, you would:
    // 1. Format the alert as HTML/text email
    // 2. Send via your email service provider
    // 3. Handle delivery confirmation
    
    return Promise.resolve({ success: true, message: 'Email notification logged' });
  }

  async sendResolutionNotification(alert) {
    this.log(`Alert resolved: ${alert.type} (active for ${this.calculateAlertDuration(alert)})`, 'success');
    
    // Send resolution notifications through configured channels
    if (this.config.alertChannels.includes('console')) {
      console.log(`✅ ALERT RESOLVED: ${alert.type}`);
      console.log(`Duration: ${this.calculateAlertDuration(alert)}`);
      console.log(`Occurrences: ${alert.count}`);
    }
    
    if (this.config.alertChannels.includes('file')) {
      const alertsDir = path.join(process.cwd(), 'alerts');
      const resolutionsLog = path.join(alertsDir, 'resolutions.log');
      const logEntry = `${alert.resolvedAt} RESOLVED [${alert.severity}] ${alert.type}: Duration ${this.calculateAlertDuration(alert)}, Occurrences: ${alert.count}\n`;
      
      try {
        fs.appendFileSync(resolutionsLog, logEntry);
      } catch (error) {
        this.log(`Error writing resolution to file: ${error.message}`, 'error');
      }
    }
  }

  calculateAlertDuration(alert) {
    const start = new Date(alert.firstOccurrence).getTime();
    const end = new Date(alert.resolvedAt || alert.lastOccurrence).getTime();
    const durationMs = end - start;
    
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    
    return `${minutes}m ${seconds}s`;
  }

  async sendWebhookRequest(url, payload) {
    const maxRetries = 1;
    const timeoutMs = 8000;
    const createExternalError = ({ message, code, retryable, status, details }) => {
      const error = new Error(message);
      error.name = 'ExternalServiceError';
      error.service = 'webhook';
      error.code = code;
      error.retryable = retryable;
      if (status !== undefined) {
        error.status = status;
      }
      if (details) {
        error.details = details;
      }
      return error;
    };

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: payload,
          signal: controller.signal,
          cache: 'no-store',
        });

        clearTimeout(timeoutId);

        const responseText = await response.text().catch(() => '');

        if (response.ok) {
          return { success: true, response: responseText };
        }

        const error = createExternalError({
          message: `Webhook request failed (${response.status})`,
          code: response.status === 429 ? 'RATE_LIMIT' : response.status >= 500 ? 'UPSTREAM_5XX' : 'BAD_REQUEST',
          retryable: response.status === 429 || response.status >= 500,
          status: response.status,
          details: responseText ? { body: responseText.slice(0, 2000) } : undefined,
        });

        if (attempt < maxRetries && error.retryable) {
          const delayMs = 200 * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }

        throw error;
      } catch (error) {
        clearTimeout(timeoutId);

        const isTimeout = error && error.name === 'AbortError';
        const retryable =
          isTimeout ||
          (error && error.retryable === true) ||
          (error instanceof Error && error.name === 'TypeError');

        if (attempt < maxRetries && retryable) {
          const delayMs = 200 * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }

        if (isTimeout) {
          throw createExternalError({
            message: 'Webhook request timed out',
            code: 'TIMEOUT',
            retryable: true,
          });
        }

        if (error && error.name === 'ExternalServiceError') {
          throw error;
        }

        throw createExternalError({
          message: 'Webhook request failed (NETWORK_ERROR)',
          code: 'NETWORK_ERROR',
          retryable: true,
          details: error instanceof Error ? { message: error.message } : undefined,
        });
      }
    }

    return { success: false };
  }

  getActiveAlerts() {
    return Array.from(this.activeAlerts.values()).filter(alert => !alert.resolved);
  }

  getAlertHistory(limit = 50) {
    return this.alertHistory.slice(-limit);
  }

  getAlertStatistics() {
    const totalAlerts = this.alertHistory.length;
    const activeAlerts = this.getActiveAlerts().length;
    const resolvedAlerts = Array.from(this.activeAlerts.values()).filter(alert => alert.resolved).length;
    
    const alertsByType = {};
    const alertsBySeverity = {};
    
    this.alertHistory.forEach(alert => {
      alertsByType[alert.type] = (alertsByType[alert.type] || 0) + 1;
      alertsBySeverity[alert.severity] = (alertsBySeverity[alert.severity] || 0) + 1;
    });
    
    return {
      total: totalAlerts,
      active: activeAlerts,
      resolved: resolvedAlerts,
      byType: alertsByType,
      bySeverity: alertsBySeverity
    };
  }

  generateAlertReport() {
    const report = {
      timestamp: new Date().toISOString(),
      statistics: this.getAlertStatistics(),
      activeAlerts: this.getActiveAlerts(),
      recentHistory: this.getAlertHistory(20),
      configuration: {
        alertChannels: this.config.alertChannels,
        alertThresholds: this.config.alertThresholds,
        alertCooldown: this.config.alertCooldown
      }
    };
    
    const reportPath = path.join(process.cwd(), 'deployment-alerts-report.json');
    
    try {
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      this.log(`Alert report saved to: ${reportPath}`, 'info');
    } catch (error) {
      this.log(`Could not save alert report: ${error.message}`, 'warning');
    }
    
    return report;
  }

  clearResolvedAlerts() {
    const beforeCount = this.activeAlerts.size;
    
    for (const [id, alert] of this.activeAlerts) {
      if (alert.resolved) {
        this.activeAlerts.delete(id);
      }
    }
    
    const afterCount = this.activeAlerts.size;
    const clearedCount = beforeCount - afterCount;
    
    this.log(`Cleared ${clearedCount} resolved alerts`, 'info');
    return clearedCount;
  }
}

module.exports = DeploymentAlertingSystem;

// CLI usage for testing
if (require.main === module) {
  const alerting = new DeploymentAlertingSystem({
    alertChannels: ['console', 'file'],
    alertThresholds: {
      responseTime: 2000,
      consecutiveFailures: 2
    }
  });
  
  // Example usage
  const exampleHealthCheck = {
    timestamp: new Date().toISOString(),
    connectivity: {
      status: 'unhealthy',
      message: 'Connection timeout',
      responseTime: 5000
    },
    overall: {
      status: 'unhealthy',
      message: 'System experiencing issues'
    }
  };
  
  alerting.processHealthCheckResult(exampleHealthCheck)
    .then(() => {
      console.log('Alert processing completed');
      console.log('Active alerts:', alerting.getActiveAlerts().length);
      alerting.generateAlertReport();
    })
    .catch(error => {
      console.error('Alert processing failed:', error);
    });
}
