#!/usr/bin/env node

/**
 * Analytics Snapshot Worker Runner
 * 
 * Collects daily analytics snapshots from all platforms
 * Run this script daily via cron or scheduler
 */

require('dotenv').config();

async function main() {
  console.log('🚀 Starting Analytics Snapshot Worker...\n');

  try {
    // Dynamic import for ES modules
    const { analyticsSnapshotWorker } = await import('../lib/workers/analyticsSnapshotWorker.ts');

    await analyticsSnapshotWorker.run();

    console.log('\n✅ Analytics snapshot collection complete!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Analytics snapshot collection failed:', error);
    process.exit(1);
  }
}

main();
