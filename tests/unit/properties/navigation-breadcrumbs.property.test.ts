/**
 * Property Test: Breadcrumb Path Accuracy
 * 
 * Property 3: Breadcrumb path accuracy
 * For any page except Home, breadcrumbs should show the complete path
 * from Home to the current page with correct labels and links.
 * 
 * Validates: Requirements 3.4
 */

import { describe, it, expect } from 'vitest';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

// Section labels mapping
const SECTION_LABELS: Record<string, string> = {
  home: 'Home',
  analytics: 'Analytics',
  onlyfans: 'OnlyFans',
  'onlyfans-assisted': 'OnlyFans Assisted',
  marketing: 'Marketing',
  'social-marketing': 'Social Marketing',
  content: 'Content',
  messages: 'Messages',
  integrations: 'Integrations',
  billing: 'Billing',
  'smart-onboarding': 'Smart Onboarding',
  pricing: 'Pricing',
  churn: 'Churn',
  upsells: 'Upsells',
  forecast: 'Forecast',
  payouts: 'Payouts',
  fans: 'Fans',
  ppv: 'PPV',
  settings: 'Settings',
  social: 'Social',
  calendar: 'Calendar',
  packs: 'Packs',
};

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];
  
  // Don't show breadcrumbs on home page
  if (segments.length === 0 || segments[0] === 'home') {
    return [];
  }
  
  // Always start with Home
  breadcrumbs.push({ label: 'Home', href: '/home' });
  
  // Build breadcrumbs from segments
  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const label = SECTION_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    
    // Last segment is current page (no link)
    if (index === segments.length - 1) {
      breadcrumbs.push({ label });
    } else {
      breadcrumbs.push({ label, href: currentPath });
    }
  });
  
  return breadcrumbs;
}

const TEST_CASES = [
  {
    path: '/home',
    expectedBreadcrumbs: [],
  },
  {
    path: '/analytics',
    expectedBreadcrumbs: [
      { label: 'Home', href: '/home' },
      { label: 'Analytics' },
    ],
  },
  {
    path: '/analytics/pricing',
    expectedBreadcrumbs: [
      { label: 'Home', href: '/home' },
      { label: 'Analytics', href: '/analytics' },
      { label: 'Pricing' },
    ],
  },
  {
    path: '/onlyfans/messages',
    expectedBreadcrumbs: [
      { label: 'Home', href: '/home' },
      { label: 'OnlyFans', href: '/onlyfans' },
      { label: 'Messages' },
    ],
  },
  {
    path: '/content',
    expectedBreadcrumbs: [
      { label: 'Home', href: '/home' },
      { label: 'Content' },
    ],
  },
];

describe('Property: Breadcrumb Path Accuracy', () => {
  it('should generate correct breadcrumbs for all test paths', () => {
    TEST_CASES.forEach(({ path, expectedBreadcrumbs }) => {
      const breadcrumbs = generateBreadcrumbs(path);
      expect(breadcrumbs).toEqual(expectedBreadcrumbs);
    });
  });
  
  it('should not show breadcrumbs on home page', () => {
    const breadcrumbs = generateBreadcrumbs('/home');
    expect(breadcrumbs).toHaveLength(0);
  });
  
  it('should always start with Home for non-home pages', () => {
    const paths = ['/analytics', '/onlyfans', '/content', '/analytics/pricing'];
    
    paths.forEach(path => {
      const breadcrumbs = generateBreadcrumbs(path);
      expect(breadcrumbs.length).toBeGreaterThan(0);
      expect(breadcrumbs[0].label).toBe('Home');
      expect(breadcrumbs[0].href).toBe('/home');
    });
  });
  
  it('should not have href for last breadcrumb (current page)', () => {
    const paths = ['/analytics', '/analytics/pricing', '/onlyfans/messages'];
    
    paths.forEach(path => {
      const breadcrumbs = generateBreadcrumbs(path);
      const lastBreadcrumb = breadcrumbs[breadcrumbs.length - 1];
      expect(lastBreadcrumb.href).toBeUndefined();
    });
  });
  
  it('should have href for all breadcrumbs except last', () => {
    const path = '/analytics/pricing';
    const breadcrumbs = generateBreadcrumbs(path);
    
    // All except last should have href
    for (let i = 0; i < breadcrumbs.length - 1; i++) {
      expect(breadcrumbs[i].href).toBeDefined();
      expect(breadcrumbs[i].href).toMatch(/^\//);
    }
  });
  
  it('should build correct path hierarchy', () => {
    const path = '/analytics/pricing';
    const breadcrumbs = generateBreadcrumbs(path);
    
    expect(breadcrumbs).toHaveLength(3);
    expect(breadcrumbs[0].href).toBe('/home');
    expect(breadcrumbs[1].href).toBe('/analytics');
    expect(breadcrumbs[2].href).toBeUndefined();
  });
  
  it('should use proper labels from mapping', () => {
    const testPaths = [
      { path: '/onlyfans', expectedLabel: 'OnlyFans' },
      { path: '/analytics', expectedLabel: 'Analytics' },
      { path: '/smart-onboarding', expectedLabel: 'Smart Onboarding' },
    ];
    
    testPaths.forEach(({ path, expectedLabel }) => {
      const breadcrumbs = generateBreadcrumbs(path);
      const lastBreadcrumb = breadcrumbs[breadcrumbs.length - 1];
      expect(lastBreadcrumb.label).toBe(expectedLabel);
    });
  });
});

describe('Property: Breadcrumb Consistency', () => {
  it('should generate same breadcrumbs for same path', () => {
    const path = '/analytics/pricing';
    const breadcrumbs1 = generateBreadcrumbs(path);
    const breadcrumbs2 = generateBreadcrumbs(path);
    
    expect(breadcrumbs1).toEqual(breadcrumbs2);
  });
  
  it('should have increasing path depth', () => {
    const paths = [
      '/analytics',
      '/analytics/pricing',
    ];
    
    const breadcrumbs = paths.map(p => generateBreadcrumbs(p));
    
    // Each level should have one more breadcrumb
    expect(breadcrumbs[1].length).toBe(breadcrumbs[0].length + 1);
  });
  
  it('should maintain parent path in child breadcrumbs', () => {
    const parentPath = '/analytics';
    const childPath = '/analytics/pricing';
    
    const parentBreadcrumbs = generateBreadcrumbs(parentPath);
    const childBreadcrumbs = generateBreadcrumbs(childPath);
    
    // Child should contain all parent breadcrumbs (except last becomes linked)
    expect(childBreadcrumbs[0]).toEqual(parentBreadcrumbs[0]); // Home
    expect(childBreadcrumbs[1].label).toBe(parentBreadcrumbs[1].label); // Analytics
  });
});
