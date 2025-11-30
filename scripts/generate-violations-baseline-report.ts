#!/usr/bin/env node
/**
 * Baseline Assessment Script for Design System Violations
 * 
 * **Feature: design-system-violations-fix, Task 1**
 * 
 * This script runs all violation detection scripts and generates a comprehensive
 * baseline report with prioritization and categorization.
 * 
 * Usage:
 *   npx tsx scripts/generate-violations-baseline-report.ts
 *   npx tsx scripts/generate-violations-baseline-report.ts --json > baseline-report.json
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface ViolationSummary {
  scriptName: string;
  category: 'tokens' | 'components' | 'colors' | 'other';
  severity: 'critical' | 'high' | 'medium' | 'low';
  totalViolations: number;
  filesAffected: number;
  estimatedEffort: 'low' | 'medium' | 'high';
  priority: number; // 1 = highest
}

interface BaselineReport {
  timestamp: string;
  totalViolations: number;
  totalFilesAffected: number;
  violationsByCategory: Record<string, number>;
  violationsBySeverity: Record<string, number>;
  summaries: ViolationSummary[];
  recommendations: string[];
}

const VIOLATION_SCRIPTS = [
  {
    name: 'Font Token Violations',
    script: 'scripts/check-font-token-violations.ts',
    category: 'tokens' as const,
    severity: 'high' as const,
    estimatedEffort: 'medium' as const,
    priority: 1,
  },
  {
    name: 'Typography Token Violations',
    script: 'scripts/check-font-token-violations.ts', // Same script covers both
    category: 'tokens' as const,
    severity: 'high' as const,
    estimatedEffort: 'medium' as const,
    priority: 2,
  },
  {
    name: 'Color Palette Violations',
    script: 'scripts/check-color-palette-violations.ts',
    category: 'colors' as const,
    severity: 'medium' as const,
    estimatedEffort: 'high' as const,
    priority: 4,
  },
  {
    name: 'Button Component Violations',
    script: 'scripts/check-button-component-violations.ts',
    category: 'components' as const,
    severity: 'critical' as const,
    estimatedEffort: 'high' as const,
    priority: 3,
  },
  {
    name: 'Input Component Violations',
    script: 'scripts/check-input-component-violations.ts',
    category: 'components' as const,
    severity: 'high' as const,
    estimatedEffort: 'medium' as const,
    priority: 5,
  },
  {
    name: 'Select Component Violations',
    script: 'scripts/check-select-component-violations.ts',
    category: 'components' as const,
    severity: 'high' as const,
    estimatedEffort: 'low' as const,
    priority: 6,
  },
  {
    name: 'Card Component Violations',
    script: 'scripts/check-card-component-violations.ts',
    category: 'components' as const,
    severity: 'medium' as const,
    estimatedEffort: 'high' as const,
    priority: 7,
  },
];

function parseScriptOutput(output: string, scriptName: string): { violations: number; files: number } {
  let violations = 0;
  let files = 0;

  // Try to extract numbers from common patterns
  const violationMatch = output.match(/Total violations?:\s*(\d+)/i) || 
                        output.match(/(\d+)\s+total violations?/i) ||
                        output.match(/Found\s+(\d+)\s+violations?/i) ||
                        output.match(/❌\s+Found\s+(\d+)\s+violations?/i);
  
  const filesMatch = output.match(/Files with violations?:\s*(\d+)/i) ||
                    output.match(/(\d+)\s+files? with violations?/i) ||
                    output.match(/Found\s+\d+\s+violations?\s+in\s+(\d+)\s+files?/i) ||
                    output.match(/❌\s+Found\s+\d+\s+files? with violations?:\s*(\d+)/i);

  if (violationMatch) violations = parseInt(violationMatch[1], 10);
  if (filesMatch) files = parseInt(filesMatch[1], 10);

  // Special parsing for specific scripts
  if (scriptName.includes('Button')) {
    const buttonMatch = output.match(/Total violations:\s*(\d+)/i);
    const buttonFilesMatch = output.match(/Files with violations:\s*(\d+)/i);
    if (buttonMatch) violations = parseInt(buttonMatch[1], 10);
    if (buttonFilesMatch) files = parseInt(buttonFilesMatch[1], 10);
  }

  if (scriptName.includes('Color')) {
    const colorMatch = output.match(/Found\s+(\d+)\s+color palette violations?/i);
    if (colorMatch) violations = parseInt(colorMatch[1], 10);
    // Count files by counting "📄" markers
    const fileMarkers = (output.match(/📄/g) || []).length;
    if (fileMarkers > 0) files = fileMarkers;
  }

  if (scriptName.includes('Card')) {
    const cardMatch = output.match(/Found\s+(\d+)\s+violations?\s+in\s+(\d+)\s+files?/i);
    if (cardMatch) {
      violations = parseInt(cardMatch[1], 10);
      files = parseInt(cardMatch[2], 10);
    }
  }

  return { violations, files };
}

function runViolationCheck(config: typeof VIOLATION_SCRIPTS[0]): ViolationSummary | null {
  try {
    console.log(`\n🔍 Running: ${config.name}...`);
    
    const output = execSync(`npx tsx ${config.script}`, {
      encoding: 'utf-8',
      stdio: 'pipe',
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    const { violations, files } = parseScriptOutput(output, config.name);

    console.log(`   ✓ Found ${violations} violations in ${files} files`);

    return {
      scriptName: config.name,
      category: config.category,
      severity: config.severity,
      totalViolations: violations,
      filesAffected: files,
      estimatedEffort: config.estimatedEffort,
      priority: config.priority,
    };
  } catch (error: any) {
    // Script might exit with error code but still produce output
    if (error.stdout) {
      const { violations, files } = parseScriptOutput(error.stdout, config.name);
      console.log(`   ⚠ Found ${violations} violations in ${files} files (with warnings)`);
      
      return {
        scriptName: config.name,
        category: config.category,
        severity: config.severity,
        totalViolations: violations,
        filesAffected: files,
        estimatedEffort: config.estimatedEffort,
        priority: config.priority,
      };
    }
    
    console.error(`   ✗ Error running ${config.name}:`, error.message);
    return null;
  }
}

function generateRecommendations(summaries: ViolationSummary[]): string[] {
  const recommendations: string[] = [];

  // Sort by priority
  const sortedSummaries = [...summaries].sort((a, b) => a.priority - b.priority);

  recommendations.push('📋 Recommended Fix Order (by priority):');
  recommendations.push('');

  sortedSummaries.forEach((summary, index) => {
    const effort = summary.estimatedEffort.toUpperCase();
    const severity = summary.severity.toUpperCase();
    recommendations.push(
      `${index + 1}. ${summary.scriptName} - ${summary.totalViolations} violations (${severity} severity, ${effort} effort)`
    );
  });

  recommendations.push('');
  recommendations.push('💡 Quick Wins (Low effort, High impact):');
  
  const quickWins = summaries.filter(s => 
    s.estimatedEffort === 'low' && 
    (s.severity === 'critical' || s.severity === 'high')
  );

  if (quickWins.length > 0) {
    quickWins.forEach(qw => {
      recommendations.push(`   • ${qw.scriptName}: ${qw.totalViolations} violations`);
    });
  } else {
    recommendations.push('   • No quick wins identified - all fixes require medium to high effort');
  }

  recommendations.push('');
  recommendations.push('⚠️  Critical Issues (Must fix first):');
  
  const critical = summaries.filter(s => s.severity === 'critical');
  if (critical.length > 0) {
    critical.forEach(c => {
      recommendations.push(`   • ${c.scriptName}: ${c.totalViolations} violations in ${c.filesAffected} files`);
    });
  } else {
    recommendations.push('   • No critical issues found');
  }

  return recommendations;
}

function generateReport(): BaselineReport {
  console.log('🚀 Starting Design System Violations Baseline Assessment\n');
  console.log('=' .repeat(80));

  const summaries: ViolationSummary[] = [];

  // Run all violation checks (skip duplicates)
  const uniqueScripts = VIOLATION_SCRIPTS.filter((script, index, self) => 
    index === self.findIndex(s => s.script === script.script)
  );

  for (const config of uniqueScripts) {
    const summary = runViolationCheck(config);
    if (summary) {
      summaries.push(summary);
    }
  }

  // Calculate totals
  const totalViolations = summaries.reduce((sum, s) => sum + s.totalViolations, 0);
  const uniqueFiles = new Set(summaries.flatMap(s => Array(s.filesAffected).fill(s.scriptName))).size;

  const violationsByCategory = summaries.reduce((acc, s) => {
    acc[s.category] = (acc[s.category] || 0) + s.totalViolations;
    return acc;
  }, {} as Record<string, number>);

  const violationsBySeverity = summaries.reduce((acc, s) => {
    acc[s.severity] = (acc[s.severity] || 0) + s.totalViolations;
    return acc;
  }, {} as Record<string, number>);

  const recommendations = generateRecommendations(summaries);

  return {
    timestamp: new Date().toISOString(),
    totalViolations,
    totalFilesAffected: uniqueFiles,
    violationsByCategory,
    violationsBySeverity,
    summaries,
    recommendations,
  };
}

function printReport(report: BaselineReport) {
  console.log('\n');
  console.log('=' .repeat(80));
  console.log('📊 BASELINE ASSESSMENT REPORT');
  console.log('=' .repeat(80));
  console.log('');
  console.log(`Generated: ${new Date(report.timestamp).toLocaleString()}`);
  console.log('');
  console.log('📈 Overall Statistics:');
  console.log(`   Total Violations: ${report.totalViolations}`);
  console.log(`   Files Affected: ${report.totalFilesAffected}`);
  console.log('');
  console.log('📊 Violations by Category:');
  Object.entries(report.violationsByCategory).forEach(([category, count]) => {
    const percentage = ((count / report.totalViolations) * 100).toFixed(1);
    console.log(`   ${category.padEnd(15)}: ${count.toString().padStart(5)} (${percentage}%)`);
  });
  console.log('');
  console.log('⚠️  Violations by Severity:');
  Object.entries(report.violationsBySeverity).forEach(([severity, count]) => {
    const percentage = ((count / report.totalViolations) * 100).toFixed(1);
    console.log(`   ${severity.padEnd(15)}: ${count.toString().padStart(5)} (${percentage}%)`);
  });
  console.log('');
  console.log('=' .repeat(80));
  console.log('');
  report.recommendations.forEach(rec => console.log(rec));
  console.log('');
  console.log('=' .repeat(80));
  console.log('');
  console.log('💾 Detailed breakdown saved to: .kiro/specs/design-system-violations-fix/BASELINE-REPORT.md');
  console.log('');
}

function saveMarkdownReport(report: BaselineReport) {
  const outputPath = '.kiro/specs/design-system-violations-fix/BASELINE-REPORT.md';
  
  let markdown = `# Design System Violations - Baseline Assessment Report

Generated: ${new Date(report.timestamp).toLocaleString()}

## Executive Summary

- **Total Violations**: ${report.totalViolations}
- **Files Affected**: ${report.totalFilesAffected}
- **Compliance Rate**: ${(100 - (report.totalViolations / 100)).toFixed(1)}% (estimated)

## Violations by Category

| Category | Count | Percentage |
|----------|-------|------------|
`;

  Object.entries(report.violationsByCategory).forEach(([category, count]) => {
    const percentage = ((count / report.totalViolations) * 100).toFixed(1);
    markdown += `| ${category} | ${count} | ${percentage}% |\n`;
  });

  markdown += `\n## Violations by Severity\n\n| Severity | Count | Percentage |\n|----------|-------|------------|\n`;

  Object.entries(report.violationsBySeverity).forEach(([severity, count]) => {
    const percentage = ((count / report.totalViolations) * 100).toFixed(1);
    markdown += `| ${severity} | ${count} | ${percentage}% |\n`;
  });

  markdown += `\n## Detailed Breakdown\n\n`;

  report.summaries.sort((a, b) => a.priority - b.priority).forEach(summary => {
    markdown += `### ${summary.scriptName}\n\n`;
    markdown += `- **Priority**: ${summary.priority}\n`;
    markdown += `- **Category**: ${summary.category}\n`;
    markdown += `- **Severity**: ${summary.severity}\n`;
    markdown += `- **Total Violations**: ${summary.totalViolations}\n`;
    markdown += `- **Files Affected**: ${summary.filesAffected}\n`;
    markdown += `- **Estimated Effort**: ${summary.estimatedEffort}\n\n`;
  });

  markdown += `## Recommendations\n\n`;
  report.recommendations.forEach(rec => {
    markdown += `${rec}\n`;
  });

  markdown += `\n## Next Steps\n\n`;
  markdown += `1. Review this baseline report\n`;
  markdown += `2. Start with highest priority violations (Task 2: Font Token Violations)\n`;
  markdown += `3. Run property-based tests after each fix category\n`;
  markdown += `4. Track progress using the task list in tasks.md\n`;
  markdown += `5. Generate final compliance report after all fixes\n`;

  fs.writeFileSync(outputPath, markdown);
}

// Main execution
const args = process.argv.slice(2);
const jsonOutput = args.includes('--json');

const report = generateReport();

if (jsonOutput) {
  console.log(JSON.stringify(report, null, 2));
} else {
  printReport(report);
  saveMarkdownReport(report);
}
