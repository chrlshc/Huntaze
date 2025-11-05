#!/usr/bin/env node

/**
 * Load Shedding Validation Script
 */

async function validateLoadShedding() {
  console.log('🧪 Validating Load Shedding System...\n');
  
  try {
    // Test load shedding status endpoint
    console.log('📊 Testing load shedding status endpoint...');
    const response = await fetch('http://localhost:3000/api/load-shedding/status?metrics=true');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Load shedding status endpoint working');
      console.log(`   Status: ${data.status}`);
      console.log(`   Shed Level: ${data.loadShedding.admissionControl.shedLevel}`);
      console.log(`   Active Throttling: ${data.loadShedding.clientThrottling.summary.activeThrottling}`);
    } else {
      console.log('❌ Load shedding status endpoint failed');
    }
    
    // Test admission control
    console.log('\n🚪 Testing admission control...');
    const admissionResponse = await fetch('http://localhost:3000/api/health', {
      headers: {
        'X-Priority-Class': 'CRITICAL'
      }
    });
    
    if (admissionResponse.ok) {
      console.log('✅ Admission control allowing requests');
      const priorityClass = admissionResponse.headers.get('X-Priority-Class');
      const shedLevel = admissionResponse.headers.get('X-Shed-Level');
      console.log(`   Priority Class: ${priorityClass}`);
      console.log(`   Shed Level: ${shedLevel}`);
    } else {
      console.log('❌ Admission control test failed');
    }
    
    console.log('\n🎉 Load shedding validation completed!');
    
  } catch (error) {
    console.error('❌ Load shedding validation failed:', error.message);
    console.log('\n💡 Make sure the development server is running: npm run dev');
  }
}

validateLoadShedding();
