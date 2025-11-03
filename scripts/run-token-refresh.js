#!/usr/bin/env node

/**
 * Token Refresh Scheduler Runner
 * 
 * Runs token refresh scheduler as standalone process
 * 
 * Usage:
 *   node scripts/run-token-refresh.js [--once] [--interval=1800000]
 * 
 * Options:
 *   --once          Run once and exit
 *   --interval=N    Run continuously with N ms interval (default: 1800000 = 30 min)
 * 
 * Examples:
 *   node scripts/run-token-refresh.js --once
 *   node scripts/run-token-refresh.js --interval=600000  # Every 10 minutes
 */

require('dotenv').config();

const { tokenRefreshScheduler } = require('../lib/workers/tokenRefreshScheduler');

// Parse command line arguments
const args = process.argv.slice(2);
const runOnce = args.includes('--once');
const intervalArg = args.find(arg => arg.startsWith('--interval='));
const interval = intervalArg ? parseInt(intervalArg.split('=')[1], 10) : 1800000; // 30 minutes

async function main() {
  console.log('='.repeat(60));
  console.log('Token Refresh Scheduler Runner');
  console.log('='.repeat(60));
  console.log(`Mode: ${runOnce ? 'Single run' : 'Continuous'}`);
  if (!runOnce) {
    console.log(`Interval: ${interval}ms (${interval / 1000}s = ${interval / 60000} min)`);
  }
  console.log('='.repeat(60));
  console.log('');

  try {
    if (runOnce) {
      // Run once and exit
      console.log('Running token refresh scheduler once...');
      const result = await tokenRefreshScheduler.refreshExpiringTokens();
      console.log(`\nCompleted:`);
      console.log(`  Total: ${result.total}`);
      console.log(`  Refreshed: ${result.refreshed}`);
      console.log(`  Failed: ${result.failed}`);
      
      if (result.errors.length > 0) {
        console.log(`\nErrors:`);
        result.errors.forEach(err => {
          console.log(`  Account ${err.accountId} (${err.provider}): ${err.error}`);
        });
      }
      
      process.exit(result.failed > 0 ? 1 : 0);
    } else {
      // Run continuously
      console.log('Starting token refresh scheduler (continuous mode)...');
      console.log('Press Ctrl+C to stop\n');

      await tokenRefreshScheduler.runContinuously(interval);
    }
  } catch (error) {
    console.error('Scheduler error:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down token refresh scheduler...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\nShutting down token refresh scheduler...');
  process.exit(0);
});

// Run
main();
