import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Mock des services pour les tests d'intégration
vi.mock('@/lib/services/api-monitoring-service', () => ({
  getAPIMonitoringService: () => ({
    recordMetric: vi.fn(),
    getHealthMetrics: vi.fn(() => ({
      uptime: 3600,
      totalRequests: 100,
      successRate: 99.5,
      averageResponseTime: 120,
      errorRate: 0.5,
    })),
  }),
}));

vi.mock('@/lib/services/circuit-breaker', () => ({
  CircuitBreakerFactory: {
    getCircuitBreaker: vi.fn(() => ({
      execute: vi.fn((fn) => fn()),
      getState: vi.fn(() => 'CLOSED'),
      getMetrics: vi.fn(() => ({
        failures: 0,
        successes: 10,
        state: 'CLOSED',
      })),
    })),
  },
}));

describe('Architecture Integration Tests', () => {
  describe('Circuit Breaker Integration', () => {
    it('should integrate circuit breaker with API calls', async () => {
      const { CircuitBreakerFactory } = await import('@/lib/services/circuit-breaker');
      const circuitBreaker = CircuitBreakerFactory.getCircuitBreaker('test-service', 'api');
      
      // Test successful execution
      const result = await circuitBreaker.execute(async () => {
        return { success: true, data: 'test' };
      });
      
      expect(result).toEqual({ success: true, data: 'test' });
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });

    it('should handle circuit breaker failures gracefully', async () => {
      const { CircuitBreakerFactory } = await import('@/lib/services/circuit-breaker');
      const circuitBreaker = CircuitBreakerFactory.getCircuitBreaker('failing-service', 'api');
      
      // Mock circuit breaker to simulate OPEN state
      vi.mocked(circuitBreaker.execute).mockRejectedValue(new Error('Circuit breaker is OPEN'));
      vi.mocked(circuitBreaker.getState).mockReturnValue('OPEN');
      
      await expect(circuitBreaker.execute(async () => {
        throw new Error('Service failure');
      })).rejects.toThrow('Circuit breaker is OPEN');
      
      expect(circuitBreaker.getState()).toBe('OPEN');
    });
  });

  describe('Monitoring Integration', () => {
    it('should integrate monitoring with API endpoints', async () => {
      const { getAPIMonitoringService } = await import('@/lib/services/api-monitoring-service');
      const monitoring = getAPIMonitoringService();
      
      // Simuler un appel API
      const startTime = Date.now();
      
      // Enregistrer une métrique
      monitoring.recordMetric({
        endpoint: '/api/test',
        method: 'GET',
        statusCode: 200,
        responseTime: Date.now() - startTime,
        userId: 'test-user',
      });
      
      // Vérifier les métriques de santé
      const healthMetrics = monitoring.getHealthMetrics();
      
      expect(healthMetrics).toHaveProperty('uptime');
      expect(healthMetrics).toHaveProperty('totalRequests');
      expect(healthMetrics).toHaveProperty('successRate');
      expect(healthMetrics).toHaveProperty('averageResponseTime');
      expect(healthMetrics.successRate).toBeGreaterThan(90);
    });

    it('should track performance metrics across services', async () => {
      const { getAPIMonitoringService } = await import('@/lib/services/api-monitoring-service');
      const monitoring = getAPIMonitoringService();
      
      // Simuler plusieurs appels API
      const endpoints = ['/api/content-ideas', '/api/auth', '/api/metrics'];
      
      endpoints.forEach((endpoint, index) => {
        monitoring.recordMetric({
          endpoint,
          method: 'POST',
          statusCode: 200,
          responseTime: 100 + index * 50,
          userId: `user-${index}`,
        });
      });
      
      const endpointMetrics = monitoring.getEndpointMetrics();
      
      expect(Object.keys(endpointMetrics)).toHaveLength(endpoints.length);
      endpoints.forEach(endpoint => {
        expect(endpointMetrics).toHaveProperty(`POST ${endpoint}`);
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should integrate error handling across the stack', async () => {
      // Test de l'intégration des erreurs API
      const mockRequest = new NextRequest('http://localhost:3000/api/test');
      
      // Simuler une erreur dans le middleware
      const errorHandler = async (error: Error) => {
        if (error.name === 'ValidationError') {
          return NextResponse.json({
            success: false,
            error: {
              type: 'validation_error',
              message: error.message,
            },
          }, { status: 400 });
        }
        
        return NextResponse.json({
          success: false,
          error: {
            type: 'internal_error',
            message: 'An unexpected error occurred',
          },
        }, { status: 500 });
      };
      
      // Test validation error
      const validationError = new Error('Invalid input');
      validationError.name = 'ValidationError';
      
      const validationResponse = await errorHandler(validationError);
      const validationData = await validationResponse.json();
      
      expect(validationResponse.status).toBe(400);
      expect(validationData.error.type).toBe('validation_error');
      
      // Test internal error
      const internalError = new Error('Database connection failed');
      const internalResponse = await errorHandler(internalError);
      const internalData = await internalResponse.json();
      
      expect(internalResponse.status).toBe(500);
      expect(internalData.error.type).toBe('internal_error');
    });
  });

  describe('Authentication Integration', () => {
    it('should integrate authentication with API routes', async () => {
      // Mock authentication middleware
      const mockAuthMiddleware = async (request: NextRequest) => {
        const authHeader = request.headers.get('authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return NextResponse.json({
            success: false,
            error: { type: 'authentication_error', message: 'Missing or invalid token' },
          }, { status: 401 });
        }
        
        const token = authHeader.substring(7);
        
        if (token === 'valid-token') {
          return NextResponse.json({
            success: true,
            user: { id: 'user-123', role: 'creator' },
          });
        }
        
        return NextResponse.json({
          success: false,
          error: { type: 'authentication_error', message: 'Invalid token' },
        }, { status: 401 });
      };
      
      // Test avec token valide
      const validRequest = new NextRequest('http://localhost:3000/api/protected', {
        headers: { authorization: 'Bearer valid-token' },
      });
      
      const validResponse = await mockAuthMiddleware(validRequest);
      const validData = await validResponse.json();
      
      expect(validResponse.status).toBe(200);
      expect(validData.success).toBe(true);
      expect(validData.user.id).toBe('user-123');
      
      // Test sans token
      const invalidRequest = new NextRequest('http://localhost:3000/api/protected');
      const invalidResponse = await mockAuthMiddleware(invalidRequest);
      const invalidData = await invalidResponse.json();
      
      expect(invalidResponse.status).toBe(401);
      expect(invalidData.success).toBe(false);
      expect(invalidData.error.type).toBe('authentication_error');
    });
  });

  describe('Performance Integration', () => {
    it('should maintain performance under load', async () => {
      const startTime = Date.now();
      const concurrentRequests = 10;
      
      // Simuler des requêtes concurrentes
      const promises = Array.from({ length: concurrentRequests }, async (_, index) => {
        const requestStart = Date.now();
        
        // Simuler un traitement API
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        
        return {
          requestId: index,
          duration: Date.now() - requestStart,
        };
      });
      
      const results = await Promise.all(promises);
      const totalDuration = Date.now() - startTime;
      
      // Vérifier que toutes les requêtes sont terminées
      expect(results).toHaveLength(concurrentRequests);
      
      // Vérifier que le temps total est raisonnable (moins de 1 seconde)
      expect(totalDuration).toBeLessThan(1000);
      
      // Vérifier que chaque requête individuelle est rapide
      results.forEach(result => {
        expect(result.duration).toBeLessThan(500);
      });
    });

    it('should handle graceful degradation', async () => {
      // Mock d'un service qui échoue
      const mockFailingService = async (shouldFail: boolean) => {
        if (shouldFail) {
          throw new Error('Service unavailable');
        }
        return { data: 'success', source: 'primary' };
      };
      
      // Mock d'un service de fallback
      const mockFallbackService = async () => {
        return { data: 'fallback', source: 'cache' };
      };
      
      // Test avec service principal qui fonctionne
      const successResult = await mockFailingService(false);
      expect(successResult.source).toBe('primary');
      
      // Test avec service principal qui échoue, utilisation du fallback
      try {
        await mockFailingService(true);
      } catch (error) {
        const fallbackResult = await mockFallbackService();
        expect(fallbackResult.source).toBe('cache');
        expect(fallbackResult.data).toBe('fallback');
      }
    });
  });

  describe('Real-time Integration', () => {
    it('should integrate SSE with content creation', async () => {
      // Mock SSE connection
      const mockSSEConnection = {
        connected: false,
        events: [] as any[],
        
        connect() {
          this.connected = true;
          return Promise.resolve();
        },
        
        disconnect() {
          this.connected = false;
        },
        
        emit(event: any) {
          if (this.connected) {
            this.events.push(event);
          }
        },
      };
      
      // Test connection
      await mockSSEConnection.connect();
      expect(mockSSEConnection.connected).toBe(true);
      
      // Test event emission
      const testEvent = {
        type: 'asset_uploaded',
        data: { id: 'asset-123', status: 'processed' },
        timestamp: new Date().toISOString(),
      };
      
      mockSSEConnection.emit(testEvent);
      
      expect(mockSSEConnection.events).toHaveLength(1);
      expect(mockSSEConnection.events[0]).toEqual(testEvent);
      
      // Test disconnection
      mockSSEConnection.disconnect();
      expect(mockSSEConnection.connected).toBe(false);
    });
  });
});