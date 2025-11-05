#!/usr/bin/env node

/**
 * Recovery System Test Script
 */

const http = require('http');

async function testRecoverySystem() {
  console.log('🧪 Testing Recovery System...\n');
  
  try {
    // Test recovery status endpoint
    console.log('📊 Testing recovery status endpoint...');
    const response = await fetch('http://localhost:3000/api/recovery/status');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Recovery status endpoint working');
      console.log(`   Status: ${data.status}`);
      console.log(`   Circuit Breakers: ${data.recovery.circuitBreakers.summary.total}`);
      console.log(`   Health Checks: ${data.recovery.healthChecks.summary.total}`);
    } else {
      console.log('❌ Recovery status endpoint failed');
    }
    
    // Test circuit breaker reset
    console.log('\n🔄 Testing circuit breaker reset...');
    const resetResponse = await fetch('http://localhost:3000/api/recovery/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset_circuit_breaker' })
    });
    
    if (resetResponse.ok) {
      console.log('✅ Circuit breaker reset working');
    } else {
      console.log('❌ Circuit breaker reset failed');
    }
    
    // Test auto-healing trigger
    console.log('\n🔧 Testing auto-healing trigger...');
    const healingResponse = await fetch('http://localhost:3000/api/recovery/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'trigger_healing' })
    });
    
    if (healingResponse.ok) {
      console.log('✅ Auto-healing trigger working');
    } else {
      console.log('❌ Auto-healing trigger failed');
    }
    
    console.log('\n🎉 Recovery system test completed!');
    
  } catch (error) {
    console.error('❌ Recovery system test failed:', error.message);
    console.log('\n💡 Make sure the development server is running: npm run dev');
  }
}

testRecoverySystem();
