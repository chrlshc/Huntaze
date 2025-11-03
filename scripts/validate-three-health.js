#!/usr/bin/env node

/**
 * Three.js Health Validation Script
 * Validates Three.js health before and after deployments
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class ThreeJsHealthValidator {
  constructor() {
    this.results = {
      dependencies: false,
      imports: false,
      compilation: false,
      tests: false,
      performance: false,
      overall: false
    };
  }

  /**
   * Run complete health validation
   */
  async validate() {
    console.log('🔍 Starting Three.js health validation...\n');

    try {
      await this.validateDependencies();
      await this.validateImports();
      await this.validateCompilation();
      await this.validateTests();
      await this.validatePerformance();
      
      this.results.overall = Object.values(this.results).every(result => result === true);
      
      this.printResults();
      
      if (this.results.overall) {
        console.log('\n✅ Three.js health validation PASSED');
        process.exit(0);
      } else {
        console.log('\n❌ Three.js health validation FAILED');
        process.exit(1);
      }
      
    } catch (error) {
      console.error('\n💥 Health validation error:', error.message);
      process.exit(1);
    }
  }

  /**
   * Validate Three.js dependencies
   */
  async validateDependencies() {
    console.log('📦 Validating Three.js dependencies...');
    
    try {
      // Check if required packages are installed
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      const requiredPackages = ['three', '@react-three/fiber', '@react-three/drei'];
      const missingPackages = requiredPackages.filter(pkg => !dependencies[pkg]);
      
      if (missingPackages.length > 0) {
        throw new Error(`Missing packages: ${missingPackages.join(', ')}`);
      }

      // Check for peer dependency issues
      try {
        execSync('npm ls --depth=0', { stdio: 'pipe' });
      } catch (error) {
        console.warn('⚠️  Peer dependency warnings detected, but continuing...');
      }

      console.log('✅ Dependencies validation passed');
      this.results.dependencies = true;
      
    } catch (error) {
      console.error('❌ Dependencies validation failed:', error.message);
      this.results.dependencies = false;
    }
  }

  /**
   * Validate Three.js imports
   */
  async validateImports() {
    console.log('\n🔗 Validating Three.js imports...');
    
    try {
      // Test basic Three.js import
      const threeVersion = execSync('node -e "console.log(require(\'three\').REVISION)"', { 
        encoding: 'utf8',
        stdio: 'pipe'
      }).trim();
      
      console.log(`  Three.js version: ${threeVersion}`);

      // Test React Three Fiber import
      execSync('node -e "require(\'@react-three/fiber\')"', { 
        stdio: 'pipe'
      });
      
      // Test React Three Drei import
      execSync('node -e "require(\'@react-three/drei\')"', { 
        stdio: 'pipe'
      });

      console.log('✅ Imports validation passed');
      this.results.imports = true;
      
    } catch (error) {
      console.error('❌ Imports validation failed:', error.message);
      this.results.imports = false;
    }
  }

  /**
   * Validate TypeScript compilation
   */
  async validateCompilation() {
    console.log('\n🔨 Validating TypeScript compilation...');
    
    try {
      // Check if TypeScript is configured
      if (fs.existsSync('tsconfig.json')) {
        execSync('npx tsc --noEmit', { 
          stdio: 'pipe',
          timeout: 30000
        });
        console.log('✅ TypeScript compilation passed');
      } else {
        console.log('⚠️  No TypeScript configuration found, skipping...');
      }
      
      this.results.compilation = true;
      
    } catch (error) {
      console.error('❌ TypeScript compilation failed');
      console.error(error.stdout?.toString() || error.message);
      this.results.compilation = false;
    }
  }

  /**
   * Validate Three.js tests
   */
  async validateTests() {
    console.log('\n🧪 Validating Three.js tests...');
    
    try {
      // Check if Three.js tests exist
      const testDirs = [
        'tests/unit/three-js',
        'tests/integration/three-js'
      ];
      
      const existingTestDirs = testDirs.filter(dir => fs.existsSync(dir));
      
      if (existingTestDirs.length === 0) {
        console.log('⚠️  No Three.js tests found, skipping...');
        this.results.tests = true;
        return;
      }

      // Run Three.js specific tests
      try {
        execSync('npm run test:three', { 
          stdio: 'pipe',
          timeout: 60000
        });
        console.log('✅ Three.js tests passed');
        this.results.tests = true;
      } catch (error) {
        // Try alternative test command
        try {
          execSync('npm test -- tests/unit/three-js', { 
            stdio: 'pipe',
            timeout: 60000
          });
          console.log('✅ Three.js tests passed (alternative command)');
          this.results.tests = true;
        } catch (altError) {
          throw error;
        }
      }
      
    } catch (error) {
      console.error('❌ Three.js tests failed');
      console.error(error.stdout?.toString() || error.message);
      this.results.tests = false;
    }
  }

  /**
   * Validate Three.js performance
   */
  async validatePerformance() {
    console.log('\n⚡ Validating Three.js performance...');
    
    try {
      // Check if performance tests exist
      if (fs.existsSync('tests/unit/three-js/three-simple-performance.test.ts')) {
        execSync('npm run test:three:performance', { 
          stdio: 'pipe',
          timeout: 30000
        });
        console.log('✅ Performance validation passed');
      } else {
        console.log('⚠️  No performance tests found, skipping...');
      }
      
      this.results.performance = true;
      
    } catch (error) {
      console.error('❌ Performance validation failed');
      console.error(error.stdout?.toString() || error.message);
      this.results.performance = false;
    }
  }

  /**
   * Print validation results
   */
  printResults() {
    console.log('\n📊 Validation Results:');
    console.log('========================');
    
    const checks = [
      { name: 'Dependencies', result: this.results.dependencies },
      { name: 'Imports', result: this.results.imports },
      { name: 'Compilation', result: this.results.compilation },
      { name: 'Tests', result: this.results.tests },
      { name: 'Performance', result: this.results.performance }
    ];

    checks.forEach(check => {
      const status = check.result ? '✅ PASS' : '❌ FAIL';
      console.log(`  ${check.name.padEnd(15)} ${status}`);
    });

    console.log('========================');
    const overallStatus = this.results.overall ? '✅ HEALTHY' : '❌ UNHEALTHY';
    console.log(`  Overall Status: ${overallStatus}`);
  }

  /**
   * Generate health report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      results: this.results,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        cwd: process.cwd()
      }
    };

    const reportPath = path.join(process.cwd(), 'three-js-health-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Health report saved to: ${reportPath}`);
    return reportPath;
  }
}

// CLI interface
if (require.main === module) {
  const validator = new ThreeJsHealthValidator();
  
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Three.js Health Validation Script

Usage:
  node scripts/validate-three-health.js [options]

Options:
  --help, -h       Show this help message
  --report         Generate detailed health report
  --ci             Run in CI mode (exit with error code on failure)

Examples:
  node scripts/validate-three-health.js
  node scripts/validate-three-health.js --report
  node scripts/validate-three-health.js --ci
    `);
    process.exit(0);
  }

  validator.validate()
    .then(() => {
      if (args.includes('--report')) {
        validator.generateReport();
      }
    })
    .catch((error) => {
      console.error('Validation failed:', error.message);
      
      if (args.includes('--report')) {
        validator.generateReport();
      }
      
      if (args.includes('--ci')) {
        process.exit(1);
      }
    });
}

module.exports = ThreeJsHealthValidator;