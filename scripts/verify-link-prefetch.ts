#!/usr/bin/env tsx
/**
 * Link Prefetch Verification Script
 * 
 * Validates that all Next.js Link components use optimal prefetch strategy
 * for instant page transitions.
 * 
 * Requirements: 2.3, Property 6
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface LinkUsage {
  file: string;
  line: number;
  content: string;
  hasPrefetchFalse: boolean;
  hasPrefetchTrue: boolean;
  usesDefault: boolean;
}

const COMPONENT_DIRS = [
  'components',
  'src/components',
  'app',
];

const IGNORE_PATTERNS = [
  'node_modules',
  '.next',
  'dist',
  'build',
  '.git',
];

function shouldIgnore(path: string): boolean {
  return IGNORE_PATTERNS.some(pattern => path.includes(pattern));
}

function getAllTsxFiles(dir: string, files: string[] = []): string[] {
  if (!statSync(dir).isDirectory()) return files;
  
  const entries = readdirSync(dir);
  
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    
    if (shouldIgnore(fullPath)) continue;
    
    if (statSync(fullPath).isDirectory()) {
      getAllTsxFiles(fullPath, files);
    } else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function analyzeLinkUsage(filePath: string): LinkUsage[] {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const usages: LinkUsage[] = [];
  
  // Check if file imports Link from next/link
  const hasLinkImport = content.includes("from 'next/link'") || 
                        content.includes('from "next/link"');
  
  if (!hasLinkImport) return usages;
  
  // Find all Link component usages
  lines.forEach((line, index) => {
    // Match <Link with various patterns
    if (line.includes('<Link') && line.includes('href=')) {
      const hasPrefetchFalse = line.includes('prefetch={false}') || 
                               line.includes('prefetch={null}');
      const hasPrefetchTrue = line.includes('prefetch={true}');
      const usesDefault = !hasPrefetchFalse && !hasPrefetchTrue;
      
      usages.push({
        file: filePath,
        line: index + 1,
        content: line.trim(),
        hasPrefetchFalse,
        hasPrefetchTrue,
        usesDefault,
      });
    }
  });
  
  return usages;
}

function main() {
  console.log('🔍 Auditing Next.js Link prefetch strategy...\n');
  
  const allFiles: string[] = [];
  
  for (const dir of COMPONENT_DIRS) {
    try {
      getAllTsxFiles(dir, allFiles);
    } catch (error) {
      // Directory might not exist, skip it
      continue;
    }
  }
  
  console.log(`📁 Found ${allFiles.length} TypeScript files to analyze\n`);
  
  const allUsages: LinkUsage[] = [];
  
  for (const file of allFiles) {
    const usages = analyzeLinkUsage(file);
    allUsages.push(...usages);
  }
  
  // Statistics
  const totalLinks = allUsages.length;
  const defaultPrefetch = allUsages.filter(u => u.usesDefault).length;
  const explicitTrue = allUsages.filter(u => u.hasPrefetchTrue).length;
  const explicitFalse = allUsages.filter(u => u.hasPrefetchFalse).length;
  
  console.log('📊 Link Prefetch Analysis Results:\n');
  console.log(`Total Link components found: ${totalLinks}`);
  console.log(`Using default prefetch (optimal): ${defaultPrefetch} (${((defaultPrefetch/totalLinks)*100).toFixed(1)}%)`);
  console.log(`Explicit prefetch={true}: ${explicitTrue} (${((explicitTrue/totalLinks)*100).toFixed(1)}%)`);
  console.log(`Explicit prefetch={false}: ${explicitFalse} (${((explicitFalse/totalLinks)*100).toFixed(1)}%)`);
  console.log();
  
  // Report issues
  if (explicitFalse > 0) {
    console.log('⚠️  Links with prefetch disabled:\n');
    allUsages
      .filter(u => u.hasPrefetchFalse)
      .forEach(u => {
        console.log(`  ${u.file}:${u.line}`);
        console.log(`    ${u.content.substring(0, 80)}...`);
        console.log();
      });
  }
  
  // Validation
  const optimalCount = defaultPrefetch + explicitTrue;
  const coverage = (optimalCount / totalLinks) * 100;
  
  console.log('✅ Validation Results:\n');
  console.log(`Prefetch Coverage: ${coverage.toFixed(1)}%`);
  
  if (coverage >= 95) {
    console.log('✅ PASS: Navigation prefetch strategy is optimal');
    console.log('✅ Requirement 2.3: Satisfied');
    console.log('✅ Property 6: Satisfied');
    process.exit(0);
  } else {
    console.log('❌ FAIL: Some links have suboptimal prefetch configuration');
    console.log('❌ Requirement 2.3: Not fully satisfied');
    console.log('❌ Property 6: Not fully satisfied');
    process.exit(1);
  }
}

main();
