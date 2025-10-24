#!/usr/bin/env tsx

/**
 * Master Debug Script
 * Exécute tous les diagnostics et fournit un rapport complet
 */

import { execSync } from 'child_process';

interface DebugStep {
  name: string;
  command: string;
  description: string;
  critical: boolean;
}

class MasterDebugger {
  private steps: DebugStep[] = [
    {
      name: 'Dependencies',
      command: 'npm run debug:deps',
      description: 'Check package dependencies and configuration',
      critical: true,
    },
    {
      name: 'TypeScript',
      command: 'npm run debug:types',
      description: 'Check TypeScript types and imports',
      critical: true,
    },
    {
      name: 'Optimizations',
      command: 'npm run debug:all',
      description: 'Test all optimization patterns',
      critical: false,
    },
    {
      name: 'Health Check',
      command: 'npm run health-check',
      description: 'Check API health endpoint',
      critical: false,
    },
  ];

  private results: Array<{
    step: string;
    status: 'PASS' | 'FAIL' | 'SKIP';
    duration: number;
    output?: string;
    error?: string;
  }> = [];

  async runAllDiagnostics(): Promise<void> {
    console.log('🔍 Master Debug Session Starting...\n');
    console.log('This will run comprehensive diagnostics on your Huntaze API optimizations.\n');

    const startTime = Date.now();

    for (const step of this.steps) {
      await this.runStep(step);
    }

    const totalDuration = Date.now() - startTime;
    this.printFinalReport(totalDuration);
  }

  private async runStep(step: DebugStep): Promise<void> {
    console.log(`🔄 Running ${step.name} diagnostics...`);
    console.log(`   ${step.description}`);

    const stepStartTime = Date.now();

    try {
      const output = execSync(step.command, {
        encoding: 'utf8',
        cwd: process.cwd(),
        timeout: 60000, // 1 minute timeout
      });

      const duration = Date.now() - stepStartTime;

      this.results.push({
        step: step.name,
        status: 'PASS',
        duration,
        output,
      });

      console.log(`   ✅ ${step.name} completed (${duration}ms)\n`);

    } catch (error: any) {
      const duration = Date.now() - stepStartTime;

      this.results.push({
        step: step.name,
        status: step.critical ? 'FAIL' : 'SKIP',
        duration,
        error: error.message,
      });

      if (step.critical) {
        console.log(`   ❌ ${step.name} failed (${duration}ms)`);
        console.log(`   Error: ${error.message}\n`);
      } else {
        console.log(`   ⚠️  ${step.name} skipped (${duration}ms)`);
        console.log(`   Reason: ${error.message}\n`);
      }
    }
  }

  private printFinalReport(totalDuration: number): void {
    console.log('📋 Master Debug Report');
    console.log('='.repeat(60));

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Skipped: ${skipped}`);
    console.log(`⏱️  Total Duration: ${totalDuration}ms`);

    // Détails par étape
    console.log('\n📊 Step Details:');
    this.results.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`${icon} ${result.step} (${result.duration}ms)`);
      
      if (result.error) {
        console.log(`   Error: ${result.error.split('\n')[0]}`);
      }
    });

    // Statut global
    console.log('\n🎯 Overall Status:');
    
    if (failed === 0) {
      console.log('🎉 All critical diagnostics passed!');
      console.log('✅ Your Huntaze API optimizations are ready for production.');
      
      if (skipped > 0) {
        console.log(`ℹ️  ${skipped} non-critical checks were skipped (likely due to API not running).`);
      }
    } else {
      console.log('🚨 Critical issues detected!');
      console.log('❌ Fix the failed diagnostics before proceeding to production.');
      
      const failedSteps = this.results.filter(r => r.status === 'FAIL');
      console.log('\n🔧 Failed Steps to Fix:');
      failedSteps.forEach(step => {
        console.log(`  - ${step.step}: ${step.error?.split('\n')[0]}`);
      });
    }

    // Recommandations
    console.log('\n💡 Next Steps:');
    
    if (failed > 0) {
      console.log('1. Fix critical issues listed above');
      console.log('2. Re-run: npm run debug:master');
      console.log('3. Once all pass, run: npm run validate:optimizations');
    } else {
      console.log('1. Start your API: npm run dev');
      console.log('2. Run full validation: npm run validate:optimizations');
      console.log('3. Setup monitoring: npm run setup:monitoring');
      console.log('4. Run load tests: npm run load-test:smoke');
    }

    // Commandes utiles
    console.log('\n🛠️  Debug Commands:');
    console.log('  npm run debug:deps     # Check dependencies only');
    console.log('  npm run debug:types    # Check TypeScript only');
    console.log('  npm run debug:all      # Check optimizations only');
    console.log('  npm run debug:master   # Run this comprehensive check');

    console.log('\n📚 Documentation:');
    console.log('  docs/PERFORMANCE_OPTIMIZATION.md  # Performance guide');
    console.log('  docs/api/                         # API documentation');
    console.log('  monitoring/README.md              # Monitoring setup');

    // Exit code
    process.exit(failed > 0 ? 1 : 0);
  }
}

// Fonction utilitaire pour vérifier les prérequis
function checkPrerequisites(): boolean {
  console.log('🔍 Checking prerequisites...\n');

  // Vérifier Node.js
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion < 18) {
    console.log(`❌ Node.js ${nodeVersion} is too old. Please upgrade to Node.js 18+`);
    return false;
  }
  
  console.log(`✅ Node.js ${nodeVersion} is compatible`);

  // Vérifier npm
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    console.log(`✅ npm ${npmVersion} is available`);
  } catch (error) {
    console.log('❌ npm is not available');
    return false;
  }

  // Vérifier package.json
  try {
    require('../package.json');
    console.log('✅ package.json is valid');
  } catch (error) {
    console.log('❌ package.json is missing or invalid');
    return false;
  }

  console.log();
  return true;
}

// Exécution principale
async function main() {
  console.log('🚀 Huntaze API Optimization Debug Master\n');
  
  // Vérifier les prérequis
  if (!checkPrerequisites()) {
    console.log('❌ Prerequisites not met. Please fix the issues above.');
    process.exit(1);
  }

  // Exécuter les diagnostics
  const debugger = new MasterDebugger();
  await debugger.runAllDiagnostics();
}

main().catch(error => {
  console.error('💥 Master debug failed:', error);
  process.exit(1);
});