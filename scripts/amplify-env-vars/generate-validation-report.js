#!/usr/bin/env node

/**
 * Validation Report Generation Script
 * 
 * Generates comprehensive validation reports in multiple formats
 */

const { ValidationEngine, AwsCliWrapper, Logger } = require('../../lib/amplify-env-vars');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  appId: null,
  branch: 'staging',
  format: 'html',
  output: null,
  template: null,
  includeRecommendations: true,
  includeDetails: true,
  skipConnectivity: false,
  verbose: false
};

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  switch (arg) {
    case '--app-id':
      options.appId = args[++i];
      break;
    case '--branch':
      options.branch = args[++i];
      break;
    case '--format':
      options.format = args[++i];
      break;
    case '--output':
      options.output = args[++i];
      break;
    case '--template':
      options.template = args[++i];
      break;
    case '--no-recommendations':
      options.includeRecommendations = false;
      break;
    case '--no-details':
      options.includeDetails = false;
      break;
    case '--skip-connectivity':
      options.skipConnectivity = true;
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

// Set default output filename if not provided
if (!options.output) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  options.output = `validation-report-${options.appId}-${options.branch}-${timestamp}.${options.format}`;
}

// Main function
async function main() {
  try {
    console.log(`📊 Generating validation report for ${options.appId}/${options.branch}...`);
    
    // Load variables
    const result = await AwsCliWrapper.getEnvironmentVariables(options.appId, options.branch);
    if (!result.success) {
      throw new Error(`Failed to load variables: ${result.error}`);
    }
    
    const variables = Object.entries(result.variables || {}).map(([key, value]) => ({ key, value }));
    
    if (variables.length === 0) {
      throw new Error('No environment variables found');
    }
    
    console.log(`Found ${variables.length} variables to validate...`);
    
    // Perform validation
    const validationOptions = {
      skipConnectivityTests: options.skipConnectivity,
      useCache: true,
      parallel: true,
      timeout: 60000
    };
    
    const validationResult = await ValidationEngine.validateEnvironmentVariables(variables, validationOptions);
    
    if (!validationResult.success) {
      throw new Error(`Validation failed: ${validationResult.error}`);
    }
    
    console.log('Validation completed. Generating report...');
    
    // Generate report
    const report = await generateReport(validationResult.report, options);
    
    // Save report
    fs.writeFileSync(options.output, report, 'utf8');
    
    console.log(`✅ Report generated successfully: ${options.output}`);
    console.log(`📊 Summary: ${validationResult.report.summary.overallScore}% score, ${validationResult.report.categorizedResults.critical.length} critical issues`);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Generate report in specified format
async function generateReport(validationReport, options) {
  switch (options.format) {
    case 'html':
      return generateHtmlReport(validationReport, options);
    case 'json':
      return generateJsonReport(validationReport, options);
    case 'yaml':
      return generateYamlReport(validationReport, options);
    case 'csv':
      return generateCsvReport(validationReport, options);
    case 'markdown':
      return generateMarkdownReport(validationReport, options);
    default:
      throw new Error(`Unsupported format: ${options.format}`);
  }
}

// Generate HTML report
function generateHtmlReport(report, options) {
  const template = options.template ? fs.readFileSync(options.template, 'utf8') : getDefaultHtmlTemplate();
  
  // Replace template variables
  let html = template
    .replace(/{{TITLE}}/g, `Validation Report - ${options.appId}/${options.branch}`)
    .replace(/{{TIMESTAMP}}/g, report.timestamp)
    .replace(/{{APP_ID}}/g, options.appId)
    .replace(/{{BRANCH}}/g, options.branch)
    .replace(/{{OVERALL_SCORE}}/g, report.summary.overallScore)
    .replace(/{{TOTAL_VARIABLES}}/g, report.summary.totalVariables)
    .replace(/{{CRITICAL_ISSUES}}/g, report.categorizedResults.critical.length)
    .replace(/{{WARNINGS}}/g, report.categorizedResults.warnings.length)
    .replace(/{{FORMAT_SCORE}}/g, report.summary.formatValidation.score)
    .replace(/{{CONNECTIVITY_SCORE}}/g, report.summary.connectivityValidation.score);
  
  // Add critical issues
  if (report.categorizedResults.critical.length > 0) {
    const criticalHtml = report.categorizedResults.critical.map(issue => 
      `<tr class="error"><td>${issue.variable}</td><td>${issue.message}</td><td>Critical</td></tr>`
    ).join('\n');
    html = html.replace('{{CRITICAL_ISSUES_TABLE}}', criticalHtml);
  } else {
    html = html.replace('{{CRITICAL_ISSUES_TABLE}}', '<tr><td colspan="3">No critical issues found</td></tr>');
  }
  
  // Add warnings
  if (report.categorizedResults.warnings.length > 0) {
    const warningsHtml = report.categorizedResults.warnings.map(warning => 
      `<tr class="warning"><td>${warning.variable}</td><td>${warning.message}</td><td>Warning</td></tr>`
    ).join('\n');
    html = html.replace('{{WARNINGS_TABLE}}', warningsHtml);
  } else {
    html = html.replace('{{WARNINGS_TABLE}}', '<tr><td colspan="3">No warnings found</td></tr>');
  }
  
  // Add recommendations
  if (options.includeRecommendations && report.recommendations.length > 0) {
    const recommendationsHtml = report.recommendations.map(rec => 
      `<li><strong>${rec.title}</strong> (${rec.priority} priority)<br>${rec.description}</li>`
    ).join('\n');
    html = html.replace('{{RECOMMENDATIONS}}', `<ul>${recommendationsHtml}</ul>`);
  } else {
    html = html.replace('{{RECOMMENDATIONS}}', '<p>No recommendations available</p>');
  }
  
  return html;
}

// Generate JSON report
function generateJsonReport(report, options) {
  const jsonReport = {
    metadata: {
      appId: options.appId,
      branch: options.branch,
      generatedAt: new Date().toISOString(),
      format: 'json'
    },
    ...report
  };
  
  return JSON.stringify(jsonReport, null, 2);
}

// Generate YAML report
function generateYamlReport(report, options) {
  // Simple YAML generation
  const yaml = [
    `metadata:`,
    `  appId: ${options.appId}`,
    `  branch: ${options.branch}`,
    `  generatedAt: ${new Date().toISOString()}`,
    ``,
    `summary:`,
    `  overallScore: ${report.summary.overallScore}`,
    `  totalVariables: ${report.summary.totalVariables}`,
    `  criticalIssues: ${report.categorizedResults.critical.length}`,
    `  warnings: ${report.categorizedResults.warnings.length}`,
    ``,
    `validation:`,
    `  formatValidation:`,
    `    passed: ${report.summary.formatValidation.passed}`,
    `    failed: ${report.summary.formatValidation.failed}`,
    `    score: ${report.summary.formatValidation.score}`,
    `  connectivityValidation:`,
    `    passed: ${report.summary.connectivityValidation.passed}`,
    `    tested: ${report.summary.connectivityValidation.tested}`,
    `    score: ${report.summary.connectivityValidation.score}`
  ];
  
  if (report.categorizedResults.critical.length > 0) {
    yaml.push('', 'criticalIssues:');
    report.categorizedResults.critical.forEach(issue => {
      yaml.push(`  - variable: ${issue.variable}`);
      yaml.push(`    message: "${issue.message}"`);
    });
  }
  
  if (options.includeRecommendations && report.recommendations.length > 0) {
    yaml.push('', 'recommendations:');
    report.recommendations.forEach(rec => {
      yaml.push(`  - title: "${rec.title}"`);
      yaml.push(`    priority: ${rec.priority}`);
      yaml.push(`    description: "${rec.description}"`);
    });
  }
  
  return yaml.join('\n');
}

// Generate CSV report
function generateCsvReport(report, options) {
  const headers = ['Variable', 'Status', 'Message', 'Severity', 'Category'];
  const rows = [];
  
  // Add critical issues
  report.categorizedResults.critical.forEach(issue => {
    rows.push([issue.variable, 'Error', issue.message, 'Critical', 'Format/Connectivity']);
  });
  
  // Add warnings
  report.categorizedResults.warnings.forEach(warning => {
    rows.push([warning.variable, 'Warning', warning.message, 'Warning', 'Format/Connectivity']);
  });
  
  // Add successful validations
  if (options.includeDetails) {
    report.variableDetails.forEach(variable => {
      if (variable.status === 'valid') {
        rows.push([variable.name, 'Valid', 'Passed all validations', 'Info', 'All']);
      }
    });
  }
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  return csvContent;
}

// Generate Markdown report
function generateMarkdownReport(report, options) {
  const markdown = [
    `# Environment Variables Validation Report`,
    ``,
    `**App ID:** ${options.appId}`,
    `**Branch:** ${options.branch}`,
    `**Generated:** ${report.timestamp}`,
    ``,
    `## Summary`,
    ``,
    `- **Overall Score:** ${report.summary.overallScore}%`,
    `- **Total Variables:** ${report.summary.totalVariables}`,
    `- **Critical Issues:** ${report.categorizedResults.critical.length}`,
    `- **Warnings:** ${report.categorizedResults.warnings.length}`,
    `- **Format Validation:** ${report.summary.formatValidation.passed}/${report.summary.totalVariables} passed (${report.summary.formatValidation.score}%)`,
    `- **Connectivity Tests:** ${report.summary.connectivityValidation.passed}/${report.summary.connectivityValidation.tested} passed (${report.summary.connectivityValidation.score}%)`,
    ``
  ];
  
  if (report.categorizedResults.critical.length > 0) {
    markdown.push(`## Critical Issues`, ``);
    report.categorizedResults.critical.forEach(issue => {
      markdown.push(`- **${issue.variable}:** ${issue.message}`);
    });
    markdown.push(``);
  }
  
  if (report.categorizedResults.warnings.length > 0) {
    markdown.push(`## Warnings`, ``);
    report.categorizedResults.warnings.forEach(warning => {
      markdown.push(`- **${warning.variable}:** ${warning.message}`);
    });
    markdown.push(``);
  }
  
  if (options.includeRecommendations && report.recommendations.length > 0) {
    markdown.push(`## Recommendations`, ``);
    report.recommendations.forEach((rec, index) => {
      markdown.push(`${index + 1}. **${rec.title}** (${rec.priority} priority)`);
      markdown.push(`   ${rec.description}`);
      markdown.push(``);
    });
  }
  
  return markdown.join('\n');
}

// Default HTML template
function getDefaultHtmlTemplate() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .score {
            font-size: 2em;
            font-weight: bold;
            color: {{OVERALL_SCORE}} >= 80 ? '#4caf50' : {{OVERALL_SCORE}} >= 60 ? '#ff9800' : '#f44336';
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .summary-card {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            text-align: center;
        }
        .summary-card h3 {
            margin: 0 0 10px 0;
            color: #666;
        }
        .summary-card .value {
            font-size: 1.5em;
            font-weight: bold;
            color: #333;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #f8f9fa;
            font-weight: 600;
        }
        .error {
            background-color: #ffebee;
            color: #c62828;
        }
        .warning {
            background-color: #fff3e0;
            color: #ef6c00;
        }
        .success {
            background-color: #e8f5e8;
            color: #2e7d32;
        }
        .section {
            margin: 30px 0;
        }
        .section h2 {
            color: #333;
            border-bottom: 1px solid #e0e0e0;
            padding-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{TITLE}}</h1>
            <p><strong>Generated:</strong> {{TIMESTAMP}}</p>
            <div class="score">Overall Score: {{OVERALL_SCORE}}%</div>
        </div>

        <div class="summary-grid">
            <div class="summary-card">
                <h3>Total Variables</h3>
                <div class="value">{{TOTAL_VARIABLES}}</div>
            </div>
            <div class="summary-card">
                <h3>Critical Issues</h3>
                <div class="value">{{CRITICAL_ISSUES}}</div>
            </div>
            <div class="summary-card">
                <h3>Warnings</h3>
                <div class="value">{{WARNINGS}}</div>
            </div>
            <div class="summary-card">
                <h3>Format Score</h3>
                <div class="value">{{FORMAT_SCORE}}%</div>
            </div>
        </div>

        <div class="section">
            <h2>Critical Issues</h2>
            <table>
                <thead>
                    <tr>
                        <th>Variable</th>
                        <th>Message</th>
                        <th>Severity</th>
                    </tr>
                </thead>
                <tbody>
                    {{CRITICAL_ISSUES_TABLE}}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>Warnings</h2>
            <table>
                <thead>
                    <tr>
                        <th>Variable</th>
                        <th>Message</th>
                        <th>Severity</th>
                    </tr>
                </thead>
                <tbody>
                    {{WARNINGS_TABLE}}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>Recommendations</h2>
            {{RECOMMENDATIONS}}
        </div>
    </div>
</body>
</html>`;
}

// Show help information
function showHelp() {
  console.log(`
Validation Report Generation Script

Usage:
  node generate-validation-report.js --app-id <id> [options]

Options:
  --app-id <id>           AWS Amplify app ID (required)
  --branch <name>         Branch name (default: staging)
  --format <format>       Report format: html, json, yaml, csv, markdown (default: html)
  --output <path>         Output file path (auto-generated if not specified)
  --template <path>       Custom HTML template file
  --no-recommendations    Exclude recommendations from report
  --no-details           Exclude variable details from report
  --skip-connectivity    Skip connectivity tests
  --verbose              Show detailed output
  --help                 Show this help message

Examples:
  # Generate HTML report
  node generate-validation-report.js --app-id d123abc --branch staging

  # Generate JSON report
  node generate-validation-report.js --app-id d123abc --format json --output report.json

  # Generate markdown report for documentation
  node generate-validation-report.js --app-id d123abc --format markdown --output README-validation.md

  # Use custom HTML template
  node generate-validation-report.js --app-id d123abc --template custom-template.html
`);
}

// Run the main function
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = { main, generateReport };