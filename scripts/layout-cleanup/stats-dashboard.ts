#!/usr/bin/env node

/**
 * Statistics Dashboard
 * 
 * Provides real-time statistics about:
 * - Layout counts (total, redundant, necessary, review)
 * - Build performance metrics
 * - Cleanup history
 * - System health indicators
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';
import { LayoutAnalyzer } from './layout-analyzer';

interface DashboardStats {
  layouts: {
    total: number;
    redundant: number;
    necessary: number;
    review: number;
    lastAnalysis: string | null;
  };
  builds: {
    averageTime: number;
    lastBuildTime: number;
    lastBuildStatus: 'success' | 'failure' | 'unknown';
    lastBuildDate: string | null;
  };
  cleanup: {
    totalRemoved: number;
    lastCleanupDate: string | null;
    backupCount: number;
    backupSize: number;
  };
  health: {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  };
}

class StatsDashboard {
  private reportsDir = '.kiro/reports';
  private buildLogsDir = '.kiro/build-logs';
  private backupsDir = '.kiro/backups/layouts';

  async generateStats(): Promise<DashboardStats> {
    const [layouts, builds, cleanup] = await Promise.all([
      this.getLayoutStats(),
      this.getBuildStats(),
      this.getCleanupStats()
    ]);

    const health = this.assessHealth(layouts, builds, cleanup);

    return {
      layouts,
      builds,
      cleanup,
      health
    };
  }

  private async getLayoutStats(): Promise<DashboardStats['layouts']> {
    try {
      const reportPath = path.join(this.reportsDir, 'layout-analysis.json');
      
      if (!existsSync(reportPath)) {
        // Run analysis if no report exists
        const analyzer = new LayoutAnalyzer();
        const report = await analyzer.analyzeAll();
        
        return {
          total: report.total,
          redundant: report.redundant.length,
          necessary: report.necessary.length,
          review: report.review.length,
          lastAnalysis: report.timestamp
        };
      }

      const content = await fs.readFile(reportPath, 'utf-8');
      const report = JSON.parse(content);
      const stats = await fs.stat(reportPath);

      return {
        total: report.total || 0,
        redundant: report.redundant?.length || 0,
        necessary: report.necessary?.length || 0,
        review: report.review?.length || 0,
        lastAnalysis: stats.mtime.toISOString()
      };
    } catch (error) {
      return {
        total: 0,
        redundant: 0,
        necessary: 0,
        review: 0,
        lastAnalysis: null
      };
    }
  }

  private async getBuildStats(): Promise<DashboardStats['builds']> {
    try {
      if (!existsSync(this.buildLogsDir)) {
        return {
          averageTime: 0,
          lastBuildTime: 0,
          lastBuildStatus: 'unknown',
          lastBuildDate: null
        };
      }

      const files = await fs.readdir(this.buildLogsDir);
      const logFiles = files
        .filter(f => f.endsWith('.log') && f !== 'latest.log')
        .sort()
        .reverse();

      if (logFiles.length === 0) {
        return {
          averageTime: 0,
          lastBuildTime: 0,
          lastBuildStatus: 'unknown',
          lastBuildDate: null
        };
      }

      // Get last build info
      const lastLogPath = path.join(this.buildLogsDir, logFiles[0]);
      const lastLogContent = await fs.readFile(lastLogPath, 'utf-8');
      const lastLogLines = lastLogContent.trim().split('\n').filter(l => l.trim());

      let lastBuildTime = 0;
      let lastBuildStatus: 'success' | 'failure' | 'unknown' = 'unknown';
      let lastBuildDate: string | null = null;

      for (const line of lastLogLines) {
        try {
          const entry = JSON.parse(line);
          if (entry.data?.duration) {
            lastBuildTime = entry.data.duration;
          }
          if (entry.data?.success !== undefined) {
            lastBuildStatus = entry.data.success ? 'success' : 'failure';
          }
          if (entry.timestamp) {
            lastBuildDate = entry.timestamp;
          }
        } catch {
          // Skip invalid lines
        }
      }

      // Calculate average time from recent builds
      const recentLogs = logFiles.slice(0, 10);
      let totalTime = 0;
      let buildCount = 0;

      for (const logFile of recentLogs) {
        const logPath = path.join(this.buildLogsDir, logFile);
        const content = await fs.readFile(logPath, 'utf-8');
        const lines = content.trim().split('\n').filter(l => l.trim());

        for (const line of lines) {
          try {
            const entry = JSON.parse(line);
            if (entry.data?.duration) {
              totalTime += entry.data.duration;
              buildCount++;
              break; // Only count once per log file
            }
          } catch {
            // Skip invalid lines
          }
        }
      }

      const averageTime = buildCount > 0 ? totalTime / buildCount : 0;

      return {
        averageTime,
        lastBuildTime,
        lastBuildStatus,
        lastBuildDate
      };
    } catch (error) {
      return {
        averageTime: 0,
        lastBuildTime: 0,
        lastBuildStatus: 'unknown',
        lastBuildDate: null
      };
    }
  }

  private async getCleanupStats(): Promise<DashboardStats['cleanup']> {
    try {
      const cleanupReportPath = path.join(this.reportsDir, 'cleanup-report.json');
      let totalRemoved = 0;
      let lastCleanupDate: string | null = null;

      if (existsSync(cleanupReportPath)) {
        const content = await fs.readFile(cleanupReportPath, 'utf-8');
        const report = JSON.parse(content);
        totalRemoved = report.removed?.length || 0;
        lastCleanupDate = report.timestamp || null;
      }

      // Count backups
      let backupCount = 0;
      let backupSize = 0;

      if (existsSync(this.backupsDir)) {
        const countBackups = async (dir: string): Promise<void> => {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            
            if (entry.isDirectory()) {
              await countBackups(fullPath);
            } else if (entry.isFile() && entry.name.endsWith('.tsx')) {
              backupCount++;
              const stats = await fs.stat(fullPath);
              backupSize += stats.size;
            }
          }
        };

        await countBackups(this.backupsDir);
      }

      return {
        totalRemoved,
        lastCleanupDate,
        backupCount,
        backupSize
      };
    } catch (error) {
      return {
        totalRemoved: 0,
        lastCleanupDate: null,
        backupCount: 0,
        backupSize: 0
      };
    }
  }

  private assessHealth(
    layouts: DashboardStats['layouts'],
    builds: DashboardStats['builds'],
    cleanup: DashboardStats['cleanup']
  ): DashboardStats['health'] {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for redundant layouts
    if (layouts.redundant > 0) {
      issues.push(`${layouts.redundant} redundant layout(s) detected`);
      recommendations.push('Run: npm run layouts:cleanup');
    }

    // Check build performance
    if (builds.averageTime > 60) {
      issues.push('Build time is slow (> 60s)');
      recommendations.push('Consider optimizing build configuration');
    }

    // Check last build status
    if (builds.lastBuildStatus === 'failure') {
      issues.push('Last build failed');
      recommendations.push('Check .kiro/build-logs/latest.log for errors');
    }

    // Check backup size
    const backupSizeMB = cleanup.backupSize / (1024 * 1024);
    if (backupSizeMB > 50) {
      issues.push(`Backup directory is large (${backupSizeMB.toFixed(1)}MB)`);
      recommendations.push('Old backups may need cleanup');
    }

    // Check if analysis is stale
    if (layouts.lastAnalysis) {
      const analysisDate = new Date(layouts.lastAnalysis);
      const daysSinceAnalysis = (Date.now() - analysisDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceAnalysis > 7) {
        issues.push('Layout analysis is stale (> 7 days)');
        recommendations.push('Run: npm run layouts:analyze');
      }
    }

    // Determine overall health status
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (issues.length > 0) {
      status = 'warning';
    }
    
    if (builds.lastBuildStatus === 'failure' || layouts.redundant > 10) {
      status = 'critical';
    }

    return {
      status,
      issues,
      recommendations
    };
  }

  async displayDashboard(): Promise<void> {
    const stats = await this.generateStats();

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║         Layout Cleanup System - Statistics Dashboard          ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log('║ LAYOUT STATISTICS                                              ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log(`║ Total Layouts:       ${String(stats.layouts.total).padEnd(42)} ║`);
    console.log(`║ Redundant:           ${String(stats.layouts.redundant).padEnd(42)} ║`);
    console.log(`║ Necessary:           ${String(stats.layouts.necessary).padEnd(42)} ║`);
    console.log(`║ Review Required:     ${String(stats.layouts.review).padEnd(42)} ║`);
    console.log(`║ Last Analysis:       ${(stats.layouts.lastAnalysis ? new Date(stats.layouts.lastAnalysis).toLocaleString() : 'Never').padEnd(42)} ║`);
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log('║ BUILD STATISTICS                                               ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log(`║ Average Build Time:  ${stats.builds.averageTime.toFixed(1)}s${' '.repeat(38)} ║`);
    console.log(`║ Last Build Time:     ${stats.builds.lastBuildTime.toFixed(1)}s${' '.repeat(38)} ║`);
    console.log(`║ Last Build Status:   ${stats.builds.lastBuildStatus.padEnd(42)} ║`);
    console.log(`║ Last Build Date:     ${(stats.builds.lastBuildDate ? new Date(stats.builds.lastBuildDate).toLocaleString() : 'Never').padEnd(42)} ║`);
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log('║ CLEANUP STATISTICS                                             ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log(`║ Total Removed:       ${String(stats.cleanup.totalRemoved).padEnd(42)} ║`);
    console.log(`║ Backup Count:        ${String(stats.cleanup.backupCount).padEnd(42)} ║`);
    console.log(`║ Backup Size:         ${(stats.cleanup.backupSize / 1024).toFixed(1)}KB${' '.repeat(38)} ║`);
    console.log(`║ Last Cleanup:        ${(stats.cleanup.lastCleanupDate ? new Date(stats.cleanup.lastCleanupDate).toLocaleString() : 'Never').padEnd(42)} ║`);
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log('║ HEALTH STATUS                                                  ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');

    const statusIcon = stats.health.status === 'healthy' ? '✅' : 
                       stats.health.status === 'warning' ? '⚠️' : '❌';
    console.log(`║ Status: ${statusIcon} ${stats.health.status.toUpperCase().padEnd(52)} ║`);

    if (stats.health.issues.length > 0) {
      console.log('╠════════════════════════════════════════════════════════════════╣');
      console.log('║ ISSUES                                                         ║');
      console.log('╠════════════════════════════════════════════════════════════════╣');
      for (const issue of stats.health.issues) {
        const truncated = issue.length > 60 ? issue.substring(0, 57) + '...' : issue;
        console.log(`║ • ${truncated.padEnd(60)} ║`);
      }
    }

    if (stats.health.recommendations.length > 0) {
      console.log('╠════════════════════════════════════════════════════════════════╣');
      console.log('║ RECOMMENDATIONS                                                ║');
      console.log('╠════════════════════════════════════════════════════════════════╣');
      for (const rec of stats.health.recommendations) {
        const truncated = rec.length > 60 ? rec.substring(0, 57) + '...' : rec;
        console.log(`║ • ${truncated.padEnd(60)} ║`);
      }
    }

    console.log('╚════════════════════════════════════════════════════════════════╝\n');
  }

  async saveStats(stats: DashboardStats): Promise<void> {
    try {
      await fs.mkdir(this.reportsDir, { recursive: true });
      const statsPath = path.join(this.reportsDir, 'dashboard-stats.json');
      await fs.writeFile(statsPath, JSON.stringify(stats, null, 2));
      console.log(`📊 Statistics saved to ${statsPath}`);
    } catch (error) {
      console.error('Error saving statistics:', error);
    }
  }
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const saveOutput = args.includes('--save');

  const dashboard = new StatsDashboard();
  const stats = await dashboard.generateStats();

  if (jsonOutput) {
    console.log(JSON.stringify(stats, null, 2));
  } else {
    await dashboard.displayDashboard();
  }

  if (saveOutput) {
    await dashboard.saveStats(stats);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { StatsDashboard, DashboardStats };
