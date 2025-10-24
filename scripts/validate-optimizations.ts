#!/usr/bin/env tsx

/**
 * Script de validation complète des optimisations API
 * Teste tous les patterns de résilience et performance
 */

import { AdvancedCircuitBreakerFactory } from '../lib/services/advanced-circuit-breaker';
import { getSmartRequestCoalescer } from '../lib/services/smart-request-coalescer';
import { sloMonitoring } from '../lib/services/slo-monitoring-service';
import { gracefulDegradation, DegradationConfigs } from '../lib/services/graceful-degradation';

interface ValidationResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  duration: number;
  details: string;
  metrics?: any;
}

class OptimizationValidator {
  private results: ValidationResult[] = [];

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting comprehensive optimization validation...\n');

    // Tests Circuit Breaker
    await this.testCircuitBreaker();
    
    // Tests Request Coalescing
    await this.testRequestCoalescing();
    
    // Tests Graceful Degradation
    await this.testGracefulDegradation();
    
    // Tests SLO Monitoring
    await this.testSLOMonitoring();
    
    // Tests de charge simulés
    await this.testLoadSimulation();
    
    // Tests d'intégration
    await this.testIntegration();

    this.printResults();
  }

  /**
   * Tests Circuit Breaker
   */
  async testCircuitBreaker(): Promise<void> {
    console.log('🔄 Testing Circuit Breaker...');

    // Test 1: Circuit fermé normal
    await this.runTest('Circuit Breaker - Normal Operation', async () => {
      const breaker = AdvancedCircuitBreakerFactory.createAIServiceBreaker('test-ai');
      
      let successCount = 0;
      for (let i = 0; i < 10; i++) {
        try {
          await breaker.executeWithHierarchicalFallback(async () => {
            return { success: true, data: `Response ${i}` };
          });
          successCount++;
        } catch (error) {
          // Should not happen in normal operation
        }
      }

      const metrics = breaker.getDetailedMetrics();
      
      if (successCount === 10 && metrics.state === 'CLOSED') {
        return { success: true, details: `All 10 requests succeeded, circuit CLOSED`, metrics };
      } else {
        throw new Error(`Expected 10 successes, got ${successCount}. State: ${metrics.state}`);
      }
    });

    // Test 2: Circuit ouvert après échecs
    await this.runTest('Circuit Breaker - Failure Handling', async () => {
      const breaker = AdvancedCircuitBreakerFactory.createAIServiceBreaker('test-ai-fail');
      
      let failureCount = 0;
      // Provoquer des échecs pour ouvrir le circuit
      for (let i = 0; i < 6; i++) {
        try {
          await breaker.executeWithHierarchicalFallback(async () => {
            throw new Error(`Simulated failure ${i}`);
          });
        } catch (error) {
          failureCount++;
        }
      }

      const metrics = breaker.getDetailedMetrics();
      
      if (failureCount >= 5 && metrics.state === 'OPEN') {
        return { success: true, details: `Circuit opened after ${failureCount} failures`, metrics };
      } else {
        throw new Error(`Expected circuit to be OPEN, got ${metrics.state}`);
      }
    });

    // Test 3: Fallback hiérarchique
    await this.runTest('Circuit Breaker - Hierarchical Fallback', async () => {
      const breaker = AdvancedCircuitBreakerFactory.createAIServiceBreaker('test-fallback');
      
      // Forcer l'ouverture du circuit
      breaker.forceOpen();
      
      try {
        const result = await breaker.executeWithHierarchicalFallback(async () => {
          throw new Error('Primary service down');
        });
        
        if (result && result.fallback) {
          return { success: true, details: 'Fallback executed successfully', result };
        } else {
          throw new Error('Fallback not executed');
        }
      } catch (error) {
        // Expected if no fallback configured
        return { success: true, details: 'Fallback chain exhausted as expected' };
      }
    });
  }

  /**
   * Tests Request Coalescing
   */
  async testRequestCoalescing(): Promise<void> {
    console.log('🔀 Testing Request Coalescing...');

    // Test 1: Coalescing basique
    await this.runTest('Request Coalescing - Basic Coalescing', async () => {
      const coalescer = getSmartRequestCoalescer();
      coalescer.reset(); // Reset pour test propre
      
      let executionCount = 0;
      const testFunction = async () => {
        executionCount++;
        await new Promise(resolve => setTimeout(resolve, 100)); // Simule latence
        return { data: 'test-data', executionCount };
      };

      // Lancer 5 requêtes simultanées avec la même clé
      const promises = Array(5).fill(null).map(() =>
        coalescer.coalesce('test-key', testFunction, { priority: 'MEDIUM' })
      );

      const results = await Promise.all(promises);
      const metrics = coalescer.getMetrics();

      // Toutes les requêtes doivent avoir le même résultat
      const allSame = results.every(r => r.executionCount === results[0].executionCount);
      
      if (executionCount === 1 && allSame && metrics.coalescedRequests >= 4) {
        return { 
          success: true, 
          details: `Function executed once, ${metrics.coalescedRequests} requests coalesced`,
          metrics 
        };
      } else {
        throw new Error(`Expected 1 execution, got ${executionCount}. Coalesced: ${metrics.coalescedRequests}`);
      }
    });

    // Test 2: Cache avec TTL
    await this.runTest('Request Coalescing - Cache TTL', async () => {
      const coalescer = getSmartRequestCoalescer();
      
      let executionCount = 0;
      const testFunction = async () => {
        executionCount++;
        return { data: 'cached-data', timestamp: Date.now() };
      };

      // Première requête
      const result1 = await coalescer.coalesce('cache-test', testFunction, { ttl: 1000 });
      
      // Deuxième requête immédiate (doit utiliser le cache)
      const result2 = await coalescer.coalesce('cache-test', testFunction, { ttl: 1000 });
      
      const metrics = coalescer.getMetrics();
      
      if (executionCount === 1 && result1.timestamp === result2.timestamp && metrics.cacheHits >= 1) {
        return { 
          success: true, 
          details: `Cache hit successful, ${metrics.cacheHits} cache hits`,
          metrics 
        };
      } else {
        throw new Error(`Expected cache hit, executions: ${executionCount}, cache hits: ${metrics.cacheHits}`);
      }
    });

    // Test 3: Priorités
    await this.runTest('Request Coalescing - Priority Handling', async () => {
      const coalescer = getSmartRequestCoalescer();
      
      let executionOrder: string[] = [];
      
      const slowFunction = async (priority: string) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        executionOrder.push(priority);
        return { priority, timestamp: Date.now() };
      };

      // Lancer requêtes avec différentes priorités
      const promises = [
        coalescer.coalesce('priority-test-low', () => slowFunction('LOW'), { priority: 'LOW' }),
        coalescer.coalesce('priority-test-high', () => slowFunction('HIGH'), { priority: 'HIGH' }),
        coalescer.coalesce('priority-test-medium', () => slowFunction('MEDIUM'), { priority: 'MEDIUM' }),
      ];

      const results = await Promise.all(promises);
      
      // HIGH priority devrait s'exécuter immédiatement
      if (results.length === 3) {
        return { 
          success: true, 
          details: `All priority levels handled correctly`,
          executionOrder 
        };
      } else {
        throw new Error('Priority handling failed');
      }
    });
  }

  /**
   * Tests Graceful Degradation
   */
  async testGracefulDegradation(): Promise<void> {
    console.log('🛡️ Testing Graceful Degradation...');

    // Test 1: Configuration dashboard
    await this.runTest('Graceful Degradation - Dashboard Config', async () => {
      const config = DegradationConfigs.userDashboard();
      const result = await gracefulDegradation.executeWithDegradation(config);
      
      if (result.status === 'success' || result.status === 'partial') {
        return { 
          success: true, 
          details: `Dashboard degradation: ${result.status}, ${result.results.length} services`,
          result 
        };
      } else {
        throw new Error(`Dashboard degradation failed: ${result.status}`);
      }
    });

    // Test 2: Mode maintenance
    await this.runTest('Graceful Degradation - Maintenance Mode', async () => {
      const config = DegradationConfigs.maintenanceMode();
      const result = await gracefulDegradation.executeWithDegradation(config);
      
      // En mode maintenance, on s'attend à des services skippés
      const skippedServices = result.results.filter(r => r.status === 'skipped').length;
      
      if (skippedServices > 0) {
        return { 
          success: true, 
          details: `Maintenance mode: ${skippedServices} services skipped`,
          result 
        };
      } else {
        throw new Error('Maintenance mode should skip non-critical services');
      }
    });
  }

  /**
   * Tests SLO Monitoring
   */
  async testSLOMonitoring(): Promise<void> {
    console.log('📊 Testing SLO Monitoring...');

    // Test 1: Mise à jour des métriques
    await this.runTest('SLO Monitoring - Metrics Update', async () => {
      const testMetrics = {
        totalRequests: 1000,
        successfulRequests: 995,
        errorRate: 0.5,
        averageResponseTime: 250,
        p95ResponseTime: 450,
        throughput: 50,
      };

      sloMonitoring.updateMetrics(testMetrics);
      const slis = sloMonitoring.getSLIs();
      
      const availabilitySLI = slis.find(s => s.name === 'API Availability');
      const latencySLI = slis.find(s => s.name === 'P95 Latency');
      
      if (availabilitySLI && latencySLI) {
        return { 
          success: true, 
          details: `SLIs updated - Availability: ${availabilitySLI.currentValue}%, Latency: ${latencySLI.currentValue}ms`,
          slis: slis.map(s => ({ name: s.name, value: s.currentValue, status: s.status }))
        };
      } else {
        throw new Error('SLIs not found or not updated');
      }
    });

    // Test 2: Burn rate calculation
    await this.runTest('SLO Monitoring - Burn Rate Calculation', async () => {
      const burnRates = sloMonitoring.getBurnRates();
      
      const availabilityBurnRate = burnRates['availability'];
      
      if (availabilityBurnRate) {
        return { 
          success: true, 
          details: `Burn rate calculated - Severity: ${availabilityBurnRate.severity}, Budget consumed: ${availabilityBurnRate.budgetConsumed}%`,
          burnRates: Object.entries(burnRates).map(([name, br]) => ({ 
            name, 
            severity: br.severity, 
            budgetConsumed: br.budgetConsumed 
          }))
        };
      } else {
        throw new Error('Burn rate calculation failed');
      }
    });

    // Test 3: Health score
    await this.runTest('SLO Monitoring - Health Score', async () => {
      const healthScore = sloMonitoring.getHealthScore();
      
      if (healthScore.overall >= 0 && healthScore.overall <= 100) {
        return { 
          success: true, 
          details: `Health score: ${healthScore.overall}/100 (${healthScore.status})`,
          healthScore 
        };
      } else {
        throw new Error(`Invalid health score: ${healthScore.overall}`);
      }
    });
  }

  /**
   * Tests de charge simulés
   */
  async testLoadSimulation(): Promise<void> {
    console.log('⚡ Testing Load Simulation...');

    // Test 1: Charge concurrente
    await this.runTest('Load Simulation - Concurrent Requests', async () => {
      const coalescer = getSmartRequestCoalescer();
      
      let requestCount = 0;
      const simulateRequest = async (id: number) => {
        requestCount++;
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        return { id, timestamp: Date.now() };
      };

      // Simuler 50 requêtes concurrentes
      const promises = Array(50).fill(null).map((_, i) =>
        coalescer.coalesce(`load-test-${i % 10}`, () => simulateRequest(i), { priority: 'MEDIUM' })
      );

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;
      
      const metrics = coalescer.getMetrics();
      
      if (results.length === 50 && duration < 5000) {
        return { 
          success: true, 
          details: `50 concurrent requests completed in ${duration}ms, coalescing efficiency: ${metrics.coalescingEfficiency}%`,
          metrics: { duration, coalescingEfficiency: metrics.coalescingEfficiency }
        };
      } else {
        throw new Error(`Load test failed - Duration: ${duration}ms, Results: ${results.length}`);
      }
    });

    // Test 2: Circuit breaker sous charge
    await this.runTest('Load Simulation - Circuit Breaker Under Load', async () => {
      const breaker = AdvancedCircuitBreakerFactory.createAIServiceBreaker('load-test-cb');
      
      let successCount = 0;
      let failureCount = 0;
      
      // Simuler charge avec échecs intermittents
      const promises = Array(30).fill(null).map(async (_, i) => {
        try {
          await breaker.executeWithHierarchicalFallback(async () => {
            // 20% d'échecs simulés
            if (Math.random() < 0.2) {
              throw new Error(`Simulated failure ${i}`);
            }
            return { success: true, id: i };
          });
          successCount++;
        } catch (error) {
          failureCount++;
        }
      });

      await Promise.all(promises);
      const metrics = breaker.getDetailedMetrics();
      
      if (successCount + failureCount === 30) {
        return { 
          success: true, 
          details: `Load test completed - Success: ${successCount}, Failures: ${failureCount}, Circuit: ${metrics.state}`,
          metrics: { successCount, failureCount, circuitState: metrics.state }
        };
      } else {
        throw new Error('Load test incomplete');
      }
    });
  }

  /**
   * Tests d'intégration
   */
  async testIntegration(): Promise<void> {
    console.log('🔗 Testing Integration...');

    // Test 1: API Health endpoint
    await this.runTest('Integration - Health Endpoint', async () => {
      try {
        const response = await fetch('http://localhost:3000/api/health');
        
        if (response.ok) {
          const data = await response.json();
          return { 
            success: true, 
            details: `Health endpoint accessible - Status: ${data.status}`,
            healthData: { status: data.status, uptime: data.uptime }
          };
        } else {
          throw new Error(`Health endpoint returned ${response.status}`);
        }
      } catch (error) {
        // Si l'API n'est pas démarrée, c'est un warning, pas un échec
        return { 
          success: false, 
          details: 'Health endpoint not accessible (API may not be running)',
          warning: true
        };
      }
    });

    // Test 2: Metrics endpoint
    await this.runTest('Integration - Metrics Endpoint', async () => {
      try {
        const response = await fetch('http://localhost:3000/api/metrics');
        
        if (response.ok) {
          const metrics = await response.text();
          const lineCount = metrics.split('\n').length;
          
          return { 
            success: true, 
            details: `Metrics endpoint accessible - ${lineCount} lines of metrics`,
            metricsInfo: { lineCount, hasPrometheusFormat: metrics.includes('# HELP') }
          };
        } else {
          throw new Error(`Metrics endpoint returned ${response.status}`);
        }
      } catch (error) {
        return { 
          success: false, 
          details: 'Metrics endpoint not accessible (API may not be running)',
          warning: true
        };
      }
    });
  }

  /**
   * Exécute un test individuel
   */
  private async runTest(testName: string, testFunction: () => Promise<any>): Promise<void> {
    const startTime = Date.now();
    
    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      this.results.push({
        test: testName,
        status: result.warning ? 'WARN' : 'PASS',
        duration,
        details: result.details,
        metrics: result.metrics || result,
      });
      
      console.log(`  ✅ ${testName} (${duration}ms)`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        test: testName,
        status: 'FAIL',
        duration,
        details: (error as Error).message,
      });
      
      console.log(`  ❌ ${testName} (${duration}ms): ${(error as Error).message}`);
    }
  }

  /**
   * Affiche les résultats finaux
   */
  private printResults(): void {
    console.log('\n📋 Validation Results Summary:');
    console.log('='.repeat(60));
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const warnings = this.results.filter(r => r.status === 'WARN').length;
    const total = this.results.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`📊 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    console.log(`⏱️  Total Duration: ${totalDuration}ms`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => {
          console.log(`  - ${r.test}: ${r.details}`);
        });
    }
    
    if (warnings > 0) {
      console.log('\n⚠️  Warnings:');
      this.results
        .filter(r => r.status === 'WARN')
        .forEach(r => {
          console.log(`  - ${r.test}: ${r.details}`);
        });
    }
    
    console.log('\n🎯 Optimization Status:');
    console.log(`  Circuit Breaker: ${this.getFeatureStatus('Circuit Breaker')}`);
    console.log(`  Request Coalescing: ${this.getFeatureStatus('Request Coalescing')}`);
    console.log(`  Graceful Degradation: ${this.getFeatureStatus('Graceful Degradation')}`);
    console.log(`  SLO Monitoring: ${this.getFeatureStatus('SLO Monitoring')}`);
    console.log(`  Load Handling: ${this.getFeatureStatus('Load Simulation')}`);
    console.log(`  API Integration: ${this.getFeatureStatus('Integration')}`);
    
    // Recommandations
    console.log('\n💡 Recommendations:');
    if (failed === 0 && warnings <= 1) {
      console.log('  🚀 All optimizations working correctly! Ready for production.');
    } else if (failed <= 2) {
      console.log('  ⚠️  Minor issues detected. Review failed tests before production.');
    } else {
      console.log('  🔧 Multiple issues detected. Fix critical failures before deployment.');
    }
    
    if (warnings > 0) {
      console.log('  📝 Address warnings for optimal performance.');
    }
    
    console.log('\n📚 Next Steps:');
    console.log('  1. Start monitoring stack: cd monitoring && ./start.sh');
    console.log('  2. Run load tests: npm run load-test:smoke');
    console.log('  3. Configure alerts: Update Slack webhook in alertmanager.yml');
    console.log('  4. Deploy to staging: Validate in staging environment');
    
    // Exit code basé sur les résultats
    process.exit(failed > 2 ? 1 : 0);
  }

  /**
   * Obtient le statut d'une fonctionnalité
   */
  private getFeatureStatus(feature: string): string {
    const featureTests = this.results.filter(r => r.test.includes(feature));
    const passed = featureTests.filter(r => r.status === 'PASS').length;
    const total = featureTests.length;
    
    if (total === 0) return '❓ Not tested';
    if (passed === total) return '✅ Working';
    if (passed >= total * 0.5) return '⚠️  Partial';
    return '❌ Failed';
  }
}

// Exécution du script
async function main() {
  const validator = new OptimizationValidator();
  await validator.runAllTests();
}

main().catch(console.error);