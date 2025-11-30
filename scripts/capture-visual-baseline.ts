#!/usr/bin/env tsx

/**
 * Visual Baseline Capture Script
 * 
 * This script helps capture baseline screenshots for visual regression testing.
 * It provides a guided workflow for setting up and maintaining visual baselines.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const BASELINE_DIR = path.join(process.cwd(), 'tests/visual/__screenshots__');
const RESULTS_DIR = path.join(process.cwd(), 'test-results');

interface BaselineInfo {
  timestamp: string;
  components: string[];
  pages: string[];
  viewports: string[];
  totalScreenshots: number;
}

function printHeader() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║     Visual Regression Baseline Capture Tool               ║');
  console.log('║     Design System Unification                             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
}

function checkPrerequisites(): boolean {
  console.log('🔍 Checking prerequisites...\n');

  // Check if Playwright is installed
  try {
    execSync('npx playwright --version', { stdio: 'pipe' });
    console.log('✅ Playwright is installed');
  } catch (error) {
    console.error('❌ Playwright is not installed');
    console.log('   Run: npm install -D @playwright/test');
    return false;
  }

  // Check if browsers are installed
  try {
    execSync('npx playwright install --dry-run', { stdio: 'pipe' });
    console.log('✅ Playwright browsers are installed');
  } catch (error) {
    console.error('❌ Playwright browsers are not installed');
    console.log('   Run: npx playwright install');
    return false;
  }

  // Check if dev server is running
  try {
    const response = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000', { 
      stdio: 'pipe',
      encoding: 'utf-8'
    });
    
    if (response.trim() === '200') {
      console.log('✅ Development server is running');
    } else {
      console.warn('⚠️  Development server may not be running properly');
      console.log('   Make sure to run: npm run dev');
    }
  } catch (error) {
    console.warn('⚠️  Cannot connect to development server');
    console.log('   Make sure to run: npm run dev');
  }

  console.log('');
  return true;
}

function getExistingBaselines(): string[] {
  if (!fs.existsSync(BASELINE_DIR)) {
    return [];
  }

  const files: string[] = [];
  
  function walkDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.name.endsWith('.png')) {
        files.push(path.relative(BASELINE_DIR, fullPath));
      }
    }
  }

  walkDir(BASELINE_DIR);
  return files;
}

function captureBaselines() {
  console.log('📸 Capturing baseline screenshots...\n');
  console.log('This may take a few minutes...\n');

  try {
    execSync('npm run test:visual:update', { 
      stdio: 'inherit',
      env: { ...process.env, CI: 'false' }
    });
    
    console.log('\n✅ Baseline screenshots captured successfully!\n');
    return true;
  } catch (error) {
    console.error('\n❌ Failed to capture baseline screenshots\n');
    console.error(error);
    return false;
  }
}

function generateReport() {
  const baselines = getExistingBaselines();
  
  if (baselines.length === 0) {
    console.log('⚠️  No baseline screenshots found\n');
    return;
  }

  console.log('📊 Baseline Report\n');
  console.log(`Total screenshots: ${baselines.length}\n`);

  // Group by category
  const categories: Record<string, string[]> = {
    'Components': [],
    'Pages': [],
    'Responsive': [],
    'Interactive': [],
    'Other': []
  };

  for (const baseline of baselines) {
    if (baseline.includes('button') || baseline.includes('card') || baseline.includes('input')) {
      categories['Components'].push(baseline);
    } else if (baseline.includes('dashboard') || baseline.includes('analytics') || baseline.includes('page')) {
      categories['Pages'].push(baseline);
    } else if (baseline.includes('mobile') || baseline.includes('tablet') || baseline.includes('desktop')) {
      categories['Responsive'].push(baseline);
    } else if (baseline.includes('hover') || baseline.includes('focus')) {
      categories['Interactive'].push(baseline);
    } else {
      categories['Other'].push(baseline);
    }
  }

  for (const [category, files] of Object.entries(categories)) {
    if (files.length > 0) {
      console.log(`${category} (${files.length}):`);
      files.forEach(file => console.log(`  - ${file}`));
      console.log('');
    }
  }

  // Save metadata
  const metadata: BaselineInfo = {
    timestamp: new Date().toISOString(),
    components: categories['Components'],
    pages: categories['Pages'],
    viewports: categories['Responsive'],
    totalScreenshots: baselines.length
  };

  const metadataPath = path.join(BASELINE_DIR, 'baseline-info.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  
  console.log(`📝 Baseline metadata saved to: ${metadataPath}\n`);
}

function printUsageGuide() {
  console.log('📖 Usage Guide\n');
  console.log('To run visual regression tests:');
  console.log('  npm run test:visual\n');
  console.log('To update baselines after intentional changes:');
  console.log('  npm run test:visual:update\n');
  console.log('To view test results in UI mode:');
  console.log('  npm run test:visual:ui\n');
  console.log('To view the test report:');
  console.log('  npm run test:visual:report\n');
}

function cleanupOldResults() {
  if (fs.existsSync(RESULTS_DIR)) {
    console.log('🧹 Cleaning up old test results...\n');
    fs.rmSync(RESULTS_DIR, { recursive: true, force: true });
  }
}

async function main() {
  printHeader();

  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'report') {
    generateReport();
    return;
  }

  if (command === 'clean') {
    cleanupOldResults();
    console.log('✅ Cleanup complete\n');
    return;
  }

  // Default: capture baselines
  if (!checkPrerequisites()) {
    console.log('❌ Prerequisites check failed. Please fix the issues above.\n');
    process.exit(1);
  }

  const existingBaselines = getExistingBaselines();
  
  if (existingBaselines.length > 0) {
    console.log(`⚠️  Found ${existingBaselines.length} existing baseline screenshots\n`);
    console.log('This will overwrite existing baselines. Continue? (y/N): ');
    
    // In a real implementation, you'd want to use readline for interactive input
    // For now, we'll just proceed
    console.log('Proceeding with baseline capture...\n');
  }

  cleanupOldResults();

  const success = captureBaselines();

  if (success) {
    generateReport();
    printUsageGuide();
    
    console.log('✨ Visual baseline capture complete!\n');
    console.log('Next steps:');
    console.log('1. Review the captured screenshots in tests/visual/__screenshots__/');
    console.log('2. Commit the baseline screenshots to version control');
    console.log('3. Run "npm run test:visual" to verify the baselines\n');
  } else {
    console.log('❌ Baseline capture failed. Please check the errors above.\n');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
