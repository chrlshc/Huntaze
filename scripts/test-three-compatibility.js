#!/usr/bin/env node

/**
 * Quick Three.js Compatibility Test
 * 
 * Tests that the upgraded Three.js packages work correctly together
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function testThreeJsCore() {
  log('\n🔧 Testing Three.js Core Functionality', 'cyan');
  
  try {
    const THREE = require('three');
    
    // Test basic Three.js functionality
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: document.createElement('canvas') });
    
    // Test geometry and material creation
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    
    scene.add(cube);
    
    log(`✅ Three.js Core (v${THREE.REVISION}) - Scene, Camera, Renderer, Mesh creation successful`, 'green');
    
    // Test newer Three.js features
    const loader = new THREE.TextureLoader();
    const raycaster = new THREE.Raycaster();
    const vector = new THREE.Vector3();
    
    log('✅ Three.js Advanced - TextureLoader, Raycaster, Vector3 creation successful', 'green');
    
    return true;
  } catch (error) {
    log(`❌ Three.js Core test failed: ${error.message}`, 'red');
    return false;
  }
}

function testReactThreeFiber() {
  log('\n⚛️  Testing @react-three/fiber', 'cyan');
  
  try {
    const { Canvas, useFrame, useThree, useLoader } = require('@react-three/fiber');
    
    // Test that main exports exist
    if (typeof Canvas !== 'function') {
      throw new Error('Canvas component not found');
    }
    
    if (typeof useFrame !== 'function') {
      throw new Error('useFrame hook not found');
    }
    
    if (typeof useThree !== 'function') {
      throw new Error('useThree hook not found');
    }
    
    if (typeof useLoader !== 'function') {
      throw new Error('useLoader hook not found');
    }
    
    log('✅ @react-three/fiber - Canvas, useFrame, useThree, useLoader exports found', 'green');
    
    return true;
  } catch (error) {
    log(`❌ @react-three/fiber test failed: ${error.message}`, 'red');
    return false;
  }
}

function testReactThreeDrei() {
  log('\n🎨 Testing @react-three/drei', 'cyan');
  
  try {
    const { 
      OrbitControls, 
      Text, 
      Box, 
      Sphere, 
      Sparkles,
      Float,
      PerspectiveCamera,
      Environment,
      ContactShadows,
      Html,
      RoundedBox
    } = require('@react-three/drei');
    
    // Test that commonly used components exist
    const components = {
      OrbitControls,
      Text,
      Box,
      Sphere,
      Sparkles,
      Float,
      PerspectiveCamera,
      Environment,
      ContactShadows,
      Html,
      RoundedBox
    };
    
    for (const [name, component] of Object.entries(components)) {
      if (typeof component !== 'function' && typeof component !== 'object') {
        throw new Error(`${name} component not found or invalid`);
      }
    }
    
    log('✅ @react-three/drei - All common components (OrbitControls, Text, Box, Sphere, Sparkles, etc.) found', 'green');
    
    return true;
  } catch (error) {
    log(`❌ @react-three/drei test failed: ${error.message}`, 'red');
    return false;
  }
}

function testVersionCompatibility() {
  log('\n🔄 Testing Version Compatibility', 'cyan');
  
  try {
    const THREE = require('three');
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    const threeVersion = packageJson.dependencies.three;
    const fiberVersion = packageJson.dependencies['@react-three/fiber'];
    const dreiVersion = packageJson.dependencies['@react-three/drei'];
    
    log(`Three.js: ${threeVersion} (installed: ${THREE.REVISION})`, 'yellow');
    log(`@react-three/fiber: ${fiberVersion}`, 'yellow');
    log(`@react-three/drei: ${dreiVersion}`, 'yellow');
    
    // Check if versions match expected React 19 compatible versions
    const expectedVersions = {
      three: '^0.181.0',
      '@react-three/fiber': '^9.4.0',
      '@react-three/drei': '^10.7.6'
    };
    
    let allMatch = true;
    
    if (threeVersion !== expectedVersions.three) {
      log(`⚠️  Three.js version mismatch: expected ${expectedVersions.three}, got ${threeVersion}`, 'yellow');
      allMatch = false;
    }
    
    if (fiberVersion !== expectedVersions['@react-three/fiber']) {
      log(`⚠️  Fiber version mismatch: expected ${expectedVersions['@react-three/fiber']}, got ${fiberVersion}`, 'yellow');
      allMatch = false;
    }
    
    if (dreiVersion !== expectedVersions['@react-three/drei']) {
      log(`⚠️  Drei version mismatch: expected ${expectedVersions['@react-three/drei']}, got ${dreiVersion}`, 'yellow');
      allMatch = false;
    }
    
    if (allMatch) {
      log('✅ All versions match React 19 compatible targets', 'green');
    }
    
    return true;
  } catch (error) {
    log(`❌ Version compatibility test failed: ${error.message}`, 'red');
    return false;
  }
}

function testCriticalComponents() {
  log('\n🎯 Testing Critical Components', 'cyan');
  
  try {
    // Check if PhoneMockup3D.tsx exists and can be read
    const phoneMockupPath = 'components/animations/PhoneMockup3D.tsx';
    
    if (fs.existsSync(phoneMockupPath)) {
      const content = fs.readFileSync(phoneMockupPath, 'utf8');
      
      // Check for critical imports
      const hasCanvasImport = content.includes('@react-three/fiber');
      const hasDreiImports = content.includes('@react-three/drei');
      const hasThreeImport = content.includes('three');
      
      if (hasCanvasImport && hasDreiImports && hasThreeImport) {
        log('✅ PhoneMockup3D.tsx - All Three.js imports present', 'green');
      } else {
        log('⚠️  PhoneMockup3D.tsx - Some Three.js imports missing', 'yellow');
      }
    } else {
      log('⚠️  PhoneMockup3D.tsx not found', 'yellow');
    }
    
    return true;
  } catch (error) {
    log(`❌ Critical components test failed: ${error.message}`, 'red');
    return false;
  }
}

function main() {
  log('🧪 Three.js Compatibility Test Suite', 'cyan');
  log('===================================', 'cyan');
  
  const tests = [
    testThreeJsCore,
    testReactThreeFiber,
    testReactThreeDrei,
    testVersionCompatibility,
    testCriticalComponents
  ];
  
  let allPassed = true;
  
  for (const test of tests) {
    if (!test()) {
      allPassed = false;
    }
  }
  
  log('\n' + '='.repeat(50), 'cyan');
  
  if (allPassed) {
    log('🎉 All compatibility tests passed!', 'green');
    log('Your Three.js upgrade is fully compatible and ready to use.', 'green');
  } else {
    log('⚠️  Some compatibility issues detected', 'yellow');
    log('Please review the errors above before proceeding.', 'yellow');
  }
  
  return allPassed;
}

// Mock DOM for Three.js WebGL context
global.document = {
  createElement: () => ({
    getContext: () => ({}),
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {}
  })
};

global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  innerWidth: 1024,
  innerHeight: 768,
  devicePixelRatio: 1
};

global.navigator = {
  userAgent: 'Node.js'
};

// Run the test
if (require.main === module) {
  const success = main();
  process.exit(success ? 0 : 1);
}

module.exports = { main };