#!/usr/bin/env node

/**
 * Alert Checker Worker
 * Periodically checks alert conditions and triggers notifications
 * 
 * Usage:
 *   node scripts/run-alert-checker.js
 * 
 * Environment Variables:
 *   ALERT_CHECK_INTERVAL - Check interval in seconds (default: 60)
 *   SLACK_WEBHOOK_URL - Slack webhook URL for notifications (optional)
 */

const CHECK_INTERVAL = parseInt(process.env.ALERT_CHECK_INTERVAL || '60', 10) * 1000;

console.log('🚨 Alert Checker Worker starting...');
console.log(`Check interval: ${CHECK_INTERVAL / 1000}s`);

async function checkAlerts() {
  try {
    const response = await fetch('http://localhost:3000/api/monitoring/alerts');
    
    if (!response.ok) {
      console.error('Failed to check alerts:', response.statusText);
      return;
    }

    const data = await response.json();
    
    if (data.activeCount > 0) {
      console.log(`⚠️  ${data.activeCount} active alert(s) detected`);
      
      for (const alert of data.alerts) {
        if (!alert.resolved) {
          console.log(`  - [${alert.severity.toUpperCase()}] ${alert.name}: ${alert.message}`);
        }
      }
    } else {
      console.log('✅ No active alerts');
    }
  } catch (error) {
    console.error('Error checking alerts:', error.message);
  }
}

// Initial check
checkAlerts();

// Schedule periodic checks
setInterval(checkAlerts, CHECK_INTERVAL);

console.log('✅ Alert Checker Worker running');
