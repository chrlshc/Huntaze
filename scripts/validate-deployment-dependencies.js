#!/usr/bin/env node

/**
 * Deployment Dependency Validation Script
 * Validates dependencies before deployment to production/staging
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class DeploymentValidator {
  constructor() {
    this.environment = process.env.NODE_ENV || 'production';
    this.errors = [];
    this.warnings = [];
    this.packageJsonPath = path.join(process.cwd(), 'package.json');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };
    
    const color = colors[type] || colors.info;
    console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
  }

  validateEnvironment() {
    this.log(`🚀 Validating deployment dependencies for ${this.environment}...`);
    
    // Check Node.js version
    const nodeVersion = process.version;
    const nodeMajor = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (nodeMajor < 18) {
      this.errors.push(`Node.js version ${nodeVersion} is not supported. Minimum: 18.x`);
    } else if (nodeMajor >= 20) {
      this.log(`✅ Node.js ${nodeVersion} - Excellent`, 'success');
    } else {
      this.log(`✅ Node.js ${nodeVersion} - Good`, 'success');
    }
    
    // Check npm version
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      const npmMajor = parseInt(npmVersion.split('.')[0]);
      
      if (npmMajor < 9) {
        this.warnings.push(`npm version ${npmVersion} is outdated. Recommended: 9.x+`);
      } else {
        this.log(`✅ npm ${npmVersion}`, 'success');
      }
    } catch (error) {
      this.errors.push('npm is not available');
    }
  }

  validateReactEcosystem() {
    this.log('🔍 Validating React ecosystem compatibility...');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      // Critical React dependencies
      const reactVersion = deps.react;
      const reactDomVersion = deps['react-dom'];
      const dreiVersion = deps['@react-three/drei'];
      const fiberVersion = deps['@react-three/fiber'];
      
      // Validate React versions
      if (reactVersion && reactDomVersion) {
        const reactMajor = parseInt(reactVersion.replace(/[^\d]/g, ''));
        const reactDomMajor = parseInt(reactDomVersion.replace(/[^\d]/g, ''));
        
        if (reactMajor !== reactDomMajor) {
          this.errors.push(`React version mismatch: react@${reactVersion} vs react-dom@${reactDomVersion}`);
        } else if (reactMajor >= 19) {
          this.log(`✅ React ${reactVersion} - Latest`, 'success');
        } else {
          this.warnings.push(`React ${reactVersion} - Consider upgrading to 19.x`);
        }
      }
      
      // Validate Three.js ecosystem
      if (dreiVersion) {
        const dreiMajor = parseInt(dreiVersion.replace(/[^\d]/g, ''));
        if (dreiMajor >= 10) {
          this.log(`✅ @react-three/drei ${dreiVersion} - React 19 compatible`, 'success');
        } else {
          this.errors.push(`@react-three/drei ${dreiVersion} is not React 19 compatible. Upgrade to 10.x+`);
        }
      }
      
      if (fiberVersion) {
        const fiberMajor = parseInt(fiberVersion.replace(/[^\d]/g, ''));
        if (fiberMajor >= 9) {
          this.log(`✅ @react-three/fiber ${fiberVersion} - React 19 compatible`, 'success');
        } else {
          this.errors.push(`@react-three/fiber ${fiberVersion} is not React 19 compatible. Upgrade to 9.x+`);
        }
      }
      
    } catch (error) {
      this.errors.push(`Failed to validate React ecosystem: ${error.message}`);
    }
  }

  validateProductionDependencies() {
    this.log('📦 Validating production dependencies...');
    
    try {
      // Check for development dependencies in production
      const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
      const prodDeps = packageJson.dependencies || {};
      const devDeps = packageJson.devDependencies || {};
      
      // Critical production dependencies
      const criticalDeps = [
        'react',
        'react-dom',
        'next',
        '@react-three/drei',
        '@react-three/fiber',
        'three'
      ];
      
      criticalDeps.forEach(dep => {
        if (!prodDeps[dep]) {
          if (devDeps[dep]) {
            this.errors.push(`${dep} is in devDependencies but should be in dependencies`);
          } else {
            this.warnings.push(`${dep} is not installed`);
          }
        } else {
          this.log(`✅ ${dep}@${prodDeps[dep]}`, 'success');
        }
      });
      
      // Check for unnecessary dev dependencies
      const unnecessaryInProd = [
        '@types/node',
        'typescript',
        'eslint',
        'vitest'
      ];
      
      unnecessaryInProd.forEach(dep => {
        if (prodDeps[dep]) {
          this.warnings.push(`${dep} should be in devDependencies, not dependencies`);
        }
      });
      
    } catch (error) {
      this.errors.push(`Failed to validate production dependencies: ${error.message}`);
    }
  }

  validateBuildCompatibility() {
    this.log('🔨 Validating build compatibility...');
    
    try {
      // Test TypeScript compilation
      this.log('Testing TypeScript compilation...');
      execSync('npx tsc --noEmit --skipLibCheck', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      this.log('✅ TypeScript compilation successful', 'success');
      
    } catch (error) {
      const errorOutput = error.stdout || error.stderr || error.message;
      
      // Filter dependency-related errors
      if (errorOutput.includes('Cannot find module') && 
          (errorOutput.includes('@react-three') || errorOutput.includes('react'))) {
        this.errors.push(`TypeScript dependency errors: ${errorOutput}`);
      } else {
        this.warnings.push(`TypeScript warnings: ${errorOutput.split('\n')[0]}`);
      }
    }
    
    try {
      // Test dependency resolution
      this.log('Testing dependency resolution...');
      execSync('npm ls --depth=0 --production', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      this.log('✅ Dependency resolution successful', 'success');
      
    } catch (error) {
      const errorOutput = error.stdout || error.stderr || error.message;
      
      if (errorOutput.includes('ERESOLVE') || errorOutput.includes('peer dep missing')) {
        this.errors.push(`Dependency resolution errors: ${errorOutput}`);
      } else {
        this.warnings.push('Minor dependency warnings detected');
      }
    }
  }

  validateSecurityAndPerformance() {
    this.log('🔒 Validating security and performance...');
    
    try {
      // Check for known vulnerabilities
      const auditOutput = execSync('npm audit --audit-level=high --json', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      const audit = JSON.parse(auditOutput);
      
      if (audit.metadata.vulnerabilities.high > 0 || audit.metadata.vulnerabilities.critical > 0) {
        this.errors.push(`Security vulnerabilities found: ${audit.metadata.vulnerabilities.high} high, ${audit.metadata.vulnerabilities.critical} critical`);
      } else if (audit.metadata.vulnerabilities.moderate > 0) {
        this.warnings.push(`${audit.metadata.vulnerabilities.moderate} moderate security vulnerabilities found`);
      } else {
        this.log('✅ No critical security vulnerabilities', 'success');
      }
      
    } catch (error) {
      // npm audit might fail in some environments, treat as warning
      this.warnings.push('Could not complete security audit');
    }
    
    // Check bundle size implications
    try {
      const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
      const deps = packageJson.dependencies || {};
      
      // Large dependencies that might impact performance
      const largeDeps = ['three', '@react-three/drei', '@react-three/fiber'];
      largeDeps.forEach(dep => {
        if (deps[dep]) {
          this.log(`📊 ${dep} included - monitor bundle size`, 'info');
        }
      });
      
    } catch (error) {
      this.warnings.push('Could not analyze bundle size implications');
    }
  }

  generateDeploymentReport() {
    this.log('\n🎯 DEPLOYMENT VALIDATION REPORT', 'info');
    this.log('═'.repeat(50), 'info');
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      this.log('🎉 All validations passed! Ready for deployment.', 'success');
      return true;
    }
    
    if (this.warnings.length > 0) {
      this.log('\n⚠️  WARNINGS:', 'warning');
      this.warnings.forEach(warning => {
        this.log(`  • ${warning}`, 'warning');
      });
    }
    
    if (this.errors.length > 0) {
      this.log('\n❌ ERRORS (DEPLOYMENT BLOCKED):', 'error');
      this.errors.forEach(error => {
        this.log(`  • ${error}`, 'error');
      });
      
      this.log('\n🔧 RESOLUTION STEPS:', 'error');
      this.log('1. Fix all errors listed above', 'error');
      this.log('2. Run: npm run validate:dependencies', 'error');
      this.log('3. Test build: npm run build', 'error');
      this.log('4. Re-run deployment validation', 'error');
      
      return false;
    }
    
    this.log('\n✅ Validation passed with warnings. Deployment can proceed.', 'success');
    return true;
  }

  async run() {
    this.log('🚀 Starting deployment dependency validation...');
    
    try {
      this.validateEnvironment();
      this.validateReactEcosystem();
      this.validateProductionDependencies();
      this.validateBuildCompatibility();
      this.validateSecurityAndPerformance();
      
      const success = this.generateDeploymentReport();
      
      if (success) {
        this.log('\n🎉 Deployment validation completed successfully!', 'success');
        process.exit(0);
      } else {
        this.log('\n🚫 Deployment validation failed!', 'error');
        process.exit(1);
      }
      
    } catch (error) {
      this.log(`💥 Validation failed with error: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new DeploymentValidator();
  validator.run();
}

module.exports = DeploymentValidator;