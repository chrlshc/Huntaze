import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';

export type BaselineMetrics = {
  timestamp: string;
  heapUsed: number;
  heapTotal: number;
  rss: number;
};

export function captureBaselineMetrics(): BaselineMetrics {
  const usage = process.memoryUsage();
  return {
    timestamp: new Date().toISOString(),
    heapUsed: usage.heapUsed,
    heapTotal: usage.heapTotal,
    rss: usage.rss,
  };
}

export function writeBaselineMetrics(
  filePath: string,
  metrics: BaselineMetrics = captureBaselineMetrics()
) {
  const resolvedPath = resolve(filePath);
  mkdirSync(dirname(resolvedPath), { recursive: true });
  writeFileSync(resolvedPath, JSON.stringify(metrics, null, 2));
}
