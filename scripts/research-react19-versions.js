#!/usr/bin/env node

/**
 * React 19 Compatibility Research Script
 * 
 * This script researches React 19 compatible versions of @react-three packages
 * by checking npm registry information and peer dependencies.
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 Researching React 19 Compatible Versions\n');

// Packages to research
const packages = [
  '@react-three/fiber',
  '@react-three/drei',
  'three'
];

async function checkPackageVersions(packageName) {
  console.log(`📦 Researching ${packageName}:`);
  console.log('='.repeat(50));
  
  try {
    // Get package info from npm
    const result = execSync(`npm view ${packageName} --json`, { encoding: 'utf8' });
    const packageInfo = JSON.parse(result);
    
    console.log(`Latest version: ${packageInfo.version}`);
    console.log(`Description: ${packageInfo.description}`);
    
    // Check peer dependencies
    if (packageInfo.peerDependencies) {
      console.log('\nPeer Dependencies:');
      Object.entries(packageInfo.peerDependencies).forEach(([dep, version]) => {
        console.log(`  ${dep}: ${version}`);
        
        // Highlight React compatibility
        if (dep === 'react' || dep === 'react-dom') {
          const isReact19Compatible = version.includes('19') || 
                                     version.includes('>=19') || 
                                     version.includes('^19') ||
                                     version.includes('>=18');
          console.log(`    ${isReact19Compatible ? '✅' : '❌'} React 19 compatible: ${isReact19Compatible}`);
        }
      });
    }
    
    // Get recent versions to check for React 19 support
    console.log('\nRecent versions:');
    const versionsResult = execSync(`npm view ${packageName} versions --json`, { encoding: 'utf8' });
    const versions = JSON.parse(versionsResult);
    const recentVersions = versions.slice(-10); // Last 10 versions
    
    recentVersions.forEach(version => {
      console.log(`  ${version}`);
    });
    
    // Check specific version peer deps for latest
    try {
      const latestVersionInfo = execSync(`npm view ${packageName}@${packageInfo.version} --json`, { encoding: 'utf8' });
      const latestInfo = JSON.parse(latestVersionInfo);
      
      if (latestInfo.peerDependencies?.react) {
        const reactPeerDep = latestInfo.peerDependencies.react;
        console.log(`\nLatest version (${packageInfo.version}) React peer dependency: ${reactPeerDep}`);
        
        // Check if it supports React 19
        const supportsReact19 = reactPeerDep.includes('19') || 
                               reactPeerDep.includes('>=19') ||
                               reactPeerDep.includes('^19') ||
                               (reactPeerDep.includes('>=18') && !reactPeerDep.includes('<19'));
        
        console.log(`React 19 support: ${supportsReact19 ? '✅ YES' : '❌ NO'}`);
        
        if (!supportsReact19) {
          console.log('🔍 Checking for newer versions with React 19 support...');
          
          // Check if there are any pre-release or beta versions
          try {
            const allVersionsResult = execSync(`npm view ${packageName} versions --json`, { encoding: 'utf8' });
            const allVersions = JSON.parse(allVersionsResult);
            
            // Look for versions that might support React 19
            const potentialVersions = allVersions.filter(v => 
              v.includes('beta') || 
              v.includes('alpha') || 
              v.includes('rc') ||
              parseFloat(v.split('.')[0]) >= 9 // Major version 9+ might have React 19 support
            );
            
            if (potentialVersions.length > 0) {
              console.log('Potential React 19 compatible versions found:');
              potentialVersions.slice(-5).forEach(v => console.log(`  ${v}`));
            }
          } catch (error) {
            console.log('Could not check for pre-release versions');
          }
        }
      }
    } catch (error) {
      console.log('Could not get detailed version info');
    }
    
  } catch (error) {
    console.log(`❌ Error checking ${packageName}: ${error.message}`);
  }
  
  console.log('\n');
}

async function checkReactThreeEcosystem() {
  console.log('🌐 React Three Ecosystem Analysis\n');
  
  for (const pkg of packages) {
    await checkPackageVersions(pkg);
  }
  
  console.log('🎯 Compatibility Summary:');
  console.log('========================');
  
  // Check current project React version
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const currentReact = packageJson.dependencies.react;
  console.log(`Current React version: ${currentReact}`);
  
  console.log('\nRecommendations:');
  console.log('• Check @react-three/fiber latest version for React 19 support');
  console.log('• Check @react-three/drei latest version for React 19 support');
  console.log('• Consider using overrides in package.json if peer deps are close');
  console.log('• Test thoroughly after any version changes');
  
  console.log('\nNext steps:');
  console.log('1. Try installing latest versions');
  console.log('2. Check if peer dependency warnings can be resolved');
  console.log('3. Test 3D components functionality');
  console.log('4. Validate build process');
}

// Run the research
checkReactThreeEcosystem().catch(console.error);