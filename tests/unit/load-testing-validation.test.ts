/**
 * Load Testing Validation Tests
 * Tests the k6 load testing configuration and scenarios
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Load Testing Validation', () => {
  const loadTestPath = join(process.cwd(), 'tests/load/onlyfans-campaign.load.test.js');
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Load Test File Structure', () => {
    it('should have load test file', () => {
      expect(existsSync(loadTestPath)).toBe(true);
    });

    it('should contain valid k6 imports and structure', () => {
      const content = readFileSync(loadTestPath, 'utf-8');
      
      // Check for k6 imports
      expect(content).toContain("import http from 'k6/http'");
      expect(content).toContain("import { check, sleep } from 'k6'");
      
      // Check for export options
      expect(content).toContain('export const options');
      
      // Check for test functions
      expect(content).toContain('export function');
    });

    it('should contain proper load profiles configuration', () => {
      const content = readFileSync(loadTestPath, 'utf-8');
      
      // Check for load profiles
      expect(content).toContain('LOAD_PROFILES');
      expect(content).toContain('light:');
      expect(content).toContain('medium:');
      expect(content).toContain('heavy:');
      
      // Check profile parameters
      expect(content).toContain('campaignTarget');
      expect(content).toContain('messageRate');
      expect(content).toContain('fanVUs');
      expect(content).toContain('spikeTarget');
    });
  });

  describe('Load Test Scenarios', () => {
    it('should contain all required test scenarios', () => {
      const content = readFileSync(loadTestPath, 'utf-8');
      
      // Check for all scenarios
      expect(content).toContain('campaign-create');
      expect(content).toContain('message-rate');
      expect(content).toContain('fan-browse');
      expect(content).toContain('spike');
      expect(content).toContain('browser-worker');
    });

    it('should have proper scenario configurations', () => {
      const content = readFileSync(loadTestPath, 'utf-8');
      
      // Campaign creation scenario
      expect(content).toMatch(/['"]campaign-create['"]:\s*{[\s\S]*?executor:\s*['"]ramping-vus['"]/);
      expect(content).toMatch(/exec:\s*['"]createCampaign['"]/);
      
      // Message rate scenario
      expect(content).toMatch(/['"]message-rate['"]:\s*{[\s\S]*?executor:\s*['"]constant-arrival-rate['"]/);
      expect(content).toMatch(/exec:\s*['"]sendMessage['"]/);
      
      // Fan browse scenario
      expect(content).toMatch(/['"]fan-browse['"]:\s*{[\s\S]*?executor:\s*['"]per-vu-iterations['"]/);
      expect(content).toMatch(/exec:\s*['"]listFans['"]/);
      
      // Spike scenario
      expect(content).toMatch(/['"]spike['"]:\s*{[\s\S]*?executor:\s*['"]ramping-arrival-rate['"]/);
      expect(content).toMatch(/exec:\s*['"]healthPing['"]/);
      
      // Browser worker scenario
      expect(content).toMatch(/['"]browser-worker['"]:\s*{[\s\S]*?executor:\s*['"]constant-vus['"]/);
      expect(content).toMatch(/exec:\s*['"]testBrowserWorker['"]/);
    });

    it('should have realistic load parameters', () => {
      const content = readFileSync(loadTestPath, 'utf-8');
      
      // Extract load profiles
      const profilesMatch = content.match(/const LOAD_PROFILES = {([\s\S]*?)};/);
      expect(profilesMatch).toBeTruthy();
      
      const profilesContent = profilesMatch![1];
      
      // Light profile validation
      expect(profilesContent).toMatch(/light:\s*{[\s\S]*?campaignTarget:\s*100/);
      expect(profilesContent).toMatch(/messageRate:\s*500/);
      expect(profilesContent).toMatch(/fanVUs:\s*25/);
      
      // Medium profile validation
      expect(profilesContent).toMatch(/medium:\s*{[\s\S]*?campaignTarget:\s*500/);
      expect(profilesContent).toMatch(/messageRate:\s*1000/);
      expect(profilesContent).toMatch(/fanVUs:\s*50/);
      
      // Heavy profile validation
      expect(profilesContent).toMatch(/heavy:\s*{[\s\S]*?campaignTarget:\s*1000/);
      expect(profilesContent).toMatch(/messageRate:\s*2000/);
      expect(profilesContent).toMatch(/fanVUs:\s*100/);
    });
  });

  describe('Performance Thresholds', () => {
    it('should have appropriate performance thresholds', () => {
      const content = readFileSync(loadTestPath, 'utf-8');
      
      // Check for thresholds configuration
      expect(content).toContain('thresholds:');
      
      // General thresholds
      expect(content).toMatch(/http_req_duration.*p\(95\)<500/);
      expect(content).toMatch(/http_req_duration.*p\(99\)<900/);
      expect(content).toMatch(/http_req_failed.*rate<0\.01/);
      
      // Scenario-specific thresholds
      expect(content).toMatch(/http_req_duration\{scenario:message-rate\}.*p\(95\)<400/);
      expect(content).toMatch(/http_req_duration\{scenario:browser-worker\}.*p\(95\)<30000/);
      expect(content).toMatch(/browser_task_success_rate.*rate>0\.95/);
    });

    it('should have realistic performance expectations', () => {
      const content = readFileSync(loadTestPath, 'utf-8');
      
      // P95 should be under 500ms for general requests
      expect(content).toMatch(/p\(95\)<500/);
      
      // P99 should be under 900ms for general requests
      expect(content).toMatch(/p\(99\)<900/);
      
      // Error rate should be less than 1%
      expect(content).toMatch(/rate<0\.01/);
      
      // Browser tasks can take longer (up to 30s for P95)
      expect(content).toMatch(/p\(95\)<30000/);
      expect(content).toMatch(/p\(99\)<60000/);
      
      // Success rate should be above 95%
      expect(content).toMatch(/rate>0\.95/);
    });
  });

  describe('Test Functions', () => {
    it('should have all required test functions', () => {
      const content = readFileSync(loadTestPath, 'utf-8');
      
      // Check for test functions
      expect(content).toContain('export function createCampaign()');
      expect(content).toContain('export function sendMessage()');
      expect(content).toContain('export function listFans()');
      expect(content).toContain('export function healthPing()');
      expect(content).toContain('export function testBrowserWorker()');
    });

    it('should have proper HTTP request implementations', () => {
      const content = readFileSync(loadTestPath, 'utf-8');
      
      // Campaign creation
      expect(content).toMatch(/http\.post\(`\${BASE}\/onlyfans\/campaigns`/);
      
      // Message sending
      expect(content).toMatch(/http\.post\(`\${BASE}\/onlyfans\/messages`/);
      
      // Fan listing
      expect(content).toMatch(/http\.get\(`\${BASE}\/fans/);
      
      // Health check
      expect(content).toMatch(/http\.get\(`\${BASE}\/health`/);
      
      // Browser worker
      expect(content).toMatch(/http\.post\(`\${BASE}\/onlyfans\/browser-worker`/);
    });

    it('should have proper request validation', () => {
      const content = readFileSync(loadTestPath, 'utf-8');
      
      // Check for response validation
      expect(content).toContain('check(res, {');
      
      // Status code checks
      expect(content).toMatch(/['"]201 created['"]:\s*r\s*=>\s*r\.status\s*===\s*201/);
      expect(content).toMatch(/['"]200\|201['"]:\s*r\s*=>\s*r\.status\s*===\s*200\s*\|\|\s*r\.status\s*===\s*201/);
      expect(content).toMatch(/['"]200 ok['"]:\s*r\s*=>\s*r\.status\s*===\s*200/);
      
      // Response time checks
      expect(content).toMatch(/['"]resp < 500ms['"]:\s*r\s*=>\s*r\.timings\.duration\s*<\s*500/);
      expect(content).toMatch(/['"]response time < 30s['"]:\s*r\s*=>\s*r\.timings\.duration\s*<\s*30000/);
    });
  });

  describe('Environment Configuration', () => {
    it('should have proper environment variable handling', () => {
      const content = readFileSync(loadTestPath, 'utf-8');
      
      // Check for environment variables
      expect(content).toContain('__ENV.API_BASE');
      expect(content).toContain('__ENV.TEST_TOKEN');
      expect(content).toContain('__ENV.LOAD_PROFILE');
      
      // Default values
      expect(content).toMatch(/const BASE = __ENV\.API_BASE \?\? ['"]https:\/\/huntaze\.com\/api['"]/);
      expect(content).toMatch(/const TOKEN = __ENV\.TEST_TOKEN/);
      expect(content).toMatch(/__ENV\.LOAD_PROFILE \|\| ['"]medium['"]/);
    });

    it('should have proper authentication handling', () => {
      const content = readFileSync(loadTestPath, 'utf-8');
      
      // Check for headers function
      expect(content).toContain('function headers()');
      expect(content).toContain("'Content-Type': 'application/json'");
      expect(content).toContain("'Authorization': `Bearer ${TOKEN}`");
    });

    it('should have configurable API endpoints', () => {
      const content = readFileSync(loadTestPath, 'utf-8');
      
      // Check for API endpoints
      expect(content).toContain('/onlyfans/campaigns');
      expect(content).toContain('/onlyfans/messages');
      expect(content).toContain('/onlyfans/browser-worker');
      expect(content).toContain('/fans');
      expect(content).toContain('/health');
    });
  });

  describe('Browser Worker Load Testing', () => {
    it('should have specialized browser worker testing', () => {
      const content = readFileSync(loadTestPath, 'utf-8');
      
      // Check browser worker function
      const browserWorkerMatch = content.match(/export function testBrowserWorker\(\)\s*{([\s\S]*?)}/);
      expect(browserWorkerMatch).toBeTruthy();
      
      const browserWorkerContent = browserWorkerMatch![1];
      
      // Should have proper payload
      expect(browserWorkerContent).toContain('action: \'send\'');
      expect(browserWorkerContent).toContain('userId:');
      expect(browserWorkerContent).toContain('data:');
      
      // Should have longer timeout
      expect(browserWorkerContent).toContain('timeout: \'60s\'');
      
      // Should have proper validation
      expect(browserWorkerContent).toContain('browser task accepted');
      expect(browserWorkerContent).toContain('response time < 30s');
      expect(browserWorkerContent).toContain('no server errors');
    });

    it('should track custom metrics for browser tasks', () => {
      const content = readFileSync(loadTestPath, 'utf-8');
      
      // Check for custom metrics
      expect(content).toContain('browser_task_success_rate');
      expect(content).toContain('__VU.metrics.browser_task_success_rate.add(1)');
      expect(content).toContain('__VU.metrics.browser_task_success_rate.add(0)');
    });

    it('should have realistic browser task timing', () => {
      const content = readFileSync(loadTestPath, 'utf-8');
      
      // Check for sleep between tasks
      expect(content).toMatch(/sleep\(Math\.random\(\)\s*\*\s*2\s*\+\s*1\)/);
      
      // Should have 1-3 second delay
      const sleepMatch = content.match(/sleep\((.*?)\)/);
      expect(sleepMatch).toBeTruthy();
      expect(sleepMatch![1]).toContain('Math.random() * 2 + 1');
    });
  });

  describe('Data Generation', () => {
    it('should have realistic test data generation', () => {
      const content = readFileSync(loadTestPath, 'utf-8');
      
      // Campaign data
      expect(content).toContain('Load Test Campaign');
      expect(content).toContain('active_subscribers');
      expect(content).toContain('Test message');
      
      // Message data
      expect(content).toMatch(/userId:\s*`u_\${Math\.ceil\(Math\.random\(\)\s*\*\s*10000\)}`/);
      expect(content).toContain('content: \'hello\'');
      
      // Browser worker data
      expect(content).toMatch(/load_test_user_\${Math\.ceil\(Math\.random\(\)\s*\*\s*100\)}/);
      expect(content).toMatch(/Load test message \${Date\.now\(\)}/);
      expect(content).toMatch(/conv_\${Math\.ceil\(Math\.random\(\)\s*\*\s*1000\)}/);
    });

    it('should have proper JSON payload formatting', () => {
      const content = readFileSync(loadTestPath, 'utf-8');
      
      // Check for JSON.stringify usage
      expect(content).toMatch(/const payload = JSON\.stringify\(/);
      
      // Check for proper payload structure
      expect(content).toContain('name:');
      expect(content).toContain('audience:');
      expect(content).toContain('content:');
      expect(content).toContain('userId:');
      expect(content).toContain('conversationId:');
    });
  });

  describe('Load Test Documentation', () => {
    it('should have comprehensive documentation header', () => {
      const content = readFileSync(loadTestPath, 'utf-8');
      
      // Check for documentation
      expect(content).toContain('OnlyFans Load Testing with k6');
      expect(content).toContain('Run with: k6 run');
      expect(content).toContain('Environment Variables:');
      expect(content).toContain('Scenarios:');
    });

    it('should document all scenarios', () => {
      const content = readFileSync(loadTestPath, 'utf-8');
      
      // Check scenario documentation
      expect(content).toContain('1. campaign-create: 100 → 500 creators');
      expect(content).toContain('2. message-rate: 1,000 messages/min constant');
      expect(content).toContain('3. fan-browse: 10,000 fans loaded');
      expect(content).toContain('4. spike: 10x traffic spike');
      expect(content).toContain('5. browser-worker: ECS Fargate task execution');
    });

    it('should document environment variables', () => {
      const content = readFileSync(loadTestPath, 'utf-8');
      
      // Check environment variable documentation
      expect(content).toContain('API_BASE: Base URL for API');
      expect(content).toContain('TEST_TOKEN: Authentication token');
      expect(content).toContain('LOAD_PROFILE: light|medium|heavy');
      expect(content).toContain('default: https://huntaze.com/api');
      expect(content).toContain('default: medium');
    });
  });
});