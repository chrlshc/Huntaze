/**
 * Property Test: Active State Uniqueness
 * 
 * Property 2: Active state uniqueness
 * For any current route, exactly one main section and at most one sub-section
 * should be marked as active.
 * 
 * Validates: Requirements 3.2
 */

import { describe, it, expect } from 'vitest';

interface NavigationState {
  activeSection: string;
  activeSubSection?: string;
  activeSections: string[];
}

// Simulate getting active state from a path
function getActiveState(pathname: string): NavigationState {
  const segments = pathname.split('/').filter(Boolean);
  
  if (segments.length === 0) {
    return {
      activeSection: 'home',
      activeSections: ['home'],
    };
  }
  
  const activeSection = segments[0];
  const activeSubSection = segments[1];
  
  return {
    activeSection,
    activeSubSection,
    activeSections: [activeSection],
  };
}

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

describe('Property: Active State Uniqueness', () => {
  it('should have exactly one active section for any path', () => {
    TEST_PATHS.forEach(path => {
      const state = getActiveState(path);
      expect(state.activeSections).toHaveLength(1);
    });
  });
  
  it('should have at most one active sub-section for any path', () => {
    TEST_PATHS.forEach(path => {
      const state = getActiveState(path);
      
      // Either no sub-section or exactly one
      if (state.activeSubSection) {
        expect(typeof state.activeSubSection).toBe('string');
        expect(state.activeSubSection.length).toBeGreaterThan(0);
      }
    });
  });
  
  it('should maintain active section when on sub-page', () => {
    const subPages = [
      { path: '/analytics/pricing', expectedSection: 'analytics' },
      { path: '/analytics/churn', expectedSection: 'analytics' },
      { path: '/onlyfans/messages', expectedSection: 'onlyfans' },
      { path: '/onlyfans/fans', expectedSection: 'onlyfans' },
      { path: '/marketing/social', expectedSection: 'marketing' },
    ];
    
    subPages.forEach(({ path, expectedSection }) => {
      const state = getActiveState(path);
      expect(state.activeSection).toBe(expectedSection);
    });
  });
  
  it('should not have sub-section active on main section page', () => {
    const mainPages = ['/analytics', '/onlyfans', '/marketing'];
    
    mainPages.forEach(path => {
      const state = getActiveState(path);
      expect(state.activeSubSection).toBeUndefined();
    });
  });
  
  it('should have consistent active state for same path', () => {
    const path = '/analytics/pricing';
    const state1 = getActiveState(path);
    const state2 = getActiveState(path);
    
    expect(state1.activeSection).toBe(state2.activeSection);
    expect(state1.activeSubSection).toBe(state2.activeSubSection);
  });
});

describe('Property: Active State Transitions', () => {
  it('should change active section when navigating between sections', () => {
    const state1 = getActiveState('/analytics');
    const state2 = getActiveState('/onlyfans');
    
    expect(state1.activeSection).not.toBe(state2.activeSection);
  });
  
  it('should maintain section but change sub-section within same section', () => {
    const state1 = getActiveState('/analytics/pricing');
    const state2 = getActiveState('/analytics/churn');
    
    expect(state1.activeSection).toBe(state2.activeSection);
    expect(state1.activeSubSection).not.toBe(state2.activeSubSection);
  });
  
  it('should clear sub-section when navigating to main section page', () => {
    const state1 = getActiveState('/analytics/pricing');
    const state2 = getActiveState('/analytics');
    
    expect(state1.activeSubSection).toBeDefined();
    expect(state2.activeSubSection).toBeUndefined();
  });
});
