#!/usr/bin/env node

/**
 * Safe Deployments Test Script
 */

async function testSafeDeployments() {
  console.log('🧪 Testing Safe Deployments System...\n');
  
  try {
    const { DeploymentCLI } = await import('./deploy-cli.js');
    const cli = new DeploymentCLI();
    
    // Test deployment status
    console.log('📊 Testing deployment status...');
    const status = await cli.status();
    
    if (status) {
      console.log('✅ Deployment status endpoint working');
      console.log(`   Canary deployments: ${status.deployments.canary.total}`);
      console.log(`   Blue-Green deployments: ${status.deployments.blueGreen.total}`);
      console.log(`   Error budget services: ${status.deployments.errorBudget.services}`);
    } else {
      console.log('❌ Deployment status endpoint failed');
    }
    
    // Test error budget check
    console.log('\n📊 Testing error budget check...');
    try {
      const budgetResult = await cli.makeRequest('/api/deployments/status', {
        method: 'POST',
        body: JSON.stringify({
          action: 'check_error_budget',
          serviceName: 'api-gateway',
          deploymentType: 'normal'
        })
      });
      
      if (budgetResult.success) {
        console.log('✅ Error budget check working');
        console.log(`   Result: ${budgetResult.result.allowed ? 'ALLOWED' : 'BLOCKED'}`);
        console.log(`   Reason: ${budgetResult.result.reason}`);
      } else {
        console.log('❌ Error budget check failed');
      }
    } catch (error) {
      console.log(`❌ Error budget check error: ${error.message}`);
    }
    
    console.log('\n🎉 Safe deployments test completed!');
    
  } catch (error) {
    console.error('❌ Safe deployments test failed:', error.message);
    console.log('\n💡 Make sure the development server is running: npm run dev');
  }
}

testSafeDeployments();
