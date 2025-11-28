#!/usr/bin/env tsx
/**
 * Documentation Analyzer Script for Codebase Cleanup
 * 
 * This script analyzes documentation to identify:
 * - Completion files in spec directories
 * - Duplicate summary files per spec
 * - Scattered deployment documentation
 * - AWS-related documentation files
 * - File counts per spec directory
 * 
 * Generates: documentation-consolidation-plan.md
 */

import * as fs from 'fs';
import * as path from 'path';

interface SpecDirectory {
  name: string;
  path: string;
  fileCount: number;
  completionFiles: string[];
  summaryFiles: string[];
  deploymentFiles: string[];
  essentialFiles: string[];
  otherFiles: string[];
}

interface RootDocFile {
  name: string;
  path: string;
  size: number;
  category: 'deployment' | 'getting-started' | 'aws' | 'csrf' | 'other';
}

interface AnalysisResults {
  specDirectories: SpecDirectory[];
  rootDocFiles: RootDocFile[];
  totalSpecFiles: number;
  totalRootDocs: number;
}

const SPECS_DIR = '.kiro/specs';
const ESSENTIAL_FILES = ['README.md', 'requirements.md', 'design.md', 'tasks.md'];

// Patterns for categorizing files
const COMPLETION_PATTERNS = [
  /TASK-.*-COMPLETE/i,
  /PHASE-.*-COMPLETE/i,
  /task-.*-complete/i,
  /phase-.*-complete/i,
];

const SUMMARY_PATTERNS = [
  /RÉSUMÉ/i,
  /SUMMARY/i,
  /TERMINÉ/i,
  /COMPLETE/i,
  /SUCCESS/i,
  /FINAL.*REPORT/i,
  /PROJECT.*COMPLETE/i,
];

const DEPLOYMENT_PATTERNS = [
  /DEPLOY/i,
  /DÉPLOIEMENT/i,
  /DÉPLOYER/i,
];

const AWS_PATTERNS = [
  /AWS/i,
  /CLOUDWATCH/i,
  /S3/i,
  /SES/i,
  /LAMBDA/i,
];

const CSRF_PATTERNS = [
  /CSRF/i,
];

const GETTING_STARTED_PATTERNS = [
  /START.*HERE/i,
  /COMMENCER/i,
  /QUICK.*START/i,
  /GETTING.*STARTED/i,
];

/**
 * Analyze a spec directory
 */
function analyzeSpecDirectory(specPath: string, specName: string): SpecDirectory {
  const files = fs.readdirSync(specPath);
  
  const completionFiles: string[] = [];
  const summaryFiles: string[] = [];
  const deploymentFiles: string[] = [];
  const essentialFiles: string[] = [];
  const otherFiles: string[] = [];

  for (const file of files) {
    const filePath = path.join(specPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) continue;
    if (!file.endsWith('.md')) continue;

    // Categorize file
    if (ESSENTIAL_FILES.includes(file)) {
      essentialFiles.push(file);
    } else if (COMPLETION_PATTERNS.some(p => p.test(file))) {
      completionFiles.push(file);
    } else if (SUMMARY_PATTERNS.some(p => p.test(file))) {
      summaryFiles.push(file);
    } else if (DEPLOYMENT_PATTERNS.some(p => p.test(file))) {
      deploymentFiles.push(file);
    } else {
      otherFiles.push(file);
    }
  }

  return {
    name: specName,
    path: specPath,
    fileCount: files.filter(f => f.endsWith('.md')).length,
    completionFiles,
    summaryFiles,
    deploymentFiles,
    essentialFiles,
    otherFiles,
  };
}

/**
 * Categorize root documentation file
 */
function categorizeRootDoc(filename: string): 'deployment' | 'getting-started' | 'aws' | 'csrf' | 'other' {
  if (DEPLOYMENT_PATTERNS.some(p => p.test(filename))) return 'deployment';
  if (GETTING_STARTED_PATTERNS.some(p => p.test(filename))) return 'getting-started';
  if (AWS_PATTERNS.some(p => p.test(filename))) return 'aws';
  if (CSRF_PATTERNS.some(p => p.test(filename))) return 'csrf';
  return 'other';
}

/**
 * Scan root directory for documentation
 */
function scanRootDocs(rootDir: string): RootDocFile[] {
  const files = fs.readdirSync(rootDir);
  const docs: RootDocFile[] = [];

  for (const file of files) {
    const filePath = path.join(rootDir, file);
    const stat = fs.statSync(filePath);

    if (stat.isFile() && file.endsWith('.md') && file !== 'README.md') {
      const category = categorizeRootDoc(file);
      docs.push({
        name: file,
        path: file,
        size: stat.size,
        category,
      });
    }
  }

  return docs;
}

/**
 * Format file size
 */
function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Generate consolidation plan report
 */
function generateReport(results: AnalysisResults): string {
  const lines: string[] = [];

  lines.push('# Documentation Consolidation Plan');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- **Spec directories analyzed**: ${results.specDirectories.length}`);
  lines.push(`- **Total spec documentation files**: ${results.totalSpecFiles}`);
  lines.push(`- **Root documentation files**: ${results.totalRootDocs}`);
  lines.push('');

  // Spec Directories Section
  lines.push('## Spec Directory Analysis');
  lines.push('');
  
  for (const spec of results.specDirectories) {
    lines.push(`### ${spec.name}`);
    lines.push('');
    lines.push(`**Total files**: ${spec.fileCount}`);
    lines.push('');

    if (spec.essentialFiles.length > 0) {
      lines.push('**Essential files** (keep):');
      for (const file of spec.essentialFiles) {
        lines.push(`- ✅ ${file}`);
      }
      lines.push('');
    }

    if (spec.completionFiles.length > 0) {
      lines.push(`**Completion files** (${spec.completionFiles.length}) - archive to \`archive/\`:`);
      for (const file of spec.completionFiles) {
        lines.push(`- [ARCHIVE] ${file}`);
      }
      lines.push('');
    }

    if (spec.summaryFiles.length > 0) {
      lines.push(`**Summary files** (${spec.summaryFiles.length}) - consolidate to FINAL-REPORT.md:`);
      for (const file of spec.summaryFiles) {
        lines.push(`- [CONSOLIDATE] ${file}`);
      }
      lines.push('');
    }

    if (spec.deploymentFiles.length > 0) {
      lines.push(`**Deployment files** (${spec.deploymentFiles.length}) - consolidate to DEPLOYMENT.md:`);
      for (const file of spec.deploymentFiles) {
        lines.push(`- [DEPLOY] ${file}`);
      }
      lines.push('');
    }

    if (spec.otherFiles.length > 0) {
      lines.push(`**Other files** (${spec.otherFiles.length}):`);
      for (const file of spec.otherFiles) {
        lines.push(`- [OTHER] ${file}`);
      }
      lines.push('');
    }

    lines.push('**Recommended actions:**');
    lines.push('1. Create `FINAL-REPORT.md` consolidating all completion reports');
    lines.push('2. Move completion files to `archive/` subdirectory');
    lines.push('3. Remove duplicate summaries');
    if (spec.deploymentFiles.length > 1) {
      lines.push('4. Consolidate deployment guides into single `DEPLOYMENT.md`');
    }
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  // Root Documentation Section
  lines.push('## Root Directory Documentation');
  lines.push('');

  const deploymentDocs = results.rootDocFiles.filter(f => f.category === 'deployment');
  const gettingStartedDocs = results.rootDocFiles.filter(f => f.category === 'getting-started');
  const awsDocs = results.rootDocFiles.filter(f => f.category === 'aws');
  const csrfDocs = results.rootDocFiles.filter(f => f.category === 'csrf');
  const otherDocs = results.rootDocFiles.filter(f => f.category === 'other');

  if (deploymentDocs.length > 0) {
    lines.push(`### Deployment Documentation (${deploymentDocs.length} files)`);
    lines.push('');
    lines.push('| File | Size |');
    lines.push('|------|------|');
    for (const doc of deploymentDocs) {
      lines.push(`| ${doc.name} | ${formatSize(doc.size)} |`);
    }
    lines.push('');
    lines.push('**Recommendation:**');
    lines.push('- Consolidate into single `DEPLOYMENT-STATUS.md`');
    lines.push('- Keep only latest deployment information');
    lines.push('');
  }

  if (gettingStartedDocs.length > 0) {
    lines.push(`### Getting Started Documentation (${gettingStartedDocs.length} files)`);
    lines.push('');
    lines.push('| File | Size |');
    lines.push('|------|------|');
    for (const doc of gettingStartedDocs) {
      lines.push(`| ${doc.name} | ${formatSize(doc.size)} |`);
    }
    lines.push('');
    lines.push('**Recommendation:**');
    lines.push('- Merge into main `README.md` as "Getting Started" section');
    lines.push('- Remove redundant start guides');
    lines.push('- Keep bilingual versions organized with `-FR` suffix');
    lines.push('');
  }

  if (awsDocs.length > 0) {
    lines.push(`### AWS Documentation (${awsDocs.length} files)`);
    lines.push('');
    lines.push('| File | Size |');
    lines.push('|------|------|');
    for (const doc of awsDocs) {
      lines.push(`| ${doc.name} | ${formatSize(doc.size)} |`);
    }
    lines.push('');
    lines.push('**Recommendation:**');
    lines.push('- Create `docs/aws/` directory');
    lines.push('- Move all AWS-related guides to `docs/aws/`');
    lines.push('- Create `docs/aws/README.md` as index');
    lines.push('');
  }

  if (csrfDocs.length > 0) {
    lines.push(`### CSRF Documentation (${csrfDocs.length} files)`);
    lines.push('');
    lines.push('| File | Size |');
    lines.push('|------|------|');
    for (const doc of csrfDocs) {
      lines.push(`| ${doc.name} | ${formatSize(doc.size)} |`);
    }
    lines.push('');
    lines.push('**Recommendation:**');
    lines.push('- Consolidate into single `docs/CSRF-GUIDE.md`');
    lines.push('- Include all fixes, solutions, and debugging information');
    lines.push('');
  }

  // Implementation Plan
  lines.push('## Implementation Plan');
  lines.push('');
  lines.push('### Phase 1: Spec Directory Cleanup');
  lines.push('');
  lines.push('For each spec directory:');
  lines.push('');
  lines.push('1. **Create FINAL-REPORT.md**');
  lines.push('   - Consolidate all completion reports');
  lines.push('   - Include key achievements and metrics');
  lines.push('   - Add links to essential files');
  lines.push('');
  lines.push('2. **Archive completion files**');
  lines.push('   - Create `archive/` subdirectory');
  lines.push('   - Move all `TASK-*-COMPLETE.md` files');
  lines.push('   - Move all `PHASE-*-COMPLETE.md` files');
  lines.push('');
  lines.push('3. **Remove duplicate summaries**');
  lines.push('   - Keep only `FINAL-REPORT.md`');
  lines.push('   - Remove files like:');
  lines.push('     - `RÉSUMÉ-FINAL.md`');
  lines.push('     - `PROJECT-COMPLETE.md`');
  lines.push('     - `🎉-PROJET-TERMINÉ.md`');
  lines.push('');
  lines.push('4. **Consolidate deployment guides**');
  lines.push('   - Merge into single `DEPLOYMENT.md`');
  lines.push('   - Remove old deployment files');
  lines.push('');

  lines.push('### Phase 2: Root Directory Cleanup');
  lines.push('');
  lines.push('1. **Consolidate deployment status**');
  lines.push('   - Merge `DEPLOYMENT-STATUS-NOV-27.md` and `DEPLOYMENT_STATUS.md`');
  lines.push('   - Create single `DEPLOYMENT-STATUS.md`');
  lines.push('');
  lines.push('2. **Consolidate getting started guides**');
  lines.push('   - Merge into main `README.md`');
  lines.push('   - Add "Getting Started" section');
  lines.push('   - Remove: `COMMENCER-ICI.md`, `START_HERE.md`, `QUICK_START.md`');
  lines.push('');
  lines.push('3. **Organize AWS documentation**');
  lines.push('   - Create `docs/aws/` directory');
  lines.push('   - Move all AWS guides');
  lines.push('   - Create index file');
  lines.push('');
  lines.push('4. **Consolidate CSRF documentation**');
  lines.push('   - Merge all `CSRF_*.md` files');
  lines.push('   - Create `docs/CSRF-GUIDE.md`');
  lines.push('');
  lines.push('5. **Organize bilingual documentation**');
  lines.push('   - Rename French versions with `-FR` suffix');
  lines.push('   - Keep English as default');
  lines.push('');

  // Expected Results
  lines.push('## Expected Results');
  lines.push('');
  lines.push('### Spec Directories');
  lines.push('');
  lines.push('Each spec directory should contain:');
  lines.push('- `README.md` - Overview and quick reference');
  lines.push('- `requirements.md` - Feature requirements');
  lines.push('- `design.md` - Design document');
  lines.push('- `tasks.md` - Implementation tasks');
  lines.push('- `FINAL-REPORT.md` - Consolidated completion report');
  lines.push('- `archive/` - Historical completion files');
  lines.push('');

  lines.push('### Root Directory');
  lines.push('');
  lines.push('Organized documentation structure:');
  lines.push('- `README.md` - Main project documentation with Getting Started');
  lines.push('- `DEPLOYMENT-STATUS.md` - Current deployment status');
  lines.push('- `docs/aws/` - All AWS-related documentation');
  lines.push('- `docs/CSRF-GUIDE.md` - CSRF fixes and solutions');
  lines.push('- Bilingual files clearly marked with `-FR` suffix');
  lines.push('');

  // Metrics
  lines.push('## Estimated Impact');
  lines.push('');
  const totalCompletionFiles = results.specDirectories.reduce((sum, s) => sum + s.completionFiles.length, 0);
  const totalSummaryFiles = results.specDirectories.reduce((sum, s) => sum + s.summaryFiles.length, 0);
  const totalDeploymentFiles = results.specDirectories.reduce((sum, s) => sum + s.deploymentFiles.length, 0);
  
  lines.push(`- **Completion files to archive**: ${totalCompletionFiles}`);
  lines.push(`- **Duplicate summaries to remove**: ${totalSummaryFiles}`);
  lines.push(`- **Deployment files to consolidate**: ${totalDeploymentFiles}`);
  lines.push(`- **Root docs to organize**: ${results.totalRootDocs}`);
  lines.push('');
  lines.push(`**Total files to process**: ${totalCompletionFiles + totalSummaryFiles + totalDeploymentFiles + results.totalRootDocs}`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Main execution
 */
function main() {
  console.log('📚 Analyzing documentation for consolidation opportunities...\n');

  const rootDir = process.cwd();
  const specsPath = path.join(rootDir, SPECS_DIR);

  // Analyze spec directories
  const specDirectories: SpecDirectory[] = [];
  let totalSpecFiles = 0;

  if (fs.existsSync(specsPath)) {
    const specs = fs.readdirSync(specsPath);
    
    for (const spec of specs) {
      const specPath = path.join(specsPath, spec);
      const stat = fs.statSync(specPath);
      
      if (stat.isDirectory()) {
        const analysis = analyzeSpecDirectory(specPath, spec);
        specDirectories.push(analysis);
        totalSpecFiles += analysis.fileCount;
      }
    }
  }

  // Analyze root documentation
  const rootDocFiles = scanRootDocs(rootDir);

  const results: AnalysisResults = {
    specDirectories,
    rootDocFiles,
    totalSpecFiles,
    totalRootDocs: rootDocFiles.length,
  };

  // Generate report
  const report = generateReport(results);
  const reportPath = path.join(rootDir, 'documentation-consolidation-plan.md');
  fs.writeFileSync(reportPath, report, 'utf-8');

  // Print summary
  console.log('✅ Analysis complete!\n');
  console.log('Summary:');
  console.log(`  - Spec directories: ${specDirectories.length}`);
  console.log(`  - Total spec files: ${totalSpecFiles}`);
  console.log(`  - Root documentation files: ${rootDocFiles.length}\n`);
  console.log(`📄 Report generated: ${reportPath}`);
}

// Run the script
main();
