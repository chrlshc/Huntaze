#!/usr/bin/env tsx
/**
 * File Scanner Script for Codebase Cleanup
 * 
 * This script scans the codebase to identify:
 * - Backup files (.backup, .bak, .old, -backup, -old)
 * - Duplicate page files (page-backup.tsx, page-old-generic.tsx)
 * - Test/demo files in production directories
 * 
 * Generates: cleanup-analysis-report.md
 */

import * as fs from 'fs';
import * as path from 'path';

interface BackupFile {
  path: string;
  pattern: string;
  size: number;
}

interface DuplicatePageFile {
  path: string;
  directory: string;
  isActive: boolean;
}

interface TestDemoFile {
  path: string;
  reason: string;
}

interface ScanResults {
  backupFiles: BackupFile[];
  duplicatePages: DuplicatePageFile[];
  testDemoFiles: TestDemoFile[];
  totalSize: number;
}

// Patterns to identify backup files
const BACKUP_PATTERNS = [
  /\.backup$/,
  /\.bak$/,
  /\.old$/,
  /-backup\./,
  /-old\./,
  /\.copy$/,
  /-copy\./,
];

// Patterns to identify test/demo files in production
const TEST_DEMO_PATTERNS = [
  /test\.tsx?$/,
  /demo\.tsx?$/,
  /\.test\.tsx?$/,
  /\.spec\.tsx?$/,
  /-test\./,
  /-demo\./,
  /debug/i,
  /simple.*test/i,
];

// Directories to exclude from scanning
const EXCLUDE_DIRS = [
  'node_modules',
  '.next',
  '.git',
  'dist',
  'build',
  'coverage',
  'tests',
  'test',
  '__tests__',
  'test-results',
];

// Production directories where test/demo files shouldn't be
const PRODUCTION_DIRS = [
  'app',
  'components',
  'lib',
  'hooks',
  'contexts',
];

/**
 * Recursively scan directory for files
 */
function scanDirectory(
  dir: string,
  results: ScanResults,
  rootDir: string = dir
): void {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(rootDir, fullPath);

      // Skip excluded directories
      if (entry.isDirectory() && EXCLUDE_DIRS.includes(entry.name)) {
        continue;
      }

      if (entry.isDirectory()) {
        scanDirectory(fullPath, results, rootDir);
      } else {
        // Check for backup files
        if (isBackupFile(entry.name)) {
          const stats = fs.statSync(fullPath);
          results.backupFiles.push({
            path: relativePath,
            pattern: getBackupPattern(entry.name),
            size: stats.size,
          });
          results.totalSize += stats.size;
        }

        // Check for duplicate page files
        if (isDuplicatePageFile(entry.name, dir)) {
          results.duplicatePages.push({
            path: relativePath,
            directory: path.relative(rootDir, dir),
            isActive: entry.name === 'page.tsx' || entry.name === 'page.ts',
          });
        }

        // Check for test/demo files in production directories
        if (isTestDemoInProduction(fullPath, rootDir)) {
          results.testDemoFiles.push({
            path: relativePath,
            reason: getTestDemoReason(entry.name),
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error);
  }
}

/**
 * Check if filename matches backup patterns
 */
function isBackupFile(filename: string): boolean {
  return BACKUP_PATTERNS.some(pattern => pattern.test(filename));
}

/**
 * Get the backup pattern that matched
 */
function getBackupPattern(filename: string): string {
  for (const pattern of BACKUP_PATTERNS) {
    if (pattern.test(filename)) {
      return pattern.source;
    }
  }
  return 'unknown';
}

/**
 * Check if file is a duplicate page file
 */
function isDuplicatePageFile(filename: string, dir: string): boolean {
  // Check if it's a page file variant
  const pageVariants = [
    'page.tsx',
    'page.ts',
    'page-backup.tsx',
    'page-old.tsx',
    'page-old-generic.tsx',
    'page.backup.tsx',
    'page.old.tsx',
  ];

  if (!pageVariants.some(variant => filename === variant)) {
    return false;
  }

  // Check if directory contains multiple page variants
  try {
    const files = fs.readdirSync(dir);
    const pageFiles = files.filter(f => 
      f.startsWith('page') && (f.endsWith('.tsx') || f.endsWith('.ts'))
    );
    return pageFiles.length > 1;
  } catch {
    return false;
  }
}

/**
 * Check if file is a test/demo file in production directory
 */
function isTestDemoInProduction(filePath: string, rootDir: string): boolean {
  const relativePath = path.relative(rootDir, filePath);
  const filename = path.basename(filePath);

  // Check if in production directory
  const isInProduction = PRODUCTION_DIRS.some(dir => 
    relativePath.startsWith(dir + path.sep)
  );

  if (!isInProduction) {
    return false;
  }

  // Check if matches test/demo patterns
  return TEST_DEMO_PATTERNS.some(pattern => pattern.test(filename));
}

/**
 * Get reason why file is considered test/demo
 */
function getTestDemoReason(filename: string): string {
  if (/test\.tsx?$/.test(filename)) return 'Test file (ends with test.ts/tsx)';
  if (/demo\.tsx?$/.test(filename)) return 'Demo file (ends with demo.ts/tsx)';
  if (/\.test\.tsx?$/.test(filename)) return 'Test file (.test.ts/tsx)';
  if (/\.spec\.tsx?$/.test(filename)) return 'Spec file (.spec.ts/tsx)';
  if (/-test\./.test(filename)) return 'Test file (contains -test)';
  if (/-demo\./.test(filename)) return 'Demo file (contains -demo)';
  if (/debug/i.test(filename)) return 'Debug file (contains debug)';
  if (/simple.*test/i.test(filename)) return 'Simple test file';
  return 'Unknown test/demo pattern';
}

/**
 * Format file size in human-readable format
 */
function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Generate markdown report
 */
function generateReport(results: ScanResults): string {
  const lines: string[] = [];

  lines.push('# Cleanup Analysis Report');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- **Backup files found**: ${results.backupFiles.length}`);
  lines.push(`- **Duplicate page files found**: ${results.duplicatePages.length}`);
  lines.push(`- **Test/demo files in production**: ${results.testDemoFiles.length}`);
  lines.push(`- **Total size of backup files**: ${formatSize(results.totalSize)}`);
  lines.push('');

  // Backup Files Section
  lines.push('## Backup Files');
  lines.push('');
  if (results.backupFiles.length === 0) {
    lines.push('✅ No backup files found.');
  } else {
    lines.push('The following backup files were identified and can be safely removed:');
    lines.push('');
    lines.push('| File Path | Pattern | Size |');
    lines.push('|-----------|---------|------|');
    for (const file of results.backupFiles) {
      lines.push(`| ${file.path} | ${file.pattern} | ${formatSize(file.size)} |`);
    }
  }
  lines.push('');

  // Duplicate Page Files Section
  lines.push('## Duplicate Page Files');
  lines.push('');
  if (results.duplicatePages.length === 0) {
    lines.push('✅ No duplicate page files found.');
  } else {
    lines.push('The following directories contain multiple page file variants:');
    lines.push('');
    
    // Group by directory
    const byDirectory = new Map<string, DuplicatePageFile[]>();
    for (const page of results.duplicatePages) {
      if (!byDirectory.has(page.directory)) {
        byDirectory.set(page.directory, []);
      }
      byDirectory.get(page.directory)!.push(page);
    }

    for (const [dir, pages] of byDirectory) {
      lines.push(`### ${dir}`);
      lines.push('');
      for (const page of pages) {
        const status = page.isActive ? '✅ Active' : '⚠️ Duplicate';
        lines.push(`- ${status}: ${page.path}`);
      }
      lines.push('');
    }
  }

  // Test/Demo Files Section
  lines.push('## Test/Demo Files in Production Directories');
  lines.push('');
  if (results.testDemoFiles.length === 0) {
    lines.push('✅ No test/demo files found in production directories.');
  } else {
    lines.push('The following test/demo files should be moved to test directories or removed:');
    lines.push('');
    lines.push('| File Path | Reason |');
    lines.push('|-----------|--------|');
    for (const file of results.testDemoFiles) {
      lines.push(`| ${file.path} | ${file.reason} |`);
    }
  }
  lines.push('');

  // Recommendations Section
  lines.push('## Recommendations');
  lines.push('');
  lines.push('### Immediate Actions');
  lines.push('');
  if (results.backupFiles.length > 0) {
    lines.push(`1. **Remove ${results.backupFiles.length} backup files** to free up ${formatSize(results.totalSize)}`);
  }
  if (results.duplicatePages.length > 0) {
    lines.push(`2. **Consolidate ${results.duplicatePages.length} duplicate page files** to single active versions`);
  }
  if (results.testDemoFiles.length > 0) {
    lines.push(`3. **Move or remove ${results.testDemoFiles.length} test/demo files** from production directories`);
  }
  lines.push('');
  lines.push('### Next Steps');
  lines.push('');
  lines.push('1. Review this report carefully');
  lines.push('2. Verify that backup files are truly obsolete');
  lines.push('3. Ensure duplicate pages are not actively used');
  lines.push('4. Move test files to appropriate test directories');
  lines.push('5. Run the cleanup scripts to remove identified files');
  lines.push('');

  return lines.join('\n');
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Scanning codebase for cleanup opportunities...\n');

  const rootDir = process.cwd();
  const results: ScanResults = {
    backupFiles: [],
    duplicatePages: [],
    testDemoFiles: [],
    totalSize: 0,
  };

  // Scan the codebase
  scanDirectory(rootDir, results);

  // Generate report
  const report = generateReport(results);
  const reportPath = path.join(rootDir, 'cleanup-analysis-report.md');
  fs.writeFileSync(reportPath, report, 'utf-8');

  // Print summary
  console.log('✅ Scan complete!\n');
  console.log('Summary:');
  console.log(`  - Backup files: ${results.backupFiles.length}`);
  console.log(`  - Duplicate pages: ${results.duplicatePages.length}`);
  console.log(`  - Test/demo files in production: ${results.testDemoFiles.length}`);
  console.log(`  - Total backup file size: ${formatSize(results.totalSize)}\n`);
  console.log(`📄 Report generated: ${reportPath}`);
}

// Run the script
main();
