#!/usr/bin/env node

/**
 * Build Log Health Monitor
 * 
 * Monitors build logs and provides health statistics including:
 * - Build success rate
 * - Average build time
 * - Error trends
 * - Layout count over time
 * - Bypass frequency
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';

interface BuildLogEntry {
  level: string;
  timestamp: string;
  message: string;
  data?: any;
}

interface BuildStats {
  success: boolean;
  duration: number;
  timestamp: string;
  errors?: number;
  warnings?: number;
}

interface HealthReport {
  period: string;
  totalBuilds: number;
  successfulBuilds: number;
  failedBuilds: number;
  successRate: number;
  averageBuildTime: number;
  totalErrors: number;
  totalWarnings: number;
  layoutCount: number;
  bypassCount: number;
  trends: {
    buildTimeChange: string;
    errorRateChange: string;
    layoutCountChange: string;
  };
  recentFailures: Array<{
    timestamp: string;
    errors: string[];
  }>;
}

class HealthMonitor {
  private buildLogsDir = '.kiro/build-logs';
  private bypassLogPath = '.kiro/build-logs/bypass-log.jsonl';
  private reportsDir = '.kiro/reports';

  async monitor(days: number = 7): Promise<HealthReport> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const buildStats = await this.collectBuildStats(cutoffDate);
    const bypassCount = await this.countBypasses(cutoffDate);
    const layoutCount = await this.getCurrentLayoutCount();
    const trends = await this.calculateTrends(buildStats, days);

    const successfulBuilds = buildStats.filter(b => b.success).length;
    const failedBuilds = buildStats.filter(b => !b.success).length;
    const totalBuilds = buildStats.length;

    const avgBuildTime = totalBuilds > 0
      ? buildStats.reduce((sum, b) => sum + b.duration, 0) / totalBuilds
      : 0;

    const totalErrors = buildStats.reduce((sum, b) => sum + (b.errors || 0), 0);
    const totalWarnings = buildStats.reduce((sum, b) => sum + (b.warnings || 0), 0);

    const recentFailures = buildStats
      .filter(b => !b.success)
      .slice(-5)
      .map(b => ({
        timestamp: b.timestamp,
        errors: [`Build failed with ${b.errors || 0} errors`]
      }));

    return {
      period: `Last ${days} days`,
      totalBuilds,
      successfulBuilds,
      failedBuilds,
      successRate: totalBuilds > 0 ? (successfulBuilds / totalBuilds) * 100 : 0,
      averageBuildTime: avgBuildTime,
      totalErrors,
      totalWarnings,
      layoutCount,
      bypassCount,
      trends,
      recentFailures
    };
  }

  private async collectBuildStats(cutoffDate: Date): Promise<BuildStats[]> {
    const stats: BuildStats[] = [];

    try {
      if (!existsSync(this.buildLogsDir)) {
        return stats;
      }

      const files = await fs.readdir(this.buildLogsDir);
      const logFiles = files.filter(f => f.endsWith('.log') && f !== 'latest.log');

      for (const file of logFiles) {
        const filePath = path.join(this.buildLogsDir, file);
        const fileStats = await fs.stat(filePath);

        if (fileStats.mtime < cutoffDate) {
          continue;
        }

        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.trim().split('\n').filter(l => l.trim());

        let buildSuccess = true;
        let buildDuration = 0;
        let errorCount = 0;
        let warningCount = 0;

        for (const line of lines) {
          try {
            const entry: BuildLogEntry = JSON.parse(line);

            if (entry.level === 'ERROR') {
              buildSuccess = false;
              errorCount++;
            }

            if (entry.level === 'WARN') {
              warningCount++;
            }

            if (entry.data?.duration) {
              buildDuration = entry.data.duration;
            }

            if (entry.data?.success !== undefined) {
              buildSuccess = entry.data.success;
            }
          } catch {
            // Skip invalid JSON lines
          }
        }

        stats.push({
          success: buildSuccess,
          duration: buildDuration,
          timestamp: fileStats.mtime.toISOString(),
          errors: errorCount,
          warnings: warningCount
        });
      }
    } catch (error) {
      console.error('Error collecting build stats:', error);
    }

    return stats.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  private async countBypasses(cutoffDate: Date): Promise<number> {
    try {
      if (!existsSync(this.bypassLogPath)) {
        return 0;
      }

      const content = await fs.readFile(this.bypassLogPath, 'utf-8');
      const lines = content.trim().split('\n').filter(l => l.trim());

      let count = 0;
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          const entryDate = new Date(entry.timestamp);
          if (entryDate >= cutoffDate) {
            count++;
          }
        } catch {
          // Skip invalid lines
        }
      }

      return count;
    } catch {
      return 0;
    }
  }

  private async getCurrentLayoutCount(): Promise<number> {
    try {
      const reportPath = path.join(this.reportsDir, 'layout-analysis.json');
      if (!existsSync(reportPath)) {
        return 0;
      }

      const content = await fs.readFile(reportPath, 'utf-8');
      const report = JSON.parse(content);
      return report.total || 0;
    } catch {
      return 0;
    }
  }

  private async calculateTrends(
    stats: BuildStats[],
    days: number
  ): Promise<HealthReport['trends']> {
    if (stats.length < 2) {
      return {
        buildTimeChange: 'N/A',
        errorRateChange: 'N/A',
        layoutCountChange: 'N/A'
      };
    }

    const midpoint = Math.floor(stats.length / 2);
    const firstHalf = stats.slice(0, midpoint);
    const secondHalf = stats.slice(midpoint);

    const avgTimeFirst = firstHalf.reduce((sum, s) => sum + s.duration, 0) / firstHalf.length;
    const avgTimeSecond = secondHalf.reduce((sum, s) => sum + s.duration, 0) / secondHalf.length;
    const timeChange = ((avgTimeSecond - avgTimeFirst) / avgTimeFirst) * 100;

    const errorRateFirst = firstHalf.filter(s => !s.success).length / firstHalf.length;
    const errorRateSecond = secondHalf.filter(s => !s.success).length / secondHalf.length;
    const errorChange = ((errorRateSecond - errorRateFirst) / (errorRateFirst || 1)) * 100;

    return {
      buildTimeChange: this.formatTrend(timeChange),
      errorRateChange: this.formatTrend(errorChange),
      layoutCountChange: 'N/A' // Would need historical data
    };
  }

  private formatTrend(change: number): string {
    if (isNaN(change) || !isFinite(change)) {
      return 'N/A';
    }

    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  }

  async generateDashboard(): Promise<string> {
    const report = await this.monitor(7);

    const dashboard = `
╔════════════════════════════════════════════════════════════════╗
║           Layout Cleanup System - Health Dashboard            ║
╠════════════════════════════════════════════════════════════════╣
║ Period: ${report.period.padEnd(52)} ║
╠════════════════════════════════════════════════════════════════╣
║ BUILD STATISTICS                                               ║
╠════════════════════════════════════════════════════════════════╣
║ Total Builds:        ${String(report.totalBuilds).padEnd(42)} ║
║ Successful:          ${String(report.successfulBuilds).padEnd(42)} ║
║ Failed:              ${String(report.failedBuilds).padEnd(42)} ║
║ Success Rate:        ${report.successRate.toFixed(1)}%${' '.repeat(38)} ║
║ Avg Build Time:      ${report.averageBuildTime.toFixed(1)}s${' '.repeat(38)} ║
╠════════════════════════════════════════════════════════════════╣
║ ERROR STATISTICS                                               ║
╠════════════════════════════════════════════════════════════════╣
║ Total Errors:        ${String(report.totalErrors).padEnd(42)} ║
║ Total Warnings:      ${String(report.totalWarnings).padEnd(42)} ║
╠════════════════════════════════════════════════════════════════╣
║ LAYOUT STATISTICS                                              ║
╠════════════════════════════════════════════════════════════════╣
║ Current Layouts:     ${String(report.layoutCount).padEnd(42)} ║
║ Hook Bypasses:       ${String(report.bypassCount).padEnd(42)} ║
╠════════════════════════════════════════════════════════════════╣
║ TRENDS                                                         ║
╠════════════════════════════════════════════════════════════════╣
║ Build Time:          ${report.trends.buildTimeChange.padEnd(42)} ║
║ Error Rate:          ${report.trends.errorRateChange.padEnd(42)} ║
║ Layout Count:        ${report.trends.layoutCountChange.padEnd(42)} ║
╠════════════════════════════════════════════════════════════════╣
║ HEALTH STATUS                                                  ║
╠════════════════════════════════════════════════════════════════╣
`;

    const healthStatus = this.getHealthStatus(report);
    const statusLines = healthStatus.split('\n');
    const dashboardLines = dashboard.split('\n');

    for (const line of statusLines) {
      dashboardLines.push(`║ ${line.padEnd(62)} ║`);
    }

    dashboardLines.push('╚════════════════════════════════════════════════════════════════╝');

    if (report.recentFailures.length > 0) {
      dashboardLines.push('');
      dashboardLines.push('Recent Failures:');
      for (const failure of report.recentFailures) {
        dashboardLines.push(`  • ${failure.timestamp}: ${failure.errors.join(', ')}`);
      }
    }

    return dashboardLines.join('\n');
  }

  private getHealthStatus(report: HealthReport): string {
    const issues: string[] = [];

    if (report.successRate < 80) {
      issues.push('⚠️  Low success rate (< 80%)');
    }

    if (report.averageBuildTime > 60) {
      issues.push('⚠️  Slow build times (> 60s)');
    }

    if (report.bypassCount > 5) {
      issues.push('⚠️  High bypass frequency (> 5)');
    }

    if (report.totalErrors > 10) {
      issues.push('⚠️  High error count (> 10)');
    }

    if (issues.length === 0) {
      return '✅ All systems healthy';
    }

    return issues.join('\n');
  }

  async saveReport(report: HealthReport): Promise<void> {
    try {
      await fs.mkdir(this.reportsDir, { recursive: true });
      const reportPath = path.join(this.reportsDir, 'health-report.json');
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n📊 Health report saved to ${reportPath}`);
    } catch (error) {
      console.error('Error saving health report:', error);
    }
  }
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  const days = args.includes('--days')
    ? parseInt(args[args.indexOf('--days') + 1] || '7')
    : 7;
  const jsonOutput = args.includes('--json');

  const monitor = new HealthMonitor();

  if (jsonOutput) {
    const report = await monitor.monitor(days);
    console.log(JSON.stringify(report, null, 2));
  } else {
    const dashboard = await monitor.generateDashboard();
    console.log(dashboard);

    const report = await monitor.monitor(days);
    await monitor.saveReport(report);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { HealthMonitor, HealthReport };
