#!/usr/bin/env tsx

/**
 * Signup Page Performance Audit Tool
 * 
 * Analyzes the signup page for performance issues:
 * - Bundle size analysis
 * - Critical CSS identification
 * - Code splitting opportunities
 * - Image optimization
 * - Render-blocking resources
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface PerformanceIssue {
  type: 'critical' | 'warning' | 'info';
  category: string;
  message: string;
  file?: string;
  suggestion?: string;
}

interface PerformanceReport {
  timestamp: string;
  issues: PerformanceIssue[];
  summary: {
    critical: number;
    warnings: number;
    info: number;
  };
  recommendations: string[];
}

const report: PerformanceReport = {
  timestamp: new Date().toISOString(),
  issues: [],
  summary: {
    critical: 0,
    warnings: 0,
    info: 0,
  },
  recommendations: [],
};

function addIssue(issue: PerformanceIssue) {
  report.issues.push(issue);
  report.summary[issue.type === 'critical' ? 'critical' : issue.type === 'warning' ? 'warnings' : 'info']++;
}

function addRecommendation(recommendation: string) {
  report.recommendations.push(recommendation);
}

// Check for client components that could be lazy loaded
async function checkClientComponents() {
  console.log('🔍 Checking client components...');
  
  const signupFiles = await glob('app/(auth)/signup/**/*.tsx');
  const componentFiles = await glob('components/auth/**/*.tsx');
  
  const allFiles = [...signupFiles, ...componentFiles];
  
  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    
    // Check for 'use client' directive
    if (content.includes("'use client'") || content.includes('"use client"')) {
      // Check if component is heavy (imports many dependencies)
      const imports = content.match(/^import .+ from .+$/gm) || [];
      
      if (imports.length > 10) {
        addIssue({
          type: 'warning',
          category: 'Code Splitting',
          message: `Client component with ${imports.length} imports could be lazy loaded`,
          file,
          suggestion: 'Consider using dynamic imports with next/dynamic for heavy client components',
        });
      }
      
      // Check for heavy libraries
      const heavyLibs = ['@radix-ui', 'framer-motion', 'recharts', 'three'];
      for (const lib of heavyLibs) {
        if (content.includes(lib)) {
          addIssue({
            type: 'warning',
            category: 'Bundle Size',
            message: `Heavy library "${lib}" imported in client component`,
            file,
            suggestion: `Consider lazy loading this component or using a lighter alternative`,
          });
        }
      }
    }
  }
}

// Check for inline styles that should be in CSS
async function checkInlineStyles() {
  console.log('🎨 Checking for inline styles...');
  
  const files = await glob('app/(auth)/signup/**/*.tsx');
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    
    // Check for style prop usage
    const styleProps = content.match(/style=\{\{[^}]+\}\}/g) || [];
    
    if (styleProps.length > 5) {
      addIssue({
        type: 'info',
        category: 'Critical CSS',
        message: `${styleProps.length} inline styles found`,
        file,
        suggestion: 'Consider extracting common styles to CSS classes for better caching',
      });
    }
  }
}

// Check for unoptimized images
async function checkImages() {
  console.log('🖼️  Checking image optimization...');
  
  const files = await glob('app/(auth)/signup/**/*.tsx');
  const componentFiles = await glob('components/auth/**/*.tsx');
  
  const allFiles = [...files, ...componentFiles];
  
  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    
    // Check for <img> tags instead of Next.js Image
    const imgTags = content.match(/<img[^>]+>/g) || [];
    
    for (const imgTag of imgTags) {
      // Skip SVG icons
      if (imgTag.includes('.svg') || imgTag.includes('data:image/svg')) {
        continue;
      }
      
      addIssue({
        type: 'warning',
        category: 'Image Optimization',
        message: 'Using <img> tag instead of Next.js Image component',
        file,
        suggestion: 'Replace <img> with next/image for automatic optimization',
      });
    }
  }
}

// Check for render-blocking resources
async function checkRenderBlocking() {
  console.log('⚡ Checking for render-blocking resources...');
  
  const layoutFile = 'app/(auth)/layout.tsx';
  
  if (fs.existsSync(layoutFile)) {
    const content = fs.readFileSync(layoutFile, 'utf-8');
    
    // Check for synchronous script tags
    if (content.includes('<script') && !content.includes('async') && !content.includes('defer')) {
      addIssue({
        type: 'critical',
        category: 'Render Blocking',
        message: 'Synchronous script tag found in layout',
        file: layoutFile,
        suggestion: 'Add async or defer attribute to script tags',
      });
    }
    
    // Check for external stylesheets
    const linkTags = content.match(/<link[^>]+rel="stylesheet"[^>]*>/g) || [];
    if (linkTags.length > 0) {
      addIssue({
        type: 'warning',
        category: 'Critical CSS',
        message: `${linkTags.length} external stylesheet(s) found`,
        file: layoutFile,
        suggestion: 'Consider inlining critical CSS and deferring non-critical styles',
      });
    }
  }
}

// Check for code splitting opportunities
async function checkCodeSplitting() {
  console.log('📦 Checking code splitting opportunities...');
  
  const signupPage = 'app/(auth)/signup/page.tsx';
  
  if (fs.existsSync(signupPage)) {
    const content = fs.readFileSync(signupPage, 'utf-8');
    
    // Check if components are dynamically imported
    const dynamicImports = content.match(/dynamic\(.*\)/g) || [];
    const staticImports = content.match(/^import .+ from .+$/gm) || [];
    
    if (dynamicImports.length === 0 && staticImports.length > 5) {
      addIssue({
        type: 'info',
        category: 'Code Splitting',
        message: 'No dynamic imports found, all components loaded synchronously',
        file: signupPage,
        suggestion: 'Consider using next/dynamic for below-the-fold components',
      });
    }
  }
}

// Check bundle size of auth components
async function checkBundleSize() {
  console.log('📊 Analyzing bundle size...');
  
  const authComponents = await glob('components/auth/**/*.tsx');
  
  let totalSize = 0;
  const largeFiles: Array<{ file: string; size: number }> = [];
  
  for (const file of authComponents) {
    const stats = fs.statSync(file);
    totalSize += stats.size;
    
    // Flag files larger than 10KB
    if (stats.size > 10 * 1024) {
      largeFiles.push({ file, size: stats.size });
    }
  }
  
  if (largeFiles.length > 0) {
    for (const { file, size } of largeFiles) {
      addIssue({
        type: 'warning',
        category: 'Bundle Size',
        message: `Large component file: ${(size / 1024).toFixed(2)}KB`,
        file,
        suggestion: 'Consider splitting into smaller components or lazy loading',
      });
    }
  }
  
  addIssue({
    type: 'info',
    category: 'Bundle Size',
    message: `Total auth components size: ${(totalSize / 1024).toFixed(2)}KB`,
    suggestion: 'Target: Keep total bundle under 50KB for optimal performance',
  });
}

// Generate recommendations based on findings
function generateRecommendations() {
  console.log('💡 Generating recommendations...');
  
  if (report.summary.critical > 0) {
    addRecommendation('🚨 Address critical issues first - these significantly impact performance');
  }
  
  if (report.issues.some(i => i.category === 'Code Splitting')) {
    addRecommendation('📦 Implement code splitting with next/dynamic for heavy components');
    addRecommendation('⚡ Use loading states and Suspense boundaries for better UX');
  }
  
  if (report.issues.some(i => i.category === 'Bundle Size')) {
    addRecommendation('🎯 Analyze bundle with @next/bundle-analyzer to identify large dependencies');
    addRecommendation('🔧 Consider tree-shaking and removing unused code');
  }
  
  if (report.issues.some(i => i.category === 'Image Optimization')) {
    addRecommendation('🖼️  Replace all <img> tags with next/image for automatic optimization');
    addRecommendation('📐 Specify width and height props to prevent layout shift');
  }
  
  if (report.issues.some(i => i.category === 'Critical CSS')) {
    addRecommendation('🎨 Extract critical CSS and inline it in the document head');
    addRecommendation('⏱️  Defer non-critical CSS with media="print" onload trick');
  }
  
  // Always add general recommendations
  addRecommendation('🧪 Run Lighthouse audit to measure real-world performance');
  addRecommendation('📊 Monitor Core Web Vitals (LCP, FID, CLS) in production');
  addRecommendation('🔍 Use React DevTools Profiler to identify slow renders');
}

// Print report
function printReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📈 SIGNUP PAGE PERFORMANCE AUDIT REPORT');
  console.log('='.repeat(80) + '\n');
  
  console.log(`Timestamp: ${report.timestamp}\n`);
  
  console.log('📊 Summary:');
  console.log(`  🚨 Critical Issues: ${report.summary.critical}`);
  console.log(`  ⚠️  Warnings: ${report.summary.warnings}`);
  console.log(`  ℹ️  Info: ${report.summary.info}`);
  console.log('');
  
  if (report.issues.length === 0) {
    console.log('✅ No performance issues found!\n');
  } else {
    console.log('🔍 Issues Found:\n');
    
    // Group by category
    const byCategory = report.issues.reduce((acc, issue) => {
      if (!acc[issue.category]) {
        acc[issue.category] = [];
      }
      acc[issue.category].push(issue);
      return acc;
    }, {} as Record<string, PerformanceIssue[]>);
    
    for (const [category, issues] of Object.entries(byCategory)) {
      console.log(`\n📁 ${category}:`);
      console.log('-'.repeat(80));
      
      for (const issue of issues) {
        const icon = issue.type === 'critical' ? '🚨' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`\n${icon} ${issue.message}`);
        if (issue.file) {
          console.log(`   File: ${issue.file}`);
        }
        if (issue.suggestion) {
          console.log(`   💡 ${issue.suggestion}`);
        }
      }
    }
  }
  
  if (report.recommendations.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('💡 RECOMMENDATIONS');
    console.log('='.repeat(80) + '\n');
    
    for (const rec of report.recommendations) {
      console.log(`  ${rec}`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ Audit complete!');
  console.log('='.repeat(80) + '\n');
}

// Save report to file
function saveReport() {
  const outputDir = path.join(process.cwd(), '.kiro/specs/signup-ux-optimization');
  const outputFile = path.join(outputDir, 'performance-audit.json');
  
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
  
  console.log(`📄 Report saved to: ${outputFile}\n`);
}

// Main execution
async function main() {
  console.log('🚀 Starting signup page performance audit...\n');
  
  await checkClientComponents();
  await checkInlineStyles();
  await checkImages();
  await checkRenderBlocking();
  await checkCodeSplitting();
  await checkBundleSize();
  
  generateRecommendations();
  printReport();
  saveReport();
}

main().catch(console.error);
