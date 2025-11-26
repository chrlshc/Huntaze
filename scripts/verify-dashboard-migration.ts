#!/usr/bin/env tsx
/**
 * Dashboard Migration Verification Script
 * 
 * This script verifies that the dashboard migration to Shopify-inspired
 * design system is complete and all components are using CSS variables
 * instead of hardcoded colors.
 * 
 * Run with: npx tsx scripts/verify-dashboard-migration.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface VerificationResult {
  passed: boolean;
  message: string;
  details?: string[];
}

interface MigrationReport {
  timestamp: string;
  overallStatus: 'PASSED' | 'FAILED';
  results: {
    [key: string]: VerificationResult;
  };
}

// Dashboard components to verify
const DASHBOARD_COMPONENTS = [
  'components/Header.tsx',
  'components/Sidebar.tsx',
  'components/dashboard/DuotoneIcon.tsx',
  'components/dashboard/GlobalSearch.tsx',
  'components/dashboard/GamifiedOnboarding.tsx',
  'components/dashboard/Button.tsx',
  'app/(app)/layout.tsx',
  'app/(app)/dashboard/page.tsx',
];

// CSS files to verify
const CSS_FILES = [
  'styles/dashboard-shopify-tokens.css',
  'app/globals.css',
];

// Patterns to check for (should NOT exist in dashboard components)
const LEGACY_PATTERNS = {
  darkMode: /dark:|data-theme.*dark|darkMode|dark-mode/g,
  hardcodedDarkColors: /#[0-2][0-9a-fA-F]{5}/g,
  pureBlack: /#000000|#000(?![0-9a-fA-F])|rgb\(0,\s*0,\s*0\)/g,
};

// Patterns that SHOULD exist
const REQUIRED_PATTERNS = {
  cssVariables: /var\(--[a-z-]+\)/g,
  gridLayout: /huntaze-layout|grid-area/g,
};

function readFile(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    return null;
  }
}

function verifyNoLegacyPatterns(content: string, fileName: string): VerificationResult {
  const issues: string[] = [];
  
  for (const [name, pattern] of Object.entries(LEGACY_PATTERNS)) {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      issues.push(`Found ${matches.length} instance(s) of ${name}: ${matches.slice(0, 3).join(', ')}${matches.length > 3 ? '...' : ''}`);
    }
  }
  
  if (issues.length > 0) {
    return {
      passed: false,
      message: `Legacy patterns found in ${fileName}`,
      details: issues,
    };
  }
  
  return {
    passed: true,
    message: `No legacy patterns in ${fileName}`,
  };
}

function verifyRequiredPatterns(content: string, fileName: string): VerificationResult {
  const issues: string[] = [];
  
  for (const [name, pattern] of Object.entries(REQUIRED_PATTERNS)) {
    const matches = content.match(pattern);
    if (!matches || matches.length === 0) {
      issues.push(`Missing ${name} in ${fileName}`);
    }
  }
  
  if (issues.length > 0) {
    return {
      passed: false,
      message: `Required patterns missing in ${fileName}`,
      details: issues,
    };
  }
  
  return {
    passed: true,
    message: `All required patterns present in ${fileName}`,
  };
}

function verifyDesignTokens(): VerificationResult {
  const tokenFile = readFile('styles/dashboard-shopify-tokens.css');
  
  if (!tokenFile) {
    return {
      passed: false,
      message: 'Design tokens file not found',
    };
  }
  
  const requiredTokens = [
    '--huntaze-sidebar-width',
    '--huntaze-header-height',
    '--bg-app',
    '--bg-surface',
    '--color-indigo',
    '--color-text-main',
    '--color-text-sub',
    '--shadow-soft',
    '--radius-card',
  ];
  
  const missingTokens = requiredTokens.filter(token => !tokenFile.includes(token));
  
  if (missingTokens.length > 0) {
    return {
      passed: false,
      message: 'Missing required design tokens',
      details: missingTokens,
    };
  }
  
  return {
    passed: true,
    message: 'All required design tokens present',
  };
}

function verifyGridLayout(): VerificationResult {
  const layoutFile = readFile('app/(app)/layout.tsx');
  const headerFile = readFile('components/Header.tsx');
  const sidebarFile = readFile('components/Sidebar.tsx');
  
  if (!layoutFile) {
    return {
      passed: false,
      message: 'Layout file not found',
    };
  }
  
  const issues: string[] = [];
  
  // Check layout file
  if (!layoutFile.includes('huntaze-layout')) {
    issues.push('huntaze-layout class missing in layout.tsx');
  }
  if (!layoutFile.includes('huntaze-main')) {
    issues.push('huntaze-main class missing in layout.tsx');
  }
  
  // Check header file
  if (headerFile && !headerFile.includes('huntaze-header')) {
    issues.push('huntaze-header class missing in Header.tsx');
  }
  
  // Check sidebar file
  if (sidebarFile && !sidebarFile.includes('huntaze-sidebar')) {
    issues.push('huntaze-sidebar class missing in Sidebar.tsx');
  }
  
  if (issues.length > 0) {
    return {
      passed: false,
      message: 'Missing grid layout elements',
      details: issues,
    };
  }
  
  return {
    passed: true,
    message: 'Grid layout properly implemented',
  };
}

function verifyCSSImports(): VerificationResult {
  const globalsFile = readFile('app/globals.css');
  
  if (!globalsFile) {
    return {
      passed: false,
      message: 'globals.css not found',
    };
  }
  
  const requiredImports = [
    'dashboard-shopify-tokens.css',
  ];
  
  const missingImports = requiredImports.filter(imp => !globalsFile.includes(imp));
  
  if (missingImports.length > 0) {
    return {
      passed: false,
      message: 'Missing CSS imports',
      details: missingImports,
    };
  }
  
  return {
    passed: true,
    message: 'All required CSS files imported',
  };
}

function runVerification(): MigrationReport {
  const report: MigrationReport = {
    timestamp: new Date().toISOString(),
    overallStatus: 'PASSED',
    results: {},
  };
  
  console.log('🔍 Starting Dashboard Migration Verification...\n');
  
  // Verify design tokens
  console.log('📋 Verifying design tokens...');
  report.results['design-tokens'] = verifyDesignTokens();
  console.log(report.results['design-tokens'].passed ? '✅' : '❌', report.results['design-tokens'].message);
  if (report.results['design-tokens'].details) {
    report.results['design-tokens'].details.forEach(d => console.log('  -', d));
  }
  console.log();
  
  // Verify grid layout
  console.log('📐 Verifying grid layout...');
  report.results['grid-layout'] = verifyGridLayout();
  console.log(report.results['grid-layout'].passed ? '✅' : '❌', report.results['grid-layout'].message);
  if (report.results['grid-layout'].details) {
    report.results['grid-layout'].details.forEach(d => console.log('  -', d));
  }
  console.log();
  
  // Verify CSS imports
  console.log('📦 Verifying CSS imports...');
  report.results['css-imports'] = verifyCSSImports();
  console.log(report.results['css-imports'].passed ? '✅' : '❌', report.results['css-imports'].message);
  if (report.results['css-imports'].details) {
    report.results['css-imports'].details.forEach(d => console.log('  -', d));
  }
  console.log();
  
  // Verify dashboard components
  console.log('🧩 Verifying dashboard components...');
  for (const component of DASHBOARD_COMPONENTS) {
    const content = readFile(component);
    
    if (!content) {
      report.results[component] = {
        passed: false,
        message: `File not found: ${component}`,
      };
      console.log('❌', component, '- File not found');
      report.overallStatus = 'FAILED';
      continue;
    }
    
    // Check for legacy patterns
    const legacyCheck = verifyNoLegacyPatterns(content, component);
    if (!legacyCheck.passed) {
      report.results[component] = legacyCheck;
      console.log('❌', component);
      legacyCheck.details?.forEach(d => console.log('  -', d));
      report.overallStatus = 'FAILED';
      continue;
    }
    
    // Check for CSS variables usage (should have at least some var() usage)
    const hasVarUsage = content.includes('var(--');
    const hasGridClass = content.includes('huntaze-');
    
    if (component.includes('layout.tsx') || component.includes('Sidebar') || component.includes('Header') || component.includes('dashboard/page')) {
      if (!hasVarUsage && !hasGridClass) {
        report.results[component] = {
          passed: false,
          message: `${component} not using design system (no CSS variables or grid classes)`,
        };
        console.log('❌', component);
        report.overallStatus = 'FAILED';
      } else {
        report.results[component] = {
          passed: true,
          message: `${component} properly migrated`,
        };
        console.log('✅', component);
      }
    } else {
      report.results[component] = {
        passed: true,
        message: `${component} has no legacy patterns`,
      };
      console.log('✅', component);
    }
  }
  
  console.log();
  
  // Update overall status based on all results
  const allPassed = Object.values(report.results).every(r => r.passed);
  report.overallStatus = allPassed ? 'PASSED' : 'FAILED';
  
  return report;
}

function printSummary(report: MigrationReport): void {
  console.log('═'.repeat(60));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('═'.repeat(60));
  console.log();
  
  const passed = Object.values(report.results).filter(r => r.passed).length;
  const total = Object.values(report.results).length;
  
  console.log(`Status: ${report.overallStatus === 'PASSED' ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Checks: ${passed}/${total} passed`);
  console.log(`Timestamp: ${report.timestamp}`);
  console.log();
  
  if (report.overallStatus === 'PASSED') {
    console.log('🎉 Dashboard migration verification complete!');
    console.log('All components are properly using the new design system.');
  } else {
    console.log('⚠️  Some checks failed. Please review the details above.');
  }
  
  console.log();
}

// Run verification
const report = runVerification();
printSummary(report);

// Save report to file
const reportPath = '.kiro/specs/dashboard-shopify-migration/PHASE_12_VERIFICATION_REPORT.json';
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`📄 Full report saved to: ${reportPath}`);

// Exit with appropriate code
process.exit(report.overallStatus === 'PASSED' ? 0 : 1);
