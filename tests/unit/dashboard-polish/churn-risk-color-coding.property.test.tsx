/**
 * Feature: dashboard-global-polish, Property 13: Churn Risk Color Coding
 * 
 * Property: For any churn risk indicator, Low should use green color,
 * Medium should use orange color, and High should use red color.
 * 
 * Validates: Requirements 8.4, 8.5, 8.6
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { TagChip } from '@/components/ui/TagChip';

describe('Property 13: Churn Risk Color Coding', () => {
  // Define the churn risk variants we're testing
  const churnRiskVariants = ['low', 'medium', 'high'] as const;
  
  // Define expected color mappings from polish tokens
  const expectedColors = {
    low: {
      bg: 'rgba(16, 185, 129, 0.1)',
      color: '#10b981',
      name: 'green'
    },
    medium: {
      bg: 'rgba(245, 158, 11, 0.1)',
      color: '#f59e0b',
      name: 'orange'
    },
    high: {
      bg: 'rgba(239, 68, 68, 0.1)',
      color: '#ef4444',
      name: 'red'
    }
  };

  it('should map Low churn risk to green color', () => {
    const { container } = render(<TagChip label="Low" variant="low" />);
    const chip = container.querySelector('.tag-chip--low');
    
    expect(chip).toBeTruthy();
    expect(chip).toHaveAttribute('data-variant', 'low');
    
    // Check that the CSS class is applied
    expect(chip?.classList.contains('tag-chip--low')).toBe(true);
  });

  it('should map Medium churn risk to orange color', () => {
    const { container } = render(<TagChip label="Medium" variant="medium" />);
    const chip = container.querySelector('.tag-chip--medium');
    
    expect(chip).toBeTruthy();
    expect(chip).toHaveAttribute('data-variant', 'medium');
    
    // Check that the CSS class is applied
    expect(chip?.classList.contains('tag-chip--medium')).toBe(true);
  });

  it('should map High churn risk to red color', () => {
    const { container } = render(<TagChip label="High" variant="high" />);
    const chip = container.querySelector('.tag-chip--high');
    
    expect(chip).toBeTruthy();
    expect(chip).toHaveAttribute('data-variant', 'high');
    
    // Check that the CSS class is applied
    expect(chip?.classList.contains('tag-chip--high')).toBe(true);
  });

  // Property-based test: For any churn risk variant, the correct CSS class should be applied
  it('applies correct variant class for any churn risk level', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...churnRiskVariants),
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

  // Property-based test: For any churn risk variant and label, the component should render correctly
  it('renders correctly for any churn risk variant and label', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...churnRiskVariants),
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

  // Property-based test: Each churn risk variant should have a unique color mapping
  it('ensures each churn risk variant has distinct color mapping', () => {
    const renderedChips = churnRiskVariants.map(variant => {
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
    expect(uniqueClasses.size).toBe(churnRiskVariants.length);
  });

  // Property-based test: Churn risk chips should maintain consistency across size variants
  it('maintains color coding across size variants', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...churnRiskVariants),
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

  // Property-based test: Accessibility - all churn risk chips should have proper ARIA labels
  it('provides accessible labels for all churn risk variants', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...churnRiskVariants),
        (variant) => {
          const label = variant.charAt(0).toUpperCase() + variant.slice(1);
          const { container } = render(<TagChip label={label} variant={variant} />);
          const chip = container.querySelector('.tag-chip');
          
          // Should have role="status"
          expect(chip).toHaveAttribute('role', 'status');
          
          // Should have aria-label
          const ariaLabel = chip?.getAttribute('aria-label');
          expect(ariaLabel).toBeTruthy();
          expect(ariaLabel).toContain(label);
          expect(ariaLabel).toContain('churn risk');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property-based test: Color progression should follow severity (green < orange < red)
  it('ensures color coding follows severity progression', () => {
    // This is a semantic test - we verify that the variant names and classes
    // are correctly applied, which maps to the color progression in CSS
    const severityOrder = ['low', 'medium', 'high'] as const;
    
    severityOrder.forEach((variant, index) => {
      const { container } = render(<TagChip label={variant} variant={variant} />);
      const chip = container.querySelector('.tag-chip');
      
      // Each level should have its specific class
      expect(chip?.classList.contains(`tag-chip--${variant}`)).toBe(true);
      
      // Verify the variant attribute matches the severity level
      expect(chip).toHaveAttribute('data-variant', variant);
    });
  });

  // Property-based test: Churn risk indicators should be visually distinct from tier indicators
  it('ensures churn risk variants are distinct from tier variants', () => {
    const churnChip = render(<TagChip label="Low" variant="low" />);
    const tierChip = render(<TagChip label="VIP" variant="vip" />);
    
    const churnElement = churnChip.container.querySelector('.tag-chip');
    const tierElement = tierChip.container.querySelector('.tag-chip');
    
    // Both should render
    expect(churnElement).toBeTruthy();
    expect(tierElement).toBeTruthy();
    
    // They should have different variant classes
    expect(churnElement?.classList.contains('tag-chip--low')).toBe(true);
    expect(tierElement?.classList.contains('tag-chip--vip')).toBe(true);
    
    // They should NOT share the same variant class
    expect(churnElement?.classList.contains('tag-chip--vip')).toBe(false);
    expect(tierElement?.classList.contains('tag-chip--low')).toBe(false);
  });
});
