#!/usr/bin/env node

/**
 * Dependency Conflict Checker
 * Pre-commit hook to prevent dependency conflicts
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class ConflictChecker {
  constructor() {
    this.packageJsonPath = path.join(process.cwd(), 'package.json');
    this.conflicts = [];
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      warning: '\x1b[33m', // Yellow
      error: '\x1b[31m',   // Red
      reset: '\x1b[0m'     // Reset
    };
    
    const color = colors[type] || colors.info;
    console.log(`${color}${message}${colors.reset}`);
  }

  checkPackageJsonChanges() {
    try {
      // Check if package.json has been modified
      const gitStatus = execSync('git status --porcelain package.json', { encoding: 'utf8' });
      
      if (gitStatus.trim()) {
        this.log('📦 package.json changes detected, validating dependencies...');
        return true;
      }
      
      return false;
    } catch (error) {
      // If not in git repo or other error, still validate
      return true;
    }
  }

  validateNewDependencies() {
    try {
      const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
      const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      // Check for known problematic combinations
      const reactVersion = allDeps.react;
      const dreiVersion = allDeps['@react-three/drei'];
      const fiberVersion = allDeps['@react-three/fiber'];
      
      if (reactVersion && dreiVersion) {
        const reactMajor = parseInt(reactVersion.replace(/[^\d]/g, ''));
        const dreiMajor = parseInt(dreiVersion.replace(/[^\d]/g, ''));
        
        if (reactMajor >= 19 && dreiMajor < 10) {
          this.conflicts.push({
            type: 'incompatible',
            message: `React ${reactVersion} is incompatible with @react-three/drei ${dreiVersion}`,
            solution: 'Upgrade @react-three/drei to version 10.x or higher'
          });
        }
      }
      
      if (reactVersion && fiberVersion) {
        const reactMajor = parseInt(reactVersion.replace(/[^\d]/g, ''));
        const fiberMajor = parseInt(fiberVersion.replace(/[^\d]/g, ''));
        
        if (reactMajor >= 19 && fiberMajor < 9) {
          this.conflicts.push({
            type: 'incompatible',
            message: `React ${reactVersion} is incompatible with @react-three/fiber ${fiberVersion}`,
            solution: 'Upgrade @react-three/fiber to version 9.x or higher'
          });
        }
      }
      
      // Check for duplicate React versions (only core React packages)
      const coreReactDeps = ['react', 'react-dom', '@types/react', '@types/react-dom'];
      const reactVersions = new Set();
      
      coreReactDeps.forEach(dep => {
        const version = allDeps[dep];
        if (version) {
          const normalizedVersion = version.replace(/[^\d.]/g, '').split('.')[0];
          if (normalizedVersion && !isNaN(parseInt(normalizedVersion))) {
            reactVersions.add(normalizedVersion);
          }
        }
      });
      
      if (reactVersions.size > 1) {
        this.conflicts.push({
          type: 'version_mismatch',
          message: `Multiple React versions detected in core packages: ${Array.from(reactVersions).join(', ')}`,
          solution: 'Ensure react, react-dom, @types/react, and @types/react-dom use the same major version'
        });
      }
      
      return this.conflicts.length === 0;
    } catch (error) {
      this.log(`❌ Error validating dependencies: ${error.message}`, 'error');
      return false;
    }
  }

  runQuickInstallCheck() {
    try {
      this.log('🔍 Running quick dependency resolution check...');
      
      // Run npm install --dry-run to check for conflicts
      const output = execSync('npm install --dry-run 2>&1', { 
        encoding: 'utf8',
        timeout: 30000 // 30 second timeout
      });
      
      if (output.includes('ERESOLVE')) {
        this.conflicts.push({
          type: 'resolution_error',
          message: 'NPM cannot resolve dependency conflicts',
          solution: 'Run npm install to see detailed conflict information'
        });
        return false;
      }
      
      if (output.includes('peer dep missing')) {
        this.conflicts.push({
          type: 'missing_peer',
          message: 'Missing peer dependencies detected',
          solution: 'Install missing peer dependencies'
        });
        return false;
      }
      
      return true;
    } catch (error) {
      const errorOutput = error.stdout || error.stderr || error.message;
      
      if (errorOutput.includes('ERESOLVE') || errorOutput.includes('peer dep missing')) {
        this.conflicts.push({
          type: 'install_error',
          message: 'Dependency installation would fail',
          solution: errorOutput
        });
        return false;
      }
      
      // Timeout or other non-critical errors
      this.log(`⚠️ Quick install check warning: ${error.message}`, 'warning');
      return true;
    }
  }

  generateConflictReport() {
    if (this.conflicts.length === 0) {
      this.log('✅ No dependency conflicts detected!', 'success');
      return true;
    }
    
    this.log('\n❌ DEPENDENCY CONFLICTS DETECTED', 'error');
    this.log('═'.repeat(50), 'error');
    
    this.conflicts.forEach((conflict, index) => {
      this.log(`\n${index + 1}. ${conflict.message}`, 'error');
      this.log(`   Solution: ${conflict.solution}`, 'warning');
    });
    
    this.log('\n🔧 QUICK FIXES:', 'warning');
    this.log('• Run: npm run validate:dependencies', 'warning');
    this.log('• Update incompatible packages to latest versions', 'warning');
    this.log('• Check package.json for version conflicts', 'warning');
    
    this.log('\n🚫 Commit blocked to prevent build failures', 'error');
    return false;
  }

  async run() {
    this.log('🔍 Checking for dependency conflicts...');
    
    // Only run full check if package.json changed
    if (!this.checkPackageJsonChanges()) {
      this.log('✅ No package.json changes detected, skipping dependency check', 'success');
      return true;
    }
    
    const validations = [
      this.validateNewDependencies(),
      this.runQuickInstallCheck()
    ];
    
    const allPassed = validations.every(result => result);
    const reportPassed = this.generateConflictReport();
    
    return allPassed && reportPassed;
  }
}

// Run if called directly
if (require.main === module) {
  const checker = new ConflictChecker();
  checker.run().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Conflict check failed:', error);
    process.exit(1);
  });
}

module.exports = ConflictChecker;