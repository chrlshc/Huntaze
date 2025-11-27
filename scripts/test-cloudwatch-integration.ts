#!/usr/bin/env tsx
/**
 * Test CloudWatch Integration
 * Sends test metrics to verify the setup
 */

import { getCloudWatchMonitoring } from '../lib/aws/cloudwatch';

async function testCloudWatchIntegration() {
  console.log('Testing CloudWatch integration...\n');

  const monitoring = getCloudWatchMonitoring();
  
  // Initialize CloudWatch (creates log group and stream)
  await monitoring.initialize();

  // Test 1: Send a test metric
  console.log('1. Sending test metric...');
  await monitoring.putMetric({
    namespace: 'Huntaze/Performance',
    metricName: 'TestMetric',
    value: 123,
    unit: 'Count',
    dimensions: {
      Environment: 'Test',
      Source: 'IntegrationTest',
    },
  });
  console.log('✓ Test metric sent');

  // Test 2: Send Web Vitals metrics
  console.log('\n2. Sending Web Vitals metrics...');
  const webVitalsMetrics = [
    { name: 'LCP', value: 1500 },
    { name: 'FID', value: 50 },
    { name: 'CLS', value: 0.05 },
    { name: 'TTFB', value: 200 },
    { name: 'FCP', value: 800 },
  ];

  for (const metric of webVitalsMetrics) {
    await monitoring.putMetric({
      namespace: 'Huntaze/Performance',
      metricName: metric.name,
      value: metric.value,
      unit: 'Milliseconds',
      dimensions: {
        Page: '/test',
        Environment: 'Test',
      },
    });
  }
  console.log('✓ Web Vitals metrics sent');

  // Test 3: Log an event
  console.log('\n3. Logging test event...');
  await monitoring.logEvent({
    level: 'INFO',
    message: 'CloudWatch integration test completed',
    context: {
      testId: Date.now(),
      status: 'success',
    },
  });
  console.log('✓ Event logged');

  console.log('\n✅ CloudWatch integration test completed successfully!');
  console.log('\nCheck your CloudWatch dashboard:');
  console.log(`https://console.aws.amazon.com/cloudwatch/home?region=${process.env.AWS_REGION || 'us-east-1'}#dashboards:name=Huntaze-Performance-Dashboard`);
  console.log('\nNote: Metrics may take 1-2 minutes to appear in CloudWatch.');
}

testCloudWatchIntegration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
