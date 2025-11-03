#!/usr/bin/env node

/**
 * Onboarding Load Testing Script
 * 
 * This script simulates concurrent users going through the onboarding process
 * to test system performance under load.
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

// Configuration
const CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  concurrentUsers: parseInt(process.env.CONCURRENT_USERS) || 50,
  testDuration: parseInt(process.env.TEST_DURATION) || 300, // 5 minutes
  rampUpTime: parseInt(process.env.RAMP_UP_TIME) || 60, // 1 minute
  apiKey: process.env.TEST_API_KEY || 'test-key'
};

// Test scenarios
const SCENARIOS = [
  {
    name: 'Complete Onboarding Flow',
    weight: 0.6, // 60% of users
    steps: [
      'createAccount',
      'completeAssessment',
      'connectPlatform',
      'exploreFeatures',
      'completeOnboarding'
    ]
  },
  {
    name: 'Partial Onboarding (Drop-off)',
    weight: 0.3, // 30% of users
    steps: [
      'createAccount',
      'completeAssessment',
      'dropOff'
    ]
  },
  {
    name: 'Quick Onboarding',
    weight: 0.1, // 10% of users
    steps: [
      'createAccount',
      'skipAssessment',
      'completeOnboarding'
    ]
  }
];

// Metrics collection
const metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  responseTimes: [],
  errors: [],
  concurrentUsers: 0,
  completedOnboardings: 0,
  droppedOffUsers: 0
};

// User session class
class UserSession {
  constructor(userId, scenario) {
    this.userId = userId;
    this.scenario = scenario;
    this.sessionId = `session_${userId}_${Date.now()}`;
    this.startTime = performance.now();
    this.currentStep = 0;
    this.completed = false;
    this.droppedOff = false;
  }

  async executeScenario() {
    console.log(`User ${this.userId} starting scenario: ${this.scenario.name}`);
    
    try {
      for (const step of this.scenario.steps) {
        await this.executeStep(step);
        this.currentStep++;
        
        // Random delay between steps (1-3 seconds)
        await this.delay(1000 + Math.random() * 2000);
        
        if (this.droppedOff) break;
      }
      
      if (!this.droppedOff) {
        this.completed = true;
        metrics.completedOnboardings++;
      }
      
    } catch (error) {
      console.error(`User ${this.userId} encountered error:`, error.message);
      metrics.errors.push({
        userId: this.userId,
        step: this.currentStep,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      metrics.concurrentUsers--;
      const duration = performance.now() - this.startTime;
      console.log(`User ${this.userId} session ended. Duration: ${Math.round(duration)}ms`);
    }
  }

  async executeStep(stepName) {
    const startTime = performance.now();
    
    try {
      switch (stepName) {
        case 'createAccount':
          await this.createAccount();
          break;
        case 'completeAssessment':
          await this.completeAssessment();
          break;
        case 'skipAssessment':
          await this.skipAssessment();
          break;
        case 'connectPlatform':
          await this.connectPlatform();
          break;
        case 'exploreFeatures':
          await this.exploreFeatures();
          break;
        case 'completeOnboarding':
          await this.completeOnboarding();
          break;
        case 'dropOff':
          this.dropOff();
          break;
        default:
          throw new Error(`Unknown step: ${stepName}`);
      }
      
      const responseTime = performance.now() - startTime;
      metrics.responseTimes.push(responseTime);
      metrics.successfulRequests++;
      
    } catch (error) {
      metrics.failedRequests++;
      throw error;
    }
  }

  async createAccount() {
    const response = await this.makeRequest('POST', '/api/auth/register', {
      email: `test_user_${this.userId}@example.com`,
      password: 'TestPassword123!',
      name: `Test User ${this.userId}`
    });
    
    this.authToken = response.data.token;
    await this.trackEvent('onboarding_started');
  }

  async completeAssessment() {
    await this.makeRequest('POST', '/api/onboarding/assessment', {
      experience_level: ['beginner', 'intermediate', 'advanced'][Math.floor(Math.random() * 3)],
      goals: ['grow_audience', 'save_time', 'improve_content', 'analytics'][Math.floor(Math.random() * 4)],
      platforms: ['instagram', 'tiktok', 'twitter'][Math.floor(Math.random() * 3)],
      content_types: ['images', 'videos', 'stories'][Math.floor(Math.random() * 3)]
    });
    
    await this.trackEvent('step_completed', { stepName: 'assessment' });
  }

  async skipAssessment() {
    await this.makeRequest('POST', '/api/onboarding/skip-assessment');
    await this.trackEvent('step_completed', { stepName: 'skip_assessment' });
  }

  async connectPlatform() {
    // Simulate OAuth flow (simplified)
    await this.makeRequest('POST', '/api/onboarding/connect-platform', {
      platform: 'instagram',
      mock: true // Use mock OAuth for testing
    });
    
    await this.trackEvent('step_completed', { stepName: 'platform_connection' });
  }

  async exploreFeatures() {
    // Simulate feature exploration
    const features = ['content_editor', 'scheduling', 'analytics', 'templates'];
    
    for (const feature of features.slice(0, 2 + Math.floor(Math.random() * 2))) {
      await this.makeRequest('GET', `/api/features/${feature}`);
      await this.delay(500 + Math.random() * 1000);
    }
    
    await this.trackEvent('step_completed', { stepName: 'feature_exploration' });
  }

  async completeOnboarding() {
    await this.makeRequest('POST', '/api/onboarding/complete');
    await this.trackEvent('onboarding_completed');
  }

  dropOff() {
    this.droppedOff = true;
    metrics.droppedOffUsers++;
    this.trackEvent('onboarding_dropped_off', { 
      stepName: this.scenario.steps[this.currentStep - 1] 
    });
  }

  async trackEvent(eventType, eventData = {}) {
    try {
      await this.makeRequest('POST', '/api/onboarding/events', {
        eventType,
        eventData: {
          ...eventData,
          sessionId: this.sessionId,
          userId: this.userId
        }
      });
    } catch (error) {
      // Don't fail the test if event tracking fails
      console.warn(`Failed to track event ${eventType}:`, error.message);
    }
  }

  async makeRequest(method, path, data = null) {
    metrics.totalRequests++;
    
    const config = {
      method,
      url: `${CONFIG.baseUrl}${path}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.authToken ? `Bearer ${this.authToken}` : undefined,
        'X-Test-Session': this.sessionId
      },
      timeout: 10000 // 10 second timeout
    };
    
    if (data) {
      config.data = data;
    }
    
    return await axios(config);
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Test orchestration
class LoadTest {
  constructor() {
    this.users = [];
    this.startTime = null;
    this.endTime = null;
  }

  async run() {
    console.log('🚀 Starting Onboarding Load Test');
    console.log(`Configuration:
      - Base URL: ${CONFIG.baseUrl}
      - Concurrent Users: ${CONFIG.concurrentUsers}
      - Test Duration: ${CONFIG.testDuration}s
      - Ramp-up Time: ${CONFIG.rampUpTime}s
    `);

    this.startTime = performance.now();
    
    // Start metrics collection
    this.startMetricsCollection();
    
    // Ramp up users gradually
    await this.rampUpUsers();
    
    // Wait for test duration
    console.log(`⏱️  Running test for ${CONFIG.testDuration} seconds...`);
    await this.delay(CONFIG.testDuration * 1000);
    
    // Wait for all users to complete
    console.log('⏳ Waiting for users to complete...');
    await this.waitForCompletion();
    
    this.endTime = performance.now();
    
    // Generate report
    this.generateReport();
  }

  async rampUpUsers() {
    const usersPerSecond = CONFIG.concurrentUsers / CONFIG.rampUpTime;
    const interval = 1000 / usersPerSecond;
    
    console.log(`📈 Ramping up ${usersPerSecond.toFixed(2)} users per second...`);
    
    for (let i = 0; i < CONFIG.concurrentUsers; i++) {
      const scenario = this.selectScenario();
      const user = new UserSession(i + 1, scenario);
      
      this.users.push(user);
      metrics.concurrentUsers++;
      
      // Start user session (don't await - run concurrently)
      user.executeScenario().catch(error => {
        console.error(`User ${user.userId} failed:`, error.message);
      });
      
      // Wait before starting next user
      if (i < CONFIG.concurrentUsers - 1) {
        await this.delay(interval);
      }
    }
    
    console.log(`✅ All ${CONFIG.concurrentUsers} users started`);
  }

  selectScenario() {
    const random = Math.random();
    let cumulativeWeight = 0;
    
    for (const scenario of SCENARIOS) {
      cumulativeWeight += scenario.weight;
      if (random <= cumulativeWeight) {
        return scenario;
      }
    }
    
    return SCENARIOS[0]; // Fallback
  }

  async waitForCompletion() {
    const maxWaitTime = 60000; // 1 minute max wait
    const startWait = performance.now();
    
    while (metrics.concurrentUsers > 0 && (performance.now() - startWait) < maxWaitTime) {
      await this.delay(1000);
      console.log(`👥 ${metrics.concurrentUsers} users still active...`);
    }
  }

  startMetricsCollection() {
    // Collect metrics every 5 seconds
    this.metricsInterval = setInterval(() => {
      console.log(`📊 Active users: ${metrics.concurrentUsers}, Requests: ${metrics.totalRequests}, Errors: ${metrics.failedRequests}`);
    }, 5000);
  }

  generateReport() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    const duration = (this.endTime - this.startTime) / 1000;
    const avgResponseTime = metrics.responseTimes.length > 0 
      ? metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length 
      : 0;
    
    const p95ResponseTime = metrics.responseTimes.length > 0
      ? metrics.responseTimes.sort((a, b) => a - b)[Math.floor(metrics.responseTimes.length * 0.95)]
      : 0;

    const successRate = metrics.totalRequests > 0 
      ? (metrics.successfulRequests / metrics.totalRequests) * 100 
      : 0;

    const completionRate = CONFIG.concurrentUsers > 0
      ? (metrics.completedOnboardings / CONFIG.concurrentUsers) * 100
      : 0;

    const report = `
🎯 ONBOARDING LOAD TEST RESULTS
=====================================

📈 Test Configuration:
  • Concurrent Users: ${CONFIG.concurrentUsers}
  • Test Duration: ${duration.toFixed(2)}s
  • Base URL: ${CONFIG.baseUrl}

📊 Performance Metrics:
  • Total Requests: ${metrics.totalRequests}
  • Successful Requests: ${metrics.successfulRequests}
  • Failed Requests: ${metrics.failedRequests}
  • Success Rate: ${successRate.toFixed(2)}%
  • Requests/Second: ${(metrics.totalRequests / duration).toFixed(2)}

⏱️  Response Times:
  • Average: ${avgResponseTime.toFixed(2)}ms
  • 95th Percentile: ${p95ResponseTime.toFixed(2)}ms
  • Min: ${Math.min(...metrics.responseTimes).toFixed(2)}ms
  • Max: ${Math.max(...metrics.responseTimes).toFixed(2)}ms

👥 User Behavior:
  • Completed Onboardings: ${metrics.completedOnboardings}
  • Dropped Off Users: ${metrics.droppedOffUsers}
  • Completion Rate: ${completionRate.toFixed(2)}%

❌ Errors:
  • Total Errors: ${metrics.errors.length}
  • Error Rate: ${((metrics.failedRequests / metrics.totalRequests) * 100).toFixed(2)}%

🎯 Performance Assessment:
  ${this.assessPerformance(successRate, avgResponseTime, completionRate)}

=====================================
    `;

    console.log(report);

    // Save detailed results to file
    this.saveDetailedResults();
  }

  assessPerformance(successRate, avgResponseTime, completionRate) {
    const issues = [];
    
    if (successRate < 95) issues.push(`❌ Low success rate (${successRate.toFixed(1)}% < 95%)`);
    if (avgResponseTime > 2000) issues.push(`❌ Slow response times (${avgResponseTime.toFixed(0)}ms > 2000ms)`);
    if (completionRate < 75) issues.push(`❌ Low completion rate (${completionRate.toFixed(1)}% < 75%)`);
    
    if (issues.length === 0) {
      return '✅ All performance targets met!';
    } else {
      return issues.join('\n  ');
    }
  }

  saveDetailedResults() {
    const results = {
      timestamp: new Date().toISOString(),
      config: CONFIG,
      metrics: {
        ...metrics,
        duration: (this.endTime - this.startTime) / 1000,
        avgResponseTime: metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length,
        p95ResponseTime: metrics.responseTimes.sort((a, b) => a - b)[Math.floor(metrics.responseTimes.length * 0.95)]
      }
    };

    const fs = require('fs');
    const filename = `onboarding-load-test-${Date.now()}.json`;
    
    try {
      fs.writeFileSync(filename, JSON.stringify(results, null, 2));
      console.log(`📄 Detailed results saved to: ${filename}`);
    } catch (error) {
      console.error('Failed to save results:', error.message);
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the test
if (require.main === module) {
  const test = new LoadTest();
  test.run().catch(error => {
    console.error('❌ Load test failed:', error);
    process.exit(1);
  });
}

module.exports = { LoadTest, UserSession };