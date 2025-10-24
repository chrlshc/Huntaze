import { FullConfig } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global test teardown...');

  try {
    // Clean up test artifacts
    const authStatePath = 'tests/setup/auth-state.json';
    try {
      await fs.unlink(authStatePath);
      console.log('🗑️  Cleaned up authentication state');
    } catch (error) {
      // File might not exist, which is fine
    }

    // Clean up temporary test files
    const tempDir = 'tests/temp';
    try {
      await fs.rmdir(tempDir, { recursive: true });
      console.log('🗑️  Cleaned up temporary files');
    } catch (error) {
      // Directory might not exist, which is fine
    }

    // Generate test report summary
    const testResultsDir = 'test-results';
    try {
      const files = await fs.readdir(testResultsDir);
      const reportFiles = files.filter(file => 
        file.endsWith('.json') || file.endsWith('.xml') || file.endsWith('.html')
      );
      
      if (reportFiles.length > 0) {
        console.log('📊 Test reports generated:');
        reportFiles.forEach(file => {
          console.log(`   - ${file}`);
        });
      }
    } catch (error) {
      console.log('ℹ️  No test results directory found');
    }

    console.log('✅ Global teardown completed successfully');

  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
}

export default globalTeardown;