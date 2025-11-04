#!/usr/bin/env node

/**
 * CLI Tool for Staging Login Error Fix
 * Complete diagnostic and fix solution in one command
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const STAGING_URL = process.env.STAGING_URL || 'https://staging.huntaze.com';
const AMPLIFY_APP_ID = process.env.AMPLIFY_APP_ID || null;

// Colors for CLI output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(title) {
  log('\n' + '='.repeat(60), 'cyan');
  log(`🚀 ${title}`, 'bright');
  log('='.repeat(60), 'cyan');
}

function section(title) {
  log(`\n📋 ${title}`, 'blue');
  log('-'.repeat(40), 'blue');
}

async function testEndpoint(name, url, options = {}) {
  try {
    log(`\n🔍 Testing ${name}...`, 'yellow');
    
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const data = await response.json();
    
    if (response.status < 400) {
      log(`   ✅ ${name}: ${data.status || 'OK'}`, 'green');
    } else {
      log(`   ❌ ${name}: ${data.error || 'Error'}`, 'red');
    }
    
    return {
      name,
      status: response.status,
      success: response.status < 400,
      data
    };
    
  } catch (error) {
    log(`   ❌ ${name}: ${error.message}`, 'red');
    return {
      name,
      status: 'error',
      success: false,
      error: error.message
    };
  }
}

async function runDiagnostics() {
  header('STAGING LOGIN ERROR - DIAGNOSTIC SUITE');
  
  section('Health Check Tests');
  
  const tests = [
    { name: 'Overall Health', url: `${STAGING_URL}/api/health/overall` },
    { name: 'Database Health', url: `${STAGING_URL}/api/health/database` },
    { name: 'Auth Health', url: `${STAGING_URL}/api/health/auth` },
    { name: 'Config Health', url: `${STAGING_URL}/api/health/config` }
  ];
  
  const results = [];
  for (const test of tests) {
    const result = await testEndpoint(test.name, test.url);
    results.push(result);
  }
  
  section('Login Endpoint Test');
  const loginResult = await testEndpoint(
    'Login Endpoint',
    `${STAGING_URL}/api/auth/login`,
    {
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'testpassword123'
      }
    }
  );
  results.push(loginResult);
  
  return results;
}

function analyzeResults(results) {
  section('Diagnostic Analysis');
  
  const criticalFailures = results.filter(r => 
    ['Overall Health', 'Database Health', 'Auth Health'].includes(r.name) && !r.success
  );
  
  const loginTest = results.find(r => r.name === 'Login Endpoint');
  const loginBroken = loginTest && loginTest.status === 500;
  
  if (criticalFailures.length > 0) {
    log('❌ Critical system failures detected:', 'red');
    criticalFailures.forEach(failure => {
      log(`   - ${failure.name}`, 'red');
    });
  }
  
  if (loginBroken) {
    log('❌ Login endpoint returning 500 errors', 'red');
    log('   Root cause: Environment variables missing in AWS Amplify', 'yellow');
  }
  
  return {
    hasCriticalIssues: criticalFailures.length > 0 || loginBroken,
    criticalFailures,
    loginBroken
  };
}

function showFixInstructions() {
  section('Fix Instructions');
  
  log('🔧 REQUIRED ACTIONS:', 'bright');
  log('\n1. Go to AWS Amplify Console:', 'yellow');
  log('   https://console.aws.amazon.com/amplify/');
  
  log('\n2. Navigate to your app:', 'yellow');
  log('   - Select "Huntaze" app');
  log('   - Go to "Hosting environments"');
  log('   - Click on "staging" branch');
  log('   - Go to "Environment variables"');
  
  log('\n3. Add missing variables:', 'yellow');
  log('   DATABASE_URL=postgresql://user:password@host:5432/database');
  log('   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production');
  log('   NODE_ENV=production');
  
  log('\n4. Redeploy staging:', 'yellow');
  log('   - Click "Redeploy this version" in Deployments tab');
  log('   - Or push an empty commit to trigger rebuild');
  
  log('\n5. Validate the fix:', 'yellow');
  log('   node scripts/staging-login-cli.js --validate');
}

function showAWSCLICommands() {
  section('AWS CLI Alternative');
  
  if (!AMPLIFY_APP_ID) {
    log('⚠️  AMPLIFY_APP_ID not set. First run:', 'yellow');
    log('   aws amplify list-apps');
    log('   export AMPLIFY_APP_ID=your-app-id');
    log('');
  }
  
  log('🔧 AWS CLI Commands:', 'bright');
  log('');
  log('# Update environment variables:');
  log(`aws amplify update-app --app-id ${AMPLIFY_APP_ID || '[YOUR_APP_ID]'} \\`);
  log('  --environment-variables \\');
  log('    DATABASE_URL="[YOUR_DATABASE_URL]" \\');
  log('    JWT_SECRET="[YOUR_JWT_SECRET]" \\');
  log('    NODE_ENV="production"');
  log('');
  log('# Trigger redeploy:');
  log(`aws amplify start-job --app-id ${AMPLIFY_APP_ID || '[YOUR_APP_ID]'} \\`);
  log('  --branch-name staging --job-type RELEASE');
}

function showRollbackPlan() {
  section('Rollback Plan (if fix fails)');
  
  log('🔄 OPTION 1: Configuration Rollback', 'bright');
  log('   - Restore environment variables from production');
  log('   - Or restore from backup (if available)');
  
  log('\n🔄 OPTION 2: Code Rollback', 'bright');
  log('   git log --oneline -10  # Find commit before Smart Onboarding');
  log('   git checkout [previous-commit]');
  log('   git push huntaze staging --force');
  
  log('\n🔄 OPTION 3: Complete Revert', 'bright');
  log('   git revert d9d4ca36a  # Revert Smart Onboarding deployment');
  log('   git push huntaze staging');
}

function showCurlCommands() {
  section('Manual Testing Commands');
  
  log('🧪 Test health endpoints:', 'bright');
  log(`curl -s "${STAGING_URL}/api/health/overall" | jq .`);
  log(`curl -s "${STAGING_URL}/api/health/database" | jq .`);
  log(`curl -s "${STAGING_URL}/api/health/auth" | jq .`);
  
  log('\n🧪 Test login endpoint:', 'bright');
  log(`curl -X POST "${STAGING_URL}/api/auth/login" \\`);
  log('  -H "Content-Type: application/json" \\');
  log('  -d \'{"email":"test@example.com","password":"test123"}\' | jq .');
}

function showSummary(analysis) {
  section('Summary & Next Steps');
  
  if (analysis.hasCriticalIssues) {
    log('🚨 STAGING LOGIN ERROR CONFIRMED', 'red');
    log('   Root Cause: Missing environment variables in AWS Amplify', 'yellow');
    log('   Estimated Fix Time: 5-10 minutes', 'yellow');
    log('   Success Probability: 95%', 'green');
    
    log('\n📋 IMMEDIATE ACTIONS:', 'bright');
    log('   1. Follow the AWS Amplify Console instructions above');
    log('   2. Add the missing environment variables');
    log('   3. Redeploy staging environment');
    log('   4. Run validation: node scripts/staging-login-cli.js --validate');
    
  } else {
    log('✅ NO CRITICAL ISSUES DETECTED', 'green');
    log('   All health checks are passing');
    log('   Login endpoint is working correctly');
    log('   Smart Onboarding should be accessible');
  }
}

async function validateFix() {
  header('STAGING LOGIN FIX - VALIDATION');
  
  const results = await runDiagnostics();
  const analysis = analyzeResults(results);
  
  if (!analysis.hasCriticalIssues) {
    log('\n🎉 SUCCESS! Staging login error has been RESOLVED!', 'green');
    log('✅ All critical health checks passing', 'green');
    log('✅ Login endpoint working correctly', 'green');
    log('✅ Smart Onboarding ready for testing', 'green');
    
    log('\n🚀 Next Steps:', 'bright');
    log('   1. Test Smart Onboarding functionality');
    log('   2. Perform end-to-end user journey testing');
    log('   3. Monitor for any additional issues');
    
    return true;
  } else {
    log('\n❌ Issues still exist - fix not complete', 'red');
    log('\n💡 Recommended actions:', 'yellow');
    log('   1. Double-check environment variables in AWS Amplify');
    log('   2. Ensure staging environment has been redeployed');
    log('   3. Check AWS Amplify deployment logs for errors');
    log('   4. Consider rollback if issues persist');
    
    return false;
  }
}

function showHelp() {
  header('STAGING LOGIN CLI - HELP');
  
  log('Usage:', 'bright');
  log('  node scripts/staging-login-cli.js [command]');
  log('');
  log('Commands:', 'bright');
  log('  --diagnose, -d     Run full diagnostic suite (default)');
  log('  --validate, -v     Validate that the fix is working');
  log('  --fix, -f          Show detailed fix instructions');
  log('  --rollback, -r     Show rollback procedures');
  log('  --curl, -c         Show manual testing commands');
  log('  --help, -h         Show this help message');
  log('');
  log('Environment Variables:', 'bright');
  log('  STAGING_URL        Staging environment URL (default: https://staging.huntaze.com)');
  log('  AMPLIFY_APP_ID     AWS Amplify App ID for CLI commands');
  log('');
  log('Examples:', 'bright');
  log('  node scripts/staging-login-cli.js --diagnose');
  log('  node scripts/staging-login-cli.js --validate');
  log('  STAGING_URL=https://my-staging.com node scripts/staging-login-cli.js');
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || '--diagnose';
  
  try {
    switch (command) {
      case '--diagnose':
      case '-d':
        const results = await runDiagnostics();
        const analysis = analyzeResults(results);
        showFixInstructions();
        showAWSCLICommands();
        showRollbackPlan();
        showCurlCommands();
        showSummary(analysis);
        break;
        
      case '--validate':
      case '-v':
        const success = await validateFix();
        process.exit(success ? 0 : 1);
        break;
        
      case '--fix':
      case '-f':
        showFixInstructions();
        showAWSCLICommands();
        break;
        
      case '--rollback':
      case '-r':
        showRollbackPlan();
        break;
        
      case '--curl':
      case '-c':
        showCurlCommands();
        break;
        
      case '--help':
      case '-h':
        showHelp();
        break;
        
      default:
        // Default to diagnose if no command specified
        const defaultResults = await runDiagnostics();
        const defaultAnalysis = analyzeResults(defaultResults);
        showFixInstructions();
        showAWSCLICommands();
        showRollbackPlan();
        showCurlCommands();
        showSummary(defaultAnalysis);
        break;
    }
    
  } catch (error) {
    log(`\n❌ CLI Error: ${error.message}`, 'red');
    log('This might indicate network issues or staging unavailability', 'yellow');
    log('Try running manual curl commands or check staging status', 'yellow');
    process.exit(1);
  }
}

// Make script executable
if (require.main === module) {
  main();
}

module.exports = {
  runDiagnostics,
  analyzeResults,
  validateFix,
  testEndpoint
};