#!/usr/bin/env node

/**
 * Dependency Validation Script
 * Checks for peer dependency conflicts and validates compatibility
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class DependencyValidator {
  constructor() {
    this.packageJsonPath = path.join(process.cwd(), 'package.json');
    this.packageLockPath = path.join(process.cwd(), 'package-lock.json');
    this.errors = [];
    this.warnings = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }[type];
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  validatePackageFiles() {
    this.log('Validating package files...');
    
    if (!fs.existsSync(this.packageJsonPath)) {
      this.errors.push('package.json not found');
      return false;
    }
    
    if (!fs.existsSync(this.packageLockPath)) {
      this.warnings.push('package-lock.json not found - dependencies may not be locked');
    }
    
    return true;
  }

  checkPeerDependencies() {
    this.log('Checking peer dependencies...');
    
    try {
      const output = execSync('npm ls --depth=0 2>&1', { encoding: 'utf8' });
      
      // Check for peer dependency issues
      if (output.includes('ERESOLVE')) {
        this.errors.push('Peer dependency resolution conflicts detected');
      }
      
      if (output.includes('peer dep missing')) {
        this.errors.push('Missing peer dependencies detected');
      }
      
      if (output.includes('WARN')) {
        const warnings = output.split('\n').filter(line => line.includes('WARN'));
        warnings.forEach(warning => {
          this.warnings.push(`NPM Warning: ${warning.trim()}`);
        });
      }
      
      this.log('Peer dependency check completed', 'success');
      return true;
    } catch (error) {
      const errorOutput = error.stdout || error.stderr || error.message;
      
      if (errorOutput.includes('ERESOLVE') || errorOutput.includes('peer dep missing')) {
        this.errors.push(`Peer dependency conflicts: ${errorOutput}`);
        return false;
      }
      
      // Some warnings are acceptable
      this.warnings.push(`NPM ls warning: ${errorOutput}`);
      return true;
    }
  }

  validateReactThreeCompatibility() {
    this.log('Validating React and Three.js compatibility...');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      // Check React version
      const reactVersion = deps.react;
      if (reactVersion) {
        const reactMajor = parseInt(reactVersion.replace(/[^\d]/g, ''));
        if (reactMajor < 19) {
          this.warnings.push(`React version ${reactVersion} is below recommended 19.x`);
        }
      }
      
      // Check @react-three/drei version
      const dreiVersion = deps['@react-three/drei'];
      if (dreiVersion) {
        const dreiMajor = parseInt(dreiVersion.replace(/[^\d]/g, ''));
        if (dreiMajor < 10) {
          this.errors.push(`@react-three/drei version ${dreiVersion} is not compatible with React 19. Upgrade to 10.x or higher.`);
        }
      }
      
      // Check @react-three/fiber version
      const fiberVersion = deps['@react-three/fiber'];
      if (fiberVersion) {
        const fiberMajor = parseInt(fiberVersion.replace(/[^\d]/g, ''));
        if (fiberMajor < 9) {
          this.errors.push(`@react-three/fiber version ${fiberVersion} is not compatible with React 19. Upgrade to 9.x or higher.`);
        }
      }
      
      this.log('React Three.js compatibility check completed', 'success');
      return true;
    } catch (error) {
      this.errors.push(`Failed to validate React Three.js compatibility: ${error.message}`);
      return false;
    }
  }

  validateBuildCompatibility() {
    this.log('Validating build compatibility...');
    
    try {
      // Run TypeScript check
      execSync('npx tsc --noEmit --skipLibCheck', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      this.log('TypeScript compatibility check passed', 'success');
      return true;
    } catch (error) {
      const errorOutput = error.stdout || error.stderr || error.message;
      
      // Filter dependency-related errors
      if (errorOutput.includes('Cannot find module') && 
          (errorOutput.includes('@react-three') || errorOutput.includes('react'))) {
        this.errors.push(`TypeScript dependency errors: ${errorOutput}`);
        return false;
      }
      
      // Other TypeScript errors are not dependency-related
      this.warnings.push(`TypeScript warnings (non-dependency): ${errorOutput}`);
      return true;
    }
  }

  generateReport() {
    this.log('\n=== DEPENDENCY VALIDATION REPORT ===');
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      this.log('All dependency validations passed! 🎉', 'success');
      return true;
    }
    
    if (this.warnings.length > 0) {
      this.log('\nWarnings:', 'warning');
      this.warnings.forEach(warning => {
        this.log(`  • ${warning}`, 'warning');
      });
    }
    
    if (this.errors.length > 0) {
      this.log('\nErrors:', 'error');
      this.errors.forEach(error => {
        this.log(`  • ${error}`, 'error');
      });
      
      this.log('\n=== RESOLUTION SUGGESTIONS ===', 'error');
      this.log('1. Run: npm install to resolve dependency conflicts');
      this.log('2. Check package.json for version compatibility');
      this.log('3. Update @react-three/drei to version 10.x or higher');
      this.log('4. Update @react-three/fiber to version 9.x or higher');
      this.log('5. If issues persist, run: npm ls --depth=0 for detailed analysis');
      
      return false;
    }
    
    return true;
  }

  async run() {
    this.log('Starting dependency validation...');
    
    const validations = [
      this.validatePackageFiles(),
      this.checkPeerDependencies(),
      this.validateReactThreeCompatibility(),
      this.validateBuildCompatibility()
    ];
    
    const allPassed = validations.every(result => result);
    const reportPassed = this.generateReport();
    
    if (allPassed && reportPassed) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new DependencyValidator();
  validator.run().catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
}

module.exports = DependencyValidator;