#!/usr/bin/env node

/**
 * Content Scheduling Worker Runner
 * 
 * This script starts the content scheduling worker that checks for
 * scheduled content and publishes it at the appropriate time.
 * 
 * Usage:
 *   node scripts/run-content-scheduling-worker.js
 */

const http = require('http');

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function startWorker() {
  console.log('Starting content scheduling worker...');
  
  try {
    const response = await fetch(`${API_URL}/api/workers/content-scheduling`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: 'start' })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✓ Content scheduling worker started successfully');
      console.log('Status:', data.status);
      console.log('\nWorker is now running. Press Ctrl+C to stop.');
      
      // Keep the process alive
      setInterval(() => {
        // Check worker status every 5 minutes
        checkWorkerStatus();
      }, 5 * 60 * 1000);
    } else {
      console.error('✗ Failed to start worker:', data.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('✗ Error starting worker:', error.message);
    process.exit(1);
  }
}

async function checkWorkerStatus() {
  try {
    const response = await fetch(`${API_URL}/api/workers/content-scheduling`);
    const data = await response.json();
    
    if (data.success) {
      console.log('[Status Check]', new Date().toISOString(), '- Worker is running:', data.status.isRunning);
    }
  } catch (error) {
    console.error('[Status Check] Error:', error.message);
  }
}

async function stopWorker() {
  console.log('\nStopping content scheduling worker...');
  
  try {
    const response = await fetch(`${API_URL}/api/workers/content-scheduling`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: 'stop' })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✓ Content scheduling worker stopped successfully');
    }
  } catch (error) {
    console.error('✗ Error stopping worker:', error.message);
  }
  
  process.exit(0);
}

// Handle graceful shutdown
process.on('SIGINT', stopWorker);
process.on('SIGTERM', stopWorker);

// Start the worker
startWorker();
