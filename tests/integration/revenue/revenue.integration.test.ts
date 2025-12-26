import { describe, it, expect } from 'vitest';
import { MOCK_STATS } from '@/tests/integration/fixtures/test-data';

describe('Revenue fixtures', () => {
  it('exposes non-negative revenue values', () => {
    for (const stats of Object.values(MOCK_STATS)) {
      expect(stats.revenue).toBeGreaterThanOrEqual(0);
    }
  });

  it('keeps revenue trends numeric', () => {
    for (const stats of Object.values(MOCK_STATS)) {
      expect(Number.isFinite(stats.revenueTrend)).toBe(true);
    }
  });
});
