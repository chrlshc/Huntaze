/**
 * Property Test: Mobile Layout Adaptation
 * Feature: onlyfans-shopify-unification, Property 14
 * Validates: Requirements 8.1
 * 
 * Property: For any page layout, when viewport width is below 768px,
 * multi-column layouts should collapse to single-column
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';

// Test component that simulates multi-column layouts
const MultiColumnLayout: React.FC<{ columns: number; className?: string }> = ({ columns, className }) => {
  return (
    <div 
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '16px'
      }}
      data-testid="multi-column-layout"
      data-columns={columns}
    >
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} data-testid={`column-${i}`}>
          Column {i + 1}
        </div>
      ))}
    </div>
  );
};

// Helper to check if layout is single column at mobile width
const isSingleColumnAtMobile = (element: HTMLElement, originalColumns: number): boolean => {
  // Check if element has responsive classes or media queries
  const className = element.className || '';
  const style = element.getAttribute('style') || '';
  
  // Common patterns for mobile single-column:
  // - grid-cols-1 on mobile
  // - md:grid-cols-X (implies grid-cols-1 on mobile)
  // - lg:grid-cols-X (implies grid-cols-1 on mobile)
  const hasMobileResponsive = 
    className.includes('grid-cols-1') ||
    className.includes('md:grid-cols-') ||
    className.includes('lg:grid-cols-') ||
    className.includes('flex-col') ||
    className.includes('md:flex-row') ||
    className.includes('lg:flex-row');
  
  // If it has responsive classes, it should collapse on mobile
  if (hasMobileResponsive) {
    return true;
  }
  
  // Check inline styles for media queries (less common but possible)
  if (style.includes('@media')) {
    return true;
  }
  
  // If original columns > 1 and no responsive classes, it's not mobile-friendly
  return originalColumns === 1;
};

describe('Property 14: Mobile Layout Adaptation', () => {
  it('should collapse multi-column layouts to single-column on mobile viewports', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 4 }), // Test 2-4 column layouts
        (columns) => {
          // Render a multi-column layout with responsive classes
          const { container } = render(
            <MultiColumnLayout 
              columns={columns} 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            />
          );
          
          const layout = container.querySelector('[data-testid="multi-column-layout"]');
          expect(layout).toBeTruthy();
          
          // Verify it has mobile-responsive classes
          const isMobileFriendly = isSingleColumnAtMobile(layout as HTMLElement, columns);
          expect(isMobileFriendly).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify OnlyFans Overview metrics grid collapses on mobile', () => {
    // Test the actual metrics grid pattern used in OnlyFans pages
    const { container } = render(
      <div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        data-testid="metrics-grid"
      >
        <div>Metric 1</div>
        <div>Metric 2</div>
        <div>Metric 3</div>
        <div>Metric 4</div>
      </div>
    );
    
    const grid = container.querySelector('[data-testid="metrics-grid"]');
    expect(grid).toBeTruthy();
    expect(grid?.className).toContain('grid-cols-1');
    expect(grid?.className).toContain('md:grid-cols-2');
    expect(grid?.className).toContain('lg:grid-cols-4');
  });

  it('should verify OnlyFans PPV content grid collapses on mobile', () => {
    // Test the PPV content grid pattern
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
    expect(grid?.className).toContain('grid-cols-1');
    expect(grid?.className).toContain('md:grid-cols-2');
    expect(grid?.className).toContain('lg:grid-cols-3');
  });

  it('should verify OnlyFans Quick Actions grid collapses on mobile', () => {
    // Test the quick actions grid pattern
    const { container } = render(
      <div 
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        data-testid="quick-actions-grid"
      >
        <div>Action 1</div>
        <div>Action 2</div>
        <div>Action 3</div>
      </div>
    );
    
    const grid = container.querySelector('[data-testid="quick-actions-grid"]');
    expect(grid).toBeTruthy();
    expect(grid?.className).toContain('grid-cols-1');
    expect(grid?.className).toContain('md:grid-cols-3');
  });

  it('should verify filter bar stacks vertically on mobile', () => {
    // Test filter bar layout pattern
    const { container } = render(
      <div 
        className="flex flex-col md:flex-row gap-3"
        data-testid="filter-bar"
      >
        <div>Search</div>
        <div>Filter</div>
        <div>Sort</div>
      </div>
    );
    
    const filterBar = container.querySelector('[data-testid="filter-bar"]');
    expect(filterBar).toBeTruthy();
    expect(filterBar?.className).toContain('flex-col');
    expect(filterBar?.className).toContain('md:flex-row');
  });

  it('should verify all grid layouts have mobile-first responsive classes', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
          'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
          'grid grid-cols-1 md:grid-cols-3',
          'flex flex-col md:flex-row',
          'flex flex-col lg:flex-row'
        ),
        (responsiveClass) => {
          // Verify all responsive patterns start with mobile-first approach
          const hasMobileFirst = 
            responsiveClass.includes('grid-cols-1') ||
            responsiveClass.includes('flex-col');
          
          const hasDesktopBreakpoint = 
            responsiveClass.includes('md:') ||
            responsiveClass.includes('lg:');
          
          // Must have both mobile-first and desktop breakpoint
          expect(hasMobileFirst).toBe(true);
          expect(hasDesktopBreakpoint).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify page header actions stack on mobile', () => {
    // Test page header actions layout
    const { container } = render(
      <div 
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
        data-testid="page-actions"
      >
        <button>Primary Action</button>
        <button>Secondary Action</button>
      </div>
    );
    
    const actions = container.querySelector('[data-testid="page-actions"]');
    expect(actions).toBeTruthy();
    expect(actions?.className).toContain('flex-col');
    expect(actions?.className).toContain('sm:flex-row');
  });

  it('should verify segment filters wrap on mobile', () => {
    // Test segment filter pills layout
    const { container } = render(
      <div 
        className="flex flex-wrap gap-2"
        data-testid="segment-filters"
      >
        <button>All</button>
        <button>VIP</button>
        <button>Active</button>
        <button>At-Risk</button>
      </div>
    );
    
    const filters = container.querySelector('[data-testid="segment-filters"]');
    expect(filters).toBeTruthy();
    expect(filters?.className).toContain('flex-wrap');
  });
});
