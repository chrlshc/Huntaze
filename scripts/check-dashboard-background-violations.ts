#!/usr/bin/env tsx

/**
 * Dashboard Background Uniformity Violation Checker
 * 
 * This script analyzes dashboard pages for background color violations
 * and provides a prioritized list of files to fix.
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface Violation {
  file: string;
  line: number;
  content: string;
  issue: string;
}

interface FileViolationSummary {
  file: string;
  violationCount: number;
  violations: Violation[];
  priority: 'high' | 'medium' | 'low';
}

async function analyzeDashboardBackgrounds() {
  console.log('🔍 Analyzing Dashboard Background Uniformity...\n');

  // Find all dashboard page files
  const dashboardPages = await glob('app/(app)/**/page.tsx', {
    ignore: ['**/node_modules/**', '**/.next/**'],
    absolute: true
  });

  const violations: Violation[] = [];

  // Violation patterns
  const violationPatterns = [
    { pattern: /className="[^"]*bg-gray-\d+[^"]*"/, name: 'bg-gray-* class' },
    { pattern: /className="[^"]*bg-slate-\d+[^"]*"/, name: 'bg-slate-* class' },
    { pattern: /className="[^"]*bg-neutral-\d+[^"]*"/, name: 'bg-neutral-* class' },
    { pattern: /className="[^"]*bg-stone-\d+[^"]*"/, name: 'bg-stone-* class' },
    { pattern: /className="[^"]*bg-zinc-(?!950)[^"]*"/, name: 'bg-zinc-* (not 950) class' },
    { pattern: /className="[^"]*bg-black[^"]*"/, name: 'bg-black class' },
    { pattern: /className="[^"]*bg-white[^"]*"/, name: 'bg-white class' },
    { pattern: /style={{[^}]*background:\s*['"]#[0-9a-fA-F]{3,8}['"]/, name: 'hardcoded hex background' },
    { pattern: /backgroundColor:\s*['"]#[0-9a-fA-F]{3,8}['"]/, name: 'hardcoded hex backgroundColor' },
    { pattern: /style={{[^}]*background:\s*['"]rgb/, name: 'hardcoded rgb background' },
    { pattern: /backgroundColor:\s*['"]rgb/, name: 'hardcoded rgb backgroundColor' },
  ];

  // Approved patterns
  const approvedPatterns = [
    /className="[^"]*bg-zinc-950[^"]*"/,
    /className="[^"]*bg-primary[^"]*"/,
    /style={{[^}]*background:\s*['"]var\(--bg-primary\)['"]/,
    /backgroundColor:\s*['"]var\(--bg-primary\)['"]/,
  ];

  // Scan files
  for (const filePath of dashboardPages) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const relativePath = path.relative(process.cwd(), filePath);

    lines.forEach((line, index) => {
      if (line.trim().startsWith('//') || line.trim().startsWith('import')) {
        return;
      }

      for (const { pattern, name } of violationPatterns) {
        if (pattern.test(line)) {
          const hasApprovedPattern = approvedPatterns.some(approved => approved.test(line));
          
          if (!hasApprovedPattern) {
            violations.push({
              file: relativePath,
              line: index + 1,
              content: line.trim(),
              issue: name
            });
          }
        }
      }
    });
  }

  // Group violations by file
  const fileViolations = new Map<string, Violation[]>();
  violations.forEach(v => {
    if (!fileViolations.has(v.file)) {
      fileViolations.set(v.file, []);
    }
    fileViolations.get(v.file)!.push(v);
  });

  // Create summaries with priority
  const summaries: FileViolationSummary[] = Array.from(fileViolations.entries()).map(([file, viols]) => {
    let priority: 'high' | 'medium' | 'low' = 'low';
    
    // High priority: OnlyFans, Marketing, Analytics
    if (file.includes('/onlyfans/') || file.includes('/marketing/') || file.includes('/analytics/')) {
      priority = 'high';
    }
    // Medium priority: Billing, Configure, Automations
    else if (file.includes('/billing/') || file.includes('/configure/') || file.includes('/automations/')) {
      priority = 'medium';
    }
    
    return {
      file,
      violationCount: viols.length,
      violations: viols,
      priority
    };
  });

  // Sort by priority then by violation count
  summaries.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.violationCount - a.violationCount;
  });

  // Print summary
  console.log('📊 Summary:');
  console.log(`   Total pages scanned: ${dashboardPages.length}`);
  console.log(`   Pages with violations: ${fileViolations.size}`);
  console.log(`   Total violations: ${violations.length}`);
  console.log(`   Compliance rate: ${((1 - fileViolations.size / dashboardPages.length) * 100).toFixed(1)}%\n`);

  // Print by priority
  const highPriority = summaries.filter(s => s.priority === 'high');
  const mediumPriority = summaries.filter(s => s.priority === 'medium');
  const lowPriority = summaries.filter(s => s.priority === 'low');

  if (highPriority.length > 0) {
    console.log('🔴 HIGH PRIORITY FILES (User-facing, frequently accessed):');
    highPriority.forEach(s => {
      console.log(`   ${s.file}: ${s.violationCount} violations`);
    });
    console.log('');
  }

  if (mediumPriority.length > 0) {
    console.log('🟡 MEDIUM PRIORITY FILES (Admin/configuration):');
    mediumPriority.forEach(s => {
      console.log(`   ${s.file}: ${s.violationCount} violations`);
    });
    console.log('');
  }

  if (lowPriority.length > 0) {
    console.log('⚪ LOW PRIORITY FILES (Specialized features):');
    lowPriority.forEach(s => {
      console.log(`   ${s.file}: ${s.violationCount} violations`);
    });
    console.log('');
  }

  // Top 10 files by violation count
  console.log('📈 Top 10 Files by Violation Count:');
  summaries.slice(0, 10).forEach((s, i) => {
    const priorityEmoji = s.priority === 'high' ? '🔴' : s.priority === 'medium' ? '🟡' : '⚪';
    console.log(`   ${i + 1}. ${priorityEmoji} ${s.file}: ${s.violationCount} violations`);
  });
  console.log('');

  // Violation type breakdown
  const violationTypes = new Map<string, number>();
  violations.forEach(v => {
    violationTypes.set(v.issue, (violationTypes.get(v.issue) || 0) + 1);
  });

  console.log('📋 Violation Types:');
  Array.from(violationTypes.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`   ${type}: ${count} occurrences`);
    });
  console.log('');

  // Recommendations
  console.log('💡 Recommendations:');
  console.log('   1. Start with HIGH PRIORITY files (OnlyFans, Marketing, Analytics)');
  console.log('   2. Replace bg-white with bg-zinc-950');
  console.log('   3. Replace bg-gray-* with bg-zinc-950');
  console.log('   4. Use var(--bg-primary) for inline styles');
  console.log('   5. Run property test to verify: npm test dashboard-background-uniformity');
  console.log('');

  // Export detailed report
  const report = {
    timestamp: new Date().toISOString(),
    totalPages: dashboardPages.length,
    pagesWithViolations: fileViolations.size,
    totalViolations: violations.length,
    complianceRate: ((1 - fileViolations.size / dashboardPages.length) * 100).toFixed(1),
    summaries,
    violationTypes: Array.from(violationTypes.entries())
  };

  const reportPath = path.join(process.cwd(), '.kiro/specs/design-system-unification/background-violations-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Detailed report saved to: ${reportPath}`);
}

analyzeDashboardBackgrounds().catch(console.error);
