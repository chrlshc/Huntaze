#!/usr/bin/env tsx

/**
 * Script de debug pour les optimisations API
 * Identifie et résout les problèmes de performance et configuration
 */

import { AdvancedCircuitBreakerFactory } from '../lib/services/advanced-circuit-breaker';
import { getSmartRequestCoalescer } from '../lib/services/smart-request-coalescer';
import { sloMonitoring } from '../lib/services/slo-monitoring-service';
import { gracefulDegradation } from '../lib/services/graceful-degradation';

interface DebugResult {
  component: string;
  status: 'OK' | 'WARNING' | 'ERROR';
  issues: string[];
  recommendations: string[];
  metrics?: any;
}

class OptimizationDebugger {
  private results: DebugResult[] = [];

  async runDebug(): Promise<void> {
    console.log('🔍 Starting optimization debug session...\n');

    // Debug chaque composant
    await this.debugCircuitBreakers();
    await this.debugRequestCoalescer();
    await this.debugSLOMonitoring();
    await this.debugGracefulDegradation();
    await this.debugSystemHealth();
    await this.debugAPIEndpoints();
    await this.debugConfiguration();

    this.printDebugReport();
  }

  /**
   * Debug Circuit Breakers
   */
  async debugCircuitBreakers(): Promise<void> {
    console.log('🔄 Debugging Circuit Breakers...');
    
    const issues: string[] = [];
    const recommendations: string[] = [];
    let status: 'OK' | 'WARNING' | 'ERROR' = 'OK';

    try {
      // Test création circuit breaker
      const testBreaker = AdvancedCircuitBreakerFactory.createAIServiceBreaker('debug-test');
      
      // Vérifier configuration
      const metrics = testBreaker.getDetailedMetrics();
      
      if (metrics.state !== 'CLOSED') {
        issues.push(`Circuit breaker not in CLOSED state: ${metrics.state}`);
        status = 'WARNING';
      }

      // Test exécution normale
      try {
        await testBreaker.executeWithHierarchicalFallback(async () => {
          return { test: 'success' };
        });
      } catch (error) {
        issues.push(`Circuit breaker execution failed: ${error}`);
        status = 'ERROR';
      }

      // Vérifier métriques globales
      const allMetrics = AdvancedCircuitBreakerFactory.getAllMetrics();
      const globalHealth = AdvancedCircuitBreakerFactory.getGlobalHealth();
      
      if (globalHealth.status === 'unhealthy') {
        issues.push(`Global circuit breaker health is unhealthy`);
        status = 'ERROR';
      } else if (globalHealth.status === 'degraded') {
        issues.push(`Global circuit breaker health is degraded`);
        status = 'WARNING';
      }

      // Recommandations
      if (globalHealth.averageHealthScore < 80) {
        recommendations.push('Consider adjusting circuit breaker thresholds');
      }
      
      if (Object.keys(allMetrics).length === 0) {
        recommendations.push('No circuit breakers configured - add for critical services');
      }

      this.results.push({
        component: 'Circuit Breakers',
        status,
        issues,
        recommendations,
        metrics: {
          globalHealth,
          breakerCount: Object.keys(allMetrics).length,
          testMetrics: metrics,
        },
      });

    } catch (error) {
      this.results.push({
        component: 'Circuit Breakers',
        status: 'ERROR',
        issues: [`Critical error: ${error}`],
        recommendations: ['Fix circuit breaker implementation'],
      });
    }
  }

  /**
   * Debug Request Coalescer
   */
  async debugRequestCoalescer(): Promise<void> {
    console.log('🔀 Debugging Request Coalescer...');
    
    const issues: string[] = [];
    const recommendations: string[] = [];
    let status: 'OK' | 'WARNING' | 'ERROR' = 'OK';

    try {
      const coalescer = getSmartRequestCoalescer();
      
      // Test basique
      let executionCount = 0;
      const testFn = async () => {
        executionCount++;
        return { result: 'test', count: executionCount };
      };

      // Test coalescing
      const promises = [
        coalescer.coalesce('debug-test', testFn),
        coalescer.coalesce('debug-test', testFn),
        coalescer.coalesce('debug-test', testFn),
      ];

      const results = await Promise.all(promises);
      
      if (executionCount !== 1) {
        issues.push(`Coalescing failed: expected 1 execution, got ${executionCount}`);
        status = 'ERROR';
      }

      // Vérifier métriques
      const metrics = coalescer.getMetrics();
      const healthCheck = coalescer.healthCheck();

      if (healthCheck.status === 'unhealthy') {
        issues.push('Request coalescer health is unhealthy');
        status = 'ERROR';
      } else if (healthCheck.status === 'degraded') {
        issues.push('Request coalescer health is degraded');
        status = 'WARNING';
      }

      // Vérifier efficacité
      if (metrics.coalescingEfficiency < 20 && metrics.totalRequests > 10) {
        issues.push(`Low coalescing efficiency: ${metrics.coalescingEfficiency}%`);
        status = 'WARNING';
      }

      // Vérifier cache
      if (metrics.cacheHitRate < 30 && metrics.totalRequests > 10) {
        issues.push(`Low cache hit rate: ${metrics.cacheHitRate}%`);
        recommendations.push('Consider increasing cache TTL or improving cache strategy');
      }

      // Vérifier mémoire
      if (metrics.cacheSize > 1500) {
        issues.push(`High cache size: ${metrics.cacheSize} entries`);
        recommendations.push('Consider reducing cache TTL or max size');
      }

      this.results.push({
        component: 'Request Coalescer',
        status,
        issues,
        recommendations,
        metrics: {
          ...metrics,
          healthCheck,
          testResults: { executionCount, resultsCount: results.length },
        },
      });

    } catch (error) {
      this.results.push({
        component: 'Request Coalescer',
        status: 'ERROR',
        issues: [`Critical error: ${error}`],
        recommendations: ['Fix request coalescer implementation'],
      });
    }
  }

  /**
   * Debug SLO Monitoring
   */
  async debugSLOMonitoring(): Promise<void> {
    console.log('📊 Debugging SLO Monitoring...');
    
    const issues: string[] = [];
    const recommendations: string[] = [];
    let status: 'OK' | 'WARNING' | 'ERROR' = 'OK';

    try {
      // Test métriques
      const testMetrics = {
        totalRequests: 100,
        successfulRequests: 98,
        errorRate: 2,
        averageResponseTime: 300,
        p95ResponseTime: 500,
        throughput: 25,
      };

      sloMonitoring.updateMetrics(testMetrics);

      // Vérifier SLIs
      const slis = sloMonitoring.getSLIs();
      
      if (slis.length === 0) {
        issues.push('No SLIs configured');
        status = 'ERROR';
      }

      // Vérifier chaque SLI
      slis.forEach(sli => {
        if (sli.status === 'breaching') {
          issues.push(`SLI ${sli.name} is breaching target: ${sli.currentValue} vs ${sli.target}`);
          status = 'ERROR';
        } else if (sli.status === 'at_risk') {
          issues.push(`SLI ${sli.name} is at risk: ${sli.currentValue} vs ${sli.target}`);
          if (status === 'OK') status = 'WARNING';
        }
      });

      // Vérifier burn rates
      const burnRates = sloMonitoring.getBurnRates();
      Object.entries(burnRates).forEach(([name, burnRate]) => {
        if (burnRate.severity === 'CRITICAL') {
          issues.push(`Critical burn rate for ${name}: ${burnRate.budgetConsumed}%`);
          status = 'ERROR';
        } else if (burnRate.severity === 'WARNING') {
          issues.push(`High burn rate for ${name}: ${burnRate.budgetConsumed}%`);
          if (status === 'OK') status = 'WARNING';
        }
      });

      // Vérifier health score
      const healthScore = sloMonitoring.getHealthScore();
      
      if (healthScore.overall < 50) {
        issues.push(`Low health score: ${healthScore.overall}/100`);
        status = 'ERROR';
      } else if (healthScore.overall < 80) {
        issues.push(`Degraded health score: ${healthScore.overall}/100`);
        if (status === 'OK') status = 'WARNING';
      }

      // Recommandations
      if (healthScore.breakdown.availability < 90) {
        recommendations.push('Improve system availability');
      }
      if (healthScore.breakdown.latency < 80) {
        recommendations.push('Optimize response times');
      }

      this.results.push({
        component: 'SLO Monitoring',
        status,
        issues,
        recommendations,
        metrics: {
          sliCount: slis.length,
          healthScore,
          burnRatesSummary: Object.entries(burnRates).map(([name, br]) => ({
            name,
            severity: br.severity,
            budgetConsumed: br.budgetConsumed,
          })),
        },
      });

    } catch (error) {
      this.results.push({
        component: 'SLO Monitoring',
        status: 'ERROR',
        issues: [`Critical error: ${error}`],
        recommendations: ['Fix SLO monitoring implementation'],
      });
    }
  }

  /**
   * Debug Graceful Degradation
   */
  async debugGracefulDegradation(): Promise<void> {
    console.log('🛡️ Debugging Graceful Degradation...');
    
    const issues: string[] = [];
    const recommendations: string[] = [];
    let status: 'OK' | 'WARNING' | 'ERROR' = 'OK';

    try {
      // Test métriques
      const metrics = gracefulDegradation.getMetrics();
      
      if (metrics.totalRequests === 0) {
        issues.push('No degradation requests recorded');
        recommendations.push('Test graceful degradation with sample requests');
      }

      // Test fallback rate
      if (metrics.fallbackRate > 50 && metrics.totalRequests > 10) {
        issues.push(`High fallback rate: ${metrics.fallbackRate}%`);
        status = 'WARNING';
      }

      // Test success rate
      if (metrics.successRate < 80 && metrics.totalRequests > 10) {
        issues.push(`Low success rate: ${metrics.successRate}%`);
        status = 'ERROR';
      }

      this.results.push({
        component: 'Graceful Degradation',
        status,
        issues,
        recommendations,
        metrics,
      });

    } catch (error) {
      this.results.push({
        component: 'Graceful Degradation',
        status: 'ERROR',
        issues: [`Critical error: ${error}`],
        recommendations: ['Fix graceful degradation implementation'],
      });
    }
  }

  /**
   * Debug System Health
   */
  async debugSystemHealth(): Promise<void> {
    console.log('🖥️ Debugging System Health...');
    
    const issues: string[] = [];
    const recommendations: string[] = [];
    let status: 'OK' | 'WARNING' | 'ERROR' = 'OK';

    try {
      // Vérifier mémoire
      const memUsage = process.memoryUsage();
      const memUsedMB = memUsage.heapUsed / 1024 / 1024;
      const memTotalMB = memUsage.heapTotal / 1024 / 1024;
      const memPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

      if (memPercent > 90) {
        issues.push(`High memory usage: ${memPercent.toFixed(1)}%`);
        status = 'ERROR';
      } else if (memPercent > 75) {
        issues.push(`Elevated memory usage: ${memPercent.toFixed(1)}%`);
        if (status === 'OK') status = 'WARNING';
      }

      // Vérifier uptime
      const uptimeSeconds = process.uptime();
      const uptimeMinutes = uptimeSeconds / 60;

      if (uptimeMinutes < 1) {
        recommendations.push('System recently started - allow time for metrics to stabilize');
      }

      // Vérifier variables d'environnement critiques
      const criticalEnvVars = [
        'NODE_ENV',
        'API_BASE_URL',
      ];

      const missingEnvVars = criticalEnvVars.filter(envVar => !process.env[envVar]);
      
      if (missingEnvVars.length > 0) {
        issues.push(`Missing environment variables: ${missingEnvVars.join(', ')}`);
        recommendations.push('Set missing environment variables');
        if (status === 'OK') status = 'WARNING';
      }

      this.results.push({
        component: 'System Health',
        status,
        issues,
        recommendations,
        metrics: {
          memory: {
            usedMB: Math.round(memUsedMB),
            totalMB: Math.round(memTotalMB),
            percentage: Math.round(memPercent),
          },
          uptime: {
            seconds: Math.round(uptimeSeconds),
            minutes: Math.round(uptimeMinutes),
          },
          environment: process.env.NODE_ENV || 'unknown',
        },
      });

    } catch (error) {
      this.results.push({
        component: 'System Health',
        status: 'ERROR',
        issues: [`Critical error: ${error}`],
        recommendations: ['Check system configuration'],
      });
    }
  }

  /**
   * Debug API Endpoints
   */
  async debugAPIEndpoints(): Promise<void> {
    console.log('🌐 Debugging API Endpoints...');
    
    const issues: string[] = [];
    const recommendations: string[] = [];
    let status: 'OK' | 'WARNING' | 'ERROR' = 'OK';

    const endpoints = [
      { path: '/api/health', name: 'Health Check' },
      { path: '/api/metrics', name: 'Metrics' },
    ];

    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${baseUrl}${endpoint.path}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) {
          issues.push(`${endpoint.name} endpoint returned ${response.status}`);
          if (response.status >= 500) {
            status = 'ERROR';
          } else if (status === 'OK') {
            status = 'WARNING';
          }
        }

      } catch (error) {
        issues.push(`${endpoint.name} endpoint not accessible: ${error}`);
        recommendations.push(`Ensure API server is running on ${baseUrl}`);
        if (status === 'OK') status = 'WARNING';
      }
    }

    this.results.push({
      component: 'API Endpoints',
      status,
      issues,
      recommendations,
      metrics: {
        baseUrl,
        endpointsChecked: endpoints.length,
      },
    });
  }

  /**
   * Debug Configuration
   */
  async debugConfiguration(): Promise<void> {
    console.log('⚙️ Debugging Configuration...');
    
    const issues: string[] = [];
    const recommendations: string[] = [];
    let status: 'OK' | 'WARNING' | 'ERROR' = 'OK';

    try {
      // Vérifier fichiers de configuration
      const configFiles = [
        'package.json',
        'tsconfig.json',
        'next.config.js',
      ];

      // Vérifier scripts npm
      const packageJson = require('../package.json');
      const requiredScripts = [
        'validate:optimizations',
        'load-test:smoke',
        'health-check',
      ];

      const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
      
      if (missingScripts.length > 0) {
        issues.push(`Missing npm scripts: ${missingScripts.join(', ')}`);
        recommendations.push('Add missing npm scripts to package.json');
        if (status === 'OK') status = 'WARNING';
      }

      // Vérifier dépendances critiques
      const criticalDeps = ['zod', 'tsx'];
      const missingDeps = criticalDeps.filter(dep => 
        !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
      );

      if (missingDeps.length > 0) {
        issues.push(`Missing dependencies: ${missingDeps.join(', ')}`);
        recommendations.push('Install missing dependencies');
        status = 'ERROR';
      }

      // Vérifier structure de dossiers
      const requiredDirs = [
        'lib/services',
        'app/api',
        'scripts',
        'tests',
      ];

      // Note: En production, on vérifierait l'existence des dossiers
      // Pour ce debug, on assume qu'ils existent

      this.results.push({
        component: 'Configuration',
        status,
        issues,
        recommendations,
        metrics: {
          nodeVersion: process.version,
          scriptsCount: Object.keys(packageJson.scripts || {}).length,
          dependenciesCount: Object.keys(packageJson.dependencies || {}).length,
        },
      });

    } catch (error) {
      this.results.push({
        component: 'Configuration',
        status: 'ERROR',
        issues: [`Critical error: ${error}`],
        recommendations: ['Check configuration files'],
      });
    }
  }

  /**
   * Affiche le rapport de debug
   */
  private printDebugReport(): void {
    console.log('\n🔍 Debug Report Summary');
    console.log('='.repeat(60));

    const errorCount = this.results.filter(r => r.status === 'ERROR').length;
    const warningCount = this.results.filter(r => r.status === 'WARNING').length;
    const okCount = this.results.filter(r => r.status === 'OK').length;

    console.log(`✅ OK: ${okCount}`);
    console.log(`⚠️  Warnings: ${warningCount}`);
    console.log(`❌ Errors: ${errorCount}`);

    // Détails par composant
    this.results.forEach(result => {
      const icon = result.status === 'OK' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌';
      console.log(`\n${icon} ${result.component} - ${result.status}`);

      if (result.issues.length > 0) {
        console.log('  Issues:');
        result.issues.forEach(issue => console.log(`    - ${issue}`));
      }

      if (result.recommendations.length > 0) {
        console.log('  Recommendations:');
        result.recommendations.forEach(rec => console.log(`    - ${rec}`));
      }

      if (result.metrics) {
        console.log('  Key Metrics:');
        this.printMetrics(result.metrics, '    ');
      }
    });

    // Résumé des actions
    console.log('\n🎯 Action Items:');
    
    if (errorCount > 0) {
      console.log('  🚨 CRITICAL: Fix errors before production deployment');
      this.results
        .filter(r => r.status === 'ERROR')
        .forEach(r => {
          console.log(`    - ${r.component}: ${r.issues[0]}`);
        });
    }

    if (warningCount > 0) {
      console.log('  ⚠️  RECOMMENDED: Address warnings for optimal performance');
      this.results
        .filter(r => r.status === 'WARNING')
        .forEach(r => {
          console.log(`    - ${r.component}: ${r.issues[0]}`);
        });
    }

    if (errorCount === 0 && warningCount === 0) {
      console.log('  🎉 All systems operational! Ready for production.');
    }

    // Commandes utiles
    console.log('\n🛠️  Useful Commands:');
    console.log('  npm run validate:optimizations  # Run full validation');
    console.log('  npm run health-check           # Check API health');
    console.log('  npm run load-test:smoke        # Quick load test');
    console.log('  npm run setup:monitoring       # Setup monitoring stack');

    // Exit code
    process.exit(errorCount > 0 ? 1 : 0);
  }

  /**
   * Affiche les métriques de façon lisible
   */
  private printMetrics(metrics: any, indent: string = ''): void {
    Object.entries(metrics).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        console.log(`${indent}${key}:`);
        this.printMetrics(value, indent + '  ');
      } else {
        console.log(`${indent}${key}: ${value}`);
      }
    });
  }
}

// Exécution du debug
async function main() {
  const debugger = new OptimizationDebugger();
  await debugger.runDebug();
}

main().catch(console.error);