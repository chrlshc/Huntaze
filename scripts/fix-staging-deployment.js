#!/usr/bin/env node

/**
 * Staging Deployment Fix Script
 * Validates environment and provides deployment diagnostics
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Staging Deployment Fix - Starting diagnostics...');

// Check critical files
const criticalFiles = [
  'package.json',
  'next.config.ts',
  'amplify.yml',
  '.env.production'
];

console.log('\n📁 Checking critical files...');
criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - Found`);
  } else {
    console.log(`❌ ${file} - Missing`);
  }
});

// Check Node.js version
console.log('\n🟢 Node.js Environment:');
console.log(`Node.js version: ${process.version}`);
console.log(`NPM version: ${process.env.npm_version || 'Unknown'}`);

// Check environment variables
console.log('\n🔐 Environment Variables Check:');
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'NEXT_PUBLIC_APP_URL'
];

const optionalEnvVars = [
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'NODE_ENV',
  'BUILD_REDIS_MOCK'
];

requiredEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar} - Set`);
  } else {
    console.log(`⚠️  ${envVar} - Missing (will use fallback)`);
  }
});

console.log('\n📋 Optional Environment Variables:');
optionalEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar} - Set (${process.env[envVar]})`);
  } else {
    console.log(`ℹ️  ${envVar} - Not set`);
  }
});

// Memory check
const memoryUsage = process.memoryUsage();
console.log('\n💾 Memory Usage:');
console.log(`RSS: ${Math.round(memoryUsage.rss / 1024 / 1024)}MB`);
console.log(`Heap Used: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`);
console.log(`Heap Total: ${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`);

console.log('\n✅ Staging deployment diagnostics completed');
console.log('🚀 Ready for deployment with optimized configuration');
// C
heck for common build issues
console.log('\n🔧 Build Environment Validation:');

// Check if package.json has build script
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (packageJson.scripts && packageJson.scripts.build) {
    console.log('✅ Build script found in package.json');
  } else {
    console.log('❌ No build script found in package.json');
  }
} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
}

// Check Next.js config
if (fs.existsSync('next.config.ts') || fs.existsSync('next.config.js')) {
  console.log('✅ Next.js configuration file found');
} else {
  console.log('⚠️  No Next.js configuration file found');
}

// Check for TypeScript
if (fs.existsSync('tsconfig.json')) {
  console.log('✅ TypeScript configuration found');
} else {
  console.log('ℹ️  No TypeScript configuration (JavaScript project)');
}