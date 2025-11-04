/**
 * Tests d'intégration pour le monitoring de production d'hydratation
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { HydrationProductionMonitor } from '@/lib/monitoring/hydrationProductionMonitor';

// Mock des services externes
jest.mock('@/lib/services/hydrationMonitoringService', () => ({
  hydrationMonitoringService: {
    getMetrics: jest.fn(() => Promise.resolve({
      totalHydrations: 1000,
      successfulHydrations: 950,
      failedHydrations: 50,
      averageHydrationTime: 150,
      errorRate: 0.05,
      recoverySuccessRate: 0.9
    })),
    getRecentErrors: jest.fn(() => Promise.resolve([
      {
        id: 'error-1',
        timestamp: Date.now() - 60000,
        componentId: 'test-component',
        errorType: 'HydrationError',
        errorMessage: 'Text content does not match',
        retryCount: 2,
        recovered: true,
        recoveryTime: 150
      }
    ])),
    onAlert: jest.fn(() => () => {}),
    recordHydrationError: jest.fn(),
    recordHydrationSuccess: jest.fn(),
    startHydration: jest.fn(() => 'test-id'),
    recordRecoverySuccess: jest.fn()
  }
}));

// Mock fetch pour les notifications
global.fetch = jest.fn();

describe('HydrationProductionMonitor Integration Tests', () => {
  let monitor: HydrationProductionMonitor;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    monitor = new HydrationProductionMonitor();
    originalEnv = process.env;
    
    // Configuration de test
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
    process.env.HYDRATION_MONITORING_ENDPOINT = 'https://monitoring.test.com/api';
    process.env.HYDRATION_MONITORING_API_KEY = 'test-api-key';
    
    // Reset des mocks
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
  });

  afterEach(() => {
    monitor.stop();
    process.env = originalEnv;
  });

  describe('Lifecycle Management', () => {
    it('should start and stop monitoring correctly', () => {
      expect(monitor['intervalId']).toBeNull();
      
      monitor.start();
      expect(monitor['intervalId']).not.toBeNull();
      
      monitor.stop();
      expect(monitor['intervalId']).toBeNull();
    });

    it('should not start multiple times', () => {
      monitor.start();
      const firstIntervalId = monitor['intervalId'];
      
      monitor.start(); // Deuxième appel
      expect(monitor['intervalId']).toBe(firstIntervalId);
    });
  });

  describe('Metrics Collection', () => {
    it('should collect metrics correctly', async () => {
      await monitor['collectMetrics']();
      
      const metrics = monitor.getMetrics();
      
      expect(metrics.errorRate).toBe(0.05);
      expect(metrics.averageHydrationTime).toBe(150);
      expect(metrics.recoverySuccessRate).toBe(0.9);
      expect(metrics.topErrors).toHaveLength(1);
    });

    it('should handle metrics collection errors gracefully', async () => {
      const mockService = require('@/lib/services/hydrationMonitoringService').hydrationMonitoringService;
      mockService.getMetrics.mockRejectedValueOnce(new Error('Service unavailable'));
      
      // Ne devrait pas lever d'exception
      await expect(monitor['collectMetrics']()).resolves.not.toThrow();
    });
  });

  describe('Alert System', () => {
    it('should create alerts for high error rates', async () => {
      // Simuler un taux d'erreur élevé
      const mockService = require('@/lib/services/hydrationMonitoringService').hydrationMonitoringService;
      mockService.getMetrics.mockResolvedValueOnce({
        totalHydrations: 1000,
        successfulHydrations: 900,
        failedHydrations: 100,
        averageHydrationTime: 150,
        errorRate: 0.1, // 10% d'erreurs
        recoverySuccessRate: 0.9
      });

      await monitor['collectMetrics']();
      monitor['checkAlerts']();
      
      const activeAlerts = monitor.getActiveAlerts();
      expect(activeAlerts.length).toBeGreaterThan(0);
      
      const errorAlert = activeAlerts.find(a => a.type === 'error_spike');
      expect(errorAlert).toBeDefined();
      expect(errorAlert?.severity).toBe('critical');
    });

    it('should create alerts for performance degradation', async () => {
      const mockService = require('@/lib/services/hydrationMonitoringService').hydrationMonitoringService;
      mockService.getMetrics.mockResolvedValueOnce({
        totalHydrations: 1000,
        successfulHydrations: 950,
        failedHydrations: 50,
        averageHydrationTime: 4000, // 4 secondes
        errorRate: 0.05,
        recoverySuccessRate: 0.9
      });

      await monitor['collectMetrics']();
      monitor['checkAlerts']();
      
      const activeAlerts = monitor.getActiveAlerts();
      const perfAlert = activeAlerts.find(a => a.type === 'performance_degradation');
      expect(perfAlert).toBeDefined();
    });

    it('should create alerts for low recovery rates', async () => {
      const mockService = require('@/lib/services/hydrationMonitoringService').hydrationMonitoringService;
      mockService.getMetrics.mockResolvedValueOnce({
        totalHydrations: 1000,
        successfulHydrations: 950,
        failedHydrations: 50,
        averageHydrationTime: 150,
        errorRate: 0.05,
        recoverySuccessRate: 0.6 // 60% seulement
      });

      await monitor['collectMetrics']();
      monitor['checkAlerts']();
      
      const activeAlerts = monitor.getActiveAlerts();
      const recoveryAlert = activeAlerts.find(a => a.type === 'recovery_failure');
      expect(recoveryAlert).toBeDefined();
    });

    it('should respect alert cooldown', async () => {
      // Créer une première alerte
      monitor['createAlert']({
        type: 'error_spike',
        severity: 'high',
        message: 'Test alert',
        metadata: {}
      });

      const firstAlertCount = monitor.getActiveAlerts().length;

      // Essayer de créer une alerte du même type immédiatement
      monitor['createAlert']({
        type: 'error_spike',
        severity: 'high',
        message: 'Second test alert',
        metadata: {}
      });

      const secondAlertCount = monitor.getActiveAlerts().length;
      expect(secondAlertCount).toBe(firstAlertCount); // Pas de nouvelle alerte
    });

    it('should resolve alerts correctly', () => {
      monitor['createAlert']({
        type: 'test_alert',
        severity: 'medium',
        message: 'Test alert for resolution',
        metadata: {}
      });

      const activeAlerts = monitor.getActiveAlerts();
      expect(activeAlerts).toHaveLength(1);

      const alertId = activeAlerts[0].id;
      const resolved = monitor.resolveAlert(alertId);
      
      expect(resolved).toBe(true);
      expect(monitor.getActiveAlerts()).toHaveLength(0);
    });
  });

  describe('Notification System', () => {
    it('should send Slack notifications', async () => {
      const alert = {
        id: 'test-alert',
        type: 'error_spike',
        severity: 'high' as const,
        message: 'Test alert message',
        timestamp: Date.now(),
        metadata: {},
        resolved: false
      };

      await monitor['sendSlackNotification'](alert);
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://hooks.slack.com/test',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });

    it('should send webhook notifications', async () => {
      process.env.HYDRATION_WEBHOOK_URL = 'https://webhook.test.com/alert';
      
      const alert = {
        id: 'test-alert',
        type: 'error_spike',
        severity: 'high' as const,
        message: 'Test alert message',
        timestamp: Date.now(),
        metadata: {},
        resolved: false
      };

      await monitor['sendWebhookNotification'](alert);
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://webhook.test.com/alert',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });

    it('should send metrics to external service', async () => {
      const metrics = {
        errorRate: 0.05,
        averageHydrationTime: 150,
        recoverySuccessRate: 0.9,
        affectedUsers: 10,
        topErrors: []
      };

      await monitor['sendMetricsToExternalService'](metrics);
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://monitoring.test.com/api',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-api-key'
          }
        })
      );
    });

    it('should handle notification failures gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      const alert = {
        id: 'test-alert',
        type: 'error_spike',
        severity: 'high' as const,
        message: 'Test alert message',
        timestamp: Date.now(),
        metadata: {},
        resolved: false
      };

      // Ne devrait pas lever d'exception
      await expect(monitor['triggerAlertNotifications'](alert)).resolves.not.toThrow();
    });
  });

  describe('Error Detection', () => {
    it('should detect hydration errors correctly', () => {
      const hydrationError = new Error('Text content does not match server-rendered HTML');
      expect(monitor['isHydrationError'](hydrationError)).toBe(true);

      const regularError = new Error('Regular JavaScript error');
      expect(monitor['isHydrationError'](regularError)).toBe(false);
    });

    it('should record hydration errors', () => {
      const mockService = require('@/lib/services/hydrationMonitoringService').hydrationMonitoringService;
      
      const error = new Error('Hydration error test');
      monitor['recordHydrationError'](error);
      
      expect(mockService.recordHydrationError).toHaveBeenCalledWith(
        'unknown-component',
        'Hydration error test',
        expect.objectContaining({
          stack: error.stack,
          timestamp: expect.any(Number)
        })
      );
    });
  });

  describe('Health Report Generation', () => {
    it('should generate healthy status report', async () => {
      // Simuler des métriques saines
      const mockService = require('@/lib/services/hydrationMonitoringService').hydrationMonitoringService;
      mockService.getMetrics.mockResolvedValueOnce({
        totalHydrations: 1000,
        successfulHydrations: 990,
        failedHydrations: 10,
        averageHydrationTime: 100,
        errorRate: 0.01,
        recoverySuccessRate: 0.95
      });

      await monitor['collectMetrics']();
      const report = monitor.generateHealthReport();
      
      expect(report.status).toBe('healthy');
      expect(report.recommendations).toHaveLength(0);
    });

    it('should generate warning status report', async () => {
      const mockService = require('@/lib/services/hydrationMonitoringService').hydrationMonitoringService;
      mockService.getMetrics.mockResolvedValueOnce({
        totalHydrations: 1000,
        successfulHydrations: 970,
        failedHydrations: 30,
        averageHydrationTime: 2500, // Lent
        errorRate: 0.03,
        recoverySuccessRate: 0.85
      });

      await monitor['collectMetrics']();
      const report = monitor.generateHealthReport();
      
      expect(report.status).toBe('warning');
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('should generate critical status report', async () => {
      // Créer une alerte critique
      monitor['createAlert']({
        type: 'error_spike',
        severity: 'critical',
        message: 'Critical error rate',
        metadata: {}
      });

      const report = monitor.generateHealthReport();
      
      expect(report.status).toBe('critical');
      expect(report.activeAlerts.length).toBeGreaterThan(0);
    });
  });

  describe('Integration with Browser Events', () => {
    it('should setup error listeners in browser environment', () => {
      // Simuler un environnement navigateur
      const mockWindow = {
        addEventListener: jest.fn()
      };
      
      // Temporairement remplacer window
      const originalWindow = global.window;
      global.window = mockWindow as any;

      monitor['setupErrorListeners']();
      
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));

      // Restaurer window
      global.window = originalWindow;
    });
  });

  describe('Real-time Alert Handling', () => {
    it('should handle real-time alerts from monitoring service', () => {
      const realTimeAlert = {
        type: 'hydration_error',
        severity: 'high',
        componentId: 'problematic-component',
        error: 'Repeated hydration failure'
      };

      monitor['handleRealTimeAlert'](realTimeAlert);
      
      const activeAlerts = monitor.getActiveAlerts();
      const componentAlert = activeAlerts.find(a => a.type === 'component_failure');
      expect(componentAlert).toBeDefined();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle high volume of metrics efficiently', async () => {
      const startTime = Date.now();
      
      // Simuler plusieurs collectes de métriques rapides
      const promises = Array.from({ length: 10 }, () => monitor['collectMetrics']());
      await Promise.all(promises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Devrait être rapide même avec plusieurs collectes
      expect(duration).toBeLessThan(1000);
    });

    it('should limit alert creation rate', () => {
      const alertType = 'test_rate_limit';
      
      // Créer plusieurs alertes du même type rapidement
      for (let i = 0; i < 5; i++) {
        monitor['createAlert']({
          type: alertType,
          severity: 'medium',
          message: `Alert ${i}`,
          metadata: {}
        });
      }
      
      // Seule la première devrait être créée (cooldown)
      const alerts = monitor.getActiveAlerts().filter(a => a.type === alertType);
      expect(alerts).toHaveLength(1);
    });
  });
});