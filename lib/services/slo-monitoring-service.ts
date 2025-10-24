/**
 * SLO Monitoring Service with Burn Rate Alerting
 * Monitoring niveau GAFAM avec SLIs, SLOs et burn rate intelligent
 */

interface SLI {
  name: string;
  target: number;          // SLO target (ex: 99.9%)
  currentValue: number;    // Valeur actuelle
  burnRate: number;        // Vitesse de consommation error budget
  errorBudget: number;     // Budget d'erreur restant (%)
  timeWindow: string;      // Fenêtre de mesure
  trend: 'improving' | 'stable' | 'degrading';
  status: 'meeting' | 'at_risk' | 'breaching';
}

interface BurnRateAlert {
  severity: 'OK' | 'WARNING' | 'CRITICAL';
  message: string;
  budgetConsumed: number;  // % du budget mensuel consommé
  timeToExhaustion?: number; // Temps avant épuisement du budget (ms)
  recommendedActions: string[];
}

interface HealthScore {
  overall: number;        // 0-100
  breakdown: {
    availability: number;
    latency: number;
    errorRate: number;
    dependencies: number;
    performance: number;
  };
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  trend: 'improving' | 'stable' | 'degrading';
}

interface DependencyHealth {
  name: string;
  status: 'UP' | 'DEGRADED' | 'DOWN';
  latency: number;
  errorRate: number;
  lastCheck: Date;
  circuitBreakerState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  criticality: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  fallbackAvailable: boolean;
  healthScore: number;
}

interface AlertRule {
  name: string;
  condition: string;
  threshold: number;
  timeWindow: number;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  enabled: boolean;
  cooldown: number; // Temps minimum entre alertes (ms)
  lastTriggered?: number;
}

/**
 * Service de monitoring SLO avec burn rate alerting
 */
export class SLOMonitoringService {
  private static instance: SLOMonitoringService;
  
  private slis: Map<string, SLI> = new Map();
  private dependencies: Map<string, DependencyHealth> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private metricsHistory: Array<{
    timestamp: number;
    metrics: Record<string, number>;
  }> = [];
  
  private readonly historyRetentionHours = 24;
  private readonly burnRateWindows = {
    fast: 3600000,    // 1 heure (fast burn)
    slow: 21600000,   // 6 heures (slow burn)
  };

  static getInstance(): SLOMonitoringService {
    if (!this.instance) {
      this.instance = new SLOMonitoringService();
      this.instance.initializeDefaultSLIs();
      this.instance.initializeDefaultAlertRules();
    }
    return this.instance;
  }

  /**
   * Initialise les SLIs par défaut
   */
  private initializeDefaultSLIs(): void {
    // Availability SLI (99.9% target)
    this.slis.set('availability', {
      name: 'API Availability',
      target: 99.9,
      currentValue: 100,
      burnRate: 0,
      errorBudget: 100,
      timeWindow: '30d',
      trend: 'stable',
      status: 'meeting',
    });

    // Latency SLI (P95 < 500ms)
    this.slis.set('latency_p95', {
      name: 'P95 Latency',
      target: 500,
      currentValue: 0,
      burnRate: 0,
      errorBudget: 100,
      timeWindow: '1h',
      trend: 'stable',
      status: 'meeting',
    });

    // Error Rate SLI (< 0.1%)
    this.slis.set('error_rate', {
      name: 'Error Rate',
      target: 0.1,
      currentValue: 0,
      burnRate: 0,
      errorBudget: 100,
      timeWindow: '1h',
      trend: 'stable',
      status: 'meeting',
    });

    // Throughput SLI (> 100 RPS)
    this.slis.set('throughput', {
      name: 'Throughput',
      target: 100,
      currentValue: 0,
      burnRate: 0,
      errorBudget: 100,
      timeWindow: '5m',
      trend: 'stable',
      status: 'meeting',
    });
  }

  /**
   * Initialise les règles d'alerte par défaut
   */
  private initializeDefaultAlertRules(): void {
    this.alertRules.set('high_error_rate', {
      name: 'High Error Rate',
      condition: 'error_rate > 1',
      threshold: 1,
      timeWindow: 300000, // 5 minutes
      severity: 'CRITICAL',
      enabled: true,
      cooldown: 600000, // 10 minutes
    });

    this.alertRules.set('high_latency', {
      name: 'High P95 Latency',
      condition: 'latency_p95 > 1000',
      threshold: 1000,
      timeWindow: 600000, // 10 minutes
      severity: 'WARNING',
      enabled: true,
      cooldown: 300000, // 5 minutes
    });

    this.alertRules.set('low_availability', {
      name: 'Low Availability',
      condition: 'availability < 99.5',
      threshold: 99.5,
      timeWindow: 300000, // 5 minutes
      severity: 'CRITICAL',
      enabled: true,
      cooldown: 300000, // 5 minutes
    });
  }

  /**
   * Met à jour les métriques et calcule les SLIs
   */
  updateMetrics(metrics: {
    totalRequests: number;
    successfulRequests: number;
    errorRate: number;
    averageResponseTime: number;
    p95ResponseTime: number;
    throughput: number;
  }): void {
    const now = Date.now();
    
    // Stocker dans l'historique
    this.metricsHistory.push({
      timestamp: now,
      metrics: { ...metrics },
    });

    // Nettoyer l'historique ancien
    this.cleanupHistory();

    // Calculer availability
    const availability = metrics.totalRequests > 0 
      ? (metrics.successfulRequests / metrics.totalRequests) * 100 
      : 100;

    // Mettre à jour les SLIs
    this.updateSLI('availability', availability);
    this.updateSLI('latency_p95', metrics.p95ResponseTime);
    this.updateSLI('error_rate', metrics.errorRate);
    this.updateSLI('throughput', metrics.throughput);

    // Vérifier les alertes
    this.checkAlertRules(metrics);
  }

  /**
   * Met à jour un SLI spécifique
   */
  private updateSLI(name: string, currentValue: number): void {
    const sli = this.slis.get(name);
    if (!sli) return;

    const previousValue = sli.currentValue;
    sli.currentValue = currentValue;

    // Calculer la tendance
    if (currentValue > previousValue * 1.05) {
      sli.trend = name === 'latency_p95' || name === 'error_rate' ? 'degrading' : 'improving';
    } else if (currentValue < previousValue * 0.95) {
      sli.trend = name === 'latency_p95' || name === 'error_rate' ? 'improving' : 'degrading';
    } else {
      sli.trend = 'stable';
    }

    // Calculer le burn rate et error budget
    const burnRateResult = this.calculateBurnRate(sli);
    sli.burnRate = burnRateResult.burnRate;
    sli.errorBudget = burnRateResult.errorBudget;

    // Déterminer le statut
    sli.status = this.determineSLIStatus(sli);

    this.slis.set(name, sli);
  }

  /**
   * Calcule le burn rate pour un SLI
   */
  calculateBurnRate(sli: SLI): BurnRateAlert & { burnRate: number; errorBudget: number } {
    const now = Date.now();
    const oneHourAgo = now - this.burnRateWindows.fast;
    const sixHoursAgo = now - this.burnRateWindows.slow;

    // Filtrer les métriques récentes
    const recentMetrics = this.metricsHistory.filter(m => m.timestamp >= oneHourAgo);
    const longerMetrics = this.metricsHistory.filter(m => m.timestamp >= sixHoursAgo);

    if (recentMetrics.length === 0) {
      return {
        severity: 'OK',
        message: 'Insufficient data for burn rate calculation',
        budgetConsumed: 0,
        burnRate: 0,
        errorBudget: 100,
        recommendedActions: [],
      };
    }

    // Calculer l'error budget (différent selon le type de SLI)
    let errorBudget: number;
    let currentError: number;

    switch (sli.name) {
      case 'API Availability':
        errorBudget = 100 - sli.target; // 0.1% pour 99.9% SLO
        currentError = 100 - sli.currentValue;
        break;
      case 'Error Rate':
        errorBudget = sli.target; // 0.1% error budget
        currentError = sli.currentValue;
        break;
      case 'P95 Latency':
        // Pour la latence, on calcule le % au-dessus du seuil
        errorBudget = 20; // 20% des requêtes peuvent dépasser le seuil
        currentError = sli.currentValue > sli.target ? 
          ((sli.currentValue - sli.target) / sli.target) * 100 : 0;
        break;
      default:
        errorBudget = 1;
        currentError = 0;
    }

    // Calculer le burn rate (% du budget mensuel consommé par heure)
    const budgetConsumed = errorBudget > 0 ? (currentError / errorBudget) * 100 : 0;
    const burnRate = budgetConsumed; // Simplifié pour l'exemple

    // Déterminer la sévérité
    let severity: 'OK' | 'WARNING' | 'CRITICAL';
    let message: string;
    const recommendedActions: string[] = [];

    // Fast burn (1h) : consomme >5% du budget mensuel
    if (budgetConsumed > 5) {
      severity = 'CRITICAL';
      message = `CRITICAL burn rate! ${budgetConsumed.toFixed(1)}% of monthly budget consumed in 1h`;
      recommendedActions.push('Immediate investigation required');
      recommendedActions.push('Consider emergency rollback');
      recommendedActions.push('Activate incident response');
    }
    // Slow burn (6h) : consomme >2% du budget mensuel
    else if (budgetConsumed > 2) {
      severity = 'WARNING';
      message = `High burn rate: ${budgetConsumed.toFixed(1)}% of monthly budget consumed`;
      recommendedActions.push('Monitor closely');
      recommendedActions.push('Review recent changes');
      recommendedActions.push('Prepare mitigation plan');
    }
    else {
      severity = 'OK';
      message = 'Burn rate within acceptable limits';
    }

    // Calculer le temps avant épuisement du budget
    let timeToExhaustion: number | undefined;
    if (burnRate > 0) {
      const remainingBudget = 100 - budgetConsumed;
      timeToExhaustion = (remainingBudget / burnRate) * 3600000; // En millisecondes
    }

    return {
      severity,
      message,
      budgetConsumed,
      timeToExhaustion,
      recommendedActions,
      burnRate,
      errorBudget: Math.max(0, 100 - budgetConsumed),
    };
  }

  /**
   * Détermine le statut d'un SLI
   */
  private determineSLIStatus(sli: SLI): 'meeting' | 'at_risk' | 'breaching' {
    const burnRateResult = this.calculateBurnRate(sli);
    
    if (burnRateResult.severity === 'CRITICAL') {
      return 'breaching';
    } else if (burnRateResult.severity === 'WARNING') {
      return 'at_risk';
    }

    // Vérifier aussi la valeur actuelle par rapport au target
    switch (sli.name) {
      case 'API Availability':
        if (sli.currentValue < sli.target) return 'breaching';
        if (sli.currentValue < sli.target + 0.05) return 'at_risk';
        break;
      case 'Error Rate':
        if (sli.currentValue > sli.target) return 'breaching';
        if (sli.currentValue > sli.target * 0.5) return 'at_risk';
        break;
      case 'P95 Latency':
        if (sli.currentValue > sli.target) return 'breaching';
        if (sli.currentValue > sli.target * 0.8) return 'at_risk';
        break;
    }

    return 'meeting';
  }

  /**
   * Vérifie les règles d'alerte
   */
  private checkAlertRules(metrics: any): void {
    const now = Date.now();

    for (const [name, rule] of this.alertRules.entries()) {
      if (!rule.enabled) continue;

      // Vérifier le cooldown
      if (rule.lastTriggered && (now - rule.lastTriggered) < rule.cooldown) {
        continue;
      }

      // Évaluer la condition
      const shouldAlert = this.evaluateAlertCondition(rule, metrics);
      
      if (shouldAlert) {
        this.triggerAlert(rule, metrics);
        rule.lastTriggered = now;
      }
    }
  }

  /**
   * Évalue une condition d'alerte
   */
  private evaluateAlertCondition(rule: AlertRule, metrics: any): boolean {
    // Implémentation simplifiée - en production, utiliser un parser d'expressions
    switch (rule.name) {
      case 'High Error Rate':
        return metrics.errorRate > rule.threshold;
      case 'High P95 Latency':
        return metrics.p95ResponseTime > rule.threshold;
      case 'Low Availability':
        const availability = metrics.totalRequests > 0 
          ? (metrics.successfulRequests / metrics.totalRequests) * 100 
          : 100;
        return availability < rule.threshold;
      default:
        return false;
    }
  }

  /**
   * Déclenche une alerte
   */
  private async triggerAlert(rule: AlertRule, metrics: any): Promise<void> {
    const alert = {
      rule: rule.name,
      severity: rule.severity,
      message: `Alert: ${rule.name} - Threshold ${rule.threshold} exceeded`,
      timestamp: new Date(),
      metrics,
      runbookUrl: this.getRunbookUrl(rule.name),
      dashboardUrl: this.getDashboardUrl(),
    };

    console.warn(`[SLOMonitoring] ALERT [${rule.severity}]: ${alert.message}`, alert);

    // Envoyer l'alerte aux canaux configurés
    await this.sendAlert(alert);
  }

  /**
   * Envoie une alerte aux canaux configurés
   */
  private async sendAlert(alert: any): Promise<void> {
    try {
      // Slack
      if (process.env.SLACK_WEBHOOK_URL) {
        await this.sendSlackAlert(alert);
      }

      // PagerDuty pour les alertes critiques
      if (alert.severity === 'CRITICAL' && process.env.PAGERDUTY_INTEGRATION_KEY) {
        await this.sendPagerDutyAlert(alert);
      }

      // Email pour les alertes importantes
      if (alert.severity !== 'INFO' && process.env.ALERT_EMAIL) {
        await this.sendEmailAlert(alert);
      }

    } catch (error) {
      console.error('[SLOMonitoring] Failed to send alert:', error);
    }
  }

  /**
   * Envoie une alerte Slack
   */
  private async sendSlackAlert(alert: any): Promise<void> {
    const color = alert.severity === 'CRITICAL' ? 'danger' : 
                  alert.severity === 'WARNING' ? 'warning' : 'good';

    const payload = {
      text: `🚨 ${alert.severity} Alert`,
      attachments: [
        {
          color,
          title: alert.rule,
          text: alert.message,
          fields: [
            {
              title: 'Severity',
              value: alert.severity,
              short: true,
            },
            {
              title: 'Time',
              value: alert.timestamp.toISOString(),
              short: true,
            },
          ],
          actions: [
            {
              type: 'button',
              text: 'View Dashboard',
              url: alert.dashboardUrl,
            },
            {
              type: 'button',
              text: 'Runbook',
              url: alert.runbookUrl,
            },
          ],
        },
      ],
    };

    await fetch(process.env.SLACK_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  /**
   * Envoie une alerte PagerDuty
   */
  private async sendPagerDutyAlert(alert: any): Promise<void> {
    const payload = {
      routing_key: process.env.PAGERDUTY_INTEGRATION_KEY,
      event_action: 'trigger',
      dedup_key: `huntaze_${alert.rule}_${Date.now()}`,
      payload: {
        summary: `${alert.rule}: ${alert.message}`,
        severity: alert.severity.toLowerCase(),
        source: 'huntaze-api',
        component: 'api-monitoring',
        group: 'slo-alerts',
        class: 'performance',
        custom_details: alert.metrics,
      },
      links: [
        {
          href: alert.dashboardUrl,
          text: 'View Dashboard',
        },
        {
          href: alert.runbookUrl,
          text: 'Runbook',
        },
      ],
    };

    await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  /**
   * Envoie une alerte email (placeholder)
   */
  private async sendEmailAlert(alert: any): Promise<void> {
    // Implémentation email à ajouter selon le provider (SendGrid, SES, etc.)
    console.log('[SLOMonitoring] Email alert would be sent:', alert);
  }

  /**
   * Calcule un score de santé composite
   */
  calculateHealthScore(): HealthScore {
    const weights = {
      availability: 0.4,
      latency: 0.25,
      errorRate: 0.2,
      dependencies: 0.1,
      performance: 0.05,
    };

    // Calculer les scores individuels
    const availabilitySLI = this.slis.get('availability');
    const latencySLI = this.slis.get('latency_p95');
    const errorRateSLI = this.slis.get('error_rate');

    const scores = {
      availability: this.normalizeScore(availabilitySLI?.currentValue || 0, 99.9, 100),
      latency: this.normalizeScore(latencySLI?.currentValue || 0, 0, 500, true),
      errorRate: this.normalizeScore(errorRateSLI?.currentValue || 0, 0, 0.1, true),
      dependencies: this.calculateDependencyScore(),
      performance: this.calculatePerformanceScore(),
    };

    // Score global pondéré
    const overall = Object.entries(scores).reduce(
      (sum, [key, score]) => sum + score * weights[key as keyof typeof weights],
      0
    );

    // Déterminer le statut
    let status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
    if (overall >= 90) {
      status = 'HEALTHY';
    } else if (overall >= 70) {
      status = 'DEGRADED';
    } else {
      status = 'UNHEALTHY';
    }

    // Calculer la tendance (simplifié)
    const trend = 'stable'; // À implémenter avec l'historique

    return {
      overall: Math.round(overall),
      breakdown: scores,
      status,
      trend,
    };
  }

  /**
   * Normalise un score (0-100)
   */
  private normalizeScore(
    value: number,
    min: number,
    max: number,
    inverted: boolean = false
  ): number {
    let normalized = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
    
    if (inverted) {
      normalized = 100 - normalized;
    }
    
    return Math.round(normalized);
  }

  /**
   * Calcule le score des dépendances
   */
  private calculateDependencyScore(): number {
    if (this.dependencies.size === 0) return 100;

    const criticalityWeights = {
      CRITICAL: 1.0,
      HIGH: 0.6,
      MEDIUM: 0.3,
      LOW: 0.1,
    };

    let totalImpact = 0;
    let maxPossibleImpact = 0;

    for (const dep of this.dependencies.values()) {
      const weight = criticalityWeights[dep.criticality];
      maxPossibleImpact += weight;

      if (dep.status === 'DOWN' && !dep.fallbackAvailable) {
        totalImpact += weight;
      } else if (dep.status === 'DEGRADED') {
        totalImpact += weight * 0.5;
      }
    }

    return maxPossibleImpact > 0 ? Math.round((1 - totalImpact / maxPossibleImpact) * 100) : 100;
  }

  /**
   * Calcule le score de performance
   */
  private calculatePerformanceScore(): number {
    const throughputSLI = this.slis.get('throughput');
    if (!throughputSLI) return 100;

    // Score basé sur le throughput par rapport au target
    return this.normalizeScore(throughputSLI.currentValue, 0, throughputSLI.target * 2);
  }

  /**
   * Nettoie l'historique ancien
   */
  private cleanupHistory(): void {
    const cutoff = Date.now() - (this.historyRetentionHours * 3600000);
    this.metricsHistory = this.metricsHistory.filter(m => m.timestamp >= cutoff);
  }

  /**
   * URLs des runbooks et dashboards
   */
  private getRunbookUrl(ruleName: string): string {
    const baseUrl = process.env.RUNBOOK_BASE_URL || 'https://docs.huntaze.com/runbooks';
    const slug = ruleName.toLowerCase().replace(/\s+/g, '-');
    return `${baseUrl}/${slug}`;
  }

  private getDashboardUrl(): string {
    return process.env.DASHBOARD_URL || 'https://monitoring.huntaze.com/dashboard';
  }

  /**
   * API publique pour obtenir les SLIs
   */
  getSLIs(): SLI[] {
    return Array.from(this.slis.values());
  }

  /**
   * API publique pour obtenir le health score
   */
  getHealthScore(): HealthScore {
    return this.calculateHealthScore();
  }

  /**
   * API publique pour obtenir les burn rates
   */
  getBurnRates(): Record<string, BurnRateAlert> {
    const burnRates: Record<string, BurnRateAlert> = {};
    
    for (const [name, sli] of this.slis.entries()) {
      burnRates[name] = this.calculateBurnRate(sli);
    }
    
    return burnRates;
  }

  /**
   * Ajoute ou met à jour une dépendance
   */
  updateDependency(name: string, health: Partial<DependencyHealth>): void {
    const existing = this.dependencies.get(name) || {
      name,
      status: 'UP',
      latency: 0,
      errorRate: 0,
      lastCheck: new Date(),
      circuitBreakerState: 'CLOSED',
      criticality: 'MEDIUM',
      fallbackAvailable: false,
      healthScore: 100,
    };

    const updated = { ...existing, ...health, lastCheck: new Date() };
    this.dependencies.set(name, updated);
  }

  /**
   * Obtient les dépendances
   */
  getDependencies(): DependencyHealth[] {
    return Array.from(this.dependencies.values());
  }
}

// Export de l'instance globale
export const sloMonitoring = SLOMonitoringService.getInstance();