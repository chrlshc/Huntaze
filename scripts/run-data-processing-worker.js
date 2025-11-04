#!/usr/bin/env node

/**
 * Data Processing Worker Startup Script
 * 
 * This script starts the behavioral data processing worker that handles:
 * - Real-time behavioral event processing
 * - Data validation and cleaning
 * - Data warehouse ingestion
 * - Queue management and error handling
 * 
 * Usage:
 *   node scripts/run-data-processing-worker.js [options]
 * 
 * Options:
 *   --batch-size <number>     Batch size for processing (default: 100)
 *   --interval <number>       Processing interval in ms (default: 5000)
 *   --max-retries <number>    Maximum retry attempts (default: 3)
 *   --error-threshold <number> Error rate threshold (default: 0.1)
 *   --help                    Show help message
 */

const { dataProcessingWorker } = require('../lib/workers/dataProcessingWorker');

// Parse command line arguments
const args = process.argv.slice(2);
const config = {};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--batch-size':
      config.batchSize = parseInt(args[++i]);
      break;
    case '--interval':
      config.processingInterval = parseInt(args[++i]);
      break;
    case '--max-retries':
      config.maxRetries = parseInt(args[++i]);
      break;
    case '--error-threshold':
      config.errorThreshold = parseFloat(args[++i]);
      break;
    case '--help':
      console.log(`
Data Processing Worker

This worker processes behavioral events in real-time and manages data pipeline operations.

Usage:
  node scripts/run-data-processing-worker.js [options]

Options:
  --batch-size <number>     Batch size for processing (default: 100)
  --interval <number>       Processing interval in ms (default: 5000)
  --max-retries <number>    Maximum retry attempts (default: 3)
  --error-threshold <number> Error rate threshold (default: 0.1)
  --help                    Show this help message

Environment Variables:
  NODE_ENV                  Environment (development/production)
  REDIS_URL                 Redis connection URL
  DW_DB_HOST               Data warehouse database host
  DW_DB_PORT               Data warehouse database port
  DW_DB_NAME               Data warehouse database name
  DW_DB_USER               Data warehouse database user
  DW_DB_PASSWORD           Data warehouse database password

Examples:
  # Start with default settings
  node scripts/run-data-processing-worker.js

  # Start with custom batch size and interval
  node scripts/run-data-processing-worker.js --batch-size 200 --interval 3000

  # Start with higher error threshold for development
  node scripts/run-data-processing-worker.js --error-threshold 0.2
      `);
      process.exit(0);
      break;
    default:
      console.error(`Unknown option: ${args[i]}`);
      process.exit(1);
  }
}

// Validate configuration
if (config.batchSize && (config.batchSize < 1 || config.batchSize > 1000)) {
  console.error('Batch size must be between 1 and 1000');
  process.exit(1);
}

if (config.processingInterval && config.processingInterval < 1000) {
  console.error('Processing interval must be at least 1000ms');
  process.exit(1);
}

if (config.maxRetries && (config.maxRetries < 1 || config.maxRetries > 10)) {
  console.error('Max retries must be between 1 and 10');
  process.exit(1);
}

if (config.errorThreshold && (config.errorThreshold < 0 || config.errorThreshold > 1)) {
  console.error('Error threshold must be between 0 and 1');
  process.exit(1);
}

// Environment validation
const requiredEnvVars = ['REDIS_URL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please set these environment variables before starting the worker.');
  process.exit(1);
}

// Start the worker
async function startWorker() {
  try {
    console.log('🚀 Starting Data Processing Worker...');
    console.log('Configuration:', {
      batchSize: config.batchSize || 100,
      processingInterval: config.processingInterval || 5000,
      maxRetries: config.maxRetries || 3,
      errorThreshold: config.errorThreshold || 0.1,
      environment: process.env.NODE_ENV || 'development'
    });

    // Create worker with custom config
    const worker = new (require('../lib/workers/dataProcessingWorker').DataProcessingWorker)(config);
    
    // Start the worker
    await worker.start();
    
    console.log('✅ Data Processing Worker started successfully');
    console.log('📊 Worker will process behavioral events and manage data pipeline operations');
    console.log('🔄 Processing queues: behavioral_events_queue, data_warehouse_queue');
    console.log('⚠️  Dead letter queue: dead_letter_queue');
    console.log('');
    console.log('Press Ctrl+C to stop the worker gracefully');

    // Log periodic status updates
    setInterval(() => {
      const status = worker.getStatus();
      if (status.isRunning) {
        console.log(`📈 Worker Status - Processed: ${status.stats.totalProcessed}, Errors: ${status.stats.totalErrors}, Avg Time: ${Math.round(status.stats.averageProcessingTime)}ms`);
      }
    }, 30000); // Every 30 seconds

  } catch (error) {
    console.error('❌ Failed to start Data Processing Worker:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Handle process signals for graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the worker
startWorker();