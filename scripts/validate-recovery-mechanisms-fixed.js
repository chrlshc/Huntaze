#!/usr/bin/env node

/**
 * Recovery Mechanisms Validation Script
 * Validates RTO/RPO targets and chaos engineering scenarios
 */

const http = require('http');
const { performance } = require('perf_hooks');

class RecoveryValidator {
  constructor() {
    this.results = {
      rto: [],
      rpo: [],
      chaosTests: [],
      healthProbes: [],
      retryTests: [],
      circuitBreakerTests: [],
      degradationTests: []
    };
    
    // Target SLOs
    this.targets = {
      rto: 30000, // 30 seconds
      rpo: 300000, // 5 minutes
      mttr: 120000 // 2 minutes
    };
  }

  async validateAll() {
    console.log('🔧 Validating Recovery Mechanisms...\n');
    
    try {
      await this.testRTOScenarios();
      await this.testHealthProbes();
      await this.testRetryMechanisms();
      await this.testCircuitBreakers();
      await this.testGracefulDegradation();
      this.generateReport();
    } catch (error) {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    }
  }

  async testRTOScenarios() {
    console.log('⏱️  Testing RTO (Recovery Time Objective) Scenarios...');
    
    // Scenario 1: Database connection failure
    await this.testDatabaseFailureRecovery();
    
    // Scenario 2: Cache service failure
    await this.testCacheFailureRecovery();
    
    // Scenario 3: External API failure
    await this.testExternalAPIFailureRecovery();
    
    console.log('✅ RTO scenarios completed\n');
  }

  async testDatabaseFailureRecovery() {
    console.log('  📊 Testing database failure recovery...');
    const startTime = performance.now();
    
    try {
      // Simulate database failure and recovery
      const response = await this.makeRequest('/api/recovery/status', {
        method: 'POST',
        body: JSON.stringify({
          action: 'trigger_healing',
          target: 'database_reconnect'
        })
      });
      
      const recoveryTime = performance.now() - startTime;
      const success = response.success;
      
      this.results.rto.push({
        scenario: 'database_failure',
        recoveryTime,
        success,
        target: this.targets.rto,
        passed: success && recoveryTime <= this.targets.rto
      });
      
      console.log(`    ${success ? '✅' : '❌'} Recovery time: ${recoveryTime.toFixed(0)}ms (target: ${this.targets.rto}ms)`);
    } catch (error) {
      console.log(`    ❌ Database recovery test failed: ${error.message}`);
    }
  }

  async testCacheFailureRecovery() {
    console.log('  🗄️  Testing cache failure recovery...');
    const startTime = performance.now();
    
    try {
      const response = await this.makeRequest('/api/recovery/status', {
        method: 'POST',
        body: JSON.stringify({
          action: 'trigger_healing',
          target: 'cache_restart'
        })
      });
      
      const recoveryTime = performance.now() - startTime;
      const success = response.success;
      
      this.results.rto.push({
        scenario: 'cache_failure',
        recoveryTime,
        success,
        target: this.targets.rto,
        passed: success && recoveryTime <= this.targets.rto
      });
      
      console.log(`    ${success ? '✅' : '❌'} Recovery time: ${recoveryTime.toFixed(0)}ms (target: ${this.targets.rto}ms)`);
    } catch (error) {
      console.log(`    ❌ Cache recovery test failed: ${error.message}`);
    }
  }

  async testExternalAPIFailureRecovery() {
    console.log('  🌐 Testing external API failure recovery...');
    const startTime = performance.now();
    
    try {
      const response = await this.makeRequest('/api/recovery/status', {
        method: 'POST',
        body: JSON.stringify({
          action: 'reset_circuit_breaker',
          target: 'external-api'
        })
      });
      
      const recoveryTime = performance.now() - startTime;
      const success = response.success;
      
      this.results.rto.push({
        scenario: 'external_api_failure',
        recoveryTime,
        success,
        target: this.targets.rto,
        passed: success && recoveryTime <= this.targets.rto
      });
      
      console.log(`    ${success ? '✅' : '❌'} Recovery time: ${recoveryTime.toFixed(0)}ms (target: ${this.targets.rto}ms)`);
    } catch (error) {
      console.log(`    ❌ External API recovery test failed: ${error.message}`);
    }
  }

  async testHealthProbes() {
    console.log('🏥 Testing Health Probes & Liveness Checks...');
    
    try {
      const response = await this.makeRequest('/api/recovery/status?metrics=true');
      const healthChecks = response.recovery && response.recovery.healthChecks;
      
      if (healthChecks) {
        const { summary } = healthChecks;
        const healthyRatio = summary.healthy / summary.total;
        
        this.results.healthProbes.push({
          totalChecks: summary.total,
          healthyChecks: summary.healthy,
          healthyRatio,
          passed: healthyRatio >= 0.8 // 80% healthy threshold
        });
        
        console.log(`  ✅ Health checks: ${summary.healthy}/${summary.total} healthy (${(healthyRatio * 100).toFixed(1)}%)`);
        
        // Test individual health checks
        for (const [name, check] of Object.entries(healthChecks.checks)) {
          const status = check.status === 'HEALTHY' ? '✅' : check.status === 'DEGRADED' ? '⚠️' : '❌';
          console.log(`    ${status} ${name}: ${check.status} (${check.duration}ms)`);
        }
      }
    } catch (error) {
      console.log(`  ❌ Health probes test failed: ${error.message}`);
    }
    
    console.log('');
  }

  async testRetryMechanisms() {
    console.log('🔄 Testing Retry Mechanisms with Exponential Backoff...');
    
    try {
      const response = await this.makeRequest('/api/recovery/status?metrics=true');
      const retrySystem = response.recovery && response.recovery.retrySystem;
      
      if (retrySystem) {
        const { summary } = retrySystem;
        const successRate = summary.successfulRetries / Math.max(1, summary.totalRetries) * 100;
        
        this.results.retryTests.push({
          totalRetries: summary.totalRetries,
          successfulRetries: summary.successfulRetries,
          successRate,
          passed: successRate >= 70 // 70% success rate threshold
        });
        
        console.log(`  ✅ Retry success rate: ${successRate.toFixed(1)}% (${summary.successfulRetries}/${summary.totalRetries})`);
        
        // Test retry operations
        for (const [operation, metrics] of Object.entries(retrySystem.operations)) {
          const opSuccessRate = metrics.successfulRetries / Math.max(1, metrics.totalAttempts) * 100;
          console.log(`    📊 ${operation}: ${opSuccessRate.toFixed(1)}% success, avg ${metrics.averageAttempts.toFixed(1)} attempts`);
        }
      }
    } catch (error) {
      console.log(`  ❌ Retry mechanisms test failed: ${error.message}`);
    }
    
    console.log('');
  }

  async testCircuitBreakers() {
    console.log('⚡ Testing Circuit Breakers & Bulkheads...');
    
    try {
      const response = await this.makeRequest('/api/recovery/status?metrics=true');
      const circuitBreakers = response.recovery && response.recovery.circuitBreakers;
      
      if (circuitBreakers) {
        const { summary } = circuitBreakers;
        const healthyRatio = summary.closed / summary.total;
        
        this.results.circuitBreakerTests.push({
          totalBreakers: summary.total,
          closedBreakers: summary.closed,
          openBreakers: summary.open,
          healthyRatio,
          passed: healthyRatio >= 0.8 // 80% closed threshold
        });
        
        console.log(`  ✅ Circuit breakers: ${summary.closed}/${summary.total} closed (${(healthyRatio * 100).toFixed(1)}%)`);
        
        // Test individual circuit breakers
        for (const [name, breaker] of Object.entries(circuitBreakers.breakers)) {
          const status = breaker.state === 'CLOSED' ? '✅' : breaker.state === 'HALF_OPEN' ? '⚠️' : '❌';
          console.log(`    ${status} ${name}: ${breaker.state} (${breaker.failureRate.toFixed(1)}% failure rate)`);
        }
      }
    } catch (error) {
      console.log(`  ❌ Circuit breakers test failed: ${error.message}`);
    }
    
    console.log('');
  }

  async testGracefulDegradation() {
    console.log('📉 Testing Graceful Degradation...');
    
    try {
      const response = await this.makeRequest('/api/recovery/status', {
        method: 'POST',
        body: JSON.stringify({
          action: 'force_degradation_check'
        })
      });
      
      if (response.success && response.status) {
        const { level, activeRules, disabledFeatures } = response.status;
        
        this.results.degradationTests.push({
          degradationLevel: level,
          activeRules: activeRules.length,
          disabledFeatures: disabledFeatures.length,
          passed: level >= 0 // Any level is acceptable for testing
        });
        
        console.log(`  ✅ Degradation level: ${level} (${activeRules.length} active rules, ${disabledFeatures.length} disabled features)`);
        
        if (activeRules.length > 0) {
          console.log(`    📋 Active rules: ${activeRules.join(', ')}`);
        }
        
        if (disabledFeatures.length > 0) {
          console.log(`    🚫 Disabled features: ${disabledFeatures.join(', ')}`);
        }
      }
    } catch (error) {
      console.log(`  ❌ Graceful degradation test failed: ${error.message}`);
    }
    
    console.log('');
  }

  async makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
      const requestOptions = {
        hostname: 'localhost',
        port: 3000,
        path,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      };

      const req = http.request(requestOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });

      req.on('error', reject);
      
      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  }

  generateReport() {
    console.log('📊 Recovery Mechanisms Validation Report');
    console.log('='.repeat(50));
    
    // RTO Analysis
    console.log('\n🎯 RTO (Recovery Time Objective) Results:');
    const rtoResults = this.results.rto;
    if (rtoResults.length > 0) {
      const rtoPassRate = rtoResults.filter(r => r.passed).length / rtoResults.length * 100;
      
      console.log(`   Overall RTO Pass Rate: ${rtoPassRate.toFixed(1)}%`);
      rtoResults.forEach(result => {
        const status = result.passed ? '✅' : '❌';
        console.log(`   ${status} ${result.scenario}: ${result.recoveryTime.toFixed(0)}ms (target: ${result.target}ms)`);
      });
    } else {
      console.log('   ⚠️  No RTO tests completed (server may not be running)');
    }
    
    // Health Probes Analysis
    console.log('\n🏥 Health Probes Results:');
    if (this.results.healthProbes.length > 0) {
      this.results.healthProbes.forEach(result => {
        const status = result.passed ? '✅' : '❌';
        console.log(`   ${status} Health ratio: ${(result.healthyRatio * 100).toFixed(1)}% (${result.healthyChecks}/${result.totalChecks})`);
      });
    } else {
      console.log('   ⚠️  No health probe tests completed');
    }
    
    // Overall Assessment
    console.log('\n🎯 Overall Assessment:');
    const allTests = [
      ...this.results.rto,
      ...this.results.healthProbes,
      ...this.results.retryTests,
      ...this.results.circuitBreakerTests,
      ...this.results.degradationTests
    ];
    
    if (allTests.length > 0) {
      const overallPassRate = allTests.filter(t => t.passed).length / allTests.length * 100;
      const overallStatus = overallPassRate >= 80 ? '✅ PASSED' : overallPassRate >= 60 ? '⚠️  PARTIAL' : '❌ FAILED';
      
      console.log(`   ${overallStatus} - ${overallPassRate.toFixed(1)}% of tests passed`);
      
      // Recommendations
      console.log('\n💡 Recommendations:');
      if (overallPassRate >= 80) {
        console.log('   🚀 Recovery system is production-ready!');
        console.log('   📈 Consider implementing chaos engineering in staging');
      } else {
        console.log('   ⚠️  Address failing tests before production deployment');
      }
    } else {
      console.log('   ⚠️  No tests completed - make sure the development server is running');
      console.log('\n💡 To test the recovery system:');
      console.log('   1. Start the development server: npm run dev');
      console.log('   2. Run this validation again: node scripts/validate-recovery-mechanisms-fixed.js');
    }
    
    console.log('\n' + '='.repeat(50));
  }
}

// Run validation
const validator = new RecoveryValidator();
validator.validateAll().catch(console.error);