#!/usr/bin/env node

/**
 * Test Lambda@Edge Functions Locally
 * 
 * This script tests the Lambda@Edge functions locally before deployment
 * to ensure they work correctly.
 * 
 * Usage:
 *   node test-lambda-edge.js
 */

const securityHeaders = require('./security-headers');
const imageOptimization = require('./image-optimization');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function createMockEvent(type, options = {}) {
  if (type === 'viewer-response') {
    return {
      Records: [{
        cf: {
          response: {
            status: '200',
            statusDescription: 'OK',
            headers: options.headers || {},
          },
        },
      }],
    };
  }
  
  if (type === 'origin-request') {
    return {
      Records: [{
        cf: {
          request: {
            uri: options.uri || '/images/test.jpg',
            querystring: options.querystring || '',
            headers: options.headers || {},
          },
        },
      }],
    };
  }
}

async function testSecurityHeaders() {
  log('\n=================================', 'blue');
  log('Testing Security Headers Function', 'blue');
  log('=================================\n', 'blue');
  
  const event = createMockEvent('viewer-response');
  const result = await securityHeaders.handler(event);
  
  const headers = result.headers;
  const tests = [
    {
      name: 'Strict-Transport-Security',
      key: 'strict-transport-security',
      expected: 'max-age=31536000; includeSubDomains; preload',
    },
    {
      name: 'X-Content-Type-Options',
      key: 'x-content-type-options',
      expected: 'nosniff',
    },
    {
      name: 'X-Frame-Options',
      key: 'x-frame-options',
      expected: 'DENY',
    },
    {
      name: 'X-XSS-Protection',
      key: 'x-xss-protection',
      expected: '1; mode=block',
    },
    {
      name: 'Referrer-Policy',
      key: 'referrer-policy',
      expected: 'strict-origin-when-cross-origin',
    },
    {
      name: 'Content-Security-Policy',
      key: 'content-security-policy',
      contains: "default-src 'self'",
    },
    {
      name: 'Permissions-Policy',
      key: 'permissions-policy',
      contains: 'geolocation=()',
    },
    {
      name: 'Cross-Origin-Embedder-Policy',
      key: 'cross-origin-embedder-policy',
      expected: 'require-corp',
    },
    {
      name: 'Cross-Origin-Opener-Policy',
      key: 'cross-origin-opener-policy',
      expected: 'same-origin',
    },
    {
      name: 'Cross-Origin-Resource-Policy',
      key: 'cross-origin-resource-policy',
      expected: 'same-origin',
    },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const header = headers[test.key];
    
    if (!header || !header[0]) {
      log(`❌ ${test.name}: Missing`, 'red');
      failed++;
      continue;
    }
    
    const value = header[0].value;
    
    if (test.expected && value === test.expected) {
      log(`✅ ${test.name}: ${value}`, 'green');
      passed++;
    } else if (test.contains && value.includes(test.contains)) {
      log(`✅ ${test.name}: Contains "${test.contains}"`, 'green');
      passed++;
    } else {
      log(`❌ ${test.name}: Expected "${test.expected || test.contains}", got "${value}"`, 'red');
      failed++;
    }
  }
  
  log(`\nResults: ${passed} passed, ${failed} failed`, failed === 0 ? 'green' : 'red');
  return failed === 0;
}

async function testImageOptimization() {
  log('\n====================================', 'blue');
  log('Testing Image Optimization Function', 'blue');
  log('====================================\n', 'blue');
  
  const tests = [
    {
      name: 'AVIF Support',
      uri: '/images/test.jpg',
      headers: {
        'accept': [{ value: 'image/avif,image/webp,image/*' }],
        'user-agent': [{ value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }],
      },
      expectedUri: '/images/test.avif',
      expectedOptimization: 'avif',
      expectedDevice: 'desktop',
    },
    {
      name: 'WebP Support',
      uri: '/images/test.png',
      headers: {
        'accept': [{ value: 'image/webp,image/*' }],
        'user-agent': [{ value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)' }],
      },
      expectedUri: '/images/test.webp',
      expectedOptimization: 'webp',
      expectedDevice: 'mobile',
    },
    {
      name: 'Original Format',
      uri: '/images/test.gif',
      headers: {
        'accept': [{ value: 'image/*' }],
        'user-agent': [{ value: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)' }],
      },
      expectedUri: '/images/test.gif',
      expectedOptimization: 'original',
      expectedDevice: 'tablet',
    },
    {
      name: 'With Query Parameters',
      uri: '/images/test.jpg',
      querystring: 'w=800&q=85',
      headers: {
        'accept': [{ value: 'image/avif,image/*' }],
        'user-agent': [{ value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }],
      },
      expectedUri: '/images/test.avif',
      expectedOptimization: 'avif',
      expectedDevice: 'desktop',
      expectedWidth: '800',
      expectedQuality: '85',
    },
    {
      name: 'Non-Image File',
      uri: '/scripts/app.js',
      headers: {
        'accept': [{ value: 'image/avif,image/*' }],
        'user-agent': [{ value: 'Mozilla/5.0' }],
      },
      expectedUri: '/scripts/app.js',
      shouldNotModify: true,
    },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    log(`\nTest: ${test.name}`, 'yellow');
    
    const event = createMockEvent('origin-request', {
      uri: test.uri,
      querystring: test.querystring || '',
      headers: test.headers,
    });
    
    const result = await imageOptimization.handler(event);
    
    // Check URI
    if (result.uri === test.expectedUri) {
      log(`  ✅ URI: ${result.uri}`, 'green');
      passed++;
    } else {
      log(`  ❌ URI: Expected "${test.expectedUri}", got "${result.uri}"`, 'red');
      failed++;
    }
    
    if (test.shouldNotModify) {
      continue;
    }
    
    // Check optimization header
    const optimizationHeader = result.headers['x-image-optimization'];
    if (optimizationHeader && optimizationHeader[0].value === test.expectedOptimization) {
      log(`  ✅ Optimization: ${optimizationHeader[0].value}`, 'green');
      passed++;
    } else {
      log(`  ❌ Optimization: Expected "${test.expectedOptimization}", got "${optimizationHeader ? optimizationHeader[0].value : 'missing'}"`, 'red');
      failed++;
    }
    
    // Check device type
    const deviceHeader = result.headers['x-device-type'];
    if (deviceHeader && deviceHeader[0].value === test.expectedDevice) {
      log(`  ✅ Device: ${deviceHeader[0].value}`, 'green');
      passed++;
    } else {
      log(`  ❌ Device: Expected "${test.expectedDevice}", got "${deviceHeader ? deviceHeader[0].value : 'missing'}"`, 'red');
      failed++;
    }
    
    // Check width (if expected)
    if (test.expectedWidth) {
      const widthHeader = result.headers['x-image-width'];
      if (widthHeader && widthHeader[0].value === test.expectedWidth) {
        log(`  ✅ Width: ${widthHeader[0].value}`, 'green');
        passed++;
      } else {
        log(`  ❌ Width: Expected "${test.expectedWidth}", got "${widthHeader ? widthHeader[0].value : 'missing'}"`, 'red');
        failed++;
      }
    }
    
    // Check quality (if expected)
    if (test.expectedQuality) {
      const qualityHeader = result.headers['x-image-quality'];
      if (qualityHeader && qualityHeader[0].value === test.expectedQuality) {
        log(`  ✅ Quality: ${qualityHeader[0].value}`, 'green');
        passed++;
      } else {
        log(`  ❌ Quality: Expected "${test.expectedQuality}", got "${qualityHeader ? qualityHeader[0].value : 'missing'}"`, 'red');
        failed++;
      }
    }
  }
  
  log(`\nResults: ${passed} passed, ${failed} failed`, failed === 0 ? 'green' : 'red');
  return failed === 0;
}

async function runTests() {
  log('\n🧪 Lambda@Edge Functions Test Suite', 'blue');
  log('====================================\n', 'blue');
  
  const securityHeadersPass = await testSecurityHeaders();
  const imageOptimizationPass = await testImageOptimization();
  
  log('\n====================================', 'blue');
  log('Final Results', 'blue');
  log('====================================\n', 'blue');
  
  if (securityHeadersPass && imageOptimizationPass) {
    log('✅ All tests passed!', 'green');
    process.exit(0);
  } else {
    log('❌ Some tests failed', 'red');
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
