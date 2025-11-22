#!/usr/bin/env ts-node
/**
 * CloudWatch Testing Script
 * 
 * Tests CloudWatch monitoring functionality:
 * - Log error messages
 * - Send custom metrics
 * - Verify alarm triggers
 * - Test cache hit ratio tracking
 */

import {
  cloudWatchService,
  logError,
  logWarning,
  recordAPILatency,
  recordErrorRate,
  recordCacheHitRatio,
  recordDatabaseQueryTime,
  recordCoreWebVitals,
} from '../lib/monitoring/cloudwatch.service';

async function testCloudWatch() {
  console.log('🧪 Testing CloudWatch monitoring...\n');

  try {
    // Initialize
    console.log('1️⃣  Initializing CloudWatch...');
    await cloudWatchService.initialize();
    console.log('✅ Initialized\n');

    // Test error logging
    console.log('2️⃣  Testing error logging...');
    await logError(
      'Test error message',
      new Error('This is a test error'),
      {
        testId: 'cloudwatch-test-1',
        userId: 'test-user-123',
        route: '/api/test',
      }
    );
    console.log('✅ Error logged\n');

    // Test warning logging
    console.log('3️⃣  Testing warning logging...');
    await logWarning('Test warning message', {
      testId: 'cloudwatch-test-2',
      severity: 'low',
    });
    console.log('✅ Warning logged\n');

    // Test API latency metrics
    console.log('4️⃣  Testing API latency metrics...');
    await recordAPILatency('/api/home/stats', 'GET', 150);
    await recordAPILatency('/api/integrations/status', 'GET', 250);
    await recordAPILatency('/api/auth/login', 'POST', 450);
    console.log('✅ API latency metrics recorded\n');

    // Test error rate metrics
    console.log('5️⃣  Testing error rate metrics...');
    await recordErrorRate(5, 100); // 5% error rate
    console.log('✅ Error rate metric recorded (5%)\n');

    // Test cache hit ratio metrics
    console.log('6️⃣  Testing cache hit ratio metrics...');
    await recordCacheHitRatio(85, 100); // 85% hit ratio
    console.log('✅ Cache hit ratio metric recorded (85%)\n');

    // Test database query time metrics
    console.log('7️⃣  Testing database query time metrics...');
    await recordDatabaseQueryTime('SELECT', 45);
    await recordDatabaseQueryTime('INSERT', 120);
    await recordDatabaseQueryTime('UPDATE', 80);
    console.log('✅ Database query time metrics recorded\n');

    // Test Core Web Vitals metrics
    console.log('8️⃣  Testing Core Web Vitals metrics...');
    await recordCoreWebVitals(
      1200, // FCP: 1.2s
      2100, // LCP: 2.1s
      80,   // FID: 80ms
      0.05  // CLS: 0.05
    );
    console.log('✅ Core Web Vitals metrics recorded\n');

    // Test high error rate (should trigger alarm)
    console.log('9️⃣  Testing alarm trigger (high error rate)...');
    await recordErrorRate(6, 100); // 6% error rate (above 5% threshold)
    console.log('✅ High error rate metric sent (should trigger alarm)\n');

    // Test high latency (should trigger alarm)
    console.log('🔟 Testing alarm trigger (high latency)...');
    await recordAPILatency('/api/slow-endpoint', 'GET', 2500); // 2.5s (above 2s threshold)
    console.log('✅ High latency metric sent (should trigger alarm)\n');

    // Test low cache hit ratio (should trigger alarm)
    console.log('1️⃣1️⃣  Testing alarm trigger (low cache hit ratio)...');
    await recordCacheHitRatio(75, 100); // 75% (below 80% threshold)
    console.log('✅ Low cache hit ratio metric sent (should trigger alarm)\n');

    // Get alarm status
    console.log('1️⃣2️⃣  Checking alarm status...');
    const alarms = await cloudWatchService.getAlarmStatus();
    console.log(`✅ Found ${alarms.length} alarms:`);
    alarms.forEach(alarm => {
      const emoji = alarm.StateValue === 'ALARM' ? '🚨' : 
                    alarm.StateValue === 'OK' ? '✅' : '⚠️';
      console.log(`   ${emoji} ${alarm.AlarmName}: ${alarm.StateValue}`);
    });
    console.log('');

    console.log('✅ All tests completed successfully!\n');
    console.log('📊 View metrics in CloudWatch:');
    console.log(`   https://console.aws.amazon.com/cloudwatch/home?region=${process.env.AWS_REGION || 'us-east-1'}#dashboards:name=huntaze-beta-${process.env.NODE_ENV || 'development'}\n`);
    console.log('⏰ Note: Alarms may take 5-10 minutes to trigger after metrics are sent.\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testCloudWatch();
