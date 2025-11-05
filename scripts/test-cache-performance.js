#!/usr/bin/env node

/**
 * Cache Performance Testing Script
 * Tests cache performance and validates caching strategy
 */

const { performance } = require('perf_hooks');

async function testEndpoint(url, iterations = 5) {
  const results = [];
  
  console.log(`\n🧪 Testing ${url} (${iterations} iterations)`);
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Cache-Performance-Test',
        },
      });
      
      const end = performance.now();
      const duration = end - start;
      
      const cacheStatus = response.headers.get('X-Cache') || 'UNKNOWN';
      const contentLength = response.headers.get('Content-Length') || '0';
      
      results.push({
        iteration: i + 1,
        duration: Math.round(duration),
        status: response.status,
        cache: cacheStatus,
        size: parseInt(contentLength),
      });
      
      console.log(`  ${i + 1}. ${Math.round(duration)}ms - ${response.status} - Cache: ${cacheStatus}`);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`  ${i + 1}. ERROR: ${error.message}`);
      results.push({
        iteration: i + 1,
        duration: -1,
        status: 'ERROR',
        cache: 'ERROR',
        size: 0,
        error: error.message,
      });
    }
  }
  
  return results;
}

function analyzeResults(results, endpointName) {
  const validResults = results.filter(r => r.duration > 0);
  
  if (validResults.length === 0) {
    console.log(`❌ ${endpointName}: All requests failed`);
    return;
  }
  
  const durations = validResults.map(r => r.duration);
  const cacheHits = validResults.filter(r => r.cache === 'HIT').length;
  const cacheMisses = validResults.filter(r => r.cache === 'MISS').length;
  
  const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
  const min = Math.min(...durations);
  const max = Math.max(...durations);
  
  const hitRate = validResults.length > 0 ? (cacheHits / validResults.length * 100) : 0;
  
  console.log(`\n📊 ${endpointName} Analysis:`);
  console.log(`   Average: ${Math.round(avg)}ms`);
  console.log(`   Min: ${min}ms`);
  console.log(`   Max: ${max}ms`);
  console.log(`   Cache Hit Rate: ${Math.round(hitRate)}%`);
  console.log(`   Cache Hits: ${cacheHits}, Misses: ${cacheMisses}`);
  
  // Performance assessment
  if (avg < 100) {
    console.log(`   ✅ Excellent performance`);
  } else if (avg < 500) {
    console.log(`   ✅ Good performance`);
  } else if (avg < 1000) {
    console.log(`   ⚠️  Acceptable performance`);
  } else {
    console.log(`   ❌ Poor performance - needs optimization`);
  }
  
  return {
    endpoint: endpointName,
    avg,
    min,
    max,
    hitRate,
    cacheHits,
    cacheMisses,
    totalRequests: validResults.length,
  };
}

async function testCacheWarmup(baseUrl) {
  console.log('\n🔥 Testing cache warmup...');
  
  try {
    const start = performance.now();
    
    const response = await fetch(`${baseUrl}/api/cache/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'warmup-critical' }),
    });
    
    const end = performance.now();
    const duration = Math.round(end - start);
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Cache warmup completed in ${duration}ms`);
      console.log(`   Message: ${result.message}`);
    } else {
      console.log(`❌ Cache warmup failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Cache warmup error: ${error.message}`);
  }
}

async function getCacheStatus(baseUrl) {
  console.log('\n📈 Getting cache status...');
  
  try {
    const response = await fetch(`${baseUrl}/api/cache/status`);
    
    if (response.ok) {
      const status = await response.json();
      
      console.log(`   Overall Health: ${status.health.overall}`);
      console.log(`   Redis: ${status.health.redis.status}`);
      console.log(`   Memory Entries: ${status.health.memory.entries}`);
      console.log(`   Environment: ${status.configuration.environment}`);
      console.log(`   Redis Enabled: ${status.configuration.redisEnabled}`);
      
      return status;
    } else {
      console.log(`❌ Failed to get cache status: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Cache status error: ${error.message}`);
  }
  
  return null;
}

async function main() {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  console.log('🚀 Cache Performance Testing');
  console.log(`📍 Base URL: ${baseUrl}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  
  // Get initial cache status
  await getCacheStatus(baseUrl);
  
  // Test cache warmup
  await testCacheWarmup(baseUrl);
  
  // Wait a moment for warmup to complete
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test endpoints
  const endpoints = [
    { name: 'Health Check', url: `${baseUrl}/api/health` },
    { name: 'Landing Page Data', url: `${baseUrl}/api/landing/data` },
    { name: 'Analytics Overview', url: `${baseUrl}/api/analytics/overview` },
    { name: 'Cache Status', url: `${baseUrl}/api/cache/status` },
  ];
  
  const allResults = [];
  
  for (const endpoint of endpoints) {
    const results = await testEndpoint(endpoint.url, 5);
    const analysis = analyzeResults(results, endpoint.name);
    if (analysis) {
      allResults.push(analysis);
    }
  }
  
  // Overall summary
  console.log('\n🎯 Overall Performance Summary:');
  console.log('=' .repeat(50));
  
  allResults.forEach(result => {
    const status = result.avg < 500 ? '✅' : result.avg < 1000 ? '⚠️' : '❌';
    console.log(`${status} ${result.endpoint}: ${Math.round(result.avg)}ms avg, ${Math.round(result.hitRate)}% cache hit rate`);
  });
  
  // Performance recommendations
  console.log('\n💡 Recommendations:');
  
  const slowEndpoints = allResults.filter(r => r.avg > 500);
  if (slowEndpoints.length > 0) {
    console.log('⚠️  Consider optimizing these slow endpoints:');
    slowEndpoints.forEach(r => {
      console.log(`   - ${r.endpoint}: ${Math.round(r.avg)}ms average`);
    });
  }
  
  const lowCacheHitRates = allResults.filter(r => r.hitRate < 50);
  if (lowCacheHitRates.length > 0) {
    console.log('⚠️  Consider improving cache hit rates for:');
    lowCacheHitRates.forEach(r => {
      console.log(`   - ${r.endpoint}: ${Math.round(r.hitRate)}% hit rate`);
    });
  }
  
  if (slowEndpoints.length === 0 && lowCacheHitRates.length === 0) {
    console.log('✅ All endpoints performing well!');
  }
  
  console.log('\n🏁 Cache performance testing completed');
}

// Run the test
main().catch(console.error);