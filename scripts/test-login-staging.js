#!/usr/bin/env node

/**
 * Test login functionality in staging environment
 */

async function testStagingLogin() {
  const stagingUrl = 'https://staging.huntaze.com'; // Adjust based on actual staging URL
  
  console.log('🚀 Testing Staging Login Functionality');
  console.log(`Staging URL: ${stagingUrl}`);
  console.log('='.repeat(50));

  try {
    // Test health checks first
    console.log('\n🔍 Testing health endpoints...');
    
    const healthEndpoints = ['database', 'auth', 'config', 'overall'];
    
    for (const endpoint of healthEndpoints) {
      try {
        console.log(`\n📋 Testing /api/health/${endpoint}...`);
        
        const response = await fetch(`${stagingUrl}/api/health/${endpoint}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const data = await response.json();
        
        console.log(`   Status: ${response.status}`);
        console.log(`   Service: ${data.service}`);
        console.log(`   Health: ${data.status}`);
        
        if (data.error) {
          console.log(`   ❌ Error: ${data.error}`);
        }
        
        if (data.details && data.details.issues) {
          console.log(`   ⚠️  Issues: ${JSON.stringify(data.details.issues)}`);
        }
        
        if (data.details && data.details.criticalIssues) {
          console.log(`   🚨 Critical: ${JSON.stringify(data.details.criticalIssues)}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
      }
    }

    // Test login endpoint
    console.log('\n🔍 Testing login endpoint...');
    
    try {
      const loginResponse = await fetch(`${stagingUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'testpassword123'
        })
      });

      const loginData = await loginResponse.json();
      
      console.log(`   Status: ${loginResponse.status}`);
      console.log(`   Response: ${JSON.stringify(loginData, null, 2)}`);
      
      if (loginResponse.status === 500) {
        console.log('\n🚨 CONFIRMED: Login endpoint returning 500 error');
        console.log('   This confirms the staging login issue');
      }
      
    } catch (error) {
      console.log(`   ❌ Login test failed: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Staging test failed:', error);
  }
}

// Alternative: Test with curl commands
function generateCurlCommands() {
  const stagingUrl = 'https://staging.huntaze.com'; // Adjust based on actual staging URL
  
  console.log('\n📋 CURL COMMANDS FOR MANUAL TESTING:');
  console.log('='.repeat(50));
  
  console.log('\n# Test health endpoints:');
  console.log(`curl -X GET "${stagingUrl}/api/health/database"`);
  console.log(`curl -X GET "${stagingUrl}/api/health/auth"`);
  console.log(`curl -X GET "${stagingUrl}/api/health/config"`);
  console.log(`curl -X GET "${stagingUrl}/api/health/overall"`);
  
  console.log('\n# Test login endpoint:');
  console.log(`curl -X POST "${stagingUrl}/api/auth/login" \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"email":"test@example.com","password":"testpassword123"}'`);
}

async function main() {
  // Check if we can reach staging
  const stagingUrl = process.env.STAGING_URL || 'https://staging.huntaze.com';
  
  console.log('🎯 Staging Login Diagnostic');
  console.log(`Target: ${stagingUrl}`);
  
  try {
    // Test if staging is reachable
    const response = await fetch(stagingUrl, { method: 'HEAD' });
    console.log(`✅ Staging reachable (${response.status})`);
    
    // Run the tests
    await testStagingLogin();
    
  } catch (error) {
    console.log(`❌ Cannot reach staging: ${error.message}`);
    console.log('\n💡 You can test manually using the curl commands below:');
  }
  
  // Always show curl commands for manual testing
  generateCurlCommands();
  
  console.log('\n🏁 Staging diagnostic complete');
}

main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});