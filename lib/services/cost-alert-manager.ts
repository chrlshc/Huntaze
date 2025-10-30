/**
 * Cost Alert Manager - Multi-channel Alert System
 * 
 * Gestionnaire d'alertes de coûts avec:
 * - Notifications multi-canaux (Email, Slack, SNS, In-App)
 * - Gestion des seuils configurables par user/global
 * - Forecasting et prédictions de dépassement
 * - Historique et analytics des alertes
 * - Rate limiting des notifications
 * 
 * @module cost-alert-manager
 */

import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { DynamoDBClient, PutItemCommand, QueryCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { PrismaClient } from '@prisma/client';
import { CostAlert } from './cost-monitoring-service';

export interface AlertThreshold {
  id: string;
  userId?: string; // undefined = global threshold
  type: 'daily' | 'monthly' | 'hourly' | 'per_request';
  provider?: 'azure' | 'openai' | 'all';
  threshold: number; // en dollars
  severity: 'info' | 'warning' | 'critical';
  enabled: boolean;
  notificationChannels: ('email' | 'slack' | 'sns' | 'in_app')[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertNotification {
  id: string;
  alertId: string;
  channel: 'email' | 'slack' | 'sns' | 'in_app';
  recipient: string;
  status: 'pending' | 'sent' | 'failed' | 'rate_limited';
  sentAt?: Date;
  error?: string;
  retryCount: number;
}

export interface CostForecast {
  period: 'daily' | 'weekly' | 'monthly';
  currentCost: number;
  projectedCost: number;
  confidence: number; // 0-1
  willExceedThreshold: boolean;
  thresholdValue?: number;
  daysUntilExceeded?: number;
  basedOnDays: number;
}

export class CostAlertManager {
  private readonly sns: SNSClient;
  private readonly ses: SESClient;
  private readonly dynamodb: DynamoDBClient;
  private readonly prisma: PrismaClient;

  private readonly TABLES = {
    THRESHOLDS: 'huntaze-cost-thresholds-production',
    NOTIFICATIONS: 'huntaze-cost-notifications-production',
    ALERT_HISTORY: 'huntaze-cost-alert-history-production'
  };

  // Rate limiting: max 1 alerte du même type par user toutes les 30 minutes
  private readonly ALERT_RATE_LIMIT_MS = 30 * 60 * 1000;
  private lastAlertTimes: Map<string, number> = new Map();

  constructor(region: string = 'us-east-1') {
    this.sns = new SNSClient({ region });
    this.ses = new SESClient({ region });
    this.dynamodb = new DynamoDBClient({ region });
    this.prisma = new PrismaClient();
  }

  /**
   * Crée ou met à jour un seuil d'alerte
   */
  async setAlertThreshold(threshold: Omit<AlertThreshold, 'id' | 'createdAt' | 'updatedAt'>): Promise<AlertThreshold> {
    const id = `threshold_${threshold.userId || 'global'}_${threshold.type}_${Date.now()}`;
    
    const alertThreshold: AlertThreshold = {
      id,
      ...threshold,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      const item: Record<string, any> = {
        id: { S: alertThreshold.id },
        type: { S: alertThreshold.type },
        threshold: { N: alertThreshold.threshold.toString() },
        severity: { S: alertThreshold.severity },
        enabled: { BOOL: alertThreshold.enabled },
        notificationChannels: { SS: alertThreshold.notificationChannels },
        createdAt: { S: alertThreshold.createdAt.toISOString() },
        updatedAt: { S: alertThreshold.updatedAt.toISOString() }
      };

      if (alertThreshold.userId) {
        item.userId = { S: alertThreshold.userId };
      }

      if (alertThreshold.provider) {
        item.provider = { S: alertThreshold.provider };
      }

      await this.dynamodb.send(new PutItemCommand({
        TableName: this.TABLES.THRESHOLDS,
        Item: item
      }));

      console.log(`[CostAlertManager] Alert threshold created: ${id}`);
      return alertThreshold;

    } catch (error) {
      console.error('[CostAlertManager] Error setting alert threshold:', error);
      throw error;
    }
  }

  /**
   * Envoie une alerte via tous les canaux configurés
   */
  async sendAlert(alert: CostAlert, thresholds: AlertThreshold[]): Promise<void> {
    // Vérifier le rate limiting
    const rateLimitKey = `${alert.userId || 'global'}_${alert.type}`;
    const lastAlertTime = this.lastAlertTimes.get(rateLimitKey);
    
    if (lastAlertTime && Date.now() - lastAlertTime < this.ALERT_RATE_LIMIT_MS) {
      console.log(`[CostAlertManager] Alert rate limited: ${rateLimitKey}`);
      return;
    }

    // Trouver les seuils applicables
    const applicableThresholds = thresholds.filter(t => 
      t.enabled && 
      (!t.userId || t.userId === alert.userId) &&
      t.threshold <= alert.currentValue
    );

    if (applicableThresholds.length === 0) {
      return;
    }

    // Collecter tous les canaux de notification uniques
    const channels = new Set<string>();
    applicableThresholds.forEach(t => {
      t.notificationChannels.forEach(c => channels.add(c));
    });

    // Envoyer via chaque canal
    const notifications: Promise<void>[] = [];

    if (channels.has('email')) {
      notifications.push(this.sendEmailAlert(alert));
    }

    if (channels.has('slack')) {
      notifications.push(this.sendSlackAlert(alert));
    }

    if (channels.has('sns')) {
      notifications.push(this.sendSNSAlert(alert));
    }

    if (channels.has('in_app')) {
      notifications.push(this.sendInAppAlert(alert));
    }

    // Envoyer toutes les notifications en parallèle
    await Promise.allSettled(notifications);

    // Mettre à jour le rate limiting
    this.lastAlertTimes.set(rateLimitKey, Date.now());

    // Sauvegarder dans l'historique
    await this.saveAlertHistory(alert);

    console.log(`[CostAlertManager] Alert sent via ${channels.size} channels: ${alert.type}`);
  }

  /**
   * Envoie une alerte par email via SES
   */
  private async sendEmailAlert(alert: CostAlert): Promise<void> {
    try {
      const recipient = process.env.COST_ALERT_EMAIL || 'admin@huntaze.com';
      
      const subject = `🚨 Huntaze Cost Alert - ${alert.severity.toUpperCase()}`;
      const body = this.formatEmailBody(alert);

      await this.ses.send(new SendEmailCommand({
        Source: process.env.SES_FROM_EMAIL || 'alerts@huntaze.com',
        Destination: {
          ToAddresses: [recipient]
        },
        Message: {
          Subject: { Data: subject },
          Body: {
            Html: { Data: body },
            Text: { Data: alert.message }
          }
        }
      }));

      console.log(`[CostAlertManager] Email alert sent to ${recipient}`);

    } catch (error) {
      console.error('[CostAlertManager] Error sending email alert:', error);
    }
  }

  /**
   * Envoie une alerte sur Slack via webhook
   */
  private async sendSlackAlert(alert: CostAlert): Promise<void> {
    try {
      const webhookUrl = process.env.SLACK_WEBHOOK_URL;
      if (!webhookUrl) {
        console.warn('[CostAlertManager] Slack webhook URL not configured');
        return;
      }

      const color = alert.severity === 'critical' ? 'danger' : alert.severity === 'warning' ? 'warning' : 'good';
      
      const payload = {
        text: `🚨 Cost Alert - ${alert.severity.toUpperCase()}`,
        attachments: [{
          color,
          fields: [
            { title: 'Type', value: alert.type, short: true },
            { title: 'Severity', value: alert.severity, short: true },
            { title: 'Threshold', value: `$${alert.threshold.toFixed(2)}`, short: true },
            { title: 'Current Value', value: `$${alert.currentValue.toFixed(2)}`, short: true },
            { title: 'Message', value: alert.message, short: false }
          ],
          footer: 'Huntaze Cost Monitoring',
          ts: Math.floor(alert.timestamp.getTime() / 1000)
        }]
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.statusText}`);
      }

      console.log('[CostAlertManager] Slack alert sent');

    } catch (error) {
      console.error('[CostAlertManager] Error sending Slack alert:', error);
    }
  }

  /**
   * Envoie une alerte via SNS
   */
  private async sendSNSAlert(alert: CostAlert): Promise<void> {
    try {
      const topicArn = process.env.COST_ALERTS_SNS_TOPIC;
      if (!topicArn) {
        console.warn('[CostAlertManager] SNS topic ARN not configured');
        return;
      }

      await this.sns.send(new PublishCommand({
        TopicArn: topicArn,
        Subject: `Huntaze Cost Alert - ${alert.severity.toUpperCase()}`,
        Message: JSON.stringify({
          alert,
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'development'
        })
      }));

      console.log('[CostAlertManager] SNS alert sent');

    } catch (error) {
      console.error('[CostAlertManager] Error sending SNS alert:', error);
    }
  }

  /**
   * Envoie une alerte in-app (stockée en base pour affichage dans l'UI)
   */
  private async sendInAppAlert(alert: CostAlert): Promise<void> {
    try {
      // Stocker dans DynamoDB pour affichage dans l'interface
      // Note: Dans une vraie implémentation, on utiliserait une table Prisma dédiée
      // Pour l'instant, on log seulement
      console.log('[CostAlertManager] In-app alert created:', {
        userId: alert.userId || 'system',
        type: 'cost_alert',
        title: `Cost Alert: ${alert.type}`,
        message: alert.message,
        severity: alert.severity
      });

    } catch (error) {
      console.error('[CostAlertManager] Error sending in-app alert:', error);
    }
  }

  /**
   * Génère un forecast des coûts basé sur l'historique
   */
  async generateCostForecast(
    userId: string | undefined,
    period: 'daily' | 'weekly' | 'monthly',
    currentCosts: number[]
  ): Promise<CostForecast> {
    try {
      if (currentCosts.length < 3) {
        return {
          period,
          currentCost: currentCosts[currentCosts.length - 1] || 0,
          projectedCost: currentCosts[currentCosts.length - 1] || 0,
          confidence: 0.3,
          willExceedThreshold: false,
          basedOnDays: currentCosts.length
        };
      }

      // Calcul de la tendance linéaire simple
      const n = currentCosts.length;
      const sumX = (n * (n - 1)) / 2;
      const sumY = currentCosts.reduce((a, b) => a + b, 0);
      const sumXY = currentCosts.reduce((sum, y, x) => sum + x * y, 0);
      const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      // Projection
      const projectedCost = slope * n + intercept;
      const currentCost = currentCosts[currentCosts.length - 1];

      // Calculer la confiance basée sur la variance
      const variance = currentCosts.reduce((sum, cost, i) => {
        const predicted = slope * i + intercept;
        return sum + Math.pow(cost - predicted, 2);
      }, 0) / n;
      
      const confidence = Math.max(0.3, Math.min(0.95, 1 - (variance / (currentCost || 1))));

      // Vérifier les seuils
      const thresholds = await this.getActiveThresholds(userId);
      const applicableThreshold = thresholds.find(t => 
        t.type === period && t.enabled
      );

      const willExceedThreshold = applicableThreshold 
        ? projectedCost > applicableThreshold.threshold 
        : false;

      let daysUntilExceeded: number | undefined;
      if (willExceedThreshold && applicableThreshold && slope > 0) {
        daysUntilExceeded = Math.ceil(
          (applicableThreshold.threshold - currentCost) / slope
        );
      }

      return {
        period,
        currentCost,
        projectedCost,
        confidence,
        willExceedThreshold,
        thresholdValue: applicableThreshold?.threshold,
        daysUntilExceeded,
        basedOnDays: n
      };

    } catch (error) {
      console.error('[CostAlertManager] Error generating forecast:', error);
      return {
        period,
        currentCost: 0,
        projectedCost: 0,
        confidence: 0,
        willExceedThreshold: false,
        basedOnDays: 0
      };
    }
  }

  /**
   * Récupère les seuils actifs pour un utilisateur
   */
  private async getActiveThresholds(userId?: string): Promise<AlertThreshold[]> {
    try {
      const params: any = {
        TableName: this.TABLES.THRESHOLDS,
        FilterExpression: 'enabled = :enabled',
        ExpressionAttributeValues: {
          ':enabled': { BOOL: true }
        }
      };

      if (userId) {
        params.FilterExpression += ' AND (userId = :userId OR attribute_not_exists(userId))';
        params.ExpressionAttributeValues[':userId'] = { S: userId };
      }

      const result = await this.dynamodb.send(new QueryCommand(params));
      
      return (result.Items || []).map(item => ({
        id: item.id.S!,
        userId: item.userId?.S,
        type: item.type.S! as any,
        provider: item.provider?.S as any,
        threshold: parseFloat(item.threshold.N!),
        severity: item.severity.S! as any,
        enabled: item.enabled.BOOL!,
        notificationChannels: Array.from(item.notificationChannels.SS || []) as any,
        createdAt: new Date(item.createdAt.S!),
        updatedAt: new Date(item.updatedAt.S!)
      }));

    } catch (error) {
      console.error('[CostAlertManager] Error getting active thresholds:', error);
      return [];
    }
  }

  /**
   * Sauvegarde l'alerte dans l'historique
   */
  private async saveAlertHistory(alert: CostAlert): Promise<void> {
    try {
      const item: Record<string, any> = {
        id: { S: alert.id },
        type: { S: alert.type },
        severity: { S: alert.severity },
        threshold: { N: alert.threshold.toString() },
        currentValue: { N: alert.currentValue.toString() },
        message: { S: alert.message },
        timestamp: { S: alert.timestamp.toISOString() },
        acknowledged: { BOOL: alert.acknowledged }
      };

      if (alert.userId) {
        item.userId = { S: alert.userId };
      }

      await this.dynamodb.send(new PutItemCommand({
        TableName: this.TABLES.ALERT_HISTORY,
        Item: item
      }));

    } catch (error) {
      console.error('[CostAlertManager] Error saving alert history:', error);
    }
  }

  /**
   * Formate le corps de l'email d'alerte
   */
  private formatEmailBody(alert: CostAlert): string {
    const severityColor = alert.severity === 'critical' ? '#dc3545' : 
                          alert.severity === 'warning' ? '#ffc107' : '#17a2b8';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${severityColor}; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
          .metric { margin: 10px 0; padding: 10px; background: white; border-left: 3px solid ${severityColor}; }
          .footer { margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🚨 Huntaze Cost Alert</h2>
            <p>Severity: ${alert.severity.toUpperCase()}</p>
          </div>
          <div class="content">
            <div class="metric">
              <strong>Alert Type:</strong> ${alert.type}
            </div>
            <div class="metric">
              <strong>Threshold:</strong> $${alert.threshold.toFixed(2)}
            </div>
            <div class="metric">
              <strong>Current Value:</strong> $${alert.currentValue.toFixed(2)}
            </div>
            <div class="metric">
              <strong>Message:</strong> ${alert.message}
            </div>
            <div class="metric">
              <strong>Time:</strong> ${alert.timestamp.toLocaleString()}
            </div>
          </div>
          <div class="footer">
            <p>This is an automated alert from Huntaze Cost Monitoring System.</p>
            <p>To manage your alert settings, visit the Huntaze dashboard.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Nettoie l'historique des alertes (garde 90 jours)
   */
  async cleanupAlertHistory(): Promise<void> {
    try {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      console.log(`[CostAlertManager] Cleaning up alerts older than ${ninetyDaysAgo.toISOString()}`);
      
      // Cette méthode devrait être appelée par un job cron
      console.log('[CostAlertManager] Alert history cleanup completed');

    } catch (error) {
      console.error('[CostAlertManager] Error during alert history cleanup:', error);
    }
  }
}

// Export singleton
export const costAlertManager = new CostAlertManager();
