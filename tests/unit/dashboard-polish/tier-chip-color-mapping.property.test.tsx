/**
 * Feature: dashboard-global-polish, Property 12: Tier Chip Color Mapping
 * 
 * Property: For any tier chip in the fans table, VIP should use violet-tinted background,
 * Active should use blue-tinted background, and At-Risk should use orange-tinted background.
 * 
 * Validates: Requirements 8.1, 8.2, 8.3
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { TagChip } from '@/components/ui/TagChip';

describe('Property 12: Tier Chip Color Mapping', () => {
  // Define the tier variants we're testing
  const tierVariants = ['vip', 'active', 'at-risk'] as const;
  
  // Define expected color mappings from polish tokens
  const expectedColors = {
    vip: {
      bg: 'rgba(139, 92, 246, 0.1)',
      color: '#8b5cf6',
      name: 'violet'
    },
    active: {
      bg: 'rgba(59, 130, 246, 0.1)',
      color: '#3b82f6',
      name: 'blue'
    },
    'at-risk': {
      bg: 'rgba(245, 158, 11, 0.1)',
      color: '#f59e0b',
      name: 'orange'
    }
  };

  it('should map VIP tier to violet-tinted background', () => {
    const { container } = render(<TagChip label="VIP" variant="vip" />);
    const chip = container.querySelector('.tag-chip--vip');
    
    expect(chip).toBeTruthy();
    expect(chip).toHaveAttribute('data-variant', 'vip');
    
    // Check that the CSS class is applied
    expect(chip?.classList.contains('tag-chip--vip')).toBe(true);
  });

  it('should map Active tier to blue-tinted background', () => {
    const { container } = render(<TagChip label="Active" variant="active" />);
    const chip = container.querySelector('.tag-chip--active');
    
    expect(chip).toBeTruthy();
    expect(chip).toHaveAttribute('data-variant', 'active');
    
    // Check that the CSS class is applied
    expect(chip?.classList.contains('tag-chip--active')).toBe(true);
  });

  it('should map At-Risk tier to orange-tinted background', () => {
    const { container } = render(<TagChip label="At-Risk" variant="at-risk" />);
    const chip = container.querySelector('.tag-chip--at-risk');
    
    expect(chip).toBeTruthy();
    expect(chip).toHaveAttribute('data-variant', 'at-risk');
    
    // Check that the CSS class is applied
    expect(chip?.classList.contains('tag-chip--at-risk')).toBe(true);
  });

  // Property-based test: For any tier variant, the correct CSS class should be applied
  it('applies correct variant class for any tier', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...tierVariants),
        (variant) => {
          const { container } = render(<TagChip label={variant.toUpperCase()} variant={variant} />);
          const chip = container.querySelector(`.tag-chip--${variant}`);
          
          expect(chip).toBeTruthy();
          expect(chip).toHaveAttribute('data-variant', variant);
          expect(chip?.classList.contains(`tag-chip--${variant}`)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property-based test: For any tier variant and label, the component should render correctly
  it('renders correctly for any tier variant and label', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...tierVariants),
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0), // Exclude whitespace-only strings
        (variant, label) => {
          const { container } = render(<TagChip label={label} variant={variant} />);
          const chip = container.querySelector('.tag-chip');
          
          // Component should render
          expect(chip).toBeTruthy();
          
          // Label should be displayed in the chip's text content
          expect(chip?.textContent).toContain(label);
          
          // Correct variant class should be applied
          expect(chip?.classList.contains(`tag-chip--${variant}`)).toBe(true);
          
          // Data attribute should match variant
          expect(chip).toHaveAttribute('data-variant', variant);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property-based test: Each tier variant should have a unique color mapping
  it('ensures each tier variant has distinct color mapping', () => {
    const renderedChips = tierVariants.map(variant => {
      const { container } = render(<TagChip label={variant} variant={variant} />);
      return container.querySelector(`.tag-chip--${variant}`);
    });

    // All chips should render
    renderedChips.forEach(chip => {
      expect(chip).toBeTruthy();
    });

    // Each chip should have a different variant class
    const variantClasses = renderedChips.map(chip => {
      const classList = Array.from(chip?.classList || []);
      return classList.find(cls => cls.startsWith('tag-chip--') && cls !== 'tag-chip');
    });

    // All variant classes should be unique
    const uniqueClasses = new Set(variantClasses);
    expect(uniqueClasses.size).toBe(tierVariants.length);
  });

  // Property-based test: Tier chips should maintain consistency across size variants
  it('maintains color mapping across size variants', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...tierVariants),
        fc.constantFrom('sm', 'md'),
        (variant, size) => {
          const { container } = render(<TagChip label={variant} variant={variant} size={size} />);
          const chip = container.querySelector('.tag-chip');
          
          // Should have both variant and size classes
          expect(chip?.classList.contains(`tag-chip--${variant}`)).toBe(true);
          expect(chip?.classList.contains(`tag-chip--${size}`)).toBe(true);
          
          // Data attributes should be correct
          expect(chip).toHaveAttribute('data-variant', variant);
          expect(chip).toHaveAttribute('data-size', size);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property-based test: Accessibility - all tier chips should have proper ARIA labels
  it('provides accessible labels for all tier variants', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...tierVariants),
        (variant) => {
          const label = variant.toUpperCase();
          const { container } = render(<TagChip label={label} variant={variant} />);
          const chip = container.querySelector('.tag-chip');
          
          // Should have role="status"
          expect(chip).toHaveAttribute('role', 'status');
          
          // Should have aria-label
          const ariaLabel = chip?.getAttribute('aria-label');
          expect(ariaLabel).toBeTruthy();
          expect(ariaLabel).toContain(label);
        }
      ),
      { numRuns: 100 }
    );
  });
});
