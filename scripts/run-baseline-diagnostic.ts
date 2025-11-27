#!/usr/bin/env tsx
/**
 * Baseline Diagnostic Script
 * 
 * Executes the performance diagnostic tool and establishes a baseline
 * for the dashboard performance. This baseline will be used to measure
 * the impact of optimizations.
 * 
 * Usage: npm run diagnostic:baseline
 */

import { PerformanceDiagnostic } from '../lib/diagnostics';
import { runSimulation } from './simulate-dashboard-activity';
import fs from 'fs/promises';
import path from 'path';

interface BaselineReport {
  timestamp: Date;
  environment: string;
  diagnosticResults: any;
  topBottlenecks: Array<{
    rank: number;
    type: string;
    description: string;
    impact: string;
    currentTime: number;
    location: string;
  }>;
  summary: {
    totalIssues: number;
    highImpact: number;
    mediumImpact: number;
    lowImpact: number;
    estimatedImprovementPotential: string;
  };
}

async function runBaselineDiagnostic(): Promise<void> {
  console.log('🔍 Starting baseline diagnostic...\n');
  
  const diagnostic = new PerformanceDiagnostic();
  
  try {
    // Run simulation to collect realistic metrics
    console.log('📊 Running dashboard activity simulation...');
    console.log('⏳ This will take about 10 seconds...\n');
    
    const report = await runSimulation({
      duration: 10000,
      apiCallsPerSecond: 5,
      renderOperations: 20,
      duplicateRequestRate: 0.3
    });
    
    console.log('📈 Generating diagnostic report...');
    
    // Sort bottlenecks by impact
    const sortedBottlenecks = report.bottlenecks.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      const impactDiff = impactOrder[b.impact] - impactOrder[a.impact];
      if (impactDiff !== 0) return impactDiff;
      return b.currentTime - a.currentTime;
    });
    
    // Get top 5 bottlenecks
    const topBottlenecks = sortedBottlenecks.slice(0, 5).map((b, index) => ({
      rank: index + 1,
      type: b.type,
      description: b.description,
      impact: b.impact,
      currentTime: b.currentTime,
      location: b.location
    }));
    
    // Create baseline report
    const baseline: BaselineReport = {
      timestamp: new Date(),
      environment: process.env.NODE_ENV || 'development',
      diagnosticResults: report,
      topBottlenecks,
      summary: {
        totalIssues: report.bottlenecks.length,
        highImpact: report.bottlenecks.filter(b => b.impact === 'high').length,
        mediumImpact: report.bottlenecks.filter(b => b.impact === 'medium').length,
        lowImpact: report.bottlenecks.filter(b => b.impact === 'low').length,
        estimatedImprovementPotential: report.estimatedImpact?.improvement || 'Unknown'
      }
    };
    
    // Save baseline to file
    const baselineDir = path.join(process.cwd(), '.kiro/specs/dashboard-performance-real-fix');
    const baselinePath = path.join(baselineDir, 'baseline-metrics.json');
    
    await fs.writeFile(
      baselinePath,
      JSON.stringify(baseline, null, 2),
      'utf-8'
    );
    
    console.log('\n✅ Baseline diagnostic complete!\n');
    console.log('📊 Summary:');
    console.log(`   Total Issues: ${baseline.summary.totalIssues}`);
    console.log(`   High Impact: ${baseline.summary.highImpact}`);
    console.log(`   Medium Impact: ${baseline.summary.mediumImpact}`);
    console.log(`   Low Impact: ${baseline.summary.lowImpact}`);
    console.log(`   Estimated Improvement Potential: ${baseline.summary.estimatedImprovementPotential}\n`);
    
    console.log('🎯 Top 5 Bottlenecks to Fix:\n');
    topBottlenecks.forEach(bottleneck => {
      const impactEmoji = bottleneck.impact === 'high' ? '🔴' : 
                         bottleneck.impact === 'medium' ? '🟡' : '🟢';
      console.log(`${bottleneck.rank}. ${impactEmoji} [${bottleneck.impact.toUpperCase()}] ${bottleneck.description}`);
      console.log(`   Type: ${bottleneck.type}`);
      console.log(`   Current Time: ${bottleneck.currentTime}ms`);
      console.log(`   Location: ${bottleneck.location}\n`);
    });
    
    console.log(`📁 Full baseline report saved to: ${baselinePath}\n`);
    
    // Generate markdown report
    await generateMarkdownReport(baseline, baselineDir);
    
  } catch (error) {
    console.error('❌ Error running baseline diagnostic:', error);
    process.exit(1);
  }
}

async function generateMarkdownReport(baseline: BaselineReport, outputDir: string): Promise<void> {
  const reportPath = path.join(outputDir, 'baseline-report.md');
  
  const markdown = `# Baseline Performance Report

**Generated:** ${baseline.timestamp.toISOString()}  
**Environment:** ${baseline.environment}

## Executive Summary

- **Total Issues Identified:** ${baseline.summary.totalIssues}
- **High Impact Issues:** ${baseline.summary.highImpact}
- **Medium Impact Issues:** ${baseline.summary.mediumImpact}
- **Low Impact Issues:** ${baseline.summary.lowImpact}
- **Estimated Improvement Potential:** ${baseline.summary.estimatedImprovementPotential}

## Top 5 Bottlenecks to Address

${baseline.topBottlenecks.map(b => `
### ${b.rank}. ${b.description}

- **Impact Level:** ${b.impact.toUpperCase()}
- **Type:** ${b.type}
- **Current Time:** ${b.currentTime}ms
- **Location:** \`${b.location}\`
`).join('\n')}

## Recommendations

${baseline.diagnosticResults.recommendations?.map((r: any, i: number) => `
${i + 1}. **${r.title || 'Optimization'}**
   - Priority: ${r.priority || 'Medium'}
   - ${r.description || 'No description'}
   - Estimated Impact: ${r.estimatedImpact || 'Unknown'}
`).join('\n') || 'No specific recommendations generated.'}

## Next Steps

1. Review the top 5 bottlenecks identified above
2. Prioritize fixes based on impact level (High → Medium → Low)
3. Implement optimizations from task 3 onwards
4. Re-run diagnostic after each major optimization to measure impact
5. Compare results with this baseline to validate improvements

## Raw Diagnostic Data

See \`baseline-metrics.json\` for complete diagnostic data including:
- All bottlenecks (not just top 5)
- Detailed metrics for each issue
- Full recommendations list
- Performance snapshots

---

*This baseline establishes the starting point for performance optimization efforts.*
`;

  await fs.writeFile(reportPath, markdown, 'utf-8');
  console.log(`📄 Markdown report saved to: ${reportPath}\n`);
}

// Run the diagnostic
runBaselineDiagnostic().catch(console.error);
