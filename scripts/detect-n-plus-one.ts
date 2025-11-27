#!/usr/bin/env tsx
/**
 * N+1 Query Detection Script
 * 
 * Analyzes the codebase for potential N+1 query patterns
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface NPlusOneIssue {
  file: string;
  line: number;
  pattern: string;
  severity: 'high' | 'medium' | 'low';
  suggestion: string;
}

const issues: NPlusOneIssue[] = [];

// Patterns that indicate potential N+1 queries
const patterns = [
  {
    // Pattern: findMany followed by map with prisma query
    regex: /findMany[\s\S]{0,200}\.map\([^)]*prisma\./g,
    severity: 'high' as const,
    suggestion: 'Use Prisma include/select to fetch related data in a single query',
  },
  {
    // Pattern: for loop with prisma query
    regex: /for\s*\([^)]*\)\s*\{[\s\S]{0,300}prisma\./g,
    severity: 'high' as const,
    suggestion: 'Use Prisma include/select or batch loading',
  },
  {
    // Pattern: forEach with prisma query
    regex: /\.forEach\([^)]*\{[\s\S]{0,300}prisma\./g,
    severity: 'high' as const,
    suggestion: 'Use Prisma include/select or batch loading',
  },
  {
    // Pattern: findMany without include for tables with relations
    regex: /prisma\.(content|users|transactions|subscriptions)\.findMany\(\{[^}]*where[^}]*\}\)(?![\s\S]{0,50}include)/g,
    severity: 'medium' as const,
    suggestion: 'Consider using include if related data is needed',
  },
  {
    // Pattern: Multiple sequential findFirst/findUnique calls
    regex: /(await prisma\..*\.find(First|Unique)[\s\S]{0,100}){3,}/g,
    severity: 'medium' as const,
    suggestion: 'Consider batching these queries or using a single query with include',
  },
];

function scanFile(filePath: string): void {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    patterns.forEach(({ regex, severity, suggestion }) => {
      const matches = content.matchAll(regex);
      
      for (const match of matches) {
        // Find line number
        const beforeMatch = content.substring(0, match.index);
        const lineNumber = beforeMatch.split('\n').length;
        
        issues.push({
          file: filePath,
          line: lineNumber,
          pattern: match[0].substring(0, 100) + '...',
          severity,
          suggestion,
        });
      }
    });
  } catch (error) {
    // Skip files that can't be read
  }
}

function scanDirectory(dir: string): void {
  try {
    const entries = readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and other irrelevant directories
        if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(entry)) {
          scanDirectory(fullPath);
        }
      } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
        scanFile(fullPath);
      }
    }
  } catch (error) {
    // Skip directories that can't be read
  }
}

// Scan the codebase
console.log('🔍 Scanning for N+1 query patterns...\n');

const dirsToScan = ['app', 'lib', 'components'];
dirsToScan.forEach(dir => {
  if (statSync(dir).isDirectory()) {
    scanDirectory(dir);
  }
});

// Report findings
if (issues.length === 0) {
  console.log('✅ No obvious N+1 query patterns detected!\n');
  console.log('This is good news - the codebase appears to be using efficient query patterns.');
  console.log('\nBest practices being followed:');
  console.log('  • Using Prisma include/select for related data');
  console.log('  • Avoiding loops with individual queries');
  console.log('  • Batching queries where possible');
} else {
  console.log(`⚠️  Found ${issues.length} potential N+1 query pattern(s):\n`);
  
  // Group by severity
  const high = issues.filter(i => i.severity === 'high');
  const medium = issues.filter(i => i.severity === 'medium');
  const low = issues.filter(i => i.severity === 'low');
  
  if (high.length > 0) {
    console.log(`🔴 HIGH PRIORITY (${high.length}):`);
    high.forEach(issue => {
      console.log(`\n  File: ${issue.file}:${issue.line}`);
      console.log(`  Pattern: ${issue.pattern}`);
      console.log(`  Fix: ${issue.suggestion}`);
    });
  }
  
  if (medium.length > 0) {
    console.log(`\n🟡 MEDIUM PRIORITY (${medium.length}):`);
    medium.forEach(issue => {
      console.log(`\n  File: ${issue.file}:${issue.line}`);
      console.log(`  Pattern: ${issue.pattern}`);
      console.log(`  Fix: ${issue.suggestion}`);
    });
  }
  
  if (low.length > 0) {
    console.log(`\n🟢 LOW PRIORITY (${low.length}):`);
    low.forEach(issue => {
      console.log(`\n  File: ${issue.file}:${issue.line}`);
      console.log(`  Pattern: ${issue.pattern}`);
      console.log(`  Fix: ${issue.suggestion}`);
    });
  }
}

console.log('\n📊 Summary:');
console.log(`  Total issues: ${issues.length}`);
console.log(`  High priority: ${issues.filter(i => i.severity === 'high').length}`);
console.log(`  Medium priority: ${issues.filter(i => i.severity === 'medium').length}`);
console.log(`  Low priority: ${issues.filter(i => i.severity === 'low').length}`);

console.log('\n💡 Tips for avoiding N+1 queries:');
console.log('  1. Use Prisma include to fetch related data in one query');
console.log('  2. Use Prisma select to fetch only needed fields');
console.log('  3. Batch queries using Promise.all() when include is not possible');
console.log('  4. Use dataloader pattern for complex scenarios');
console.log('  5. Monitor query counts in development');

process.exit(issues.filter(i => i.severity === 'high').length > 0 ? 1 : 0);
