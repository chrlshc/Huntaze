#!/usr/bin/env node

/**
 * Coverage threshold checker for Huntaze Simple Services
 * Validates that code coverage meets minimum requirements
 */

const fs = require('fs');
const path = require('path');

// Coverage thresholds
const THRESHOLDS = {
  statements: 85,
  branches: 80,
  functions: 85,
  lines: 85
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function readCoverageReport() {
  const coveragePaths = [
    'coverage/coverage-summary.json',
    'coverage/simple-services/coverage-summary.json',
    'reports/coverage-summary.json'
  ];

  for (const coveragePath of coveragePaths) {
    if (fs.existsSync(coveragePath)) {
      try {
        const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
        logInfo(`Found coverage report: ${coveragePath}`);
        return coverageData;
      } catch (error) {
        logWarning(`Failed to parse coverage report ${coveragePath}: ${error.message}`);
      }
    }
  }

  throw new Error('No coverage report found. Expected coverage-summary.json in coverage/ or reports/ directory.');
}

function extractCoverageMetrics(coverageData) {
  // Handle different coverage report formats
  if (coverageData.total) {
    // Standard format
    return {
      statements: coverageData.total.statements.pct,
      branches: coverageData.total.branches.pct,
      functions: coverageData.total.functions.pct,
      lines: coverageData.total.lines.pct
    };
  } else if (coverageData.statements) {
    // Alternative format
    return {
      statements: coverageData.statements.pct,
      branches: coverageData.branches.pct,
      functions: coverageData.functions.pct,
      lines: coverageData.lines.pct
    };
  } else {
    throw new Error('Unrecognized coverage report format');
  }
}

function checkThresholds(metrics) {
  log('\n' + '='.repeat(60), colors.cyan);
  log('COVERAGE THRESHOLD CHECK', colors.cyan + colors.bright);
  log('='.repeat(60), colors.cyan);

  let allPassed = true;
  const results = {};

  Object.entries(THRESHOLDS).forEach(([metric, threshold]) => {
    const actual = metrics[metric];
    const passed = actual >= threshold;
    
    results[metric] = {
      actual,
      threshold,
      passed
    };

    if (passed) {
      logSuccess(`${metric.padEnd(12)}: ${actual.toFixed(1)}% (threshold: ${threshold}%)`);
    } else {
      logError(`${metric.padEnd(12)}: ${actual.toFixed(1)}% (threshold: ${threshold}%) - FAILED`);
      allPassed = false;
    }
  });

  return { allPassed, results };
}

function generateDetailedReport(metrics, results) {
  const reportPath = 'reports/coverage-check-report.json';
  
  const report = {
    timestamp: new Date().toISOString(),
    thresholds: THRESHOLDS,
    metrics,
    results,
    summary: {
      totalChecks: Object.keys(THRESHOLDS).length,
      passedChecks: Object.values(results).filter(r => r.passed).length,
      failedChecks: Object.values(results).filter(r => r.passed === false).length,
      overallPassed: Object.values(results).every(r => r.passed)
    }
  };

  // Ensure reports directory exists
  const reportsDir = path.dirname(reportPath);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  logInfo(`Detailed coverage report saved to: ${reportPath}`);

  return report;
}

function printSummary(report) {
  log('\n' + '='.repeat(60), colors.cyan);
  log('COVERAGE SUMMARY', colors.cyan + colors.bright);
  log('='.repeat(60), colors.cyan);

  const { summary } = report;
  
  log(`Total Checks: ${summary.totalChecks}`, colors.blue);
  log(`Passed: ${summary.passedChecks}`, colors.green);
  log(`Failed: ${summary.failedChecks}`, summary.failedChecks > 0 ? colors.red : colors.green);
  
  const successRate = (summary.passedChecks / summary.totalChecks * 100).toFixed(1);
  log(`Success Rate: ${successRate}%`, successRate === '100.0' ? colors.green : colors.yellow);

  if (summary.overallPassed) {
    log('\n🎉 All coverage thresholds met!', colors.green + colors.bright);
  } else {
    log('\n💥 Some coverage thresholds not met!', colors.red + colors.bright);
    log('Please improve test coverage for the failing metrics.', colors.yellow);
  }
}

function suggestImprovements(results) {
  const failedMetrics = Object.entries(results)
    .filter(([, result]) => !result.passed)
    .map(([metric, result]) => ({
      metric,
      gap: result.threshold - result.actual
    }))
    .sort((a, b) => b.gap - a.gap);

  if (failedMetrics.length > 0) {
    log('\n' + '='.repeat(60), colors.yellow);
    log('IMPROVEMENT SUGGESTIONS', colors.yellow + colors.bright);
    log('='.repeat(60), colors.yellow);

    failedMetrics.forEach(({ metric, gap }) => {
      log(`\n${metric.toUpperCase()}:`, colors.yellow);
      log(`  Gap: ${gap.toFixed(1)} percentage points`, colors.red);
      
      switch (metric) {
        case 'statements':
          log('  💡 Add tests for uncovered code statements', colors.cyan);
          log('  💡 Focus on error handling and edge cases', colors.cyan);
          break;
        case 'branches':
          log('  💡 Add tests for conditional logic (if/else, switch)', colors.cyan);
          log('  💡 Test both true and false paths', colors.cyan);
          break;
        case 'functions':
          log('  💡 Ensure all functions are called in tests', colors.cyan);
          log('  💡 Test private methods through public interfaces', colors.cyan);
          break;
        case 'lines':
          log('  💡 Add tests for uncovered lines of code', colors.cyan);
          log('  💡 Remove dead code if not needed', colors.cyan);
          break;
      }
    });
  }
}

function main() {
  try {
    log('🔍 Checking code coverage thresholds...', colors.blue + colors.bright);

    // Read coverage report
    const coverageData = readCoverageReport();
    
    // Extract metrics
    const metrics = extractCoverageMetrics(coverageData);
    
    // Check thresholds
    const { allPassed, results } = checkThresholds(metrics);
    
    // Generate detailed report
    const report = generateDetailedReport(metrics, results);
    
    // Print summary
    printSummary(report);
    
    // Suggest improvements if needed
    if (!allPassed) {
      suggestImprovements(results);
    }

    // Exit with appropriate code
    if (allPassed) {
      log('\n✨ Coverage check completed successfully!', colors.green);
      process.exit(0);
    } else {
      log('\n💔 Coverage check failed!', colors.red);
      process.exit(1);
    }

  } catch (error) {
    logError(`Coverage check failed: ${error.message}`);
    
    // Try to provide helpful error messages
    if (error.message.includes('No coverage report found')) {
      log('\n💡 Make sure to run tests with coverage enabled:', colors.cyan);
      log('   npm run test:coverage', colors.cyan);
      log('   or', colors.cyan);
      log('   npm run test -- --coverage', colors.cyan);
    }
    
    process.exit(1);
  }
}

// Run the coverage check
if (require.main === module) {
  main();
}

module.exports = {
  checkThresholds,
  extractCoverageMetrics,
  THRESHOLDS
};