import fs from 'fs/promises';
import path from 'path';
import { AnalysisReport, LayoutAnalysis } from './layout-analyzer';
import { ensureDirectory } from './utils/file-operations';

/**
 * ReportGenerator - Generates formatted reports from analysis results
 */
export class ReportGenerator {
  /**
   * Generate and save JSON report
   */
  async saveJsonReport(report: AnalysisReport, outputPath: string): Promise<void> {
    await ensureDirectory(path.dirname(outputPath));
    const json = JSON.stringify(report, null, 2);
    await fs.writeFile(outputPath, json, 'utf-8');
  }

  /**
   * Generate colored console output
   */
  displayConsoleReport(report: AnalysisReport, verbose: boolean = false): void {
    const colors = {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[36m',
      gray: '\x1b[90m',
    };

    console.log('\n' + colors.bright + '═'.repeat(80) + colors.reset);
    console.log(colors.bright + '📊 Layout Analysis Report' + colors.reset);
    console.log(colors.bright + '═'.repeat(80) + colors.reset + '\n');

    // Summary statistics
    console.log(colors.bright + '📈 Summary:' + colors.reset);
    console.log(`   Total layouts analyzed: ${colors.blue}${report.total}${colors.reset}`);
    console.log(`   ${colors.red}Redundant:${colors.reset} ${report.redundant.length} (${this.percentage(report.redundant.length, report.total)}%)`);
    console.log(`   ${colors.green}Necessary:${colors.reset} ${report.necessary.length} (${this.percentage(report.necessary.length, report.total)}%)`);
    console.log(`   ${colors.yellow}Review needed:${colors.reset} ${report.review.length} (${this.percentage(report.review.length, report.total)}%)`);
    console.log(`   Timestamp: ${colors.gray}${new Date(report.timestamp).toLocaleString()}${colors.reset}\n`);

    // Redundant layouts
    if (report.redundant.length > 0) {
      console.log(colors.red + colors.bright + '🗑️  Redundant Layouts (Can be removed):' + colors.reset);
      this.displayLayoutList(report.redundant, colors.red, verbose);
      console.log('');
    }

    // Review needed
    if (report.review.length > 0) {
      console.log(colors.yellow + colors.bright + '⚠️  Layouts Requiring Manual Review:' + colors.reset);
      this.displayLayoutList(report.review, colors.yellow, verbose);
      console.log('');
    }

    // Necessary layouts (only in verbose mode)
    if (verbose && report.necessary.length > 0) {
      console.log(colors.green + colors.bright + '✅ Necessary Layouts (Keep):' + colors.reset);
      this.displayLayoutList(report.necessary, colors.green, verbose);
      console.log('');
    }

    // Recommendations
    console.log(colors.bright + '💡 Recommendations:' + colors.reset);
    if (report.redundant.length > 0) {
      console.log(`   • Run ${colors.blue}npm run layouts:cleanup --dry-run${colors.reset} to preview removal`);
      console.log(`   • Run ${colors.blue}npm run layouts:cleanup${colors.reset} to remove redundant layouts`);
    } else {
      console.log(`   • ${colors.green}No redundant layouts found!${colors.reset} Your codebase is clean.`);
    }
    if (report.review.length > 0) {
      console.log(`   • Manually review ${report.review.length} layout(s) marked for review`);
    }

    console.log('\n' + colors.bright + '═'.repeat(80) + colors.reset + '\n');
  }

  /**
   * Display a list of layouts with formatting
   */
  private displayLayoutList(layouts: LayoutAnalysis[], color: string, verbose: boolean): void {
    const colors = {
      reset: '\x1b[0m',
      gray: '\x1b[90m',
    };

    for (const layout of layouts) {
      console.log(`   ${color}▸${colors.reset} ${layout.path}`);
      
      if (verbose) {
        console.log(`     ${colors.gray}Reason: ${layout.reason}${colors.reset}`);
        console.log(`     ${colors.gray}Has logic: ${layout.hasLogic}, Has styles: ${layout.hasStyles}, Children only: ${layout.childrenOnly}${colors.reset}`);
      } else {
        console.log(`     ${colors.gray}${layout.reason}${colors.reset}`);
      }
    }
  }

  /**
   * Calculate percentage
   */
  private percentage(value: number, total: number): string {
    if (total === 0) return '0';
    return ((value / total) * 100).toFixed(1);
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport(report: AnalysisReport): string {
    let md = '# Layout Analysis Report\n\n';
    md += `**Generated:** ${new Date(report.timestamp).toLocaleString()}\n\n`;

    // Summary
    md += '## Summary\n\n';
    md += `- **Total layouts:** ${report.total}\n`;
    md += `- **Redundant:** ${report.redundant.length} (${this.percentage(report.redundant.length, report.total)}%)\n`;
    md += `- **Necessary:** ${report.necessary.length} (${this.percentage(report.necessary.length, report.total)}%)\n`;
    md += `- **Review needed:** ${report.review.length} (${this.percentage(report.review.length, report.total)}%)\n\n`;

    // Redundant layouts
    if (report.redundant.length > 0) {
      md += '## 🗑️ Redundant Layouts\n\n';
      md += 'These layouts can be safely removed:\n\n';
      for (const layout of report.redundant) {
        md += `- \`${layout.path}\`\n`;
        md += `  - ${layout.reason}\n`;
      }
      md += '\n';
    }

    // Review needed
    if (report.review.length > 0) {
      md += '## ⚠️ Layouts Requiring Review\n\n';
      md += 'These layouts need manual review:\n\n';
      for (const layout of report.review) {
        md += `- \`${layout.path}\`\n`;
        md += `  - ${layout.reason}\n`;
      }
      md += '\n';
    }

    // Necessary layouts
    if (report.necessary.length > 0) {
      md += '## ✅ Necessary Layouts\n\n';
      md += 'These layouts should be kept:\n\n';
      for (const layout of report.necessary) {
        md += `- \`${layout.path}\`\n`;
        md += `  - ${layout.reason}\n`;
      }
      md += '\n';
    }

    return md;
  }

  /**
   * Save markdown report
   */
  async saveMarkdownReport(report: AnalysisReport, outputPath: string): Promise<void> {
    await ensureDirectory(path.dirname(outputPath));
    const markdown = this.generateMarkdownReport(report);
    await fs.writeFile(outputPath, markdown, 'utf-8');
  }

  /**
   * Generate statistics object
   */
  generateStatistics(report: AnalysisReport) {
    return {
      total: report.total,
      redundant: {
        count: report.redundant.length,
        percentage: parseFloat(this.percentage(report.redundant.length, report.total)),
        files: report.redundant.map(l => l.path),
      },
      necessary: {
        count: report.necessary.length,
        percentage: parseFloat(this.percentage(report.necessary.length, report.total)),
        files: report.necessary.map(l => l.path),
      },
      review: {
        count: report.review.length,
        percentage: parseFloat(this.percentage(report.review.length, report.total)),
        files: report.review.map(l => l.path),
      },
      timestamp: report.timestamp,
    };
  }
}
