#!/usr/bin/env ts-node
/**
 * Dashboard Performance Audit Script
 * 
 * This script audits the dashboard for performance best practices:
 * - CSS Grid usage (no position calculations)
 * - GPU-accelerated animations (transform/opacity)
 * - Proper will-change hints
 * - Scroll performance optimization
 * 
 * Requirements: 15.1, 15.2, 15.5
 */

import * as fs from 'fs';
import * as path from 'path';

interface PerformanceIssue {
  file: string;
  line: number;
  issue: string;
  severity: 'error' | 'warning' | 'info';
  recommendation: string;
}

const issues: PerformanceIssue[] = [];

/**
 * Check for non-GPU-accelerated CSS properties in animations
 */
function checkAnimationProperties(content: string, filePath: string): void {
  const lines = content.split('\n');
  const nonGPUProps = [
    'width',
    'height',
    'top',
    'left',
    'right',
    'bottom',
    'margin',
    'padding',
    'font-size',
  ];

  lines.forEach((line, index) => {
    // Check for transition properties
    if (line.includes('transition:') || line.includes('transition-property:')) {
      nonGPUProps.forEach((prop) => {
        if (line.includes(prop) && !line.includes('//')) {
          issues.push({
            file: filePath,
            line: index + 1,
            issue: `Non-GPU-accelerated property "${prop}" in transition`,
            severity: 'warning',
            recommendation: `Use transform/opacity instead of ${prop} for better performance`,
          });
        }
      });
    }

    // Check for animation keyframes
    if (line.includes('@keyframes')) {
      const keyframeName = line.match(/@keyframes\s+(\w+)/)?.[1];
      if (keyframeName) {
        // Look ahead for non-GPU properties in this keyframe
        for (let i = index + 1; i < Math.min(index + 20, lines.length); i++) {
          if (lines[i].includes('}') && lines[i].trim() === '}') break;
          
          nonGPUProps.forEach((prop) => {
            if (lines[i].includes(`${prop}:`) && !lines[i].includes('//')) {
              issues.push({
                file: filePath,
                line: i + 1,
                issue: `Non-GPU-accelerated property "${prop}" in @keyframes ${keyframeName}`,
                severity: 'warning',
                recommendation: `Use transform/opacity in keyframes for GPU acceleration`,
              });
            }
          });
        }
      }
    }
  });
}

/**
 * Check for position-based layout calculations
 */
function checkPositionCalculations(content: string, filePath: string): void {
  const lines = content.split('\n');
  const positionProps = ['position: absolute', 'position: fixed'];

  lines.forEach((line, index) => {
    positionProps.forEach((prop) => {
      if (line.includes(prop) && !line.includes('//') && !line.includes('sticky')) {
        // Check if this is in a grid/flex context
        const context = lines.slice(Math.max(0, index - 5), index).join('\n');
        if (!context.includes('display: grid') && !context.includes('display: flex')) {
          issues.push({
            file: filePath,
            line: index + 1,
            issue: `Using ${prop} without grid/flex context`,
            severity: 'info',
            recommendation: 'Consider using CSS Grid or Flexbox for layout instead of absolute positioning',
          });
        }
      }
    });
  });
}

/**
 * Check for will-change hints on animated elements
 */
function checkWillChangeHints(content: string, filePath: string): void {
  const lines = content.split('\n');
  let hasTransition = false;
  let hasWillChange = false;
  let currentSelector = '';

  lines.forEach((line, index) => {
    // Track current selector
    if (line.includes('{') && !line.includes('@')) {
      currentSelector = line.split('{')[0].trim();
      hasTransition = false;
      hasWillChange = false;
    }

    // Check for transitions
    if (line.includes('transition:') || line.includes('animation:')) {
      hasTransition = true;
    }

    // Check for will-change
    if (line.includes('will-change:')) {
      hasWillChange = true;
    }

    // At end of rule, check if we need will-change
    if (line.includes('}') && hasTransition && !hasWillChange && currentSelector) {
      issues.push({
        file: filePath,
        line: index + 1,
        issue: `Animated element "${currentSelector}" missing will-change hint`,
        severity: 'info',
        recommendation: 'Add will-change: transform; or will-change: opacity; for better performance',
      });
    }
  });
}

/**
 * Check for scroll performance optimizations
 */
function checkScrollOptimizations(content: string, filePath: string): void {
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Check for overflow without scroll-behavior
    if (line.includes('overflow-y: auto') || line.includes('overflow: auto')) {
      const context = lines.slice(index, Math.min(index + 10, lines.length)).join('\n');
      if (!context.includes('scroll-behavior')) {
        issues.push({
          file: filePath,
          line: index + 1,
          issue: 'Scrollable element missing scroll-behavior',
          severity: 'info',
          recommendation: 'Add scroll-behavior: smooth; for better UX',
        });
      }
    }

    // Check for fixed elements during scroll
    if (line.includes('position: fixed') || line.includes('position: sticky')) {
      const context = lines.slice(Math.max(0, index - 5), Math.min(index + 5, lines.length)).join('\n');
      if (!context.includes('will-change') && !context.includes('transform: translate3d')) {
        issues.push({
          file: filePath,
          line: index + 1,
          issue: 'Fixed/sticky element without GPU acceleration hint',
          severity: 'info',
          recommendation: 'Add will-change: transform; or use transform: translate3d(0,0,0);',
        });
      }
    }
  });
}

/**
 * Audit a CSS file
 */
function auditCSSFile(filePath: string): void {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  checkAnimationProperties(content, filePath);
  checkPositionCalculations(content, filePath);
  checkWillChangeHints(content, filePath);
  checkScrollOptimizations(content, filePath);
}

/**
 * Audit a directory recursively
 */
function auditDirectory(dirPath: string): void {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  entries.forEach((entry) => {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules, .next, etc.
      if (!['node_modules', '.next', 'dist', 'build'].includes(entry.name)) {
        auditDirectory(fullPath);
      }
    } else if (entry.isFile() && (entry.name.endsWith('.css') || entry.name.endsWith('.module.css'))) {
      auditCSSFile(fullPath);
    }
  });
}

/**
 * Generate report
 */
function generateReport(): void {
  console.log('\n=== Dashboard Performance Audit Report ===\n');

  if (issues.length === 0) {
    console.log('✅ No performance issues found!\n');
    return;
  }

  // Group by severity
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  const info = issues.filter((i) => i.severity === 'info');

  if (errors.length > 0) {
    console.log(`❌ Errors (${errors.length}):\n`);
    errors.forEach((issue) => {
      console.log(`  ${issue.file}:${issue.line}`);
      console.log(`    Issue: ${issue.issue}`);
      console.log(`    Fix: ${issue.recommendation}\n`);
    });
  }

  if (warnings.length > 0) {
    console.log(`⚠️  Warnings (${warnings.length}):\n`);
    warnings.forEach((issue) => {
      console.log(`  ${issue.file}:${issue.line}`);
      console.log(`    Issue: ${issue.issue}`);
      console.log(`    Fix: ${issue.recommendation}\n`);
    });
  }

  if (info.length > 0) {
    console.log(`ℹ️  Info (${info.length}):\n`);
    info.forEach((issue) => {
      console.log(`  ${issue.file}:${issue.line}`);
      console.log(`    Issue: ${issue.issue}`);
      console.log(`    Fix: ${issue.recommendation}\n`);
    });
  }

  console.log(`\nTotal issues: ${issues.length}`);
  console.log(`  Errors: ${errors.length}`);
  console.log(`  Warnings: ${warnings.length}`);
  console.log(`  Info: ${info.length}\n`);
}

// Main execution
const targetDirs = [
  'styles',
  'app',
  'components',
];

console.log('Starting dashboard performance audit...\n');

targetDirs.forEach((dir) => {
  if (fs.existsSync(dir)) {
    console.log(`Auditing ${dir}/...`);
    auditDirectory(dir);
  }
});

generateReport();

// Exit with error code if there are errors
process.exit(issues.filter((i) => i.severity === 'error').length > 0 ? 1 : 0);
