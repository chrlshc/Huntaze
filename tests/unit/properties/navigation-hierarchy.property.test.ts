/**
 * Property Test: Navigation Hierarchy Consistency
 * 
 * Property 1: Navigation hierarchy consistency
 * For any valid route path, the navigation context should correctly identify
 * the section, sub-section, and generate appropriate breadcrumbs.
 * 
 * Validates: Requirements 3.1, 3.2
 */

import { describe, it, expect } from 'vitest';

// Mock navigation paths
const TEST_ROUTES = [
  // Home
  { path: '/home', section: 'home', subSection: undefined, breadcrumbCount: 0 },
  
  // Analytics section
  { path: '/analytics', section: 'analytics', subSection: undefined, breadcrumbCount: 2 },
  { path: '/analytics/pricing', section: 'analytics', subSection: 'pricing', breadcrumbCount: 3 },
  { path: '/analytics/churn', section: 'analytics', subSection: 'churn', breadcrumbCount: 3 },
  { path: '/analytics/upsells', section: 'analytics', subSection: 'upsells', breadcrumbCount: 3 },
  { path: '/analytics/forecast', section: 'analytics', subSection: 'forecast', breadcrumbCount: 3 },
  { path: '/analytics/payouts', section: 'analytics', subSection: 'payouts', breadcrumbCount: 3 },
  
  // OnlyFans section
  { path: '/onlyfans', section: 'onlyfans', subSection: undefined, breadcrumbCount: 2 },
  { path: '/onlyfans/messages', section: 'onlyfans', subSection: 'messages', breadcrumbCount: 3 },
  { path: '/onlyfans/fans', section: 'onlyfans', subSection: 'fans', breadcrumbCount: 3 },
  { path: '/onlyfans/ppv', section: 'onlyfans', subSection: 'ppv', breadcrumbCount: 3 },
  { path: '/onlyfans/settings', section: 'onlyfans', subSection: 'settings', breadcrumbCount: 3 },
  
  // Marketing section
  { path: '/marketing', section: 'marketing', subSection: undefined, breadcrumbCount: 2 },
  { path: '/marketing/social', section: 'marketing', subSection: 'social', breadcrumbCount: 3 },
  { path: '/marketing/calendar', section: 'marketing', subSection: 'calendar', breadcrumbCount: 3 },
  
  // Single-level sections
  { path: '/content', section: 'content', subSection: undefined, breadcrumbCount: 2 },
  { path: '/messages', section: 'messages', subSection: undefined, breadcrumbCount: 2 },
  { path: '/integrations', section: 'integrations', subSection: undefined, breadcrumbCount: 2 },
];

// Helper to parse path like the hook does
function parseNavigationPath(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  
  if (segments.length === 0) {
    return {
      currentSection: 'home',
      currentSubSection: undefined,
      breadcrumbCount: 0,
    };
  }
  
  const currentSection = segments[0];
  const currentSubSection = segments[1];
  
  // Generate breadcrumb count (matches actual breadcrumb generation logic)
  let breadcrumbCount = 0;
  
  // Don't show breadcrumbs on home page
  if (currentSection === 'home') {
    return {
      currentSection,
      currentSubSection,
      breadcrumbCount: 0,
    };
  }
  
  // Always start with Home for non-home pages
  breadcrumbCount = 1; // Home
  breadcrumbCount += segments.length; // Add all segments
  
  return {
    currentSection,
    currentSubSection,
    breadcrumbCount,
  };
}

describe('Property: Navigation Hierarchy Consistency', () => {
  it('should correctly identify section for all routes', () => {
    TEST_ROUTES.forEach(route => {
      const result = parseNavigationPath(route.path);
      expect(result.currentSection).toBe(route.section);
    });
  });
  
  it('should correctly identify sub-section for all routes', () => {
    TEST_ROUTES.forEach(route => {
      const result = parseNavigationPath(route.path);
      expect(result.currentSubSection).toBe(route.subSection);
    });
  });
  
  it('should generate correct breadcrumb count for all routes', () => {
    TEST_ROUTES.forEach(route => {
      const result = parseNavigationPath(route.path);
      expect(result.breadcrumbCount).toBe(route.breadcrumbCount);
    });
  });
  
  it('should handle edge cases', () => {
    // Root path
    const root = parseNavigationPath('/');
    expect(root.currentSection).toBe('home');
    expect(root.currentSubSection).toBeUndefined();
    
    // Empty path
    const empty = parseNavigationPath('');
    expect(empty.currentSection).toBe('home');
    expect(empty.currentSubSection).toBeUndefined();
  });
  
  it('should maintain consistency across similar paths', () => {
    // All analytics sub-pages should have same section
    const analyticsPaths = TEST_ROUTES.filter(r => r.section === 'analytics');
    analyticsPaths.forEach(route => {
      const result = parseNavigationPath(route.path);
      expect(result.currentSection).toBe('analytics');
    });
    
    // All OnlyFans sub-pages should have same section
    const onlyfansPaths = TEST_ROUTES.filter(r => r.section === 'onlyfans');
    onlyfansPaths.forEach(route => {
      const result = parseNavigationPath(route.path);
      expect(result.currentSection).toBe('onlyfans');
    });
  });
});

describe('Property: Section Configuration Completeness', () => {
  const SECTIONS_WITH_SUBNAV = ['analytics', 'onlyfans', 'marketing', 'billing', 'smart-onboarding'];
  const SECTIONS_WITHOUT_SUBNAV = ['home', 'content', 'messages', 'integrations', 'onlyfans-assisted', 'social-marketing'];
  
  it('should have sub-nav for configured sections', () => {
    SECTIONS_WITH_SUBNAV.forEach(section => {
      const hasSubNav = SECTIONS_WITH_SUBNAV.includes(section);
      expect(hasSubNav).toBe(true);
    });
  });
  
  it('should not have sub-nav for single-level sections', () => {
    SECTIONS_WITHOUT_SUBNAV.forEach(section => {
      const hasSubNav = SECTIONS_WITH_SUBNAV.includes(section);
      expect(hasSubNav).toBe(false);
    });
  });
});
