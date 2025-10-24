import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  GracefulDegradationService,
  DegradationConfigs,
  DegradationPatterns,
  withGracefulDegradation,
  gracefulDegradation
} from '@/lib/services/graceful-degradation';

describe('GracefulDegradationService', () => {
  let service: GracefulDegradationService;

  beforeEach(() => {
    service = GracefulDegradationService.getInstance();
    service.reset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Fail Fast Strategy', () => {
    it('should stop execution when critical service fails', async () => {
      const criticalService = vi.fn().mockRejectedValue(new Error('Critical failure'));
      const importantService = vi.fn().mockResolvedValue('important-result');
      const optionalService = vi.fn().mockResolvedValue('optional-result');

      // Mock service functions
      vi.spyOn(service as any, 'getServiceFunction')
        .mockImplementation((name: string) => {
          switch (name) {
            case 'critical_service': return criticalService;
            case 'important_service': return importantService;
            case 'optional_service': return optionalService;
            default: return vi.fn().mockRejectedValue(new Error('Unknown service'));
          }
        });

      const config = {
        strategy: 'fail_fast' as const,
        globalTimeout: 10000,
        services: [
          { name: 'critical_service', priority: 'critical' as const, timeout: 1000 },
          { name: 'important_service', priority: 'important' as const, timeout: 2000 },
          { name: 'optional_service', priority: 'optional' as const, timeout: 3000 },
        ],
      };

      const result = await service.executeWithDegradation(config);

      expect(result.status).toBe('failed');
      expect(result.criticalFailures).toContain('critical_service');
      expect(criticalService).toHaveBeenCalledOnce();
      expect(importantService).not.toHaveBeenCalled();
      expect(optionalService).not.toHaveBeenCalled();
    });

    it('should continue with non-critical services when critical services succeed', async () => {
      const criticalService = vi.fn().mockResolvedValue('critical-success');
      const importantService = vi.fn().mockResolvedValue('important-success');
      const optionalService = vi.fn().mockRejectedValue(new Error('Optional failure'));

      vi.spyOn(service as any, 'getServiceFunction')
        .mockImplementation((name: string) => {
          switch (name) {
            case 'critical_service': return criticalService;
            case 'important_service': return importantService;
            case 'optional_service': return optionalService;
            default: return vi.fn().mockRejectedValue(new Error('Unknown service'));
          }
        });

      const config = {
        strategy: 'fail_fast' as const,
        globalTimeout: 10000,
        services: [
          { name: 'critical_service', priority: 'critical' as const, timeout: 1000 },
          { name: 'important_service', priority: 'important' as const, timeout: 2000 },
          { name: 'optional_service', priority: 'optional' as const, timeout: 3000 },
        ],
      };

      const result = await service.executeWithDegradation(config);

      expect(result.status).toBe('partial');
      expect(result.criticalFailures).toHaveLength(0);
      expect(result.degradedServices).toContain('optional_service');
      expect(criticalService).toHaveBeenCalledOnce();
      expect(importantService).toHaveBeenCalledOnce();
      expect(optionalService).toHaveBeenCalledOnce();
    });
  });

  describe('Best Effort Strategy', () => {
    it('should attempt all services and use fallbacks', async () => {
      const criticalService = vi.fn().mockRejectedValue(new Error('Critical failure'));
      const criticalFallback = vi.fn().mockResolvedValue('critical-fallback');
      const importantService = vi.fn().mockResolvedValue('important-success');
      const optionalService = vi.fn().mockRejectedValue(new Error('Optional failure'));

      vi.spyOn(service as any, 'getServiceFunction')
        .mockImplementation((name: string) => {
          switch (name) {
            case 'critical_service': return criticalService;
            case 'important_service': return importantService;
            case 'optional_service': return optionalService;
            default: return vi.fn().mockRejectedValue(new Error('Unknown service'));
          }
        });

      const config = {
        strategy: 'best_effort' as const,
        globalTimeout: 10000,
        services: [
          { 
            name: 'critical_service', 
            priority: 'critical' as const, 
            timeout: 1000,
            fallback: criticalFallback
          },
          { name: 'important_service', priority: 'important' as const, timeout: 2000 },
          { name: 'optional_service', priority: 'optional' as const, timeout: 3000 },
        ],
      };

      const result = await service.executeWithDegradation(config);

      expect(result.status).toBe('partial');
      expect(result.degradedServices).toContain('optional_service');
      expect(criticalFallback).toHaveBeenCalledOnce();
      
      // Find critical service result
      const criticalResult = result.results.find(r => r.name === 'critical_service');
      expect(criticalResult?.status).toBe('success');
      expect(criticalResult?.fallbackUsed).toBe(true);
      expect(criticalResult?.data).toBe('critical-fallback');
    });

    it('should handle all services succeeding', async () => {
      const criticalService = vi.fn().mockResolvedValue('critical-success');
      const importantService = vi.fn().mockResolvedValue('important-success');
      const optionalService = vi.fn().mockResolvedValue('optional-success');

      vi.spyOn(service as any, 'getServiceFunction')
        .mockImplementation((name: string) => {
          switch (name) {
            case 'critical_service': return criticalService;
            case 'important_service': return importantService;
            case 'optional_service': return optionalService;
            default: return vi.fn().mockRejectedValue(new Error('Unknown service'));
          }
        });

      const config = {
        strategy: 'best_effort' as const,
        globalTimeout: 10000,
        services: [
          { name: 'critical_service', priority: 'critical' as const, timeout: 1000 },
          { name: 'important_service', priority: 'important' as const, timeout: 2000 },
          { name: 'optional_service', priority: 'optional' as const, timeout: 3000 },
        ],
      };

      const result = await service.executeWithDegradation(config);

      expect(result.status).toBe('success');
      expect(result.criticalFailures).toHaveLength(0);
      expect(result.degradedServices).toHaveLength(0);
      expect(result.results).toHaveLength(3);
      expect(result.results.every(r => r.status === 'success')).toBe(true);
    });
  });

  describe('Essential Only Strategy', () => {
    it('should execute only critical services', async () => {
      const criticalService = vi.fn().mockResolvedValue('critical-success');
      const importantService = vi.fn().mockResolvedValue('important-success');
      const optionalService = vi.fn().mockResolvedValue('optional-success');

      vi.spyOn(service as any, 'getServiceFunction')
        .mockImplementation((name: string) => {
          switch (name) {
            case 'critical_service': return criticalService;
            case 'important_service': return importantService;
            case 'optional_service': return optionalService;
            default: return vi.fn().mockRejectedValue(new Error('Unknown service'));
          }
        });

      const config = {
        strategy: 'essential_only' as const,
        globalTimeout: 10000,
        services: [
          { name: 'critical_service', priority: 'critical' as const, timeout: 1000 },
          { name: 'important_service', priority: 'important' as const, timeout: 2000 },
          { name: 'optional_service', priority: 'optional' as const, timeout: 3000 },
        ],
      };

      const result = await service.executeWithDegradation(config);

      expect(result.status).toBe('success');
      expect(criticalService).toHaveBeenCalledOnce();
      expect(importantService).not.toHaveBeenCalled();
      expect(optionalService).not.toHaveBeenCalled();
      
      // Non-critical services should be marked as skipped
      const importantResult = result.results.find(r => r.name === 'important_service');
      const optionalResult = result.results.find(r => r.name === 'optional_service');
      expect(importantResult?.status).toBe('skipped');
      expect(optionalResult?.status).toBe('skipped');
    });

    it('should fail when critical services fail', async () => {
      const criticalService = vi.fn().mockRejectedValue(new Error('Critical failure'));

      vi.spyOn(service as any, 'getServiceFunction')
        .mockImplementation((name: string) => {
          switch (name) {
            case 'critical_service': return criticalService;
            default: return vi.fn().mockRejectedValue(new Error('Unknown service'));
          }
        });

      const config = {
        strategy: 'essential_only' as const,
        globalTimeout: 10000,
        services: [
          { name: 'critical_service', priority: 'critical' as const, timeout: 1000 },
        ],
      };

      const result = await service.executeWithDegradation(config);

      expect(result.status).toBe('failed');
      expect(result.criticalFailures).toContain('critical_service');
    });
  });  describe(
'Timeout Handling', () => {
    it('should handle service timeouts correctly', async () => {
      const slowService = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('slow-result'), 2000))
      );

      vi.spyOn(service as any, 'getServiceFunction')
        .mockImplementation(() => slowService);

      const config = {
        strategy: 'best_effort' as const,
        globalTimeout: 10000,
        services: [
          { name: 'slow_service', priority: 'important' as const, timeout: 100 }, // Short timeout
        ],
      };

      const result = await service.executeWithDegradation(config);

      expect(result.status).toBe('partial');
      expect(result.degradedServices).toContain('slow_service');
      
      const serviceResult = result.results.find(r => r.name === 'slow_service');
      expect(serviceResult?.status).toBe('timeout');
    });

    it('should use fallback when service times out', async () => {
      const slowService = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('slow-result'), 2000))
      );
      const timeoutFallback = vi.fn().mockResolvedValue('timeout-fallback');

      vi.spyOn(service as any, 'getServiceFunction')
        .mockImplementation(() => slowService);

      const config = {
        strategy: 'best_effort' as const,
        globalTimeout: 10000,
        services: [
          { 
            name: 'slow_service', 
            priority: 'important' as const, 
            timeout: 100,
            fallback: timeoutFallback
          },
        ],
      };

      const result = await service.executeWithDegradation(config);

      expect(result.status).toBe('success');
      expect(timeoutFallback).toHaveBeenCalledOnce();
      
      const serviceResult = result.results.find(r => r.name === 'slow_service');
      expect(serviceResult?.status).toBe('success');
      expect(serviceResult?.fallbackUsed).toBe(true);
      expect(serviceResult?.data).toBe('timeout-fallback');
    });
  });

  describe('Fallback Handling', () => {
    it('should handle fallback failures', async () => {
      const primaryService = vi.fn().mockRejectedValue(new Error('Primary failure'));
      const failingFallback = vi.fn().mockRejectedValue(new Error('Fallback failure'));

      vi.spyOn(service as any, 'getServiceFunction')
        .mockImplementation(() => primaryService);

      const config = {
        strategy: 'best_effort' as const,
        globalTimeout: 10000,
        services: [
          { 
            name: 'failing_service', 
            priority: 'critical' as const, 
            timeout: 1000,
            fallback: failingFallback
          },
        ],
      };

      const result = await service.executeWithDegradation(config);

      expect(result.status).toBe('failed');
      expect(result.criticalFailures).toContain('failing_service');
      expect(failingFallback).toHaveBeenCalledOnce();
      
      const serviceResult = result.results.find(r => r.name === 'failing_service');
      expect(serviceResult?.status).toBe('failed');
      expect(serviceResult?.fallbackUsed).toBe(false);
    });

    it('should handle synchronous fallbacks', async () => {
      const primaryService = vi.fn().mockRejectedValue(new Error('Primary failure'));
      const syncFallback = vi.fn().mockReturnValue('sync-fallback-result');

      vi.spyOn(service as any, 'getServiceFunction')
        .mockImplementation(() => primaryService);

      const config = {
        strategy: 'best_effort' as const,
        globalTimeout: 10000,
        services: [
          { 
            name: 'sync_fallback_service', 
            priority: 'important' as const, 
            timeout: 1000,
            fallback: syncFallback
          },
        ],
      };

      const result = await service.executeWithDegradation(config);

      expect(result.status).toBe('success');
      expect(syncFallback).toHaveBeenCalledOnce();
      
      const serviceResult = result.results.find(r => r.name === 'sync_fallback_service');
      expect(serviceResult?.status).toBe('success');
      expect(serviceResult?.fallbackUsed).toBe(true);
      expect(serviceResult?.data).toBe('sync-fallback-result');
    });
  });

  describe('Metrics and Monitoring', () => {
    it('should track degradation metrics', async () => {
      const successService = vi.fn().mockResolvedValue('success');
      const failService = vi.fn().mockRejectedValue(new Error('Failure'));
      const fallbackService = vi.fn().mockRejectedValue(new Error('Primary failure'));
      const fallback = vi.fn().mockResolvedValue('fallback-result');

      vi.spyOn(service as any, 'getServiceFunction')
        .mockImplementation((name: string) => {
          switch (name) {
            case 'success_service': return successService;
            case 'fail_service': return failService;
            case 'fallback_service': return fallbackService;
            default: return vi.fn().mockRejectedValue(new Error('Unknown service'));
          }
        });

      const config = {
        strategy: 'best_effort' as const,
        globalTimeout: 10000,
        services: [
          { name: 'success_service', priority: 'critical' as const, timeout: 1000 },
          { name: 'fail_service', priority: 'important' as const, timeout: 1000 },
          { 
            name: 'fallback_service', 
            priority: 'optional' as const, 
            timeout: 1000,
            fallback
          },
        ],
      };

      await service.executeWithDegradation(config);

      const metrics = service.getMetrics();
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.partialRequests).toBe(1);
      expect(metrics.fallbacksUsed).toBe(1);
      expect(metrics.averageDuration).toBeGreaterThan(0);
    });

    it('should calculate success and fallback rates', async () => {
      // Execute multiple degradation requests
      for (let i = 0; i < 5; i++) {
        const mockService = vi.fn().mockResolvedValue('success');
        vi.spyOn(service as any, 'getServiceFunction').mockImplementation(() => mockService);

        const config = {
          strategy: 'best_effort' as const,
          globalTimeout: 10000,
          services: [
            { name: 'test_service', priority: 'critical' as const, timeout: 1000 },
          ],
        };

        await service.executeWithDegradation(config);
      }

      const metrics = service.getMetrics();
      expect(metrics.totalRequests).toBe(5);
      expect(metrics.successfulRequests).toBe(5);
      expect(metrics.successRate).toBe(100);
      expect(metrics.fallbackRate).toBe(0);
    });

    it('should reset metrics correctly', async () => {
      const mockService = vi.fn().mockResolvedValue('success');
      vi.spyOn(service as any, 'getServiceFunction').mockImplementation(() => mockService);

      const config = {
        strategy: 'best_effort' as const,
        globalTimeout: 10000,
        services: [
          { name: 'test_service', priority: 'critical' as const, timeout: 1000 },
        ],
      };

      await service.executeWithDegradation(config);

      let metrics = service.getMetrics();
      expect(metrics.totalRequests).toBe(1);

      service.reset();

      metrics = service.getMetrics();
      expect(metrics.totalRequests).toBe(0);
      expect(metrics.successfulRequests).toBe(0);
      expect(metrics.averageDuration).toBe(0);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = GracefulDegradationService.getInstance();
      const instance2 = GracefulDegradationService.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(GracefulDegradationService);
    });

    it('should maintain state across instances', async () => {
      const instance1 = GracefulDegradationService.getInstance();
      const instance2 = GracefulDegradationService.getInstance();

      const mockService = vi.fn().mockResolvedValue('success');
      vi.spyOn(instance1 as any, 'getServiceFunction').mockImplementation(() => mockService);

      const config = {
        strategy: 'best_effort' as const,
        globalTimeout: 10000,
        services: [
          { name: 'test_service', priority: 'critical' as const, timeout: 1000 },
        ],
      };

      await instance1.executeWithDegradation(config);

      const metrics1 = instance1.getMetrics();
      const metrics2 = instance2.getMetrics();

      expect(metrics1.totalRequests).toBe(metrics2.totalRequests);
      expect(metrics1.totalRequests).toBe(1);
    });
  });
});

describe('DegradationConfigs', () => {
  it('should provide user dashboard configuration', () => {
    const config = DegradationConfigs.userDashboard();

    expect(config.strategy).toBe('best_effort');
    expect(config.globalTimeout).toBe(10000);
    expect(config.services).toHaveLength(5);
    
    const criticalServices = config.services.filter(s => s.priority === 'critical');
    expect(criticalServices).toHaveLength(2);
    expect(criticalServices.every(s => s.fallback)).toBe(true);
  });

  it('should provide content generation configuration', () => {
    const config = DegradationConfigs.contentGeneration();

    expect(config.strategy).toBe('fail_fast');
    expect(config.globalTimeout).toBe(30000);
    
    const aiService = config.services.find(s => s.name === 'ai_service');
    expect(aiService?.priority).toBe('critical');
    expect(aiService?.timeout).toBe(15000);
    expect(aiService?.fallback).toBeDefined();
  });

  it('should provide analytics configuration', () => {
    const config = DegradationConfigs.analytics();

    expect(config.strategy).toBe('best_effort');
    expect(config.globalTimeout).toBe(15000);
    
    const realTimeStats = config.services.find(s => s.name === 'real_time_stats');
    expect(realTimeStats?.priority).toBe('critical');
    expect(realTimeStats?.fallback).toBeDefined();
  });

  it('should provide maintenance mode configuration', () => {
    const config = DegradationConfigs.maintenanceMode();

    expect(config.strategy).toBe('essential_only');
    expect(config.globalTimeout).toBe(5000);
    
    const services = config.services;
    expect(services.every(s => s.priority === 'critical')).toBe(true);
    expect(services.every(s => s.timeout <= 3000)).toBe(true);
  });
});

describe('withGracefulDegradation Decorator', () => {
  class TestService {
    @withGracefulDegradation(DegradationConfigs.userDashboard())
    async getUserDashboard(userId: string): Promise<any> {
      if (userId === 'fail') {
        throw new Error('Primary method failed');
      }
      return { userId, dashboard: 'primary-data' };
    }

    @withGracefulDegradation(DegradationConfigs.maintenanceMode())
    async getEssentialData(userId: string): Promise<any> {
      if (userId === 'maintenance') {
        throw new Error('Service in maintenance');
      }
      return { userId, data: 'essential-data' };
    }
  }

  let testService: TestService;

  beforeEach(() => {
    testService = new TestService();
    gracefulDegradation.reset();
  });

  it('should apply graceful degradation to decorated methods', async () => {
    const result = await testService.getUserDashboard('success');

    expect(result).toEqual({ userId: 'success', dashboard: 'primary-data' });
  });

  it('should use degradation when primary method fails', async () => {
    // Mock the degradation service to return a successful result
    const mockExecute = vi.spyOn(gracefulDegradation, 'executeWithDegradation')
      .mockResolvedValue({
        status: 'success',
        results: [
          { name: 'user_profile', status: 'success', data: { name: 'User' }, duration: 100, fallbackUsed: true }
        ],
        criticalFailures: [],
        degradedServices: [],
        totalDuration: 100,
        strategy: 'best_effort',
      });

    const result = await testService.getUserDashboard('fail');

    expect(mockExecute).toHaveBeenCalledOnce();
    expect(result.status).toBe('success');
  });

  it('should throw error when all services fail', async () => {
    const mockExecute = vi.spyOn(gracefulDegradation, 'executeWithDegradation')
      .mockResolvedValue({
        status: 'failed',
        results: [],
        criticalFailures: ['user_profile', 'campaigns'],
        degradedServices: [],
        totalDuration: 100,
        strategy: 'best_effort',
      });

    await expect(testService.getUserDashboard('fail'))
      .rejects.toThrow('All services failed: user_profile, campaigns');

    expect(mockExecute).toHaveBeenCalledOnce();
  });
});

describe('DegradationPatterns', () => {
  beforeEach(() => {
    gracefulDegradation.reset();
  });

  describe('withFallback', () => {
    it('should execute primary function successfully', async () => {
      const primaryFn = vi.fn().mockResolvedValue('primary-success');
      const fallbackFn = vi.fn().mockResolvedValue('fallback-result');

      const result = await DegradationPatterns.withFallback(primaryFn, fallbackFn, 1000);

      expect(result).toBe('primary-success');
      expect(primaryFn).toHaveBeenCalledOnce();
      expect(fallbackFn).not.toHaveBeenCalled();
    });

    it('should use fallback when primary fails', async () => {
      const primaryFn = vi.fn().mockRejectedValue(new Error('Primary failed'));
      const fallbackFn = vi.fn().mockResolvedValue('fallback-success');

      // Mock the degradation service
      const mockExecute = vi.spyOn(gracefulDegradation, 'executeWithDegradation')
        .mockResolvedValue({
          status: 'success',
          results: [
            { name: 'primary', status: 'success', data: 'fallback-success', duration: 100, fallbackUsed: true }
          ],
          criticalFailures: [],
          degradedServices: [],
          totalDuration: 100,
          strategy: 'best_effort',
        });

      const result = await DegradationPatterns.withFallback(primaryFn, fallbackFn, 1000);

      expect(result).toBe('fallback-success');
      expect(mockExecute).toHaveBeenCalledOnce();
    });

    it('should throw error when both primary and fallback fail', async () => {
      const primaryFn = vi.fn().mockRejectedValue(new Error('Primary failed'));
      const fallbackFn = vi.fn().mockRejectedValue(new Error('Fallback failed'));

      const mockExecute = vi.spyOn(gracefulDegradation, 'executeWithDegradation')
        .mockResolvedValue({
          status: 'failed',
          results: [],
          criticalFailures: ['primary'],
          degradedServices: [],
          totalDuration: 100,
          strategy: 'best_effort',
        });

      await expect(DegradationPatterns.withFallback(primaryFn, fallbackFn, 1000))
        .rejects.toThrow('Both primary and fallback failed');
    });
  });

  describe('withMultipleFallbacks', () => {
    it('should execute first successful operation', async () => {
      const operation1 = { name: 'op1', fn: vi.fn().mockResolvedValue('op1-success') };
      const operation2 = { name: 'op2', fn: vi.fn().mockResolvedValue('op2-success') };

      const result = await DegradationPatterns.withMultipleFallbacks([operation1, operation2]);

      expect(result).toBe('op1-success');
      expect(operation1.fn).toHaveBeenCalledOnce();
      expect(operation2.fn).not.toHaveBeenCalled();
    });

    it('should try fallbacks in order when operations fail', async () => {
      const operation1 = { name: 'op1', fn: vi.fn().mockRejectedValue(new Error('Op1 failed')) };
      const operation2 = { name: 'op2', fn: vi.fn().mockRejectedValue(new Error('Op2 failed')) };
      const operation3 = { name: 'op3', fn: vi.fn().mockResolvedValue('op3-success') };

      const result = await DegradationPatterns.withMultipleFallbacks([operation1, operation2, operation3]);

      expect(result).toBe('op3-success');
      expect(operation1.fn).toHaveBeenCalledOnce();
      expect(operation2.fn).toHaveBeenCalledOnce();
      expect(operation3.fn).toHaveBeenCalledOnce();
    });

    it('should throw error when all operations fail', async () => {
      const operation1 = { name: 'op1', fn: vi.fn().mockRejectedValue(new Error('Op1 failed')) };
      const operation2 = { name: 'op2', fn: vi.fn().mockRejectedValue(new Error('Op2 failed')) };

      await expect(DegradationPatterns.withMultipleFallbacks([operation1, operation2]))
        .rejects.toThrow('All fallback operations failed');

      expect(operation1.fn).toHaveBeenCalledOnce();
      expect(operation2.fn).toHaveBeenCalledOnce();
    });

    it('should handle timeout for operations', async () => {
      const slowOperation = { 
        name: 'slow', 
        fn: vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(() => resolve('slow-result'), 2000))),
        timeout: 100
      };
      const fastOperation = { 
        name: 'fast', 
        fn: vi.fn().mockResolvedValue('fast-result'),
        timeout: 1000
      };

      const result = await DegradationPatterns.withMultipleFallbacks([slowOperation, fastOperation]);

      expect(result).toBe('fast-result');
      expect(fastOperation.fn).toHaveBeenCalledOnce();
    });
  });
});

describe('Performance and Edge Cases', () => {
  let service: GracefulDegradationService;

  beforeEach(() => {
    service = GracefulDegradationService.getInstance();
    service.reset();
  });

  it('should handle concurrent degradation requests', async () => {
    const mockService = vi.fn().mockResolvedValue('concurrent-result');
    vi.spyOn(service as any, 'getServiceFunction').mockImplementation(() => mockService);

    const config = {
      strategy: 'best_effort' as const,
      globalTimeout: 10000,
      services: [
        { name: 'concurrent_service', priority: 'critical' as const, timeout: 1000 },
      ],
    };

    // Execute 10 concurrent degradation requests
    const promises = Array(10).fill(null).map(() => 
      service.executeWithDegradation(config)
    );

    const results = await Promise.all(promises);

    expect(results).toHaveLength(10);
    expect(results.every(r => r.status === 'success')).toBe(true);
    expect(mockService).toHaveBeenCalledTimes(10);

    const metrics = service.getMetrics();
    expect(metrics.totalRequests).toBe(10);
    expect(metrics.successfulRequests).toBe(10);
  });

  it('should handle mixed success/failure patterns efficiently', async () => {
    let callCount = 0;
    const mixedService = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount % 3 === 0) {
        return Promise.reject(new Error('Intermittent failure'));
      }
      return Promise.resolve(`success-${callCount}`);
    });

    const fallback = vi.fn().mockResolvedValue('fallback-result');

    vi.spyOn(service as any, 'getServiceFunction').mockImplementation(() => mixedService);

    const config = {
      strategy: 'best_effort' as const,
      globalTimeout: 10000,
      services: [
        { 
          name: 'mixed_service', 
          priority: 'important' as const, 
          timeout: 1000,
          fallback
        },
      ],
    };

    // Execute 9 requests (every 3rd will fail)
    const results = [];
    for (let i = 0; i < 9; i++) {
      const result = await service.executeWithDegradation(config);
      results.push(result);
    }

    const metrics = service.getMetrics();
    expect(metrics.totalRequests).toBe(9);
    expect(metrics.fallbacksUsed).toBe(3); // Every 3rd request used fallback
    expect(metrics.partialRequests).toBe(0); // All succeeded (with fallbacks)
    expect(metrics.successfulRequests).toBe(9);
  });

  it('should handle rapid state transitions', async () => {
    const fastService = vi.fn().mockResolvedValue('fast-result');
    vi.spyOn(service as any, 'getServiceFunction').mockImplementation(() => fastService);

    const config = {
      strategy: 'best_effort' as const,
      globalTimeout: 100, // Very short timeout
      services: [
        { name: 'fast_service', priority: 'critical' as const, timeout: 50 },
      ],
    };

    // Execute many rapid requests
    const startTime = Date.now();
    const promises = Array(50).fill(null).map(() => 
      service.executeWithDegradation(config)
    );

    const results = await Promise.all(promises);
    const endTime = Date.now();

    expect(results).toHaveLength(50);
    expect(results.every(r => r.status === 'success')).toBe(true);
    expect(endTime - startTime).toBeLessThan(1000); // Should complete quickly

    const metrics = service.getMetrics();
    expect(metrics.totalRequests).toBe(50);
    expect(metrics.averageDuration).toBeLessThan(100);
  });

  it('should handle large service configurations', async () => {
    const services = Array(20).fill(null).map((_, i) => ({
      name: `service_${i}`,
      priority: (i < 5 ? 'critical' : i < 15 ? 'important' : 'optional') as const,
      timeout: 1000 + (i * 100),
      fallback: i % 2 === 0 ? () => `fallback_${i}` : undefined,
    }));

    const mockServiceFn = vi.fn().mockImplementation(() => {
      // Randomly succeed or fail
      if (Math.random() > 0.7) {
        return Promise.reject(new Error('Random failure'));
      }
      return Promise.resolve('service-success');
    });

    vi.spyOn(service as any, 'getServiceFunction').mockImplementation(() => mockServiceFn);

    const config = {
      strategy: 'best_effort' as const,
      globalTimeout: 30000,
      services,
    };

    const result = await service.executeWithDegradation(config);

    expect(result.results).toHaveLength(20);
    expect(result.totalDuration).toBeGreaterThan(0);
    
    // Should have some successful results (either primary or fallback)
    const successfulResults = result.results.filter(r => r.status === 'success');
    expect(successfulResults.length).toBeGreaterThan(0);
  });
});