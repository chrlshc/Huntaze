/**
 * Unit tests for Azure Regional Failover Service
 * 
 * Feature: huntaze-ai-azure-migration
 * Task 45: Implement regional failover
 * Validates: Requirements 12.5
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  AzureRegionalFailoverService,
  RegionConfig,
} from '../../../lib/ai/azure/azure-regional-failover.service';

describe('AzureRegionalFailoverService', () => {
  let service: AzureRegionalFailoverService;

  beforeEach(() => {
    service = new AzureRegionalFailoverService();
  });

  describe('Region Configuration', () => {
    it('should initialize with default regions', () => {
      const regions = service.getAllRegions();
      expect(regions.length).toBeGreaterThan(0);
      
      const westEurope = regions.find(r => r.id === 'westeurope');
      expect(westEurope).toBeDefined();
      expect(westEurope?.priority).toBe(1);
    });

    it('should have West Europe as primary region', () => {
      const activeRegion = service.getActiveRegion();
      expect(activeRegion?.id).toBe('westeurope');
      expect(activeRegion?.isActive).toBe(true);
    });

    it('should register new regions', () => {
      service.registerRegion({
        id: 'uksouth',
        name: 'UK South',
        endpoint: 'https://huntaze-ai-uksouth.openai.azure.com',
        priority: 4,
        healthy: true,
      });

      const region = service.getRegion('uksouth');
      expect(region).toBeDefined();
      expect(region?.name).toBe('UK South');
    });
  });

  describe('Health Monitoring', () => {
    it('should record healthy health checks', () => {
      const event = service.recordHealthCheck('westeurope', true, 50);
      
      const region = service.getRegion('westeurope');
      expect(region?.healthy).toBe(true);
      expect(region?.consecutiveFailures).toBe(0);
      expect(event).toBeNull(); // No failover needed
    });

    it('should track consecutive failures', () => {
      service.recordHealthCheck('westeurope', false, 5000);
      service.recordHealthCheck('westeurope', false, 5000);
      
      const region = service.getRegion('westeurope');
      expect(region?.consecutiveFailures).toBe(2);
    });

    it('should trigger failover after threshold failures', () => {
      // Fail health checks to trigger failover
      service.recordHealthCheck('westeurope', false, 5000);
      service.recordHealthCheck('westeurope', false, 5000);
      const event = service.recordHealthCheck('westeurope', false, 5000);
      
      expect(event).not.toBeNull();
      expect(event?.fromRegion).toBe('westeurope');
      expect(event?.toRegion).toBe('northeurope'); // Next priority
      expect(event?.automatic).toBe(true);
    });

    it('should update latency with exponential moving average', () => {
      const region = service.getRegion('westeurope');
      const initialLatency = region?.latencyMs || 0;
      
      service.recordHealthCheck('westeurope', true, 100);
      service.recordHealthCheck('westeurope', true, 200);
      
      const updatedRegion = service.getRegion('westeurope');
      expect(updatedRegion?.latencyMs).toBeGreaterThan(0);
    });
  });

  describe('Failover Behavior', () => {
    it('should failover to next priority region', () => {
      const event = service.triggerFailover('westeurope', 'Test failover');
      
      expect(event).not.toBeNull();
      expect(event?.toRegion).toBe('northeurope');
      expect(service.getActiveRegion()?.id).toBe('northeurope');
    });

    it('should update region states on failover', () => {
      service.triggerFailover('westeurope', 'Test failover');
      
      const westEurope = service.getRegion('westeurope');
      const northEurope = service.getRegion('northeurope');
      
      expect(westEurope?.isActive).toBe(false);
      expect(northEurope?.isActive).toBe(true);
    });

    it('should return null if no healthy regions available', () => {
      // Mark all regions as unhealthy
      service.markUnhealthy('northeurope');
      service.markUnhealthy('francecentral');
      
      const event = service.triggerFailover('westeurope', 'No healthy regions');
      expect(event).toBeNull();
    });

    it('should skip unhealthy regions during failover', () => {
      service.markUnhealthy('northeurope');
      
      const event = service.triggerFailover('westeurope', 'Skip unhealthy');
      
      expect(event?.toRegion).toBe('francecentral');
    });
  });

  describe('Manual Failover', () => {
    it('should allow manual failover to specific region', () => {
      const event = service.manualFailover('northeurope', 'Manual test');
      
      expect(event).not.toBeNull();
      expect(event?.automatic).toBe(false);
      expect(event?.toRegion).toBe('northeurope');
      expect(service.getActiveRegion()?.id).toBe('northeurope');
    });

    it('should return null when failing over to same region', () => {
      const event = service.manualFailover('westeurope', 'Same region');
      expect(event).toBeNull();
    });

    it('should return null for non-existent region', () => {
      const event = service.manualFailover('nonexistent', 'Invalid region');
      expect(event).toBeNull();
    });
  });

  describe('Failback', () => {
    it('should not failback before delay period', () => {
      // Trigger failover first
      service.triggerFailover('westeurope', 'Initial failover');
      
      // Try to trigger failback immediately
      const event = service.recordHealthCheck('westeurope', true, 50);
      
      // Should not failback due to delay
      expect(event).toBeNull();
    });

    it('should require consecutive healthy checks for failback', () => {
      const customService = new AzureRegionalFailoverService({
        failbackDelayMs: 0, // No delay for testing
        failbackThreshold: 3,
      });

      // Trigger failover
      customService.triggerFailover('westeurope', 'Initial failover');
      
      // Only 2 healthy checks (below threshold of 3)
      customService.recordHealthCheck('westeurope', true, 50);
      const event = customService.recordHealthCheck('westeurope', true, 50);
      
      // Should not failback yet
      expect(event).toBeNull();
    });
  });

  describe('Region Health Management', () => {
    it('should mark region as healthy', () => {
      service.markUnhealthy('westeurope');
      service.markHealthy('westeurope');
      
      const region = service.getRegion('westeurope');
      expect(region?.healthy).toBe(true);
      expect(region?.consecutiveFailures).toBe(0);
    });

    it('should mark region as unhealthy', () => {
      service.markUnhealthy('westeurope');
      
      const region = service.getRegion('westeurope');
      expect(region?.healthy).toBe(false);
    });

    it('should get healthy regions only', () => {
      service.markUnhealthy('northeurope');
      
      const healthyRegions = service.getHealthyRegions();
      expect(healthyRegions.find(r => r.id === 'northeurope')).toBeUndefined();
    });
  });

  describe('Status Summary', () => {
    it('should return complete status summary', () => {
      const summary = service.getStatusSummary();
      
      expect(summary.activeRegion).toBe('westeurope');
      expect(summary.regions.length).toBeGreaterThan(0);
      expect(summary.regions[0]).toHaveProperty('id');
      expect(summary.regions[0]).toHaveProperty('healthy');
      expect(summary.regions[0]).toHaveProperty('isActive');
    });

    it('should include last failover event', () => {
      service.triggerFailover('westeurope', 'Test');
      
      const summary = service.getStatusSummary();
      expect(summary.lastFailover).not.toBeNull();
      expect(summary.lastFailover?.fromRegion).toBe('westeurope');
    });
  });

  describe('Availability Calculation', () => {
    it('should calculate 100% availability with no history', () => {
      const availability = service.calculateAvailability('westeurope');
      expect(availability).toBe(100);
    });

    it('should calculate availability based on health history', () => {
      // Add mixed health checks
      service.recordHealthCheck('westeurope', true, 50);
      service.recordHealthCheck('westeurope', true, 50);
      service.recordHealthCheck('westeurope', false, 5000);
      service.recordHealthCheck('westeurope', true, 50);
      
      const availability = service.calculateAvailability('westeurope');
      expect(availability).toBe(75); // 3 out of 4 healthy
    });
  });

  describe('Average Latency', () => {
    it('should return 0 with no history', () => {
      const latency = service.getAverageLatency('westeurope');
      expect(latency).toBe(0);
    });

    it('should calculate average latency from healthy checks', () => {
      service.recordHealthCheck('westeurope', true, 100);
      service.recordHealthCheck('westeurope', true, 200);
      service.recordHealthCheck('westeurope', true, 300);
      
      const latency = service.getAverageLatency('westeurope');
      expect(latency).toBe(200); // Average of 100, 200, 300
    });
  });

  describe('Configuration', () => {
    it('should return current configuration', () => {
      const config = service.getConfig();
      
      expect(config.healthCheckIntervalMs).toBeDefined();
      expect(config.failoverThreshold).toBeDefined();
      expect(config.enableAutoFailback).toBeDefined();
    });

    it('should update configuration', () => {
      service.updateConfig({ failoverThreshold: 5 });
      
      const config = service.getConfig();
      expect(config.failoverThreshold).toBe(5);
    });

    it('should update region priority', () => {
      service.updatePriority('northeurope', 1);
      
      const region = service.getRegion('northeurope');
      expect(region?.priority).toBe(1);
    });
  });

  describe('Failover Events', () => {
    it('should store failover events', () => {
      service.triggerFailover('westeurope', 'Test 1');
      service.manualFailover('francecentral', 'Test 2');
      
      const events = service.getFailoverEvents();
      expect(events.length).toBe(2);
    });

    it('should limit failover events history', () => {
      // Trigger many failovers
      for (let i = 0; i < 150; i++) {
        service.manualFailover(i % 2 === 0 ? 'northeurope' : 'westeurope', `Test ${i}`);
      }
      
      const events = service.getFailoverEvents();
      expect(events.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Reset Stats', () => {
    it('should reset all statistics', () => {
      service.recordHealthCheck('westeurope', true, 100);
      service.recordHealthCheck('westeurope', false, 5000);
      
      service.resetStats();
      
      const region = service.getRegion('westeurope');
      expect(region?.consecutiveFailures).toBe(0);
      expect(region?.latencyMs).toBe(0);
    });
  });
});
