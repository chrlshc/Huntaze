#!/usr/bin/env node

/**
 * Three.js Dependencies Rollback Script
 * Rolls back Three.js dependencies to previous working versions
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Previous working versions (before React 19 upgrade)
const PREVIOUS_VERSIONS = {
  'three': '^0.169.0',
  '@react-three/fiber': '^8.17.10',
  '@react-three/drei': '^9.114.3',
  '@types/three': '^0.169.0'
};

// Current React 19 compatible versions
const CURRENT_VERSIONS = {
  'three': '^0.181.0',
  '@react-three/fiber': '^9.4.0',
  '@react-three/drei': '^10.7.6',
  '@types/three': '^0.181.0'
};

class ThreeJsRollback {
  constructor() {
    this.packageJsonPath = path.join(process.cwd(), 'package.json');
    this.backupPath = path.join(process.cwd(), 'package.json.backup');
  }

  /**
   * Execute rollback process
   */
  async execute() {
    console.log('🔄 Starting Three.js dependencies rollback...');
    
    try {
      // Step 1: Backup current package.json
      await this.backupPackageJson();
      
      // Step 2: Check current versions
      await this.checkCurrentVersions();
      
      // Step 3: Confirm rollback
      await this.confirmRollback();
      
      // Step 4: Execute rollback
      await this.performRollback();
      
      // Step 5: Validate rollback
      await this.validateRollback();
      
      console.log('✅ Three.js dependencies rollback completed successfully!');
      console.log('\n📋 Next steps:');
      console.log('1. Run: npm test');
      console.log('2. Run: npm run build');
      console.log('3. Test 3D components manually');
      
    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
      await this.restoreFromBackup();
      process.exit(1);
    }
  }

  /**
   * Backup current package.json
   */
  async backupPackageJson() {
    console.log('📦 Backing up current package.json...');
    
    if (fs.existsSync(this.packageJsonPath)) {
      fs.copyFileSync(this.packageJsonPath, this.backupPath);
      console.log('✅ Backup created at package.json.backup');
    } else {
      throw new Error('package.json not found');
    }
  }

  /**
   * Check current versions
   */
  async checkCurrentVersions() {
    console.log('🔍 Checking current Three.js versions...');
    
    const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    console.log('\nCurrent versions:');
    Object.keys(CURRENT_VERSIONS).forEach(pkg => {
      const currentVersion = dependencies[pkg];
      console.log(`  ${pkg}: ${currentVersion || 'not installed'}`);
    });
    
    console.log('\nWill rollback to:');
    Object.entries(PREVIOUS_VERSIONS).forEach(([pkg, version]) => {
      console.log(`  ${pkg}: ${version}`);
    });
  }

  /**
   * Confirm rollback with user
   */
  async confirmRollback() {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve, reject) => {
      rl.question('\n⚠️  Are you sure you want to rollback Three.js dependencies? (y/N): ', (answer) => {
        rl.close();
        
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          resolve();
        } else {
          reject(new Error('Rollback cancelled by user'));
        }
      });
    });
  }

  /**
   * Perform the actual rollback
   */
  async performRollback() {
    console.log('\n🔄 Performing rollback...');
    
    // Step 1: Uninstall current versions
    console.log('📤 Uninstalling current Three.js packages...');
    const packagesToUninstall = Object.keys(PREVIOUS_VERSIONS).join(' ');
    
    try {
      execSync(`npm uninstall ${packagesToUninstall}`, { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
    } catch (error) {
      console.warn('⚠️  Some packages may not have been installed, continuing...');
    }

    // Step 2: Install previous versions
    console.log('📥 Installing previous Three.js versions...');
    const packagesToInstall = Object.entries(PREVIOUS_VERSIONS)
      .map(([pkg, version]) => `${pkg}@${version}`)
      .join(' ');
    
    execSync(`npm install ${packagesToInstall}`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });

    // Step 3: Install dev dependencies
    const devPackages = ['@types/three'];
    const devPackagesToInstall = devPackages
      .filter(pkg => PREVIOUS_VERSIONS[pkg])
      .map(pkg => `${pkg}@${PREVIOUS_VERSIONS[pkg]}`)
      .join(' ');
    
    if (devPackagesToInstall) {
      console.log('📥 Installing dev dependencies...');
      execSync(`npm install --save-dev ${devPackagesToInstall}`, { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
    }
  }

  /**
   * Validate rollback success
   */
  async validateRollback() {
    console.log('\n🔍 Validating rollback...');
    
    // Check package.json versions
    const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    let validationPassed = true;
    
    Object.entries(PREVIOUS_VERSIONS).forEach(([pkg, expectedVersion]) => {
      const actualVersion = dependencies[pkg];
      if (actualVersion !== expectedVersion) {
        console.error(`❌ ${pkg}: expected ${expectedVersion}, got ${actualVersion}`);
        validationPassed = false;
      } else {
        console.log(`✅ ${pkg}: ${actualVersion}`);
      }
    });

    if (!validationPassed) {
      throw new Error('Rollback validation failed');
    }

    // Test basic imports
    console.log('\n🧪 Testing basic Three.js imports...');
    try {
      execSync('node -e "console.log(require(\'three\').REVISION)"', { 
        stdio: 'pipe',
        cwd: process.cwd()
      });
      console.log('✅ Three.js import test passed');
    } catch (error) {
      throw new Error('Three.js import test failed');
    }

    // Run peer dependency check
    console.log('🔍 Checking peer dependencies...');
    try {
      execSync('npm ls --depth=0', { 
        stdio: 'pipe',
        cwd: process.cwd()
      });
      console.log('✅ Peer dependency check passed');
    } catch (error) {
      console.warn('⚠️  Peer dependency warnings detected, but rollback completed');
    }
  }

  /**
   * Restore from backup if rollback fails
   */
  async restoreFromBackup() {
    console.log('🔄 Restoring from backup...');
    
    if (fs.existsSync(this.backupPath)) {
      fs.copyFileSync(this.backupPath, this.packageJsonPath);
      console.log('✅ Restored package.json from backup');
      
      // Reinstall dependencies
      console.log('📥 Reinstalling dependencies...');
      execSync('npm install', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
    }
  }

  /**
   * Clean up backup file
   */
  cleanup() {
    if (fs.existsSync(this.backupPath)) {
      fs.unlinkSync(this.backupPath);
      console.log('🧹 Cleaned up backup file');
    }
  }
}

// CLI interface
if (require.main === module) {
  const rollback = new ThreeJsRollback();
  
  // Handle CLI arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Three.js Dependencies Rollback Script

Usage:
  node scripts/rollback-three-deps.js [options]

Options:
  --help, -h     Show this help message
  --force        Skip confirmation prompt
  --cleanup      Clean up backup files

Examples:
  node scripts/rollback-three-deps.js
  node scripts/rollback-three-deps.js --force
  node scripts/rollback-three-deps.js --cleanup
    `);
    process.exit(0);
  }

  if (args.includes('--cleanup')) {
    rollback.cleanup();
    process.exit(0);
  }

  // Override confirmation for --force flag
  if (args.includes('--force')) {
    rollback.confirmRollback = async () => Promise.resolve();
  }

  rollback.execute()
    .then(() => {
      console.log('\n🎉 Rollback completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Rollback failed:', error.message);
      process.exit(1);
    });
}

module.exports = ThreeJsRollback;