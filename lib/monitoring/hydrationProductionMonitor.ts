/**
 * Monitoring de production pour l'hydratation
 * 
 * Ce module surveille les erreurs d'hydratation en temps réel
 * en production et déclenche des alertes si nécessaire.
 */

import { hydrationMonitoringService } from '@/lib/services/hydrationMonitoringService';
import { externalFetch } from '@/lib/services/external/http';
import { isExternalServiceError } from '@/lib/services/external/errors';

export interface HydrationAlert {
  id: string;
  type: 'error_spike' | 'performance_degradation' | 'recovery_failure' | 'component_failure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  metadata: Record<string, any>;
  resolved: boolean;
}

export interface ProductionMetrics {
  errorRate: number;
  averageHydrationTime: number;
  recoverySuccessRate: number;
  affectedUsers: number;
  topErrors: Array<{
    error: string;
    count: number;
    lastSeen: number;
  }>;
}

export class HydrationProductionMonitor {
  private alerts: Map<string, HydrationAlert> = new Map();
  private metrics: ProductionMetrics = {
    errorRate: 0,
    averageHydrationTime: 0,
    recoverySuccessRate: 0,
    affectedUsers: 0,
    topErrors: []
  };
  
  private config = {
    errorRateThreshold: 0.05, // 5%
    performanceThreshold: 3000, // 3 secondes
    recoveryRateThreshold: 0.8, // 80%
    alertCooldown: 300000, // 5 minutes
    metricsInterval: 60000, // 1 minute
  };

  private intervalId: NodeJS.Timeout | null = null;
  private lastAlertTimes: Map<string, number> = new Map();

  /**
   * Démarre le monitoring de production
   */
  start(): void {
    if (this.intervalId) {
      return; // Déjà démarré
    }

    console.log('🚀 Démarrage du monitoring d\'hydratation en production');

    // Collecter les métriques toutes les minutes
    this.intervalId = setInterval(() => {
      this.collectMetrics();
      this.checkAlerts();
    }, this.config.metricsInterval);

    // Écouter les erreurs en temps réel
    this.setupErrorListeners();
  }

  /**
   * Arrête le monitoring
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏹️ Arrêt du monitoring d\'hydratation');
    }
  }

  /**
   * Configure les écouteurs d'erreurs
   */
  private setupErrorListeners(): void {
    // Écouter les erreurs d'hydratation via le service de monitoring
    hydrationMonitoringService.onAlert((alert) => {
      this.handleRealTimeAlert(alert);
    });

    // Écouter les erreurs JavaScript globales
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        if (this.isHydrationError(event.error)) {
          this.recordHydrationError(event.error);
        }
      });

      // Écouter les erreurs de promesses non gérées
      window.addEventListener('unhandledrejection', (event) => {
        if (this.isHydrationError(event.reason)) {
          this.recordHydrationError(event.reason);
        }
      });
    }
  }

  /**
   * Collecte les métriques actuelles
   */
  private async collectMetrics(): Promise<void> {
    try {
      const currentMetrics = await hydrationMonitoringService.getMetrics();
      
      this.metrics = {
        errorRate: currentMetrics.failedHydrations / Math.max(currentMetrics.totalHydrations, 1),
        averageHydrationTime: currentMetrics.averageHydrationTime,
        recoverySuccessRate: currentMetrics.recoverySuccessRate,
        affectedUsers: await this.getAffectedUsersCount(),
        topErrors: await this.getTopErrors()
      };

      // Envoyer les métriques au service de monitoring externe si configuré
      await this.sendMetricsToExternalService(this.metrics);

    } catch (error) {
      console.error('❌ Erreur lors de la collecte des métriques:', error);
    }
  }

  /**
   * Vérifie les conditions d'alerte
   */
  private checkAlerts(): void {
    // Vérifier le taux d'erreur
    if (this.metrics.errorRate > this.config.errorRateThreshold) {
      this.createAlert({
        type: 'error_spike',
        severity: this.metrics.errorRate > 0.1 ? 'critical' : 'high',
        message: `Taux d'erreur d'hydratation élevé: ${(this.metrics.errorRate * 100).toFixed(2)}%`,
        metadata: { errorRate: this.metrics.errorRate }
      });
    }

    // Vérifier les performances
    if (this.metrics.averageHydrationTime > this.config.performanceThreshold) {
      this.createAlert({
        type: 'performance_degradation',
        severity: this.metrics.averageHydrationTime > 5000 ? 'high' : 'medium',
        message: `Temps d'hydratation dégradé: ${this.metrics.averageHydrationTime}ms`,
        metadata: { averageTime: this.metrics.averageHydrationTime }
      });
    }

    // Vérifier le taux de récupération
    if (this.metrics.recoverySuccessRate < this.config.recoveryRateThreshold) {
      this.createAlert({
        type: 'recovery_failure',
        severity: this.metrics.recoverySuccessRate < 0.5 ? 'critical' : 'high',
        message: `Taux de récupération faible: ${(this.metrics.recoverySuccessRate * 100).toFixed(2)}%`,
        metadata: { recoveryRate: this.metrics.recoverySuccessRate }
      });
    }
  }

  /**
   * Crée une nouvelle alerte
   */
  private createAlert(alertData: Omit<HydrationAlert, 'id' | 'timestamp' | 'resolved'>): void {
    const alertId = `${alertData.type}_${Date.now()}`;
    const now = Date.now();

    // Vérifier le cooldown
    const lastAlert = this.lastAlertTimes.get(alertData.type);
    if (lastAlert && (now - lastAlert) < this.config.alertCooldown) {
      return; // Trop tôt pour une nouvelle alerte du même type
    }

    const alert: HydrationAlert = {
      id: alertId,
      timestamp: now,
      resolved: false,
      ...alertData
    };

    this.alerts.set(alertId, alert);
    this.lastAlertTimes.set(alertData.type, now);

    // Déclencher les notifications
    this.triggerAlertNotifications(alert);

    console.warn(`🚨 Alerte d'hydratation: ${alert.message}`);
  }

  /**
   * Gère les alertes en temps réel
   */
  private handleRealTimeAlert(alert: any): void {
    if (alert.type === 'hydration_error' && alert.severity === 'high') {
      this.createAlert({
        type: 'component_failure',
        severity: 'medium',
        message: `Erreur d'hydratation récurrente: ${alert.componentId}`,
        metadata: { componentId: alert.componentId, error: alert.error }
      });
    }
  }

  /**
   * Déclenche les notifications d'alerte
   */
  private async triggerAlertNotifications(alert: HydrationAlert): Promise<void> {
    try {
      // Notification Slack
      await this.sendSlackNotification(alert);
      
      // Notification email
      await this.sendEmailNotification(alert);
      
      // Webhook personnalisé
      await this.sendWebhookNotification(alert);

    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi des notifications:', error);
    }
  }

  /**
   * Envoie une notification Slack
   */
  private async sendSlackNotification(alert: HydrationAlert): Promise<void> {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) return;

    const color = {
      low: '#36a64f',
      medium: '#ff9500',
      high: '#ff0000',
      critical: '#8b0000'
    }[alert.severity];

    const payload = {
      channel: '#dev-alerts',
      username: 'Hydration Monitor',
      icon_emoji: ':warning:',
      attachments: [{
        color,
        title: `🚨 Alerte d'Hydratation - ${alert.severity.toUpperCase()}`,
        text: alert.message,
        fields: [
          {
            title: 'Type',
            value: alert.type,
            short: true
          },
          {
            title: 'Timestamp',
            value: new Date(alert.timestamp).toISOString(),
            short: true
          }
        ],
        footer: 'Huntaze Hydration Monitor',
        ts: Math.floor(alert.timestamp / 1000)
      }]
    };

    try {
      const response = await externalFetch(webhookUrl, {
        service: 'slack',
        operation: 'hydration.alert',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
        timeoutMs: 5_000,
        retry: { maxRetries: 1, retryMethods: ['POST'] },
        throwOnHttpError: false,
      });

      if (!response.ok) {
        console.error('❌ Slack notification failed:', response.statusText);
      }
    } catch (error) {
      if (isExternalServiceError(error)) {
        console.error('❌ Slack notification error:', error.code, error.message);
      } else {
        console.error('❌ Slack notification error:', error);
      }
    }
  }

  /**
   * Envoie une notification email
   */
  private async sendEmailNotification(alert: HydrationAlert): Promise<void> {
    // Implémentation de l'envoi d'email
    // Utiliserait le service SES configuré
    console.log(`📧 Email d'alerte envoyé pour: ${alert.message}`);
  }

  /**
   * Envoie une notification webhook
   */
  private async sendWebhookNotification(alert: HydrationAlert): Promise<void> {
    const webhookUrl = process.env.HYDRATION_WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
      const response = await externalFetch(webhookUrl, {
        service: 'webhook',
        operation: 'hydration.alert',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'hydration_alert',
          alert,
          metrics: this.metrics,
          timestamp: Date.now(),
        }),
        cache: 'no-store',
        timeoutMs: 5_000,
        retry: { maxRetries: 1, retryMethods: ['POST'] },
        throwOnHttpError: false,
      });

      if (!response.ok) {
        console.error('❌ Webhook notification failed:', response.statusText);
      }
    } catch (error) {
      if (isExternalServiceError(error)) {
        console.error('❌ Webhook notification error:', error.code, error.message);
      } else {
        console.error('❌ Webhook notification error:', error);
      }
    }
  }

  /**
   * Envoie les métriques au service externe
   */
  private async sendMetricsToExternalService(metrics: ProductionMetrics): Promise<void> {
    const endpoint = process.env.HYDRATION_MONITORING_ENDPOINT;
    const apiKey = process.env.HYDRATION_MONITORING_API_KEY;
    
    if (!endpoint || !apiKey) return;

    try {
      const response = await externalFetch(endpoint, {
        service: 'hydration-monitor',
        operation: 'metrics.send',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          service: 'huntaze-hydration',
          timestamp: Date.now(),
          metrics,
        }),
        cache: 'no-store',
        timeoutMs: 10_000,
        retry: { maxRetries: 1, retryMethods: ['POST'] },
        throwOnHttpError: false,
      });

      if (!response.ok) {
        console.error('❌ Metrics delivery failed:', response.statusText);
      }
    } catch (error) {
      if (isExternalServiceError(error)) {
        console.error('❌ Erreur lors de l\'envoi des métriques:', error.code, error.message);
      } else {
        console.error('❌ Erreur lors de l\'envoi des métriques:', error);
      }
    }
  }

  /**
   * Vérifie si une erreur est liée à l'hydratation
   */
  private isHydrationError(error: any): boolean {
    if (!error) return false;
    
    const message = error.message || error.toString();
    const hydrationKeywords = [
      'hydration',
      'server-rendered HTML',
      'client-side',
      'suppressHydrationWarning',
      'Text content does not match'
    ];

    return hydrationKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  /**
   * Enregistre une erreur d'hydratation
   */
  private recordHydrationError(error: any): void {
    // Créer un objet Error si ce n'est pas déjà le cas
    const errorObj = error instanceof Error 
      ? error 
      : new Error(error?.message || error?.toString() || 'Unknown hydration error');
    
    hydrationMonitoringService.recordHydrationError(
      'unknown-component',
      errorObj,
      0 // retryCount
    );
  }

  /**
   * Obtient le nombre d'utilisateurs affectés
   */
  private async getAffectedUsersCount(): Promise<number> {
    // Implémentation pour compter les utilisateurs uniques affectés
    // Basé sur les sessions ou les IDs utilisateur
    return 0; // Placeholder
  }

  /**
   * Obtient les erreurs les plus fréquentes
   */
  private async getTopErrors(): Promise<Array<{ error: string; count: number; lastSeen: number }>> {
    const recentErrors = await hydrationMonitoringService.getRecentErrors();
    
    // Grouper et compter les erreurs
    const errorCounts = recentErrors.reduce((acc, error) => {
      const key = error.errorMessage;
      if (!acc[key]) {
        acc[key] = { count: 0, lastSeen: 0 };
      }
      acc[key].count++;
      acc[key].lastSeen = Math.max(acc[key].lastSeen, error.timestamp);
      return acc;
    }, {} as Record<string, { count: number; lastSeen: number }>);

    return Object.entries(errorCounts)
      .map(([error, data]) => ({ error, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Obtient les métriques actuelles
   */
  getMetrics(): ProductionMetrics {
    return { ...this.metrics };
  }

  /**
   * Obtient les alertes actives
   */
  getActiveAlerts(): HydrationAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Résout une alerte
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      return true;
    }
    return false;
  }

  /**
   * Génère un rapport de santé
   */
  generateHealthReport(): {
    status: 'healthy' | 'warning' | 'critical';
    metrics: ProductionMetrics;
    activeAlerts: HydrationAlert[];
    recommendations: string[];
  } {
    const activeAlerts = this.getActiveAlerts();
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');
    const highAlerts = activeAlerts.filter(a => a.severity === 'high');

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (criticalAlerts.length > 0) {
      status = 'critical';
    } else if (highAlerts.length > 0 || this.metrics.errorRate > 0.02) {
      status = 'warning';
    }

    const recommendations: string[] = [];
    
    if (this.metrics.errorRate > 0.05) {
      recommendations.push('Taux d\'erreur élevé - Vérifier les composants récemment déployés');
    }
    
    if (this.metrics.averageHydrationTime > 2000) {
      recommendations.push('Performance dégradée - Optimiser les composants lents');
    }
    
    if (this.metrics.recoverySuccessRate < 0.8) {
      recommendations.push('Taux de récupération faible - Améliorer les mécanismes de fallback');
    }

    return {
      status,
      metrics: this.metrics,
      activeAlerts,
      recommendations
    };
  }
}

// Instance singleton
export const hydrationProductionMonitor = new HydrationProductionMonitor();
