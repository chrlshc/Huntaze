#!/usr/bin/env node

/**
 * Instagram Insights Sync Worker Runner
 * Run this script periodically (e.g., every 6 hours) to sync Instagram insights
 * 
 * Usage:
 *   node scripts/run-instagram-insights-worker.js
 * 
 * Or with cron:
 *   0 */6 * * * cd /path/to/project && node scripts/run-instagram-insights-worker.js
 */

const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  console.log('='.repeat(60));
  console.log('Instagram Insights Sync Worker');
  console.log('Started at:', new Date().toISOString());
  console.log('='.repeat(60));

  try {
    // Dynamic import for ES modules
    const { runInstagramInsightsWorker } = await import('../lib/workers/instagramInsightsWorker.ts');
    
    await runInstagramInsightsWorker();
    
    console.log('='.repeat(60));
    console.log('Worker completed successfully');
    console.log('Finished at:', new Date().toISOString());
    console.log('='.repeat(60));
    
    process.exit(0);
  } catch (error) {
    console.error('='.repeat(60));
    console.error('Worker failed with error:');
    console.error(error);
    console.error('='.repeat(60));
    
    process.exit(1);
  }
}

main();
