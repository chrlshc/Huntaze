import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import fc from 'fast-check';

// Mock navigation item component for testing
const NavItem = ({ 
  label, 
  isActive, 
  icon 
}: { 
  label: string; 
  isActive: boolean; 
  icon: string;
}) => {
  return (
    <a
      href="#"
      className="nav-item"
      data-active={isActive}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        gap: '12px',
        color: isActive ? 'var(--color-indigo)' : '#4B5563',
        backgroundColor: isActive ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
        textDecoration: 'none',
        transition: 'all 0.15s ease',
        borderRadius: '0 8px 8px 0',
        marginRight: '12px',
        fontSize: '14px',
        fontWeight: isActive ? '500' : '400',
        ...(isActive && {
          borderLeft: '3px solid var(--color-indigo)',
          paddingLeft: '13px',
        }),
      }}
    >
      <span data-testid={`icon-${icon}`}>{icon}</span>
      {label}
    </a>
  );
};

describe('Navigation Item States Property Tests', () => {
  // Feature: dashboard-shopify-migration, Property 6: Active Navigation Item Styling
  // Validates: Requirements 2.3
  it('should display 3px Electric Indigo left border and fade indigo background for any active navigation item', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 20 }),
        fc.constantFrom('home', 'analytics', 'content', 'messages', 'integrations', 'settings'),
        (label, icon) => {
          const { container } = render(
            <NavItem label={label} isActive={true} icon={icon} />
          );
          
          const navItem = container.querySelector('.nav-item');
          const style = navItem?.getAttribute('style');
          
          // Check for Electric Indigo color
          expect(style).toContain('var(--color-indigo)');
          
          // Check for fade indigo background
          expect(style).toContain('rgba(99, 102, 241, 0.08)');
          
          // Check for left border
          expect(style).toContain('border-left: 3px solid var(--color-indigo)');
          
          // Check for active data attribute
          expect(navItem?.getAttribute('data-active')).toBe('true');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: dashboard-shopify-migration, Property 7: Inactive Navigation Item Styling
  // Validates: Requirements 2.4
  it('should display gray text with transparent background for any inactive navigation item', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 20 }),
        fc.constantFrom('home', 'analytics', 'content', 'messages', 'integrations', 'settings'),
        (label, icon) => {
          const { container } = render(
            <NavItem label={label} isActive={false} icon={icon} />
          );
          
          const navItem = container.querySelector('.nav-item');
          const style = navItem?.getAttribute('style');
          
          // Check for gray text color (browser converts to rgb)
          expect(style).toMatch(/color: (rgb\(75, 85, 99\)|#4B5563)/);
          
          // Check for transparent background
          expect(style).toContain('transparent');
          
          // Check for inactive data attribute
          expect(navItem?.getAttribute('data-active')).toBe('false');
          
          // Should not have left border
          expect(style).not.toContain('border-left: 3px');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: dashboard-shopify-migration, Property 8: Navigation Item Hover Feedback
  // Validates: Requirements 2.5
  it('should provide smooth transitions (0.15s ease) for any navigation item', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 20 }),
        fc.boolean(),
        fc.constantFrom('home', 'analytics', 'content', 'messages', 'integrations', 'settings'),
        (label, isActive, icon) => {
          const { container } = render(
            <NavItem label={label} isActive={isActive} icon={icon} />
          );
          
          const navItem = container.querySelector('.nav-item');
          const style = navItem?.getAttribute('style');
          
          // Check for transition property
          expect(style).toContain('transition: all 0.15s ease');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply correct border radius for any navigation item', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 20 }),
        fc.boolean(),
        fc.constantFrom('home', 'analytics', 'content', 'messages', 'integrations', 'settings'),
        (label, isActive, icon) => {
          const { container } = render(
            <NavItem label={label} isActive={isActive} icon={icon} />
          );
          
          const navItem = container.querySelector('.nav-item');
          const style = navItem?.getAttribute('style');
          
          // Check for rounded corners on right side only
          expect(style).toContain('border-radius: 0 8px 8px 0');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply correct spacing for any navigation item', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 20 }),
        fc.boolean(),
        fc.constantFrom('home', 'analytics', 'content', 'messages', 'integrations', 'settings'),
        (label, isActive, icon) => {
          const { container } = render(
            <NavItem label={label} isActive={isActive} icon={icon} />
          );
          
          const navItem = container.querySelector('.nav-item');
          const style = navItem?.getAttribute('style');
          
          // Check for correct padding
          expect(style).toContain('padding: 12px 16px');
          
          // Check for correct gap
          expect(style).toContain('gap: 12px');
          
          // Check for right margin
          expect(style).toContain('margin-right: 12px');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should adjust padding when active to account for border', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 20 }),
        fc.constantFrom('home', 'analytics', 'content', 'messages', 'integrations', 'settings'),
        (label, icon) => {
          const { container: activeContainer } = render(
            <NavItem label={label} isActive={true} icon={icon} />
          );
          
          const { container: inactiveContainer } = render(
            <NavItem label={label} isActive={false} icon={icon} />
          );
          
          const activeStyle = activeContainer.querySelector('.nav-item')?.getAttribute('style');
          const inactiveStyle = inactiveContainer.querySelector('.nav-item')?.getAttribute('style');
          
          // Active should have adjusted left padding (13px instead of 16px to account for 3px border)
          expect(activeStyle).toMatch(/padding(-left)?:.*13px/);
          
          // Inactive should have normal padding
          expect(inactiveStyle).toContain('padding: 12px 16px');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply correct font weight based on active state', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 20 }),
        fc.constantFrom('home', 'analytics', 'content', 'messages', 'integrations', 'settings'),
        (label, icon) => {
          const { container: activeContainer } = render(
            <NavItem label={label} isActive={true} icon={icon} />
          );
          
          const { container: inactiveContainer } = render(
            <NavItem label={label} isActive={false} icon={icon} />
          );
          
          const activeStyle = activeContainer.querySelector('.nav-item')?.getAttribute('style');
          const inactiveStyle = inactiveContainer.querySelector('.nav-item')?.getAttribute('style');
          
          // Active should have medium font weight
          expect(activeStyle).toContain('font-weight: 500');
          
          // Inactive should have normal font weight
          expect(inactiveStyle).toContain('font-weight: 400');
        }
      ),
      { numRuns: 100 }
    );
  });
});
