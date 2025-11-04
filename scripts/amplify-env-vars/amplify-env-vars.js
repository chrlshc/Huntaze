#!/usr/bin/env node

/**
 * AWS Amplify Environment Variables Management CLI - Enhanced Version
 * 
 * Comprehensive CLI tool with validation, security, synchronization, and monitoring
 * 
 * Usage:
 *   node amplify-env-vars.js set --app-id APP123 --branch staging --vars "KEY1=value1,KEY2=value2"
 *   node amplify-env-vars.js get --app-id APP123 --branch staging
 *   node amplify-env-vars.js apply --app-id APP123 --config config.yaml --env staging
 *   node amplify-env-vars.js validate --app-id APP123 --branch staging
 *   node amplify-env-vars.js sync --app-id APP123 --source staging --target production
 *   node amplify-env-vars.js security-scan --app-id APP123 --branch production
 */

const { 
  ValidationEngine, 
  AwsCliWrapper, 
  Logger, 
  SecurityHandler,
  SyncService,
  MonitoringSystem,
  CLIManager 
} = require('../../lib/amplify-env-vars');

const fs = require('fs');
const path = require('path');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  let command = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (!command && !arg.startsWith('--')) {
      command = arg;
      continue;
    }

    if (arg.startsWith('--')) {
      const key = arg.substring(2);
      const value = args[i + 1];
      
      if (value && !value.startsWith('--')) {
        options[key] = value;
        i++; // Skip the value in next iteration
      } else {
        options[key] = true;
      }
    }
  }

  return { command, options };
}

// Display help information
function showHelp(command = null) {
  if (command) {
    showCommandHelp(command);
    return;
  }

  console.log(`
AWS Amplify Environment Variables Management CLI - Enhanced Version

USAGE:
  node amplify-env-vars.js <command> [options]

COMMANDS:
  Basic Operations:
    set                Set environment variables
    get                Get environment variables  
    apply              Apply configuration from file
    compare            Compare variables between environments

  Validation & Security:
    validate           Comprehensive validation with reports
    validate-quick     Quick validation for CI/CD pipelines
    security-scan      Perform comprehensive security analysis

  Synchronization:
    sync               Synchronize all variables between environments
    promote            Promote specific variables between environments
    drift              Detect configuration drift

  Monitoring:
    monitor            Start continuous monitoring session
    health-check       Perform one-time health check

  Backup & Restore:
    backup             Create environment backup
    restore            Restore environment from backup

  Utilities:
    help [command]     Show help (optionally for specific command)

GLOBAL OPTIONS:
  --app-id <id>        Amplify App ID (required for most commands)
  --branch <name>      Branch name (default: staging)
  --verbose           Enable verbose logging
  --format <type>     Output format: json, yaml, table (default: table)
  --dry-run           Show what would be done without executing

EXAMPLES:
  # Basic operations
  node amplify-env-vars.js set --app-id d123 --branch staging --vars "NODE_ENV=production,DEBUG=false"
  node amplify-env-vars.js get --app-id d123 --branch staging

  # Validation and security
  node amplify-env-vars.js validate --app-id d123 --branch staging
  node amplify-env-vars.js security-scan --app-id d123 --branch production

  # Synchronization
  node amplify-env-vars.js sync --app-id d123 --source staging --target production --dry-run
  node amplify-env-vars.js drift --app-id d123 --branch production

  # Monitoring
  node amplify-env-vars.js health-check --app-id d123 --branch staging
  node amplify-env-vars.js monitor --app-id d123 --environments staging,production

For detailed help on a specific command:
  node amplify-env-vars.js help <command>
`);
}

// Show help for specific command
function showCommandHelp(command) {
  const helpText = {
    'validate': `
VALIDATE - Comprehensive environment variables validation

USAGE:
  node amplify-env-vars.js validate [options]

OPTIONS:
  --app-id <id>           Amplify App ID (required)
  --branch <name>         Branch name (default: staging)
  --skip-connectivity     Skip connectivity tests
  --output <path>         Save report to file
  --format <type>         Report format: json, yaml, html, csv

EXAMPLES:
  # Full validation with connectivity tests
  node amplify-env-vars.js validate --app-id d123 --branch staging

  # Skip connectivity and save HTML report
  node amplify-env-vars.js validate --app-id d123 --skip-connectivity --output report.html --format html
`,

    'sync': `
SYNC - Synchronize environment variables between environments

USAGE:
  node amplify-env-vars.js sync [options]

OPTIONS:
  --app-id <id>           Amplify App ID (required)
  --source <branch>       Source environment (required)
  --target <branch>       Target environment (required)
  --exclude-sensitive     Skip sensitive variables
  --backup               Create backup before sync
  --dry-run              Preview changes without applying

EXAMPLES:
  # Sync staging to production with backup
  node amplify-env-vars.js sync --app-id d123 --source staging --target production --backup

  # Preview sync without sensitive variables
  node amplify-env-vars.js sync --app-id d123 --source staging --target production --exclude-sensitive --dry-run
`,

    'security-scan': `
SECURITY-SCAN - Perform comprehensive security analysis

USAGE:
  node amplify-env-vars.js security-scan [options]

OPTIONS:
  --app-id <id>           Amplify App ID (required)
  --branch <name>         Branch name (default: staging)
  --output <path>         Save security report to file

EXAMPLES:
  # Security scan for production
  node amplify-env-vars.js security-scan --app-id d123 --branch production

  # Save detailed security report
  node amplify-env-vars.js security-scan --app-id d123 --output security-report.json
`
  };

  console.log(helpText[command] || `No detailed help available for command: ${command}`);
}

// Format output based on specified format
function formatOutput(data, format = 'table') {
  switch (format) {
    case 'json':
      return JSON.stringify(data, null, 2);
    
    case 'yaml':
      return convertToYaml(data);
    
    case 'table':
    default:
      return formatAsTable(data);
  }
}

// Convert data to YAML format
function convertToYaml(data) {
  if (typeof data === 'object' && data !== null) {
    return Object.entries(data)
      .map(([key, value]) => `${key}: "${value}"`)
      .join('\n');
  }
  return String(data);
}

// Format data as table with security masking
function formatAsTable(data) {
  if (typeof data === 'object' && data !== null) {
    const entries = Object.entries(data);
    if (entries.length === 0) {
      return 'No variables found.';
    }
    
    const maxKeyLength = Math.max(...entries.map(([key]) => key.length));
    const separator = '-'.repeat(maxKeyLength + 50);
    
    let table = `\n${separator}\n`;
    table += `${'Variable'.padEnd(maxKeyLength)} | Value\n`;
    table += `${separator}\n`;
    
    for (const [key, value] of entries) {
      // Use SecurityHandler for proper masking
      const displayValue = SecurityHandler.isSensitive(key, value)
        ? SecurityHandler.maskSensitiveData(key, value)
        : value;
      
      table += `${key.padEnd(maxKeyLength)} | ${displayValue}\n`;
    }
    
    table += `${separator}\n`;
    return table;
  }
  return String(data);
}

// Save output to file
function saveOutput(data, filePath, format) {
  try {
    let content;
    
    switch (format) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        break;
      case 'yaml':
        content = convertToYaml(data);
        break;
      case 'html':
        content = generateHtmlReport(data);
        break;
      case 'csv':
        content = generateCsvReport(data);
        break;
      default:
        content = formatAsTable(data);
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`📄 Report saved to: ${filePath}`);
  } catch (error) {
    console.error(`❌ Failed to save report: ${error.message}`);
  }
}

// Generate HTML report
function generateHtmlReport(data) {
  return `<!DOCTYPE html>
<html>
<head>
    <title>Environment Variables Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .error { color: #d32f2f; }
        .warning { color: #f57c00; }
        .success { color: #388e3c; }
    </style>
</head>
<body>
    <h1>Environment Variables Report</h1>
    <div class="summary">
        <p><strong>Generated:</strong> ${new Date().toISOString()}</p>
        <p><strong>Data:</strong> ${JSON.stringify(data, null, 2)}</p>
    </div>
</body>
</html>`;
}

// Generate CSV report
function generateCsvReport(data) {
  if (typeof data === 'object' && data !== null) {
    const entries = Object.entries(data);
    const csvContent = [
      'Key,Value',
      ...entries.map(([key, value]) => `"${key}","${value}"`)
    ].join('\n');
    return csvContent;
  }
  return 'Key,Value\n';
}

// Main execution function
async function main() {
  const { command, options } = parseArgs();
  
  // Set up logger with appropriate level
  const logLevel = options.verbose ? 'debug' : 'info';
  Logger.setLevel(logLevel);

  try {
    switch (command) {
      case 'set':
        await handleSet(options);
        break;

      case 'get':
        await handleGet(options);
        break;

      case 'apply':
        await handleApply(options);
        break;

      case 'compare':
        await handleCompare(options);
        break;

      case 'validate':
        await handleValidate(options);
        break;

      case 'validate-quick':
        await handleQuickValidate(options);
        break;

      case 'sync':
        await handleSync(options);
        break;

      case 'promote':
        await handlePromote(options);
        break;

      case 'security-scan':
        await handleSecurityScan(options);
        break;

      case 'monitor':
        await handleMonitor(options);
        break;

      case 'health-check':
        await handleHealthCheck(options);
        break;

      case 'backup':
        await handleBackup(options);
        break;

      case 'restore':
        await handleRestore(options);
        break;

      case 'drift':
        await handleDrift(options);
        break;

      case 'help':
        showHelp(options._?.[0]);
        break;

      case undefined:
        showHelp();
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        console.error('Run "node amplify-env-vars.js help" for usage information.');
        process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Command handlers
async function handleSet(options) {
  if (!options['app-id'] || !options.vars) {
    console.error('❌ Error: --app-id and --vars are required for set command');
    process.exit(1);
  }
  
  const branch = options.branch || 'staging';
  const cliManager = new CLIManager();
  
  const result = await cliManager.executeCommand('set', {
    appId: options['app-id'],
    branchName: branch,
    variables: options.vars,
    dryRun: options['dry-run']
  });
  
  if (result.success) {
    console.log(`✅ ${result.message}`);
    if (result.data && options['dry-run']) {
      console.log('Variables that would be set:');
      console.log(formatOutput(result.data.variables, options.format));
    }
  } else {
    console.error(`❌ ${result.message}`);
    process.exit(1);
  }
}

async function handleGet(options) {
  if (!options['app-id']) {
    console.error('❌ Error: --app-id is required for get command');
    process.exit(1);
  }
  
  const branch = options.branch || 'staging';
  const result = await AwsCliWrapper.getEnvironmentVariables(options['app-id'], branch);
  
  if (result.success) {
    console.log(`Environment variables for ${options['app-id']}/${branch}:`);
    console.log(formatOutput(result.variables, options.format));
  } else {
    console.error(`❌ ${result.error}`);
    process.exit(1);
  }
}

async function handleApply(options) {
  if (!options['app-id'] || !options.config) {
    console.error('❌ Error: --app-id and --config are required for apply command');
    process.exit(1);
  }
  
  const env = options.env || 'staging';
  const cliManager = new CLIManager();
  
  if (options['dry-run']) {
    console.log(`🔍 Dry run: Would apply configuration from ${options.config} to ${options['app-id']}/${env}`);
    // TODO: Implement dry run preview
  } else {
    await cliManager.applyConfigFile(options['app-id'], options.config, env);
    console.log(`✅ Configuration applied successfully to ${options['app-id']}/${env}`);
  }
}

async function handleCompare(options) {
  if (!options['app-id'] || !options.source || !options.target) {
    console.error('❌ Error: --app-id, --source, and --target are required for compare command');
    process.exit(1);
  }

  console.log(`🔍 Comparing ${options.source} → ${options.target}...`);

  const diff = await SyncService.compareEnvironments(
    options['app-id'],
    options.source,
    options.target,
    {
      includeValues: !options['hide-values'],
      maskSensitive: true,
      excludeEnvironmentSpecific: true
    }
  );

  console.log(`\n📊 Comparison Results:`);
  console.log(`Source: ${diff.sourceEnvironment} (${diff.summary.totalSourceVariables} variables)`);
  console.log(`Target: ${diff.targetEnvironment} (${diff.summary.totalTargetVariables} variables)`);
  console.log(`Added: ${diff.summary.added}`);
  console.log(`Removed: ${diff.summary.removed}`);
  console.log(`Modified: ${diff.summary.modified}`);
  console.log(`Unchanged: ${diff.summary.unchanged}`);

  if (diff.differences.length > 0) {
    console.log(`\n📋 Differences:`);
    diff.differences.forEach(d => {
      const icon = d.type === 'added' ? '➕' : d.type === 'removed' ? '➖' : d.type === 'modified' ? '🔄' : '✅';
      console.log(`   ${icon} ${d.key} (${d.type}${d.impact !== 'low' ? `, ${d.impact} impact` : ''})`);
    });
  }

  if (diff.recommendations.length > 0) {
    console.log(`\n💡 Recommendations:`);
    diff.recommendations.forEach(rec => {
      console.log(`   ${rec}`);
    });
  }

  if (options.output) {
    saveOutput(diff, options.output, options.format || 'json');
  }
}

async function handleValidate(options) {
  if (!options['app-id']) {
    console.error('❌ Error: --app-id is required');
    process.exit(1);
  }

  const branch = options.branch || 'staging';
  console.log(`🔍 Validating environment variables for ${options['app-id']}/${branch}...`);

  // Get variables
  const result = await AwsCliWrapper.getEnvironmentVariables(options['app-id'], branch);
  if (!result.success) {
    throw new Error(`Failed to fetch variables: ${result.error}`);
  }

  const variables = Object.entries(result.variables || {}).map(([key, value]) => ({ key, value }));

  // Perform validation
  const validationOptions = {
    skipConnectivityTests: options['skip-connectivity'],
    useCache: true,
    parallel: true
  };

  const validationResult = await ValidationEngine.validateEnvironmentVariables(variables, validationOptions);

  if (validationResult.success) {
    const report = validationResult.report;
    
    console.log(`\n📊 Validation Results:`);
    console.log(`Overall Score: ${report.summary.overallScore}%`);
    console.log(`Total Variables: ${report.summary.totalVariables}`);
    console.log(`Format Validation: ${report.summary.formatValidation.passed}/${report.summary.totalVariables} passed`);
    console.log(`Connectivity Tests: ${report.summary.connectivityValidation.passed}/${report.summary.connectivityValidation.tested} passed`);
    
    if (report.categorizedResults.critical.length > 0) {
      console.log(`\n🚨 Critical Issues (${report.categorizedResults.critical.length}):`);
      report.categorizedResults.critical.forEach(issue => {
        console.log(`   ❌ ${issue.variable}: ${issue.message}`);
      });
    }

    if (report.categorizedResults.warnings.length > 0) {
      console.log(`\n⚠️  Warnings (${report.categorizedResults.warnings.length}):`);
      report.categorizedResults.warnings.forEach(warning => {
        console.log(`   ⚠️  ${warning.variable}: ${warning.message}`);
      });
    }

    if (report.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      report.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec.title}`);
      });
    }

    // Save report if requested
    if (options.output) {
      saveOutput(report, options.output, options.format || 'json');
    }

    // Exit with error code if there are critical issues
    if (report.categorizedResults.critical.length > 0) {
      process.exit(1);
    }
  } else {
    throw new Error(validationResult.error);
  }
}

async function handleQuickValidate(options) {
  if (!options['app-id']) {
    console.error('❌ Error: --app-id is required');
    process.exit(1);
  }

  const branch = options.branch || 'staging';
  console.log(`⚡ Quick validation for ${options['app-id']}/${branch}...`);

  // Get variables
  const result = await AwsCliWrapper.getEnvironmentVariables(options['app-id'], branch);
  if (!result.success) {
    throw new Error(`Failed to fetch variables: ${result.error}`);
  }

  const variables = Object.entries(result.variables || {}).map(([key, value]) => ({ key, value }));

  // Quick validation
  const quickResult = await ValidationEngine.quickValidation(variables);

  console.log(`Status: ${quickResult.passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Score: ${quickResult.score}%`);
  console.log(`Critical Errors: ${quickResult.criticalErrors}`);
  console.log(`Warnings: ${quickResult.warnings}`);

  if (quickResult.details.length > 0) {
    console.log('\nIssues:');
    quickResult.details.forEach(detail => {
      console.log(`  ❌ ${detail}`);
    });
  }

  process.exit(quickResult.passed ? 0 : 1);
}

async function handleSync(options) {
  if (!options['app-id'] || !options.source || !options.target) {
    console.error('❌ Error: --app-id, --source, and --target are required');
    process.exit(1);
  }

  console.log(`🔄 Synchronizing ${options.source} → ${options.target}...`);

  // First, compare to show what will be synced
  const diff = await SyncService.compareEnvironments(
    options['app-id'],
    options.source,
    options.target
  );

  const variablesToSync = diff.differences
    .filter(d => d.type === 'added' || d.type === 'modified')
    .map(d => d.key);

  if (variablesToSync.length === 0) {
    console.log('✅ Environments are already in sync. No changes needed.');
    return;
  }

  console.log(`\n📋 Variables to sync (${variablesToSync.length}):`);
  variablesToSync.forEach(key => {
    const diffItem = diff.differences.find(d => d.key === key);
    console.log(`   ${diffItem.type === 'added' ? '➕' : '🔄'} ${key}`);
  });

  if (options['dry-run']) {
    console.log('\n🔍 Dry run complete. Use without --dry-run to apply changes.');
    return;
  }

  // Perform the sync
  const syncResult = await SyncService.promoteVariables(
    options['app-id'],
    options.source,
    options.target,
    variablesToSync,
    {
      dryRun: false,
      requireConfirmation: false,
      backupTarget: options.backup,
      excludeSensitive: options['exclude-sensitive']
    }
  );

  if (syncResult.success) {
    console.log(`✅ ${syncResult.message}`);
    console.log(`Promoted: ${syncResult.promoted.length} variables`);
    if (syncResult.skipped.length > 0) {
      console.log(`Skipped: ${syncResult.skipped.length} variables`);
    }
    if (syncResult.backup) {
      console.log(`Backup created: ${syncResult.backup.timestamp}`);
    }
  } else {
    throw new Error(syncResult.message);
  }
}

async function handleSecurityScan(options) {
  if (!options['app-id']) {
    console.error('❌ Error: --app-id is required');
    process.exit(1);
  }

  const branch = options.branch || 'staging';
  console.log(`🔒 Performing security scan for ${options['app-id']}/${branch}...`);

  // Get variables
  const result = await AwsCliWrapper.getEnvironmentVariables(options['app-id'], branch);
  if (!result.success) {
    throw new Error(`Failed to fetch variables: ${result.error}`);
  }

  const variables = Object.entries(result.variables || {}).map(([key, value]) => ({ key, value }));

  // Generate security report
  const securityReport = SecurityHandler.generateSecurityReport(variables);

  console.log(`\n🔒 Security Analysis Results:`);
  console.log(`Security Score: ${securityReport.summary.securityScore}/100`);
  console.log(`Risk Level: ${securityReport.summary.riskLevel.toUpperCase()}`);
  console.log(`Total Variables: ${securityReport.summary.totalVariables}`);
  console.log(`Sensitive Variables: ${securityReport.summary.sensitiveVariables}`);

  if (securityReport.risks.length > 0) {
    console.log(`\n⚠️  Security Risks (${securityReport.risks.length}):`);
    securityReport.risks.forEach(risk => {
      const icon = risk.severity === 'high' ? '🚨' : risk.severity === 'medium' ? '⚠️' : 'ℹ️';
      console.log(`   ${icon} ${risk.variable}: ${risk.description}`);
      console.log(`      💡 ${risk.recommendation}`);
    });
  }

  if (securityReport.recommendations.length > 0) {
    console.log(`\n💡 Security Recommendations:`);
    securityReport.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
  }

  if (options.output) {
    saveOutput(securityReport, options.output, options.format || 'json');
  }

  // Exit with error code for high-risk findings
  if (securityReport.summary.riskLevel === 'high') {
    process.exit(1);
  }
}

async function handleMonitor(options) {
  if (!options['app-id'] || !options.environments) {
    console.error('❌ Error: --app-id and --environments are required');
    process.exit(1);
  }

  const environments = options.environments.split(',');
  const interval = parseInt(options.interval) || 300000; // 5 minutes default

  console.log(`📊 Starting monitoring for ${options['app-id']}...`);
  console.log(`Environments: ${environments.join(', ')}`);
  console.log(`Check interval: ${interval / 1000}s`);

  const session = await MonitoringSystem.startRuntimeMonitoring(
    options['app-id'],
    environments,
    {
      interval,
      enablePerformanceMonitoring: true,
      enableSecurityMonitoring: true
    }
  );

  console.log(`✅ Monitoring session started: ${session.id}`);
  console.log('Press Ctrl+C to stop monitoring...');

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping monitoring...');
    MonitoringSystem.stopMonitoring(session.id);
    process.exit(0);
  });

  // Keep the process alive
  setInterval(() => {
    const dashboard = MonitoringSystem.getMonitoringDashboard(session.id);
    console.log(`\n📊 Status: ${dashboard.summary.healthyChecks}/${dashboard.summary.totalHealthChecks} healthy checks, ${dashboard.summary.criticalAlerts} critical alerts`);
  }, 60000); // Status update every minute
}

async function handleHealthCheck(options) {
  if (!options['app-id']) {
    console.error('❌ Error: --app-id is required');
    process.exit(1);
  }

  const branch = options.branch || 'staging';
  console.log(`🏥 Performing health check for ${options['app-id']}/${branch}...`);

  const healthCheck = await MonitoringSystem.performHealthCheck(options['app-id'], branch);

  console.log(`\n🏥 Health Check Results:`);
  console.log(`Status: ${healthCheck.status.toUpperCase()}`);
  console.log(`Execution Time: ${healthCheck.executionTime}ms`);
  console.log(`Validation: ${healthCheck.validation.passed}/${healthCheck.validation.passed + healthCheck.validation.failed} passed`);
  console.log(`Connectivity: ${healthCheck.connectivity.passed}/${healthCheck.connectivity.tested} passed`);

  if (healthCheck.validation.errors.length > 0) {
    console.log(`\n❌ Validation Errors:`);
    healthCheck.validation.errors.forEach(error => {
      console.log(`   ${error}`);
    });
  }

  if (healthCheck.connectivity.failures.length > 0) {
    console.log(`\n🔌 Connectivity Issues:`);
    healthCheck.connectivity.failures.forEach(failure => {
      console.log(`   ${failure}`);
    });
  }

  if (options.output) {
    saveOutput(healthCheck, options.output, options.format || 'json');
  }

  // Exit with error code if unhealthy
  if (healthCheck.status === 'unhealthy' || healthCheck.status === 'error') {
    process.exit(1);
  }
}

// Placeholder handlers for remaining commands
async function handlePromote(options) {
  console.log('🚀 Promote command - Implementation in progress');
  console.log('Use "sync" command for now to promote variables between environments');
}

async function handleBackup(options) {
  console.log('💾 Backup command - Implementation in progress');
  console.log('Backup functionality is integrated into sync operations with --backup flag');
}

async function handleRestore(options) {
  console.log('🔄 Restore command - Implementation in progress');
  console.log('Restore functionality will be available in the next version');
}

async function handleDrift(options) {
  console.log('📊 Drift detection - Implementation in progress');
  console.log('Use "compare" command to detect configuration differences');
}

// Run the CLI
if (require.main === module) {
  main().catch(error => {
    console.error(`❌ Unexpected error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { 
  main, 
  parseArgs, 
  formatOutput, 
  showHelp,
  handleSet,
  handleGet,
  handleApply,
  handleCompare,
  handleValidate,
  handleQuickValidate,
  handleSync,
  handleSecurityScan,
  handleMonitor,
  handleHealthCheck
};