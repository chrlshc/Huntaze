/**
 * Dashboard API Load Test
 * 
 * Run with: k6 run tests/integration/dashboard/load-test.js
 * 
 * Requirements:
 * - k6 installed (https://k6.io/docs/getting-started/installation/)
 * - Server running on http://localhost:3000
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const dashboardDuration = new Trend('dashboard_duration');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '2m', target: 50 },   // Stay at 50 users
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests must complete below 1s
    http_req_failed: ['rate<0.01'],    // Error rate must be below 1%
    errors: ['rate<0.01'],             // Custom error rate below 1%
  },
};

// Test data
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const USER_IDS = Array.from({ length: 100 }, (_, i) => `test_user_${i}`);
const RANGES = ['7d', '30d', '90d'];
const INCLUDES = [
  'analytics,content',
  'analytics,onlyfans',
  'content,marketing',
  'analytics,content,onlyfans,marketing',
];

export default function () {
  // Select random test data
  const userId = USER_IDS[Math.floor(Math.random() * USER_IDS.length)];
  const range = RANGES[Math.floor(Math.random() * RANGES.length)];
  const include = INCLUDES[Math.floor(Math.random() * INCLUDES.length)];

  // Make request
  const url = `${BASE_URL}/api/dashboard?range=${range}&include=${include}`;
  const params = {
    headers: {
      'x-user-id': userId,
      'Content-Type': 'application/json',
    },
    tags: { name: 'DashboardAPI' },
  };

  const response = http.get(url, params);

  // Record custom metrics
  dashboardDuration.add(response.timings.duration);

  // Check response
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response has success field': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true;
      } catch {
        return false;
      }
    },
    'response has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data !== undefined;
      } catch {
        return false;
      }
    },
    'response has summary': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data?.summary !== undefined;
      } catch {
        return false;
      }
    },
    'response has trends': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data?.trends !== undefined;
      } catch {
        return false;
      }
    },
    'response time < 1s': (r) => r.timings.duration < 1000,
  });

  // Record errors
  errorRate.add(!success);

  // Think time
  sleep(1);
}

export function handleSummary(data) {
  return {
    'load-test-results.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options = {}) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;

  const metrics = data.metrics;
  const summary = [];

  summary.push(`${indent}Dashboard API Load Test Results`);
  summary.push(`${indent}${'='.repeat(50)}`);
  summary.push('');

  // HTTP metrics
  summary.push(`${indent}HTTP Metrics:`);
  summary.push(`${indent}  Requests: ${metrics.http_reqs.values.count}`);
  summary.push(`${indent}  Failed: ${metrics.http_req_failed.values.rate * 100}%`);
  summary.push(`${indent}  Duration (avg): ${metrics.http_req_duration.values.avg.toFixed(2)}ms`);
  summary.push(`${indent}  Duration (p95): ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`);
  summary.push(`${indent}  Duration (p99): ${metrics.http_req_duration.values['p(99)'].toFixed(2)}ms`);
  summary.push('');

  // Custom metrics
  summary.push(`${indent}Custom Metrics:`);
  summary.push(`${indent}  Error Rate: ${metrics.errors.values.rate * 100}%`);
  summary.push(`${indent}  Dashboard Duration (avg): ${metrics.dashboard_duration.values.avg.toFixed(2)}ms`);
  summary.push('');

  // Checks
  summary.push(`${indent}Checks:`);
  Object.entries(data.root_group.checks).forEach(([name, check]) => {
    const passed = check.passes;
    const total = check.passes + check.fails;
    const rate = ((passed / total) * 100).toFixed(2);
    summary.push(`${indent}  ${name}: ${rate}% (${passed}/${total})`);
  });
  summary.push('');

  // Thresholds
  summary.push(`${indent}Thresholds:`);
  Object.entries(data.metrics).forEach(([name, metric]) => {
    if (metric.thresholds) {
      Object.entries(metric.thresholds).forEach(([threshold, result]) => {
        const status = result.ok ? '✓' : '✗';
        summary.push(`${indent}  ${status} ${name} ${threshold}`);
      });
    }
  });

  return summary.join('\n');
}
