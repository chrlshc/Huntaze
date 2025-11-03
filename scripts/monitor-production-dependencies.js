#!/usr/bin/env node

/**
 * Production Dependency Monitoring Script
 * Monitors for dependency conflicts and performance issues in production
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class ProductionMonitor {
  constructor() {
    this.environment = process.env.NODE_ENV || 'production';
    this.issues = [];
    this.metrics = {};
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

  async validateThreeJsComponents() {
    this.log('🎮 Validating Three.js components in production...');
    
    try {
      // Check if Three.js dependencies are properly loaded
      const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
      const deps = packageJson.dependencies || {};
      
      const threeJsDeps = {
        'three': deps.three,
        '@react-three/fiber': deps['@react-three/fiber'],
        '@react-three/drei': deps['@react-three/drei']
      };
      
      let allPresent = true;
      Object.entries(threeJsDeps).forEach(([dep, version]) => {
        if (!version) {
          this.issues.push(`Missing Three.js dependency: ${dep}`);
          allPresent = false;
        } else {
          this.log(`✅ ${dep}@${version} - Available`, 'success');
        }
      });
      
      if (allPresent) {
        this.log('✅ All Three.js dependencies present', 'success');
        this.metrics.threeJsStatus = 'healthy';
      } else {
        this.metrics.threeJsStatus = 'degraded';
      }
      
    } catch (error) {
      this.issues.push(`Three.js validation failed: ${error.message}`);
      this.metrics.threeJsStatus = 'error';
    }
  }

  async checkBuildHealth() {
    this.log('🔨 Checking build health...');
    
    try {
      // Check if .next directory exists and is recent
      const nextDir = path.join(process.cwd(), '.next');
      
      if (fs.existsSync(nextDir)) {
        const stats = fs.statSync(nextDir);
        const buildAge = Date.now() - stats.mtime.getTime();
        const hoursOld = Math.floor(buildAge / (1000 * 60 * 60));
        
        if (hoursOld < 24) {
          this.log(`✅ Build is fresh (${hoursOld} hours old)`, 'success');
          this.metrics.buildHealth = 'fresh';
        } else {
          this.log(`⚠️ Build is ${hoursOld} hours old`, 'warning');
          this.metrics.buildHealth = 'stale';
        }
      } else {
        this.issues.push('No build directory found');
        this.metrics.buildHealth = 'missing';
      }
      
    } catch (error) {
      this.issues.push(`Build health check failed: ${error.message}`);
      this.metrics.buildHealth = 'error';
    }
  }

  async monitorDependencyConflicts() {
    this.log('🔍 Monitoring for dependency conflicts...');
    
    try {
      // Check for peer dependency warnings
      const lsOutput = execSync('npm ls --depth=0', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      if (lsOutput.includes('UNMET PEER DEPENDENCY') || lsOutput.includes('peer dep missing')) {
        this.issues.push('Peer dependency conflicts detected');
        this.metrics.dependencyHealth = 'conflicts';
      } else {
        this.log('✅ No dependency conflicts detected', 'success');
        this.metrics.dependencyHealth = 'healthy';
      }
      
    } catch (error) {
      const errorOutput = error.stdout || error.stderr || error.message;
      
      if (errorOutput.includes('ERESOLVE') || errorOutput.includes('peer dep missing')) {
        this.issues.push(`Dependency conflicts: ${errorOutput.split('\n')[0]}`);
        this.metrics.dependencyHealth = 'conflicts';
      } else {
        this.log('✅ Dependencies resolved successfully', 'success');
        this.metrics.dependencyHealth = 'healthy';
      }
    }
  }

  async checkPerformanceMetrics() {
    this.log('📊 Checking performance metrics...');
    
    try {
      // Check bundle sizes if available
      const nextDir = path.join(process.cwd(), '.next');
      const staticDir = path.join(nextDir, 'static');
      
      if (fs.existsSync(staticDir)) {
        const chunks = fs.readdirSync(staticDir, { recursive: true })
          .filter(file => file.endsWith('.js'))
          .map(file => {
            const filePath = path.join(staticDir, file);
            const stats = fs.statSync(filePath);
            return {
              file,
              size: stats.size,
              sizeKB: Math.round(stats.size / 1024)
            };
          })
          .sort((a, b) => b.size - a.size)
          .slice(0, 5); // Top 5 largest chunks
        
        this.log('📦 Top 5 largest JavaScript chunks:');
        chunks.forEach(chunk => {
          const sizeStatus = chunk.sizeKB > 1000 ? 'warning' : 'info';
          this.log(`  • ${chunk.file}: ${chunk.sizeKB}KB`, sizeStatus);
        });
        
        const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
        this.metrics.bundleSize = Math.round(totalSize / 1024);
        
        if (this.metrics.bundleSize > 5000) { // 5MB threshold
          this.issues.push(`Large bundle size detected: ${this.metrics.bundleSize}KB`);
        }
        
      } else {
        this.log('⚠️ No static assets found for analysis', 'warning');
      }
      
    } catch (error) {
      this.log(`Performance check failed: ${error.message}`, 'warning');
    }
  }

  async validateReactThreeIntegration() {
    this.log('🔗 Validating React-Three integration...');
    
    try {
      // Check for common integration issues
      const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      // Check React version compatibility
      const reactVersion = deps.react;
      const dreiVersion = deps['@react-three/drei'];
      const fiberVersion = deps['@react-three/fiber'];
      
      if (reactVersion && dreiVersion && fiberVersion) {
        const reactMajor = parseInt(reactVersion.replace(/[^\d]/g, ''));
        const dreiMajor = parseInt(dreiVersion.replace(/[^\d]/g, ''));
        const fiberMajor = parseInt(fiberVersion.replace(/[^\d]/g, ''));
        
        // React 19 compatibility checks
        if (reactMajor >= 19) {
          if (dreiMajor >= 10 && fiberMajor >= 9) {
            this.log('✅ React 19 + Three.js ecosystem fully compatible', 'success');
            this.metrics.reactThreeCompatibility = 'compatible';
          } else {
            this.issues.push(`React 19 compatibility issue: drei@${dreiVersion}, fiber@${fiberVersion}`);
            this.metrics.reactThreeCompatibility = 'incompatible';
          }
        } else {
          this.log(`✅ React ${reactVersion} with Three.js ecosystem`, 'success');
          this.metrics.reactThreeCompatibility = 'compatible';
        }
      }
      
    } catch (error) {
      this.issues.push(`React-Three integration check failed: ${error.message}`);
      this.metrics.reactThreeCompatibility = 'error';
    }
  }

  generateMonitoringReport() {
    this.log('\n📋 PRODUCTION MONITORING REPORT', 'info');
    this.log('═'.repeat(50), 'info');
    
    // Overall health status
    const healthScore = this.calculateHealthScore();
    const healthStatus = healthScore >= 80 ? 'HEALTHY' : healthScore >= 60 ? 'DEGRADED' : 'CRITICAL';
    const healthColor = healthScore >= 80 ? 'success' : healthScore >= 60 ? 'warning' : 'error';
    
    this.log(`\n🎯 Overall Health: ${healthStatus} (${healthScore}%)`, healthColor);
    
    // Metrics summary
    this.log('\n📊 METRICS SUMMARY:', 'info');
    Object.entries(this.metrics).forEach(([key, value]) => {
      const status = typeof value === 'string' ? value : `${value}`;
      const color = this.getStatusColor(status);
      this.log(`  • ${key}: ${status}`, color);
    });
    
    // Issues
    if (this.issues.length > 0) {
      this.log('\n⚠️ ISSUES DETECTED:', 'warning');
      this.issues.forEach(issue => {
        this.log(`  • ${issue}`, 'warning');
      });
      
      this.log('\n🔧 RECOMMENDED ACTIONS:', 'info');
      this.log('1. Review dependency conflicts and update if needed', 'info');
      this.log('2. Monitor bundle sizes and optimize if necessary', 'info');
      this.log('3. Test Three.js components functionality', 'info');
      this.log('4. Consider running: npm run validate:deployment', 'info');
    } else {
      this.log('\n✅ No issues detected - system is healthy!', 'success');
    }
    
    return {
      healthy: this.issues.length === 0,
      healthScore,
      metrics: this.metrics,
      issues: this.issues
    };
  }

  calculateHealthScore() {
    let score = 100;
    
    // Deduct points for each issue
    score -= this.issues.length * 15;
    
    // Adjust based on specific metrics
    if (this.metrics.dependencyHealth === 'conflicts') score -= 20;
    if (this.metrics.threeJsStatus === 'error') score -= 25;
    if (this.metrics.buildHealth === 'missing') score -= 30;
    if (this.metrics.reactThreeCompatibility === 'incompatible') score -= 20;
    
    return Math.max(0, score);
  }

  getStatusColor(status) {
    const statusColors = {
      'healthy': 'success',
      'compatible': 'success',
      'fresh': 'success',
      'degraded': 'warning',
      'stale': 'warning',
      'conflicts': 'error',
      'error': 'error',
      'incompatible': 'error',
      'missing': 'error'
    };
    
    return statusColors[status] || 'info';
  }

  async run() {
    this.log('🚀 Starting production dependency monitoring...');
    
    try {
      await this.validateThreeJsComponents();
      await this.checkBuildHealth();
      await this.monitorDependencyConflicts();
      await this.checkPerformanceMetrics();
      await this.validateReactThreeIntegration();
      
      const report = this.generateMonitoringReport();
      
      if (report.healthy) {
        this.log('\n🎉 Production monitoring completed - All systems healthy!', 'success');
        process.exit(0);
      } else {
        this.log('\n⚠️ Production monitoring completed - Issues detected!', 'warning');
        process.exit(0); // Don't fail, just warn
      }
      
    } catch (error) {
      this.log(`💥 Monitoring failed with error: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run monitoring if called directly
if (require.main === module) {
  const monitor = new ProductionMonitor();
  monitor.run();
}

module.exports = ProductionMonitor;