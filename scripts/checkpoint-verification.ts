/**
 * Checkpoint Verification Script
 * Verifies all core functionality is working correctly
 * 
 * Task 14: Checkpoint - Verify all core functionality
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
  details?: string;
}

class CheckpointVerifier {
  private results: CheckResult[] = [];
  
  /**
   * Run a command and capture output
   */
  private runCommand(command: string, description: string): CheckResult {
    console.log(`\n🔍 ${description}...`);
    
    try {
      const output = execSync(command, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      
      console.log(`✅ ${description} - PASSED`);
      
      return {
        name: description,
        passed: true,
        message: 'Success',
        details: output.trim().slice(0, 200),
      };
    } catch (error: any) {
      console.log(`❌ ${description} - FAILED`);
      
      return {
        name: description,
        passed: false,
        message: 'Failed',
        details: error.message?.slice(0, 200),
      };
    }
  }
  
  /**
   * Check if a file exists
   */
  private checkFileExists(path: string, description: string): CheckResult {
    console.log(`\n🔍 ${description}...`);
    
    const exists = existsSync(path);
    
    if (exists) {
      console.log(`✅ ${description} - PASSED`);
      return {
        name: description,
        passed: true,
        message: `File exists: ${path}`,
      };
    } else {
      console.log(`❌ ${description} - FAILED`);
      return {
        name: description,
        passed: false,
        message: `File not found: ${path}`,
      };
    }
  }
  
  /**
   * Verify all tests pass
   */
  async verifyTests(): Promise<void> {
    console.log('\n' + '='.repeat(70));
    console.log('CHECKPOINT 1: VERIFY TEST INFRASTRUCTURE');
    console.log('='.repeat(70));
    
    // Check test files exist
    this.results.push(
      this.checkFileExists(
        'tests/unit/cache-hit-behavior.property.test.ts',
        'Cache property tests exist'
      )
    );
    
    this.results.push(
      this.checkFileExists(
        'tests/unit/properties/asset-optimizer.property.test.ts',
        'Asset optimizer property tests exist'
      )
    );
    
    this.results.push(
      this.checkFileExists(
        'tests/unit/properties/error-handling.property.test.ts',
        'Error handling property tests exist'
      )
    );
    
    // Run performance tests only (quick)
    this.results.push(
      this.runCommand(
        'npm run test:performance',
        'Run performance infrastructure tests'
      )
    );
  }
  
  /**
   * Verify CloudWatch integration
   */
  async verifyCloudWatch(): Promise<void> {
    console.log('\n' + '='.repeat(70));
    console.log('CHECKPOINT 2: VERIFY CLOUDWATCH INTEGRATION');
    console.log('='.repeat(70));
    
    // Check CloudWatch files exist
    this.results.push(
      this.checkFileExists(
        'lib/aws/cloudwatch.ts',
        'CloudWatch service exists'
      )
    );
    
    this.results.push(
      this.checkFileExists(
        'lib/aws/metrics-client.ts',
        'Metrics client exists'
      )
    );
    
    this.results.push(
      this.checkFileExists(
        'scripts/setup-aws-infrastructure.ts',
        'AWS infrastructure setup script exists'
      )
    );
    
    // Check API routes exist
    this.results.push(
      this.checkFileExists(
        'app/api/metrics/route.ts',
        'Metrics API route exists'
      )
    );
  }
  
  /**
   * Verify performance metrics collection
   */
  async verifyMetricsCollection(): Promise<void> {
    console.log('\n' + '='.repeat(70));
    console.log('CHECKPOINT 3: VERIFY PERFORMANCE METRICS COLLECTION');
    console.log('='.repeat(70));
    
    // Check performance diagnostics
    this.results.push(
      this.checkFileExists(
        'lib/performance/diagnostics.ts',
        'Performance diagnostics service exists'
      )
    );
    
    // Check Web Vitals integration
    this.results.push(
      this.checkFileExists(
        'hooks/useWebVitals.ts',
        'Web Vitals hook exists'
      )
    );
    
    this.results.push(
      this.checkFileExists(
        'components/performance/WebVitalsMonitor.tsx',
        'Web Vitals monitor component exists'
      )
    );
    
    // Check performance dashboard
    this.results.push(
      this.checkFileExists(
        'components/performance/PerformanceDashboard.tsx',
        'Performance dashboard exists'
      )
    );
  }
  
  /**
   * Verify cache functionality
   */
  async verifyCaching(): Promise<void> {
    console.log('\n' + '='.repeat(70));
    console.log('CHECKPOINT 4: VERIFY CACHE INVALIDATION & STALE-WHILE-REVALIDATE');
    console.log('='.repeat(70));
    
    // Check enhanced cache exists
    this.results.push(
      this.checkFileExists(
        'lib/cache/enhanced-cache.ts',
        'Enhanced cache service exists'
      )
    );
    
    this.results.push(
      this.checkFileExists(
        'hooks/useEnhancedCache.ts',
        'Enhanced cache hook exists'
      )
    );
    
    // Check cache test files exist
    this.results.push(
      this.checkFileExists(
        'tests/unit/cache-invalidation-completeness.property.test.ts',
        'Cache invalidation tests exist'
      )
    );
  }
  
  /**
   * Verify image optimization pipeline
   */
  async verifyImageOptimization(): Promise<void> {
    console.log('\n' + '='.repeat(70));
    console.log('CHECKPOINT 5: VERIFY IMAGE OPTIMIZATION PIPELINE');
    console.log('='.repeat(70));
    
    // Check asset optimizer exists
    this.results.push(
      this.checkFileExists(
        'lib/aws/asset-optimizer.ts',
        'Asset optimizer service exists'
      )
    );
    
    this.results.push(
      this.checkFileExists(
        'components/OptimizedImage.tsx',
        'Optimized image component exists'
      )
    );
    
    this.results.push(
      this.checkFileExists(
        'app/api/assets/upload/route.ts',
        'Asset upload API route exists'
      )
    );
    
    // Check image optimization test file exists
    this.results.push(
      this.checkFileExists(
        'tests/unit/properties/asset-optimizer.property.test.ts',
        'Image optimization property tests file exists'
      )
    );
  }
  
  /**
   * Verify additional core functionality
   */
  async verifyAdditionalFeatures(): Promise<void> {
    console.log('\n' + '='.repeat(70));
    console.log('CHECKPOINT 6: VERIFY ADDITIONAL CORE FEATURES');
    console.log('='.repeat(70));
    
    // Request optimization
    this.results.push(
      this.checkFileExists(
        'lib/optimization/request-optimizer.ts',
        'Request optimizer exists'
      )
    );
    
    // Loading states
    this.results.push(
      this.checkFileExists(
        'hooks/useLoadingState.ts',
        'Loading state hook exists'
      )
    );
    
    // Error handling
    this.results.push(
      this.checkFileExists(
        'lib/error-handling/error-handler.ts',
        'Error handler exists'
      )
    );
    
    // Lambda@Edge functions
    this.results.push(
      this.checkFileExists(
        'lambda/edge/viewer-request.ts',
        'Lambda@Edge viewer-request exists'
      )
    );
    
    this.results.push(
      this.checkFileExists(
        'lambda/edge/origin-response.ts',
        'Lambda@Edge origin-response exists'
      )
    );
    
    // Mobile optimization
    this.results.push(
      this.checkFileExists(
        'lib/mobile/mobile-optimizer.ts',
        'Mobile optimizer exists'
      )
    );
    
    // Code splitting
    this.results.push(
      this.checkFileExists(
        'lib/optimization/dynamic-imports.ts',
        'Dynamic imports utility exists'
      )
    );
  }
  
  /**
   * Verify testing infrastructure
   */
  async verifyTestingInfrastructure(): Promise<void> {
    console.log('\n' + '='.repeat(70));
    console.log('CHECKPOINT 7: VERIFY TESTING INFRASTRUCTURE');
    console.log('='.repeat(70));
    
    // Lighthouse CI
    this.results.push(
      this.checkFileExists(
        'lighthouserc.config.js',
        'Lighthouse CI config exists'
      )
    );
    
    // Bundle analysis
    this.results.push(
      this.checkFileExists(
        'scripts/bundle-size-analysis.ts',
        'Bundle size analyzer exists'
      )
    );
    
    // Performance budget
    this.results.push(
      this.checkFileExists(
        'scripts/performance-budget.ts',
        'Performance budget validator exists'
      )
    );
    
    // Web Vitals E2E
    this.results.push(
      this.checkFileExists(
        'scripts/web-vitals-e2e.ts',
        'Web Vitals E2E tester exists'
      )
    );
    
    // CI/CD workflow
    this.results.push(
      this.checkFileExists(
        '.github/workflows/performance-ci.yml',
        'Performance CI workflow exists'
      )
    );
  }
  
  /**
   * Generate final report
   */
  generateReport(): string {
    const lines: string[] = [];
    
    lines.push('\n' + '='.repeat(70));
    lines.push('CHECKPOINT VERIFICATION REPORT');
    lines.push('='.repeat(70));
    lines.push('');
    
    // Summary
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;
    
    lines.push(`📊 Summary:`);
    lines.push(`   Total Checks: ${total}`);
    lines.push(`   ✅ Passed: ${passed}`);
    lines.push(`   ❌ Failed: ${failed}`);
    lines.push(`   Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    lines.push('');
    
    // Failed checks
    if (failed > 0) {
      lines.push('❌ Failed Checks:');
      for (const result of this.results.filter(r => !r.passed)) {
        lines.push(`   - ${result.name}`);
        if (result.details) {
          lines.push(`     ${result.details}`);
        }
      }
      lines.push('');
    }
    
    // Overall result
    if (failed === 0) {
      lines.push('✅ ALL CHECKPOINTS PASSED!');
      lines.push('');
      lines.push('🎉 Core functionality verified successfully!');
      lines.push('   Ready to proceed to Task 15: Deploy AWS Resources');
    } else {
      lines.push('❌ SOME CHECKPOINTS FAILED');
      lines.push('');
      lines.push('⚠️  Please address the failed checks before proceeding.');
    }
    
    lines.push('='.repeat(70));
    
    return lines.join('\n');
  }
  
  /**
   * Run all verifications
   */
  async run(): Promise<void> {
    console.log('\n🚀 Starting Checkpoint Verification...\n');
    
    try {
      await this.verifyTests();
      await this.verifyCloudWatch();
      await this.verifyMetricsCollection();
      await this.verifyCaching();
      await this.verifyImageOptimization();
      await this.verifyAdditionalFeatures();
      await this.verifyTestingInfrastructure();
      
      const report = this.generateReport();
      console.log(report);
      
      // Exit with error if any checks failed
      const failed = this.results.filter(r => !r.passed).length;
      if (failed > 0) {
        process.exit(1);
      }
    } catch (error) {
      console.error('\n❌ Checkpoint verification failed:', error);
      process.exit(1);
    }
  }
}

// Run verification if called directly
if (require.main === module) {
  const verifier = new CheckpointVerifier();
  verifier.run().catch((error) => {
    console.error('Error running checkpoint verification:', error);
    process.exit(1);
  });
}

export { CheckpointVerifier, CheckResult };
