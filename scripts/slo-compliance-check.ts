#!/usr/bin/env ts-node
/**
 * SLO Compliance Check Script
 * 
 * Runs hourly to calculate SLO compliance and generate reports.
 * Can be executed manually or via cron job.
 * 
 * Usage:
 *   npm run slo:check
 *   node scripts/slo-compliance-check.ts
 */

import { sloMonitoring } from '../lib/services/slo-monitoring';
import { sloTracker } from '../lib/slo-tracker';

async function main() {
  console.log('🔍 Starting SLO compliance check...\n');

  try {
    // Get all SLO metrics
    const metrics = await sloMonitoring.getAllSLOMetrics();

    console.log('📊 SLO Metrics:\n');
    console.log('─'.repeat(80));

    // Display each metric
    for (const metric of metrics) {
      const statusEmoji = 
        metric.status === 'healthy' ? '✅' :
        metric.status === 'warning' ? '⚠️' : '🚨';

      console.log(`${statusEmoji} ${metric.name}`);
      console.log(`   Current: ${metric.current_value.toFixed(2)}`);
      console.log(`   Target: ${metric.target}`);
      console.log(`   Compliance: ${metric.compliance.toFixed(1)}%`);
      console.log(`   Error Budget: ${metric.error_budget_remaining.toFixed(1)}%`);
      console.log(`   Status: ${metric.status.toUpperCase()}`);
      console.log('');
    }

    console.log('─'.repeat(80));

    // Generate report
    const report = sloTracker.generateReport(metrics);

    console.log('\n📈 Overall Compliance:', report.overall_compliance.toFixed(1) + '%');

    // Display violations
    if (report.violations.length > 0) {
      console.log('\n🚨 SLO Violations:');
      for (const violation of report.violations) {
        console.log(`   - ${violation.slo_name} (${violation.severity})`);
        console.log(`     Impact: ${violation.impact}`);
      }
    } else {
      console.log('\n✅ No SLO violations');
    }

    // Display recommendations
    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      for (const rec of report.recommendations) {
        console.log(`   - ${rec}`);
      }
    }

    // Check for alerts
    console.log('\n🔔 Checking for alerts...');
    await sloMonitoring.checkAndAlert();

    console.log('\n✅ SLO compliance check complete\n');

    // Exit with error code if there are critical violations
    const criticalViolations = report.violations.filter(v => v.severity === 'critical');
    if (criticalViolations.length > 0) {
      console.error(`❌ ${criticalViolations.length} critical SLO violation(s) detected`);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error during SLO compliance check:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { main };
