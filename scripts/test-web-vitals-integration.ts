/**
 * Test Web Vitals CloudWatch Integration
 * 
 * Validates that Web Vitals are properly sent to CloudWatch
 * and that alarms are configured correctly
 * 
 * Requirements: 2.2, 9.1, 9.4
 */

import { CloudWatchClient, GetMetricStatisticsCommand, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';

const cloudWatch = new CloudWatchClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const WEB_VITALS_METRICS = ['LCP', 'FID', 'CLS', 'FCP', 'TTFB'];

async function testMetricCollection() {
  console.log('🧪 Testing Web Vitals metric collection...\n');
  
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
  
  for (const metricName of WEB_VITALS_METRICS) {
    try {
      const response = await cloudWatch.send(
        new GetMetricStatisticsCommand({
          Namespace: 'Huntaze/WebVitals',
          MetricName: metricName,
          StartTime: startTime,
          EndTime: endTime,
          Period: 3600, // 1 hour
          Statistics: ['Average', 'Maximum', 'Minimum', 'SampleCount'],
        })
      );
      
      const datapoints = response.Datapoints || [];
      
      if (datapoints.length > 0) {
        const latest = datapoints.sort((a, b) => 
          (b.Timestamp?.getTime() || 0) - (a.Timestamp?.getTime() || 0)
        )[0];
        
        console.log(`✅ ${metricName}:`);
        console.log(`   Average: ${latest.Average?.toFixed(2)}`);
        console.log(`   Max: ${latest.Maximum?.toFixed(2)}`);
        console.log(`   Min: ${latest.Minimum?.toFixed(2)}`);
        console.log(`   Sample Count: ${latest.SampleCount}`);
        console.log(`   Last Updated: ${latest.Timestamp?.toISOString()}\n`);
      } else {
        console.log(`⚠️  ${metricName}: No data points found in last 24 hours\n`);
      }
    } catch (error) {
      console.error(`❌ ${metricName}: Failed to fetch metrics`, error);
    }
  }
}

async function testAlarmConfiguration() {
  console.log('🧪 Testing Web Vitals alarm configuration...\n');
  
  try {
    const response = await cloudWatch.send(
      new DescribeAlarmsCommand({
        AlarmNamePrefix: 'Huntaze-WebVitals-',
      })
    );
    
    const alarms = response.MetricAlarms || [];
    
    if (alarms.length === 0) {
      console.log('⚠️  No Web Vitals alarms found');
      console.log('   Run: npm run setup:web-vitals-alarms\n');
      return;
    }
    
    console.log(`Found ${alarms.length} Web Vitals alarms:\n`);
    
    for (const alarm of alarms) {
      const status = alarm.StateValue;
      const statusIcon = status === 'OK' ? '✅' : status === 'ALARM' ? '🚨' : '⚠️';
      
      console.log(`${statusIcon} ${alarm.AlarmName}`);
      console.log(`   State: ${status}`);
      console.log(`   Metric: ${alarm.MetricName}`);
      console.log(`   Threshold: ${alarm.Threshold}`);
      console.log(`   Description: ${alarm.AlarmDescription}`);
      
      if (status === 'ALARM') {
        console.log(`   ⚠️  ALARM TRIGGERED - Check CloudWatch for details`);
      }
      
      console.log();
    }
  } catch (error) {
    console.error('❌ Failed to fetch alarms:', error);
  }
}

async function testAPIEndpoint() {
  console.log('🧪 Testing Web Vitals API endpoint...\n');
  
  const testMetric = {
    namespace: 'Huntaze/WebVitals',
    metricName: 'LCP',
    value: 1500,
    unit: 'Milliseconds',
    dimensions: {
      Page: '/test',
      Connection: '4g',
      UserAgent: 'Desktop',
    },
    timestamp: new Date().toISOString(),
  };
  
  try {
    const response = await fetch('http://localhost:3000/api/metrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMetric),
    });
    
    if (response.ok) {
      console.log('✅ API endpoint is working');
      const data = await response.json();
      console.log('   Response:', data);
    } else {
      console.log('❌ API endpoint returned error:', response.status);
      const error = await response.text();
      console.log('   Error:', error);
    }
  } catch (error) {
    console.log('⚠️  Could not reach API endpoint (is the server running?)');
    console.log('   Error:', error);
  }
  
  console.log();
}

async function testAlertEndpoint() {
  console.log('🧪 Testing Web Vitals alert endpoint...\n');
  
  const testAlert = {
    metricName: 'LCP',
    value: 3000,
    threshold: 2500,
    severity: 'warning',
    context: {
      url: 'http://localhost:3000/test',
      userAgent: 'Test Agent',
      connection: '4g',
      timestamp: Date.now(),
    },
  };
  
  try {
    const response = await fetch('http://localhost:3000/api/metrics/alert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testAlert),
    });
    
    if (response.ok) {
      console.log('✅ Alert endpoint is working');
      const data = await response.json();
      console.log('   Response:', data);
    } else {
      console.log('❌ Alert endpoint returned error:', response.status);
      const error = await response.text();
      console.log('   Error:', error);
    }
  } catch (error) {
    console.log('⚠️  Could not reach alert endpoint (is the server running?)');
    console.log('   Error:', error);
  }
  
  console.log();
}

async function main() {
  console.log('🚀 Web Vitals CloudWatch Integration Test\n');
  console.log('='.repeat(50));
  console.log();
  
  // Test metric collection
  await testMetricCollection();
  
  // Test alarm configuration
  await testAlarmConfiguration();
  
  // Test API endpoints (only if server is running)
  if (process.env.TEST_API === 'true') {
    await testAPIEndpoint();
    await testAlertEndpoint();
  } else {
    console.log('ℹ️  Skipping API endpoint tests (set TEST_API=true to enable)\n');
  }
  
  console.log('='.repeat(50));
  console.log('✅ Web Vitals integration test complete!\n');
  
  console.log('Next steps:');
  console.log('1. If no metrics found, deploy app and generate some traffic');
  console.log('2. If no alarms found, run: npm run setup:web-vitals-alarms');
  console.log('3. Monitor dashboard: https://console.aws.amazon.com/cloudwatch/');
  console.log('4. Subscribe to SNS topic for email alerts');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { main as testWebVitalsIntegration };
