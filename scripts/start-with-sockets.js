#!/usr/bin/env node

/**
 * Start Next.js server with Socket.IO support for real-time collaboration
 */

const { startSocketServer } = require('../lib/socket/server');

async function main() {
  console.log('🚀 Starting Next.js server with Socket.IO support...');
  
  try {
    await startSocketServer();
    console.log('✅ Server started successfully with real-time collaboration support');
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

if (require.main === module) {
  main();
}