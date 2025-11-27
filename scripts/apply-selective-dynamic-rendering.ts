#!/usr/bin/env tsx
/**
 * Apply Selective Dynamic Rendering
 * Task 3.4: Configure per-page rendering strategy
 * 
 * This script adds export const dynamic = 'force-dynamic' to pages that need it
 * based on the audit results from Task 3.1
 * 
 * Requirements: 2.1, 2.2
 */

import fs from 'fs';
import path from 'path';

const AUDIT_REPORT_PATH = path.join(
  process.cwd(),
  '.kiro/specs/dashboard-performance-real-fix/page-audit-report.json'
);

interface PageAudit {
  path: string;
  file: string;
  dataRequirements: 'real-time' | 'user-specific' | 'static';
  reason: string;
  hasForceDynamic: boolean;
  recommendations: string[];
}

interface AuditReport {
  timestamp: string;
  summary: {
    total: number;
    realTime: number;
    userSpecific: number;
    static: number;
    withForceDynamic: number;
  };
  pages: {
    realTime: PageAudit[];
    userSpecific: PageAudit[];
    static: PageAudit[];
  };
}

/**
 * Add force-dynamic export to a file
 */
function addForceDynamic(filePath: string, reason: string): boolean {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Skip if already has force-dynamic
    if (content.includes("export const dynamic = 'force-dynamic'")) {
      console.log(`  ⏭️  Already has force-dynamic: ${filePath}`);
      return false;
    }
    
    // Determine where to insert based on file type
    const isClientComponent = content.includes("'use client'");
    
    if (isClientComponent) {
      // For client components, add after 'use client'
      const comment = `\n/**\n * ${reason}\n * Requires dynamic rendering\n * Requirements: 2.1, 2.2\n */\nexport const dynamic = 'force-dynamic';\n`;
      content = content.replace("'use client';", "'use client';" + comment);
    } else {
      // For server components, add at the top
      const comment = `/**\n * ${reason}\n * Requires dynamic rendering\n * Requirements: 2.1, 2.2\n */\nexport const dynamic = 'force-dynamic';\n\n`;
      content = comment + content;
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`  ✅ Added force-dynamic: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`  ❌ Error processing ${filePath}:`, error);
    return false;
  }
}

/**
 * Remove force-dynamic export from a file
 */
function removeForceDynamic(filePath: string): boolean {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Skip if doesn't have force-dynamic
    if (!content.includes("export const dynamic = 'force-dynamic'")) {
      console.log(`  ⏭️  No force-dynamic to remove: ${filePath}`);
      return false;
    }
    
    // Remove the export and any preceding comment
    content = content.replace(
      /\/\*\*[\s\S]*?\*\/\s*export const dynamic = 'force-dynamic';\s*/g,
      ''
    );
    content = content.replace(
      /export const dynamic = 'force-dynamic';\s*/g,
      ''
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`  ✅ Removed force-dynamic: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`  ❌ Error processing ${filePath}:`, error);
    return false;
  }
}

/**
 * Main function
 */
async function applySelectiveDynamicRendering() {
  console.log('🔧 Applying selective dynamic rendering...\n');
  
  // Load audit report
  if (!fs.existsSync(AUDIT_REPORT_PATH)) {
    console.error('❌ Audit report not found. Run audit-page-data-requirements.ts first.');
    process.exit(1);
  }
  
  const report: AuditReport = JSON.parse(fs.readFileSync(AUDIT_REPORT_PATH, 'utf-8'));
  
  let added = 0;
  let removed = 0;
  let skipped = 0;
  
  // Add force-dynamic to real-time pages
  console.log('🔴 Adding force-dynamic to real-time pages...');
  for (const page of report.pages.realTime) {
    const filePath = path.join(process.cwd(), page.path);
    if (!page.hasForceDynamic) {
      if (addForceDynamic(filePath, page.reason)) {
        added++;
      } else {
        skipped++;
      }
    } else {
      console.log(`  ⏭️  Already configured: ${page.path}`);
      skipped++;
    }
  }
  
  // Add force-dynamic to user-specific pages
  console.log('\n🟡 Adding force-dynamic to user-specific pages...');
  for (const page of report.pages.userSpecific) {
    const filePath = path.join(process.cwd(), page.path);
    if (!page.hasForceDynamic) {
      if (addForceDynamic(filePath, page.reason)) {
        added++;
      } else {
        skipped++;
      }
    } else {
      console.log(`  ⏭️  Already configured: ${page.path}`);
      skipped++;
    }
  }
  
  // Remove force-dynamic from static pages
  console.log('\n🟢 Removing force-dynamic from static pages...');
  for (const page of report.pages.static) {
    const filePath = path.join(process.cwd(), page.path);
    if (page.hasForceDynamic) {
      if (removeForceDynamic(filePath)) {
        removed++;
      } else {
        skipped++;
      }
    } else {
      console.log(`  ⏭️  Already static: ${page.path}`);
      skipped++;
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Added force-dynamic: ${added} pages`);
  console.log(`🗑️  Removed force-dynamic: ${removed} pages`);
  console.log(`⏭️  Skipped (already configured): ${skipped} pages`);
  console.log('='.repeat(80));
  console.log('\n✅ Selective dynamic rendering applied!');
  console.log('\n📝 Next steps:');
  console.log('  1. Test build: npm run build');
  console.log('  2. Verify no database connection errors');
  console.log('  3. Check that dynamic pages still work correctly');
}

// Run
applySelectiveDynamicRendering().catch(console.error);
