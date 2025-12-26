import { describe, it, expect } from 'vitest';

describe('Memory monitoring', () => {
  it('reports valid memory usage', () => {
    const usage = process.memoryUsage();

    expect(usage.heapUsed).toBeGreaterThan(0);
    expect(usage.heapTotal).toBeGreaterThan(0);
    expect(usage.rss).toBeGreaterThan(0);
    expect(usage.heapUsed).toBeLessThanOrEqual(usage.heapTotal);
  });

  it('supports explicit GC when available', () => {
    if (typeof global.gc !== 'function') {
      expect(true).toBe(true);
      return;
    }

    const before = process.memoryUsage().heapUsed;
    global.gc();
    const after = process.memoryUsage().heapUsed;

    expect(after).toBeLessThanOrEqual(before);
  });
});
