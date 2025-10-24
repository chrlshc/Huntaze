import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');

  // Start browser for setup tasks
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Wait for server to be ready
    const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';
    
    console.log(`⏳ Waiting for server at ${baseURL}...`);
    
    let retries = 30;
    while (retries > 0) {
      try {
        const response = await page.goto(`${baseURL}/api/health`);
        if (response?.ok()) {
          console.log('✅ Server is ready');
          break;
        }
      } catch (error) {
        console.log(`⏳ Server not ready, retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        retries--;
      }
    }

    if (retries === 0) {
      throw new Error('Server failed to start within timeout period');
    }

    // Setup test data if needed
    console.log('📝 Setting up test data...');
    
    // Create test user session
    await page.goto(`${baseURL}/auth/test-login`);
    
    // Store authentication state
    await page.context().storageState({ 
      path: 'tests/setup/auth-state.json' 
    });

    console.log('✅ Global setup completed successfully');

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;