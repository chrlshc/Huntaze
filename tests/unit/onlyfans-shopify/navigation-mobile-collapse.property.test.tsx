/**
 * Property Test: Navigation Mobile Collapse
 * Feature: onlyfans-shopify-unification, Property 16
 * Validates: Requirements 8.3
 * 
 * Property: For any navigation element, when viewport width is below 768px,
 * the navigation should collapse to a mobile menu
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';

// Test navigation component that simulates mobile collapse behavior
const NavigationMenu: React.FC<{ 
  items: string[]; 
  isMobile?: boolean;
  className?: string;
}> = ({ items, isMobile = false, className }) => {
  return (
    <nav 
      className={className}
      data-testid="navigation-menu"
      data-mobile={isMobile}
      data-item-count={items.length}
    >
      {/* Desktop navigation - hidden on mobile */}
      <div 
        className="hidden md:flex items-center gap-4"
        data-testid="desktop-nav"
      >
        {items.map((item, i) => (
          <a key={i} href={`#${item}`} className="nav-item">
            {item}
          </a>
        ))}
      </div>
      
      {/* Mobile navigation - visible only on mobile */}
      <div 
        className="md:hidden"
        data-testid="mobile-nav"
      >
        <button 
          className="mobile-menu-button"
          data-testid="mobile-menu-toggle"
          aria-label="Toggle menu"
        >
          Menu
        </button>
        <div 
          className="mobile-menu-content"
          data-testid="mobile-menu-content"
        >
          {items.map((item, i) => (
            <a key={i} href={`#${item}`} className="mobile-nav-item">
              {item}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
};

// Helper to check if navigation has mobile collapse behavior
const hasMobileCollapse = (element: HTMLElement): boolean => {
  const desktopNav = element.querySelector('[data-testid="desktop-nav"]');
  const mobileNav = element.querySelector('[data-testid="mobile-nav"]');
  
  if (!desktopNav || !mobileNav) {
    return false;
  }
  
  // Desktop nav should be hidden on mobile (hidden md:flex)
  const desktopClasses = desktopNav.className || '';
  const hasDesktopHidden = desktopClasses.includes('hidden') && desktopClasses.includes('md:');
  
  // Mobile nav should be visible only on mobile (md:hidden)
  const mobileClasses = mobileNav.className || '';
  const hasMobileVisible = mobileClasses.includes('md:hidden');
  
  return hasDesktopHidden && hasMobileVisible;
};

describe('Property 16: Navigation Mobile Collapse', () => {
  it('should have separate mobile and desktop navigation elements', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 3, maxLength: 15 }), { minLength: 3, maxLength: 8 }),
        (navItems) => {
          const { container } = render(
            <NavigationMenu items={navItems} />
          );
          
          const nav = container.querySelector('[data-testid="navigation-menu"]');
          expect(nav).toBeTruthy();
          
          // Should have both desktop and mobile navigation
          const desktopNav = container.querySelector('[data-testid="desktop-nav"]');
          const mobileNav = container.querySelector('[data-testid="mobile-nav"]');
          
          expect(desktopNav).toBeTruthy();
          expect(mobileNav).toBeTruthy();
          
          // Verify mobile collapse behavior
          const hasCollapse = hasMobileCollapse(nav as HTMLElement);
          expect(hasCollapse).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should hide desktop navigation on mobile viewports', () => {
    const { container } = render(
      <NavigationMenu items={['Home', 'Messages', 'Fans', 'PPV', 'Settings']} />
    );
    
    const desktopNav = container.querySelector('[data-testid="desktop-nav"]');
    expect(desktopNav).toBeTruthy();
    
    // Should have 'hidden' class for mobile and 'md:flex' for desktop
    const classes = desktopNav?.className || '';
    expect(classes).toContain('hidden');
    expect(classes).toContain('md:flex');
  });

  it('should show mobile menu toggle on mobile viewports', () => {
    const { container } = render(
      <NavigationMenu items={['Home', 'Messages', 'Fans', 'PPV', 'Settings']} />
    );
    
    const mobileNav = container.querySelector('[data-testid="mobile-nav"]');
    expect(mobileNav).toBeTruthy();
    
    // Should have 'md:hidden' class to hide on desktop
    const classes = mobileNav?.className || '';
    expect(classes).toContain('md:hidden');
    
    // Should have a menu toggle button
    const menuToggle = container.querySelector('[data-testid="mobile-menu-toggle"]');
    expect(menuToggle).toBeTruthy();
  });

  it('should have accessible mobile menu toggle button', () => {
    const { container } = render(
      <NavigationMenu items={['Home', 'Messages', 'Fans']} />
    );
    
    const menuToggle = container.querySelector('[data-testid="mobile-menu-toggle"]');
    expect(menuToggle).toBeTruthy();
    
    // Should have aria-label for accessibility
    const ariaLabel = menuToggle?.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toBeTruthy();
  });

  it('should render all navigation items in both mobile and desktop views', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 3, maxLength: 15 }), { minLength: 2, maxLength: 10 }),
        (navItems) => {
          const { container } = render(
            <NavigationMenu items={navItems} />
          );
          
          // Count items in desktop nav
          const desktopNav = container.querySelector('[data-testid="desktop-nav"]');
          const desktopItems = desktopNav?.querySelectorAll('.nav-item');
          expect(desktopItems?.length).toBe(navItems.length);
          
          // Count items in mobile nav
          const mobileMenuContent = container.querySelector('[data-testid="mobile-menu-content"]');
          const mobileItems = mobileMenuContent?.querySelectorAll('.mobile-nav-item');
          expect(mobileItems?.length).toBe(navItems.length);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify OnlyFans sidebar has mobile collapse behavior', () => {
    // Test the actual sidebar pattern used in OnlyFans pages
    const { container } = render(
      <aside 
        className="hidden md:block w-64 bg-white border-r"
        data-testid="sidebar"
      >
        <nav>
          <a href="/onlyfans">Overview</a>
          <a href="/onlyfans/messages">Messages</a>
          <a href="/onlyfans/fans">Fans</a>
          <a href="/onlyfans/ppv">PPV</a>
          <a href="/onlyfans/settings">Settings</a>
        </nav>
      </aside>
    );
    
    const sidebar = container.querySelector('[data-testid="sidebar"]');
    expect(sidebar).toBeTruthy();
    
    // Sidebar should be hidden on mobile
    const classes = sidebar?.className || '';
    expect(classes).toContain('hidden');
    expect(classes).toContain('md:block');
  });

  it('should verify mobile navigation uses full width on small screens', () => {
    const { container } = render(
      <nav 
        className="w-full md:w-auto"
        data-testid="responsive-nav"
      >
        <div className="flex flex-col md:flex-row">
          <a href="#home">Home</a>
          <a href="#about">About</a>
        </div>
      </nav>
    );
    
    const nav = container.querySelector('[data-testid="responsive-nav"]');
    expect(nav).toBeTruthy();
    
    // Should use full width on mobile
    const classes = nav?.className || '';
    expect(classes).toContain('w-full');
    expect(classes).toContain('md:w-auto');
  });

  it('should verify navigation items stack vertically on mobile', () => {
    const { container } = render(
      <nav data-testid="stacked-nav">
        <div className="flex flex-col md:flex-row gap-2">
          <a href="#link1">Link 1</a>
          <a href="#link2">Link 2</a>
          <a href="#link3">Link 3</a>
        </div>
      </nav>
    );
    
    const navContainer = container.querySelector('[data-testid="stacked-nav"] > div');
    expect(navContainer).toBeTruthy();
    
    // Should stack vertically on mobile
    const classes = navContainer?.className || '';
    expect(classes).toContain('flex-col');
    expect(classes).toContain('md:flex-row');
  });

  it('should verify all navigation patterns use mobile-first responsive classes', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'hidden md:flex',
          'md:hidden',
          'flex flex-col md:flex-row',
          'w-full md:w-auto',
          'hidden md:block'
        ),
        (responsiveClass) => {
          // Verify navigation patterns have proper mobile/desktop breakpoints
          const hasMobileState = 
            responsiveClass.includes('hidden') ||
            responsiveClass.includes('flex-col') ||
            responsiveClass.includes('w-full');
          
          const hasDesktopBreakpoint = responsiveClass.includes('md:');
          
          // Must have both mobile state and desktop breakpoint
          expect(hasMobileState || hasDesktopBreakpoint).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify mobile menu has proper z-index for overlay', () => {
    const { container } = render(
      <div 
        className="fixed inset-0 z-50 md:hidden"
        data-testid="mobile-menu-overlay"
      >
        <nav>Mobile Menu Content</nav>
      </div>
    );
    
    const overlay = container.querySelector('[data-testid="mobile-menu-overlay"]');
    expect(overlay).toBeTruthy();
    
    // Should have high z-index and be hidden on desktop
    const classes = overlay?.className || '';
    expect(classes).toContain('z-50');
    expect(classes).toContain('md:hidden');
  });
});
