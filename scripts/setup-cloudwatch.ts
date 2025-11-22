#!/usr/bin/env ts-node
/**
 * CloudWatch Setup Script
 * 
 * Initializes CloudWatch monitoring:
 * - Creates log groups and streams
 * - Sets up SNS topics
 * - Creates alarms
 * - Creates dashboard
 * - Tests notifications
 */

import { cloudWatchService } from '../lib/monitoring/cloudwatch.service';

async function setupCloudWatch() {
  console.log('🚀 Setting up CloudWatch monitoring...\n');

  try {
    // Initialize CloudWatch
    console.log('1️⃣  Initializing CloudWatch service...');
    await cloudWatchService.initialize();
    console.log('✅ CloudWatch service initialized\n');

    // Get alarm status
    console.log('2️⃣  Checking alarm status...');
    const alarms = await cloudWatchService.getAlarmStatus();
    console.log(`✅ Found ${alarms.length} alarms:`);
    alarms.forEach(alarm => {
      console.log(`   - ${alarm.AlarmName}: ${alarm.StateValue}`);
    });
    console.log('');

    // Test notification (optional)
    if (process.env.ALERT_EMAIL) {
      console.log('3️⃣  Sending test notification...');
      try {
        await cloudWatchService.sendTestNotification();
        console.log(`✅ Test notification sent to ${process.env.ALERT_EMAIL}`);
        console.log('   Check your email and confirm the subscription\n');
      } catch (error) {
        console.log('⚠️  Failed to send test notification (this is optional)');
        console.log(`   Error: ${error instanceof Error ? error.message : String(error)}\n`);
      }
    } else {
      console.log('3️⃣  Skipping test notification (ALERT_EMAIL not configured)\n');
    }

    console.log('✅ CloudWatch monitoring setup complete!\n');
    console.log('📊 Dashboard URL:');
    console.log(`   https://console.aws.amazon.com/cloudwatch/home?region=${process.env.AWS_REGION || 'us-east-1'}#dashboards:name=huntaze-beta-${process.env.NODE_ENV || 'development'}\n`);
    console.log('🔔 Alarms URL:');
    console.log(`   https://console.aws.amazon.com/cloudwatch/home?region=${process.env.AWS_REGION || 'us-east-1'}#alarmsV2:\n`);
    console.log('📝 Logs URL:');
    console.log(`   https://console.aws.amazon.com/cloudwatch/home?region=${process.env.AWS_REGION || 'us-east-1'}#logsV2:log-groups/log-group/$252Faws$252Fnextjs$252Fhuntaze-beta\n`);

  } catch (error) {
    console.error('❌ Failed to setup CloudWatch monitoring:', error);
    process.exit(1);
  }
}

// Run setup
setupCloudWatch();
