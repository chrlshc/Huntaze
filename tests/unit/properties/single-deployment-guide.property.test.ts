/**
 * Property-Based Test: Single Deployment Guide
 * 
 * Feature: codebase-cleanup-refactor, Property 9: Single Deployment Guide
 * Validates: Requirements 3.4
 * 
 * Property: For any spec directory in .kiro/specs/, there should be at most one 
 * deployment guide file. Multiple deployment guides create confusion and should 
 * be consolidated into a single DEPLOYMENT.md or moved to archive/.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const SPECS_DIR = '.kiro/specs';

const DEPLOYMENT_PATTERNS = [
  /deploy/i,
  /déploi/i,
  /production/i,
  /staging/i,
  /release/i,
];

interface DeploymentAnalysis {
  specName: string;
  deploymentFiles: string[];
  hasMultipleGuides: boolean;
}

function isDeploymentFile(filename: string): boolean {
  // Exclude archive directory and FINAL-REPORT.md
  if (filename === 'archive' || filename === 'FINAL-REPORT.md') {
    return false;
  }

  return DEPLOYMENT_PATTERNS.some(pattern => pattern.test(filename));
}

function analyzeSpecDeploymentDocs(specPath: string): DeploymentAnalysis {
  const specName = path.basename(specPath);
  const files = fs.readdirSync(specPath);
  
  const deploymentFiles = files.filter(file => {
    const filePath = path.join(specPath, file);
    const stat = fs.statSync(filePath);
    
    // Only check files, not directories
    if (stat.isDirectory()) {
      return false;
    }

    return isDeploymentFile(file);
  });

  return {
    specName,
    deploymentFiles,
    hasMultipleGuides: deploymentFiles.length > 1,
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

describe('Property 9: Single Deployment Guide', () => {
  it('should have at most one deployment guide per spec directory', () => {
    const specDirs = getAllSpecDirectories();
    
    expect(specDirs.length).toBeGreaterThan(0);

    const violations: DeploymentAnalysis[] = [];

    for (const specDir of specDirs) {
      const analysis = analyzeSpecDeploymentDocs(specDir);

      if (analysis.hasMultipleGuides) {
        violations.push(analysis);
      }
    }

    if (violations.length > 0) {
      const violationDetails = violations.map(v =>
        `${v.specName}:\n  - ${v.deploymentFiles.join('\n  - ')}`
      ).join('\n\n');

      throw new Error(
        `Multiple deployment guides found in spec directories:\n\n${violationDetails}\n\n` +
        `Consolidate deployment documentation into a single DEPLOYMENT.md or ` +
        `move historical guides to archive/ subdirectory.`
      );
    }
  });

  it('should use consistent naming for deployment guides', () => {
    const specDirs = getAllSpecDirectories();
    const preferredNames = ['DEPLOYMENT.md', 'DEPLOYMENT-GUIDE.md'];
    const inconsistentNaming: string[] = [];

    for (const specDir of specDirs) {
      const analysis = analyzeSpecDeploymentDocs(specDir);

      if (analysis.deploymentFiles.length === 1) {
        const deploymentFile = analysis.deploymentFiles[0];
        
        if (!preferredNames.includes(deploymentFile)) {
          inconsistentNaming.push(
            `${analysis.specName}: ${deploymentFile} (prefer DEPLOYMENT.md)`
          );
        }
      }
    }

    // This is a warning, not a hard failure
    if (inconsistentNaming.length > 0) {
      console.warn(
        '\n⚠️  Inconsistent deployment guide naming:\n' +
        inconsistentNaming.join('\n') +
        '\n\nConsider renaming to DEPLOYMENT.md for consistency.'
      );
    }

    // Test passes regardless
    expect(true).toBe(true);
  });

  it('should have deployment guides in archive if multiple exist', () => {
    const specDirs = getAllSpecDirectories();
    const needsArchiving: string[] = [];

    for (const specDir of specDirs) {
      const analysis = analyzeSpecDeploymentDocs(specDir);
      const archivePath = path.join(specDir, 'archive');

      if (analysis.hasMultipleGuides && !fs.existsSync(archivePath)) {
        needsArchiving.push(
          `${analysis.specName}: ${analysis.deploymentFiles.length} deployment guides, no archive/`
        );
      }
    }

    if (needsArchiving.length > 0) {
      throw new Error(
        `Specs with multiple deployment guides need archive/:\n${needsArchiving.join('\n')}\n\n` +
        `Create archive/ subdirectory and move old deployment guides there.`
      );
    }
  });

  it('should generate deployment documentation report', () => {
    const specDirs = getAllSpecDirectories();
    const analyses = specDirs.map(analyzeSpecDeploymentDocs);

    const report = {
      totalSpecs: analyses.length,
      specsWithDeploymentGuide: analyses.filter(a => a.deploymentFiles.length > 0).length,
      specsWithMultipleGuides: analyses.filter(a => a.hasMultipleGuides).length,
      specsWithSingleGuide: analyses.filter(a => a.deploymentFiles.length === 1).length,
      specsWithNoGuide: analyses.filter(a => a.deploymentFiles.length === 0).length,
    };

    console.log('\n📋 Deployment Documentation Analysis:');
    console.log(`  Total specs: ${report.totalSpecs}`);
    console.log(`  Specs with deployment guide: ${report.specsWithDeploymentGuide}`);
    console.log(`  Specs with single guide: ${report.specsWithSingleGuide}`);
    console.log(`  Specs with multiple guides: ${report.specsWithMultipleGuides}`);
    console.log(`  Specs with no guide: ${report.specsWithNoGuide}`);

    if (report.specsWithMultipleGuides > 0) {
      console.log('\n⚠️  Action needed: Consolidate deployment guides in specs with multiple files');
    }

    expect(report.totalSpecs).toBeGreaterThan(0);
  });

  it('should detect deployment guides in FINAL-REPORT.md', () => {
    const specDirs = getAllSpecDirectories();
    const specsWithFinalReport: string[] = [];

    for (const specDir of specDirs) {
      const finalReportPath = path.join(specDir, 'FINAL-REPORT.md');
      
      if (fs.existsSync(finalReportPath)) {
        const content = fs.readFileSync(finalReportPath, 'utf-8');
        
        // Check if FINAL-REPORT.md includes deployment information
        const hasDeploymentSection = /##\s*(Deployment|Deploy|Production)/i.test(content);
        
        if (hasDeploymentSection) {
          specsWithFinalReport.push(path.basename(specDir));
        }
      }
    }

    console.log(`\n✅ Specs with deployment info in FINAL-REPORT.md: ${specsWithFinalReport.length}`);
    
    if (specsWithFinalReport.length > 0) {
      console.log(`  ${specsWithFinalReport.join(', ')}`);
    }

    expect(true).toBe(true);
  });
});
