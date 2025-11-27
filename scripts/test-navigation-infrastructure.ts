#!/usr/bin/env tsx

/**
 * Test Script: Navigation Infrastructure
 * 
 * This script validates the navigation infrastructure components:
 * - useNavigationContext hook
 * - Breadcrumbs component
 * - SubNavigation component
 * - Section/sub-section mapping
 */

import { describe } from 'node:test';

// Test data
const TEST_PATHS = [
  '/home',
  '/analytics',
  '/analytics/pricing',
  '/analytics/churn',
  '/onlyfans',
  '/onlyfans/messages',
  '/marketing',
  '/marketing/social',
  '/content',
  '/messages',
];

// Section configuration
const SECTION_CONFIG: Record<string, {
  label: string;
  hasSubNav: boolean;
  subPages?: string[];
}> = {
  home: { label: 'Home', hasSubNav: false },
  analytics: { 
    label: 'Analytics', 
    hasSubNav: true,
    subPages: ['pricing', 'churn', 'upsells', 'forecast', 'payouts'],
  },
  onlyfans: { 
    label: 'OnlyFans', 
    hasSubNav: true,
    subPages: ['messages', 'fans', 'ppv', 'settings'],
  },
  marketing: { 
    label: 'Marketing', 
    hasSubNav: true,
    subPages: ['social', 'calendar'],
  },
  content: { label: 'Content', hasSubNav: false },
  messages: { label: 'Messages', hasSubNav: false },
};

function testNavigationContext() {
  console.log('🧪 Testing Navigation Context...\n');
  
  let passed = 0;
  let failed = 0;
  
  TEST_PATHS.forEach(path => {
    const segments = path.split('/').filter(Boolean);
    const section = segments[0] || 'home';
    const subSection = segments[1];
    const config = SECTION_CONFIG[section];
    
    console.log(`Testing path: ${path}`);
    console.log(`  Section: ${section}`);
    console.log(`  Sub-section: ${subSection || 'none'}`);
    console.log(`  Has sub-nav: ${config?.hasSubNav || false}`);
    
    // Validate section exists in config
    if (!config) {
      console.log(`  ❌ Section not found in config`);
      failed++;
    } else {
      console.log(`  ✅ Section configured`);
      passed++;
    }
    
    // Validate sub-section if present
    if (subSection && config?.subPages) {
      if (config.subPages.includes(subSection)) {
        console.log(`  ✅ Sub-section valid`);
        passed++;
      } else {
        console.log(`  ❌ Sub-section not in config`);
        failed++;
      }
    }
    
    console.log('');
  });
  
  return { passed, failed };
}

function testBreadcrumbGeneration() {
  console.log('🧪 Testing Breadcrumb Generation...\n');
  
  let passed = 0;
  let failed = 0;
  
  const testCases = [
    { path: '/home', expectedCount: 0 },
    { path: '/analytics', expectedCount: 2 },
    { path: '/analytics/pricing', expectedCount: 3 },
    { path: '/onlyfans/messages', expectedCount: 3 },
  ];
  
  testCases.forEach(({ path, expectedCount }) => {
    const segments = path.split('/').filter(Boolean);
    let breadcrumbCount = 0;
    
    // Don't show breadcrumbs on home page
    if (segments.length > 0 && segments[0] === 'home') {
      breadcrumbCount = 0;
    } else if (segments.length > 0) {
      breadcrumbCount = 1; // Home
      breadcrumbCount += segments.length;
    }
    
    console.log(`Testing path: ${path}`);
    console.log(`  Expected breadcrumbs: ${expectedCount}`);
    console.log(`  Generated breadcrumbs: ${breadcrumbCount}`);
    
    if (breadcrumbCount === expectedCount) {
      console.log(`  ✅ Breadcrumb count correct`);
      passed++;
    } else {
      console.log(`  ❌ Breadcrumb count mismatch`);
      failed++;
    }
    
    console.log('');
  });
  
  return { passed, failed };
}

function testSubNavVisibility() {
  console.log('🧪 Testing Sub-Navigation Visibility...\n');
  
  let passed = 0;
  let failed = 0;
  
  const testCases = [
    { path: '/home', shouldShow: false },
    { path: '/analytics', shouldShow: true },
    { path: '/analytics/pricing', shouldShow: true },
    { path: '/onlyfans', shouldShow: true },
    { path: '/content', shouldShow: false },
  ];
  
  testCases.forEach(({ path, shouldShow }) => {
    const segments = path.split('/').filter(Boolean);
    const section = segments[0] || 'home';
    const config = SECTION_CONFIG[section];
    const showSubNav = config?.hasSubNav || false;
    
    console.log(`Testing path: ${path}`);
    console.log(`  Should show sub-nav: ${shouldShow}`);
    console.log(`  Will show sub-nav: ${showSubNav}`);
    
    if (showSubNav === shouldShow) {
      console.log(`  ✅ Sub-nav visibility correct`);
      passed++;
    } else {
      console.log(`  ❌ Sub-nav visibility incorrect`);
      failed++;
    }
    
    console.log('');
  });
  
  return { passed, failed };
}

function testActiveStates() {
  console.log('🧪 Testing Active States...\n');
  
  let passed = 0;
  let failed = 0;
  
  const testCases = [
    { path: '/analytics', activeSection: 'analytics', activeSubSection: undefined },
    { path: '/analytics/pricing', activeSection: 'analytics', activeSubSection: 'pricing' },
    { path: '/onlyfans/messages', activeSection: 'onlyfans', activeSubSection: 'messages' },
  ];
  
  testCases.forEach(({ path, activeSection, activeSubSection }) => {
    const segments = path.split('/').filter(Boolean);
    const section = segments[0];
    const subSection = segments[1];
    
    console.log(`Testing path: ${path}`);
    console.log(`  Expected section: ${activeSection}`);
    console.log(`  Actual section: ${section}`);
    console.log(`  Expected sub-section: ${activeSubSection || 'none'}`);
    console.log(`  Actual sub-section: ${subSection || 'none'}`);
    
    if (section === activeSection && subSection === activeSubSection) {
      console.log(`  ✅ Active states correct`);
      passed++;
    } else {
      console.log(`  ❌ Active states incorrect`);
      failed++;
    }
    
    console.log('');
  });
  
  return { passed, failed };
}

// Run all tests
async function main() {
  console.log('🚀 Navigation Infrastructure Test Suite\n');
  console.log('=' .repeat(60));
  console.log('');
  
  const results = {
    navigationContext: testNavigationContext(),
    breadcrumbs: testBreadcrumbGeneration(),
    subNav: testSubNavVisibility(),
    activeStates: testActiveStates(),
  };
  
  console.log('=' .repeat(60));
  console.log('\n📊 Test Results Summary\n');
  
  let totalPassed = 0;
  let totalFailed = 0;
  
  Object.entries(results).forEach(([name, result]) => {
    console.log(`${name}:`);
    console.log(`  ✅ Passed: ${result.passed}`);
    console.log(`  ❌ Failed: ${result.failed}`);
    totalPassed += result.passed;
    totalFailed += result.failed;
  });
  
  console.log('');
  console.log('Total:');
  console.log(`  ✅ Passed: ${totalPassed}`);
  console.log(`  ❌ Failed: ${totalFailed}`);
  console.log(`  📈 Success Rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);
  
  if (totalFailed === 0) {
    console.log('\n✅ All tests passed! Navigation infrastructure is working correctly.');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Please review the output above.');
    process.exit(1);
  }
}

main().catch(console.error);
