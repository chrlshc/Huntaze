#!/usr/bin/env tsx
/**
 * Setup AWS Infrastructure Script
 * Run this to configure CloudWatch monitoring, dashboards, and alarms
 */

import { setupAWSInfrastructure } from '../lib/aws/setup-infrastructure';

async function main() {
  const alertEmail = process.env.ALERT_EMAIL || process.argv[2];

  if (!alertEmail) {
    console.log('Usage: npm run setup-aws [email]');
    console.log('Or set ALERT_EMAIL environment variable');
    console.log('\nProceeding without email alerts...\n');
  }

  try {
    await setupAWSInfrastructure(alertEmail);
    process.exit(0);
  } catch (error) {
    console.error('Failed to setup AWS infrastructure:', error);
    process.exit(1);
  }
}

main();
