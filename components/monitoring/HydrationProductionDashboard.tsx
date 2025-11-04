/**
 * Dashboard de monitoring de production pour l'hydratation
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  TrendingUp,
  RefreshCw,
  Bell,
  X
} from 'lucide-react';

interface ProductionMetrics {
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

interface HydrationAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  resolved: boolean;
}

interface HealthReport {
  status: 'healthy' | 'warning' | 'critical';
  metrics: ProductionMetrics;
  activeAlerts: HydrationAlert[];
  recommendations: string[];
}

export function HydrationProductionDashboard() {
  const [healthReport, setHealthReport] = useState<HealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Charger les données
  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/monitoring/hydration-production?action=status');
      const result = await response.json();
      
      if (result.success) {
        setHealthReport(result.data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  // Résoudre une alerte
  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/monitoring/hydration-production?action=resolve-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId })
      });
      
      if (response.ok) {
        await loadData(); // Recharger les données
      }
    } catch (error) {
      console.error('Erreur lors de la résolution de l\'alerte:', error);
    }
  };

  // Auto-refresh
  useEffect(() => {
    loadData();
    
    if (autoRefresh) {
      const interval = setInterval(loadData, 30000); // Toutes les 30 secondes
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  if (loading && !healthReport) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement du monitoring...</span>
      </div>
    );
  }

  if (!healthReport) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Impossible de charger les données de monitoring
        </AlertDescription>
      </Alert>
    );
  }

  const { status, metrics, activeAlerts, recommendations } = healthReport;

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
      case 'healthy': return <CheckCircle className="h-5 w-5" />;
      case 'warning': return <AlertTriangle className="h-5 w-5" />;
      case 'critical': return <AlertTriangle className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Monitoring d'Hydratation - Production</h1>
          <p className="text-gray-600">
            Surveillance en temps réel des performances d'hydratation
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Status général */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            {getStatusIcon(status)}
            <span className="ml-2">Statut Général</span>
            <Badge className={`ml-auto ${getStatusColor(status)}`}>
              {status.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600">
            Dernière mise à jour: {lastUpdate?.toLocaleString() || 'Jamais'}
          </div>
        </CardContent>
      </Card>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Taux d'Erreur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(metrics.errorRate * 100).toFixed(2)}%
            </div>
            <div className={`text-sm ${metrics.errorRate > 0.05 ? 'text-red-600' : 'text-green-600'}`}>
              {metrics.errorRate > 0.05 ? 'Élevé' : 'Normal'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Temps Moyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.averageHydrationTime}ms
            </div>
            <div className={`text-sm ${metrics.averageHydrationTime > 2000 ? 'text-orange-600' : 'text-green-600'}`}>
              {metrics.averageHydrationTime > 2000 ? 'Lent' : 'Rapide'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Taux de Récupération
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(metrics.recoverySuccessRate * 100).toFixed(1)}%
            </div>
            <div className={`text-sm ${metrics.recoverySuccessRate < 0.8 ? 'text-red-600' : 'text-green-600'}`}>
              {metrics.recoverySuccessRate < 0.8 ? 'Faible' : 'Bon'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Utilisateurs Affectés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.affectedUsers}
            </div>
            <div className="text-sm text-gray-600">
              Dernière heure
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes actives */}
      {activeAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Alertes Actives ({activeAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <span className="font-medium">{alert.type}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resolveAlert(alert.id)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Résoudre
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Erreurs les plus fréquentes */}
      {metrics.topErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Erreurs les Plus Fréquentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.topErrors.slice(0, 5).map((error, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{error.error}</p>
                    <p className="text-xs text-gray-500">
                      Dernière occurrence: {new Date(error.lastSeen).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {error.count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommandations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommandations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                  <span className="text-sm">{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}