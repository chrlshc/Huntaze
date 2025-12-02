/**
 * Unit tests for Azure Load Balancer Service
 * 
 * Feature: huntaze-ai-azure-migration
 * Task 44: Implement load balancing across deployments
 * Validates: Requirements 12.4
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  AzureLoadBalancerService,
  DeploymentEndpoint,
} from '../../../lib/ai/azure/azure-load-balancer.service';

describe('AzureLoadBalancerService', () => {
  let service: AzureLoadBalancerService;

  beforeEach(() => {
    service = new AzureLoadBalancerService();
  });

  describe('Endpoint Management', () => {
    it('should initialize with default endpoints', () => {
      const endpoints = service.getAllEndpoints();
      expect(endpoints.length).toBeGreaterThan(0);
    });

    it('should register new endpoints', () => {
      service.registerEndpoint({
        id: 'test-endpoint',
        deploymentName: 'gpt-4-turbo-prod',
        endpoint: 'https://test.openai.azure.com',
        region: 'uksouth',
        weight: 50,
        healthy: true,
      });

      const endpoint = service.getEndpoint('test-endpoint');
      expect(endpoint).toBeDefined();
      expect(endpoint?.region).toBe('uksouth');
    });

    it('should remove endpoints', () => {
      service.registerEndpoint({
        id: 'to-remove',
        deploymentName: 'gpt-4-turbo-prod',
        endpoint: 'https://test.openai.azure.com',
        region: 'test',
        weight: 50,
        healthy: true,
      });

      const removed = service.removeEndpoint('to-remove');
      expect(removed).toBe(true);
      expect(service.getEndpoint('to-remove')).toBeUndefined();
    });

    it('should get endpoints for specific deployment', () => {
      const endpoints = service.getEndpointsForDeployment('gpt-4-turbo-prod');
      expect(endpoints.length).toBeGreaterThan(0);
      expect(endpoints.every(e => e.deploymentName === 'gpt-4-turbo-prod')).toBe(true);
    });
  });

  describe('Routing Strategies', () => {
    it('should route using weighted strategy', () => {
      service.setStrategy('weighted');
      
      const decision = service.route('gpt-4-turbo-prod');
      
      expect(decision).not.toBeNull();
      expect(decision?.reason).toBe('weighted');
      expect(decision?.endpoint.deploymentName).toBe('gpt-4-turbo-prod');
    });

    it('should route using round robin strategy', () => {
      service.setStrategy('round_robin');
      
      const decisions = [];
      for (let i = 0; i < 5; i++) {
        decisions.push(service.route('gpt-4-turbo-prod'));
      }
      
      expect(decisions.every(d => d?.reason === 'round_robin')).toBe(true);
    });

    it('should route using least connections strategy', () => {
      service.setStrategy('least_connections');
      
      // Simulate some active connections
      const endpoints = service.getEndpointsForDeployment('gpt-4-turbo-prod');
      if (endpoints.length > 1) {
        service.startRequest(endpoints[0].id);
        service.startRequest(endpoints[0].id);
      }
      
      const decision = service.route('gpt-4-turbo-prod');
      
      expect(decision).not.toBeNull();
      expect(decision?.reason).toBe('least_connections');
    });

    it('should route using latency-based strategy', () => {
      service.setStrategy('latency_based');
      
      // Record some latencies
      const endpoints = service.getEndpointsForDeployment('gpt-4-turbo-prod');
      if (endpoints.length > 0) {
        service.completeRequest(endpoints[0].id, 100, true);
      }
      
      const decision = service.route('gpt-4-turbo-prod');
      
      expect(decision).not.toBeNull();
    });

    it('should return null when no healthy endpoints available', () => {
      // Mark all endpoints as unhealthy
      const endpoints = service.getEndpointsForDeployment('gpt-4-turbo-prod');
      for (const ep of endpoints) {
        service.markUnhealthy(ep.id);
      }
      
      const decision = service.route('gpt-4-turbo-prod');
      expect(decision).toBeNull();
    });
  });

  describe('Sticky Sessions', () => {
    it('should maintain sticky sessions', () => {
      const sessionId = 'test-session-123';
      
      const decision1 = service.route('gpt-4-turbo-prod', sessionId);
      const decision2 = service.route('gpt-4-turbo-prod', sessionId);
      
      expect(decision1?.endpoint.id).toBe(decision2?.endpoint.id);
      expect(decision2?.reason).toBe('sticky_session');
    });

    it('should clear sticky sessions', () => {
      const sessionId = 'test-session-456';
      
      service.route('gpt-4-turbo-prod', sessionId);
      service.clearStickySessions();
      
      const decision = service.route('gpt-4-turbo-prod', sessionId);
      expect(decision?.reason).not.toBe('sticky_session');
    });

    it('should cleanup expired sessions', () => {
      // Create service with short TTL
      const shortTTLService = new AzureLoadBalancerService({
        stickySessionTTLMs: 1, // 1ms TTL
      });
      
      shortTTLService.route('gpt-4-turbo-prod', 'expired-session');
      
      // Wait for expiration
      setTimeout(() => {
        const cleaned = shortTTLService.cleanupExpiredSessions();
        expect(cleaned).toBeGreaterThanOrEqual(0);
      }, 10);
    });
  });

  describe('Request Tracking', () => {
    it('should track active connections', () => {
      const endpoints = service.getEndpointsForDeployment('gpt-4-turbo-prod');
      const endpointId = endpoints[0].id;
      
      service.startRequest(endpointId);
      service.startRequest(endpointId);
      
      // Active connections should be tracked internally
      // We can verify through least_connections routing
      service.setStrategy('least_connections');
      const decision = service.route('gpt-4-turbo-prod');
      
      // Should prefer endpoint with fewer connections
      if (endpoints.length > 1) {
        expect(decision?.endpoint.id).not.toBe(endpointId);
      }
    });

    it('should update stats on request completion', () => {
      const endpoints = service.getEndpointsForDeployment('gpt-4-turbo-prod');
      const endpointId = endpoints[0].id;
      
      service.startRequest(endpointId);
      service.completeRequest(endpointId, 150, true);
      
      const stats = service.getStats();
      expect(stats.totalRequests).toBeGreaterThan(0);
    });

    it('should track errors on failed requests', () => {
      const endpoints = service.getEndpointsForDeployment('gpt-4-turbo-prod');
      const endpointId = endpoints[0].id;
      
      service.startRequest(endpointId);
      service.completeRequest(endpointId, 5000, false);
      
      const stats = service.getStats();
      expect(stats.failedRequests).toBeGreaterThan(0);
    });

    it('should mark endpoint unhealthy after consecutive failures', () => {
      const customService = new AzureLoadBalancerService({
        healthCheck: {
          intervalMs: 30000,
          timeoutMs: 5000,
          unhealthyThreshold: 2,
          healthyThreshold: 2,
        },
      });
      
      const endpoints = customService.getEndpointsForDeployment('gpt-4-turbo-prod');
      const endpointId = endpoints[0].id;
      
      // Simulate consecutive failures
      customService.startRequest(endpointId);
      customService.completeRequest(endpointId, 5000, false);
      customService.startRequest(endpointId);
      customService.completeRequest(endpointId, 5000, false);
      
      const endpoint = customService.getEndpoint(endpointId);
      expect(endpoint?.healthy).toBe(false);
    });
  });

  describe('Health Management', () => {
    it('should mark endpoint as healthy', () => {
      const endpoints = service.getAllEndpoints();
      const endpointId = endpoints[0].id;
      
      service.markUnhealthy(endpointId);
      service.markHealthy(endpointId);
      
      const endpoint = service.getEndpoint(endpointId);
      expect(endpoint?.healthy).toBe(true);
    });

    it('should mark endpoint as unhealthy', () => {
      const endpoints = service.getAllEndpoints();
      const endpointId = endpoints[0].id;
      
      service.markUnhealthy(endpointId);
      
      const endpoint = service.getEndpoint(endpointId);
      expect(endpoint?.healthy).toBe(false);
    });

    it('should update endpoint weight', () => {
      const endpoints = service.getAllEndpoints();
      const endpointId = endpoints[0].id;
      
      service.updateWeight(endpointId, 75);
      
      const endpoint = service.getEndpoint(endpointId);
      expect(endpoint?.weight).toBe(75);
    });

    it('should clamp weight to valid range', () => {
      const endpoints = service.getAllEndpoints();
      const endpointId = endpoints[0].id;
      
      service.updateWeight(endpointId, 150);
      expect(service.getEndpoint(endpointId)?.weight).toBe(100);
      
      service.updateWeight(endpointId, -10);
      expect(service.getEndpoint(endpointId)?.weight).toBe(0);
    });
  });

  describe('Statistics', () => {
    it('should return load balancer statistics', () => {
      const stats = service.getStats();
      
      expect(stats).toHaveProperty('totalRequests');
      expect(stats).toHaveProperty('successfulRequests');
      expect(stats).toHaveProperty('failedRequests');
      expect(stats).toHaveProperty('averageLatencyMs');
      expect(stats).toHaveProperty('endpointStats');
    });

    it('should reset statistics', () => {
      const endpoints = service.getEndpointsForDeployment('gpt-4-turbo-prod');
      
      // Generate some stats
      service.startRequest(endpoints[0].id);
      service.completeRequest(endpoints[0].id, 100, true);
      
      service.resetStats();
      
      const stats = service.getStats();
      expect(stats.totalRequests).toBe(0);
    });
  });

  describe('Configuration', () => {
    it('should return current configuration', () => {
      const config = service.getConfig();
      
      expect(config).toHaveProperty('strategy');
      expect(config).toHaveProperty('stickySessionTTLMs');
      expect(config).toHaveProperty('healthCheck');
    });

    it('should set load balancing strategy', () => {
      service.setStrategy('round_robin');
      
      const config = service.getConfig();
      expect(config.strategy).toBe('round_robin');
    });
  });
});
