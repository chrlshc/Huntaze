'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { hydrationMonitoringService, HydrationAlert } from '@/lib/services/hydrationMonitoringService';
import { HydrationSafeWrapper } from './HydrationSafeWrapper';
import { Button } from "@/components/ui/button";

interface NotificationConfig {
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  autoHide: boolean;
  hideDelay: number;
  showOnlyErrors: boolean;
  maxNotifications: number;
}

interface HydrationNotification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: number;
  autoHide: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
    style?: 'primary' | 'secondary' | 'danger';
  }>;
}

interface HydrationNotificationSystemProps {
  config?: Partial<NotificationConfig>;
  className?: string;
}

/**
 * HydrationNotificationSystem - Système de notifications pour les problèmes d'hydratation
 * 
 * Ce composant fournit :
 * 1. Notifications en temps réel des erreurs d'hydratation
 * 2. Actions de récupération pour l'utilisateur
 * 3. Informations sur l'état du système
 * 4. Interface utilisateur non-intrusive
 */
export function HydrationNotificationSystem({
  config = {},
  className = ''
}: HydrationNotificationSystemProps) {
  const defaultConfig: NotificationConfig = {
    position: 'top-right',
    autoHide: true,
    hideDelay: 5000,
    showOnlyErrors: false,
    maxNotifications: 5
  };

  const effectiveConfig = { ...defaultConfig, ...config };
  const [notifications, setNotifications] = useState<HydrationNotification[]>([]);

  // Ajouter une notification
  const addNotification = useCallback((notification: Omit<HydrationNotification, 'id' | 'timestamp'>) => {
    const newNotification: HydrationNotification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      // Limiter le nombre de notifications
      return updated.slice(0, effectiveConfig.maxNotifications);
    });

    // Auto-hide si configuré
    if (notification.autoHide && effectiveConfig.autoHide) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, effectiveConfig.hideDelay);
    }
  }, [effectiveConfig.maxNotifications, effectiveConfig.autoHide, effectiveConfig.hideDelay]);

  // Supprimer une notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Supprimer toutes les notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Gérer les alertes d'hydratation
  const handleHydrationAlert = useCallback((alert: HydrationAlert) => {
    if (effectiveConfig.showOnlyErrors && alert.severity === 'low') {
      return;
    }

    const notificationType = getNotificationTypeFromSeverity(alert.severity);
    const actions = getActionsForAlert(alert);

    addNotification({
      type: notificationType,
      title: getAlertTitle(alert.type),
      message: alert.message,
      autoHide: alert.severity !== 'critical',
      actions
    });
  }, [effectiveConfig.showOnlyErrors, addNotification]);

  // Écouter les alertes d'hydratation
  useEffect(() => {
    const unsubscribe = hydrationMonitoringService.onAlert(handleHydrationAlert);
    return unsubscribe;
  }, [handleHydrationAlert]);

  // Obtenir la classe CSS pour la position
  const getPositionClass = () => {
    const baseClass = 'fixed z-50';
    switch (effectiveConfig.position) {
      case 'top-right':
        return `${baseClass} top-4 right-4`;
      case 'top-left':
        return `${baseClass} top-4 left-4`;
      case 'bottom-right':
        return `${baseClass} bottom-4 right-4`;
      case 'bottom-left':
        return `${baseClass} bottom-4 left-4`;
      case 'top-center':
        return `${baseClass} top-4 left-1/2 transform -translate-x-1/2`;
      case 'bottom-center':
        return `${baseClass} bottom-4 left-1/2 transform -translate-x-1/2`;
      default:
        return `${baseClass} top-4 right-4`;
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <HydrationSafeWrapper>
      <div className={`${getPositionClass()} ${className}`}>
        <div className="space-y-2 w-80">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onClose={() => removeNotification(notification.id)}
            />
          ))}
          
          {notifications.length > 1 && (
            <div className="flex justify-end">
              <Button variant="primary" onClick={clearAllNotifications}>
  Tout effacer
</Button>
            </div>
          )}
        </div>
      </div>
    </HydrationSafeWrapper>
  );
}

// Composant pour une notification individuelle
function NotificationCard({
  notification,
  onClose
}: {
  notification: HydrationNotification;
  onClose: () => void;
}) {
  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '🚨';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  return (
    <div className={`p-4 rounded-lg border shadow-lg ${getTypeStyles(notification.type)} animate-slide-in`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <span className="text-lg">{getTypeIcon(notification.type)}</span>
          <div className="flex-1">
            <h4 className="font-semibold text-sm">{notification.title}</h4>
            <p className="text-sm mt-1 opacity-90">{notification.message}</p>
            
            {notification.actions && notification.actions.length > 0 && (
              <div className="flex gap-2 mt-3">
                {notification.actions.map((action, index) => (
                  <Button 
                    key={index}
                    variant="primary" 
                    onClick={() => {
                      action.action();
                      onClose();
                    }}
                    className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                      action.style === 'primary' 
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : action.style === 'danger'
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                    }`}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <Button variant="primary" onClick={onClose}>
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
</Button>
      </div>
    </div>
  );
}

// Utilitaires pour convertir les alertes en notifications
function getNotificationTypeFromSeverity(severity: string): 'success' | 'warning' | 'error' | 'info' {
  switch (severity) {
    case 'critical':
      return 'error';
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    case 'low':
      return 'info';
    default:
      return 'info';
  }
}

function getAlertTitle(alertType: string): string {
  switch (alertType) {
    case 'error_spike':
      return 'Pic d\'erreurs détecté';
    case 'recovery_failure':
      return 'Échec de récupération';
    case 'performance_degradation':
      return 'Performance dégradée';
    default:
      return 'Alerte système';
  }
}

function getActionsForAlert(alert: HydrationAlert): Array<{
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}> {
  const actions = [];

  // Action de rechargement pour les erreurs critiques
  if (alert.severity === 'critical') {
    actions.push({
      label: 'Recharger la page',
      action: () => {
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      },
      style: 'primary' as const
    });
  }

  // Action de diagnostic
  actions.push({
    label: 'Voir les détails',
    action: () => {
      console.log('Hydration Alert Details:', alert);
      // Ici on pourrait ouvrir un modal avec plus de détails
    },
    style: 'secondary' as const
  });

  return actions;
}

// Hook pour utiliser le système de notifications
export function useHydrationNotifications() {
  const [notificationCount, setNotificationCount] = useState(0);

  const showNotification = useCallback((notification: Omit<HydrationNotification, 'id' | 'timestamp'>) => {
    // Cette fonction pourrait être utilisée pour déclencher des notifications programmatiquement
    setNotificationCount(prev => prev + 1);
  }, []);

  return {
    notificationCount,
    showNotification
  };
}

// Styles CSS pour les animations
const styles = `
  @keyframes slide-in {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .animate-slide-in {
    animation: slide-in 0.3s ease-out;
  }
`;

// Injecter les styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}