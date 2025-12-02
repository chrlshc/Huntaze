/**
 * Unit tests for Azure Disaster Recovery Service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  AzureDisasterRecoveryService,
  DRConfig
} from '../../../lib/ai/azure/azure-disaster-recovery.service';

describe('AzureDisasterRecoveryService', () => {
  let service: AzureDisasterRecoveryService;

  beforeEach(() => {
    service = new AzureDisasterRecoveryService();
  });

  describe('initialization', () => {
    it('should initialize with default configuration', () => {
      const config = service.getConfig();
      expect(config.rtoMinutes).toBe(15);
      expect(config.rpoMinutes).toBe(5);
      expect(config.primaryRegion).toBe('westeurope');
      expect(config.secondaryRegion).toBe('northeurope');
      expect(config.autoFailoverEnabled).toBe(true);
    });

    it('should accept custom configuration', () => {
      const customConfig: Partial<DRConfig> = {
        rtoMinutes: 10,
        primaryRegion: 'eastus',
        secondaryRegion: 'westus'
      };
      const customService = new AzureDisasterRecoveryService(customConfig);
      const config = customService.getConfig();
      
      expect(config.rtoMinutes).toBe(10);
      expect(config.primaryRegion).toBe('eastus');
      expect(config.secondaryRegion).toBe('westus');
    });

    it('should initialize with healthy status', () => {
      const status = service.getStatus();
      expect(status.healthy).toBe(true);
      expect(status.currentMode).toBe('normal');
    });

    it('should initialize region statuses', () => {
      const status = service.getStatus();
      expect(status.primaryRegionStatus.available).toBe(true);
      expect(status.secondaryRegionStatus.available).toBe(true);
    });
  });

  describe('failover', () => {
    it('should execute manual failover', async () => {
      const event = await service.failover('manual');

      expect(event.fromRegion).toBe('westeurope');
      expect(event.toRegion).toBe('northeurope');
      expect(event.trigger).toBe('manual');
      expect(event.success).toBe(true);
      expect(event.durationMs).toBeGreaterThan(0);
    });

    it('should swap regions after failover', async () => {
      await service.failover('manual');
      const config = service.getConfig();

      expect(config.primaryRegion).toBe('northeurope');
      expect(config.secondaryRegion).toBe('westeurope');
    });

    it('should track failover history', async () => {
      await service.failover('manual');
      const history = service.getFailoverHistory();

      expect(history.length).toBe(1);
      expect(history[0].trigger).toBe('manual');
    });

    it('should return to normal mode after successful failover', async () => {
      await service.failover('manual');
      const status = service.getStatus();

      expect(status.currentMode).toBe('normal');
    });
  });

  describe('DR testing', () => {
    it('should run DR test', async () => {
      const result = await service.runDRTest();

      expect(result.id).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(typeof result.passed).toBe('boolean');
      expect(result.failoverTimeMs).toBeGreaterThan(0);
      expect(result.recoveryTimeMs).toBeGreaterThan(0);
    });

    it('should verify data integrity during DR test', async () => {
      const result = await service.runDRTest();

      expect(result.dataIntegrityVerified).toBe(true);
    });

    it('should track recovered services', async () => {
      const result = await service.runDRTest();

      expect(Array.isArray(result.servicesRecovered)).toBe(true);
      expect(result.servicesRecovered.length).toBeGreaterThan(0);
    });

    it('should track DR test history', async () => {
      await service.runDRTest();
      const history = service.getDRTestHistory();

      expect(history.length).toBe(1);
    });

    it('should update last DR test status', async () => {
      await service.runDRTest();
      const status = service.getStatus();

      expect(status.lastDRTest).toBeDefined();
      expect(typeof status.lastDRTestPassed).toBe('boolean');
    });
  });


  describe('health checks', () => {
    it('should check health of all regions', async () => {
      const status = await service.checkHealth();

      expect(status.primaryRegionStatus).toBeDefined();
      expect(status.secondaryRegionStatus).toBeDefined();
      expect(status.lastHealthCheck).toBeDefined();
    });

    it('should check service health in regions', async () => {
      const status = await service.checkHealth();

      expect(status.primaryRegionStatus.services.length).toBeGreaterThan(0);
      expect(status.secondaryRegionStatus.services.length).toBeGreaterThan(0);
    });

    it('should update overall health status', async () => {
      const status = await service.checkHealth();

      expect(typeof status.healthy).toBe('boolean');
    });
  });

  describe('recovery procedures', () => {
    it('should have defined recovery procedures', () => {
      const procedures = service.getRecoveryProcedures();

      expect(procedures.length).toBeGreaterThan(0);
      expect(procedures[0].step).toBe(1);
    });

    it('should have all procedures in pending state initially', () => {
      const procedures = service.getRecoveryProcedures();

      for (const procedure of procedures) {
        expect(procedure.status).toBe('pending');
      }
    });

    it('should have estimated durations for procedures', () => {
      const procedures = service.getRecoveryProcedures();

      for (const procedure of procedures) {
        expect(procedure.estimatedDurationMs).toBeGreaterThan(0);
      }
    });
  });

  describe('RTO/RPO', () => {
    it('should return RTO in milliseconds', () => {
      const rtoMs = service.getRTOMs();
      expect(rtoMs).toBe(15 * 60 * 1000); // 15 minutes
    });

    it('should return RPO in milliseconds', () => {
      const rpoMs = service.getRPOMs();
      expect(rpoMs).toBe(5 * 60 * 1000); // 5 minutes
    });

    it('should check if RTO is met', () => {
      expect(service.isRTOMet(10 * 60 * 1000)).toBe(true); // 10 minutes
      expect(service.isRTOMet(20 * 60 * 1000)).toBe(false); // 20 minutes
    });
  });

  describe('configuration management', () => {
    it('should update configuration', () => {
      service.updateConfig({ rtoMinutes: 10 });
      const config = service.getConfig();
      
      expect(config.rtoMinutes).toBe(10);
    });

    it('should reset state', () => {
      service.reset();
      const status = service.getStatus();
      
      expect(status.healthy).toBe(true);
      expect(status.currentMode).toBe('normal');
      expect(status.lastDRTest).toBeNull();
    });
  });
});
