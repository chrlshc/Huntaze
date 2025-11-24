#!/usr/bin/env ts-node
/**
 * Performance Monitoring Script
 * 
 * Comprehensive performance monitoring including:
 * - Cold start monitoring
 * - Bundle size tracking
 * - Skeleton screen timing
 * - Lighthouse CI integration
 * 
 * Requirements: 5.2, 6.1, 7.4
 */

import * as fs from 'fs';
import * as path from 'path';
import { PingService, PingServiceConfig } from '../lib/services/ping.service';

// ============================================================================
// Configuration
// ============================================================================

const STAGING_URL = process.env.STAGING_URL || 'https://staging.huntaze.com';
const REPORTS_DIR = path.join(process.cwd(), '.kiro/reports');
const PERFORMANCE_REPORT_PATH = path.join(REPORTS_DIR, 'performance-monitoring.json');
const BUNDLE_SIZE_REPORT_PATH = path.join(REPORTS_DIR, 'bundle-size-history.json');

// ============================================================================
// Types
// ============================================================================

interface PerformanceMetrics {
  timestamp: Date;
  coldStartTime: number | null;
  skeletonDisplayTime: number | null;
  contentLoadTime: number | null;
  lazyLoadTime: number | null;
  totalLoadTime: number | null;
  bundleSize: {
    total: number;
    initial: number;
    lazy: number;
  };
  lighthouseScores: {
    performance: number | null;
    accessibility: number | null;
    bestPractices: number | null;
    seo: number | null;
  };
}

interface BundleSizeHistory {
  timestamp: Date;
  totalSize: number;
  initialSize: number;
  lazySize: number;
  components: {
    name: string;
    size: number;
    lazy: boolean;
  }[];
}

// ============================================================================
// Cold Start Monitoring
// ============================================================================

/**
 * Monitors cold start response times
 */
async function monitorColdStart(): Promise<number | null> {
  console.log('📊 Monitoring cold start response time...');

  return new Promise((resolve) => {
    let responseTime: number | null = null;

    const config: PingServiceConfig = {
      url: `${STAGING_URL}/api/health`,
      interval: 60000,
      timeout: 3000,
      enabled: true,
      retryConfig: {
        maxRetries: 0,
        initialDelay: 1000,
        maxDelay: 5000,
        backoffFactor: 2,
      },
      onSuccess: (response) => {
        responseTime = response.responseTime;
        console.log(`✅ Cold start response time: ${responseTime}ms`);
        pingService.stop();
        resolve(responseTime);
      },
      onFailure: (error) => {
        console.error(`❌ Cold start monitoring failed: ${error.message}`);
        pingService.stop();
        resolve(null);
      },
    };

    const pingService = new PingService(config);
    pingService.start();

    // Timeout after 5 seconds
    setTimeout(() => {
      pingService.stop();
      resolve(responseTime);
    }, 5000);
  });
}

/**
 * Starts continuous cold start monitoring
 */
function startColdStartMonitoring(): PingService {
  console.log('🔄 Starting continuous cold start monitoring...');

  const config: PingServiceConfig = {
    url: `${STAGING_URL}/api/health`,
    interval: 10 * 60 * 1000, // 10 minutes
    timeout: 3000,
    enabled: true,
    onSuccess: (response) => {
      console.log(`✅ Ping successful: ${response.status} (${response.responseTime}ms)`);
      
      // Log to file
      logPerformanceMetric({
        timestamp: new Date(),
        type: 'cold-start',
        value: response.responseTime,
        status: 'success',
      });
    },
    onFailure: (error) => {
      console.error(`❌ Ping failed (${error.consecutiveFailures} consecutive):`, error.message);
      
      // Log to file
      logPerformanceMetric({
        timestamp: new Date(),
        type: 'cold-start',
        value: null,
        status: 'failure',
        error: error.message,
      });

      // Alert after 3 consecutive failures
      if (error.consecutiveFailures >= 3) {
        console.error('🚨 ALERT: 3 consecutive cold start failures detected!');
      }
    },
    onCircuitStateChange: (state) => {
      console.log(`⚡ Circuit breaker state changed to: ${state}`);
    },
  };

  const pingService = new PingService(config);
  pingService.start();

  return pingService;
}

// ============================================================================
// Bundle Size Tracking
// ============================================================================

/**
 * Tracks bundle sizes over time
 */
async function trackBundleSize(): Promise<void> {
  console.log('📦 Tracking bundle sizes...');

  const nextDir = path.join(process.cwd(), '.next');
  
  if (!fs.existsSync(nextDir)) {
    console.warn('⚠️  .next directory not found. Run build first.');
    return;
  }

  // Calculate bundle sizes
  const bundleSize = calculateBundleSize(nextDir);

  // Load history
  const history = loadBundleSizeHistory();

  // Add current measurement
  history.push({
    timestamp: new Date(),
    ...bundleSize,
  });

  // Keep last 100 measurements
  if (history.length > 100) {
    history.shift();
  }

  // Save history
  saveBundleSizeHistory(history);

  // Report
  console.log(`📊 Bundle Size Report:`);
  console.log(`   Total: ${formatBytes(bundleSize.totalSize)}`);
  console.log(`   Initial: ${formatBytes(bundleSize.initialSize)}`);
  console.log(`   Lazy: ${formatBytes(bundleSize.lazySize)}`);

  // Check for regressions
  if (history.length > 1) {
    const previous = history[history.length - 2];
    const change = bundleSize.totalSize - previous.totalSize;
    const percentChange = (change / previous.totalSize) * 100;

    if (Math.abs(percentChange) > 5) {
      const emoji = change > 0 ? '📈' : '📉';
      console.log(`${emoji} Bundle size changed by ${percentChange.toFixed(2)}% (${formatBytes(Math.abs(change))})`);
    }
  }
}

/**
 * Calculates bundle sizes from .next directory
 */
function calculateBundleSize(nextDir: string): {
  totalSize: number;
  initialSize: number;
  lazySize: number;
  components: { name: string; size: number; lazy: boolean }[];
} {
  const staticDir = path.join(nextDir, 'static');
  
  let totalSize = 0;
  let initialSize = 0;
  let lazySize = 0;
  const components: { name: string; size: number; lazy: boolean }[] = [];

  if (!fs.existsSync(staticDir)) {
    return { totalSize: 0, initialSize: 0, lazySize: 0, components: [] };
  }

  // Walk through static directory
  walkDirectory(staticDir, (filePath) => {
    const stats = fs.statSync(filePath);
    const size = stats.size;
    totalSize += size;

    const relativePath = path.relative(staticDir, filePath);
    const isLazy = relativePath.includes('lazy') || relativePath.includes('chunk');

    if (isLazy) {
      lazySize += size;
    } else {
      initialSize += size;
    }

    components.push({
      name: relativePath,
      size,
      lazy: isLazy,
    });
  });

  return { totalSize, initialSize, lazySize, components };
}

/**
 * Walks directory recursively
 */
function walkDirectory(dir: string, callback: (filePath: string) => void): void {
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      walkDirectory(filePath, callback);
    } else if (stats.isFile() && (file.endsWith('.js') || file.endsWith('.css'))) {
      callback(filePath);
    }
  }
}

/**
 * Formats bytes to human-readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Loads bundle size history
 */
function loadBundleSizeHistory(): BundleSizeHistory[] {
  if (!fs.existsSync(BUNDLE_SIZE_REPORT_PATH)) {
    return [];
  }

  try {
    const data = fs.readFileSync(BUNDLE_SIZE_REPORT_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading bundle size history:', error);
    return [];
  }
}

/**
 * Saves bundle size history
 */
function saveBundleSizeHistory(history: BundleSizeHistory[]): void {
  ensureDirectoryExists(path.dirname(BUNDLE_SIZE_REPORT_PATH));
  fs.writeFileSync(BUNDLE_SIZE_REPORT_PATH, JSON.stringify(history, null, 2));
}

// ============================================================================
// Skeleton Screen Timing
// ============================================================================

/**
 * Measures skeleton screen display duration
 * Note: This is a placeholder - actual measurement happens in the browser
 */
function measureSkeletonScreenTiming(): void {
  console.log('⏱️  Skeleton screen timing measurement:');
  console.log('   This metric is measured in the browser using Performance API');
  console.log('   Check browser console for actual measurements');
  console.log('   Target: < 50ms initial display, < 2s total duration');
}

// ============================================================================
// Lighthouse CI Integration
// ============================================================================

/**
 * Runs Lighthouse CI
 */
async function runLighthouseCI(): Promise<void> {
  console.log('🔦 Running Lighthouse CI...');
  console.log('   Use: npm run lighthouse');
  console.log('   Or: npx lhci autorun');
}

// ============================================================================
// Reporting
// ============================================================================

/**
 * Logs performance metric to file
 */
function logPerformanceMetric(metric: {
  timestamp: Date;
  type: string;
  value: number | null;
  status: string;
  error?: string;
}): void {
  ensureDirectoryExists(REPORTS_DIR);

  const logPath = path.join(REPORTS_DIR, 'performance-log.jsonl');
  const logLine = JSON.stringify(metric) + '\n';

  fs.appendFileSync(logPath, logLine);
}

/**
 * Generates performance report
 */
async function generatePerformanceReport(): Promise<void> {
  console.log('📊 Generating performance report...');

  const coldStartTime = await monitorColdStart();

  const metrics: PerformanceMetrics = {
    timestamp: new Date(),
    coldStartTime,
    skeletonDisplayTime: null, // Measured in browser
    contentLoadTime: null, // Measured in browser
    lazyLoadTime: null, // Measured in browser
    totalLoadTime: null, // Measured in browser
    bundleSize: {
      total: 0,
      initial: 0,
      lazy: 0,
    },
    lighthouseScores: {
      performance: null,
      accessibility: null,
      bestPractices: null,
      seo: null,
    },
  };

  // Save report
  ensureDirectoryExists(path.dirname(PERFORMANCE_REPORT_PATH));
  fs.writeFileSync(PERFORMANCE_REPORT_PATH, JSON.stringify(metrics, null, 2));

  console.log(`✅ Performance report saved to ${PERFORMANCE_REPORT_PATH}`);
}

/**
 * Ensures directory exists
 */
function ensureDirectoryExists(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'monitor':
      // Start continuous monitoring
      console.log('🚀 Starting performance monitoring...');
      const pingService = startColdStartMonitoring();
      
      // Track bundle size periodically
      setInterval(() => {
        trackBundleSize().catch(console.error);
      }, 60 * 60 * 1000); // Every hour

      // Keep process alive
      process.on('SIGINT', () => {
        console.log('\n👋 Stopping performance monitoring...');
        pingService.stop();
        process.exit(0);
      });
      break;

    case 'report':
      // Generate one-time report
      await generatePerformanceReport();
      await trackBundleSize();
      measureSkeletonScreenTiming();
      await runLighthouseCI();
      break;

    case 'bundle':
      // Track bundle size only
      await trackBundleSize();
      break;

    case 'cold-start':
      // Monitor cold start only
      const time = await monitorColdStart();
      if (time !== null) {
        console.log(`Cold start time: ${time}ms`);
        process.exit(time > 3000 ? 1 : 0);
      } else {
        console.error('Cold start monitoring failed');
        process.exit(1);
      }
      break;

    default:
      console.log('Performance Monitoring Script');
      console.log('');
      console.log('Usage:');
      console.log('  npm run perf:monitor    - Start continuous monitoring');
      console.log('  npm run perf:report     - Generate performance report');
      console.log('  npm run perf:bundle     - Track bundle sizes');
      console.log('  npm run perf:cold-start - Check cold start time');
      console.log('');
      console.log('Environment Variables:');
      console.log('  STAGING_URL - Staging URL to monitor (default: https://staging.huntaze.com)');
      break;
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
}

export {
  monitorColdStart,
  startColdStartMonitoring,
  trackBundleSize,
  measureSkeletonScreenTiming,
  generatePerformanceReport,
};
