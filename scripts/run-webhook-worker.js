#!/usr/bin/env node

/**
 * Webhook Worker Runner
 * 
 * Runs webhook worker as standalone process
 * 
 * Usage:
 *   node scripts/run-webhook-worker.js [--once] [--interval=60000]
 * 
 * Options:
 *   --once          Run once and exit
 *   --interval=N    Run continuously with N ms interval (default: 60000)
 * 
 * Examples:
 *   node scripts/run-webhook-worker.js --once
 *   node scripts/run-webhook-worker.js --interval=30000
 */

require('dotenv').config();

const { webhookWorker } = require('../lib/workers/webhookWorker');

// Parse command line arguments
const args = process.argv.slice(2);
const runOnce = args.includes('--once');
const intervalArg = args.find(arg => arg.startsWith('--interval='));
const interval = intervalArg ? parseInt(intervalArg.split('=')[1], 10) : 60000;

async function main() {
  console.log('='.repeat(60));
  console.log('Webhook Worker Runner');
  console.log('='.repeat(60));
  console.log(`Mode: ${runOnce ? 'Single run' : 'Continuous'}`);
  if (!runOnce) {
    console.log(`Interval: ${interval}ms (${interval / 1000}s)`);
  }
  console.log('='.repeat(60));
  console.log('');

  try {
    if (runOnce) {
      // Run once and exit
      console.log('Running webhook worker once...');
      const processed = await webhookWorker.processPendingEvents();
      console.log(`\nCompleted: ${processed} events processed`);
      process.exit(0);
    } else {
      // Run continuously
      console.log('Starting webhook worker (continuous mode)...');
      console.log('Press Ctrl+C to stop\n');
      
      await webhookWorker.runContinuously(interval);
    }
  } catch (error) {
    console.error('Worker error:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down webhook worker...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\nShutting down webhook worker...');
  process.exit(0);
});

// Run
main();
