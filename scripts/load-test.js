#!/usr/bin/env node

/**
 * Load Testing Script for Load Shedding Validation
 */

const http = require('http');
const { performance } = require('perf_hooks');

class LoadTester {
  constructor() {
    this.results = {
      requests: [],
      summary: {
        total: 0,
        successful: 0,
        failed: 0,
        rejected: 0,
        throttled: 0,
        averageLatency: 0,
        p95Latency: 0,
        p99Latency: 0
      }
    };
  }

  async runLoadTest(scenario) {
    console.log(`🧪 Running load test: ${scenario.description}`);
    console.log(`   RPS: ${scenario.rps}, Duration: ${scenario.duration}s`);
    
    const startTime = Date.now();
    const endTime = startTime + (scenario.duration * 1000);
    const requestInterval = 1000 / scenario.rps; // ms between requests
    
    const promises = [];
    let requestCount = 0;
    
    while (Date.now() < endTime) {
      const requestPromise = this.makeRequest(requestCount++);
      promises.push(requestPromise);
      
      // Wait for next request interval
      await this.sleep(requestInterval);
    }
    
    // Wait for all requests to complete
    console.log(`⏳ Waiting for ${promises.length} requests to complete...`);
    await Promise.allSettled(promises);
    
    // Calculate results
    this.calculateSummary();
    this.printResults();
    
    return this.results;
  }
  
  async makeRequest(requestId) {
    const startTime = performance.now();
    
    try {
      const result = await this.httpRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/health',
        method: 'GET'
      });
      
      const duration = performance.now() - startTime;
      
      this.results.requests.push({
        id: requestId,
        status: result.status,
        duration,
        timestamp: Date.now(),
        success: result.status >= 200 && result.status < 300,
        rejected: result.status === 503,
        throttled: result.status === 429
      });
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.results.requests.push({
        id: requestId,
        status: 0,
        duration,
        timestamp: Date.now(),
        success: false,
        rejected: false,
        throttled: false,
        error: error.message
      });
    }
  }
  
  httpRequest(options) {
    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data
          });
        });
      });
      
      req.on('error', reject);
      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.end();
    });
  }
  
  calculateSummary() {
    const requests = this.results.requests;
    const successful = requests.filter(r => r.success);
    const failed = requests.filter(r => !r.success && !r.rejected && !r.throttled);
    const rejected = requests.filter(r => r.rejected);
    const throttled = requests.filter(r => r.throttled);
    
    const latencies = requests.map(r => r.duration).sort((a, b) => a - b);
    const p95Index = Math.floor(latencies.length * 0.95);
    const p99Index = Math.floor(latencies.length * 0.99);
    
    this.results.summary = {
      total: requests.length,
      successful: successful.length,
      failed: failed.length,
      rejected: rejected.length,
      throttled: throttled.length,
      averageLatency: latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length,
      p95Latency: latencies[p95Index] || 0,
      p99Latency: latencies[p99Index] || 0
    };
  }
  
  printResults() {
    const { summary } = this.results;
    
    console.log('\n📊 Load Test Results:');
    console.log('=' .repeat(40));
    console.log(`Total Requests: ${summary.total}`);
    console.log(`Successful: ${summary.successful} (${(summary.successful / summary.total * 100).toFixed(1)}%)`);
    console.log(`Failed: ${summary.failed} (${(summary.failed / summary.total * 100).toFixed(1)}%)`);
    console.log(`Rejected (503): ${summary.rejected} (${(summary.rejected / summary.total * 100).toFixed(1)}%)`);
    console.log(`Throttled (429): ${summary.throttled} (${(summary.throttled / summary.total * 100).toFixed(1)}%)`);
    console.log(`Average Latency: ${summary.averageLatency.toFixed(2)}ms`);
    console.log(`P95 Latency: ${summary.p95Latency.toFixed(2)}ms`);
    console.log(`P99 Latency: ${summary.p99Latency.toFixed(2)}ms`);
    console.log('=' .repeat(40));
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI interface
const [,, scenario] = process.argv;

const scenarios = {
  normal: { rps: 10, duration: 60, description: 'Normal load (10 RPS)' },
  double: { rps: 20, duration: 60, description: '2x load (20 RPS)' },
  triple: { rps: 30, duration: 60, description: '3x load (30 RPS)' },
  spike: { rps: 50, duration: 30, description: 'Spike load (50 RPS)' }
};

if (!scenario || !scenarios[scenario]) {
  console.log('Load Testing Script');
  console.log('');
  console.log('Usage: node scripts/load-test.js <scenario>');
  console.log('');
  console.log('Available scenarios:');
  Object.entries(scenarios).forEach(([name, config]) => {
    console.log(`  ${name}: ${config.description}`);
  });
  process.exit(1);
}

const tester = new LoadTester();
tester.runLoadTest(scenarios[scenario]).catch(console.error);
