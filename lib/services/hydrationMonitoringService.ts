/**
 * Service de monitoring des erreurs d'hydratation
 * 
 * Ce service fournit :
 * 1. Tracking en temps réel des erreurs d'hydratation
 * 2. Métriques de performance d'hydratation
 * 3. Alertes automatiques
 * 4. Rapports de santé
 */

interface HydrationMetrics {
  totalHydrations: number;
  successfulHydrations: number;
  failedHydrations: number;
  averageHydrationTime: number;
  errorRate: number;
  recoverySuccessRate: number;
}

interface HydrationError {
  id: string;
  timestamp: number;
  componentId: string;
  errorType: string;
  errorMessage: string;
  stackTrace?: string;
  userAgent: string;
  url: string;
  retryCount: number;
  recovered: boolean;
  recoveryTime?: number;
}

interface HydrationAlert {
  id: string;
  type: 'error_spike' | 'recovery_failure' | 'performance_degradation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  metrics: Partial<HydrationMetrics>;
  threshold: number;
  currentValue: number;
}

class HydrationMonitoringService {
  private metrics: HydrationMetrics = {
    totalHydrations: 0,
    successfulHydrations: 0,
    failedHydrations: 0,
    averageHydrationTime: 0,
    errorRate: 0,
    recoverySuccessRate: 0
  };

  private errors: HydrationError[] = [];
  private alerts: HydrationAlert[] = [];
  private hydrationTimes: number[] = [];
  private isMonitoring = false;

  // Configuration des seuils d'alerte
  private alertThresholds = {
    errorRateHigh: 0.05, // 5%
    errorRateCritical: 0.15, // 15%
    recoveryFailureRate: 0.3, // 30%
    performanceDegradation: 2000 // 2 secondes
  };

  // Callbacks pour les alertes
  private alertCallbacks: Array<(alert: HydrationAlert) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeMonitoring();
    }
  }

  /**
   * Initialise le monitoring côté client
   */
  private initializeMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    // Écouter les erreurs d'hydratation globales
    window.addEventListener('error', this.handleGlobalError.bind(this));
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));

    // Monitoring périodique
    setInterval(() => {
      this.updateMetrics();
      this.checkAlertConditions();
    }, 30000); // Toutes les 30 secondes

    console.log('Hydration monitoring initialized');
  }

  /**
   * Enregistre le début d'une hydratation
   */
  public startHydration(componentId: string): string {
    const hydrationId = `hydration-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.metrics.totalHydrations++;
    
    // Stocker le timestamp de début
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`hydration-start-${hydrationId}`, Date.now().toString());
    }
    
    return hydrationId;
  }

  /**
   * Enregistre le succès d'une hydratation
   */
  public recordHydrationSuccess(hydrationId: string, componentId: string): void {
    this.metrics.successfulHydrations++;
    
    // Calculer le temps d'hydratation
    if (typeof window !== 'undefined') {
      const startTime = sessionStorage.getItem(`hydration-start-${hydrationId}`);
      if (startTime) {
        const hydrationTime = Date.now() - parseInt(startTime);
        this.hydrationTimes.push(hydrationTime);
        sessionStorage.removeItem(`hydration-start-${hydrationId}`);
        
        // Garder seulement les 100 dernières mesures
        if (this.hydrationTimes.length > 100) {
          this.hydrationTimes = this.hydrationTimes.slice(-100);
        }
      }
    }
    
    this.updateMetrics();
  }

  /**
   * Enregistre une erreur d'hydratation
   */
  public recordHydrationError(
    componentId: string,
    error: Error,
    retryCount: number = 0
  ): string {
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const hydrationError: HydrationError = {
      id: errorId,
      timestamp: Date.now(),
      componentId,
      errorType: error.name,
      errorMessage: error.message,
      stackTrace: error.stack,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      retryCount,
      recovered: false
    };

    this.errors.push(hydrationError);
    this.metrics.failedHydrations++;
    
    // Garder seulement les 1000 dernières erreurs
    if (this.errors.length > 1000) {
      this.errors = this.errors.slice(-1000);
    }
    
    this.updateMetrics();
    this.checkAlertConditions();
    
    // Envoyer l'erreur au service de logging si disponible
    this.sendErrorToLoggingService(hydrationError);
    
    return errorId;
  }

  /**
   * Enregistre le succès d'une récupération
   */
  public recordRecoverySuccess(errorId: string, recoveryTime: number): void {
    const error = this.errors.find(e => e.id === errorId);
    if (error) {
      error.recovered = true;
      error.recoveryTime = recoveryTime;
    }
    
    this.updateMetrics();
  }

  /**
   * Met à jour les métriques calculées
   */
  private updateMetrics(): void {
    const total = this.metrics.totalHydrations;
    
    if (total > 0) {
      this.metrics.errorRate = this.metrics.failedHydrations / total;
      
      const recoveredErrors = this.errors.filter(e => e.recovered).length;
      const totalErrors = this.errors.length;
      this.metrics.recoverySuccessRate = totalErrors > 0 ? recoveredErrors / totalErrors : 1;
    }
    
    if (this.hydrationTimes.length > 0) {
      this.metrics.averageHydrationTime = 
        this.hydrationTimes.reduce((sum, time) => sum + time, 0) / this.hydrationTimes.length;
    }
  }

  /**
   * Vérifie les conditions d'alerte
   */
  private checkAlertConditions(): void {
    const now = Date.now();
    
    // Alerte pour taux d'erreur élevé
    if (this.metrics.errorRate > this.alertThresholds.errorRateCritical) {
      this.createAlert({
        type: 'error_spike',
        severity: 'critical',
        message: `Taux d'erreur d'hydratation critique: ${(this.metrics.errorRate * 100).toFixed(2)}%`,
        threshold: this.alertThresholds.errorRateCritical,
        currentValue: this.metrics.errorRate
      });
    } else if (this.metrics.errorRate > this.alertThresholds.errorRateHigh) {
      this.createAlert({
        type: 'error_spike',
        severity: 'high',
        message: `Taux d'erreur d'hydratation élevé: ${(this.metrics.errorRate * 100).toFixed(2)}%`,
        threshold: this.alertThresholds.errorRateHigh,
        currentValue: this.metrics.errorRate
      });
    }
    
    // Alerte pour échec de récupération
    if (this.metrics.recoverySuccessRate < (1 - this.alertThresholds.recoveryFailureRate)) {
      this.createAlert({
        type: 'recovery_failure',
        severity: 'high',
        message: `Taux d'échec de récupération élevé: ${((1 - this.metrics.recoverySuccessRate) * 100).toFixed(2)}%`,
        threshold: this.alertThresholds.recoveryFailureRate,
        currentValue: 1 - this.metrics.recoverySuccessRate
      });
    }
    
    // Alerte pour dégradation des performances
    if (this.metrics.averageHydrationTime > this.alertThresholds.performanceDegradation) {
      this.createAlert({
        type: 'performance_degradation',
        severity: 'medium',
        message: `Temps d'hydratation dégradé: ${this.metrics.averageHydrationTime.toFixed(0)}ms`,
        threshold: this.alertThresholds.performanceDegradation,
        currentValue: this.metrics.averageHydrationTime
      });
    }
  }

  /**
   * Crée une nouvelle alerte
   */
  private createAlert(alertData: Omit<HydrationAlert, 'id' | 'timestamp' | 'metrics'>): void {
    const alert: HydrationAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      metrics: { ...this.metrics },
      ...alertData
    };

    this.alerts.push(alert);
    
    // Garder seulement les 100 dernières alertes
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
    
    // Notifier les callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in alert callback:', error);
      }
    });
    
    console.warn('Hydration Alert:', alert);
  }

  /**
   * Gestion des erreurs globales
   */
  private handleGlobalError(event: ErrorEvent): void {
    if (event.message && event.message.includes('hydration')) {
      this.recordHydrationError('global', new Error(event.message));
    }
  }

  /**
   * Gestion des rejections non gérées
   */
  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    if (event.reason && event.reason.message && event.reason.message.includes('hydration')) {
      this.recordHydrationError('global', event.reason);
    }
  }

  /**
   * Envoie l'erreur au service de logging
   */
  private async sendErrorToLoggingService(error: HydrationError): Promise<void> {
    try {
      if (typeof fetch !== 'undefined') {
        await fetch('/api/monitoring/hydration-errors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(error),
        });
      }
    } catch (fetchError) {
      console.warn('Failed to send hydration error to logging service:', fetchError);
    }
  }

  /**
   * Ajoute un callback d'alerte
   */
  public onAlert(callback: (alert: HydrationAlert) => void): () => void {
    this.alertCallbacks.push(callback);
    
    // Retourne une fonction de cleanup
    return () => {
      const index = this.alertCallbacks.indexOf(callback);
      if (index > -1) {
        this.alertCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Obtient les métriques actuelles
   */
  public getMetrics(): HydrationMetrics {
    return { ...this.metrics };
  }

  /**
   * Obtient les erreurs récentes
   */
  public getRecentErrors(limit: number = 50): HydrationError[] {
    return this.errors.slice(-limit);
  }

  /**
   * Obtient les alertes récentes
   */
  public getRecentAlerts(limit: number = 20): HydrationAlert[] {
    return this.alerts.slice(-limit);
  }

  /**
   * Génère un rapport de santé
   */
  public generateHealthReport(): {
    status: 'healthy' | 'warning' | 'critical';
    metrics: HydrationMetrics;
    recentErrors: HydrationError[];
    recentAlerts: HydrationAlert[];
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    if (this.metrics.errorRate > this.alertThresholds.errorRateCritical) {
      status = 'critical';
      recommendations.push('Taux d\'erreur critique - Investigation immédiate requise');
    } else if (this.metrics.errorRate > this.alertThresholds.errorRateHigh) {
      status = 'warning';
      recommendations.push('Taux d\'erreur élevé - Surveillance renforcée recommandée');
    }

    if (this.metrics.recoverySuccessRate < 0.8) {
      status = status === 'critical' ? 'critical' : 'warning';
      recommendations.push('Taux de récupération faible - Améliorer les mécanismes de fallback');
    }

    if (this.metrics.averageHydrationTime > this.alertThresholds.performanceDegradation) {
      status = status === 'critical' ? 'critical' : 'warning';
      recommendations.push('Performance d\'hydratation dégradée - Optimisation requise');
    }

    if (recommendations.length === 0) {
      recommendations.push('Système d\'hydratation fonctionnel - Aucune action requise');
    }

    return {
      status,
      metrics: this.getMetrics(),
      recentErrors: this.getRecentErrors(10),
      recentAlerts: this.getRecentAlerts(5),
      recommendations
    };
  }

  /**
   * Reset des métriques (pour les tests)
   */
  public resetMetrics(): void {
    this.metrics = {
      totalHydrations: 0,
      successfulHydrations: 0,
      failedHydrations: 0,
      averageHydrationTime: 0,
      errorRate: 0,
      recoverySuccessRate: 0
    };
    this.errors = [];
    this.alerts = [];
    this.hydrationTimes = [];
  }
}

// Export singleton instance
export const hydrationMonitoringService = new HydrationMonitoringService();

// Types exports
export type { HydrationMetrics, HydrationError, HydrationAlert };