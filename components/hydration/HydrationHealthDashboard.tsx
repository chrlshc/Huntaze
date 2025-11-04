'use client';

import React, { useState, useEffect } from 'react';
import { hydrationMonitoringService, HydrationMetrics, HydrationError, HydrationAlert } from '@/lib/services/hydrationMonitoringService';
import { HydrationSafeWrapper } from './HydrationSafeWrapper';

interface HydrationHealthDashboardProps {
  className?: string;
  refreshInterval?: number;
  showDetailedErrors?: boolean;
}

/**
 * HydrationHealthDashboard - Dashboard de monitoring de la santé d'hydratation
 * 
 * Ce composant affiche :
 * 1. Métriques en temps réel
 * 2. Statut de santé global
 * 3. Erreurs récentes
 * 4. Alertes actives
 * 5. Recommandations
 */
export function HydrationHealthDashboard({
  className = '',
  refreshInterval = 5000,
  showDetailedErrors = false
}: HydrationHealthDashboardProps) {
  const [metrics, setMetrics] = useState<HydrationMetrics | null>(null);
  const [recentErrors, setRecentErrors] = useState<HydrationError[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<HydrationAlert[]>([]);
  const [healthReport, setHealthReport] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Mise à jour des données
  const updateData = () => {
    const currentMetrics = hydrationMonitoringService.getMetrics();
    const errors = hydrationMonitoringService.getRecentErrors(10);
    const alerts = hydrationMonitoringService.getRecentAlerts(5);
    const report = hydrationMonitoringService.generateHealthReport();

    setMetrics(currentMetrics);
    setRecentErrors(errors);
    setRecentAlerts(alerts);
    setHealthReport(report);
  };

  useEffect(() => {
    // Mise à jour initiale
    updateData();

    // Mise à jour périodique
    const interval = setInterval(updateData, refreshInterval);

    // Écouter les nouvelles alertes
    const unsubscribe = hydrationMonitoringService.onAlert((alert) => {
      updateData();
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [refreshInterval]);

  if (!metrics || !healthReport) {
    return (
      <div className={`hydration-dashboard loading ${className}`}>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-gray-300 h-10 w-10"></div>
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '🚨';
      default: return '❓';
    }
  };

  return (
    <HydrationSafeWrapper>
      <div className={`hydration-dashboard ${className}`}>
        {/* En-tête avec statut global */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Santé d'Hydratation
            </h2>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(healthReport.status)}`}>
              {getStatusIcon(healthReport.status)} {healthReport.status.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Hydratations Totales"
            value={metrics.totalHydrations}
            icon="🔄"
          />
          <MetricCard
            title="Taux de Succès"
            value={`${((1 - metrics.errorRate) * 100).toFixed(1)}%`}
            icon="✅"
            color={metrics.errorRate < 0.05 ? 'green' : metrics.errorRate < 0.15 ? 'yellow' : 'red'}
          />
          <MetricCard
            title="Temps Moyen"
            value={`${metrics.averageHydrationTime.toFixed(0)}ms`}
            icon="⏱️"
            color={metrics.averageHydrationTime < 1000 ? 'green' : metrics.averageHydrationTime < 2000 ? 'yellow' : 'red'}
          />
          <MetricCard
            title="Récupération"
            value={`${(metrics.recoverySuccessRate * 100).toFixed(1)}%`}
            icon="🔧"
            color={metrics.recoverySuccessRate > 0.8 ? 'green' : metrics.recoverySuccessRate > 0.6 ? 'yellow' : 'red'}
          />
        </div>

        {/* Alertes récentes */}
        {recentAlerts.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Alertes Récentes</h3>
            <div className="space-y-2">
              {recentAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          </div>
        )}

        {/* Recommandations */}
        {healthReport.recommendations.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Recommandations</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <ul className="space-y-2">
                {healthReport.recommendations.map((recommendation: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-blue-800">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span className="text-sm">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Section détaillée (collapsible) */}
        <div className="border-t pt-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
              ▶
            </span>
            <span className="font-medium">Détails Techniques</span>
          </button>

          {isExpanded && (
            <div className="mt-4 space-y-4">
              {/* Erreurs récentes */}
              {recentErrors.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Erreurs Récentes</h4>
                  <div className="bg-gray-50 rounded-lg p-3 max-h-60 overflow-y-auto">
                    {recentErrors.map((error) => (
                      <ErrorCard 
                        key={error.id} 
                        error={error} 
                        showDetails={showDetailedErrors}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Métriques détaillées */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Métriques Détaillées</h4>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Hydratations réussies:</span>
                      <span className="ml-2 font-medium">{metrics.successfulHydrations}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Hydratations échouées:</span>
                      <span className="ml-2 font-medium">{metrics.failedHydrations}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Taux d'erreur:</span>
                      <span className="ml-2 font-medium">{(metrics.errorRate * 100).toFixed(2)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Taux de récupération:</span>
                      <span className="ml-2 font-medium">{(metrics.recoverySuccessRate * 100).toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </HydrationSafeWrapper>
  );
}

// Composant pour une métrique individuelle
function MetricCard({ 
  title, 
  value, 
  icon, 
  color = 'gray' 
}: { 
  title: string; 
  value: string | number; 
  icon: string; 
  color?: 'green' | 'yellow' | 'red' | 'gray';
}) {
  const colorClasses = {
    green: 'bg-green-50 border-green-200 text-green-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    gray: 'bg-gray-50 border-gray-200 text-gray-800'
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

// Composant pour une alerte
function AlertCard({ alert }: { alert: HydrationAlert }) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 border-red-300 text-red-800';
      case 'high': return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'medium': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'low': return 'bg-blue-100 border-blue-300 text-blue-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  return (
    <div className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="font-medium text-sm">{alert.message}</div>
          <div className="text-xs opacity-75 mt-1">
            {new Date(alert.timestamp).toLocaleString()}
          </div>
        </div>
        <span className="text-xs font-medium px-2 py-1 rounded bg-white bg-opacity-50">
          {alert.severity.toUpperCase()}
        </span>
      </div>
    </div>
  );
}

// Composant pour une erreur
function ErrorCard({ 
  error, 
  showDetails 
}: { 
  error: HydrationError; 
  showDetails: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-b border-gray-200 last:border-b-0 py-2">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900">
            {error.componentId} - {error.errorType}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {new Date(error.timestamp).toLocaleString()}
          </div>
          {error.recovered && (
            <span className="inline-block text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded mt-1">
              Récupéré en {error.recoveryTime}ms
            </span>
          )}
        </div>
        {showDetails && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? 'Masquer' : 'Détails'}
          </button>
        )}
      </div>
      
      {isExpanded && showDetails && (
        <div className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded">
          <div><strong>Message:</strong> {error.errorMessage}</div>
          <div><strong>Tentatives:</strong> {error.retryCount}</div>
          <div><strong>URL:</strong> {error.url}</div>
          {error.stackTrace && (
            <div className="mt-1">
              <strong>Stack:</strong>
              <pre className="text-xs mt-1 whitespace-pre-wrap">{error.stackTrace}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}