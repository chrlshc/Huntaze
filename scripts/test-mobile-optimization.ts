/**
 * Mobile Optimization Integration Test
 * 
 * Tests the mobile optimization system including:
 * - Connection quality detection
 * - Adaptive image settings
 * - Layout shift tracking
 * - Touch responsiveness
 */

import { MobileOptimizer, ConnectionQuality } from '../lib/mobile/mobile-optimizer';

console.log('🧪 Testing Mobile Optimization System\n');

// Test 1: Connection Quality Detection
console.log('Test 1: Connection Quality Detection');
const optimizer = new MobileOptimizer({
  enableAdaptiveLoading: true,
  touchResponseThreshold: 100,
  clsThreshold: 0.1,
});

const connection = optimizer.detectConnectionQuality();
console.log('✓ Connection detected:', {
  type: connection.effectiveType,
  downlink: `${connection.downlink} Mbps`,
  rtt: `${connection.rtt}ms`,
  saveData: connection.saveData,
});

// Test 2: Image Quality Settings
console.log('\nTest 2: Image Quality Settings');
const imageSettings = optimizer.getImageQualitySettings();
console.log('✓ Image settings:', {
  quality: `${imageSettings.quality}%`,
  format: imageSettings.format,
  maxWidth: `${imageSettings.maxWidth}px`,
  lazy: imageSettings.lazy,
});

// Test 3: Content Deferral Decision
console.log('\nTest 3: Content Deferral Decision');
const shouldDefer = optimizer.shouldDeferNonEssentialContent();
console.log(`✓ Should defer non-essential content: ${shouldDefer}`);

// Test 4: Touch Interaction Tracking
console.log('\nTest 4: Touch Interaction Tracking');
const touchStart = performance.now();
setTimeout(() => {
  const metric = optimizer.trackTouchInteraction('tap', 'button', touchStart);
  console.log('✓ Touch interaction tracked:', {
    type: metric.type,
    target: metric.target,
    responseTime: `${metric.responseTime.toFixed(2)}ms`,
  });

  const avgTime = optimizer.getAverageTouchResponseTime();
  const isResponsive = optimizer.areTouchInteractionsResponsive();
  console.log('✓ Touch responsiveness:', {
    avgResponseTime: `${avgTime.toFixed(2)}ms`,
    isResponsive,
  });
}, 50);

// Test 5: Layout Shift Monitoring
setTimeout(() => {
  console.log('\nTest 5: Layout Shift Monitoring');
  const cls = optimizer.getCLS();
  const clsAcceptable = optimizer.isCLSAcceptable();
  console.log('✓ Layout shift metrics:', {
    cls: cls.toFixed(3),
    acceptable: clsAcceptable,
    threshold: 0.1,
  });
}, 100);

// Test 6: Performance Report
setTimeout(() => {
  console.log('\nTest 6: Performance Report');
  const report = optimizer.getReport();
  console.log('✓ Full report generated:');
  console.log('  Connection:', report.connectionQuality.effectiveType);
  console.log('  CLS:', report.cls.toFixed(3), report.clsAcceptable ? '✓' : '✗');
  console.log('  Touch:', `${report.avgTouchResponseTime.toFixed(0)}ms`, report.touchResponsive ? '✓' : '✗');
  console.log('  Image Quality:', `${report.imageSettings.quality}%`);
  
  if (report.recommendations.length > 0) {
    console.log('  Recommendations:');
    report.recommendations.forEach(rec => console.log(`    - ${rec}`));
  } else {
    console.log('  No recommendations - performance is optimal! ✓');
  }
}, 150);

// Test 7: Different Connection Scenarios
setTimeout(() => {
  console.log('\nTest 7: Testing Different Connection Scenarios');
  
  const scenarios: Array<{ type: ConnectionQuality['effectiveType']; downlink: number }> = [
    { type: '4g', downlink: 10 },
    { type: '3g', downlink: 1.5 },
    { type: '2g', downlink: 0.3 },
    { type: 'slow-2g', downlink: 0.05 },
  ];

  scenarios.forEach(scenario => {
    const testOptimizer = new MobileOptimizer();
    // Simulate connection by creating a mock
    const mockConnection: ConnectionQuality = {
      effectiveType: scenario.type,
      downlink: scenario.downlink,
      rtt: scenario.type === '4g' ? 50 : scenario.type === '3g' ? 200 : 500,
      saveData: false,
    };
    
    // Manually set connection for testing
    (testOptimizer as any).connectionQuality = mockConnection;
    
    const settings = testOptimizer.getImageQualitySettings();
    console.log(`  ${scenario.type.toUpperCase()}:`, {
      quality: `${settings.quality}%`,
      format: settings.format,
      maxWidth: `${settings.maxWidth}px`,
    });
  });
}, 200);

// Test 8: Cleanup
setTimeout(() => {
  console.log('\nTest 8: Cleanup');
  optimizer.destroy();
  console.log('✓ Optimizer destroyed successfully');
  
  console.log('\n✅ All mobile optimization tests completed!');
}, 250);
