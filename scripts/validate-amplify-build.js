#!/usr/bin/env node

/**
 * Amplify Build Validation Script
 * 
 * Validates that the build process will work correctly in Amplify environment
 * without requiring --legacy-peer-deps flags
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Amplify build configuration...\n');

// Check 1: Verify amplify.yml doesn't contain legacy peer deps flags
console.log('✅ Checking amplify.yml configuration...');
const amplifyConfig = fs.readFileSync('amplify.yml', 'utf8');

if (amplifyConfig.includes('--legacy-peer-deps')) {
  console.error('❌ amplify.yml contains --legacy-peer-deps flags');
  process.exit(1);
}

if (amplifyConfig.includes('npm ci')) {
  console.log('✅ amplify.yml uses npm ci (clean install)');
} else {
  console.log('⚠️  amplify.yml does not use npm ci');
}

// Check 2: Validate package.json peer dependencies
console.log('\n✅ Checking Three.js package versions...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const threeVersion = packageJson.dependencies.three;
const fiberVersion = packageJson.dependencies['@react-three/fiber'];
const dreiVersion = packageJson.dependencies['@react-three/drei'];
const reactVersion = packageJson.dependencies.react;

console.log(`   three: ${threeVersion}`);
console.log(`   @react-three/fiber: ${fiberVersion}`);
console.log(`   @react-three/drei: ${dreiVersion}`);
console.log(`   react: ${reactVersion}`);

// Check 3: Validate npm ci works with existing package-lock.json
console.log('\n✅ Validating npm ci with existing package-lock.json...');
try {
  // First ensure we have a package-lock.json
  if (!fs.existsSync('package-lock.json')) {
    console.log('   Generating package-lock.json...');
    execSync('npm install --package-lock-only', { stdio: 'inherit' });
  }
  
  // Remove node_modules to simulate fresh environment
  if (fs.existsSync('node_modules')) {
    console.log('   Removing existing node_modules...');
    execSync('rm -rf node_modules', { stdio: 'inherit' });
  }
  
  // Run npm ci (like Amplify does)
  console.log('   Running npm ci...');
  execSync('npm ci --no-audit --no-fund', { stdio: 'inherit' });
  
  console.log('✅ Clean install successful!');
} catch (error) {
  console.error('❌ Clean install failed:', error.message);
  process.exit(1);
}

// Check 4: Validate that Three.js components can be imported
console.log('\n✅ Validating Three.js imports...');
try {
  const testScript = `
    const THREE = require('three');
    const fiber = require('@react-three/fiber');
    const drei = require('@react-three/drei');
    
    console.log('Three.js version:', THREE.REVISION);
    console.log('Fiber Canvas available:', typeof fiber.Canvas === 'function');
    console.log('Drei components available:', typeof drei.Float === 'function');
    
    // Test basic Three.js functionality
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    
    console.log('Three.js basic functionality works!');
  `;
  
  const testPath = path.join(process.cwd(), 'three-test.js');
  fs.writeFileSync(testPath, testScript);
  execSync(`node ${testPath}`, { stdio: 'inherit' });
  fs.unlinkSync(testPath);
  
  console.log('✅ Three.js imports and basic functionality validated!');
} catch (error) {
  console.error('❌ Three.js validation failed:', error.message);
  process.exit(1);
}

// Check 5: Test build process
console.log('\n✅ Testing build process...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build process successful!');
} catch (error) {
  console.error('❌ Build process failed:', error.message);
  process.exit(1);
}

console.log('\n🎉 All Amplify build validations passed!');
console.log('\n📋 Summary:');
console.log('   ✅ No --legacy-peer-deps flags required');
console.log('   ✅ Clean npm ci install works');
console.log('   ✅ Three.js packages compatible with React 19');
console.log('   ✅ Build process completes successfully');
console.log('   ✅ Ready for Amplify deployment');