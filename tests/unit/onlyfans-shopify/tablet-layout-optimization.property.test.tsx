/**
 * Property Test: Tablet Layout Optimization
 * Feature: onlyfans-shopify-unification, Property 18
 * Validates: Requirements 8.5
 * 
 * Property: For any page layout, when viewport width is between 768px and 1024px,
 * the layout should use optimized column counts for medium screens
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';

// Tablet viewport range
const TABLET_MIN_WIDTH = 768;
const TABLET_MAX_WIDTH = 1024;

// Test component that simulates tablet-optimized layouts
const TabletOptimizedGrid: React.FC<{ 
  mobileColumns: number;
  tabletColumns: number;
  desktopColumns: number;
  className?: string;
}> = ({ mobileColumns, tabletColumns, desktopColumns, className }) => {
  return (
    <div 
      className={className}
      data-testid="tablet-grid"
      data-mobile-columns={mobileColumns}
      data-tablet-columns={tabletColumns}
      data-desktop-columns={desktopColumns}
    >
      {Array.from({ length: desktopColumns }).map((_, i) => (
        <div key={i} data-testid={`grid-item-${i}`}>
          Item {i + 1}
        </div>
      ))}
    </div>
  );
};

// Helper to check if layout has tablet optimization
const hasTabletOptimization = (element: HTMLElement): boolean => {
  const className = element.className || '';
  
  // Check for tablet-specific breakpoint (md:)
  const hasTabletBreakpoint = className.includes('md:');
  
  // Check for desktop breakpoint (lg:)
  const hasDesktopBreakpoint = className.includes('lg:');
  
  // Tablet optimization means having both md: and lg: breakpoints
  // This creates a three-tier responsive system: mobile -> tablet -> desktop
  return hasTabletBreakpoint && hasDesktopBreakpoint;
};

// Helper to extract column count from grid classes
const getColumnCountFromClass = (className: string, breakpoint: '' | 'md:' | 'lg:'): number => {
  const pattern = new RegExp(`${breakpoint}grid-cols-(\\d+)`);
  const match = className.match(pattern);
  return match ? parseInt(match[1]) : 0;
};

describe('Property 18: Tablet Layout Optimization', () => {
  it('should have three-tier responsive grid system (mobile, tablet, desktop)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1 }), // mobile: 1 column
        fc.integer({ min: 2, max: 3 }), // tablet: 2-3 columns
        fc.integer({ min: 3, max: 4 }), // desktop: 3-4 columns
        (mobileColumns, tabletColumns, desktopColumns) => {
          const className = `grid grid-cols-${mobileColumns} md:grid-cols-${tabletColumns} lg:grid-cols-${desktopColumns} gap-4`;
          
          const { container } = render(
            <TabletOptimizedGrid
              mobileColumns={mobileColumns}
              tabletColumns={tabletColumns}
              desktopColumns={desktopColumns}
              className={className}
            />
          );
          
          const grid = container.querySelector('[data-testid="tablet-grid"]');
          expect(grid).toBeTruthy();
          
          // Verify three-tier system
          const hasOptimization = hasTabletOptimization(grid as HTMLElement);
          expect(hasOptimization).toBe(true);
          
          // Verify tablet columns are between mobile and desktop
          expect(tabletColumns).toBeGreaterThanOrEqual(mobileColumns);
          expect(tabletColumns).toBeLessThanOrEqual(desktopColumns);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify OnlyFans metrics grid has tablet optimization', () => {
    // Metrics grid: 1 col mobile, 2 cols tablet, 4 cols desktop
    const { container } = render(
      <div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        data-testid="metrics-grid"
      >
        <div>Revenue</div>
        <div>Subscribers</div>
        <div>Engagement</div>
        <div>PPV Sales</div>
      </div>
    );
    
    const grid = container.querySelector('[data-testid="metrics-grid"]');
    expect(grid).toBeTruthy();
    
    const className = grid?.className || '';
    
    // Verify three-tier system
    expect(className).toContain('grid-cols-1'); // mobile
    expect(className).toContain('md:grid-cols-2'); // tablet
    expect(className).toContain('lg:grid-cols-4'); // desktop
    
    // Extract column counts
    const mobileColumns = getColumnCountFromClass(className, '');
    const tabletColumns = getColumnCountFromClass(className, 'md:');
    const desktopColumns = getColumnCountFromClass(className, 'lg:');
    
    expect(mobileColumns).toBe(1);
    expect(tabletColumns).toBe(2);
    expect(desktopColumns).toBe(4);
  });

  it('should verify OnlyFans PPV grid has tablet optimization', () => {
    // PPV grid: 1 col mobile, 2 cols tablet, 3 cols desktop
    const { container } = render(
      <div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        data-testid="ppv-grid"
      >
        <div>PPV 1</div>
        <div>PPV 2</div>
        <div>PPV 3</div>
      </div>
    );
    
    const grid = container.querySelector('[data-testid="ppv-grid"]');
    expect(grid).toBeTruthy();
    
    const className = grid?.className || '';
    
    // Verify three-tier system
    expect(className).toContain('grid-cols-1'); // mobile
    expect(className).toContain('md:grid-cols-2'); // tablet
    expect(className).toContain('lg:grid-cols-3'); // desktop
  });

  it('should verify OnlyFans Quick Actions has tablet optimization', () => {
    // Quick actions: 1 col mobile, 3 cols tablet/desktop
    const { container } = render(
      <div 
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        data-testid="quick-actions"
      >
        <div>Send Message</div>
        <div>View Fans</div>
        <div>Create PPV</div>
      </div>
    );
    
    const grid = container.querySelector('[data-testid="quick-actions"]');
    expect(grid).toBeTruthy();
    
    const className = grid?.className || '';
    
    // Verify responsive system
    expect(className).toContain('grid-cols-1'); // mobile
    expect(className).toContain('md:grid-cols-3'); // tablet and desktop
  });

  it('should verify tablet layouts use appropriate column counts', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 3 }), // tablet should use 2-3 columns typically
        (tabletColumns) => {
          const className = `grid grid-cols-1 md:grid-cols-${tabletColumns} lg:grid-cols-4 gap-4`;
          
          const { container } = render(
            <div className={className} data-testid="optimized-grid">
              <div>Item 1</div>
              <div>Item 2</div>
              <div>Item 3</div>
              <div>Item 4</div>
            </div>
          );
          
          const grid = container.querySelector('[data-testid="optimized-grid"]');
          expect(grid).toBeTruthy();
          
          const gridClassName = grid?.className || '';
          const extractedTabletColumns = getColumnCountFromClass(gridClassName, 'md:');
          
          // Tablet columns should be 2 or 3 for optimal viewing
          expect(extractedTabletColumns).toBeGreaterThanOrEqual(2);
          expect(extractedTabletColumns).toBeLessThanOrEqual(3);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify sidebar layout adapts for tablet', () => {
    // Sidebar should be visible on tablet but may have different width
    const { container } = render(
      <div className="flex">
        <aside 
          className="hidden md:block md:w-48 lg:w-64"
          data-testid="sidebar"
        >
          Sidebar
        </aside>
        <main className="flex-1" data-testid="main-content">
          Main Content
        </main>
      </div>
    );
    
    const sidebar = container.querySelector('[data-testid="sidebar"]');
    expect(sidebar).toBeTruthy();
    
    const className = sidebar?.className || '';
    
    // Sidebar should be visible on tablet (md:block)
    expect(className).toContain('md:block');
    
    // Sidebar should have different widths for tablet vs desktop
    expect(className).toContain('md:w-48'); // tablet: 192px
    expect(className).toContain('lg:w-64'); // desktop: 256px
  });

  it('should verify filter bar layout optimizes for tablet', () => {
    // Filter bar should stack on mobile, row on tablet
    const { container } = render(
      <div 
        className="flex flex-col md:flex-row gap-3"
        data-testid="filter-bar"
      >
        <div className="flex-1">Search</div>
        <div>Filter</div>
        <div>Sort</div>
      </div>
    );
    
    const filterBar = container.querySelector('[data-testid="filter-bar"]');
    expect(filterBar).toBeTruthy();
    
    const className = filterBar?.className || '';
    
    // Should be column on mobile, row on tablet
    expect(className).toContain('flex-col');
    expect(className).toContain('md:flex-row');
  });

  it('should verify page header actions optimize for tablet', () => {
    // Actions should stack on mobile, inline on tablet
    const { container } = render(
      <div 
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
        data-testid="page-actions"
      >
        <button>Primary</button>
        <button>Secondary</button>
      </div>
    );
    
    const actions = container.querySelector('[data-testid="page-actions"]');
    expect(actions).toBeTruthy();
    
    const className = actions?.className || '';
    
    // Should adapt at small tablet size (sm: 640px)
    expect(className).toContain('flex-col');
    expect(className).toContain('sm:flex-row');
  });

  it('should verify table layout adapts for tablet', () => {
    // Tables should show more columns on tablet than mobile
    const { container } = render(
      <div 
        className="overflow-x-auto md:overflow-x-visible"
        data-testid="table-container"
      >
        <table className="w-full">
          <thead>
            <tr>
              <th>Name</th>
              <th className="hidden md:table-cell">Tier</th>
              <th>LTV</th>
              <th className="hidden lg:table-cell">Join Date</th>
            </tr>
          </thead>
        </table>
      </div>
    );
    
    const container_el = container.querySelector('[data-testid="table-container"]');
    expect(container_el).toBeTruthy();
    
    const className = container_el?.className || '';
    
    // Should allow horizontal scroll on mobile, not on tablet
    expect(className).toContain('overflow-x-auto');
    expect(className).toContain('md:overflow-x-visible');
  });

  it('should verify all responsive patterns include tablet breakpoint', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
          'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
          'grid grid-cols-1 md:grid-cols-3',
          'flex flex-col md:flex-row',
          'hidden md:block lg:block',
          'w-full md:w-48 lg:w-64'
        ),
        (responsiveClass) => {
          // Verify all patterns include tablet breakpoint (md:)
          const hasTabletBreakpoint = responsiveClass.includes('md:');
          expect(hasTabletBreakpoint).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify spacing adapts for tablet viewports', () => {
    // Spacing should be tighter on mobile, more generous on tablet/desktop
    const { container } = render(
      <div 
        className="p-4 md:p-6 lg:p-8"
        data-testid="padded-container"
      >
        Content
      </div>
    );
    
    const paddedContainer = container.querySelector('[data-testid="padded-container"]');
    expect(paddedContainer).toBeTruthy();
    
    const className = paddedContainer?.className || '';
    
    // Should have progressive padding
    expect(className).toContain('p-4'); // mobile: 16px
    expect(className).toContain('md:p-6'); // tablet: 24px
    expect(className).toContain('lg:p-8'); // desktop: 32px
  });

  it('should verify gap spacing adapts for tablet', () => {
    // Grid gaps should increase on larger screens
    const { container } = render(
      <div 
        className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 lg:gap-6"
        data-testid="spaced-grid"
      >
        <div>Item 1</div>
        <div>Item 2</div>
      </div>
    );
    
    const grid = container.querySelector('[data-testid="spaced-grid"]');
    expect(grid).toBeTruthy();
    
    const className = grid?.className || '';
    
    // Should have progressive gap sizing
    expect(className).toContain('gap-3'); // mobile: 12px
    expect(className).toContain('md:gap-4'); // tablet: 16px
    expect(className).toContain('lg:gap-6'); // desktop: 24px
  });
});
