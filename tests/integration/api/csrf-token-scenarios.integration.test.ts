/**
 * Scenario-Based Integration Tests for CSRF Token API
 * 
 * Tests real-world usage scenarios and edge cases.
 * 
 * Feature: production-critical-fixes
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TEST_SCENARIOS,
  TEST_USER_AGENTS,
  parseCookie,
  isValidTokenFormat,
  extractTokenFromCookie,
  makeConcurrentRequests,
  measureRequestDuration,
  wait,
  PERFORMANCE_BENCHMARKS,
  RATE_LIMIT_CONFIGS,
} from './fixtures/csrf-token.fixtures';

describe('CSRF Token API - Real-World Scenarios', () => {
  const baseUrl = process.env.TEST_API_URL || 'http://localhost:3000';

  describe('User Journey Scenarios', () => {
    it('Scenario: New user visits login page and needs CSRF token', async () => {
      // Step 1: User navigates to login page
      const response = await fetch(`${baseUrl}/api/csrf/token`, {
        headers: {
          'User-Agent': TEST_USER_AGENTS.chrome,
          'Referer': 'https://huntaze.com/auth/login',
        },
      });

      expect(response.status).toBe(200);

      // Step 2: Token is returned in response
      const body = await response.json();
      expect(body.token).toBeTruthy();
      expect(isValidTokenFormat(body.token)).toBe(true);

      // Step 3: Token is set in cookie for automatic inclusion
      const setCookieHeader = response.headers.get('set-cookie');
      expect(setCookieHeader).toBeTruthy();

      const cookie = parseCookie(setCookieHeader!);
      expect(cookie.name).toBe('csrf-token');
      expect(cookie.value).toBe(body.token);
      expect(cookie.attributes.httponly).toBe(true);
    });

    it('Scenario: User submits login form with CSRF token', async () => {
      // Step 1: Get CSRF token
      const tokenResponse = await fetch(`${baseUrl}/api/csrf/token`);
      const { token } = await tokenResponse.json();

      // Step 2: Submit login form with token
      const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': token,
          'Cookie': `csrf-token=${token}`,
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      // Should not be rejected for CSRF (may fail auth, but not CSRF)
      expect(loginResponse.status).not.toBe(403);
    });

    it('Scenario: Mobile user requests token on slow connection', async () => {
      const { response, duration } = await measureRequestDuration(
        `${baseUrl}/api/csrf/token`,
        {
          headers: {
            'User-Agent': TEST_USER_AGENTS.mobile,
          },
        }
      );

      expect(response.status).toBe(200);

      // Should still be fast even on mobile
      expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.singleRequest.maxDuration);
    });

    it('Scenario: User refreshes page and gets new token', async () => {
      // First page load
      const response1 = await fetch(`${baseUrl}/api/csrf/token`);
      const body1 = await response1.json();

      // User refreshes page
      await wait(100);

      // Second page load
      const response2 = await fetch(`${baseUrl}/api/csrf/token`);
      const body2 = await response2.json();

      // Should get a new token
      expect(body1.token).not.toBe(body2.token);
    });

    it('Scenario: User opens multiple tabs simultaneously', async () => {
      // Simulate 5 tabs opening at once
      const responses = await makeConcurrentRequests(`${baseUrl}/api/csrf/token`, 5);

      // All tabs should get tokens
      expect(responses.every((r) => r.status === 200)).toBe(true);

      // Each tab should get a unique token
      const bodies = await Promise.all(responses.map((r) => r.json()));
      const tokens = bodies.map((b) => b.token);
      const uniqueTokens = new Set(tokens);

      expect(uniqueTokens.size).toBe(5);
    });
  });

  describe('Browser Compatibility Scenarios', () => {
    it('Scenario: Chrome browser requests token', async () => {
      const response = await fetch(`${baseUrl}/api/csrf/token`, {
        headers: {
          'User-Agent': TEST_USER_AGENTS.chrome,
        },
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(isValidTokenFormat(body.token)).toBe(true);
    });

    it('Scenario: Firefox browser requests token', async () => {
      const response = await fetch(`${baseUrl}/api/csrf/token`, {
        headers: {
          'User-Agent': TEST_USER_AGENTS.firefox,
        },
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(isValidTokenFormat(body.token)).toBe(true);
    });

    it('Scenario: Safari browser requests token', async () => {
      const response = await fetch(`${baseUrl}/api/csrf/token`, {
        headers: {
          'User-Agent': TEST_USER_AGENTS.safari,
        },
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(isValidTokenFormat(body.token)).toBe(true);
    });

    it('Scenario: Edge browser requests token', async () => {
      const response = await fetch(`${baseUrl}/api/csrf/token`, {
        headers: {
          'User-Agent': TEST_USER_AGENTS.edge,
        },
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(isValidTokenFormat(body.token)).toBe(true);
    });

    it('Scenario: Mobile Safari requests token', async () => {
      const response = await fetch(`${baseUrl}/api/csrf/token`, {
        headers: {
          'User-Agent': TEST_USER_AGENTS.mobile,
        },
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(isValidTokenFormat(body.token)).toBe(true);
    });
  });

  describe('Load Testing Scenarios', () => {
    it('Scenario: Normal traffic - 10 requests per second', async () => {
      const requestsPerSecond = 10;
      const duration = 3; // seconds
      const totalRequests = requestsPerSecond * duration;

      const startTime = Date.now();
      const responses: Response[] = [];

      for (let i = 0; i < totalRequests; i++) {
        const response = await fetch(`${baseUrl}/api/csrf/token`);
        responses.push(response);

        // Wait to maintain rate
        if (i < totalRequests - 1) {
          await wait(1000 / requestsPerSecond);
        }
      }

      const totalDuration = Date.now() - startTime;

      // All requests should succeed
      const successCount = responses.filter((r) => r.status === 200).length;
      expect(successCount).toBe(totalRequests);

      // Should complete in approximately the expected time
      expect(totalDuration).toBeGreaterThan(duration * 1000 - 500);
      expect(totalDuration).toBeLessThan(duration * 1000 + 1000);
    });

    it('Scenario: Peak traffic - 50 concurrent requests', async () => {
      const responses = await makeConcurrentRequests(`${baseUrl}/api/csrf/token`, 50);

      // Most requests should succeed
      const successCount = responses.filter((r) => r.status === 200).length;
      expect(successCount).toBeGreaterThanOrEqual(45); // Allow for some rate limiting
    });

    it('Scenario: Burst traffic - 100 requests in 1 second', async () => {
      const startTime = Date.now();
      const responses = await makeConcurrentRequests(
        `${baseUrl}/api/csrf/token`,
        RATE_LIMIT_CONFIGS.burst.requests
      );
      const duration = Date.now() - startTime;

      // Should complete quickly
      expect(duration).toBeLessThan(2000);

      // Count successful requests
      const successCount = responses.filter((r) => r.status === 200).length;

      // At least 80% should succeed
      expect(successCount).toBeGreaterThanOrEqual(80);
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('Scenario: Request fails, user retries', async () => {
      // First request (may fail due to network)
      let response = await fetch(`${baseUrl}/api/csrf/token`);

      // If it failed, retry
      if (!response.ok) {
        await wait(1000);
        response = await fetch(`${baseUrl}/api/csrf/token`);
      }

      // Should eventually succeed
      expect(response.status).toBe(200);
    });

    it('Scenario: Token generation fails, system recovers', async () => {
      // Make multiple requests to ensure system is working
      const responses = await makeConcurrentRequests(`${baseUrl}/api/csrf/token`, 10);

      // All should succeed (system should be stable)
      const successCount = responses.filter((r) => r.status === 200).length;
      expect(successCount).toBe(10);
    });
  });

  describe('Security Scenarios', () => {
    it('Scenario: Attacker tries to predict tokens', async () => {
      // Get multiple tokens
      const tokens: string[] = [];
      for (let i = 0; i < 20; i++) {
        const response = await fetch(`${baseUrl}/api/csrf/token`);
        const body = await response.json();
        tokens.push(body.token);
      }

      // Tokens should not be predictable
      // Check for patterns
      for (let i = 1; i < tokens.length; i++) {
        const prev = tokens[i - 1];
        const curr = tokens[i];

        // Should not be sequential
        expect(curr).not.toBe(prev);

        // Should not have long common prefixes
        let commonPrefixLength = 0;
        for (let j = 0; j < Math.min(prev.length, curr.length); j++) {
          if (prev[j] === curr[j]) {
            commonPrefixLength++;
          } else {
            break;
          }
        }

        // Common prefix should be small (< 10 characters)
        expect(commonPrefixLength).toBeLessThan(10);
      }
    });

    it('Scenario: Attacker tries to reuse old token', async () => {
      // Get a token
      const response1 = await fetch(`${baseUrl}/api/csrf/token`);
      const body1 = await response1.json();
      const oldToken = body1.token;

      // Get a new token
      const response2 = await fetch(`${baseUrl}/api/csrf/token`);
      const body2 = await response2.json();
      const newToken = body2.token;

      // Try to use old token with new cookie
      const attackResponse = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': oldToken, // Old token
          'Cookie': `csrf-token=${newToken}`, // New cookie
        },
        body: JSON.stringify({
          email: 'attacker@example.com',
          password: 'password',
        }),
      });

      // Should be rejected for CSRF mismatch
      expect(attackResponse.status).toBe(403);
    });

    it('Scenario: Attacker floods server with token requests', async () => {
      // Make many requests rapidly
      const responses = await makeConcurrentRequests(`${baseUrl}/api/csrf/token`, 200);

      // System should handle gracefully (either succeed or rate limit)
      const successCount = responses.filter((r) => r.status === 200).length;
      const rateLimitedCount = responses.filter((r) => r.status === 429).length;

      // All requests should be either successful or rate limited
      expect(successCount + rateLimitedCount).toBe(200);

      // If rate limiting is active, some should be blocked
      // If not, all should succeed
      expect(successCount).toBeGreaterThan(0);
    });
  });

  describe('Performance Degradation Scenarios', () => {
    it('Scenario: System under heavy load maintains acceptable performance', async () => {
      const durations: number[] = [];

      // Make 50 requests and measure each
      for (let i = 0; i < 50; i++) {
        const { response, duration } = await measureRequestDuration(
          `${baseUrl}/api/csrf/token`
        );

        if (response.status === 200) {
          durations.push(duration);
        }
      }

      // Calculate percentiles
      durations.sort((a, b) => a - b);
      const p50 = durations[Math.floor(durations.length * 0.5)];
      const p95 = durations[Math.floor(durations.length * 0.95)];
      const p99 = durations[Math.floor(durations.length * 0.99)];

      // Performance should be acceptable
      expect(p50).toBeLessThan(50); // Median under 50ms
      expect(p95).toBeLessThan(200); // 95th percentile under 200ms
      expect(p99).toBeLessThan(500); // 99th percentile under 500ms
    });
  });

  describe('Cross-Origin Scenarios', () => {
    it('Scenario: Request from same origin', async () => {
      const response = await fetch(`${baseUrl}/api/csrf/token`, {
        headers: {
          'Origin': 'https://huntaze.com',
        },
      });

      expect(response.status).toBe(200);
    });

    it('Scenario: Request from subdomain', async () => {
      const response = await fetch(`${baseUrl}/api/csrf/token`, {
        headers: {
          'Origin': 'https://app.huntaze.com',
        },
      });

      expect(response.status).toBe(200);
    });

    it('Scenario: Request without Origin header', async () => {
      const response = await fetch(`${baseUrl}/api/csrf/token`);

      expect(response.status).toBe(200);
    });
  });

  describe('Cookie Handling Scenarios', () => {
    it('Scenario: User has existing CSRF cookie, requests new token', async () => {
      // Get first token
      const response1 = await fetch(`${baseUrl}/api/csrf/token`);
      const body1 = await response1.json();
      const token1 = body1.token;

      // Request new token with old cookie
      const response2 = await fetch(`${baseUrl}/api/csrf/token`, {
        headers: {
          'Cookie': `csrf-token=${token1}`,
        },
      });

      expect(response2.status).toBe(200);

      // Should get a new token
      const body2 = await response2.json();
      expect(body2.token).not.toBe(token1);

      // Cookie should be updated
      const setCookieHeader = response2.headers.get('set-cookie');
      expect(setCookieHeader).toBeTruthy();

      const newToken = extractTokenFromCookie(setCookieHeader!);
      expect(newToken).toBe(body2.token);
    });

    it('Scenario: User clears cookies and requests new token', async () => {
      // Request without any cookies
      const response = await fetch(`${baseUrl}/api/csrf/token`);

      expect(response.status).toBe(200);

      // Should get a token
      const body = await response.json();
      expect(body.token).toBeTruthy();

      // Cookie should be set
      const setCookieHeader = response.headers.get('set-cookie');
      expect(setCookieHeader).toBeTruthy();
    });
  });
});
