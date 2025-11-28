/**
 * Property-Based Test: Spec Documentation Limit
 * 
 * Feature: codebase-cleanup-refactor, Property 8: Spec Documentation Limit
 * Validates: Requirements 3.5
 * 
 * Property: For any spec directory in .kiro/specs/, the number of non-essential 
 * documentation files (excluding requirements.md, design.md, tasks.md, README.md, 
 * INDEX.md, FINAL-REPORT.md, and archive/) should not exceed a reasonable limit.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const SPECS_DIR = '.kiro/specs';
const ESSENTIAL_FILES = [
  'requirements.md',
  'design.md',
  'tasks.md',
  'README.md',
  'INDEX.md',
  'FINAL-REPORT.md',
  'STATUS.md',
  'POUR-VOUS.md',
];
const ESSENTIAL_DIRS = ['archive'];
const MAX_NON_ESSENTIAL_FILES = 5; // Maximum allowed non-essential files

interface SpecAnalysis {
  specName: string;
  totalFiles: number;
  essentialFiles: string[];
  nonEssentialFiles: string[];
  hasArchive: boolean;
}

function analyzeSpecDirectory(specPath: string): SpecAnalysis {
  const specName = path.basename(specPath);
  const files = fs.readdirSync(specPath);
  
  const essentialFiles: string[] = [];
  const nonEssentialFiles: string[] = [];
  let hasArchive = false;

  for (const file of files) {
    const filePath = path.join(specPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (ESSENTIAL_DIRS.includes(file)) {
        hasArchive = true;
      }
      continue; // Skip directories in file count
    }

    if (ESSENTIAL_FILES.includes(file)) {
      essentialFiles.push(file);
    } else {
      nonEssentialFiles.push(file);
    }
  }

  return {
    specName,
    totalFiles: essentialFiles.length + nonEssentialFiles.length,
    essentialFiles,
    nonEssentialFiles,
    hasArchive,
  };
}

function getAllSpecDirectories(): string[] {
  if (!fs.existsSync(SPECS_DIR)) {
    return [];
  }

  const entries = fs.readdirSync(SPECS_DIR);
  return entries
    .map(entry => path.join(SPECS_DIR, entry))
    .filter(entryPath => {
      try {
        return fs.statSync(entryPath).isDirectory();
      } catch {
        return false;
      }
    });
}

describe('Property 8: Spec Documentation Limit', () => {
  it('should have a reasonable number of non-essential files in each spec directory', () => {
    const specDirs = getAllSpecDirectories();
    
    expect(specDirs.length).toBeGreaterThan(0);

    const violations: string[] = [];

    for (const specDir of specDirs) {
      const analysis = analyzeSpecDirectory(specDir);

      if (analysis.nonEssentialFiles.length > MAX_NON_ESSENTIAL_FILES) {
        violations.push(
          `${analysis.specName}: ${analysis.nonEssentialFiles.length} non-essential files (max: ${MAX_NON_ESSENTIAL_FILES})\n` +
          `  Files: ${analysis.nonEssentialFiles.join(', ')}`
        );
      }
    }

    if (violations.length > 0) {
      throw new Error(
        `Spec directories exceed documentation limit:\n\n${violations.join('\n\n')}\n\n` +
        `Consider moving completion reports and intermediate documentation to archive/ subdirectories.`
      );
    }
  });

  it('should have FINAL-REPORT.md in completed spec directories', () => {
    const specDirs = getAllSpecDirectories();
    const missingFinalReport: string[] = [];

    for (const specDir of specDirs) {
      const analysis = analyzeSpecDirectory(specDir);
      
      // If spec has many files or an archive, it should have a FINAL-REPORT.md
      if ((analysis.totalFiles > 5 || analysis.hasArchive) && 
          !analysis.essentialFiles.includes('FINAL-REPORT.md')) {
        missingFinalReport.push(analysis.specName);
      }
    }

    if (missingFinalReport.length > 0) {
      throw new Error(
        `Completed specs missing FINAL-REPORT.md:\n${missingFinalReport.join('\n')}\n\n` +
        `Create a consolidated FINAL-REPORT.md for each completed spec.`
      );
    }
  });

  it('should have archive directory for specs with many completion files', () => {
    const specDirs = getAllSpecDirectories();
    const needsArchive: string[] = [];

    for (const specDir of specDirs) {
      const analysis = analyzeSpecDirectory(specDir);
      
      // Check for completion file patterns
      const completionFiles = analysis.nonEssentialFiles.filter(file =>
        file.includes('COMPLETE') ||
        file.includes('SUMMARY') ||
        file.includes('TASK-') ||
        file.includes('PHASE-') ||
        file.includes('🎉') ||
        file.includes('✅')
      );

      if (completionFiles.length > 3 && !analysis.hasArchive) {
        needsArchive.push(
          `${analysis.specName}: ${completionFiles.length} completion files without archive/`
        );
      }
    }

    if (needsArchive.length > 0) {
      throw new Error(
        `Specs need archive/ directory:\n${needsArchive.join('\n')}\n\n` +
        `Create archive/ subdirectory and move completion files there.`
      );
    }
  });

  it('should generate documentation analysis report', () => {
    const specDirs = getAllSpecDirectories();
    const analyses = specDirs.map(analyzeSpecDirectory);

    const report = {
      totalSpecs: analyses.length,
      specsWithArchive: analyses.filter(a => a.hasArchive).length,
      specsWithFinalReport: analyses.filter(a => 
        a.essentialFiles.includes('FINAL-REPORT.md')
      ).length,
      averageNonEssentialFiles: 
        analyses.reduce((sum, a) => sum + a.nonEssentialFiles.length, 0) / analyses.length,
      specsExceedingLimit: analyses.filter(a => 
        a.nonEssentialFiles.length > MAX_NON_ESSENTIAL_FILES
      ).length,
    };

    // This test always passes but logs useful information
    console.log('\n📊 Spec Documentation Analysis:');
    console.log(`  Total specs: ${report.totalSpecs}`);
    console.log(`  Specs with archive/: ${report.specsWithArchive}`);
    console.log(`  Specs with FINAL-REPORT.md: ${report.specsWithFinalReport}`);
    console.log(`  Average non-essential files: ${report.averageNonEssentialFiles.toFixed(1)}`);
    console.log(`  Specs exceeding limit: ${report.specsExceedingLimit}`);

    expect(report.totalSpecs).toBeGreaterThan(0);
  });
});
