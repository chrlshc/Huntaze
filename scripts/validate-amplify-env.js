#!/usr/bin/env node

/**
 * Standalone Environment Validation Script for Amplify
 * Tests environment configuration without running full build
 */

const AmplifyEnvironmentConfig = require('../lib/config/amplify-env-config.js');

async function main() {
  console.log('🚀 Starting Amplify Environment Validation...\n');
  
  try {
    const envConfig = new AmplifyEnvironmentConfig();
    const isValid = envConfig.validate();
    
    console.log('\n' + '='.repeat(50));
    
    if (isValid) {
      console.log('✅ Environment validation completed successfully!');
      console.log('Your staging environment is ready for deployment.');
      process.exit(0);
    } else {
      console.log('❌ Environment validation failed!');
      console.log('Please fix the issues above before deploying.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Validation script failed:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = main;