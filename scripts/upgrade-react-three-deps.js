#!/usr/bin/env node

/**
 * React Three.js Dependencies Upgrade Script
 * 
 * This script upgrades @react-three/fiber, @react-three/drei, and three.js
 * to React 19 compatible versions based on compatibility research.
 * 
 * Target versions (React 19 compatible):
 * - @react-three/fiber: 9.4.0 (supports React ^19.0.0)
 * - @react-three/drei: 10.7.6 (supports React ^19.0.0)
 * - three.js: 0.181.0 (latest stable)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Target versions for React 19 compatibility
const TARGET_VERSIONS = {
  '@react-three/fiber': '9.4.0',
  '@react-three/drei': '10.7.6',
  'three': '0.181.0',
  '@types/three': '0.181.0'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${step}. ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function readPackageJson() {
  const packagePath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    throw new Error('package.json not found in current directory');
  }
  
  return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
}

function writePackageJson(packageData) {
  const packagePath = path.join(process.cwd(), 'package.json');
  fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2) + '\n');
}

function getCurrentVersions(packageData) {
  const current = {};
  
  Object.keys(TARGET_VERSIONS).forEach(pkg => {
    current[pkg] = packageData.dependencies?.[pkg] || packageData.devDependencies?.[pkg] || 'not installed';
  });
  
  return current;
}

function validateReactVersion(packageData) {
  const reactVersion = packageData.dependencies?.react;
  
  if (!reactVersion) {
    throw new Error('React not found in dependencies');
  }
  
  // Check if React version is 19.x
  if (!reactVersion.includes('19.')) {
    logWarning(`React version is ${reactVersion}, expected 19.x for optimal compatibility`);
    return false;
  }
  
  logSuccess(`React version ${reactVersion} is compatible`);
  return true;
}

function updateDependencies(packageData) {
  let updated = false;
  
  Object.entries(TARGET_VERSIONS).forEach(([pkg, targetVersion]) => {
    // Check in dependencies
    if (packageData.dependencies?.[pkg]) {
      const currentVersion = packageData.dependencies[pkg];
      if (currentVersion !== targetVersion && currentVersion !== `^${targetVersion}`) {
        log(`  Updating ${pkg}: ${currentVersion} → ^${targetVersion}`, 'yellow');
        packageData.dependencies[pkg] = `^${targetVersion}`;
        updated = true;
      } else {
        log(`  ${pkg}: already at target version`, 'green');
      }
    }
    
    // Check in devDependencies
    if (packageData.devDependencies?.[pkg]) {
      const currentVersion = packageData.devDependencies[pkg];
      if (currentVersion !== targetVersion && currentVersion !== `^${targetVersion}`) {
        log(`  Updating ${pkg} (dev): ${currentVersion} → ^${targetVersion}`, 'yellow');
        packageData.devDependencies[pkg] = `^${targetVersion}`;
        updated = true;
      } else {
        log(`  ${pkg} (dev): already at target version`, 'green');
      }
    }
  });
  
  return updated;
}

function checkPeerDependencies() {
  logStep(4, 'Checking peer dependencies compatibility');
  
  try {
    // Run npm ls to check for peer dependency issues
    execSync('npm ls --depth=0', { stdio: 'pipe' });
    logSuccess('No peer dependency conflicts detected');
    return true;
  } catch (error) {
    const output = error.stdout?.toString() || error.stderr?.toString() || '';
    
    // Check if it's just peer dependency warnings (not errors)
    if (output.includes('ERESOLVE') || output.includes('peer dep missing')) {
      logWarning('Peer dependency warnings detected - this is expected during upgrade');
      log('Run "npm install" to resolve dependencies', 'blue');
      return true;
    }
    
    logError('Peer dependency check failed:');
    console.log(output);
    return false;
  }
}

function createBackup(packageData) {
  const backupPath = path.join(process.cwd(), 'package.json.backup');
  fs.writeFileSync(backupPath, JSON.stringify(packageData, null, 2) + '\n');
  logSuccess(`Backup created: package.json.backup`);
}

function installDependencies() {
  logStep(5, 'Installing updated dependencies');
  
  try {
    log('Running npm install...', 'blue');
    execSync('npm install', { stdio: 'inherit' });
    logSuccess('Dependencies installed successfully');
    return true;
  } catch (error) {
    logError('Failed to install dependencies');
    console.error(error.message);
    return false;
  }
}

function verifyInstallation() {
  logStep(6, 'Verifying installation');
  
  try {
    // Check if packages are properly installed
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    
    Object.keys(TARGET_VERSIONS).forEach(pkg => {
      const pkgPath = path.join(nodeModulesPath, pkg);
      if (fs.existsSync(pkgPath)) {
        const pkgJson = JSON.parse(fs.readFileSync(path.join(pkgPath, 'package.json'), 'utf8'));
        log(`  ${pkg}: ${pkgJson.version} ✅`, 'green');
      } else {
        logWarning(`  ${pkg}: not found in node_modules`);
      }
    });
    
    return true;
  } catch (error) {
    logError('Verification failed');
    console.error(error.message);
    return false;
  }
}

function main() {
  log('🚀 React Three.js Dependencies Upgrade Script', 'bright');
  log('================================================', 'bright');
  
  try {
    // Step 1: Read current package.json
    logStep(1, 'Reading current package.json');
    const packageData = readPackageJson();
    const currentVersions = getCurrentVersions(packageData);
    
    log('\nCurrent versions:', 'blue');
    Object.entries(currentVersions).forEach(([pkg, version]) => {
      log(`  ${pkg}: ${version}`);
    });
    
    log('\nTarget versions:', 'blue');
    Object.entries(TARGET_VERSIONS).forEach(([pkg, version]) => {
      log(`  ${pkg}: ^${version}`);
    });
    
    // Step 2: Validate React version
    logStep(2, 'Validating React version');
    validateReactVersion(packageData);
    
    // Step 3: Create backup and update dependencies
    logStep(3, 'Updating package.json');
    createBackup(packageData);
    
    const wasUpdated = updateDependencies(packageData);
    
    if (!wasUpdated) {
      logSuccess('All dependencies are already at target versions!');
      return;
    }
    
    // Write updated package.json
    writePackageJson(packageData);
    logSuccess('package.json updated successfully');
    
    // Step 4: Check peer dependencies (before install)
    checkPeerDependencies();
    
    // Step 5: Install dependencies
    if (!installDependencies()) {
      logError('Installation failed. Restore from backup if needed.');
      return;
    }
    
    // Step 6: Verify installation
    verifyInstallation();
    
    // Success message
    log('\n🎉 Upgrade completed successfully!', 'green');
    log('\nNext steps:', 'cyan');
    log('1. Run your tests to ensure 3D components still work');
    log('2. Test the application locally');
    log('3. Check for any TypeScript errors');
    log('4. Run the build process to ensure no issues');
    
  } catch (error) {
    logError(`Upgrade failed: ${error.message}`);
    log('\nTo restore from backup:', 'yellow');
    log('  mv package.json.backup package.json');
    log('  npm install');
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  TARGET_VERSIONS,
  getCurrentVersions,
  updateDependencies,
  validateReactVersion
};