#!/usr/bin/env node

/**
 * Pre-build validation script for Amplify deployment
 * Catches common build issues before they cause failures
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Pre-build validation starting...');

let hasErrors = false;

// Check critical files
const criticalFiles = [
  { file: 'package.json', required: true },
  { file: 'next.config.ts', required: false },
  { file: 'next.config.js', required: false },
  { file: 'tsconfig.json', required: false }
];

console.log('\n📁 File validation:');
criticalFiles.forEach(({ file, required }) => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - Found`);
  } else if (required) {
    console.log(`❌ ${file} - Missing (required)`);
    hasErrors = true;
  } else {
    console.log(`ℹ️  ${file} - Not found (optional)`);
  }
});

// Validate package.json
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  console.log('\n📦 Package.json validation:');
  
  if (packageJson.scripts?.build) {
    console.log('✅ Build script found');
  } else {
    console.log('❌ No build script found');
    hasErrors = true;
  }
  
  if (packageJson.dependencies?.next) {
    console.log(`✅ Next.js dependency found (${packageJson.dependencies.next})`);
  } else {
    console.log('❌ Next.js dependency missing');
    hasErrors = true;
  }
  
  if (packageJson.dependencies?.react) {
    console.log(`✅ React dependency found (${packageJson.dependencies.react})`);
  } else {
    console.log('❌ React dependency missing');
    hasErrors = true;
  }
  
} catch (error) {
  console.log('❌ Error parsing package.json:', error.message);
  hasErrors = true;
}

// Check environment setup
console.log('\n🔐 Environment validation:');
const criticalEnvVars = ['NODE_ENV'];
criticalEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar} = ${process.env[envVar]}`);
  } else {
    console.log(`⚠️  ${envVar} not set`);
  }
});

// Final result
console.log('\n🎯 Validation Summary:');
if (hasErrors) {
  console.log('❌ Validation failed - build may encounter issues');
  console.log('🔧 Please fix the errors above before proceeding');
  process.exit(1);
} else {
  console.log('✅ All validations passed - ready for build');
  console.log('🚀 Proceeding with deployment...');
}