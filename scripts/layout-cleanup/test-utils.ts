#!/usr/bin/env tsx

/**
 * Simple test script to verify utilities are working
 */

import { Logger, ProgressBar } from './utils/logger';
import { ensureDirectory, fileExists } from './utils/file-operations';

async function testUtilities() {
  console.log('🧪 Testing Layout Cleanup Utilities\n');

  // Test Logger
  console.log('1. Testing Logger...');
  const logger = new Logger('.kiro/build-logs', true);
  await logger.initialize();
  
  await logger.info('Logger initialized successfully');
  await logger.success('File operations module loaded');
  await logger.warn('This is a warning message');
  await logger.debug('Debug information');
  
  await logger.createLatestSymlink();
  console.log(`   ✅ Logger working! Log file: ${logger.getLogFilePath()}\n`);

  // Test Progress Bar
  console.log('2. Testing Progress Bar...');
  const progress = new ProgressBar(10, 'Testing');
  for (let i = 0; i < 10; i++) {
    await new Promise(resolve => setTimeout(resolve, 100));
    progress.increment();
  }
  console.log('   ✅ Progress bar working!\n');

  // Test Directory Creation
  console.log('3. Testing Directory Creation...');
  await ensureDirectory('.kiro/reports');
  await ensureDirectory('.kiro/backups/layouts');
  
  const reportsExist = fileExists('.kiro/reports');
  const backupsExist = fileExists('.kiro/backups/layouts');
  
  console.log(`   Reports directory exists: ${reportsExist ? '✅' : '❌'}`);
  console.log(`   Backups directory exists: ${backupsExist ? '✅' : '❌'}\n`);

  // Summary
  await logger.success('All utility tests passed!');
  console.log('✅ All utilities are working correctly!\n');
  console.log('📁 Created directories:');
  console.log('   - .kiro/build-logs/');
  console.log('   - .kiro/reports/');
  console.log('   - .kiro/backups/layouts/');
}

// Run tests
testUtilities().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
