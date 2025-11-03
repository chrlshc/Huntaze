#!/usr/bin/env node

/**
 * Three.js Ecosystem Dependency Analysis Script
 * 
 * This script analyzes the current Three.js ecosystem dependencies
 * and identifies the peer dependency conflict with React 19.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Analyzing Three.js Ecosystem Dependencies\n');

// Read package.json
const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Read package-lock.json for exact versions
const packageLockPath = path.join(process.cwd(), 'package-lock.json');
const packageLock = JSON.parse(fs.readFileSync(packageLockPath, 'utf8'));

console.log('📦 Current Three.js Dependencies:');
console.log('================================');

// Analyze Three.js related dependencies
const threeRelatedDeps = {};
const dependencies = packageJson.dependencies || {};

// Find Three.js ecosystem packages
Object.keys(dependencies).forEach(dep => {
  if (dep.includes('three') || dep.includes('@react-three')) {
    threeRelatedDeps[dep] = {
      declared: dependencies[dep],
      installed: packageLock.packages?.[`node_modules/${dep}`]?.version || 'Not found'
    };
  }
});

// Display current versions
Object.entries(threeRelatedDeps).forEach(([pkg, versions]) => {
  console.log(`${pkg}:`);
  console.log(`  Declared: ${versions.declared}`);
  console.log(`  Installed: ${versions.installed}`);
  console.log('');
});

console.log('⚠️  Peer Dependency Analysis:');
console.log('============================');

// Check @react-three/drei peer dependencies
const dreiNode = packageLock.packages?.['node_modules/@react-three/drei'];
if (dreiNode) {
  console.log('@react-three/drei peer dependencies:');
  if (dreiNode.peerDependencies) {
    Object.entries(dreiNode.peerDependencies).forEach(([peer, version]) => {
      console.log(`  ${peer}: ${version}`);
    });
  }
  console.log('');
}

// Check @react-three/fiber peer dependencies  
const fiberNode = packageLock.packages?.['node_modules/@react-three/fiber'];
if (fiberNode) {
  console.log('@react-three/fiber peer dependencies:');
  if (fiberNode.peerDependencies) {
    Object.entries(fiberNode.peerDependencies).forEach(([peer, version]) => {
      console.log(`  ${peer}: ${version}`);
    });
  }
  console.log('');
}

console.log('🔴 Conflict Analysis:');
console.log('====================');

const reactVersion = dependencies.react || 'Not found';
const reactDomVersion = dependencies['react-dom'] || 'Not found';

console.log(`Current React version: ${reactVersion}`);
console.log(`Current React DOM version: ${reactDomVersion}`);
console.log('');

// Check for conflicts
if (dreiNode?.peerDependencies?.react) {
  const dreiReactReq = dreiNode.peerDependencies.react;
  console.log(`❌ CONFLICT: @react-three/drei requires React ${dreiReactReq}`);
  console.log(`   But project uses React ${reactVersion}`);
  console.log('');
}

if (dreiNode?.peerDependencies?.['react-dom']) {
  const dreiReactDomReq = dreiNode.peerDependencies['react-dom'];
  console.log(`❌ CONFLICT: @react-three/drei requires React DOM ${dreiReactDomReq}`);
  console.log(`   But project uses React DOM ${reactDomVersion}`);
  console.log('');
}

console.log('🔍 3D Component Usage Analysis:');
console.log('===============================');

// Search for 3D component usage in the codebase
const searchPatterns = [
  '@react-three/fiber',
  '@react-three/drei', 
  'Canvas',
  'useFrame',
  'useThree',
  'from "three"',
  "from 'three'"
];

let foundUsage = false;

function searchInFile(filePath, pattern) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes(pattern);
  } catch (error) {
    return false;
  }
}

function searchDirectory(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const results = [];
  
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        results.push(...searchDirectory(filePath, extensions));
      } else if (stat.isFile() && extensions.some(ext => file.endsWith(ext))) {
        results.push(filePath);
      }
    }
  } catch (error) {
    // Skip directories we can't read
  }
  
  return results;
}

const sourceFiles = searchDirectory(process.cwd());

searchPatterns.forEach(pattern => {
  const matchingFiles = sourceFiles.filter(file => searchInFile(file, pattern));
  if (matchingFiles.length > 0) {
    foundUsage = true;
    console.log(`Pattern "${pattern}" found in:`);
    matchingFiles.forEach(file => {
      console.log(`  ${path.relative(process.cwd(), file)}`);
    });
    console.log('');
  }
});

if (!foundUsage) {
  console.log('✅ No 3D components currently in use');
  console.log('   Dependencies are installed but not actively used');
  console.log('');
}

console.log('📋 Summary:');
console.log('===========');
console.log(`• React version: ${reactVersion} (target: maintain)`);
console.log(`• @react-three/drei: ${threeRelatedDeps['@react-three/drei']?.installed || 'Not installed'} (requires React ^18)`);
console.log(`• @react-three/fiber: ${threeRelatedDeps['@react-three/fiber']?.installed || 'Not installed'}`);
console.log(`• three: ${threeRelatedDeps['three']?.installed || 'Not installed'}`);
console.log(`• 3D components in use: ${foundUsage ? 'Yes' : 'No'}`);
console.log('');
console.log('🎯 Next Steps:');
console.log('• Research React 19 compatible versions of @react-three packages');
console.log('• Update to compatible versions while maintaining React 19.2.0');
console.log('• Validate build process works without --legacy-peer-deps');