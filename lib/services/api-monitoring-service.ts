/**
 * API Monitoring Service
 * Collecte et analyse les métriques de performance des API
 */

interface APIMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
  userId?: string;
  userAgent?: string;
  errorType?: string;
  tokensUsed?: number;
  cacheHit?: boolean;
}

interface PerformanceAlert {
  id: string;
  type: 'high_latency' | 'error_rate' | 'rate_limit' | 'token_usage';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  threshold: number;
  currentValue: number;
  timestamp: Date;
  endpoint?: string;
  userId?: string;
}

interface APIHealthMetrics {
  uptime: number;
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
  errorRate: number;
  rateLimitHits: number;
  cacheHitRate: number;
  totalTokensUsed: number;
  activeUsers: number;
}

export class APIMonitoringService {
  private static instance: APIMonitoringService;
  private metrics: APIMetric[] = [];
  private alerts: PerformanceAlert[] = [];
  private startTime: Date = new Date();
  
  // Configuration des seuils d'alerte
  private alertThresholds = {
    highLatency: 5000, // 5 secondes
    errorRate: 5, // 5%
    rateLimitRate: 10, // 10%
    tokenUsagePerHour: 10000,
  };

  // Fenêtres de temps pour les calculs
  private readonly METRICS_RETENTION_HOURS = 24;
  private readonly ALERT_RETENTION_HOURS = 72;

  static getInstance(): APIMonitoringService {
    if (!APIMonitoringService.instance) {
      APIMonitoringService.instance = new APIMonitoringService();
    }
    return APIMonitoringService.instance;
  }

  /**
   * Enregistre une métrique d'API
   */
  recordMetric(metric: Omit<APIMetric, 'timestamp'>): void {
    const fullMetric: APIMetric = {
      ...metric,
      timestamp: new Date(),
    };

    this.metrics.push(fullMetric);
    this.cleanupOldMetrics();
    this.checkAlertConditions(fullMetric);

    // Log en développement
    if (process.env.NODE_ENV === 'development') {
      console.log(`[APIMonitoring] ${metric.method} ${metric.endpoint} - ${metric.statusCode} (${metric.responseTime}ms)`);
    }
  }

  /**
   * Vérifie les conditions d'alerte
   */
  private checkAlertConditions(metric: APIMetric): void {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp >= oneHourAgo);

    // Vérifier la latence élevée
    if (metric.responseTime > this.alertThresholds.highLatency) {
      this.createAlert({
        type: 'high_latency',
        severity: metric.responseTime > this.alertThresholds.highLatency * 2 ? 'critical' : 'high',
        message: `High response time detected: ${metric.responseTime}ms`,
        threshold: this.alertThresholds.highLatency,
        currentValue: metric.responseTime,
        endpoint: metric.endpoint,
        userId: metric.userId,
      });
    }

    // Vérifier le taux d'erreur
    if (recentMetrics.length >= 10) { // Minimum de données pour calculer le taux
      const errorCount = recentMetrics.filter(m => m.statusCode >= 400).length;
      const errorRate = (errorCount / recentMetrics.length) * 100;

      if (errorRate > this.alertThresholds.errorRate) {
        this.createAlert({
          type: 'error_rate',
          severity: errorRate > this.alertThresholds.errorRate * 2 ? 'critical' : 'high',
          message: `High error rate detected: ${errorRate.toFixed(1)}%`,
          threshold: this.alertThresholds.errorRate,
          currentValue: errorRate,
          endpoint: metric.endpoint,
        });
      }
    }

    // Vérifier l'usage des tokens
    const totalTokensLastHour = recentMetrics
      .filter(m => m.tokensUsed)
      .reduce((sum, m) => sum + (m.tokensUsed || 0), 0);

    if (totalTokensLastHour > this.alertThresholds.tokenUsagePerHour) {
      this.createAlert({
        type: 'token_usage',
        severity: 'medium',
        message: `High token usage: ${totalTokensLastHour} tokens in the last hour`,
        threshold: this.alertThresholds.tokenUsagePerHour,
        currentValue: totalTokensLastHour,
      });
    }
  }

  /**
   * Crée une nouvelle alerte
   */
  private createAlert(alertData: Omit<PerformanceAlert, 'id' | 'timestamp'>): void {
    // Éviter les alertes en double
    const recentSimilarAlert = this.alerts.find(alert => 
      alert.type === alertData.type &&
      alert.endpoint === alertData.endpoint &&
      alert.userId === alertData.userId &&
      Date.now() - alert.timestamp.getTime() < 5 * 60 * 1000 // 5 minutes
    );

    if (recentSimilarAlert) {
      return;
    }

    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...alertData,
    };

    this.alerts.push(alert);
    this.cleanupOldAlerts();

    // Log l'alerte
    console.warn(`[APIMonitoring] ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`);

    // En production, ici on enverrait l'alerte à un service de monitoring externe
    if (process.env.NODE_ENV === 'production') {
      this.sendAlertToExternalService(alert);
    }
  }

  /**
   * Envoie l'alerte à un service externe (placeholder)
   */
  private async sendAlertToExternalService(alert: PerformanceAlert): Promise<void> {
    // Ici on intégrerait avec des services comme DataDog, New Relic, etc.
    try {
      // Exemple d'intégration webhook
      if (process.env.MONITORING_WEBHOOK_URL) {
        await fetch(process.env.MONITORING_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alert,
            service: 'huntaze-api',
            environment: process.env.NODE_ENV,
          }),
        });
      }
    } catch (error) {
      console.error('Failed to send alert to external service:', error);
    }
  }

  /**
   * Nettoie les anciennes métriques
   */
  private cleanupOldMetrics(): void {
    const cutoff = new Date(Date.now() - this.METRICS_RETENTION_HOURS * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(metric => metric.timestamp >= cutoff);
  }

  /**
   * Nettoie les anciennes alertes
   */
  private cleanupOldAlerts(): void {
    const cutoff = new Date(Date.now() - this.ALERT_RETENTION_HOURS * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(alert => alert.timestamp >= cutoff);
  }

  /**
   * Obtient les métriques de santé de l'API
   */
  getHealthMetrics(): APIHealthMetrics {
    const now = new Date();
    const uptime = Math.floor((now.getTime() - this.startTime.getTime()) / 1000);
    
    const totalRequests = this.metrics.length;
    const successfulRequests = this.metrics.filter(m => m.statusCode < 400).length;
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100;
    
    const totalResponseTime = this.metrics.reduce((sum, m) => sum + m.responseTime, 0);
    const averageResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;
    
    const errorRequests = this.metrics.filter(m => m.statusCode >= 400).length;
    const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;
    
    const rateLimitHits = this.metrics.filter(m => m.statusCode === 429).length;
    
    const cacheableRequests = this.metrics.filter(m => m.cacheHit !== undefined).length;
    const cacheHits = this.metrics.filter(m => m.cacheHit === true).length;
    const cacheHitRate = cacheableRequests > 0 ? (cacheHits / cacheableRequests) * 100 : 0;
    
    const totalTokensUsed = this.metrics
      .filter(m => m.tokensUsed)
      .reduce((sum, m) => sum + (m.tokensUsed || 0), 0);
    
    const uniqueUsers = new Set(this.metrics.filter(m => m.userId).map(m => m.userId)).size;

    return {
      uptime,
      totalRequests,
      successRate: Math.round(successRate * 100) / 100,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      rateLimitHits,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      totalTokensUsed,
      activeUsers: uniqueUsers,
    };
  }

  /**
   * Obtient les métriques par endpoint
   */
  getEndpointMetrics(): Record<string, {
    requests: number;
    averageResponseTime: number;
    errorRate: number;
    successRate: number;
  }> {
    const endpointStats: Record<string, {
      requests: number;
      totalResponseTime: number;
      errors: number;
      successes: number;
    }> = {};

    this.metrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`;
      
      if (!endpointStats[key]) {
        endpointStats[key] = {
          requests: 0,
          totalResponseTime: 0,
          errors: 0,
          successes: 0,
        };
      }

      const stats = endpointStats[key];
      stats.requests++;
      stats.totalResponseTime += metric.responseTime;
      
      if (metric.statusCode >= 400) {
        stats.errors++;
      } else {
        stats.successes++;
      }
    });

    const result: Record<string, any> = {};
    
    Object.entries(endpointStats).forEach(([endpoint, stats]) => {
      result[endpoint] = {
        requests: stats.requests,
        averageResponseTime: Math.round((stats.totalResponseTime / stats.requests) * 100) / 100,
        errorRate: Math.round((stats.errors / stats.requests) * 100 * 100) / 100,
        successRate: Math.round((stats.successes / stats.requests) * 100 * 100) / 100,
      };
    });

    return result;
  }

  /**
   * Obtient les alertes actives
   */
  getActiveAlerts(): PerformanceAlert[] {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return this.alerts
      .filter(alert => alert.timestamp >= oneHourAgo)
      .sort((a, b) => {
        // Trier par sévérité puis par timestamp
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        if (severityDiff !== 0) return severityDiff;
        return b.timestamp.getTime() - a.timestamp.getTime();
      });
  }

  /**
   * Obtient les métriques de performance par utilisateur
   */
  getUserMetrics(userId: string): {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    tokensUsed: number;
    lastActivity: Date | null;
  } {
    const userMetrics = this.metrics.filter(m => m.userId === userId);
    
    if (userMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        tokensUsed: 0,
        lastActivity: null,
      };
    }

    const totalRequests = userMetrics.length;
    const totalResponseTime = userMetrics.reduce((sum, m) => sum + m.responseTime, 0);
    const averageResponseTime = totalResponseTime / totalRequests;
    
    const errors = userMetrics.filter(m => m.statusCode >= 400).length;
    const errorRate = (errors / totalRequests) * 100;
    
    const tokensUsed = userMetrics
      .filter(m => m.tokensUsed)
      .reduce((sum, m) => sum + (m.tokensUsed || 0), 0);
    
    const lastActivity = userMetrics
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]
      .timestamp;

    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      tokensUsed,
      lastActivity,
    };
  }

  /**
   * Met à jour les seuils d'alerte
   */
  updateAlertThresholds(thresholds: Partial<typeof this.alertThresholds>): void {
    this.alertThresholds = { ...this.alertThresholds, ...thresholds };
    console.log('[APIMonitoring] Alert thresholds updated:', this.alertThresholds);
  }

  /**
   * Exporte les métriques pour analyse externe
   */
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['timestamp', 'endpoint', 'method', 'statusCode', 'responseTime', 'userId', 'tokensUsed', 'cacheHit'];
      const rows = this.metrics.map(m => [
        m.timestamp.toISOString(),
        m.endpoint,
        m.method,
        m.statusCode,
        m.responseTime,
        m.userId || '',
        m.tokensUsed || '',
        m.cacheHit || '',
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      metricsCount: this.metrics.length,
      alertsCount: this.alerts.length,
      healthMetrics: this.getHealthMetrics(),
      endpointMetrics: this.getEndpointMetrics(),
      alerts: this.getActiveAlerts(),
      rawMetrics: this.metrics,
    }, null, 2);
  }

  /**
   * Réinitialise toutes les métriques (utile pour les tests)
   */
  reset(): void {
    this.metrics = [];
    this.alerts = [];
    this.startTime = new Date();
    console.log('[APIMonitoring] Metrics reset');
  }
}

// Middleware pour l'enregistrement automatique des métriques
export function createMonitoringMiddleware() {
  const monitoring = APIMonitoringService.getInstance();

  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    const originalSend = res.send;

    res.send = function(body: any) {
      const responseTime = Date.now() - startTime;
      
      monitoring.recordMetric({
        endpoint: req.route?.path || req.path,
        method: req.method,
        statusCode: res.statusCode,
        responseTime,
        userId: req.user?.id,
        userAgent: req.get('User-Agent'),
        tokensUsed: res.locals?.tokensUsed,
        cacheHit: res.locals?.cacheHit,
      });

      return originalSend.call(this, body);
    };

    next();
  };
}

// Fonction utilitaire pour obtenir l'instance
export function getAPIMonitoringService(): APIMonitoringService {
  return APIMonitoringService.getInstance();
}