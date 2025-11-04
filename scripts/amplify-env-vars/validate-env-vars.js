#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * Validates environment variables using the validation engine
 */

const { ValidationEngine, AwsCliWrapper, Logger } = require('../../lib/amplify-env-vars');
const fs = require('fs');
const path = require('path');

// Command line argument parsing
const args = process.argv.slice(2);
const options = {
  appId: null,
  branch: 'staging',
  skipConnectivity: false,
  format: 'table',
  output: null,
  config: null,
  quick: false,
  verbose: false
};

// Parse command line arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  switch (arg) {
    case '--app-id':
      options.appId = args[++i];
      break;
    case '--branch':
      options.branch = args[++i];
      break;
    case '--skip-connectivity':
      options.skipConnectivity = true;
      break;
    case '--format':
      options.format = args[++i];
      break;
    case '--output':
      options.output = args[++i];
      break;
    case '--config':
      options.config = args[++i];
      break;
    case '--quick':
      options.quick = true;
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
if (!options.appId && !options.config) {
  console.error('Error: Either --app-id or --config is required');
  showHelp();
  process.exit(1);
}

// Main validation function
async function main() {
  try {
    Logger.log('Starting environment variables validation...', 'info');
    
    let variables = [];
    
    if (options.config) {
      // Load variables from configuration file
      variables = await loadVariablesFromConfig(options.config);
    } else {
      // Load variables from AWS Amplify
      variables = await loadVariablesFromAmplify(options.appId, options.branch);
    }
    
    if (variables.length === 0) {
      Logger.log('No environment variables found to validate', 'warn');
      return;
    }
    
    Logger.log(`Found ${variables.length} environment variables to validate`, 'info');
    
    let result;
    
    if (options.quick) {
      // Quick validation for CI/CD
      result = await ValidationEngine.quickValidation(variables);
      displayQuickResults(result);
    } else {
      // Full validation
      const validationOptions = {
        skipConnectivityTests: options.skipConnectivity,
        useCache: true,
        parallel: true,
        timeout: 30000
      };
      
      result = await ValidationEngine.validateEnvironmentVariables(variables, validationOptions);
      
      if (result.success) {
        displayResults(result.report, options.format);
        
        // Save output to file if specified
        if (options.output) {
          await saveResults(result.report, options.output, options.format);
        }
      } else {
        Logger.log(`Validation failed: ${result.error}`, 'error');
        process.exit(1);
      }
    }
    
    // Exit with appropriate code
    if (options.quick) {
      process.exit(result.passed ? 0 : 1);
    } else {
      const hasErrors = result.report.categorizedResults.critical.length > 0;
      process.exit(hasErrors ? 1 : 0);
    }
    
  } catch (error) {
    Logger.log(`Validation script failed: ${error.message}`, 'error');
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Load variables from configuration file
async function loadVariablesFromConfig(configPath) {
  try {
    const fullPath = path.resolve(configPath);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Configuration file not found: ${fullPath}`);
    }
    
    const content = fs.readFileSync(fullPath, 'utf8');
    let config;
    
    if (configPath.endsWith('.json')) {
      config = JSON.parse(content);
    } else if (configPath.endsWith('.yaml') || configPath.endsWith('.yml')) {
      // Simple YAML parsing (in production, use a proper YAML library)
      const lines = content.split('\n');
      config = {};
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes(':')) {
          const [key, ...valueParts] = trimmed.split(':');
          const value = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
          config[key.trim()] = value;
        }
      }
    } else {
      throw new Error('Unsupported configuration file format. Use .json, .yaml, or .yml');
    }
    
    return Object.entries(config).map(([key, value]) => ({
      key,
      value: String(value)
    }));
    
  } catch (error) {
    throw new Error(`Failed to load configuration file: ${error.message}`);
  }
}

// Load variables from AWS Amplify
async function loadVariablesFromAmplify(appId, branch) {
  try {
    Logger.log(`Loading variables from Amplify app ${appId}, branch ${branch}`, 'info');
    
    const result = await AwsCliWrapper.getEnvironmentVariables(appId, branch);
    
    if (!result.success) {
      throw new Error(`Failed to load variables from Amplify: ${result.error}`);
    }
    
    return Object.entries(result.variables || {}).map(([key, value]) => ({
      key,
      value: String(value)
    }));
    
  } catch (error) {
    throw new Error(`Failed to load variables from Amplify: ${error.message}`);
  }
}

// Display quick validation results
function displayQuickResults(result) {
  console.log('\n=== Quick Validation Results ===');
  console.log(`Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Score: ${result.score}%`);
  console.log(`Critical Errors: ${result.criticalErrors}`);
  console.log(`Warnings: ${result.warnings}`);
  
  if (result.details.length > 0) {
    console.log('\nCritical Issues:');
    result.details.forEach(detail => {
      console.log(`  ❌ ${detail}`);
    });
  }
}

// Display full validation results
function displayResults(report, format) {
  switch (format) {
    case 'json':
      console.log(JSON.stringify(report, null, 2));
      break;
      
    case 'yaml':
      displayYamlResults(report);
      break;
      
    case 'table':
    default:
      displayTableResults(report);
      break;
  }
}

// Display results in table format
function displayTableResults(report) {
  console.log('\n=== Environment Variables Validation Report ===');
  console.log(`Generated: ${report.timestamp}`);
  console.log(`Overall Score: ${report.summary.overallScore}%`);
  
  // Summary
  console.log('\n--- Summary ---');
  console.log(`Total Variables: ${report.summary.totalVariables}`);
  console.log(`Format Validation: ${report.summary.formatValidation.passed}/${report.summary.totalVariables} passed (${report.summary.formatValidation.score}%)`);
  console.log(`Connectivity Tests: ${report.summary.connectivityValidation.passed}/${report.summary.connectivityValidation.tested} passed (${report.summary.connectivityValidation.score}%)`);
  console.log(`Errors: ${report.summary.severityBreakdown.errors}`);
  console.log(`Warnings: ${report.summary.severityBreakdown.warnings}`);
  
  // Critical issues
  if (report.categorizedResults.critical.length > 0) {
    console.log('\n--- Critical Issues ---');
    report.categorizedResults.critical.forEach(issue => {
      console.log(`❌ ${issue.variable}: ${issue.message}`);
    });
  }
  
  // Warnings
  if (report.categorizedResults.warnings.length > 0) {
    console.log('\n--- Warnings ---');
    report.categorizedResults.warnings.forEach(warning => {
      console.log(`⚠️  ${warning.variable}: ${warning.message}`);
    });
  }
  
  // Recommendations
  if (report.recommendations.length > 0) {
    console.log('\n--- Recommendations ---');
    report.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec.title} (${rec.priority} priority)`);
      console.log(`   ${rec.description}`);
      if (rec.actions.length > 0) {
        console.log(`   Actions:`);
        rec.actions.forEach(action => {
          console.log(`   - ${action}`);
        });
      }
      console.log('');
    });
  }
  
  // Variable details (if verbose)
  if (options.verbose) {
    console.log('\n--- Variable Details ---');
    console.log('Variable'.padEnd(30) + 'Status'.padEnd(12) + 'Format'.padEnd(20) + 'Connectivity');
    console.log('-'.repeat(80));
    
    report.variableDetails.forEach(variable => {
      const status = variable.status === 'valid' ? '✅ Valid' : 
                    variable.status === 'warning' ? '⚠️  Warning' : 
                    variable.status === 'error' ? '❌ Error' : '❓ Unknown';
      
      const formatMsg = variable.formatValidation?.message || 'N/A';
      const connectivityMsg = variable.connectivityTest?.message || 'N/A';
      
      console.log(
        variable.name.padEnd(30) + 
        status.padEnd(12) + 
        formatMsg.substring(0, 18).padEnd(20) + 
        connectivityMsg.substring(0, 25)
      );
    });
  }
}

// Display results in YAML format
function displayYamlResults(report) {
  console.log(`timestamp: ${report.timestamp}`);
  console.log(`overallScore: ${report.summary.overallScore}`);
  console.log('summary:');
  console.log(`  totalVariables: ${report.summary.totalVariables}`);
  console.log(`  formatValidation:`);
  console.log(`    passed: ${report.summary.formatValidation.passed}`);
  console.log(`    failed: ${report.summary.formatValidation.failed}`);
  console.log(`    score: ${report.summary.formatValidation.score}`);
  
  if (report.recommendations.length > 0) {
    console.log('recommendations:');
    report.recommendations.forEach(rec => {
      console.log(`  - title: "${rec.title}"`);
      console.log(`    priority: ${rec.priority}`);
      console.log(`    description: "${rec.description}"`);
    });
  }
}

// Save results to file
async function saveResults(report, outputPath, format) {
  try {
    let content;
    
    switch (format) {
      case 'json':
        content = JSON.stringify(report, null, 2);
        break;
      case 'yaml':
        content = generateYamlOutput(report);
        break;
      case 'html':
        content = generateHtmlOutput(report);
        break;
      case 'csv':
        content = generateCsvOutput(report);
        break;
      default:
        throw new Error(`Unsupported output format: ${format}`);
    }
    
    fs.writeFileSync(outputPath, content, 'utf8');
    Logger.log(`Results saved to: ${outputPath}`, 'info');
    
  } catch (error) {
    Logger.log(`Failed to save results: ${error.message}`, 'error');
  }
}

// Generate YAML output
function generateYamlOutput(report) {
  // Simple YAML generation (in production, use a proper YAML library)
  return [
    `timestamp: ${report.timestamp}`,
    `overallScore: ${report.summary.overallScore}`,
    `totalVariables: ${report.summary.totalVariables}`,
    `criticalIssues: ${report.categorizedResults.critical.length}`,
    `warnings: ${report.categorizedResults.warnings.length}`,
    ''
  ].join('\n');
}

// Generate HTML output
function generateHtmlOutput(report) {
  return `<!DOCTYPE html>
<html>
<head>
    <title>Validation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; }
        .error { color: #d32f2f; }
        .warning { color: #f57c00; }
        .success { color: #388e3c; }
    </style>
</head>
<body>
    <h1>Environment Variables Validation Report</h1>
    <div class="summary">
        <h2>Summary</h2>
        <p>Overall Score: ${report.summary.overallScore}%</p>
        <p>Total Variables: ${report.summary.totalVariables}</p>
        <p>Critical Issues: ${report.categorizedResults.critical.length}</p>
        <p>Warnings: ${report.categorizedResults.warnings.length}</p>
    </div>
</body>
</html>`;
}

// Generate CSV output
function generateCsvOutput(report) {
  const headers = ['Variable', 'Status', 'Format Validation', 'Connectivity Test'];
  const rows = report.variableDetails.map(v => [
    v.name,
    v.status,
    v.formatValidation?.message || 'N/A',
    v.connectivityTest?.message || 'N/A'
  ]);
  
  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
}

// Show help information
function showHelp() {
  console.log(`
Environment Variables Validation Script

Usage:
  node validate-env-vars.js [options]

Options:
  --app-id <id>         AWS Amplify app ID
  --branch <name>       Branch name (default: staging)
  --config <path>       Configuration file path (JSON/YAML)
  --skip-connectivity   Skip connectivity tests
  --format <format>     Output format: table, json, yaml (default: table)
  --output <path>       Save results to file
  --quick              Quick validation for CI/CD
  --verbose            Show detailed output
  --help               Show this help message

Examples:
  # Validate Amplify app variables
  node validate-env-vars.js --app-id d123abc --branch staging

  # Validate from config file
  node validate-env-vars.js --config ./config/staging.yaml

  # Quick validation for CI/CD
  node validate-env-vars.js --app-id d123abc --quick

  # Save results to file
  node validate-env-vars.js --app-id d123abc --format json --output report.json

  # Skip connectivity tests
  node validate-env-vars.js --app-id d123abc --skip-connectivity
`);
}

// Run the main function
if (require.main === module) {
  main().catch(error => {
    console.error('Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  main,
  loadVariablesFromConfig,
  loadVariablesFromAmplify,
  displayResults,
  saveResults
};