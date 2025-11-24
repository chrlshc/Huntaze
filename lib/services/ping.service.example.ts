/**
 * Cold Start Prevention Service Examples
 * 
 * Demonstrates various usage patterns for the PingService
 */

import { PingService, createStagingPingService } from './ping.service';

// ============================================================================
// Example 1: Quick Setup for Staging
// ============================================================================

export function example1_QuickSetup() {
  console.log('=== Example 1: Quick Setup for Staging ===\n');

  // Simplest way to set up cold start prevention
  const service = createStagingPingService('https://staging.example.com');
  service.start();

  console.log('Service started with default configuration:');
  console.log('- Interval: 10 minutes');
  console.log('- Timeout: 3 seconds');
  console.log('- Method: HEAD');
  console.log('- Callbacks: Configured for logging\n');

  // Stop after demonstration
  setTimeout(() => {
    service.stop();
    console.log('Service stopped\n');
  }, 1000);
}

// ============================================================================
// Example 2: Custom Configuration
// ============================================================================

export function example2_CustomConfiguration() {
  console.log('=== Example 2: Custom Configuration ===\n');

  const service = new PingService({
    url: 'https://staging.example.com',
    interval: 5 * 60 * 1000, // 5 minutes instead of 10
    method: 'GET', // Use GET instead of HEAD
    timeout: 5000, // 5 seconds instead of 3
    enabled: true,
    onSuccess: (response) => {
      console.log(`✓ Ping successful: ${response.status} (${response.responseTime}ms)`);
    },
    onFailure: (error) => {
      console.error(`✗ Ping failed: ${error.error.message}`);
    },
  });

  service.start();
  console.log('Custom service started\n');

  setTimeout(() => service.stop(), 1000);
}

// ============================================================================
// Example 3: Monitoring and Alerting
// ============================================================================

export function example3_MonitoringAndAlerting() {
  console.log('=== Example 3: Monitoring and Alerting ===\n');

  const service = new PingService({
    url: 'https://staging.example.com',
    interval: 600000,
    timeout: 3000,
    enabled: true,
    onSuccess: (response) => {
      // Track metrics
      console.log(`Response time: ${response.responseTime}ms`);
      
      // Alert on slow responses
      if (response.responseTime > 2000) {
        console.warn('⚠️  Slow response detected!');
        // sendAlert('staging-slow-response', { responseTime: response.responseTime });
      }
    },
    onFailure: (error) => {
      console.error(`Ping failed: ${error.error.message}`);
      console.error(`Consecutive failures: ${error.consecutiveFailures}`);
      
      // Alert after 3 consecutive failures
      if (error.consecutiveFailures >= 3) {
        console.error('🚨 ALERT: Staging server is not responding!');
        // sendCriticalAlert('staging-down', { consecutiveFailures: error.consecutiveFailures });
      }
    },
  });

  service.start();
  console.log('Monitoring service started\n');

  setTimeout(() => service.stop(), 1000);
}

// ============================================================================
// Example 4: Statistics Tracking
// ============================================================================

export function example4_StatisticsTracking() {
  console.log('=== Example 4: Statistics Tracking ===\n');

  const service = createStagingPingService('https://staging.example.com');
  service.start();

  // Check statistics periodically
  const statsInterval = setInterval(() => {
    const stats = service.getStats();
    
    console.log('Service Statistics:');
    console.log(`- Total pings: ${stats.totalPings}`);
    console.log(`- Successful: ${stats.successfulPings}`);
    console.log(`- Failed: ${stats.failedPings}`);
    console.log(`- Success rate: ${((stats.successfulPings / stats.totalPings) * 100).toFixed(2)}%`);
    console.log(`- Average response time: ${stats.averageResponseTime.toFixed(2)}ms`);
    console.log(`- Consecutive failures: ${stats.consecutiveFailures}`);
    console.log(`- Last ping: ${stats.lastPingTime?.toISOString() || 'Never'}\n`);
  }, 30000); // Every 30 seconds

  // Cleanup
  setTimeout(() => {
    clearInterval(statsInterval);
    service.stop();
    console.log('Statistics tracking stopped\n');
  }, 2000);
}

// ============================================================================
// Example 5: Dynamic Configuration Updates
// ============================================================================

export function example5_DynamicConfigurationUpdates() {
  console.log('=== Example 5: Dynamic Configuration Updates ===\n');

  const service = createStagingPingService('https://staging.example.com');
  service.start();

  console.log('Initial configuration:');
  let config = service.getConfig();
  console.log(`- Interval: ${config.interval}ms`);
  console.log(`- Timeout: ${config.timeout}ms\n`);

  // Update configuration after 1 second
  setTimeout(() => {
    console.log('Updating configuration...');
    service.updateConfig({
      interval: 5 * 60 * 1000, // Change to 5 minutes
      timeout: 5000, // Change to 5 seconds
    });

    config = service.getConfig();
    console.log('New configuration:');
    console.log(`- Interval: ${config.interval}ms`);
    console.log(`- Timeout: ${config.timeout}ms\n`);
  }, 1000);

  setTimeout(() => service.stop(), 2000);
}

// ============================================================================
// Example 6: Environment-Based Configuration
// ============================================================================

export function example6_EnvironmentBasedConfiguration() {
  console.log('=== Example 6: Environment-Based Configuration ===\n');

  // Only enable in staging/production
  const isProduction = process.env.NODE_ENV === 'production';
  const stagingUrl = process.env.STAGING_URL || 'https://staging.example.com';

  if (isProduction && stagingUrl) {
    const service = new PingService({
      url: stagingUrl,
      interval: parseInt(process.env.PING_INTERVAL || '600000'),
      timeout: parseInt(process.env.PING_TIMEOUT || '3000'),
      method: 'HEAD',
      enabled: true,
      onSuccess: (response) => {
        console.log(`Staging ping: ${response.status} (${response.responseTime}ms)`);
      },
      onFailure: (error) => {
        console.error(`Staging ping failed: ${error.error.message}`);
      },
    });

    service.start();
    console.log(`Cold start prevention enabled for ${stagingUrl}\n`);

    // Cleanup for example
    setTimeout(() => service.stop(), 1000);
  } else {
    console.log('Cold start prevention disabled (not in production)\n');
  }
}

// ============================================================================
// Example 7: Error Handling
// ============================================================================

export function example7_ErrorHandling() {
  console.log('=== Example 7: Error Handling ===\n');

  // Example 1: Invalid URL
  try {
    new PingService({
      url: 'not-a-valid-url',
      interval: 600000,
      timeout: 3000,
      enabled: true,
    });
  } catch (error) {
    console.error('✗ Configuration error:', (error as Error).message);
  }

  // Example 2: Timeout exceeds interval
  try {
    new PingService({
      url: 'https://staging.example.com',
      interval: 1000,
      timeout: 2000,
      enabled: true,
    });
  } catch (error) {
    console.error('✗ Configuration error:', (error as Error).message);
  }

  // Example 3: Valid configuration
  try {
    const service = new PingService({
      url: 'https://staging.example.com',
      interval: 600000,
      timeout: 3000,
      enabled: true,
    });
    console.log('✓ Service created successfully');
    service.stop();
  } catch (error) {
    console.error('✗ Unexpected error:', (error as Error).message);
  }

  console.log();
}

// ============================================================================
// Example 8: Multiple Environments
// ============================================================================

export function example8_MultipleEnvironments() {
  console.log('=== Example 8: Multiple Environments ===\n');

  const environments = [
    { name: 'Staging', url: 'https://staging.example.com' },
    { name: 'Preview', url: 'https://preview.example.com' },
    { name: 'Demo', url: 'https://demo.example.com' },
  ];

  const services = environments.map(env => {
    const service = new PingService({
      url: env.url,
      interval: 600000,
      timeout: 3000,
      enabled: true,
      onSuccess: (response) => {
        console.log(`${env.name}: ✓ ${response.status} (${response.responseTime}ms)`);
      },
      onFailure: (error) => {
        console.error(`${env.name}: ✗ ${error.error.message}`);
      },
    });

    service.start();
    console.log(`Started ping service for ${env.name}`);
    return service;
  });

  console.log('\nAll services started\n');

  // Cleanup
  setTimeout(() => {
    services.forEach(service => service.stop());
    console.log('All services stopped\n');
  }, 1000);
}

// ============================================================================
// Example 9: Graceful Shutdown
// ============================================================================

export function example9_GracefulShutdown() {
  console.log('=== Example 9: Graceful Shutdown ===\n');

  const service = createStagingPingService('https://staging.example.com');
  service.start();

  console.log('Service started');

  // Handle process termination
  const shutdown = () => {
    console.log('\nShutting down gracefully...');
    
    // Get final statistics
    const stats = service.getStats();
    console.log('Final statistics:');
    console.log(`- Total pings: ${stats.totalPings}`);
    console.log(`- Success rate: ${((stats.successfulPings / stats.totalPings) * 100).toFixed(2)}%`);
    
    // Stop service
    service.stop();
    console.log('Service stopped\n');
  };

  // Simulate shutdown after 1 second
  setTimeout(shutdown, 1000);
}

// ============================================================================
// Example 10: Health Check Dashboard
// ============================================================================

export function example10_HealthCheckDashboard() {
  console.log('=== Example 10: Health Check Dashboard ===\n');

  const service = createStagingPingService('https://staging.example.com');
  service.start();

  // Display dashboard every 10 seconds
  const dashboardInterval = setInterval(() => {
    const stats = service.getStats();
    const config = service.getConfig();
    
    console.clear();
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║         Cold Start Prevention Dashboard               ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log(`║ URL: ${config.url.padEnd(47)}║`);
    console.log(`║ Status: ${(service.isRunning() ? '🟢 Running' : '🔴 Stopped').padEnd(45)}║`);
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log(`║ Total Pings: ${stats.totalPings.toString().padEnd(42)}║`);
    console.log(`║ Successful: ${stats.successfulPings.toString().padEnd(43)}║`);
    console.log(`║ Failed: ${stats.failedPings.toString().padEnd(47)}║`);
    console.log(`║ Success Rate: ${((stats.successfulPings / stats.totalPings) * 100).toFixed(2)}%`.padEnd(54) + '║');
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log(`║ Avg Response Time: ${stats.averageResponseTime.toFixed(2)}ms`.padEnd(54) + '║');
    console.log(`║ Consecutive Failures: ${stats.consecutiveFailures.toString().padEnd(33)}║`);
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log(`║ Last Ping: ${(stats.lastPingTime?.toLocaleTimeString() || 'Never').padEnd(44)}║`);
    console.log(`║ Last Success: ${(stats.lastSuccessTime?.toLocaleTimeString() || 'Never').padEnd(41)}║`);
    console.log(`║ Last Failure: ${(stats.lastFailureTime?.toLocaleTimeString() || 'Never').padEnd(41)}║`);
    console.log('╚════════════════════════════════════════════════════════╝\n');
  }, 10000);

  // Cleanup
  setTimeout(() => {
    clearInterval(dashboardInterval);
    service.stop();
    console.log('Dashboard stopped\n');
  }, 2000);
}

// ============================================================================
// Run Examples
// ============================================================================

if (require.main === module) {
  console.log('Cold Start Prevention Service Examples\n');
  console.log('========================================\n');

  // Run examples sequentially
  (async () => {
    example1_QuickSetup();
    await new Promise(resolve => setTimeout(resolve, 2000));

    example2_CustomConfiguration();
    await new Promise(resolve => setTimeout(resolve, 2000));

    example3_MonitoringAndAlerting();
    await new Promise(resolve => setTimeout(resolve, 2000));

    example4_StatisticsTracking();
    await new Promise(resolve => setTimeout(resolve, 3000));

    example5_DynamicConfigurationUpdates();
    await new Promise(resolve => setTimeout(resolve, 3000));

    example6_EnvironmentBasedConfiguration();
    await new Promise(resolve => setTimeout(resolve, 2000));

    example7_ErrorHandling();
    await new Promise(resolve => setTimeout(resolve, 2000));

    example8_MultipleEnvironments();
    await new Promise(resolve => setTimeout(resolve, 2000));

    example9_GracefulShutdown();
    await new Promise(resolve => setTimeout(resolve, 2000));

    example10_HealthCheckDashboard();
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('All examples completed!');
  })();
}
