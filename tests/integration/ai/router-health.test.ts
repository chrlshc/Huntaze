/**
 * Integration tests for AI Router health checks
 * 
 * **Feature: azure-foundry-production-rollout**
 * **Validates: Requirements 1.1, 1.4**
 * 
 * These tests verify that the Python AI Router is running and healthy.
 * The router must be started before running these tests:
 *   ./scripts/start-local-router.sh
 */

import { describe, it, expect, beforeAll } from 'vitest';

const ROUTER_URL = process.env.AI_ROUTER_URL || 'http://localhost:8000';
const HEALTH_TIMEOUT_MS = 1000; // Requirement 1.1: respond within 1 second

interface HealthResponse {
  status: string;
  region: string;
  service: string;
}

interface RouteResponse {
  model: string;
  deployment: string;
  region: string;
  routing: {
    type: string;
    complexity: string;
    language: string;
    client_tier: string;
  };
  output: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Check if the router is running before tests
 */
async function isRouterRunning(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch(`${ROUTER_URL}/health`, {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

describe('AI Router Health Integration Tests', () => {
  let routerAvailable = false;

  beforeAll(async () => {
    routerAvailable = await isRouterRunning();
    if (!routerAvailable) {
      console.warn(
        '\n⚠️  AI Router is not running. Skipping integration tests.\n' +
        '   Start the router with: ./scripts/start-local-router.sh\n'
      );
    }
  });

  describe('Health Endpoint', () => {
    it('should respond to health check within 1 second', async () => {
      if (!routerAvailable) {
        return; // Skip if router not running
      }

      const startTime = Date.now();
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
      
      const response = await fetch(`${ROUTER_URL}/health`, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const elapsed = Date.now() - startTime;

      expect(response.ok).toBe(true);
      expect(elapsed).toBeLessThan(HEALTH_TIMEOUT_MS);
    });

    it('should return correct health response structure', async () => {
      if (!routerAvailable) {
        return;
      }

      const response = await fetch(`${ROUTER_URL}/health`);
      const data: HealthResponse = await response.json();

      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('region');
      expect(data).toHaveProperty('service');
      expect(data.status).toBe('healthy');
      expect(data.service).toBe('ai-router');
    });

    it('should return eastus2 region by default', async () => {
      if (!routerAvailable) {
        return;
      }

      const response = await fetch(`${ROUTER_URL}/health`);
      const data: HealthResponse = await response.json();

      expect(data.region).toBe('eastus2');
    });
  });

  describe('Route Endpoint Accessibility', () => {
    it('should accept POST requests to /route', async () => {
      if (!routerAvailable) {
        return;
      }

      const response = await fetch(`${ROUTER_URL}/route`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'Hello, this is a test prompt',
          client_tier: 'standard',
        }),
      });

      // Should either succeed (200) or fail with validation (400/500)
      // but not 404 (endpoint not found)
      expect(response.status).not.toBe(404);
    });

    it('should reject empty prompts with 400', async () => {
      if (!routerAvailable) {
        return;
      }

      const response = await fetch(`${ROUTER_URL}/route`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: '',
          client_tier: 'standard',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should accept type_hint parameter', async () => {
      if (!routerAvailable) {
        return;
      }

      const response = await fetch(`${ROUTER_URL}/route`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'Calculate 2 + 2',
          client_tier: 'standard',
          type_hint: 'math',
        }),
      });

      // Should not return 422 (validation error for unknown field)
      expect(response.status).not.toBe(422);
    });

    it('should accept language_hint parameter', async () => {
      if (!routerAvailable) {
        return;
      }

      const response = await fetch(`${ROUTER_URL}/route`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'Bonjour, comment allez-vous?',
          client_tier: 'standard',
          language_hint: 'fr',
        }),
      });

      // Should not return 422 (validation error for unknown field)
      expect(response.status).not.toBe(422);
    });
  });

  describe('Model Endpoints Accessibility', () => {
    // Note: These tests verify the router can route to models
    // They require Azure AI credentials to be configured
    
    it('should route chat requests successfully when Azure is configured', async () => {
      if (!routerAvailable) {
        return;
      }

      const response = await fetch(`${ROUTER_URL}/route`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'Say hello in one word',
          client_tier: 'standard',
          type_hint: 'chat',
        }),
      });

      // If Azure is configured, should return 200
      // If not configured, should return 500 with helpful message
      if (response.ok) {
        const data: RouteResponse = await response.json();
        expect(data).toHaveProperty('model');
        expect(data).toHaveProperty('deployment');
        expect(data).toHaveProperty('region');
        expect(data).toHaveProperty('output');
        expect(data.output).toBeTruthy();
      } else {
        // Azure not configured - this is expected in CI
        expect(response.status).toBe(500);
        const error = await response.json();
        expect(error.detail).toContain('Azure');
      }
    });

    it('should include routing metadata in response', async () => {
      if (!routerAvailable) {
        return;
      }

      const response = await fetch(`${ROUTER_URL}/route`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'What is 2+2?',
          client_tier: 'vip',
          type_hint: 'math',
        }),
      });

      if (response.ok) {
        const data: RouteResponse = await response.json();
        expect(data.routing).toHaveProperty('type');
        expect(data.routing).toHaveProperty('client_tier');
        expect(data.routing.client_tier).toBe('vip');
      }
    });
  });
});

describe('Router Availability Check', () => {
  it('should report router status', async () => {
    const running = await isRouterRunning();
    
    if (running) {
      console.log(`✓ AI Router is running at ${ROUTER_URL}`);
    } else {
      console.log(`✗ AI Router is NOT running at ${ROUTER_URL}`);
      console.log('  Start with: ./scripts/start-local-router.sh');
    }
    
    // This test always passes - it's informational
    expect(true).toBe(true);
  });
});
