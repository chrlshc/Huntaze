#!/usr/bin/env npx ts-node
/**
 * AI System Validation CLI Script
 * 
 * Runs the full AI system validation suite from the command line.
 * 
 * Usage:
 *   npx ts-node scripts/validate-ai-system.ts [options]
 * 
 * Options:
 *   --json          Output as JSON instead of formatted text
 *   --skip-aws      Skip AWS connectivity checks
 *   --skip-resilience  Skip resilience tests
 *   --skip-e2e      Skip end-to-end tests
 *   --router-url    Override AI Router URL
 *   --help          Show help
 * 
 * Examples:
 *   npx ts-node scripts/validate-ai-system.ts
 *   npx ts-node scripts/validate-ai-system.ts --json
 *   npx ts-node scripts/validate-ai-system.ts --skip-aws --skip-e2e
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });
config({ path: '.env' });

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
};

function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`;
}

function printHeader(): void {
  console.log('');
  console.log(colorize('═══════════════════════════════════════════════════════════════', 'cyan'));
  console.log(colorize('           AWS AI SYSTEM VALIDATION CLI                        ', 'bright'));
  console.log(colorize('═══════════════════════════════════════════════════════════════', 'cyan'));
  console.log('');
}

function printHelp(): void {
  printHeader();
  console.log('Usage: npx ts-node scripts/validate-ai-system.ts [options]');
  console.log('');
  console.log('Options:');
  console.log('  --json              Output as JSON instead of formatted text');
  console.log('  --skip-aws          Skip AWS connectivity checks');
  console.log('  --skip-resilience   Skip resilience tests');
  console.log('  --skip-e2e          Skip end-to-end tests');
  console.log('  --router-url <url>  Override AI Router URL');
  console.log('  --help              Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  npx ts-node scripts/validate-ai-system.ts');
  console.log('  npx ts-node scripts/validate-ai-system.ts --json');
  console.log('  npx ts-node scripts/validate-ai-system.ts --skip-aws --skip-e2e');
  console.log('');
}

function parseArgs(): {
  json: boolean;
  skipAWS: boolean;
  skipResilience: boolean;
  skipE2E: boolean;
  routerUrl?: string;
  help: boolean;
} {
  const args = process.argv.slice(2);
  const result = {
    json: false,
    skipAWS: false,
    skipResilience: false,
    skipE2E: false,
    routerUrl: undefined as string | undefined,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--json':
        result.json = true;
        break;
      case '--skip-aws':
        result.skipAWS = true;
        break;
      case '--skip-resilience':
        result.skipResilience = true;
        break;
      case '--skip-e2e':
        result.skipE2E = true;
        break;
      case '--router-url':
        result.routerUrl = args[++i];
        break;
      case '--help':
      case '-h':
        result.help = true;
        break;
    }
  }

  return result;
}

function statusIcon(success: boolean): string {
  return success ? colorize('✓', 'green') : colorize('✗', 'red');
}

function statusText(status: string): string {
  switch (status) {
    case 'PASS':
      return colorize('PASS', 'green');
    case 'PARTIAL':
      return colorize('PARTIAL', 'yellow');
    case 'FAIL':
      return colorize('FAIL', 'red');
    default:
      return status;
  }
}

async function main(): Promise<void> {
  const args = parseArgs();

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  printHeader();

  console.log(colorize('Starting validation...', 'dim'));
  console.log('');

  try {
    // Dynamic import to avoid issues with module resolution
    const { runValidation, formatReport } = await import('../lib/ai/validation/validation-runner');

    const config = {
      skipAWSConnectivity: args.skipAWS,
      skipResilience: args.skipResilience,
      skipE2E: args.skipE2E,
      routerUrl: args.routerUrl,
      environment: process.env.NODE_ENV || 'development',
    };

    console.log(colorize('Configuration:', 'bright'));
    console.log(`  Environment: ${config.environment}`);
    console.log(`  Router URL: ${config.routerUrl || 'default'}`);
    console.log(`  Skip AWS: ${config.skipAWSConnectivity}`);
    console.log(`  Skip Resilience: ${config.skipResilience}`);
    console.log(`  Skip E2E: ${config.skipE2E}`);
    console.log('');

    const startTime = Date.now();
    const report = await runValidation(config);
    const duration = Date.now() - startTime;

    if (args.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      // Print formatted report
      console.log(colorize('───────────────────────────────────────────────────────────────', 'dim'));
      console.log(colorize('                        RESULTS                                ', 'bright'));
      console.log(colorize('───────────────────────────────────────────────────────────────', 'dim'));
      console.log('');

      console.log(`Overall Status: ${statusText(report.overallStatus)}`);
      console.log(`Duration: ${duration}ms`);
      console.log('');

      console.log(colorize('Summary:', 'bright'));
      console.log(`  Total Checks: ${report.summary.totalChecks}`);
      console.log(`  Passed: ${colorize(String(report.summary.passedChecks), 'green')}`);
      console.log(`  Failed: ${colorize(String(report.summary.failedChecks), 'red')}`);
      console.log('');

      console.log(colorize('Router Health:', 'bright'));
      console.log(`  ${statusIcon(report.routerHealth.healthy)} Status: ${report.routerHealth.healthy ? 'Healthy' : 'Unhealthy'}`);
      console.log(`  Response Time: ${report.routerHealth.responseTimeMs}ms`);
      console.log('');

      console.log(colorize('Killer Features:', 'bright'));
      console.log(`  ${statusIcon(report.killerFeatures.insights.success)} Insights`);
      console.log(`  ${statusIcon(report.killerFeatures.campaignGenerator.success)} Campaign Generator`);
      console.log(`  ${statusIcon(report.killerFeatures.fanSegmentation.success)} Fan Segmentation`);
      console.log('');

      console.log(colorize('AWS Connectivity:', 'bright'));
      console.log(`  ${statusIcon(report.awsConnectivity.rdsConnected)} RDS`);
      console.log(`  ${statusIcon(report.awsConnectivity.secretsManagerAccessible)} Secrets Manager`);
      console.log(`  ${statusIcon(report.awsConnectivity.routerAccessible)} Router`);
      console.log('');

      console.log(colorize('Resilience:', 'bright'));
      console.log(`  ${statusIcon(report.resilience.fallback.fallbackTriggered)} Fallback (${report.resilience.fallback.fallbackTimeMs}ms)`);
      console.log(`  ${statusIcon(report.resilience.circuitBreaker.circuitOpen)} Circuit Breaker`);
      console.log('');

      console.log(colorize('Cost Tracking:', 'bright'));
      console.log(`  ${statusIcon(report.costTracking.costCalculated)} Calculated: $${report.costTracking.calculatedCost.toFixed(6)}`);
      console.log('');

      console.log(colorize('E2E Tests:', 'bright'));
      console.log(`  ${statusIcon(report.e2e.aiService.success)} AI Service`);
      console.log(`  ${statusIcon(report.e2e.coordinator.success)} Coordinator`);
      console.log('');

      if (report.errors.length > 0) {
        console.log(colorize('Errors:', 'red'));
        report.errors.forEach(error => {
          console.log(`  • ${error}`);
        });
        console.log('');
      }

      console.log(colorize('═══════════════════════════════════════════════════════════════', 'cyan'));
    }

    // Exit with appropriate code
    process.exit(report.overallStatus === 'FAIL' ? 1 : 0);
  } catch (error) {
    console.error(colorize('Error running validation:', 'red'));
    console.error(error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Run main function
main().catch(console.error);
