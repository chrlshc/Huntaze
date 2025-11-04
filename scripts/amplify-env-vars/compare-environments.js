#!/usr/bin/env node

/**
 * Environment Comparison Utility Script
 * 
 * Compares environment variables between different Amplify environments
 */

const { SyncService, AwsCliWrapper, SecurityHandler, Logger } = require('../../lib/amplify-env-vars');
const fs = require('fs');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  appId: null,
  source: null,
  target: null,
  format: 'table',
  output: null,
  hideValues: false,
  showUnchanged: false,
  excludeSensitive: false,
  verbose: false
};

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  switch (arg) {
    case '--app-id':
      options.appId = args[++i];
      break;
    case '--source':
      options.source = args[++i];
      break;
    case '--target':
      options.target = args[++i];
      break;
    case '--format':
      options.format = args[++i];
      break;
    case '--output':
      options.output = args[++i];
      break;
    case '--hide-values':
      options.hideValues = true;
      break;
    case '--show-unchanged':
      options.showUnchanged = true;
      break;
    case '--exclude-sensitive':
      options.excludeSensitive = true;
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
if (!options.appId || !options.source || !options.target) {
  console.error('❌ Error: --app-id, --source, and --target are required');
  showHelp();
  process.exit(1);
}

// Main function
async function main() {
  try {
    Logger.setLevel(options.verbose ? 'debug' : 'info');
    
    console.log(`🔍 Comparing environments: ${options.source} → ${options.target}`);
    
    // Perform comparison
    const diff = await SyncService.compareEnvironments(
      options.appId,
      options.source,
      options.target,
      {
        includeValues: !options.hideValues,
        maskSensitive: true,
        excludeEnvironmentSpecific: true,
        excludeSensitive: options.excludeSensitive
      }
    );
    
    // Display results
    displayComparison(diff, options);
    
    // Save to file if requested
    if (options.output) {
      saveComparison(diff, options.output, options.format);
    }
    
    // Exit with appropriate code
    const hasChanges = diff.differences.some(d => d.type !== 'unchanged');
    if (options.verbose) {
      console.log(`\n📊 Comparison complete. ${hasChanges ? 'Differences found' : 'No differences'}.`);
    }
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Display comparison results
function displayComparison(diff, options) {
  switch (options.format) {
    case 'json':
      console.log(JSON.stringify(diff, null, 2));
      break;
    case 'yaml':
      displayYamlComparison(diff);
      break;
    case 'csv':
      displayCsvComparison(diff);
      break;
    case 'table':
    default:
      displayTableComparison(diff, options);
      break;
  }
}

// Display table format
function displayTableComparison(diff, options) {
  console.log(`\n📊 Environment Comparison Results`);
  console.log(`Source: ${diff.sourceEnvironment} (${diff.summary.totalSourceVariables} variables)`);
  console.log(`Target: ${diff.targetEnvironment} (${diff.summary.totalTargetVariables} variables)`);
  console.log(`\n📈 Summary:`);
  console.log(`  Added: ${diff.summary.added}`);
  console.log(`  Removed: ${diff.summary.removed}`);
  console.log(`  Modified: ${diff.summary.modified}`);
  console.log(`  Unchanged: ${diff.summary.unchanged}`);
  
  if (diff.differences.length === 0) {
    console.log('\n✅ No differences found between environments.');
    return;
  }
  
  // Group differences by type
  const added = diff.differences.filter(d => d.type === 'added');
  const removed = diff.differences.filter(d => d.type === 'removed');
  const modified = diff.differences.filter(d => d.type === 'modified');
  const unchanged = diff.differences.filter(d => d.type === 'unchanged');
  
  // Display added variables
  if (added.length > 0) {
    console.log(`\n➕ Added in ${diff.targetEnvironment} (${added.length}):`);
    added.forEach(item => {
      const value = options.hideValues ? '[HIDDEN]' : 
                   SecurityHandler.isSensitive(item.key, item.targetValue) ? 
                   SecurityHandler.maskSensitiveData(item.key, item.targetValue) : 
                   item.targetValue;
      console.log(`   ${item.key} = ${value}${item.impact !== 'low' ? ` (${item.impact} impact)` : ''}`);
    });
  }
  
  // Display removed variables
  if (removed.length > 0) {
    console.log(`\n➖ Removed from ${diff.targetEnvironment} (${removed.length}):`);
    removed.forEach(item => {
      console.log(`   ${item.key}${item.impact !== 'low' ? ` (${item.impact} impact)` : ''}`);
    });
  }
  
  // Display modified variables
  if (modified.length > 0) {
    console.log(`\n🔄 Modified in ${diff.targetEnvironment} (${modified.length}):`);
    modified.forEach(item => {
      if (options.hideValues) {
        console.log(`   ${item.key}: [VALUES HIDDEN]${item.impact !== 'low' ? ` (${item.impact} impact)` : ''}`);
      } else {
        const sourceValue = SecurityHandler.isSensitive(item.key, item.sourceValue) ? 
                           SecurityHandler.maskSensitiveData(item.key, item.sourceValue) : 
                           item.sourceValue;
        const targetValue = SecurityHandler.isSensitive(item.key, item.targetValue) ? 
                           SecurityHandler.maskSensitiveData(item.key, item.targetValue) : 
                           item.targetValue;
        console.log(`   ${item.key}: ${sourceValue} → ${targetValue}${item.impact !== 'low' ? ` (${item.impact} impact)` : ''}`);
      }
    });
  }
  
  // Display unchanged variables (if requested)
  if (options.showUnchanged && unchanged.length > 0) {
    console.log(`\n✅ Unchanged (${unchanged.length}):`);
    unchanged.forEach(item => {
      console.log(`   ${item.key}`);
    });
  }
  
  // Display recommendations
  if (diff.recommendations.length > 0) {
    console.log(`\n💡 Recommendations:`);
    diff.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
  }
}

// Display YAML format
function displayYamlComparison(diff) {
  console.log(`sourceEnvironment: ${diff.sourceEnvironment}`);
  console.log(`targetEnvironment: ${diff.targetEnvironment}`);
  console.log(`summary:`);
  console.log(`  totalSourceVariables: ${diff.summary.totalSourceVariables}`);
  console.log(`  totalTargetVariables: ${diff.summary.totalTargetVariables}`);
  console.log(`  added: ${diff.summary.added}`);
  console.log(`  removed: ${diff.summary.removed}`);
  console.log(`  modified: ${diff.summary.modified}`);
  console.log(`  unchanged: ${diff.summary.unchanged}`);
  
  if (diff.differences.length > 0) {
    console.log(`differences:`);
    diff.differences.forEach(d => {
      console.log(`  - key: ${d.key}`);
      console.log(`    type: ${d.type}`);
      console.log(`    impact: ${d.impact}`);
    });
  }
}

// Display CSV format
function displayCsvComparison(diff) {
  console.log('Key,Type,Impact,Source Value,Target Value');
  diff.differences.forEach(d => {
    const sourceValue = d.sourceValue || '';
    const targetValue = d.targetValue || '';
    console.log(`"${d.key}","${d.type}","${d.impact}","${sourceValue}","${targetValue}"`);
  });
}

// Save comparison to file
function saveComparison(diff, filePath, format) {
  try {
    let content;
    
    switch (format) {
      case 'json':
        content = JSON.stringify(diff, null, 2);
        break;
      case 'yaml':
        content = generateYamlOutput(diff);
        break;
      case 'csv':
        content = generateCsvOutput(diff);
        break;
      case 'html':
        content = generateHtmlOutput(diff);
        break;
      default:
        content = generateTextOutput(diff);
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`📄 Comparison saved to: ${filePath}`);
    
  } catch (error) {
    console.error(`❌ Failed to save comparison: ${error.message}`);
  }
}

// Generate YAML output
function generateYamlOutput(diff) {
  const yaml = [
    `sourceEnvironment: ${diff.sourceEnvironment}`,
    `targetEnvironment: ${diff.targetEnvironment}`,
    `timestamp: ${new Date().toISOString()}`,
    `summary:`,
    `  totalSourceVariables: ${diff.summary.totalSourceVariables}`,
    `  totalTargetVariables: ${diff.summary.totalTargetVariables}`,
    `  added: ${diff.summary.added}`,
    `  removed: ${diff.summary.removed}`,
    `  modified: ${diff.summary.modified}`,
    `  unchanged: ${diff.summary.unchanged}`
  ];
  
  if (diff.differences.length > 0) {
    yaml.push('differences:');
    diff.differences.forEach(d => {
      yaml.push(`  - key: "${d.key}"`);
      yaml.push(`    type: ${d.type}`);
      yaml.push(`    impact: ${d.impact}`);
      if (d.sourceValue) yaml.push(`    sourceValue: "${d.sourceValue}"`);
      if (d.targetValue) yaml.push(`    targetValue: "${d.targetValue}"`);
    });
  }
  
  return yaml.join('\n');
}

// Generate CSV output
function generateCsvOutput(diff) {
  const headers = ['Key', 'Type', 'Impact', 'Source Value', 'Target Value'];
  const rows = diff.differences.map(d => [
    d.key,
    d.type,
    d.impact,
    d.sourceValue || '',
    d.targetValue || ''
  ]);
  
  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
}

// Generate HTML output
function generateHtmlOutput(diff) {
  return `<!DOCTYPE html>
<html>
<head>
    <title>Environment Comparison - ${diff.sourceEnvironment} vs ${diff.targetEnvironment}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .added { background-color: #e8f5e8; }
        .removed { background-color: #ffebee; }
        .modified { background-color: #fff3e0; }
    </style>
</head>
<body>
    <h1>Environment Comparison</h1>
    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Source:</strong> ${diff.sourceEnvironment} (${diff.summary.totalSourceVariables} variables)</p>
        <p><strong>Target:</strong> ${diff.targetEnvironment} (${diff.summary.totalTargetVariables} variables)</p>
        <p><strong>Added:</strong> ${diff.summary.added}</p>
        <p><strong>Removed:</strong> ${diff.summary.removed}</p>
        <p><strong>Modified:</strong> ${diff.summary.modified}</p>
        <p><strong>Unchanged:</strong> ${diff.summary.unchanged}</p>
    </div>
    
    <h2>Differences</h2>
    <table>
        <thead>
            <tr>
                <th>Variable</th>
                <th>Type</th>
                <th>Impact</th>
                <th>Source Value</th>
                <th>Target Value</th>
            </tr>
        </thead>
        <tbody>
            ${diff.differences.map(d => `
                <tr class="${d.type}">
                    <td>${d.key}</td>
                    <td>${d.type}</td>
                    <td>${d.impact}</td>
                    <td>${d.sourceValue || ''}</td>
                    <td>${d.targetValue || ''}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
</body>
</html>`;
}

// Generate text output
function generateTextOutput(diff) {
  const lines = [
    `Environment Comparison Report`,
    `Generated: ${new Date().toISOString()}`,
    ``,
    `Source: ${diff.sourceEnvironment} (${diff.summary.totalSourceVariables} variables)`,
    `Target: ${diff.targetEnvironment} (${diff.summary.totalTargetVariables} variables)`,
    ``,
    `Summary:`,
    `  Added: ${diff.summary.added}`,
    `  Removed: ${diff.summary.removed}`,
    `  Modified: ${diff.summary.modified}`,
    `  Unchanged: ${diff.summary.unchanged}`,
    ``
  ];
  
  if (diff.differences.length > 0) {
    lines.push('Differences:');
    diff.differences.forEach(d => {
      lines.push(`  ${d.type.toUpperCase()}: ${d.key} (${d.impact} impact)`);
      if (d.sourceValue) lines.push(`    Source: ${d.sourceValue}`);
      if (d.targetValue) lines.push(`    Target: ${d.targetValue}`);
    });
  }
  
  return lines.join('\n');
}

// Show help information
function showHelp() {
  console.log(`
Environment Comparison Utility Script

Usage:
  node compare-environments.js --app-id <id> --source <env> --target <env> [options]

Options:
  --app-id <id>           AWS Amplify app ID (required)
  --source <env>          Source environment name (required)
  --target <env>          Target environment name (required)
  --format <format>       Output format: table, json, yaml, csv (default: table)
  --output <path>         Save results to file
  --hide-values          Hide variable values in output
  --show-unchanged       Include unchanged variables in output
  --exclude-sensitive    Exclude sensitive variables from comparison
  --verbose              Show detailed output
  --help                 Show this help message

Examples:
  # Compare staging and production
  node compare-environments.js --app-id d123abc --source staging --target production

  # Save comparison as JSON
  node compare-environments.js --app-id d123abc --source staging --target production --format json --output comparison.json

  # Hide values for security
  node compare-environments.js --app-id d123abc --source staging --target production --hide-values

  # Include unchanged variables
  node compare-environments.js --app-id d123abc --source staging --target production --show-unchanged
`);
}

// Run the main function
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = { main, displayComparison, saveComparison };