#!/usr/bin/env node

/**
 * Quick Environment Variables Validation Script for CI/CD
 * 
 * Performs fast validation suitable for CI/CD pipelines
 * Exits with code 0 for success, 1 for failure
 */

const { ValidationEngine, AwsCliWrapper, Logger } = require('../../lib/amplify-env-vars');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  appId: null,
  branch: 'staging',
  timeout: 10000, // 10 seconds timeout for CI/CD
  verbose: false
};

// Simple argument parsing
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  switch (arg) {
    case '--app-id':
      options.appId = args[++i];
      break;
    case '--branch':
      options.branch = args[++i];
      break;
    case '--timeout':
      options.timeout = parseInt(args[++i]) || 10000;
      break;
    case '--verbose':
      options.verbose = true;
      break;
    case '--help':
      showHelp();
      process.exit(0);
    default:
      if (arg.startsWith('--')) {
        console.error(`Unknown option: ${arg}`);
        process.exit(1);
      }
  }
}

// Validate required options
if (!options.appId) {
  console.error('❌ Error: --app-id is required');
  showHelp();
  process.exit(1);
}

// Main validation function
async function main() {
  const startTime = Date.now();
  
  try {
    if (options.verbose) {
      console.log(`🔍 Quick validation for ${options.appId}/${options.branch}...`);
    }
    
    // Load variables from AWS Amplify with timeout
    const result = await Promise.race([
      AwsCliWrapper.getEnvironmentVariables(options.appId, options.branch),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), options.timeout)
      )
    ]);
    
    if (!result.success) {
      console.error(`❌ Failed to load variables: ${result.error}`);
      process.exit(1);
    }
    
    const variables = Object.entries(result.variables || {}).map(([key, value]) => ({ key, value }));
    
    if (variables.length === 0) {
      console.error('❌ No environment variables found');
      process.exit(1);
    }
    
    // Perform quick validation
    const validationResult = await ValidationEngine.quickValidation(variables);
    
    const executionTime = Date.now() - startTime;
    
    // Output results
    if (options.verbose) {
      console.log(`\n📊 Quick Validation Results:`);
      console.log(`Status: ${validationResult.passed ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`Score: ${validationResult.score}%`);
      console.log(`Variables: ${variables.length}`);
      console.log(`Critical Errors: ${validationResult.criticalErrors}`);
      console.log(`Warnings: ${validationResult.warnings}`);
      console.log(`Execution Time: ${executionTime}ms`);
      
      if (validationResult.details.length > 0) {
        console.log('\n🚨 Critical Issues:');
        validationResult.details.forEach(detail => {
          console.log(`   ❌ ${detail}`);
        });
      }
    } else {
      // Minimal output for CI/CD
      const status = validationResult.passed ? 'PASS' : 'FAIL';
      console.log(`${status} ${validationResult.score}% ${validationResult.criticalErrors} errors ${validationResult.warnings} warnings ${executionTime}ms`);
      
      if (!validationResult.passed && validationResult.details.length > 0) {
        console.log('Critical issues:');
        validationResult.details.forEach(detail => {
          console.log(`  - ${detail}`);
        });
      }
    }
    
    // Exit with appropriate code
    process.exit(validationResult.passed ? 0 : 1);
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    if (error.message === 'Timeout') {
      console.error(`❌ TIMEOUT after ${options.timeout}ms`);
    } else {
      console.error(`❌ ERROR: ${error.message}`);
    }
    
    if (options.verbose) {
      console.error(`Execution Time: ${executionTime}ms`);
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

// Show help information
function showHelp() {
  console.log(`
Quick Environment Variables Validation Script for CI/CD

Usage:
  node quick-validate.js --app-id <id> [options]

Options:
  --app-id <id>         AWS Amplify app ID (required)
  --branch <name>       Branch name (default: staging)
  --timeout <ms>        Timeout in milliseconds (default: 10000)
  --verbose            Show detailed output
  --help               Show this help message

Exit Codes:
  0                    Validation passed
  1                    Validation failed or error occurred

Examples:
  # Quick validation for CI/CD
  node quick-validate.js --app-id d123abc --branch staging

  # With custom timeout
  node quick-validate.js --app-id d123abc --timeout 5000

  # Verbose output for debugging
  node quick-validate.js --app-id d123abc --verbose

CI/CD Integration Examples:

  GitHub Actions:
  - name: Validate Environment Variables
    run: node scripts/amplify-env-vars/quick-validate.js --app-id [AMPLIFY_APP_ID] --branch staging

  GitLab CI:
  validate_env_vars:
    script:
      - node scripts/amplify-env-vars/quick-validate.js --app-id [AMPLIFY_APP_ID] --branch staging

  Jenkins:
  sh 'node scripts/amplify-env-vars/quick-validate.js --app-id [AMPLIFY_APP_ID] --branch staging'
`);
}

// Run the main function
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = { main };