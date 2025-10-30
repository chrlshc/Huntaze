/**
 * OnlyFans Production Readiness Validation Tests
 * Validates that all critical production files exist
 */

import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';

describe('🚀 OnlyFans Production Readiness', () => {
  const root = process.cwd();

  describe('📊 Monitoring & Metrics', () => {
    it('should have metrics module', () => {
      expect(existsSync(join(root, 'lib/monitoring/onlyfans-metrics.ts'))).toBe(true);
    });

    it('should have metrics API endpoint', () => {
      expect(existsSync(join(root, 'app/api/metrics/route.ts'))).toBe(true);
    });

    it('should have Grafana dashboard', () => {
      expect(existsSync(join(root, 'grafana/dashboards/onlyfans.json'))).toBe(true);
    });

    it('should have Alertmanager rules', () => {
      expect(existsSync(join(root, 'alerting/onlyfans-alerts.yml'))).toBe(true);
    });
  });

  describe('🔧 Service Layer', () => {
    it('should have OnlyFans service', () => {
      expect(existsSync(join(root, 'lib/services/onlyfans/service.ts'))).toBe(true);
    });

    it('should have gateway types', () => {
      expect(existsSync(join(root, 'lib/services/onlyfans/types.ts'))).toBe(true);
    });

    it('should have mock adapter', () => {
      expect(existsSync(join(root, 'lib/services/onlyfans/adapters/mock.ts'))).toBe(true);
    });

    it('should have rate limiter', () => {
      expect(existsSync(join(root, 'lib/utils/rate-limiter.ts'))).toBe(true);
    });
  });

  describe('🧪 Testing', () => {
    it('should have E2E integration tests', () => {
      expect(existsSync(join(root, 'tests/e2e/onlyfans-integration.e2e.test.ts'))).toBe(true);
    });

    it('should have load testing scripts', () => {
      expect(existsSync(join(root, 'tests/load/onlyfans-campaign.load.test.js'))).toBe(true);
    });
  });

  describe('📚 Documentation', () => {
    it('should have DR runbook', () => {
      expect(existsSync(join(root, 'docs/DR_RUNBOOK.md'))).toBe(true);
    });

    it('should have production readiness checklist', () => {
      expect(existsSync(join(root, 'docs/ONLYFANS_PRODUCTION_READINESS.md'))).toBe(true);
    });

    it('should have gaps resolution report', () => {
      expect(existsSync(join(root, 'docs/ONLYFANS_GAPS_RESOLVED.md'))).toBe(true);
    });

    it('should have OpenAPI generator', () => {
      expect(existsSync(join(root, 'lib/api-docs/openapi.ts'))).toBe(true);
    });
  });

  describe('🎛️ Feature Flags', () => {
    it('should have feature flags module', () => {
      expect(existsSync(join(root, 'lib/features/flags.ts'))).toBe(true);
    });
  });

  describe('📈 Complete System', () => {
    it('should have all critical production files', () => {
      const criticalFiles = [
        'lib/monitoring/onlyfans-metrics.ts',
        'lib/services/onlyfans/service.ts',
        'lib/services/onlyfans/types.ts',
        'lib/services/onlyfans/adapters/mock.ts',
        'lib/utils/rate-limiter.ts',
        'app/api/metrics/route.ts',
        'grafana/dashboards/onlyfans.json',
        'alerting/onlyfans-alerts.yml',
        'tests/e2e/onlyfans-integration.e2e.test.ts',
        'tests/load/onlyfans-campaign.load.test.js',
        'docs/DR_RUNBOOK.md',
        'docs/ONLYFANS_PRODUCTION_READINESS.md',
        'lib/features/flags.ts',
      ];

      const existing = criticalFiles.filter(f => existsSync(join(root, f)));
      expect(existing.length).toBe(criticalFiles.length);
    });
  });
});
