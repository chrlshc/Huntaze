#!/usr/bin/env tsx
/**
 * Page Data Requirements Audit Script
 * Task 3.1: Audit all pages for data requirements
 * 
 * This script analyzes all dashboard pages to determine:
 * - Pages that need real-time data (user-specific, frequently changing)
 * - Pages that need user-specific data (auth-dependent)
 * - Pages that can be static (no dynamic data)
 * 
 * Requirements: 2.1, 2.2
 */

import fs from 'fs';
import path from 'path';

interface PageAudit {
  path: string;
  file: string;
  dataRequirements: 'real-time' | 'user-specific' | 'static';
  reason: string;
  hasForceDynamic: boolean;
  recommendations: string[];
}

const APP_DIR = path.join(process.cwd(), 'app/(app)');

/**
 * Analyze a page file to determine its data requirements
 */
function analyzePage(filePath: string, content: string): PageAudit {
  const relativePath = filePath.replace(process.cwd(), '');
  const hasForceDynamic = content.includes("export const dynamic = 'force-dynamic'");
  
  // Patterns that indicate real-time data needs
  const realTimePatterns = [
    /useContent/,
    /fetch.*\/api\//,
    /getHomeStats/,
    /useIntegrations/,
    /cache:\s*['"]no-store['"]/,
    /revalidate:\s*0/,
  ];
  
  // Patterns that indicate user-specific data
  const userSpecificPatterns = [
    /useSession/,
    /getServerSession/,
    /ProtectedRoute/,
    /requireOnboarding/,
    /userId/,
    /user\./,
  ];
  
  // Patterns that indicate static content
  const staticPatterns = [
    /design-system/,
    /documentation/,
    /help/,
    /about/,
  ];
  
  const hasRealTimeData = realTimePatterns.some(pattern => pattern.test(content));
  const hasUserSpecificData = userSpecificPatterns.some(pattern => pattern.test(content));
  const isStaticContent = staticPatterns.some(pattern => pattern.test(relativePath));
  
  let dataRequirements: 'real-time' | 'user-specific' | 'static';
  let reason: string;
  let recommendations: string[] = [];
  
  if (isStaticContent) {
    dataRequirements = 'static';
    reason = 'Static content page (documentation, design system, etc.)';
    recommendations.push('Remove force-dynamic');
    recommendations.push('Enable static generation');
    recommendations.push('Add revalidate: 3600 for periodic updates');
  } else if (hasRealTimeData) {
    dataRequirements = 'real-time';
    reason = 'Fetches real-time data from API or database';
    recommendations.push('Keep dynamic rendering');
    recommendations.push('Add SWR caching with appropriate dedupingInterval');
    recommendations.push('Consider stale-while-revalidate strategy');
  } else if (hasUserSpecificData) {
    dataRequirements = 'user-specific';
    reason = 'Requires user authentication or user-specific data';
    recommendations.push('Use dynamic rendering for this page only');
    recommendations.push('Cache user-independent parts with React Server Components');
    recommendations.push('Add revalidate: 60 for semi-static content');
  } else {
    dataRequirements = 'static';
    reason = 'No dynamic data detected';
    recommendations.push('Remove force-dynamic');
    recommendations.push('Enable static generation');
  }
  
  return {
    path: relativePath,
    file: path.basename(filePath),
    dataRequirements,
    reason,
    hasForceDynamic,
    recommendations,
  };
}

/**
 * Recursively find all page.tsx files
 */
function findPageFiles(dir: string): string[] {
  const files: string[] = [];
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        files.push(...findPageFiles(fullPath));
      } else if (entry.name === 'page.tsx' || entry.name === 'layout.tsx') {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
  
  return files;
}

/**
 * Main audit function
 */
async function auditPages() {
  console.log('🔍 Starting page data requirements audit...\n');
  
  const pageFiles = findPageFiles(APP_DIR);
  const audits: PageAudit[] = [];
  
  for (const file of pageFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const audit = analyzePage(file, content);
      audits.push(audit);
    } catch (error) {
      console.error(`Error analyzing ${file}:`, error);
    }
  }
  
  // Group by data requirements
  const realTimePages = audits.filter(a => a.dataRequirements === 'real-time');
  const userSpecificPages = audits.filter(a => a.dataRequirements === 'user-specific');
  const staticPages = audits.filter(a => a.dataRequirements === 'static');
  
  // Generate report
  console.log('📊 AUDIT RESULTS\n');
  console.log('=' .repeat(80));
  console.log(`Total pages analyzed: ${audits.length}`);
  console.log(`Pages with force-dynamic: ${audits.filter(a => a.hasForceDynamic).length}`);
  console.log('=' .repeat(80));
  console.log('');
  
  console.log('🔴 REAL-TIME DATA PAGES (Keep Dynamic)');
  console.log(`Count: ${realTimePages.length}`);
  console.log('-'.repeat(80));
  realTimePages.forEach(page => {
    console.log(`\n📄 ${page.path}`);
    console.log(`   Reason: ${page.reason}`);
    console.log(`   Has force-dynamic: ${page.hasForceDynamic ? '✅' : '❌'}`);
    console.log(`   Recommendations:`);
    page.recommendations.forEach(rec => console.log(`     - ${rec}`));
  });
  console.log('\n');
  
  console.log('🟡 USER-SPECIFIC PAGES (Selective Dynamic)');
  console.log(`Count: ${userSpecificPages.length}`);
  console.log('-'.repeat(80));
  userSpecificPages.forEach(page => {
    console.log(`\n📄 ${page.path}`);
    console.log(`   Reason: ${page.reason}`);
    console.log(`   Has force-dynamic: ${page.hasForceDynamic ? '✅' : '❌'}`);
    console.log(`   Recommendations:`);
    page.recommendations.forEach(rec => console.log(`     - ${rec}`));
  });
  console.log('\n');
  
  console.log('🟢 STATIC PAGES (Can Be Static)');
  console.log(`Count: ${staticPages.length}`);
  console.log('-'.repeat(80));
  staticPages.forEach(page => {
    console.log(`\n📄 ${page.path}`);
    console.log(`   Reason: ${page.reason}`);
    console.log(`   Has force-dynamic: ${page.hasForceDynamic ? '✅ (REMOVE!)' : '❌'}`);
    console.log(`   Recommendations:`);
    page.recommendations.forEach(rec => console.log(`     - ${rec}`));
  });
  console.log('\n');
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: audits.length,
      realTime: realTimePages.length,
      userSpecific: userSpecificPages.length,
      static: staticPages.length,
      withForceDynamic: audits.filter(a => a.hasForceDynamic).length,
    },
    pages: {
      realTime: realTimePages,
      userSpecific: userSpecificPages,
      static: staticPages,
    },
  };
  
  const reportPath = path.join(process.cwd(), '.kiro/specs/dashboard-performance-real-fix/page-audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📝 Detailed report saved to: ${reportPath}`);
  
  // Generate markdown summary
  const mdReport = generateMarkdownReport(report);
  const mdPath = path.join(process.cwd(), '.kiro/specs/dashboard-performance-real-fix/page-audit-report.md');
  fs.writeFileSync(mdPath, mdReport);
  console.log(`📝 Markdown report saved to: ${mdPath}`);
  
  console.log('\n✅ Audit complete!');
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(report: any): string {
  return `# Page Data Requirements Audit Report

**Generated:** ${new Date(report.timestamp).toLocaleString()}

## Summary

- **Total Pages:** ${report.summary.total}
- **Real-Time Data Pages:** ${report.summary.realTime}
- **User-Specific Pages:** ${report.summary.userSpecific}
- **Static Pages:** ${report.summary.static}
- **Pages with force-dynamic:** ${report.summary.withForceDynamic}

## 🔴 Real-Time Data Pages (Keep Dynamic)

These pages fetch frequently changing data and should remain dynamic:

${report.pages.realTime.map((page: PageAudit) => `
### ${page.path}

- **Reason:** ${page.reason}
- **Has force-dynamic:** ${page.hasForceDynamic ? '✅' : '❌'}
- **Recommendations:**
${page.recommendations.map((rec: string) => `  - ${rec}`).join('\n')}
`).join('\n')}

## 🟡 User-Specific Pages (Selective Dynamic)

These pages need user authentication but could benefit from partial caching:

${report.pages.userSpecific.map((page: PageAudit) => `
### ${page.path}

- **Reason:** ${page.reason}
- **Has force-dynamic:** ${page.hasForceDynamic ? '✅' : '❌'}
- **Recommendations:**
${page.recommendations.map((rec: string) => `  - ${rec}`).join('\n')}
`).join('\n')}

## 🟢 Static Pages (Can Be Static)

These pages can be statically generated for better performance:

${report.pages.static.map((page: PageAudit) => `
### ${page.path}

- **Reason:** ${page.reason}
- **Has force-dynamic:** ${page.hasForceDynamic ? '✅ (REMOVE!)' : '❌'}
- **Recommendations:**
${page.recommendations.map((rec: string) => `  - ${rec}`).join('\n')}
`).join('\n')}

## Next Steps

1. Remove \`force-dynamic\` from the main layout (app/(app)/layout.tsx)
2. Add \`export const dynamic = 'force-dynamic'\` only to real-time data pages
3. Add \`export const revalidate = 60\` to user-specific pages for ISR
4. Enable static generation for static pages
5. Test build process to ensure no database connection errors
`;
}

// Run audit
auditPages().catch(console.error);
