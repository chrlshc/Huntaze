#!/usr/bin/env node

/**
 * Build Issue Diagnostic Script
 * Identifies common build failures and provides solutions
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnosing build issue...\n');

// Check package.json for potential issues
function checkPackageJson() {
  console.log('📦 Checking package.json...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Check for build script
    if (!packageJson.scripts || !packageJson.scripts.build) {
      console.log('❌ Missing build script in package.json');
      return false;
    }
    
    console.log('✅ Build script found:', packageJson.scripts.build);
    
    // Check for critical dependencies
    const criticalDeps = ['next', 'react', 'react-dom'];
    const missing = criticalDeps.filter(dep => 
      !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
    );
    
    if (missing.length > 0) {
      console.log('❌ Missing critical dependencies:', missing);
      return false;
    }
    
    console.log('✅ Critical dependencies present');
    return true;
  } catch (error) {
    console.log('❌ Error reading package.json:', error.message);
    return false;
  }
}

// Check Next.js config
function checkNextConfig() {
  console.log('\n⚙️ Checking Next.js configuration...');
  
  const configFiles = ['next.config.js', 'next.config.mjs', 'next.config.ts'];
  const configFile = configFiles.find(file => fs.existsSync(file));
  
  if (!configFile) {
    console.log('⚠️ No Next.js config file found');
    return true; // Not required
  }
  
  console.log('✅ Next.js config found:', configFile);
  
  try {
    const configContent = fs.readFileSync(configFile, 'utf8');
    
    // Check for common problematic patterns
    const issues = [];
    
    if (configContent.includes('experimental')) {
      issues.push('Experimental features detected - may cause build issues');
    }
    
    if (configContent.includes('webpack:') && configContent.includes('fallback')) {
      issues.push('Custom webpack fallbacks - verify compatibility');
    }
    
    if (issues.length > 0) {
      console.log('⚠️ Potential config issues:');
      issues.forEach(issue => console.log(`  - ${issue}`));
    } else {
      console.log('✅ Config appears clean');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Error reading config:', error.message);
    return false;
  }
}

// Check for problematic files
function checkProblematicFiles() {
  console.log('\n🔍 Checking for problematic files...');
  
  const problematicPatterns = [
    { pattern: /\.env\.local$/, message: 'Local env files should not be committed' },
    { pattern: /node_modules/, message: 'node_modules should not be committed' },
    { pattern: /\.next/, message: 'Build artifacts should not be committed' }
  ];
  
  function scanDirectory(dir, depth = 0) {
    if (depth > 3) return; // Limit recursion
    
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scanDirectory(fullPath, depth + 1);
        } else {
          problematicPatterns.forEach(({ pattern, message }) => {
            if (pattern.test(fullPath)) {
              console.log(`⚠️ ${message}: ${fullPath}`);
            }
          });
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  scanDirectory('.');
  console.log('✅ File scan complete');
}

// Check environment variables
function checkEnvironment() {
  console.log('\n🌍 Checking environment setup...');
  
  // Check for .env.example
  if (fs.existsSync('.env.example')) {
    console.log('✅ .env.example found');
    
    try {
      const envExample = fs.readFileSync('.env.example', 'utf8');
      const requiredVars = envExample
        .split('\n')
        .filter(line => line.includes('=') && !line.startsWith('#'))
        .map(line => line.split('=')[0]);
      
      console.log(`📋 Found ${requiredVars.length} environment variables in example`);
      
      // Check if any are missing critical prefixes
      const nextPublicVars = requiredVars.filter(v => v.startsWith('NEXT_PUBLIC_'));
      console.log(`🔓 ${nextPublicVars.length} public environment variables`);
      
    } catch (error) {
      console.log('⚠️ Could not parse .env.example');
    }
  } else {
    console.log('⚠️ No .env.example found');
  }
}

// Main diagnostic function
async function runDiagnostic() {
  console.log('🚀 Starting build diagnostic...\n');
  
  const checks = [
    checkPackageJson,
    checkNextConfig,
    checkProblematicFiles,
    checkEnvironment
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    try {
      const result = await check();
      if (!result) allPassed = false;
    } catch (error) {
      console.log('❌ Check failed:', error.message);
      allPassed = false;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (allPassed) {
    console.log('✅ All checks passed - build should work');
    console.log('\n💡 If build still fails, check:');
    console.log('  - Amplify environment variables');
    console.log('  - Build timeout settings');
    console.log('  - Memory allocation');
  } else {
    console.log('❌ Issues detected - fix before deploying');
  }
  
  console.log('\n🔧 Quick fixes to try:');
  console.log('  1. npm ci --prefer-offline');
  console.log('  2. npm run build (test locally)');
  console.log('  3. Check Amplify console for detailed logs');
  console.log('  4. Verify environment variables in Amplify');
}

// Run the diagnostic
runDiagnostic().catch(console.error);