#!/usr/bin/env node

/**
 * Post-build verification for standalone output
 * Validates that all required files exist and the deployment package is complete
 * Requirements: 1.3, 3.1, 3.4
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

class StandaloneVerifier {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.standaloneDir = path.join(process.cwd(), '.next', 'standalone');
    this.nextDir = path.join(process.cwd(), '.next');
  }

  log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
  }

  error(message) {
    this.errors.push(message);
    this.log(`✗ ERROR: ${message}`, colors.red);
  }

  warning(message) {
    this.warnings.push(message);
    this.log(`⚠ WARNING: ${message}`, colors.yellow);
  }

  success(message) {
    this.log(`✓ ${message}`, colors.green);
  }

  info(message) {
    this.log(`ℹ ${message}`, colors.cyan);
  }

  /**
   * Check if standalone directory exists
   */
  checkStandaloneDirectory() {
    this.info('Checking standalone output directory...');
    
    if (!fs.existsSync(this.standaloneDir)) {
      this.error('Standalone directory not found at .next/standalone');
      this.log('  This usually means:', colors.yellow);
      this.log('    • output: "standalone" is not set in next.config.ts', colors.reset);
      this.log('    • The build did not complete successfully', colors.reset);
      return false;
    }
    
    this.success('Standalone directory exists');
    return true;
  }

  /**
   * Verify required files in standalone output
   */
  verifyRequiredFiles() {
    this.info('Verifying required files...');
    
    const requiredFiles = [
      'server.js',
      'package.json',
    ];
    
    let allFilesPresent = true;
    
    for (const file of requiredFiles) {
      const filePath = path.join(this.standaloneDir, file);
      
      if (fs.existsSync(filePath)) {
        this.success(`Found ${file}`);
      } else {
        this.error(`Missing required file: ${file}`);
        allFilesPresent = false;
      }
    }
    
    return allFilesPresent;
  }

  /**
   * Verify .next directory structure in standalone
   */
  verifyNextDirectory() {
    this.info('Verifying .next directory structure...');
    
    const standaloneNextDir = path.join(this.standaloneDir, '.next');
    
    if (!fs.existsSync(standaloneNextDir)) {
      this.error('.next directory not found in standalone output');
      return false;
    }
    
    this.success('.next directory exists in standalone output');
    
    // Check for important subdirectories
    const importantDirs = [
      'server',
      'static',
    ];
    
    for (const dir of importantDirs) {
      const dirPath = path.join(standaloneNextDir, dir);
      
      if (fs.existsSync(dirPath)) {
        this.success(`Found .next/${dir}`);
      } else {
        this.warning(`Missing .next/${dir} directory`);
      }
    }
    
    return true;
  }

  /**
   * Check for manifest files
   */
  checkManifestFiles() {
    this.info('Checking for manifest files...');
    
    const serverDir = path.join(this.standaloneDir, '.next', 'server');
    
    if (!fs.existsSync(serverDir)) {
      this.warning('Server directory not found, skipping manifest check');
      return true;
    }
    
    // Look for manifest files
    const manifestFiles = this.findManifestFiles(serverDir);
    
    if (manifestFiles.length > 0) {
      this.success(`Found ${manifestFiles.length} manifest file(s)`);
      manifestFiles.slice(0, 5).forEach(file => {
        this.info(`  - ${file}`);
      });
      if (manifestFiles.length > 5) {
        this.info(`  ... and ${manifestFiles.length - 5} more`);
      }
    } else {
      this.warning('No manifest files found (this may be normal for some builds)');
    }
    
    return true;
  }

  /**
   * Recursively find manifest files
   */
  findManifestFiles(dir, files = []) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          this.findManifestFiles(fullPath, files);
        } else if (entry.name.includes('manifest')) {
          const relativePath = path.relative(this.standaloneDir, fullPath);
          files.push(relativePath);
        }
      }
    } catch (error) {
      // Silently skip directories we can't read
    }
    
    return files;
  }

  /**
   * Verify node_modules in standalone
   */
  verifyNodeModules() {
    this.info('Checking node_modules...');
    
    const nodeModulesPath = path.join(this.standaloneDir, 'node_modules');
    
    if (fs.existsSync(nodeModulesPath)) {
      this.success('node_modules directory exists');
      
      // Check for some critical packages
      const criticalPackages = ['next', 'react', 'react-dom'];
      
      for (const pkg of criticalPackages) {
        const pkgPath = path.join(nodeModulesPath, pkg);
        
        if (fs.existsSync(pkgPath)) {
          this.success(`Found ${pkg} package`);
        } else {
          this.warning(`Missing ${pkg} package in standalone node_modules`);
        }
      }
    } else {
      this.warning('node_modules not found in standalone output');
      this.info('  This is normal if dependencies are bundled differently');
    }
    
    return true;
  }

  /**
   * Calculate directory size
   */
  getDirectorySize(dir) {
    let size = 0;
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          size += this.getDirectorySize(fullPath);
        } else {
          const stats = fs.statSync(fullPath);
          size += stats.size;
        }
      }
    } catch (error) {
      // Silently skip
    }
    
    return size;
  }

  /**
   * Format bytes to human-readable size
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Display deployment package information
   */
  displayPackageInfo() {
    this.info('Analyzing deployment package...');
    
    const size = this.getDirectorySize(this.standaloneDir);
    const formattedSize = this.formatBytes(size);
    
    this.log(`\n📦 Deployment Package Information:`, colors.cyan + colors.bold);
    this.log(`   Location: ${this.standaloneDir}`, colors.reset);
    this.log(`   Size: ${formattedSize}`, colors.reset);
    
    // Count files
    let fileCount = 0;
    const countFiles = (dir) => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            countFiles(path.join(dir, entry.name));
          } else {
            fileCount++;
          }
        }
      } catch (error) {
        // Skip
      }
    };
    
    countFiles(this.standaloneDir);
    this.log(`   Files: ${fileCount.toLocaleString()}`, colors.reset);
    
    this.log('');
  }

  /**
   * Run all verifications
   */
  async verify() {
    this.log('\n🔍 Standalone Output Verification\n', colors.cyan + colors.bold);
    
    // Check if build output exists at all
    if (!fs.existsSync(this.nextDir)) {
      this.error('.next directory not found - build may not have run');
      this.log('\nRun "npm run build" first to generate the build output.\n', colors.yellow);
      return false;
    }
    
    // Run all checks
    const checks = [
      this.checkStandaloneDirectory(),
      this.verifyRequiredFiles(),
      this.verifyNextDirectory(),
      this.checkManifestFiles(),
      this.verifyNodeModules(),
    ];
    
    this.log('');
    
    // Display package info if standalone exists
    if (fs.existsSync(this.standaloneDir)) {
      this.displayPackageInfo();
    }
    
    // Summary
    this.log('═'.repeat(60), colors.cyan);
    this.log('VERIFICATION SUMMARY', colors.cyan + colors.bold);
    this.log('═'.repeat(60), colors.cyan);
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      this.log('\n✅ All verifications passed! Standalone output is ready for deployment.\n', colors.green);
      this.log('Next steps:', colors.cyan);
      this.log('  1. Copy .next/standalone to your deployment server', colors.reset);
      this.log('  2. Copy .next/static to .next/standalone/.next/static', colors.reset);
      this.log('  3. Copy public folder to .next/standalone/public', colors.reset);
      this.log('  4. Set environment variables', colors.reset);
      this.log('  5. Run: node server.js\n', colors.reset);
      return true;
    }
    
    if (this.errors.length > 0) {
      this.log(`\n❌ ${this.errors.length} error(s) found:\n`, colors.red);
      this.errors.forEach((err, i) => {
        this.log(`  ${i + 1}. ${err}`, colors.red);
      });
    }
    
    if (this.warnings.length > 0) {
      this.log(`\n⚠️  ${this.warnings.length} warning(s):\n`, colors.yellow);
      this.warnings.forEach((warn, i) => {
        this.log(`  ${i + 1}. ${warn}`, colors.yellow);
      });
    }
    
    this.log('');
    
    if (this.errors.length > 0) {
      this.log('❌ Verification failed. Please fix the errors above.\n', colors.red);
      return false;
    }
    
    this.log('⚠️  Verification passed with warnings. Review above.\n', colors.yellow);
    return true;
  }
}

// Run verifier if called directly
if (require.main === module) {
  const verifier = new StandaloneVerifier();
  
  verifier.verify().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Verification failed with error:', error);
    process.exit(1);
  });
}

module.exports = StandaloneVerifier;
