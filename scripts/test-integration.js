#!/usr/bin/env node

const fetch = require('node-fetch');

async function testIntegration() {
  console.log('🧪 Testing Huntaze Integration...\n');

  try {
    // Test services endpoint
    console.log('📡 Testing services endpoint...');
    const response = await fetch('http://localhost:3000/api/test-services');
    
    if (!response.ok) {
      console.error('❌ Failed to fetch services status');
      console.error('Response status:', response.status);
      return;
    }

    const data = await response.json();
    
    // Display results
    console.log('\n📊 Service Status:');
    Object.entries(data.services).forEach(([service, info]) => {
      const icon = info.status === 'ok' ? '✅' : '❌';
      console.log(`${icon} ${service}: ${info.status}`);
    });

    console.log('\n🔧 Environment:');
    Object.entries(data.environment).forEach(([key, value]) => {
      const icon = value === true || (typeof value === 'string' && value !== 'not set') ? '✅' : '❌';
      console.log(`${icon} ${key}: ${typeof value === 'boolean' ? (value ? 'configured' : 'not configured') : value}`);
    });

    console.log('\n📋 Summary:');
    console.log(data.summary.all_services_ok ? 
      '✅ All services are operational!' : 
      '⚠️  Some services need configuration'
    );

    // Test AI endpoint
    console.log('\n🤖 Testing AI Chat...');
    const aiResponse = await fetch('http://localhost:3000/api/ai/chat', {
      method: 'GET'
    });
    
    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      console.log('✅ AI service:', aiData.ai.status);
    } else {
      console.log('❌ AI service not available');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nMake sure the server is running: npm run dev');
  }
}

// Run the test
testIntegration();