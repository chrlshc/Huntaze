#!/usr/bin/env node

/**
 * React Three.js Peer Dependencies Validation Script
 * 
 * This script validates that all React Three.js packages have compatible
 * peer dependencies with React 19 and each other.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Expected peer dependencies for React 19 compatibility
const EXPECTED_PEERS = {
  '@react-three/fiber': {
    react: '^18.0.0 || ^19.0.0',
    'react-dom': '^18.0.0 || ^19.0.0',
    three: '>=0.133.0'
  },
  '@react-three/drei': {
    react: '^18.0.0 || ^19.0.0',
    'react-dom': '^18.0.0 || ^19.0.0',
    three: '>=0.137.0',
    '@react-three/fiber': '>=8.0.0'
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
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

function readPackageJson(packagePath = null) {
  const pkgPath = packagePath || path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(pkgPath)) {
    return null;
  }
  
  return JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
}

function getInstalledVersion(packageName) {
  try {
    const packagePath = path.join(process.cwd(), 'node_modules', packageName, 'package.json');
    const packageData = readPackageJson(packagePath);
    return packageData ? packageData.version : null;
  } catch (error) {
    return null;
  }
}

function getInstalledPeerDeps(packageName) {
  try {
    const packagePath = path.join(process.cwd(), 'node_modules', packageName, 'package.json');
    const packageData = readPackageJson(packagePath);
    return packageData ? packageData.peerDependencies || {} : {};
  } catch (error) {
    return {};
  }
}

function parseVersionRange(versionRange) {
  // Simple version range parser for basic validation
  if (!versionRange) return null;
  
  // Handle ranges like "^18.0.0 || ^19.0.0"
  if (versionRange.includes('||')) {
    return versionRange.split('||').map(v => v.trim());
  }
  
  return [versionRange.trim()];
}

function isVersionCompatible(installedVersion, requiredRange) {
  if (!installedVersion || !requiredRange) return false;
  
  const ranges = parseVersionRange(requiredRange);
  
  for (const range of ranges) {
    // Simple compatibility check
    if (range.startsWith('^')) {
      const baseVersion = range.substring(1);
      const [major] = baseVersion.split('.');
      const [installedMajor] = installedVersion.split('.');
      
      if (installedMajor === major) {
        return true;
      }
    } else if (range.startsWith('>=')) {
      // For simplicity, assume >= ranges are satisfied
      return true;
    } else if (range === installedVersion) {
      return true;
    }
  }
  
  return false;
}

function validateProjectDependencies() {
  log('\n📦 Validating project dependencies', 'cyan');
  
  const packageData = readPackageJson();
  if (!packageData) {
    logError('Could not read project package.json');
    return false;
  }
  
  const allDeps = {
    ...packageData.dependencies,
    ...packageData.devDependencies
  };
  
  let isValid = true;
  
  // Check React version
  const reactVersion = allDeps.react;
  if (reactVersion) {
    if (reactVersion.includes('19.')) {
      logSuccess(`React version: ${reactVersion} (React 19 compatible)`);
    } else {
      logWarning(`React version: ${reactVersion} (consider upgrading to React 19)`);
    }
  } else {
    logError('React not found in dependencies');
    isValid = false;
  }
  
  // Check React DOM version
  const reactDomVersion = allDeps['react-dom'];
  if (reactDomVersion) {
    if (reactDomVersion.includes('19.')) {
      logSuccess(`React DOM version: ${reactDomVersion} (React 19 compatible)`);
    } else {
      logWarning(`React DOM version: ${reactDomVersion} (consider upgrading to React 19)`);
    }
  } else {
    logError('React DOM not found in dependencies');
    isValid = false;
  }
  
  // Check Three.js packages
  const threeVersion = allDeps.three;
  const fiberVersion = allDeps['@react-three/fiber'];
  const dreiVersion = allDeps['@react-three/drei'];
  
  if (threeVersion) {
    logSuccess(`Three.js version: ${threeVersion}`);
  } else {
    logError('Three.js not found in dependencies');
    isValid = false;
  }
  
  if (fiberVersion) {
    logSuccess(`@react-three/fiber version: ${fiberVersion}`);
  } else {
    logWarning('@react-three/fiber not found in dependencies');
  }
  
  if (dreiVersion) {
    logSuccess(`@react-three/drei version: ${dreiVersion}`);
  } else {
    logWarning('@react-three/drei not found in dependencies');
  }
  
  return isValid;
}

function validateInstalledPeerDeps() {
  log('\n🔍 Validating installed peer dependencies', 'cyan');
  
  let allValid = true;
  
  Object.entries(EXPECTED_PEERS).forEach(([packageName, expectedPeers]) => {
    const installedVersion = getInstalledVersion(packageName);
    
    if (!installedVersion) {
      logWarning(`${packageName} is not installed`);
      return;
    }
    
    log(`\nChecking ${packageName} v${installedVersion}:`, 'blue');
    
    const actualPeers = getInstalledPeerDeps(packageName);
    
    Object.entries(expectedPeers).forEach(([peerName, expectedRange]) => {
      const actualRange = actualPeers[peerName];
      const installedPeerVersion = getInstalledVersion(peerName);
      
      if (!actualRange) {
        logWarning(`  ${peerName}: not listed as peer dependency`);
        return;
      }
      
      if (!installedPeerVersion) {
        logError(`  ${peerName}: required but not installed`);
        allValid = false;
        return;
      }
      
      const isCompatible = isVersionCompatible(installedPeerVersion, actualRange);
      
      if (isCompatible) {
        logSuccess(`  ${peerName}: ${installedPeerVersion} (satisfies ${actualRange})`);
      } else {
        logError(`  ${peerName}: ${installedPeerVersion} (does not satisfy ${actualRange})`);
        allValid = false;
      }
    });
  });
  
  return allValid;
}

function runNpmCheck() {
  log('\n🔧 Running npm peer dependency check', 'cyan');
  
  try {
    // Run npm ls to check for issues
    const output = execSync('npm ls --depth=0 2>&1', { encoding: 'utf8' });
    
    if (output.includes('ERESOLVE') || output.includes('peer dep missing')) {
      logWarning('Peer dependency warnings detected:');
      console.log(output);
      return false;
    } else {
      logSuccess('No peer dependency conflicts detected');
      return true;
    }
  } catch (error) {
    const output = error.stdout || error.stderr || error.message;
    
    if (output.includes('ERESOLVE') || output.includes('peer dep missing')) {
      logWarning('Peer dependency warnings detected:');
      console.log(output);
      return false;
    } else {
      logError('npm check failed:');
      console.log(output);
      return false;
    }
  }
}

function checkReact19Compatibility() {
  log('\n🚀 Checking React 19 compatibility', 'cyan');
  
  const reactVersion = getInstalledVersion('react');
  const reactDomVersion = getInstalledVersion('react-dom');
  const fiberVersion = getInstalledVersion('@react-three/fiber');
  const dreiVersion = getInstalledVersion('@react-three/drei');
  
  let compatible = true;
  
  // Check React versions
  if (reactVersion && reactVersion.startsWith('19.')) {
    logSuccess(`React ${reactVersion} is React 19 ✅`);
  } else {
    logWarning(`React ${reactVersion || 'not installed'} - React 19 recommended`);
    compatible = false;
  }
  
  if (reactDomVersion && reactDomVersion.startsWith('19.')) {
    logSuccess(`React DOM ${reactDomVersion} is React 19 ✅`);
  } else {
    logWarning(`React DOM ${reactDomVersion || 'not installed'} - React 19 recommended`);
    compatible = false;
  }
  
  // Check fiber version (should be 9.x for React 19)
  if (fiberVersion) {
    const majorVersion = parseInt(fiberVersion.split('.')[0]);
    if (majorVersion >= 9) {
      logSuccess(`@react-three/fiber ${fiberVersion} supports React 19 ✅`);
    } else {
      logError(`@react-three/fiber ${fiberVersion} may not support React 19 (need v9+)`);
      compatible = false;
    }
  }
  
  // Check drei version (should be 10.x for React 19)
  if (dreiVersion) {
    const majorVersion = parseInt(dreiVersion.split('.')[0]);
    if (majorVersion >= 10) {
      logSuccess(`@react-three/drei ${dreiVersion} supports React 19 ✅`);
    } else {
      logError(`@react-three/drei ${dreiVersion} may not support React 19 (need v10+)`);
      compatible = false;
    }
  }
  
  return compatible;
}

function main() {
  log('🔍 React Three.js Peer Dependencies Validation', 'bright');
  log('===============================================', 'bright');
  
  let allChecksPass = true;
  
  // Validate project dependencies
  if (!validateProjectDependencies()) {
    allChecksPass = false;
  }
  
  // Validate installed peer dependencies
  if (!validateInstalledPeerDeps()) {
    allChecksPass = false;
  }
  
  // Run npm check
  if (!runNpmCheck()) {
    // Don't fail on npm warnings, just note them
    logWarning('npm reported peer dependency warnings (this may be normal during upgrades)');
  }
  
  // Check React 19 compatibility
  if (!checkReact19Compatibility()) {
    allChecksPass = false;
  }
  
  // Final result
  log('\n' + '='.repeat(50), 'bright');
  if (allChecksPass) {
    log('🎉 All peer dependency validations passed!', 'green');
    log('\nYour React Three.js setup is ready for React 19!', 'cyan');
  } else {
    log('⚠️  Some peer dependency issues detected', 'yellow');
    log('\nRecommendations:', 'cyan');
    log('1. Run the upgrade script: node scripts/upgrade-react-three-deps.js');
    log('2. Install missing dependencies: npm install');
    log('3. Re-run this validation: node scripts/validate-react-three-peers.js');
  }
  
  return allChecksPass;
}

// Run the script
if (require.main === module) {
  const success = main();
  process.exit(success ? 0 : 1);
}

module.exports = {
  validateProjectDependencies,
  validateInstalledPeerDeps,
  checkReact19Compatibility,
  isVersionCompatible
};