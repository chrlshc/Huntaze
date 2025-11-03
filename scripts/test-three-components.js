#!/usr/bin/env node

/**
 * React Three.js Components Test Script
 * 
 * This script performs basic validation that Three.js components
 * can be imported and initialized without errors after the upgrade.
 */

const fs = require('fs');
const path = require('path');

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

function testPackageImports() {
  log('\n📦 Testing package imports', 'cyan');
  
  const packages = [
    'three',
    '@react-three/fiber',
    '@react-three/drei'
  ];
  
  let allImportsWork = true;
  
  packages.forEach(pkg => {
    try {
      const module = require(pkg);
      logSuccess(`${pkg} imports successfully`);
      
      // Basic validation
      if (pkg === 'three') {
        if (module.Scene && module.WebGLRenderer && module.PerspectiveCamera) {
          logSuccess(`  Core Three.js classes available`);
        } else {
          logWarning(`  Some Three.js core classes missing`);
        }
      }
      
      if (pkg === '@react-three/fiber') {
        if (module.Canvas && module.useFrame) {
          logSuccess(`  Core Fiber components available`);
        } else {
          logWarning(`  Some Fiber components missing`);
        }
      }
      
      if (pkg === '@react-three/drei') {
        if (module.OrbitControls && module.Text && module.Box) {
          logSuccess(`  Core Drei helpers available`);
        } else {
          logWarning(`  Some Drei helpers missing`);
        }
      }
      
    } catch (error) {
      logError(`${pkg} failed to import: ${error.message}`);
      allImportsWork = false;
    }
  });
  
  return allImportsWork;
}

function findThreeComponents() {
  log('\n🔍 Scanning for Three.js components in codebase', 'cyan');
  
  const componentsFound = [];
  
  function scanDirectory(dir, relativePath = '') {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const itemRelativePath = path.join(relativePath, item);
      
      if (fs.statSync(fullPath).isDirectory()) {
        // Skip node_modules and .git
        if (item !== 'node_modules' && item !== '.git' && item !== '.next') {
          scanDirectory(fullPath, itemRelativePath);
        }
      } else if (item.endsWith('.tsx') || item.endsWith('.ts') || item.endsWith('.jsx') || item.endsWith('.js')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          
          // Look for Three.js imports and usage
          const hasThreeImport = content.includes('@react-three/fiber') || 
                                content.includes('@react-three/drei') ||
                                content.includes('from \'three\'');
          
          const hasCanvasComponent = content.includes('<Canvas') || content.includes('Canvas>');
          const hasDreiComponents = content.includes('OrbitControls') || 
                                   content.includes('Text') ||
                                   content.includes('Box') ||
                                   content.includes('Sphere') ||
                                   content.includes('Sparkles');
          
          if (hasThreeImport || hasCanvasComponent || hasDreiComponents) {
            componentsFound.push({
              file: itemRelativePath,
              hasThreeImport,
              hasCanvasComponent,
              hasDreiComponents
            });
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }
    });
  }
  
  // Scan common directories
  const dirsToScan = ['components', 'app', 'src', 'pages'];
  
  dirsToScan.forEach(dir => {
    scanDirectory(dir);
  });
  
  if (componentsFound.length === 0) {
    logWarning('No Three.js components found in codebase');
    return [];
  }
  
  log(`Found ${componentsFound.length} files with Three.js usage:`, 'blue');
  componentsFound.forEach(comp => {
    log(`  ${comp.file}`, 'blue');
    if (comp.hasCanvasComponent) log(`    - Uses Canvas component`, 'green');
    if (comp.hasDreiComponents) log(`    - Uses Drei helpers`, 'green');
  });
  
  return componentsFound;
}

function checkVersionCompatibility() {
  log('\n🔄 Checking version compatibility', 'cyan');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const lockFile = fs.existsSync('package-lock.json') ? 
      JSON.parse(fs.readFileSync('package-lock.json', 'utf8')) : null;
    
    const deps = packageJson.dependencies || {};
    
    // Check versions
    const fiberVersion = deps['@react-three/fiber'];
    const dreiVersion = deps['@react-three/drei'];
    const threeVersion = deps['three'];
    const reactVersion = deps['react'];
    
    log('Current versions in package.json:', 'blue');
    log(`  React: ${reactVersion}`);
    log(`  Three.js: ${threeVersion}`);
    log(`  @react-three/fiber: ${fiberVersion}`);
    log(`  @react-three/drei: ${dreiVersion}`);
    
    // Validate React 19 compatibility
    if (reactVersion && reactVersion.includes('19.')) {
      logSuccess('React 19 detected');
      
      if (fiberVersion && fiberVersion.includes('9.')) {
        logSuccess('@react-three/fiber 9.x is React 19 compatible');
      } else {
        logWarning('@react-three/fiber version may not be React 19 compatible');
      }
      
      if (dreiVersion && dreiVersion.includes('10.')) {
        logSuccess('@react-three/drei 10.x is React 19 compatible');
      } else {
        logWarning('@react-three/drei version may not be React 19 compatible');
      }
    } else {
      logWarning('React 19 not detected - upgrade recommended for full compatibility');
    }
    
    return true;
  } catch (error) {
    logError(`Failed to check versions: ${error.message}`);
    return false;
  }
}

function runBasicBuildTest() {
  log('\n🏗️  Running basic build test', 'cyan');
  
  try {
    const { execSync } = require('child_process');
    
    log('Running TypeScript check...', 'blue');
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    logSuccess('TypeScript compilation check passed');
    
    return true;
  } catch (error) {
    logError('TypeScript compilation check failed');
    const output = error.stdout?.toString() || error.stderr?.toString() || '';
    if (output.includes('three') || output.includes('@react-three')) {
      logError('Three.js related TypeScript errors detected:');
      console.log(output);
    }
    return false;
  }
}

function main() {
  log('🧪 React Three.js Components Test Suite', 'bright');
  log('======================================', 'bright');
  
  let allTestsPass = true;
  
  // Test 1: Package imports
  if (!testPackageImports()) {
    allTestsPass = false;
  }
  
  // Test 2: Find components in codebase
  const components = findThreeComponents();
  
  // Test 3: Check version compatibility
  if (!checkVersionCompatibility()) {
    allTestsPass = false;
  }
  
  // Test 4: Basic build test
  if (!runBasicBuildTest()) {
    allTestsPass = false;
  }
  
  // Final result
  log('\n' + '='.repeat(50), 'bright');
  if (allTestsPass) {
    log('🎉 All Three.js component tests passed!', 'green');
    log('\nYour 3D components should work correctly with the upgraded dependencies.', 'cyan');
    
    if (components.length > 0) {
      log('\nRecommended next steps:', 'cyan');
      log('1. Test your 3D scenes manually in the browser');
      log('2. Run your full test suite');
      log('3. Check for any visual regressions in 3D components');
    }
  } else {
    log('⚠️  Some tests failed', 'yellow');
    log('\nPlease review the errors above and fix any issues before proceeding.', 'cyan');
  }
  
  return allTestsPass;
}

// Run the script
if (require.main === module) {
  const success = main();
  process.exit(success ? 0 : 1);
}

module.exports = {
  testPackageImports,
  findThreeComponents,
  checkVersionCompatibility
};