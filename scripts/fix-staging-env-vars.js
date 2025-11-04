#!/usr/bin/env node

/**
 * Script to help fix staging environment variables
 * This script provides guidance and validation for the fix
 */

const requiredVars = {
  'DATABASE_URL': {
    required: true,
    description: 'PostgreSQL connection string',
    example: 'postgresql://user:password@host:5432/database',
    validation: (value) => value && (value.startsWith('postgresql://') || value.startsWith('postgres://'))
  },
  'JWT_SECRET': {
    required: true,
    description: 'Secret key for JWT token generation',
    example: 'your-super-secret-jwt-key-change-this-in-production',
    validation: (value) => value && value.length >= 32 && value !== 'your-secret-key-change-in-production'
  },
  'NODE_ENV': {
    required: true,
    description: 'Node environment (production for staging)',
    example: 'production',
    validation: (value) => ['development', 'production', 'test'].includes(value)
  },
  'NEXT_PUBLIC_APP_URL': {
    required: false,
    description: 'Public URL of the application',
    example: 'https://staging.huntaze.com',
    validation: (value) => !value || value.startsWith('http')
  },
  'FROM_EMAIL': {
    required: false,
    description: 'Email address for sending emails',
    example: 'noreply@huntaze.com',
    validation: (value) => !value || value.includes('@')
  }
};

function generateEnvVarCommands() {
  console.log('🔧 AWS AMPLIFY ENVIRONMENT VARIABLES SETUP');
  console.log('='.repeat(60));
  
  console.log('\n📋 REQUIRED VARIABLES TO ADD/CHECK:');
  console.log('-'.repeat(40));
  
  Object.entries(requiredVars).forEach(([varName, config]) => {
    const status = config.required ? '🚨 CRITICAL' : '⚠️  IMPORTANT';
    console.log(`\n${status} ${varName}`);
    console.log(`   Description: ${config.description}`);
    console.log(`   Example: ${config.example}`);
  });
  
  console.log('\n🛠️  AWS AMPLIFY CONSOLE STEPS:');
  console.log('-'.repeat(40));
  console.log('1. Go to AWS Amplify Console');
  console.log('2. Select Huntaze app');
  console.log('3. Go to Hosting environments > staging');
  console.log('4. Click on "Environment variables"');
  console.log('5. Click "Manage variables"');
  console.log('6. Add each missing variable above');
  console.log('7. Click "Save"');
  console.log('8. Redeploy the staging environment');
  
  console.log('\n🔍 AWS CLI COMMANDS (Alternative):');
  console.log('-'.repeat(40));
  console.log('# First, get your app ID:');
  console.log('aws amplify list-apps');
  console.log('');
  console.log('# Then update environment variables:');
  console.log('aws amplify update-app --app-id [YOUR_APP_ID] \\');
  console.log('  --environment-variables \\');
  Object.entries(requiredVars).forEach(([varName, config]) => {
    if (config.required) {
      console.log(`    ${varName}="[YOUR_${varName}]" \\`);
    }
  });
  console.log('    # Remove the last backslash');
}

async function validateStagingHealth() {
  const stagingUrl = 'https://staging.huntaze.com'; // Adjust if different
  
  console.log('\n🧪 VALIDATION TESTS');
  console.log('='.repeat(60));
  
  const tests = [
    { name: 'Overall Health', endpoint: '/api/health/overall' },
    { name: 'Database Health', endpoint: '/api/health/database' },
    { name: 'Auth Health', endpoint: '/api/health/auth' },
    { name: 'Config Health', endpoint: '/api/health/config' }
  ];
  
  console.log('\n📋 Run these commands to validate the fix:');
  console.log('-'.repeat(40));
  
  tests.forEach(test => {
    console.log(`\n# Test ${test.name}:`);
    console.log(`curl -s "${stagingUrl}${test.endpoint}" | jq .`);
  });
  
  console.log('\n# Test Login Endpoint:');
  console.log(`curl -X POST "${stagingUrl}/api/auth/login" \\`);
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"email":"test@example.com","password":"test123"}\' | jq .');
  
  console.log('\n✅ EXPECTED RESULTS:');
  console.log('-'.repeat(40));
  console.log('- Health endpoints should return status: "healthy"');
  console.log('- Login should return 401 "Invalid email or password" (not 500)');
  console.log('- No "Internal server error" messages');
}

function generateRollbackPlan() {
  console.log('\n🔄 ROLLBACK PLAN (if fix fails)');
  console.log('='.repeat(60));
  
  console.log('\n📋 OPTION 1: Configuration Rollback');
  console.log('-'.repeat(40));
  console.log('1. Restore environment variables from production');
  console.log('2. Or restore from backup (if available)');
  console.log('3. Redeploy staging');
  
  console.log('\n📋 OPTION 2: Code Rollback');
  console.log('-'.repeat(40));
  console.log('# Rollback to commit before Smart Onboarding:');
  console.log('git log --oneline -10  # Find commit before d9d4ca36a');
  console.log('git checkout [previous-commit]');
  console.log('git push huntaze staging --force');
  
  console.log('\n📋 OPTION 3: Complete Revert');
  console.log('-'.repeat(40));
  console.log('# Revert the Smart Onboarding deployment:');
  console.log('git revert d9d4ca36a');
  console.log('git push huntaze staging');
}

function showTimeline() {
  console.log('\n⏱️  ESTIMATED TIMELINE');
  console.log('='.repeat(60));
  console.log('1. Environment variables setup: 5-10 minutes');
  console.log('2. Staging redeploy: 3-5 minutes');
  console.log('3. Validation testing: 2-3 minutes');
  console.log('4. Total estimated time: 10-18 minutes');
  
  console.log('\n🎯 SUCCESS CRITERIA:');
  console.log('-'.repeat(40));
  console.log('✅ /api/health/overall returns "healthy"');
  console.log('✅ /api/auth/login returns 401 (not 500)');
  console.log('✅ Smart Onboarding pages accessible after login');
}

function main() {
  console.log('🚀 STAGING LOGIN ERROR - AUTOMATED FIX GUIDE');
  console.log('Generated on:', new Date().toISOString());
  console.log('Issue: Internal Server Error (500) on /api/auth/login');
  console.log('Root Cause: Missing environment variables in AWS Amplify');
  
  generateEnvVarCommands();
  validateStagingHealth();
  generateRollbackPlan();
  showTimeline();
  
  console.log('\n🏁 NEXT STEPS:');
  console.log('='.repeat(60));
  console.log('1. Follow the AWS Amplify Console steps above');
  console.log('2. Run the validation commands');
  console.log('3. If successful, test Smart Onboarding functionality');
  console.log('4. If failed, execute rollback plan');
  
  console.log('\n📞 Need help? Check STAGING_LOGIN_FIX_GUIDE.md for detailed instructions');
}

main();